/* =====================================================================
   js/academy-modules.js — אקדמיית הגיבורים: נושאים חדשים ורמת קושי 7–8
   ---------------------------------------------------------------------
   הקובץ מתחבר ל-learning.html דרך window.AcademyModules. הדף מעביר לכל
   פונקציה אובייקט api עם כלי עזר (ראו פרק 0), כך שהקוד כאן לא תלוי
   במשתנים הפנימיים של הדף.

   פרק 0 — חוזה ה-api (מה הדף מספק)
   פרק 1 — כלי שמע: תווים, כלי נגינה ותיפופים (Web Audio)
   פרק 2 — תחנה חדשה: חשבון גיבורים (5–6 / 7–8)
   פרק 3 — תחנה חדשה: מוזיקה (5–6 / 7–8)
   פרק 4 — תחנה חדשה: טבע (5–6 / 7–8)
   פרק 5 — רמת 7–8 לתחנות הקיימות (מספרים, צבעים, צורות, דפוסים,
           אותיות, אנגלית, חיות, אוכל, גודל)
   פרק 6 — ייצוא
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- פרק 0 — חוזה ה-api ----------
     api.el            — אלמנטים של הדף: instruction, helper, target, answers, feedback, next
     api.answer(html, isCorrect, extraClass, color) — יוצר כפתור תשובה רגיל (הדף מטפל בנכון/לא נכון ובפרס)
     api.setRound(obj) — מגדיר את השאלה הנוכחית: { speak, read:[{text,lang}], success }
     api.random(list) / api.shuffle(list) / api.choicesFor(correct, pool, count)
     api.big()         — true כשנבחרה רמת 7–8
     api.win(origin, text, speech) — סיום משימה מיוחדת (למשל סיימון) עם כוכב + פרס
     api.feedback(cls, text) — הודעה בשורת המשוב ('good' / 'try' / '')
     api.say(text) / api.sound(name) / api.soundOn()                                  */

  /* עוזר: מספר שלם אקראי בין a ל-b כולל */
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

  /* עוזר: 4 תשובות מספריות — הנכונה ועוד 3 קרובות אליה, בלי כפילויות ובלי שליליים */
  function numberOptions(correct, spread, min) {
    var set = [correct], guard = 0;
    min = min == null ? 0 : min;
    while (set.length < 4 && guard++ < 200) {
      var v = correct + rnd(-spread, spread);
      if (v >= min && set.indexOf(v) < 0) set.push(v);
    }
    return set;
  }

  /* ---------- פרק 1 — כלי שמע ---------- */
  var Audio = {
    /* מחזיר AudioContext ויציאה משותפת מ-audio.js (עם המדחס שמונע עיוות) */
    ctx: function () { return window.Sound && Sound.getCtx ? Sound.getCtx() : null; },
    out: function () { var c = this.ctx(); return (window.Sound && Sound.getBus && Sound.getBus()) || (c && c.destination); },
    on: function () { return !window.Sound || Sound.isOn(); },

    /* note(freq, start, dur, type, vol, opts) — תו בודד עם מעטפת (attack/decay) */
    note: function (freq, start, dur, type, vol, opts) {
      var c = this.ctx(); if (!c || !this.on()) return;
      opts = opts || {};
      var t = c.currentTime + (start || 0), o = c.createOscillator(), g = c.createGain();
      o.type = type || 'triangle';
      o.frequency.setValueAtTime(freq, t);
      if (opts.slide) o.frequency.exponentialRampToValueAtTime(opts.slide, t + dur);
      if (opts.vibrato) { /* ויברטו לכינור */
        var l = c.createOscillator(), lg = c.createGain();
        l.frequency.value = 6; lg.gain.value = freq * 0.012; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + .05);
      }
      var a = opts.attack || 0.01;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.2, t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.out());
      o.start(t); o.stop(t + dur + 0.05);
    },

    /* drum(start) — תיפוף: צליל נמוך שיורד מהר (בום) */
    drum: function (start) { this.note(160, start, 0.28, 'sine', 0.5, { slide: 45 }); },

    /* instrument(kind) — קירוב קולי לכל כלי נגינה */
    instrument: function (kind) {
      var self = this, mel = [523, 659, 784];
      if (kind === 'drum') { [0, .3, .6, .75].forEach(function (s) { self.drum(s); }); }
      if (kind === 'piano') { mel.concat(1046).forEach(function (f, i) { self.note(f, i * .18, .6, 'triangle', .25); }); }
      if (kind === 'guitar') { [330, 392, 494, 659].forEach(function (f, i) { self.note(f, i * .14, .5, 'sawtooth', .12); }); }
      if (kind === 'trumpet') { [523, 523, 659, 784].forEach(function (f, i) { self.note(f, i * .2, .22, 'square', .1, { attack: .04 }); }); }
      if (kind === 'violin') { [659, 587, 523].forEach(function (f, i) { self.note(f, i * .45, .5, 'sawtooth', .09, { attack: .12, vibrato: true }); }); }
      if (kind === 'sax') { [294, 349, 392, 349].forEach(function (f, i) { self.note(f, i * .24, .3, 'square', .09, { attack: .05, vibrato: true }); }); }
    }
  };

  /* ---------- פרק 2 — חשבון גיבורים ---------- */
  var MATH_ITEMS = ['🍎', '⭐', '🎈', '🍓', '🦋', '🍪', '💎', '🐥'];

  /* 2.1 ציור קבוצת פריטים (לתרגילי חיבור/חיסור לקטנים) */
  function group(emoji, n, crossed) {
    var h = '<span class="math-group">';
    for (var i = 0; i < n; i++) h += '<span class="count-item' + (crossed && i >= n - crossed ? ' gone' : '') + '" style="animation-delay:' + (i * 50) + 'ms">' + emoji + '</span>';
    return h + '</span>';
  }

  /* 2.2 שעון מחוגים ב-SVG: hour 1–12, min 0/15/30/45 */
  function clockSVG(hour, min) {
    var s = '<svg class="clock" viewBox="0 0 200 200"><circle cx="100" cy="100" r="92" fill="#fffaf0" stroke="#1b1036" stroke-width="8"/>';
    for (var i = 1; i <= 12; i++) {
      var a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      s += '<text x="' + (100 + Math.cos(a) * 70).toFixed(1) + '" y="' + (100 + Math.sin(a) * 70 + 8).toFixed(1) + '" text-anchor="middle" font-size="22" font-weight="900" fill="#1b1036" font-family="Rubik,sans-serif">' + i + '</text>';
    }
    var ha = ((hour % 12) + min / 60) * 30, ma = min * 6;
    s += '<line x1="100" y1="100" x2="100" y2="52" stroke="#ff2e93" stroke-width="10" stroke-linecap="round" transform="rotate(' + ha + ' 100 100)"/>';
    s += '<line x1="100" y1="100" x2="100" y2="30" stroke="#1b1036" stroke-width="6" stroke-linecap="round" transform="rotate(' + ma + ' 100 100)"/>';
    return s + '<circle cx="100" cy="100" r="8" fill="#ffc93c" stroke="#1b1036" stroke-width="3"/></svg>';
  }
  var HOUR_WORDS = ['', 'אחת', 'שתיים', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע', 'עשר', 'אחת-עשרה', 'שתים-עשרה'];
  function clockLabel(h, m) { return h + ':' + (m < 10 ? '0' : '') + m; }
  function clockSpeech(h, m) { return HOUR_WORDS[h] + (m === 30 ? ' וחצי' : m === 15 ? ' ורבע' : m === 45 ? ' פחות רבע' : ''); }

  /* 2.3 מטבע שקלים ב-HTML */
  function coin(v) { return '<span class="shekel s' + v + '">' + v + '<small>₪</small></span>'; }

  /* 2.4 סבב חשבון — בוחר סוג תרגיל לפי הרמה */
  function mathRound(api) {
    var big = api.big(), kind = big ? api.random(['arith', 'arith', 'clock', 'money']) : api.random(['add', 'add', 'add', 'sub']);
    var el = api.el;
    el.target.className = 'target';

    /* קטנים: חיבור עד 10 עם חפצים */
    if (kind === 'add') {
      var a = rnd(1, 5), b = rnd(1, 10 - a), e = api.random(MATH_ITEMS), sum = a + b;
      api.setRound({ speak: a + ' ועוד ' + b + ', כמה זה ביחד?', read: [{ text: a + ' ועוד ' + b + ' זה ' + sum, lang: 'he-IL' }], success: 'יש! ' + a + ' + ' + b + ' = ' + sum });
      el.instruction.textContent = 'כמה זה ביחד?';
      el.helper.textContent = 'ספרו את שתי הקבוצות יחד.';
      el.target.innerHTML = '<div class="math-row">' + group(e, a) + '<b class="op">+</b>' + group(e, b) + '<b class="op">=</b><b class="op q">?</b></div>';
      numberOptions(sum, 3, 1).forEach(function (v) { api.answer(String(v), v === sum); });
      return;
    }
    /* קטנים: חיסור — חלק מהחפצים "עפים" */
    if (kind === 'sub') {
      var n = rnd(3, 8), k = rnd(1, n - 1), em = api.random(['🎈', '🦋', '🐥']), left = n - k;
      api.setRound({ speak: 'היו ' + n + ', ' + k + ' עפו. כמה נשארו?', read: [{ text: n + ' פחות ' + k + ' זה ' + left, lang: 'he-IL' }], success: 'מעולה! נשארו ' + left });
      el.instruction.textContent = 'היו ' + n + ', ' + k + ' עפו. כמה נשארו?';
      el.helper.textContent = 'ספרו רק את מה שנשאר (בלי השקופים).';
      el.target.innerHTML = '<div class="math-row">' + group(em, n, k) + '</div>';
      numberOptions(left, 3, 0).forEach(function (v) { api.answer(String(v), v === left); });
      return;
    }
    /* גדולים: חיבור וחיסור עד 100 */
    if (kind === 'arith') {
      var plus = Math.random() < .55, x, y, res;
      if (plus) { x = rnd(10, 70); y = rnd(3, 99 - x); res = x + y; } else { x = rnd(20, 99); y = rnd(3, x - 5); res = x - y; }
      var sign = plus ? '+' : '−';
      api.setRound({ speak: x + (plus ? ' ועוד ' : ' פחות ') + y, read: [{ text: x + (plus ? ' ועוד ' : ' פחות ') + y + ' זה ' + res, lang: 'he-IL' }], success: 'גאונה! ' + x + ' ' + sign + ' ' + y + ' = ' + res });
      el.instruction.textContent = 'פותרים את התרגיל';
      el.helper.textContent = 'טיפ: קודם העשרות, אחר כך האחדות.';
      el.target.innerHTML = '<div class="equation" dir="ltr">' + x + ' <b>' + sign + '</b> ' + y + ' <b>=</b> <span class="q">?</span></div>';
      numberOptions(res, 10, 0).forEach(function (v) { api.answer(String(v), v === res); });
      return;
    }
    /* גדולים: שעון — שעות שלמות, חצאים ורבעים */
    if (kind === 'clock') {
      var h = rnd(1, 12), m = api.random([0, 0, 30, 30, 15, 45]);
      api.setRound({ speak: 'מה השעה בשעון?', read: [{ text: 'השעה ' + clockSpeech(h, m), lang: 'he-IL' }], success: 'נכון! השעה ' + clockSpeech(h, m) });
      el.instruction.textContent = 'מה השעה?';
      el.helper.textContent = 'המחוג הקצר (הוורוד) מראה שעה, הארוך מראה דקות.';
      el.target.innerHTML = clockSVG(h, m);
      var opts = [[h, m]], guard = 0;
      while (opts.length < 4 && guard++ < 100) {
        var cand = api.random([[h, (m + 30) % 60], [h % 12 + 1, m], [(h + 10) % 12 + 1, m], [rnd(1, 12), api.random([0, 30, 15, 45])]]);
        if (!opts.some(function (o) { return o[0] === cand[0] && o[1] === cand[1]; })) opts.push(cand);
      }
      api.shuffle(opts).forEach(function (o) { api.answer('<span class="answer-label" dir="ltr">' + clockLabel(o[0], o[1]) + '</span>', o[0] === h && o[1] === m); });
      return;
    }
    /* גדולים: כסף — כמה שקלים יש כאן? */
    var coins = [], total = 0, count = rnd(2, 5);
    for (var i = 0; i < count; i++) { var c = api.random([1, 2, 5, 10]); coins.push(c); total += c; }
    coins.sort(function (p, q) { return q - p; });
    api.setRound({ speak: 'כמה שקלים יש בארנק?', read: [{ text: 'יש כאן ' + total + ' שקלים', lang: 'he-IL' }], success: 'בדיוק! ' + total + ' ₪' });
    el.instruction.textContent = 'כמה שקלים יש כאן?';
    el.helper.textContent = 'התחילו מהמטבע הגדול וחברו את כל השאר.';
    el.target.innerHTML = '<div class="coins-row">' + coins.map(coin).join('') + '</div>';
    numberOptions(total, 5, 1).forEach(function (v) { api.answer('<span class="answer-label">' + v + ' ₪</span>', v === total); });
  }

  /* ---------- פרק 3 — מוזיקה ---------- */
  var INSTRUMENTS = [
    { e: '🥁', n: 'תוף', k: 'drum' }, { e: '🎹', n: 'פסנתר', k: 'piano' }, { e: '🎸', n: 'גיטרה', k: 'guitar' },
    { e: '🎺', n: 'חצוצרה', k: 'trumpet' }, { e: '🎻', n: 'כינור', k: 'violin' }, { e: '🎷', n: 'סקסופון', k: 'sax' }
  ];
  /* ארבעת פדי הסיימון: צבע, תו (דו-רה-מי-סול) ושם */
  var PADS = [
    { c: '#ff2e93', f: 523, n: 'דו' }, { c: '#ffc93c', f: 587, n: 'רה' },
    { c: '#29e0ff', f: 659, n: 'מי' }, { c: '#3ff2b0', f: 784, n: 'סול' }
  ];

  function musicRound(api) {
    var el = api.el, big = api.big();
    var kind = big ? api.random(['rhythm', 'simon', 'simon']) : api.random(['instrument', 'highlow']);
    el.target.className = 'target';

    /* 3.1 קטנים: איזה כלי נגינה? (מנגן קירוב של הצליל) */
    if (kind === 'instrument') {
      var ins = api.random(INSTRUMENTS);
      api.setRound({ speak: 'איך קוראים לכלי הנגינה הזה?', success: 'נכון! זה ' + ins.n + ' 🎶', replay: function () { Audio.instrument(ins.k); } });
      el.instruction.textContent = 'איך קוראים לכלי הזה?';
      el.helper.textContent = 'לחצו על הכלי כדי לשמוע אותו מנגן.';
      el.target.innerHTML = '<button type="button" class="music-stage" aria-label="נגן">' + ins.e + '</button>';
      el.target.firstChild.addEventListener('click', function () { Audio.instrument(ins.k); this.classList.remove('play'); void this.offsetWidth; this.classList.add('play'); });
      Audio.instrument(ins.k);
      api.choicesFor(ins, INSTRUMENTS, 4).forEach(function (o) { api.answer('<span style="font-size:.9em">' + o.e + '</span><span class="answer-label">' + o.n + '</span>', o.n === ins.n); });
      return;
    }
    /* 3.2 קטנים: צליל גבוה או נמוך? */
    if (kind === 'highlow') {
      var high = Math.random() < .5, f = high ? 1046 : 131;
      var play = function () { Audio.note(f, 0, .9, high ? 'sine' : 'triangle', .35); Audio.note(f, .5, .9, high ? 'sine' : 'triangle', .3); };
      api.setRound({ speak: 'הקשיבו: הצליל גבוה או נמוך?', success: high ? 'נכון! צליל גבוה כמו ציפור 🐦' : 'נכון! צליל נמוך כמו דוב 🐻', replay: play });
      el.instruction.textContent = 'הצליל גבוה או נמוך?';
      el.helper.textContent = 'לחצו על הרמקול כדי לשמוע שוב.';
      el.target.innerHTML = '<button type="button" class="music-stage" aria-label="השמעה">🔊</button>';
      el.target.firstChild.addEventListener('click', play);
      play();
      api.answer('<span>🐦</span><span class="answer-label">גבוה</span>', high);
      api.answer('<span>🐻</span><span class="answer-label">נמוך</span>', !high);
      return;
    }
    /* 3.3 גדולים: כמה תיפופים שמעתם? */
    if (kind === 'rhythm') {
      var n = rnd(3, 7);
      var drumIt = function () {
        var stage = el.target.querySelector('.music-stage');
        for (var i = 0; i < n; i++) (function (i) {
          Audio.drum(i * .42);
          setTimeout(function () { if (stage) { stage.classList.remove('play'); void stage.offsetWidth; stage.classList.add('play'); } }, i * 420);
        })(i);
      };
      api.setRound({ speak: 'הקשיבו טוב וספרו את התיפופים.', success: 'שמיעה של גיבורה! היו ' + n + ' תיפופים 🥁', replay: drumIt });
      el.instruction.textContent = 'כמה תיפופים שמעתם?';
      el.helper.textContent = 'לחצו על התוף כדי לשמוע שוב וספרו בשקט.';
      el.target.innerHTML = '<button type="button" class="music-stage" aria-label="תוף">🥁</button>';
      el.target.firstChild.addEventListener('click', drumIt);
      setTimeout(drumIt, 350);
      numberOptions(n, 2, 2).forEach(function (v) { api.answer(String(v), v === n); });
      return;
    }
    /* 3.4 גדולים: סיימון — חוזרים על מנגינה */
    simonRound(api);
  }

  /* סיימון: המחשב מנגן רצף של 3–5 תווים, הילדה חוזרת עליהם בפדים */
  function simonRound(api) {
    var el = api.el, len = rnd(3, 5), seq = [], pos = 0, busy = true;
    for (var i = 0; i < len; i++) seq.push(rnd(0, 3));
    el.instruction.textContent = 'חוזרים על המנגינה!';
    el.helper.textContent = 'הקשיבו והסתכלו אילו כפתורים נדלקים — ואז לחצו באותו סדר.';
    el.target.innerHTML = '<div class="simon-dots">' + seq.map(function () { return '<i></i>'; }).join('') + '</div>';
    el.answers.className = 'answer-grid simon-board';

    /* יצירת 4 הפדים */
    var pads = PADS.map(function (p, idx) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'answer simon-pad';
      b.style.setProperty('--pad', p.c);
      b.innerHTML = '<span class="answer-label">' + p.n + '</span>';
      b.addEventListener('click', function () { press(idx, b); });
      el.answers.appendChild(b);
      return b;
    });
    /* הדלקת פד + התו שלו */
    function light(idx, when) {
      setTimeout(function () {
        Audio.note(PADS[idx].f, 0, .38, 'triangle', .3);
        pads[idx].classList.add('lit');
        setTimeout(function () { pads[idx].classList.remove('lit'); }, 330);
      }, when);
    }
    /* ניגון כל הרצף ואז שחרור הפדים */
    function playSeq() {
      busy = true; pos = 0;
      updateDots();
      seq.forEach(function (idx, i) { light(idx, 500 + i * 560); });
      setTimeout(function () { busy = false; api.feedback('', 'עכשיו תורך! 🎹'); }, 500 + seq.length * 560);
    }
    function updateDots() {
      Array.prototype.forEach.call(el.target.querySelectorAll('.simon-dots i'), function (d, i) { d.classList.toggle('on', i < pos); });
    }
    /* לחיצה של הילדה: נכון → ממשיכים; טעות → מנגנים שוב בעדינות */
    function press(idx, btn) {
      if (busy) return;
      light(idx, 0);
      if (idx === seq[pos]) {
        pos++; updateDots();
        if (pos === seq.length) { busy = true; api.win(btn, 'מנגינה מושלמת! 🎶', 'וואו! חזרת על כל המנגינה!'); }
      } else {
        busy = true; api.sound('sad');
        api.feedback('try', 'כמעט! בואו נקשיב שוב…');
        setTimeout(playSeq, 900);
      }
    }
    api.setRound({ speak: 'הקשיבו למנגינה וחזרו עליה.', replay: function () { if (!busy) playSeq(); }, custom: true });
    playSeq();
  }

  /* ---------- פרק 4 — טבע ---------- */
  var HABITATS = [
    { e: '🐟', a: 'דג', h: 'ים', he: '🌊' }, { e: '🐄', a: 'פרה', h: 'חווה', he: '🚜' },
    { e: '🐒', a: 'קוף', h: 'ג׳ונגל', he: '🌴' }, { e: '🐧', a: 'פינגווין', h: 'קרח', he: '🧊' },
    { e: '🐫', a: 'גמל', h: 'מדבר', he: '🏜️' }, { e: '🐿️', a: 'סנאי', h: 'יער', he: '🌳' },
    { e: '🐬', a: 'דולפין', h: 'ים', he: '🌊' }, { e: '🐑', a: 'כבשה', h: 'חווה', he: '🚜' }
  ];
  var HABITAT_NAMES = [['ים', '🌊'], ['חווה', '🚜'], ['ג׳ונגל', '🌴'], ['קרח', '🧊'], ['מדבר', '🏜️'], ['יער', '🌳']];
  var WEATHER = [
    { w: '☀️', n: 'שמש חזקה', g: '🕶️', gn: 'משקפי שמש' }, { w: '🌧️', n: 'גשם', g: '☂️', gn: 'מטרייה' },
    { w: '❄️', n: 'שלג וקור', g: '🧤', gn: 'כפפות' }, { w: '🌬️', n: 'רוח', g: '🪁', gn: 'עפיפון' }
  ];
  var SEASONS = [
    { n: 'סתיו', scene: '🍂🍁🌰', say: 'עלים נושרים' }, { n: 'חורף', scene: '⛄☔❄️', say: 'קר וגשום' },
    { n: 'אביב', scene: '🌸🌷🦋', say: 'פרחים פורחים' }, { n: 'קיץ', scene: '☀️🏖️🍉', say: 'חם ושמשי' }
  ];
  var CYCLES = [
    { n: 'הפרפר', s: ['🥚', '🐛', '🦋'] }, { n: 'התרנגולת', s: ['🥚', '🐣', '🐔'] },
    { n: 'העץ', s: ['🌰', '🌱', '🌳'] }, { n: 'הצפרדע', s: ['🥚', '🐟', '🐸'], note: 'ראשן (נראה כמו דג קטן)' }
  ];
  var FACTS = [
    { q: 'מי מטיל ביצים?', ok: '🐔 תרנגולת', no: ['🐶 כלב', '🐄 פרה', '🐱 חתול'] },
    { q: 'מה הדבורה מייצרת?', ok: '🍯 דבש', no: ['🥛 חלב', '🧀 גבינה', '🍞 לחם'] },
    { q: 'מאיפה מגיע החלב?', ok: '🐄 פרה', no: ['🐔 תרנגולת', '🐟 דג', '🐝 דבורה'] },
    { q: 'מה צמח צריך כדי לגדול?', ok: '💧 מים', no: ['🍫 שוקולד', '🧸 דובי', '📺 טלוויזיה'] },
    { q: 'איזו חיה ישנה כל החורף?', ok: '🐻 דוב', no: ['🐔 תרנגולת', '🐶 כלב', '🐴 סוס'] },
    { q: 'מי יכול לעוף?', ok: '🦅 נשר', no: ['🐘 פיל', '🐢 צב', '🐍 נחש'] },
    { q: 'כמה רגליים יש לעכביש? 🕷️', ok: '8', no: ['4', '6', '2'] },
    { q: 'כמה רגליים יש לחיפושית? 🐞', ok: '6', no: ['4', '8', '10'] },
    { q: 'מה מאיר את השמיים בלילה?', ok: '🌙 ירח', no: ['☀️ שמש', '🌈 קשת', '☁️ ענן'] }
  ];

  function natureRound(api) {
    var el = api.el, big = api.big();
    var kind = big ? api.random(['season', 'cycle', 'fact', 'fact']) : api.random(['habitat', 'habitat', 'weather']);
    el.target.className = 'target';

    /* 4.1 קטנים: איפה החיה גרה? */
    if (kind === 'habitat') {
      var an = api.random(HABITATS);
      api.setRound({ speak: 'איפה גר ה' + an.a + '?', read: [{ text: 'ה' + an.a + ' גר ב' + an.h, lang: 'he-IL' }], success: 'נכון! ה' + an.a + ' גר ב' + an.h + ' ' + an.he });
      el.instruction.textContent = 'איפה גר ה' + an.a + '?';
      el.helper.textContent = 'חשבו איפה פוגשים את החיה הזאת.';
      el.target.innerHTML = '<div class="bilingual-card"><span class="emoji">' + an.e + '</span><span class="bilingual-copy"><strong class="hebrew">' + an.a + '</strong><small>איפה הבית שלו?</small></span></div>';
      var right = HABITAT_NAMES.filter(function (x) { return x[0] === an.h; })[0];
      api.choicesFor(right, HABITAT_NAMES, 4).forEach(function (o) { api.answer('<span>' + o[1] + '</span><span class="answer-label">' + o[0] + '</span>', o[0] === an.h); });
      return;
    }
    /* 4.2 קטנים: מה לוקחים איתנו במזג האוויר הזה? */
    if (kind === 'weather') {
      var w = api.random(WEATHER);
      api.setRound({ speak: 'יש ' + w.n + '. מה כדאי לקחת?', success: 'נכון! ב' + w.n + ' לוקחים ' + w.gn + ' ' + w.g });
      el.instruction.textContent = 'יש ' + w.n + '. מה כדאי לקחת?';
      el.helper.textContent = 'בחרו את מה שהכי מתאים למזג האוויר.';
      el.target.innerHTML = '<div class="nature-scene">' + w.w + '</div>';
      api.choicesFor(w, WEATHER, 4).forEach(function (o) { api.answer('<span>' + o.g + '</span><span class="answer-label">' + o.gn + '</span>', o === w); });
      return;
    }
    /* 4.3 גדולים: איזו עונה זו? */
    if (kind === 'season') {
      var s = api.random(SEASONS);
      api.setRound({ speak: 'איזו עונה רואים כאן?', read: [{ text: 'זו עונת ה' + s.n + ', ' + s.say, lang: 'he-IL' }], success: 'בדיוק! ' + s.n + ' — ' + s.say });
      el.instruction.textContent = 'איזו עונה זו?';
      el.helper.textContent = 'הסתכלו על הרמזים בתמונה.';
      el.target.innerHTML = '<div class="nature-scene">' + s.scene + '</div>';
      api.shuffle(SEASONS).forEach(function (o) { api.answer('<span class="answer-label">' + o.n + '</span>', o === s); });
      return;
    }
    /* 4.4 גדולים: מחזור החיים — מה בא אחר כך? */
    if (kind === 'cycle') {
      var cy = api.random(CYCLES), last = cy.s[2];
      var pool = CYCLES.map(function (c) { return c.s[2]; }).concat(['🐍', '🌵']);
      api.setRound({ speak: 'מה בא בסוף במחזור החיים של ' + cy.n + '?', success: 'נכון! ' + cy.s.join(' ← ') });
      el.instruction.textContent = 'מחזור החיים של ' + cy.n + ': מה בא אחר כך?';
      el.helper.textContent = cy.note ? 'רמז: ' + cy.note + ' גדל להיות…' : 'מה קורה כשהוא גדל?';
      el.target.innerHTML = '<div class="cycle-row" dir="ltr"><span>' + cy.s[0] + '</span><b>→</b><span>' + cy.s[1] + '</span><b>→</b><span class="q">?</span></div>';
      var opts = [last], g = 0;
      while (opts.length < 4 && g++ < 50) { var p = api.random(pool); if (opts.indexOf(p) < 0 && cy.s.indexOf(p) < 0) opts.push(p); }
      api.shuffle(opts).forEach(function (o) { api.answer('<span style="font-size:1.2em">' + o + '</span>', o === last); });
      return;
    }
    /* 4.5 גדולים: עובדות מדהימות על הטבע */
    var f = api.random(FACTS);
    api.setRound({ speak: f.q, success: 'נכון! ' + f.ok + ' 🌿' });
    el.instruction.textContent = f.q;
    el.helper.textContent = 'חשבו טוב — מה אתם יודעים על הטבע?';
    el.target.innerHTML = '<div class="nature-scene small">🌍🔍</div>';
    api.shuffle([f.ok].concat(f.no)).forEach(function (o) { api.answer('<span class="answer-label">' + o + '</span>', o === f.ok); });
  }

  /* ---------- פרק 5 — רמת 7–8 לתחנות הקיימות ---------- */

  /* 5.1 מספרים עד 100: אחרי/לפני, השוואה, דילוגים */
  function numbersBig(api) {
    var el = api.el, kind = api.random(['seq', 'cmp', 'skip']);
    el.target.className = 'target';
    if (kind === 'seq') {
      var n = rnd(11, 98), next = Math.random() < .5, c = next ? n + 1 : n - 1;
      api.setRound({ speak: 'מה המספר שבא ' + (next ? 'אחרי ' : 'לפני ') + n + '?', read: [{ text: (next ? 'אחרי ' : 'לפני ') + n + ' בא ' + c, lang: 'he-IL' }], success: 'מעולה! ' + c });
      el.instruction.textContent = 'מה בא ' + (next ? 'אחרי' : 'לפני') + ' ' + n + '?';
      el.helper.textContent = 'חשבו על האחדות — ומה קורה כשמגיעים ל-0 או ל-9.';
      el.target.innerHTML = '<div class="equation" dir="ltr">' + (next ? n + ' → <span class="q">?</span>' : '<span class="q">?</span> → ' + n) + '</div>';
      numberOptions(c, 11, 1).forEach(function (v) { api.answer(String(v), v === c); });
    } else if (kind === 'cmp') {
      var a = rnd(10, 99), b = rnd(10, 99); if (a === b) b = a > 50 ? a - rnd(1, 9) : a + rnd(1, 9);
      var askBig = Math.random() < .5, cc = askBig ? Math.max(a, b) : Math.min(a, b);
      api.setRound({ speak: askBig ? 'איזה מספר גדול יותר?' : 'איזה מספר קטן יותר?', success: 'נכון! ' + cc });
      el.instruction.textContent = askBig ? 'איזה מספר גדול יותר?' : 'איזה מספר קטן יותר?';
      el.helper.textContent = 'השוו קודם את העשרות.';
      el.target.innerHTML = '<div class="equation" dir="ltr">' + a + ' <b>?</b> ' + b + '</div>';
      [a, b].forEach(function (v) { api.answer('<span class="answer-label">' + v + '</span>', v === cc); });
    } else {
      var step = api.random([2, 5, 10]), start = step * rnd(0, 5), seq = [start, start + step, start + step * 2, start + step * 3], ans = start + step * 4;
      api.setRound({ speak: 'קופצים ב-' + step + '. מה בא אחר כך?', success: 'קפיצה מושלמת! ' + ans });
      el.instruction.textContent = 'קופצים ב-' + step + ' — מה בא אחר כך?';
      el.helper.textContent = 'כל פעם מוסיפים ' + step + '.';
      el.target.innerHTML = '<div class="equation" dir="ltr">' + seq.join(', ') + ', <span class="q">?</span></div>';
      numberOptions(ans, step * 2, 0).forEach(function (v) { api.answer(String(v), v === ans); });
    }
  }

  /* 5.2 צבעים: ערבוב צבעים */
  var COLOR = { red: ['אדום', '#ff4d5e'], yellow: ['צהוב', '#ffd54f'], blue: ['כחול', '#3d8bff'], orange: ['כתום', '#ff9a3c'], green: ['ירוק', '#3fcf7a'], purple: ['סגול', '#9b5cff'], white: ['לבן', '#ffffff'], pink: ['ורוד', '#ff8fc4'], black: ['שחור', '#2b2b3a'], gray: ['אפור', '#9aa0ad'] };
  var MIXES = [['red', 'yellow', 'orange'], ['blue', 'yellow', 'green'], ['red', 'blue', 'purple'], ['red', 'white', 'pink'], ['black', 'white', 'gray']];
  function colorsBig(api) {
    var el = api.el, mx = api.random(MIXES), a = COLOR[mx[0]], b = COLOR[mx[1]], r = COLOR[mx[2]];
    api.setRound({ speak: a[0] + ' ועוד ' + b[0] + ', איזה צבע יוצא?', success: 'קסם! ' + a[0] + ' + ' + b[0] + ' = ' + r[0] });
    el.instruction.textContent = 'מערבבים ' + a[0] + ' ו' + b[0] + ' — מה יוצא?';
    el.helper.textContent = 'דמיינו שאתם מערבבים צבעי גואש.';
    el.target.className = 'target size-pair';
    el.target.innerHTML = '<span class="color-orb" style="background:' + a[1] + '"></span><b class="op">+</b><span class="color-orb" style="background:' + b[1] + '"></span><b class="op">=</b><b class="op q">?</b>';
    var pool = ['orange', 'green', 'purple', 'pink', 'gray', 'red', 'blue'].filter(function (k) { return k !== mx[2] && k !== mx[0] && k !== mx[1]; });
    api.shuffle([mx[2]].concat(api.shuffle(pool).slice(0, 3))).forEach(function (k) {
      api.answer('<span class="answer-swatch" style="background:' + COLOR[k][1] + '"></span><span class="answer-label">' + COLOR[k][0] + '</span>', k === mx[2]);
    });
  }

  /* 5.3 צורות: כמה פינות? (מצולעים ב-SVG) */
  var POLYS = [{ n: 'משולש', k: 3 }, { n: 'ריבוע', k: 4 }, { n: 'מחומש', k: 5 }, { n: 'משושה', k: 6 }, { n: 'מתומן', k: 8 }, { n: 'עיגול', k: 0 }];
  function polySVG(k, color) {
    if (!k) return '<svg viewBox="0 0 120 120" class="poly"><circle cx="60" cy="60" r="50" fill="' + color + '" stroke="#1b1036" stroke-width="6"/></svg>';
    var d = '';
    for (var i = 0; i < k; i++) { var a = -Math.PI / 2 + i * 2 * Math.PI / k + (k === 4 ? Math.PI / 4 : 0); d += (i ? 'L' : 'M') + (60 + Math.cos(a) * 52).toFixed(1) + ' ' + (62 + Math.sin(a) * 52).toFixed(1); }
    return '<svg viewBox="0 0 120 120" class="poly"><path d="' + d + 'Z" fill="' + color + '" stroke="#1b1036" stroke-width="6" stroke-linejoin="round"/></svg>';
  }
  function shapesBig(api) {
    var el = api.el, p = api.random(POLYS), col = api.random(['#ff2e93', '#ffc93c', '#29e0ff', '#8b5cff', '#3ff2b0']);
    api.setRound({ speak: 'כמה פינות יש ל' + p.n + '?', success: p.k ? 'נכון! ל' + p.n + ' יש ' + p.k + ' פינות' : 'נכון! לעיגול אין פינות בכלל' });
    el.instruction.textContent = 'כמה פינות יש ל' + p.n + '?';
    el.helper.textContent = 'ספרו כל פינה חדה בצורה.';
    el.target.className = 'target';
    el.target.innerHTML = polySVG(p.k, col);
    numberOptions(p.k, 3, 0).forEach(function (v) { api.answer(String(v), v === p.k); });
  }

  /* 5.4 דפוסים: ABC ו-AAB */
  var TOK = [['●', '#ff4d7d'], ['▲', '#3fcf7a'], ['■', '#8b5cff'], ['★', '#ffc93c'], ['♥', '#ff8fc4'], ['◆', '#29b6ff']];
  function patternsBig(api) {
    var el = api.el, t = api.shuffle(TOK).slice(0, 3), abc = Math.random() < .5;
    var unit = abc ? [t[0], t[1], t[2]] : [t[0], t[0], t[1]];
    var seq = unit.concat(unit).slice(0, 5), ans = unit[5 % 3];
    api.setRound({ speak: 'מה צריך לבוא עכשיו?', success: 'בלשית של דפוסים! 🕵️‍♀️' });
    el.instruction.textContent = 'מה צריך לבוא עכשיו?';
    el.helper.textContent = abc ? 'הדפוס חוזר כל שלושה.' : 'שימו לב: יש שניים דומים ואז אחד שונה.';
    el.target.className = 'target pattern-row';
    el.target.innerHTML = seq.map(function (x) { return '<span class="pattern-token" style="background:' + x[1] + '">' + x[0] + '</span>'; }).join('') + '<span class="pattern-token question">?</span>';
    var others = api.shuffle(TOK.filter(function (x) { return x !== ans; })).slice(0, 3);
    api.shuffle(others.concat([ans])).forEach(function (x) { api.answer(x[0], x === ans, 'pattern-answer', x[1]); });
  }

  /* 5.5 אותיות: באיזו אות מתחילה המילה? + קריאת מילה */
  var WORDS = [
    ['🦁', 'אריה', 'א'], ['🎈', 'בלון', 'ב'], ['🐪', 'גמל', 'ג'], ['🐟', 'דג', 'ד'], ['⛰️', 'הר', 'ה'], ['🌹', 'ורד', 'ו'],
    ['🦓', 'זברה', 'ז'], ['🐱', 'חתול', 'ח'], ['🦚', 'טווס', 'ט'], ['✋', 'יד', 'י'], ['🐶', 'כלב', 'כ'], ['❤️', 'לב', 'ל'],
    ['🔑', 'מפתח', 'מ'], ['🕯️', 'נר', 'נ'], ['🐴', 'סוס', 'ס'], ['🍇', 'ענבים', 'ע'], ['🦋', 'פרפר', 'פ'], ['🐸', 'צפרדע', 'צ'],
    ['🐒', 'קוף', 'ק'], ['🚂', 'רכבת', 'ר'], ['☀️', 'שמש', 'ש'], ['🍎', 'תפוח', 'ת']
  ];
  function lettersBig(api) {
    var el = api.el, w = api.random(WORDS);
    el.target.className = 'target';
    if (Math.random() < .5) {
      api.setRound({ speak: 'באיזו אות מתחילה המילה ' + w[1] + '?', read: [{ text: w[1] + ' מתחילה באות ' + w[2], lang: 'he-IL' }], success: 'נכון! ' + w[1] + ' מתחילה ב-' + w[2] });
      el.instruction.textContent = 'באיזו אות מתחילה המילה?';
      el.helper.textContent = 'אמרו את המילה בקול והקשיבו לצליל הראשון.';
      el.target.innerHTML = '<div class="bilingual-card"><span class="emoji">' + w[0] + '</span><span class="bilingual-copy"><strong class="hebrew">_' + w[1].slice(1) + '</strong></span></div>';
      var letters = WORDS.map(function (x) { return x[2]; });
      api.choicesFor(w[2], letters, 4).forEach(function (l) { api.answer('<span class="answer-label" style="font-size:clamp(34px,4.5vw,52px)">' + l + '</span>', l === w[2]); });
    } else {
      api.setRound({ speak: 'קראו את המילה ובחרו את התמונה המתאימה.', read: [{ text: w[1], lang: 'he-IL' }], success: 'קוראת אלופה! ' + w[1] + ' ' + w[0] });
      el.instruction.textContent = 'קראו את המילה ובחרו תמונה:';
      el.helper.textContent = 'קראו לאט, אות אחרי אות.';
      el.target.innerHTML = '<div class="read-word">' + w[1] + '</div>';
      api.choicesFor(w, WORDS, 4).forEach(function (o) { api.answer('<span style="font-size:1.3em">' + o[0] + '</span>', o === w); });
    }
  }

  /* 5.6 אנגלית: בחרו את המילה הנכונה לתמונה */
  var EN = [
    ['🍎', 'Apple'], ['⚽', 'Ball'], ['🐱', 'Cat'], ['🐶', 'Dog'], ['🥚', 'Egg'], ['🐟', 'Fish'], ['🍇', 'Grapes'], ['🏠', 'House'],
    ['🍦', 'Ice cream'], ['🔑', 'Key'], ['🦁', 'Lion'], ['🌙', 'Moon'], ['👃', 'Nose'], ['🐙', 'Octopus'], ['🐷', 'Pig'], ['👑', 'Queen'],
    ['🌈', 'Rainbow'], ['☀️', 'Sun'], ['🌳', 'Tree'], ['☂️', 'Umbrella'], ['🚗', 'Car'], ['📚', 'Book'], ['⭐', 'Star'], ['🐸', 'Frog']
  ];
  function englishBig(api) {
    var el = api.el, w = api.random(EN);
    api.setRound({ speak: 'What is this?', read: [{ text: w[1], lang: 'en-US' }], success: 'Great job! ' + w[1] + ' ' + w[0] });
    el.instruction.textContent = 'איך אומרים את זה באנגלית?';
    el.helper.textContent = 'קראו את המילים באנגלית ובחרו. אפשר ללחוץ "הקשיבו".';
    el.target.className = 'target';
    el.target.innerHTML = '<div class="nature-scene">' + w[0] + '</div>';
    api.choicesFor(w, EN, 4).forEach(function (o) { api.answer('<span class="answer-label" dir="ltr">' + o[1] + '</span>', o === w); });
  }

  /* 5.7 חיות / אוכל: מילה באנגלית → בוחרים תמונה */
  var EN_ANIMALS = [['🐶', 'Dog'], ['🐱', 'Cat'], ['🐰', 'Rabbit'], ['🦁', 'Lion'], ['🐘', 'Elephant'], ['🐸', 'Frog'], ['🐟', 'Fish'], ['🐦', 'Bird'], ['🐴', 'Horse'], ['🐄', 'Cow'], ['🐵', 'Monkey'], ['🐻', 'Bear']];
  var EN_FOOD = [['🍎', 'Apple'], ['🍌', 'Banana'], ['🍓', 'Strawberry'], ['🍕', 'Pizza'], ['🥕', 'Carrot'], ['🍞', 'Bread'], ['🧀', 'Cheese'], ['🍪', 'Cookie'], ['🥛', 'Milk'], ['🍉', 'Watermelon'], ['🥚', 'Egg'], ['🍋', 'Lemon']];
  function reverseWords(list) {
    return function (api) {
      var el = api.el, w = api.random(list);
      api.setRound({ speak: w[1], read: [{ text: w[1], lang: 'en-US' }], success: 'Yes! ' + w[1] + ' ' + w[0] });
      el.instruction.textContent = 'מה המילה באנגלית אומרת?';
      el.helper.textContent = 'קראו את המילה (או הקשיבו) ובחרו את התמונה.';
      el.target.className = 'target';
      el.target.innerHTML = '<div class="read-word" dir="ltr">' + w[1] + '</div>';
      api.choicesFor(w, list, 4).forEach(function (o) { api.answer('<span style="font-size:1.3em">' + o[0] + '</span>', o === w); });
    };
  }

  /* 5.8 גודל: מי גדול יותר במציאות? (מוצגים באותו גודל כדי לחשוב ולא רק להסתכל) */
  var BY_SIZE = [['🐜', 'נמלה'], ['🐭', 'עכבר'], ['🐱', 'חתול'], ['🐶', 'כלב'], ['🐴', 'סוס'], ['🦒', 'ג׳ירפה'], ['🐘', 'פיל'], ['🐋', 'לוויתן']];
  function sizeBig(api) {
    var el = api.el, i = rnd(0, BY_SIZE.length - 1), j = rnd(0, BY_SIZE.length - 1);
    while (j === i) j = rnd(0, BY_SIZE.length - 1);
    var askBig = Math.random() < .5, winner = askBig ? Math.max(i, j) : Math.min(i, j);
    api.setRound({ speak: askBig ? 'מי גדול יותר במציאות?' : 'מי קטן יותר במציאות?', success: 'נכון! ' + BY_SIZE[winner][1] + ' ' + (askBig ? 'גדול' : 'קטן') + ' יותר במציאות' });
    el.instruction.textContent = askBig ? 'מי גדול יותר במציאות?' : 'מי קטן יותר במציאות?';
    el.helper.textContent = 'בתמונה הם באותו גודל — חשבו איך הם בעולם האמיתי!';
    el.target.className = 'target size-pair';
    el.target.innerHTML = '<span class="size-item" style="font-size:78px">' + BY_SIZE[i][0] + '</span><span class="size-vs">מול</span><span class="size-item" style="font-size:78px">' + BY_SIZE[j][0] + '</span>';
    [i, j].forEach(function (k) { api.answer('<span>' + BY_SIZE[k][0] + '</span><span class="answer-label">' + BY_SIZE[k][1] + '</span>', k === winner); });
  }

  /* ---------- פרק 6 — ייצוא ---------- */
  window.AcademyModules = {
    /* תחנות חדשות: מופיעות ברשימת התחנות של הדף */
    meta: {
      math:   { name: 'חשבון גיבורים', subtitle: 'חיבור, שעון וכסף', icon: '➕', color: '#ffc93c', title: 'חשבון של גיבורים', mascot: '🦸‍♀️' },
      music:  { name: 'מוזיקה',        subtitle: 'צלילים ומנגינות', icon: '🎵', color: '#ff5fb0', title: 'מעבדת הצלילים',    mascot: '🎤' },
      nature: { name: 'טבע',           subtitle: 'חיות, עונות וצמחים', icon: '🌿', color: '#3ff2b0', title: 'חוקרות הטבע',   mascot: '🦉' }
    },
    rounds: { math: mathRound, music: musicRound, nature: natureRound },
    /* רמת 7–8 לתחנות הקיימות (זיכרון ופאזלים מטופלים בדף עצמו — לוח גדול יותר) */
    bigRounds: {
      numbers: numbersBig, colors: colorsBig, shapes: shapesBig, patterns: patternsBig,
      letters: lettersBig, english: englishBig, animals: reverseWords(EN_ANIMALS), food: reverseWords(EN_FOOD), size: sizeBig
    }
  };
})();
