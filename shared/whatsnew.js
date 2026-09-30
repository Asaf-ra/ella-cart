/* =====================================================================
   shared/whatsnew.js — "✨ מה חדש" + תג גרסה במסך הבית
   ---------------------------------------------------------------------
   פרק 1 — הגדרות: מספר גרסה, מפתח שמירה ורשימת החידושים
   פרק 2 — סגנון: CSS מוזרק (כרטיס זכוכית, קונפטי, אריחים קופצים, ברק)
   פרק 3 — בניית החלון: כותרת, אריחים, כפתורים, קונפטי
   פרק 4 — תג הגרסה הקבוע (לחיצה פותחת שוב את "מה חדש")
   פרק 5 — מתי מציגים: פעם אחת לכל גרסה, רק אחרי הפתיח/אשף ההרשמה
   ---------------------------------------------------------------------
   תקלה נפוצה: החלון לא עולה? בדקו שהמפתח ella-seen-version לא שווה
   כבר ל-APP_VERSION (ב-DevTools ← Application ← Local Storage).
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- פרק 1 — הגדרות ---------- */
  // APP_VERSION — מספר הגרסה שמוצג בתג; שינוי שלו = החלון יעלה שוב פעם אחת
  var APP_VERSION = '5.0';
  // KEY — היכן נשמר "איזו גרסה כבר ראינו" (לכל ילדה בנפרד, דרך Profile)
  var KEY = 'ella-seen-version';
  // TITLE / SUB — כותרת החלון ותת-כותרת
  var TITLE = 'עדכון ענק! גרסה ' + APP_VERSION;
  var SUB = 'מה חדש אצל אלה?';
  // CTA — הכפתור הראשי: לאן הוא מוביל ומה כתוב עליו
  var CTA = { go: './farm.html', text: '🏡 יאללה לחווה!' };
  // ITEMS — אריחי החידושים: [אימוג'י, כותרת, תיאור, קישור, צבע1, צבע2]
  var ITEMS = [
    ['🏡', 'החווה של אלה', 'כלבלב, חתולה, תרנגולות, פרה, כבשה, ברווזים וארנב — הכול חי ומגיב!', './farm.html', '#ffb3d9', '#ff4fa0'],
    ['🌙', 'יום ולילה אמיתיים', 'השמש זזה לפי השעון, כוכבים בלילה, גשם וקשת בענן', './farm.html', '#9ad8ff', '#4a6cff'],
    ['🥚', 'ביצת זהב', 'מחזיקים חזק — ואפרוח חדש בוקע!', './farm.html', '#ffe98a', '#ffae1c'],
    ['🏇', 'רכיבה על סוסים', 'קפיצות, טריקים ומדליות', './ride.html', '#9df08a', '#1e9a54'],
    ['🎨', 'סטודיו ציור', '118 דפים, 18 מכחולים ומדבקות', './coloring.html', '#d4b3ff', '#8a4bff'],
    ['🛒', 'שוק וקישוטים', 'מוכרים ביצים, חלב וגבינה — וקונים טחנת רוח!', './farm.html', '#ffc7a8', '#ff6a3d']
  ];

  /* ---------- פרק 2 — סגנון ---------- */
  var CSS = [
    '.wn-ov{position:fixed;inset:0;z-index:9500;display:grid;place-items:center;padding:16px;background:radial-gradient(ellipse at 50% 30%,rgba(120,60,255,.55),rgba(10,4,32,.88) 70%);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);animation:wn-fade .35s ease both;overflow:hidden}',
    '.wn-ov.out{animation:wn-fade .3s ease reverse both;pointer-events:none}',
    '.wn-rays{position:absolute;left:50%;top:40%;width:240vmax;height:240vmax;margin:-120vmax 0 0 -120vmax;background:repeating-conic-gradient(rgba(255,255,255,.07) 0 8deg,transparent 8deg 18deg);animation:wn-spin 40s linear infinite;pointer-events:none}',
    '.wn-card{position:relative;width:min(760px,100%);max-height:calc(100vh - 32px);overflow:auto;border-radius:34px;padding:26px 24px 22px;background:linear-gradient(160deg,#fff 0%,#fff6fb 60%,#f3ecff 100%);border:5px solid var(--h-ink,#1a1033);box-shadow:0 10px 0 var(--h-ink,#1a1033),0 30px 80px rgba(0,0,0,.45);color:var(--h-ink,#1a1033);text-align:center;animation:wn-pop .7s cubic-bezier(.2,1.6,.4,1) both}',
    '.wn-card::before{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.9) 45%,transparent 60%);background-size:250% 100%;animation:wn-shine 3.2s 1s ease-in-out infinite;pointer-events:none}',
    '.wn-ver{display:inline-block;padding:6px 16px;border-radius:999px;background:linear-gradient(90deg,#ff4fa0,#8a4bff,#3dc6ff,#ff4fa0);background-size:300% 100%;animation:wn-grad 4s linear infinite;color:#fff;font-weight:900;font-size:15px;letter-spacing:.5px;border:3px solid var(--h-ink,#1a1033)}',
    '.wn-card h1{margin:10px 0 2px;font-size:clamp(30px,5vw,46px);font-weight:900;color:#fff;-webkit-text-stroke:4px var(--h-ink,#1a1033);paint-order:stroke fill;text-shadow:4px 5px 0 var(--h-magenta,#ff2e93)}',
    '.wn-card .wn-sub{font-size:19px;font-weight:800;opacity:.75;margin-bottom:14px}',
    '.wn-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;text-align:right}',
    '@media (max-width:640px){.wn-grid{grid-template-columns:repeat(2,1fr)}}',
    '.wn-it{position:relative;border:3px solid var(--h-ink,#1a1033);border-radius:22px;padding:12px 12px 10px;background:linear-gradient(150deg,var(--a),var(--b));color:#fff;box-shadow:0 5px 0 var(--h-ink,#1a1033);cursor:pointer;font-family:inherit;text-align:right;opacity:0;animation:wn-rise .55s cubic-bezier(.2,1.5,.4,1) both;transition:transform .15s}',
    '.wn-it:active{transform:translateY(4px);box-shadow:0 1px 0 var(--h-ink,#1a1033)}',
    '.wn-it .e{font-size:40px;line-height:1;display:block;filter:drop-shadow(0 3px 0 rgba(0,0,0,.25));animation:wn-bob 2.4s ease-in-out infinite}',
    '.wn-it b{display:block;font-size:18px;font-weight:900;margin-top:6px;-webkit-text-stroke:3px var(--h-ink,#1a1033);paint-order:stroke fill}',
    '.wn-it small{display:block;font-size:13.5px;font-weight:700;line-height:1.3;margin-top:3px;text-shadow:0 1px 2px rgba(0,0,0,.35)}',
    '.wn-it.new::after{content:"חדש!";position:absolute;top:-10px;left:-8px;background:#ffe14a;color:var(--h-ink,#1a1033);border:3px solid var(--h-ink,#1a1033);border-radius:12px;padding:1px 8px;font-size:13px;font-weight:900;transform:rotate(-10deg);animation:wn-wig 1.6s ease-in-out infinite}',
    '.wn-btns{display:flex;gap:12px;justify-content:center;margin-top:18px;flex-wrap:wrap}',
    '.wn-btn{font-family:inherit;font-size:21px;font-weight:900;padding:13px 26px;border-radius:999px;border:4px solid var(--h-ink,#1a1033);box-shadow:0 6px 0 var(--h-ink,#1a1033);cursor:pointer;color:var(--h-ink,#1a1033);background:#fff}',
    '.wn-btn.go{color:#fff;background:linear-gradient(90deg,#ff4fa0,#ff8a3d);-webkit-text-stroke:0;animation:wn-pulse 1.4s ease-in-out infinite}',
    '.wn-btn:active{transform:translateY(5px);box-shadow:0 1px 0 var(--h-ink,#1a1033)}',
    '.wn-cf{position:absolute;top:-20px;width:12px;height:18px;border-radius:3px;pointer-events:none;animation:wn-fall linear forwards}',
    '.wn-badge{position:fixed;left:14px;bottom:14px;z-index:60;font-family:inherit;font-weight:900;font-size:14px;padding:6px 13px;border-radius:999px;border:3px solid var(--h-ink,#1a1033);box-shadow:0 4px 0 var(--h-ink,#1a1033);color:#fff;cursor:pointer;background:linear-gradient(90deg,#ff4fa0,#8a4bff,#3dc6ff,#ff4fa0);background-size:300% 100%;animation:wn-grad 5s linear infinite}',
    '.wn-badge .dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:#ffe14a;margin-inline-start:6px;box-shadow:0 0 0 0 rgba(255,225,74,.8);animation:wn-ping 1.6s infinite}',
    '@keyframes wn-fade{from{opacity:0}to{opacity:1}}',
    '@keyframes wn-spin{to{transform:rotate(360deg)}}',
    '@keyframes wn-pop{0%{transform:scale(.4) rotate(-6deg);opacity:0}100%{transform:none;opacity:1}}',
    '@keyframes wn-rise{0%{transform:translateY(30px) scale(.8);opacity:0}100%{transform:none;opacity:1}}',
    '@keyframes wn-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px) rotate(-4deg)}}',
    '@keyframes wn-wig{0%,100%{transform:rotate(-10deg)}50%{transform:rotate(6deg) scale(1.08)}}',
    '@keyframes wn-shine{0%{background-position:150% 0}60%,100%{background-position:-60% 0}}',
    '@keyframes wn-grad{to{background-position:300% 0}}',
    '@keyframes wn-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}',
    '@keyframes wn-fall{to{transform:translateY(110vh) rotate(720deg)}}',
    '@keyframes wn-ping{0%{box-shadow:0 0 0 0 rgba(255,225,74,.8)}80%,100%{box-shadow:0 0 0 10px rgba(255,225,74,0)}}',
    '@media (prefers-reduced-motion:reduce){.wn-ov *,.wn-badge{animation-duration:.01s!important;animation-iteration-count:1!important}}'
  ].join('\n');
  function injectCss() {
    if (document.getElementById('wn-css')) return;
    var st = document.createElement('style'); st.id = 'wn-css'; st.textContent = CSS; document.head.appendChild(st);
  }

  /* ---------- פרק 3 — בניית החלון ---------- */
  // fix — מחליף "אלה" בשם הילדה הפעילה (Profile.fix), אם קיים
  function fix(t) { return window.Profile && Profile.fix ? Profile.fix(t) : t; }
  // confetti — מפזר 70 פיסות צבעוניות שנופלות ומסתובבות
  function confetti(host) {
    var cols = ['#ff4fa0', '#ffe14a', '#3dc6ff', '#8a4bff', '#6be07a', '#ff8a3d'];
    for (var i = 0; i < 70; i++) {
      var s = document.createElement('i'); s.className = 'wn-cf';
      s.style.left = (Math.random() * 100) + '%';
      s.style.background = cols[i % cols.length];
      s.style.animationDuration = (2.2 + Math.random() * 2.2) + 's';
      s.style.animationDelay = (Math.random() * .9) + 's';
      s.style.transform = 'rotate(' + (Math.random() * 360) + 'deg)';
      host.appendChild(s);
    }
  }
  // open — בונה ומציג את החלון; close מסמן את הגרסה כ"נראתה"
  function open() {
    if (document.querySelector('.wn-ov')) return;
    injectCss();
    var ov = document.createElement('div'); ov.className = 'wn-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'מה חדש');
    ov.innerHTML = '<div class="wn-rays"></div><div class="wn-card"><span class="wn-ver">✨ גרסה ' + APP_VERSION + '</span>' +
      '<h1>' + fix(TITLE) + '</h1><div class="wn-sub">' + fix(SUB) + '</div><div class="wn-grid">' +
      ITEMS.map(function (it, i) {
        return '<button type="button" class="wn-it' + (i < 3 ? ' new' : '') + '" data-go="' + it[3] + '" style="--a:' + it[4] + ';--b:' + it[5] + ';animation-delay:' + (.25 + i * .09) + 's"><span class="e" style="animation-delay:' + (i * .3) + 's">' + it[0] + '</span><b>' + fix(it[1]) + '</b><small>' + fix(it[2]) + '</small></button>';
      }).join('') + '</div><div class="wn-btns"><button type="button" class="wn-btn go" data-go="' + CTA.go + '">' + CTA.text + '</button><button type="button" class="wn-btn" data-close="1">אחר כך</button></div></div>';
    document.body.appendChild(ov);
    confetti(ov);
    try { if (window.Sound && Sound.happy) Sound.happy(); } catch (e) {}
    try { if (window.Voice) Voice.say(fix('עדכון חדש! בואי לראות מה חדש, יש חווה עם חיות!')); } catch (e) {}
    function close(go) {
      try { localStorage.setItem(KEY, APP_VERSION); } catch (e) {}
      var b = document.querySelector('.wn-badge .dot'); if (b) b.remove();
      ov.classList.add('out'); setTimeout(function () { ov.remove(); if (go) location.href = go; }, 280);
    }
    ov.addEventListener('click', function (e) {
      var t = e.target.closest('[data-go],[data-close]');
      if (t) close(t.dataset.go || null); else if (e.target === ov) close(null);
    });
  }

  /* ---------- פרק 4 — תג הגרסה ---------- */
  function badge(fresh) {
    injectCss();
    var b = document.createElement('button'); b.type = 'button'; b.className = 'wn-badge';
    b.innerHTML = '✨ v' + APP_VERSION + (fresh ? '<span class="dot"></span>' : '');
    b.setAttribute('aria-label', 'מה חדש בגרסה ' + APP_VERSION);
    b.addEventListener('click', open);
    document.body.appendChild(b);
  }

  /* ---------- פרק 5 — מתי מציגים ---------- */
  // מחכים שהפתיח (#intro) ואשף ההרשמה (.ob) ייסגרו, ואז מציגים פעם אחת
  function seen() { try { return localStorage.getItem(KEY) === APP_VERSION; } catch (e) { return true; } }
  function busy() { return document.getElementById('intro') || document.querySelector('.ob'); }
  function boot() {
    var fresh = !seen(); badge(fresh);
    if (!fresh) return;
    var tries = 0;
    (function wait() {
      if (busy()) { if (++tries < 400) setTimeout(wait, 700); return; }
      setTimeout(function () { if (!busy()) open(); else wait(); }, 900);
    })();
  }
  window.WhatsNew = { open: open, version: APP_VERSION };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
