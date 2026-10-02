/* =====================================================================
   js/farm.js — "החווה של אלה": עולם חי עם חיות שמכירים, יום ולילה אמיתיים ומזג אוויר
   ---------------------------------------------------------------------
   פרק 1  — הגדרות, מצב ושמירה (<pfx>-farm-v1): שמות, מלאי, ערוגות, ביצים, צמר, טריקים, קישוטים, משימות, אלבום
   פרק 2  — עולם ומצלמה: עולם ברוחב 3800 (גובה 800), גלילה באצבע עם תנופה, זום לאזור (×2.1) עם החלקה רכה
   פרק 3  — זמן ומזג אוויר: שעון המכשיר → צבעי שמיים (שחר/יום/שקיעה/לילה), שמש וירח בקשת, כוכבים;
            מזג אוויר לפי התאריך (שמש / עננים / גשם שמשקה את הגינה + קשת)
   פרק 4  — ספרייטים: ציורי החיות (js/farm-data.js) ואימוג'י מצוירים מראש לתמונה חדה (x2)
   פרק 5  — נוף: שמיים, עננים, גבעות בשלוש שכבות פרלקסה, שביל, מבנים (בית, מלונה, גינה, לול, בריכה, רפת,
            דיר, פינת ליטוף, אורווה, דוכן שוק), קישוטים שנקנו, דשא קדמי שמתנועע
   פרק 6  — חיות: התנהגות (שיטוט, שינה בלילה, מצמוץ, כשכוש, קפיצה, גלגול, ריצה אל הילדה), ציור עם נדנוד/מתיחה
   פרק 7  — חלקיקים: פרפרים ביום, גחליליות בלילה, גשם, לבבות, נצנוצים, אימוג'י מעופפים, עשן מהארובה
   פרק 8  — אזורים ואינטראקציות: כלבלב (כדור + 4 טריקים + ליטוף), חתולה (ליטוף → גרגור + רטט, חוט צמר),
            לול (איסוף ביצים עם ספירה, ביצת זהב שבוקעת), פרה (חליבה בקצב, גבינה), כבשה (גזיזה, צעיף),
            גינה (שתילה, השקיה, צמיחה בזמן אמת, קטיף), בריכה (לחם לברווזים), ארנבון (מחבואים), אורווה, שוק
   פרק 9  — משימות הבוקר, שוק וקישוטים, אלבום תמונות, קריאה במחיאת כף (מיקרופון, באישור), שמות לחיות
   פרק 10 — ממשק ולולאה
   פרק 11 — שכבת קומיקס גיבורים: רסטר, פיצוצי SFX, הגיבור/ה שעף/ה בחווה, קווי מהירות, מסגרת פאנל, "בינתיים..."
   תלויות: js/farm-data.js, js/horse.js (אופציונלי), js/audio.js, shared/kids-ui.js, wallet, hero-rewards, progress, share
   ===================================================================== */
(function () {
  'use strict';
  var FD = window.FarmData, BOY = FD.BOY, INK = FD.INK, PFX = BOY ? 'eitan' : 'ella', KEY = PFX + '-farm-v1';
  var KID = BOY ? 'איתן' : 'אלה';                       // Profile.fix מחליף בשם הילד/ה הפעיל/ה

  /* ================= פרק 1 — מצב ושמירה ================= */
  function dayKey(d) { d = d || new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function blank() {
    var now = Date.now(), names = {}; Object.keys(FD.ANIMALS).forEach(function (k) { names[k] = FD.ANIMALS[k][0]; });
    return { names: names, inv: { egg: 0, milk: 0, wool: 0, cheese: 0, carrot: 2, tomato: 0, strawberry: 0, flower: 0 },
      plots: [0, 1, 2, 3, 4, 5].map(function (i) { return i < 2 ? { k: 'carrot', at: now - 11 * 60000, w: 1 } : null; }),
      eggsAt: now - 3 * 40 * 60000, milkAt: 0, shornAt: 0, tricks: { sit: 0, paw: 0, roll: 0, jump: 0 }, chicks: 0, hatchDay: '', bunnyDay: '',
      scarf: {}, deco: [], chores: { day: '', prog: {}, done: 0, streak: 0, last: '' }, album: [], last: 0, visits: 0, time: 'real' };
  }
  function load() { try { var b = blank(), s = JSON.parse(localStorage.getItem(KEY)); if (!s) return b; Object.keys(b).forEach(function (k) { if (s[k] == null) s[k] = b[k]; }); Object.keys(b.inv).forEach(function (k) { if (s.inv[k] == null) s.inv[k] = 0; }); return s; } catch (e) { return blank(); } }
  var ST = load(), saveT = 0;
  function save() { clearTimeout(saveT); saveT = setTimeout(function () { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) { ST.album = ST.album.slice(0, 3); try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (x) {} } }, 300); }
  function nm(k) { return ST.names[k] || FD.ANIMALS[k][0]; }

  /* ---------- עזרים ---------- */
  function $(id) { return document.getElementById(id); }
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function say(t) { try { Voice.say(t, { interrupt: true }); } catch (e) {} }
  function sayEn(t) { try { Voice.en(t); } catch (e) {} try { sfx(t); } catch (e) {} }   /* כל צליל באנגלית = פיצוץ קומיקס */
  function teach(en, he) { try { Voice.teach(en, he); } catch (e) { say(he); } }
  function snd(n) { try { if (window.Sound && Sound[n]) Sound[n](); } catch (e) {} }
  function tap(p) { try { KidsUI.KidsAudio.tap(p); } catch (e) {} }
  function track(ev) { try { if (window.Progress) Progress.track(ev); } catch (e) {} }
  function toast(t) { var d = el('div', 'toast', t); document.querySelectorAll('.toast').forEach(function (x) { x.remove(); }); document.body.appendChild(d); setTimeout(function () { d.remove(); }, 2200); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function mixC(a, b, t) { var A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16); return 'rgb(' + [16, 8, 0].map(function (s) { return Math.round(lerp((A >> s) & 255, (B >> s) & 255, t)); }).join(',') + ')'; }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  /* ================= פרק 2 — עולם ומצלמה ================= */
  var VW = 4400, VH = 800, GROUND = 600;
  var cv = $('farmCv'), ctx = cv.getContext('2d'), W = 0, H = 0, DPR = 1;
  var cam = { cx: 3450, cy: VH / 2, z: 1, tcx: 3450, tcy: VH / 2, tz: 1, vx: 0 };
  var DPR_CAP = 2;                                         // שומר הביצועים (shared/perf-guard.js) מוריד ל-1 באייפד ישן
  window.addEventListener('perf:low', function () { DPR_CAP = 1; resize(); });
  function resize() { DPR = Math.min(window.devicePixelRatio || 1, DPR_CAP); W = innerWidth; H = innerHeight; cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); cv.style.width = W + 'px'; cv.style.height = H + 'px'; }
  window.addEventListener('resize', resize);
  function scale() { return H / VH * cam.z; }
  function viewW() { return W / scale(); }
  function toWorld(sx, sy) { var s = scale(); return { x: (sx - W / 2) / s + cam.cx, y: (sy - H / 2) / s + cam.cy }; }
  function clampCam() { var hw = viewW() / 2; cam.tcx = Math.max(hw, Math.min(VW - hw, cam.tcx)); }
  /* אזורים: [מזהה, x מרכז, שם, אימוג'י] */
  var ZONES = [['park', 4100, 'הגן הקסום', '🎡'], ['market', 3700, 'דוכן השוק', '🛒'], ['house', 3420, 'הבית', '🏠'], ['dog', 3050, 'המלונה', '🐶'], ['garden', 2620, 'הגינה', '🥕'], ['coop', 2170, 'הלול', '🐔'],
    ['pond', 1760, 'הבריכה', '🦆'], ['barn', 1330, 'הרפת', '🐄'], ['sheep', 900, 'הדיר', '🐑'], ['bunny', 560, 'פינת הליטוף', '🐰'], ['stable', 230, 'האורווה', '🐴']];
  function zone(id) { return ZONES.filter(function (z) { return z[0] === id; })[0]; }
  var Z = null;   // האזור הפעיל (בזום) או null

  /* ================= פרק 3 — זמן ומזג אוויר ================= */
  function hourNow() { if (ST.time === 'day') return 11; if (ST.time === 'night') return 22; var d = new Date(); return d.getHours() + d.getMinutes() / 60; }
  /* צבעי שמיים: [שעה, למעלה, למטה] — אינטרפולציה בין נקודות */
  var SKY = [[0, '#0b1a4a', '#2a1a6a'], [5, '#1d2a6a', '#4a3a8a'], [6.3, '#6a6ad0', '#ffb3a0'], [7.5, '#6ec3ff', '#d6f1ff'], [16.5, '#5fb8ff', '#d6f1ff'], [18.2, '#7a5ad0', '#ffb37a'], [19.3, '#2a2a7a', '#8a4a9a'], [20.5, '#0b1a4a', '#2a1a6a'], [24, '#0b1a4a', '#2a1a6a']];
  function skyAt(h) { for (var i = 0; i < SKY.length - 1; i++) if (h >= SKY[i][0] && h <= SKY[i + 1][0]) { var t = (h - SKY[i][0]) / (SKY[i + 1][0] - SKY[i][0]); return [mixC(SKY[i][1], SKY[i + 1][1], t), mixC(SKY[i][2], SKY[i + 1][2], t)]; } return [SKY[0][1], SKY[0][2]]; }
  function darkness(h) { if (h >= 7.5 && h <= 16.5) return 0; if (h > 20.5 || h < 5) return .55; if (h < 7.5) return .55 * (1 - (h - 5) / 2.5); return .55 * ((h - 16.5) / 4); }
  function isNight() { var h = hourNow(); return h >= 20.5 || h < 6; }
  var WEATHER = (function () { var k = dayKey(), s = 0; for (var i = 0; i < k.length; i++) s = (s * 31 + k.charCodeAt(i)) % 1000; return s % 100 < 58 ? 'sun' : s % 100 < 82 ? 'cloud' : 'rain'; })();
  function raining() { return WEATHER === 'rain' && (new Date().getMinutes() % 30) < 14; }
  function rainbow() { return WEATHER === 'rain' && !raining() && !isNight(); }

  /* ================= פרק 4 — ספרייטים ================= */
  var IMG = {};
  function art(type, o) {
    var key = type + JSON.stringify(o || {});
    if (IMG[key]) return IMG[key];
    var im = new Image(), s = FD.ART[type](o || {}).replace('<svg ', '<svg width="400" height="400" ');
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s); IMG[key] = im; return im;
  }
  var HIMG = null, HKEY = '';
  function horseImg() { if (!window.Horse) return null; var k = JSON.stringify([Horse.state.coat, Horse.state.mane, Horse.state.saddle, Horse.state.acc, Horse.state.braids, Horse.state.mud]); if (k !== HKEY) { HKEY = k; HIMG = new Image(); HIMG.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(Horse.svg({}).replace('<svg ', '<svg width="500" height="400" ')); } return HIMG; }
  var EMO = {};
  function emo(e) { if (EMO[e]) return EMO[e]; var c = document.createElement('canvas'); c.width = c.height = 160; var x = c.getContext('2d'); x.font = '128px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e, 80, 90); return (EMO[e] = c); }
  function drawEmo(c, e, x, y, sz, a) { if (a != null) c.globalAlpha = a; c.drawImage(emo(e), x - sz / 2, y - sz / 2, sz, sz); c.globalAlpha = 1; }

  /* ================= פרק 5 — נוף ================= */
  var T = 0;   // זמן מצטבר (שניות)
  function path(c, pts, fill, lw) { c.beginPath(); pts.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } c.lineWidth = lw || 5; c.strokeStyle = INK; c.stroke(); }
  function rrect(c, x, y, w, h, r, fill, lw) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } if (lw !== 0) { c.lineWidth = lw || 5; c.strokeStyle = INK; c.stroke(); } }
  function circle(c, x, y, r, fill, lw) { c.beginPath(); c.arc(x, y, r, 0, 7); if (fill) { c.fillStyle = fill; c.fill(); } if (lw !== 0) { c.lineWidth = lw || 5; c.strokeStyle = INK; c.stroke(); } }
  function ell(c, x, y, rx, ry, fill, lw) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); if (fill) { c.fillStyle = fill; c.fill(); } if (lw !== 0) { c.lineWidth = lw || 5; c.strokeStyle = INK; c.stroke(); } }
  var night = false, dark = 0;
  function win(c, x, y, w, h) { rrect(c, x, y, w, h, 6, night ? '#ffd97a' : '#9fe0ff'); if (night) { c.save(); c.globalAlpha = .35; var g = c.createRadialGradient(x + w / 2, y + h / 2, 4, x + w / 2, y + h / 2, w * 1.8); g.addColorStop(0, '#fff3a0'); g.addColorStop(1, 'rgba(255,243,160,0)'); c.fillStyle = g; c.fillRect(x - w * 1.5, y - h * 1.5, w * 4, h * 4); c.restore(); } c.beginPath(); c.moveTo(x + w / 2, y); c.lineTo(x + w / 2, y + h); c.moveTo(x, y + h / 2); c.lineTo(x + w, y + h / 2); c.lineWidth = 3; c.strokeStyle = INK; c.stroke(); }
  function drawSky(c, s) {
    var h = hourNow(), sk = skyAt(h), g = c.createLinearGradient(0, 0, 0, H * .72);
    g.addColorStop(0, sk[0]); g.addColorStop(1, sk[1]); c.fillStyle = g; c.fillRect(0, 0, W, H);
    /* כוכבים בלילה */
    if (dark > .2) { c.fillStyle = '#fff'; for (var i = 0; i < 90; i++) { var x = (i * 137.5) % W, y = (i * 71.3) % (H * .5), tw = .5 + .5 * Math.sin(T * 2 + i); c.globalAlpha = dark * 1.5 * tw; c.fillRect(x, y, 2.2, 2.2); } c.globalAlpha = 1; }
    /* שמש / ירח בקשת לפי השעה */
    var dayT = (h - 6) / 14, ang = Math.PI * (1 - dayT), R = Math.min(W, H) * .07;
    if (dayT > -0.05 && dayT < 1.05) { var sx = W / 2 + Math.cos(ang) * W * .42, sy = H * .62 - Math.sin(ang) * H * .5; var gg = c.createRadialGradient(sx, sy, R * .3, sx, sy, R * 3); gg.addColorStop(0, 'rgba(255,240,160,.9)'); gg.addColorStop(1, 'rgba(255,240,160,0)'); c.fillStyle = gg; c.fillRect(sx - R * 3, sy - R * 3, R * 6, R * 6); sunRays(c, sx, sy, Math.max(W, H) * .55); circle(c, sx, sy, R, '#ffe066', 0); c.lineWidth = 5; c.strokeStyle = 'rgba(27,16,54,.55)'; c.stroke(); }
    else { var nt = ((h + 24 - 20) % 24) / 10, a2 = Math.PI * (1 - nt), mx = W / 2 + Math.cos(a2) * W * .4, my = H * .6 - Math.sin(a2) * H * .45; circle(c, mx, my, R * .8, '#fff6c8', 0); circle(c, mx + R * .35, my - R * .2, R * .7, sk[0], 0); }
    if (rainbow()) { c.save(); c.globalAlpha = .45; ['#ff3b3b', '#ff8a3c', '#ffd93c', '#2fb85a', '#3d7bff', '#9b5cff'].forEach(function (col, i) { c.strokeStyle = col; c.lineWidth = H * .018; c.beginPath(); c.arc(W * .6 - cam.cx * s * .05, H * .78, H * (.52 - i * .018), Math.PI, 0); c.stroke(); }); c.restore(); }
  }
  /* layer — מצייר שכבת רקע בפרלקסה: f = מקדם תנועה (0 = קבוע, 1 = כמו העולם) */
  function hillsLayer(c, s, f, baseY, amp, col, seed, trees) {
    var ox = cam.cx * s * f, yB = H / 2 + (baseY - cam.cy) * s;
    var top = [];
    for (var x = 0; x <= W + 20; x += 16) { var wx = (x + ox) / (s * 1); top.push([x, yB - (Math.sin(wx / 230 + seed) * .6 + Math.sin(wx / 97 + seed * 2) * .4 + 1) * amp * s]); }
    c.fillStyle = col; c.beginPath(); c.moveTo(0, H); top.forEach(function (p) { c.lineTo(p[0], p[1]); }); c.lineTo(W, H); c.closePath(); c.fill();
    /* קומיקס: קו דיו על קו הרכס (הרסטר מצויר ב-CSS מעל הקנבס — זול יותר) */
    c.beginPath(); top.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.lineWidth = Math.max(2.5, 4 * s); c.strokeStyle = night ? 'rgba(10,10,40,.8)' : 'rgba(27,16,54,.7)'; c.lineJoin = 'round'; c.stroke();
    if (trees) { for (var i = -2; i < 30; i++) { var wx2 = Math.floor(ox / (s * 190)) * 190 + i * 190 + (seed * 50 % 90), tx = wx2 * s - ox, ty = yB - (Math.sin(wx2 / 230 + seed) * .6 + Math.sin(wx2 / 97 + seed * 2) * .4 + 1) * amp * s; if (tx < -60 || tx > W + 60) continue; c.fillStyle = INK; c.fillRect(tx - 3 * s, ty - 6 * s, 6 * s, 10 * s); c.fillStyle = trees; c.beginPath(); c.ellipse(tx, ty - 26 * s, 22 * s, 30 * s, 0, 0, 7); c.fill(); c.lineWidth = Math.max(2, 3 * s); c.strokeStyle = 'rgba(27,16,54,.6)'; c.stroke(); } }
  }
  function clouds(c, s) {
    var n = WEATHER === 'cloud' || raining() ? 9 : 5, col = raining() ? '#9aa6bd' : '#ffffff';
    for (var i = 0; i < n; i++) {
      var wx = ((i * 677 + T * (8 + i % 3 * 4)) % (VW + 800)) - 400, x = (wx - cam.cx * .25) * s + W / 2, y = H * (.1 + (i % 4) * .07), k = s * (0.8 + (i % 3) * .3);
      if (x < -300 || x > W + 300) continue;
      var B = [[0, 0, 42], [40, -16, 50], [86, 0, 40], [44, 10, 46]];
      /* ענן קומיקס: קו דיו עבה מסביב לאיחוד העיגולים, ואז מילוי וצל רסטר */
      c.fillStyle = '#3a2d5c'; c.beginPath(); B.forEach(function (b) { c.moveTo(x + b[0] * k + b[2] * k + 4.5, y + b[1] * k); c.arc(x + b[0] * k, y + b[1] * k, b[2] * k + 4.5, 0, 7); }); c.fill();
      c.fillStyle = col; c.beginPath(); B.forEach(function (b) { c.moveTo(x + b[0] * k + b[2] * k, y + b[1] * k); c.arc(x + b[0] * k, y + b[1] * k, b[2] * k, 0, 7); }); c.fill();
    }
  }
  /* מבנים (בקואורדינטות עולם) */
  function house(c) {
    var x = 3300, y = GROUND - 250;
    rrect(c, x, y + 60, 250, 190, 8, BOY ? '#bfe3ff' : '#ffb3de'); path(c, [[x - 24, y + 70], [x + 125, y - 50], [x + 274, y + 70]], BOY ? '#2f6bff' : '#9b5cff');   /* בית תכלת לבנים, ורוד לבנות */
    rrect(c, x + 180, y - 30, 34, 70, 4, '#c98b4f');
    win(c, x + 26, y + 100, 60, 50); win(c, x + 164, y + 100, 60, 50);
    rrect(c, x + 98, y + 150, 54, 100, 26, '#ff5ca8'); circle(c, x + 140, y + 205, 5, '#ffc93c', 3);
    rrect(c, x - 10, GROUND - 16, 270, 18, 6, '#c98b4f');                      /* מרפסת */
    ell(c, 3470, GROUND - 22, 44, 10, '#9fe0ff', 4);                           /* כרית לחתולה */
    c.font = '900 26px ' + FONT; c.textAlign = 'center'; c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = 6; var t = 'החווה של ' + kidName(); c.strokeText(t, x + 125, y + 50); c.fillText(t, x + 125, y + 50);
  }
  function market(c) { var x = 3610, y = GROUND - 180; rrect(c, x, y + 80, 180, 100, 6, '#c98b4f'); for (var i = 0; i < 6; i++) path(c, [[x - 10 + i * 33, y + 10], [x + 23 + i * 33, y + 10], [x + 20 + i * 33, y + 60], [x - 6 + i * 33, y + 60]], i % 2 ? '#ffffff' : '#ff3b3b', 4); rrect(c, x + 6, y + 60, 10, 120, 3, '#9c6b3f'); rrect(c, x + 164, y + 60, 10, 120, 3, '#9c6b3f'); ['🥚', '🥛', '🥕', '🧶'].forEach(function (e, i) { drawEmo(c, e, x + 30 + i * 40, y + 108, 36); }); }
  function doghouse(c) { var x = 2980, y = GROUND - 150; rrect(c, x, y + 50, 140, 100, 6, '#ffd93c'); path(c, [[x - 14, y + 56], [x + 70, y - 6], [x + 154, y + 56]], '#ff3b3b'); rrect(c, x + 44, y + 80, 52, 70, 26, '#3a2a4a'); c.font = '900 20px ' + FONT; c.textAlign = 'center'; c.fillStyle = INK; c.fillText(nm('dog'), x + 70, y + 68); ell(c, 3150, GROUND - 6, 26, 9, '#3d7bff', 4); }
  function garden(c) {
    for (var i = 0; i < 6; i++) { var x = 2460 + i * 64, p = ST.plots[i]; ell(c, x, GROUND + 26, 28, 12, '#8a5a32', 4); if (p) plant(c, x, GROUND + 20, p); }
    for (var f = 2420; f <= 2800; f += 34) { rrect(c, f, GROUND - 40, 10, 50, 4, '#ffffff', 3); } rrect(c, 2410, GROUND - 28, 400, 8, 3, '#ffffff', 3);
  }
  function stage(p) { var min = (Date.now() - p.at) / 60000 * (p.w ? 1.6 : 1); return min > 12 ? 3 : min > 6 ? 2 : min > 2 ? 1 : 0; }
  function plant(c, x, y, p) {
    var st = stage(p), crop = FD.CROPS[p.k], sway = Math.sin(T * 2 + x) * 3;
    if (st === 0) { circle(c, x, y, 4, '#5a3a1a', 0); return; }
    c.strokeStyle = '#2fb85a'; c.lineWidth = 5; c.lineCap = 'round';
    var h = [0, 16, 30, 40][st]; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + sway, y - h / 2, x + sway, y - h); c.stroke();
    [-1, 1].forEach(function (d) { c.fillStyle = '#8ee07a'; c.beginPath(); c.ellipse(x + d * 9 + sway, y - h * .6, 9 * st / 3 + 3, 5, d * .6, 0, 7); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke(); });
    if (st === 3) { drawEmo(c, crop[0], x + sway, y - h - 10, 34); if (Math.sin(T * 4 + x) > .9) drawEmo(c, '✨', x + 18, y - h - 20, 18); }
    if (p.w && (Date.now() - p.at) / 60000 < 14) { c.fillStyle = 'rgba(95,184,255,.45)'; c.beginPath(); c.ellipse(x, y + 6, 26, 8, 0, 0, 7); c.fill(); }
  }
  function coop(c) { var x = 2080, y = GROUND - 190; rrect(c, x + 10, y + 150, 10, 40, 3, '#9c6b3f'); rrect(c, x + 150, y + 150, 10, 40, 3, '#9c6b3f'); rrect(c, x, y + 50, 170, 104, 6, '#ff5ca8'); path(c, [[x - 12, y + 56], [x + 85, y - 4], [x + 182, y + 56]], '#ffd93c'); rrect(c, x + 66, y + 84, 40, 50, 20, '#3a2a4a'); path(c, [[x + 70, y + 134], [x + 40, GROUND], [x + 58, GROUND], [x + 100, y + 134]], '#c98b4f', 4);
    for (var i = 0; i < 6; i++) { var nx = 2050 + i * 46, has = i < eggsReady(); ell(c, nx, GROUND + 12, 20, 9, '#e8c070', 4); if (has) { ell(c, nx, GROUND + 2, 9, 12, '#fff8ee', 3); } }
    if (goldenReady()) { var gx = 2330, bob = Math.sin(T * 3) * 3; ell(c, gx, GROUND + 12, 22, 9, '#e8c070', 4); ell(c, gx, GROUND - 2 + bob, 12, 16, '#ffd93c', 4); drawEmo(c, '✨', gx + 16, GROUND - 22, 20, .6 + .4 * Math.sin(T * 5)); }
  }
  function pond(c) { var x = 1760, y = GROUND + 36; ell(c, x, y, 190, 44, '#5fb8ff'); c.save(); c.globalAlpha = .5; for (var i = 0; i < 3; i++) { var r = ((T * 20 + i * 30) % 90); ell(c, x - 60 + i * 60, y, r, r * .22, null, 2); } c.restore(); ell(c, x + 110, y + 6, 18, 6, '#2fb85a', 3); ell(c, x - 120, y - 6, 16, 5, '#2fb85a', 3); [[x - 200, 0], [x + 186, 1]].forEach(function (r) { for (var k = 0; k < 4; k++) { c.strokeStyle = '#1e7a44'; c.lineWidth = 5; c.beginPath(); c.moveTo(r[0] + k * 8, y + 10); c.quadraticCurveTo(r[0] + k * 8 + Math.sin(T + k) * 4, y - 40, r[0] + k * 8 - 4, y - 60 - k * 6); c.stroke(); } }); }
  function barn(c) { var x = 1190, y = GROUND - 250; rrect(c, x, y + 70, 280, 180, 6, '#ff3b3b'); path(c, [[x - 14, y + 78], [x + 30, y + 10], [x + 140, y - 30], [x + 250, y + 10], [x + 294, y + 78]], '#b0183d'); rrect(c, x + 90, y + 120, 100, 130, 4, '#ffffff'); c.beginPath(); c.moveTo(x + 90, y + 120); c.lineTo(x + 190, y + 250); c.moveTo(x + 190, y + 120); c.lineTo(x + 90, y + 250); c.lineWidth = 6; c.strokeStyle = INK; c.stroke(); circle(c, x + 140, y + 60, 22, '#fff3dc'); win(c, x + 20, y + 110, 48, 40); win(c, x + 212, y + 110, 48, 40); }
  function sheepPen(c) { for (var f = 760; f <= 1050; f += 36) rrect(c, f, GROUND - 50, 10, 70, 4, '#c98b4f', 3); rrect(c, 750, GROUND - 36, 310, 9, 3, '#c98b4f', 3); rrect(c, 750, GROUND - 6, 310, 9, 3, '#c98b4f', 3); }
  function bunnyCorner(c) { rrect(c, 430, GROUND - 90, 110, 80, 8, '#fff3dc'); path(c, [[422, GROUND - 86], [485, GROUND - 124], [548, GROUND - 86]], '#ff8fc4'); rrect(c, 462, GROUND - 60, 46, 50, 20, '#3a2a4a'); BUSHES.forEach(function (b, i) { var sh = bunnyGame.shake === i ? Math.sin(T * 40) * 4 : 0; circle(c, b + sh, GROUND + 4, 30, '#2fb85a'); circle(c, b - 20 + sh, GROUND + 12, 22, '#44b04f'); circle(c, b + 22 + sh, GROUND + 12, 22, '#44b04f'); }); }
  var BUSHES = [600, 680, 760];
  /* ballDraw — כדור טניס מצויר (האימוג'י 🎾 מופיע בחלק מהמכשירים עם מחבט) */
  function ballDraw(c, x, y, r) { circle(c, x, y, r, '#d8f03c', 3.5); c.beginPath(); c.arc(x - r * 1.1, y, r * .9, -.9, .9); c.moveTo(x + r * 1.1 + r * .9 * Math.cos(Math.PI - .9), y + r * .9 * Math.sin(Math.PI - .9)); c.arc(x + r * 1.1, y, r * .9, Math.PI - .9, Math.PI + .9); c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.stroke(); }
  /* park — "הגן הקסום": שביל אבנים ושלט; הקישוטים שנקנים מופיעים כאן */
  function park(c) {
    for (var i = 0; i < 9; i++) ell(c, 3860 + i * 56, GROUND + 40 + (i % 2) * 8, 22, 9, '#e8dcc8', 3);
    rrect(c, 3965, GROUND - 120, 10, 120, 3, '#9c6b3f'); rrect(c, 3900, GROUND - 150, 140, 44, 10, '#fff3dc', 3); c.font = '900 20px ' + FONT; c.textAlign = 'center'; c.fillStyle = INK; c.fillText('🎡 הגן הקסום', 3970, GROUND - 121);   /* השלט מימין לדוכן, לא עליו */
    if (ST.deco.filter(function (d) { return ['swing', 'fence', 'fountain', 'treehouse'].indexOf(d) >= 0; }).length === 0) { c.globalAlpha = .55; drawEmo(c, '🛒', 4100, GROUND - 60, 60); c.globalAlpha = 1; c.font = '800 18px ' + FONT; c.fillStyle = INK; c.fillText('קונים קישוטים בדוכן השוק', 4100, GROUND); }
  }
  function stable(c) { var x = 70, y = GROUND - 230; rrect(c, x, y + 60, 280, 170, 6, '#c98b4f'); path(c, [[x - 14, y + 68], [x + 140, y - 10], [x + 294, y + 68]], '#7a4a22'); for (var i = 0; i < 6; i++) rrect(c, x + 10 + i * 46, y + 70, 6, 150, 2, '#9c6b3f', 0); rrect(c, x + 100, y + 110, 80, 120, 4, '#5a3a1a'); c.font = '900 22px ' + FONT; c.textAlign = 'center'; c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = 5; c.strokeText('🐴 ' + (window.Horse ? Horse.state.name : ''), x + 140, y + 100); c.fillText('🐴 ' + (window.Horse ? Horse.state.name : ''), x + 140, y + 100); }
  /* decoDraw(c, back) — back=true: קישוטים גבוהים שמאחורי המבנים (טחנה, בית עץ); false: כל השאר מלפנים */
  function decoDraw(c, back) {
    FD.DECO.forEach(function (d) {
      if (ST.deco.indexOf(d[0]) < 0) return;
      if ((d[0] === 'windmill' || d[0] === 'treehouse') !== back) return;
      var x = d[4], y = GROUND - 6;
      if (d[0] === 'windmill') { rrect(c, x - 22, y - 180, 44, 180, 6, '#fff3dc'); c.save(); c.translate(x, y - 180); c.rotate(T * .8); for (var i = 0; i < 4; i++) { c.rotate(Math.PI / 2); rrect(c, -8, -110, 16, 100, 4, '#ff8fc4', 4); } c.restore(); circle(c, x, y - 180, 10, '#ffd93c'); }
      else if (d[0] === 'fountain') { ell(c, x, y, 70, 18, '#9fe0ff'); rrect(c, x - 10, y - 60, 20, 60, 4, '#c9d2de'); for (var k = 0; k < 8; k++) { var tt = (T * 1.4 + k / 8) % 1; circle(c, x + Math.cos(k) * 40 * tt, y - 60 - Math.sin(tt * Math.PI) * 50, 4, '#9fe0ff', 0); } }
      else if (d[0] === 'swing') { rrect(c, x - 60, y - 150, 10, 150, 3, '#9c6b3f'); rrect(c, x + 50, y - 150, 10, 150, 3, '#9c6b3f'); rrect(c, x - 64, y - 156, 128, 10, 3, '#9c6b3f'); var sw = Math.sin(T * 1.6) * .25; c.save(); c.translate(x, y - 146); c.rotate(sw); c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(-26, 0); c.lineTo(-26, 110); c.moveTo(26, 0); c.lineTo(26, 110); c.stroke(); rrect(c, -34, 106, 68, 12, 4, '#ff5ca8', 4); c.restore(); }
      else if (d[0] === 'treehouse') { rrect(c, x - 16, y - 160, 32, 160, 6, '#9c6b3f'); circle(c, x, y - 220, 90, '#2fb85a'); rrect(c, x - 60, y - 200, 120, 70, 6, '#ffd93c'); path(c, [[x - 70, y - 196], [x, y - 246], [x + 70, y - 196]], '#ff3b3b'); win(c, x - 20, y - 186, 40, 32); }
      else if (d[0] === 'fence') { ['#ff3b3b', '#ff8a3c', '#ffd93c', '#2fb85a', '#3d7bff', '#9b5cff'].forEach(function (col, i) { rrect(c, x - 110 + i * 40, y - 60, 22, 64, 6, col, 4); }); }
      else if (d[0] === 'balloons') { ['#ff5ca8', '#ffd93c', '#3fe0c5'].forEach(function (col, i) { var bx = x - 30 + i * 30, by = y - 150 - i * 16 + Math.sin(T * 2 + i) * 6; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(bx, by + 30); c.lineTo(x, y - 20); c.stroke(); ell(c, bx, by, 22, 28, col, 4); }); rrect(c, x - 10, y - 24, 20, 24, 4, '#c98b4f', 3); }
      else drawEmo(c, d[1], x, y - 50, d[0] === 'flowers' ? 90 : 110);
    });
  }
  function grassFront(c, s) {
    var ox = cam.cx * s * 1.12, yB = H + 6;
    for (var x = -20; x < W + 20; x += 14) { var wx = x + ox, sw = Math.sin(T * 1.8 + wx / 60) * 6 * s, h = (26 + (wx * 7 % 22)) * s; c.strokeStyle = (wx | 0) % 3 ? '#4fbf5a' : '#2fb85a'; c.lineWidth = 5 * s * .6 + 2; c.beginPath(); c.moveTo(x, yB); c.quadraticCurveTo(x + sw * .5, yB - h * .5, x + sw, yB - h); c.stroke(); }
  }
  var FONT = '"Rubik","Varela Round","Heebo",sans-serif';
  function kidName() { try { return (window.Profile && Profile.active && Profile.active.name) || KID; } catch (e) { return KID; } }

  /* ================= פרק 6 — חיות ================= */
  var AN = [];
  /* ent: { t: סוג, x, y, home:[x0,x1], st, tt (טיימר מצב), tx, flip, blink, wag, jump, roll, size, id } */
  function add(t, x, y, home, size, extra) { var a = Object.assign({ t: t, x: x, y: y, home: home, st: 'idle', tt: rnd(1, 3), tx: x, flip: false, blink: 0, bt: rnd(2, 5), wag: 0, jz: 0, vz: 0, roll: 0, size: size, happy: 0 }, extra || {}); AN.push(a); return a; }
  function setupAnimals() {
    AN = [];
    add('dog', 3120, GROUND + 4, [2900, 3300], 150, { id: 'dog' });
    add('cat', 3470, GROUND - 22, [3330, 3560], 118, { id: 'cat' });
    add('chicken', 2140, GROUND + 30, [1990, 2300], 96, { id: 'hen1' }); add('chicken', 2240, GROUND + 40, [1990, 2330], 90, { id: 'hen2', col: '#c98b4f' });
    for (var i = 0; i < Math.min(6, ST.chicks); i++) add('chick', 2100 + i * 30, GROUND + 50, [1990, 2330], 52, { id: 'chick' + i });
    add('duck', 1700, GROUND + 30, [1620, 1900], 92, { id: 'duck1', swim: true }); add('duck', 1820, GROUND + 44, [1620, 1900], 80, { id: 'duck2', swim: true });
    add('cow', 1330, GROUND + 20, [1200, 1480], 190, { id: 'cow' });
    add('sheep', 880, GROUND + 14, [780, 1020], 140, { id: 'sheep' });
    add('bunny', 560, GROUND + 30, [430, 800], 96, { id: 'bunny' });
  }
  function byId(id) { return AN.filter(function (a) { return a.id === id; })[0]; }
  function opts(a) {
    var o = {}, blink = a.blink > 0 || (night && a.st === 'sleep');
    if (blink) o.blink = 1; if (a.st === 'sleep') o.sleep = 1;
    if (a.happy > 0 && !blink) o.happy = 1;
    if (a.t === 'dog' || a.t === 'cat') { o.tail = a.happy > 0 || a.st === 'walk' || a.st === 'run' ? (Math.sin(T * (a.happy > 0 ? 18 : 6)) > 0 ? 1 : -1) : 0; }
    if (a.t === 'chicken' && a.col) o.col = a.col;
    if (a.t === 'cow') o.udder = Z && Z[0] === 'barn' ? 1 : 0;
    if (a.t === 'sheep') o.shorn = sheepShorn() ? 1 : 0;
    if (a.t === 'cat') o.bow = BOY ? null : '#ff5ca8';
    var sc = ST.scarf[a.id]; if (sc) o.scarf = sc;
    return o;
  }
  function updAnimal(a, dt) {
    a.tt -= dt; a.bt -= dt; if (a.blink > 0) a.blink -= dt; if (a.happy > 0) a.happy -= dt;
    if (a.bt <= 0) { a.blink = .14; a.bt = rnd(2.2, 5.5); }
    if (a.jz > 0 || a.vz > 0) { a.vz -= 1600 * dt; a.jz = Math.max(0, a.jz + a.vz * dt); if (a.jz === 0) a.vz = 0; }
    if (a.roll > 0) a.roll = Math.max(0, a.roll - dt);
    if (a.ctl) return;                                                 /* בשליטת אינטראקציה (כדור, טריק וכו') */
    if (night && a.st !== 'sleep' && !a.awake) { a.st = 'sleep'; }
    if (!night && a.st === 'sleep') a.st = 'idle';
    if (a.awake > 0) { a.awake -= dt; if (a.awake <= 0) a.awake = 0; }
    if (a.st === 'sleep') { if (Math.random() < dt * .6) parts.push({ e: '💤', x: a.x + 20, y: a.y - a.size * .9, vx: 10, vy: -26, life: 1.8, sz: 26 }); return; }
    if (a.st === 'idle' && a.tt <= 0) { a.tx = rnd(a.home[0], a.home[1]); a.st = 'walk'; a.tt = rnd(3, 7); }
    if (a.st === 'walk' || a.st === 'run' || a.st === 'go') {
      var sp = a.st === 'run' || a.st === 'go' ? 260 : (a.t === 'cow' ? 30 : a.t === 'duck' ? 45 : 60), d = a.tx - a.x;
      if (Math.abs(d) < 6) { a.st = 'idle'; a.tt = rnd(2, 5); if (a.onArrive) { var f = a.onArrive; a.onArrive = null; f(a); } }
      else { a.x += Math.sign(d) * Math.min(Math.abs(d), sp * dt); a.flip = d < 0; if (a.t === 'bunny' && a.jz === 0) { a.vz = 320; a.jz = .1; } }
    }
  }
  function drawAnimal(c, a) {
    var im = art(a.t, opts(a)); if (!im.complete || !im.naturalWidth) return;
    var moving = a.st === 'walk' || a.st === 'run' || a.st === 'go', bob = moving && !a.swim ? Math.abs(Math.sin(T * (a.st === 'walk' ? 9 : 16))) * 7 : a.swim ? Math.sin(T * 2 + a.x) * 3 : 0;
    var sq = a.jz > 0 ? 1.06 : a.st === 'sit' ? .86 : 1 + Math.sin(T * 3 + a.x) * .012, sz = a.size;
    c.save(); c.translate(a.x, a.y - a.jz - bob);
    if (a.roll > 0) c.rotate((1 - a.roll) * Math.PI * 2 * (a.flip ? -1 : 1));
    c.scale(a.flip ? -1 : 1, 1); c.scale(1 / Math.sqrt(sq), sq);
    c.drawImage(im, -sz / 2, -sz * (a.roll > 0 ? .5 : 1), sz, sz);
    c.restore();
    if (a.hearts) { a.hearts -= 1; if (a.hearts % 6 === 0) parts.push({ e: '💖', x: a.x + rnd(-20, 20), y: a.y - sz * .8, vx: rnd(-20, 20), vy: -60, life: 1.2, sz: 30 }); }
    if (a.id === 'dog' && dog.ball && dog.ball.held) ballDraw(c, a.x + (a.flip ? -12 : 12), a.y - sz * .36 - a.jz - bob, 13);
  }

  /* ================= פרק 7 — חלקיקים ================= */
  var parts = [], rain = [];
  function updParts(dt) {
    parts.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; if (p.g) p.vy += p.g * dt; p.life -= dt; }); parts = parts.filter(function (p) { return p.life > 0; });
    /* פרפרים ביום, גחליליות בלילה */
    if (!raining() && Math.random() < dt * (night ? 3 : 1)) { var vx = cam.cx + rnd(-viewW() / 2, viewW() / 2); parts.push({ e: night ? 'fly' : '🦋', x: vx, y: GROUND - rnd(40, 220), vx: rnd(-30, 30), vy: rnd(-10, 10), life: rnd(4, 7), sz: 30, wob: rnd(0, 6) }); }
    if (raining()) { for (var i = 0; i < 6; i++) rain.push({ x: rnd(0, W), y: -10, v: rnd(700, 1000) }); }
    rain.forEach(function (r) { r.y += r.v * dt; r.x -= 80 * dt; }); rain = rain.filter(function (r) { return r.y < H; }).slice(-400);
    /* עשן מהארובה */
    if (Math.random() < dt * 2.5) parts.push({ smoke: 1, x: 3497, y: GROUND - 290, vx: rnd(4, 14), vy: -30, life: 3.2, sz: 16 });
  }
  function drawParts(c) {
    parts.forEach(function (p) {
      var a = Math.min(1, p.life);
      if (p.smoke) { c.globalAlpha = a * .45; circle(c, p.x, p.y, p.sz * (1.8 - p.life * .3), '#ffffff', 0); c.globalAlpha = 1; return; }
      if (p.e === 'fly') { var tw = .5 + .5 * Math.sin(T * 6 + p.wob); c.globalAlpha = a * tw; var g = c.createRadialGradient(p.x, p.y, 1, p.x, p.y, 14); g.addColorStop(0, '#fff9a0'); g.addColorStop(1, 'rgba(255,249,160,0)'); c.fillStyle = g; c.fillRect(p.x - 14, p.y - 14, 28, 28); c.globalAlpha = 1; p.vy += Math.sin(T * 3 + p.wob) * 2; return; }
      if (p.e === '🦋') p.vy = Math.sin(T * 5 + p.wob) * 30;
      drawEmo(c, p.e, p.x, p.y, p.sz, a);
    });
  }

  /* ================= פרק 8 — אזורים ואינטראקציות ================= */
  /* --- כלבלב: כדור (גוררים וזורקים), טריקים, ליטוף --- */
  var dog = { ball: null };
  function throwBall(x, y, vx, vy) {
    var d = byId('dog'); if (!d || d.st === 'sleep' && night && !d.awake) { wake(d); }
    dog.ball = { x: x, y: y, vx: vx, vy: vy, held: false, ground: false }; snd('pop'); sayEn('Fetch!');
  }
  function updBall(dt) {
    var b = dog.ball, d = byId('dog'); if (!b || !d) return;
    if (b.held) return;
    if (!b.ground) { b.vy += 1400 * dt; b.x += b.vx * dt; b.y += b.vy * dt; if (b.y >= GROUND + 10) { b.y = GROUND + 10; b.vy *= -.45; b.vx *= .7; if (Math.abs(b.vy) < 80) { b.ground = true; b.vy = 0; } } b.x = Math.max(2860, Math.min(3380, b.x)); }
    d.ctl = true;
    if (Math.abs(d.x - b.x) > 10) { d.x += Math.sign(b.x - d.x) * Math.min(Math.abs(b.x - d.x), 330 * dt); d.flip = b.x < d.x; d.st = 'run'; }
    else if (b.ground) { b.held = true; d.st = 'run'; var home = 3050 + rnd(-40, 40);
      var back = function () { d.ctl = false; d.tx = home; d.st = 'go'; d.onArrive = function () { dog.ball = null; d.happy = 2; d.hearts = 24; d.st = 'idle'; sayEn('Good dog!'); snd('happy'); prog('fetch'); }; };
      back(); }
  }
  function doTrick(id) {
    var d = byId('dog'), t = FD.TRICKS.filter(function (x) { return x[0] === id; })[0]; if (!d || d.busy) return; wake(d);
    var n = ST.tricks[id] || 0, ok = Math.random() < Math.min(1, .45 + n * .18);
    d.busy = true; d.ctl = true; d.st = 'idle'; sayEn(t[3]);
    setTimeout(function () {
      var doing = ok ? id : FD.TRICKS[(FD.TRICKS.indexOf(t) + 1 + ((Math.random() * 3) | 0)) % 4][0];
      if (!ok && Math.random() < .4) doing = 'confused';
      if (doing === 'sit') d.st = 'sit'; else if (doing === 'paw') { d.st = 'sit'; d.vz = 200; d.jz = .1; } else if (doing === 'roll') d.roll = 1; else if (doing === 'jump') { d.vz = 700; d.jz = .1; }
      else parts.push({ e: '❓', x: d.x, y: d.y - d.size, vx: 0, vy: -30, life: 1.4, sz: 44 });
      setTimeout(function () {
        d.st = 'idle'; d.busy = false; d.ctl = false;
        if (ok) { ST.tricks[id] = n + 1; save(); d.happy = 2; d.hearts = 24; snd('happy'); prog('trick');
          var learned = ST.tricks[id] === 5; say(learned ? nm('dog') + ' למד' + (BOY ? '' : 'ה') + ' את "' + t[2] + '"! טריק חדש! ⭐' : 'כל הכבוד! ' + nm('dog') + ' עשה ' + t[2] + '!'); if (learned) { try { HeroRewards.confetti(); } catch (e) {} } panel(); }
        else say('כמעט! ' + nm('dog') + ' עוד לומד. מנסים שוב — כל ניסיון מלמד אותו!');
      }, 1100);
    }, 450);
  }
  /* --- ליטוף (שפשוף על חיה) --- */
  var pet = { a: null, acc: 0 };
  function petMove(a, d) {
    pet.acc += d; if (Math.random() < .15) parts.push({ e: a.t === 'sheep' && !sheepShorn() ? '☁️' : '💖', x: a.x + rnd(-30, 30), y: a.y - a.size * rnd(.4, .9), vx: rnd(-30, 30), vy: -70, life: 1, sz: 26 });
    a.happy = 1.2;
    if (a.t === 'cat') { purr(pet.acc > 900); if (pet.acc > 1400 && !pet.done) { pet.done = 1; say(nm('cat') + ' מגרגר' + (BOY ? '' : 'ת') + '... היא ממש אוהבת את זה!'.replace('היא', BOY ? 'הוא' : 'היא')); prog('petcat'); a.hearts = 40; } }
    if (a.t === 'sheep' && !sheepShorn()) { if (pet.acc > 1800) { ST.shornAt = Date.now(); ST.inv.wool += 2; save(); for (var i = 0; i < 14; i++) parts.push({ e: '☁️', x: a.x, y: a.y - 70, vx: rnd(-200, 200), vy: rnd(-300, -100), g: 400, life: 1.6, sz: 30 }); fly('🧶', 2); teach('wool', 'צמר! קיבלנו 2 צמר'); prog('wool'); pet.acc = 0; panel(); } }
    if (a.t === 'dog' && pet.acc > 1200 && !pet.done) { pet.done = 1; sayEn('Good dog!'); a.hearts = 30; }
    if (a.t === 'bunny' || a.t === 'cow' || a.t === 'chicken') { if (pet.acc > 900 && !pet.done) { pet.done = 1; sayEn(FD.ANIMALS[a.t === 'chicken' ? 'chicken' : a.t][1]); a.hearts = 24; } }
  }
  var purrNode = null;
  function purr(on) {
    try { if (!on) return; if (navigator.vibrate) navigator.vibrate([12, 40, 12]); var A = actx(); if (!A || purrNode) return;
      var o = A.createOscillator(), l = A.createOscillator(), lg = A.createGain(), g = A.createGain(); o.type = 'sawtooth'; o.frequency.value = 55; l.frequency.value = 24; lg.gain.value = .05; l.connect(lg); lg.connect(g.gain); g.gain.value = .05;
      var f = A.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 300; o.connect(f); f.connect(g); g.connect(A.destination); o.start(); l.start(); purrNode = o; setTimeout(function () { try { o.stop(); l.stop(); } catch (e) {} purrNode = null; }, 900); } catch (e) {}
  }
  var AC = null; function actx() { if (!AC) try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} if (AC && AC.state === 'suspended') AC.resume(); return AC; }
  /* --- חתולה: חוט צמר שעוקב אחרי האצבע --- */
  var yarn = null;
  /* --- לול --- */
  function eggsReady() { return Math.min(6, Math.floor((Date.now() - ST.eggsAt) / (40 * 60000))); }
  function goldenReady() { return ST.hatchDay !== dayKey() && ST.chicks < 6; }
  var eggCount = 0;
  function collectEgg(i) {
    var n = eggsReady(); if (i >= n) return;
    ST.eggsAt += 40 * 60000; ST.inv.egg++; eggCount++; save();
    var nums = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'], he = ['אחת', 'שתיים', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע', 'עשר'];
    fly('🥚', 1); snd('bubble'); if (eggCount <= 10) teach(nums[eggCount - 1], 'ביצה ' + he[eggCount - 1] + '!');
    prog('egg'); var h = byId('hen1'); if (h) { h.happy = 1.5; h.vz = 260; h.jz = .1; }
  }
  var hatch = { t: 0 };
  function hatchTick(dt) {
    if (!hatch.on) return; hatch.t = (performance.now() - hatch.t0) / 1000;   /* זמן אמיתי — לא תלוי בקצב הפריימים */
    if (Math.random() < .3) parts.push({ e: '✨', x: 2330 + rnd(-20, 20), y: GROUND - 20, vx: rnd(-30, 30), vy: -50, life: .8, sz: 20 });
    if (hatch.t > 2) { hatch.on = false; ST.hatchDay = dayKey(); ST.chicks++; save(); add('chick', 2330, GROUND + 50, [1990, 2330], 52, { id: 'chick' + ST.chicks, happy: 3 }); for (var i = 0; i < 16; i++) parts.push({ e: i % 2 ? '✨' : '🐣', x: 2330, y: GROUND - 10, vx: rnd(-200, 200), vy: rnd(-300, -80), g: 500, life: 1.4, sz: 28 }); say('אפרוח חדש בקע! ברוך הבא לחווה! 🐣'); snd('unlock'); try { HeroRewards.confetti(); } catch (e) {} panel(); }
  }
  /* --- פרה: חליבה בקצב — נוגעים לסירוגין בצד ימין ושמאל של העטין --- */
  var milk = { n: 0, side: 0, drops: 0 };
  function milkReady() { return Date.now() - ST.milkAt > 60 * 60000; }
  function squeeze(side) {
    if (!milkReady()) { var m = Math.ceil((60 * 60000 - (Date.now() - ST.milkAt)) / 60000); say(nm('cow') + ' צריכה לנוח. עוד ' + m + ' דקות יהיה חלב!'); return; }
    if (side === milk.side) { tap(300); return; }                     /* צריך לסירוגין */
    milk.side = side; milk.n++; tap(500 + milk.n * 30); parts.push({ e: '💧', x: 1330 + (side < 0 ? -12 : 12), y: GROUND - 20, vx: 0, vy: 200, g: 600, life: .5, sz: 20 });
    if (milk.n >= 10) { milk.n = 0; ST.milkAt = Date.now(); ST.inv.milk++; save(); fly('🥛', 1); sayEn('Moo!'); setTimeout(function () { teach('milk', 'חלב! תודה ' + nm('cow') + '!'); }, 700); prog('milk'); var c = byId('cow'); if (c) { c.happy = 2; c.hearts = 24; } panel(); }
    panel(true);
  }
  function sheepShorn() { return ST.shornAt && Date.now() - ST.shornAt < 2 * 3600e3; }
  /* --- גינה --- */
  var gardenTool = 'carrot';
  function plotAt(x) { for (var i = 0; i < 6; i++) if (Math.abs(x - (2460 + i * 64)) < 30) return i; return -1; }
  function useGarden(i) {
    var p = ST.plots[i];
    if (gardenTool === 'water') { if (!p) { say('קודם שותלים זרע 🌱'); return; } p.w = 1; save(); for (var k = 0; k < 8; k++) parts.push({ e: '💧', x: 2460 + i * 64 + rnd(-20, 20), y: GROUND - 60, vx: rnd(-20, 20), vy: 100, g: 400, life: .7, sz: 18 }); snd('bubble'); prog('water'); say('משקים! הצמח יגדל מהר יותר'); return; }
    if (p && stage(p) === 3) { var cr = FD.CROPS[p.k]; ST.inv[p.k]++; ST.plots[i] = null; save(); fly(cr[0], 1); teach(cr[2], cr[1] + '!'); snd('pop'); prog('harvest'); panel(); return; }
    if (p) { var st = stage(p), left = Math.max(1, Math.ceil([2, 6, 12][st] / (p.w ? 1.6 : 1) - (Date.now() - p.at) / 60000)); say(['זרע באדמה', 'נבט קטן', 'כמעט מוכן'][st] + '! עוד בערך ' + left + ' דקות.' + (p.w ? '' : ' השקיה תעזור!')); return; }
    ST.plots[i] = { k: gardenTool, at: Date.now(), w: raining() ? 1 : 0 }; save(); snd('pop'); say('שתלנו ' + FD.CROPS[gardenTool][1] + '! 🌱');
  }
  /* --- בריכה: לחם לברווזים --- */
  var crumbs = [];
  function throwBread(x) { crumbs.push({ x: x, y: GROUND + 30 }); snd('pop'); ['duck1', 'duck2'].forEach(function (id, i) { var d = byId(id); if (!d) return; d.ctl = false; d.tx = x + (i ? 30 : -30); d.st = 'walk'; d.onArrive = function () { crumbs = crumbs.filter(function (c) { return Math.abs(c.x - x) > 60; }); d.happy = 1.5; sayEn('Quack!'); if (!crumbs.length) prog('ducks'); }; }); }
  /* --- ארנבון: מחבואים — הגזר מוחבא מתחת לאחד השיחים --- */
  var bunnyGame = { hid: (Math.random() * 3) | 0, shake: -1, found: false };
  function checkBush(i) {
    var b = byId('bunny'); if (!b) return; wake(b); b.tx = BUSHES[i]; b.st = 'walk'; bunnyGame.shake = i;
    b.onArrive = function () {
      bunnyGame.shake = -1;
      if (i === bunnyGame.hid && !bunnyGame.found) { bunnyGame.found = true; for (var k = 0; k < 10; k++) parts.push({ e: k ? '✨' : '🥕', x: BUSHES[i], y: GROUND - 20, vx: rnd(-120, 120), vy: rnd(-260, -120), g: 400, life: 1.3, sz: k ? 22 : 50 }); b.happy = 3; b.hearts = 30; say('מצאנו את הגזר! ' + nm('bunny') + ' ממש שמח' + (BOY ? '' : 'ה') + '!'); sayEn('Hop hop!'); prog('bunny'); setTimeout(function () { bunnyGame = { hid: (Math.random() * 3) | 0, shake: -1, found: false }; }, 4000); }
      else if (!bunnyGame.found) { say('לא כאן... מנסים שיח אחר!'); tap(260); }
    };
  }
  function wake(a) { if (!a) return; if (a.st === 'sleep') { a.st = 'idle'; a.awake = 25; parts.push({ e: '😮', x: a.x, y: a.y - a.size, vx: 0, vy: -30, life: 1, sz: 34 }); } else a.awake = 25; }
  /* fly — אימוג'י שעף אל מונה המלאי למעלה */
  function fly(e, n) { for (var i = 0; i < n; i++) { var d = el('div', 'flyto', e), r = cv.getBoundingClientRect(); d.style.left = W / 2 + 'px'; d.style.top = H / 2 + 'px'; document.body.appendChild(d); (function (d, i) { setTimeout(function () { var t = $('invBar').getBoundingClientRect(); d.style.transform = 'translate(' + (t.left + t.width / 2 - W / 2) + 'px,' + (t.top - H / 2) + 'px) scale(.5)'; d.style.opacity = '.2'; }, 30 + i * 120); setTimeout(function () { d.remove(); inv(); }, 900 + i * 120); })(d, i); } }

  /* ================= פרק 9 — משימות, שוק, אלבום, מחיאת כף, שמות ================= */
  function chores() {
    var k = dayKey(), C = ST.chores;
    if (C.day !== k) { var yest = new Date(); yest.setDate(yest.getDate() - 1); C.streak = C.last === dayKey(yest) ? C.streak : 0; C.day = k; C.prog = {}; C.done = 0; save(); }
    return FD.choresFor(k);
  }
  function prog(ev) {
    track('farm:act');   // כל פעולת טיפול בחיה נספרת בדוח ההורים
    learnTip(ev);        // פרק 12: כל כמה פעולות — "הידעת?" קטן על הטיפול שעשינו
    var list = chores(), C = ST.chores, before = C.done;
    list.forEach(function (ch) { if (ch[1] === ev) C.prog[ch[0]] = Math.min(ch[2], (C.prog[ch[0]] || 0) + 1); });
    C.done = list.filter(function (ch) { return (C.prog[ch[0]] || 0) >= ch[2]; }).length;
    if (C.done > before) { snd('ding'); toast('✅ משימה הושלמה! ' + C.done + '/3'); }
    if (C.done === 3 && before < 3) { C.streak++; C.last = dayKey(); try { Wallet.add(5); HeroRewards.confetti(); HeroRewards.award(2, $('choresBtn'), { word: 'יום חווה מושלם!' }); } catch (e) {} say('כל משימות הבוקר הושלמו! ' + C.streak + ' ימים ברצף! קיבלת 5 מטבעות'); track('farm:chores'); }
    save(); hud();
  }
  function openChores() {
    var list = chores(), C = ST.chores, box = $('choresList'); box.innerHTML = '';
    list.forEach(function (ch) { var p = C.prog[ch[0]] || 0, done = p >= ch[2]; box.appendChild(el('div', 'chore' + (done ? ' done' : ''), '<span>' + (done ? '✅' : '⬜') + ' ' + ch[3] + '</span><em><i style="width:' + (p / ch[2] * 100) + '%"></i></em><b>' + p + '/' + ch[2] + '</b>')); });
    $('choresStreak').textContent = C.streak ? '🔥 ' + C.streak + ' ימים ברצף' : 'מתחילים רצף חדש היום!';
    $('choresOv').classList.add('show'); say('משימות הבוקר: ' + list.map(function (c) { return c[3].replace(/[^֐-׿0-9 ]/g, ''); }).join('. '));
  }
  function openMarket() {
    var box = $('marketBox'); box.innerHTML = '<h4>🧺 למכור מהחווה</h4>'; var r = el('div', 'mrow');
    Object.keys(FD.GOODS).forEach(function (k) {
      var n = ST.inv[k] || 0, g = FD.GOODS[k], b = el('button', 'mb' + (n ? '' : ' off'), '<b>' + g[0] + '</b><span>' + g[1] + ' ×' + n + '</span><small>🪙 ' + FD.PRICES[k] + ' ליחידה</small>'); b.type = 'button';
      b.addEventListener('click', function () { if (!n) { say('עוד אין ' + g[1] + '. אוספים בחווה!'); return; } var got = n * FD.PRICES[k]; ST.inv[k] = 0; save(); try { Wallet.add(got); } catch (e) {} snd('ding'); say('מכרנו ' + g[1] + ' וקיבלנו ' + got + ' מטבעות!'); openMarket(); hud(); inv(); });
      r.appendChild(b);
    });
    box.appendChild(r);
    if ((ST.inv.milk || 0) >= 3) { var ch = el('button', 'h-btn gold', '🧀 להכין גבינה משלושה חלב'); ch.type = 'button'; ch.addEventListener('click', function () { ST.inv.milk -= 3; ST.inv.cheese++; save(); snd('unlock'); teach('cheese', 'גבינה!'); openMarket(); inv(); }); box.appendChild(ch); }
    box.appendChild(el('h4', '', '🎀 קישוטים לחווה')); var r2 = el('div', 'mrow');
    FD.DECO.forEach(function (d) {
      var own = ST.deco.indexOf(d[0]) >= 0, b = el('button', 'mb' + (own ? ' own' : ''), '<b>' + d[1] + '</b><span>' + d[2] + '</span><small>' + (own ? '✔ בחווה' : '🪙 ' + d[3]) + '</small>'); b.type = 'button';
      b.addEventListener('click', function () { if (own) { go(d[4]); closeOv('marketOv'); return; } var have = 0; try { have = Wallet.coins; } catch (e) {} if (have < d[3] || !Wallet.spend(d[3])) { say('צריך עוד ' + (d[3] - have) + ' מטבעות. מוכרים ביצים, חלב וצמר!'); tap(250); return; } ST.deco.push(d[0]); save(); snd('unlock'); say(d[2] + ' חדש' + (/ה$|ת$/.test(d[2]) ? 'ה' : '') + ' בחווה!'); try { HeroRewards.confetti(); } catch (e) {} closeOv('marketOv'); unzoom(); go(d[4]); hud(); });
      r2.appendChild(b);
    });
    box.appendChild(r2); $('coinsBig').textContent = '🪙 ' + coins(); $('marketOv').classList.add('show');
  }
  function coins() { try { return Wallet.coins; } catch (e) { return 0; } }
  function snapshot() {
    var f = el('div', 'flash'); document.body.appendChild(f); setTimeout(function () { f.remove(); }, 500); snd('pop');
    try { var w = 720, h = Math.round(720 * H / W), c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(cv, 0, 0, w, h); ST.album.unshift({ t: Date.now(), data: c.toDataURL('image/jpeg', .8) }); ST.album = ST.album.slice(0, 8); save(); toast('📸 נשמר באלבום החווה!'); } catch (e) {}
  }
  function openAlbum() {
    var box = $('albumGrid'); box.innerHTML = ST.album.length ? '' : '<p>עוד אין תמונות. לוחצים 📸 ברגע מצחיק!</p>';
    ST.album.forEach(function (it, i) { var b = el('button', 'alb'); b.type = 'button'; var im = new Image(); im.src = it.data; b.appendChild(im); b.addEventListener('click', function () { if (window.Share && Share.shareDrawing) Share.shareDrawing({ type: 'img', data: it.data }); }); box.appendChild(b); });
    $('albumOv').classList.add('show');
  }
  var mic = null;
  function clapCall() {
    if (mic) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { say('המכשיר הזה לא תומך במיקרופון'); return; }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      var A = actx(), src = A.createMediaStreamSource(stream), an = A.createAnalyser(); an.fftSize = 512; src.connect(an); var data = new Uint8Array(an.fftSize), end = Date.now() + 20000;
      mic = { stream: stream }; $('clapBtn').classList.add('on'); say('מוחאים כף — ו' + nm('dog') + ' בא' + (BOY ? '' : 'ה') + ' בריצה!');
      (function listen() { if (!mic) return; an.getByteTimeDomainData(data); var pk = 0; for (var i = 0; i < data.length; i++) pk = Math.max(pk, Math.abs(data[i] - 128)); if (pk > 70 && !mic.cool) { mic.cool = true; setTimeout(function () { if (mic) mic.cool = false; }, 1500); callDog(); } if (Date.now() > end) stopMic(); else requestAnimationFrame(listen); })();
    }).catch(function () { say('צריך אישור של הורה כדי להשתמש במיקרופון'); });
  }
  function stopMic() { if (!mic) return; mic.stream.getTracks().forEach(function (t) { t.stop(); }); mic = null; $('clapBtn').classList.remove('on'); }
  function callDog() { var d = byId('dog'); if (!d) return; wake(d); d.ctl = false; d.tx = Math.max(60, Math.min(VW - 60, cam.cx)); d.home = [d.tx - 200, d.tx + 200]; d.st = 'go'; sayEn('Woof!'); d.onArrive = function () { d.happy = 2.5; d.hearts = 30; d.vz = 500; d.jz = .1; setTimeout(function () { d.home = [2900, 3300]; }, 12000); }; }
  function rename(k) {
    var cur = nm(k), inp = $('nameInp'); inp.value = cur; $('nameTitle').textContent = '✏️ שם חדש ל' + FD.ANIMALS[k][3]; $('nameOv').classList.add('show'); inp.focus();
    $('nameOk').onclick = function () { var v = inp.value.replace(/[<>]/g, '').trim(); if (v) { ST.names[k] = v; save(); say('שלום ' + v + '!'); sayEn(FD.ANIMALS[k][1]); IMG = {}; } closeOv('nameOv'); panel(); };
  }
  function closeOv(id) { $(id).classList.remove('show'); }

  /* ================= פרק 11 — שכבת "קומיקס גיבורים" (סגנון מארוול) =================
     11.1 רסטר: תבנית נקודות (halftone) לפיצוצים; רסטר השמיים והקרקע + ויניטה הם שכבת CSS (#comicFx) — חוסך ~60% זמן ציור
     11.2 פיצוצי SFX: "WOOF!" / "MOO!" / "POW!" בכוכב משונן עם דיו, ליד החיה שמשמיעה
     11.3 הגיבור/ה של החווה: הדמות מהארון (HeroAvatar) נוחתת מהשמיים, עפה לכל אזור עם קווי מהירות
     11.4 מעבר זום: קווי מהירות רדיאליים, מסגרת פאנל קומיקס, ויניטה קולנועית
     11.5 כיתוב "בינתיים..." (תיבת קריינות) בכניסה לאזור, וסימון האזור הנוכחי בסרגל
     תקלה נפוצה: הדמות לא מופיעה? בודקים ש-hero-avatar.js ו-hero-rewards.js נטענו לפני farm.js */
  /* --- 11.1 רסטר --- */
  var DOTS = null;
  function dots(c, col) {
    if (!DOTS) DOTS = {};
    if (!DOTS[col]) { var p = document.createElement('canvas'); p.width = p.height = 14; var x = p.getContext('2d'); x.fillStyle = col; x.beginPath(); x.arc(4, 4, 2.1, 0, 7); x.arc(11, 11, 2.1, 0, 7); x.fill(); DOTS[col] = c.createPattern(p, 'repeat'); }
    return DOTS[col];
  }
  /* sunRays — קרני קומיקס מסתובבות סביב השמש (טריזים לסירוגין) */
  function sunRays(c, x, y, R) {
    c.save(); c.translate(x, y); c.rotate(T * .05); c.globalAlpha = .13; c.fillStyle = '#fff6c0';
    c.beginPath(); for (var i = 0; i < 12; i++) { c.moveTo(0, 0); c.arc(0, 0, R, i * Math.PI / 6, i * Math.PI / 6 + Math.PI / 12); c.closePath(); } c.fill();   /* נתיב אחד = מילוי אחד */
    c.restore();
  }
  /* --- 11.2 פיצוצי SFX --- */
  var bursts = [];
  var SFX_AT = { 'woof!': 'dog', 'fetch!': 'dog', 'good dog!': 'dog', 'sit!': 'dog', 'paw!': 'dog', 'roll over!': 'dog', 'jump!': 'dog', 'meow!': 'cat', 'good kitty!': 'cat', 'moo!': 'cow', 'baa!': 'sheep', 'cluck!': 'hen1', 'quack!': 'duck1', 'hop hop!': 'bunny' };
  var SFX_COL = ['#ffe14a', '#ff5ca8', '#29e0ff', '#3ff2b0', '#ff9f1c', '#b18cff'];
  function burst(txt, x, y, col) {
    bursts.push({ txt: txt, x: x, y: y, col: col || SFX_COL[(bursts.length + txt.length) % SFX_COL.length], t: 0, life: 1.25, rot: rnd(-.22, .12), spk: 12 + (txt.length % 4) });
    if (bursts.length > 6) bursts.shift();
  }
  /* sfx(text) — מוצא לאן לשים את הפיצוץ: ליד החיה, באזור הנוכחי או באמצע המסך */
  function sfx(t) {
    var k = String(t || '').toLowerCase().trim(); if (!k || k.length > 14) return;
    var a = SFX_AT[k] && byId(SFX_AT[k]), x, y;
    if (a) { x = a.x + (a.flip ? -1 : 1) * a.size * .45; y = a.y - a.size * .95 - a.jz; }
    else if (Z) { x = Z[1] + rnd(-60, 60); y = GROUND - 230; }
    else { x = cam.cx + rnd(-120, 120); y = GROUND - 280; }
    burst(t.toUpperCase(), x, y);
  }
  function drawBursts(c) {
    bursts.forEach(function (b) {
      var p = b.t / b.life, sc = b.t < .16 ? (b.t / .16) * 1.25 : b.t < .3 ? 1.25 - (b.t - .16) / .14 * .25 : 1, a = p > .75 ? (1 - p) / .25 : 1;
      sc /= Math.max(1, cam.z * .72);   /* בזום הפיצוץ לא מסתיר את החיה */
      c.save(); c.translate(b.x, b.y - p * 26); c.rotate(b.rot); c.scale(sc, sc); c.globalAlpha = Math.max(0, a);
      c.font = 'italic 900 34px ' + FONT; var w = Math.max(70, c.measureText(b.txt).width * .62 + 34), hgt = w * .62;
      /* כוכב משונן: צל דיו מוסט + מילוי + קו */
      [[7, 8, INK], [0, 0, b.col]].forEach(function (L, li) {
        c.beginPath(); for (var i = 0; i <= b.spk * 2; i++) { var an = i / (b.spk * 2) * Math.PI * 2, r = i % 2 ? .66 : 1.06 + (i % 4 ? 0 : .12); var px = Math.cos(an) * w * r + L[0], py = Math.sin(an) * hgt * r + L[1]; if (i) c.lineTo(px, py); else c.moveTo(px, py); }
        c.closePath(); c.fillStyle = L[2]; c.fill(); if (li) { c.lineWidth = 5; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke(); }
      });
      /* נקודות רסטר בתוך הכוכב */
      c.save(); c.clip(); c.globalAlpha *= .25; c.fillStyle = dots(c, '#ffffff'); c.fillRect(-w, -hgt, w * 2, hgt * 2); c.restore();
      c.direction = 'ltr'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 9;   /* SFX באנגלית — משמאל לימין (אחרת "!WOOF") */ c.strokeStyle = INK; c.lineJoin = 'round';
      c.strokeText(b.txt, 0, 2); c.fillStyle = '#fff'; c.fillText(b.txt, 0, 2);
      c.restore();
    });
  }
  /* --- 11.3 הגיבור/ה של החווה --- */
  var hero = { x: 3235, y: GROUND + 78, tx: 3235, air: 620, vz: 0, fly: 0, flip: false, key: '', img: null, land: 0 };
  function heroImg() {
    if (!window.HeroAvatar || !window.HeroRewards) return null;
    var o = HeroRewards.outfit, k = JSON.stringify(o);
    if (k !== hero.key) {
      hero.key = k; var look = null; try { look = Profile.active && Profile.active.look; } catch (e) {}
      var s = HeroAvatar.svg(o, look ? { look: look } : {}).replace(/<svg /, '<svg width="480" height="600" ');
      hero.img = new Image(); hero.img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
    }
    return hero.img;
  }
  /* heroTo(x) — טיסה לנקודה חדשה: מתרוממת, טסה ונוחתת עם "WHOOSH!" */
  function heroTo(x) { x = Math.max(70, Math.min(VW - 70, x)); if (Math.abs(x - hero.x) < 30) return; hero.tx = x; hero.fly = 1; hero.flip = x < hero.x; }
  function updHero(dt) {
    if (hero.land > 0) hero.land -= dt;
    if (hero.air > 0 && !hero.fly) { hero.air = Math.max(0, hero.air - 520 * dt); if (hero.air === 0) { hero.land = .5; burst(BOY ? 'BOOM!' : 'WOW!', hero.x, GROUND - 60, '#ffe14a'); for (var i = 0; i < 10; i++) parts.push({ e: '✨', x: hero.x + rnd(-50, 50), y: hero.y - 10, vx: rnd(-160, 160), vy: rnd(-220, -80), g: 380, life: 1, sz: 24 }); } }
    if (hero.fly) {
      var d = hero.tx - hero.x, sp = Math.min(Math.abs(d), Math.max(420, Math.abs(d) * 5) * dt);
      hero.x += Math.sign(d) * sp; hero.air = Math.min(170, hero.air + 900 * dt);
      if (Math.abs(d) < 4) { hero.x = hero.tx; hero.fly = 0; }
    }
    if (hero.vz || hero.jz > 0) { hero.vz -= 1500 * dt; hero.jz = Math.max(0, (hero.jz || 0) + hero.vz * dt); if (!hero.jz) hero.vz = 0; }
  }
  function drawHero(c) {
    var im = heroImg(); if (!im || !im.complete || !im.naturalWidth) return;
    var hh = 150, ww = hh * .8, up = hero.air + (hero.jz || 0), bob = hero.fly || hero.air ? Math.sin(T * 5) * 5 : Math.sin(T * 2.2) * 2;
    /* צל על הקרקע (מתכווץ כשגבוה) */
    var sh = Math.max(.25, 1 - up / 500); c.save(); c.globalAlpha = .28 * sh; ell(c, hero.x, hero.y + 2, 46 * sh, 11 * sh, '#1b1036', 0); c.restore();
    c.save(); c.translate(hero.x, hero.y - up + bob);
    if (hero.fly || hero.air > 40) {
      /* קווי מהירות מאחורי הדמות */
      var dir = hero.fly ? (hero.flip ? 1 : -1) : 0; c.strokeStyle = INK; c.lineCap = 'round';
      for (var i = 0; i < 5; i++) { var ly = -hh * (.2 + i * .15), len = 60 + (i % 2) * 50 + Math.sin(T * 20 + i) * 14; c.globalAlpha = dir ? .55 : .3; c.lineWidth = dir ? 5 - (i % 2) * 2 : 3;
        c.beginPath(); if (dir) { c.moveTo(dir * ww * .45, ly); c.lineTo(dir * (ww * .45 + len), ly); } else { c.moveTo(-ww * .3 + i * 14, -hh - 8); c.lineTo(-ww * .3 + i * 14, -hh - 8 - len * .7); } c.stroke(); }
      c.globalAlpha = 1; c.rotate(hero.fly ? (hero.flip ? -.28 : .28) : 0);
    }
    var sq = hero.land > 0 ? 1 - Math.sin(hero.land / .5 * Math.PI) * .12 : 1;
    c.scale(1 / Math.sqrt(sq), sq);
    c.drawImage(im, -ww / 2, -hh, ww, hh);
    c.restore();
  }
  function heroTap(w) { var up = hero.air + (hero.jz || 0); return Math.abs(w.x - hero.x) < 50 && w.y < hero.y - up + 5 && w.y > hero.y - up - 150; }
  function heroPow() {
    hero.vz = 620; hero.jz = .1; burst(['POW!', 'ZAP!', 'KAPOW!', 'WHAM!'][(Math.random() * 4) | 0], hero.x, hero.y - 190);
    snd('happy'); say(BOY ? 'הגיבור של החווה מוכן לעזור!' : 'הגיבורה של החווה מוכנה לעזור!');
    for (var i = 0; i < 12; i++) parts.push({ e: i % 3 ? '⭐' : '💥', x: hero.x, y: hero.y - 90, vx: rnd(-260, 260), vy: rnd(-320, -60), g: 420, life: 1.1, sz: 26 });
  }
  /* --- 11.4 מעבר זום ומסגרת --- */
  var zfx = 0;
  function comicScreen(c) {
    /* (הוויניטה והרסטר — שכבת CSS #comicFx מעל הקנבס) */
    /* קווי מהירות רדיאליים בזמן המעבר */
    if (zfx > 0) {
      c.save(); c.globalAlpha = Math.min(1, zfx * 2) * .75; c.fillStyle = '#fff'; var cx = W / 2, cy = H / 2, R = Math.hypot(W, H);
      c.beginPath();
      for (var i = 0; i < 44; i++) { var a = i / 44 * Math.PI * 2 + (i * 1.7 % 1) * .08, r0 = R * (.28 + (i * 7 % 10) / 40), da = .012 + (i % 3) * .006;
        c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); c.lineTo(cx + Math.cos(a - da) * R, cy + Math.sin(a - da) * R); c.lineTo(cx + Math.cos(a + da) * R, cy + Math.sin(a + da) * R); c.closePath(); }
      c.fill();
      c.restore();
    }
    /* מסגרת פאנל קומיקס כשנכנסים לאזור */
    var zf = Math.max(0, Math.min(1, (cam.z - 1) / 1)); if (zf > .02) { c.save(); c.globalAlpha = zf; c.lineWidth = 14; c.strokeStyle = INK; c.strokeRect(7, 7, W - 14, H - 14); c.lineWidth = 4; c.strokeStyle = '#fff'; c.strokeRect(17, 17, W - 34, H - 34); c.restore(); }
  }
  /* --- 11.5 כיתוב "בינתיים..." וסימון בסרגל --- */
  var capT = 0;
  function caption(z) {
    var d = $('capBox'); if (!d) return;
    d.innerHTML = '<small>' + (night ? 'באותו לילה...' : 'בינתיים...') + '</small>' + z[3] + ' ' + z[2] + '!';
    d.classList.remove('show'); void d.offsetWidth; d.classList.add('show'); clearTimeout(capT); capT = setTimeout(function () { d.classList.remove('show'); }, 2600);
  }
  var navT = 0;
  function navMark(dt) {
    navT -= dt; if (navT > 0) return; navT = .3;
    var best = null, bd = 1e9; ZONES.forEach(function (z) { var d = Math.abs(z[1] - cam.cx); if (d < bd) { bd = d; best = z[0]; } });
    Array.prototype.forEach.call(document.querySelectorAll('#zoneNav .zn'), function (b) { b.classList.toggle('on', b.dataset.z === best); });
  }

  /* ================= פרק 10 — ממשק ולולאה ================= */
  function go(x) { cam.tcx = x; clampCam(); }
  function zoomTo(id) {
    var z = zone(id); if (!z) return; Z = z; cam.tz = 2.05; cam.tcx = z[1] + (id === 'market' ? -40 : 0); cam.tcy = GROUND - 130; tap(640);
    document.body.classList.add('zoomed'); panel(); zoneHello(id);
    zfx = .6; caption(z); heroTo(z[1] + (id === 'stable' ? 170 : id === 'market' ? -250 : -205));   /* קומיקס: קווי מהירות, "בינתיים...", והגיבור/ה טס/ה לשם */
  }
  function unzoom() { zfx = .45; Z = null; cam.tz = 1; cam.tcy = VH / 2; clampCam(); document.body.classList.remove('zoomed'); $('zonePanel').innerHTML = ''; yarn = null; stopMic(); }
  function zoneHello(id) {
    var a = { dog: 'dog', house: 'cat', barn: 'cow', sheep: 'sheep', bunny: 'bunny', coop: 'hen1', pond: 'duck1' }[id], an = a && byId(a);
    if (an) { if (night && an.st === 'sleep') say(ZNAME(id) + ' — ששש... ' + nm(an.t === 'chicken' ? 'chicken' : an.t === 'duck' ? 'duck' : an.t) + ' ישנ' + (BOY ? '' : 'ה') + '. נגיעה עדינה תעיר'); else { sayEn(FD.ANIMALS[an.t][1]); } }
    if (id === 'market') { openMarket(); }
    if (id === 'stable') say('האורווה של ' + (window.Horse ? Horse.state.name : 'הסוס') + '! מטפלים או יוצאים לרכיבה?');
  }
  function ZNAME(id) { return zone(id)[2]; }
  /* panel — כפתורי האזור בצד המסך (בזום) */
  function panel(soft) {
    var p = $('zonePanel'); if (!Z) { p.innerHTML = ''; return; } if (soft && Z[0] === 'barn') { var mb = $('milkBar'); if (mb) { mb.style.width = milk.n * 10 + '%'; return; } }
    var id = Z[0], h = '<h3>' + Z[3] + ' ' + Z[2] + '</h3>', A = { dog: 'dog', house: 'cat', barn: 'cow', sheep: 'sheep', bunny: 'bunny' }[id];
    if (A) h += '<button class="zb name" data-act="name:' + A + '">✏️ ' + nm(A) + '</button>';
    if (id === 'dog') { h += '<p>גוררים את הכדור 🟡 וזורקים! משפשפים את ' + nm('dog') + ' כדי ללטף</p><div class="zg">' + FD.TRICKS.map(function (t) { var n = ST.tricks[t[0]] || 0; return '<button class="zb" data-act="trick:' + t[0] + '"><b>' + t[1] + '</b>' + t[2] + '<small>' + (n >= 5 ? '⭐ יודע!' : n + '/5') + '</small></button>'; }).join('') + '</div><button class="zb wide" data-act="clap" id="clapBtn">👏 לקרוא במחיאת כף</button>'; }
    if (id === 'house') h += '<p>משפשפים את ' + nm('cat') + ' עד שמגרגרים 💖</p><button class="zb wide" data-act="yarn">🧶 לשחק בחוט צמר</button>';
    if (id === 'coop') h += '<p>נוגעים בביצים כדי לאסוף ולספור 🥚</p><div class="big">🥚 ' + eggsReady() + ' מוכנות</div>' + (goldenReady() ? '<p>✨ ביצת זהב! מחזיקים עליה את האצבע כדי לחמם</p>' : '<p>🐣 אפרוחים בחווה: ' + ST.chicks + '</p>');
    if (id === 'barn') h += milkReady() ? '<p>נוגעים לסירוגין — ימין, שמאל, ימין, שמאל — בעטין הוורוד 🥛</p><div class="bar"><i id="milkBar" style="width:' + milk.n * 10 + '%"></i></div>' : '<p>' + nm('cow') + ' נחה. חלב יהיה בעוד ' + Math.ceil((60 * 60000 - (Date.now() - ST.milkAt)) / 60000) + ' דקות</p>';
    if (id === 'sheep') { h += sheepShorn() ? '<p>הצמר צומח מחדש… 🐑</p>' : '<p>משפשפים את הצמר כדי לגזוז ✂️</p>'; h += '<p>🧶 צמר: ' + ST.inv.wool + '</p><div class="zg">' + ['#ff5ca8', '#3d7bff', '#ffd93c', '#2fb85a'].map(function (c) { return '<button class="zb sw" data-act="scarf:' + c + '" style="background:' + c + '">🧣</button>'; }).join('') + '</div><p class="tiny">צעיף עולה 2 צמר, ונוגעים בחיה כדי להלביש</p>'; }
    if (id === 'garden') h += '<div class="zg">' + Object.keys(FD.CROPS).map(function (k) { return '<button class="zb' + (gardenTool === k ? ' on' : '') + '" data-act="tool:' + k + '"><b>' + FD.CROPS[k][0] + '</b>' + FD.CROPS[k][1] + '</button>'; }).join('') + '<button class="zb' + (gardenTool === 'water' ? ' on' : '') + '" data-act="tool:water"><b>🚿</b>השקיה</button></div><p>נוגעים בערוגה: שותלים, משקים וקוטפים</p>';
    if (id === 'pond') h += '<p>נוגעים במים כדי לזרוק לחם 🍞 לברווזים</p>';
    if (id === 'bunny') h += '<p>הגזר מוחבא מתחת לאחד השיחים. באיזה? 🥕</p>';
    if (id === 'stable') h += '<button class="zb wide" data-act="horsecare">🧺 טיפול בסוס</button><button class="zb wide" data-act="ride">🏇 לרכיבה</button><button class="zb wide" data-act="carrot">🥕 גזר מהגינה (' + ST.inv.carrot + ')</button>';
    if (id === 'market' || id === 'park') h += (id === 'park' ? '<p>כאן יופיעו הקישוטים שקונים: נדנדה, מזרקה, בית עץ וגדר קשת 🌈</p>' : '') + '<button class="zb wide" data-act="market">🛒 לפתוח את הדוכן</button>';
    /* פרק 12: למידה — מדריך טיפול וחידון לכל אזור (js/farm-learn.js) */
    if (window.FarmLearn && FarmLearn.GUIDES[id]) h += '<div class="zg"><button class="zb learn" data-act="learn"><b>📖</b>איך מטפלים?</button><button class="zb learn" data-act="quiz"><b>❓</b>שאלת החווה<small>' + quizStars(id) + '</small></button></div>';
    h += '<button class="zb wide back" data-act="back">🗺️ לכל החווה</button>';
    p.innerHTML = h;
  }
  var scarfPick = null;
  $('zonePanel').addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return; var a = b.dataset.act.split(':'); tap(620);
    if (a[0] === 'back') unzoom(); else if (a[0] === 'trick') doTrick(a[1]); else if (a[0] === 'name') rename(a[1]); else if (a[0] === 'clap') clapCall();
    else if (a[0] === 'yarn') { yarn = yarn ? null : { x: 3420, y: GROUND - 20 }; say(yarn ? 'מזיזים את החוט — ו' + nm('cat') + ' רודפ' + (BOY ? '' : 'ת') + ' אחריו!' : 'מספיק לשחק'); }
    else if (a[0] === 'tool') { gardenTool = a[1]; panel(); say(a[1] === 'water' ? 'משפך' : FD.CROPS[a[1]][1]); }
    else if (a[0] === 'scarf') { if (ST.inv.wool < 2) { say('צריך 2 צמר. גוזזים את הכבשה!'); return; } scarfPick = a[1]; unzoom(); say('נוגעים בחיה שתקבל את הצעיף 🧣'); toast('🧣 נוגעים בחיה!'); }
    else if (a[0] === 'horsecare') location.href = 'ride.html#farm'; else if (a[0] === 'ride') location.href = 'ride.html';
    else if (a[0] === 'carrot') { if (!ST.inv.carrot) { say('אין גזר. שותלים בגינה!'); return; } ST.inv.carrot--; save(); try { Horse.bump('food', 20); Horse.bump('happy', 8); } catch (x) {} say((window.Horse ? Horse.state.name : 'הסוס') + ' אוכל' + (BOY ? '' : 'ת') + ' גזר מהגינה! יאמי!'); teach('carrot', 'גזר!'); panel(); inv(); }
    else if (a[0] === 'market') openMarket();
    else if (a[0] === 'learn') openGuide(Z[0]); else if (a[0] === 'quiz') openQuiz(Z[0]);
  });
  /* מגע על הקנבס */
  var ptr = { down: false, x: 0, y: 0, lx: 0, t: 0, moved: 0, target: null, hold: 0 };
  cv.addEventListener('pointerdown', function (e) {
    actx(); ptr.down = true; ptr.x = ptr.lx = e.clientX; ptr.y = e.clientY; ptr.t = performance.now(); ptr.moved = 0; cam.vx = 0;
    var w = toWorld(e.clientX, e.clientY); ptr.w0 = w; ptr.target = null; pet.a = null; pet.acc = 0; pet.done = 0;
    if (heroTap(w)) { heroPow(); ptr.target = 'hero'; return; }
    if (!Z) return;
    var hit = AN.filter(function (a) { return Math.abs(w.x - a.x) < a.size * .45 && w.y < a.y + 10 && w.y > a.y - a.size; })[0];
    if (Z[0] === 'dog' && Math.abs(w.x - (dog.ball ? dog.ball.x : 3150)) < 60 && (!dog.ball || dog.ball.ground && !dog.ball.held) && w.y > GROUND - 70) { ptr.target = 'ball'; return; }
    if (Z[0] === 'coop' && goldenReady() && Math.abs(w.x - 2330) < 40 && w.y > GROUND - 50) { hatch.on = true; hatch.t = 0; hatch.t0 = performance.now(); ptr.target = 'hatch'; say('מחממים את הביצה...'); return; }
    if (Z[0] === 'coop') { for (var i = 0; i < 6; i++) if (Math.abs(w.x - (2050 + i * 46)) < 24 && w.y > GROUND - 30) { collectEgg(i); ptr.target = 'egg'; return; } }
    if (Z[0] === 'barn' && Math.abs(w.x - 1330) < 60 && w.y > GROUND - 50 && w.y < GROUND + 40) { squeeze(w.x < 1330 ? -1 : 1); ptr.target = 'milk'; return; }
    if (Z[0] === 'garden') { var pi = plotAt(w.x); if (pi >= 0 && w.y > GROUND - 70) { useGarden(pi); ptr.target = 'plot'; return; } }
    if (Z[0] === 'pond' && Math.abs(w.x - 1760) < 190 && Math.abs(w.y - (GROUND + 36)) < 50) { throwBread(w.x); ptr.target = 'bread'; return; }
    if (Z[0] === 'bunny') { for (var k = 0; k < 3; k++) if (Math.abs(w.x - BUSHES[k]) < 36 && w.y > GROUND - 40) { checkBush(k); ptr.target = 'bush'; return; } }
    if (Z[0] === 'house' && yarn) { ptr.target = 'yarn'; return; }
    if (hit) { wake(hit); pet.a = hit; ptr.target = 'pet'; }
  });
  window.addEventListener('pointermove', function (e) {
    if (!ptr.down) return;
    var dx = e.clientX - ptr.lx; ptr.moved += Math.abs(dx) + Math.abs(e.clientY - ptr.y); ptr.lx = e.clientX;
    if (!Z) { cam.tcx -= dx / scale(); cam.cx = cam.tcx; cam.vx = -dx / scale() / .016; clampCam(); return; }
    var w = toWorld(e.clientX, e.clientY);
    if (ptr.target === 'pet' && pet.a) petMove(pet.a, Math.abs(dx) + Math.abs(e.movementY || 0) + 4);
    if (ptr.target === 'yarn') { yarn.x = w.x; yarn.y = Math.min(GROUND + 20, w.y); }
  });
  window.addEventListener('pointerup', function (e) {
    if (!ptr.down) return; ptr.down = false;
    var dt = (performance.now() - ptr.t) / 1000, w = toWorld(e.clientX, e.clientY);
    if (ptr.target === 'hatch') { if (hatch.on && performance.now() - hatch.t0 < 2000) { hatch.on = false; say('מחזיקים עוד קצת — הביצה צריכה חום!'); } return; }
    if (ptr.target === 'ball') { var vx = (w.x - ptr.w0.x) / Math.max(.08, dt) * .9, vy = (w.y - ptr.w0.y) / Math.max(.08, dt) * .9; throwBall(ptr.w0.x, GROUND - 30, Math.max(-900, Math.min(900, vx || -300)), Math.min(-300, vy || -600)); return; }
    if (ptr.target === 'hero') return;
    if (!Z && ptr.moved < 12) {
      if (scarfPick) { var a2 = AN.filter(function (a) { return Math.abs(w.x - a.x) < a.size * .5 && w.y > a.y - a.size && w.y < a.y + 20; })[0]; if (a2) { ST.scarf[a2.id] = scarfPick; ST.inv.wool -= 2; save(); scarfPick = null; a2.happy = 2; a2.hearts = 30; say('איזה צעיף יפה!'); snd('unlock'); IMG = {}; } return; }
      var hitA = AN.filter(function (a) { return Math.abs(w.x - a.x) < a.size * .5 && w.y > a.y - a.size && w.y < a.y + 20; })[0], zid = null;
      if (hitA) zid = { dog: 'dog', cat: 'house', chicken: 'coop', chick: 'coop', duck: 'pond', cow: 'barn', sheep: 'sheep', bunny: 'bunny' }[hitA.t];
      if (!zid) ZONES.forEach(function (z) { if (Math.abs(w.x - z[1]) < 150) zid = z[0]; });
      if (zid) zoomTo(zid);
    }
  });
  /* HUD */
  function hud() {
    $('coinChip').textContent = '🪙 ' + coins();
    var C = ST.chores; $('choresBtn').innerHTML = '📋 <b>' + (C.done || 0) + '/3</b>';
    var h = hourNow(), wt = raining() ? '🌧️ גשם' : rainbow() ? '🌈 קשת' : WEATHER === 'cloud' ? '⛅ מעונן' : isNight() ? '🌙 לילה' : '☀️ שמש';
    $('timeChip').textContent = (ST.time === 'real' ? '' : (ST.time === 'day' ? '🌞 ' : '🌙 ')) + wt + ' · ' + String(Math.floor(h)).padStart(2, '0') + ':' + String(Math.floor(h % 1 * 60)).padStart(2, '0');
  }
  function inv() { var b = $('invBar'); b.innerHTML = ''; Object.keys(FD.GOODS).forEach(function (k) { if (ST.inv[k]) b.appendChild(el('span', '', FD.GOODS[k][0] + ' ' + ST.inv[k])); }); if (!b.children.length) b.appendChild(el('span', '', '🧺 הסל ריק')); }
  function buildNav() { var n = $('zoneNav'); ZONES.slice().forEach(function (z) { var b = el('button', 'zn', z[3]); b.type = 'button'; b.title = z[2]; b.dataset.z = z[0]; b.addEventListener('click', function () { tap(600); if (Z) unzoom(); go(z[1]); heroTo(z[1] - 205); say(z[2]); }); n.appendChild(b); }); }
  /* לולאה */
  var last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min(.05, (now - last) / 1000 || 0); last = now; T += dt;
    var h = hourNow(); night = isNight(); dark = darkness(h);
    /* מצלמה: תנופה + החלקה */
    if (!ptr.down && !Z && Math.abs(cam.vx) > 1) { cam.tcx += cam.vx * dt; cam.vx *= Math.pow(.05, dt); clampCam(); }
    if (!Z && !ptr.down) clampCam();
    var k = 1 - Math.pow(.0009, dt); cam.cx += (cam.tcx - cam.cx) * k; cam.cy += (cam.tcy - cam.cy) * k; cam.z += (cam.tz - cam.z) * k;
    AN.forEach(function (a) { updAnimal(a, dt); }); updBall(dt); hatchTick(dt); updParts(dt); updHero(dt); navMark(dt);
    bursts.forEach(function (b) { b.t += dt; }); bursts = bursts.filter(function (b) { return b.t < b.life; }); if (zfx > 0) zfx = Math.max(0, zfx - dt * 1.8);
    /* החתולה רודפת אחרי החוט */
    if (yarn) { var ct = byId('cat'); if (ct) { ct.ctl = true; wake(ct); var d = yarn.x - ct.x; if (Math.abs(d) > 20) { ct.x += Math.sign(d) * Math.min(Math.abs(d), 240 * dt); ct.flip = d < 0; ct.st = 'run'; } else { ct.st = 'idle'; if (ct.jz === 0 && Math.random() < dt * 2) { ct.vz = 520; ct.jz = .1; ct.happy = 1; } } } }
    else { var ct2 = byId('cat'); if (ct2 && ct2.ctl && !dog.ball) ct2.ctl = false; }
    render();
  }
  function render() {
    var c = ctx, s = scale();
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    drawSky(c, s); clouds(c, s);
    hillsLayer(c, s, .3, 470, 60, night ? '#3a5a8a' : '#a8dcae', 1, night ? '#2a4a7a' : '#8ccf94');
    hillsLayer(c, s, .55, 520, 46, night ? '#2f5a5a' : '#7fd07a', 3, night ? '#1f4a4a' : '#5fbf5f');
    /* עולם */
    c.setTransform(s * DPR, 0, 0, s * DPR, (W / 2 - cam.cx * s) * DPR, (H / 2 - cam.cy * s) * DPR);
    var gg = c.createLinearGradient(0, GROUND - 90, 0, VH); gg.addColorStop(0, night ? '#2f7a4a' : '#8ee07a'); gg.addColorStop(1, night ? '#1f5a3a' : '#4fbf5a'); c.fillStyle = gg; c.fillRect(-200, GROUND - 60, VW + 400, VH);
    c.beginPath(); c.moveTo(-200, GROUND - 60); c.lineTo(VW + 200, GROUND - 60); c.lineWidth = 4; c.strokeStyle = 'rgba(27,16,54,.45)'; c.stroke();
    c.fillStyle = night ? '#8a7a5a' : '#f0d9a8'; c.beginPath(); c.moveTo(-200, GROUND + 70); for (var x = -200; x <= VW + 200; x += 80) c.lineTo(x, GROUND + 70 + Math.sin(x / 300) * 10); c.lineTo(VW + 200, GROUND + 120); for (x = VW + 200; x >= -200; x -= 80) c.lineTo(x, GROUND + 120 + Math.sin(x / 260) * 8); c.closePath(); c.fill();
    decoDraw(c, true); stable(c); bunnyCorner(c); sheepPen(c); barn(c); pond(c); coop(c); garden(c); doghouse(c); house(c); market(c); park(c); decoDraw(c, false);
    crumbs.forEach(function (cr) { drawEmo(c, '🍞', cr.x, cr.y, 26); });
    if (yarn) { drawEmo(c, '🧶', yarn.x, yarn.y - 16, 44); }
    if (dog.ball && !dog.ball.held) ballDraw(c, dog.ball.x, dog.ball.y - 14, 15); else if (!dog.ball) ballDraw(c, 3150, GROUND - 10, 13);
    /* הסוס ליד האורווה */
    var hi = horseImg(); if (hi && hi.complete && hi.naturalWidth) { c.save(); var hb = Math.sin(T * 1.4) * 2; c.drawImage(hi, 105, GROUND - 170 + hb, 225, 180); c.restore(); }
    AN.slice().sort(function (a, b) { return a.y - b.y; }).forEach(function (a) { drawAnimal(c, a); });
    drawHero(c);
    drawParts(c); drawBursts(c);
    /* לילה: שכבת כהות + הילות אור */
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (dark > 0) { c.fillStyle = 'rgba(15,20,70,' + dark * .75 + ')'; c.fillRect(0, 0, W, H); }
    if (raining()) { c.strokeStyle = 'rgba(200,225,255,.55)'; c.lineWidth = 2; c.beginPath(); rain.forEach(function (r) { c.moveTo(r.x, r.y); c.lineTo(r.x - 6, r.y + 18); }); c.stroke(); }
    grassFront(c, H / VH);
    comicScreen(c);
  }
  /* כניסה: ברכה לפי השעה, "התגעגענו!", הכלבלב רץ לקבל */
  function greet() {
    var h = hourNow(), gap = ST.last ? (Date.now() - ST.last) / 36e5 : 0, kid = kidName();
    var hi = h < 11 ? 'בוקר טוב' : h < 17 ? 'צהריים טובים' : h < 20.5 ? 'ערב טוב' : 'לילה טוב';
    var line = hi + ', ' + kid + '! ' + (gap > 24 ? 'התגעגענו אלייך!'.replace('אלייך', BOY ? 'אליך' : 'אלייך') + ' ' : '') + (isNight() ? 'החיות ישנות... נגיעה עדינה מעירה אותן.' : 'ברוכים הבאים לחווה!');
    ST.last = Date.now(); ST.visits++; save(); if (isNight()) { try { Achievements.hit('farm:night'); } catch (e) {} }
    setTimeout(function () { say(line); if (!isNight()) { var d = byId('dog'); if (d) { d.tx = cam.cx - 60; d.st = 'go'; d.onArrive = function () { d.happy = 2; d.hearts = 30; sayEn('Woof!'); }; } } }, 700);
  }
  function bind() {
    $('choresBtn').addEventListener('click', function () { tap(); openChores(); });
    $('photoBtn').addEventListener('click', snapshot);
    $('albumBtn').addEventListener('click', function () { tap(); openAlbum(); });
    $('timeChip').addEventListener('click', function () { ST.time = ST.time === 'real' ? 'day' : ST.time === 'day' ? 'night' : 'real'; save(); tap(); say(ST.time === 'real' ? 'שעון אמיתי' : ST.time === 'day' ? 'יום בחווה' : 'לילה בחווה'); hud(); });
    document.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', function () { tap(); closeOv(b.dataset.close); }); });
    $('nameInp').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('nameOk').click(); });
  }
  /* ================= פרק 12 — למידה בחווה: "איך מטפלים?", "הידעת?" וחידון (שלב 16) =================
     12.1 learnTip(ev): אחרי כל 3 פעולות טיפול מאותו סוג — עובדה קצרה (LearnFX.fact) עם קול. לא יותר מאחת ב-40 שניות
     12.2 openGuide(zone): כרטיס "איך מטפלים?" — 4 צעדים; נגיעה בצעד מקריאה את ההסבר "למה?" ומלמדת את המילה באנגלית (LearnFX.word)
     12.3 openQuiz(zone): שאלה אקראית מהאזור עם 3 תשובות. נכון = +2 🪙, כוכב לאזור ו-POW; טעות = הסבר עדין, בלי עונש
     12.4 שמירה: ST.learn = { tips: {ev: n}, lastTip, quiz: {zone: stars}, seen: {zone: 1} } — נשמר עם שאר החווה (KEY)
     תקלה נפוצה: הכפתורים לא מופיעים? בודקים ש-js/farm-learn.js ו-shared/learn-fx.js נטענים לפני farm.js */
  if (!ST.learn) ST.learn = { tips: {}, lastTip: 0, quiz: {}, seen: {} };
  /* מיפוי: שם האירוע ב-prog() → מפתח העובדות ב-FarmLearn.FACTS */
  var LEARN_EV = { fetch: 'ball', trick: 'trick', petcat: 'pet', egg: 'egg', milk: 'milk', wool: 'shear', water: 'water', harvest: 'plant', ducks: 'ducks', bunny: 'bunny' };
  /* 12.1 */
  function learnTip(ev) {
    var FL = window.FarmLearn, k = LEARN_EV[ev]; if (!FL || !k || !window.LearnFX) return;
    var L = ST.learn; L.tips[k] = (L.tips[k] || 0) + 1;
    if (L.tips[k] % 3 !== 1 || Date.now() - L.lastTip < 40000) { save(); return; }     /* פעולה ראשונה, רביעית, שביעית... ולא בצפיפות */
    var list = FL.FACTS[k] || [], f = list[((L.tips[k] / 3) | 0) % list.length]; if (!f) return;
    L.lastTip = Date.now(); save();
    setTimeout(function () { LearnFX.fact('הידעת? ' + f[1], f[2], f[0], { life: 6 }); track('farm:learn'); }, 900);
  }
  /* 12.2 */
  function openGuide(id) {
    var FL = window.FarmLearn, g = FL && FL.GUIDES[id]; if (!g) return;
    var box = $('guideBox'); $('guideTitle').textContent = g.ico + ' ' + g.title;
    box.innerHTML = g.steps.map(function (s, i) {
      return '<button type="button" class="gstep" data-i="' + i + '"><span class="gn">' + (i + 1) + '</span><span class="ge">' + s[0] + '</span><span class="gt"><b>' + s[1] + '</b><small>למה? ' + s[2] + '</small></span><span class="gw" dir="ltr">' + s[3] + '</span></button>';
    }).join('');
    box.querySelectorAll('.gstep').forEach(function (b) {
      b.addEventListener('click', function () {
        var s = g.steps[+b.dataset.i]; tap(700);
        box.querySelectorAll('.gstep').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on');
        say(s[1] + '. למה? ' + s[2]);
        setTimeout(function () { try { LearnFX.word(s[3], s[4], s[0], { pos: 'bottom', tag: '🇬🇧 המילה באנגלית', quiet: false }); } catch (e) {} }, 2600 + s[2].length * 55);
        track('farm:learn');
      });
    });
    ST.learn.seen[id] = 1; save(); try { Achievements.hit('farm:guide'); } catch (e) {}
    $('guideOv').classList.add('show'); say(g.title + ' נוגעים בכל צעד כדי לשמוע למה הוא חשוב');
  }
  /* 12.3 */
  function quizStars(id) { var n = ST.learn.quiz[id] || 0; return n ? '⭐'.repeat(Math.min(3, n)) : 'חידון'; }
  function openQuiz(id) {
    var FL = window.FarmLearn, list = FL && FL.QUIZ[id]; if (!list || !list.length) return;
    var q = list[(Math.random() * list.length) | 0], done = false;
    $('quizQ').textContent = q.q; $('quizWhy').textContent = ''; $('quizWhy').className = 'qwhy';
    var box = $('quizOpts'); box.innerHTML = q.opts.map(function (o, i) { return '<button type="button" class="qopt" data-i="' + i + '">' + o + '</button>'; }).join('');
    box.querySelectorAll('.qopt').forEach(function (b) {
      b.addEventListener('click', function () {
        if (done) return; done = true; var ok = +b.dataset.i === q.ans;
        box.querySelectorAll('.qopt').forEach(function (x, i) { x.classList.add(i === q.ans ? 'ok' : (x === b ? 'no' : 'dim')); });
        $('quizWhy').textContent = (ok ? '✔ נכון! ' : 'כמעט! ') + q.why; $('quizWhy').className = 'qwhy show ' + (ok ? 'ok' : 'no');
        if (ok) { ST.learn.quiz[id] = (ST.learn.quiz[id] || 0) + 1; try { Achievements.hit('farm:quiz_ok'); } catch (e) {} try { Wallet.add(2); HeroRewards.award(1, b, { word: 'נכון!' }); } catch (e) {} snd('happy'); say('נכון! ' + q.why); try { Progress.recordAnswer('farm', true); } catch (e) {} }
        else { tap(260); say('כמעט! ' + q.why); try { Progress.recordAnswer('farm', false); } catch (e) {} }
        track('answer'); track('farm:learn'); save(); hud(); panel();
      });
    });
    $('quizOv').classList.add('show'); say(q.q);
  }
  resize(); setupAnimals(); bind(); buildNav(); chores(); clampCam(); cam.cx = cam.tcx;
  window.addEventListener('DOMContentLoaded', function () { hud(); inv(); greet(); var m = location.hash.slice(1); if (m && zone(m)) setTimeout(function () { zoomTo(m); }, 600); requestAnimationFrame(function (t) { last = t; frame(t); }); setInterval(function () { hud(); if (Z && (Z[0] === 'coop' || Z[0] === 'barn' || Z[0] === 'sheep')) panel(); }, 20000); });
  window.FarmGame = { state: function () { return ST; }, save: save, inv: inv, hud: hud, animals: function () { return AN; }, zoom: zoomTo, unzoom: unzoom, trick: doTrick, egg: collectEgg, squeeze: squeeze, plot: useGarden, tool: function (t) { gardenTool = t; }, bush: checkBush, bread: throwBread, ball: throwBall, market: openMarket, chores: openChores, snap: snapshot, cam: cam, bunnyHid: function () { return bunnyGame.hid; }, petMove: petMove, byId: byId, hero: hero, burst: burst };
})();
