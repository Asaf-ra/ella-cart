/* =====================================================================
   shared/progress.js — מעקב התקדמות, זמן מסך בריא, משימת היום ואתגר שבועי
   ---------------------------------------------------------------------
   פרק 1 — שמירה (ella-progress-v1): ימים (דקות + אירועים), סטטיסטיקה לכל תחנה,
           מגבלת זמן, משימת היום, פרקי הסיפור היומי, אתגר שבועי
   פרק 2 — אירועים: Progress.track('answer:letters') — כל משחק מדווח מה קרה
   פרק 3 — סטטיסטיקה ללמידה: recordAnswer(station, firstTry) → דיוק, תחנות לחיזוק
   פרק 4 — זמן שימוש: סופר דקות פעילות אמיתיות (מסך גלוי + מגע ב-2 הדקות האחרונות)
   פרק 5 — זמן מסך בריא: כשמגיעים למגבלה שההורה קבע — אלה מבקשת לנוח (הורה יכול להאריך)
   פרק 6 — משימת היום: 3 משימות קבועות לכל תאריך + פרק סיפור כפרס
   פרק 7 — אתגר שבועי (נבל השבוע): נבל מתחלף כל שבוע, 12 נקודות חיים, גביעים על ניצחון
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- פרק 1 — שמירה ---------- */
  var KEY = 'ella-progress-v1';
  function blank() { return { days: {}, st: {}, limit: 0, daily: {}, story: { ep: 0 }, boss: {}, trophies: 0 }; }
  function load() { try { return Object.assign(blank(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { return blank(); } }
  var S = load();
  function save() {
    /* שומרים רק 45 ימים אחרונים */
    var keys = Object.keys(S.days).sort(function (a, b) { return new Date(a) - new Date(b); });
    while (keys.length > 45) delete S.days[keys.shift()];
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
  }
  function dayKey(d) { d = d || new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function today() { var k = dayKey(); return S.days[k] || (S.days[k] = { min: 0, ev: {} }); }
  /* מספר השבוע בשנה (ISO) — לאתגר השבועי */
  function weekKey() { var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7); var w1 = new Date(d.getFullYear(), 0, 4); return d.getFullYear() + '-W' + (1 + Math.round(((d - w1) / 864e5 - 3 + (w1.getDay() + 6) % 7) / 7)); }

  /* ---------- פרק 2 — אירועים ---------- */
  function track(evt, n) {
    var t = today(); t.ev[evt] = (t.ev[evt] || 0) + (n == null ? 1 : n);
    /* אירוע כללי לכל תשובה (לכל התחנות) */
    if (/^answer:/.test(evt)) t.ev.answer = (t.ev.answer || 0) + (n == null ? 1 : n);
    save();
    window.dispatchEvent(new CustomEvent('progress:track', { detail: { evt: evt } }));
  }
  function countToday(evt) { return today().ev[evt] || 0; }

  /* ---------- פרק 3 — סטטיסטיקה ללמידה ---------- */
  function recordAnswer(station, firstTry) {
    var s = S.st[station] || (S.st[station] = { a: 0, c: 0, recent: [] });
    s.a++; if (firstTry) s.c++;
    s.recent.push(firstTry ? 1 : 0); if (s.recent.length > 20) s.recent.shift();
    save();
  }
  function accuracy(station) { var s = S.st[station]; if (!s || !s.recent.length) return null; return s.recent.reduce(function (a, b) { return a + b; }, 0) / s.recent.length; }
  /* תחנות לחיזוק: דיוק נמוך מ-70% אחרי לפחות 6 תשובות */
  function weakStations() {
    return Object.keys(S.st).filter(function (k) { return S.st[k].recent.length >= 6 && accuracy(k) < 0.7; })
      .sort(function (a, b) { return accuracy(a) - accuracy(b); }).slice(0, 3);
  }
  function strongStations() {
    return Object.keys(S.st).filter(function (k) { return S.st[k].recent.length >= 6 && accuracy(k) >= 0.9; })
      .sort(function (a, b) { return accuracy(b) - accuracy(a); }).slice(0, 3);
  }

  /* ---------- פרק 4 — זמן שימוש ---------- */
  var lastTouch = Date.now(), acc = 0;
  ['pointerdown', 'keydown'].forEach(function (e) { window.addEventListener(e, function () { lastTouch = Date.now(); }, { passive: true }); });
  setInterval(function () {
    if (document.hidden || Date.now() - lastTouch > 120000) return;   // לא סופרים כשלא משחקים באמת
    acc += 15;
    if (acc >= 60) { acc -= 60; today().min++; save(); checkLimit(); }
  }, 15000);
  function minutesToday() { return today().min; }
  function minutesWeek() { var sum = 0; for (var i = 0; i < 7; i++) { var d = new Date(); d.setDate(d.getDate() - i); var x = S.days[dayKey(d)]; if (x) sum += x.min; } return sum; }

  /* ---------- פרק 5 — זמן מסך בריא ---------- */
  function setLimit(m) { S.limit = m | 0; save(); }
  function getLimit() { return S.limit || 0; }
  function checkLimit() {
    var t = today(), lim = (S.limit || 0) + (t.extra || 0);
    if (!S.limit || t.min < lim || document.getElementById('rest-overlay')) return;
    var o = document.createElement('div');
    o.id = 'rest-overlay';
    o.setAttribute('style', 'position:fixed;inset:0;z-index:99999;display:grid;place-items:center;padding:20px;background:radial-gradient(circle at 50% 40%,#3a1177,#0b0420);font-family:Rubik,system-ui,sans-serif;color:#fff;text-align:center;direction:rtl');
    var hero = window.HeroAvatar ? HeroAvatar.svg(window.HeroRewards ? HeroRewards.outfit : null) : '🦸‍♀️';
    /* הדמות הפעילה מהצוות (אלה / בן / רובי...) — ניסוח לפי מין דקדוקי */
    var hh = window.HeroRewards && HeroRewards.hero, rest = hh ? hh.name + (hh.g === 'm' ? ' צריך לנוח' : ' צריכה לנוח') : 'הגיבורה צריכה לנוח';
    o.innerHTML = '<div><div style="width:min(40vw,220px);margin:0 auto;animation:h-float 2.4s ease-in-out infinite alternate">' + hero + '</div>' +
      '<h1 style="font-size:clamp(30px,5vw,54px);margin:10px 0">' + rest + ' 😴</h1>' +
      '<p style="font-size:clamp(18px,2.4vw,26px);opacity:.9">שיחקת ולמדת המון היום! נתראה מחר עם הפתעות חדשות 🌙</p>' +
      '<button id="rest-extend" style="margin-top:22px;padding:12px 22px;border-radius:999px;border:3px solid #fff;background:transparent;color:#fff;font:700 16px Rubik,sans-serif">הורה: להחזיק 3 שניות כדי להוסיף 15 דקות</button></div>';
    document.body.appendChild(o);
    try { if (window.Voice) Voice.say(rest + '. שיחקת ולמדת המון היום! נתראה מחר.', { interrupt: true }); } catch (e) {}
    /* הארכה להורה: לחיצה ארוכה של 3 שניות */
    var b = document.getElementById('rest-extend'), timer = null;
    b.addEventListener('pointerdown', function () { b.textContent = 'ממשיכים להחזיק…'; timer = setTimeout(function () { t.extra = (t.extra || 0) + 15; save(); o.remove(); }, 3000); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (e) { b.addEventListener(e, function () { clearTimeout(timer); b.textContent = 'הורה: להחזיק 3 שניות כדי להוסיף 15 דקות'; }); });
  }
  setTimeout(checkLimit, 1500);

  /* ---------- פרק 6 — משימת היום ---------- */
  /* מאגר משימות: evt = האירוע שנספר, n = כמה צריך, go = לאן הכפתור מוביל */
  var QUESTS = [
    { id: 'ans10', t: 'עני נכון על 10 שאלות באקדמיה', ico: '📚', evt: 'answer', n: 10, go: './learning.html' },
    { id: 'letters', t: '3 תשובות נכונות באותיות או בקריאה', ico: '📖', evt: 'group:lang', n: 3, go: './learning.html' },
    { id: 'english', t: '3 תשובות נכונות באנגלית', ico: '🇬🇧', evt: 'group:en', n: 3, go: './learning.html' },
    { id: 'math', t: '3 תשובות נכונות בחשבון או במספרים', ico: '➕', evt: 'group:math', n: 3, go: './learning.html' },
    { id: 'words', t: 'בני 2 מילים בבונה המילים', ico: '🧱', evt: 'answer:wordbuild', n: 2, go: './learning.html' },
    { id: 'cats', t: 'הצילי 3 חתולים בטיסת גיבורה', ico: '🐱', evt: 'flight:cats', n: 3, go: './flight.html' },
    { id: 'art', t: 'שמרי ציור אחד בגלריה', ico: '🎨', evt: 'art:save', n: 1, go: './coloring.html' },
    { id: 'orders', t: 'הגישי 3 הזמנות בעגלה', ico: '🍔', evt: 'cart:order', n: 3, go: './cart.html' },
    { id: 'story', t: 'קראי סיפור אחד בספרייה', ico: '📚', evt: 'story:read', n: 1, go: './stories.html' },
    { id: 'pet', t: 'האכילי את חיית המחמד', ico: '🐾', evt: 'pet:feed', n: 1, go: './index.html#pet' }
  ];
  /* 3 משימות לכל תאריך — קבועות לאותו יום (זרע לפי התאריך), תמיד משימת למידה אחת לפחות */
  function questsToday() {
    var k = dayKey(), seed = 0; for (var i = 0; i < k.length; i++) seed = (seed * 31 + k.charCodeAt(i)) % 100003;
    var learn = QUESTS.slice(0, 5), fun = QUESTS.slice(5);
    var a = learn[seed % learn.length], b = fun[(seed >> 3) % fun.length], c = QUESTS[(seed >> 5) % QUESTS.length];
    if (c === a || c === b) c = learn[(seed + 1) % learn.length] === a ? learn[(seed + 2) % learn.length] : learn[(seed + 1) % learn.length];
    return [a, b, c].map(function (q) { var v = countToday(q.evt); return Object.assign({}, q, { v: Math.min(v, q.n), done: v >= q.n }); });
  }
  function questsDone() { return questsToday().every(function (q) { return q.done; }); }
  /* פרס משימת היום: פתיחת הפרק הבא בסיפור היומי (פעם ביום) */
  function claimDaily() {
    var k = dayKey();
    if (S.daily.claimed === k || !questsDone()) return false;
    S.daily.claimed = k; S.story.ep = (S.story.ep || 0) + 1; save();
    return S.story.ep;
  }
  function dailyClaimed() { return S.daily.claimed === dayKey(); }

  /* ---------- פרק 7 — אתגר שבועי ---------- */
  /* נבלים מצחיקים (לא מפחידים) — מתחלפים לפי מספר השבוע */
  var VILLAINS = [
    { name: 'בלגנון', ico: '🧙‍♂️', line: 'בלגנון ערבב את כל התחנות באקדמיה!' },
    { name: 'שכחנית', ico: '🧙‍♀️', line: 'שכחנית רוצה שכולם ישכחו את מה שלמדו!' },
    { name: 'רובוט הרעש', ico: '👾', line: 'רובוט הרעש מפריע לכולם להתרכז!' },
    { name: 'ענן האפור', ico: '🌩️', line: 'ענן האפור גנב את הצבעים מהעיר!' },
    { name: 'דרקון הפיהוק', ico: '🐲', line: 'דרקון הפיהוק מרדים את כל העיר!' },
    { name: 'מלך הבלבול', ico: '🦹', line: 'מלך הבלבול הפך את כל התשובות!' }
  ];
  var BOSS_HP = 12;
  function boss() {
    var w = weekKey();
    if (S.boss.week !== w) { var n = parseInt(w.split('W')[1], 10) || 0; S.boss = { week: w, hp: BOSS_HP, won: false, v: n % VILLAINS.length }; }
    S.boss.max = BOSS_HP; S.boss.villain = VILLAINS[S.boss.v || 0];
    return S.boss;
  }
  /* bossHit(n) — פגיעה בנבל (ברירת מחדל 1); ניצחון = גביע */
  function bossHit(n) { var b = boss(); if (b.won) return b; b.hp = Math.max(0, b.hp - (n || 1)); if (!b.hp) { b.won = true; S.trophies = (S.trophies || 0) + 1; } save(); return b; }

  /* ---------- ייצוא ---------- */
  window.Progress = {
    track: track, countToday: countToday, recordAnswer: recordAnswer, accuracy: accuracy,
    weakStations: weakStations, strongStations: strongStations,
    minutesToday: minutesToday, minutesWeek: minutesWeek, setLimit: setLimit, getLimit: getLimit,
    questsToday: questsToday, questsDone: questsDone, claimDaily: claimDaily, dailyClaimed: dailyClaimed,
    storyEpisode: function () { return S.story.ep || 0; },
    boss: boss, bossHit: bossHit, trophies: function () { return S.trophies || 0; }, VILLAINS: VILLAINS,
    stats: function () { return S.st; }, days: function () { return S.days; },
    /* איפוס נתוני מעקב — מגבלת הזמן שההורה קבע נשמרת */
    reset: function () { var l = S.limit; S = blank(); S.limit = l; save(); }
  };
})();
