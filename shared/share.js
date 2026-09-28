/* =====================================================================
   shared/share.js — רגעים לשתף: תעודות גיבורה, ציורים, דוח שבועי, הזמנה לחברות
   ---------------------------------------------------------------------
   פרק 1 — עזרים: טעינת SVG כתמונה, טקסט ממורכז, תאריך עברי קצר
   פרק 2 — send(canvas, שם קובץ, טקסט): שיתוף (וואטסאפ / הודעה / שמירה לתמונות) דרך Web Share;
           במכשיר שלא תומך — חלון עם התמונה + הורדה ("לחיצה ארוכה על התמונה ← שמירה")
   פרק 3 — תעודת גיבורה: award() שומר תעודה (ella-certs-v1) ומציג אותה עם כפתורי שיתוף
   פרק 4 — ציור מהגלריה כתמונה יפה עם מסגרת ושם הציירת (drawingCanvas)
   פרק 5 — דוח שבועי להורים כתמונה (weeklyCanvas)
   פרק 6 — כרטיס הזמנה לחברה עם קוד QR לאפליקציה (inviteCanvas) + appUrl()
   תלויות: shared/qr.js, shared/hero-avatar.js; אופציונלי: hero-rewards.js, progress.js, profile.js, audio.js
   ===================================================================== */
(function () {
  'use strict';

  var INK = '#1b1036', FONT = 'Rubik, "Varela Round", Heebo, system-ui, sans-serif';
  var CERT_KEY = 'ella-certs-v1';
  function name() { return window.Profile ? Profile.name : 'אלה'; }
  function snd(n) { try { if (window.Sound && Sound[n]) Sound[n](); } catch (e) {} }
  function say(t) { try { if (window.Voice) Voice.say(t, { interrupt: true }); } catch (e) {} }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  /* ---------- פרק 1 — עזרים ---------- */
  /* svgImage(svgText) → Promise<Image> — כדי לצייר את הגיבורה על קנבס */
  function svgImage(svg, w, h) {
    return new Promise(function (res) {
      var img = new Image();
      img.onload = function () { res(img); }; img.onerror = function () { res(null); };
      var s = svg.replace('<svg ', '<svg width="' + (w || 480) + '" height="' + (h || 600) + '" ');
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
    });
  }
  function heroSvg() { return window.HeroAvatar ? HeroAvatar.svg(window.HeroRewards ? HeroRewards.outfit : null) : ''; }
  function center(c, text, x, y, size, color, weight, maxW) {
    if (window.Profile) text = Profile.fix(text);          // "אלה" בטקסט → שם הילדה
    c.direction = 'rtl';                                    // עברית: סימני פיסוק בצד הנכון
    c.font = (weight || 900) + ' ' + size + 'px ' + FONT; c.fillStyle = color || INK; c.textAlign = 'center'; c.textBaseline = 'middle';
    while (maxW && c.measureText(text).width > maxW && size > 12) { size -= 2; c.font = (weight || 900) + ' ' + size + 'px ' + FONT; }
    c.fillText(text, x, y);
  }
  function stroked(c, text, x, y, size, fill, strokeW) {
    if (window.Profile) text = Profile.fix(text);
    c.direction = 'rtl';
    c.font = '900 ' + size + 'px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineJoin = 'round'; c.lineWidth = strokeW || 12; c.strokeStyle = INK; c.strokeText(text, x, y); c.fillStyle = fill; c.fillText(text, x, y);
  }
  function dateHe(d) { d = d || new Date(); return d.getDate() + '.' + (d.getMonth() + 1) + '.' + d.getFullYear(); }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function fontsReady() { return (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve(); }
  /* appUrl — כתובת האפליקציה (לקוד QR ולהזמנה) — תמיד תיקיית האפליקציה, בלי דף ספציפי */
  /* compose(W, H, drawFn) — בונה קנבס עם תמונת הגיבורה; אם הדפדפן "מלכלך" קנבס עם SVG (אייפד ישן) —
     בונים מחדש בלי תמונת הגיבורה, כדי שהשיתוף תמיד יעבוד */
  function compose(W, H, heroW, heroH, drawFn) {
    function make(hero) { var cv = document.createElement('canvas'); cv.width = W; cv.height = H; drawFn(cv.getContext('2d'), hero); return cv; }
    return fontsReady().then(function () { return svgImage(heroSvg(), heroW, heroH); }).then(function (hero) {
      var cv = make(hero);
      try { cv.getContext('2d').getImageData(0, 0, 1, 1); return cv; } catch (e) { return make(null); }
    });
  }
  function appUrl() { var u = location.href.split('#')[0].split('?')[0]; return u.replace(/[^\/]*$/, ''); }

  /* ---------- פרק 2 — שליחה ---------- */
  var st = document.createElement('style');
  st.textContent =
    '.sh-ov{position:fixed;inset:0;z-index:9960;display:grid;place-items:center;padding:16px;background:radial-gradient(circle at 50% 40%,rgba(58,17,119,.86),rgba(10,4,30,.94));font-family:var(--h-font);direction:rtl}' +
    '.sh-card{position:relative;width:min(96vw,860px);max-height:94vh;overflow:auto;padding:18px;text-align:center;animation:h-card-in .45s var(--h-spring) both}' +
    '.sh-card img{max-width:100%;max-height:62vh;border:4px solid var(--h-ink);border-radius:18px;box-shadow:6px 7px 0 var(--h-ink);-webkit-touch-callout:default;user-select:auto}' +
    '.sh-card p{font:800 16px/1.4 var(--h-font);color:var(--h-text-soft);margin:10px 0}' +
    '.sh-acts{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:12px}' +
    '.sh-x{position:absolute;top:10px;left:10px;width:50px;height:50px;border:4px solid var(--h-ink);border-radius:50%;background:var(--h-magenta);color:#fff;font:900 20px/1 var(--h-font);box-shadow:0 4px 0 var(--h-ink);cursor:pointer;z-index:2}';
  document.head.appendChild(st);
  function toBlob(canvas, type, q) { return new Promise(function (res) { if (canvas.toBlob) canvas.toBlob(res, type || 'image/png', q); else res(null); }); }
  /* send — שיתוף אמיתי (וואטסאפ, הודעות, "שמירת תמונה"); fallback — הורדה */
  function send(canvas, filename, text, url) {
    return toBlob(canvas, 'image/png').then(function (blob) {
      var file = blob && window.File ? new File([blob], filename, { type: 'image/png' }) : null;
      var data = { title: 'עולם הגיבורות', text: text || '' };
      if (url) data.url = url;
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) { data.files = [file]; return navigator.share(data).catch(function () {}); }
      if (navigator.share && url) return navigator.share(data).catch(function () {});
      var a = document.createElement('a'); a.href = canvas.toDataURL('image/png'); a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    });
  }
  /* show — חלון תצוגה של תמונה + שיתוף + (אופציונלי) הדפסה */
  function show(canvas, opts) {
    opts = opts || {};
    var ov = el('div', 'sh-ov'), card = el('div', 'sh-card h-panel');
    var img = new Image(); img.src = canvas.toDataURL('image/png'); img.alt = opts.title || '';
    card.innerHTML = '<button type="button" class="sh-x" aria-label="סגירה">✖</button>' + (opts.kicker ? '<span class="h-modal-kicker">' + opts.kicker + '</span><div style="height:10px"></div>' : '');
    card.appendChild(img);
    card.appendChild(el('p', '', opts.note || 'אפשר לשלוח לסבתא, לחברות או לשמור בתמונות 📸 (או: לחיצה ארוכה על התמונה ← שמירה)'));
    var acts = el('div', 'sh-acts');
    var b1 = el('button', 'h-btn gold', '📤 לשלוח / לשמור'); b1.type = 'button'; b1.onclick = function () { snd('tap'); send(canvas, opts.file || 'hero.png', opts.text, opts.url); };
    acts.appendChild(b1);
    if (opts.print) { var b2 = el('button', 'h-btn cyan', '🖨️ להדפיס'); b2.type = 'button'; b2.onclick = function () { printImage(img.src); }; acts.appendChild(b2); }
    var b3 = el('button', 'h-btn violet', 'סגירה'); b3.type = 'button'; b3.onclick = function () { ov.remove(); }; acts.appendChild(b3);
    card.appendChild(acts); ov.appendChild(card); document.body.appendChild(ov);
    card.querySelector('.sh-x').onclick = function () { ov.remove(); };
    return ov;
  }
  /* printImage — הדפסה: דף נקי עם התמונה בלבד */
  function printImage(src) {
    var w = window.open('', '_blank'); if (!w) return;
    w.document.write('<!doctype html><html dir="rtl"><head><title>תעודה</title><style>@page{size:landscape;margin:8mm}body{margin:0;display:grid;place-items:center;height:100vh}img{max-width:100%;max-height:100vh}</style></head><body><img src="' + src + '" onload="setTimeout(function(){print()},300)"></body></html>');
    w.document.close();
  }

  /* ---------- פרק 3 — תעודת גיבורה ---------- */
  function certs() { try { return JSON.parse(localStorage.getItem(CERT_KEY)) || []; } catch (e) { return []; } }
  /* certCanvas(c) — c: {title, line, ico, date} → Promise<canvas> (1600×1130, כמו דף A4 לרוחב) */
  function certCanvas(cert) {
    var W = 1600, H = 1130;
    return compose(W, H, 480, 600, function (c, hero) {
      /* רקע: נייר קומיקס עם קרני אור */
      var g = c.createRadialGradient(W / 2, H * .45, 50, W / 2, H * .45, W * .7); g.addColorStop(0, '#fffaf0'); g.addColorStop(1, '#ffe6f3');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.save(); c.translate(W / 2, H * .45); c.fillStyle = 'rgba(255,201,60,.18)';
      for (var i = 0; i < 36; i++) { c.rotate(Math.PI / 18); c.beginPath(); c.moveTo(0, 0); c.lineTo(-40, -1200); c.lineTo(40, -1200); c.closePath(); c.fill(); }
      c.restore();
      /* מסגרת כפולה בצבעי גיבורה */
      c.lineWidth = 26; c.strokeStyle = INK; rr(c, 34, 34, W - 68, H - 68, 50); c.stroke();
      c.lineWidth = 12; c.strokeStyle = '#ff2e93'; rr(c, 62, 62, W - 124, H - 124, 38); c.stroke();
      c.setLineDash([2, 22]); c.lineCap = 'round'; c.lineWidth = 10; c.strokeStyle = '#ffc93c'; rr(c, 86, 86, W - 172, H - 172, 30); c.stroke(); c.setLineDash([]);
      /* כוכבים בפינות */
      [[150, 150], [W - 150, 150], [150, H - 150], [W - 150, H - 150]].forEach(function (p) { center(c, '⭐', p[0], p[1], 70); });
      /* כותרת */
      stroked(c, 'תעודת גיבורה', W / 2 + 180, 230, 118, '#ffc93c', 16);
      center(c, 'מוענקת בגאווה ל', W / 2 + 180, 350, 48, '#5b4d7a', 800);
      stroked(c, name(), W / 2 + 180, 470, 140, '#ff2e93', 18);
      /* ההישג */
      center(c, (cert.ico || '🏅') + '  ' + cert.line, W / 2 + 180, 620, 64, INK, 900, 900);
      center(c, 'כל הכבוד, גיבורת-על אמיתית!', W / 2 + 180, 720, 46, '#5b4d7a', 800);
      /* חותמת + תאריך */
      c.save(); c.translate(W / 2 + 180, 880);
      c.fillStyle = '#ffc93c'; c.strokeStyle = INK; c.lineWidth = 8;
      c.beginPath(); for (var k = 0; k < 24; k++) { var a = k * Math.PI / 12, r2 = k % 2 ? 78 : 96; c.lineTo(Math.cos(a) * r2, Math.sin(a) * r2); } c.closePath(); c.fill(); c.stroke();
      center(c, '🏆', 0, 4, 80); c.restore();
      center(c, dateHe(cert.date ? new Date(cert.date) : new Date()), W / 2 - 60, 880, 40, '#5b4d7a', 800);
      center(c, 'עולם הגיבורות', W / 2 + 420, 880, 40, '#5b4d7a', 800);
      /* הגיבורה */
      if (hero) { c.save(); c.shadowColor = 'rgba(27,16,54,.35)'; c.shadowBlur = 30; c.drawImage(hero, 150, 250, 480, 600); c.restore(); }
      else center(c, '🦸‍♀️', 390, 550, 260);
    });
  }
  /* award(cert) — מעניקים תעודה: נשמרת ברשימה ומוצגת (אם show !== false) */
  function award(cert, showIt) {
    cert = Object.assign({ id: 'c' + Date.now(), date: Date.now() }, cert);
    var list = certs();
    if (cert.key && list.some(function (x) { return x.key === cert.key; })) return null;   // אותה תעודה פעם אחת
    list.unshift(cert); while (list.length > 60) list.pop();
    try { localStorage.setItem(CERT_KEY, JSON.stringify(list)); } catch (e) {}
    if (showIt !== false) setTimeout(function () { showCert(cert, true); }, 400);
    return cert;
  }
  function showCert(cert, fresh) {
    certCanvas(cert).then(function (cv) {
      show(cv, { kicker: '🏅 תעודת גיבורה', file: 'תעודה-' + name() + '.png', text: name() + ' קיבלה תעודת גיבורה: ' + cert.line + ' 🏅', print: true });
      if (fresh) { snd('ding'); say('קיבלת תעודת גיבורה! ' + cert.line); try { if (window.HeroRewards) HeroRewards.confetti(); } catch (e) {} }
    });
  }

  /* ---------- פרק 4 — ציור מהגלריה ---------- */
  /* drawingCanvas(item) — item מהגלריה ({type:'svg'|'img', data}) → תמונה עם מסגרת ושם הציירת */
  function drawingCanvas(item) {
    var W = 1200, H = 1200, cv = document.createElement('canvas'); cv.width = W; cv.height = H; var c = cv.getContext('2d');
    var load = item.type === 'svg' ? svgImage(item.data, 1000, 1000) : new Promise(function (res) { var im = new Image(); im.onload = function () { res(im); }; im.onerror = function () { res(null); }; im.src = item.data; });
    return fontsReady().then(function () { return load; }).then(function (img) {
      c.fillStyle = '#fffaf0'; c.fillRect(0, 0, W, H);
      c.lineWidth = 22; c.strokeStyle = INK; rr(c, 24, 24, W - 48, H - 48, 40); c.stroke();
      c.lineWidth = 8; c.strokeStyle = '#ff2e93'; rr(c, 48, 48, W - 96, H - 96, 30); c.stroke();
      if (img) { var s = Math.min((W - 160) / img.width, (H - 300) / img.height), w = img.width * s, h = img.height * s; c.drawImage(img, (W - w) / 2, 90 + (H - 300 - h) / 2, w, h); }
      stroked(c, '🎨 צוירה ע״י ' + name(), W / 2, H - 150, 64, '#ffc93c', 12);
      center(c, 'עולם הגיבורות · ' + dateHe(item.t ? new Date(item.t) : new Date()), W / 2, H - 80, 34, '#5b4d7a', 800);
      return cv;
    });
  }
  function shareDrawing(item) { return drawingCanvas(item).then(function (cv) { return show(cv, { kicker: '🖼️ הציור שלי', file: 'ציור-' + name() + '.png', text: 'ציור של ' + name() + ' 🎨' }); }); }

  /* ---------- פרק 5 — דוח שבועי ---------- */
  function weeklyCanvas() {
    var W = 1200, H = 1500;
    var P = window.Progress, days = P ? P.days() : {}, sum = function (evt) { var s = 0; for (var i = 0; i < 7; i++) { var d = new Date(); d.setDate(d.getDate() - i); var x = days[d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()]; if (x) s += evt === 'min' ? x.min : (x.ev[evt] || 0); } return s; };
    var names = { numbers: 'מספרים', colors: 'צבעים', shapes: 'צורות', patterns: 'דפוסים', letters: 'אותיות', english: 'אנגלית', animals: 'חיות', food: 'אוכל', size: 'גודל', memory: 'זיכרון', puzzles: 'פאזלים', math: 'חשבון', music: 'מוזיקה', reading: 'קריאה', wordbuild: 'בונים מילים', language: 'שפה', envocab: 'מילים באנגלית', enspell: 'איות', nature: 'טבע' };
    return compose(W, H, 320, 400, function (c, hero) {
      var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a1260'); g.addColorStop(1, '#6a1b8f'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.fillStyle = '#fffaf0'; rr(c, 40, 40, W - 80, H - 80, 44); c.fill(); c.lineWidth = 14; c.strokeStyle = INK; c.stroke();
      stroked(c, 'השבוע של ' + name(), W / 2 + 120, 140, 84, '#ff2e93', 14);
      var d0 = new Date(); d0.setDate(d0.getDate() - 6);
      center(c, dateHe(d0) + ' – ' + dateHe(), W / 2 + 120, 230, 38, '#5b4d7a', 800);
      if (hero) c.drawImage(hero, 70, 70, 240, 300); else center(c, '🦸‍♀️', 190, 220, 160);
      var tiles = [['⏱️', sum('min'), 'דקות משחק'], ['📚', sum('answer'), 'שאלות שנפתרו'], ['📖', sum('story:read'), 'סיפורים'], ['🎨', sum('art:save'), 'ציורים'],
                   ['⭐', window.HeroRewards ? HeroRewards.state.level : 1, 'רמת גיבורה'], ['🏆', P ? P.trophies() : 0, 'נבלים שהובסו']];
      tiles.forEach(function (t, i) {
        var col = i % 2, row = (i / 2) | 0, x = 90 + col * 520, y = 400 + row * 230;
        c.fillStyle = ['#ffe0f0', '#e0f6ff', '#fff3b0', '#e0fff1', '#efe6ff', '#ffe9d6'][i]; rr(c, x, y, 500, 200, 30); c.fill(); c.lineWidth = 8; c.strokeStyle = INK; c.stroke();
        center(c, t[0], x + 420, y + 100, 80); center(c, String(t[1]), x + 230, y + 80, 90, INK, 900); center(c, t[2], x + 230, y + 160, 38, '#5b4d7a', 800);
      });
      var strong = P ? P.strongStations() : [], weak = P ? P.weakStations() : [];
      center(c, strong.length ? '💪 חזקה ב: ' + strong.map(function (k) { return names[k] || k; }).join(', ') : '💪 ממשיכות לצבור ניסיון!', W / 2, 1150, 44, INK, 900, W - 160);
      center(c, weak.length ? '🎯 שווה לתרגל: ' + weak.map(function (k) { return names[k] || k; }).join(', ') : '🌟 מתקדמת יפה בכל הנושאים', W / 2, 1230, 40, '#5b4d7a', 800, W - 160);
      center(c, 'עולם הגיבורות · בלי פרסומות · הכול נשמר במכשיר', W / 2, H - 110, 32, '#5b4d7a', 800);
    });
  }

  /* ---------- פרק 6 — כרטיס הזמנה ---------- */
  function inviteCanvas() {
    var W = 1200, H = 1500, url = appUrl() + 'welcome.html';     // דף ההסבר: מה זה + איך מתקינים
    return compose(W, H, 400, 500, function (c, hero) {
      var g = c.createRadialGradient(W / 2, 400, 50, W / 2, 400, 1100); g.addColorStop(0, '#6a1b8f'); g.addColorStop(1, '#1d0b4a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.save(); c.translate(W / 2, 420); c.fillStyle = 'rgba(255,201,60,.12)';
      for (var i = 0; i < 30; i++) { c.rotate(Math.PI / 15); c.beginPath(); c.moveTo(0, 0); c.lineTo(-50, -1400); c.lineTo(50, -1400); c.closePath(); c.fill(); }
      c.restore();
      stroked(c, 'בואי לשחק איתי!', W / 2, 120, 96, '#ffc93c', 16);
      stroked(c, 'בעולם הגיבורות 🦸‍♀️', W / 2, 230, 70, '#fff', 12);
      if (hero) c.drawImage(hero, W / 2 - 200, 280, 400, 500); else center(c, '🦸‍♀️', W / 2, 540, 300);
      c.fillStyle = '#fffaf0'; rr(c, 100, 820, W - 200, 580, 40); c.fill(); c.lineWidth = 12; c.strokeStyle = INK; c.stroke();
      if (window.QR) QR.draw(c, url, W / 2 + 90, 860, 400);
      var lines = ['📚 לומדות בכיף', '🎨 מציירות', '📖 שומעות סיפורים', '🐉 מגדלות דרקון', '🚫 בלי פרסומות'];
      lines.forEach(function (t, i) { c.direction = 'rtl'; c.font = '900 44px ' + FONT; c.fillStyle = INK; c.textAlign = 'right'; c.textBaseline = 'middle'; c.fillText(t, W / 2 - 20, 900 + i * 78); });
      center(c, 'סורקים באייפד ← Safari ← שיתוף ← "הוסף למסך הבית"', W / 2, 1310, 32, '#5b4d7a', 800, W - 240);
      center(c, 'מאת ' + name(), W / 2, H - 55, 38, '#fff', 800);
    });
  }
  function invite() { var u = appUrl() + 'welcome.html'; return inviteCanvas().then(function (cv) { return show(cv, { kicker: '💌 הזמנה לחברה', file: 'הזמנה-עולם-הגיבורות.png', text: 'בואי לשחק איתי בעולם הגיבורות! 🦸‍♀️ אפליקציית למידה בלי פרסומות: ' + u, url: u }); }); }
  function weekly() { return weeklyCanvas().then(function (cv) { return show(cv, { kicker: '📊 דוח שבועי', file: 'השבוע-של-' + name() + '.png', text: 'השבוע של ' + name() + ' בעולם הגיבורות 🌟' }); }); }

  window.Share = { send: send, show: show, award: award, certs: certs, showCert: showCert, certCanvas: certCanvas, shareDrawing: shareDrawing, drawingCanvas: drawingCanvas,
                   weekly: weekly, weeklyCanvas: weeklyCanvas, invite: invite, inviteCanvas: inviteCanvas, appUrl: appUrl, svgImage: svgImage };
})();
