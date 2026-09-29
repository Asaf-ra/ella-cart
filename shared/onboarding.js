/* =====================================================================
   shared/onboarding.js — אשף הפתיחה: "בואי נבנה את הגיבורה שלך!" + מסך "מי משחקת היום?"
   ---------------------------------------------------------------------
   פרק 1 — שלבי האשף: שם ← מראה (עור, תסרוקת, צבע שיער) ← צבע אהוב ← גיל ← יום הולדת ← ברוכה הבאה
   פרק 2 — תצוגה חיה של הגיבורה בכל שלב (HeroAvatar עם look זמני)
   פרק 3 — סיום: יצירת ילדה (Profile.create) / עדכון (עריכה מאזור ההורים), והפעלה
   פרק 4 — applyInit: אחרי הטעינה — צבע אהוב לגלימה ולחליפה, ורמת קושי באקדמיה (פעם אחת)
   פרק 5 — chooser: "מי משחקת היום?" כשיש כמה ילדות במכשיר
   תלויות: shared/profile.js, shared/hero-avatar.js, shared/theme.css; אופציונלי: audio.js, hero-rewards.js
   ===================================================================== */
(function () {
  'use strict';

  var COLORS = ['#ff2e93', '#ff5a6e', '#ff9f1c', '#ffd95a', '#3ff2b0', '#29c5ff', '#3d6bff', '#8b5cff'];
  var MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function snd(n) { try { if (window.Sound && Sound[n]) Sound[n](); } catch (e) {} }
  /* say — הקראה (השם שהוקלד עוד לא נשמר בפרופיל, לכן מחליפים אותו כאן) */
  function say(t) { try { if (window.Voice) Voice.say(t, { interrupt: true }); } catch (e) {} }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var st = document.createElement('style');
  st.textContent =
    '.ob{position:fixed;inset:0;z-index:9950;display:grid;place-items:center;padding:16px;font-family:var(--h-font);color:var(--h-ink);direction:rtl;' +
      'background:radial-gradient(60% 60% at 80% 10%,rgba(255,46,147,.45),transparent 70%),linear-gradient(170deg,#1d0b4a,#3a1177 55%,#6a1b8f)}' +
    '.ob::before{content:"";position:absolute;left:50%;top:50%;width:220vmax;height:220vmax;margin:-110vmax 0 0 -110vmax;background:repeating-conic-gradient(rgba(255,201,60,.08) 0 3deg,transparent 3deg 10deg);animation:h-spin 60s linear infinite;pointer-events:none}' +
    '.ob-card{position:relative;width:min(96vw,1000px);max-height:94vh;overflow:auto;display:grid;grid-template-columns:minmax(200px,.8fr) 1.4fr;gap:20px;align-items:center;padding:22px 26px}' +
    '.ob-hero{border:4px solid var(--h-ink);border-radius:28px;background:radial-gradient(circle at 50% 40%,#4a1c8f,#1d0b4a);padding:10px;box-shadow:inset 0 0 40px rgba(255,46,147,.35)}' +
    '.ob-hero svg{width:100%;height:auto;display:block;max-height:58vh;animation:h-float 2.4s ease-in-out infinite alternate}' +
    '.ob-steps{display:flex;gap:6px;margin-bottom:10px}.ob-steps i{flex:1;height:8px;border-radius:999px;background:#e7def5}.ob-steps i.on{background:linear-gradient(90deg,#ff7ec2,#ff2e93)}' +
    '.ob h2{font:900 clamp(26px,3.6vw,42px)/1.1 var(--h-font);margin:6px 0 4px}.ob p{font:700 clamp(15px,1.9vw,20px)/1.4 var(--h-font);color:var(--h-text-soft);margin:0 0 12px}' +
    '.ob-name{width:100%;font:900 clamp(30px,4.4vw,52px)/1.2 var(--h-font);padding:12px 18px;border:4px solid var(--h-ink);border-radius:22px;background:#fff;color:var(--h-ink);text-align:center;box-shadow:inset 0 3px 0 rgba(27,16,54,.08);user-select:text;-webkit-user-select:text}' +
    '.ob-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:8px 0 14px}.ob-row b{min-width:92px;font:900 18px/1 var(--h-font)}' +
    '.ob-dot{width:52px;height:52px;border:4px solid var(--h-ink);border-radius:50%;cursor:pointer;box-shadow:0 4px 0 var(--h-ink);transition:transform .14s var(--h-spring)}' +
    '.ob-dot.on{transform:scale(1.18);box-shadow:0 0 0 4px #fff,0 0 0 7px var(--h-magenta)}' +
    '.ob-style{display:grid;justify-items:center;gap:2px;width:92px;padding:4px;border:3px solid var(--h-ink);border-radius:16px;background:#fff;box-shadow:0 3px 0 var(--h-ink);cursor:pointer;font:800 14px/1.1 var(--h-font)}' +
    '.ob-style .th{width:70px;height:62px;overflow:hidden;border-radius:10px;background:radial-gradient(circle at 50% 40%,#4a1c8f,#1d0b4a)}.ob-style .th svg{width:100%;height:auto;margin-top:-2px;transform:scale(1.7);transform-origin:50% 12%}' +
    '.ob-style.on{background:linear-gradient(180deg,#fff3b0,#ffc93c);box-shadow:0 3px 0 var(--h-ink),0 0 0 4px var(--h-magenta)}' +
    '.ob-age{display:grid;grid-template-columns:1fr 1fr;gap:14px}.ob-age button{padding:22px 10px;border:4px solid var(--h-ink);border-radius:24px;background:#fff;box-shadow:0 5px 0 var(--h-ink);cursor:pointer;font:900 clamp(22px,3vw,32px)/1.2 var(--h-font)}' +
    '.ob-age button small{display:block;font:700 15px/1.3 var(--h-font);color:var(--h-text-soft)}.ob-age button.on{background:linear-gradient(180deg,#b6ffdc,#3ff2b0)}' +
    '.ob-bday{display:flex;gap:12px}.ob-bday select{flex:1;font:900 24px/1 var(--h-font);padding:12px;border:4px solid var(--h-ink);border-radius:18px;background:#fff;color:var(--h-ink)}' +
    '.ob-nav{display:flex;gap:12px;justify-content:space-between;margin-top:16px}.ob-nav .h-btn{min-width:140px}' +
    '.ob-who{position:relative;width:min(96vw,1000px);text-align:center;padding:24px}' +
    '.ob-who h1{font:900 clamp(34px,5vw,60px)/1 var(--h-font);color:#fff;-webkit-text-stroke:4px var(--h-ink);paint-order:stroke fill;text-shadow:4px 5px 0 var(--h-magenta);margin-bottom:18px}' +
    '.ob-kids{display:flex;gap:18px;justify-content:center;flex-wrap:wrap}' +
    '.ob-kid{width:min(28vw,220px);padding:12px;border:5px solid var(--h-ink);border-radius:28px;background:var(--h-paper);box-shadow:0 7px 0 var(--h-ink);cursor:pointer;transition:transform .16s var(--h-spring);font:900 clamp(22px,2.8vw,32px)/1.1 var(--h-font);color:var(--h-ink)}' +
    '.ob-kid:active{transform:scale(.95)}.ob-kid .th{border-radius:20px;background:radial-gradient(circle at 50% 40%,#4a1c8f,#1d0b4a);margin-bottom:8px}.ob-kid .th svg{width:100%;height:auto;display:block}' +
    '@media (max-width:760px),(orientation:portrait){.ob-card{grid-template-columns:1fr}.ob-hero svg{max-height:26vh}}';
  document.head.appendChild(st);

  /* ---------- פרק 1–3 — האשף ---------- */
  /* start(opts) — opts.editId: עריכת ילדה קיימת; opts.onDone: אחרי שמירה (ברירת מחדל: הפעלה וטעינה מחדש) */
  function start(opts) {
    opts = opts || {};
    var edit = opts.editId ? Profile.list.filter(function (p) { return p.id === opts.editId; })[0] : null;
    var D = edit ? JSON.parse(JSON.stringify(edit)) : { name: '', look: { skin: 0, hair: 0, style: 'pony' }, color: COLORS[0], grade: 'young', bday: null };
    /* השם מוכן מראש רק במכשיר המקורי — שכבר יש בו התקדמות שמורה מלפני הפרופילים (כוכבים / דרקון / אקדמיה).
       מכשיר חדש של חברים נפתח עם שדה ריק, כדי שכל ילדה תכתוב את השם שלה */
    var legacy = false; try { legacy = Object.keys(localStorage).some(function (k) { return /^ella(-progress|-pet|_cart_save|-shop|-stars|-academy)/.test(k); }); } catch (e) {}
    if (!edit && !Profile.has && !opts.fresh && legacy) D.name = 'אלה';
    var step = 0, STEPS = edit ? ['name', 'look', 'color', 'bday', 'done'] : ['name', 'look', 'color', 'age', 'bday', 'done'];
    var ov = el('div', 'ob'), card = el('div', 'ob-card h-panel');
    ov.dataset.noname = '1';                 // השם שמוקלד כאן לא יוחלף בשם הילדה הפעילה
    ov.appendChild(card); document.body.appendChild(ov);

    function outfit() { return { cape: 'cape_custom', suit: 'suit_custom', mask: 'mask_classic', emblem: 'emb_heart', aura: step === STEPS.length - 1 ? 'aura_sparkle' : 'aura_none', acc: 'acc_none', hero: 'ella', colors: { cape: D.color, suit: HeroAvatar.shade(D.color, 30) } }; }
    function heroSvg(look) { return HeroAvatar.svg(outfit(), { look: look || D.look }); }
    function nav(nextLabel, canBack) {
      return '<div class="ob-nav">' + (canBack ? '<button type="button" class="h-btn violet" data-go="back">→ אחורה</button>' : '<span></span>') +
        '<button type="button" class="h-btn gold" data-go="next">' + nextLabel + '</button></div>';
    }
    function render() {
      var s = STEPS[step], nm = esc(D.name || 'הגיבורה');
      var html = '<div class="ob-hero">' + heroSvg() + '</div><div><div class="ob-steps">' + STEPS.map(function (_, i) { return '<i class="' + (i <= step ? 'on' : '') + '"></i>'; }).join('') + '</div>';
      if (s === 'name') {
        html += '<span class="h-modal-kicker">' + (edit ? '✏️ עריכה' : '🦸‍♀️ גיבורה חדשה!') + '</span><h2>איך קוראים לגיבורה?</h2><p>כותבים את השם — וכל העולם יהיה שלה: המסכים, הסיפורים והקול.</p>' +
          '<input class="ob-name" id="obName" maxlength="14" autocomplete="off" enterkeyhint="done" placeholder="השם שלי" value="' + esc(D.name) + '">' + nav('המשך ←', false);
      } else if (s === 'look') {
        html += '<h2>ככה נראית ' + nm + '!</h2><p>בוחרים צבע עור, תסרוקת וצבע שיער.</p>' +
          '<div class="ob-row"><b>עור</b>' + Profile.SKINS.map(function (c, i) { return '<button type="button" class="ob-dot' + (D.look.skin === i ? ' on' : '') + '" data-skin="' + i + '" style="background:' + c[0] + '" aria-label="גוון עור"></button>'; }).join('') + '</div>' +
          '<div class="ob-row"><b>שיער</b>' + Profile.HAIRS.map(function (c, i) { return '<button type="button" class="ob-dot' + (D.look.hair === i ? ' on' : '') + '" data-hair="' + i + '" style="background:' + c[0] + '" aria-label="' + c[2] + '"></button>'; }).join('') + '</div>' +
          '<div class="ob-row"><b>תסרוקת</b>' + Profile.STYLES.map(function (x) {
            return '<button type="button" class="ob-style' + (D.look.style === x[0] ? ' on' : '') + '" data-style="' + x[0] + '"><span class="th">' + heroSvg(Object.assign({}, D.look, { style: x[0] })) + '</span>' + x[1] + '</button>';
          }).join('') + '</div>' + nav('המשך ←', true);
      } else if (s === 'color') {
        html += '<h2>מה הצבע האהוב על ' + nm + '?</h2><p>זה יהיה הצבע של הגלימה והחליפה (אפשר לשנות אחר כך בארון התחפושות).</p>' +
          '<div class="ob-row">' + COLORS.map(function (c) { return '<button type="button" class="ob-dot' + (D.color === c ? ' on' : '') + '" data-color="' + c + '" style="background:' + c + ';width:64px;height:64px"></button>'; }).join('') + '</div>' + nav('המשך ←', true);
      } else if (s === 'age') {
        html += '<h2>בת כמה ' + nm + '?</h2><p>כך נתאים את הלמידה באקדמיה (אפשר להחליף בכל רגע בכפתור הרמה).</p>' +
          '<div class="ob-age"><button type="button" data-grade="young" class="' + (D.grade === 'young' ? 'on' : '') + '">🌱 5–6<small>גן חובה · כיתה א׳</small></button><button type="button" data-grade="big" class="' + (D.grade === 'big' ? 'on' : '') + '">🚀 7–8<small>כיתה ב׳ · כיתה ג׳</small></button></div>' + nav('המשך ←', true);
      } else if (s === 'bday') {
        var b = D.bday || {};
        html += '<h2>מתי יום ההולדת? 🎂</h2><p>ביום ההולדת תחכה ל' + nm + ' הפתעה מיוחדת. אפשר גם לדלג.</p>' +
          '<div class="ob-bday"><select id="obDay"><option value="">יום</option>' + Array.from({ length: 31 }, function (_, i) { return '<option value="' + (i + 1) + '"' + (b.d === i + 1 ? ' selected' : '') + '>' + (i + 1) + '</option>'; }).join('') + '</select>' +
          '<select id="obMonth"><option value="">חודש</option>' + MONTHS.map(function (m, i) { return '<option value="' + (i + 1) + '"' + (b.m === i + 1 ? ' selected' : '') + '>' + m + '</option>'; }).join('') + '</select></div>' + nav(D.bday ? 'המשך ←' : 'המשך / דלגי ←', true);
      } else {
        html += '<span class="h-modal-kicker">✨ מוכנה!</span><h2>ברוכה הבאה, ' + nm + '!</h2><p>' + nm + ' היא גיבורת-העל החדשה של העולם. כל תשובה נותנת אנרגיה, כל ציור מקשט את העולם — ויש גם ביצת קסם שמחכה לה…</p>' + nav(edit ? 'שמירה ✓' : 'יוצאות לדרך! 🚀', true);
      }
      card.innerHTML = html + '</div>';
      bind(s);
    }
    function bind(s) {
      card.querySelectorAll('[data-go]').forEach(function (b) { b.onclick = function () { if (b.dataset.go === 'back') { step = Math.max(0, step - 1); snd('bubble'); render(); } else next(); }; });
      if (s === 'name') {
        var inp = card.querySelector('#obName');
        setTimeout(function () { try { inp.focus(); } catch (e) {} }, 200);
        inp.oninput = function () { D.name = inp.value; };
        inp.onkeydown = function (e) { if (e.key === 'Enter') next(); };
      }
      card.querySelectorAll('[data-skin]').forEach(function (b) { b.onclick = function () { D.look.skin = +b.dataset.skin; snd('bubble'); render(); }; });
      card.querySelectorAll('[data-hair]').forEach(function (b) { b.onclick = function () { D.look.hair = +b.dataset.hair; snd('bubble'); render(); }; });
      card.querySelectorAll('[data-style]').forEach(function (b) { b.onclick = function () { D.look.style = b.dataset.style; snd('sparkle'); render(); }; });
      card.querySelectorAll('[data-color]').forEach(function (b) { b.onclick = function () { D.color = b.dataset.color; snd('sparkle'); render(); }; });
      card.querySelectorAll('[data-grade]').forEach(function (b) { b.onclick = function () { D.grade = b.dataset.grade; snd('bubble'); render(); }; });
      var dd = card.querySelector('#obDay'), mm = card.querySelector('#obMonth');
      if (dd) { var up = function () { D.bday = dd.value && mm.value ? { d: +dd.value, m: +mm.value } : null; }; dd.onchange = up; mm.onchange = up; }
    }
    function next() {
      var s = STEPS[step];
      if (s === 'name') {
        D.name = (D.name || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();
        if (!D.name) { snd('sad'); say('כותבים את השם של הגיבורה'); var i = card.querySelector('#obName'); if (i) i.focus(); return; }
        say('שלום ' + D.name + '! בואי נבנה את הגיבורה שלך.');
      }
      if (s === 'bday' && step < STEPS.length - 1) { /* דילוג מותר */ }
      if (step < STEPS.length - 1) {
        step++; snd('pop'); render();
        if (STEPS[step] === 'done') { say('ברוכה הבאה, ' + D.name + '! את גיבורת-העל החדשה!'); try { if (window.HeroRewards) HeroRewards.confetti(); } catch (e) {} }
        return;
      }
      finish();
    }
    function finish() {
      snd('ding');
      if (edit) {
        Profile.update(edit.id, { name: D.name, look: D.look, color: D.color, bday: D.bday });
        if (opts.onDone) opts.onDone(); else location.reload();
        return;
      }
      /* init — יוחל פעם אחת אחרי הטעינה (בתוך השמירות של הילדה החדשה) */
      var p = Profile.create({ name: D.name, look: D.look, color: D.color, grade: D.grade, bday: D.bday, init: { color: D.color, grade: D.grade } });
      try { sessionStorage.removeItem('ella-intro-seen'); } catch (e) {}
      Profile.choose(p.id);
    }
    render();
    return ov;
  }

  /* ---------- פרק 4 — applyInit ---------- */
  function applyInit() {
    var p = Profile.active; if (!p || !p.init) return;
    try {
      if (window.HeroRewards) {
        var o = HeroRewards.state.outfit; o.colors = o.colors || {};
        o.colors.cape = p.init.color; o.colors.suit = HeroAvatar.shade(p.init.color, 30);
        HeroRewards.wear('suit', 'suit_custom'); HeroRewards.wear('cape', 'cape_custom');
      }
      var J = 'ella-learning-journey-v1', j = null;
      try { j = JSON.parse(localStorage.getItem(J)); } catch (e) {}
      j = j || { active: 'numbers', stars: 0, totalCorrect: 0, progress: {}, completed: {}, chap: { young: {}, big: {} } };
      j.grade = p.init.grade === 'big' ? 'big' : 'young';
      localStorage.setItem(J, JSON.stringify(j));
    } catch (e) {}
    Profile.update(p.id, { init: null });
  }

  /* ---------- פרק 5 — מי משחקת היום? ---------- */
  function chooser() {
    var ov = el('div', 'ob'), box = el('div', 'ob-who');
    ov.dataset.noname = '1';
    box.innerHTML = '<h1>מי משחקת היום? 🦸‍♀️</h1><div class="ob-kids">' + Profile.list.map(function (p) {
      var h = Profile.readFor(p.id, 'ella-hero-v1'), o = (h && h.outfit) || { cape: 'cape_custom', suit: 'suit_custom', colors: { cape: p.color, suit: HeroAvatar.shade(p.color || '#ff2e93', 30) } };
      o = Object.assign(HeroAvatar.defaultOutfit(), o);
      return '<button type="button" class="ob-kid" data-id="' + p.id + '"><div class="th">' + HeroAvatar.svg(o, { look: p.look }) + '</div>' + esc(p.name) + '</button>';
    }).join('') + '</div>';
    ov.appendChild(box); document.body.appendChild(ov);
    box.querySelectorAll('.ob-kid').forEach(function (b) { b.onclick = function () { snd('ding'); Profile.choose(+b.dataset.id); }; });
    say('מי משחקת היום?');
    return ov;
  }

  window.Onboarding = { start: start, applyInit: applyInit, chooser: chooser };
})();
