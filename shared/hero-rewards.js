/* =====================================================================
   shared/hero-rewards.js — מערכת הפרסים של אלה גיבורת-העל
   ---------------------------------------------------------------------
   פרק 1 — שמירה: אנרגיה, רמה, פריטים שנפתחו, התחפושת הנוכחית
           (מפתח ella-hero-v1 ב-localStorage, עמיד לשגיאות).
   פרק 2 — מסלול הפתיחה: באיזו רמה נפתח כל פריט.
   פרק 3 — award(): פרס על תשובה נכונה / התקדמות — פיצוץ "POW!",
           כוכב שעף אל המד, ובעלייה ברמה — חלון "תחפושת חדשה!".
   פרק 4 — HUD: תג רמה + מד אנרגיה + מטבעות (mountHUD).
   פרק 5 — ארון התחפושות: openWardrobe() — בחירת דמות מהצוות, פריטים והלבשה.
   פרק 6 — צוות הגיבורים: switchHero() — לכל דמות תחפושת משלה (state.team);
           דמות חדשה מצטרפת בעליית רמה (HeroAvatar.HEROES[].level).
   תלויות: shared/hero-avatar.js (חובה), shared/wallet.js ו-js/audio.js (אופציונלי).
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- פרק 1 — שמירה ---------- */
  var KEY = 'ella-hero-v1';

  /* מצב התחלתי: רמה 1, אפס אנרגיה, רק פריטי ברירת המחדל פתוחים */
  /* freeIds — כל הפריטים החופשיים (free:true) + ברירות המחדל: פתוחים תמיד, בלי רמה ובלי מטבעות */
  function freeIds() {
    var ids = [];
    Object.keys(HeroAvatar.CATALOG).forEach(function (slot) {
      HeroAvatar.CATALOG[slot].forEach(function (it, i) { if (i === 0 || it.free) ids.push(it.id); });
    });
    return ids;
  }
  function fresh() {
    return { level: 1, energy: 0, total: 0, unlocked: freeIds(), outfit: HeroAvatar.defaultOutfit(), gift: '', team: {} };
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
        outfit: Object.assign(f.outfit, s.outfit || {}),
        gift: typeof s.gift === 'string' ? s.gift : '',
        team: s.team && typeof s.team === 'object' ? s.team : {}
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
    ['aura', 'aura_shield'],           // רמה 17 — מגן הכוכבים
    ['acc', 'acc_tiara'],              // רמה 18 — נזר יהלומים
    ['acc', 'acc_headphones']          // רמה 19 — אוזניות DJ
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
      /* דמות חדשה מצטרפת לצוות ברמה הזו? */
      HeroAvatar.HEROES.forEach(function (h) { if (h.level === state.level && h.level > 1) pendingUnlocks.push({ hero: h, level: state.level }); });
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
    if (u.hero) {   /* חלון "חבר חדש בצוות" */
      var prevH = Object.assign({}, state.team[u.hero.id] || HeroAvatar.defaultOutfit(), { hero: u.hero.id });
      openModal('<span class="h-modal-kicker">רמה ' + u.level + '!</span><div class="h-modal-hero">' + HeroAvatar.svg(prevH) + '</div>' +
        '<h2>' + u.hero.name + (u.hero.g === 'f' ? ' הצטרפה' : ' הצטרף') + ' לצוות! ' + u.hero.ico + '</h2><p>דמות חדשה בצוות הגיבורים — אפשר לשחק איתה ולהלביש אותה!</p>',
        [{ text: 'לשחק עם ' + u.hero.name + '! 🦸', cls: 'h-btn gold', fn: function () { switchHero(u.hero.id); } }, { text: 'אחר כך', cls: 'h-btn violet', fn: function () {} }],
        function () { setTimeout(showNextUnlock, 250); });
      snd('ding'); confetti(); say('חבר חדש בצוות הגיבורים! ' + u.hero.name);
      return;
    }
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
    /* צבע סטודיו (id מסוג cape_custom) תמיד מותר; פריט רגיל — רק אם נפתח */
    if (id !== slot + '_custom' && state.unlocked.indexOf(id) < 0) return false;
    state.outfit[slot] = id; save();
    window.dispatchEvent(new CustomEvent('hero:outfit', { detail: state.outfit }));
    return true;
  }

  /* ---------- פרק 6 — צוות הגיבורים ---------- */
  /* heroUnlocked — האם הדמות כבר בצוות (לפי הרמה) */
  function heroUnlocked(id) { return HeroAvatar.hero(id).level <= state.level; }
  /* switchHero — מחליף דמות: שומר את התחפושת של הקודמת ומלביש את זו של החדשה */
  function switchHero(id) {
    if (!heroUnlocked(id)) return false;
    var cur = state.outfit.hero || 'ella';
    if (cur === id) return true;
    state.team[cur] = state.outfit;
    state.outfit = Object.assign(HeroAvatar.defaultOutfit(), state.team[id] || {}, { hero: id });
    save();
    window.dispatchEvent(new CustomEvent('hero:outfit', { detail: state.outfit }));
    return true;
  }

  /* ---------- פרק 3.5 — תיבת הפתעה יומית ----------
     פעם ביום: 5 מטבעות + קונפטי + בדיחה/עובדה מצחיקה. נשמר לפי תאריך מקומי. */
  var GIFT_LINES = ['למה הדג לא משחק כדורגל? כי הוא מפחד מהרשת! 🐟', 'ידעת? תמנון יכול לשנות צבע! 🐙', 'ידעת? דבורה מבקרת מאות פרחים ביום! 🐝',
                    'מה אומר הגזר לארנב? אל תאכל אותי, אני הכוכב! 🥕', 'ידעת? הלב של לוויתן גדול כמו מכונית! 🐋', 'גיבורה אמיתית לומדת כל יום משהו חדש! 🦸‍♀️'];
  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function giftAvailable() { return state.gift !== today(); }
  function claimGift(originEl) {
    if (!giftAvailable()) return false;
    state.gift = today(); save();
    if (window.Wallet) Wallet.add(5);
    pow(originEl, 'הפתעה!'); confetti(); snd('cha_ching');
    var line = GIFT_LINES[(Math.random() * GIFT_LINES.length) | 0];
    openModal('<span class="h-modal-kicker">🎁 תיבת ההפתעה היומית</span><div style="font-size:90px;line-height:1.1;margin:10px 0">🎁✨</div><h2>קיבלת 5 מטבעות! 🪙</h2><p>' + line + '</p><p>מחר מחכה הפתעה חדשה!</p>',
      [{ text: 'יש! 🎉', cls: 'h-btn gold', fn: function () {} }]);
    say('הפתעה! קיבלת חמישה מטבעות!');
    refreshHUDs();
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
        /* שורת צוות הגיבורים: בחירת דמות (נעולה — מציגה באיזו רמה מצטרפת) */
        '<div class="h-team">' + HeroAvatar.HEROES.map(function (h) {
          var open = heroUnlocked(h.id), on = (state.outfit.hero || 'ella') === h.id;
          var o = on ? state.outfit : Object.assign(HeroAvatar.defaultOutfit(), state.team[h.id] || {}, { hero: h.id });
          return '<button type="button" class="h-team-hero' + (on ? ' on' : '') + (open ? '' : ' locked') + '" data-hero="' + h.id + '">' +
            '<span class="th">' + HeroAvatar.svg(o, { className: 'h-team-svg' }) + (open ? '' : '<i>🔒</i>') + '</span><b>' + h.name + '</b>' + (open ? '' : '<small>רמה ' + h.level + '</small>') + '</button>';
        }).join('') + '</div>' +
        '<div class="h-ward-body"><div class="h-ward-hero">' + HeroAvatar.svg(state.outfit) + '</div><div class="h-ward-side">' +
        '<div class="h-ward-tabs">' + slots.concat(['studio']).map(function (s) {
          return '<button type="button" data-slot="' + s + '" class="h-ward-tab' + (s === activeSlot ? ' on' : '') + (s === 'studio' ? ' studio' : '') + '">' + (s === 'studio' ? '🎨 סטודיו' : HeroAvatar.SLOT_NAMES[s]) + '</button>';
        }).join('') + '<button type="button" class="h-ward-tab surprise">🎲 הפתעה!</button></div><div class="h-ward-grid' + (activeSlot === 'studio' ? ' studio-grid' : '') + '">';
      /* לשונית הסטודיו: בחירה חופשית של צבע לגלימה, לחליפה ולמסכה */
      if (activeSlot === 'studio') {
        [['cape', 'גלימה'], ['suit', 'חליפה'], ['mask', 'מסכה']].forEach(function (row) {
          html += '<div class="h-studio-row"><b>' + row[1] + '</b>' + HeroAvatar.STUDIO.map(function (c) {
            var on = state.outfit[row[0]] === row[0] + '_custom' && state.outfit.colors && state.outfit.colors[row[0]] === c;
            return '<button type="button" class="h-swatch' + (on ? ' on' : '') + '" data-slot="' + row[0] + '" data-color="' + c + '" style="background:' + c + '" aria-label="צבע"></button>';
          }).join('') + '</div>';
        });
      }
      (HeroAvatar.CATALOG[activeSlot] || []).forEach(function (it, idx) {
        var open = state.unlocked.indexOf(it.id) >= 0, on = state.outfit[activeSlot] === it.id;
        var lvl = 0; for (var L = 0; L < UNLOCKS.length; L++) if (UNLOCKS[L] && UNLOCKS[L][1] === it.id) lvl = L;
        html += '<button type="button" class="h-ward-item' + (on ? ' on' : '') + (open ? '' : ' locked') + '" data-id="' + it.id + '">' +
          '<span class="ico">' + (open ? it.ico : '🔒') + '</span><span class="nm">' + it.name + '</span>' +
          (open ? '' : '<span class="lv">נפתח ברמה ' + lvl + '</span>') + '</button>';
      });
      html += '</div></div></div>';
      card.innerHTML = html;

      card.querySelector('.h-ward-close').onclick = function () { snd('tap'); m.remove(); };
      /* בחירת דמות מהצוות */
      Array.prototype.forEach.call(card.querySelectorAll('.h-team-hero'), function (b) {
        b.onclick = function () {
          var h = HeroAvatar.hero(b.dataset.hero);
          if (b.classList.contains('locked')) { snd('sad'); say(h.name + (h.g === 'f' ? ' תצטרף' : ' יצטרף') + ' לצוות ברמה ' + h.level + '. עוד קצת למידה!'); return; }
          switchHero(h.id); snd('ding'); say(h.say); render();
        };
      });
      /* צבע סטודיו */
      Array.prototype.forEach.call(card.querySelectorAll('.h-swatch'), function (b) {
        b.onclick = function () { state.outfit.colors = state.outfit.colors || {}; state.outfit.colors[b.dataset.slot] = b.dataset.color; wear(b.dataset.slot, b.dataset.slot + '_custom'); snd('sparkle'); render(); };
      });
      /* 🎲 הפתעה: תחפושת אקראית מכל מה שפתוח */
      card.querySelector('.surprise').onclick = function () {
        Object.keys(HeroAvatar.CATALOG).forEach(function (slot) {
          var open = HeroAvatar.CATALOG[slot].filter(function (it) { return state.unlocked.indexOf(it.id) >= 0; });
          if (open.length) state.outfit[slot] = open[Math.floor(Math.random() * open.length)].id;
        });
        save(); window.dispatchEvent(new CustomEvent('hero:outfit', { detail: state.outfit }));
        snd('ding'); say('תחפושת הפתעה!'); render();
      };
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
    '.h-ward-tab.studio{background:linear-gradient(90deg,#ffe1f1,#e1f6ff)}.h-ward-tab.studio.on{background:var(--h-gold)}' +
    '.h-ward-tab.surprise{background:linear-gradient(180deg,#b6ffdc,#3ff2b0)}' +
    '.h-ward-grid.studio-grid{grid-template-columns:1fr;gap:14px}' +
    '.h-studio-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 10px;border:3px solid var(--h-ink);border-radius:18px;background:#fff}' +
    '.h-studio-row b{min-width:62px;font:900 18px/1 var(--h-font);color:var(--h-ink)}' +
    '.h-swatch{width:42px;height:42px;border:3px solid var(--h-ink);border-radius:50%;cursor:pointer;box-shadow:0 3px 0 var(--h-ink);transition:transform .12s var(--h-spring)}' +
    '.h-swatch.on{transform:scale(1.18);box-shadow:0 3px 0 var(--h-ink),0 0 0 4px var(--h-gold)}' +
    '.h-team{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding:10px 4px 4px;margin-top:6px}.h-team::-webkit-scrollbar{display:none}' +
    '.h-team-hero{flex:0 0 auto;display:grid;justify-items:center;gap:2px;width:92px;padding:6px 4px;border:3px solid var(--h-ink);border-radius:18px;background:#fff;box-shadow:0 3px 0 var(--h-ink);cursor:pointer;font-family:var(--h-font);transition:transform .15s var(--h-spring)}' +
    '.h-team-hero .th{position:relative;width:66px;height:74px;border-radius:12px;background:radial-gradient(circle at 50% 40%,#4a1c8f,#1d0b4a);overflow:hidden}' +
    '.h-team-hero .th svg{width:100%;height:100%}.h-team-hero .th i{position:absolute;inset:0;display:grid;place-items:center;font-style:normal;font-size:26px;background:rgba(27,16,54,.55)}' +
    '.h-team-hero b{font-size:15px;color:var(--h-ink)}.h-team-hero small{font-size:12px;font-weight:700;color:var(--h-text-soft)}' +
    '.h-team-hero.on{background:linear-gradient(180deg,#fff3b0,#ffc93c);box-shadow:0 3px 0 var(--h-ink),0 0 0 4px rgba(255,46,147,.5);transform:translateY(-2px)}' +
    '.h-team-hero.locked .th svg{filter:grayscale(.7) brightness(.8)}' +
    '@media (max-width:760px){.h-ward-body{grid-template-columns:1fr}.h-ward-hero svg{max-height:34vh}}';
  document.head.appendChild(st);

  /* ---------- ייצוא ---------- */
  window.HeroRewards = {
    award: award,
    pow: pow,
    giftAvailable: giftAvailable,
    claimGift: claimGift,
    mountHUD: mountHUD,
    refresh: refreshHUDs,
    openWardrobe: openWardrobe,
    openModal: openModal,
    confetti: confetti,
    wear: wear,
    switchHero: switchHero,
    heroUnlocked: heroUnlocked,
    get hero() { return HeroAvatar.hero(state.outfit.hero); },
    get state() { return state; },
    get outfit() { return state.outfit; },
    need: need,
    MAX_LEVEL: MAX_LEVEL
  };
})();
