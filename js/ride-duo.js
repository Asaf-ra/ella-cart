/* =====================================================================
   js/ride-duo.js — 👥 "מרוץ סוסים לשניים": שני סוסים זה מעל זה, מבט מהצד (שלב 19)
   ---------------------------------------------------------------------
   מה הקובץ עושה: כפתור "👥 מרוץ לשניים" במסך הפתיחה של הרכיבה פותח שכבה (#rduoOv) עם קנבס מחולק לשני
   מסלולים: שחקן 2 למעלה (ורוד), שחקן 1 למטה (טורקיז). הסוס של שחקן 1 הוא הסוס מהארון (Horse.svg), ושל שחקן 2
   סוס לבן עם רעמה בלונדינית. נוגעים במסלול שלך שוב ושוב כדי לדהור (כל נגיעה מוסיפה מהירות שדועכת),
   ומחליקים למעלה כדי לקפוץ מעל גדר. פגיעה בגדר = מעידה (עוצרים לשנייה). מי שמגיע ראשון לקו הסיום מנצח.
   למידה: "Go!", "Jump!", ספירת הגדרות באנגלית, ובסוף "first" / "second".

   פרק 1 — הגדרות: אורך המסלול, גדרות, מהירות
   פרק 2 — שכבה: קנבס, מגע לפי מסלול (pointerId → שחקן), ספירה לאחור, סיום
   פרק 3 — פיזיקה: דהירה (דעיכה), קפיצה (פרבולה), גדרות, מעידה, סיום
   פרק 4 — ציור: שמיים, גבעות בפרלקסה, דשא, מסלול, גדרות, הסוס (רסטר SVG) עם נדנוד וקפיצה, HUD
   תלויות: js/horse.js (Horse.svg, Horse.state), js/audio.js, kids-ui, wallet, hero-rewards, achievements
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- פרק 1 — הגדרות ---------- */
  var LEN = 3200, INK = '#101e36', FONT = '"Rubik","Varela Round","Heebo",sans-serif';
  var PCOL = ['#29e0ff', '#ff5ca8'], PNAME = ['שחקן 1', 'שחקן 2'];
  var TAP_BOOST = 95, DECAY = 55, MAXV = 420, JUMP_V = 620, GRAV = 1500;
  var FENCES = [520, 980, 1400, 1850, 2300, 2750];

  /* ---------- עזרים ---------- */
  function $(id) { return document.getElementById(id); }
  function say(t) { try { Voice.say(t, { interrupt: true }); } catch (e) {} }
  function sayEn(t) { try { Voice.en(t); } catch (e) {} }
  function snd(n) { try { if (window.Sound && Sound[n]) Sound[n](); } catch (e) {} }
  function tap(p) { try { KidsUI.KidsAudio.tap(p); } catch (e) {} }
  function track(ev) { try { if (window.Progress) Progress.track(ev); } catch (e) {} }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function label(c, txt, x, y, size, col) { c.font = '900 ' + size + 'px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = Math.max(4, size * .18); c.strokeStyle = INK; c.strokeText(txt, x, y); c.fillStyle = col || '#fff'; c.fillText(txt, x, y); }
  var EMO = {};
  function emo(e) { if (EMO[e]) return EMO[e]; var c = document.createElement('canvas'); c.width = c.height = 160; var x = c.getContext('2d'); x.font = '128px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e, 80, 90); return (EMO[e] = c); }
  // horseImg(p) — רסטר של הסוס: שחקן 1 = הסוס מהארון; שחקן 2 = סוס לבן עם רעמה בלונדינית ואוכף אחר
  var HIMG = [null, null];
  function horseImg(p) {
    if (HIMG[p]) return HIMG[p];
    var st = p ? Object.assign({}, window.Horse ? Horse.state : {}, { coat: 'white', mane: 'blond', saddle: (window.Horse && Horse.state.saddle === 'red') ? 'blue' : 'red', acc: [], braids: 0, mud: 0 }) : null;
    var svg = window.Horse ? Horse.svg(st ? { state: st } : {}) : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320"><text x="60" y="220" font-size="200">🐎</text></svg>';
    var im = new Image(); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace('<svg ', '<svg width="500" height="400" ')); HIMG[p] = im; return im;
  }

  /* ---------- פרק 2 — שכבה ---------- */
  var cv, ctx, W = 0, H = 0, DPR = 1, D = null, last = 0, raf = 0, PT = {};
  function resize() { if (!cv) return; DPR = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = W * DPR; cv.height = H * DPR; cv.style.width = W + 'px'; cv.style.height = H + 'px'; }
  if (window.addEventListener) window.addEventListener('resize', resize);   /* ב-node (gen_voice) אין DOM */
  function laneOf(y) { return y < H / 2 ? 1 : 0; }   // למעלה = שחקן 2
  function open() {
    $('rduoOv').classList.add('show'); $('rduoEnd').style.display = 'none'; resize(); HIMG = [null, null];
    D = { phase: 'count', t: 0, time: 0, P: [mk(), mk()], order: [], fx: [] };
    say('מרוץ סוסים לשניים! נוגעים במסלול שלך שוב ושוב כדי לדהור, ומחליקים למעלה כדי לקפוץ מעל גדר. למקומות…'); snd('ding');
    try { TapFX.set('light'); } catch (e) {}
    last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  }
  function mk() { return { x: 0, v: 0, jz: 0, vz: 0, stumble: 0, fences: 0, hits: 0, done: 0, gait: 0, nextFence: 0 }; }
  function close() { cancelAnimationFrame(raf); D = null; PT = {}; $('rduoOv').classList.remove('show'); try { TapFX.set('full'); } catch (e) {} }
  function onDown(e) { if (!D || D.phase !== 'play') return; var p = laneOf(e.clientY); PT[e.pointerId] = { p: p, y0: e.clientY, t0: performance.now() }; gallop(p); }
  function onUp(e) { var q = PT[e.pointerId]; delete PT[e.pointerId]; if (!q || !D || D.phase !== 'play') return; if (q.y0 - e.clientY > 50 && performance.now() - q.t0 < 500) jump(q.p); }
  function loop(now) {
    raf = requestAnimationFrame(loop); var dt = Math.min(.05, (now - last) / 1000); last = now; if (!D) return;
    D.t += dt;
    if (D.phase === 'count') { if (D.t > 3.4) { D.phase = 'play'; D.t = 0; sayEn('Go!'); } }
    else if (D.phase === 'play') { D.time += dt; update(dt); }
    D.fx.forEach(function (f) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 600 * dt; f.life -= dt; }); D.fx = D.fx.filter(function (f) { return f.life > 0; });
    render();
  }

  /* ---------- פרק 3 — פיזיקה ---------- */
  function gallop(p) { var P = D.P[p]; if (P.done || P.stumble > 0) return; P.v = Math.min(MAXV, P.v + TAP_BOOST); snd('tap'); }
  function jump(p) { var P = D.P[p]; if (P.done || P.jz > 0 || P.stumble > 0) return; P.vz = JUMP_V; sayEn('Jump!'); }
  function update(dt) {
    D.P.forEach(function (P, p) {
      if (P.done) return;
      if (P.stumble > 0) { P.stumble -= dt; P.v = 0; }
      P.v = Math.max(0, P.v - DECAY * dt); P.x += P.v * dt; P.gait += P.v * dt / 40;
      if (P.jz > 0 || P.vz > 0) { P.vz -= GRAV * dt; P.jz += P.vz * dt; if (P.jz <= 0) { P.jz = 0; P.vz = 0; } }
      /* גדרות: עוברים אחת כשה-x חוצה אותה; באוויר = נקייה, אחרת מעידה */
      var f = FENCES[P.nextFence];
      while (f != null && P.x >= f) {   /* כל גדר שחצינו בפריים הזה (בדרך כלל אחת) */ P.nextFence++; if (P.jz > 40) { P.fences++; D.fx.push({ x: W * .5, y: laneY(p) - 60, vx: 0, vy: -200, e: '⭐', life: .8 }); snd('sparkle'); sayEn(['one', 'two', 'three', 'four', 'five', 'six'][P.fences - 1] + (P.fences === 1 ? ' fence' : ' fences')); } else { P.hits++; P.stumble = 1; P.v = 0; snd('sad'); D.fx.push({ x: W * .5, y: laneY(p) - 60, vx: 0, vy: -150, e: '💥', life: .7 }); } f = FENCES[P.nextFence]; }
      if (P.x >= LEN) { P.done = D.order.length + 1; D.order.push(p); sayEn(P.done === 1 ? 'first' : 'second'); snd(P.done === 1 ? 'happy' : 'ding'); if (D.order.length === 2) finish(); else setTimeout(function () { if (D && D.phase === 'play' && D.order.length < 2) finish(); }, 8000); }
    });
  }
  function laneY(p) { return p ? H * .42 : H * .92; }

  /* ---------- פרק 4 — ציור ---------- */
  function render() {
    var c = ctx; c.setTransform(DPR, 0, 0, DPR, 0, 0);
    for (var p = 1; p >= 0; p--) {
      var top = p ? 0 : H / 2, P = D.P[p], cam = Math.max(0, Math.min(LEN - W * .6, P.x - W * .3));
      c.save(); c.beginPath(); c.rect(0, top, W, H / 2); c.clip(); c.translate(0, top);
      var g = c.createLinearGradient(0, 0, 0, H / 2); g.addColorStop(0, p ? '#ffd1e8' : '#bfe8ff'); g.addColorStop(1, '#ffffff'); c.fillStyle = g; c.fillRect(0, 0, W, H / 2);
      /* גבעות בפרלקסה */
      c.fillStyle = p ? '#d8b4e8' : '#a8dcae'; c.beginPath(); c.moveTo(0, H / 2); for (var x = 0; x <= W; x += 20) c.lineTo(x, H * .30 - Math.abs(Math.sin((x + cam * .3) / 160)) * H * .08); c.lineTo(W, H / 2); c.fill();
      c.fillStyle = '#8ee07a'; c.fillRect(0, H * .34, W, H / 2);
      /* מסלול */
      c.fillStyle = '#e8c9a0'; c.fillRect(0, H * .40, W, H * .08); c.fillStyle = '#fff'; for (x = -((cam * 1) % 80); x < W; x += 80) c.fillRect(x, H * .435, 40, 6);
      /* גדרות וקו סיום */
      FENCES.forEach(function (f) { var fx = f - cam; if (fx < -60 || fx > W + 60) return; c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = 3; [0, 24].forEach(function (o) { c.fillRect(fx - 30 + o, H * .35, 8, 70); c.strokeRect(fx - 30 + o, H * .35, 8, 70); }); c.fillRect(fx - 34, H * .37, 48, 8); c.strokeRect(fx - 34, H * .37, 48, 8); c.fillRect(fx - 34, H * .39, 48, 8); c.strokeRect(fx - 34, H * .39, 48, 8); });
      var fin = LEN - cam; if (fin < W + 60) { for (var k = 0; k < 10; k++) { c.fillStyle = k % 2 ? '#fff' : INK; c.fillRect(fin, H * .20 + k * H * .028, 14, H * .028); } c.drawImage(emo('🏁'), fin - 10, H * .16, 50, 50); }
      /* הסוס */
      var im = horseImg(p), hx = P.x - cam, hy = H * .43 - P.jz, bob = P.jz > 0 ? 0 : Math.sin(P.gait) * 4, sz = Math.min(W, H) * .22;
      c.fillStyle = 'rgba(16,30,54,.25)'; c.beginPath(); c.ellipse(hx, H * .44, sz * .5, 10, 0, 0, 7); c.fill();
      if (im.complete && im.naturalWidth) { c.save(); c.translate(hx, hy + bob); if (P.stumble > 0) c.rotate(.25); c.drawImage(im, -sz * .55, -sz * .85, sz * 1.1, sz * .88); c.restore(); }
      if (P.stumble > 0) c.drawImage(emo('💫'), hx - 20, hy - sz * .95, 40, 40);
      /* HUD של המסלול */
      var txt = PNAME[p] + '  🏇 ' + Math.round(P.x / LEN * 100) + '%  ⬆️ ' + P.fences; c.font = '900 ' + Math.round(Math.min(W, H) * .04) + 'px ' + FONT; var w = c.measureText(txt).width + 40;
      c.fillStyle = INK; rr(c, 24 + 5, 16 + 6, w, 44, 12); c.fill(); c.fillStyle = PCOL[p]; rr(c, 24, 16, w, 44, 12); c.fill(); c.lineWidth = 4; c.strokeStyle = INK; c.stroke();
      c.fillStyle = INK; c.textAlign = 'left'; c.textBaseline = 'middle'; c.direction = 'rtl'; c.fillText(txt, 44, 38);
      /* פס התקדמות */
      c.fillStyle = INK; rr(c, W * .35, 22, W * .5, 20, 10); c.fill(); c.fillStyle = PCOL[p]; rr(c, W * .35 + 3, 25, (W * .5 - 6) * Math.min(1, P.x / LEN), 14, 7); c.fill();
      if (P.done) label(c, P.done === 1 ? '🥇 ראשון · first' : '🥈 שני · second', W / 2, H * .18, Math.round(Math.min(W, H) * .07), '#ffe14a');
      c.restore();
    }
    D.fx.forEach(function (f) { c.globalAlpha = Math.min(1, f.life * 2); c.drawImage(emo(f.e), f.x - 20, f.y - 20, 40, 40); }); c.globalAlpha = 1;
    c.fillStyle = INK; c.fillRect(0, H / 2 - 4, W, 8);
    if (D.phase === 'count') { var n = Math.ceil(3 - D.t), t = n > 0 ? String(n) : 'סע!'; c.fillStyle = 'rgba(16,30,54,.35)'; c.fillRect(0, 0, W, H); label(c, t, W / 2, H / 2, Math.round(Math.min(W, H) * .32), '#ffe14a'); }
    else if (D.time < 4) { label(c, 'נוגעים שוב ושוב = דוהרים · מחליקים למעלה = קופצים', W / 2, H / 2, Math.round(Math.min(W, H) * .04), '#fff'); }
  }

  /* ---------- סיום ---------- */
  function finish() {
    if (!D || D.phase === 'end') return; D.phase = 'end'; var win = D.order.length ? D.order[0] + 1 : 0, P = D.P;
    try { Wallet.add(3); } catch (e) {} try { Achievements.hit('ride:duo'); } catch (e) {} track('ride:duo'); track('ride:done');
    $('rduoEndT').textContent = win ? '🏆 ' + PNAME[win - 1] + ' הגיע ראשון!' : '🤝 תיקו!';
    $('rduoEndS').innerHTML = '<span style="color:' + PCOL[0] + '">' + PNAME[0] + ': ' + P[0].fences + ' קפיצות נקיות</span> · <span style="color:' + PCOL[1] + '">' + PNAME[1] + ': ' + P[1].fences + ' קפיצות נקיות</span> · 🪙 +3';
    $('rduoEnd').style.display = 'grid'; try { HeroRewards.confetti(); TapFX.set('full'); } catch (e) {} snd('happy');
    say((win ? PNAME[win - 1] + ' ראשון! ' : 'תיקו! ') + 'first זה ראשון, second זה שני. כל הכבוד לשניכם!');
    setTimeout(function () { cancelAnimationFrame(raf); }, 400);
  }
  function englishLines() { return ['Go!', 'Jump!', 'first', 'second', 'one fence', 'two fences', 'three fences', 'four fences', 'five fences', 'six fences']; }

  /* ---------- אתחול ---------- */
  function boot() {
    cv = $('rduoCv'); if (!cv) return; ctx = cv.getContext('2d'); resize();
    cv.addEventListener('pointerdown', onDown); window.addEventListener('pointerup', onUp); window.addEventListener('pointercancel', onUp);
    $('rduoBtn').addEventListener('click', function () { tap(); open(); });
    $('rduoAgain').addEventListener('click', function () { tap(); open(); });
    $('rduoX').addEventListener('click', function () { tap(); close(); });
  }
  window.RideDuo = { open: open, close: close, state: function () { return D; }, gallop: gallop, jump: jump, finish: finish, englishLines: englishLines, LEN: LEN };
  if (typeof document !== 'undefined' && document.addEventListener) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot(); }
})();
