/* =====================================================================
   shared/hero-rewards.js — מערכת הפרסים של אלה גיבורת-העל
   ---------------------------------------------------------------------
   פרק 1 — שמירה: אנרגיה, רמה, פריטים שנפתחו, התחפושת הנוכחית
           (מפתח ella-hero-v1 ב-localStorage, עמיד לשגיאות).
   פרק 2 — מסלול הפתיחה: באיזו רמה נפתח כל פריט.
   פרק 3 — award(): פרס על תשובה נכונה / התקדמות — פיצוץ "POW!",
           כוכב שעף אל המד, ובעלייה ברמה — חלון "תחפושת חדשה!".
   פרק 4 — HUD: תג רמה + מד אנרגיה + מטבעות (mountHUD).
   פרק 5 — ארון התחפושות: openWardrobe() — בחירת פריטים והלבשה.
   תלויות: shared/hero-avatar.js (חובה), shared/wallet.js ו-js/audio.js (אופציונלי).
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- פרק 1 — שמירה ---------- */
  var KEY = 'ella-hero-v1';

  /* מצב התחלתי: רמה 1, אפס אנרגיה, רק פריטי ברירת המחדל פתוחים */
  function fresh() {
    var o = HeroAvatar.defaultOutfit();
    return { level: 1, energy: 0, total: 0, unlocked: [o.cape, o.suit, o.mask, o.emblem, o.aura], outfit: o };
  }
  /* טעינה עם הגנה: קובץ פגום/חסר → מצב התחלתי; שדות חסרים מקבלים ברירת מחדל */
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY));
      if (!s) return fresh();
      var f = fresh();
      return {
        level: Math.max(1, s.level | 0),
        energy: Math.max(0, s.energy | 0),
        total: Math.max(0, s.total | 0),
        unlocked: Array.isArray(s.unlocked) ? s.unlocked.concat(f.unlocked.filter(function (id) { return s.unlocked.indexOf(id) < 0; })) : f.unlocked,
        outfit: Object.assign(f.outfit, s.outfit || {})
      };
    } catch (e) { return fresh(); }
  }
  var state = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  /* ---------- פרק 2 — מסלול הפתיחה ---------- */
  /* כל רמה חדשה פותחת פריט אחד. הסדר מתחלף בין חריצים כדי שתמיד יהיה משהו חדש ומרגש */
  var UNLOCKS = [
    null, null,                        // רמה 0–1: אין (מתחילים עם ברירות המחדל)
    ['suit', 'suit_cyan'],             // רמה 2
    ['emblem', 'emb_star'],            // רמה 3
    ['aura', 'aura_sparkle'],          // רמה 4 — הכוח הראשון!
    ['cape', 'cape_galaxy'],           // רמה 5
    ['mask', 'mask_star'],             // רמה 6
    ['emblem', 'emb_bolt'],            // רמה 7
    ['aura', 'aura_bolt'],             // רמה 8
    ['suit', 'suit_night'],            // רמה 9
    ['cape', 'cape_gold'],             // רמה 10
    ['mask', 'mask_butterfly'],        // רמה 11
    ['aura', 'aura_wings'],            // רמה 12 — טיסה!
    ['cape', 'cape_rainbow'],          // רמה 13
    ['mask', 'mask_cat'],              // רמה 14
    ['emblem', 'emb_butterfly'],       // רמה 15
    ['suit', 'suit_mint'],             // רמה 16
    ['aura', 'aura_shield']            // רמה 17 — מגן הכוכבים
  ];
  var MAX_LEVEL = UNLOCKS.length - 1;

  /* כמה אנרגיה צריך כדי לעלות מהרמה הנוכחית: מתחיל ב-4 ועולה בהדרגה */
  function need(level) { return 3 + level; }

  /* ---------- כלים קטנים ---------- */
  function $(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function snd(name) { try { if (window.Sound && Sound[name]) Sound[name](); } catch (e) {} }
  function say(t) { try { if (window.Voice) Voice.say(t, { rate: .95, pitch: 1.2 }); } catch (e) {} }
  var WORDS = ['POW!', 'BOOM!', 'יש!', 'וואו!', 'גיבורה!', 'מדהים!', 'ZAP!', 'אלופה!'];
  var POW_COLORS = ['#ffc93c', '#ff2e93', '#29e0ff', '#3ff2b0', '#8b5cff'];

  /* כוכב משונן (פיצוץ קומיקס) כ-SVG */
  function burstSVG(color) {
    var d = '', n = 14;
    for (var i = 0; i < n * 2; i++) {
      var r = i % 2 ? 44 : 74 + (i % 4 ? 0 : 8), a = (i / (n * 2)) * Math.PI * 2;
      d += (i ? 'L' : 'M') + (95 + Math.cos(a) * r * 1.22).toFixed(1) + ' ' + (75 + Math.sin(a) * r * .95).toFixed(1);
    }
    return '<svg viewBox="0 0 190 150"><path d="' + d + 'Z" fill="' + color + '" stroke="#1b1036" stroke-width="5" stroke-linejoin="round"/></svg>';
  }

  /* מיקום מרכז של אלמנט (או מרכז המסך) */
  function centerOf(el) {
    if (el && el.getBoundingClientRect) { var r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
    return { x: innerWidth / 2, y: innerHeight / 2 };
  }

  /* ---------- פרק 3 — פרסים ---------- */
  /* pow(originEl, word) — פיצוץ קומיקס ויזואלי בלבד (בלי אנרגיה) */
  function pow(originEl, word) {
    var p = centerOf(originEl);
    var el = $('div', 'h-pow');
    el.innerHTML = burstSVG(POW_COLORS[(Math.random() * POW_COLORS.length) | 0]) + '<span>' + (word || WORDS[(Math.random() * WORDS.length) | 0]) + '</span>';
    el.style.left = Math.min(innerWidth - 100, Math.max(100, p.x)) + 'px';
    el.style.top = Math.max(80, p.y - 40) + 'px';
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 950);
  }

  var huds = [];            // כל ה-HUD-ים הפעילים בדף (לעדכון)
  var pendingUnlocks = [];  // פריטים שנפתחו וממתינים לחלון חגיגה

  /* award(amount, originEl, opts)
     amount   — כמה אנרגיה (תשובה נכונה = 1, תחנה שהושלמה = 3)
     originEl — מאיפה יוצא הפיצוץ (הכפתור שנלחץ)
     opts.word — מילה לפיצוץ (אחרת אקראית); opts.quiet — בלי פיצוץ
     מחזיר { levelUp: bool, unlocked: [פריטים] } */
  function award(amount, originEl, opts) {
    opts = opts || {};
    amount = Math.max(1, amount | 0);
    var p = centerOf(originEl);

    /* 3.1 פיצוץ קומיקס במקום הלחיצה */
    if (!opts.quiet) pow(originEl, opts.word);

    /* 3.2 כוכבי אנרגיה עפים אל ה-HUD (אם יש) */
    var hud = huds[0];
    if (hud) {
      var t = centerOf(hud.meter);
      for (var i = 0; i < Math.min(amount, 4); i++) (function (i) {
        var s = $('div', 'h-fly', '⚡');
        s.style.left = p.x + 'px'; s.style.top = p.y + 'px';
        document.body.appendChild(s);
        var anim = s.animate([
          { transform: 'translate(-50%,-50%) scale(.6)', opacity: 0 },
          { transform: 'translate(calc(-50% + ' + ((t.x - p.x) * .3 + (i - 1) * 40) + 'px), calc(-50% + ' + ((t.y - p.y) * .2 - 90) + 'px)) scale(1.4)', opacity: 1, offset: .35 },
          { transform: 'translate(calc(-50% + ' + (t.x - p.x) + 'px), calc(-50% + ' + (t.y - p.y) + 'px)) scale(.7)', opacity: .9 }
        ], { duration: 820 + i * 90, easing: 'cubic-bezier(.3,.7,.3,1)' });
        anim.onfinish = function () { s.remove(); };
      })(i);
    }

    /* 3.3 חישוב אנרגיה ועליות רמה */
    state.total += amount;
    state.energy += amount;
    var result = { levelUp: false, unlocked: [] };
    while (state.level < MAX_LEVEL && state.energy >= need(state.level)) {
      state.energy -= need(state.level);
      state.level++;
      result.levelUp = true;
      var u = UNLOCKS[state.level];
      if (u && state.unlocked.indexOf(u[1]) < 0) {
        state.unlocked.push(u[1]);
        var it = HeroAvatar.item(u[0], u[1]);
        result.unlocked.push({ slot: u[0], item: it });
        pendingUnlocks.push({ slot: u[0], item: it, level: state.level });
      }
    }
    /* ברמה המקסימלית המד נשאר מלא ומכיל עד 99 */
    if (state.level >= MAX_LEVEL) state.energy = Math.min(state.energy, 99);
    save();
    setTimeout(refreshHUDs, 700);   // מעדכנים אחרי שהכוכבים "נוחתים"

    /* 3.4 חלון חגיגה על עלייה ברמה (מעט אחרי הפיצוץ) */
    if (result.levelUp) setTimeout(showNextUnlock, 1000);
    return result;
  }

  /* מציג את חלון החגיגה הבא בתור (אם נפתחו כמה פריטים בבת אחת — אחד אחרי השני) */
  function showNextUnlock() {
    var u = pendingUnlocks.shift();
    if (!u) return;
    var preview = Object.assign({}, state.outfit); preview[u.slot] = u.item.id;
    var isPower = u.slot === 'aura';
    openModal(
      '<span class="h-modal-kicker">רמה ' + u.level + '!</span>' +
      '<div class="h-modal-hero">' + HeroAvatar.svg(preview) + '</div>' +
      '<h2>' + (isPower ? 'כוח חדש: ' : 'חדש בארון: ') + u.item.name + ' ' + u.item.ico + '</h2>' +
      '<p>' + (isPower ? 'אלה קיבלה כוח-על חדש!' : 'פריט חדש לתחפושת של אלה!') + '</p>',
      [
        { text: 'ללבוש עכשיו! 🦸‍♀️', cls: 'h-btn gold', fn: function () { wear(u.slot, u.item.id); } },
        { text: 'אחר כך', cls: 'h-btn violet', fn: function () {} }
      ],
      function () { setTimeout(showNextUnlock, 250); }
    );
    snd('ding'); confetti();
    say(isPower ? 'וואו! כוח חדש! ' + u.item.name : 'עלית רמה! ' + u.item.name);
  }

  /* חלון כללי: html לתוכן + כפתורים. onClose נקרא אחרי כל סגירה */
  function openModal(html, buttons, onClose) {
    var m = $('div', 'h-modal show');
    var card = $('div', 'h-modal-card h-panel', html);
    var actions = $('div', 'h-modal-actions');
    (buttons || []).forEach(function (b) {
      var btn = $('button', b.cls, b.text); btn.type = 'button';
      btn.addEventListener('click', function () { snd('tap'); m.remove(); b.fn && b.fn(); onClose && onClose(); });
      actions.appendChild(btn);
    });
    card.appendChild(actions);
    m.appendChild(card);
    document.body.appendChild(m);
    return m;
  }

  /* קונפטי צבעוני שנופל */
  function confetti() {
    for (var i = 0; i < 36; i++) {
      var c = $('div', 'h-confetti');
      c.style.left = (Math.random() * 100) + 'vw';
      c.style.background = POW_COLORS[i % POW_COLORS.length];
      document.body.appendChild(c);
      var a = c.animate([
        { transform: 'translateY(0) rotate(0)', opacity: 1 },
        { transform: 'translate(' + (Math.random() * 160 - 80) + 'px,' + (innerHeight + 60) + 'px) rotate(' + (Math.random() * 720) + 'deg)', opacity: 1 }
      ], { duration: 1600 + Math.random() * 1400, delay: Math.random() * 400, easing: 'cubic-bezier(.3,.6,.4,1)' });
      a.onfinish = (function (el) { return function () { el.remove(); }; })(c);
    }
  }

  /* הלבשה: שומר את הפריט בחריץ ומודיע לדף (אירוע hero:outfit) כדי שהדמות תתעדכן */
  function wear(slot, id) {
    if (state.unlocked.indexOf(id) < 0) return false;
    state.outfit[slot] = id; save();
    window.dispatchEvent(new CustomEvent('hero:outfit', { detail: state.outfit }));
    return true;
  }

  /* ---------- פרק 4 — HUD ---------- */
  /* mountHUD(parent) — יוצר תג רמה + מד אנרגיה + מטבעות בתוך parent */
  function mountHUD(parent, opts) {
    opts = opts || {};
    var root = $('div', 'h-hud');
    root.innerHTML =
      '<div class="h-level" aria-label="רמה">1</div>' +
      '<div class="h-hud-mid"><div class="h-hud-title">אנרגיית גיבורה</div><div class="h-meter"><div class="h-meter-fill"></div></div></div>' +
      (opts.coins === false ? '' : '<div class="h-coins">🪙 0</div>');
    parent.appendChild(root);
    var h = { root: root, lvl: root.querySelector('.h-level'), meter: root.querySelector('.h-meter'), fill: root.querySelector('.h-meter-fill'),
              title: root.querySelector('.h-hud-title'), coins: root.querySelector('.h-coins') };
    huds.push(h);
    refreshHUDs();
    return h;
  }
  function refreshHUDs() {
    huds.forEach(function (h) {
      var max = state.level >= MAX_LEVEL;
      h.lvl.textContent = state.level;
      h.fill.style.width = (max ? 100 : Math.min(100, state.energy / need(state.level) * 100)) + '%';
      h.title.textContent = max ? 'גיבורת-על מושלמת! 🌟' : 'אנרגיה: ' + state.energy + '/' + need(state.level) + ' ⚡';
      if (h.coins && window.Wallet) h.coins.textContent = '🪙 ' + Wallet.coins;
    });
  }

  /* ---------- פרק 5 — ארון התחפושות ---------- */
  function openWardrobe() {
    var m = $('div', 'h-modal show h-wardrobe');
    var card = $('div', 'h-modal-card h-panel h-ward-card');
    var activeSlot = 'cape';
    m.appendChild(card);
    document.body.appendChild(m);

    function render() {
      var slots = Object.keys(HeroAvatar.CATALOG);
      var html = '<button type="button" class="h-ward-close" aria-label="סגירה">✖</button>' +
        '<span class="h-modal-kicker">ארון התחפושות</span>' +
        '<div class="h-ward-body"><div class="h-ward-hero">' + HeroAvatar.svg(state.outfit) + '</div><div class="h-ward-side">' +
        '<div class="h-ward-tabs">' + slots.map(function (s) {
          return '<button type="button" data-slot="' + s + '" class="h-ward-tab' + (s === activeSlot ? ' on' : '') + '">' + HeroAvatar.SLOT_NAMES[s] + '</button>';
        }).join('') + '</div><div class="h-ward-grid">';
      HeroAvatar.CATALOG[activeSlot].forEach(function (it, idx) {
        var open = state.unlocked.indexOf(it.id) >= 0, on = state.outfit[activeSlot] === it.id;
        var lvl = 0; for (var L = 0; L < UNLOCKS.length; L++) if (UNLOCKS[L] && UNLOCKS[L][1] === it.id) lvl = L;
        html += '<button type="button" class="h-ward-item' + (on ? ' on' : '') + (open ? '' : ' locked') + '" data-id="' + it.id + '">' +
          '<span class="ico">' + (open ? it.ico : '🔒') + '</span><span class="nm">' + it.name + '</span>' +
          (open ? '' : '<span class="lv">נפתח ברמה ' + lvl + '</span>') + '</button>';
      });
      html += '</div></div></div>';
      card.innerHTML = html;

      card.querySelector('.h-ward-close').onclick = function () { snd('tap'); m.remove(); };
      Array.prototype.forEach.call(card.querySelectorAll('.h-ward-tab'), function (b) {
        b.onclick = function () { snd('bubble'); activeSlot = b.dataset.slot; render(); };
      });
      Array.prototype.forEach.call(card.querySelectorAll('.h-ward-item'), function (b) {
        b.onclick = function () {
          if (b.classList.contains('locked')) { snd('sad'); say('עוד קצת למידה וזה נפתח!'); return; }
          wear(activeSlot, b.dataset.id); snd('sparkle'); render();
        };
      });
    }
    render();
  }

  /* סגנון ארון התחפושות — מוזרק פעם אחת (משתמש בטוקנים מ-theme.css) */
  var st = document.createElement('style');
  st.textContent =
    '.h-ward-card{width:min(96vw,1000px);padding:22px 24px}' +
    '.h-ward-close{position:absolute;top:12px;left:12px;width:52px;height:52px;border:4px solid var(--h-ink);border-radius:50%;background:var(--h-magenta);color:#fff;font:900 22px/1 var(--h-font);box-shadow:0 4px 0 var(--h-ink);cursor:pointer}' +
    '.h-ward-body{display:grid;grid-template-columns:minmax(180px,.8fr) 1.4fr;gap:20px;align-items:center;margin-top:12px}' +
    '.h-ward-hero{background:radial-gradient(circle at 50% 40%,#4a1c8f,#1d0b4a);border:4px solid var(--h-ink);border-radius:26px;padding:10px;box-shadow:inset 0 0 40px rgba(255,46,147,.35)}' +
    '.h-ward-hero svg{width:100%;height:auto;display:block;max-height:52vh}' +
    '.h-ward-tabs{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:14px}' +
    '.h-ward-tab{border:3px solid var(--h-ink);border-radius:999px;padding:8px 16px;background:#fff;font:800 18px/1 var(--h-font);color:var(--h-ink);cursor:pointer;box-shadow:0 3px 0 var(--h-ink)}' +
    '.h-ward-tab.on{background:var(--h-gold)}' +
    '.h-ward-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px}' +
    '.h-ward-item{position:relative;display:grid;justify-items:center;gap:4px;padding:12px 8px;border:4px solid var(--h-ink);border-radius:20px;background:#fff;cursor:pointer;font-family:var(--h-font);box-shadow:0 4px 0 var(--h-ink);transition:transform .15s var(--h-spring)}' +
    '.h-ward-item:active{transform:scale(.95)}' +
    '.h-ward-item .ico{font-size:40px;line-height:1}.h-ward-item .nm{font-weight:800;font-size:16px;color:var(--h-ink)}.h-ward-item .lv{font-size:13px;font-weight:700;color:var(--h-text-soft)}' +
    '.h-ward-item.on{background:linear-gradient(180deg,#fff3b0,#ffc93c);box-shadow:0 4px 0 var(--h-ink),0 0 0 4px rgba(255,46,147,.5)}' +
    '.h-ward-item.locked{background:#ece6f7;opacity:.8}' +
    '@media (max-width:760px){.h-ward-body{grid-template-columns:1fr}.h-ward-hero svg{max-height:34vh}}';
  document.head.appendChild(st);

  /* ---------- ייצוא ---------- */
  window.HeroRewards = {
    award: award,
    pow: pow,
    mountHUD: mountHUD,
    refresh: refreshHUDs,
    openWardrobe: openWardrobe,
    openModal: openModal,
    confetti: confetti,
    wear: wear,
    get state() { return state; },
    get outfit() { return state.outfit; },
    need: need,
    MAX_LEVEL: MAX_LEVEL
  };
})();
