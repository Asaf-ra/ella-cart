/* =====================================================================
   js/draw2.js — 🎨 "ציור לשניים": דף אחד, שני מכחולים, שולחים לסבתא (שלב 19)
   ---------------------------------------------------------------------
   מה הקובץ עושה: קנבס אחד במרכז, פלטה לכל שחקן (שחקן 1 משמאל, שחקן 2 מימין). שני הילדים מציירים בו-זמנית:
   כל אצבע שמתחילה בחצי השמאלי של הקנבס מציירת עם הצבע/המכחול של שחקן 1, ובחצי הימני — של שחקן 2 (ואפשר
   לחצות!). מדבקות: בוחרים מדבקה בפלטה ונוגעים בקנבס. רקעים: ריק, חווה, חלל, ים. נושא לציור משותף מוקרא בקול.
   ↩️ מבטל את הקו האחרון של השחקן, 🗑️ מנקה (עם אישור), 📤 שולח את הציור (Share.show) ונספר כציור שנשמר.

   פרק 1 — הגדרות: צבעים, גדלים, מדבקות, רקעים, נושאים
   פרק 2 — מצב: קווים (בעלים, צבע, עובי, נקודות), מדבקות, רקע; כלי כל שחקן
   פרק 3 — ציור: קנבס ב-DPR, קו רך (quadratic), ציור מחדש אחרי undo, רקע
   פרק 4 — מגע: pointerId → שחקן לפי צד ההתחלה; מולטי-טאץ'
   פרק 5 — ממשק: פלטות, כפתורים, נושא, שיתוף, הישג draw:duo
   תלויות: shared/share.js (Share.show), js/audio.js, kids-ui, achievements, progress
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- פרק 1 — הגדרות ---------- */
  var COLORS = ['#ff3b3b', '#ff8a3c', '#ffd93c', '#2fb85a', '#29e0ff', '#3d7bff', '#9b5cff', '#ff5ca8', '#9c6b3f', '#101e36', '#ffffff', '#c9c9d9'];
  var SIZES = [[6, 'דק'], [14, 'בינוני'], [28, 'עבה']];
  var STAMPS = ['⭐', '💖', '🌸', '🦋', '🐶', '🐱', '🌈', '☀️', '🚗', '🦄', '🍦', '🎈'];
  var BGS = [['blank', '⬜', 'ריק', null], ['farm', '🏡', 'חווה', ['#bfe8ff', '#8ee07a', ['🏡', '🌳', '🐄', '🌻']]], ['space', '🚀', 'חלל', ['#0b1a4a', '#2a1a6a', ['🌙', '⭐', '🪐', '🚀']]], ['sea', '🌊', 'ים', ['#9fe0ff', '#3d7bff', ['⛵', '🐟', '🐚', '🌴']]]];
  var THEMES = ['חווה עם כל החיות', 'יום הולדת לדרקון', 'טיול בחלל', 'מסיבה בים', 'המשפחה שלנו', 'מכונית מרוץ מטורפת', 'קשת בענן ענקית', 'בית חלומות'];
  var PCOL = ['#29e0ff', '#ff5ca8'], PNAME = ['שחקן 1', 'שחקן 2'];

  /* ---------- עזרים ---------- */
  function $(id) { return document.getElementById(id); }
  function say(t) { try { Voice.say(t, { interrupt: true }); } catch (e) {} }
  function snd(n) { try { if (window.Sound && Sound[n]) Sound[n](); } catch (e) {} }
  function tap(p) { try { KidsUI.KidsAudio.tap(p); } catch (e) {} }
  function track(ev) { try { if (window.Progress) Progress.track(ev); } catch (e) {} }

  /* ---------- פרק 2 — מצב ---------- */
  var strokes = [], stamps = [], bg = 'blank', theme = '';
  var tool = [{ color: '#ff3b3b', size: 14, mode: 'brush', stamp: '⭐' }, { color: '#3d7bff', size: 14, mode: 'brush', stamp: '💖' }];
  var active = {};   // pointerId → { p, stroke }

  /* ---------- פרק 3 — ציור ---------- */
  var cv, ctx, W = 0, H = 0, DPR = 1;
  function resize() { var r = cv.getBoundingClientRect(); DPR = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height; cv.width = W * DPR; cv.height = H * DPR; redraw(); }
  function drawBg(c) {
    var b = BGS.filter(function (x) { return x[0] === bg; })[0];
    if (!b || !b[3]) { c.fillStyle = '#fffaf0'; c.fillRect(0, 0, W, H); return; }
    var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, b[3][0]); g.addColorStop(1, b[3][1]); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.font = Math.round(Math.min(W, H) * .1) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.globalAlpha = .35;
    b[3][2].forEach(function (e, i) { c.fillText(e, W * (.15 + i * .23), H * (i % 2 ? .22 : .82)); }); c.globalAlpha = 1;
  }
  function drawStroke(c, s) {
    c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = s.size; c.strokeStyle = s.color; c.globalCompositeOperation = s.erase ? 'destination-out' : 'source-over';
    var p = s.pts; if (p.length === 1) { c.beginPath(); c.arc(p[0][0], p[0][1], s.size / 2, 0, 7); c.fillStyle = s.color; c.fill(); c.globalCompositeOperation = 'source-over'; return; }
    c.beginPath(); c.moveTo(p[0][0], p[0][1]); for (var i = 1; i < p.length - 1; i++) { var mx = (p[i][0] + p[i + 1][0]) / 2, my = (p[i][1] + p[i + 1][1]) / 2; c.quadraticCurveTo(p[i][0], p[i][1], mx, my); } c.lineTo(p[p.length - 1][0], p[p.length - 1][1]); c.stroke(); c.globalCompositeOperation = 'source-over';
  }
  function drawStamp(c, s) { c.font = s.size + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s.e, s.x, s.y); }
  // redraw — מצייר הכול מחדש (אחרי undo / שינוי רקע / שינוי גודל)
  function redraw() { var c = ctx; c.setTransform(DPR, 0, 0, DPR, 0, 0); c.clearRect(0, 0, W, H); drawBg(c); strokes.forEach(function (s) { if (s.kind === 'stamp') drawStamp(c, s); else drawStroke(c, s); }); }
  // segment — מצייר רק את הקטע האחרון של קו פעיל (מהיר, בלי לצייר הכול מחדש)
  function segment(s) { var c = ctx, p = s.pts, n = p.length; if (n < 2) { drawStroke(c, s); return; } c.setTransform(DPR, 0, 0, DPR, 0, 0); c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = s.size; c.strokeStyle = s.color; c.globalCompositeOperation = s.erase ? 'destination-out' : 'source-over'; c.beginPath(); c.moveTo(p[n - 2][0], p[n - 2][1]); c.lineTo(p[n - 1][0], p[n - 1][1]); c.stroke(); c.globalCompositeOperation = 'source-over'; }

  /* ---------- פרק 4 — מגע ---------- */
  function pos(e) { var r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  function onDown(e) {
    e.preventDefault(); var xy = pos(e), p = xy[0] < W / 2 ? 0 : 1, t = tool[p];
    try { cv.setPointerCapture(e.pointerId); } catch (x) {}
    if (t.mode === 'stamp') { var st = { kind: 'stamp', p: p, e: t.stamp, x: xy[0], y: xy[1], size: t.size * 4 }; strokes.push(st); drawStamp(ctx, st); snd('pop'); return; }
    var s = { kind: 'line', p: p, color: t.color, size: t.mode === 'erase' ? t.size * 2 : t.size, erase: t.mode === 'erase', pts: [xy] };
    strokes.push(s); active[e.pointerId] = s; drawStroke(ctx, s);
  }
  function onMove(e) { var s = active[e.pointerId]; if (!s) return; e.preventDefault(); var xy = pos(e), l = s.pts[s.pts.length - 1]; if (Math.hypot(xy[0] - l[0], xy[1] - l[1]) < 1.5) return; s.pts.push(xy); segment(s); }
  function onUp(e) { delete active[e.pointerId]; }

  /* ---------- פרק 5 — ממשק ---------- */
  function palette(p) {
    var box = $('pal' + p), t = tool[p];
    box.innerHTML = '<h3 style="background:' + PCOL[p] + '">' + (p ? '👥 ' : '🧒 ') + PNAME[p] + '</h3>' +
      '<div class="cols">' + COLORS.map(function (c) { return '<button type="button" class="col' + (t.color === c && t.mode === 'brush' ? ' on' : '') + '" data-c="' + c + '" style="background:' + c + '"></button>'; }).join('') + '</div>' +
      '<div class="sizes">' + SIZES.map(function (s) { return '<button type="button" class="sz' + (t.size === s[0] ? ' on' : '') + '" data-s="' + s[0] + '"><i style="width:' + s[0] + 'px;height:' + s[0] + 'px"></i></button>'; }).join('') + '<button type="button" class="sz er' + (t.mode === 'erase' ? ' on' : '') + '" data-erase="1">🧽</button><button type="button" class="sz un" data-undo="1">↩️</button></div>' +
      '<div class="stamps">' + STAMPS.map(function (e) { return '<button type="button" class="stp' + (t.mode === 'stamp' && t.stamp === e ? ' on' : '') + '" data-e="' + e + '">' + e + '</button>'; }).join('') + '</div>';
  }
  function onPal(p, e) {
    var b = e.target.closest('button'); if (!b) return; var t = tool[p]; tap(600 + p * 100);
    if (b.dataset.c) { t.color = b.dataset.c; t.mode = 'brush'; }
    else if (b.dataset.s) { t.size = +b.dataset.s; if (t.mode === 'stamp') t.mode = 'brush'; }
    else if (b.dataset.erase) { t.mode = t.mode === 'erase' ? 'brush' : 'erase'; }
    else if (b.dataset.e) { t.mode = 'stamp'; t.stamp = b.dataset.e; }
    else if (b.dataset.undo) { for (var i = strokes.length - 1; i >= 0; i--) if (strokes[i].p === p) { strokes.splice(i, 1); break; } redraw(); }
    palette(p);
  }
  function setTheme() { theme = THEMES[(Math.random() * THEMES.length) | 0]; $('theme').textContent = '🎨 ציירו ביחד: ' + theme; say('ציירו ביחד: ' + theme + '!'); }
  function share() {
    var out = document.createElement('canvas'), S = 1200; out.width = S; out.height = S; var c = out.getContext('2d');
    c.fillStyle = '#fffaf0'; c.fillRect(0, 0, S, S); var s = Math.min((S - 100) / W, (S - 260) / H), w = W * s, h = H * s; c.drawImage(cv, (S - w) / 2, 70, w, h);
    c.lineWidth = 18; c.strokeStyle = '#101e36'; c.strokeRect(20, 20, S - 40, S - 40);
    c.font = '900 56px Rubik, sans-serif'; c.textAlign = 'center'; c.fillStyle = '#101e36'; c.direction = 'rtl'; c.fillText('🎨 ציירנו ביחד' + (theme ? ': ' + theme : ''), S / 2, S - 120);
    c.font = '800 32px Rubik, sans-serif'; c.fillStyle = '#4d5d7a'; c.fillText('עולם הגיבורים · ציור לשניים', S / 2, S - 60);
    try { Share.show(out, { kicker: '🎨 הציור המשותף', file: 'ציור-לשניים.png', text: 'ציירנו ביחד! 🎨' }); } catch (e) { var a = document.createElement('a'); a.href = out.toDataURL('image/png'); a.download = 'drawing.png'; a.click(); }
    track('art:save'); try { Achievements.hit('draw:duo'); } catch (e) {} say('הציור מוכן לשליחה!');
  }
  function bind() {
    cv = $('d2cv'); ctx = cv.getContext('2d');
    cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove); cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', onUp);
    palette(0); palette(1); $('pal0').addEventListener('click', function (e) { onPal(0, e); }); $('pal1').addEventListener('click', function (e) { onPal(1, e); });
    $('bgs').innerHTML = BGS.map(function (b) { return '<button type="button" class="bgb' + (b[0] === bg ? ' on' : '') + '" data-bg="' + b[0] + '">' + b[1] + ' ' + b[2] + '</button>'; }).join('');
    $('bgs').addEventListener('click', function (e) { var b = e.target.closest('[data-bg]'); if (!b) return; bg = b.dataset.bg; tap(); redraw(); document.querySelectorAll('.bgb').forEach(function (x) { x.classList.toggle('on', x.dataset.bg === bg); }); });
    $('themeBtn').addEventListener('click', function () { tap(); setTheme(); });
    $('clearBtn').addEventListener('click', function () { tap(240); if (!strokes.length || confirm('למחוק את כל הציור?')) { strokes = []; redraw(); say('דף חדש!'); } });
    $('shareBtn').addEventListener('click', function () { tap(800); share(); });
    window.addEventListener('resize', resize); resize(); setTheme();
    try { Achievements.hit('visit:draw2'); } catch (e) {}
  }
  window.addEventListener('DOMContentLoaded', bind);
  window.Draw2 = { strokes: function () { return strokes; }, tool: tool, share: share, redraw: redraw, setBg: function (b) { bg = b; redraw(); } };
})();
