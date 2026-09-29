/* =====================================================================
   shared/parents.js — אזור ההורים: שער הורים + לוח מעקב + זמן מסך בריא
   ---------------------------------------------------------------------
   פרק 1 — שער הורים: שאלת כפל (ילדים בני 5–8 לא יפתרו בטעות) לפני הכניסה
   פרק 2 — לוח: סיכום היום והשבוע (דקות, תשובות, סיפורים, ציורים, רמה)
   פרק 3 — גרף 7 ימים של דקות שימוש
   פרק 4 — מגבלת זמן מסך יומית (אלה "מבקשת לנוח" כשמגיעים למגבלה)
   פרק 5 — למידה לפי נושא: דיוק מהניסיון הראשון בכל תחנה, חזקות 💪 ולחיזוק 🎯
   פרק 6 — הגדרות קול (כולל הסבר על קול עברי משופר) ואיפוס נתוני מעקב
   פרק 6.5 — הילדות במכשיר (הוספה, עריכת שם ומראה, מחיקה, החלפה), שיתוף (הזמנה לחברה, דוח שבועי,
             תעודות), וגיבוי/שחזור לקובץ — להעברה לאייפד חדש
   פרק 7 — איפוס לפי נושא: 15 נושאים (חיית מחמד, גיבורה וצוות, אקדמיה, נבל השבוע, משימות היום,
           סיפורים, דפי צביעה, גלריה, עגלה, טיסה, מטבעות, אלבום מדבקות, תעודות, מתנות חג, נתוני מעקב)
           + תחנה אחת באקדמיה + איפוס מלא (של הילדה שמשחקת עכשיו).
           כל איפוס — אישור בנגיעה שנייה. הגדרות הקול ומגבלת זמן המסך לא נמחקים לעולם
   תלויות: shared/progress.js (חובה), shared/theme.css; אופציונלי: shared/voice-settings.js, hero-rewards.js
   ===================================================================== */
(function () {
  'use strict';

  /* שמות התחנות באקדמיה (לטבלת הלמידה) */
  var NAMES = { numbers: '🔢 מספרים', colors: '🎨 צבעים', shapes: '🔷 צורות', patterns: '🧩 דפוסים', letters: 'א אותיות', english: '🔤 אנגלית A-Z', animals: '🐾 חיות',
    food: '🍎 אוכל', size: '📏 גודל', memory: '🧠 זיכרון', puzzles: '🧩 פאזלים', math: '➕ חשבון', music: '🎵 מוזיקה', reading: '📖 קריאה', wordbuild: '🧱 בונים מילים',
    language: '💬 שפה', envocab: '🇬🇧 מילים באנגלית', enspell: '🔠 איות באנגלית', nature: '🌿 טבע' };
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function snd(n) { try { if (window.Sound && Sound[n]) Sound[n](); } catch (e) {} }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function dayKey(d) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }

  /* ---------- פרק 7 — איפוס לפי נושא ----------
     כל נושא: מה נמחק (fn) + הסבר קצר להורה (what). אחרי איפוס הדף נטען מחדש כשסוגרים את הלוח —
     כך כל המסכים (HUD, גיבורה, חיה, משימות) מתחילים נקי. לא נמחקים לעולם: ella-voice-v1 ומגבלת הזמן */
  var JKEY = 'ella-learning-journey-v1', CART_KEY = 'ella_cart_save_v1';
  function rm(k) { try { localStorage.removeItem(k); } catch (e) {} }
  /* editJSON — עריכה של שמירה קיימת (למשל לאפס שדרוגים ולהשאיר מטבעות) */
  function editJSON(k, fn) { try { var o = JSON.parse(localStorage.getItem(k)); if (!o) return; fn(o); localStorage.setItem(k, JSON.stringify(o)); } catch (e) {} }
  /* PR — מודול המעקב (shared/progress.js) */
  function PR() { return window.Progress; }
  var TOPICS = [
    { id: 'pet', ico: '🐉', name: 'דרקונצ׳יק', what: 'הילדה תבחר ביצה, תחמם אותה ותיתן שם בעצמה', fn: function () { if (window.Pet && Pet.reset) Pet.reset(); rm('ella-pet-v1'); } },
    { id: 'hero', ico: '🦸‍♀️', name: 'גיבורה וצוות', what: 'חזרה לרמה 1: תחפושות, כוחות וחברי צוות ננעלים מחדש (הפריטים החופשיים נשארים)', fn: function () { rm('ella-hero-v1'); } },
    { id: 'academy', ico: '📚', name: 'אקדמיה — כל התחנות', what: 'כל הפרקים והכוכבים בשתי הרמות (רמת הקושי שנבחרה נשמרת)', fn: function () { editJSON(JKEY, function (j) { j.chap = { young: {}, big: {} }; j.progress = {}; j.completed = {}; j.stars = 0; j.totalCorrect = 0; }); } },
    { id: 'boss', ico: '⚔️', name: 'נבל השבוע', what: 'הנבל חוזר עם כל נקודות החיים — אפשר להילחם בו שוב', fn: function () { PR().resetBoss(); } },
    { id: 'quests', ico: '📜', name: 'משימות היום', what: 'משימות היום מתחילות מאפס ואפשר לזכות שוב בפרס', fn: function () { PR().resetDaily(); } },
    { id: 'stories', ico: '📖', name: 'סיפורים', what: 'סימוני "נקרא" (הפרס הראשון חוזר), ופרקי "הרפתקאות אלה" ננעלים מחדש — חוץ מפרק 1', fn: function () { rm('ella-stories-v1'); PR().resetStories(); } },
    { id: 'art', ico: '🖍️', name: 'דפי צביעה בתהליך', what: 'כל הדפים חוזרים ללבן (הגלריה נשמרת)', fn: function () { rm('ella-art-work-v1'); rm('ella-art-v1'); } },
    { id: 'gallery', ico: '🖼️', name: 'גלריית הציורים', what: 'כל הציורים השמורים יימחקו', fn: function () { rm('ella-coloring-gallery'); } },
    { id: 'cart', ico: '🍔', name: 'העגלה', what: 'שדרוגי העגלה חוזרים להתחלה (המטבעות נשמרים)', fn: function () { editJSON(CART_KEY, function (c) { c.lvls = {}; }); } },
    { id: 'flight', ico: '🚀', name: 'טיסת גיבורה', what: 'אזורים שנפתחו, שיא וחתולים שניצלו', fn: function () { rm('ella-flight-v1'); } },
    { id: 'coins', ico: '🪙', name: 'מטבעות ושדרוגים', what: 'מטבעות = 0, ושדרוגי הבלונים והציור מעגלת השדרוגים', fn: function () { editJSON(CART_KEY, function (c) { c.coins = 0; }); rm('ella-shop-v1'); } },
    { id: 'stickers', ico: '📒', name: 'אלבום המדבקות', what: 'כל המדבקות שנאספו — האלבום מתחיל ריק', fn: function () { rm('ella-stickers-v1'); } },
    { id: 'certs', ico: '🏅', name: 'תעודות', what: 'כל התעודות שנשמרו (אפשר לזכות בהן שוב)', fn: function () { rm('ella-certs-v1'); } },
    { id: 'seasons', ico: '🎁', name: 'מתנות חג ויום הולדת', what: 'מתנת החג / יום ההולדת תחכה שוב (אביזרים שכבר נפתחו נשארים)', fn: function () { rm('ella-seasons-v1'); } },
    { id: 'stats', ico: '📊', name: 'נתוני מעקב', what: 'דקות, גרף ודיוק לפי תחנה (מגבלת הזמן נשמרת)', fn: function () { PR().reset(); } }
  ];
  /* resetStation — תחנה אחת באקדמיה (בשתי הרמות) + נתוני הדיוק שלה */
  function resetStation(k) {
    editJSON(JKEY, function (j) { ['young', 'big'].forEach(function (g) { if (j.chap && j.chap[g]) delete j.chap[g][k]; }); if (j.progress) j.progress[k] = 0; if (j.completed) j.completed[k] = false; });
    try { PR().resetStation(k); } catch (e) {}
  }
  /* stationDone — כמה פרקים הושלמו בתחנה (מתוך 10: 5 לכל רמה) */
  function stationDone(j, k) { var n = 0; ['young', 'big'].forEach(function (g) { var c = j && j.chap && j.chap[g] && j.chap[g][k]; if (c && c.stars) c.stars.forEach(function (x) { if (x >= 3) n++; }); }); return n; }
  /* resetAll — איפוס מלא: כל הנושאים יחד + טעינה מחדש */
  function resetAll() {
    TOPICS.forEach(function (t) { try { t.fn(); } catch (e) {} });
    rm(JKEY);
    try { sessionStorage.removeItem('ella-intro-seen'); } catch (e) {}
    location.reload();
  }
  /* confirmTwice — כפתור שדורש נגיעה שנייה לאישור (חוזר למצב רגיל אחרי 5 שניות) */
  function confirmTwice(btn, askText, fn) {
    btn.onclick = function () {
      if (btn.disabled) return;
      if (!btn.dataset.sure) {
        btn.dataset.sure = 1; btn.dataset.orig = btn.innerHTML; btn.innerHTML = askText; btn.classList.add('sure'); snd('tap');
        setTimeout(function () { if (btn.isConnected && btn.dataset.sure) { delete btn.dataset.sure; btn.innerHTML = btn.dataset.orig; btn.classList.remove('sure'); } }, 5000);
        return;
      }
      delete btn.dataset.sure; btn.classList.remove('sure'); fn();
    };
  }

  var st = document.createElement('style');
  st.textContent =
    '.pa-card{width:min(96vw,1000px);max-height:92vh;overflow-y:auto;text-align:right;padding:20px 22px}' +
    '.pa-x{position:absolute;top:12px;left:12px;width:52px;height:52px;border:4px solid var(--h-ink);border-radius:50%;background:var(--h-magenta);color:#fff;font:900 22px/1 var(--h-font);box-shadow:0 4px 0 var(--h-ink);cursor:pointer;z-index:2}' +
    '.pa-gate{text-align:center}.pa-gate h2{margin:14px 0 6px}.pa-nums{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px auto;max-width:420px}' +
    '.pa-nums button{padding:14px 0;border:4px solid var(--h-ink);border-radius:18px;background:#fff;box-shadow:0 4px 0 var(--h-ink);font:900 26px/1 var(--h-font);cursor:pointer}' +
    '.pa-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin:14px 0}' +
    '.pa-tile{padding:12px;border:3px solid var(--h-ink);border-radius:18px;background:#fff;box-shadow:0 3px 0 var(--h-ink)}.pa-tile b{display:block;font:900 30px/1.1 var(--h-font)}.pa-tile span{font:700 14px/1.2 var(--h-font);color:var(--h-text-soft)}' +
    '.pa-sec{margin-top:16px;padding:14px;border:3px solid var(--h-ink);border-radius:20px;background:#fff}.pa-sec h3{font:900 20px/1.2 var(--h-font);margin-bottom:10px}' +
    '.pa-chart{display:flex;align-items:flex-end;gap:10px;height:150px;padding-top:10px}.pa-bar{flex:1;display:grid;justify-items:center;gap:4px;font:800 13px/1 var(--h-font)}' +
    '.pa-bar i{display:block;width:100%;max-width:56px;border:3px solid var(--h-ink);border-radius:10px 10px 4px 4px;background:linear-gradient(180deg,#ff7ec2,#8b5cff)}.pa-bar.today i{background:linear-gradient(180deg,#ffd95a,#ff9f1c)}' +
    '.pa-limits{display:flex;gap:8px;flex-wrap:wrap}.pa-limits button{padding:10px 16px;border:3px solid var(--h-ink);border-radius:999px;background:#fff;font:900 17px/1 var(--h-font);cursor:pointer;box-shadow:0 3px 0 var(--h-ink)}.pa-limits button.on{background:var(--h-gold)}' +
    '.pa-row{display:grid;grid-template-columns:minmax(120px,1fr) 2fr 70px 60px;gap:10px;align-items:center;padding:6px 0;border-bottom:2px dashed rgba(27,16,54,.15);font:800 15px/1.2 var(--h-font)}' +
    '.pa-acc{height:14px;border:2px solid var(--h-ink);border-radius:999px;background:#eee;overflow:hidden}.pa-acc i{display:block;height:100%}' +
    '.pa-note{font:700 15px/1.5 var(--h-font);color:var(--h-text-soft)}.pa-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}' +
    '.pa-topics{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:10px;margin-top:10px}' +
    '.pa-topic{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;padding:10px;border:3px solid var(--h-ink);border-radius:16px;background:#fffaf0}' +
    '.pa-topic .pt-ico{font-size:30px}.pa-topic b{display:block;font:900 16px/1.2 var(--h-font)}.pa-topic small{display:block;font:700 13px/1.35 var(--h-font);color:var(--h-text-soft)}' +
    '.pt-btn,.pa-st{border:3px solid var(--h-ink);border-radius:999px;background:#fff;box-shadow:0 3px 0 var(--h-ink);font:900 14px/1.2 var(--h-font);cursor:pointer;color:var(--h-ink)}' +
    '.pt-btn{padding:8px 14px;white-space:nowrap}.pa-st{padding:7px 12px}' +
    '.pt-btn.sure,.pa-st.sure{background:#ff5a6e;color:#fff}.pt-btn.done,.pa-st.done{background:#b6ffdc;box-shadow:none}' +
    '.pa-kids{display:grid;gap:10px}.pa-kid{display:grid;grid-template-columns:auto 1fr auto auto;gap:10px;align-items:center;padding:8px 10px;border:3px solid var(--h-ink);border-radius:16px;background:#fffaf0}' +
    '.pa-kid.me{background:linear-gradient(180deg,#fff3b0,#ffe07a)}.pk-th{width:60px;height:66px;overflow:hidden;border-radius:12px;background:radial-gradient(circle at 50% 40%,#4a1c8f,#1d0b4a)}.pk-th svg{width:100%;height:auto}' +
    '.pa-kid b{display:block;font:900 18px/1.2 var(--h-font)}.pa-kid small{font:700 13px/1.3 var(--h-font);color:var(--h-text-soft)}' +
    '.pa-stations{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}.pa-sub{font:900 17px/1.2 var(--h-font);margin-top:16px}' +
    '@media (max-width:700px){.pa-row{grid-template-columns:1fr 1fr 56px 50px}.pa-topics{grid-template-columns:1fr}}';
  document.head.appendChild(st);

  /* ---------- פרק 1 — שער הורים ---------- */
  function open() {
    var m = el('div', 'h-modal show'), card = el('div', 'h-modal-card h-panel pa-card');
    m.appendChild(card); document.body.appendChild(m);
    var a = 6 + ((Math.random() * 4) | 0), b = 6 + ((Math.random() * 4) | 0), ans = a * b;
    var opts = [ans, ans + a, ans - b, ans + 10].sort(function () { return Math.random() - .5; });
    card.innerHTML = '<button type="button" class="pa-x">✖</button><div class="pa-gate"><span class="h-modal-kicker">👨‍👩‍👧 אזור הורים</span>' +
      '<h2>שאלה קטנה להורים</h2><p class="pa-note">כדי להיכנס — כמה זה <b dir="ltr">' + a + ' × ' + b + '</b> ?</p><div class="pa-nums">' +
      opts.map(function (o) { return '<button type="button" data-v="' + o + '">' + o + '</button>'; }).join('') + '</div></div>';
    card.querySelector('.pa-x').onclick = function () { m.remove(); };
    card.querySelectorAll('[data-v]').forEach(function (btn) {
      btn.onclick = function () { if (+btn.dataset.v === ans) { snd('ding'); dashboard(card, m); } else { snd('sad'); m.remove(); } };
    });
  }

  /* ---------- פרק 2–6 — הלוח ---------- */
  function dashboard(card, m) {
    var P = window.Progress, stats = P.stats(), days = P.days();
    /* סכומים: תשובות היום, סיפורים וציורים ב-7 ימים */
    function sumWeek(evt) { var s = 0; for (var i = 0; i < 7; i++) { var d = new Date(); d.setDate(d.getDate() - i); var x = days[dayKey(d)]; if (x && x.ev[evt]) s += x.ev[evt]; } return s; }
    var H = window.HeroRewards ? HeroRewards.state : null;
    var chart = '', max = 10, arr = [];
    for (var i = 6; i >= 0; i--) { var d = new Date(); d.setDate(d.getDate() - i); var x = days[dayKey(d)]; arr.push({ d: d, m: x ? x.min : 0, today: i === 0 }); max = Math.max(max, x ? x.min : 0); }
    var DN = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
    arr.forEach(function (o) { chart += '<div class="pa-bar' + (o.today ? ' today' : '') + '"><span>' + o.m + '</span><i style="height:' + Math.max(4, o.m / max * 110) + 'px"></i><span>' + DN[o.d.getDay()] + '</span></div>'; });
    var keys = Object.keys(stats).sort(function (x, y) { return (stats[y].a || 0) - (stats[x].a || 0); });
    var rows = keys.map(function (k) {
      var acc = P.accuracy(k), pct = acc == null ? 0 : Math.round(acc * 100), col = pct >= 90 ? '#3ff2b0' : pct >= 70 ? '#ffc93c' : '#ff5a6e';
      return '<div class="pa-row"><span>' + (NAMES[k] || k) + '</span><span class="pa-acc"><i style="width:' + pct + '%;background:' + col + '"></i></span><span>' + pct + '%</span><span>' + stats[k].a + '</span></div>';
    }).join('') || '<p class="pa-note">עוד אין נתונים — הנתונים יופיעו אחרי כמה תשובות באקדמיה.</p>';
    var weak = P.weakStations(), strong = P.strongStations();
    var journey = null; try { journey = JSON.parse(localStorage.getItem(JKEY)); } catch (e) {}
    var lim = P.getLimit();
    card.innerHTML = '<button type="button" class="pa-x">✖</button><span class="h-modal-kicker">👨‍👩‍👧 לוח ההורים</span>' +
      /* פרק 2 — סיכום */
      '<div class="pa-tiles">' +
        '<div class="pa-tile"><b>' + P.minutesToday() + '</b><span>דקות משחק היום</span></div>' +
        '<div class="pa-tile"><b>' + P.minutesWeek() + '</b><span>דקות ב-7 ימים</span></div>' +
        '<div class="pa-tile"><b>' + P.countToday('answer') + '</b><span>שאלות שנפתרו היום</span></div>' +
        '<div class="pa-tile"><b>' + sumWeek('answer') + '</b><span>שאלות השבוע</span></div>' +
        '<div class="pa-tile"><b>' + sumWeek('story:read') + '</b><span>סיפורים שנקראו השבוע</span></div>' +
        '<div class="pa-tile"><b>' + sumWeek('art:save') + '</b><span>ציורים שנשמרו השבוע</span></div>' +
        '<div class="pa-tile"><b>' + sumWeek('motor:done') + '</b><span>תרגילי עט השבוע (מוטוריקה)</span></div>' +
        (window.Motor ? '<div class="pa-tile"><b>' + Motor.EX.filter(function (id) { return Motor.stars(id) > 0; }).length + '/' + Motor.EX.length + '</b><span>תרגילי סדנת העט שהושלמו</span></div>' : '') +
        (H ? '<div class="pa-tile"><b>' + H.level + '</b><span>רמת גיבורה</span></div>' : '') +
        '<div class="pa-tile"><b>' + (P.boss().won ? '🏆' : P.boss().hp + '❤️') + '</b><span>נבל השבוע</span></div>' +
      '</div>' +
      /* פרק 3 — גרף */
      '<div class="pa-sec"><h3>📊 דקות משחק ב-7 הימים האחרונים</h3><div class="pa-chart">' + chart + '</div><p class="pa-note">נספרות רק דקות של משחק פעיל (מסך דולק ונגיעות בשתי הדקות האחרונות).</p></div>' +
      /* פרק 4 — מגבלת זמן */
      '<div class="pa-sec"><h3>⏰ זמן מסך בריא — מגבלה יומית</h3><div class="pa-limits">' +
        [[0, 'בלי מגבלה'], [20, '20 דק׳'], [30, '30 דק׳'], [45, '45 דק׳'], [60, 'שעה'], [90, 'שעה וחצי']].map(function (o) { return '<button type="button" data-l="' + o[0] + '" class="' + (lim === o[0] ? 'on' : '') + '">' + o[1] + '</button>'; }).join('') +
      '</div><p class="pa-note">כשמגיעים למגבלה אלה מבקשת לנוח ("נתראה מחר"). הורה יכול להוסיף 15 דקות בלחיצה ארוכה של 3 שניות.</p></div>' +
      /* פרק 5 — למידה לפי נושא */
      '<div class="pa-sec"><h3>🎓 למידה לפי נושא (דיוק בניסיון הראשון, 20 תשובות אחרונות)</h3>' +
        (strong.length ? '<p class="pa-note">💪 חזקה ב: <b>' + strong.map(function (k) { return NAMES[k] || k; }).join(' · ') + '</b></p>' : '') +
        (weak.length ? '<p class="pa-note">🎯 כדאי לתרגל: <b>' + weak.map(function (k) { return NAMES[k] || k; }).join(' · ') + '</b> — התחנות האלו מסומנות לילדה באקדמיה ב"💪 כדאי לתרגל".</p>' : '') +
        '<div class="pa-row" style="font-weight:900"><span>תחנה</span><span>דיוק</span><span>%</span><span>תשובות</span></div>' + rows + '</div>' +
      /* פרק 6.5 — הילדות במכשיר */
      '<div class="pa-sec"><h3>👧 הילדות במכשיר</h3><p class="pa-note">לכל ילדה גיבורה, התקדמות, חיית מחמד וגלריה משלה. כשיש יותר מאחת — בכל פתיחה בוחרים "מי משחקת היום?".</p>' +
        '<div class="pa-kids">' + (window.Profile ? Profile.list : []).map(function (k) {
          var me = Profile.active && Profile.active.id === k.id, o = Profile.readFor(k.id, 'ella-hero-v1'), ofit = Object.assign(HeroAvatar.defaultOutfit(), (o && o.outfit) || {});
          return '<div class="pa-kid' + (me ? ' me' : '') + '" data-noname="1"><span class="pk-th">' + HeroAvatar.svg(ofit, { look: k.look }) + '</span><div><b>' + esc(k.name) + (me ? ' · משחקת עכשיו' : '') + '</b><small>' +
            (k.bday ? '🎂 ' + k.bday.d + '/' + k.bday.m : 'בלי תאריך יום הולדת') + '</small></div>' +
            '<button type="button" class="pt-btn" data-edit="' + k.id + '">✏️ עריכה</button><button type="button" class="pt-btn" data-del="' + k.id + '">🗑️</button></div>';
        }).join('') + '</div>' +
        '<div class="pa-actions"><button type="button" class="h-btn gold" id="paAddKid">➕ ילדה נוספת</button>' +
        (window.Profile && Profile.list.length > 1 ? '<button type="button" class="h-btn cyan" id="paSwitch">👭 להחליף ילדה</button>' : '') + '</div></div>' +
      /* שיתוף */
      '<div class="pa-sec"><h3>💌 לשתף</h3><p class="pa-note">תמונות יפות לשליחה בוואטסאפ — לסבתא, לגננת או לחברים (הכול נוצר במכשיר, שום מידע לא נשלח לשום מקום).</p>' +
        '<div class="pa-actions"><button type="button" class="h-btn gold" id="paInvite">💌 הזמנה לחברה (עם קוד QR)</button><button type="button" class="h-btn cyan" id="paWeekly">📊 דוח שבועי לשיתוף</button><a class="h-btn violet" href="./welcome.html" style="text-decoration:none;display:inline-flex;align-items:center">🌐 דף ההסבר לחברים</a></div>' +
        '<div class="pa-sub">🏅 התעודות של ' + esc(window.Profile ? Profile.name : '') + '</div><div class="pa-stations" id="paCerts">' +
        ((window.Share ? Share.certs() : []).map(function (c) { return '<button type="button" class="pa-st" data-cert="' + c.id + '">' + (c.ico || '🏅') + ' ' + esc(c.line) + '</button>'; }).join('') || '<span class="pa-note">עוד אין תעודות — הן מגיעות בסיום תחנה, ניצחון על נבל, סיפורים ועוד.</span>') + '</div></div>' +
      /* גיבוי */
      '<div class="pa-sec"><h3>💾 גיבוי והעברה</h3><p class="pa-note">שומרים קובץ גיבוי (למשל ב"קבצים" או בוואטסאפ לעצמכם) — ומשחזרים באייפד חדש או אחרי ניקוי הדפדפן. הגיבוי הוא של הילדה שמשחקת עכשיו.</p>' +
        '<div class="pa-actions"><button type="button" class="h-btn gold" id="paBackup">💾 שמירת גיבוי</button><button type="button" class="h-btn violet" id="paRestore">📂 שחזור מגיבוי</button>' +
        '<input type="file" id="paFile" accept="application/json,.json" hidden></div></div>' +
      /* פרק 6 — קול */
      '<div class="pa-sec"><h3>🔊 קול ההקראה</h3><p class="pa-note">האנגלית מוקראת בהקלטות קול טבעיות מובנות. לעברית טבעית: הגדרות ← נגישות ← תוכן מוקרא ← קולות ← עברית ← <b>כרמית (משופר)</b> ← להוריד, ואז לבחור אותה כאן.</p>' +
        (window.VoiceSettings ? '<div class="pa-actions"><button type="button" class="h-btn cyan" id="paVoice">🔊 הגדרות קול</button></div>' : '') + '</div>' +
      /* פרק 7 — איפוס לפי נושא */
      '<div class="pa-sec" id="paResetSec"><h3>🧹 איפוס לפי נושא — משחקים שוב מההתחלה</h3>' +
        '<p class="pa-note">כל כפתור מאפס רק את הנושא שלו. נגיעה ראשונה — "בטוח?", נגיעה שנייה — איפוס. הגדרות הקול ומגבלת הזמן לא נמחקים לעולם.</p>' +
        '<div class="pa-topics">' + TOPICS.map(function (t) {
          return '<div class="pa-topic"><span class="pt-ico">' + t.ico + '</span><div><b>' + t.name + '</b><small>' + t.what + '</small></div><button type="button" class="pt-btn" data-t="' + t.id + '">איפוס</button></div>';
        }).join('') + '</div>' +
        '<div class="pa-sub">📚 אקדמיה — איפוס תחנה אחת (בשתי הרמות) · פרקים שהושלמו מתוך 10</div><div class="pa-stations">' + Object.keys(NAMES).map(function (k) {
          return '<button type="button" class="pa-st" data-st="' + k + '">' + NAMES[k] + ' · ' + stationDone(journey, k) + '/10</button>';
        }).join('') + '</div>' +
        '<div class="pa-sub">🔄 הכול מההתחלה</div><div class="pa-actions"><button type="button" class="h-btn violet" id="paAll">🔄 איפוס מלא של כל ההתקדמות</button></div>' +
        '<p class="pa-note">איפוס מלא = כל הנושאים למעלה יחד — כמו אפליקציה חדשה. <b>נשמרים:</b> הגדרות הקול ומגבלת זמן המסך.</p></div>';
    /* סגירה: אם אופס משהו — טוענים את הדף מחדש כדי שכל המסכים יתחילו נקי */
    var dirty = false;
    card.querySelector('.pa-x').onclick = function () { m.remove(); if (dirty) location.reload(); };
    card.querySelectorAll('[data-l]').forEach(function (b) {
      b.onclick = function () { P.setLimit(+b.dataset.l); card.querySelectorAll('[data-l]').forEach(function (x) { x.classList.toggle('on', x === b); }); snd('tap'); };
    });
    var v = card.querySelector('#paVoice'); if (v) v.onclick = function () { VoiceSettings.open(); };
    /* פרק 7 — איפוס לפי נושא (אישור בנגיעה שנייה) */
    card.querySelectorAll('.pt-btn').forEach(function (b) {
      var t = TOPICS.filter(function (x) { return x.id === b.dataset.t; })[0];
      confirmTwice(b, 'בטוח? לגעת שוב', function () {
        try { t.fn(); } catch (e) {}
        dirty = true; snd('ding'); b.innerHTML = '✅ אופס'; b.classList.add('done'); b.disabled = true;
      });
    });
    card.querySelectorAll('.pa-st').forEach(function (b) {
      confirmTwice(b, 'לאפס את ' + NAMES[b.dataset.st] + '? לגעת שוב', function () {
        resetStation(b.dataset.st); dirty = true; snd('ding');
        b.innerHTML = '✅ ' + NAMES[b.dataset.st] + ' · 0/10'; b.classList.add('done'); b.disabled = true;
      });
    });
    confirmTwice(card.querySelector('#paAll'), '⚠️ בטוח? הכול יימחק — לגעת שוב', resetAll);
    /* פרק 6.5 — הילדות במכשיר */
    card.querySelectorAll('[data-edit]').forEach(function (b) { b.onclick = function () { m.remove(); Onboarding.start({ editId: +b.dataset.edit }); }; });
    card.querySelectorAll('[data-del]').forEach(function (b) {
      var id = +b.dataset.del, kid = Profile.list.filter(function (k) { return k.id === id; })[0];
      confirmTwice(b, 'למחוק את ' + esc(kid ? kid.name : '') + ' וכל ההתקדמות שלה? לגעת שוב', function () { Profile.remove(id); location.reload(); });
    });
    var add = card.querySelector('#paAddKid'); if (add) add.onclick = function () { m.remove(); Onboarding.start({ fresh: true }); };
    var swb = card.querySelector('#paSwitch'); if (swb) swb.onclick = function () { Profile.switchWho(); };
    /* שיתוף */
    card.querySelector('#paInvite').onclick = function () { snd('tap'); Share.invite(); };
    card.querySelector('#paWeekly').onclick = function () { snd('tap'); Share.weekly(); };
    card.querySelectorAll('[data-cert]').forEach(function (b) { b.onclick = function () { var c = Share.certs().filter(function (x) { return x.id === b.dataset.cert; })[0]; if (c) Share.showCert(c); }; });
    /* גיבוי ושחזור */
    card.querySelector('#paBackup').onclick = function () {
      var data = JSON.stringify(Profile.exportData()), fname = 'גיבוי-עולם-הגיבורות-' + Profile.name + '-' + new Date().toISOString().slice(0, 10) + '.json';
      var blob = new Blob([data], { type: 'application/json' }), file = window.File ? new File([blob], fname, { type: 'application/json' }) : null;
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: 'גיבוי עולם הגיבורות' }).catch(function () {}); return; }
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fname; document.body.appendChild(a); a.click(); a.remove();
      snd('ding');
    };
    var fileIn = card.querySelector('#paFile');
    card.querySelector('#paRestore').onclick = function () { fileIn.click(); };
    fileIn.onchange = function () {
      var f = fileIn.files && fileIn.files[0]; if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        var ok = false; try { ok = Profile.importData(JSON.parse(rd.result)); } catch (e) {}
        if (ok) { snd('ding'); location.reload(); } else { snd('sad'); alert('הקובץ הזה אינו גיבוי של עולם הגיבורות'); }
      };
      rd.readAsText(f);
    };
  }

  window.Parents = { open: open };
})();
