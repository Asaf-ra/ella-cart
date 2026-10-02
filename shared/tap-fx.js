/* =====================================================================
   shared/tap-fx.js — "המסך מגיב": תגובות קומיקס מצחיקות לכל לחיצה (שלב 16)
   ---------------------------------------------------------------------
   מה הקובץ עושה: נטען בכל דף, ומאזין לכל נגיעה במסך. כל לחיצה מקבלת תגובה בסגנון
   מארוול: טבעת הלם, רסיסי כוכבים, ומילת SFX ("POW!", "ZAP!", "בום!"). לחיצות מהירות
   ברצף בונות קומבו ("KA-POW ×5" + רעידת מסך + קונפטי). אחת לכמה לחיצות קופצת דמות
   מצחיקה מתחתית המסך ואומרת משפט (בקול). לחיצה ארוכה טוענת "אנרגיה" ומשחררת ברק.

   פרק 1 — הגדרות: מילים, דמויות, משפטים מצחיקים, קצב מקסימלי
   פרק 2 — סגנון מוזרק (CSS של הטבעת, הרסיסים, המילה, הדמות, הברק, רעידת המסך)
   פרק 3 — צלילים מצחיקים ב-WebAudio (בוינג, שריקת-שקופית, פיפ, זאפ) — בלי קבצים
   פרק 4 — האפקטים: ring / shards / word / surprise / zap / shake / confetti
   פרק 5 — האזנה למגע: pointerdown/up בכל המסמך, מצבי עבודה (off / light / full), קומבו, לחיצה ארוכה
   פרק 6 — "כניסת גיבור": קווי מהירות בטעינת הדף (.ms-lines מ-marvel-skin.css)
   פרק 7 — ייצוא: window.TapFX = { burst, surprise, zap, mode, set }

   מצבי עבודה (body[data-tapfx]): "off" = שקט לגמרי · "light" = טבעת קטנה בלבד (בזמן משחק
   על קנבס, כדי לא להסתיר) · ברירת מחדל = הכול. דף משחק יכול להחליף מצב בזמן ריצה:
   TapFX.set('light') בתחילת סבב ו-TapFX.set('full') במסך הסיום.

   ביצועים: עד 14 אלמנטים פעילים בו-זמנית, מחזור DOM (pool), ואפס עבודה כשאין נגיעה.
   תקלה נפוצה: אין קול? הקול נפתח רק אחרי מגע ראשון (מדיניות iOS) — זה צפוי בטעינה.
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- פרק 1 — הגדרות ---------- */
  // WORDS — מילות SFX שמופיעות על לחיצה רגילה (באנגלית ובעברית, לסירוגין אקראי)
  var WORDS = ['POW!', 'BAM!', 'ZAP!', 'WHAM!', 'BOOM!', 'ZOOM!', 'WOW!', 'KAPOW!', 'בום!', 'יש!', 'וואו!', 'טראח!', 'פאו!'];
  // COMBO_WORDS — מילים לקומבו (לחיצות מהירות ברצף): מדרגות לפי גודל הקומבו
  var COMBO_WORDS = { 4: 'קומבו! ×4', 6: 'KA-POW! ×6', 8: 'מטורף! ×8', 10: 'MEGA-BOOM! ×10', 14: 'גיבור-על! ×14' };
  // COLORS — צבעי הכוכב המשונן (צבעי היקום: זהב, מגנטה, טורקיז, מנטה, כתום, סגול)
  var COLORS = ['#ffe14a', '#ff5ca8', '#29e0ff', '#3ff2b0', '#ff9f1c', '#b18cff'];
  // SHARDS — אימוג'י שמתפזרים כרסיסים
  var SHARDS = ['⭐', '✨', '💥', '⚡', '💫', '🌟'];
  // SURPRISES — דמויות מצחיקות שקופצות מתחתית המסך + מה הן אומרות (עברית, בלשון רבים/ניטרלי)
  var SURPRISES = [
    ['🐸', 'קוואק! מי לחץ לי על הראש?'], ['🐔', 'קוקוריקו! זה לא בוקר!'], ['🙈', 'אני לא רואה כלום... אה, הנה!'],
    ['🤪', 'הופה! עשיתי סלטה!'], ['🐙', 'יש לי שמונה ידיים ואף אחת לא מגיעה!'], ['👽', 'שלום כדור הארץ! יש פיצה?'],
    ['🦖', 'ראאאר! בעצם... אני רק רוצה חיבוק'], ['🐷', 'אוינק! דגדגתם אותי!'], ['🤖', 'ביפ-בופ. מערכת צחוק: מופעלת!'],
    ['🦄', 'קשת בענן! קשת בענן! איפה?'], ['🐧', 'קר לי... אפשר שוקו חם?'], ['🧙‍♂️', 'אברא-קדברא! הפכתי אתכם ל... גיבורים!']
  ];
  // FUNNY_SFX — מילות SFX מצחיקות שמופיעות עם הדמות
  var FUNNY_SFX = ['BOING!', 'SQUEAK!', 'HONK!', 'SPLAT!', 'TADA!', 'OOPS!'];
  // MIN_GAP — מרווח מינימלי בין פיצוצים (מילישניות) — מגן על הביצועים בהקשות מהירות
  var MIN_GAP = 80;
  // SURPRISE_EVERY — כל כמה לחיצות (בערך) קופצת דמות; מתפזר אקראית ±3
  var SURPRISE_EVERY = 9;
  // HOLD_MS — כמה זמן להחזיק כדי לטעון "ברק"
  var HOLD_MS = 650;
  // reduce — תנועה מופחתת מהמערכת: מציגים רק את המילה, בלי תנועות גדולות
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  /* ---------- פרק 2 — סגנון מוזרק ---------- */
  var CSS = [
    /* שכבת האפקטים: מעל כל הדף, לא תופסת מגע */
    '#tfx{position:fixed;inset:0;z-index:9600;pointer-events:none;overflow:hidden;font-family:var(--h-font,"Rubik",system-ui,sans-serif)}',
    /* טבעת הלם: עיגול עם קו דיו שמתרחב ודוהה */
    '.tfx-ring{position:absolute;width:40px;height:40px;margin:-20px 0 0 -20px;border:4px solid #fff;border-radius:50%;box-shadow:0 0 0 3px var(--h-ink,#101e36),0 0 18px rgba(255,255,255,.7);animation:tfx-ring .55s cubic-bezier(.2,.8,.3,1) forwards}',
    '@keyframes tfx-ring{from{transform:scale(.3);opacity:1}to{transform:scale(3.4);opacity:0}}',
    /* טבעת קלה (מצב light): דקה ושקופה יותר */
    '.tfx-ring.lite{border-width:3px;box-shadow:none;animation-duration:.4s;opacity:.8}',
    /* רסיס: אימוג'י שעף לכיוון --dx/--dy ומסתובב */
    '.tfx-shard{position:absolute;font-size:22px;line-height:1;margin:-11px 0 0 -11px;filter:drop-shadow(0 2px 0 rgba(0,0,0,.35));animation:tfx-shard .7s cubic-bezier(.2,.7,.3,1) forwards}',
    '@keyframes tfx-shard{from{transform:translate(0,0) scale(.6) rotate(0)}to{transform:translate(var(--dx),var(--dy)) scale(1.1) rotate(var(--rot));opacity:0}}',
    /* מילת SFX: כוכב משונן (SVG) + טקסט עם קו דיו וצל */
    '.tfx-word{position:absolute;width:170px;height:130px;margin:-65px 0 0 -85px;display:grid;place-items:center;animation:tfx-word .8s cubic-bezier(.2,1.4,.35,1) forwards}',
    '.tfx-word svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}',
    '.tfx-word span{position:relative;font:italic 900 34px/1 var(--h-font,sans-serif);color:#fff;letter-spacing:1px;-webkit-text-stroke:3px var(--h-ink,#101e36);paint-order:stroke fill;text-shadow:3px 4px 0 var(--h-ink,#101e36);transform:rotate(-8deg);direction:ltr;white-space:nowrap}',
    '.tfx-word.big{width:280px;height:200px;margin:-100px 0 0 -140px}.tfx-word.big span{font-size:48px}',
    '@keyframes tfx-word{0%{transform:scale(.2) rotate(-25deg);opacity:0}30%{transform:scale(1.15) rotate(5deg);opacity:1}65%{transform:scale(1) rotate(0)}100%{transform:scale(1.05) translateY(-34px);opacity:0}}',
    /* דמות הפתעה: קופצת מלמטה, בולטת, נופלת חזרה */
    '.tfx-sur{position:absolute;bottom:-140px;font-size:112px;line-height:1;margin-left:-56px;filter:drop-shadow(0 8px 0 rgba(0,0,0,.35));animation:tfx-sur 2.2s cubic-bezier(.3,.9,.4,1) forwards}',
    '@keyframes tfx-sur{0%{transform:translateY(0) rotate(-12deg)}25%{transform:translateY(-260px) rotate(8deg)}40%{transform:translateY(-230px) rotate(-5deg) scaleX(1.15) scaleY(.9)}55%{transform:translateY(-250px) rotate(3deg)}80%{transform:translateY(-240px)}100%{transform:translateY(60px) rotate(14deg)}}',
    /* בועת דיבור של הדמות */
    '.tfx-bub{position:absolute;max-width:min(60vw,380px);padding:10px 16px;border:4px solid var(--h-ink,#101e36);border-radius:22px 22px 22px 4px;background:#fffaf0;color:var(--h-ink,#101e36);font:900 clamp(16px,2.2vw,22px)/1.25 var(--h-font,sans-serif);box-shadow:5px 6px 0 var(--h-ink,#101e36);direction:rtl;text-align:right;animation:tfx-bub 2.2s cubic-bezier(.2,1.3,.3,1) forwards}',
    '@keyframes tfx-bub{0%{transform:scale(0);opacity:0}22%{transform:scale(0);opacity:0}34%{transform:scale(1.08);opacity:1}45%{transform:scale(1)}85%{opacity:1}100%{opacity:0;transform:translateY(-20px)}}',
    /* טעינת ברק: טבעת שמתמלאת בלחיצה ארוכה */
    '.tfx-charge{position:absolute;width:90px;height:90px;margin:-45px 0 0 -45px;border-radius:50%;border:6px dashed #ffe14a;box-shadow:0 0 0 3px var(--h-ink,#101e36),0 0 26px rgba(255,225,74,.8);animation:tfx-charge .65s linear forwards}',
    '@keyframes tfx-charge{from{transform:scale(.2) rotate(0);opacity:.6}to{transform:scale(1) rotate(200deg);opacity:1}}',
    /* ברק: קו זיגזג SVG שמופיע ונעלם */
    '.tfx-bolt{position:absolute;width:220px;height:320px;margin:-300px 0 0 -110px;animation:tfx-bolt .55s ease-out forwards;filter:drop-shadow(0 0 14px #ffe14a)}',
    '@keyframes tfx-bolt{0%{opacity:0;transform:scaleY(.3)}20%{opacity:1;transform:scaleY(1)}70%{opacity:1}100%{opacity:0}}',
    /* פלאש לבן קצר על כל המסך (לברק ולקומבו גדול) */
    '.tfx-flash{position:absolute;inset:0;background:#fff;animation:tfx-flash .45s ease-out forwards}',
    '@keyframes tfx-flash{from{opacity:.75}to{opacity:0}}',
    /* קונפטי לקומבו */
    '.tfx-cf{position:absolute;top:-20px;width:12px;height:18px;border:2px solid var(--h-ink,#101e36);border-radius:3px;animation:tfx-cf linear forwards}',
    '@keyframes tfx-cf{to{transform:translateY(110vh) rotate(720deg)}}',
    /* רעידת מסך: על body, קצרה מאוד */
    'body.tfx-shake{animation:tfx-shake .35s linear}',
    '@keyframes tfx-shake{0%,100%{transform:translate(0,0)}20%{transform:translate(-7px,4px)}40%{transform:translate(6px,-5px)}60%{transform:translate(-5px,-3px)}80%{transform:translate(4px,5px)}}',
    '@media (prefers-reduced-motion:reduce){body.tfx-shake{animation:none}.tfx-sur,.tfx-shard{animation-duration:.01s}}'
  ].join('\n');
  function injectCss() {
    if (document.getElementById('tfx-css')) return;
    var st = document.createElement('style'); st.id = 'tfx-css'; st.textContent = CSS; document.head.appendChild(st);
  }

  /* ---------- פרק 3 — צלילים מצחיקים ---------- */
  var AC = null;
  // ac() — הקשר שמע משותף (נפתח רק אחרי מגע, כדרישת iOS); אם Sound של האפליקציה מושתק — שותקים
  function ac() {
    try { if (window.Sound && Sound.isOn && !Sound.isOn()) return null; } catch (e) {}
    if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } }
    if (AC && AC.state === 'suspended') { try { AC.resume(); } catch (e) {} }
    return AC;
  }
  // blip(f0, f1, dur, type, vol) — צליל אחד שגולש מתדר f0 ל-f1
  function blip(f0, f1, dur, type, vol) {
    var a = ac(); if (!a) return;
    var o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
    o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || .14, t + .015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + .03);
  }
  var SND = {
    pow: function () { blip(520, 180, .13, 'square', .08); blip(900, 300, .09, 'triangle', .07); },     // "פאו" קצר
    boing: function () { blip(220, 660, .22, 'sine', .14); setTimeout(function () { blip(500, 260, .18, 'sine', .1); }, 120); },   // קפיץ
    squeak: function () { blip(1200, 1900, .12, 'sine', .08); setTimeout(function () { blip(1900, 1100, .1, 'sine', .07); }, 90); }, // צווחה קטנה
    whistle: function () { blip(600, 1800, .5, 'sine', .08); },                                           // שריקת-שקופית למעלה
    zap: function () { blip(1800, 90, .35, 'sawtooth', .12); blip(240, 60, .35, 'square', .08); },        // ברק
    combo: function (n) { for (var i = 0; i < Math.min(n, 6); i++) (function (i) { setTimeout(function () { blip(500 + i * 120, 900 + i * 160, .12, 'triangle', .1); }, i * 60); })(i); }
  };

  /* ---------- פרק 4 — האפקטים ---------- */
  var layer = null, pool = [], live = 0, MAX_LIVE = 36;   // מכסת אלמנטים חיים: ~4 הקשות מלאות בו-זמנית
  // host() — שכבת האפקטים (נוצרת פעם אחת)
  function host() {
    if (layer && layer.isConnected) return layer;
    injectCss(); layer = document.getElementById('tfx') || document.createElement('div'); layer.id = 'tfx';
    if (!layer.isConnected) document.body.appendChild(layer);
    return layer;
  }
  // spawn(cls, html, x, y, life) — יוצר אלמנט אפקט, ממקם אותו ומוחק אחרי life מילישניות. שומר על מכסת MAX_LIVE
  function spawn(cls, html, x, y, life) {
    if (live >= MAX_LIVE) return null;
    var el = pool.pop() || document.createElement('div');
    el.className = cls; el.innerHTML = html || ''; el.style.cssText = '';
    if (x != null) el.style.left = x + 'px'; if (y != null) el.style.top = y + 'px';
    host().appendChild(el); live++;
    setTimeout(function () { el.remove(); live--; if (pool.length < 20) pool.push(el); }, life);
    return el;
  }
  // starSVG(col, spikes) — כוכב משונן עם צל דיו (לכוכב של מילת ה-SFX)
  function starSVG(col, spikes) {
    var n = spikes || 14, pts = [], pts2 = [];
    for (var i = 0; i < n * 2; i++) { var a = i / (n * 2) * Math.PI * 2, r = i % 2 ? .62 : 1; var x = 50 + Math.cos(a) * 48 * r, y = 50 + Math.sin(a) * 40 * r; pts.push(x.toFixed(1) + ',' + y.toFixed(1)); pts2.push((x + 4).toFixed(1) + ',' + (y + 5).toFixed(1)); }
    return '<svg viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="' + pts2.join(' ') + '" fill="#101e36"/><polygon points="' + pts.join(' ') + '" fill="' + col + '" stroke="#101e36" stroke-width="2.2"/></svg>';
  }
  // ring(x, y, lite) — טבעת הלם
  function ring(x, y, lite) { spawn('tfx-ring' + (lite ? ' lite' : ''), '', x, y, 600); }
  // shards(x, y, n) — n רסיסים שעפים לכל הכיוונים
  function shards(x, y, n) {
    if (reduce) return;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, d = 70 + Math.random() * 90;
      var el = spawn('tfx-shard', SHARDS[(Math.random() * SHARDS.length) | 0], x, y, 720);
      if (!el) return;
      el.style.setProperty('--dx', (Math.cos(a) * d).toFixed(0) + 'px'); el.style.setProperty('--dy', (Math.sin(a) * d - 40).toFixed(0) + 'px'); el.style.setProperty('--rot', ((Math.random() - .5) * 240).toFixed(0) + 'deg');
    }
  }
  // word(x, y, txt, big) — מילת SFX בתוך כוכב משונן
  function word(x, y, txt, big) {
    var col = COLORS[(Math.random() * COLORS.length) | 0];
    x = Math.min(innerWidth - 90, Math.max(90, x)); y = Math.max(70, Math.min(innerHeight - 70, y - 50));
    spawn('tfx-word' + (big ? ' big' : ''), starSVG(col, big ? 18 : 12 + ((Math.random() * 5) | 0)) + '<span>' + txt + '</span>', x, y, 820);
  }
  // flash() — הבזק לבן קצר על כל המסך
  function flash() { if (!reduce) spawn('tfx-flash', '', null, null, 460); }
  // shake() — רעידת מסך קצרה (על body)
  function shake() { if (reduce) return; document.body.classList.remove('tfx-shake'); void document.body.offsetWidth; document.body.classList.add('tfx-shake'); setTimeout(function () { document.body.classList.remove('tfx-shake'); }, 380); }
  // confetti(n) — n פיסות קונפטי שנופלות
  function confetti(n) {
    if (reduce) return;
    for (var i = 0; i < n; i++) {
      var el = spawn('tfx-cf', '', null, null, 3200); if (!el) return;
      el.style.left = (Math.random() * 100) + '%'; el.style.background = COLORS[i % COLORS.length];
      el.style.animationDuration = (1.8 + Math.random() * 1.4) + 's'; el.style.animationDelay = (Math.random() * .4) + 's';
    }
  }
  // speak(t) — הקראה בקול (אם מנוע הקול של האפליקציה קיים); לא קוטעת הקראה חשובה (interrupt=false)
  function speak(t) { try { if (window.Voice && Voice.say) Voice.say(t); } catch (e) {} }
  // surprise(x) — דמות מצחיקה קופצת מתחתית המסך במיקום x, עם בועת דיבור, מילת SFX וצליל
  function surprise(x) {
    var s = SURPRISES[(Math.random() * SURPRISES.length) | 0];
    x = Math.min(innerWidth - 160, Math.max(160, x == null ? innerWidth / 2 : x));
    var ch = spawn('tfx-sur', s[0], x, null, 2250); if (!ch) return;
    var bub = spawn('tfx-bub', s[1], null, null, 2250);
    if (bub) { bub.style.left = (x + 50) + 'px'; bub.style.top = Math.max(60, innerHeight - 420) + 'px'; if (x + 50 + 300 > innerWidth) { bub.style.left = ''; bub.style.right = (innerWidth - x + 50) + 'px'; bub.style.borderRadius = '22px 22px 4px 22px'; } }
    SND[Math.random() < .5 ? 'boing' : 'squeak']();
    setTimeout(function () { word(x, innerHeight - 330, FUNNY_SFX[(Math.random() * FUNNY_SFX.length) | 0]); }, 420);
    setTimeout(function () { speak(s[1]); }, 650);
  }
  // zap(x, y) — ברק מהשמיים לנקודת הלחיצה: פלאש, ברק SVG, מילה "ZAP!", צליל ורעידה
  function zap(x, y) {
    flash(); shake(); SND.zap();
    spawn('tfx-bolt', '<svg viewBox="0 0 220 320"><path d="M120 0 L70 140 L120 140 L60 320 L170 120 L115 120 L175 0 Z" fill="#ffe14a" stroke="#101e36" stroke-width="8" stroke-linejoin="round"/></svg>', x, y, 560);
    setTimeout(function () { word(x, y - 10, 'ZAP!', true); shards(x, y, 10); }, 120);
  }
  // burst(x, y, txt, big) — החבילה המלאה ללחיצה: טבעת + רסיסים + מילה + צליל
  function burst(x, y, txt, big) { ring(x, y); word(x, y, txt || WORDS[(Math.random() * WORDS.length) | 0], big); shards(x, y, big ? 10 : 5); SND.pow(); }   /* המילה לפני הרסיסים — היא החשובה אם המכסה מלאה */

  /* ---------- פרק 5 — האזנה למגע ---------- */
  var lastAt = 0, combo = 0, comboAt = 0, taps = 0, nextSurprise = SURPRISE_EVERY, hold = null, override = null;
  // mode() — מצב העבודה הנוכחי: override מהקוד (TapFX.set) גובר על body[data-tapfx]
  function mode() { var m = override || (document.body && document.body.dataset.tapfx) || 'full'; return m; }
  // skip(e) — האם לדלג: שדות טקסט, מצב off, מגע לא ראשי
  function skip(e) {
    if (mode() === 'off') return true;
    if (e.pointerType === 'mouse' && e.button !== 0) return true;
    var t = e.target; if (!t || !t.closest) return false;
    return !!t.closest('input,textarea,select,[contenteditable],[data-tapfx="off"]');
  }
  // onDown — נגיעה: טבעת מיידית + התחלת טיימר ללחיצה ארוכה. המילה והקומבו מגיעים רק ב-onUp
  //          (אם זו הייתה הקשה קצרה ולא גרירה) — כך גלילה/גרירה במשחקים לא מציפה את המסך במילים
  var down = null;
  function onDown(e) {
    if (skip(e)) return;
    var now = performance.now(), x = e.clientX, y = e.clientY, m = mode();
    down = { x: x, y: y, t: now, m: m };
    if (now - lastAt > MIN_GAP) { lastAt = now; ring(x, y, m === 'light'); }
    if (m === 'light') return;
    // לחיצה ארוכה: מתחילים לטעון ברק אחרי 260 מילישניות; תזוזה/שחרור מבטלים
    clearTimeout(hold && hold.t);
    hold = { x: x, y: y, el: null, t: setTimeout(function () { hold.el = spawn('tfx-charge', '', x, y, HOLD_MS + 200); SND.whistle(); hold.t = setTimeout(function () { zap(x, y); hold = null; down = null; }, HOLD_MS); }, 260) };
  }
  // onUp — שחרור: הקשה קצרה (עד 260 מילישניות, בלי תזוזה) = פיצוץ מילה, קומבו והפתעה
  function onUp(e) {
    if (hold) { clearTimeout(hold.t); if (hold.el) hold.el.remove(); hold = null; }
    var d = down; down = null; if (!d || d.m === 'light' || !e || e.type !== 'pointerup') return;
    var now = performance.now(); if (now - d.t > 260 || Math.abs(e.clientX - d.x) > 12 || Math.abs(e.clientY - d.y) > 12) return;
    var x = d.x, y = d.y;
    // קומבו: הקשות בתוך 700 מילישניות אחת מהשנייה
    combo = now - comboAt < 700 ? combo + 1 : 1; comboAt = now; taps++;
    var cw = COMBO_WORDS[combo];
    if (cw) { burst(x, y, cw, true); SND.combo(combo); if (combo >= 6) { shake(); confetti(combo >= 10 ? 60 : 24); } if (combo === 10) speak('עשר לחיצות! כוח-על!'); }
    else burst(x, y, null, false);
    // הפתעה: כל ~9 הקשות (לא בזמן קומבו מהיר, כדי לא להציף)
    if (taps >= nextSurprise && combo < 3) { nextSurprise = taps + SURPRISE_EVERY + ((Math.random() * 7) | 0) - 3; setTimeout(function () { surprise(x); }, 160); }
  }
  function onMove(e) { if (hold && (Math.abs(e.clientX - hold.x) > 14 || Math.abs(e.clientY - hold.y) > 14)) { clearTimeout(hold.t); if (hold.el) hold.el.remove(); hold = null; } }
  function listen() {
    document.addEventListener('pointerdown', onDown, { capture: true, passive: true });
    document.addEventListener('pointerup', onUp, { capture: true, passive: true });
    document.addEventListener('pointercancel', onUp, { capture: true, passive: true });
    document.addEventListener('pointermove', onMove, { capture: true, passive: true });
  }

  /* ---------- פרק 6 — "כניסת גיבור" בטעינת הדף ---------- */
  function heroEntry() {
    if (reduce || mode() === 'off' || !document.body) return;
    var el = document.createElement('div'); el.className = 'ms-lines'; document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 900);
  }

  /* ---------- פרק 7 — ייצוא ואתחול ---------- */
  function boot() { injectCss(); listen(); heroEntry(); }
  window.TapFX = {
    burst: burst, word: word, surprise: surprise, zap: zap, shake: shake, confetti: confetti,
    mode: mode,
    // set(m) — 'off' | 'light' | 'full' | null (חזרה ל-body[data-tapfx])
    set: function (m) { override = m === 'full' ? 'full' : m || null; }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
