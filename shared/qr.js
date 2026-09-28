/* =====================================================================
   shared/qr.js — מחולל קוד QR קטן (בלי אינטרנט, בלי ספריות)
   ---------------------------------------------------------------------
   פרק 1 — שדה גלואה GF(256) וקוד ריד-סולומון (תיקון שגיאות)
   פרק 2 — טבלת גרסאות 1–10 ברמת תיקון M (עד ~210 תווים — מספיק לכתובת האפליקציה)
   פרק 3 — קידוד הנתונים (מצב בייטים, UTF-8) + ריפוד + חלוקה לבלוקים ושזירה
   פרק 4 — בניית המטריצה: עיני איתור, תזמון, יישור, מידע פורמט/גרסה, הנחת הנתונים בזיגזג
   פרק 5 — 8 מסכות + ניקוד עונשין → בוחרים את הטובה ביותר
   פרק 6 — פלט: QR.matrix(text) / QR.svg(text, {size, dark, light}) / QR.draw(ctx, text, x, y, size)
   ===================================================================== */
(function (root) {
  'use strict';

  /* ---------- פרק 1 — GF(256) + ריד-סולומון ---------- */
  var EXP = new Array(512), LOG = new Array(256);
  (function () { var x = 1; for (var i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; } for (i = 255; i < 512; i++) EXP[i] = EXP[i - 255]; })();
  function mul(a, b) { return a && b ? EXP[LOG[a] + LOG[b]] : 0; }
  /* rsGen(n) — פולינום יוצר עם n מקדמים */
  function rsGen(n) { var g = [1]; for (var i = 0; i < n; i++) { var ng = new Array(g.length + 1).fill(0); for (var j = 0; j < g.length; j++) { ng[j] ^= g[j]; ng[j + 1] ^= mul(g[j], EXP[i]); } g = ng; } return g; }
  /* rsEC(data, n) — n מילות תיקון לבלוק נתונים */
  function rsEC(data, n) {
    var g = rsGen(n), res = data.concat(new Array(n).fill(0));
    for (var i = 0; i < data.length; i++) { var c = res[i]; if (c) for (var j = 0; j < g.length; j++) res[i + j] ^= mul(g[j], c); }
    return res.slice(data.length);
  }

  /* ---------- פרק 2 — גרסאות (רמת M) ---------- */
  /* [מילות תיקון לבלוק, [[מס' בלוקים, מילות נתונים לבלוק], ...]] */
  var EC_M = [null, [10, [[1, 16]]], [16, [[1, 28]]], [26, [[1, 44]]], [18, [[2, 32]]], [24, [[2, 43]]], [16, [[4, 27]]], [18, [[4, 31]]],
              [22, [[2, 38], [2, 39]]], [22, [[3, 36], [2, 37]]], [26, [[4, 43], [1, 44]]]];
  var ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];
  function dataCap(v) { return EC_M[v][1].reduce(function (s, b) { return s + b[0] * b[1]; }, 0); }

  /* ---------- פרק 3 — קידוד ---------- */
  function utf8(s) { var out = [], e = unescape(encodeURIComponent(s)); for (var i = 0; i < e.length; i++) out.push(e.charCodeAt(i)); return out; }
  function encode(text) {
    var bytes = utf8(text), v = 1;
    while (v <= 10 && 4 + (v < 10 ? 8 : 16) + bytes.length * 8 > dataCap(v) * 8) v++;
    if (v > 10) throw new Error('QR: הטקסט ארוך מדי');
    var bits = [];
    function put(val, len) { for (var i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); }
    put(4, 4); put(bytes.length, v < 10 ? 8 : 16); bytes.forEach(function (b) { put(b, 8); });
    var cap = dataCap(v) * 8;
    put(0, Math.min(4, cap - bits.length));
    while (bits.length % 8) bits.push(0);
    var cw = []; for (var i = 0; i < bits.length; i += 8) { var b = 0; for (var j = 0; j < 8; j++) b = (b << 1) | bits[i + j]; cw.push(b); }
    for (var p = 0; cw.length < dataCap(v); p++) cw.push(p % 2 ? 0x11 : 0xEC);
    /* חלוקה לבלוקים, תיקון שגיאות ושזירה */
    var ecn = EC_M[v][0], blocks = [], k = 0;
    EC_M[v][1].forEach(function (g) { for (var n = 0; n < g[0]; n++) { var d = cw.slice(k, k + g[1]); k += g[1]; blocks.push({ d: d, e: rsEC(d, ecn) }); } });
    var out = [], maxD = Math.max.apply(null, blocks.map(function (b) { return b.d.length; }));
    for (i = 0; i < maxD; i++) blocks.forEach(function (b) { if (i < b.d.length) out.push(b.d[i]); });
    for (i = 0; i < ecn; i++) blocks.forEach(function (b) { out.push(b.e[i]); });
    return { v: v, cw: out };
  }

  /* ---------- פרק 4 — מטריצה ---------- */
  function build(v, cw, mask) {
    var N = v * 4 + 17, M = [], F = [];
    for (var r = 0; r < N; r++) { M.push(new Array(N).fill(0)); F.push(new Array(N).fill(false)); }
    function set(r, c, dark) { M[r][c] = dark ? 1 : 0; F[r][c] = true; }
    /* עיני איתור + מפרידים */
    [[0, 0], [0, N - 7], [N - 7, 0]].forEach(function (o) {
      for (var dr = -1; dr <= 7; dr++) for (var dc = -1; dc <= 7; dc++) {
        var rr = o[0] + dr, cc = o[1] + dc; if (rr < 0 || cc < 0 || rr >= N || cc >= N) continue;
        var ring = Math.max(Math.abs(dr - 3), Math.abs(dc - 3));
        set(rr, cc, ring !== 2 && ring !== 4 && dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6);
      }
    });
    /* פסי תזמון */
    for (var i = 8; i < N - 8; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    /* תבניות יישור */
    var A = ALIGN[v];
    A.forEach(function (ar, ai) { A.forEach(function (ac, aj) {
      var L = A.length - 1; if ((ai === 0 && aj === 0) || (ai === 0 && aj === L) || (ai === L && aj === 0)) return;   // לא על עיני האיתור
      for (var dr = -2; dr <= 2; dr++) for (var dc = -2; dc <= 2; dc++) set(ar + dr, ac + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
    }); });
    /* מודול כהה + שמירת מקום למידע פורמט/גרסה */
    set(N - 8, 8, true);
    for (i = 0; i < 9; i++) { if (!F[8][i]) F[8][i] = true; if (!F[i][8]) F[i][8] = true; }
    for (i = 0; i < 8; i++) { F[8][N - 1 - i] = true; F[N - 1 - i][8] = true; }
    if (v >= 7) for (i = 0; i < 6; i++) for (var j = 0; j < 3; j++) { F[i][N - 11 + j] = true; F[N - 11 + j][i] = true; }
    /* הנחת הנתונים בזיגזג (זוגות עמודות מימין לשמאל) */
    var bitIdx = 0, total = cw.length * 8, up = true;
    for (var c = N - 1; c > 0; c -= 2) {
      if (c === 6) c--;
      for (var t = 0; t < N; t++) {
        var row = up ? N - 1 - t : t;
        for (var k = 0; k < 2; k++) {
          var col = c - k; if (F[row][col]) continue;
          var bit = bitIdx < total ? (cw[bitIdx >> 3] >>> (7 - (bitIdx & 7))) & 1 : 0; bitIdx++;
          if (maskFn(mask, row, col)) bit ^= 1;
          M[row][col] = bit;
        }
      }
      up = !up;
    }
    /* מידע פורמט: רמת M (00) + מסכה, BCH(15,5), XOR 0x5412 — שני עותקים */
    var data = (0 << 3) | mask, rem = data;
    for (i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    var fmt = ((data << 10) | rem) ^ 0x5412, gb = function (x, n) { return (x >>> n) & 1; };
    for (i = 0; i <= 5; i++) M[i][8] = gb(fmt, i);
    M[7][8] = gb(fmt, 6); M[8][8] = gb(fmt, 7); M[8][7] = gb(fmt, 8);
    for (i = 9; i < 15; i++) M[8][14 - i] = gb(fmt, i);
    for (i = 0; i < 8; i++) M[8][N - 1 - i] = gb(fmt, i);
    for (i = 8; i < 15; i++) M[N - 15 + i][8] = gb(fmt, i);
    M[N - 8][8] = 1;
    /* מידע גרסה (7 ומעלה): BCH(18,6) */
    if (v >= 7) {
      var vr = v; for (i = 0; i < 12; i++) vr = (vr << 1) ^ ((vr >>> 11) * 0x1F25);
      var vb = (v << 12) | vr;
      for (i = 0; i < 18; i++) { var b = gb(vb, i), a = Math.floor(i / 3), bb = N - 11 + i % 3; M[a][bb] = b; M[bb][a] = b; }
    }
    return M;
  }
  function maskFn(m, r, c) {
    switch (m) {
      case 0: return (r + c) % 2 === 0; case 1: return r % 2 === 0; case 2: return c % 3 === 0; case 3: return (r + c) % 3 === 0;
      case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0; case 5: return (r * c) % 2 + (r * c) % 3 === 0;
      case 6: return ((r * c) % 2 + (r * c) % 3) % 2 === 0; default: return ((r + c) % 2 + (r * c) % 3) % 2 === 0;
    }
  }

  /* ---------- פרק 5 — ניקוד עונשין ---------- */
  function penalty(M) {
    var N = M.length, p = 0, r, c, i;
    for (r = 0; r < N; r++) for (var dir = 0; dir < 2; dir++) {           // רצפים של 5+ באותו צבע
      var run = 1;
      for (c = 1; c < N; c++) { var a = dir ? M[c][r] : M[r][c], b = dir ? M[c - 1][r] : M[r][c - 1]; if (a === b) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1; }
    }
    for (r = 0; r < N - 1; r++) for (c = 0; c < N - 1; c++) { var s = M[r][c] + M[r + 1][c] + M[r][c + 1] + M[r + 1][c + 1]; if (s === 0 || s === 4) p += 3; }
    var pat1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0], pat2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
    for (r = 0; r < N; r++) for (c = 0; c <= N - 11; c++) for (var d = 0; d < 2; d++) {
      var m1 = true, m2 = true;
      for (i = 0; i < 11; i++) { var x = d ? M[c + i][r] : M[r][c + i]; if (x !== pat1[i]) m1 = false; if (x !== pat2[i]) m2 = false; }
      if (m1) p += 40; if (m2) p += 40;
    }
    var dark = 0; for (r = 0; r < N; r++) for (c = 0; c < N; c++) dark += M[r][c];
    p += Math.floor(Math.abs(dark * 100 / (N * N) - 50) / 5) * 10;
    return p;
  }

  /* ---------- פרק 6 — פלט ---------- */
  function matrix(text) {
    var e = encode(text), best = null, bestP = Infinity;
    for (var m = 0; m < 8; m++) { var M = build(e.v, e.cw, m), p = penalty(M); if (p < bestP) { bestP = p; best = M; } }
    return best;
  }
  function svg(text, o) {
    o = o || {}; var M = matrix(text), N = M.length, q = 4, S = N + q * 2, d = '';
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) if (M[r][c]) d += 'M' + (c + q) + ' ' + (r + q) + 'h1v1h-1z';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + S + ' ' + S + '"' + (o.size ? ' width="' + o.size + '" height="' + o.size + '"' : '') + ' shape-rendering="crispEdges"><rect width="' + S + '" height="' + S + '" fill="' + (o.light || '#fff') + '"/><path d="' + d + '" fill="' + (o.dark || '#1b1036') + '"/></svg>';
  }
  function draw(ctx, text, x, y, size, o) {
    o = o || {}; var M = matrix(text), N = M.length, q = 2, cell = size / (N + q * 2);
    ctx.fillStyle = o.light || '#fff'; ctx.fillRect(x, y, size, size); ctx.fillStyle = o.dark || '#1b1036';
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) if (M[r][c]) ctx.fillRect(Math.floor(x + (c + q) * cell), Math.floor(y + (r + q) * cell), Math.ceil(cell), Math.ceil(cell));
  }
  root.QR = { matrix: matrix, svg: svg, draw: draw };
})(typeof window !== 'undefined' ? window : this);
