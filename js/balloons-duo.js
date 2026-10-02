/* =====================================================================
   js/balloons-duo.js — 👥 "בלונים לשניים": מסך מפוצל מעל משחק הבלונים (שלב 19)
   ---------------------------------------------------------------------
   מה הקובץ עושה: כפתור 👥 בדף הבלונים פותח שכבה (#bduoOv) עם קנבס מפוצל: שחקן 1 משמאל, שחקן 2 מימין.
   בלונים צבעוניים עולים בכל חצי; נגיעה מפוצצת (+1), בלון עם מספר אומר את המספר באנגלית, בלון זהב = +3,
   ובלון קסם 🦄 (אם נקנה "בלוני קסם" בעגלת השדרוגים) = +5. השדרוגים "בלוני ענק" ו"טורבו" פועלים גם כאן.
   45 שניות, ניקוד לכל שחקן ו"יחד", מטבעות לארנק. משחק הבלונים (Phaser) נרדם בזמן המשחק ומתעורר אחריו.

   פרק 1 — הגדרות: צבעים (אנגלית + עברית), מספרים, משך, שדרוגים
   פרק 2 — שכבה וקנבס: מגע רב-אצבעות לפי צד, לולאה, ספירה לאחור
   פרק 3 — בלונים: יצירה, עלייה ונדנוד, פיצוץ (קונפטי), החמצה (יצא למעלה)
   פרק 4 — ציור: שמיים, עננים, בלון עם ברק וחוט, לוח ניקוד, פס זמן
   פרק 5 — סיום: מנצח/תיקו, מטבעות, הישג balloons:duo, Progress
   תלויות: js/audio.js, kids-ui, wallet, hero-rewards, achievements, learn-fx (אופציונלי)
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- פרק 1 — הגדרות ---------- */
  var ROUND = 45, INK = '#101e36', FONT = '"Rubik","Varela Round","Heebo",sans-serif';
  var PCOL = ['#29e0ff', '#ff5ca8'], PNAME = ['שחקן 1', 'שחקן 2'];
  var COLORS = [['#ff5ca8', 'pink', 'ורוד'], ['#4da6ff', 'blue', 'כחול'], ['#ffd24c', 'yellow', 'צהוב'], ['#6fd06a', 'green', 'ירוק'], ['#b28dff', 'purple', 'סגול'], ['#ff8a4c', 'orange', 'כתום'], ['#ff4c4c', 'red', 'אדום']];
  var NUM_HE = ['', 'אחת', 'שתיים', 'שלוש', 'ארבע', 'חמש'], NUM_EN = ['', 'one', 'two', 'three', 'four', 'five'];
  function up() { var W = window.Wallet || { lvl: function () { return 0; } }; return { size: 1 + .16 * W.lvl('bigBalloons'), speed: 1 + .22 * W.lvl('turbo'), magic: W.lvl('magic') > 0 }; }

  /* ---------- עזרים ---------- */
  function $(id) { return document.getElementById(id); }
  function say(t) { try { Voice.say(t, { interrupt: true }); } catch (e) {} }
  function sayEn(t) { try { Voice.en(t); } catch (e) {} }
  function snd(n) { try { if (window.Sound && Sound[n]) Sound[n](); } catch (e) {} }
  function tap(p) { try { KidsUI.KidsAudio.tap(p); } catch (e) {} }
  function track(ev) { try { if (window.Progress) Progress.track(ev); } catch (e) {} }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function label(c, txt, x, y, size, col) { c.font = '900 ' + size + 'px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = Math.max(4, size * .18); c.strokeStyle = INK; c.strokeText(txt, x, y); c.fillStyle = col || '#fff'; c.fillText(txt, x, y); }
  var EMO = {};
  function emo(e) { if (EMO[e]) return EMO[e]; var c = document.createElement('canvas'); c.width = c.height = 160; var x = c.getContext('2d'); x.font = '128px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e, 80, 90); return (EMO[e] = c); }

  /* ---------- פרק 2 — שכבה ---------- */
  var cv, ctx, W = 0, H = 0, DPR = 1, half = 0, D = null, last = 0, raf = 0, U = null;
  function resize() { if (!cv) return; DPR = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; half = W / 2; cv.width = W * DPR; cv.height = H * DPR; cv.style.width = W + 'px'; cv.style.height = H + 'px'; }
  window.addEventListener('resize', resize);
  function sleepGame(on) { try { var g = window.gameInstance; if (g && g.loop) { if (on) g.loop.sleep(); else g.loop.wake(); } } catch (e) {} }
  function open() {
    $('bduoOv').classList.add('show'); sleepGame(true); U = up(); resize();
    D = { phase: 'count', t: 0, time: 0, score: [0, 0], bal: [[], []], spawn: [0, 0], fx: [], pops: [], missed: [0, 0] };
    say('בלונים לשניים! כל אחד מפוצץ בצד שלו. בלון עם מספר אומר את המספר, בלון זהב שווה שלוש!'); snd('ding');
    try { TapFX.set('light'); } catch (e) {}
    last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); $('bduoEnd').style.display = 'none';
  }
  function close() { cancelAnimationFrame(raf); D = null; $('bduoOv').classList.remove('show'); sleepGame(false); try { TapFX.set('full'); } catch (e) {} }
  function onDown(e) {
    if (!D || D.phase !== 'play') return; var p = e.clientX < half ? 0 : 1, lx = e.clientX - p * half, hit = null;
    D.bal[p].forEach(function (b) { if (!hit && Math.hypot(lx - b.x, e.clientY - b.y) < b.r * 1.15) hit = b; });
    if (hit) pop(p, hit); else { D.fx.push({ x: e.clientX, y: e.clientY, e: '💨', life: .4, vx: 0, vy: -60 }); }
  }
  function loop(now) {
    raf = requestAnimationFrame(loop); var dt = Math.min(.05, (now - last) / 1000); last = now; if (!D) return;
    D.t += dt;
    if (D.phase === 'count') { if (D.t > 3.4) { D.phase = 'play'; D.t = 0; say('צא!'); } }
    else if (D.phase === 'play') { D.time += dt; update(dt); if (D.time >= ROUND) finish(); }
    D.fx.forEach(function (f) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 500 * dt; f.life -= dt; }); D.fx = D.fx.filter(function (f) { return f.life > 0; });
    D.pops.forEach(function (q) { q.t += dt; }); D.pops = D.pops.filter(function (q) { return q.t < 1.1; });
    render();
  }

  /* ---------- פרק 3 — בלונים ---------- */
  function spawn(p) {
    var r = Math.min(half, H) * .085 * U.size, col = COLORS[(Math.random() * COLORS.length) | 0], kind = Math.random();
    var b = { x: rnd(r + 10, half - r - 10), y: H + r * 1.6, r: r, col: col, vy: -(rnd(60, 110) + D.time * 1.2) * U.speed, ph: rnd(0, 6), kind: 'plain', num: 0 };
    if (kind < .22) { b.kind = 'num'; b.num = 1 + ((Math.random() * 5) | 0); } else if (kind < .30) { b.kind = 'gold'; } else if (kind < .36 && U.magic) { b.kind = 'magic'; }
    D.bal[p].push(b);
  }
  function update(dt) {
    for (var p = 0; p < 2; p++) {
      D.spawn[p] -= dt; if (D.spawn[p] <= 0 && D.bal[p].length < 6) { D.spawn[p] = rnd(.5, 1.1) / U.speed; spawn(p); }
      D.bal[p].forEach(function (b) { b.y += b.vy * dt; b.ph += dt * 2; });
      var before = D.bal[p].length; D.bal[p] = D.bal[p].filter(function (b) { return b.y > -b.r * 2; }); D.missed[p] += before - D.bal[p].length;
    }
  }
  function pop(p, b) {
    D.bal[p].splice(D.bal[p].indexOf(b), 1); var pts = b.kind === 'gold' ? 3 : b.kind === 'magic' ? 5 : 1; D.score[p] += pts;
    for (var i = 0; i < 10; i++) D.fx.push({ x: b.x + p * half, y: b.y, vx: rnd(-260, 260), vy: rnd(-320, -60), e: b.kind === 'magic' ? '🦄' : b.kind === 'gold' ? '⭐' : '🎉', life: rnd(.5, .9), col: b.col[0] });
    snd('pop');
    if (b.kind === 'num') { D.pops.push({ p: p, txt: NUM_HE[b.num] + ' · ' + NUM_EN[b.num], t: 0 }); sayEn(NUM_EN[b.num]); }
    else if (b.kind === 'gold') { D.pops.push({ p: p, txt: 'זהב! +3', t: 0 }); snd('cha_ching'); }
    else if (b.kind === 'magic') { D.pops.push({ p: p, txt: 'בלון קסם! +5', t: 0 }); snd('happy'); }
    else if (Math.random() < .35) { D.pops.push({ p: p, txt: b.col[2] + ' · ' + b.col[1], t: 0 }); sayEn(b.col[1]); }
  }

  /* ---------- פרק 4 — ציור ---------- */
  function balloon(c, b) {
    var sway = Math.sin(b.ph) * 6, x = b.x + sway, y = b.y;
    c.strokeStyle = 'rgba(16,30,54,.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y + b.r * 1.2); c.quadraticCurveTo(x + 8, y + b.r * 1.9, x - 4, y + b.r * 2.6); c.stroke();
    var fill = b.kind === 'gold' ? '#ffd24c' : b.kind === 'magic' ? '#ffffff' : b.col[0];
    c.fillStyle = fill; c.beginPath(); c.ellipse(x, y, b.r * .85, b.r * 1.05, 0, 0, 7); c.fill(); c.lineWidth = 4; c.strokeStyle = INK; c.stroke();
    c.fillStyle = INK; c.beginPath(); c.moveTo(x - 6, y + b.r * 1.02); c.lineTo(x + 6, y + b.r * 1.02); c.lineTo(x, y + b.r * 1.22); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(x - b.r * .3, y - b.r * .4, b.r * .18, b.r * .32, -.5, 0, 7); c.fill();
    if (b.kind === 'num') label(c, String(b.num), x, y, Math.round(b.r * .9));
    if (b.kind === 'gold') { c.save(); c.globalAlpha = .6 + .4 * Math.sin(b.ph * 3); c.drawImage(emo('⭐'), x - b.r * .4, y - b.r * .4, b.r * .8, b.r * .8); c.restore(); }
    if (b.kind === 'magic') c.drawImage(emo('🦄'), x - b.r * .45, y - b.r * .5, b.r * .9, b.r * .9);
  }
  function render() {
    var c = ctx; c.setTransform(DPR, 0, 0, DPR, 0, 0);
    for (var p = 0; p < 2; p++) {
      c.save(); c.beginPath(); c.rect(p * half, 0, half, H); c.clip(); c.translate(p * half, 0);
      var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, p ? '#ffd1e8' : '#bfe8ff'); g.addColorStop(1, '#ffffff'); c.fillStyle = g; c.fillRect(0, 0, half, H);
      for (var k = 0; k < 3; k++) { var cx = ((k * 230 + D.t * 12) % (half + 200)) - 100, cy = H * (.12 + k * .2); c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(cx, cy, 34, 0, 7); c.arc(cx + 40, cy - 12, 44, 0, 7); c.arc(cx + 86, cy, 36, 0, 7); c.fill(); }
      D.bal[p].forEach(function (b) { balloon(c, b); });
      var txt = PNAME[p] + '  🎈 ' + D.score[p]; c.font = '900 ' + Math.round(Math.min(half, H) * .055) + 'px ' + FONT; var w = c.measureText(txt).width + 40, y = Math.max(50, H * .07);
      c.fillStyle = INK; rr(c, half / 2 - w / 2 + 5, y - 24 + 6, w, 46, 12); c.fill(); c.fillStyle = PCOL[p]; rr(c, half / 2 - w / 2, y - 24, w, 46, 12); c.fill(); c.lineWidth = 4; c.strokeStyle = INK; c.stroke();
      c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle'; c.direction = 'rtl'; c.fillText(txt, half / 2, y);
      D.pops.filter(function (q) { return q.p === p; }).forEach(function (q, i) { c.globalAlpha = 1 - q.t / 1.1; label(c, q.txt, half / 2, H * .3 - q.t * 50 - i * 8, Math.round(Math.min(half, H) * .06), '#ffe14a'); c.globalAlpha = 1; });
      c.restore();
    }
    D.fx.forEach(function (f) { c.globalAlpha = Math.min(1, f.life * 2); c.drawImage(emo(f.e), f.x - 16, f.y - 16, 32, 32); }); c.globalAlpha = 1;
    c.fillStyle = INK; c.fillRect(half - 4, 0, 8, H);
    var tw = W * .5, tx = W / 2 - tw / 2, ty = H - Math.max(18, H * .03) - 16; c.fillStyle = INK; rr(c, tx - 3, ty - 3, tw + 6, 22, 11); c.fill(); c.fillStyle = '#2a1a4f'; rr(c, tx, ty, tw, 16, 8); c.fill(); c.fillStyle = '#ffc93c'; rr(c, tx, ty, tw * Math.max(0, 1 - D.time / ROUND), 16, 8); c.fill();
    if (D.phase === 'count') { var n = Math.ceil(3 - D.t), t = n > 0 ? String(n) : 'צא!'; c.fillStyle = 'rgba(16,30,54,.35)'; c.fillRect(0, 0, W, H); label(c, t, W / 2, H / 2, Math.round(Math.min(W, H) * .32), '#ffe14a'); }
  }

  /* ---------- פרק 5 — סיום ---------- */
  function finish() {
    D.phase = 'end'; var a = D.score[0], b = D.score[1], tot = a + b, win = a === b ? 0 : a > b ? 1 : 2, coins = Math.max(1, Math.floor(tot / 10));
    try { Wallet.add(coins); } catch (e) {} try { Achievements.hit('balloons:duo'); } catch (e) {} track('balloons:duo');
    $('bduoEndT').textContent = win ? '🏆 ' + PNAME[win - 1] + ' מנצח!' : '🤝 תיקו!'; $('bduoEndS').innerHTML = '<span style="color:' + PCOL[0] + '">' + PNAME[0] + ': ' + a + '</span> · <span style="color:' + PCOL[1] + '">' + PNAME[1] + ': ' + b + '</span> · יחד: ' + tot + ' · 🪙 +' + coins;
    $('bduoEnd').style.display = 'grid'; try { HeroRewards.confetti(); } catch (e) {} snd('happy');
    say((win ? PNAME[win - 1] + ' מנצח! ' : 'תיקו! ') + a + ' נגד ' + b + '. יחד פוצצתם ' + tot + ' בלונים!');
    setTimeout(function () { cancelAnimationFrame(raf); }, 400);
  }

  /* ---------- אתחול ---------- */
  function boot() {
    var ov = document.createElement('div'); ov.id = 'bduoOv';
    ov.innerHTML = '<canvas id="bduoCv"></canvas><div id="bduoEnd"><div class="card h-panel" style="text-align:center;width:min(92vw,620px);padding:18px 22px"><h2 id="bduoEndT">🏆</h2><p id="bduoEndS"></p><div class="row"><button class="h-btn gold" id="bduoAgain" type="button">עוד פעם! 🔁</button><button class="h-btn violet" id="bduoX" type="button">חזרה לבלונים</button></div></div></div>';
    var st = document.createElement('style'); st.textContent = '#bduoBtn{position:fixed;top:max(10px,env(safe-area-inset-top));right:14px;z-index:9000;padding:8px 14px;border:4px solid #101e36;border-radius:14px;background:#fffaf0 linear-gradient(180deg,#c9f3ff,#ff9bc8);color:#101e36;font:900 16px/1 Rubik,sans-serif;box-shadow:4px 5px 0 #101e36;transform:skewX(-7deg);cursor:pointer}' +
      '#bduoOv{position:fixed;inset:0;z-index:9100;display:none;background:#0b224a}#bduoOv.show{display:block}#bduoCv{position:absolute;inset:0;touch-action:none}' +
      '#bduoEnd{position:absolute;inset:0;display:none;place-items:center;padding:16px;background:rgba(10,4,30,.6);font-family:Rubik,sans-serif;direction:rtl}#bduoEnd h2{font:900 clamp(28px,4vw,44px)/1.1 Rubik,sans-serif;color:#fff;-webkit-text-stroke:4px #101e36;paint-order:stroke fill;text-shadow:3px 4px 0 #ff622e}#bduoEnd p{font:900 clamp(18px,2.4vw,26px)/1.4 Rubik,sans-serif;margin:10px 0 14px;color:#101e36}#bduoEnd .row{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}';
    document.head.appendChild(st); document.body.appendChild(ov);
    var btn = document.createElement('button'); btn.id = 'bduoBtn'; btn.type = 'button'; btn.textContent = '👥 בלונים לשניים'; document.body.appendChild(btn);
    cv = $('bduoCv'); ctx = cv.getContext('2d'); resize();
    cv.addEventListener('pointerdown', onDown);
    btn.addEventListener('click', function () { tap(); open(); });
    $('bduoAgain').addEventListener('click', function () { tap(); open(); });
    $('bduoX').addEventListener('click', function () { tap(); close(); });
  }
  window.BalloonsDuo = { open: open, close: close, state: function () { return D; }, finish: finish, pop: pop };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
