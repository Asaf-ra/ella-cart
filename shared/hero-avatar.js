/* =====================================================================
   shared/hero-avatar.js — אלה גיבורת-העל: ציור הדמות כ-SVG בשכבות
   ---------------------------------------------------------------------
   פרק 1 — קטלוג פריטים: לכל "חריץ" (גלימה / חליפה / מסכה / סמל / כוח)
           יש רשימת פריטים. הפריט הראשון בכל חריץ הוא ברירת המחדל.
   פרק 2 — שכבות הציור (מאחור לפנים): כוח → גלימה → רגליים → גוף →
           ידיים → סמל → ראש → מסכה → ניצוצות קדמיים.
   פרק 3 — HeroAvatar.svg(outfit) מחזיר מחרוזת SVG מוכנה להזרקה.
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
      { id: 'cape_rainbow', name: 'גלימת קשת',      ico: '🌈', rainbow: true }
    ],
    suit: [
      { id: 'suit_magenta', name: 'חליפת מג׳נטה',  ico: '💗', a: '#ff4fa3', b: '#b3126b', boot: '#ffc93c' },
      { id: 'suit_cyan',    name: 'חליפת אוקיינוס', ico: '🌊', a: '#3fd8ff', b: '#1673c9', boot: '#ffffff' },
      { id: 'suit_night',   name: 'חליפת לילה',    ico: '🌙', a: '#8b5cff', b: '#3a1177', boot: '#ffc93c' },
      { id: 'suit_mint',    name: 'חליפת טבע',     ico: '🍀', a: '#3ff2b0', b: '#139b6c', boot: '#ff7ec2' }
    ],
    mask: [
      { id: 'mask_classic',   name: 'מסכה קלאסית',   ico: '🎭', color: '#ff2e93' },
      { id: 'mask_star',      name: 'מסכת כוכב',     ico: '⭐', color: '#ffc93c', star: true },
      { id: 'mask_butterfly', name: 'מסכת פרפר',     ico: '🦋', color: '#8b5cff', butterfly: true },
      { id: 'mask_cat',       name: 'מסכת חתולה',    ico: '🐱', color: '#29c5ff', cat: true }
    ],
    emblem: [
      { id: 'emb_heart',     name: 'סמל הלב',     ico: '❤️', kind: 'heart' },
      { id: 'emb_star',      name: 'סמל הכוכב',   ico: '🌟', kind: 'star' },
      { id: 'emb_bolt',      name: 'סמל הברק',    ico: '⚡', kind: 'bolt' },
      { id: 'emb_butterfly', name: 'סמל הפרפר',   ico: '🦋', kind: 'butterfly' }
    ],
    aura: [
      { id: 'aura_none',    name: 'בלי כוח',          ico: '✖️', kind: 'none' },
      { id: 'aura_sparkle', name: 'כוח הנצנוץ',       ico: '✨', kind: 'sparkle' },
      { id: 'aura_bolt',    name: 'כוח הברק',         ico: '🌩️', kind: 'bolt' },
      { id: 'aura_wings',   name: 'כנפי קשת — טיסה',  ico: '🪽', kind: 'wings' },
      { id: 'aura_shield',  name: 'מגן הכוכבים',      ico: '🛡️', kind: 'shield' }
    ]
  };

  /* שמות החריצים בעברית — לארון התחפושות */
  var SLOT_NAMES = { cape: 'גלימות', suit: 'חליפות', mask: 'מסכות', emblem: 'סמלים', aura: 'כוחות' };

  /* ברירת מחדל: הפריט הראשון בכל חריץ */
  function defaultOutfit() {
    return { cape: 'cape_pink', suit: 'suit_magenta', mask: 'mask_classic', emblem: 'emb_heart', aura: 'aura_none' };
  }

  /* מחפש פריט לפי id בתוך חריץ; אם לא נמצא — מחזיר את ברירת המחדל */
  function item(slot, id) {
    var list = CATALOG[slot];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return list[0];
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
    if (c.stars) {
      s += '<circle cx="70" cy="250" r="2.5" fill="#fff"/><circle cx="170" cy="236" r="3" fill="#fff"/><circle cx="150" cy="268" r="2" fill="#fff"/><circle cx="90" cy="210" r="2" fill="#fff"/><circle cx="182" cy="262" r="2" fill="#fff"/>';
    }
    return s;
  }

  /* 2.3 גוף: רגליים, מגפיים, חליפה, חגורה, ידיים על המותניים */
  function bodyLayer(su, id) {
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
    s += '<rect x="112" y="128" width="16" height="20" rx="7" fill="' + SKIN_D + '" stroke="' + INK + '" stroke-width="3"/>';
    return s;
  }

  /* 2.4 סמל על החזה בתוך עיגול */
  function emblemLayer(e) {
    var cx = 120, cy = 182, s = '<circle cx="' + cx + '" cy="' + cy + '" r="17" fill="#fffaf0" stroke="' + INK + '" stroke-width="3.5"/>';
    if (e.kind === 'heart') s += '<path d="M120 192 C104 182 108 170 115 170 C118 170 120 173 120 175 C120 173 122 170 125 170 C132 170 136 182 120 192 Z" fill="#ff2e93" stroke="' + INK + '" stroke-width="2"/>';
    if (e.kind === 'star') s += starPath(cx, cy + 1, 12, 5, '#ffc93c');
    if (e.kind === 'bolt') s += '<path d="M123 168 L111 185 L119 185 L115 197 L130 178 L122 178 Z" fill="#ffe14d" stroke="' + INK + '" stroke-width="2" stroke-linejoin="round"/>';
    if (e.kind === 'butterfly') s += '<path d="M120 182 C112 170 104 172 106 180 C107 186 114 186 120 183 C114 186 108 192 112 195 C116 197 119 190 120 186 C121 190 124 197 128 195 C132 192 126 186 120 183 C126 186 133 186 134 180 C136 172 128 170 120 182 Z" fill="#8b5cff" stroke="' + INK + '" stroke-width="2"/>';
    return s;
  }

  /* 2.5 ראש: שיער מאחור (קוקו מתנופף), פנים, פוני */
  function headBack() {
    /* קוקו מתנופף ברוח */
    return '<path d="M150 80 C190 70 214 96 206 128 C200 150 184 150 178 140 C188 128 186 106 160 104 Z" fill="' + HAIR + '" stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round"/>' +
           '<path d="M72 96 Q66 150 88 156 L90 112 Z" fill="' + HAIR + '" stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round"/>';
  }
  function headFront(id) {
    var s = '';
    s += '<circle cx="120" cy="98" r="46" fill="url(#' + id + 'skin)" stroke="' + INK + '" stroke-width="4"/>';
    /* פוני + שיער עליון */
    s += '<path d="M74 96 Q70 50 120 48 Q170 50 166 96 Q160 74 138 70 Q128 82 110 78 Q96 74 88 80 Q78 86 74 96 Z" fill="' + HAIR + '" stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round"/>';
    s += '<path d="M96 60 Q110 54 126 56" stroke="#fff3c4" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>';
    /* לחיים + חיוך */
    s += '<circle cx="96" cy="118" r="7" fill="#ff9eb0" opacity=".75"/><circle cx="144" cy="118" r="7" fill="#ff9eb0" opacity=".75"/>';
    s += '<path d="M106 122 Q120 136 134 122" fill="#fff" stroke="' + INK + '" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>';
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
    if (m.butterfly) { /* כנפי פרפר גדולות במקום מסכה */
      s += '<path d="M120 100 C104 78 70 72 72 96 C74 114 100 114 120 106 C140 114 166 114 168 96 C170 72 136 78 120 100 Z" fill="' + m.color + '" stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round"/>';
    } else {
      s += '<path d="M76 96 Q84 84 104 88 Q120 94 136 88 Q156 84 164 96 Q160 112 140 112 Q126 110 120 104 Q114 110 100 112 Q80 112 76 96 Z" fill="' + m.color + '" stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round"/>';
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

  /* 2.7 ניצוצות קדמיים לכוח הנצנוץ */
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
    var id = 'hav' + (++uid) + '_';
    var cape = item('cape', outfit.cape), suit = item('suit', outfit.suit), mask = item('mask', outfit.mask),
        emb = item('emblem', outfit.emblem), aura = item('aura', outfit.aura);
    var capeA = cape.a || '#ff5fb0', capeB = cape.b || '#c2187a';

    var defs = '<defs>' +
      '<linearGradient id="' + id + 'cape" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + capeA + '"/><stop offset="1" stop-color="' + capeB + '"/></linearGradient>' +
      '<linearGradient id="' + id + 'suit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + suit.a + '"/><stop offset="1" stop-color="' + suit.b + '"/></linearGradient>' +
      '<linearGradient id="' + id + 'rain" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff4f7b"/><stop offset=".25" stop-color="#ffb13b"/><stop offset=".5" stop-color="#ffe95c"/><stop offset=".72" stop-color="#4fe0a0"/><stop offset="1" stop-color="#6c7bff"/></linearGradient>' +
      '<radialGradient id="' + id + 'skin" cx="38%" cy="32%" r="72%"><stop offset="0" stop-color="#ffeedd"/><stop offset="1" stop-color="' + SKIN + '"/></radialGradient>' +
      '<radialGradient id="' + id + 'glow"><stop offset="0" stop-color="#fff6b0" stop-opacity=".95"/><stop offset=".5" stop-color="#ff7ec2" stop-opacity=".45"/><stop offset="1" stop-color="#ff7ec2" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="' + id + 'glowC"><stop offset="0" stop-color="#e8fdff" stop-opacity=".95"/><stop offset=".5" stop-color="#29e0ff" stop-opacity=".45"/><stop offset="1" stop-color="#29e0ff" stop-opacity="0"/></radialGradient>' +
      '</defs>';

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 300" class="' + (opts.className || 'hero-avatar') + '" role="img" aria-label="' + (opts.title || 'אלה גיבורת-העל') + '">' +
      defs +
      auraLayer(aura, id) +
      capeLayer(cape, id) +
      headBack() +
      bodyLayer(suit, id) +
      emblemLayer(emb) +
      headFront(id) +
      maskLayer(mask) +
      frontSparkles(aura) +
      '</svg>';
  }

  /* סגנון קטן לאנימציית הניצוצות — מוזרק פעם אחת */
  var st = document.createElement('style');
  st.textContent = '.h-av-spark{transform-box:fill-box;transform-origin:center;animation:h-av-tw 1.8s ease-in-out infinite}' +
    '@keyframes h-av-tw{0%,100%{opacity:.2;transform:scale(.5)}50%{opacity:1;transform:scale(1.15)}}' +
    '@media (prefers-reduced-motion:reduce){.h-av-spark{animation:none}}';
  document.head.appendChild(st);

  /* ---------- ייצוא ---------- */
  window.HeroAvatar = { CATALOG: CATALOG, SLOT_NAMES: SLOT_NAMES, defaultOutfit: defaultOutfit, item: item, svg: svg };
})();
