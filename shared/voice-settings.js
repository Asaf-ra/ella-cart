/* =====================================================================
   shared/voice-settings.js — הגדרות קול להורה
   ---------------------------------------------------------------------
   פרק 1 — פתיחת החלון (VoiceSettings.open)
   פרק 2 — רשימות קולות: עברית ואנגלית, עם סימון "מומלץ" לקולות איכותיים
   פרק 3 — בדיקת קול (משפט לדוגמה) + מהירות דיבור
   פרק 4 — הסבר להורה: איך מורידים קול משופר באייפד (הכי משפיע על הטבעיות)
   פרק 5 — מצב הקול העברי במכשיר (Voice.heStatus): משופר ✅ / בסיסי ⚠️ / אין קול
   תלויות: js/audio.js (Voice.voices/current/setPref/read), shared/theme.css
   ===================================================================== */
(function () {
  'use strict';

  var SAMPLE_HE = 'שלום אלה! איזה כיף ללמוד איתך היום. בואי נספור יחד: אחת, שתיים, שלוש!';
  var SAMPLE_EN = 'Hello Ella! You are a super hero. Let us learn some English words together!';

  /* האם שם הקול מרמז על איכות גבוהה */
  function isGood(v) { return /premium|enhanced|siri|neural|natural|google|משופר/i.test(v.name + ' ' + (v.voiceURI || '')); }

  /* ---------- פרק 1 — פתיחה ---------- */
  function open() {
    if (!window.Voice || !Voice.voices) return;
    var m = document.createElement('div');
    m.className = 'h-modal show';
    var card = document.createElement('div');
    card.className = 'h-modal-card h-panel vs-card';
    m.appendChild(card); document.body.appendChild(m);

    function render() {
      var all = Voice.voices(), cur = Voice.current();
      var heList = all.filter(function (v) { return /^(he|iw)/i.test(v.lang); });
      var enList = all.filter(function (v) { return /^en[-_](US|GB|AU)/i.test(v.lang); });
      /* ---------- פרק 2 — רשימות ---------- */
      function list(arr, key) {
        if (!arr.length) return '<p class="vs-empty">לא נמצא קול ' + (key === 'he' ? 'עברי' : 'אנגלי') + ' במכשיר — ראו הסבר למטה.</p>';
        return '<div class="vs-list">' + arr.slice(0, 14).map(function (v) {
          return '<button type="button" class="vs-voice' + (cur[key] === v.name ? ' on' : '') + '" data-k="' + key + '" data-n="' + v.name.replace(/"/g, '&quot;') + '">' +
            (isGood(v) ? '⭐ ' : '') + v.name + (/compact/i.test(v.voiceURI || '') ? ' (בסיסי)' : '') + '</button>';
        }).join('') + '</div>';
      }
      card.innerHTML = '<button type="button" class="vs-close" aria-label="סגירה">✖</button>' +
        '<span class="h-modal-kicker">🔊 הגדרות קול</span>' +
        /* ---------- פרק 5 — מצב הקול העברי ---------- */
        (function () {
          var stt = Voice.heStatus ? Voice.heStatus() : 'basic';
          if (stt === 'good') return '<p class="vs-status ok">✅ מותקן קול עברי משופר — ההקראה בעברית טבעית.</p>';
          if (stt === 'none') return '<p class="vs-status warn">⚠️ לא נמצא קול עברי במכשיר — ראו הסבר למטה איך מורידים את "כרמית (משופר)".</p>';
          return '<p class="vs-status warn">⚠️ מותקן רק הקול העברי הבסיסי (הוא שנשמע "רובוטי"). מומלץ מאוד להוריד את <b>כרמית (משופר)</b> — הסבר למטה. האנגלית כבר מוקראת בהקלטות טבעיות מובנות 🎙️</p>';
        })() +
        '<div class="vs-cols">' +
          '<section><h3>קול עברי</h3>' + list(heList, 'he') + '<button type="button" class="h-btn cyan vs-test" data-t="he">▶ בדיקה בעברית</button></section>' +
          '<section><h3>קול אנגלי</h3>' + list(enList, 'en') + '<button type="button" class="h-btn cyan vs-test" data-t="en">▶ Test English</button></section>' +
        '</div>' +
        /* ---------- פרק 3 — מהירות ---------- */
        '<label class="vs-rate">מהירות דיבור: <input type="range" min="0.8" max="1.15" step="0.05" value="' + cur.rate + '"> <b>' + Math.round(cur.rate * 100) + '%</b></label>' +
        /* ---------- פרק 4 — הסבר להורה ---------- */
        '<details class="vs-tip"' + (Voice.heStatus && Voice.heStatus() !== 'good' ? ' open' : '') + '><summary>💡 איך מקבלים קול טבעי יותר באייפד?</summary>' +
          '<ol><li>הגדרות ← נגישות ← תוכן מוקרא ← קולות</li>' +
          '<li>עברית ← <b>כרמית (משופר)</b> ← להוריד</li>' +
          '<li>אנגלית ← <b>Ava (Premium)</b> או <b>Samantha (Enhanced)</b> ← להוריד</li>' +
          '<li>לחזור לכאן ולבחור את הקול המסומן ב-⭐</li></ol>' +
          '<p>קולות "משופר / Premium" נשמעים טבעיים וזורמים הרבה יותר מהקול הבסיסי — ועובדים גם בלי אינטרנט.</p></details>';

      card.querySelector('.vs-close').onclick = function () { m.remove(); };
      Array.prototype.forEach.call(card.querySelectorAll('.vs-voice'), function (b) {
        b.onclick = function () { Voice.setPref(b.dataset.k, b.dataset.n); render(); test(b.dataset.k); };
      });
      Array.prototype.forEach.call(card.querySelectorAll('.vs-test'), function (b) { b.onclick = function () { test(b.dataset.t); }; });
      var range = card.querySelector('.vs-rate input');
      range.oninput = function () { card.querySelector('.vs-rate b').textContent = Math.round(range.value * 100) + '%'; };
      range.onchange = function () { Voice.setPref('rate', +range.value); test('he'); };
    }
    function test(k) { Voice.read([{ text: k === 'en' ? SAMPLE_EN : SAMPLE_HE, lang: k === 'en' ? 'en-US' : 'he-IL' }], { interrupt: true }); }
    render();
    /* ב-iOS רשימת הקולות נטענת באיחור — מרעננים פעם אחת */
    setTimeout(render, 600);
  }

  /* סגנון החלון */
  var st = document.createElement('style');
  st.textContent =
    '.vs-card{width:min(96vw,920px);max-height:92vh;overflow:auto;text-align:right}' +
    '.vs-close{position:absolute;top:12px;left:12px;width:52px;height:52px;border:4px solid var(--h-ink);border-radius:50%;background:var(--h-magenta);color:#fff;font:900 22px/1 var(--h-font);box-shadow:0 4px 0 var(--h-ink);cursor:pointer}' +
    '.vs-cols{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:14px}' +
    '.vs-cols h3{font:900 22px/1.2 var(--h-font);margin-bottom:8px;color:var(--h-ink)}' +
    '.vs-list{display:grid;gap:6px;max-height:34vh;overflow:auto;margin-bottom:10px;padding:2px}' +
    '.vs-voice{text-align:right;padding:10px 12px;border:3px solid var(--h-ink);border-radius:14px;background:#fff;font:700 16px/1.2 var(--h-font);color:var(--h-ink);cursor:pointer;direction:ltr}' +
    '.vs-voice.on{background:linear-gradient(180deg,#fff3b0,#ffc93c);box-shadow:0 0 0 3px var(--h-magenta)}' +
    '.vs-empty{color:var(--h-text-soft);font-weight:700}' +
    '.vs-status{margin:12px 0 0;padding:10px 14px;border:3px solid var(--h-ink);border-radius:16px;font:800 16px/1.45 var(--h-font);color:var(--h-ink)}.vs-status.ok{background:#e0fff1}.vs-status.warn{background:#fff3b0}' +
    '.vs-rate{display:flex;gap:10px;align-items:center;margin:14px 0;font:800 18px/1 var(--h-font);color:var(--h-ink)}.vs-rate input{flex:1;accent-color:#ff2e93}' +
    '.vs-tip{border:3px dashed rgba(27,16,54,.3);border-radius:16px;padding:10px 14px;color:var(--h-ink);font-weight:700}.vs-tip summary{cursor:pointer;font-weight:900}.vs-tip ol{margin:8px 22px 6px 0;line-height:1.7}' +
    '@media (max-width:760px){.vs-cols{grid-template-columns:1fr}}';
  document.head.appendChild(st);

  window.VoiceSettings = { open: open };
})();
