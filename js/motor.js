/* =====================================================================
   js/motor.js — "סדנת עט": תרגול מוטוריקה עדינה עם Apple Pencil (או אצבע)
   ---------------------------------------------------------------------
   פרק 1 — תרגילים: 12 מסלולים ב-3 פרקים (קווים · צורות · אתגרים). כל מסלול = רשימת נקודות צפופה
           במרחב 1000×640, שנמתח לגודל המסך. "צביעה בתוך הקווים" = תרגיל מיוחד (כיסוי מול גלישה)
   פרק 2 — מצב ושמירה: <pfx>-motor-v1 = { ex: { מזהה: [כוכבים ברוחב רחב, בינוני, צר] }, w: רוחב אחרון, last }
   פרק 3 — ציור המסלול: פס רך ברוחב שנבחר, קו מקווקו באמצע, חיצים, נקודת התחלה עם דמות ויעד
   פרק 4 — מעקב: כל נקודה של העט נבדקת מול המסלול. בתוך הפס = קו בצבע, מחוץ לפס = קו כתום ורטט עדין.
           ההתקדמות רק קדימה ובסדר (אי אפשר "לקפוץ" לסוף). הדמות הולכת אחרי העט. דיוק = % הנקודות בתוך הפס
   פרק 5 — סיום: ⭐ 1–3 לפי דיוק (90% ומעלה = 3), קול, קונפטי, מטבעות, Progress.track('motor:done'),
           תעודה כשכל 12 התרגילים הושלמו (Share.award)
   פרק 6 — ממשק: סיידבר תרגילים עם כוכבים, בורר רוחב, "שוב", "הבא", סגירה. נפתח מ-coloring.html#motor או מכפתור ✍️
   תלויות (אופציונליות): Voice, Sound, KidsUI, HeroRewards, Wallet, Progress, Share
   ===================================================================== */
(function () {
  'use strict';
  var BOY = !!window.ART_BOY, PFX = BOY ? 'eitan' : 'ella', KEY = PFX + '-motor-v1';

  /* ================= פרק 1 — תרגילים ================= */
  var VW = 1000, VH = 640;
  /* dense — הופך רשימת פינות לנקודות צפופות (כל ~6 יחידות) כדי שהמעקב יהיה חלק */
  function dense(pts, closed) {
    if (closed) pts = pts.concat([pts[0]]);
    var out = [pts[0]];
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(d / 6));
      for (var k = 1; k <= n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
    }
    return out;
  }
  function curve(fn, t0, t1, n) { var o = []; for (var i = 0; i <= n; i++) o.push(fn(t0 + (t1 - t0) * i / n)); return dense(o); }
  function starPts() { var p = []; for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 105 : 255; p.push([500 + Math.cos(a) * r, 330 + Math.sin(a) * r]); } return p; }
  var CH = [['lines', 'קווים', '📏'], ['shapes', 'צורות', '🔷'], ['hard', 'אתגרים', '🏆']];
  /* [מזהה, פרק, שם, אימוג'י דמות, אימוג'י יעד, מסלול] */
  var EX = [
    ['line', 'lines', 'קו ישר', '🐱', '🧀', function () { return dense([[130, 320], [870, 320]]); }],
    ['diag', 'lines', 'קו אלכסוני', '🐰', '🥕', function () { return dense([[160, 520], [840, 130]]); }],
    ['wave', 'lines', 'גלים', '🐠', '🐚', function () { return curve(function (t) { return [120 + t * 760, 320 + Math.sin(t * Math.PI * 6) * 120]; }, 0, 1, 180); }],
    ['zig', 'lines', 'זיגזג', '🐶', '🦴', function () { var p = []; for (var i = 0; i <= 6; i++) p.push([120 + i * 127, i % 2 ? 460 : 180]); return dense(p); }],
    ['circle', 'shapes', 'עיגול', '🐝', '🌸', function () { return curve(function (t) { return [500 + Math.sin(t) * 230, 330 - Math.cos(t) * 230]; }, 0, Math.PI * 2, 160); }],
    ['square', 'shapes', 'ריבוע', '🚗', '🏠', function () { return dense([[280, 110], [720, 110], [720, 550], [280, 550]], true); }],
    ['tri', 'shapes', 'משולש', '🐭', '🧀', function () { return dense([[500, 90], [790, 550], [210, 550]], true); }],
    ['star', 'shapes', 'כוכב', '🦄', '🌈', function () { return dense(starPts(), true); }],
    ['loops', 'hard', 'לולאות', '🐞', '🍃', function () { return curve(function (t) { return [160 + 26 * t - 62 * Math.sin(t), 330 - 95 * Math.cos(t)]; }, 0, Math.PI * 8, 320); }],
    ['spiral', 'hard', 'ספירלה', '🐌', '🍓', function () { return curve(function (t) { var r = 18 + 13 * t; return [500 + Math.cos(t) * r * 1.25, 325 + Math.sin(t) * r]; }, 0, Math.PI * 6, 320); }],
    ['maze', 'hard', 'המבוך של החתולה', '🐱', '🐟', function () { return dense([[110, 100], [890, 100], [890, 260], [110, 260], [110, 420], [890, 420], [890, 560], [500, 560]]); }],
    ['color', 'hard', 'צביעה בתוך הקווים', '🖍️', '❤️', null]
  ];
  if (BOY) EX[10][2] = 'המבוך של החתול';
  /* שמות מדוברים לדמות וליעד (הקול לא מקריא אימוג'י) */
  var SAYS = { line: ['החתולה', 'הגבינה'], diag: ['הארנב', 'הגזר'], wave: ['הדג', 'הצדף'], zig: ['הכלבלב', 'העצם'], circle: ['הדבורה', 'הפרח'], square: ['המכונית', 'הבית'],
    tri: ['העכבר', 'הגבינה'], star: ['החד-קרן', 'הקשת'], loops: ['פרת משה רבנו', 'העלה'], spiral: ['החילזון', 'התות'], maze: [BOY ? 'החתול' : 'החתולה', 'הדג'] };
  var WIDTHS = [[110, '🟢 רחב'], [72, '🟡 בינוני'], [44, '🔴 צר']];

  /* ================= פרק 2 — מצב ושמירה ================= */
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  var ST = load(); ST.ex = ST.ex || {}; if (ST.w == null) ST.w = 0;
  function save() { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) {} }
  function starsOf(id) { var a = ST.ex[id] || []; return Math.max(a[0] || 0, a[1] || 0, a[2] || 0); }

  /* ---------- עזרים ---------- */
  function say(t) { try { if (window.Voice) Voice.say(t, { interrupt: true }); } catch (e) {} }
  function snd(n) { try { if (window.Sound && Sound[n]) Sound[n](); } catch (e) {} }
  function tap(p) { try { KidsUI.KidsAudio.tap(p); } catch (e) {} }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  /* ================= פרק 6 — ממשק (בנייה) ================= */
  var css = document.createElement('style');
  css.textContent =
    '#motorOv{position:fixed;inset:0;z-index:80;display:none;grid-template-columns:clamp(170px,19vw,230px) 1fr;gap:12px;padding:max(10px,env(safe-area-inset-top)) 12px 12px;' +
      'background:radial-gradient(60% 60% at 80% 0%,rgba(255,46,147,.35),transparent 70%),linear-gradient(170deg,#1d0b4a,#3a1177 60%,#6a1b8f);font-family:var(--h-font);color:var(--h-ink)}' +
    '#motorOv.show{display:grid}' +
    '.mo-side{display:flex;flex-direction:column;gap:8px;overflow-y:auto;padding:10px;border:4px solid var(--h-ink);border-radius:24px;background:var(--h-paper);box-shadow:0 6px 0 var(--h-ink)}' +
    '.mo-side h3{font:900 16px/1 var(--h-font);margin:6px 2px 0;color:#6a1b8f}' +
    '.mo-ex{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:6px;padding:8px 10px;border:3px solid var(--h-ink);border-radius:16px;background:#fff;box-shadow:0 3px 0 var(--h-ink);font:800 15px/1.1 var(--h-font);text-align:right;cursor:pointer;color:var(--h-ink)}' +
    '.mo-ex b{font-size:22px}.mo-ex small{grid-column:2;font-size:13px;letter-spacing:1px}' +
    '.mo-ex.on{background:linear-gradient(180deg,#fff3b0,#ffc93c);transform:translateX(-4px)}' +
    '.mo-main{display:grid;grid-template-rows:auto 1fr;gap:10px;min-width:0}' +
    '.mo-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding-inline-end:78px}' +   /* מקום לכפתור הבית 🏠 בפינה */
    '.mo-top h2{flex:1;min-width:160px;font:900 clamp(20px,2.6vw,30px)/1 var(--h-font);color:#fff;-webkit-text-stroke:3px var(--h-ink);paint-order:stroke fill;text-shadow:3px 4px 0 var(--h-magenta)}' +
    '.mo-top button{padding:10px 14px;border:3px solid var(--h-ink);border-radius:999px;background:#fff;box-shadow:0 3px 0 var(--h-ink);font:900 15px/1 var(--h-font);color:var(--h-ink);cursor:pointer}' +
    '.mo-top button.on{background:linear-gradient(180deg,#b6ffdc,#3ff2b0)}' +
    '.mo-top .mo-x{background:var(--h-magenta);color:#fff}' +
    '.mo-stage{position:relative;border:4px solid var(--h-ink);border-radius:26px;background:#fffaf0;box-shadow:0 6px 0 var(--h-ink);overflow:hidden;touch-action:none}' +
    '.mo-stage canvas{position:absolute;inset:0;width:100%;height:100%;touch-action:none}' +
    '.mo-hud{position:absolute;left:12px;top:10px;padding:6px 12px;border:3px solid var(--h-ink);border-radius:999px;background:#fff;font:900 16px/1 var(--h-font);pointer-events:none}' +
    '.mo-done{position:absolute;inset:0;display:none;place-items:center;background:rgba(29,11,74,.45)}' +
    '.mo-done.show{display:grid}' +
    '.mo-card{padding:22px 26px;border:5px solid var(--h-ink);border-radius:28px;background:var(--h-paper);box-shadow:0 8px 0 var(--h-ink);text-align:center;animation:h-card-in .4s var(--h-spring) both}' +
    '.mo-card .st{font-size:54px;letter-spacing:6px}.mo-card h3{font:900 28px/1.1 var(--h-font);margin:6px 0}.mo-card p{font:800 17px/1.4 var(--h-font);color:var(--h-text-soft);margin-bottom:14px}' +
    '.mo-card .row{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}' +
    '@media (max-width:760px),(orientation:portrait){#motorOv{grid-template-columns:1fr;grid-template-rows:auto 1fr}.mo-side{flex-direction:row;overflow-x:auto}.mo-side h3{display:none}.mo-ex{flex:0 0 auto}}';
  document.head.appendChild(css);
  var ov = el('div', '', '<aside class="mo-side" id="moSide"></aside><div class="mo-main"><div class="mo-top"><h2 id="moTitle">✍️ סדנת עט</h2><span id="moW"></span>' +
    '<button type="button" id="moAgain">🔁 שוב</button><button type="button" class="mo-x" id="moClose">✖</button></div>' +
    '<div class="mo-stage" id="moStage"><canvas id="moBg"></canvas><canvas id="moInk"></canvas><div class="mo-hud" id="moHud"></div>' +
    '<div class="mo-done" id="moDone"><div class="mo-card"><div class="st" id="moStars"></div><h3 id="moMsg"></h3><p id="moSub"></p><div class="row">' +
    '<button type="button" class="h-btn cyan" id="moRetry">🔁 עוד פעם</button><button type="button" class="h-btn gold" id="moNext">▶ התרגיל הבא</button></div></div></div></div></div>');
  ov.id = 'motorOv';
  function $(id) { return document.getElementById(id); }

  /* ================= פרק 3 — ציור המסלול ================= */
  var bg, ink, bx, ix, W = 0, H = 0, DPR = 1, sc = 1, ox = 0, oy = 0;
  var cur = null;   // { ex, path, prog, inN, outN, done, last, cover }
  function map(p) { return [ox + p[0] * sc, oy + p[1] * sc]; }
  function size() {
    var r = $('moStage').getBoundingClientRect(); W = r.width; H = r.height; DPR = Math.min(window.devicePixelRatio || 1, 2);
    [bg, ink].forEach(function (c) { c.width = Math.round(W * DPR); c.height = Math.round(H * DPR); });
    bx.setTransform(DPR, 0, 0, DPR, 0, 0); ix.setTransform(DPR, 0, 0, DPR, 0, 0);
    sc = Math.min(W / VW, H / VH) * .94; ox = (W - VW * sc) / 2; oy = (H - VH * sc) / 2;
  }
  function half() { return WIDTHS[ST.w][0] * sc / 2; }
  function drawTrack() {
    var ex = cur.ex, c = bx; c.clearRect(0, 0, W, H);
    if (!ex[5]) { drawColorShape(); return; }
    var P = cur.path.map(map);
    function stroke(w, col, dash) { c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = w; c.strokeStyle = col; if (dash) c.setLineDash(dash); c.beginPath(); P.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.stroke(); c.restore(); }
    stroke(half() * 2 + 8, '#1b1036'); stroke(half() * 2, '#e9f7ff'); stroke(half() * 2 - 14, '#d8f0ff');
    stroke(4, '#9fb8d6', [10, 12]);
    /* חיצים שמראים את הכיוון (כל ~26 נקודות) */
    for (var i = 20; i < P.length - 10; i += 26) {
      var a = P[i], b = P[i + 4], an = Math.atan2(b[1] - a[1], b[0] - a[0]);
      c.save(); c.translate(a[0], a[1]); c.rotate(an); c.fillStyle = 'rgba(61,139,255,.55)'; c.beginPath(); c.moveTo(10, 0); c.lineTo(-6, -8); c.lineTo(-6, 8); c.closePath(); c.fill(); c.restore();
    }
    var s = P[0], e = P[P.length - 1];
    c.save(); c.fillStyle = '#3ff2b0'; c.strokeStyle = '#1b1036'; c.lineWidth = 4; c.beginPath(); c.arc(s[0], s[1], Math.max(18, half() * .55), 0, 7); c.fill(); c.stroke();
    c.font = 'bold ' + Math.round(Math.max(26, half() * .9)) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(ex[4], e[0], e[1]); c.restore();
  }
  /* תרגיל הצביעה: לב גדול עם קו מתאר עבה; מחשבים מסכה (פיקסלים בתוך הלב) לבדיקה */
  var mask = null;
  function heartPath(c) { var cx = ox + 500 * sc, cy = oy + 320 * sc, r = 260 * sc; c.beginPath(); c.moveTo(cx, cy + r * .95); c.bezierCurveTo(cx - r * 1.5, cy + r * .1, cx - r * .85, cy - r * 1.05, cx, cy - r * .35); c.bezierCurveTo(cx + r * .85, cy - r * 1.05, cx + r * 1.5, cy + r * .1, cx, cy + r * .95); c.closePath(); }
  function drawColorShape() {
    var c = bx; c.save(); heartPath(c); c.fillStyle = '#ffffff'; c.fill(); c.lineWidth = 8; c.strokeStyle = '#1b1036'; c.stroke(); c.restore();
    var m = document.createElement('canvas'); m.width = Math.round(W / 4); m.height = Math.round(H / 4); var mc = m.getContext('2d'); mc.scale(.25, .25); heartPath(mc); mc.fillStyle = '#000'; mc.fill();
    mask = mc.getImageData(0, 0, m.width, m.height).data;
  }
  function drawBuddy() {
    if (!cur.ex[5]) return;
    var p = map(cur.path[cur.prog]), c = ix;
    c.save(); c.font = Math.round(Math.max(30, half() * 1.05)) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.clearRect(0, 0, 0, 0); c.fillText(cur.ex[3], p[0], p[1]); c.restore();
  }

  /* ================= פרק 4 — מעקב ================= */
  var strokes = [];     // קווי הילד: [{ pts:[x,y,in,f] }]
  function redrawInk() {
    ix.clearRect(0, 0, W, H);
    strokes.forEach(function (s) {
      for (var i = 1; i < s.pts.length; i++) {
        var a = s.pts[i - 1], b = s.pts[i];
        ix.save(); ix.lineCap = 'round'; ix.lineWidth = (cur.ex[5] ? 9 : 26) * b[3]; ix.strokeStyle = cur.ex[5] ? (b[2] ? (BOY ? '#3d7bff' : '#ff2e93') : '#ff9f1c') : (BOY ? '#3d7bff' : '#ff5ca8');
        ix.beginPath(); ix.moveTo(a[0], a[1]); ix.lineTo(b[0], b[1]); ix.stroke(); ix.restore();
      }
    });
    drawBuddy(); hud();
  }
  function hud() {
    if (!cur) return;
    /* בתרגיל הצביעה: חישוב הכיסוי קורא את כל הקנבס — לכל היותר פעם ב-300ms */
    if (!cur.ex[5]) { var now = Date.now(); if (now - (hud.t || 0) < 300) return; hud.t = now; $('moHud').textContent = '🖍️ ' + Math.round(coverage().cover * 100) + '% צבוע'; return; }
    var tot = cur.inN + cur.outN, acc = tot ? Math.round(cur.inN / tot * 100) : 100;
    $('moHud').textContent = '🎯 דיוק ' + acc + '% · ' + Math.round(cur.prog / (cur.path.length - 1) * 100) + '% מהדרך';
  }
  /* track(x, y) — נקודה חדשה: מחפשים את הנקודה הקרובה במסלול בחלון [התקדמות-10, התקדמות+45] בלבד */
  var lastWarn = 0;
  function track(x, y) {
    var P = cur.path, lo = Math.max(0, cur.prog - 10), hi = Math.min(P.length - 1, cur.prog + 45), best = -1, bd = 1e9;
    for (var i = lo; i <= hi; i++) { var q = map(P[i]), d = Math.hypot(q[0] - x, q[1] - y); if (d < bd) { bd = d; best = i; } }
    var inside = bd <= half() + 6;
    if (inside) { cur.inN++; if (best > cur.prog) cur.prog = best; }
    else { cur.outN++; var now = Date.now(); if (now - lastWarn > 900) { lastWarn = now; tap(220); try { if (navigator.vibrate) navigator.vibrate(18); } catch (e) {} } }
    if (cur.prog >= P.length - 3 && !cur.done) finish();
    return inside;
  }
  function coverage() {
    var d = ix.getImageData(0, 0, Math.round(W * DPR), Math.round(H * DPR)).data, mw = Math.round(W / 4), mh = Math.round(H / 4), inPix = 0, inTot = 0, outPix = 0;
    for (var y = 0; y < mh; y++) for (var x = 0; x < mw; x++) {
      var ins = mask[(y * mw + x) * 4 + 3] > 0, px = Math.round(x * 4 * DPR), py = Math.round(y * 4 * DPR), painted = d[(py * Math.round(W * DPR) + px) * 4 + 3] > 0;
      if (ins) { inTot++; if (painted) inPix++; } else if (painted) outPix++;
    }
    return { cover: inTot ? inPix / inTot : 0, spill: (inPix + outPix) ? outPix / (inPix + outPix) : 0 };
  }
  var penSeen = false, active = null;
  function pos(e) { var r = ink.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top, 0, e.pointerType === 'pen' ? .5 + (e.pressure || .5) : 1]; }
  function bindInk() {
    ink.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'pen') penSeen = true;
      if (penSeen && e.pointerType === 'touch') return;          // כף היד נחה על המסך — לא מציירת
      if (!cur || cur.done || active !== null) return;
      active = e.pointerId; try { ink.setPointerCapture(e.pointerId); } catch (x) {}
      var p = pos(e); if (cur.ex[5]) p[2] = track(p[0], p[1]); strokes.push({ pts: [p] }); redrawInk();
    });
    ink.addEventListener('pointermove', function (e) {
      if (e.pointerId !== active || !cur || cur.done) return;
      var list = e.getCoalescedEvents ? e.getCoalescedEvents() : []; if (!list.length) list = [e];
      var s = strokes[strokes.length - 1];
      list.forEach(function (ev) { var p = pos(ev), l = s.pts[s.pts.length - 1]; if (Math.hypot(p[0] - l[0], p[1] - l[1]) < 3) return; if (cur.ex[5]) p[2] = track(p[0], p[1]); s.pts.push(p); });
      redrawInk();
    });
    ['pointerup', 'pointercancel'].forEach(function (n) { ink.addEventListener(n, function (e) {
      if (e.pointerId !== active) return; active = null;
      if (cur && !cur.ex[5] && !cur.done) { var cv = coverage(); if (cv.cover > .8) finish(cv); }
    }); });
  }

  /* ================= פרק 5 — סיום ================= */
  function finish(cv) {
    cur.done = true;
    var acc, stars;
    if (!cur.ex[5]) { cv = cv || coverage(); acc = Math.max(0, cv.cover - cv.spill); stars = cv.cover > .8 && cv.spill < .08 ? 3 : cv.spill < .2 ? 2 : 1; }
    else { var tot = cur.inN + cur.outN; acc = tot ? cur.inN / tot : 1; stars = acc >= .9 ? 3 : acc >= .75 ? 2 : 1; }
    var a = ST.ex[cur.ex[0]] || [0, 0, 0]; a[ST.w] = Math.max(a[ST.w] || 0, stars); ST.ex[cur.ex[0]] = a; ST.last = cur.ex[0]; save();
    try { if (window.Progress) Progress.track('motor:done'); } catch (e) {}
    try { if (window.Wallet) Wallet.add(stars); } catch (e) {}
    try { if (window.HeroRewards) { HeroRewards.confetti(); HeroRewards.award(stars, $('moStage'), { word: stars === 3 ? 'מושלם!' : 'יפה!' }); } } catch (e) {}
    snd(stars === 3 ? 'unlock' : 'ding');
    var pct = Math.round(acc * 100);
    $('moStars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    $('moMsg').textContent = stars === 3 ? 'וואו! יד של אלופים!' : stars === 2 ? 'יפה מאוד!' : 'כל הכבוד על הניסיון!';
    $('moSub').textContent = cur.ex[5] ? 'דיוק ' + pct + '%. ' + (stars < 3 ? 'לאט לאט ובתוך השביל — ומגיעים ל-3 כוכבים.' : ST.w < 2 ? 'רוצים אתגר? נסו שביל צר יותר!' : 'שביל צר ו-3 כוכבים — מדהים!') :
      'צבעת ' + Math.round(cv.cover * 100) + '% מהלב, ' + (cv.spill < .08 ? 'כמעט בלי לצאת מהקווים!' : 'נסו לצבוע לאט ליד הקו.');
    say($('moMsg').textContent + ' ' + $('moSub').textContent);
    $('moDone').classList.add('show'); buildSide();
    /* תעודה: כל 12 התרגילים עם כוכב אחד לפחות */
    if (window.Share && EX.every(function (x) { return starsOf(x[0]) > 0; }) && !ST.cert) {
      ST.cert = 1; save();
      setTimeout(function () { try { Share.award({ key: 'motor:all', line: (BOY ? 'השלים' : 'השלימה') + ' את כל סדנת העט', ico: '✍️' }); } catch (e) {} }, 1600);
    }
  }

  /* ================= פרק 6 — ממשק ================= */
  function buildSide() {
    var side = $('moSide'); side.innerHTML = '';
    CH.forEach(function (ch) {
      side.appendChild(el('h3', '', ch[2] + ' ' + ch[1]));
      EX.filter(function (x) { return x[1] === ch[0]; }).forEach(function (x) {
        var s = starsOf(x[0]), b = el('button', 'mo-ex' + (cur && cur.ex === x ? ' on' : ''), '<b>' + x[3] + '</b>' + x[2] + '<small>' + '⭐'.repeat(s) + '☆'.repeat(3 - s) + '</small>');
        b.type = 'button'; b.addEventListener('click', function () { tap(640); start(x); }); side.appendChild(b);
      });
    });
  }
  function buildW() {
    var box = $('moW'); box.innerHTML = '';
    WIDTHS.forEach(function (w, i) {
      var b = el('button', ST.w === i ? 'on' : '', w[1]); b.type = 'button';
      b.addEventListener('click', function () { ST.w = i; save(); tap(560 + i * 80); say(w[1].slice(3)); buildW(); if (cur) start(cur.ex); });
      box.appendChild(b);
    });
  }
  function start(ex) {
    size(); strokes = []; $('moDone').classList.remove('show');
    cur = { ex: ex, path: ex[5] ? ex[5]() : null, prog: 0, inN: 0, outN: 0, done: false };
    $('moTitle').textContent = '✍️ ' + ex[2];
    drawTrack(); redrawInk(); buildSide();
    say(ex[5] ? 'מתחילים מהנקודה הירוקה, ומובילים את ' + SAYS[ex[0]][0] + ' אל ' + SAYS[ex[0]][1] + ' בלי לצאת מהשביל. לאט וברוגע!' : 'צובעים את הלב כולו, ומנסים לא לצאת מהקווים.');
  }
  function next() { var i = EX.indexOf(cur.ex); start(EX[(i + 1) % EX.length]); }
  function open() {
    if (!ov.parentNode) {
      document.body.appendChild(ov); bg = $('moBg'); ink = $('moInk'); bx = bg.getContext('2d'); ix = ink.getContext('2d', { willReadFrequently: true }); bindInk();
      $('moClose').addEventListener('click', close); $('moAgain').addEventListener('click', function () { tap(); start(cur.ex); });
      $('moRetry').addEventListener('click', function () { tap(); start(cur.ex); }); $('moNext').addEventListener('click', function () { tap(); next(); });
      window.addEventListener('resize', function () { if (ov.classList.contains('show') && cur) setTimeout(function () { start(cur.ex); }, 200); });
    }
    ov.classList.add('show'); buildW();
    var first = EX.filter(function (x) { return x[0] === ST.last; })[0] || EX.filter(function (x) { return !starsOf(x[0]); })[0] || EX[0];
    setTimeout(function () { start(first); }, 30);
  }
  function close() { ov.classList.remove('show'); tap(); if (location.hash === '#motor') history.replaceState(null, '', location.pathname); }

  window.Motor = { open: open, close: close, EX: EX.map(function (x) { return x[0]; }), stars: starsOf, state: function () { return { ST: ST, cur: cur }; } };
  window.addEventListener('DOMContentLoaded', function () {
    var b = document.getElementById('btnMotor'); if (b) b.addEventListener('click', function () { tap(); say('סדנת עט'); open(); });
    if (location.hash === '#motor') setTimeout(open, 300);
  });
})();
