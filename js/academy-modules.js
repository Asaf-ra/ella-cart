/* =====================================================================
   js/academy-modules.js — אקדמיית הגיבורים: כל התחנות, 5 פרקים בכל רמה
   ---------------------------------------------------------------------
   המבנה: CHAPTERS[תחנה][רמה] = 5 פרקים { n: שם, f: פונקציית סבב }.
   הדף (learning.html) בוחר פרק ומריץ את f(api). כל פרק = 3 כוכבים.

   פרק 0 — חוזה ה-api ועוזרים (Q: שאלה רב-ברירה בשורה אחת)
   פרק 1 — כלי שמע (תווים, כלים, תיפופים)
   פרק 2 — מאגרי תוכן (אותיות, מילים באנגלית, חיות, אוכל, טבע…)
   פרק 3 — מחוללי שאלות לפי נושא (מספרים, צבעים, צורות, דפוסים,
           אותיות, אנגלית, מילים, גודל, חשבון, מוזיקה, טבע)
   פרק 4 — משחק זיכרון (זוגות זהים / אות↔תמונה / מספר↔נקודות)
   פרק 5 — טבלת הפרקים של כל התחנות
   פרק 6 — ייצוא
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- פרק 0 — api ועוזרים ----------
     api.el · api.answer(html, ok, cls, color) · api.setRound({speak, read, success, replay})
     api.random · api.shuffle · api.choicesFor · api.big() · api.chapter()
     api.win(origin, text, speech) · api.feedback(cls, text) · api.say · api.sound · api.read(parts) */

  /* מספר שלם אקראי בין a ל-b (כולל) */
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  /* ערבוב מערך (עותק) */
  function mix(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  /* בחירה אקראית */
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  /* 4 אפשרויות מספריות קרובות לתשובה (בלי כפילויות) */
  function nums(correct, spread, min, max) {
    var set = [correct], g = 0; min = min == null ? 0 : min; max = max == null ? 1e9 : max;
    while (set.length < 4 && g++ < 300) { var v = correct + rnd(-spread, spread); if (v >= min && v <= max && set.indexOf(v) < 0) set.push(v); }
    return mix(set);
  }
  /* 3 מסיחים שונים מהתשובה מתוך מאגר */
  function others(pool, correct, n, same) {
    same = same || function (a, b) { return a === b; };
    return mix(pool.filter(function (x) { return !same(x, correct); })).slice(0, n || 3);
  }

  /* Q — שאלה רב-ברירה: מגדיר הוראה, רמז, מטרה ותשובות בבת אחת
     cfg: { ins, help, speak, success, read, replay, target, tcls, opts:[{h, ok, cls, color}], acls } */
  function Q(api, cfg) {
    var el = api.el;
    /* q — חלקים שמוקראים יחד עם השאלה (למשל המילה באנגלית שצריך לזהות) — לא התשובה */
    api.setRound({ speak: cfg.speak || cfg.ins, success: cfg.success, read: cfg.read, replay: cfg.replay, q: cfg.q });
    el.instruction.textContent = cfg.ins;
    el.helper.textContent = cfg.help || '';
    el.target.className = 'target' + (cfg.tcls ? ' ' + cfg.tcls : '');
    el.target.innerHTML = cfg.target || '';
    if (cfg.acls) el.answers.classList.add(cfg.acls);
    cfg.opts.forEach(function (o) { api.answer(o.h, !!o.ok, o.cls, o.color); });
  }
  /* תווית תשובה טקסטואלית */
  function L(t, extra) { return '<span class="answer-label"' + (extra || '') + '>' + t + '</span>'; }
  /* אימוג'י גדול בתשובה */
  function BIG(e) { return '<span style="font-size:1.25em;line-height:1">' + e + '</span>'; }

  /* ---------- פרק 1 — כלי שמע ---------- */
  var Audio = {
    ctx: function () { return window.Sound && Sound.getCtx ? Sound.getCtx() : null; },
    out: function () { var c = this.ctx(); return (window.Sound && Sound.getBus && Sound.getBus()) || (c && c.destination); },
    on: function () { return !window.Sound || Sound.isOn(); },
    /* תו בודד עם מעטפת; opts.slide — גלישה, opts.vibrato — ויברטו, opts.attack */
    note: function (freq, start, dur, type, vol, opts) {
      var c = this.ctx(); if (!c || !this.on()) return;
      opts = opts || {};
      var t = c.currentTime + (start || 0), o = c.createOscillator(), g = c.createGain();
      o.type = type || 'triangle';
      o.frequency.setValueAtTime(freq, t);
      if (opts.slide) o.frequency.exponentialRampToValueAtTime(opts.slide, t + dur);
      if (opts.vibrato) { var l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 6; lg.gain.value = freq * .012; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + .05); }
      g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || .2, t + (opts.attack || .01));
      g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g); g.connect(this.out());
      o.start(t); o.stop(t + dur + .05);
    },
    /* תיפוף (בום נמוך) */
    drum: function (start) { this.note(160, start, .28, 'sine', .5, { slide: 45 }); },
    /* קירוב קולי לכלי נגינה */
    instrument: function (k) {
      var s = this;
      if (k === 'drum') [0, .3, .6, .75].forEach(function (t) { s.drum(t); });
      if (k === 'piano') [523, 659, 784, 1046].forEach(function (f, i) { s.note(f, i * .18, .6, 'triangle', .25); });
      if (k === 'guitar') [330, 392, 494, 659].forEach(function (f, i) { s.note(f, i * .14, .5, 'sawtooth', .12); });
      if (k === 'trumpet') [523, 523, 659, 784].forEach(function (f, i) { s.note(f, i * .2, .22, 'square', .1, { attack: .04 }); });
      if (k === 'violin') [659, 587, 523].forEach(function (f, i) { s.note(f, i * .45, .5, 'sawtooth', .09, { attack: .12, vibrato: true }); });
      if (k === 'sax') [294, 349, 392, 349].forEach(function (f, i) { s.note(f, i * .24, .3, 'square', .09, { attack: .05, vibrato: true }); });
      if (k === 'bell') [1318, 1568, 2093].forEach(function (f, i) { s.note(f, i * .3, 1.2, 'sine', .18); });
    },
    /* מקצב: רשימת זמנים → תיפופים */
    rhythm: function (times) { var s = this; times.forEach(function (t) { s.drum(t); }); }
  };

  /* ---------- פרק 2 — מאגרי תוכן ---------- */
  var FRUITS = ['🍎', '🍓', '🍊', '🍒', '🍇', '🍌', '⭐', '🎈', '🐥', '🦋'];
  var NUMBER_WORDS = ['אפס', 'אחד', 'שניים', 'שלושה', 'ארבעה', 'חמישה', 'שישה', 'שבעה', 'שמונה', 'תשעה', 'עשרה'];

  /* אותיות עבריות: אות, שם (להקראה), מילה, אימוג'י */
  var HE = [
    ['א', 'אָלֶף', 'אריה', '🦁'], ['ב', 'בֵּית', 'בלון', '🎈'], ['ג', 'גִּימֶל', 'גמל', '🐪'], ['ד', 'דָּלֶת', 'דג', '🐟'], ['ה', 'הֵא', 'הר', '⛰️'],
    ['ו', 'וָו', 'ורד', '🌹'], ['ז', 'זַיִן', 'זברה', '🦓'], ['ח', 'חֵית', 'חתול', '🐱'], ['ט', 'טֵית', 'טווס', '🦚'], ['י', 'יוּד', 'יד', '✋'],
    ['כ', 'כַּף', 'כלב', '🐶'], ['ל', 'לָמֶד', 'לב', '❤️'], ['מ', 'מֵם', 'מפתח', '🔑'], ['נ', 'נוּן', 'נר', '🕯️'], ['ס', 'סָמֶךְ', 'סוס', '🐴'],
    ['ע', 'עַיִן', 'ענבים', '🍇'], ['פ', 'פֵּא', 'פרפר', '🦋'], ['צ', 'צָדִי', 'צפרדע', '🐸'], ['ק', 'קוּף', 'קוף', '🐒'], ['ר', 'רֵישׁ', 'רכבת', '🚂'],
    ['ש', 'שִׁין', 'שמש', '☀️'], ['ת', 'תָּו', 'תפוח', '🍎']
  ];
  /* משפטים קצרים לקריאה */
  var SENTENCES = [['הַחָתוּל יָשֵׁן', '😴🐱'], ['הַכֶּלֶב רָץ', '🐶💨'], ['הַשֶּׁמֶשׁ זוֹרַחַת', '☀️'], ['אֲנִי אוֹכֶלֶת תַּפּוּחַ', '🍎'], ['הַדָּג שׂוֹחֶה', '🐟'], ['יֵשׁ לִי בָּלוֹן', '🎈'], ['הַצִּפּוֹר עָפָה', '🐦'], ['יוֹרֵד גֶּשֶׁם', '🌧️']];

  /* אנגלית: אות, מילה, אימוג'י (בלי X — אין מילה פשוטה עם תמונה ברורה) */
  var EN = [
    ['A', 'Apple', '🍎'], ['B', 'Ball', '⚽'], ['C', 'Cat', '🐱'], ['D', 'Dog', '🐶'], ['E', 'Egg', '🥚'], ['F', 'Fish', '🐟'], ['G', 'Grapes', '🍇'],
    ['H', 'House', '🏠'], ['I', 'Ice cream', '🍦'], ['J', 'Juice', '🧃'], ['K', 'Key', '🔑'], ['L', 'Lion', '🦁'], ['M', 'Moon', '🌙'], ['N', 'Nose', '👃'],
    ['O', 'Octopus', '🐙'], ['P', 'Pig', '🐷'], ['Q', 'Queen', '👸'], ['R', 'Rainbow', '🌈'], ['S', 'Sun', '☀️'], ['T', 'Tree', '🌳'], ['U', 'Umbrella', '☂️'],
    ['V', 'Violin', '🎻'], ['W', 'Whale', '🐋'], ['Y', 'Yo-yo', '🪀'], ['Z', 'Zebra', '🦓']
  ];
  var EN_NUMBERS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  var EN_SENT = [['I see a cat', '🐱'], ['The sun is hot', '☀️'], ['I like apples', '🍎'], ['The dog can run', '🐶'], ['I have a red ball', '⚽'], ['The fish can swim', '🐟'], ['It is raining', '🌧️'], ['I love my mom', '❤️']];

  /* קבוצות מילים (אימוג'י, עברית, אנגלית) */
  var ANIMALS = {
    pets: [['🐶', 'כלב', 'Dog'], ['🐱', 'חתול', 'Cat'], ['🐰', 'ארנב', 'Rabbit'], ['🐹', 'אוגר', 'Hamster'], ['🐟', 'דג', 'Fish'], ['🐦', 'ציפור', 'Bird']],
    farm: [['🐄', 'פרה', 'Cow'], ['🐷', 'חזיר', 'Pig'], ['🐔', 'תרנגולת', 'Chicken'], ['🐑', 'כבשה', 'Sheep'], ['🐴', 'סוס', 'Horse'], ['🦆', 'ברווז', 'Duck']],
    jungle: [['🦁', 'אריה', 'Lion'], ['🐘', 'פיל', 'Elephant'], ['🐒', 'קוף', 'Monkey'], ['🦒', 'ג׳ירפה', 'Giraffe'], ['🐯', 'נמר', 'Tiger'], ['🦓', 'זברה', 'Zebra']],
    sea: [['🐬', 'דולפין', 'Dolphin'], ['🐋', 'לוויתן', 'Whale'], ['🦈', 'כריש', 'Shark'], ['🐙', 'תמנון', 'Octopus'], ['🐢', 'צב', 'Turtle'], ['🦀', 'סרטן', 'Crab']]
  };
  var FOODS = {
    fruit: [['🍎', 'תפוח', 'Apple'], ['🍌', 'בננה', 'Banana'], ['🍓', 'תות', 'Strawberry'], ['🍇', 'ענבים', 'Grapes'], ['🍉', 'אבטיח', 'Watermelon'], ['🍊', 'תפוז', 'Orange']],
    veg: [['🥕', 'גזר', 'Carrot'], ['🥒', 'מלפפון', 'Cucumber'], ['🍅', 'עגבנייה', 'Tomato'], ['🌽', 'תירס', 'Corn'], ['🥦', 'ברוקולי', 'Broccoli'], ['🥔', 'תפוח אדמה', 'Potato']],
    meal: [['🍕', 'פיצה', 'Pizza'], ['🍞', 'לחם', 'Bread'], ['🧀', 'גבינה', 'Cheese'], ['🥚', 'ביצה', 'Egg'], ['🍝', 'פסטה', 'Pasta'], ['🥞', 'פנקייק', 'Pancakes']],
    sweet: [['🍪', 'עוגייה', 'Cookie'], ['🍰', 'עוגה', 'Cake'], ['🍦', 'גלידה', 'Ice cream'], ['🍫', 'שוקולד', 'Chocolate'], ['🥛', 'חלב', 'Milk'], ['🧃', 'מיץ', 'Juice']]
  };
  function all(groups) { var a = []; Object.keys(groups).forEach(function (k) { a = a.concat(groups[k]); }); return a; }

  /* צבעים */
  var COLORS = [['אדום', '#ff4d5e', 'Red'], ['כחול', '#3d8bff', 'Blue'], ['צהוב', '#ffd54f', 'Yellow'], ['ירוק', '#3fcf7a', 'Green'],
                ['כתום', '#ff9a3c', 'Orange'], ['סגול', '#9b5cff', 'Purple'], ['ורוד', '#ff8fc4', 'Pink'], ['חום', '#9c6b3f', 'Brown']];
  var COLOR_OBJ = [['🍎', 'אדום'], ['🍓', 'אדום'], ['🍌', 'צהוב'], ['🌻', 'צהוב'], ['🥦', 'ירוק'], ['🐸', 'ירוק'], ['🐳', 'כחול'], ['🫐', 'כחול'], ['🍊', 'כתום'], ['🥕', 'כתום'], ['🍇', 'סגול'], ['🦩', 'ורוד'], ['🐷', 'ורוד'], ['🐻', 'חום']];
  var MIXES = [['אדום', 'צהוב', 'כתום'], ['כחול', 'צהוב', 'ירוק'], ['אדום', 'כחול', 'סגול'], ['אדום', 'לבן', 'ורוד'], ['שחור', 'לבן', 'אפור']];
  var CHEX = { 'אדום': '#ff4d5e', 'כחול': '#3d8bff', 'צהוב': '#ffd54f', 'ירוק': '#3fcf7a', 'כתום': '#ff9a3c', 'סגול': '#9b5cff', 'ורוד': '#ff8fc4', 'חום': '#9c6b3f', 'לבן': '#ffffff', 'שחור': '#2b2b3a', 'אפור': '#9aa0ad' };
  function sw(name) { return '<span class="answer-swatch" style="background:' + CHEX[name] + '"></span>'; }

  /* צורות */
  var SHAPES = [['עיגול', 'circle', 0], ['ריבוע', 'square', 4], ['משולש', 'triangle', 3], ['כוכב', 'star', 10], ['לב', 'heart', 0]];
  var POLYS = [['משולש', 3], ['ריבוע', 4], ['מחומש', 5], ['משושה', 6], ['מתומן', 8]];
  var SHAPE_WORLD = [['🍕', 'משולש'], ['⚽', 'עיגול'], ['🎁', 'ריבוע'], ['⭐', 'כוכב'], ['❤️', 'לב'], ['🍩', 'עיגול'], ['🧀', 'משולש'], ['🖼️', 'ריבוע']];
  var SOLIDS = [['כדור', '⚽'], ['קובייה', '🎲'], ['גליל', '🥫'], ['חרוט', '🍦'], ['פירמידה', '🔺']];
  function polySVG(k, color) {
    if (!k) return '<svg viewBox="0 0 120 120" class="poly"><circle cx="60" cy="60" r="50" fill="' + color + '" stroke="#1b1036" stroke-width="6"/></svg>';
    var d = '';
    for (var i = 0; i < k; i++) { var a = -Math.PI / 2 + i * 2 * Math.PI / k + (k === 4 ? Math.PI / 4 : 0); d += (i ? 'L' : 'M') + (60 + Math.cos(a) * 52).toFixed(1) + ' ' + (62 + Math.sin(a) * 52).toFixed(1); }
    return '<svg viewBox="0 0 120 120" class="poly"><path d="' + d + 'Z" fill="' + color + '" stroke="#1b1036" stroke-width="6" stroke-linejoin="round"/></svg>';
  }
  var BRIGHT = ['#ff2e93', '#ffc93c', '#29e0ff', '#8b5cff', '#3ff2b0', '#ff7a1c'];

  /* דפוסים */
  var TOK = [['●', '#ff4d7d'], ['▲', '#3fcf7a'], ['■', '#8b5cff'], ['★', '#ffc93c'], ['♥', '#ff8fc4'], ['◆', '#29b6ff']];

  /* טבע */
  var HABITATS = [['🐟', 'דג', 'ים'], ['🐄', 'פרה', 'חווה'], ['🐒', 'קוף', 'ג׳ונגל'], ['🐧', 'פינגווין', 'קרח'], ['🐫', 'גמל', 'מדבר'], ['🐿️', 'סנאי', 'יער'], ['🐬', 'דולפין', 'ים'], ['🐑', 'כבשה', 'חווה'], ['🐻‍❄️', 'דוב קוטב', 'קרח'], ['🦉', 'ינשוף', 'יער']];
  var HOMES = [['ים', '🌊'], ['חווה', '🚜'], ['ג׳ונגל', '🌴'], ['קרח', '🧊'], ['מדבר', '🏜️'], ['יער', '🌳']];
  var WEATHER = [['☀️', 'שמש חזקה', '🕶️', 'משקפי שמש'], ['🌧️', 'גשם', '☂️', 'מטרייה'], ['❄️', 'שלג וקור', '🧤', 'כפפות'], ['🌬️', 'רוח', '🪁', 'עפיפון'], ['🏖️', 'יום בחוף', '🩴', 'כפכפים']];
  var EATS = [['🐰', 'ארנב', '🥕'], ['🐒', 'קוף', '🍌'], ['🐶', 'כלב', '🦴'], ['🐱', 'חתול', '🐟'], ['🐝', 'דבורה', '🌸'], ['🐼', 'פנדה', '🎋'], ['🐭', 'עכבר', '🧀'], ['🐦', 'ציפור', '🌾']];
  var DAYNIGHT = [['🦉', 'ינשוף', 'לילה'], ['🦇', 'עטלף', 'לילה'], ['🐓', 'תרנגול', 'יום'], ['🐝', 'דבורה', 'יום'], ['🦋', 'פרפר', 'יום'], ['🦔', 'קיפוד', 'לילה']];
  var SEASONS = [['סתיו', '🍂🍁🌰', 'עלים נושרים'], ['חורף', '⛄☔❄️', 'קר וגשום'], ['אביב', '🌸🌷🦋', 'פרחים פורחים'], ['קיץ', '☀️🏖️🍉', 'חם ושמשי']];
  var CYCLES = [['הפרפר', ['🥚', '🐛', '🦋']], ['התרנגולת', ['🥚', '🐣', '🐔']], ['העץ', ['🌰', '🌱', '🌳']], ['הצפרדע', ['🥚', '🐟', '🐸'], 'ראשן (נראה כמו דג קטן)']];
  var FACTS = [
    ['מי מטיל ביצים?', '🐔 תרנגולת', ['🐶 כלב', '🐄 פרה', '🐱 חתול']], ['מה הדבורה מייצרת?', '🍯 דבש', ['🥛 חלב', '🧀 גבינה', '🍞 לחם']],
    ['מאיפה מגיע החלב?', '🐄 פרה', ['🐔 תרנגולת', '🐟 דג', '🐝 דבורה']], ['מה צמח צריך כדי לגדול?', '💧 מים', ['🍫 שוקולד', '🧸 דובי', '📺 טלוויזיה']],
    ['איזו חיה ישנה כל החורף?', '🐻 דוב', ['🐔 תרנגולת', '🐶 כלב', '🐴 סוס']], ['מי יכול לעוף?', '🦅 נשר', ['🐘 פיל', '🐢 צב', '🐍 נחש']],
    ['מה מאיר את השמיים בלילה?', '🌙 ירח', ['☀️ שמש', '🌈 קשת', '☁️ ענן']], ['מה יוצא מענן אפור?', '🌧️ גשם', ['🍭 סוכריות', '🔥 אש', '🌸 פרחים']],
    ['מי הכי מהיר?', '🐆 צ׳יטה', ['🐢 צב', '🐌 חילזון', '🐑 כבשה']], ['איפה גדלים תפוחים?', '🌳 עץ', ['🌊 ים', '☁️ ענן', '🏠 בית']]
  ];
  var SPACE = [
    ['מה השמש?', '⭐ כוכב', ['🪐 כוכב לכת', '🌙 ירח', '☁️ ענן']], ['מי מסתובב סביב כדור הארץ?', '🌙 ירח', ['☀️ שמש', '🪐 שבתאי', '⭐ כוכב']],
    ['לאיזה כוכב לכת יש טבעות?', '🪐 שבתאי', ['🌍 כדור הארץ', '🔴 מאדים', '🌙 ירח']], ['איזה כוכב לכת נקרא "האדום"?', '🔴 מאדים', ['🌍 כדור הארץ', '🪐 שבתאי', '🔵 נפטון']],
    ['במה טסים לחלל?', '🚀 חללית', ['🚲 אופניים', '🚗 מכונית', '⛵ סירה']], ['איך קוראים לכוכב הלכת שלנו?', '🌍 כדור הארץ', ['🔴 מאדים', '🪐 שבתאי', '☀️ שמש']]
  ];
  var LEGS = [['🐔', 'תרנגולת', 2], ['🐶', 'כלב', 4], ['🕷️', 'עכביש', 8], ['🐞', 'חיפושית', 6], ['🐍', 'נחש', 0], ['🐙', 'תמנון', 8], ['🧍', 'ילדה', 2], ['🐜', 'נמלה', 6]];

  /* גודל */
  var BY_SIZE = [['🐜', 'נמלה'], ['🐭', 'עכבר'], ['🐱', 'חתול'], ['🐶', 'כלב'], ['🐴', 'סוס'], ['🦒', 'ג׳ירפה'], ['🐘', 'פיל'], ['🐋', 'לוויתן']];
  var BY_WEIGHT = [['🪶', 'נוצה'], ['🍎', 'תפוח'], ['⚽', 'כדור'], ['🧸', 'דובי'], ['🐶', 'כלב'], ['🚗', 'מכונית'], ['🐘', 'פיל']];
  var BY_SPEED = [['🐌', 'חילזון'], ['🐢', 'צב'], ['🚶‍♀️', 'הולכת רגל'], ['🐇', 'ארנב'], ['🚗', 'מכונית'], ['✈️', 'מטוס'], ['🚀', 'חללית']];
  var BY_HEIGHT = [['🐭', 'עכבר'], ['🐶', 'כלב'], ['🧒', 'ילד'], ['🦒', 'ג׳ירפה'], ['🌳', 'עץ'], ['🏢', 'בניין']];

  /* ---------- פרק 3 — מחוללי שאלות ---------- */

  /* 3.1 מספרים */
  function count(max) {
    return function (api) {
      var n = rnd(1, max), f = pick(FRUITS), items = '';
      for (var i = 0; i < n; i++) items += '<span class="count-item' + (max > 10 ? ' sm' : '') + '" style="animation-delay:' + (i * 40) + 'ms">' + f + '</span>';
      Q(api, { ins: 'כמה יש כאן?', help: 'ספרו לאט — אפשר להצביע על כל אחד.', success: 'מעולה! יש ' + n, read: [{ text: n <= 10 ? NUMBER_WORDS[n] : String(n), lang: 'he-IL' }],
        tcls: 'count-items', target: items, opts: nums(n, 3, 1, max + 2).map(function (v) { return { h: String(v), ok: v === n }; }) });
    };
  }
  function seq(min, max) {
    return function (api) {
      var n = rnd(min + 1, max - 1), after = Math.random() < .5, c = after ? n + 1 : n - 1;
      Q(api, { ins: 'מה בא ' + (after ? 'אחרי' : 'לפני') + ' ' + n + '?', help: 'חשבו על הסדר של המספרים.', success: 'נכון! ' + c,
        target: '<div class="equation" dir="ltr">' + (after ? n + ' → <span class="q">?</span>' : '<span class="q">?</span> → ' + n) + '</div>',
        opts: nums(c, max > 20 ? 11 : 3, min, max).map(function (v) { return { h: String(v), ok: v === c }; }) });
    };
  }
  function compare(min, max) {
    return function (api) {
      var a = rnd(min, max), b = rnd(min, max); while (b === a) b = rnd(min, max);
      var big = Math.random() < .5, c = big ? Math.max(a, b) : Math.min(a, b);
      Q(api, { ins: 'איזה מספר ' + (big ? 'גדול' : 'קטן') + ' יותר?', help: max > 20 ? 'השוו קודם את העשרות.' : 'חשבו מי בא אחרי מי.', success: 'נכון! ' + c,
        target: '<div class="equation" dir="ltr">' + a + ' <b>?</b> ' + b + '</div>', opts: [a, b].map(function (v) { return { h: L(v), ok: v === c }; }) });
    };
  }
  function skip(api) {
    var st = pick([2, 5, 10]), s0 = st * rnd(0, 5), sq = [0, 1, 2, 3].map(function (i) { return s0 + st * i; }), ans = s0 + st * 4;
    Q(api, { ins: 'קופצים ב-' + st + ' — מה בא אחר כך?', help: 'כל פעם מוסיפים ' + st + '.', success: 'קפיצה מושלמת! ' + ans,
      target: '<div class="equation" dir="ltr">' + sq.join(', ') + ', <span class="q">?</span></div>', opts: nums(ans, st * 2, 0).map(function (v) { return { h: String(v), ok: v === ans }; }) });
  }
  function tensOnes(api) {
    var t = rnd(1, 6), o = rnd(0, 9), n = t * 10 + o, h = '';
    for (var i = 0; i < t; i++) h += '<span class="ten-bar">🔟</span>';
    for (var j = 0; j < o; j++) h += '<span class="count-item sm">⭐</span>';
    Q(api, { ins: 'כמה יש כאן בסך הכל?', help: 'כל 🔟 שווה עשר. ספרו עשרות ואז אחדות.', success: 'בדיוק! ' + t + ' עשרות ו-' + o + ' אחדות = ' + n,
      tcls: 'count-items', target: h, opts: nums(n, 12, 1).map(function (v) { return { h: String(v), ok: v === n }; }) });
  }
  function evenOdd(api) {
    var n = rnd(2, 20), even = n % 2 === 0;
    Q(api, { ins: 'המספר ' + n + ' זוגי או אי-זוגי?', help: 'זוגי = אפשר לחלק לזוגות בלי שיישאר אחד לבד.', success: 'נכון! ' + n + (even ? ' זוגי' : ' אי-זוגי'),
      target: '<div class="equation">' + n + '</div>', opts: [{ h: '👯‍♀️' + L('זוגי'), ok: even }, { h: '🙋‍♀️' + L('אי-זוגי'), ok: !even }] });
  }

  /* 3.2 צבעים */
  function colorName(k) {
    return function (api) {
      var pool = COLORS.slice(0, k), c = pick(pool);
      Q(api, { ins: 'איזה צבע זה?', help: 'הסתכלו על הצבע ובחרו את השם שלו.', success: 'נכון! ' + c[0],
        target: '<div class="color-orb" style="background:' + c[1] + '"></div>',
        opts: mix([c].concat(others(pool, c, 3))).map(function (o) { return { h: sw(o[0]) + L(o[0]), ok: o === c }; }) });
    };
  }
  function objectColor(api) {
    var o = pick(COLOR_OBJ), names = ['אדום', 'צהוב', 'ירוק', 'כחול', 'כתום', 'סגול', 'ורוד', 'חום'];
    Q(api, { ins: 'באיזה צבע זה?', help: 'חשבו איך זה נראה בעולם.', success: 'נכון! ' + o[1],
      target: '<div class="nature-scene">' + o[0] + '</div>', opts: mix([o[1]].concat(others(names, o[1], 3))).map(function (n) { return { h: sw(n) + L(n), ok: n === o[1] }; }) });
  }
  function oddColor(api) {
    var a = pick(COLORS), b = pick(COLORS.filter(function (x) { return x !== a; })), shapes = mix([a, a, a, b]);
    Q(api, { ins: 'מי יוצא דופן?', help: 'שלושה דומים — ואחד שונה. מצאו אותו!', success: 'עין של גיבורה! 👁️',
      opts: shapes.map(function (c) { return { h: '<span class="answer-swatch big" style="background:' + c[1] + '"></span>', ok: c === b }; }) });
  }
  function colorMix(list) {
    return function (api) {
      var m = pick(list), res = m[2];
      var pool = ['כתום', 'ירוק', 'סגול', 'ורוד', 'אפור', 'אדום', 'כחול'].filter(function (x) { return m.indexOf(x) < 0; });
      Q(api, { ins: 'מערבבים ' + m[0] + ' ו' + m[1] + ' — מה יוצא?', help: 'דמיינו שאתם מערבבים צבעי גואש.', success: 'קסם! ' + m[0] + ' + ' + m[1] + ' = ' + res, tcls: 'size-pair',
        target: '<span class="color-orb" style="background:' + CHEX[m[0]] + '"></span><b class="op">+</b><span class="color-orb" style="background:' + CHEX[m[1]] + '"></span><b class="op">=</b><b class="op q">?</b>',
        opts: mix([res].concat(mix(pool).slice(0, 3))).map(function (n) { return { h: sw(n) + L(n), ok: n === res }; }) });
    };
  }
  function mixReverse(api) {
    var m = pick(MIXES.slice(0, 3)), pool = ['אדום', 'כחול', 'צהוב', 'ירוק', 'לבן'].filter(function (x) { return x !== m[0]; });
    Q(api, { ins: m[0] + ' ועוד איזה צבע נותנים ' + m[2] + '?', help: 'חשבו אילו צבעים יוצרים את ' + m[2] + '.', success: 'נכון! ' + m[0] + ' + ' + m[1] + ' = ' + m[2], tcls: 'size-pair',
      target: '<span class="color-orb" style="background:' + CHEX[m[0]] + '"></span><b class="op">+</b><b class="op q">?</b><b class="op">=</b><span class="color-orb" style="background:' + CHEX[m[2]] + '"></span>',
      opts: mix([m[1]].concat(others(pool, m[1], 3))).map(function (n) { return { h: sw(n) + L(n), ok: n === m[1] }; }) });
  }
  function darker(api) {
    var c = pick(COLORS.slice(0, 6)), dark = Math.random() < .5;
    var light = 'color-mix(in srgb,' + c[1] + ' 45%, white)', deep = 'color-mix(in srgb,' + c[1] + ' 60%, black)';
    var pair = mix([['light', light], ['deep', deep]]);
    Q(api, { ins: 'איזה ' + c[0] + ' ' + (dark ? 'כהה' : 'בהיר') + ' יותר?', help: 'כהה = קרוב לשחור. בהיר = קרוב ללבן.', success: 'נכון!',
      opts: pair.map(function (p) { return { h: '<span class="answer-swatch big" style="background:' + p[1] + '"></span>', ok: (p[0] === 'deep') === dark }; }) });
  }
  function colorEnglish(api) {
    var c = pick(COLORS.slice(0, 7));
    Q(api, { ins: 'איך אומרים "' + c[0] + '" באנגלית?', help: 'אפשר ללחוץ "הקשיבו".', success: 'נכון! ' + c[0] + ' זה ' + c[2], read: [{ text: c[2], lang: 'en-US' }],
      target: '<div class="color-orb" style="background:' + c[1] + '"></div>',
      opts: mix([c].concat(others(COLORS.slice(0, 7), c, 3))).map(function (o) { return { h: L(o[2], ' dir="ltr"'), ok: o === c }; }) });
  }

  /* 3.3 צורות */
  function shapeName(k) {
    return function (api) {
      var pool = SHAPES.slice(0, k), s = pick(pool), col = pick(BRIGHT);
      Q(api, { ins: 'איזו צורה זו?', help: 'הסתכלו על הקווים והפינות.', success: 'נכון! ' + s[0],
        target: '<div class="shape-art ' + s[1] + '" style="--shape-color:' + col + '"></div>',
        opts: mix([s].concat(others(pool, s, 3))).map(function (o) { return { h: '<span class="mini-shape ' + o[1] + '"></span>' + L(o[0]), ok: o === s, color: col }; }) });
    };
  }
  function shapeWorld(api) {
    var w = pick(SHAPE_WORLD), names = ['עיגול', 'ריבוע', 'משולש', 'כוכב', 'לב'];
    Q(api, { ins: 'איזו צורה יש לזה?', help: 'חפשו את הצורה בתוך החפץ.', success: 'נכון! ' + w[1],
      target: '<div class="nature-scene">' + w[0] + '</div>', opts: mix([w[1]].concat(others(names, w[1], 3))).map(function (n) { return { h: L(n), ok: n === w[1] }; }) });
  }
  function corners(pool) {
    return function (api) {
      var p = pick(pool);
      Q(api, { ins: 'כמה פינות יש ל' + p[0] + '?', help: 'ספרו כל פינה חדה.', success: p[1] ? 'נכון! ' + p[1] + ' פינות' : 'נכון! לעיגול אין פינות',
        target: polySVG(p[1], pick(BRIGHT)), opts: nums(p[1], 3, 0, 10).map(function (v) { return { h: String(v), ok: v === p[1] }; }) });
    };
  }
  function oddShape(api) {
    var a = pick(SHAPES), b = pick(SHAPES.filter(function (x) { return x !== a; })), col = pick(BRIGHT), set = mix([a, a, a, b]);
    Q(api, { ins: 'איזו צורה יוצאת דופן?', help: 'שלוש זהות — ואחת שונה.', success: 'מצאת! 🔎',
      opts: set.map(function (s) { return { h: '<span class="mini-shape ' + s[1] + '"></span>', ok: s === b, color: col }; }) });
  }
  function polyName(api) {
    var p = pick(POLYS);
    Q(api, { ins: 'איך קוראים לצורה?', help: 'ספרו פינות: 3 משולש, 4 ריבוע, 5 מחומש, 6 משושה, 8 מתומן.', success: 'נכון! ' + p[0],
      target: polySVG(p[1], pick(BRIGHT)), opts: mix([p].concat(others(POLYS, p, 3))).map(function (o) { return { h: L(o[0]), ok: o === p }; }) });
  }
  function cornersSum(api) {
    var a = pick(POLYS), b = pick(POLYS), s = a[1] + b[1];
    Q(api, { ins: 'כמה פינות יש לשתי הצורות ביחד?', help: 'ספרו כל צורה, ואז חברו.', success: 'נכון! ' + a[1] + ' + ' + b[1] + ' = ' + s, tcls: 'size-pair',
      target: polySVG(a[1], pick(BRIGHT)) + '<b class="op">+</b>' + polySVG(b[1], pick(BRIGHT)), opts: nums(s, 3, 3).map(function (v) { return { h: String(v), ok: v === s }; }) });
  }
  function solids(api) {
    var s = pick(SOLIDS);
    Q(api, { ins: 'איזה גוף זה?', help: 'גופים הם צורות שאפשר להחזיק ביד.', success: 'נכון! ' + s[0],
      target: '<div class="nature-scene">' + s[1] + '</div>', opts: mix([s].concat(others(SOLIDS, s, 3))).map(function (o) { return { h: L(o[0]), ok: o === s }; }) });
  }

  /* 3.4 דפוסים — unit הוא תבנית אינדקסים, למשל [0,1] = AB, [0,0,1] = AAB */
  function pattern(unit, colorOnly) {
    return function (api) {
      var n = Math.max.apply(null, unit) + 1, t = mix(TOK).slice(0, n), shown = 6 - (unit.length === 4 ? 0 : 1);
      var seqArr = []; for (var i = 0; i < shown + 1; i++) seqArr.push(t[unit[i % unit.length]]);
      var ans = seqArr.pop();
      var tok = function (x) { return '<span class="pattern-token" style="background:' + x[1] + '">' + (colorOnly ? '' : x[0]) + '</span>'; };
      Q(api, { ins: 'מה צריך לבוא עכשיו?', help: 'מצאו את החלק שחוזר על עצמו.', success: 'בלשית של דפוסים! 🕵️‍♀️', tcls: 'pattern-row',
        target: seqArr.map(tok).join('') + '<span class="pattern-token question">?</span>',
        opts: mix([ans].concat(others(TOK, ans, 3))).map(function (x) { return { h: colorOnly ? '' : x[0], ok: x === ans, cls: 'pattern-answer', color: x[1] }; }) });
    };
  }
  function numPattern(api) {
    var st = rnd(1, 4), s0 = rnd(1, 10), sq = [0, 1, 2, 3].map(function (i) { return s0 + st * i; }), ans = s0 + st * 4;
    Q(api, { ins: 'מה המספר הבא בדפוס?', help: 'בדקו בכמה המספר גדל כל פעם.', success: 'מעולה! ' + ans,
      target: '<div class="equation" dir="ltr">' + sq.join(', ') + ', <span class="q">?</span></div>', opts: nums(ans, 4, 1).map(function (v) { return { h: String(v), ok: v === ans }; }) });
  }
  function growing(api) {
    var e = pick(['●', '★', '♥']), k = rnd(3, 4), h = '';
    for (var i = 1; i <= k; i++) h += '<span class="grow-step">' + new Array(i + 1).join(e) + '</span>';
    Q(api, { ins: 'כמה יהיו בשלב הבא?', help: 'כל שלב גדל באחד.', success: 'נכון! ' + (k + 1), tcls: 'pattern-row',
      target: h + '<span class="pattern-token question">?</span>', opts: nums(k + 1, 2, 1).map(function (v) { return { h: String(v), ok: v === k + 1 }; }) });
  }

  /* 3.5 אותיות עבריות */
  function startsWith(group) {
    return function (api) {
      var pool = group ? HE.filter(function (x) { return group.indexOf(x[0]) >= 0; }) : HE, w = pick(pool);
      Q(api, { ins: 'מה מתחיל באות ' + w[0] + '?', speak: 'מה מתחיל באות ' + w[1] + '?', help: 'האות ' + w[1] + ' — בחרו את התמונה שמתחילה בצליל שלה.',
        success: 'נכון! ' + w[2] + ' מתחיל ב-' + w[0], read: [{ text: 'האות ' + w[1] + ', כמו ' + w[2], lang: 'he-IL' }],
        target: '<div class="letter-target"><span class="letter-symbol">' + w[0] + '</span><span class="letter-copy"><strong>' + w[1] + '</strong></span></div>',
        opts: mix([w].concat(others(HE, w, 3))).map(function (o) { return { h: BIG(o[3]), ok: o === w }; }) });
    };
  }
  function firstLetter(api) {
    var w = pick(HE);
    Q(api, { ins: 'באיזו אות מתחילה המילה?', help: 'אמרו את המילה בקול והקשיבו לצליל הראשון.', success: 'נכון! ' + w[2] + ' מתחילה ב-' + w[0], read: [{ text: w[2], lang: 'he-IL' }],
      target: '<div class="bilingual-card"><span class="emoji">' + w[3] + '</span><span class="bilingual-copy"><strong class="hebrew">_' + w[2].slice(1) + '</strong></span></div>',
      opts: mix([w[0]].concat(others(HE.map(function (x) { return x[0]; }), w[0], 3))).map(function (l) { return { h: L(l, ' style="font-size:clamp(34px,4.5vw,52px)"'), ok: l === w[0] }; }) });
  }
  function readWord(api) {
    var w = pick(HE);
    Q(api, { ins: 'קראו את המילה ובחרו תמונה:', help: 'קראו לאט, אות אחרי אות.', success: 'קוראת אלופה! ' + w[2], read: [{ text: w[2], lang: 'he-IL' }],
      target: '<div class="read-word">' + w[2] + '</div>', opts: mix([w].concat(others(HE, w, 3))).map(function (o) { return { h: BIG(o[3]), ok: o === w }; }) });
  }
  function letterCount(api) {
    var w = pick(HE), n = w[2].replace(/\s/g, '').length;
    Q(api, { ins: 'כמה אותיות יש במילה?', help: 'הצביעו על כל אות וספרו.', success: 'נכון! ב"' + w[2] + '" יש ' + n + ' אותיות',
      target: '<div class="read-word">' + w[2] + ' ' + w[3] + '</div>', opts: nums(n, 2, 1, 8).map(function (v) { return { h: String(v), ok: v === n }; }) });
  }
  function lastLetter(api) {
    var w = pick(HE), last = w[2].slice(-1);
    var pool = ['ה', 'ל', 'ר', 'ס', 'ב', 'ג', 'ד', 'ח', 'ש', 'ת', 'ע', 'ן', 'ם', 'ף', 'ץ'];
    Q(api, { ins: 'באיזו אות מסתיימת המילה?', help: 'שימו לב: יש אותיות סופיות — ן ם ף ץ ך.', success: 'נכון! ' + w[2] + ' מסתיימת ב-' + last,
      target: '<div class="read-word">' + w[2] + ' ' + w[3] + '</div>',
      opts: mix([last].concat(others(pool, last, 3))).map(function (l) { return { h: L(l, ' style="font-size:clamp(34px,4.5vw,52px)"'), ok: l === last }; }) });
  }
  function readSentence(api) {
    var s = pick(SENTENCES);
    Q(api, { ins: 'קראו את המשפט ובחרו את התמונה:', help: 'קוראים לאט, מילה אחרי מילה.', success: 'קריאה מושלמת! 📖', read: [{ text: s[0], lang: 'he-IL' }],
      target: '<div class="read-word">' + s[0] + '</div>', opts: mix([s].concat(others(SENTENCES, s, 3))).map(function (o) { return { h: BIG(o[1]), ok: o === s }; }) });
  }

  /* 3.6 אנגלית */
  function enStarts(from, to) {
    return function (api) {
      var pool = EN.filter(function (x) { return x[0] >= from && x[0] <= to; }), w = pick(pool);
      Q(api, { ins: 'מה מתחיל באות ' + w[0] + '?', speak: 'What starts with ' + w[0] + '?', help: 'לחצו "הקשיבו" לשמוע את האות והמילה.', success: 'נכון! ' + w[0] + ' כמו ' + w[1] + ' ' + w[2],
        read: [{ text: w[0], lang: 'en-US' }, { text: w[1], lang: 'en-US' }],
        target: '<div class="letter-target"><span class="letter-symbol" dir="ltr">' + w[0] + '</span><span class="letter-copy"><strong dir="ltr">' + w[0].toLowerCase() + '</strong></span></div>',
        opts: mix([w].concat(others(EN, w, 3))).map(function (o) { return { h: BIG(o[2]), ok: o === w }; }) });
    };
  }
  function enCase(api) {
    var w = pick(EN), big = Math.random() < .5, shown = big ? w[0] : w[0].toLowerCase();
    var pool = EN.map(function (x) { return big ? x[0].toLowerCase() : x[0]; }), ans = big ? w[0].toLowerCase() : w[0];
    Q(api, { ins: big ? 'מצאו את האות הקטנה' : 'מצאו את האות הגדולה', help: 'לכל אות באנגלית יש צורה גדולה וצורה קטנה.', success: 'נכון! ' + w[0] + ' ' + w[0].toLowerCase(),
      target: '<div class="letter-target"><span class="letter-symbol" dir="ltr">' + shown + '</span></div>',
      opts: mix([ans].concat(others(pool, ans, 3))).map(function (l) { return { h: L(l, ' dir="ltr" style="font-size:clamp(34px,4.5vw,52px)"'), ok: l === ans }; }) });
  }
  function enWord(api) {
    var w = pick(EN);
    Q(api, { ins: 'איך אומרים את זה באנגלית?', help: 'קראו את המילים ובחרו.', success: 'נכון! ' + w[1], read: [{ text: w[1], lang: 'en-US' }],
      target: '<div class="nature-scene">' + w[2] + '</div>', opts: mix([w].concat(others(EN, w, 3))).map(function (o) { return { h: L(o[1], ' dir="ltr"'), ok: o === w }; }) });
  }
  function enFirst(api) {
    var w = pick(EN);
    Q(api, { ins: 'באיזו אות מתחילה המילה באנגלית?', help: 'אמרו את המילה באנגלית והקשיבו לצליל הראשון.', success: 'נכון! ' + w[1] + ' מתחילה ב-' + w[0], read: [{ text: w[1], lang: 'en-US' }],
      target: '<div class="nature-scene">' + w[2] + '</div>',
      opts: mix([w[0]].concat(others(EN.map(function (x) { return x[0]; }), w[0], 3))).map(function (l) { return { h: L(l, ' dir="ltr" style="font-size:clamp(34px,4.5vw,52px)"'), ok: l === w[0] }; }) });
  }
  function enNumbers(api) {
    var n = rnd(1, 10);
    Q(api, { ins: 'איך אומרים את המספר באנגלית?', help: 'לחצו "הקשיבו" לשמוע.', success: 'נכון! ' + n + ' זה ' + EN_NUMBERS[n], read: [{ text: EN_NUMBERS[n], lang: 'en-US' }],
      target: '<div class="equation">' + n + '</div>', opts: mix([n].concat(others([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], n, 3))).map(function (v) { return { h: L(EN_NUMBERS[v], ' dir="ltr"'), ok: v === n }; }) });
  }
  function enSentence(api) {
    var s = pick(EN_SENT);
    Q(api, { ins: 'קראו את המשפט באנגלית ובחרו תמונה:', help: 'אפשר ללחוץ "הקשיבו".', success: 'מצוין! 🌟', read: [{ text: s[0], lang: 'en-US' }], q: [{ text: s[0], lang: 'en-US' }],
      target: '<div class="read-word" dir="ltr">' + s[0] + '</div>', opts: mix([s].concat(others(EN_SENT, s, 3))).map(function (o) { return { h: BIG(o[1]), ok: o === s }; }) });
  }

  /* 3.7 מילים בשתי שפות (חיות/אוכל) */
  /* קטנים: שומעים את המילה באנגלית ובוחרים תמונה (בלי צורך לקרוא) */
  function listenPick(list) {
    return function (api) {
      var w = pick(list), play = function () { api.read([{ text: w[2], lang: 'en-US' }]); };
      Q(api, { ins: 'הקשיבו למילה באנגלית ובחרו תמונה', help: 'לחצו על הרמקול כדי לשמוע שוב.', success: 'נכון! ' + w[1] + ' באנגלית זה ' + w[2] + ' ' + w[0], replay: play,
        target: '<button type="button" class="music-stage" aria-label="השמעה">🔊</button>', opts: mix([w].concat(others(list, w, 3))).map(function (o) { return { h: BIG(o[0]), ok: o === w }; }) });
      api.el.target.firstChild.addEventListener('click', play);
      setTimeout(play, 250);
    };
  }
  /* גדולים: קוראים מילה באנגלית ובוחרים תמונה */
  function readPick(list) {
    return function (api) {
      var w = pick(list);
      Q(api, { ins: 'מה המילה באנגלית אומרת?', help: 'קראו (או הקשיבו) ובחרו את התמונה.', success: 'נכון! ' + w[2] + ' זה ' + w[1], read: [{ text: w[2], lang: 'en-US' }], q: [{ text: w[2], lang: 'en-US' }],
        target: '<div class="read-word" dir="ltr">' + w[2] + '</div>', opts: mix([w].concat(others(list, w, 3))).map(function (o) { return { h: BIG(o[0]), ok: o === w }; }) });
    };
  }
  /* גדולים: תמונה ← בוחרים את המילה באנגלית */
  function pickWord(list) {
    return function (api) {
      var w = pick(list);
      Q(api, { ins: 'איך אומרים ' + w[1] + ' באנגלית?', help: 'קראו את האפשרויות ובחרו.', success: 'נכון! ' + w[1] + ' באנגלית זה ' + w[2], read: [{ text: w[1] + ' באנגלית זה', lang: 'he-IL' }, { text: w[2], lang: 'en-US' }],
        target: '<div class="bilingual-card"><span class="emoji">' + w[0] + '</span><span class="bilingual-copy"><strong class="hebrew">' + w[1] + '</strong></span></div>',
        opts: mix([w].concat(others(list, w, 3))).map(function (o) { return { h: L(o[2], ' dir="ltr"'), ok: o === w }; }) });
    };
  }

  /* 3.8 גודל ומידות */
  function sameItemSize(api) {
    var e = pick(['🎈', '⭐', '🍎', '⚽', '🐘', '🐞', '🌸', '🐬']), big = Math.random() < .5, flip = Math.random() < .5;
    var sizes = flip ? [90, 36] : [36, 90];
    Q(api, { ins: 'איזה ' + (big ? 'גדול' : 'קטן') + ' יותר?', help: 'הסתכלו על הגודל.', success: 'נכון!', tcls: 'size-pair',
      target: '<span class="size-item" style="font-size:' + sizes[0] + 'px">' + e + '</span><span class="size-vs">מול</span><span class="size-item" style="font-size:' + sizes[1] + 'px">' + e + '</span>',
      opts: sizes.map(function (s) { return { h: '<span style="font-size:' + Math.round(s * .55) + 'px;line-height:1">' + e + '</span>', ok: big ? s === 90 : s === 36 }; }) });
  }
  function threeSizes(big) {
    return function (api) {
      var e = pick(['🎈', '⭐', '🍎', '🐢', '🌸', '🦋']), s = mix([30, 60, 95]);
      var target = big ? 95 : 30;
      Q(api, { ins: 'מי ה' + (big ? 'הכי גדול' : 'הכי קטן') + '?', help: 'השוו בין שלושתם.', success: 'נכון!', tcls: 'size-pair',
        target: s.map(function (x) { return '<span class="size-item" style="font-size:' + x + 'px">' + e + '</span>'; }).join(''),
        opts: s.map(function (x) { return { h: '<span style="font-size:' + Math.round(x * .5) + 'px;line-height:1">' + e + '</span>', ok: x === target }; }) });
    };
  }
  function longShort(api) {
    var long = Math.random() < .5, lens = mix([40, 90]), cols = mix(BRIGHT).slice(0, 2);
    Q(api, { ins: 'איזה פס ' + (long ? 'ארוך' : 'קצר') + ' יותר?', help: 'השוו את האורך.', success: 'נכון!',
      target: lens.map(function (l, i) { return '<div class="len-bar" style="width:' + l + '%;background:' + cols[i] + '"></div>'; }).join(''), tcls: 'bars',
      opts: lens.map(function (l, i) { return { h: '<span class="len-chip" style="background:' + cols[i] + '"></span>', ok: long ? l === 90 : l === 40 }; }) });
  }
  function realCompare(list, bigWord, smallWord, far) {
    return function (api) {
      var i = rnd(0, list.length - 1), j = rnd(0, list.length - 1);
      while (j === i || (far && Math.abs(i - j) < 3)) { i = rnd(0, list.length - 1); j = rnd(0, list.length - 1); }
      var askBig = Math.random() < .5, win = askBig ? Math.max(i, j) : Math.min(i, j), word = askBig ? bigWord : smallWord;
      Q(api, { ins: 'מי ' + word + ' יותר?', help: 'חשבו איך זה בעולם האמיתי!', success: 'נכון! ' + list[win][1] + ' ' + word + ' יותר', tcls: 'size-pair',
        target: '<span class="size-item" style="font-size:78px">' + list[i][0] + '</span><span class="size-vs">מול</span><span class="size-item" style="font-size:78px">' + list[j][0] + '</span>',
        opts: [i, j].map(function (k) { return { h: '<span>' + list[k][0] + '</span>' + L(list[k][1]), ok: k === win }; }) });
    };
  }
  function middleSize(api) {
    var idx = mix(BY_SIZE.map(function (_, i) { return i; })).slice(0, 3).sort(function (a, b) { return a - b; }), mid = idx[1];
    Q(api, { ins: 'מי באמצע — לא הכי גדול ולא הכי קטן?', help: 'סדרו בראש מהקטן לגדול.', success: 'נכון! ' + BY_SIZE[mid][1] + ' באמצע',
      opts: mix(idx).map(function (k) { return { h: '<span>' + BY_SIZE[k][0] + '</span>' + L(BY_SIZE[k][1]), ok: k === mid }; }) });
  }

  /* 3.9 חשבון */
  var MATH_ITEMS = ['🍎', '⭐', '🎈', '🍓', '🦋', '🍪', '💎', '🐥'];
  function group(e, n, gone) {
    var h = '<span class="math-group">';
    for (var i = 0; i < n; i++) h += '<span class="count-item' + (gone && i >= n - gone ? ' gone' : '') + '">' + e + '</span>';
    return h + '</span>';
  }
  function addUpTo(max) {
    return function (api) {
      var a = rnd(1, max - 1), b = rnd(1, max - a), e = pick(MATH_ITEMS), s = a + b;
      Q(api, { ins: 'כמה זה ביחד?', help: 'ספרו את שתי הקבוצות יחד.', success: 'יש! ' + a + ' + ' + b + ' = ' + s, read: [{ text: a + ' ועוד ' + b + ' זה ' + s, lang: 'he-IL' }],
        target: '<div class="math-row">' + group(e, a) + '<b class="op">+</b>' + group(e, b) + '<b class="op">=</b><b class="op q">?</b></div>',
        opts: nums(s, 3, 1).map(function (v) { return { h: String(v), ok: v === s }; }) });
    };
  }
  function subSmall(api) {
    var n = rnd(3, 9), k = rnd(1, n - 1), e = pick(['🎈', '🦋', '🐥']), left = n - k;
    Q(api, { ins: 'היו ' + n + ', ' + k + ' עפו. כמה נשארו?', help: 'ספרו רק את מה שנשאר (בלי השקופים).', success: 'מעולה! נשארו ' + left,
      target: '<div class="math-row">' + group(e, n, k) + '</div>', opts: nums(left, 3, 0).map(function (v) { return { h: String(v), ok: v === left }; }) });
  }
  function missing(api) {
    var s = rnd(4, 10), a = rnd(1, s - 1), b = s - a;
    Q(api, { ins: 'איזה מספר חסר?', help: 'כמה צריך להוסיף ל-' + a + ' כדי להגיע ל-' + s + '?', success: 'נכון! ' + a + ' + ' + b + ' = ' + s,
      target: '<div class="equation" dir="ltr">' + a + ' <b>+</b> <span class="q">?</span> <b>=</b> ' + s + '</div>', opts: nums(b, 3, 0).map(function (v) { return { h: String(v), ok: v === b }; }) });
  }
  function story(api) {
    var who = pick(['לאלה', 'לארנבת', 'לחתולה', 'לגיבורה']), e = pick(['🍎', '🎈', '⭐', '🍪']), a = rnd(2, 6), b = rnd(1, 4), plus = Math.random() < .6;
    if (!plus && b >= a) b = a - 1;
    var res = plus ? a + b : a - b;
    var text = plus ? ('היו ' + who + ' ' + a + ' ' + e + ', והיא קיבלה עוד ' + b + '. כמה יש לה עכשיו?') : ('היו ' + who + ' ' + a + ' ' + e + ', והיא נתנה ' + b + ' לחברה. כמה נשארו?');
    Q(api, { ins: text, speak: text, help: 'אפשר לצייר בראש או לספור על האצבעות.', success: 'פתרת את הסיפור! ' + res,
      target: '<div class="nature-scene small">' + e + '📖</div>', opts: nums(res, 3, 0).map(function (v) { return { h: String(v), ok: v === res }; }) });
  }
  function arith(maxA, allowSub) {
    return function (api) {
      var plus = !allowSub || Math.random() < .55, x, y, r;
      if (plus) { x = rnd(2, maxA - 2); y = rnd(1, maxA - x); r = x + y; } else { x = rnd(10, maxA); y = rnd(1, x - 1); r = x - y; }
      var sign = plus ? '+' : '−';
      Q(api, { ins: 'פותרים את התרגיל', help: maxA > 20 ? 'טיפ: קודם העשרות, אחר כך האחדות.' : 'אפשר לספור קדימה מהמספר הגדול.', success: 'גאונה! ' + x + ' ' + sign + ' ' + y + ' = ' + r,
        target: '<div class="equation" dir="ltr">' + x + ' <b>' + sign + '</b> ' + y + ' <b>=</b> <span class="q">?</span></div>', opts: nums(r, maxA > 20 ? 10 : 3, 0).map(function (v) { return { h: String(v), ok: v === r }; }) });
    };
  }
  var HOUR_WORDS = ['', 'אחת', 'שתיים', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע', 'עשר', 'אחת-עשרה', 'שתים-עשרה'];
  function clockSVG(h, m) {
    var s = '<svg class="clock" viewBox="0 0 200 200"><circle cx="100" cy="100" r="92" fill="#fffaf0" stroke="#1b1036" stroke-width="8"/>';
    for (var i = 1; i <= 12; i++) { var a = (i / 12) * Math.PI * 2 - Math.PI / 2; s += '<text x="' + (100 + Math.cos(a) * 70).toFixed(1) + '" y="' + (100 + Math.sin(a) * 70 + 8).toFixed(1) + '" text-anchor="middle" font-size="22" font-weight="900" fill="#1b1036" font-family="Rubik,sans-serif">' + i + '</text>'; }
    s += '<line x1="100" y1="100" x2="100" y2="52" stroke="#ff2e93" stroke-width="10" stroke-linecap="round" transform="rotate(' + (((h % 12) + m / 60) * 30) + ' 100 100)"/>';
    s += '<line x1="100" y1="100" x2="100" y2="30" stroke="#1b1036" stroke-width="6" stroke-linecap="round" transform="rotate(' + (m * 6) + ' 100 100)"/>';
    return s + '<circle cx="100" cy="100" r="8" fill="#ffc93c" stroke="#1b1036" stroke-width="3"/></svg>';
  }
  function clock(mins) {
    return function (api) {
      var h = rnd(1, 12), m = pick(mins), lbl = function (a, b) { return a + ':' + (b < 10 ? '0' : '') + b; };
      var word = HOUR_WORDS[h] + (m === 30 ? ' וחצי' : m === 15 ? ' ורבע' : m === 45 ? ' פחות רבע' : '');
      var opts = [[h, m]], g = 0;
      while (opts.length < 4 && g++ < 100) { var c = [rnd(1, 12), pick(mins.concat([0, 30]))]; if (!opts.some(function (o) { return o[0] === c[0] && o[1] === c[1]; })) opts.push(c); }
      Q(api, { ins: 'מה השעה?', help: 'המחוג הקצר (הוורוד) מראה שעה, הארוך מראה דקות.', success: 'נכון! השעה ' + word, read: [{ text: 'השעה ' + word, lang: 'he-IL' }],
        target: clockSVG(h, m), opts: mix(opts).map(function (o) { return { h: L(lbl(o[0], o[1]), ' dir="ltr"'), ok: o[0] === h && o[1] === m }; }) });
    };
  }
  function money(api) {
    var coins = [], total = 0, n = rnd(2, 5);
    for (var i = 0; i < n; i++) { var c = pick([1, 2, 5, 10]); coins.push(c); total += c; }
    coins.sort(function (a, b) { return b - a; });
    Q(api, { ins: 'כמה שקלים יש כאן?', help: 'התחילו מהמטבע הגדול וחברו את כל השאר.', success: 'בדיוק! ' + total + ' ₪',
      target: '<div class="coins-row">' + coins.map(function (v) { return '<span class="shekel s' + v + '">' + v + '<small>₪</small></span>'; }).join('') + '</div>',
      opts: nums(total, 5, 1).map(function (v) { return { h: L(v + ' ₪'), ok: v === total }; }) });
  }

  /* 3.10 מוזיקה */
  var INSTRUMENTS = [['🥁', 'תוף', 'drum'], ['🎹', 'פסנתר', 'piano'], ['🎸', 'גיטרה', 'guitar'], ['🎺', 'חצוצרה', 'trumpet'], ['🎻', 'כינור', 'violin'], ['🎷', 'סקסופון', 'sax'], ['🔔', 'פעמון', 'bell']];
  /* במה עגולה עם כפתור השמעה */
  function stage(api, emoji, play) {
    api.el.target.innerHTML = '<button type="button" class="music-stage" aria-label="השמעה">' + emoji + '</button>';
    var b = api.el.target.firstChild;
    b.addEventListener('click', function () { play(); b.classList.remove('play'); void b.offsetWidth; b.classList.add('play'); });
    setTimeout(play, 300);
  }
  function instrument(api) {
    var i = pick(INSTRUMENTS), play = function () { Audio.instrument(i[2]); };
    Q(api, { ins: 'איך קוראים לכלי הזה?', help: 'לחצו על הכלי כדי לשמוע אותו.', success: 'נכון! זה ' + i[1] + ' 🎶', replay: play,
      opts: mix([i].concat(others(INSTRUMENTS, i, 3))).map(function (o) { return { h: '<span style="font-size:.9em">' + o[0] + '</span>' + L(o[1]), ok: o === i }; }) });
    stage(api, i[0], play);
  }
  function highLow(api) {
    var high = Math.random() < .5, f = high ? 1046 : 131, play = function () { Audio.note(f, 0, .9, high ? 'sine' : 'triangle', .35); Audio.note(f, .5, .9, high ? 'sine' : 'triangle', .3); };
    Q(api, { ins: 'הצליל גבוה או נמוך?', help: 'לחצו על הרמקול כדי לשמוע שוב.', success: high ? 'נכון! גבוה כמו ציפור 🐦' : 'נכון! נמוך כמו דוב 🐻', replay: play,
      opts: [{ h: '🐦' + L('גבוה'), ok: high }, { h: '🐻' + L('נמוך'), ok: !high }] });
    stage(api, '🔊', play);
  }
  function longShortSound(api) {
    var long = Math.random() < .5, play = function () { Audio.note(660, 0, long ? 1.6 : .22, 'triangle', .3); };
    Q(api, { ins: 'הצליל ארוך או קצר?', help: 'הקשיבו כמה זמן הצליל נמשך.', success: long ? 'נכון! צליל ארוך 🐍' : 'נכון! צליל קצר 🐞', replay: play,
      opts: [{ h: '🐍' + L('ארוך'), ok: long }, { h: '🐞' + L('קצר'), ok: !long }] });
    stage(api, '🎵', play);
  }
  function fastSlow(api) {
    var fast = Math.random() < .5, gap = fast ? .14 : .55, play = function () { [523, 587, 659, 784, 659, 587].forEach(function (f, i) { Audio.note(f, i * gap, .3, 'triangle', .22); }); };
    Q(api, { ins: 'המנגינה מהירה או איטית?', help: 'הקשיבו לקצב.', success: fast ? 'נכון! מהיר כמו ארנב 🐇' : 'נכון! איטי כמו צב 🐢', replay: play,
      opts: [{ h: '🐇' + L('מהיר'), ok: fast }, { h: '🐢' + L('איטי'), ok: !fast }] });
    stage(api, '🎼', play);
  }
  function drums(api) {
    var n = rnd(3, 7), play = function () { var t = []; for (var i = 0; i < n; i++) t.push(i * .42); Audio.rhythm(t); };
    Q(api, { ins: 'כמה תיפופים שמעתם?', help: 'לחצו על התוף כדי לשמוע שוב וספרו בשקט.', success: 'שמיעה של גיבורה! ' + n + ' תיפופים 🥁', replay: play,
      opts: nums(n, 2, 2).map(function (v) { return { h: String(v), ok: v === n }; }) });
    stage(api, '🥁', play);
  }
  function sameRhythm(api) {
    var R = [[0, .3, .6], [0, .15, .6], [0, .45, .6], [0, .3, .45, .6]], a = pick(R), same = Math.random() < .5, b = same ? a : pick(R.filter(function (x) { return x !== a; }));
    var play = function () { Audio.rhythm(a); Audio.rhythm(b.map(function (t) { return t + 1.4; })); };
    Q(api, { ins: 'שני המקצבים זהים או שונים?', help: 'מקצב ראשון, הפסקה, מקצב שני.', success: same ? 'נכון! זהים 👯‍♀️' : 'נכון! שונים 🔀', replay: play,
      opts: [{ h: '👯‍♀️' + L('זהים'), ok: same }, { h: '🔀' + L('שונים'), ok: !same }] });
    stage(api, '🥁', play);
  }
  var PADS = [['#ff2e93', 523, 'דו'], ['#ffc93c', 587, 'רה'], ['#29e0ff', 659, 'מי'], ['#3ff2b0', 784, 'סול']];
  /* סיימון: המנגינה מתנגנת והפדים נדלקים — הילדה חוזרת באותו סדר */
  function simon(len) {
    return function (api) {
      var el = api.el, sq = [], pos = 0, busy = true;
      for (var i = 0; i < len; i++) sq.push(rnd(0, 3));
      el.instruction.textContent = 'חוזרים על המנגינה! (' + len + ' צלילים)';
      el.helper.textContent = 'הקשיבו והסתכלו אילו כפתורים נדלקים — ואז לחצו באותו סדר.';
      el.target.className = 'target';
      el.target.innerHTML = '<div class="simon-dots">' + sq.map(function () { return '<i></i>'; }).join('') + '</div>';
      el.answers.className = 'answer-grid simon-board';
      var pads = PADS.map(function (p, idx) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'answer simon-pad';
        b.style.setProperty('--pad', p[0]); b.innerHTML = L(p[2]);
        b.addEventListener('click', function () { press(idx, b); });
        el.answers.appendChild(b); return b;
      });
      function light(idx, when) { setTimeout(function () { Audio.note(PADS[idx][1], 0, .38, 'triangle', .3); pads[idx].classList.add('lit'); setTimeout(function () { pads[idx].classList.remove('lit'); }, 330); }, when); }
      function dots() { Array.prototype.forEach.call(el.target.querySelectorAll('.simon-dots i'), function (d, i) { d.classList.toggle('on', i < pos); }); }
      function play() { busy = true; pos = 0; dots(); sq.forEach(function (idx, i) { light(idx, 500 + i * 560); }); setTimeout(function () { busy = false; api.feedback('', 'עכשיו תורך! 🎹'); }, 500 + sq.length * 560); }
      function press(idx, btn) {
        if (busy) return;
        light(idx, 0);
        if (idx === sq[pos]) { pos++; dots(); if (pos === sq.length) { busy = true; api.win(btn, 'מנגינה מושלמת! 🎶', 'וואו! חזרת על כל המנגינה!'); } }
        else { busy = true; api.sound('sad'); api.feedback('try', 'כמעט! בואו נקשיב שוב…'); setTimeout(play, 900); }
      }
      api.setRound({ speak: 'הקשיבו למנגינה וחזרו עליה.', replay: function () { if (!busy) play(); } });
      play();
    };
  }

  /* 3.11 טבע */
  function habitat(api) {
    var a = pick(HABITATS), right = HOMES.filter(function (x) { return x[0] === a[2]; })[0];
    Q(api, { ins: 'איפה גר ה' + a[1] + '?', help: 'חשבו איפה פוגשים את החיה הזאת.', success: 'נכון! ה' + a[1] + ' גר ב' + a[2] + ' ' + right[1],
      target: '<div class="bilingual-card"><span class="emoji">' + a[0] + '</span><span class="bilingual-copy"><strong class="hebrew">' + a[1] + '</strong><small>איפה הבית שלו?</small></span></div>',
      opts: mix([right].concat(others(HOMES, right, 3))).map(function (o) { return { h: '<span>' + o[1] + '</span>' + L(o[0]), ok: o === right }; }) });
  }
  function weather(api) {
    var w = pick(WEATHER);
    Q(api, { ins: 'יש ' + w[1] + '. מה כדאי לקחת?', help: 'בחרו את מה שהכי מתאים.', success: 'נכון! ' + w[3] + ' ' + w[2],
      target: '<div class="nature-scene">' + w[0] + '</div>', opts: mix([w].concat(others(WEATHER, w, 3))).map(function (o) { return { h: '<span>' + o[2] + '</span>' + L(o[3]), ok: o === w }; }) });
  }
  function eats(api) {
    var e = pick(EATS);
    Q(api, { ins: 'מה ה' + e[1] + ' אוהב לאכול?', help: 'חשבו מה החיה הזאת אוכלת.', success: 'נכון! ' + e[2],
      target: '<div class="nature-scene">' + e[0] + '</div>', opts: mix([e].concat(others(EATS, e, 3))).map(function (o) { return { h: BIG(o[2]), ok: o === e }; }) });
  }
  function dayNight(api) {
    var d = pick(DAYNIGHT);
    Q(api, { ins: 'ה' + d[1] + ' ער ביום או בלילה?', help: 'יש חיות שישנות ביום וערות בלילה!', success: 'נכון! ב' + d[2],
      target: '<div class="nature-scene">' + d[0] + '</div>', opts: [{ h: '☀️' + L('יום'), ok: d[2] === 'יום' }, { h: '🌙' + L('לילה'), ok: d[2] === 'לילה' }] });
  }
  function natureMix(api) { pick([habitat, weather, eats, dayNight])(api); }
  function season(api) {
    var s = pick(SEASONS);
    Q(api, { ins: 'איזו עונה זו?', help: 'הסתכלו על הרמזים.', success: 'בדיוק! ' + s[0] + ' — ' + s[2], read: [{ text: 'עונת ה' + s[0], lang: 'he-IL' }],
      target: '<div class="nature-scene">' + s[1] + '</div>', opts: mix(SEASONS).map(function (o) { return { h: L(o[0]), ok: o === s }; }) });
  }
  function cycle(api) {
    var c = pick(CYCLES), last = c[1][2], pool = CYCLES.map(function (x) { return x[1][2]; }).concat(['🐍', '🌵']);
    Q(api, { ins: 'מחזור החיים של ' + c[0] + ': מה בא אחר כך?', help: c[2] ? 'רמז: ' + c[2] + ' גדל להיות…' : 'מה קורה כשהוא גדל?', success: 'נכון! ' + c[1].join(' ← '),
      target: '<div class="cycle-row" dir="ltr"><span>' + c[1][0] + '</span><b>→</b><span>' + c[1][1] + '</span><b>→</b><span class="q">?</span></div>',
      opts: mix([last].concat(others(pool.filter(function (x) { return c[1].indexOf(x) < 0; }), last, 3))).map(function (o) { return { h: BIG(o), ok: o === last }; }) });
  }
  function facts(list, icon) {
    return function (api) {
      var f = pick(list);
      Q(api, { ins: f[0], help: 'חשבו טוב — מה אתם יודעים?', success: 'נכון! ' + f[1],
        target: '<div class="nature-scene small">' + icon + '</div>', opts: mix([f[1]].concat(f[2])).map(function (o) { return { h: L(o), ok: o === f[1] }; }) });
    };
  }
  function legs(api) {
    var l = pick(LEGS);
    Q(api, { ins: 'כמה רגליים יש ל' + l[1] + '?', help: 'דמיינו אותה הולכת.', success: 'נכון! ' + l[2] + ' רגליים',
      target: '<div class="nature-scene">' + l[0] + '</div>', opts: nums(l[2], 4, 0, 10).map(function (v) { return { h: String(v), ok: v === l[2] }; }) });
  }

  /* ---------- פרק 4 — משחק זיכרון ---------- */
  /* kind: 'same' (זוגות זהים), 'letter' (אות↔תמונה), 'dots' (מספר↔נקודות) */
  var MEM_POOL = ['🦁', '🐶', '🐱', '🐰', '🐸', '🐼', '🦄', '🐟', '🍎', '🍓', '⭐', '🎈', '🌈', '🚀', '🦋', '🐢', '🍩', '👑'];
  function memory(pairs, kind) {
    return function (api) {
      var el = api.el, cards = [];
      if (kind === 'letter') mix(HE).slice(0, pairs).forEach(function (w, i) { cards.push({ id: i, face: '<b class="mem-letter">' + w[0] + '</b>' }, { id: i, face: w[3] }); });
      else if (kind === 'dots') mix([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, pairs).forEach(function (n) { cards.push({ id: n, face: '<b class="mem-letter">' + n + '</b>' }, { id: n, face: '<span class="mem-dots">' + new Array(n + 1).join('●') + '</span>' }); });
      else mix(MEM_POOL).slice(0, pairs).forEach(function (e, i) { cards.push({ id: i, face: e }, { id: i, face: e }); });
      cards = mix(cards);
      var open = [], matched = 0, busy = false;
      var colsN = cards.length <= 6 ? 3 : cards.length <= 8 ? 4 : cards.length <= 10 ? 5 : cards.length <= 16 ? 4 : 5;
      api.setRound({ speak: 'מוצאים את הזוגות! הפכו שני קלפים בכל פעם.' });
      el.instruction.textContent = kind === 'letter' ? 'זוגות: אות ותמונה' : kind === 'dots' ? 'זוגות: מספר ונקודות' : 'מוצאים את הזוגות (' + pairs + ')';
      el.helper.textContent = kind === 'same' ? 'הפכו שני קלפים. אם הם זהים — הם נשארים גלויים.' : kind === 'letter' ? 'מצאו לכל אות את התמונה שמתחילה בה.' : 'מצאו לכל מספר את הקלף עם אותו מספר נקודות.';
      el.target.className = 'target'; el.target.innerHTML = '';
      el.answers.className = 'answer-grid memory-board' + (cards.length > 12 ? ' big-board' : '');
      el.answers.style.gridTemplateColumns = 'repeat(' + colsN + ',minmax(0,1fr))';
      cards.forEach(function (c, idx) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'answer memory-card';
        b.setAttribute('aria-label', 'קלף ' + (idx + 1));
        b.innerHTML = '<span class="memory-inner"><span class="memory-back">✦</span><span class="memory-front">' + c.face + '</span></span>';
        b.addEventListener('click', function () { flip(idx, b); });
        el.answers.appendChild(b); c.btn = b;
      });
      function flip(idx, b) {
        var c = cards[idx];
        if (busy || c.done || open.indexOf(idx) >= 0) return;
        api.sound('tap'); b.classList.add('flipped'); open.push(idx);
        if (open.length < 2) return;
        var a = cards[open[0]], d = cards[open[1]];
        if (a.id === d.id) {
          a.done = d.done = true; a.btn.classList.add('matched'); d.btn.classList.add('matched'); open = []; matched++;
          api.sound('happy'); api.feedback('good', 'זוג מתאים! ✨');
          if (matched === pairs) setTimeout(function () { api.win(b, 'מצאת את כל הזוגות! 🧠', 'איזה זיכרון של גיבורה!'); }, 300);
        } else {
          busy = true; api.feedback('try', 'כמעט! נסו זוג אחר.'); api.sound('sad');
          setTimeout(function () { a.btn.classList.remove('flipped'); d.btn.classList.remove('flipped'); open = []; busy = false; }, 850);
        }
      }
    };
  }

  /* =====================================================================
     פרק 4.5 — תחנות שפה ואנגלית (קפיצת מדרגה)
     4.5.1 מאגרים: מילים מנוקדות, משפטים, סיפורים, הפכים, חרוזים, אוצר מילים באנגלית
     4.5.2 בונה מילים אינטראקטיבי (אריחי אותיות) — עברית ואנגלית
     4.5.3 מחוללי שאלות לתחנות: קריאה, בונים מילים, שפה, אוצר מילים באנגלית, איות
     ===================================================================== */

  /* ---------- 4.5.1 מאגרים ---------- */
  /* מילים מנוקדות לפי אורך: [מנוקד, אימוג'י] */
  var R2 = [['דָּג', '🐟'], ['יָד', '✋'], ['הַר', '⛰️'], ['לֵב', '❤️'], ['עֵץ', '🌳'], ['סַל', '🧺'], ['נֵר', '🕯️'], ['תֵּה', '🍵']];
  var R3 = [['פִּיל', '🐘'], ['סוּס', '🐴'], ['דֹּב', '🐻'], ['קוֹף', '🐒'], ['תּוּת', '🍓'], ['כֶּלֶב', '🐶'], ['שֶׁמֶשׁ', '☀️'], ['בַּיִת', '🏠'], ['יֶלֶד', '🧒'], ['גֶּשֶׁם', '🌧️'], ['דֶּגֶל', '🚩'], ['כּוֹס', '🥛']];
  var R4 = [['חָתוּל', '🐱'], ['אַרְיֵה', '🦁'], ['בָּלוֹן', '🎈'], ['פַּרְפַּר', '🦋'], ['תַּפּוּחַ', '🍎'], ['מַטְרִיָּה', '☂️'], ['רַכֶּבֶת', '🚂'], ['כַּדּוּר', '⚽'], ['עוּגָה', '🎂'], ['פֶּרַח', '🌸'], ['צְפַרְדֵּעַ', '🐸'], ['סֵפֶר', '📖']];
  /* הסרת ניקוד — לקריאה מתקדמת בלי ניקוד */
  function plain(w) { return w.replace(/[֑-ׇ]/g, ''); }
  var FILL = [
    ['הַחָתוּל שׁוֹתֶה ___', 'חָלָב', ['סֵפֶר', 'כִּסֵּא', 'נַעַל'], '🐱🥛'], ['בַּלַּיְלָה רוֹאִים אֶת הַ___', 'יָרֵחַ', ['שֶׁמֶשׁ', 'כֶּלֶב', 'תַּפּוּחַ'], '🌙'],
    ['אֲנִי כּוֹתֶבֶת בְּ___', 'עִפָּרוֹן', ['מַזְלֵג', 'כּוֹבַע', 'כַּדּוּר'], '✏️'], ['הַדָּג שׂוֹחֶה בַּ___', 'מַיִם', ['שָׁמַיִם', 'מִטָּה', 'גַּן'], '🐟'],
    ['בַּחֹרֶף יוֹרֵד ___', 'גֶּשֶׁם', ['תּוּת', 'שִׁיר', 'לֶחֶם'], '🌧️'], ['הַצִּפּוֹר עָפָה בַּ___', 'שָׁמַיִם', ['מְקָרֵר', 'סֵפֶר', 'נַעַל'], '🐦'],
    ['בַּבֹּקֶר אֲנִי מְצַחְצַחַת ___', 'שִׁנַּיִם', ['עֲנָנִים', 'כִּסְאוֹת', 'תַּפּוּזִים'], '🪥']
  ];
  var TF = [['הַכֶּלֶב יָשֵׁן', '😴🐶', true], ['הַתַּפּוּחַ כָּחֹל', '🍎', false], ['הַשֶּׁמֶשׁ זוֹרַחַת', '☀️', true], ['הַפִּיל קָטָן מְאוֹד', '🐘', false],
            ['הַדָּג עָף בַּשָּׁמַיִם', '🐟', false], ['הַיַּלְדָּה אוֹכֶלֶת גְּלִידָה', '👧🍦', true], ['לֶחָתוּל יֵשׁ זָנָב', '🐱', true], ['הַשֶּׁלֶג חַם', '❄️', false]];
  var STORIES = [
    ['דָּנָה הָלְכָה לַגַּן. בַּגַּן הִיא רָאֲתָה פַּרְפַּר צָהֹב.', 'מָה דָּנָה רָאֲתָה?', '🦋', ['🐶', '🍎', '🚗']],
    ['יוֹסִי אָכַל תַּפּוּחַ אָדֹם. אַחַר כָּךְ הוּא שָׁתָה מַיִם.', 'מָה יוֹסִי אָכַל?', '🍎', ['🍌', '🍕', '🍪']],
    ['בַּבֹּקֶר יָרַד גֶּשֶׁם. אֱלָה לָקְחָה מַטְרִיָּה.', 'מָה אֱלָה לָקְחָה?', '☂️', ['🕶️', '⚽', '🎈']],
    ['לְסָבְתָא יֵשׁ חָתוּל. הֶחָתוּל אוֹהֵב לִישֹׁן עַל הַסַּפָּה.', 'מִי אוֹהֵב לִישֹׁן?', '🐱', ['🐶', '🐰', '🐦']],
    ['נוֹעָה בָּנְתָה אַרְמוֹן בַּחוֹל. הַיָּם הָיָה כָּחֹל.', 'אֵיפֹה נוֹעָה הָיְתָה?', '🏖️', ['🏔️', '🏫', '🌳']]
  ];
  /* שפה: הפכים, חרוזים, קטגוריות, פעולות, יחיד/רבים, זמנים */
  var OPP = [['גָּדוֹל', '🐘', 'קָטָן', '🐭'], ['חַם', '🔥', 'קַר', '🧊'], ['יוֹם', '☀️', 'לַיְלָה', '🌙'], ['שָׂמֵחַ', '😀', 'עָצוּב', '😢'],
             ['מָהִיר', '🐇', 'אִטִּי', '🐢'], ['גָּבוֹהַּ', '🦒', 'נָמוּךְ', '🐧'], ['מָלֵא', '🥛', 'רֵיק', '🫙'], ['פָּתוּחַ', '📖', 'סָגוּר', '📕']];
  var RHYME = [['סוּס', '🐴', 'כּוֹס', '🥛'], ['תּוּת', '🍓', 'חוּט', '🧵'], ['דֹּב', '🐻', 'טוֹב', '👍'], ['גַּן', '🌷', 'עָנָן', '☁️'], ['שִׁיר', '🎵', 'עִיר', '🏙️'],
               ['מַיִם', '💧', 'שָׁמַיִם', '🌌'], ['לֵב', '❤️', 'זְאֵב', '🐺'], ['כּוֹבַע', '🎩', 'אֶצְבַּע', '☝️'], ['פֶּרַח', '🌸', 'קֶרַח', '🧊'], ['חַלּוֹן', '🪟', 'בָּלוֹן', '🎈'], ['דָּג', '🐟', 'חַג', '🎉']];
  var CATS = { 'פֵּרוֹת': ['🍎', '🍌', '🍇', '🍓', '🍉', '🍐'], 'חַיּוֹת': ['🐶', '🐱', '🦁', '🐘', '🐰', '🐸'], 'כְּלֵי רֶכֶב': ['🚗', '🚌', '🚂', '✈️', '🚲', '🚀'], 'בְּגָדִים': ['👕', '👖', '👗', '🧦', '🧢', '🧥'] };
  var ACTS = [['✂️', 'מִסְפָּרַיִם', 'גּוֹזְרִים'], ['🖍️', 'צֶבַע', 'מְצַיְּרִים'], ['🥄', 'כַּף', 'אוֹכְלִים'], ['🛏️', 'מִטָּה', 'יְשֵׁנִים'], ['📖', 'סֵפֶר', 'קוֹרְאִים'], ['🚿', 'מִקְלַחַת', 'מִתְרַחֲצִים'], ['⚽', 'כַּדּוּר', 'מְשַׂחֲקִים']];
  var PLURAL = [['יֶלֶד', 'יְלָדִים'], ['סֵפֶר', 'סְפָרִים'], ['כֶּלֶב', 'כְּלָבִים'], ['פֶּרַח', 'פְּרָחִים'], ['עֵץ', 'עֵצִים'], ['יַלְדָּה', 'יְלָדוֹת'], ['בֻּבָּה', 'בֻּבּוֹת'], ['תַּפּוּחַ', 'תַּפּוּחִים']];
  var TENSE = [['אֶתְמוֹל אֲנִי ___ לַגַּן', 'הָלַכְתִּי', ['הוֹלֶכֶת', 'אֵלֵךְ']], ['מָחָר אֲנִי ___ עוּגָה', 'אֹכַל', ['אָכַלְתִּי', 'אוֹכֶלֶת']], ['עַכְשָׁו אֲנִי ___ סֵפֶר', 'קוֹרֵאת', ['קָרָאתִי', 'אֶקְרָא']],
               ['אֶתְמוֹל ___ גֶּשֶׁם', 'יָרַד', ['יוֹרֵד', 'יֵרֵד']], ['מָחָר ___ יוֹם הֻלֶּדֶת שֶׁלִּי', 'יִהְיֶה', ['הָיָה', 'הוֹוֶה']]];

  /* אוצר מילים באנגלית לפי נושא: [אימוג'י, עברית, אנגלית] */
  var ENV = {
    colors: [['🔴', 'אדום', 'Red'], ['🔵', 'כחול', 'Blue'], ['🟡', 'צהוב', 'Yellow'], ['🟢', 'ירוק', 'Green'], ['🟠', 'כתום', 'Orange'], ['🟣', 'סגול', 'Purple'], ['⚫', 'שחור', 'Black'], ['⚪', 'לבן', 'White']],
    numbers: [['1️⃣', 'אחת', 'One'], ['2️⃣', 'שתיים', 'Two'], ['3️⃣', 'שלוש', 'Three'], ['4️⃣', 'ארבע', 'Four'], ['5️⃣', 'חמש', 'Five'], ['6️⃣', 'שש', 'Six'], ['7️⃣', 'שבע', 'Seven'], ['8️⃣', 'שמונה', 'Eight'], ['9️⃣', 'תשע', 'Nine'], ['🔟', 'עשר', 'Ten']],
    body: [['👁️', 'עין', 'Eye'], ['👃', 'אף', 'Nose'], ['👂', 'אוזן', 'Ear'], ['👄', 'פה', 'Mouth'], ['✋', 'יד', 'Hand'], ['🦶', 'רגל', 'Foot'], ['🦷', 'שן', 'Tooth']],
    family: [['👩', 'אמא', 'Mom'], ['👨', 'אבא', 'Dad'], ['👶', 'תינוק', 'Baby'], ['👵', 'סבתא', 'Grandma'], ['👴', 'סבא', 'Grandpa'], ['👧', 'אחות', 'Sister'], ['👦', 'אח', 'Brother']],
    clothes: [['👕', 'חולצה', 'Shirt'], ['👖', 'מכנסיים', 'Pants'], ['👗', 'שמלה', 'Dress'], ['👟', 'נעל', 'Shoe'], ['🧦', 'גרביים', 'Socks'], ['🧢', 'כובע', 'Hat'], ['🧥', 'מעיל', 'Coat']],
    actions: [['🏃‍♀️', 'רצה', 'Run'], ['🍽️', 'אוכלת', 'Eat'], ['😴', 'ישנה', 'Sleep'], ['🏊‍♀️', 'שוחה', 'Swim'], ['💃', 'רוקדת', 'Dance'], ['📖', 'קוראת', 'Read'], ['✍️', 'כותבת', 'Write'], ['🎤', 'שרה', 'Sing']],
    feelings: [['😀', 'שמחה', 'Happy'], ['😢', 'עצובה', 'Sad'], ['😠', 'כועסת', 'Angry'], ['😨', 'מפחדת', 'Scared'], ['🥱', 'עייפה', 'Tired'], ['😲', 'מופתעת', 'Surprised']],
    weather: [['☀️', 'שמשי', 'Sunny'], ['🌧️', 'גשום', 'Rainy'], ['☁️', 'מעונן', 'Cloudy'], ['❄️', 'מושלג', 'Snowy'], ['🌬️', 'סוער', 'Windy'], ['🌈', 'קשת', 'Rainbow']],
    places: [['🏫', 'בית ספר', 'School'], ['🏠', 'בית', 'Home'], ['🏥', 'בית חולים', 'Hospital'], ['🏖️', 'חוף', 'Beach'], ['🌳', 'פארק', 'Park'], ['🛒', 'סופרמרקט', 'Supermarket']]
  };
  var TALK = [
    ['How are you?', "I'm fine, thank you!", ['I like pink!', 'I am six', 'Good night!']],
    ['What color do you like?', 'I like pink!', ["I'm fine", 'Yes, please', 'Good night!']],
    ['How old are you?', 'I am seven', ['I am happy', 'Thank you', 'Hello']],
    ['Do you like pizza?', 'Yes, I do!', ['I like pink!', 'Good morning', 'I am seven']],
    ['Good morning!', 'Good morning!', ['Good night!', 'Goodbye!', 'I am fine']],
    ['What color is the sky?', 'It is blue', ['It is red', 'I am blue', 'Yes, I do']]
  ];
  var SP3 = [['CAT', '🐱'], ['DOG', '🐶'], ['SUN', '☀️'], ['PIG', '🐷'], ['BUS', '🚌'], ['HAT', '🎩'], ['CUP', '☕'], ['BED', '🛏️'], ['FOX', '🦊'], ['EGG', '🥚']];
  var SP4 = [['FISH', '🐟'], ['BALL', '⚽'], ['CAKE', '🎂'], ['DUCK', '🦆'], ['FROG', '🐸'], ['STAR', '⭐'], ['BOOK', '📖'], ['MOON', '🌙'], ['TREE', '🌳'], ['BEAR', '🐻']];
  var SP5 = [['HOUSE', '🏠'], ['APPLE', '🍎'], ['TIGER', '🐯'], ['HORSE', '🐴'], ['PIZZA', '🍕'], ['TRAIN', '🚂'], ['WATER', '💧'], ['SMILE', '😊']];
  var WB2 = [['דג', '🐟'], ['יד', '✋'], ['הר', '⛰️'], ['לב', '❤️'], ['סל', '🧺'], ['נר', '🕯️']];
  var WB3 = [['פיל', '🐘'], ['סוס', '🐴'], ['דוב', '🐻'], ['קוף', '🐒'], ['תות', '🍓'], ['כלב', '🐶'], ['שמש', '☀️'], ['בית', '🏠'], ['ילד', '🧒'], ['כוס', '🥛']];
  var WB4 = [['חתול', '🐱'], ['אריה', '🦁'], ['בלון', '🎈'], ['פרפר', '🦋'], ['תפוח', '🍎'], ['כדור', '⚽'], ['עוגה', '🎂'], ['פרח', '🌸'], ['ספר', '📖'], ['רכבת', '🚂']];
  var WB5 = [['צפרדע', '🐸'], ['מטריה', '☂️'], ['שולחן', '🍽️'], ['מספריים', '✂️'], ['פינגווין', '🐧']];
  var WBF = [['ענן', '☁️'], ['שעון', '⏰'], ['גשם', '🌧️'], ['מים', '💧'], ['כף', '🥄'], ['עוף', '🐔'], ['עץ', '🌳'], ['ארץ', '🌍'], ['מלך', '🤴']];
  var HE_ABC = 'אבגדהוזחטיכלמנסעפצקרשת'.split(''), EN_ABC = 'ABCDEFGHIJKLMNOPRSTUVWY'.split('');
  var HE_NAME = {}; HE.forEach(function (x) { HE_NAME[x[0]] = x[1]; });
  HE_NAME['ן'] = 'נוּן סוֹפִית'; HE_NAME['ם'] = 'מֵם סוֹפִית'; HE_NAME['ף'] = 'פֵּא סוֹפִית'; HE_NAME['ץ'] = 'צָדִי סוֹפִית'; HE_NAME['ך'] = 'כַּף סוֹפִית';

  /* ---------- 4.5.2 בונה מילים ----------
     cfg: { word, emoji, lang:'he'|'en', extra: מספר מסיחים, hide: להסתיר תמונה (שמיעה בלבד), prefill: אותיות ראשונות שכבר במקום }
     הילדה לוחצת על אריחי אותיות לפי הסדר; אות נכונה נכנסת למשבצת הבאה, אות לא נכונה — ניעור עדין. */
  function builder(api, cfg) {
    var el = api.el, isHe = cfg.lang === 'he', letters = cfg.word.split(''), pos = cfg.prefill || 0, wrong = 0;
    var abc = isHe ? HE_ABC : EN_ABC;
    var pool = letters.slice(pos);
    for (var i = 0; i < (cfg.extra || 0); i++) { var d = pick(abc); if (letters.indexOf(d) < 0 && pool.indexOf(d) < 0) pool.push(d); else i--; }
    pool = mix(pool);
    var speakWord = function () { api.read([{ text: cfg.word, lang: isHe ? 'he-IL' : 'en-US' }], { interrupt: true }); };
    api.setRound({ speak: isHe ? 'בונים את המילה! לחצו על האותיות לפי הסדר.' : 'בונים מילה באנגלית! לחצו על האותיות לפי הסדר.', replay: cfg.hide ? speakWord : null, q: cfg.hide ? [{ text: cfg.word, lang: isHe ? 'he-IL' : 'en-US' }] : [] });
    el.instruction.textContent = cfg.hide ? 'הקשיבו ובנו את המילה' : (isHe ? 'בונים את המילה' : 'בונים מילה באנגלית');
    el.helper.textContent = isHe ? 'לחצו על האותיות לפי הסדר — מימין לשמאל.' : 'לחצו על האותיות לפי הסדר — משמאל לימין.';
    el.target.className = 'target wb-target';
    el.target.innerHTML = (cfg.hide ? '<button type="button" class="music-stage wb-hear" aria-label="השמעה">🔊</button>' : '<div class="wb-pic">' + cfg.emoji + '</div>') +
      '<div class="wb-slots" dir="' + (isHe ? 'rtl' : 'ltr') + '">' + letters.map(function (l, i) { return '<span class="wb-slot' + (i < pos ? ' filled' : '') + '">' + (i < pos ? l : '') + '</span>'; }).join('') + '</div>';
    if (cfg.hide) { el.target.querySelector('.wb-hear').addEventListener('click', speakWord); setTimeout(speakWord, 900); }
    el.answers.className = 'answer-grid wb-tiles';
    el.answers.style.gridTemplateColumns = 'repeat(' + Math.min(pool.length, 7) + ',minmax(0,1fr))';
    var slots = el.target.querySelectorAll('.wb-slot');
    pool.forEach(function (l) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'answer wb-tile'; b.textContent = l;
      if (!isHe) b.dir = 'ltr';
      b.addEventListener('click', function () {
        if (b.classList.contains('used') || pos >= letters.length) return;
        /* הקראת שם האות בכל לחיצה — לומדים את הצליל */
        api.read([{ text: isHe ? (HE_NAME[l] || l) : l, lang: isHe ? 'he-IL' : 'en-US' }], { interrupt: true });
        if (l === letters[pos]) {
          slots[pos].textContent = l; slots[pos].classList.add('filled', 'pop'); b.classList.add('used'); pos++;
          api.sound('pop');
          if (pos === letters.length) {
            el.target.querySelector('.wb-slots').classList.add('done');
            if (cfg.hide) { var pic = document.createElement('div'); pic.className = 'wb-pic'; pic.textContent = cfg.emoji; el.target.insertBefore(pic, el.target.firstChild); var h = el.target.querySelector('.wb-hear'); if (h) h.remove(); }
            setTimeout(function () { api.win(slots[slots.length - 1], 'בנית את המילה ' + cfg.word + '! ' + cfg.emoji, isHe ? 'כל הכבוד! ' + cfg.word : 'כל הכבוד!'); if (!isHe) setTimeout(speakWord, 700); }, 300);
          }
        } else {
          wrong++; api.sound('sad'); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
          api.feedback('try', 'כמעט! איזו אות באה עכשיו?');
          if (wrong >= 2) { /* רמז: האריח הנכון מהבהב */ Array.prototype.forEach.call(el.answers.children, function (t) { if (!t.classList.contains('used') && t.textContent === letters[pos]) { t.classList.remove('glow'); void t.offsetWidth; t.classList.add('glow'); } }); }
        }
      });
      el.answers.appendChild(b);
    });
  }
  function build(list, lang, opts) { return function (api) { var w = pick(list); builder(api, Object.assign({ word: w[0], emoji: w[1], lang: lang }, opts || {})); }; }

  /* ---------- 4.5.3 מחוללים ---------- */
  /* קריאה: מילה מנוקדת (או בלי ניקוד) ← בוחרים תמונה */
  function readPic(list, noNiqqud) {
    return function (api) {
      var w = pick(list), shown = noNiqqud ? plain(w[0]) : w[0];
      Q(api, { ins: 'מה כתוב? בחרו את התמונה', help: 'קראו לאט, אות אחרי אות.', success: 'קריאה מצוינת! ' + w[0] + ' ' + w[1], read: [{ text: w[0], lang: 'he-IL' }],
        target: '<div class="read-word big">' + shown + '</div>', opts: mix([w].concat(others(list, w, 3))).map(function (o) { return { h: BIG(o[1]), ok: o === w }; }) });
    };
  }
  /* קריאה: תמונה ← בוחרים את המילה הכתובה */
  function picWord(list, noNiqqud) {
    return function (api) {
      var w = pick(list);
      Q(api, { ins: 'איזו מילה מתאימה לתמונה?', help: 'קראו כל מילה ובחרו.', success: 'נכון! ' + w[0], read: [{ text: w[0], lang: 'he-IL' }],
        target: '<div class="nature-scene">' + w[1] + '</div>', opts: mix([w].concat(others(list, w, 3))).map(function (o) { return { h: L(noNiqqud ? plain(o[0]) : o[0], ' style="font-size:clamp(26px,3.4vw,44px)"'), ok: o === w }; }) });
    };
  }
  function fillBlank(api) {
    var f = pick(FILL);
    Q(api, { ins: 'איזו מילה חסרה?', help: 'קראו את המשפט עם כל מילה, ובחרו את מה שמתאים.', success: 'נכון! ' + f[0].replace('___', f[1]), read: [{ text: f[0].replace('___', f[1]), lang: 'he-IL' }],
      target: '<div class="read-word">' + f[0].replace('___', '<span class="q">____</span>') + ' ' + f[3] + '</div>',
      opts: mix([f[1]].concat(f[2])).map(function (o) { return { h: L(o), ok: o === f[1] }; }) });
  }
  function trueFalse(api) {
    var t = pick(TF);
    Q(api, { ins: 'נכון או לא נכון?', help: 'קראו את המשפט והסתכלו בתמונה.', success: t[2] ? 'נכון! המשפט נכון' : 'נכון! המשפט לא נכון', read: [{ text: t[0], lang: 'he-IL' }], q: [{ text: t[0], lang: 'he-IL' }],
      target: '<div class="read-word">' + t[0] + '</div><div class="nature-scene small">' + t[1] + '</div>',
      opts: [{ h: '✅' + L('נכון'), ok: t[2] }, { h: '❌' + L('לא נכון'), ok: !t[2] }] });
  }
  function readStory(api) {
    var s = pick(STORIES);
    Q(api, { ins: s[1], help: 'קראו את הסיפור (או הקשיבו) וענו על השאלה.', success: 'הבנת הנקרא מעולה! 📖', q: [{ text: s[0], lang: 'he-IL' }],
      target: '<div class="story-card">' + s[0] + '</div>', opts: mix([s[2]].concat(s[3])).map(function (o) { return { h: BIG(o), ok: o === s[2] }; }) });
  }
  /* שפה */
  function opposite(withPics) {
    return function (api) {
      var o = pick(OPP), flip = Math.random() < .5, a = flip ? [o[2], o[3]] : [o[0], o[1]], b = flip ? [o[0], o[1]] : [o[2], o[3]];
      var pool = OPP.map(function (x) { return flip ? [x[0], x[1]] : [x[2], x[3]]; });
      Q(api, { ins: 'מה ההפך של "' + a[0] + '"?', help: 'הפך = הכי שונה, כמו יום ולילה.', success: 'נכון! ' + a[0] + ' — ' + b[0],
        target: '<div class="bilingual-card"><span class="emoji">' + a[1] + '</span><span class="bilingual-copy"><strong class="hebrew">' + a[0] + '</strong></span></div>',
        opts: mix([b].concat(others(pool, b, 3, function (x, y) { return x[0] === y[0]; }))).map(function (x) { return { h: (withPics ? '<span>' + x[1] + '</span>' : '') + L(x[0]), ok: x[0] === b[0] }; }) });
    };
  }
  function rhyme(withPics) {
    return function (api) {
      var r = pick(RHYME), pool = RHYME.filter(function (x) { return x !== r; }).map(function (x) { return [x[2], x[3]]; });
      var right = [r[2], r[3]];
      Q(api, { ins: 'מה מתחרז עם "' + r[0] + '"?', help: 'חרוז = נגמר באותו צליל, כמו סוּס וכּוֹס.', success: 'נכון! ' + r[0] + ' — ' + r[2], q: [{ text: r[0], lang: 'he-IL' }],
        target: '<div class="bilingual-card"><span class="emoji">' + r[1] + '</span><span class="bilingual-copy"><strong class="hebrew">' + r[0] + '</strong></span></div>',
        opts: mix([right].concat(mix(pool).slice(0, 3))).map(function (x) { return { h: (withPics ? '<span>' + x[1] + '</span>' : '') + L(x[0]), ok: x === right }; }) });
    };
  }
  function oddCat(api) {
    var keys = Object.keys(CATS), k = pick(keys), k2 = pick(keys.filter(function (x) { return x !== k; }));
    var three = mix(CATS[k]).slice(0, 3), odd = pick(CATS[k2]);
    Q(api, { ins: 'מה לא שייך?', help: 'שלושה מאותה משפחה — ואחד לא.', success: 'נכון! כל השאר הם ' + k,
      opts: mix(three.concat([odd])).map(function (e) { return { h: BIG(e), ok: e === odd }; }) });
  }
  function whichCat(api) {
    var keys = Object.keys(CATS), k = pick(keys), right = pick(CATS[k]);
    var wrongs = keys.filter(function (x) { return x !== k; }).map(function (x) { return pick(CATS[x]); });
    Q(api, { ins: 'מה מהם שייך ל' + k + '?', help: 'חשבו לאיזו משפחה כל אחד שייך.', success: 'נכון! זה שייך ל' + k,
      opts: mix([right].concat(wrongs)).map(function (e) { return { h: BIG(e), ok: e === right }; }) });
  }
  function langMix(api) { pick([opposite(true), rhyme(true), oddCat, whichCat])(api); }
  function actions(api) {
    var a = pick(ACTS);
    Q(api, { ins: 'מה עושים עם ' + a[1] + '?', help: 'בחרו את הפעולה המתאימה.', success: 'נכון! עם ' + a[1] + ' ' + a[2],
      target: '<div class="nature-scene">' + a[0] + '</div>', opts: mix([a].concat(others(ACTS, a, 3))).map(function (o) { return { h: L(o[2]), ok: o === a }; }) });
  }
  function plural(api) {
    var p = pick(PLURAL), bad = p[0].replace(/[֑-ׇ]/g, '') + 'ות';
    var opts = mix([p[1], bad].concat(others(PLURAL.map(function (x) { return x[1]; }), p[1], 2)));
    Q(api, { ins: 'מה הרבים של "' + p[0] + '"?', help: 'אחד = יחיד, הרבה = רבים.', success: 'נכון! ' + p[0] + ' — ' + p[1],
      target: '<div class="read-word">' + p[0] + ' ← ?</div>', opts: opts.map(function (o) { return { h: L(o), ok: o === p[1] }; }) });
  }
  function tense(api) {
    var t = pick(TENSE);
    Q(api, { ins: 'איזו מילה מתאימה?', help: 'אתמול = עבר, עכשיו = הווה, מחר = עתיד.', success: 'נכון! ' + t[0].replace('___', t[1]), read: [{ text: t[0].replace('___', t[1]), lang: 'he-IL' }],
      target: '<div class="read-word">' + t[0].replace('___', '<span class="q">____</span>') + '</div>', opts: mix([t[1]].concat(t[2])).map(function (o) { return { h: L(o), ok: o === t[1] }; }) });
  }
  /* אנגלית: שיחה — שומעים שאלה ובוחרים תשובה מתאימה */
  function talk(api) {
    var t = pick(TALK);
    Q(api, { ins: 'מה עונים?', help: 'הקשיבו לשאלה באנגלית ובחרו תשובה.', success: 'Great answer! 🌟', q: [{ text: t[0], lang: 'en-US' }], read: [{ text: t[1], lang: 'en-US' }],
      target: '<div class="read-word" dir="ltr">💬 ' + t[0] + '</div>', opts: mix([t[1]].concat(t[2])).map(function (o) { return { h: L(o, ' dir="ltr" style="font-size:clamp(17px,2vw,26px)"'), ok: o === t[1] }; }) });
  }
  /* איות: שומעים מילה ← בוחרים אות ראשונה */
  function hearFirst(api) {
    var w = pick(SP3.concat(SP4)), first = w[0][0], play = function () { api.read([{ text: w[0].toLowerCase(), lang: 'en-US' }]); };
    Q(api, { ins: 'באיזו אות מתחילה המילה?', help: 'הקשיבו למילה באנגלית והקשיבו לצליל הראשון.', success: 'נכון! ' + w[0] + ' מתחילה ב-' + first, replay: play, q: [{ text: w[0].toLowerCase(), lang: 'en-US' }],
      target: '<div class="nature-scene">' + w[1] + '</div>', opts: mix([first].concat(others(EN_ABC, first, 3))).map(function (l) { return { h: L(l, ' dir="ltr" style="font-size:clamp(34px,4.5vw,56px)"'), ok: l === first }; }) });
  }
  /* איות: אות חסרה (index=0 ראשונה, 'mid' באמצע) */
  function missingLetter(where) {
    return function (api) {
      var w = pick(where === 'mid' ? SP3.concat(SP4) : SP3), i = where === 'mid' ? rnd(1, w[0].length - 2) : 0, l = w[0][i];
      var shown = w[0].slice(0, i) + '_' + w[0].slice(i + 1);
      Q(api, { ins: 'איזו אות חסרה?', help: 'אמרו את המילה באנגלית וחשבו מה חסר.', success: 'נכון! ' + w[0], read: [{ text: w[0].toLowerCase(), lang: 'en-US' }],
        target: '<div class="nature-scene small">' + w[1] + '</div><div class="read-word" dir="ltr">' + shown + '</div>',
        opts: mix([l].concat(others(EN_ABC, l, 3))).map(function (x) { return { h: L(x, ' dir="ltr" style="font-size:clamp(34px,4.5vw,56px)"'), ok: x === l }; }) });
    };
  }
  /* איות: איזו מילה כתובה נכון? (שיבושים: החלפת אותיות, השמטה, כפילות) */
  function rightSpelling(api) {
    var w = pick(SP4.concat(SP5)), word = w[0], bad = [];
    var sw = word.split(''), i = rnd(0, word.length - 2), t = sw[i]; sw[i] = sw[i + 1]; sw[i + 1] = t; bad.push(sw.join(''));
    var j = rnd(1, word.length - 1); bad.push(word.slice(0, j) + word.slice(j + 1));
    var k = rnd(0, word.length - 1); bad.push(word.slice(0, k) + word[k] + word.slice(k));
    bad = bad.filter(function (b, idx) { return b !== word && bad.indexOf(b) === idx; });
    while (bad.length < 3) bad.push(word.slice(0, -1) + pick(EN_ABC));
    Q(api, { ins: 'איזו מילה כתובה נכון?', help: 'הסתכלו על כל אות.', success: 'נכון! ' + word, read: [{ text: word.toLowerCase(), lang: 'en-US' }],
      target: '<div class="nature-scene">' + w[1] + '</div>', opts: mix([word].concat(bad.slice(0, 3))).map(function (o) { return { h: L(o, ' dir="ltr" style="font-size:clamp(24px,3vw,40px);letter-spacing:2px"'), ok: o === word }; }) });
  }

  /* ---------- פרק 5 — טבלת הפרקים ---------- */
  /* עוזר קצר ליצירת פרק */
  function C(n, f) { return { n: n, f: f }; }
  /* פאזל לפי גודל לוח ועוצמת צללית */
  function puzzle(rows, cols, ghost) { return function (api) { AcademyPuzzle.start(api, { rows: rows, cols: cols, ghost: ghost }); }; }
  var HE_GROUPS = ['אבגדה', 'וזחטי', 'כלמנס', 'עפצקרשת'];

  var CHAPTERS = {
    numbers: {
      young: [C('ספירה עד 5', count(5)), C('ספירה עד 10', count(10)), C('מה בא אחרי?', seq(1, 10)), C('גדול או קטן?', compare(1, 10)), C('ספירה עד 20', count(20))],
      big: [C('רצף עד 100', seq(11, 99)), C('השוואה עד 100', compare(10, 99)), C('קפיצות', skip), C('עשרות ואחדות', tensOnes), C('זוגי ואי-זוגי', evenOdd)]
    },
    colors: {
      young: [C('צבעי יסוד', colorName(4)), C('כל הצבעים', colorName(8)), C('מה בצבע הזה?', objectColor), C('מי יוצא דופן?', oddColor), C('ערבוב קסם', colorMix(MIXES.slice(0, 3)))],
      big: [C('ערבוב צבעים', colorMix(MIXES)), C('ערבוב הפוך', mixReverse), C('כהה ובהיר', darker), C('צבעים באנגלית', colorEnglish), C('צבעי העולם', objectColor)]
    },
    shapes: {
      young: [C('3 צורות', shapeName(3)), C('כל הצורות', shapeName(5)), C('צורות בעולם', shapeWorld), C('כמה פינות?', corners([['עיגול', 0], ['משולש', 3], ['ריבוע', 4]])), C('מי יוצא דופן?', oddShape)],
      big: [C('כמה פינות?', corners(POLYS)), C('שמות המצולעים', polyName), C('פינות ביחד', cornersSum), C('גופים', solids), C('צורות בעולם', shapeWorld)]
    },
    patterns: {
      young: [C('שני צבעים', pattern([0, 1], true)), C('שתי צורות', pattern([0, 1])), C('AAB', pattern([0, 0, 1])), C('ABB', pattern([0, 1, 1])), C('ABC', pattern([0, 1, 2]))],
      big: [C('ABC', pattern([0, 1, 2])), C('AABB', pattern([0, 0, 1, 1])), C('ABCD', pattern([0, 1, 2, 3])), C('דפוס מספרים', numPattern), C('דפוס שגדל', growing)]
    },
    letters: {
      young: [C('א–ה', startsWith(HE_GROUPS[0])), C('ו–י', startsWith(HE_GROUPS[1])), C('כ–ס', startsWith(HE_GROUPS[2])), C('ע–ת', startsWith(HE_GROUPS[3])), C('כל האותיות', startsWith(null))],
      big: [C('אות פותחת', firstLetter), C('קוראים מילה', readWord), C('כמה אותיות?', letterCount), C('אות אחרונה', lastLetter), C('קוראים משפט', readSentence)]
    },
    english: {
      young: [C('A–F', enStarts('A', 'F')), C('G–L', enStarts('G', 'L')), C('M–R', enStarts('M', 'R')), C('S–Z', enStarts('S', 'Z')), C('גדולות וקטנות', enCase)],
      big: [C('מילה לתמונה', enWord), C('אות ראשונה', enFirst), C('מספרים', enNumbers), C('צבעים', colorEnglish), C('משפטים', enSentence)]
    },
    animals: {
      young: [C('חיות בית', listenPick(ANIMALS.pets)), C('חיות חווה', listenPick(ANIMALS.farm)), C('חיות ג׳ונגל', listenPick(ANIMALS.jungle)), C('חיות ים', listenPick(ANIMALS.sea)), C('כל החיות', listenPick(all(ANIMALS)))],
      big: [C('חיות בית', readPick(ANIMALS.pets)), C('חיות חווה', readPick(ANIMALS.farm)), C('חיות ג׳ונגל', readPick(ANIMALS.jungle)), C('חיות ים', readPick(ANIMALS.sea)), C('כותבים באנגלית', pickWord(all(ANIMALS)))]
    },
    food: {
      young: [C('פירות', listenPick(FOODS.fruit)), C('ירקות', listenPick(FOODS.veg)), C('ארוחות', listenPick(FOODS.meal)), C('מתוקים ושתייה', listenPick(FOODS.sweet)), C('כל האוכל', listenPick(all(FOODS)))],
      big: [C('פירות', readPick(FOODS.fruit)), C('ירקות', readPick(FOODS.veg)), C('ארוחות', readPick(FOODS.meal)), C('מתוקים ושתייה', readPick(FOODS.sweet)), C('כותבים באנגלית', pickWord(all(FOODS)))]
    },
    size: {
      young: [C('גדול או קטן', sameItemSize), C('הכי גדול', threeSizes(true)), C('ארוך או קצר', longShort), C('גדול במציאות', realCompare(BY_SIZE, 'גדול', 'קטן', true)), C('הכי קטן', threeSizes(false))],
      big: [C('גדול במציאות', realCompare(BY_SIZE, 'גדול', 'קטן')), C('כבד או קל', realCompare(BY_WEIGHT, 'כבד', 'קל')), C('מהיר או איטי', realCompare(BY_SPEED, 'מהיר', 'איטי')), C('גבוה או נמוך', realCompare(BY_HEIGHT, 'גבוה', 'נמוך')), C('מי באמצע?', middleSize)]
    },
    memory: {
      young: [C('3 זוגות', memory(3, 'same')), C('4 זוגות', memory(4, 'same')), C('5 זוגות', memory(5, 'same')), C('6 זוגות', memory(6, 'same')), C('8 זוגות', memory(8, 'same'))],
      big: [C('6 זוגות', memory(6, 'same')), C('8 זוגות', memory(8, 'same')), C('אות ותמונה', memory(6, 'letter')), C('מספר ונקודות', memory(6, 'dots')), C('10 זוגות', memory(10, 'same'))]
    },
    puzzles: {
      young: [C('4 חתיכות', puzzle(2, 2, .45)), C('6 חתיכות', puzzle(2, 3, .4)), C('9 חתיכות', puzzle(3, 3, .35)), C('9 בלי עזרה', puzzle(3, 3, .15)), C('12 חתיכות', puzzle(3, 4, .3))],
      big: [C('9 חתיכות', puzzle(3, 3, .25)), C('12 חתיכות', puzzle(3, 4, .2)), C('16 חתיכות', puzzle(4, 4, .2)), C('16 בלי עזרה', puzzle(4, 4, .06)), C('20 חתיכות', puzzle(4, 5, .12))]
    },
    math: {
      young: [C('חיבור עד 5', addUpTo(5)), C('חיבור עד 10', addUpTo(10)), C('חיסור', subSmall), C('מה חסר?', missing), C('סיפורי חשבון', story)],
      big: [C('חיבור עד 20', arith(20, false)), C('עד 100', arith(99, true)), C('שעון: שלמות וחצאים', clock([0, 30])), C('שעון: רבעים', clock([15, 45, 0, 30])), C('כסף', money)]
    },
    music: {
      young: [C('כלי נגינה', instrument), C('גבוה או נמוך', highLow), C('ארוך או קצר', longShortSound), C('מהיר או איטי', fastSlow), C('סיימון 2', simon(2))],
      big: [C('ספירת תיפופים', drums), C('סיימון 3', simon(3)), C('אותו מקצב?', sameRhythm), C('סיימון 4', simon(4)), C('סיימון 5', simon(5))]
    },
    reading: {
      young: [C('מילים קצרות', readPic(R2)), C('3 אותיות', readPic(R3)), C('מילים ארוכות', readPic(R4)), C('תמונה ← מילה', picWord(R2.concat(R3))), C('משפטים', readSentence)],
      big: [C('בלי ניקוד', readPic(R3.concat(R4), true)), C('תמונה ← מילה', picWord(R3.concat(R4), true)), C('מילה חסרה', fillBlank), C('נכון או לא?', trueFalse), C('סיפור קצר', readStory)]
    },
    wordbuild: {
      young: [C('2 אותיות', build(WB2, 'he')), C('3 אותיות', build(WB3, 'he', { prefill: 1 })), C('3 אותיות לבד', build(WB3, 'he')), C('עם אות מבלבלת', build(WB3, 'he', { extra: 1 })), C('4 אותיות', build(WB4, 'he'))],
      big: [C('4 אותיות', build(WB4, 'he', { extra: 1 })), C('מילים ארוכות', build(WB5, 'he')), C('אותיות סופיות', build(WBF, 'he', { extra: 2 })), C('עם מסיחים', build(WB4.concat(WB5), 'he', { extra: 2 })), C('שמיעה בלבד', build(WB3.concat(WB4), 'he', { hide: true, extra: 1 }))]
    },
    language: {
      young: [C('הפכים', opposite(true)), C('חרוזים', rhyme(true)), C('מה לא שייך?', oddCat), C('משפחות', whichCat), C('ערבוב', langMix)],
      big: [C('הפכים במילים', opposite(false)), C('חרוזים במילים', rhyme(false)), C('יחיד ורבים', plural), C('מה עושים עם…', actions), C('אתמול, היום, מחר', tense)]
    },
    envocab: {
      young: [C('Colors', listenPick(ENV.colors)), C('Numbers', listenPick(ENV.numbers)), C('Body', listenPick(ENV.body)), C('Family', listenPick(ENV.family)), C('Clothes', listenPick(ENV.clothes))],
      big: [C('Actions', readPick(ENV.actions)), C('Feelings', readPick(ENV.feelings)), C('Weather', readPick(ENV.weather)), C('Places', readPick(ENV.places)), C('Talk', talk)]
    },
    enspell: {
      young: [C('צליל ראשון', hearFirst), C('_at — מה חסר?', missingLetter(0)), C('בונים CAT', build(SP3, 'en')), C('עם אות מבלבלת', build(SP3, 'en', { extra: 2 })), C('4 אותיות', build(SP4, 'en'))],
      big: [C('אות באמצע', missingLetter('mid')), C('בונים 4–5', build(SP4.concat(SP5), 'en')), C('איות נכון', rightSpelling), C('עם מסיחים', build(SP4.concat(SP5), 'en', { extra: 3 })), C('שמיעה בלבד', build(SP3.concat(SP4), 'en', { hide: true, extra: 2 }))]
    },
    nature: {
      young: [C('איפה גרים?', habitat), C('מזג אוויר', weather), C('מה אוכלים?', eats), C('יום או לילה', dayNight), C('ערבוב טבע', natureMix)],
      big: [C('עונות השנה', season), C('מחזור חיים', cycle), C('עובדות מדהימות', facts(FACTS, '🌍🔍')), C('החלל', facts(SPACE, '🚀🪐')), C('כמה רגליים?', legs)]
    }
  };

  /* ---------- פרק 6 — ייצוא ---------- */
  window.AcademyModules = {
    /* תחנות חדשות שמופיעות ברשימה (בנוסף ל-11 המקוריות) */
    meta: {
      math: { name: 'חשבון גיבורים', subtitle: 'חיבור, שעון וכסף', icon: '➕', color: '#ffc93c', title: 'חשבון של גיבורים', mascot: '🦸‍♀️' },
      music: { name: 'מוזיקה', subtitle: 'צלילים ומנגינות', icon: '🎵', color: '#ff5fb0', title: 'מעבדת הצלילים', mascot: '🎤' },
      reading: { name: 'קריאה', subtitle: 'מילים, משפטים וסיפורים', icon: '📖', color: '#ff8fc4', title: 'קוראות כמו גיבורות', mascot: '📚' },
      wordbuild: { name: 'בונים מילים', subtitle: 'אות אחרי אות', icon: '🧱', color: '#ffb31c', title: 'מעבדת המילים', mascot: '🔤' },
      language: { name: 'שפה', subtitle: 'הפכים, חרוזים ועוד', icon: '💬', color: '#8b5cff', title: 'קסם השפה', mascot: '🦜' },
      envocab: { name: 'English Words', subtitle: 'מילים באנגלית', icon: '🇬🇧', color: '#3d8bff', title: 'Hero English', mascot: '🦉' },
      enspell: { name: 'Spelling', subtitle: 'איות באנגלית', icon: '🔠', color: '#29c5ff', title: 'Super Spelling', mascot: '🐝' },
      nature: { name: 'טבע', subtitle: 'חיות, עונות וחלל', icon: '🌿', color: '#3ff2b0', title: 'חוקרות הטבע', mascot: '🦉' }
    },
    CHAPTERS: CHAPTERS,
    CH_COUNT: 5,
    /* englishPhrases — כל הטקסטים באנגלית שהאפליקציה מקריאה (משמש ליצירת הקלטות קול טבעיות: tools/gen_voice.py) */
    englishPhrases: function () {
      var out = [];
      EN.forEach(function (x) { out.push(x[1], 'What starts with ' + x[0] + '?'); });
      out = out.concat(EN_NUMBERS.slice(1), EN_SENT.map(function (x) { return x[0]; }), COLORS.map(function (x) { return x[2]; }));
      all(ANIMALS).concat(all(FOODS)).forEach(function (x) { out.push(x[2]); });
      Object.keys(ENV).forEach(function (k) { ENV[k].forEach(function (x) { out.push(x[2]); }); });
      TALK.forEach(function (t) { out.push(t[0], t[1]); out = out.concat(t[2]); });
      SP3.concat(SP4, SP5).forEach(function (x) { out.push(x[0].toLowerCase()); });
      return out;
    }
  };
})();
