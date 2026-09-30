/* =====================================================================
   js/farm-data.js — "החווה של אלה": ציורי החיות (SVG) ונתוני החווה (בלי DOM)
   ---------------------------------------------------------------------
   פרק 1 — ציורי חיות (viewBox 200×200, כפות רגליים בערך ב-y=188): כלבלב, חתולה, תרנגולת, אפרוח,
           פרה, כבשה (עם צמר / גזוזה), ארנבון, ברווז. לכל חיה וריאציות להנפשה:
           o.blink (עיניים עצומות), o.happy (פה פתוח / לשון), o.sleep, o.tail (-1/1 כשכוש), o.scarf (צבע צעיף)
   פרק 2 — החיות בחווה: שם ברירת מחדל, אזור בעולם, צליל ומילה באנגלית
   פרק 3 — משימות הבוקר (3 ביום מתוך 10, לפי התאריך)
   פרק 4 — שוק: מחירי מכירה, וקישוטים לקנייה (עם מיקום בנוף)
   פרק 5 — englishLines(): כל המילים והמשפטים באנגלית ל-tools/gen_voice.py
   window.FARM_BOY = גרסת הבנים ("החווה של איתן")
   ===================================================================== */
(function (root) {
  'use strict';
  var BOY = !!(root && root.FARM_BOY), INK = BOY ? '#101e36' : '#1b1036';
  var S = ' stroke="' + INK + '" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"';
  function svg(inner) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">' + inner + '</svg>'; }
  function shadow(w) { return '<ellipse cx="100" cy="190" rx="' + (w || 60) + '" ry="8" fill="rgba(0,0,0,.16)"/>'; }
  function eyes(x1, x2, y, r, o) {
    if (o.blink || o.sleep) return '<path d="M' + (x1 - r) + ' ' + y + ' Q' + x1 + ' ' + (y + r * .8) + ' ' + (x1 + r) + ' ' + y + ' M' + (x2 - r) + ' ' + y + ' Q' + x2 + ' ' + (y + r * .8) + ' ' + (x2 + r) + ' ' + y + '" fill="none"' + S + '/>';
    return '<circle cx="' + x1 + '" cy="' + y + '" r="' + r + '" fill="' + INK + '"/><circle cx="' + x2 + '" cy="' + y + '" r="' + r + '" fill="' + INK + '"/>' +
      '<circle cx="' + (x1 + r * .35) + '" cy="' + (y - r * .35) + '" r="' + r * .38 + '" fill="#fff"/><circle cx="' + (x2 + r * .35) + '" cy="' + (y - r * .35) + '" r="' + r * .38 + '" fill="#fff"/>';
  }
  function cheeks(x1, x2, y) { return '<ellipse cx="' + x1 + '" cy="' + y + '" rx="9" ry="6" fill="#ff8fc4" opacity=".65"/><ellipse cx="' + x2 + '" cy="' + y + '" rx="9" ry="6" fill="#ff8fc4" opacity=".65"/>'; }
  function scarf(y, col) { return col ? '<path d="M62 ' + y + ' Q100 ' + (y + 16) + ' 138 ' + y + ' L136 ' + (y + 14) + ' Q100 ' + (y + 30) + ' 64 ' + (y + 14) + ' Z" fill="' + col + '"' + S + '/><path d="M112 ' + (y + 18) + ' L118 ' + (y + 44) + ' L130 ' + (y + 40) + ' L124 ' + (y + 16) + ' Z" fill="' + col + '"' + S + '/>' : ''; }

  /* ================= פרק 1 — ציורי חיות ================= */
  var ART = {
    dog: function (o) {
      var c = o.col || '#e8b070', dk = '#9c6b3f', t = (o.tail || 0) * 22;
      return svg(shadow(56) +
        '<g transform="rotate(' + t + ' 136 150)"><path d="M132 150 Q170 138 168 104 Q180 112 176 130 Q170 160 136 162 Z" fill="' + c + '"' + S + '/></g>' +
        '<ellipse cx="100" cy="150" rx="48" ry="38" fill="' + c + '"' + S + '/><ellipse cx="100" cy="160" rx="26" ry="24" fill="#fff3dc"/>' +
        '<ellipse cx="76" cy="186" rx="15" ry="8" fill="' + c + '"' + S + '/><ellipse cx="124" cy="186" rx="15" ry="8" fill="' + c + '"' + S + '/>' +
        '<path d="M52 58 Q30 64 34 104 Q40 118 56 104 Q60 80 66 66 Z" fill="' + dk + '"' + S + '/><path d="M148 58 Q170 64 166 104 Q160 118 144 104 Q140 80 134 66 Z" fill="' + dk + '"' + S + '/>' +
        '<circle cx="100" cy="80" r="46" fill="' + c + '"' + S + '/><ellipse cx="122" cy="62" rx="14" ry="12" fill="' + dk + '" opacity=".55"/>' +
        '<ellipse cx="100" cy="98" rx="26" ry="19" fill="#fff3dc"' + S + '/><ellipse cx="100" cy="88" rx="10" ry="7" fill="' + INK + '"/>' +
        eyes(82, 118, 74, 7, o) + cheeks(70, 130, 92) +
        (o.happy ? '<path d="M88 102 Q100 112 112 102 Q110 126 100 126 Q90 126 88 102 Z" fill="#ff6f91"' + S + '/>' : '<path d="M100 96 L100 104 M100 104 Q92 110 86 106 M100 104 Q108 110 114 106" fill="none"' + S + '/>') +
        '<path d="M66 118 Q100 132 134 118" fill="none" stroke="' + (o.collar || '#ff3b3b') + '" stroke-width="9" stroke-linecap="round"/><circle cx="100" cy="129" r="7" fill="#ffc93c"' + S + '/>' +
        scarf(116, o.scarf));
    },
    cat: function (o) {
      var c = o.col || '#ff9a3c', t = (o.tail || 0) * 16;
      return svg(shadow(52) +
        '<g transform="rotate(' + t + ' 132 160)"><path d="M130 164 Q176 150 168 98 Q164 86 156 98 Q162 142 126 150 Z" fill="' + c + '"' + S + '/></g>' +
        '<ellipse cx="100" cy="152" rx="42" ry="36" fill="' + c + '"' + S + '/><ellipse cx="100" cy="160" rx="22" ry="22" fill="#fff3dc"/>' +
        '<ellipse cx="80" cy="186" rx="13" ry="7" fill="#fff3dc"' + S + '/><ellipse cx="120" cy="186" rx="13" ry="7" fill="#fff3dc"' + S + '/>' +
        '<path d="M56 60 L60 18 L90 44 Z" fill="' + c + '"' + S + '/><path d="M144 60 L140 18 L110 44 Z" fill="' + c + '"' + S + '/><path d="M64 48 L66 30 L80 42 Z M136 48 L134 30 L120 42 Z" fill="#ff8fc4"/>' +
        '<ellipse cx="100" cy="80" rx="48" ry="42" fill="' + c + '"' + S + '/><path d="M86 46 Q100 58 114 46" fill="none" stroke="' + INK + '" stroke-width="4" opacity=".4"/>' +
        eyes(80, 120, 76, 8, o) + cheeks(66, 134, 94) + '<path d="M94 90 L106 90 L100 97 Z" fill="#ff8fc4"' + S + '/>' +
        (o.happy ? '<path d="M100 97 Q94 106 88 102 M100 97 Q106 106 112 102" fill="none"' + S + '/>' : '<path d="M100 97 Q95 103 90 100 M100 97 Q105 103 110 100" fill="none"' + S + '/>') +
        '<path d="M70 92 L42 88 M70 98 L42 102 M130 92 L158 88 M130 98 L158 102" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/>' +
        (o.bow ? '<path d="M100 36 L80 26 L80 46 Z M100 36 L120 26 L120 46 Z" fill="' + o.bow + '"' + S + '/><circle cx="100" cy="36" r="6" fill="' + o.bow + '"' + S + '/>' : '') + scarf(114, o.scarf));
    },
    chicken: function (o) {
      var c = o.col || '#ffffff';
      return svg(shadow(46) +
        '<path d="M94 170 L90 188 M110 170 L114 188 M84 188 L96 188 M106 188 L120 188" stroke="#ff8a3c" stroke-width="6" stroke-linecap="round"/>' +
        '<path d="M40 110 Q30 70 56 86 Q44 60 70 76 Z" fill="' + c + '"' + S + '/>' +
        '<ellipse cx="100" cy="128" rx="58" ry="46" fill="' + c + '"' + S + '/><path d="M72 124 Q98 104 120 130 Q96 150 72 124 Z" fill="#f4efe8"' + S + '/>' +
        '<circle cx="128" cy="74" r="30" fill="' + c + '"' + S + '/><path d="M114 46 Q118 30 126 42 Q132 26 138 42 Q146 32 146 50 Z" fill="#ff3b3b"' + S + '/>' +
        '<path d="M154 72 L176 80 L154 88 Z" fill="#ffc93c"' + S + '/><path d="M150 92 Q156 104 146 106 Q142 96 150 92 Z" fill="#ff3b3b"' + S + '/>' +
        (o.blink || o.sleep ? '<path d="M130 70 Q136 76 142 70" fill="none"' + S + '/>' : '<circle cx="136" cy="70" r="6" fill="' + INK + '"/><circle cx="138" cy="68" r="2.2" fill="#fff"/>') +
        '<ellipse cx="124" cy="86" rx="7" ry="5" fill="#ff8fc4" opacity=".6"/>');
    },
    chick: function (o) {
      return svg(shadow(34) +
        '<path d="M92 170 L90 186 M108 170 L110 186" stroke="#ff8a3c" stroke-width="6" stroke-linecap="round"/>' +
        '<ellipse cx="100" cy="140" rx="42" ry="38" fill="#ffd93c"' + S + '/><circle cx="100" cy="92" r="30" fill="#ffd93c"' + S + '/>' +
        '<path d="M96 66 Q100 52 104 66" fill="none"' + S + '/>' +
        '<path d="M92 98 L108 98 L100 110 Z" fill="#ff8a3c"' + S + '/>' + eyes(88, 112, 88, 5.5, o) + cheeks(80, 120, 100) +
        '<path d="M62 136 Q52 150 66 154 M138 136 Q148 150 134 154" fill="none"' + S + '/>');
    },
    cow: function (o) {
      return svg(shadow(66) +
        '<rect x="46" y="112" width="108" height="66" rx="30" fill="#ffffff"' + S + '/><ellipse cx="74" cy="134" rx="16" ry="12" fill="#2b2b3a"/><ellipse cx="130" cy="150" rx="14" ry="11" fill="#2b2b3a"/>' +
        '<rect x="56" y="170" width="18" height="20" rx="6" fill="#ffffff"' + S + '/><rect x="126" y="170" width="18" height="20" rx="6" fill="#ffffff"' + S + '/>' +
        (o.udder ? '<ellipse cx="100" cy="176" rx="22" ry="12" fill="#ffb3de"' + S + '/>' : '') +
        '<path d="M44 44 Q30 30 38 22 Q46 36 58 44 Z M156 44 Q170 30 162 22 Q154 36 142 44 Z" fill="#e8c9a0"' + S + '/>' +
        '<ellipse cx="42" cy="66" rx="20" ry="11" fill="#ffffff"' + S + '/><ellipse cx="158" cy="66" rx="20" ry="11" fill="#ffffff"' + S + '/>' +
        '<rect x="54" y="36" width="92" height="84" rx="40" fill="#ffffff"' + S + '/><ellipse cx="124" cy="56" rx="14" ry="11" fill="#2b2b3a"/>' +
        '<ellipse cx="100" cy="100" rx="38" ry="24" fill="#ffb3de"' + S + '/><ellipse cx="86" cy="100" rx="5" ry="7" fill="' + INK + '"/><ellipse cx="114" cy="100" rx="5" ry="7" fill="' + INK + '"/>' +
        eyes(80, 120, 68, 7, o) + (o.bell !== false ? '<circle cx="100" cy="130" r="9" fill="#ffc93c"' + S + '/>' : '') + scarf(118, o.scarf));
    },
    sheep: function (o) {
      var wool = o.shorn ? '<ellipse cx="100" cy="140" rx="46" ry="36" fill="#ffd9e4"' + S + '/>' :
        '<path d="M44 140 Q30 120 50 108 Q52 86 76 92 Q88 74 108 86 Q130 76 140 96 Q164 100 158 124 Q174 140 156 156 Q154 178 128 172 Q112 186 94 174 Q72 184 62 166 Q38 164 44 140 Z" fill="' + (o.wool || '#ffffff') + '"' + S + '/>';
      return svg(shadow(56) +
        '<rect x="70" y="160" width="14" height="28" rx="5" fill="#3a3040"' + S + '/><rect x="116" y="160" width="14" height="28" rx="5" fill="#3a3040"' + S + '/>' + wool +
        '<ellipse cx="66" cy="70" rx="16" ry="9" fill="#9aa0ab"' + S + ' transform="rotate(-20 66 70)"/><ellipse cx="134" cy="70" rx="16" ry="9" fill="#9aa0ab"' + S + ' transform="rotate(20 134 70)"/>' +
        '<ellipse cx="100" cy="82" rx="30" ry="36" fill="#9aa0ab"' + S + '/>' +
        (o.shorn ? '' : '<path d="M76 56 Q82 40 96 48 Q104 36 114 48 Q126 44 124 58 Q100 52 76 56 Z" fill="' + (o.wool || '#ffffff') + '"' + S + '/>') +
        eyes(88, 112, 80, 6, o) + '<path d="M92 102 Q100 108 108 102" fill="none"' + S + '/>' + cheeks(78, 122, 96) + scarf(112, o.scarf));
    },
    bunny: function (o) {
      var c = o.col || '#ffffff';
      /* מוקטן מעט ומוזז למטה — שהאוזניים הארוכות ייכנסו למסגרת */
      return svg(shadow(40) + '<g transform="translate(8 18) scale(.92)">' +
        '<ellipse cx="80" cy="22" rx="13" ry="36" fill="' + c + '"' + S + ' transform="rotate(-8 80 60)"/><ellipse cx="120" cy="22" rx="13" ry="36" fill="' + c + '"' + S + ' transform="rotate(8 120 60)"/>' +
        '<ellipse cx="80" cy="24" rx="6" ry="24" fill="#ff8fc4" transform="rotate(-8 80 60)"/><ellipse cx="120" cy="24" rx="6" ry="24" fill="#ff8fc4" transform="rotate(8 120 60)"/>' +
        '<ellipse cx="100" cy="150" rx="40" ry="38" fill="' + c + '"' + S + '/><circle cx="140" cy="164" r="12" fill="#ffffff"' + S + '/>' +
        '<ellipse cx="82" cy="186" rx="14" ry="7" fill="' + c + '"' + S + '/><ellipse cx="118" cy="186" rx="14" ry="7" fill="' + c + '"' + S + '/>' +
        '<circle cx="100" cy="92" r="36" fill="' + c + '"' + S + '/>' + eyes(86, 114, 88, 6, o) + cheeks(76, 124, 102) +
        '<path d="M95 100 L105 100 L100 106 Z" fill="#ff5ca8"/>' + (o.happy ? '<path d="M94 110 Q100 116 106 110" fill="none"' + S + '/><rect x="96" y="108" width="8" height="8" rx="2" fill="#fff"' + S.replace('5"', '2.5"') + '/>' : '<path d="M100 106 L100 112" fill="none"' + S + '/>') + '</g>');
    },
    duck: function (o) {
      return svg('<ellipse cx="100" cy="170" rx="62" ry="10" fill="rgba(255,255,255,.35)"/>' +
        '<path d="M40 138 Q40 110 80 112 L130 112 Q160 112 160 140 Q150 170 100 170 Q46 170 40 138 Z" fill="#ffffff"' + S + '/>' +
        '<path d="M70 130 Q96 116 118 136 Q96 152 70 130 Z" fill="#f4efe8"' + S + '/>' +
        '<circle cx="136" cy="84" r="26" fill="#2fb85a"' + S + '/><path d="M158 84 L182 90 L158 98 Z" fill="#ff8a3c"' + S + '/><rect x="116" y="104" width="30" height="10" rx="4" fill="#ffffff"' + S + '/>' +
        (o.blink ? '<path d="M136 80 Q142 86 148 80" fill="none"' + S + '/>' : '<circle cx="144" cy="80" r="5" fill="' + INK + '"/>'));
    }
  };

  /* ================= פרק 2 — החיות ================= */
  /* [סוג, שם ברירת מחדל (בנות / בנים), צליל באנגלית, מילה באנגלית, שם בעברית] */
  var ANIMALS = {
    dog: [BOY ? 'רקס' : 'שוקו', 'Woof!', 'dog', 'כלבלב'], cat: [BOY ? 'טייגר' : 'מיצי', 'Meow!', 'cat', BOY ? 'חתול' : 'חתולה'], cow: [BOY ? 'בולי' : 'מילקי', 'Moo!', 'cow', 'פרה'],
    sheep: [BOY ? 'צמרי' : 'צמרית', 'Baa!', 'sheep', 'כבשה'], bunny: [BOY ? 'קופץ' : 'פוצי', 'Hop hop!', 'rabbit', 'ארנבון'], chicken: [BOY ? 'קוקי' : 'תרנגולת', 'Cluck!', 'chicken', 'תרנגולת'], duck: ['גאגא', 'Quack!', 'duck', 'ברווז']
  };
  var TRICKS = [['sit', '🐕', 'שב', 'Sit!'], ['paw', '🐾', 'תן יד', 'Paw!'], ['roll', '🌀', 'התגלגל', 'Roll over!'], ['jump', '⬆️', 'קפוץ', 'Jump!']];
  var CROPS = { carrot: ['🥕', 'גזר', 'carrot'], tomato: ['🍅', 'עגבנייה', 'tomato'], strawberry: ['🍓', 'תות', 'strawberry'], flower: ['🌷', 'פרח', 'flower'] };

  /* ================= פרק 3 — משימות הבוקר ================= */
  /* [מזהה, אירוע, כמה פעמים, טקסט] */
  var CHORES = [['eggs', 'egg', 5, 'לאסוף 5 ביצים בלול 🥚'], ['milk', 'milk', 1, 'לחלוב את הפרה 🥛'], ['shear', 'wool', 1, 'לגזוז את הכבשה 🐑'], ['water', 'water', 3, 'להשקות 3 ערוגות בגינה 💧'],
    ['harvest', 'harvest', 2, 'לקטוף 2 ירקות 🥕'], ['petcat', 'petcat', 1, BOY ? 'ללטף את החתול עד שהוא מגרגר 🐱' : 'ללטף את החתולה עד שהיא מגרגרת 🐱'], ['fetch', 'fetch', 3, 'לזרוק לכלבלב כדור 3 פעמים 🟡'],
    ['trick', 'trick', 2, 'לתרגל עם הכלבלב 2 טריקים 🐕'], ['ducks', 'ducks', 1, 'להאכיל את הברווזים 🦆'], ['bunny', 'bunny', 1, 'למצוא לארנבון את הגזר המוחבא 🐰']];
  function choresFor(dayKey) { var h = 0; for (var i = 0; i < dayKey.length; i++) h = (h * 31 + dayKey.charCodeAt(i)) >>> 0; var pool = CHORES.slice(), out = []; while (out.length < 3) { h = (h * 1103515245 + 12345) >>> 0; out.push(pool.splice(h % pool.length, 1)[0]); } return out; }

  /* ================= פרק 4 — שוק וקישוטים ================= */
  var PRICES = { egg: 1, milk: 3, wool: 4, cheese: 6, carrot: 2, tomato: 2, strawberry: 3, flower: 2 };
  var GOODS = { egg: ['🥚', 'ביצים'], milk: ['🥛', 'חלב'], wool: ['🧶', 'צמר'], cheese: ['🧀', 'גבינה'], carrot: ['🥕', 'גזר'], tomato: ['🍅', 'עגבניות'], strawberry: ['🍓', 'תותים'], flower: ['🌷', 'פרחים'] };
  /* קישוטים: [מזהה, אימוג'י, שם, מחיר, x בעולם] */
  /* מיקומים: פרחים בין הגינה למלונה, בלונים ליד הבית, דחליל ליד הלול, טחנה בין הדיר לרפת,
     והשאר ב"גן הקסום" (x 3850–4350) */
  var DECO = [['flowers', '🌸', 'ערוגת פרחים', 10, 2890], ['balloons', '🎈', 'בלונים', 12, 3578], ['scarecrow', '🎃', 'דחליל', 15, 1992], ['swing', '🪢', 'נדנדה', 20, 3990],
    ['fence', '🌈', 'גדר צבעונית', 15, 3890], ['fountain', '⛲', 'מזרקה', 30, 4140], ['windmill', '🌬️', 'טחנת רוח', 40, 1128], ['treehouse', '🏡', 'בית עץ', 50, 4290]];

  /* ================= פרק 5 — שורות לקול ================= */
  function englishLines() {
    var out = ['Good dog!', 'Good kitty!', 'Fetch!', 'egg', 'eggs', 'milk', 'wool', 'cheese', 'farm', 'Good morning, farm!', 'Good night, farm!', 'water', 'seed', 'barn', 'pond', 'Hop hop!', 'bread'];
    Object.keys(ANIMALS).forEach(function (k) { out.push(ANIMALS[k][1], ANIMALS[k][2]); });
    TRICKS.forEach(function (t) { out.push(t[3]); });
    Object.keys(CROPS).forEach(function (k) { out.push(CROPS[k][2]); });
    return out;
  }

  root.FarmData = { ART: ART, ANIMALS: ANIMALS, TRICKS: TRICKS, CROPS: CROPS, CHORES: CHORES, choresFor: choresFor, PRICES: PRICES, GOODS: GOODS, DECO: DECO, englishLines: englishLines, BOY: BOY, INK: INK };
})(typeof window !== 'undefined' ? window : this);
