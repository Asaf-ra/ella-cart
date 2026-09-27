/* =====================================================================
   js/academy-puzzle.js — פאזל גרירה איכותי לאקדמיית הגיבורים
   ---------------------------------------------------------------------
   פרק 1 — תמונות: 7 סצנות SVG מקוריות (400×300) — כל אזור בתמונה שונה
           ומזוהה, כדי שכל חתיכה תהיה ברורה לילדה.
   פרק 2 — בניית הלוח: צללית עמומה של התמונה + משבצות יעד.
   פרק 3 — המגש: החתיכות מעורבבות לצד הלוח.
   פרק 4 — גרירה (Pointer Events) + "הצמדה" כשהחתיכה קרובה למקומה.
           חלופה ללא גרירה: לוחצים על חתיכה ואז על משבצת.
   פרק 5 — עזרה עדינה: אחרי 2 טעויות המשבצת הנכונה מהבהבת.
   פרק 6 — סיום: חשיפת התמונה המלאה + api.win (כוכב ואנרגיה).
   שימוש: AcademyPuzzle.start(api, { rows, cols, ghost })
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- פרק 1 — תמונות ---------- */
  /* עוזר: אימוג'י גדול בתוך SVG (נראה חד בכל גודל) */
  function E(x, y, size, ch) { return '<text x="' + x + '" y="' + y + '" font-size="' + size + '" text-anchor="middle" dominant-baseline="central">' + ch + '</text>'; }
  /* עוזר: עננים מעוגלים */
  function cloud(x, y, s) { return '<g fill="#fff" opacity=".95"><circle cx="' + x + '" cy="' + y + '" r="' + (14 * s) + '"/><circle cx="' + (x + 16 * s) + '" cy="' + (y - 8 * s) + '" r="' + (17 * s) + '"/><circle cx="' + (x + 34 * s) + '" cy="' + y + '" r="' + (13 * s) + '"/><rect x="' + x + '" y="' + y + '" width="' + (34 * s) + '" height="' + (12 * s) + '"/></g>'; }
  /* עוזר: קשת בענן */
  function rainbow(cx, cy, r) {
    var cols = ['#ff4f7b', '#ffa53b', '#ffe45c', '#4fe0a0', '#4fb4ff', '#9b6bff'], s = '';
    cols.forEach(function (c, i) { s += '<path d="M' + (cx - r + i * 12) + ' ' + cy + ' A' + (r - i * 12) + ' ' + (r - i * 12) + ' 0 0 1 ' + (cx + r - i * 12) + ' ' + cy + '" fill="none" stroke="' + c + '" stroke-width="12"/>'; });
    return s;
  }

  /* כל סצנה: name לתצוגה והקראה, draw() מחזיר את תוכן ה-SVG */
  var SCENES = [
    { name: 'אלה גיבורת-העל', draw: function () {
      var hero = window.HeroAvatar ? HeroAvatar.svg(window.HeroRewards ? HeroRewards.outfit : null).replace('<svg ', '<svg x="120" y="20" width="160" height="200" ') : E(200, 120, 120, '🦸‍♀️');
      return '<defs><linearGradient id="pzA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1260"/><stop offset="1" stop-color="#ff5d8f"/></linearGradient></defs>' +
        '<rect width="400" height="300" fill="url(#pzA)"/>' +
        '<path d="M0 300V230h40v-30h30v40h40v-60h30v70h160v-50h40v-30h30v50h30v70z" fill="#140a33"/>' +
        '<g fill="#ffd95a" opacity=".8"><rect x="50" y="215" width="6" height="8"/><rect x="120" y="200" width="6" height="8"/><rect x="330" y="225" width="6" height="8"/></g>' +
        E(40, 40, 30, '⭐') + E(360, 50, 34, '🌙') + E(330, 150, 26, '✨') + E(60, 140, 26, '💫') + hero;
    } },
    { name: 'החלל', draw: function () {
      return '<rect width="400" height="300" fill="#0d0630"/>' +
        '<g fill="#fff"><circle cx="30" cy="30" r="2"/><circle cx="120" cy="70" r="1.5"/><circle cx="220" cy="20" r="2"/><circle cx="380" cy="90" r="2"/><circle cx="60" cy="250" r="1.5"/><circle cx="300" cy="270" r="2"/></g>' +
        '<circle cx="300" cy="90" r="50" fill="#ff9f43"/><ellipse cx="300" cy="90" rx="80" ry="16" fill="none" stroke="#ffd95a" stroke-width="7"/>' +
        '<circle cx="80" cy="220" r="36" fill="#4fb4ff"/><path d="M60 205q15-8 25 5t20 0" stroke="#3ff2b0" stroke-width="10" fill="none"/>' +
        E(190, 160, 90, '🚀') + E(80, 70, 50, '🌙') + E(330, 230, 48, '👽') + E(230, 260, 30, '⭐');
    } },
    { name: 'החד-קרן', draw: function () {
      return '<rect width="400" height="300" fill="#bfe9ff"/>' + rainbow(200, 250, 170) +
        cloud(20, 60, 1.4) + cloud(300, 50, 1.2) + '<rect y="250" width="400" height="50" fill="#7ee08a"/>' +
        E(200, 190, 110, '🦄') + E(60, 260, 34, '🌸') + E(350, 262, 34, '🌷') + E(340, 150, 36, '⭐') + E(60, 160, 32, '🦋');
    } },
    { name: 'מתחת לים', draw: function () {
      return '<defs><linearGradient id="pzS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fd3ff"/><stop offset="1" stop-color="#1459b8"/></linearGradient></defs>' +
        '<rect width="400" height="300" fill="url(#pzS)"/><rect y="265" width="400" height="35" fill="#f7d98b"/>' +
        '<path d="M40 270q-10-40 5-80t0-60" stroke="#2ecc71" stroke-width="8" fill="none"/><path d="M370 270q10-50-5-90" stroke="#2ecc71" stroke-width="8" fill="none"/>' +
        '<g fill="none" stroke="#fff" stroke-width="2" opacity=".7"><circle cx="120" cy="60" r="8"/><circle cx="130" cy="35" r="5"/><circle cx="280" cy="40" r="7"/></g>' +
        E(110, 130, 64, '🐠') + E(290, 120, 70, '🐙') + E(200, 220, 70, '🐢') + E(340, 255, 30, '🐚') + E(70, 250, 32, '⭐');
    } },
    { name: 'הטירה', draw: function () {
      return '<rect width="400" height="300" fill="#ffd6ec"/>' + cloud(40, 50, 1.2) + cloud(290, 70, 1) +
        '<circle cx="340" cy="50" r="28" fill="#ffe45c"/><path d="M0 240q100-40 200 0t200 0v60H0z" fill="#7ee08a"/>' +
        E(200, 150, 130, '🏰') + E(60, 250, 36, '🌻') + E(340, 250, 36, '🌹') + E(90, 140, 36, '🐉') + E(320, 150, 32, '👑');
    } },
    { name: 'הדינוזאורים', draw: function () {
      return '<rect width="400" height="300" fill="#ffe1b3"/><path d="M230 190l60-110 60 110z" fill="#8b5a3c"/><path d="M270 100q20-40 40-10" stroke="#ff5a1f" stroke-width="10" fill="none"/>' +
        '<rect y="230" width="400" height="70" fill="#9bd46a"/>' +
        E(110, 170, 110, '🦕') + E(320, 70, 36, '☁️') + E(60, 70, 40, '☀️') + E(330, 250, 40, '🥚') + E(220, 250, 44, '🌴');
    } },
    { name: 'החווה', draw: function () {
      return '<rect width="400" height="300" fill="#aee4ff"/>' + cloud(150, 40, 1.1) + '<rect y="200" width="400" height="100" fill="#8fd86a"/>' +
        '<path d="M250 200v-70l50-40 50 40v70z" fill="#e74c3c" stroke="#fff" stroke-width="5"/><rect x="285" y="160" width="30" height="40" fill="#fff"/>' +
        E(90, 190, 80, '🐄') + E(200, 250, 50, '🐔') + E(350, 255, 46, '🚜') + E(60, 60, 44, '🌞') + E(40, 270, 32, '🌻');
    } }
  ];

  /* ---------- כלים ---------- */
  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var sceneIdx = Math.floor(Math.random() * SCENES.length);   // מתחלפים ברצף כדי שכל פעם תהיה תמונה אחרת

  /* SVG של כל התמונה או של חתיכה אחת (viewBox חותך את האזור) */
  function sceneSVG(inner, vb) { return '<svg viewBox="' + vb + '" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">' + inner + '</svg>'; }

  /* ---------- פרק 2–6 — משחק ---------- */
  function start(api, opts) {
    var rows = opts.rows, cols = opts.cols, ghost = opts.ghost == null ? .3 : opts.ghost;
    var scene = SCENES[sceneIdx++ % SCENES.length], inner = scene.draw();
    var pw = 400 / cols, ph = 300 / rows, total = rows * cols, placed = 0, wrongs = {}, selected = null, done = false;
    var root = api.el.target;

    api.setRound({ speak: 'בונים את הפאזל של ' + scene.name + '! גררו כל חתיכה למקום שלה.', custom: true });
    api.el.instruction.textContent = 'פאזל: ' + scene.name + ' (' + total + ' חתיכות)';
    api.el.helper.textContent = 'גוררים חתיכה ללוח — כשהיא קרובה למקום הנכון היא נצמדת. אפשר גם ללחוץ על חתיכה ואז על משבצת.';
    root.className = 'target pz-zone';
    root.innerHTML = '';
    api.el.answers.className = 'answer-grid pz-hidden';
    api.el.answers.innerHTML = '';
    var card = root.closest('.prompt-card'); if (card) card.classList.add('pz-mode');

    /* 2 — הלוח: צללית + משבצות */
    var board = el('div', 'pz-board');
    board.style.setProperty('--cols', cols); board.style.setProperty('--rows', rows);
    var shade = el('div', 'pz-ghost'); shade.innerHTML = sceneSVG(inner, '0 0 400 300'); shade.style.opacity = ghost;
    board.appendChild(shade);
    var slots = [];
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var s = el('div', 'pz-slot'); s.dataset.i = r * cols + c;
      s.style.left = (c / cols * 100) + '%'; s.style.top = (r / rows * 100) + '%';
      s.style.width = (100 / cols) + '%'; s.style.height = (100 / rows) + '%';
      s.addEventListener('click', function () { if (selected) tryPlace(selected, +this.dataset.i); });
      board.appendChild(s); slots.push(s);
    }

    /* 3 — המגש: חתיכות מעורבבות */
    var tray = el('div', 'pz-tray');
    tray.style.setProperty('--cols', Math.min(cols, total <= 6 ? 2 : total <= 9 ? 3 : 4));
    shuffle(Array.from({ length: total }, function (_, i) { return i; })).forEach(function (i) {
      var p = el('div', 'pz-piece'); p.dataset.i = i;
      var pr = Math.floor(i / cols), pc = i % cols;
      p.innerHTML = sceneSVG(inner, (pc * pw) + ' ' + (pr * ph) + ' ' + pw + ' ' + ph);
      p.style.aspectRatio = (pw / ph).toFixed(3);
      bindDrag(p);
      tray.appendChild(p);
    });
    root.appendChild(board); root.appendChild(tray);

    /* 4 — גרירה: החתיכה עוקבת אחרי האצבע בגודל של משבצת, ובשחרור בודקים את המשבצת שמתחת */
    function bindDrag(p) {
      var sx = 0, sy = 0, moved = false, drag = null;
      p.addEventListener('pointerdown', function (e) {
        if (done || p.classList.contains('placed')) return;
        e.preventDefault(); p.setPointerCapture(e.pointerId);
        sx = e.clientX; sy = e.clientY; moved = false;
        api.sound('tap');
        var cell = slots[0].getBoundingClientRect();
        drag = { w: cell.width, h: cell.height };
      });
      p.addEventListener('pointermove', function (e) {
        if (!drag) return;
        if (!moved && Math.hypot(e.clientX - sx, e.clientY - sy) < 8) return;
        if (!moved) { moved = true; p.classList.add('dragging'); p.style.width = drag.w + 'px'; p.style.height = drag.h + 'px'; }
        p.style.left = (e.clientX - drag.w / 2) + 'px'; p.style.top = (e.clientY - drag.h / 2) + 'px';
        var over = slotAt(e.clientX, e.clientY);
        slots.forEach(function (s) { s.classList.toggle('over', s === over); });
      });
      function end(e) {
        if (!drag) return;
        var wasMoved = moved; drag = null;
        slots.forEach(function (s) { s.classList.remove('over'); });
        if (!wasMoved) { select(p); return; }   // לחיצה קצרה = בחירה (מצב לחיצות)
        var over = slotAt(e.clientX, e.clientY);
        resetDrag(p);
        if (over) tryPlace(p, +over.dataset.i); else api.sound('bubble');
      }
      p.addEventListener('pointerup', end);
      p.addEventListener('pointercancel', function () { drag = null; resetDrag(p); });
    }
    function resetDrag(p) { p.classList.remove('dragging'); p.style.left = p.style.top = p.style.width = p.style.height = ''; }
    /* המשבצת הפנויה שמתחת לנקודה (עם מרווח סלחני) */
    function slotAt(x, y) {
      for (var i = 0; i < slots.length; i++) {
        var b = slots[i].getBoundingClientRect(), pad = b.width * .15;
        if (!slots[i].classList.contains('filled') && x > b.left - pad && x < b.right + pad && y > b.top - pad && y < b.bottom + pad) return slots[i];
      }
      return null;
    }
    function select(p) {
      if (selected) selected.classList.remove('sel');
      selected = selected === p ? null : p;
      if (selected) { selected.classList.add('sel'); api.feedback('', 'עכשיו לחצו על המקום בלוח 👆'); }
    }

    /* ניסיון הנחה: נכון → נצמד; לא נכון → חוזר למגש עם רמז עדין */
    function tryPlace(p, slotIndex) {
      var i = +p.dataset.i;
      if (selected) { selected.classList.remove('sel'); selected = null; }
      if (i === slotIndex) {
        var s = slots[slotIndex];
        s.classList.add('filled'); s.classList.remove('hint');
        s.appendChild(p); p.classList.add('placed'); p.style.aspectRatio = '';
        placed++;
        api.sound('pop');
        api.feedback('good', placed === total ? 'הפאזל הושלם! 🎉' : ['יופי!', 'מדויק!', 'בול!', 'מעולה!'][placed % 4] + ' עוד ' + (total - placed));
        if (placed === total) finish(board);
      } else {
        wrongs[i] = (wrongs[i] || 0) + 1;
        api.sound('sad');
        p.classList.remove('shake'); void p.offsetWidth; p.classList.add('shake');
        api.feedback('try', 'כמעט! חפשו איפה החלק הזה בתמונה.');
        /* 5 — אחרי 2 טעויות עם אותה חתיכה: המשבצת הנכונה מהבהבת */
        if (wrongs[i] >= 2) { slots[i].classList.add('hint'); setTimeout(function () { slots[i].classList.remove('hint'); }, 2600); }
      }
    }

    /* 6 — סיום: חשיפה מלאה + פרס */
    function finish(boardEl) {
      done = true;
      boardEl.classList.add('complete');
      shade.style.opacity = 1;
      setTimeout(function () { api.win(boardEl, 'הרכבת את ' + scene.name + '! 🧩', 'וואו! הרכבת את הפאזל של ' + scene.name + '!'); }, 450);
    }
  }

  window.AcademyPuzzle = { start: start, SCENES: SCENES };
})();
