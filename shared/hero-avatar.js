/* =====================================================================
   shared/hero-avatar.js — אלה גיבורת-העל: ציור הדמות כ-SVG בשכבות
   ---------------------------------------------------------------------
   פרק 1 — קטלוג פריטים: לכל "חריץ" (גלימה / חליפה / מסכה / סמל / כוח)
           יש רשימת פריטים. הפריט הראשון בכל חריץ הוא ברירת המחדל.
   פרק 2 — שכבות הציור (מאחור לפנים): כוח → גלימה → רגליים → גוף →
           ידיים → סמל → ראש → מסכה → ניצוצות קדמיים.
   פרק 1.5 — צוות הגיבורים: 7 דמויות (הילדה עצמה, נועה, מאיה, מיצי החתולה, רובי הרובוט, קשתית החד-קרן,
           בובו הדובי) — כולן לובשות את אותן תחפושות; outfit.hero קובע מי הדמות.
           הדמות הראשונה = הילדה: שם ומראה (5 תסרוקות, 5 צבעי שיער, 4 גווני עור) מהפרופיל שלה.
   פרק 3 — HeroAvatar.svg(outfit) מחזיר מחרוזת SVG מוכנה להזרקה.
           opts.doctor — "הרופאה": חלוק לבן, מכשיר שמיעה, מראת רופא על המצח וכפפות (מרפאת הדרקון), בלי גלימה ומסכה.
   פריטים עם free:true פתוחים מההתחלה; צבעי סטודיו נשמרים ב-outfit.colors.
   הדמות מקורית לגמרי (לא דמות מוגנת); עוצבה בקווי דיו עבים כמו קומיקס.
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- פרק 1 — קטלוג הפריטים ---------- */
  /* כל פריט: id ייחודי, name לתצוגה, ico אימוג'י לכרטיס, וצבעים לציור */
  var CATALOG = {
    cape: [
      { id: 'cape_pink',    name: 'גלימה ורודה',    ico: '🩷', a: '#ff5fb0', b: '#c2187a' },
      { id: 'cape_galaxy',  name: 'גלימת גלקסיה',   ico: '🌌', a: '#6b3fe0', b: '#1d0b4a', stars: true },
      { id: 'cape_gold',    name: 'גלימת זהב',      ico: '👑', a: '#ffd95a', b: '#e08a00' },
      { id: 'cape_rainbow', name: 'גלימת קשת',      ico: '🌈', rainbow: true },
      { id: 'cape_sky',     name: 'גלימת שמיים',    ico: '☁️', a: '#5cc8ff', b: '#1a6fd6', free: true },
      { id: 'cape_hearts',  name: 'גלימת לבבות',    ico: '💕', a: '#ff8fc4', b: '#e0418a', hearts: true, free: true }
    ],
    suit: [
      { id: 'suit_magenta', name: 'חליפת מג׳נטה',  ico: '💗', a: '#ff4fa3', b: '#b3126b', boot: '#ffc93c' },
      { id: 'suit_cyan',    name: 'חליפת אוקיינוס', ico: '🌊', a: '#3fd8ff', b: '#1673c9', boot: '#ffffff' },
      { id: 'suit_night',   name: 'חליפת לילה',    ico: '🌙', a: '#8b5cff', b: '#3a1177', boot: '#ffc93c' },
      { id: 'suit_mint',    name: 'חליפת טבע',     ico: '🍀', a: '#3ff2b0', b: '#139b6c', boot: '#ff7ec2' },
      { id: 'suit_sun',     name: 'חליפת שמש',     ico: '🌞', a: '#ffd95a', b: '#ff9f1c', boot: '#ff2e93', free: true },
      { id: 'suit_berry',   name: 'חליפת פטל',     ico: '🍒', a: '#ff5a6e', b: '#9b1d5a', boot: '#ffffff', free: true }
    ],
    mask: [
      { id: 'mask_classic',   name: 'מסכה קלאסית',   ico: '🎭', color: '#ff2e93' },
      { id: 'mask_star',      name: 'מסכת כוכב',     ico: '⭐', color: '#ffc93c', star: true },
      { id: 'mask_butterfly', name: 'מסכת פרפר',     ico: '🦋', color: '#8b5cff', butterfly: true },
      { id: 'mask_cat',       name: 'מסכת חתולה',    ico: '🐱', color: '#29c5ff', cat: true },
      { id: 'mask_heart',     name: 'מסכת לבבות',    ico: '💖', color: '#ff5a6e', heart: true, free: true },
      { id: 'mask_none',      name: 'בלי מסכה',      ico: '😊', none: true, free: true }
    ],
    emblem: [
      { id: 'emb_heart',     name: 'סמל הלב',     ico: '❤️', kind: 'heart' },
      { id: 'emb_star',      name: 'סמל הכוכב',   ico: '🌟', kind: 'star' },
      { id: 'emb_bolt',      name: 'סמל הברק',    ico: '⚡', kind: 'bolt' },
      { id: 'emb_butterfly', name: 'סמל הפרפר',   ico: '🦋', kind: 'butterfly' },
      { id: 'emb_flower',    name: 'סמל הפרח',    ico: '🌸', kind: 'flower', free: true },
      { id: 'emb_moon',      name: 'סמל הירח',    ico: '🌙', kind: 'moon', free: true }
    ],
    aura: [
      { id: 'aura_none',    name: 'בלי כוח',          ico: '✖️', kind: 'none' },
      { id: 'aura_sparkle', name: 'כוח הנצנוץ',       ico: '✨', kind: 'sparkle' },
      { id: 'aura_bolt',    name: 'כוח הברק',         ico: '🌩️', kind: 'bolt' },
      { id: 'aura_wings',   name: 'כנפי קשת — טיסה',  ico: '🪽', kind: 'wings' },
      { id: 'aura_shield',  name: 'מגן הכוכבים',      ico: '🛡️', kind: 'shield' },
      { id: 'aura_hearts',  name: 'כוח הלבבות',       ico: '💗', kind: 'hearts', free: true },
      { id: 'aura_bubbles', name: 'כוח הבועות',       ico: '🫧', kind: 'bubbles', free: true }
    ],
    /* אביזרים — חלקם חופשיים מההתחלה */
    acc: [
      { id: 'acc_none',       name: 'בלי אביזר',   ico: '✖️', kind: 'none', free: true },
      { id: 'acc_crown',      name: 'כתר',         ico: '👑', kind: 'crown', free: true },
      { id: 'acc_bow',        name: 'סרט לשיער',   ico: '🎀', kind: 'bow', free: true },
      { id: 'acc_glasses',    name: 'משקפי כוכב',  ico: '🤩', kind: 'glasses', free: true },
      { id: 'acc_flower',     name: 'פרח בשיער',   ico: '🌺', kind: 'flower', free: true },
      { id: 'acc_tiara',      name: 'נזר יהלומים', ico: '💎', kind: 'tiara' },
      { id: 'acc_headphones', name: 'אוזניות DJ',  ico: '🎧', kind: 'headphones' },
      /* אביזרי חג ויום הולדת — מתנה שנפתחת בתקופת החג (shared/seasons.js) */
      { id: 'acc_honey',   name: 'סרט תפוח ודבש', ico: '🍎', kind: 'honey',   season: 'rosh' },
      { id: 'acc_leaves',  name: 'כתר עלים',      ico: '🌿', kind: 'leaves',  season: 'sukkot' },
      { id: 'acc_candles', name: 'כתר נרות',      ico: '🕎', kind: 'candles', season: 'hanukkah' },
      { id: 'acc_jester',  name: 'כובע ליצן',      ico: '🃏', kind: 'jester',  season: 'purim' },
      { id: 'acc_wreath',  name: 'זר פרחים',      ico: '🌸', kind: 'wreath',  season: 'pesach' },
      { id: 'acc_flagbow', name: 'פפיון כחול-לבן', ico: '💙', kind: 'flagbow', season: 'atzmaut' },
      { id: 'acc_party',   name: 'כובע יום הולדת', ico: '🎉', kind: 'party',   season: 'bday' }
    ]
  };

  /* צבעי סטודיו — בחירה חופשית בלי נעילה */
  var STUDIO = ['#ff2e93', '#ff5a6e', '#ff9f1c', '#ffd95a', '#3ff2b0', '#29c5ff', '#3d6bff', '#8b5cff', '#1b1036', '#ffffff'];

  /* שמות החריצים בעברית — לארון התחפושות */
  var SLOT_NAMES = { cape: 'גלימות', suit: 'חליפות', mask: 'מסכות', emblem: 'סמלים', aura: 'כוחות', acc: 'אביזרים' };

  /* ---------- פרק 1.5 — צוות הגיבורים ----------
     level = הרמה שבה הדמות מצטרפת לצוות (1 = פתוחה מההתחלה). style = סוג הראש. g = מין דקדוקי (f/m).
     skin/skinD = צבע פנים ובהיר/כהה; hair/hairD = שיער (לדמויות אנושיות). */
  var HEROES = [
    { id: 'ella', g: 'f',   name: 'אלה',   ico: '🦸‍♀️', level: 1,  style: 'pony',    skin: '#ffd9b3', skinD: '#f5c193', hair: '#ffcf5a', hairD: '#f0a92a', say: 'אני אלה גיבורת-העל!' },
    { id: 'noa', g: 'f',    name: 'נועה',  ico: '👧🏽', level: 1,  style: 'buns',    skin: '#c68a5c', skinD: '#a86f45', hair: '#3a2217', hairD: '#1f110a', say: 'אני נועה! כוח-העל שלי הוא סקרנות!' },
    { id: 'maya', g: 'f',   name: 'מאיה',  ico: '👧', level: 3,  style: 'curly',   skin: '#ffe2c6', skinD: '#f2c49d', hair: '#e2572b', hairD: '#b33d17', say: 'אני מאיה! כוח-העל שלי הוא דמיון!' },
    { id: 'mitzi', g: 'f',  name: 'מיצי',  ico: '🐱', level: 6,  style: 'cat',     skin: '#ffb04a', skinD: '#f08a1c', say: 'מיאו! אני מיצי, החתולה הכי מהירה!' },
    { id: 'robi', g: 'm',   name: 'רובי',  ico: '🤖', level: 9,  style: 'robot',   skin: '#d5e0ee', skinD: '#9fb0c8', say: 'ביפ בופ! אני רובי, הרובוט החכם!' },
    { id: 'keshet', g: 'f', name: 'קשתית', ico: '🦄', level: 12, style: 'unicorn', skin: '#fff4fb', skinD: '#f3d9ec', say: 'אני קשתית! יש לי כוחות של קשת!' },
    { id: 'bubu', g: 'm',   name: 'בובו',  ico: '🐻', level: 15, style: 'bear',    skin: '#c98b56', skinD: '#a26a3a', say: 'אני בובו הדובי! חיבוק של גיבורים!' }
  ];
  /* hero(id) — הגדרת דמות לפי מזהה (ברירת מחדל: הדמות של הילדה עצמה — "אני").
     הדמות הראשונה היא הילדה: השם והמראה (עור, תסרוקת, צבע שיער) מגיעים מהפרופיל שלה (shared/profile.js) */
  function hero(id) {
    var h = HEROES[0];
    for (var i = 0; i < HEROES.length; i++) if (HEROES[i].id === id) h = HEROES[i];
    if (h.id === 'ella' && window.Profile) return Object.assign({}, h, Profile.lookFor(), { name: Profile.name });
    /* חברה עם אותו שם כמו הילדה — מקבלת שם חלופי */
    if (window.Profile && Profile.friendName(h.name) !== h.name) return Object.assign({}, h, { name: Profile.friendName(h.name), say: Profile.friendFix(h.say) });
    return h;
  }

  /* ברירת מחדל: הפריט הראשון בכל חריץ */
  function defaultOutfit() {
    return { cape: 'cape_pink', suit: 'suit_magenta', mask: 'mask_classic', emblem: 'emb_heart', aura: 'aura_none', acc: 'acc_none', colors: {} };
  }

  /* מחפש פריט לפי id בתוך חריץ; אם לא נמצא — מחזיר את ברירת המחדל */
  function item(slot, id) {
    var list = CATALOG[slot];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return list[0];
  }

  /* shade — מבהיר/מכהה צבע hex (amt שלילי = כהה יותר) */
  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16), r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
    var c = function (v) { return Math.max(0, Math.min(255, v)); };
    return '#' + ((1 << 24) + (c(r) << 16) + (c(g) << 8) + c(b)).toString(16).slice(1);
  }
  /* resolve — פריט לחריץ, כולל צבע סטודיו חופשי (id מסוג cape_custom) */
  function resolve(outfit, slot) {
    var id = outfit[slot], col = outfit.colors && outfit.colors[slot];
    if (id === slot + '_custom' && col) {
      if (slot === 'cape') return { id: id, a: col, b: shade(col, -60) };
      if (slot === 'suit') return { id: id, a: col, b: shade(col, -70), boot: '#ffc93c' };
      if (slot === 'mask') return { id: id, color: col };
    }
    return item(slot, id);
  }

  /* מונה ייחודי למזהי גרדיאנטים — כדי שכמה דמויות באותו דף לא יתנגשו */
  var uid = 0;
  var INK = '#1b1036';
  var SKIN = '#ffd9b3', SKIN_D = '#f5c193', HAIR = '#ffcf5a', HAIR_D = '#f0a92a';

  /* ---------- פרק 2 — שכבות הציור ---------- */

  /* 2.1 כוח (מאחורי הדמות) */
  function auraLayer(a, id) {
    if (a.kind === 'none') return '';
    if (a.kind === 'sparkle') {
      return '<circle cx="120" cy="160" r="112" fill="url(#' + id + 'glow)" opacity=".9"/>';
    }
    if (a.kind === 'bolt') {
      /* שני ברקים זוהרים משני הצדדים */
      var bolt = function (x, flip) {
        var s = flip ? -1 : 1;
        return '<path d="M' + x + ' 40 l' + (s * -22) + ' 58 l' + (s * 18) + ' 0 l' + (s * -26) + ' 70 l' + (s * 48) + ' -86 l' + (s * -20) + ' 0 l' + (s * 18) + ' -42 z" fill="#fff36b" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>';
      };
      return '<circle cx="120" cy="160" r="112" fill="url(#' + id + 'glowC)" opacity=".85"/>' + bolt(46, false) + bolt(194, true);
    }
    if (a.kind === 'wings') {
      /* כנפיים בצבעי קשת מאחורי הכתפיים */
      var wing = function (flip) {
        var t = flip ? ' transform="translate(240,0) scale(-1,1)"' : '';
        return '<g' + t + '>' +
          '<path d="M100 150 C60 90 14 92 8 124 C4 150 34 168 60 170 C30 178 22 206 44 216 C66 226 92 196 104 176 Z" fill="url(#' + id + 'rain)" stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round"/>' +
          '<path d="M96 156 C70 124 40 118 26 128" fill="none" stroke="#fff" stroke-width="3" opacity=".7" stroke-linecap="round"/>' +
          '</g>';
      };
      return wing(false) + wing(true);
    }
    if (a.kind === 'shield') {
      /* טבעת כוכבים מסביב לדמות */
      var s = '<circle cx="120" cy="165" r="110" fill="rgba(41,224,255,.14)" stroke="#29e0ff" stroke-width="4" stroke-dasharray="4 10" stroke-linecap="round"/>';
      for (var i = 0; i < 10; i++) {
        var ang = (i / 10) * Math.PI * 2, x = 120 + Math.cos(ang) * 110, y = 165 + Math.sin(ang) * 110;
        s += starPath(x, y, 10, 4.5, '#ffe66b');
      }
      return s;
    }
    if (a.kind === 'hearts') { /* לבבות מרחפים */
      var h = '', pts = [[40, 90], [200, 80], [28, 200], [212, 190], [70, 40], [170, 36]];
      pts.forEach(function (p, i) { h += '<path d="M' + p[0] + ' ' + (p[1] + 10) + ' C' + (p[0] - 14) + ' ' + p[1] + ' ' + (p[0] - 8) + ' ' + (p[1] - 10) + ' ' + p[0] + ' ' + (p[1] - 3) + ' C' + (p[0] + 8) + ' ' + (p[1] - 10) + ' ' + (p[0] + 14) + ' ' + p[1] + ' ' + p[0] + ' ' + (p[1] + 10) + 'Z" fill="' + (i % 2 ? '#ff5fb0' : '#ff9ecb') + '" stroke="' + INK + '" stroke-width="2" class="h-av-spark" style="animation-delay:' + (i * .3) + 's"/>'; });
      return '<circle cx="120" cy="160" r="112" fill="url(#' + id + 'glow)" opacity=".55"/>' + h;
    }
    if (a.kind === 'bubbles') { /* בועות סבון */
      var bb = '', bp = [[36, 110, 14], [206, 100, 18], [24, 220, 10], [214, 216, 12], [60, 50, 9], [186, 44, 11], [44, 160, 7], [200, 150, 8]];
      bp.forEach(function (p, i) { bb += '<g class="h-av-spark" style="animation-delay:' + (i * .25) + 's"><circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + p[2] + '" fill="rgba(180,240,255,.35)" stroke="#8fe9ff" stroke-width="2.5"/><circle cx="' + (p[0] - p[2] * .35) + '" cy="' + (p[1] - p[2] * .35) + '" r="' + (p[2] * .25) + '" fill="#fff"/></g>'; });
      return bb;
    }
    return '';
  }

  /* כוכב עם 5 קצוות — מחזיר path */
  function starPath(cx, cy, R, r, fill) {
    var d = '';
    for (var i = 0; i < 10; i++) {
      var rad = i % 2 ? r : R, a = -Math.PI / 2 + i * Math.PI / 5;
      d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rad).toFixed(1) + ' ' + (cy + Math.sin(a) * rad).toFixed(1);
    }
    return '<path d="' + d + 'Z" fill="' + fill + '" stroke="' + INK + '" stroke-width="2" stroke-linejoin="round"/>';
  }

  /* 2.2 גלימה */
  function capeLayer(c, id) {
    var fill = c.rainbow ? 'url(#' + id + 'rain)' : 'url(#' + id + 'cape)';
    var s = '<path d="M90 148 Q120 138 150 148 L204 276 Q180 292 158 280 Q140 296 120 284 Q100 296 82 280 Q60 292 36 276 Z" fill="' + fill + '" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>';
    /* קפל אור בגלימה */
    s += '<path d="M100 160 L70 270" stroke="rgba(255,255,255,.35)" stroke-width="6" stroke-linecap="round"/>';
    if (c.hearts) {
      [[80, 230], [150, 250], [118, 200], [172, 212], [98, 262]].forEach(function (p) { s += '<path d="M' + p[0] + ' ' + (p[1] + 7) + ' C' + (p[0] - 10) + ' ' + p[1] + ' ' + (p[0] - 6) + ' ' + (p[1] - 7) + ' ' + p[0] + ' ' + (p[1] - 2) + ' C' + (p[0] + 6) + ' ' + (p[1] - 7) + ' ' + (p[0] + 10) + ' ' + p[1] + ' ' + p[0] + ' ' + (p[1] + 7) + 'Z" fill="#fff" opacity=".75"/>'; });
    }
    if (c.stars) {
      s += '<circle cx="70" cy="250" r="2.5" fill="#fff"/><circle cx="170" cy="236" r="3" fill="#fff"/><circle cx="150" cy="268" r="2" fill="#fff"/><circle cx="90" cy="210" r="2" fill="#fff"/><circle cx="182" cy="262" r="2" fill="#fff"/>';
    }
    return s;
  }

  /* 2.3 גוף: רגליים, מגפיים, חליפה, חגורה, ידיים על המותניים */
  function bodyLayer(su, id, h) {
    var s = '';
    /* רגליים + מגפיים */
    s += '<rect x="98" y="226" width="19" height="46" rx="8" fill="url(#' + id + 'suit)" stroke="' + INK + '" stroke-width="3.5"/>';
    s += '<rect x="123" y="226" width="19" height="46" rx="8" fill="url(#' + id + 'suit)" stroke="' + INK + '" stroke-width="3.5"/>';
    s += '<path d="M94 258 h25 v26 q0 6 -6 6 h-23 q-6 0 -4 -8 z" fill="' + su.boot + '" stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round"/>';
    s += '<path d="M121 258 h25 l4 24 q2 8 -4 8 h-19 q-6 0 -6 -6 z" fill="' + su.boot + '" stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round"/>';
    /* ידיים (מאחורי הגוף במרפקים): כתף → מרפק → מותן */
    s += '<path d="M96 158 L70 190 L96 214" fill="none" stroke="' + INK + '" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>';
    s += '<path d="M96 158 L70 190 L96 214" fill="none" stroke="' + su.a + '" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>';
    s += '<path d="M144 158 L170 190 L144 214" fill="none" stroke="' + INK + '" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>';
    s += '<path d="M144 158 L170 190 L144 214" fill="none" stroke="' + su.a + '" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>';
    /* גוף החליפה */
    s += '<path d="M90 162 Q90 146 106 144 L134 144 Q150 146 150 162 L146 234 L94 234 Z" fill="url(#' + id + 'suit)" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>';
    /* ברק על החזה */
    s += '<path d="M98 156 Q102 150 110 149" stroke="rgba(255,255,255,.55)" stroke-width="5" fill="none" stroke-linecap="round"/>';
    /* חגורה עם אבזם */
    s += '<rect x="92" y="216" width="56" height="12" rx="4" fill="#ffc93c" stroke="' + INK + '" stroke-width="3"/>';
    s += '<rect x="112" y="213" width="16" height="18" rx="4" fill="#fff3b0" stroke="' + INK + '" stroke-width="3"/>';
    /* כפפות על המותניים */
    s += '<circle cx="96" cy="214" r="10" fill="#fff" stroke="' + INK + '" stroke-width="3.5"/>';
    s += '<circle cx="144" cy="214" r="10" fill="#fff" stroke="' + INK + '" stroke-width="3.5"/>';
    /* צוואר */
    s += '<rect x="112" y="128" width="16" height="20" rx="7" fill="' + (h ? h.skinD : SKIN_D) + '" stroke="' + INK + '" stroke-width="3"/>';
    return s;
  }

  /* 2.4 סמל על החזה בתוך עיגול */
  function emblemLayer(e) {
    var cx = 120, cy = 182, s = '<circle cx="' + cx + '" cy="' + cy + '" r="17" fill="#fffaf0" stroke="' + INK + '" stroke-width="3.5"/>';
    if (e.kind === 'heart') s += '<path d="M120 192 C104 182 108 170 115 170 C118 170 120 173 120 175 C120 173 122 170 125 170 C132 170 136 182 120 192 Z" fill="#ff2e93" stroke="' + INK + '" stroke-width="2"/>';
    if (e.kind === 'star') s += starPath(cx, cy + 1, 12, 5, '#ffc93c');
    if (e.kind === 'bolt') s += '<path d="M123 168 L111 185 L119 185 L115 197 L130 178 L122 178 Z" fill="#ffe14d" stroke="' + INK + '" stroke-width="2" stroke-linejoin="round"/>';
    if (e.kind === 'butterfly') s += '<path d="M120 182 C112 170 104 172 106 180 C107 186 114 186 120 183 C114 186 108 192 112 195 C116 197 119 190 120 186 C121 190 124 197 128 195 C132 192 126 186 120 183 C126 186 133 186 134 180 C136 172 128 170 120 182 Z" fill="#8b5cff" stroke="' + INK + '" stroke-width="2"/>';
    if (e.kind === 'flower') { for (var k = 0; k < 5; k++) { var an = k * Math.PI * 2 / 5; s += '<circle cx="' + (cx + Math.cos(an) * 7).toFixed(1) + '" cy="' + (cy + Math.sin(an) * 7).toFixed(1) + '" r="6" fill="#ff8fc4" stroke="' + INK + '" stroke-width="1.5"/>'; } s += '<circle cx="' + cx + '" cy="' + cy + '" r="4.5" fill="#ffd95a" stroke="' + INK + '" stroke-width="1.5"/>'; }
    if (e.kind === 'moon') s += '<path d="M126 170 A13 13 0 1 0 126 194 A10 10 0 1 1 126 170 Z" fill="#ffd95a" stroke="' + INK + '" stroke-width="2"/>';
    return s;
  }

  /* 2.5 ראש — לפי הדמות (h.style):
     headBack — מה שמאחורי הפנים (קוקו, פקעות, אוזניים, רעמה, אנטנה, זנב)
     headFront — הפנים + שיער קדמי / פרווה / קרן / מסך רובוט + לחיים וחיוך */
  function headBack(h, id) {
    var st = h.style, hair = h.hair || HAIR, o = ' stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round"';
    if (st === 'pony') return '<path d="M150 80 C190 70 214 96 206 128 C200 150 184 150 178 140 C188 128 186 106 160 104 Z" fill="' + hair + '"' + o + '/>' +
      '<path d="M72 96 Q66 150 88 156 L90 112 Z" fill="' + hair + '"' + o + '/>';
    if (st === 'buns') return '<circle cx="80" cy="58" r="22" fill="' + hair + '"' + o + '/><circle cx="160" cy="58" r="22" fill="' + hair + '"' + o + '/>' +
      '<path d="M74 70 Q60 60 66 48 M166 70 Q180 60 174 48" stroke="' + h.hairD + '" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<circle cx="80" cy="58" r="8" fill="none" stroke="' + h.hairD + '" stroke-width="2.5"/><circle cx="160" cy="58" r="8" fill="none" stroke="' + h.hairD + '" stroke-width="2.5"/>';
    if (st === 'short') return '';
    /* קארה: שיער שיורד משני צדי הפנים עד הסנטר */
    if (st === 'bob') return '<path d="M68 98 Q62 60 96 48 Q120 40 144 48 Q178 60 172 98 L172 142 Q160 152 146 146 L94 146 Q80 152 68 142 Z" fill="' + hair + '"' + o + '/>';
    /* תלתלים: ענן של סלסולים מסביב לראש */
    if (st === 'curly') return [[78, 66, 22], [98, 48, 22], [122, 42, 22], [146, 48, 22], [164, 66, 22], [70, 96, 20], [170, 96, 20], [74, 124, 18], [166, 124, 18]]
      .map(function (c) { return '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '" fill="' + hair + '"' + o + '/>'; }).join('');
    /* צמה: שיער אסוף מאחור (הצמה עצמה מצוירת מקדימה) */
    if (st === 'braid') return '<path d="M72 96 Q70 50 120 48 Q170 50 168 96 L168 128 Q150 138 120 136 Q90 138 72 128 Z" fill="' + hair + '"' + o + '/>';
    if (st === 'cat') return '<path d="M150 240 C200 230 214 190 200 170 C194 162 184 168 190 178 C198 196 186 222 150 226 Z" fill="' + h.skin + '"' + o + '/>' +
      '<path d="M82 74 L76 30 L112 56 Z" fill="' + h.skin + '"' + o + '/><path d="M158 74 L164 30 L128 56 Z" fill="' + h.skin + '"' + o + '/>' +
      '<path d="M86 64 L83 42 L102 56 Z M154 64 L157 42 L138 56 Z" fill="#ffb3d4"/>';
    if (st === 'robot') return '<path d="M120 56 L120 24" stroke="' + INK + '" stroke-width="5"/><circle cx="120" cy="20" r="9" fill="#ff2e93"' + o + '/><circle cx="117" cy="17" r="3" fill="#fff"/>' +
      '<rect x="62" y="84" width="16" height="30" rx="6" fill="#9fb0c8"' + o + '/><rect x="162" y="84" width="16" height="30" rx="6" fill="#9fb0c8"' + o + '/>';
    if (st === 'unicorn') return '<path d="M150 70 C196 64 216 100 204 140 C196 162 176 160 172 148 C186 132 182 104 156 100 Z" fill="url(#' + id + 'rain)"' + o + '/>' +
      '<path d="M86 70 L80 40 L104 58 Z M154 70 L160 40 L136 58 Z" fill="' + h.skin + '"' + o + '/><path d="M88 62 L85 48 L98 58 Z M152 62 L155 48 L142 58 Z" fill="#ffb3d4"/>';
    if (st === 'bear') return '<circle cx="82" cy="62" r="18" fill="' + h.skin + '"' + o + '/><circle cx="158" cy="62" r="18" fill="' + h.skin + '"' + o + '/>' +
      '<circle cx="82" cy="62" r="9" fill="#ffc9a3"/><circle cx="158" cy="62" r="9" fill="#ffc9a3"/>';
    return '';
  }
  function headFront(id, h) {
    var st = h.style, s = '', o = ' stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round"';
    /* הפנים: עיגול (רובוט — ריבוע מעוגל) */
    s += st === 'robot' ? '<rect x="74" y="52" width="92" height="92" rx="28" fill="url(#' + id + 'skin)" stroke="' + INK + '" stroke-width="4"/>'
                        : '<circle cx="120" cy="98" r="46" fill="url(#' + id + 'skin)" stroke="' + INK + '" stroke-width="4"/>';
    if (st === 'pony') {
      s += '<path d="M74 96 Q70 50 120 48 Q170 50 166 96 Q160 74 138 70 Q128 82 110 78 Q96 74 88 80 Q78 86 74 96 Z" fill="' + h.hair + '"' + o + '/>';
      s += '<path d="M96 60 Q110 54 126 56" stroke="rgba(255,255,255,.5)" stroke-width="4" fill="none" stroke-linecap="round"/>';
    } else if (st === 'buns') {
      s += '<path d="M74 98 Q70 50 120 48 Q170 50 166 98 Q164 80 152 74 Q146 84 134 78 Q126 86 114 80 Q102 86 94 78 Q80 82 74 98 Z" fill="' + h.hair + '"' + o + '/>';
      s += '<path d="M98 60 Q112 55 128 57" stroke="#7a5238" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>';
    } else if (st === 'short') {
      s += '<path d="M76 86 Q70 46 120 44 Q170 46 164 86 Q160 68 148 62 L144 72 Q136 62 128 70 L122 60 Q114 70 104 64 L100 74 Q92 64 84 70 Q78 74 76 86 Z" fill="' + h.hair + '"' + o + '/>';
      s += '<path d="M100 56 Q114 50 130 53" stroke="#c07a45" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>';
    } else if (st === 'bob') {
      s += '<path d="M74 92 Q70 48 120 46 Q170 48 166 92 Q164 74 150 70 Q138 78 120 72 Q102 78 90 70 Q76 74 74 92 Z" fill="' + h.hair + '"' + o + '/>';
      s += '<path d="M98 58 Q112 52 128 54" stroke="rgba(255,255,255,.45)" stroke-width="4" fill="none" stroke-linecap="round"/>';
    } else if (st === 'curly') {
      [[92, 62, 12], [108, 54, 13], [124, 52, 13], [140, 56, 12], [153, 66, 10]].forEach(function (c) { s += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '" fill="' + h.hair + '"' + o + '/>'; });
    } else if (st === 'braid') {
      /* צמה שיורדת על הכתף + פוני הצידה */
      for (var bi = 0; bi < 6; bi++) s += '<ellipse cx="' + (158 + bi * 3) + '" cy="' + (124 + bi * 15) + '" rx="11" ry="10" fill="' + h.hair + '"' + o + '/>';
      s += '<circle cx="176" cy="212" r="6" fill="#ff2e93" stroke="' + INK + '" stroke-width="2.5"/>';
      s += '<path d="M74 94 Q70 48 122 46 Q168 48 166 90 Q150 64 118 66 Q96 70 86 84 Q80 90 74 94 Z" fill="' + h.hair + '"' + o + '/>';
    } else if (st === 'cat') {
      s += '<path d="M108 58 L112 72 M120 55 L120 70 M132 58 L128 72" stroke="' + h.skinD + '" stroke-width="5" stroke-linecap="round"/>';
      s += '<ellipse cx="120" cy="122" rx="24" ry="15" fill="#fff6ea"/><path d="M114 112 L126 112 L120 119 Z" fill="#ff7aa8" stroke="' + INK + '" stroke-width="2" stroke-linejoin="round"/>';
      s += '<path d="M90 116 L62 110 M90 124 L62 128 M150 116 L178 110 M150 124 L178 128" stroke="' + INK + '" stroke-width="2.5" stroke-linecap="round"/>';
    } else if (st === 'robot') {
      s += '<path d="M82 66 Q120 58 158 66" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>';
      s += '<circle cx="84" cy="134" r="3.5" fill="#6b7a95"/><circle cx="156" cy="134" r="3.5" fill="#6b7a95"/><circle cx="84" cy="62" r="3.5" fill="#6b7a95"/><circle cx="156" cy="62" r="3.5" fill="#6b7a95"/>';
    } else if (st === 'unicorn') {
      s += '<path d="M110 60 L120 14 L130 60 Z" fill="#ffd95a"' + o + '/><path d="M113 48 L127 42 M115 36 L125 31 M117 25 L123 22" stroke="#e89a00" stroke-width="2.5" stroke-linecap="round"/>';
      s += '<path d="M76 92 Q74 56 116 52 Q104 62 108 76 Q92 70 88 84 Q80 82 76 92 Z" fill="url(#' + id + 'rain)"' + o + '/>';
    } else if (st === 'bear') {
      s += '<ellipse cx="120" cy="122" rx="22" ry="15" fill="#f1c9a0"/><ellipse cx="120" cy="113" rx="8" ry="5.5" fill="' + INK + '"/>';
      s += '<path d="M112 54 Q120 46 126 54" stroke="' + h.skinD + '" stroke-width="4" fill="none" stroke-linecap="round"/>';
    }
    /* לחיים + חיוך (משותף לכולם) */
    s += '<circle cx="96" cy="118" r="7" fill="#ff9eb0" opacity=".75"/><circle cx="144" cy="118" r="7" fill="#ff9eb0" opacity=".75"/>';
    s += '<path d="M106 ' + (st === 'cat' || st === 'bear' ? 126 : 122) + ' Q120 ' + (st === 'cat' || st === 'bear' ? 138 : 136) + ' 134 ' + (st === 'cat' || st === 'bear' ? 126 : 122) + '" fill="#fff" stroke="' + INK + '" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>';
    return s;
  }

  /* 2.6 מסכה + עיניים (העיניים מעל המסכה) */
  function maskLayer(m) {
    var s = '';
    if (m.cat) { /* אוזני חתולה על הראש */
      s += '<path d="M84 66 L80 36 L104 54 Z" fill="' + m.color + '" stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round"/>';
      s += '<path d="M156 66 L160 36 L136 54 Z" fill="' + m.color + '" stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round"/>';
      s += '<path d="M86 58 L84 44 L96 54 Z" fill="#ffb3d4"/><path d="M154 58 L156 44 L144 54 Z" fill="#ffb3d4"/>';
    }
    if (m.none) { /* בלי מסכה — רק עיניים */ }
    else if (m.butterfly) { /* כנפי פרפר גדולות במקום מסכה */
      s += '<path d="M120 100 C104 78 70 72 72 96 C74 114 100 114 120 106 C140 114 166 114 168 96 C170 72 136 78 120 100 Z" fill="' + m.color + '" stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round"/>';
    } else {
      s += '<path d="M76 96 Q84 84 104 88 Q120 94 136 88 Q156 84 164 96 Q160 112 140 112 Q126 110 120 104 Q114 110 100 112 Q80 112 76 96 Z" fill="' + m.color + '" stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round"/>';
    }
    if (m.heart) { /* לבבות בצדי המסכה */
      [[70, 94], [170, 94]].forEach(function (p) { s += '<path d="M' + p[0] + ' ' + (p[1] + 10) + ' C' + (p[0] - 14) + ' ' + p[1] + ' ' + (p[0] - 8) + ' ' + (p[1] - 11) + ' ' + p[0] + ' ' + (p[1] - 4) + ' C' + (p[0] + 8) + ' ' + (p[1] - 11) + ' ' + (p[0] + 14) + ' ' + p[1] + ' ' + p[0] + ' ' + (p[1] + 10) + 'Z" fill="' + m.color + '" stroke="' + INK + '" stroke-width="3"/>'; });
    }
    if (m.star) { /* קצוות כוכב בצדי המסכה */
      s += starPath(72, 92, 11, 5, m.color) + starPath(168, 92, 11, 5, m.color);
    }
    /* עיניים גדולות ונוצצות */
    s += '<ellipse cx="104" cy="99" rx="8.5" ry="9.5" fill="#fff" stroke="' + INK + '" stroke-width="2.5"/>';
    s += '<ellipse cx="136" cy="99" rx="8.5" ry="9.5" fill="#fff" stroke="' + INK + '" stroke-width="2.5"/>';
    s += '<circle cx="105" cy="100" r="5.5" fill="' + INK + '"/><circle cx="135" cy="100" r="5.5" fill="' + INK + '"/>';
    s += '<circle cx="107" cy="97.5" r="2" fill="#fff"/><circle cx="137" cy="97.5" r="2" fill="#fff"/>';
    return s;
  }

  /* 2.7 אביזר על הראש (מצויר מעל המסכה) */
  function accLayer(ac) {
    var k = ac.kind;
    if (k === 'crown') return '<path d="M92 58 L96 30 L110 46 L120 24 L130 46 L144 30 L148 58 Z" fill="#ffc93c" stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round"/><circle cx="120" cy="46" r="4" fill="#ff2e93"/><circle cx="104" cy="50" r="3" fill="#29c5ff"/><circle cx="136" cy="50" r="3" fill="#3ff2b0"/>';
    if (k === 'tiara') return '<path d="M86 66 Q120 40 154 66 Q120 54 86 66 Z" fill="#e8f7ff" stroke="' + INK + '" stroke-width="3"/><path d="M120 36 L127 50 L120 58 L113 50 Z" fill="#8fe9ff" stroke="' + INK + '" stroke-width="2.5"/><circle cx="100" cy="56" r="3.5" fill="#ff8fc4" stroke="' + INK + '" stroke-width="1.5"/><circle cx="140" cy="56" r="3.5" fill="#ff8fc4" stroke="' + INK + '" stroke-width="1.5"/>';
    if (k === 'bow') return '<g transform="translate(152 60) rotate(20)"><path d="M0 0 L-22 -14 L-22 14 Z M0 0 L22 -14 L22 14 Z" fill="#ff5fb0" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/><circle r="6" fill="#ff2e93" stroke="' + INK + '" stroke-width="3"/></g>';
    if (k === 'flower') { var f = '<g transform="translate(88 62)">'; for (var i = 0; i < 5; i++) { var a = i * Math.PI * 2 / 5; f += '<circle cx="' + (Math.cos(a) * 9).toFixed(1) + '" cy="' + (Math.sin(a) * 9).toFixed(1) + '" r="8" fill="#ff6fa8" stroke="' + INK + '" stroke-width="2.5"/>'; } return f + '<circle r="6" fill="#ffd95a" stroke="' + INK + '" stroke-width="2.5"/></g>'; }
    if (k === 'glasses') return starPath(104, 99, 17, 9, 'rgba(255,217,90,.55)') + starPath(136, 99, 17, 9, 'rgba(255,217,90,.55)') + '<path d="M117 96 Q120 92 123 96" stroke="' + INK + '" stroke-width="3" fill="none"/>';
    /* אביזרי חג */
    if (k === 'honey') return '<path d="M78 72 Q120 40 162 72" fill="none" stroke="' + INK + '" stroke-width="9" stroke-linecap="round"/><path d="M78 72 Q120 40 162 72" fill="none" stroke="#ff5a6e" stroke-width="5" stroke-linecap="round"/>' +
      '<circle cx="148" cy="48" r="13" fill="#ff3b3b" stroke="' + INK + '" stroke-width="3"/><path d="M148 36 q2 -8 6 -9" stroke="' + INK + '" stroke-width="3" fill="none"/><path d="M152 34 q10 -6 14 2 q-8 4 -14 -2z" fill="#3fcf7a" stroke="' + INK + '" stroke-width="2"/><circle cx="143" cy="44" r="3" fill="#fff" opacity=".7"/>';
    if (k === 'leaves') { var lv = ''; for (var li = 0; li < 9; li++) { var la = Math.PI + (li + .5) * Math.PI / 9, lx = 120 + Math.cos(la) * 50, ly = 92 + Math.sin(la) * 50; lv += '<ellipse cx="' + lx.toFixed(1) + '" cy="' + ly.toFixed(1) + '" rx="7" ry="14" transform="rotate(' + (la * 180 / Math.PI + 90).toFixed(0) + ' ' + lx.toFixed(1) + ' ' + ly.toFixed(1) + ')" fill="' + (li % 2 ? '#3fcf7a' : '#2fa85a') + '" stroke="' + INK + '" stroke-width="2.5"/>'; } return lv; }
    if (k === 'candles') { var cd = '<path d="M88 62 Q120 50 152 62 L150 72 Q120 62 90 72 Z" fill="#ffc93c" stroke="' + INK + '" stroke-width="3"/>'; [96, 108, 120, 132, 144].forEach(function (x, ci) { var y = ci === 2 ? 30 : 38; cd += '<rect x="' + (x - 3.5) + '" y="' + y + '" width="7" height="' + (60 - y) + '" rx="2" fill="' + ['#29c5ff', '#ffffff', '#3d6bff', '#ffffff', '#29c5ff'][ci] + '" stroke="' + INK + '" stroke-width="2"/><path d="M' + x + ' ' + (y - 2) + ' q-5 -7 0 -14 q5 7 0 14z" fill="#ff9f1c" stroke="' + INK + '" stroke-width="1.5"/>'; }); return cd; }
    if (k === 'jester') return '<path d="M84 64 Q86 28 60 22 Q90 30 104 52 Q112 18 120 12 Q128 18 136 52 Q150 30 180 22 Q154 28 156 64 Z" fill="#8b5cff" stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round"/><path d="M104 52 Q112 18 120 12 Q128 18 136 52 Z" fill="#ff2e93" stroke="' + INK + '" stroke-width="3"/><path d="M84 64 Q120 54 156 64" stroke="' + INK + '" stroke-width="7" fill="none"/><path d="M84 64 Q120 54 156 64" stroke="#ffc93c" stroke-width="4" fill="none"/>' +
      '<circle cx="60" cy="22" r="6" fill="#ffc93c" stroke="' + INK + '" stroke-width="2.5"/><circle cx="120" cy="12" r="6" fill="#3ff2b0" stroke="' + INK + '" stroke-width="2.5"/><circle cx="180" cy="22" r="6" fill="#ffc93c" stroke="' + INK + '" stroke-width="2.5"/>';
    if (k === 'wreath') { var wr = '<path d="M76 80 Q76 50 120 48 Q164 50 164 80" fill="none" stroke="#2fa85a" stroke-width="6"/>'; for (var wi = 0; wi < 7; wi++) { var wa = Math.PI + (wi + .5) * Math.PI / 7, wx = 120 + Math.cos(wa) * 46, wy = 84 + Math.sin(wa) * 38; wr += '<circle cx="' + wx.toFixed(1) + '" cy="' + wy.toFixed(1) + '" r="7.5" fill="' + ['#ff7ec2', '#ffd95a', '#ffffff', '#b28dff', '#ff7ec2', '#ffd95a', '#ffffff'][wi] + '" stroke="' + INK + '" stroke-width="2"/><circle cx="' + wx.toFixed(1) + '" cy="' + wy.toFixed(1) + '" r="2.5" fill="#ff9f1c"/>'; } return wr; }
    if (k === 'flagbow') return '<g transform="translate(150 58) rotate(15)"><path d="M0 0 L-26 -16 L-26 16 Z M0 0 L26 -16 L26 16 Z" fill="#ffffff" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/><path d="M-24 -9 L-6 -3 M-24 9 L-6 3 M24 -9 L6 -3 M24 9 L6 3" stroke="#1f5fd6" stroke-width="4"/><circle r="7" fill="#1f5fd6" stroke="' + INK + '" stroke-width="3"/></g>';
    if (k === 'party') return '<g transform="rotate(-12 120 50)"><path d="M100 60 L120 8 L140 60 Z" fill="#ff2e93" stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round"/><path d="M108 40 L132 40 M104 50 L136 50 M113 28 L127 28" stroke="#ffd95a" stroke-width="4"/><circle cx="120" cy="8" r="7" fill="#3ff2b0" stroke="' + INK + '" stroke-width="2.5"/></g>';
    if (k === 'headphones') return '<path d="M74 100 Q74 44 120 44 Q166 44 166 100" fill="none" stroke="' + INK + '" stroke-width="9"/><path d="M74 100 Q74 44 120 44 Q166 44 166 100" fill="none" stroke="#8b5cff" stroke-width="5"/><rect x="62" y="88" width="18" height="30" rx="8" fill="#ff2e93" stroke="' + INK + '" stroke-width="3"/><rect x="160" y="88" width="18" height="30" rx="8" fill="#ff2e93" stroke="' + INK + '" stroke-width="3"/>';
    return '';
  }

  /* 2.8 ניצוצות קדמיים לכוח הנצנוץ */
  function frontSparkles(a) {
    if (a.kind !== 'sparkle' && a.kind !== 'wings') return '';
    var pts = [[42, 70], [200, 60], [30, 200], [212, 196], [188, 262], [56, 258]], s = '';
    pts.forEach(function (p, i) {
      s += '<path d="M' + p[0] + ' ' + (p[1] - 11) + ' Q' + (p[0] + 2) + ' ' + (p[1] - 2) + ' ' + (p[0] + 11) + ' ' + p[1] + ' Q' + (p[0] + 2) + ' ' + (p[1] + 2) + ' ' + p[0] + ' ' + (p[1] + 11) + ' Q' + (p[0] - 2) + ' ' + (p[1] + 2) + ' ' + (p[0] - 11) + ' ' + p[1] + ' Q' + (p[0] - 2) + ' ' + (p[1] - 2) + ' ' + p[0] + ' ' + (p[1] - 11) + 'Z" fill="' + (i % 2 ? '#fff36b' : '#ffffff') + '" class="h-av-spark" style="animation-delay:' + (i * .35) + 's"/>';
    });
    return s;
  }

  /* ---------- פרק 3 — הרכבה ---------- */
  /* מחזיר מחרוזת SVG. opts.className — מחלקה לאלמנט; opts.title — תיאור נגיש */
  function svg(outfit, opts) {
    outfit = outfit || defaultOutfit(); opts = opts || {};
    var id = 'hav' + (++uid) + '_', h = hero(outfit.hero);
    /* opts.look — תצוגה מקדימה של מראה אחר ל"אני" (אשף הפתיחה, בחירת ילדה) */
    if (opts.look && h.id === 'ella' && window.Profile) h = Object.assign({}, h, Profile.lookFor(opts.look));
    var cape = resolve(outfit, 'cape'), suit = resolve(outfit, 'suit'), mask = resolve(outfit, 'mask'),
        emb = item('emblem', outfit.emblem), aura = item('aura', outfit.aura), acc = item('acc', outfit.acc || 'acc_none');
    var capeA = cape.a || '#ff5fb0', capeB = cape.b || '#c2187a';

    var defs = '<defs>' +
      '<linearGradient id="' + id + 'cape" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + capeA + '"/><stop offset="1" stop-color="' + capeB + '"/></linearGradient>' +
      '<linearGradient id="' + id + 'suit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + suit.a + '"/><stop offset="1" stop-color="' + suit.b + '"/></linearGradient>' +
      '<linearGradient id="' + id + 'rain" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff4f7b"/><stop offset=".25" stop-color="#ffb13b"/><stop offset=".5" stop-color="#ffe95c"/><stop offset=".72" stop-color="#4fe0a0"/><stop offset="1" stop-color="#6c7bff"/></linearGradient>' +
      '<radialGradient id="' + id + 'skin" cx="38%" cy="32%" r="72%"><stop offset="0" stop-color="' + shade(h.skin, 24) + '"/><stop offset="1" stop-color="' + h.skin + '"/></radialGradient>' +
      '<radialGradient id="' + id + 'glow"><stop offset="0" stop-color="#fff6b0" stop-opacity=".95"/><stop offset=".5" stop-color="#ff7ec2" stop-opacity=".45"/><stop offset="1" stop-color="#ff7ec2" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="' + id + 'glowC"><stop offset="0" stop-color="#e8fdff" stop-opacity=".95"/><stop offset=".5" stop-color="#29e0ff" stop-opacity=".45"/><stop offset="1" stop-color="#29e0ff" stop-opacity="0"/></radialGradient>' +
      '</defs>';

    if (opts.doctor) return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 300" class="' + (opts.className || 'hero-avatar') + '" role="img" aria-label="' + (opts.title || 'רופאה') + '">' +
      defs + headBack(h, id) + bodyLayer(suit, id, h) + coatLayer(h, id) + headFront(id, h) + mirrorLayer() + '</svg>';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 300" class="' + (opts.className || 'hero-avatar') + '" role="img" aria-label="' + (opts.title || h.name + ' — גיבורת-על') + '">' +
      defs +
      auraLayer(aura, id) +
      capeLayer(cape, id) +
      headBack(h, id) +
      bodyLayer(suit, id, h) +
      emblemLayer(emb) +
      headFront(id, h) +
      maskLayer(mask) +
      accLayer(acc) +
      frontSparkles(aura) +
      '</svg>';
  }

  /* coatLayer — חלוק רופא לבן מעל החליפה: שרוולים, דשים, כיס עם עט, כפתורים, מכשיר שמיעה וכפפות תכולות */
  function coatLayer(h, id) {
    var o = ' stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"', s = '';
    s += '<path d="M96 158 L70 190 L96 214 M144 158 L170 190 L144 214" fill="none" stroke="' + INK + '" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>';
    s += '<path d="M96 158 L70 190 L96 214 M144 158 L170 190 L144 214" fill="none" stroke="#ffffff" stroke-width="17" stroke-linecap="round" stroke-linejoin="round"/>';
    s += '<path d="M86 160 Q86 143 106 141 L134 141 Q154 143 154 160 L158 252 L82 252 Z" fill="#ffffff"' + o + '/>';
    s += '<path d="M106 141 L120 176 L134 141" fill="#e9f3ff"' + o + '/><path d="M120 176 L120 252" fill="none"' + o + '/>';
    s += '<rect x="128" y="192" width="18" height="16" rx="3" fill="#e9f3ff"' + o + '/><path d="M132 194 L132 184" stroke="#ff5fd2" stroke-width="4" stroke-linecap="round"/>';
    s += '<circle cx="113" cy="196" r="3" fill="' + INK + '"/><circle cx="113" cy="216" r="3" fill="' + INK + '"/><circle cx="113" cy="236" r="3" fill="' + INK + '"/>';
    /* מכשיר שמיעה סביב הצוואר */
    s += '<path d="M104 144 Q96 176 110 190 M136 144 Q144 176 130 190" fill="none" stroke="#3d8bff" stroke-width="5" stroke-linecap="round"/>';
    s += '<path d="M110 190 Q120 198 130 190" fill="none" stroke="#3d8bff" stroke-width="5"/><circle cx="120" cy="200" r="8" fill="#c9d4e6"' + o + '/>';
    /* כפפות תכולות */
    s += '<circle cx="96" cy="214" r="10" fill="#bfe9ff"' + o + '/><circle cx="144" cy="214" r="10" fill="#bfe9ff"' + o + '/>';
    return s;
  }
  /* mirrorLayer — מראת רופא עגולה ומבריקה על המצח */
  function mirrorLayer() {
    return '<path d="M78 70 Q120 48 162 70" fill="none" stroke="' + INK + '" stroke-width="6" stroke-linecap="round"/><path d="M78 70 Q120 48 162 70" fill="none" stroke="#ff5fd2" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="120" cy="58" r="14" fill="#dff3ff" stroke="' + INK + '" stroke-width="3.5"/><circle cx="120" cy="58" r="5" fill="#fff"/><path d="M112 52 L116 48" stroke="#fff" stroke-width="3" stroke-linecap="round"/>';
  }

  /* סגנון קטן לאנימציית הניצוצות — מוזרק פעם אחת */
  var st = document.createElement('style');
  st.textContent = '.h-av-spark{transform-box:fill-box;transform-origin:center;animation:h-av-tw 1.8s ease-in-out infinite}' +
    '@keyframes h-av-tw{0%,100%{opacity:.2;transform:scale(.5)}50%{opacity:1;transform:scale(1.15)}}' +
    '@media (prefers-reduced-motion:reduce){.h-av-spark{animation:none}}';
  document.head.appendChild(st);

  /* ---------- ייצוא ---------- */
  window.HeroAvatar = { CATALOG: CATALOG, SLOT_NAMES: SLOT_NAMES, STUDIO: STUDIO, HEROES: HEROES, hero: hero, defaultOutfit: defaultOutfit, item: item, svg: svg, shade: shade };
})();
