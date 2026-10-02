/* =====================================================================
   shared/learn-fx.js — "אפקטים לימודיים": כרטיסי למידה מונפשים בתוך המשחקים (שלב 16)
   ---------------------------------------------------------------------
   מה הקובץ עושה: נותן לכל משחק (חווה, רכיבה, מכוניות) דרך אחידה להפוך רגע במשחק
   לרגע למידה — בלי לעצור את הכיף. כל קריאה מציגה פאנל קומיקס קטן שנכנס מהצד,
   מקריא בקול (אנגלית → עברית → אנגלית לאט, דרך Voice.teach), ונעלם לבד.

   פרק 1 — סגנון מוזרק: פאנל מילה, תיבת "הידעת?", ספירה, תמרור, זוהר
   פרק 2 — word(en, he, emoji, opts): מילה באנגלית — אימוג'י גדול, המילה ב-LTR, הפירוש בעברית, הקראה
   פרק 3 — fact(title, text, emoji, opts): "הידעת?" — תיבת קריינות צהובה בסגנון קומיקס + הקראה בעברית
   פרק 4 — count(n, opts): ספירה מונפשת 1…n בעברית ובאנגלית (ביצים, קונוסים, מטבעות)
   פרק 5 — sign(kind): תמרור/רמזור מלמד (stop / red / green / crosswalk / seatbelt) — ציור SVG + הסבר
   פרק 6 — praise(): מחמאה אקראית + כוכבים
   פרק 7 — ייצוא: window.LearnFX

   כללים: אין יותר מפאנל אחד מכל סוג בו-זמנית (החדש מחליף את הישן); הכול pointer-events:none
   חוץ מכפתור 🔊 שמאפשר לשמוע שוב. Voice חסר? מציגים טקסט בלבד.
   תקלה נפוצה: הפאנל מסתיר כפתור במשחק? מעבירים אותו למעלה עם opts.pos = 'top' או 'bottom'.
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- פרק 1 — סגנון ---------- */
  var CSS = [
    '#lfx{position:fixed;inset:0;z-index:9550;pointer-events:none;font-family:var(--h-font,"Rubik",system-ui,sans-serif);direction:rtl}',
    /* פאנל מילה: כרטיס נייר עם מסגרת דיו, נכנס מימין, אימוג'י גדול למעלה */
    '.lfx-word{position:absolute;right:max(14px,env(safe-area-inset-right));top:18%;width:min(44vw,330px);padding:14px 16px 12px;border:5px solid var(--h-ink,#101e36);border-radius:22px 6px 22px 22px;background:#fffaf0 radial-gradient(rgba(16,30,54,.08) 1.4px,transparent 1.9px) 0 0/10px 10px;color:var(--h-ink,#101e36);box-shadow:8px 9px 0 var(--h-ink,#101e36),0 0 0 3px #fff inset,0 24px 50px rgba(4,14,30,.4);text-align:center;transform:translateX(130%) rotate(2deg);animation:lfx-in .55s cubic-bezier(.2,1.4,.3,1) forwards,lfx-out .4s ease-in 2.6s forwards;pointer-events:auto}',
    '.lfx-word.bottom{top:auto;bottom:16%}.lfx-word.top{top:max(14px,env(safe-area-inset-top))}',
    '.lfx-word .e{font-size:clamp(54px,7vw,84px);line-height:1;display:block;filter:drop-shadow(0 5px 0 rgba(16,30,54,.35));animation:lfx-bob 1.2s ease-in-out infinite alternate}',
    '.lfx-word .en{display:block;direction:ltr;font:900 clamp(30px,4vw,48px)/1.05 var(--h-font,sans-serif);color:#fff;-webkit-text-stroke:4px var(--h-ink,#101e36);paint-order:stroke fill;text-shadow:3px 4px 0 var(--h-magenta,#ff622e);margin:6px 0 2px;letter-spacing:.5px}',
    '.lfx-word .he{display:block;font:900 clamp(18px,2.3vw,26px)/1.2 var(--h-font,sans-serif);color:var(--h-ink,#101e36)}',
    '.lfx-word .tag{position:absolute;top:-16px;right:14px;padding:3px 12px;border:3px solid var(--h-ink,#101e36);border-radius:999px;background:var(--h-gold,#ffc93c);font:900 13px/1.2 var(--h-font,sans-serif);transform:rotate(-4deg);box-shadow:3px 3px 0 var(--h-ink,#101e36)}',
    '.lfx-say{position:absolute;left:-18px;bottom:-18px;width:54px;height:54px;border:4px solid var(--h-ink,#101e36);border-radius:50%;background:linear-gradient(180deg,#8bb5ff,#3f79e0);font-size:24px;box-shadow:0 4px 0 var(--h-ink,#101e36);cursor:pointer;pointer-events:auto}',
    '@keyframes lfx-in{to{transform:translateX(0) rotate(-1.5deg)}}',
    '@keyframes lfx-out{to{transform:translateX(130%) rotate(4deg);opacity:0}}',
    '@keyframes lfx-bob{to{transform:translateY(-6px) rotate(-6deg)}}',
    /* "הידעת?": תיבת קריינות צהובה בסגנון קומיקס, נכנסת משמאל */
    '.lfx-fact{position:absolute;left:max(96px,env(safe-area-inset-left));bottom:16%;width:min(52vw,460px);padding:12px 16px 12px 18px;border:4px solid var(--h-ink,#101e36);background:var(--h-gold,#ffc93c) radial-gradient(rgba(255,255,255,.3) 1.3px,transparent 1.7px) 0 0/8px 8px;color:var(--h-ink,#101e36);box-shadow:6px 7px 0 var(--h-ink,#101e36),0 20px 40px rgba(4,14,30,.35);transform:translateX(-130%) rotate(-2deg);animation:lfx-fin .5s cubic-bezier(.2,1.3,.3,1) forwards,lfx-fout .4s ease-in var(--life,5s) forwards;display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:center;text-align:right;pointer-events:auto}',
    '.lfx-fact.top{bottom:auto;top:calc(max(14px,env(safe-area-inset-top)) + 80px)}',
    '.lfx-fact .e{font-size:clamp(40px,5vw,60px);line-height:1;filter:drop-shadow(0 4px 0 rgba(16,30,54,.3))}',
    '.lfx-fact b{display:block;font:900 clamp(16px,2vw,22px)/1.2 var(--h-font,sans-serif);color:#fff;-webkit-text-stroke:3px var(--h-ink,#101e36);paint-order:stroke fill;text-shadow:2px 3px 0 var(--h-ink,#101e36);margin-bottom:3px;letter-spacing:.3px}',
    '.lfx-fact span{display:block;font:800 clamp(14px,1.7vw,19px)/1.3 var(--h-font,sans-serif)}',
    '@keyframes lfx-fin{to{transform:translateX(0) rotate(-1deg)}}',
    '@keyframes lfx-fout{to{transform:translateX(-130%) rotate(-4deg);opacity:0}}',
    /* ספירה: ספרה גדולה קופצת במרכז, עם המילה באנגלית מתחת */
    '.lfx-num{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);text-align:center;animation:lfx-num .75s cubic-bezier(.2,1.5,.3,1) forwards}',
    '.lfx-num b{display:block;font:900 clamp(90px,16vw,170px)/1 var(--h-font,sans-serif);color:#fff;-webkit-text-stroke:6px var(--h-ink,#101e36);paint-order:stroke fill;text-shadow:6px 8px 0 var(--h-magenta,#ff622e),10px 14px 0 var(--h-ink,#101e36)}',
    '.lfx-num span{display:inline-block;direction:ltr;padding:4px 16px;border:4px solid var(--h-ink,#101e36);border-radius:999px;background:#fffaf0;font:900 clamp(20px,3vw,34px)/1.2 var(--h-font,sans-serif);color:var(--h-ink,#101e36);box-shadow:4px 4px 0 var(--h-ink,#101e36)}',
    '@keyframes lfx-num{0%{transform:translate(-50%,-50%) scale(.2) rotate(-20deg);opacity:0}40%{transform:translate(-50%,-50%) scale(1.15) rotate(4deg);opacity:1}70%{transform:translate(-50%,-50%) scale(1)}100%{transform:translate(-50%,-80%) scale(1.05);opacity:0}}',
    /* תמרור: SVG גדול במרכז-למעלה + שורת הסבר */
    '.lfx-sign{position:absolute;left:50%;top:10%;transform:translateX(-50%);display:grid;justify-items:center;gap:8px;animation:lfx-sign .6s cubic-bezier(.2,1.4,.3,1) forwards,lfx-signout .4s ease-in var(--life,3.4s) forwards}',
    '.lfx-sign svg{width:clamp(110px,16vw,170px);height:auto;filter:drop-shadow(6px 8px 0 rgba(16,30,54,.9))}',
    '.lfx-sign .t{padding:8px 20px;border:4px solid var(--h-ink,#101e36);border-radius:999px;background:#fffaf0;font:900 clamp(18px,2.6vw,30px)/1.2 var(--h-font,sans-serif);color:var(--h-ink,#101e36);box-shadow:5px 6px 0 var(--h-ink,#101e36);white-space:nowrap}',
    '@keyframes lfx-sign{from{transform:translateX(-50%) scale(.3) rotate(-15deg);opacity:0}to{transform:translateX(-50%) scale(1) rotate(0);opacity:1}}',
    '@keyframes lfx-signout{to{transform:translateX(-50%) translateY(-40px) scale(.8);opacity:0}}',
    '@media (prefers-reduced-motion:reduce){#lfx *{animation-duration:.01s!important}}'
  ].join('\n');
  function css() { if (document.getElementById('lfx-css')) return; var s = document.createElement('style'); s.id = 'lfx-css'; s.textContent = CSS; document.head.appendChild(s); }
  var layer = null;
  function host() { css(); if (!layer || !layer.isConnected) { layer = document.createElement('div'); layer.id = 'lfx'; document.body.appendChild(layer); } return layer; }
  // one(cls) — מוחק פאנל קודם מאותו סוג (רק אחד מכל סוג על המסך)
  function one(cls) { var old = host().querySelector('.' + cls); if (old) old.remove(); }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // say / teach — עטיפות בטוחות למנוע הקול
  function say(t) { try { if (window.Voice && Voice.say) Voice.say(t); } catch (e) {} }
  function teach(en, he, pre) { try { if (window.Voice && Voice.teach) Voice.teach(en, he, { pre: pre, interrupt: false }); else say(he); } catch (e) {} }
  function snd(n) { try { if (window.Sound && Sound[n]) Sound[n](); } catch (e) {} }
  function track(ev) { try { if (window.Progress) Progress.track(ev); } catch (e) {} }

  /* ---------- פרק 2 — מילה באנגלית ---------- */
  // word(en, he, emoji, opts) — opts: pos ('top'|'bottom'), tag (כיתוב קטן, ברירת מחדל "מילה חדשה"), pre (משפט פתיחה), quiet (בלי קול)
  function word(en, he, emoji, opts) {
    opts = opts || {}; one('lfx-word');
    var el = document.createElement('div'); el.className = 'lfx-word' + (opts.pos ? ' ' + opts.pos : '');
    el.innerHTML = '<span class="tag">' + esc(opts.tag || '🇬🇧 מילה חדשה') + '</span><span class="e">' + esc(emoji || '✨') + '</span><span class="en">' + esc(en) + '</span><span class="he">' + esc(he) + '</span><button class="lfx-say" type="button" aria-label="לשמוע שוב">🔊</button>';
    el.querySelector('.lfx-say').addEventListener('click', function (e) { e.stopPropagation(); teach(en, he); });
    host().appendChild(el); setTimeout(function () { el.remove(); }, 3100);
    if (!opts.quiet) teach(en, he, opts.pre); snd('sparkle'); track('learn:word');
    return el;
  }

  /* ---------- פרק 3 — "הידעת?" ---------- */
  // fact(title, text, emoji, opts) — opts: pos ('top'), life (שניות על המסך, ברירת מחדל 5), quiet
  function fact(title, text, emoji, opts) {
    opts = opts || {}; one('lfx-fact');
    var el = document.createElement('div'); el.className = 'lfx-fact' + (opts.pos ? ' ' + opts.pos : ''); var life = opts.life || 5;
    el.style.setProperty('--life', life + 's');
    el.innerHTML = '<span class="e">' + esc(emoji || '💡') + '</span><div><b>' + esc(title || 'הידעת?') + '</b><span>' + esc(text) + '</span></div>';
    el.addEventListener('click', function () { say((title ? title + '. ' : '') + text); });
    host().appendChild(el); setTimeout(function () { el.remove(); }, life * 1000 + 450);
    if (!opts.quiet) say((title ? title + '. ' : '') + text); track('learn:fact');
    return el;
  }

  /* ---------- פרק 4 — ספירה ---------- */
  var EN_NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  var HE_NUM = ['אפס', 'אחת', 'שתיים', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע', 'עשר'];
  // count(n, opts) — ספרה n קופצת במרכז + המילה באנגלית; opts.he=false מבטל הקראה בעברית; opts.what = מה סופרים ("eggs")
  function count(n, opts) {
    opts = opts || {}; one('lfx-num'); n = Math.max(0, Math.min(10, n | 0));
    var el = document.createElement('div'); el.className = 'lfx-num';
    el.innerHTML = '<b>' + n + '</b><span>' + EN_NUM[n] + (opts.what ? ' ' + esc(opts.what) : '') + '</span>';
    host().appendChild(el); setTimeout(function () { el.remove(); }, 800);
    try { if (window.Voice && Voice.read) Voice.read([{ text: HE_NUM[n], lang: 'he-IL' }, { text: EN_NUM[n] + (opts.what ? ' ' + opts.what : ''), lang: 'en-US' }], { interrupt: true }); } catch (e) {}
    snd('pop');
    return el;
  }

  /* ---------- פרק 5 — תמרורים ורמזור ---------- */
  // SIGNS — ציור SVG + הסבר קצר + משפט באנגלית לכל תמרור
  var SIGNS = {
    stop: { svg: '<svg viewBox="0 0 120 120"><polygon points="35,4 85,4 116,35 116,85 85,116 35,116 4,85 4,35" fill="#e0162b" stroke="#101e36" stroke-width="6"/><polygon points="38,12 82,12 108,38 108,82 82,108 38,108 12,82 12,38" fill="none" stroke="#fff" stroke-width="4"/><text x="60" y="74" text-anchor="middle" font-family="Rubik,Arial" font-weight="900" font-size="34" fill="#fff">STOP</text></svg>', he: 'עצור! מסתכלים ימינה ושמאלה', en: 'Stop!' },
    red: { svg: '<svg viewBox="0 0 70 160"><rect x="5" y="5" width="60" height="150" rx="14" fill="#1a1a2e" stroke="#101e36" stroke-width="6"/><circle cx="35" cy="35" r="20" fill="#ff2e3b"/><circle cx="35" cy="80" r="20" fill="#3a3a1a"/><circle cx="35" cy="125" r="20" fill="#1a3a2a"/><circle cx="35" cy="35" r="26" fill="none" stroke="#ff2e3b" stroke-width="3" opacity=".5"/></svg>', he: 'אדום = עוצרים ומחכים', en: 'Red light! Stop!' },
    yellow: { svg: '<svg viewBox="0 0 70 160"><rect x="5" y="5" width="60" height="150" rx="14" fill="#1a1a2e" stroke="#101e36" stroke-width="6"/><circle cx="35" cy="35" r="20" fill="#3a1a1a"/><circle cx="35" cy="80" r="20" fill="#ffd93c"/><circle cx="35" cy="125" r="20" fill="#1a3a2a"/></svg>', he: 'צהוב = מתכוננים', en: 'Yellow light! Get ready!' },
    green: { svg: '<svg viewBox="0 0 70 160"><rect x="5" y="5" width="60" height="150" rx="14" fill="#1a1a2e" stroke="#101e36" stroke-width="6"/><circle cx="35" cy="35" r="20" fill="#3a1a1a"/><circle cx="35" cy="80" r="20" fill="#3a3a1a"/><circle cx="35" cy="125" r="20" fill="#2fe06a"/><circle cx="35" cy="125" r="26" fill="none" stroke="#2fe06a" stroke-width="3" opacity=".5"/></svg>', he: 'ירוק = נוסעים!', en: 'Green light! Go!' },
    crosswalk: { svg: '<svg viewBox="0 0 120 120"><rect x="6" y="6" width="108" height="108" rx="12" fill="#2f6bff" stroke="#101e36" stroke-width="6"/><polygon points="60,10 110,60 60,110 10,60" fill="#fff"/><g fill="#101e36"><rect x="30" y="76" width="60" height="6"/><rect x="36" y="86" width="48" height="6"/><rect x="42" y="96" width="36" height="5"/></g><circle cx="62" cy="36" r="8" fill="#101e36"/><path d="M62 44 L62 66 L54 80 M62 66 L72 80 M50 56 L62 50 L76 58" stroke="#101e36" stroke-width="6" fill="none" stroke-linecap="round"/></svg>', he: 'מעבר חצייה — מאטים, הולכי רגל קודמים', en: 'Crosswalk! Slow down!' },
    school: { svg: '<svg viewBox="0 0 120 120"><polygon points="60,6 114,110 6,110" fill="#ffd93c" stroke="#101e36" stroke-width="6"/><circle cx="48" cy="58" r="7" fill="#101e36"/><circle cx="72" cy="54" r="7" fill="#101e36"/><path d="M48 66 L48 92 M72 62 L72 92 M40 76 L56 76 M64 72 L80 72" stroke="#101e36" stroke-width="6" stroke-linecap="round"/></svg>', he: 'ילדים בדרך — נוסעים לאט לאט', en: 'Children! Slow!' },
    fuel: { svg: '<svg viewBox="0 0 120 120"><rect x="22" y="14" width="56" height="96" rx="10" fill="#2fb85a" stroke="#101e36" stroke-width="6"/><rect x="32" y="26" width="36" height="28" rx="5" fill="#fff" stroke="#101e36" stroke-width="4"/><path d="M78 40 L94 52 L94 96 a8 8 0 0 1 -16 0 L78 96" fill="none" stroke="#101e36" stroke-width="6" stroke-linecap="round"/><text x="50" y="92" text-anchor="middle" font-family="Rubik,Arial" font-weight="900" font-size="22" fill="#fff">⛽</text></svg>', he: 'תחנת דלק — ממלאים ונוסעים', en: 'Gas station!' }
  };
  // sign(kind, opts) — מציג תמרור עם ההסבר; opts.quiet מבטל קול, opts.life משך בשניות
  function sign(kind, opts) {
    opts = opts || {}; var s = SIGNS[kind]; if (!s) return null; one('lfx-sign');
    var el = document.createElement('div'); el.className = 'lfx-sign'; el.style.setProperty('--life', (opts.life || 3.4) + 's');
    el.innerHTML = s.svg + '<span class="t">' + esc(s.he) + '</span>';
    host().appendChild(el); setTimeout(function () { el.remove(); }, (opts.life || 3.4) * 1000 + 450);
    if (!opts.quiet) teach(s.en, s.he); snd('ding'); track('learn:sign');
    return el;
  }

  /* ---------- פרק 6 — מחמאה ---------- */
  var PRAISE = ['כל הכבוד!', 'מעולה!', 'וואו, איזה יופי!', 'בדיוק ככה!', 'גיבורים אמיתיים!', 'למדתם משהו חדש!'];
  function praise() { var p = PRAISE[(Math.random() * PRAISE.length) | 0]; say(p); try { if (window.TapFX) TapFX.word(innerWidth / 2, innerHeight * .3, p, true); } catch (e) {} return p; }

  /* ---------- פרק 7 — ייצוא ---------- */
  window.LearnFX = { word: word, fact: fact, count: count, sign: sign, praise: praise, SIGNS: Object.keys(SIGNS), EN_NUM: EN_NUM, HE_NUM: HE_NUM };
})();
