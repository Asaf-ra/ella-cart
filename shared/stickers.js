/* =====================================================================
   shared/stickers.js — אלבום המדבקות: אוספים מדבקות מכל הפעילויות
   ---------------------------------------------------------------------
   פרק 1 — האלבום: 6 עמודים × 8 מדבקות (חיות, ים, חלל, קסם, אוכל, חגים)
   פרק 2 — איך מרוויחים (מאזינים ל-progress:track): כל 6 תשובות באקדמיה, סיפור שנקרא, ציור שנשמר,
           צבע-לפי-מספר / נקודות, האכלת הדרקון (פעם ביום), 3 הזמנות בעגלה, חתולים בטיסה.
           תקרה: עד 6 מדבקות ביום — כדי שיישאר מיוחד ולא יציף
   פרק 3 — הודעה קטנה "✨ מדבקה חדשה!" שלא עוצרת את המשחק
   פרק 4 — חלון האלבום (Stickers.open): עמודים, מדבקות מבריקות, סילואטה למה שחסר; עמוד מלא = 15 מטבעות
   שמירה: ella-stickers-v1 { own: {אימוג'י: תאריך}, cnt: {answer, cart}, day: {k, n, art, pet}, done: {עמוד: true} }
   תלויות: shared/theme.css; אופציונלי: audio.js, hero-rewards.js, wallet.js
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- פרק 1 — האלבום ---------- */
  var PAGES = [
    ['🐾', 'חיות', [['🐶', 'כלבלב'], ['🐱', 'חתלתולה'], ['🐰', 'ארנבון'], ['🦊', 'שועל'], ['🐼', 'פנדה'], ['🐨', 'קואלה'], ['🦁', 'אריה'], ['🐸', 'צפרדע']]],
    ['🌊', 'מתחת לים', [['🐬', 'דולפין'], ['🐳', 'לווייתן'], ['🐙', 'תמנון'], ['🦀', 'סרטן'], ['🐠', 'דג צבעוני'], ['🐢', 'צב ים'], ['🦈', 'כריש'], ['🐚', 'צדף']]],
    ['🚀', 'חלל', [['🚀', 'חללית'], ['🪐', 'שבתאי'], ['🌙', 'ירח'], ['⭐', 'כוכב'], ['☄️', 'שביט'], ['👽', 'חייזר'], ['🛸', 'צלחת מעופפת'], ['🌍', 'כדור הארץ']]],
    ['🦄', 'קסם', [['🦄', 'חד-קרן'], ['🧚‍♀️', 'פיה'], ['🌈', 'קשת'], ['🔮', 'כדור בדולח'], ['👑', 'כתר'], ['💎', 'יהלום'], ['🪄', 'שרביט'], ['🏰', 'ארמון']]],
    ['🍓', 'מתוקים', [['🍓', 'תות'], ['🍩', 'דונאט'], ['🧁', 'קאפקייק'], ['🍭', 'סוכרייה'], ['🍕', 'פיצה'], ['🍉', 'אבטיח'], ['🍦', 'גלידה'], ['🍪', 'עוגייה']]],
    ['🎉', 'חגים ושמחות', [['🍎', 'תפוח בדבש'], ['🌿', 'סוכה'], ['🕎', 'חנוכייה'], ['🌳', 'עץ'], ['🎭', 'מסכה'], ['🌸', 'פרח אביב'], ['🎂', 'עוגת יום הולדת'], ['🎁', 'מתנה']]]
  ];
  var ALL = []; PAGES.forEach(function (p, pi) { p[2].forEach(function (s) { ALL.push({ e: s[0], n: s[1], p: pi }); }); });
  var KEY = 'ella-stickers-v1', DAILY_MAX = 6;
  function load() { try { return Object.assign({ own: {}, cnt: {}, day: {}, done: {} }, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { return { own: {}, cnt: {}, day: {}, done: {} }; } }
  var S = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function dayKey() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function snd(n) { try { if (window.Sound && Sound[n]) Sound[n](); } catch (e) {} }

  /* ---------- פרק 2 — מרוויחים ---------- */
  /* give(reason) — מדבקה אקראית שעוד אין (בתוך התקרה היומית) */
  function give(reason) {
    if (S.day.k !== dayKey()) S.day = { k: dayKey(), n: 0 };
    if (S.day.n >= DAILY_MAX) { save(); return null; }
    var missing = ALL.filter(function (x) { return !S.own[x.e]; });
    if (!missing.length) return null;
    var st = missing[(Math.random() * missing.length) | 0];
    S.own[st.e] = Date.now(); S.day.n++; save();
    toast(st);
    checkPages();
    return st;
  }
  window.addEventListener('progress:track', function (e) {
    var ev = (e.detail && e.detail.evt) || '';
    if (S.day.k !== dayKey()) S.day = { k: dayKey(), n: 0 };
    if (/^answer:/.test(ev)) { S.cnt.answer = (S.cnt.answer || 0) + 1; if (S.cnt.answer % 6 === 0) give('answers'); else save(); }
    else if (ev === 'story:read') give('story');
    else if (ev === 'art:save') { if ((S.day.art || 0) < 2) { S.day.art = (S.day.art || 0) + 1; give('art'); } }
    else if (ev === 'art:cbn' || ev === 'art:dots') give('art-game');
    else if (ev === 'pet:feed') { if (!S.day.pet) { S.day.pet = 1; give('pet'); } }
    else if (ev === 'cart:order') { S.cnt.cart = (S.cnt.cart || 0) + 1; if (S.cnt.cart % 3 === 0) give('cart'); else save(); }
    else if (ev === 'flight:cats') give('flight');
  });
  /* עמוד שהושלם — פרס חד-פעמי */
  function checkPages() {
    PAGES.forEach(function (p, pi) {
      if (S.done[pi]) return;
      if (p[2].every(function (s) { return S.own[s[0]]; })) {
        S.done[pi] = Date.now(); save();
        if (window.Wallet) Wallet.add(15);
        setTimeout(function () {
          try { if (window.HeroRewards) { HeroRewards.confetti(); HeroRewards.refresh(); } } catch (e) {}
          toast({ e: p[0], n: 'עמוד "' + p[1] + '" הושלם! 🪙 +15' }, true);
        }, 2600);
      }
    });
  }

  /* ---------- פרק 3 — הודעה קטנה ---------- */
  var css = document.createElement('style');
  css.textContent =
    '.stk-toast{position:fixed;top:max(14px,env(safe-area-inset-top));left:50%;z-index:9990;display:flex;align-items:center;gap:10px;padding:8px 18px 8px 10px;border:4px solid #1b1036;border-radius:999px;background:linear-gradient(180deg,#fffaf0,#ffe9f5);box-shadow:0 5px 0 #1b1036;font:900 18px/1.1 Rubik,sans-serif;color:#1b1036;direction:rtl;pointer-events:none;animation:stk-in 3.2s ease forwards}' +
    '.stk-toast b{font-size:40px;line-height:1;filter:drop-shadow(0 0 6px #fff)}.stk-toast.big{background:linear-gradient(90deg,#fff3b0,#ffc93c)}' +
    '@keyframes stk-in{0%{transform:translate(-50%,-140%) scale(.6)}12%{transform:translate(-50%,0) scale(1.08)}20%{transform:translate(-50%,0) scale(1)}85%{transform:translate(-50%,0);opacity:1}100%{transform:translate(-50%,-140%);opacity:0}}' +
    '.alb-card{width:min(96vw,980px);max-height:92vh;overflow:auto;padding:18px 20px;text-align:center}' +
    '.alb-x{position:absolute;top:12px;left:12px;width:52px;height:52px;border:4px solid var(--h-ink);border-radius:50%;background:var(--h-magenta);color:#fff;font:900 22px/1 var(--h-font);box-shadow:0 4px 0 var(--h-ink);cursor:pointer;z-index:2}' +
    '.alb-tabs{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:12px 0}' +
    '.alb-tab{padding:8px 14px;border:3px solid var(--h-ink);border-radius:999px;background:#fff;box-shadow:0 3px 0 var(--h-ink);font:900 16px/1 var(--h-font);cursor:pointer}' +
    '.alb-tab.on{background:linear-gradient(180deg,#ff7ec2,#ff2e93);color:#fff}.alb-tab.full{background:linear-gradient(180deg,#fff3b0,#ffc93c)}' +
    '.alb-page{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;padding:16px;border:5px solid var(--h-ink);border-radius:26px;background:repeating-linear-gradient(45deg,#fffaf0 0 18px,#fff3e0 18px 36px)}' +
    '.alb-slot{position:relative;aspect-ratio:1;display:grid;place-items:center;align-content:center;gap:4px;border:3px dashed rgba(27,16,54,.3);border-radius:22px;background:rgba(255,255,255,.7);font:800 14px/1.2 var(--h-font);color:var(--h-text-soft)}' +
    '.alb-slot .e{font-size:clamp(44px,7vw,74px);line-height:1}' +
    '.alb-slot.own{border:4px solid var(--h-ink);background:linear-gradient(135deg,#fff,#ffe9f5 50%,#e9f7ff);box-shadow:0 5px 0 var(--h-ink);color:var(--h-ink);overflow:hidden;cursor:pointer}' +
    '.alb-slot.own::after{content:"";position:absolute;inset:-50%;background:linear-gradient(115deg,transparent 40%,rgba(255,255,255,.8) 50%,transparent 60%);animation:alb-shine 3s linear infinite}' +
    '.alb-slot.miss .e{filter:grayscale(1) brightness(0);opacity:.12}' +
    '@keyframes alb-shine{from{transform:translateX(-60%)}to{transform:translateX(60%)}}' +
    '.alb-help{font:700 15px/1.5 var(--h-font);color:var(--h-text-soft);margin-top:12px}' +
    '@media (max-width:640px){.alb-page{grid-template-columns:repeat(2,1fr)}}';
  document.head.appendChild(css);
  function toast(st, big) {
    var t = document.createElement('div'); t.className = 'stk-toast' + (big ? ' big' : '');
    t.innerHTML = '<b>' + st.e + '</b><span>' + (big ? st.n : '✨ מדבקה חדשה: ' + st.n + '!') + '</span>';
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3300);
    snd(big ? 'ding' : 'sparkle');
  }

  /* ---------- פרק 4 — חלון האלבום ---------- */
  function open() {
    var m = document.createElement('div'); m.className = 'h-modal show';
    var card = document.createElement('div'); card.className = 'h-modal-card h-panel alb-card';
    m.appendChild(card); document.body.appendChild(m);
    var cur = 0;
    function render() {
      var got = Object.keys(S.own).length;
      card.innerHTML = '<button type="button" class="alb-x">✖</button><span class="h-modal-kicker">📒 אלבום המדבקות · ' + got + '/' + ALL.length + '</span>' +
        '<div class="alb-tabs">' + PAGES.map(function (p, i) {
          var n = p[2].filter(function (s) { return S.own[s[0]]; }).length;
          return '<button type="button" class="alb-tab' + (i === cur ? ' on' : '') + (n === 8 ? ' full' : '') + '" data-p="' + i + '">' + p[0] + ' ' + p[1] + ' ' + n + '/8</button>';
        }).join('') + '</div>' +
        '<div class="alb-page">' + PAGES[cur][2].map(function (s) {
          var own = !!S.own[s[0]];
          return '<div class="alb-slot ' + (own ? 'own' : 'miss') + '" data-e="' + s[0] + '"><span class="e">' + s[0] + '</span>' + (own ? s[1] : '?') + '</div>';
        }).join('') + '</div>' +
        '<p class="alb-help">מדבקות מקבלים על תשובות באקדמיה, סיפורים, ציורים, האכלת הדרקון, הזמנות בעגלה וחתולים בטיסה. עמוד מלא = 🪙 15!</p>';
      card.querySelector('.alb-x').onclick = function () { m.remove(); };
      card.querySelectorAll('.alb-tab').forEach(function (b) { b.onclick = function () { cur = +b.dataset.p; snd('bubble'); render(); }; });
      card.querySelectorAll('.alb-slot.own').forEach(function (d) { d.onclick = function () { snd('pop'); d.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.15) rotate(-6deg)' }, { transform: 'scale(1)' }], { duration: 400 }); try { if (window.Voice) Voice.say(d.textContent.replace(d.dataset.e, '').trim(), { interrupt: true }); } catch (e) {} }; });
    }
    render(); snd('bubble');
  }

  window.Stickers = { open: open, give: give, count: function () { return Object.keys(S.own).length; }, total: ALL.length, PAGES: PAGES };
})();
