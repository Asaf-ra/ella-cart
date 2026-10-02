/* =====================================================================
   js/duel.js — 👥 "דו-קרב ידע": חידון לשני שחקנים פנים אל פנים על אייפד אחד (שלב 18)
   ---------------------------------------------------------------------
   מה הקובץ עושה: המסך נחלק לשניים — שחקן 1 למטה, שחקן 2 למעלה (הצד שלו מסובב 180°, כך ששניהם יושבים
   זה מול זה עם האייפד על השולחן). אותה שאלה מופיעה בשני הצדדים עם 3 תשובות. מי שנוגע ראשון בתשובה
   הנכונה מקבל נקודה; טעות = הקפאה של 1.5 שניות לאותו שחקן (בלי עונש בנקודות). 10 שאלות, 5 סוגים:
   חשבון (לפי שכבת הגיל), מילה באנגלית → תמונה, צבע באנגלית, ספירה, "מה לא שייך". בסוף: מנצח, ומה למדנו.

   פרק 1 — מאגרי תוכן: חיות, פירות, כלי רכב, צבעים (אימוג'י + אנגלית + עברית)
   פרק 2 — מחוללי שאלות: math / word / color / count / odd → { q (עברית להקראה), en (אנגלית), opts:[{html, ok}] }
   פרק 3 — מצב סבב: ניקוד, שאלה נוכחית, הקפאות, שמירה (<pfx>-duel-v1: סבבים, שיא)
   פרק 4 — ממשק: שני הצדדים (side-0 / side-1), שאלה, כפתורים, מגע, אפקטים (נכון/טעות/הקפאה)
   פרק 5 — זרימה: שאלה → תשובה → פידבק → הבאה → סיום (הישג duel:done, Progress answers)
   פרק 6 — API לבדיקות: window.Duel
   ===================================================================== */
(function () {
  'use strict';
  var BOY = !!window.DUEL_BOY, PFX = BOY ? 'eitan' : 'ella', KEY = PFX + '-duel-v1', ROUNDS = 10, FREEZE = 1.5;

  /* ---------- פרק 1 — מאגרים ---------- */
  var ANIMALS = [['cat', '🐱', 'חתול'], ['dog', '🐶', 'כלב'], ['cow', '🐄', 'פרה'], ['horse', '🐴', 'סוס'], ['sheep', '🐑', 'כבשה'], ['duck', '🦆', 'ברווז'], ['rabbit', '🐰', 'ארנב'], ['lion', '🦁', 'אריה'], ['elephant', '🐘', 'פיל'], ['monkey', '🐵', 'קוף'], ['fish', '🐟', 'דג'], ['frog', '🐸', 'צפרדע']];
  var FRUITS = [['apple', '🍎', 'תפוח'], ['banana', '🍌', 'בננה'], ['strawberry', '🍓', 'תות'], ['grapes', '🍇', 'ענבים'], ['watermelon', '🍉', 'אבטיח'], ['orange', '🍊', 'תפוז'], ['carrot', '🥕', 'גזר'], ['corn', '🌽', 'תירס']];
  var VEHICLES = [['car', '🚗', 'מכונית'], ['bus', '🚌', 'אוטובוס'], ['train', '🚆', 'רכבת'], ['airplane', '✈️', 'מטוס'], ['boat', '⛵', 'סירה'], ['bicycle', '🚲', 'אופניים'], ['tractor', '🚜', 'טרקטור'], ['rocket', '🚀', 'טיל']];
  var THINGS = [['sun', '☀️', 'שמש'], ['moon', '🌙', 'ירח'], ['star', '⭐', 'כוכב'], ['house', '🏠', 'בית'], ['tree', '🌳', 'עץ'], ['flower', '🌸', 'פרח'], ['ball', '⚽', 'כדור'], ['book', '📖', 'ספר']];
  var COLORS = [['red', '#ff3b3b', 'אדום'], ['blue', '#3d7bff', 'כחול'], ['yellow', '#ffd93c', 'צהוב'], ['green', '#2fb85a', 'ירוק'], ['pink', '#ff5ca8', 'ורוד'], ['purple', '#9b5cff', 'סגול'], ['orange', '#ff8a3c', 'כתום'], ['black', '#2a2a3a', 'שחור'], ['white', '#ffffff', 'לבן']];
  var GROUPS = [ANIMALS, FRUITS, VEHICLES, THINGS];

  /* ---------- עזרים ---------- */
  function $(id) { return document.getElementById(id); }
  function say(t) { try { Voice.say(t, { interrupt: true }); } catch (e) {} }
  function sayEn(t) { try { Voice.en(t); } catch (e) {} }
  function teach(en, he) { try { Voice.teach(en, he); } catch (e) { say(he); } }
  function snd(n) { try { if (window.Sound && Sound[n]) Sound[n](); } catch (e) {} }
  function tap(p) { try { KidsUI.KidsAudio.tap(p); } catch (e) {} }
  function track(ev) { try { if (window.Progress) Progress.track(ev); } catch (e) {} }
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function mix(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function grade() { try { var p = Profile.active; return p && p.grade === 'big' ? 'big' : 'young'; } catch (e) { return 'young'; } }
  function emoHtml(e) { return '<span class="emo">' + e + '</span>'; }

  /* ---------- פרק 2 — מחוללי שאלות ---------- */
  var GEN = {
    math: function () {
      var big = grade() === 'big', a = rnd(1, big ? 12 : 5), b = rnd(1, big ? 9 : 4), minus = big && Math.random() < .4 && a > b, v = minus ? a - b : a + b, set = [v];
      while (set.length < 3) { var w = Math.max(0, v + rnd(-3, 3)); if (set.indexOf(w) < 0) set.push(w); }
      return { type: 'math', q: a + (minus ? ' פחות ' : ' ועוד ') + b + '?', show: '<b dir="ltr">' + a + (minus ? ' − ' : ' + ') + b + ' = ?</b>', opts: mix(set).map(function (x) { return { html: '<b>' + x + '</b>', ok: x === v }; }), learn: ['', String(v)] };
    },
    word: function () {
      var g = pick(GROUPS), items = mix(g).slice(0, 3), ans = pick(items);
      return { type: 'word', q: 'איפה ה' + ans[2] + '?', en: 'Where is the ' + ans[0] + '?', show: '<b dir="ltr">Where is the ' + ans[0] + '?</b>', opts: items.map(function (it) { return { html: emoHtml(it[1]), ok: it === ans }; }), learn: [ans[0], ans[2], ans[1]] };
    },
    color: function () {
      var cs = mix(COLORS).slice(0, 3), ans = pick(cs);
      return { type: 'color', q: 'איזה צבע הוא ' + ans[2] + '?', en: 'Touch the ' + ans[0] + '!', show: '<b dir="ltr">Touch ' + ans[0] + '!</b>', opts: cs.map(function (c) { return { html: '<i class="sw" style="background:' + c[1] + '"></i>', ok: c === ans }; }), learn: [ans[0], ans[2], '🎨'] };
    },
    count: function () {
      var n = rnd(1, 6), it = pick(FRUITS.concat(ANIMALS)), set = [n]; while (set.length < 3) { var w = rnd(1, 7); if (set.indexOf(w) < 0) set.push(w); }
      var row = ''; for (var i = 0; i < n; i++) row += it[1];
      return { type: 'count', q: 'כמה ' + it[2] + ' יש?', en: 'How many?', show: '<span class="emo row">' + row + '</span>', opts: mix(set).map(function (x) { return { html: '<b>' + x + '</b>', ok: x === n }; }), learn: ['', String(n)] };
    },
    odd: function () {
      var gs = mix(GROUPS), g = gs[0], other = gs[1], items = mix(g).slice(0, 2), odd = pick(other), opts = mix(items.concat([odd]));
      return { type: 'odd', q: 'מה לא שייך לקבוצה?', show: '<b>מה לא שייך? 🤔</b>', opts: opts.map(function (it) { return { html: emoHtml(it[1]), ok: it === odd }; }), learn: [odd[0], odd[2], odd[1]] };
    }
  };
  var ORDER = ['word', 'math', 'color', 'count', 'odd', 'word', 'math', 'color', 'word', 'count'];

  /* ---------- פרק 3 — מצב ---------- */
  function load() { try { return Object.assign({ rounds: 0, best: 0 }, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { return { rounds: 0, best: 0 }; } }
  var S = load(); function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  var G = null;

  /* ---------- פרק 4 — ממשק ---------- */
  function render() {
    var q = G.q;
    for (var p = 0; p < 2; p++) {
      $('q' + p).innerHTML = q.show;
      $('opts' + p).innerHTML = q.opts.map(function (o, i) { return '<button type="button" class="opt" data-p="' + p + '" data-i="' + i + '">' + o.html + '</button>'; }).join('');
      $('score' + p).textContent = G.score[p]; $('side' + p).classList.remove('frozen', 'won', 'lost');
    }
    $('round').textContent = (G.n + 1) + '/' + ROUNDS;
  }
  function onOpt(btn) {
    if (!G || !G.run || G.locked) return; var p = +btn.dataset.p, i = +btn.dataset.i;
    if (G.freeze[p] > 0) return;
    if (G.q.opts[i].ok) {
      G.locked = true; G.score[p]++; G.first[p]++; btn.classList.add('ok'); $('side' + p).classList.add('won'); $('side' + (1 - p)).classList.add('lost'); snd('happy');
      try { TapFX.word(innerWidth / 2, innerHeight / 2, 'נכון! ' + (p ? 'שחקן 2' : 'שחקן 1'), true); } catch (e) {}
      try { Progress.recordAnswer('duel', true); } catch (e) {} track('answer');
      var L = G.q.learn; if (L[0]) { G.learned[L[0]] = L[1]; teach(L[0], L[1]); } else say('נכון! ' + L[1] + '!');
      setTimeout(next, 2200);
    } else {
      btn.classList.add('no'); G.freeze[p] = FREEZE; $('side' + p).classList.add('frozen'); tap(240); G.wrong[p]++;
      setTimeout(function () { G.freeze[p] = 0; $('side' + p).classList.remove('frozen'); }, FREEZE * 1000);
    }
  }

  /* ---------- פרק 5 — זרימה ---------- */
  function ask() {
    G.q = GEN[ORDER[G.n % ORDER.length]](); G.locked = false; G.freeze = [0, 0]; render();
    if (G.q.en) { sayEn(G.q.en); setTimeout(function () { say(G.q.q); }, 1500); } else say(G.q.q);
  }
  function next() { G.n++; if (G.n >= ROUNDS) finish(); else ask(); }
  function newRound() {
    G = { run: true, n: 0, score: [0, 0], first: [0, 0], wrong: [0, 0], learned: {}, q: null, locked: false, freeze: [0, 0] };
    $('startScreen').classList.remove('show'); $('endScreen').classList.remove('show'); try { TapFX.set('light'); } catch (e) {}
    say('דו-קרב ידע! מי שנוגע ראשון בתשובה הנכונה מקבל נקודה. מוכנים?'); setTimeout(ask, 2600);
  }
  function finish() {
    G.run = false; var a = G.score[0], b = G.score[1], win = a === b ? 0 : a > b ? 1 : 2; S.rounds++; S.best = Math.max(S.best, Math.max(a, b)); save();
    $('eT').textContent = win ? '🏆 שחקן ' + win + ' מנצח!' : '🤝 תיקו!'; $('eS').textContent = a + ' : ' + b;
    var ws = Object.keys(G.learned); $('learned').innerHTML = ws.map(function (w) { return '<span>' + w + ' · ' + G.learned[w] + '</span>'; }).join('');
    $('endText').textContent = 'תשובות ראשונות: שחקן 1 — ' + G.first[0] + ', שחקן 2 — ' + G.first[1] + ' · טעויות: ' + (G.wrong[0] + G.wrong[1]);
    try { Wallet.add(3); HeroRewards.confetti(); } catch (e) {} try { Achievements.hit('duel:done'); } catch (e) {} track('duel:done'); try { TapFX.set('full'); } catch (e) {}
    say(win ? 'שחקן ' + win + ' מנצח! ' + a + ' נגד ' + b : 'תיקו! ' + a + ' נגד ' + b + '. שניכם חכמים!');
    $('endScreen').classList.add('show');
  }
  function bind() {
    $('goBtn').addEventListener('click', function () { tap(); newRound(); });
    $('againBtn').addEventListener('click', function () { tap(); newRound(); });
    $('backBtn').addEventListener('click', function () { tap(); $('endScreen').classList.remove('show'); $('startScreen').classList.add('show'); });
    document.querySelectorAll('.opts').forEach(function (o) { o.addEventListener('pointerdown', function (e) { var b = e.target.closest('.opt'); if (b) { e.preventDefault(); onOpt(b); } }); });
    $('flipBtn').addEventListener('click', function () { tap(); document.body.classList.toggle('noflip'); say(document.body.classList.contains('noflip') ? 'שניכם באותו צד' : 'פנים אל פנים: שחקן 2 רואה הפוך'); });
  }
  if (window.addEventListener) window.addEventListener('DOMContentLoaded', function () { bind(); $('startScreen').classList.add('show'); });

  /* ---------- פרק 6 — API ---------- */
  /* englishLines — כל המשפטים באנגלית בדו-קרב (ל-tools/gen_voice.py) */
  function englishLines() { var out = ['How many?']; GROUPS.forEach(function (g) { g.forEach(function (it) { out.push('Where is the ' + it[0] + '?'); out.push(it[0]); }); }); COLORS.forEach(function (c) { out.push('Touch the ' + c[0] + '!'); out.push(c[0]); }); return out; }
  window.Duel = { englishLines: englishLines, state: function () { return G; }, start: newRound, answer: function (p, ok) { var q = G.q, i = -1; q.opts.forEach(function (o, k) { if (o.ok === ok && i < 0) i = k; }); onOpt(document.querySelector('.opt[data-p="' + p + '"][data-i="' + i + '"]')); }, next: next, finish: finish, GEN: GEN };
})();
