/* =====================================================================
   js/farm-duo.js — 👥 "חווה לשניים": 4 משחקי טיפול בחווה לשני שחקנים על אייפד אחד (שלב 18)
   ---------------------------------------------------------------------
   מה הקובץ עושה: שכבה מעל החווה (#duoOv) עם קנבס מפוצל: שחקן 1 בחצי השמאלי (טורקיז), שחקן 2 בחצי הימני (ורוד).
   כל משחק נמשך 45 שניות, סופר נקודות לכל שחקן ו"יחד", והפרס (ביצים / חלב / צמר / גזר) נכנס לסל של החווה.
   בתחילת כל משחק לומדים את המילה באנגלית (LearnFX.word), ובמהלכו הספירה נשמעת בקול.

   פרק 1 — הגדרות: 4 המשחקים, צבעי השחקנים, משך
   פרק 2 — שכבה: קנבס, מגע רב-אצבעות (pointerId → שחקן לפי צד), מסך בחירה, ספירה לאחור, תוצאות
   פרק 3 — 🥛 חליבה בצמד: טבעת קצב מתכווצת אל העטין; נוגעים כשהטבעת פוגעת — הדלי מתמלא
   פרק 4 — 🥚 מרוץ ביצים: ביצים צצות בכל חצי לכמה שניות; נוגעים לאסוף; ביצת זהב = 3
   פרק 5 — 🐑 גזיזה: כבשה בכל חצי מכוסה פקעות צמר; מחליקים עליהן כדי לגזוז; כבשה שלמה = בונוס
   פרק 6 — 💧 השקיה: 4 ערוגות בכל חצי עם מד צמא; נוגעים בערוגה הצמאה בזמן; צמח שנבל נח 2 שניות
   פרק 7 — סיום: ניקוד, מנצח/תיקו, פרסים לסל, הישג farm:duo, Progress
   תלויות: farm.js (window.FarmGame.state / .save / .inv), shared/learn-fx.js, js/audio.js, kids-ui, hero-rewards
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- פרק 1 — הגדרות ---------- */
  var ROUND = 45, INK = '#101e36', FONT = '"Rubik","Varela Round","Heebo",sans-serif';
  var PCOL = ['#29e0ff', '#ff5ca8'], PNAME = ['שחקן 1', 'שחקן 2'];
  // GAMES: id, אימוג'י, שם, הסבר, מילה באנגלית, פירוש, פרס (מפתח בסל + כמה נקודות לכל יחידה)
  var GAMES = [
    { id: 'milk', ico: '🥛', name: 'חליבה בצמד', how: 'נוגעים בעטין בדיוק כשהטבעת מגיעה אליו — בקצב!', en: 'milk', he: 'חלב', inv: 'milk', per: 8 },
    { id: 'eggs', ico: '🥚', name: 'מרוץ הביצים', how: 'ביצים צצות בלול — מי אוסף יותר? ביצת זהב = 3!', en: 'egg', he: 'ביצה', inv: 'egg', per: 4 },
    { id: 'wool', ico: '🐑', name: 'גזיזה לשניים', how: 'מחליקים עם האצבע על הצמר כדי לגזוז. כבשה שלמה = בונוס!', en: 'wool', he: 'צמר', inv: 'wool', per: 10 },
    { id: 'water', ico: '💧', name: 'השקיה מהירה', how: 'נוגעים בערוגה הכי צמאה. צמח שנבל צריך רגע לנוח', en: 'water', he: 'מים', inv: 'carrot', per: 12 }
  ];

  /* ---------- עזרים ---------- */
  function $(id) { return document.getElementById(id); }
  function say(t) { try { Voice.say(t, { interrupt: true }); } catch (e) {} }
  function snd(n) { try { if (window.Sound && Sound[n]) Sound[n](); } catch (e) {} }
  function tap(p) { try { KidsUI.KidsAudio.tap(p); } catch (e) {} }
  function track(ev) { try { if (window.Progress) Progress.track(ev); } catch (e) {} }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  var EMO = {};
  function emo(e) { if (EMO[e]) return EMO[e]; var c = document.createElement('canvas'); c.width = c.height = 160; var x = c.getContext('2d'); x.font = '128px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e, 80, 90); return (EMO[e] = c); }
  function drawEmo(c, e, x, y, sz, a) { if (a != null) c.globalAlpha = a; c.drawImage(emo(e), x - sz / 2, y - sz / 2, sz, sz); c.globalAlpha = 1; }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function label(c, txt, x, y, size, col) { c.font = '900 ' + size + 'px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = Math.max(4, size * .18); c.strokeStyle = INK; c.strokeText(txt, x, y); c.fillStyle = col || '#fff'; c.fillText(txt, x, y); }

  /* ---------- פרק 2 — שכבה ---------- */
  var cv, ctx, W = 0, H = 0, DPR = 1, half = 0, game = null, D = null, last = 0, raf = 0;
  function resize() { if (!cv) return; DPR = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; half = W / 2; cv.width = W * DPR; cv.height = H * DPR; cv.style.width = W + 'px'; cv.style.height = H + 'px'; }
  window.addEventListener('resize', resize);
  // side(x) — איזה שחקן נגע: 0 = שמאל, 1 = ימין
  function side(x) { return x < half ? 0 : 1; }
  var PT = {};
  function onDown(e) { if (!D || D.phase !== 'play') return; var p = side(e.clientX); PT[e.pointerId] = { p: p, x: e.clientX, y: e.clientY }; if (D.g.down) D.g.down(p, e.clientX, e.clientY); }
  function onMove(e) { var q = PT[e.pointerId]; if (!q || !D || D.phase !== 'play') return; if (D.g.move) D.g.move(q.p, e.clientX, e.clientY, q.x, q.y); q.x = e.clientX; q.y = e.clientY; }
  function onUp(e) { delete PT[e.pointerId]; }
  function openChooser() {
    var ov = $('duoOv'); ov.classList.add('show'); $('duoMenu').style.display = 'grid'; $('duoEnd').style.display = 'none'; cv.style.display = 'none';
    say('חווה לשניים! בוחרים משחק: חליבה, ביצים, גזיזה או השקיה. כל אחד בצד שלו');
  }
  function close() { stop(); $('duoOv').classList.remove('show'); try { TapFX.set('full'); } catch (e) {} }
  function stop() { cancelAnimationFrame(raf); D = null; PT = {}; }
  function start(id) {
    game = GAMES.filter(function (g) { return g.id === id; })[0]; if (!game) return;
    $('duoMenu').style.display = 'none'; $('duoEnd').style.display = 'none'; cv.style.display = 'block'; resize();
    D = { phase: 'count', t: 0, time: 0, score: [0, 0], g: MAKERS[id](), fx: [], pops: [] };
    try { LearnFX.word(game.en, game.he, game.ico, { tag: '🇬🇧 ' + game.name, pos: 'top' }); } catch (e) { say(game.name); }
    say(game.how); snd('ding'); try { TapFX.set('light'); } catch (e) {}
    last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  }
  function loop(now) {
    raf = requestAnimationFrame(loop); var dt = Math.min(.05, (now - last) / 1000); last = now; if (!D) return;
    D.t += dt;
    if (D.phase === 'count') { if (D.t > 3.6) { D.phase = 'play'; D.t = 0; say('צא!'); } }
    else if (D.phase === 'play') { D.time += dt; D.g.update(dt); if (D.time >= ROUND) finish(); }
    D.fx.forEach(function (f) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 700 * dt; f.life -= dt; }); D.fx = D.fx.filter(function (f) { return f.life > 0; });
    D.pops.forEach(function (p) { p.t += dt; }); D.pops = D.pops.filter(function (p) { return p.t < 1.2; });
    render();
  }
  function burst(x, y, e, n) { for (var i = 0; i < (n || 6); i++) D.fx.push({ x: x, y: y, vx: rnd(-220, 220), vy: rnd(-420, -120), e: e, life: rnd(.5, .9) }); }
  function pop(p, txt) { D.pops.push({ p: p, txt: txt, t: 0 }); }
  function score(p, n, x, y, e) { D.score[p] += n; if (x != null) burst(x, y, e || '⭐', 5); snd('sparkle'); var tot = D.score[0] + D.score[1]; if (tot % 10 === 0 && tot > 0) { try { LearnFX.count(Math.min(10, tot / 10), {}); } catch (err) {} }   /* כל 10 נקודות — ספירה בקול: one, two, three… */ }
  function render() {
    var c = ctx; c.setTransform(DPR, 0, 0, DPR, 0, 0);
    for (var p = 0; p < 2; p++) {
      c.save(); c.beginPath(); c.rect(p * half, 0, half, H); c.clip(); c.translate(p * half, 0);
      D.g.draw(c, p, half, H);
      /* לוח ניקוד של החצי */
      var txt = PNAME[p] + '  ' + game.ico + ' ' + D.score[p]; c.font = '900 ' + Math.round(Math.min(half, H) * .055) + 'px ' + FONT; var w = c.measureText(txt).width + 40, y = Math.max(50, H * .07);
      c.fillStyle = INK; rr(c, half / 2 - w / 2 + 5, y - 24 + 6, w, 46, 12); c.fill(); c.fillStyle = PCOL[p]; rr(c, half / 2 - w / 2, y - 24, w, 46, 12); c.fill(); c.lineWidth = 4; c.strokeStyle = INK; c.stroke();
      c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle'; c.direction = 'rtl'; c.fillText(txt, half / 2, y);
      D.pops.filter(function (q) { return q.p === p; }).forEach(function (q, i) { c.globalAlpha = 1 - q.t / 1.2; label(c, q.txt, half / 2, H * .3 - q.t * 50 - i * 8, Math.round(Math.min(half, H) * .06), '#ffe14a'); c.globalAlpha = 1; });
      c.restore();
    }
    D.fx.forEach(function (f) { drawEmo(c, f.e, f.x, f.y, 34, Math.min(1, f.life * 2)); });
    /* קו אמצע ופס זמן */
    c.fillStyle = INK; c.fillRect(half - 4, 0, 8, H);
    var tw = W * .5, tx = W / 2 - tw / 2, ty = H - Math.max(18, H * .03) - 16; c.fillStyle = INK; rr(c, tx - 3, ty - 3, tw + 6, 22, 11); c.fill(); c.fillStyle = '#2a1a4f'; rr(c, tx, ty, tw, 16, 8); c.fill(); c.fillStyle = '#ffc93c'; rr(c, tx, ty, tw * Math.max(0, 1 - D.time / ROUND), 16, 8); c.fill();
    if (D.phase === 'count') { var n = Math.ceil(3.2 - D.t), t = n > 0 ? String(n) : 'צא!'; c.fillStyle = 'rgba(16,30,54,.35)'; c.fillRect(0, 0, W, H); label(c, t, W / 2, H / 2, Math.round(Math.min(W, H) * .32), '#ffe14a'); }
  }

  /* ---------- פרק 3 — 🥛 חליבה בצמד ----------
     טבעת מתכווצת מרדיוס גדול אל רדיוס העטין בקצב (period). נגיעה בחצי כשהטבעת בטווח (±18%) = חלב; מוקדם/מאוחר = "כמעט" */
  function mkMilk() {
    var period = 1.1, ph = [0, .5], hits = [0, 0], miss = [0, 0], fill = [0, 0];
    function ring(p) { return (ph[p] % 1); }   // 0 → 1 = מרדיוס גדול לקטן
    return {
      update: function (dt) { for (var p = 0; p < 2; p++) ph[p] += dt / period; },
      down: function (p, x, y) {
        var r = ring(p), ok = r > .78 && r < 1 || r < .08;
        if (ok) { hits[p]++; fill[p] = Math.min(1, fill[p] + .07); score(p, 1, x, y, '🥛'); if (hits[p] % 5 === 0) { pop(p, 'מעולה! ' + hits[p]); say('מו!'); } }
        else { miss[p]++; pop(p, r < .5 ? 'מוקדם…' : 'כמעט!'); tap(240); }
      },
      draw: function (c, p, w, h) {
        c.fillStyle = '#ffe9c8'; c.fillRect(0, 0, w, h); c.fillStyle = '#c98b4f'; c.fillRect(0, h * .62, w, h);
        for (var i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#d9a06a' : '#c98b4f'; c.fillRect(i * w / 6, h * .62, w / 6, h); }
        drawEmo(c, '🐄', w / 2, h * .36, Math.min(w, h) * .62);
        var ux = w / 2 + w * .06, uy = h * .58, R = Math.min(w, h) * .09;
        /* עטין */
        c.fillStyle = '#ffb3d9'; c.beginPath(); c.arc(ux, uy, R, 0, 7); c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke();
        /* טבעת הקצב */
        var r = ring(p), rad = R + (1 - r) * Math.min(w, h) * .32; c.lineWidth = 8; c.strokeStyle = r > .78 ? '#3ff2b0' : PCOL[p]; c.beginPath(); c.arc(ux, uy, rad, 0, 7); c.stroke();
        /* דלי */
        var bx = w * .22, by = h * .8, bw = w * .16, bh = h * .18; c.fillStyle = '#c9d2de'; rr(c, bx, by - bh, bw, bh, 10); c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke(); c.fillStyle = '#fff'; rr(c, bx + 6, by - bh * fill[p] - 2, bw - 12, bh * fill[p], 6); c.fill();
        label(c, '🥛 ' + hits[p], bx + bw / 2, by - bh - 24, 22);
        label(c, 'נוגעים כשהטבעת ירוקה', w / 2, h * .92, Math.round(Math.min(w, h) * .045));
      }
    };
  }

  /* ---------- פרק 4 — 🥚 מרוץ ביצים ---------- */
  function mkEggs() {
    var eggs = [[], []], spawn = [0, 0], chick = [0, 0];
    return {
      update: function (dt) {
        for (var p = 0; p < 2; p++) {
          spawn[p] -= dt;
          if (spawn[p] <= 0 && eggs[p].length < 4) { spawn[p] = rnd(.4, 1.1); eggs[p].push({ x: rnd(.12, .88), y: rnd(.28, .85), life: rnd(2.2, 3.2), gold: Math.random() < .12, t: 0 }); }
          eggs[p].forEach(function (e) { e.life -= dt; e.t += dt; }); eggs[p] = eggs[p].filter(function (e) { return e.life > 0; });
        }
      },
      down: function (p, x, y) {
        var lx = x - p * half, hit = null;
        eggs[p].forEach(function (e) { if (!hit && Math.hypot(lx - e.x * half, y - e.y * H) < Math.min(half, H) * .09) hit = e; });
        if (hit) { eggs[p].splice(eggs[p].indexOf(hit), 1); score(p, hit.gold ? 3 : 1, x, y, hit.gold ? '✨' : '🥚'); if (hit.gold) { pop(p, 'ביצת זהב! +3'); snd('cha_ching'); chick[p]++; } snd('pop'); }
        else { burst(x, y, '🌾', 2); }
      },
      draw: function (c, p, w, h) {
        c.fillStyle = '#fff3dc'; c.fillRect(0, 0, w, h); c.fillStyle = '#e8c070'; c.fillRect(0, h * .22, w, h);
        for (var i = 0; i < 14; i++) { c.strokeStyle = '#d9a640'; c.lineWidth = 3; c.beginPath(); c.moveTo(i * w / 14, h * .22); c.lineTo(i * w / 14 + 20, h); c.stroke(); }
        drawEmo(c, '🐔', w * .5, h * .14, Math.min(w, h) * .2); for (var k = 0; k < chick[p]; k++) drawEmo(c, '🐣', w * .1 + k * 40, h * .14, 36);
        eggs[p].forEach(function (e) { var s = Math.min(1, e.t * 4) * (e.life < .5 ? e.life * 2 : 1), sz = Math.min(w, h) * .16 * s; if (e.gold) { c.fillStyle = 'rgba(255,217,60,.45)'; c.beginPath(); c.arc(e.x * w, e.y * h, sz * .7, 0, 7); c.fill(); } drawEmo(c, e.gold ? '🥚' : '🥚', e.x * w, e.y * h, sz); if (e.gold) drawEmo(c, '✨', e.x * w + sz * .35, e.y * h - sz * .35, sz * .5); });
      }
    };
  }

  /* ---------- פרק 5 — 🐑 גזיזה לשניים ---------- */
  function mkWool() {
    var puffs = [[], []], done = [0, 0];
    function newSheep(p) { puffs[p] = []; for (var i = 0; i < 28; i++) { var a = i / 28 * Math.PI * 2, r = .55 + (i % 3) * .18; puffs[p].push({ x: .5 + Math.cos(a) * .22 * r, y: .5 + Math.sin(a) * .18 * r, on: true }); } }
    newSheep(0); newSheep(1);
    return {
      update: function () {},
      down: function (p, x, y) { this.move(p, x, y, x, y); },
      move: function (p, x, y) {
        var lx = x - p * half, R = Math.min(half, H) * .07, got = 0;
        puffs[p].forEach(function (q) { if (q.on && Math.hypot(lx - q.x * half, y - q.y * H) < R) { q.on = false; got++; } });
        if (got) { score(p, got, x, y, '🧶'); snd('chop'); if (!puffs[p].some(function (q) { return q.on; })) { done[p]++; score(p, 5); pop(p, 'כבשה שלמה! +5'); setTimeout(function () { newSheep(p); }, 600); } }
      },
      draw: function (c, p, w, h) {
        c.fillStyle = '#d6f5c8'; c.fillRect(0, 0, w, h); c.fillStyle = '#8ee07a'; c.fillRect(0, h * .72, w, h);
        /* גוף הכבשה הגזוזה */
        c.fillStyle = '#f3dfc8'; c.beginPath(); c.ellipse(w * .5, h * .5, w * .25, h * .2, 0, 0, 7); c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke();
        [[.34, .72], [.44, .74], [.56, .74], [.66, .72]].forEach(function (l) { c.fillStyle = INK; rr(c, w * l[0] - 8, h * l[1] - 20, 16, h * .12, 6); c.fill(); });
        drawEmo(c, '🐑', w * .5 + w * .3, h * .46, Math.min(w, h) * .22);
        puffs[p].forEach(function (q) { if (!q.on) return; c.fillStyle = '#fff'; c.beginPath(); c.arc(q.x * w, q.y * h, Math.min(w, h) * .055, 0, 7); c.fill(); c.lineWidth = 3; c.strokeStyle = '#c9c9d9'; c.stroke(); });
        label(c, '✂️ ' + done[p] + ' כבשים', w * .5, h * .9, Math.round(Math.min(w, h) * .05));
      }
    };
  }

  /* ---------- פרק 6 — 💧 השקיה מהירה ---------- */
  function mkWater() {
    var plots = [[], []];
    for (var p = 0; p < 2; p++) for (var i = 0; i < 4; i++) plots[p].push({ v: rnd(.4, .9), rate: rnd(.08, .16), wilt: 0, crop: ['🥕', '🍅', '🌻', '🍓'][i] });
    return {
      update: function (dt) { plots.forEach(function (ps) { ps.forEach(function (q) { if (q.wilt > 0) { q.wilt -= dt; if (q.wilt <= 0) q.v = .6; return; } q.v -= q.rate * dt; if (q.v <= 0) { q.v = 0; q.wilt = 2; snd('sad'); } }); }); },
      down: function (p, x, y) {
        var lx = x - p * half, i = Math.floor(lx / (half / 4)), q = plots[p][i]; if (!q) return;
        if (q.wilt > 0) { pop(p, 'הצמח נח…'); tap(240); return; }
        var bonus = q.v < .3 ? 2 : 1; q.v = 1; score(p, bonus, x, y, '💧'); snd('bubble'); if (bonus > 1) pop(p, 'בדיוק בזמן! +2');
      },
      draw: function (c, p, w, h) {
        c.fillStyle = '#bfe8ff'; c.fillRect(0, 0, w, h); c.fillStyle = '#8a5a32'; c.fillRect(0, h * .55, w, h);
        plots[p].forEach(function (q, i) {
          var x = (i + .5) * w / 4, y = h * .62; c.fillStyle = '#6b4423'; c.beginPath(); c.ellipse(x, y + 20, w * .1, 16, 0, 0, 7); c.fill();
          drawEmo(c, q.wilt > 0 ? '🥀' : q.crop, x, y - 30 - q.v * 30, Math.min(w, h) * (.16 + q.v * .08), q.wilt > 0 ? .6 : 1);
          /* מד צמא */
          c.fillStyle = INK; rr(c, x - 36, y + 46, 72, 18, 9); c.fill(); c.fillStyle = q.v < .3 ? '#ff3b3b' : '#29e0ff'; rr(c, x - 33, y + 49, 66 * q.v, 12, 6); c.fill();
          if (q.v < .3 && q.wilt <= 0) drawEmo(c, '❗', x + 34, y - 60, 30, .6 + .4 * Math.sin(D.t * 10));
        });
        drawEmo(c, '🚿', w * .5, h * .18, Math.min(w, h) * .18);
      }
    };
  }
  var MAKERS = { milk: mkMilk, eggs: mkEggs, wool: mkWool, water: mkWater };

  /* ---------- פרק 7 — סיום ---------- */
  function finish() {
    D.phase = 'end'; var a = D.score[0], b = D.score[1], tot = a + b, win = a === b ? 0 : a > b ? 1 : 2, units = Math.floor(tot / game.per);
    try { var ST = FarmGame.state(); ST.inv[game.inv] = (ST.inv[game.inv] || 0) + units; FarmGame.save(); FarmGame.inv(); } catch (e) {}
    try { Wallet.add(2 + (units > 0 ? 1 : 0)); } catch (e) {}
    try { Achievements.hit('farm:duo'); } catch (e) {}
    track('farm:act'); track('farm:duo');
    $('duoEndT').textContent = win ? '🏆 ' + PNAME[win - 1] + ' מנצח!' : '🤝 תיקו! שניכם אלופים';
    $('duoEndS').innerHTML = '<span style="color:' + PCOL[0] + '">' + PNAME[0] + ': ' + a + '</span> · <span style="color:' + PCOL[1] + '">' + PNAME[1] + ': ' + b + '</span> · יחד: ' + tot;
    $('duoEndR').textContent = units ? 'לסל של החווה: ' + units + ' ' + { milk: '🥛 חלב', egg: '🥚 ביצים', wool: '🧶 צמר', carrot: '🥕 גזרים' }[game.inv] + ' + 🪙 3' : 'עוד קצת ויהיה פרס לסל! + 🪙 2';
    $('duoEnd').style.display = 'grid'; try { HeroRewards.confetti(); TapFX.set('full'); } catch (e) {} snd('happy');
    say((win ? PNAME[win - 1] + ' מנצח! ' : 'תיקו! ') + a + ' נגד ' + b + '. יחד ' + tot + '!');
    setTimeout(function () { cancelAnimationFrame(raf); cv.style.display = 'none'; }, 400);
  }

  /* ---------- אתחול ---------- */
  function boot() {
    cv = $('duoCv'); if (!cv) return; ctx = cv.getContext('2d'); resize();
    cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp); window.addEventListener('pointercancel', onUp);
    var menu = $('duoMenu'); menu.innerHTML = GAMES.map(function (g) { return '<button type="button" class="duo-g" data-g="' + g.id + '"><b>' + g.ico + '</b><span>' + g.name + '</span><small>' + g.how + '</small></button>'; }).join('') + '<button type="button" class="h-btn violet duo-x" data-x="1">✖ חזרה לחווה</button>';
    menu.addEventListener('click', function (e) { var b = e.target.closest('[data-g]'); if (b) { tap(700); start(b.dataset.g); return; } if (e.target.closest('[data-x]')) { tap(); close(); } });
    $('duoAgain').addEventListener('click', function () { tap(); start(game.id); });
    $('duoMenuBtn').addEventListener('click', function () { tap(); openChooser(); });
    $('duoBtn').addEventListener('click', function () { tap(); openChooser(); });
  }
  window.FarmDuo = { open: openChooser, start: start, close: close, state: function () { return D; }, finish: finish, GAMES: GAMES };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
