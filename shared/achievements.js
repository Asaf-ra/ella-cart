/* =====================================================================
   shared/achievements.js — 🏅 הישגים: תגים לכל המשחקים (שלב 17)
   ---------------------------------------------------------------------
   מה הקובץ עושה: סופר אירועים מכל האפליקציה (תשובות, רכיבות, מרוצים, מילים שנלמדו, ימי חווה,
   סיפורים, ציורים, קומבו של לחיצות…) ופותח תגים כשעוברים סף. תג חדש = באנר קומיקס שנכנס מלמעלה,
   קונפטי, קול ו-3 מטבעות. אלבום ההישגים נפתח מכרטיס "🏅 הישגים" בבית (קבוצת "הגיבור שלי").

   פרק 1 — שמירה: eitan-achievements-v1 { c: {מונה: ערך}, got: {מזהה: תאריך} }
   פרק 2 — BADGES: רשימת התגים [מזהה, אימוג'י, שם, איך משיגים, בדיקה(מונים), קבוצה]
   פרק 3 — מונים: hit(key, n) — מהמשחקים (Achievements.hit('cars:gold')) ואוטומטית מכל Progress.track (אירוע progress:track)
   פרק 4 — פתיחת תג: באנר, קול, קונפטי, מטבעות; תור כדי שלא יוצגו שניים בבת אחת
   פרק 5 — אלבום ההישגים (Achievements.open): רשת תגים, נעולים באפור עם רמז, התקדמות N/24
   פרק 6 — ביקורים: כל דף רושם visit:<שם הדף> בטעינה (לתג "טיילתי בכל העולם")
   פרק 7 — ייצוא: window.Achievements = { hit, open, count, total, list, state }
   תקלה נפוצה: תג לא נפתח? בודקים ב-DevTools: Achievements.state().c — האם המונה עלה; ואת הסף ב-BADGES.
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- פרק 1 — שמירה ---------- */
  var KEY = 'ella-achievements-v1';
  function load() { try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.c && s.got) return s; } catch (e) {} return { c: {}, got: {} }; }
  var S = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function coins() { try { return window.Wallet ? Wallet.coins : 0; } catch (e) { return 0; } }
  function fix(t) { return window.Profile && Profile.fix ? Profile.fix(t) : t; }

  /* ---------- פרק 2 — התגים ----------
     [id, אימוג'י, שם, איך משיגים (רמז), test(c) → true כשמשיגים, קבוצה לצביעה] */
  var BADGES = [
    ['first', '🌟', 'צעד ראשון', 'עונים על שאלה ראשונה באקדמיה', function (c) { return (c.answer || 0) >= 1; }, 'learn'],
    ['ans50', '🧠', 'מוח של גיבור', '50 תשובות', function (c) { return (c.answer || 0) >= 50; }, 'learn'],
    ['ans200', '🎓', 'פרופסור', '200 תשובות', function (c) { return (c.answer || 0) >= 200; }, 'learn'],
    ['words10', '🇬🇧', '10 מילים', 'לומדים 10 מילים באנגלית במשחקים', function (c) { return (c['learn:word'] || 0) >= 10; }, 'learn'],
    ['words40', '📚', 'מילון מהלך', '40 מילים באנגלית במשחקים', function (c) { return (c['learn:word'] || 0) >= 40; }, 'learn'],
    ['signs', '🚦', 'מכיר תמרורים', 'לומדים 4 תמרורים במרוץ', function (c) { return (c['learn:sign'] || 0) >= 4; }, 'cars'],
    ['cars1', '🏎️', 'נהג צעיר', 'מסיימים מרוץ ראשון', function (c) { return (c['cars:done'] || 0) >= 1; }, 'cars'],
    ['redlight', '🛑', 'עוצרים באדום', 'עוצרים ברמזור אדום עד הירוק', function (c) { return (c['cars:redlight'] || 0) >= 1; }, 'cars'],
    ['carsclean', '✨', 'נהיגה נקייה', 'מרוץ שלם בלי לגעת במכשול', function (c) { return (c['cars:clean'] || 0) >= 1; }, 'cars'],
    ['carsgold', '🥇', 'אלוף הכביש', 'מדליית זהב במרוץ', function (c) { return (c['cars:gold'] || 0) >= 1; }, 'cars'],
    ['cars10', '🏁', '10 מרוצים', 'מסיימים 10 מרוצים', function (c) { return (c['cars:done'] || 0) >= 10; }, 'cars'],
    ['ride1', '🐴', 'רוכב צעיר', 'רכיבה ראשונה', function (c) { return (c['ride:done'] || 0) >= 1; }, 'ride'],
    ['ridegold', '🏆', 'אביר הסוסים', 'מדליית זהב ברכיבה', function (c) { return (c['ride:gold'] || 0) >= 1; }, 'ride'],
    ['farmguide', '📖', 'יודע לטפל', 'קוראים 5 מדריכי "איך מטפלים?" בחווה', function (c) { return (c['farm:guide'] || 0) >= 5; }, 'farm'],
    ['farmquiz', '❓', 'חכם החווה', '5 תשובות נכונות בשאלת החווה', function (c) { return (c['farm:quiz_ok'] || 0) >= 5; }, 'farm'],
    ['farmstreak', '🔥', '3 ימי חווה', 'משלימים את משימות הבוקר 3 ימים', function (c) { return (c['farm:chores'] || 0) >= 3; }, 'farm'],
    ['farmnight', '🌙', 'ינשוף לילה', 'מבקרים בחווה בלילה', function (c) { return (c['farm:night'] || 0) >= 1; }, 'farm'],
    ['story5', '📖', 'תולעת ספרים', 'שומעים 5 סיפורים', function (c) { return (c['story:read'] || 0) >= 5; }, 'learn'],
    ['art5', '🎨', 'אמן', 'שומרים 5 ציורים', function (c) { return (c['art:save'] || 0) >= 5; }, 'create'],
    ['motor', '✍️', 'יד יציבה', 'מסיימים 12 תרגילי עט', function (c) { return (c['motor:done'] || 0) >= 12; }, 'create'],
    ['combo', '💥', 'אצבעות ברק', 'קומבו של 10 לחיצות מהירות', function (c) { return (c['tap:combo10'] || 0) >= 1; }, 'fun'],
    ['zap', '⚡', 'מזמין ברקים', 'לחיצה ארוכה עד שיורד ברק', function (c) { return (c['tap:zap'] || 0) >= 1; }, 'fun'],
    ['explorer', '🗺️', 'מטייל בכל העולם', 'מבקרים בחווה, ברכיבה, במרוץ, בטיסה ובעגלה', function (c) { return ['farm', 'ride', 'cars', 'flight', 'cart'].every(function (p) { return c['visit:' + p]; }); }, 'fun'],
    ['twop', '👥', 'חברים על הכביש', 'מרוץ של שני שחקנים במסך מפוצל', function (c) { return (c['cars:2p'] || 0) >= 1; }, 'cars'],
    ['design', '🎨', 'מעצב מכוניות', 'פותחים את עיצוב המכונית במוסך', function (c) { return (c['cars:design'] || 0) >= 1; }, 'cars'],
    ['farmduo', '👥', 'חוואים לשניים', 'משחק אחד של "חווה לשניים"', function (c) { return (c['farm:duo'] || 0) >= 1; }, 'farm'],
    ['chefs', '👩‍🍳', 'שפים לשניים', 'משמרת אחת במטבח לשניים', function (c) { return (c['kitchen:done'] || 0) >= 1; }, 'fun'],
    ['chefsperf', '🍽️', 'מטבח מושלם', 'כל 6 הלקוחות יצאו שמחים', function (c) { return (c['kitchen:perfect'] || 0) >= 1; }, 'fun'],
    ['duel', '⚔️', 'דו-קרב ראשון', 'דו-קרב ידע אחד עד הסוף', function (c) { return (c['duel:done'] || 0) >= 1; }, 'learn'],
    ['rich', '💰', 'חוסך גדול', 'צוברים 100 מטבעות בארנק', function () { return coins() >= 100; }, 'fun']
  ];
  var COLORS = { learn: ['#fff3c4', '#ffc93c'], cars: ['#ff9b9b', '#b3122e'], ride: ['#9df08a', '#1e9a54'], farm: ['#9ad8ff', '#2f6bff'], create: ['#eadcff', '#b48cff'], fun: ['#ffd1f0', '#ff4fa0'] };

  /* ---------- פרק 3 — מונים ---------- */
  var checking = false;
  // hit(key, n) — מעלה מונה ובודק אם נפתח תג חדש
  function hit(key, n) { if (!key) return; S.c[key] = (S.c[key] || 0) + (n == null ? 1 : n); save(); check(); }
  function check() {
    if (checking) return; checking = true;
    BADGES.forEach(function (b) { if (!S.got[b[0]]) { var ok = false; try { ok = b[4](S.c); } catch (e) {} if (ok) unlock(b); } });
    checking = false;
  }
  // כל אירוע של Progress.track נספר אוטומטית (answer, ride:done, cars:done, farm:chores, learn:word, story:read, art:save, motor:done…)
  window.addEventListener('progress:track', function (e) { var ev = e.detail && e.detail.evt; if (ev && ev !== 'reset') hit(ev); });

  /* ---------- פרק 4 — פתיחת תג ---------- */
  var CSS = [
    '.ach-ban{position:fixed;left:50%;top:max(14px,env(safe-area-inset-top));z-index:9700;transform:translate(-50%,-160%) rotate(-2deg);display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:center;padding:12px 22px 12px 16px;border:5px solid var(--h-ink,#101e36);border-radius:22px;background:#fffaf0 radial-gradient(rgba(16,30,54,.08) 1.4px,transparent 1.9px) 0 0/10px 10px;color:var(--h-ink,#101e36);box-shadow:8px 9px 0 var(--h-ink,#101e36),0 0 0 3px #fff inset,0 24px 50px rgba(4,14,30,.45);font-family:var(--h-font,sans-serif);direction:rtl;text-align:right;animation:ach-in .6s cubic-bezier(.2,1.4,.3,1) forwards,ach-out .45s ease-in 3.6s forwards;pointer-events:none;min-width:min(90vw,420px)}',
    '.ach-ban .e{font-size:64px;line-height:1;filter:drop-shadow(0 5px 0 rgba(16,30,54,.35));animation:ach-spin 1.2s cubic-bezier(.2,1.4,.3,1)}',
    '.ach-ban b{display:block;font-size:clamp(20px,2.6vw,28px);font-weight:900;color:#fff;-webkit-text-stroke:4px var(--h-ink,#101e36);paint-order:stroke fill;text-shadow:3px 4px 0 var(--h-magenta,#ff622e)}',
    '.ach-ban small{display:block;font-size:15px;font-weight:800;color:var(--h-text-soft,#4d5d7a)}',
    '.ach-ban .k{position:absolute;top:-14px;right:16px;padding:2px 12px;border:3px solid var(--h-ink,#101e36);border-radius:999px;background:var(--h-gold,#ffc93c);font:900 13px/1.3 var(--h-font,sans-serif);transform:rotate(3deg);box-shadow:3px 3px 0 var(--h-ink,#101e36)}',
    '@keyframes ach-in{to{transform:translate(-50%,0) rotate(-1deg)}}@keyframes ach-out{to{transform:translate(-50%,-160%) rotate(2deg);opacity:0}}@keyframes ach-spin{from{transform:rotateY(0) scale(.3)}to{transform:rotateY(720deg) scale(1)}}',
    /* אלבום */
    '.ach-ov{position:fixed;inset:0;z-index:9650;display:grid;place-items:center;padding:16px;background:radial-gradient(circle at 50% 40%,rgba(58,17,119,.8),rgba(10,4,30,.92));font-family:var(--h-font,sans-serif);direction:rtl}',
    '.ach-card{position:relative;width:min(96vw,980px);max-height:94vh;overflow:auto;padding:18px 22px;border:5px solid var(--h-ink,#101e36);border-radius:26px;background:#fffaf0 radial-gradient(rgba(16,30,54,.07) 1.4px,transparent 1.9px) 0 0/10px 10px;color:var(--h-ink,#101e36);box-shadow:9px 10px 0 var(--h-ink,#101e36),0 0 0 3px #fff inset,0 30px 70px rgba(0,0,0,.45);animation:h-card-in .45s var(--h-spring,ease) both}',
    '.ach-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:10px}',
    '.ach-head h2{font-size:clamp(26px,3.4vw,38px);font-weight:900;color:#fff;-webkit-text-stroke:4px var(--h-ink,#101e36);paint-order:stroke fill;text-shadow:3px 4px 0 var(--h-magenta,#ff622e);transform:rotate(-2deg);margin-inline-end:auto}',
    '.ach-prog{display:flex;align-items:center;gap:8px;font-weight:900;font-size:18px}.ach-prog em{display:block;width:160px;height:16px;border:3px solid var(--h-ink,#101e36);border-radius:999px;background:#eee;overflow:hidden}.ach-prog i{display:block;height:100%;background:linear-gradient(90deg,#3ff2b0,#ffc93c);transition:width .6s}',
    '.ach-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}',
    '.ach-b{position:relative;display:grid;justify-items:center;gap:4px;padding:12px 8px 10px;border:4px solid var(--h-ink,#101e36);border-radius:18px;background:linear-gradient(160deg,var(--a),var(--b));color:#fff;box-shadow:4px 5px 0 var(--h-ink,#101e36);text-align:center;cursor:pointer;font-family:inherit}',
    '.ach-b .e{font-size:46px;line-height:1;filter:drop-shadow(0 4px 0 rgba(16,30,54,.35))}.ach-b b{font-size:15px;font-weight:900;-webkit-text-stroke:3px var(--h-ink,#101e36);paint-order:stroke fill}.ach-b small{font-size:12px;font-weight:700;line-height:1.25;text-shadow:0 1px 2px rgba(0,0,0,.4)}',
    '.ach-b.lock{filter:grayscale(1) brightness(.75);background:linear-gradient(160deg,#cfcfd8,#8a8a9a)}.ach-b.lock .e{opacity:.5}.ach-b.new::after{content:"חדש!";position:absolute;top:-10px;left:-6px;background:#ffe14a;color:var(--h-ink,#101e36);border:3px solid var(--h-ink,#101e36);border-radius:12px;padding:1px 8px;font-size:12px;font-weight:900;transform:rotate(-10deg)}',
    '.ach-x{border:4px solid var(--h-ink,#101e36);border-radius:22px;padding:10px 20px;min-height:52px;font:900 20px/1 var(--h-font,sans-serif);color:#fff;background:linear-gradient(180deg,#8bb5ff,#3f79e0);box-shadow:0 5px 0 var(--h-ink,#101e36);cursor:pointer}',
    '@media (prefers-reduced-motion:reduce){.ach-ban,.ach-ban .e,.ach-card{animation-duration:.01s!important}}'
  ].join('\n');
  function css() { if (document.getElementById('ach-css')) return; var s = document.createElement('style'); s.id = 'ach-css'; s.textContent = CSS; document.head.appendChild(s); }
  var queue = [], showing = false;
  function unlock(b) {
    S.got[b[0]] = new Date().toISOString().slice(0, 10); S.fresh = S.fresh || {}; S.fresh[b[0]] = 1; save();
    try { if (window.Wallet) Wallet.add(3); } catch (e) {}
    queue.push(b); if (!showing) next();
    try { if (window.Progress && b[0] !== 'first') Progress.track('achievement'); } catch (e) {}
    refreshCard();
  }
  function next() {
    var b = queue.shift(); if (!b) { showing = false; return; } showing = true; css();
    var el = document.createElement('div'); el.className = 'ach-ban';
    el.innerHTML = '<span class="k">🏅 הישג חדש! +3 🪙</span><span class="e">' + b[1] + '</span><div><b>' + b[2] + '</b><small>' + b[3] + '</small></div>';
    document.body.appendChild(el);
    try { if (window.Sound && Sound.happy) Sound.happy(); } catch (e) {}
    try { if (window.HeroRewards && HeroRewards.confetti) HeroRewards.confetti(); } catch (e) {}
    try { if (window.Voice) Voice.say(fix('הישג חדש! ' + b[2] + '!')); } catch (e) {}
    setTimeout(function () { el.remove(); next(); }, 4200);
  }

  /* ---------- פרק 5 — אלבום ---------- */
  function count() { return Object.keys(S.got).length; }
  function open() {
    css(); var ov = document.createElement('div'); ov.className = 'ach-ov'; ov.setAttribute('role', 'dialog');
    var n = count(), t = BADGES.length;
    ov.innerHTML = '<div class="ach-card"><div class="ach-head"><h2>🏅 ההישגים שלי</h2><span class="ach-prog">' + n + '/' + t + '<em><i style="width:' + Math.round(n / t * 100) + '%"></i></em></span><button type="button" class="ach-x" data-x="1">✖ סגירה</button></div><div class="ach-grid">' +
      BADGES.map(function (b) { var got = !!S.got[b[0]], col = COLORS[b[5]]; return '<button type="button" class="ach-b' + (got ? '' : ' lock') + (S.fresh && S.fresh[b[0]] ? ' new' : '') + '" data-id="' + b[0] + '" style="--a:' + col[0] + ';--b:' + col[1] + '"><span class="e">' + (got ? b[1] : '🔒') + '</span><b>' + b[2] + '</b><small>' + (got ? '✔ ' + S.got[b[0]] : b[3]) + '</small></button>'; }).join('') + '</div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) {
      var x = e.target.closest('[data-x]'), bb = e.target.closest('.ach-b');
      if (x || e.target === ov) { ov.remove(); return; }
      if (bb) { var b = BADGES.filter(function (q) { return q[0] === bb.dataset.id; })[0]; try { Voice.say(fix((S.got[b[0]] ? b[2] + '. ' : 'עוד לא: ') + b[3])); } catch (err) {} }
    });
    S.fresh = {}; save(); refreshCard();
    try { if (window.Voice) Voice.say(fix(n ? 'יש לך ' + n + ' הישגים מתוך ' + t + '!' : 'עוד אין הישגים — כל משחק פותח תגים!')); } catch (e) {}
  }
  // refreshCard — מעדכן את כרטיס "הישגים" בבית (אם קיים) ואת הכפתור
  function refreshCard() { var p = document.getElementById('achCount'); if (p) p.textContent = count() + '/' + BADGES.length + ' תגים' + (S.fresh && Object.keys(S.fresh).length ? ' · חדש! 🏅' : ''); }

  /* ---------- פרק 6 — ביקורים ---------- */
  function boot() {
    var page = (location.pathname.split('/').pop() || 'index.html').replace('.html', '');
    if (page && page !== 'index' && page !== 'welcome') hit('visit:' + page);
    var h = new Date().getHours(); if (h < 8) hit('early', 1);
    var card = document.getElementById('achCard'); if (card) { card.addEventListener('click', function () { try { Sound.tap(); } catch (e) {} open(); }); refreshCard(); }
    check();
  }

  /* ---------- פרק 7 — ייצוא ---------- */
  window.Achievements = { hit: hit, open: open, count: count, total: BADGES.length, list: BADGES, state: function () { return S; }, check: check };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
