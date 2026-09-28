/* =====================================================================
   shared/seasons.js — קסם עונתי: חגים לפי הלוח העברי + הפתעת יום הולדת
   ---------------------------------------------------------------------
   פרק 1 — תאריך עברי (Intl, לוח hebrew — עובד גם בלי אינטרנט) + ?testdate= לבדיקות
   פרק 2 — החגים: ראש השנה, סוכות, חנוכה, ט״ו בשבט, פורים, פסח, יום העצמאות, שבועות —
           לכל חג: ברכה, אביזר במתנה (shared/hero-avatar.js), סיפור חג (js/story-data.js)
   פרק 3 — מסך הבית: סרט חג עם ברכה; פעם אחת בכל חג — "מתנת חג" (אביזר + מטבעות)
   פרק 4 — יום הולדת (מהפרופיל): סרט חגיגי כל היום, ופעם בשנה מתנה (כובע יום הולדת + מטבעות + קונפטי)
   שמירה: ella-seasons-v1 { got: { 'hanukkah-5787': true }, bday: 2026 }
   תלויות: shared/hero-rewards.js, shared/hero-avatar.js; אופציונלי: profile.js, wallet.js, audio.js
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- פרק 1 — תאריך ---------- */
  var KEY = 'ella-seasons-v1';
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || { got: {} }; } catch (e) { return { got: {} }; } }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  function today() {
    var m = /[?&]testdate=(\d{4}-\d{2}-\d{2})/.exec(location.search);
    return m ? new Date(m[1] + 'T12:00:00') : new Date();
  }
  /* hebrew(d) → { d: יום, m: שם חודש באנגלית (Tishri, Kislev, Adar II…), y: שנה } */
  function hebrew(d) {
    try {
      var parts = new Intl.DateTimeFormat('en-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric' }).formatToParts(d), o = {};
      parts.forEach(function (p) { o[p.type] = p.value; });
      return { d: +o.day, m: o.month, y: +o.year };
    } catch (e) { return null; }
  }

  /* ---------- פרק 2 — החגים ---------- */
  var EVENTS = [
    { id: 'rosh', name: 'ראש השנה', ico: '🍎', greet: 'שנה טובה ומתוקה!', item: 'acc_honey', story: 'hol-rosh', on: function (m, d) { return (m === 'Elul' && d >= 26) || (m === 'Tishri' && d <= 4); } },
    { id: 'sukkot', name: 'סוכות', ico: '🌿', greet: 'חג סוכות שמח!', item: 'acc_leaves', story: 'hol-sukkot', on: function (m, d) { return m === 'Tishri' && d >= 13 && d <= 23; } },
    { id: 'hanukkah', name: 'חנוכה', ico: '🕎', greet: 'חנוכה שמח! חג של אור', item: 'acc_candles', story: 'hol-hanukkah', on: function (m, d) { return (m === 'Kislev' && d >= 24) || (m === 'Tevet' && d <= 3); } },
    { id: 'tubishvat', name: 'ט״ו בשבט', ico: '🌳', greet: 'ט״ו בשבט שמח! יום הולדת לעצים', item: 'acc_leaves', story: 'hol-tubishvat', on: function (m, d) { return m === 'Shevat' && d >= 12 && d <= 16; } },
    { id: 'purim', name: 'פורים', ico: '🎭', greet: 'פורים שמח!', item: 'acc_jester', story: 'hol-purim', on: function (m, d) { return (m === 'Adar' || m === 'Adar II') && d >= 9 && d <= 16; } },
    { id: 'pesach', name: 'פסח', ico: '🌸', greet: 'חג פסח שמח! חג האביב', item: 'acc_wreath', story: 'hol-pesach', on: function (m, d) { return m === 'Nisan' && d >= 12 && d <= 22; } },
    { id: 'atzmaut', name: 'יום העצמאות', ico: '💙', greet: 'יום העצמאות שמח!', item: 'acc_flagbow', story: null, on: function (m, d) { return m === 'Iyar' && d >= 3 && d <= 6; } },
    { id: 'shavuot', name: 'שבועות', ico: '🌾', greet: 'חג שבועות שמח!', item: 'acc_wreath', story: null, on: function (m, d) { return m === 'Sivan' && d >= 4 && d <= 7; } }
  ];
  function current(d) { var h = hebrew(d || today()); if (!h) return null; for (var i = 0; i < EVENTS.length; i++) if (EVENTS[i].on(h.m, h.d)) return Object.assign({ year: h.y }, EVENTS[i]); return null; }
  function isBirthday(d) {
    var p = window.Profile && Profile.active; if (!p || !p.bday) return false;
    d = d || today(); return p.bday.d === d.getDate() && p.bday.m === d.getMonth() + 1;
  }

  function snd(n) { try { if (window.Sound && Sound[n]) Sound[n](); } catch (e) {} }
  function say(t) { try { if (window.Voice) Voice.say(t, { interrupt: true }); } catch (e) {} }
  function preview(itemId) { var o = Object.assign({}, window.HeroRewards ? HeroRewards.outfit : {}); o.acc = itemId; return window.HeroAvatar ? HeroAvatar.svg(o) : ''; }
  function itemName(id) { try { return HeroAvatar.item('acc', id).name; } catch (e) { return ''; } }

  /* ---------- פרק 3–4 — מסך הבית ---------- */
  var st = document.createElement('style');
  st.textContent =
    '.season{display:inline-flex;align-items:center;gap:10px;margin-top:10px;padding:8px 18px;border:4px solid var(--h-ink);border-radius:999px;background:linear-gradient(180deg,#fff3b0,#ffc93c);color:var(--h-ink);font:900 clamp(15px,1.7vw,20px)/1.2 var(--h-font);box-shadow:0 5px 0 var(--h-ink);cursor:pointer;animation:season-bob 2.4s ease-in-out infinite}' +
    '.season.bday{background:linear-gradient(90deg,#ff7ec2,#ffd95a,#3ff2b0,#29c5ff)}.season b{font-size:1.4em}.season .gift{animation:gift 1.2s ease-in-out infinite}' +
    '@keyframes season-bob{50%{transform:translateY(-4px) rotate(-1deg)}}';
  document.head.appendChild(st);
  /* gift — מתנה (אביזר; אם כבר יש — מטבעות) פעם אחת לכל חג/שנה */
  function giveGift(key, itemId, title, line, coins) {
    var S = load(); if (S.got[key]) return false;
    S.got[key] = Date.now(); save(S);
    var isNew = window.HeroRewards && HeroRewards.unlockItem(itemId);
    if (window.Wallet) Wallet.add(coins + (isNew ? 0 : 5));
    var html = '<span class="h-modal-kicker">' + title + '</span><div class="h-modal-hero">' + preview(itemId) + '</div><h2>' + line + '</h2><p>' +
      (isNew ? 'מתנה חדשה בארון: ' + itemName(itemId) + ' · 🪙 +' + coins : '🪙 +' + (coins + 5) + ' מטבעות מתנה') + '</p>';
    HeroRewards.openModal(html, isNew ? [{ text: 'ללבוש עכשיו! ✨', cls: 'h-btn gold', fn: function () { HeroRewards.wear('acc', itemId); } }, { text: 'אחר כך', cls: 'h-btn violet', fn: function () {} }]
                                      : [{ text: 'יש! 🎉', cls: 'h-btn gold', fn: function () {} }]);
    HeroRewards.confetti(); snd('ding'); try { HeroRewards.refresh(); } catch (e) {}
    return true;
  }
  /* mount(parent) — סרט החג / יום ההולדת במסך הבית */
  function mount(parent) {
    if (!parent) return;
    var ev = current(), bday = isBirthday(), S = load();
    if (bday) {
      var yr = today().getFullYear(), bkey = 'bday-' + yr, nm = window.Profile ? Profile.name : '';
      var b = document.createElement('button'); b.type = 'button'; b.className = 'season bday';
      b.innerHTML = '<b>🎂</b> יום הולדת שמח, ' + nm + '!' + (S.got[bkey] ? '' : ' <span class="gift">🎁</span>');
      b.addEventListener('click', function () {
        if (!giveGift(bkey, 'acc_party', '🎂 יום הולדת שמח!', 'יום הולדת שמח, ' + nm + '! 🎉', 20)) { HeroRewards.confetti(); snd('happy'); }
        say('יום הולדת שמח, ' + nm + '! עד מאה ועשרים!'); b.querySelector('.gift') && b.querySelector('.gift').remove();
      });
      parent.appendChild(b);
      /* בפעם הראשונה ביום ההולדת — ההפתעה נפתחת לבד */
      if (!S.got[bkey]) setTimeout(function () { b.click(); }, 1400);
      return;
    }
    if (!ev) return;
    var key = ev.id + '-' + ev.year;
    var e = document.createElement('button'); e.type = 'button'; e.className = 'season';
    e.innerHTML = '<b>' + ev.ico + '</b> ' + ev.greet + (S.got[key] ? '' : ' <span class="gift">🎁 מתנת חג!</span>');
    e.addEventListener('click', function () {
      var given = giveGift(key, ev.item, ev.ico + ' ' + ev.name, ev.greet, 10);
      say(ev.greet + (given ? ' יש לך מתנת חג!' : ''));
      var g = e.querySelector('.gift'); if (g) g.remove();
      if (!given && ev.story) { try { KidsUI.PageFade.go('./stories.html#' + ev.story); } catch (x) { location.href = './stories.html#' + ev.story; } }
    });
    parent.appendChild(e);
  }

  window.Seasons = { current: current, hebrew: hebrew, isBirthday: isBirthday, mount: mount, EVENTS: EVENTS, today: today };
})();
