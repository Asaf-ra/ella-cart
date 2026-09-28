/* =====================================================================
   shared/parents.js — אזור ההורים: שער הורים + לוח מעקב + זמן מסך בריא
   ---------------------------------------------------------------------
   פרק 1 — שער הורים: שאלת כפל (ילדים בני 5–8 לא יפתרו בטעות) לפני הכניסה
   פרק 2 — לוח: סיכום היום והשבוע (דקות, תשובות, סיפורים, ציורים, רמה)
   פרק 3 — גרף 7 ימים של דקות שימוש
   פרק 4 — מגבלת זמן מסך יומית (אלה "מבקשת לנוח" כשמגיעים למגבלה)
   פרק 5 — למידה לפי נושא: דיוק מהניסיון הראשון בכל תחנה, חזקות 💪 ולחיזוק 🎯
   פרק 6 — הגדרות קול (כולל הסבר על קול עברי משופר) ואיפוס נתוני מעקב
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
  function dayKey(d) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }

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
    '@media (max-width:700px){.pa-row{grid-template-columns:1fr 1fr 56px 50px}}';
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
      /* פרק 6 — קול ואיפוס */
      '<div class="pa-sec"><h3>🔊 קול ההקראה</h3><p class="pa-note">האנגלית מוקראת בהקלטות קול טבעיות מובנות. לעברית טבעית: הגדרות ← נגישות ← תוכן מוקרא ← קולות ← עברית ← <b>כרמית (משופר)</b> ← להוריד, ואז לבחור אותה כאן.</p>' +
        '<div class="pa-actions">' + (window.VoiceSettings ? '<button type="button" class="h-btn cyan" id="paVoice">🔊 הגדרות קול</button>' : '') +
        '<button type="button" class="h-btn violet" id="paReset">🗑️ איפוס נתוני מעקב</button></div></div>';
    card.querySelector('.pa-x').onclick = function () { m.remove(); };
    card.querySelectorAll('[data-l]').forEach(function (b) {
      b.onclick = function () { P.setLimit(+b.dataset.l); card.querySelectorAll('[data-l]').forEach(function (x) { x.classList.toggle('on', x === b); }); snd('tap'); };
    });
    var v = card.querySelector('#paVoice'); if (v) v.onclick = function () { VoiceSettings.open(); };
    var r = card.querySelector('#paReset');
    r.onclick = function () {
      if (!r.dataset.sure) { r.dataset.sure = 1; r.textContent = 'בטוח? ללחוץ שוב (הרמה והתחפושות נשמרות)'; return; }
      P.reset(); snd('pop'); dashboard(card, m);
    };
  }

  window.Parents = { open: open };
})();
