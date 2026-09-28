/* =====================================================================
   shared/pet.js — דרקונצ'יק: חיית המחמד של הגיבורה שגדלה מלמידה
   ---------------------------------------------------------------------
   פרק 1 — שמירה (ella-pet-v1): צבע, שם, נקודות גדילה (xp), אוכל, רעב, מתי האכילו
   פרק 2 — אוכל מלמידה: כל תשובה באקדמיה = 🍎 אחד; ציור שנשמר = 🍎; סיפור שנקרא = 🍎🍎
           (מאזינים לאירוע progress:track מ-shared/progress.js)
   פרק 3 — 12 שלבי גדילה (לפי xp): ביצה → בוקע → תינוק → פעוט → קטנטן → ילד → נער → צעיר → גדול →
           דרקון אש → סופר-דרקון → מלך הדרקונים. משימות הדרקון (dragon.html) נותנות הרבה xp בבת אחת (Pet.grow)
   פרק 4 — ציור הדרקון כ-SVG: גודל ותכונות לפי השלב (כנפיים, קרניים, קוצים, כתר וגלימה),
           הבעה לפי מצב רוח (שמח / רעב / אוכל / מלטפים)
   פרק 5 — חדר החיה (Pet.open): בחירת ביצה, האכלה, משחק (תעלול לפי שלב), ליטוף, בקיעה ומתן שם
   פרק 6 — חיה קטנה בפינה (Pet.mini): מרחפת ליד הגיבורה, קופצת משמחה על תשובה נכונה
   תלויות: shared/theme.css; אופציונלי: js/audio.js, shared/hero-rewards.js, shared/progress.js
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- פרק 1 — שמירה ---------- */
  var KEY = 'ella-pet-v1';
  var COLORS = [['#ff7ec2', 'ורוד'], ['#3ff2b0', 'מנטה'], ['#5cc8ff', 'תכלת'], ['#a98bff', 'סגול'], ['#ffc93c', 'זהב']];
  var NAMES = ['ניצוץ', 'שוקו', 'זוהר', 'לולו', 'מוקי', 'טופי'];
  var STAGES = [[0, 'ביצה'], [4, 'דרקונצ׳יק בוקע'], [14, 'דרקונצ׳יק תינוק'], [26, 'דרקונצ׳יק פעוט'], [40, 'דרקונצ׳יק קטנטן'], [56, 'דרקונצ׳יק ילד'],
                [74, 'דרקון נער'], [94, 'דרקון צעיר'], [116, 'דרקון גדול'], [140, 'דרקון אש'], [166, 'סופר-דרקון'], [194, 'מלך הדרקונים']];
  /* מה חדש בכל שלב (נאמר בטקס הגדילה) */
  var NEWS = ['', 'בקע מהביצה!', 'פקח עיניים גדולות!', 'צמחו לו קרניים קטנות!', 'הקרניים גדלו!', 'הכנפיים גדלו!', 'צמחו לו קוצים על הגב!',
              'יש לו זנב עם קוצים!', 'כנפיים ענקיות — הוא עף!', 'הוא יורק אש!', 'יש לו גלימת גיבור!', 'הוא מלך הדרקונים עם כתר!'];
  var MAX_FOOD = 30;
  function blank() { return { color: null, name: '', xp: 0, food: 3, hunger: 30, fedAt: Date.now() }; }
  function load() { try { return Object.assign(blank(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { return blank(); } }
  var P = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) {} }
  function snd(n) { try { if (window.Sound && Sound[n]) Sound[n](); } catch (e) {} }
  function say(t) { try { if (window.Voice) Voice.say(t, { interrupt: true }); } catch (e) {} }

  /* ---------- פרק 2 — אוכל מלמידה ---------- */
  function addFood(n) { P.food = Math.min(MAX_FOOD, (P.food || 0) + n); save(); minis.forEach(function (m) { m.gain(n); }); }
  window.addEventListener('progress:track', function (e) {
    var ev = e.detail && e.detail.evt || '';
    if (/^answer:/.test(ev)) addFood(1);
    else if (ev === 'art:save') addFood(1);
    else if (ev === 'story:read') addFood(2);
  });

  /* ---------- פרק 3 — שלבים ורעב ---------- */
  function stage() { var s = 0; for (var i = 0; i < STAGES.length; i++) if (P.xp >= STAGES[i][0]) s = i; return s; }
  function nextAt() { var s = stage(); return s < STAGES.length - 1 ? STAGES[s + 1][0] : null; }
  /* רעב עולה בהדרגה (5 לשעה) מאז ההאכלה האחרונה — אף פעם לא "מת", רק מתגעגע */
  function hunger() { return Math.max(0, Math.min(100, Math.round((P.hunger || 0) + (Date.now() - (P.fedAt || Date.now())) / 36e5 * 5))); }
  function mood() { return hunger() >= 70 ? 'hungry' : 'happy'; }

  /* ---------- פרק 4 — ציור הדרקון ---------- */
  var INK = '#1b1036', uid = 0;
  /* mix — מבהיר צבע (לבטן ולכנפיים) */
  function mix(hex, t) { var n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255]; return '#' + c.map(function (v) { return ('0' + Math.round(v + (255 - v) * t).toString(16)).slice(-2); }).join(''); }
  /* svg(opts) — opts.face: happy | hungry | eat | love | sleep; opts.stage / opts.color לעקיפה */
  function svg(opts) {
    opts = opts || {};
    var st = opts.stage != null ? opts.stage : stage(), c = opts.color || P.color || COLORS[0][0], L = mix(c, .55), W = mix(c, .3), id = 'pet' + (++uid);
    var o = ' stroke="' + INK + '" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" class="pet-svg">';
    if (st === 0) {   /* ביצה עם כתמים וסדקים שמתרבים כשמחממים */
      s += '<ellipse cx="100" cy="186" rx="50" ry="8" fill="rgba(27,16,54,.25)"/>';
      s += '<ellipse cx="100" cy="112" rx="54" ry="70" fill="' + L + '"' + o + '/>';
      s += '<circle cx="78" cy="92" r="11" fill="' + c + '"/><circle cx="122" cy="80" r="8" fill="' + c + '"/><circle cx="118" cy="138" r="13" fill="' + c + '"/><circle cx="76" cy="140" r="7" fill="' + c + '"/>';
      s += '<path d="M70 62 Q80 52 92 50" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".7"/>';
      var cracks = Math.min(3, Math.floor(P.xp * 3 / 4));
      if (cracks >= 1) s += '<path d="M84 70 L92 82 L86 92 L96 102" fill="none"' + o + '/>';
      if (cracks >= 2) s += '<path d="M132 104 L122 112 L130 122 L120 130" fill="none"' + o + '/>';
      if (cracks >= 3) s += '<path d="M66 120 L78 124 L72 134" fill="none"' + o + '/>';
      return s + '</svg>';
    }
    var k = [0, .5, .56, .62, .68, .74, .8, .85, .9, .94, .97, 1][st], face = opts.face || mood();
    s += '<defs><radialGradient id="' + id + 'b" cx="40%" cy="30%" r="75%"><stop offset="0" stop-color="' + W + '"/><stop offset="1" stop-color="' + c + '"/></radialGradient></defs>';
    s += '<ellipse cx="100" cy="190" rx="' + (48 * k) + '" ry="7" fill="rgba(27,16,54,.25)"/>';
    s += '<g transform="translate(100 190) scale(' + k + ') translate(-100 -190)">';
    /* גלימה (סופר) מאחור */
    if (st >= 9) s += '<circle cx="100" cy="120" r="96" fill="#ffb347" opacity=".22"/>';                           /* הילת אש */
    if (st >= 11) s += '<circle cx="100" cy="110" r="100" fill="#fff3b0" opacity=".35"/>';                          /* הילת מלך */
    if (st >= 10) s += '<path d="M70 108 Q100 98 130 108 L150 186 Q100 196 50 186 Z" fill="#ff2e93"' + o + '/>';
    /* כנפיים: קטנות לתינוק, גדולות מהשלב השלישי */
    var wg = st >= 8 ? 1.5 : st >= 5 ? 1.25 : 1;
    s += '<g transform="translate(100 120) scale(' + wg + ') translate(-100 -120)"><path d="M66 118 C36 92 20 104 24 124 C36 120 44 128 44 136 C52 128 60 132 66 138 Z" fill="' + L + '"' + o + '/>' +
         '<path d="M134 118 C164 92 180 104 176 124 C164 120 156 128 156 136 C148 128 140 132 134 138 Z" fill="' + L + '"' + o + '/></g>';
    /* זנב מסתלסל (+ קוצים מהשלב השלישי) */
    s += '<path d="M130 160 C166 168 176 140 164 128 C160 124 154 128 158 134 C164 146 150 156 128 148 Z" fill="url(#' + id + 'b)"' + o + '/>';
    if (st >= 7) s += '<path d="M166 124 L176 116 L172 130 Z" fill="#ffc93c"' + o + '/><path d="M150 150 L160 140 L160 154 Z" fill="#ffc93c"' + o + '/>';
    /* גוף + בטן + רגליים + ידיים */
    s += '<ellipse cx="100" cy="148" rx="44" ry="40" fill="url(#' + id + 'b)"' + o + '/>';
    s += '<ellipse cx="100" cy="156" rx="26" ry="26" fill="' + L + '"/><path d="M84 146 Q100 150 116 146 M82 160 Q100 164 118 160' + (st >= 7 ? ' M86 172 Q100 176 114 172' : '') + '" stroke="' + mix(c, .2) + '" stroke-width="3" fill="none"/>';
    s += '<ellipse cx="80" cy="186" rx="14" ry="8" fill="' + c + '"' + o + '/><ellipse cx="120" cy="186" rx="14" ry="8" fill="' + c + '"' + o + '/>';
    s += '<path d="M62 142 Q54 150 60 158" fill="none"' + o + '/><path d="M138 142 Q146 150 140 158" fill="none"' + o + '/>';
    /* קוצים על הראש/גב מהשלב השלישי */
    if (st >= 6) s += '<path d="M86 44 L92 30 L100 42 L108 30 L114 44 Z" fill="#ffc93c"' + o + '/><path d="M56 118 L48 106 L62 110 Z M144 118 L152 106 L138 110 Z" fill="#ffc93c"' + o + '/>';
    /* קרניים מהשלב השני */
    if (st >= 4) s += '<path d="M72 54 L62 30 L84 46 Z" fill="#fff3b0"' + o + '/><path d="M128 54 L138 30 L116 46 Z" fill="#fff3b0"' + o + '/>';
    else if (st >= 3) s += '<path d="M76 50 L72 38 L84 46 Z" fill="#fff3b0"' + o + '/><path d="M124 50 L128 38 L116 46 Z" fill="#fff3b0"' + o + '/>';
    /* ראש גדול וחמוד */
    s += '<circle cx="100" cy="84" r="44" fill="url(#' + id + 'b)"' + o + '/>';
    s += '<ellipse cx="100" cy="104" rx="24" ry="15" fill="' + L + '"/><circle cx="92" cy="100" r="2.5" fill="' + INK + '"/><circle cx="108" cy="100" r="2.5" fill="' + INK + '"/>';
    s += '<circle cx="68" cy="98" r="8" fill="#ff9eb0" opacity=".8"/><circle cx="132" cy="98" r="8" fill="#ff9eb0" opacity=".8"/>';
    /* עיניים לפי מצב רוח */
    if (st === 1 && face === 'happy') face = 'sleep';
    if (face === 'love' || face === 'eat') s += '<path d="M72 82 Q80 72 88 82 M112 82 Q120 72 128 82" fill="none"' + o + '/>';
    else if (face === 'sleep') s += '<path d="M72 82 Q80 88 88 82 M112 82 Q120 88 128 82" fill="none"' + o + '/>';
    else {
      s += '<ellipse cx="80" cy="80" rx="11" ry="13" fill="#fff"' + o + '/><ellipse cx="120" cy="80" rx="11" ry="13" fill="#fff"' + o + '/>';
      s += '<circle cx="81" cy="82" r="7" fill="' + INK + '"/><circle cx="119" cy="82" r="7" fill="' + INK + '"/><circle cx="84" cy="78" r="2.8" fill="#fff"/><circle cx="122" cy="78" r="2.8" fill="#fff"/>';
      if (face === 'hungry') s += '<path d="M68 64 L88 70 M132 64 L112 70" fill="none"' + o + '/>';
    }
    /* פה */
    if (face === 'eat') s += '<ellipse cx="100" cy="116" rx="10" ry="8" fill="#b3124f"' + o + '/>';
    else if (face === 'hungry') s += '<path d="M90 118 Q100 110 110 118" fill="none"' + o + '/>';
    else s += '<path d="M88 112 Q100 124 112 112" fill="#fff"' + o + '/>';
    /* אש מהפה/עשן מהאף (דרקון אש ומעלה) */
    if (st >= 9 && face !== 'eat') s += '<circle cx="92" cy="96" r="4" fill="#c9ced9" opacity=".8"/><circle cx="108" cy="94" r="5" fill="#c9ced9" opacity=".7"/>';
    if (face === 'fire') s += '<path d="M100 116 C120 110 150 100 176 112 C160 118 170 126 184 128 C160 136 128 130 104 122 Z" fill="#ff9f1c"' + o + '/><path d="M108 118 C130 116 150 114 166 120 C148 124 128 124 110 121 Z" fill="#ffe14d"/>';
    /* כתר (סופר) */
    if (st >= 11) s += '<path d="M80 44 L84 22 L94 36 L100 16 L106 36 L116 22 L120 44 Z" fill="#ffc93c"' + o + '/><circle cx="100" cy="34" r="3.5" fill="#ff2e93"/>';
    s += '</g></svg>';
    return s;
  }

  /* ---------- פרק 5 — חדר החיה ---------- */
  var style = document.createElement('style');
  style.textContent =
    '.pet-card{width:min(96vw,860px);text-align:center;padding:20px 22px}' +
    '.pet-x{position:absolute;top:12px;left:12px;width:52px;height:52px;border:4px solid var(--h-ink);border-radius:50%;background:var(--h-magenta);color:#fff;font:900 22px/1 var(--h-font);box-shadow:0 4px 0 var(--h-ink);cursor:pointer;z-index:2}' +
    '.pet-room{position:relative;display:grid;grid-template-columns:1.1fr 1fr;gap:16px;align-items:center;margin-top:10px}' +
    '.pet-stage{position:relative;height:min(46vh,360px);border:4px solid var(--h-ink);border-radius:26px;overflow:hidden;background:linear-gradient(180deg,#bfe9ff 0,#e9f8ff 58%,#9be07f 58%,#6cc85a 100%);cursor:pointer}' +
    '.pet-stage::before{content:"";position:absolute;left:8%;top:10%;width:70px;height:26px;border-radius:20px;background:#fff;box-shadow:120px 20px 0 -4px #fff,60px -8px 0 4px #fff}' +
    '.pet-body{position:absolute;left:50%;bottom:6%;width:min(34vh,270px);transform:translateX(-50%)}' +
    '.pet-body svg{width:100%;height:auto;display:block}' +
    '.pet-body.wobble{animation:pet-wob 1.6s ease-in-out infinite}.pet-body.idle{animation:pet-bob 2.4s ease-in-out infinite alternate}' +
    '.pet-body.jump{animation:pet-jump .7s var(--h-spring)}.pet-body.spin{animation:pet-spin .9s ease}.pet-body.fly{animation:pet-fly 1.6s ease}' +
    '@keyframes pet-wob{0%,100%{transform:translateX(-50%) rotate(-5deg)}50%{transform:translateX(-50%) rotate(5deg)}}' +
    '@keyframes pet-bob{from{transform:translateX(-50%) translateY(0)}to{transform:translateX(-50%) translateY(-8px)}}' +
    '@keyframes pet-jump{40%{transform:translateX(-50%) translateY(-70px) scale(1.05)}70%{transform:translateX(-50%) translateY(0) scale(1.08,.92)}}' +
    '@keyframes pet-spin{to{transform:translateX(-50%) rotate(360deg)}}' +
    '@keyframes pet-fly{30%{transform:translateX(-80%) translateY(-120px) rotate(-10deg)}65%{transform:translateX(-20%) translateY(-100px) rotate(10deg)}}' +
    '.pet-float{position:absolute;font-size:34px;pointer-events:none;animation:pet-up 1.3s ease-out forwards}' +
    '@keyframes pet-up{from{transform:translateY(0) scale(.6);opacity:1}to{transform:translateY(-140px) scale(1.3);opacity:0}}' +
    '.pet-info{display:grid;gap:10px;text-align:right}' +
    '.pet-name{font:900 clamp(26px,3.4vw,38px)/1 var(--h-font)}.pet-stagelbl{font-weight:800;color:var(--h-text-soft)}' +
    '.pet-bar{display:grid;gap:4px;font-weight:800;font-size:15px}.pet-bar .h-meter{height:18px}' +
    '.pet-food{display:flex;align-items:center;gap:8px;padding:8px 12px;border:3px solid var(--h-ink);border-radius:16px;background:#fff;font:900 22px/1 var(--h-font)}' +
    '.pet-food small{font:700 13px/1.3 var(--h-font);color:var(--h-text-soft)}' +
    '.pet-acts{display:flex;gap:10px;flex-wrap:wrap}.pet-acts .h-btn{flex:1;min-width:130px}.pet-lair{display:block;text-align:center;text-decoration:none}' +
    '.pet-pick{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin:14px 0}' +
    '.pet-pick button{width:120px;padding:8px;border:4px solid var(--h-ink);border-radius:22px;background:#fff;box-shadow:0 4px 0 var(--h-ink);cursor:pointer;font:800 16px/1.2 var(--h-font)}' +
    '.pet-pick button svg{width:100%;height:auto}' +
    '.pet-names{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin:12px 0}' +
    '.pet-mini{position:absolute;width:var(--pet-size,110px);cursor:pointer;z-index:5;animation:pet-mini 2.2s ease-in-out infinite alternate;filter:drop-shadow(0 8px 10px rgba(0,0,0,.35))}' +
    '.pet-mini svg{width:100%;height:auto;display:block}.pet-mini.hop{animation:pet-hop .6s var(--h-spring)}' +
    '.pet-mini .pm-badge{position:absolute;top:-6px;right:-6px;min-width:30px;height:30px;padding:0 6px;border:3px solid var(--h-ink);border-radius:999px;background:var(--h-gold);color:var(--h-ink);font:900 15px/24px var(--h-font);text-align:center}' +
    '@keyframes pet-mini{from{transform:translateY(0) rotate(-3deg)}to{transform:translateY(-10px) rotate(3deg)}}' +
    '@keyframes pet-hop{40%{transform:translateY(-40px) scale(1.1)}}' +
    '@media (max-width:760px){.pet-room{grid-template-columns:1fr}.pet-stage{height:34vh}}';
  document.head.appendChild(style);

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  /* open — חדר החיה */
  function open() {
    var m = el('div', 'h-modal show'), card = el('div', 'h-modal-card h-panel pet-card');
    m.appendChild(card); document.body.appendChild(m);
    function close() { m.remove(); minis.forEach(function (x) { x.draw(); }); }
    function render() {
      /* 5.1 בפעם הראשונה — בוחרים ביצה */
      if (!P.color) {
        card.innerHTML = '<button type="button" class="pet-x">✖</button><span class="h-modal-kicker">🥚 ביצת קסם!</span><h2>בחרי ביצה — מה יבקע ממנה?</h2>' +
          '<div class="pet-pick">' + COLORS.map(function (c) { return '<button type="button" data-c="' + c[0] + '">' + svg({ stage: 0, color: c[0] }) + c[1] + '</button>'; }).join('') + '</div>' +
          '<p>כל תשובה באקדמיה נותנת 🍎 — וכך הביצה תבקע והדרקונצ׳יק יגדל!</p>';
        card.querySelector('.pet-x').onclick = close;
        card.querySelectorAll('[data-c]').forEach(function (b) { b.onclick = function () { P.color = b.dataset.c; P.fedAt = Date.now(); save(); snd('ding'); say('איזו ביצה יפה! מחממים אותה באהבה, והיא תבקע.'); render(); }; });
        return;
      }
      /* 5.2 אחרי בקיעה — בוחרים שם */
      if (stage() >= 1 && !P.name) {
        card.innerHTML = '<span class="h-modal-kicker">🎉 הביצה בקעה!</span><div style="width:200px;margin:8px auto">' + svg({ face: 'love' }) + '</div><h2>דרקונצ׳יק חדש! איך נקרא לו?</h2>' +
          '<div class="pet-names">' + NAMES.map(function (n) { return '<button type="button" class="h-btn gold" data-n="' + n + '">' + n + '</button>'; }).join('') + '</div>';
        card.querySelectorAll('[data-n]').forEach(function (b) { b.onclick = function () { P.name = b.dataset.n; save(); snd('happy'); say('שלום ' + P.name + '! ברוך הבא לצוות!'); render(); }; });
        return;
      }
      var s = stage(), nx = nextAt(), h = hunger(), egg = s === 0;
      var prevAt = STAGES[s][0], pct = nx ? Math.round((P.xp - prevAt) / (nx - prevAt) * 100) : 100;
      card.innerHTML = '<button type="button" class="pet-x">✖</button><span class="h-modal-kicker">🐾 ' + (egg ? 'ביצת הקסם' : 'החבר הקטן שלי') + '</span>' +
        '<div class="pet-room"><div class="pet-stage" id="petStage"><div class="pet-body ' + (egg ? 'wobble' : 'idle') + '" id="petBody">' + svg() + '</div></div>' +
        '<div class="pet-info"><div><div class="pet-name">' + (egg ? 'ביצה מסתורית' : P.name) + '</div><div class="pet-stagelbl">' + STAGES[s][1] + (nx ? ' · עוד ' + (nx - P.xp) + ' ' + (egg ? 'חימומים לבקיעה' : 'ארוחות לשלב הבא') : ' · השלב הכי גבוה! 🌟') + '</div></div>' +
        '<div class="pet-bar">' + (egg ? '🔥 חום' : '🌱 גדילה') + '<div class="h-meter"><div class="h-meter-fill" style="width:' + pct + '%"></div></div></div>' +
        (egg ? '' : '<div class="pet-bar">' + (h >= 70 ? '😢 רעב מאוד!' : h >= 40 ? '🙂 קצת רעב' : '😋 שבע ומאושר') + '<div class="h-meter"><div class="h-meter-fill" style="width:' + (100 - h) + '%;background:linear-gradient(90deg,#ff5a6e,#ffc93c,#3ff2b0)"></div></div></div>') +
        '<div class="pet-food">🍎 × ' + P.food + ' <small>כל תשובה באקדמיה = 🍎<br>ציור שנשמר = 🍎 · סיפור = 🍎🍎</small></div>' +
        '<div class="pet-acts"><button type="button" class="h-btn gold" id="petFeed">' + (egg ? '🔥 לחמם' : '🍎 להאכיל') + '</button>' +
        (egg ? '' : '<button type="button" class="h-btn cyan" id="petPlay">🎾 לשחק</button>') + '</div>' +
        (/dragon\.html/.test(location.pathname) ? '' : '<a class="h-btn violet pet-lair" href="./dragon.html">🐉 למאורת הדרקון — משימות ומשחקים</a>') + '</div></div>';
      card.querySelector('.pet-x').onclick = close;
      var body = card.querySelector('#petBody'), stageEl = card.querySelector('#petStage');
      function float(t, x) { var f = el('div', 'pet-float', t); f.style.left = (x == null ? 40 + Math.random() * 20 : x) + '%'; f.style.bottom = '40%'; stageEl.appendChild(f); setTimeout(function () { f.remove(); }, 1300); }
      function anim(cls) { body.className = 'pet-body ' + cls; void body.offsetWidth; setTimeout(function () { body.className = 'pet-body ' + (egg ? 'wobble' : 'idle'); }, 1600); }
      /* ליטוף: נגיעה בחיה → לבבות */
      stageEl.onclick = function (e) {
        if (e.target.closest('button')) return;
        if (egg) { snd('bubble'); float('✨'); say('הביצה זזה! משהו בפנים!'); anim('wobble'); return; }
        body.innerHTML = svg({ face: 'love' }); snd('sparkle'); float('💗'); float('💖');
        setTimeout(function () { body.innerHTML = svg(); }, 1200);
      };
      card.querySelector('#petFeed').onclick = function () {
        if (P.food <= 0) { snd('sad'); say('אין אוכל! עונים על שאלות באקדמיה ומקבלים תפוחים.'); return; }
        var before = stage();
        P.food--; P.xp++; P.hunger = Math.max(0, hunger() - 35); P.fedAt = Date.now(); save();
        try { if (window.Progress) Progress.track('pet:feed'); } catch (e) {}
        if (egg) { snd('bubble'); float('🔥'); anim('wobble'); }
        else { body.innerHTML = svg({ face: 'eat' }); snd('pop'); float('🍎'); setTimeout(function () { float('😋'); }, 300); anim('jump'); }
        var after = stage();
        if (after > before) {   /* עלייה בשלב: בקיעה / גדילה */
          setTimeout(function () {
            try { if (window.HeroRewards) HeroRewards.confetti(); } catch (e) {}
            snd('ding'); say(before === 0 ? 'הביצה בוקעת!' : P.name + ' גדל! עכשיו הוא ' + STAGES[after][1] + '. ' + NEWS[after]);
            /* תעודה כשהדרקון מגיע לשלב הסופר */
            if (after === STAGES.length - 1 && window.Share) setTimeout(function () { Share.award({ key: 'pet:super', line: 'גידלה את ' + P.name + ' למלך הדרקונים', ico: '🐉' }); }, 1500);
            render();
          }, 900);
        } else setTimeout(render, egg ? 700 : 1300);
      };
      var play = card.querySelector('#petPlay');
      if (play) play.onclick = function () {
        /* תעלול לפי השלב: קפיצה → סיבוב → תעופה → תעופה עם קשת */
        var tr = s >= 8 ? 'fly' : s >= 5 ? 'spin' : 'jump';
        anim(tr); snd('happy'); float(s >= 9 ? '🔥' : s >= 8 ? '☁️' : '⭐');
        if (s >= 9) { body.innerHTML = svg({ face: 'fire' }); setTimeout(function () { body.innerHTML = svg(); }, 1200); float('✨', 30); float('✨', 60); }
        say(s >= 9 ? P.name + ' יורק אש!' : s >= 8 ? P.name + ' עף!' : s >= 5 ? P.name + ' מסתובב!' : P.name + ' קופץ!');
      };
    }
    render();
    snd('bubble');
  }

  /* ---------- פרק 6 — חיה קטנה בפינה ---------- */
  var minis = [];
  /* mini(parent, opts) — opts.size (px), opts.style (מיקום CSS) */
  function mini(parent, opts) {
    opts = opts || {};
    var d = el('div', 'pet-mini'); d.style.setProperty('--pet-size', (opts.size || 110) + 'px');
    if (opts.style) d.setAttribute('style', d.getAttribute('style') + ';' + opts.style);
    d.setAttribute('role', 'button'); d.setAttribute('aria-label', 'חיית המחמד');
    parent.appendChild(d);
    var api = {
      draw: function () {
        d.innerHTML = svg() + (!P.color ? '<span class="pm-badge">!</span>' : P.food > 0 && (stage() === 0 || hunger() >= 40) ? '<span class="pm-badge">🍎' + P.food + '</span>' : '');
      },
      /* gain — קופץ משמחה ומציג +🍎 כשמרוויחים אוכל */
      gain: function (n) {
        api.draw(); d.classList.remove('hop'); void d.offsetWidth; d.classList.add('hop');
        var f = el('div', 'pet-float', '+🍎'); f.style.cssText = 'left:30%;bottom:80%;font-size:26px'; d.appendChild(f); setTimeout(function () { f.remove(); }, 1300);
      }
    };
    d.addEventListener('click', function (e) { e.stopPropagation(); open(); });
    api.draw(); minis.push(api);
    return api;
  }

  /* grow(n) — מוסיף n נקודות גדילה ישירות (פרס של משימת דרקון); מחזיר {from, to} של השלב */
  function grow(n) {
    var from = stage();
    P.xp += n; P.hunger = 0; P.fedAt = Date.now(); save();
    var to = stage();
    if (to === STAGES.length - 1 && from < to && window.Share) setTimeout(function () { Share.award({ key: 'pet:super', line: 'גידלה את ' + (P.name || 'הדרקון') + ' למלך הדרקונים', ico: '🐉' }); }, 2500);
    minis.forEach(function (m) { m.draw(); });
    return { from: from, to: to };
  }
  window.Pet = { open: open, mini: mini, svg: svg, stage: stage, hunger: hunger, addFood: addFood, grow: grow, NEWS: NEWS, nextAt: nextAt, save: save,
                 get state() { return P; }, STAGES: STAGES, reset: function () { P = blank(); save(); minis.forEach(function (m) { m.draw(); }); } };
})();
