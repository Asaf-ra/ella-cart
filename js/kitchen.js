/* =====================================================================
   js/kitchen.js — 👥 "המטבח לשניים": בישולים בעגלה לשני שחקנים (שלב 18)
   ---------------------------------------------------------------------
   מה הקובץ עושה: לקוח מגיע עם הזמנה (המבורגר / פיצה / מילקשייק / פנקייק / דונאט). המתכון מוצג כשרשרת מרכיבים
   לפי הסדר. המרכיבים מחולקים בין שני מגשים: שחקן 1 (שמאל) מחזיק את הבסיסים והחלבונים, שחקן 2 (ימין) את הירקות
   והתוספות — אז חייבים לעבוד יחד: מי שיש לו את המרכיב הבא נוגע בו, והוא עף לצלחת. מרכיב לא נכון = "אופס" קטן
   בלי עונש. ללקוח יש מד סבלנות נדיב. מגישים → טיפ במטבעות. כל מרכיב שנוגעים בו נאמר באנגלית (LearnFX).

   פרק 1 — מתכונים ומרכיבים: ING (אימוג'י / ציור SVG מהעגלה, שם באנגלית, שם בעברית, למי שייך), RECIPES (רצף)
   פרק 2 — מצב סבב: 6 הזמנות, סבלנות, ניקוד, מילים שנלמדו, שמירה (<pfx>-kitchen-v1: שיא, סבבים)
   פרק 3 — ממשק: לקוח, שרשרת המתכון, הצלחת, שני המגשים (מרכיבי המתכון + מסיחים), מגע
   פרק 4 — זרימה: הזמנה חדשה → מרכיב נכון/לא נכון → הגשה (קונפטי, טיפ, "Order up!") → סיום (תעודה, הישג kitchen:done)
   פרק 5 — API לבדיקות: window.Kitchen
   תלויות: shared/learn-fx.js, js/audio.js, kids-ui, wallet, hero-rewards, progress, achievements
   ===================================================================== */
(function () {
  'use strict';
  var BOY = !!window.KITCHEN_BOY, PFX = BOY ? 'eitan' : 'ella', KEY = PFX + '-kitchen-v1';
  var ORDERS = 6, PATIENCE = 40;                           // הזמנות בסבב · שניות סבלנות להזמנה

  /* ---------- פרק 1 — מתכונים ---------- */
  // ING: id → [תצוגה (אימוג'י או svg:שם קובץ ב-assets/art), אנגלית, עברית, מגש (0 = שחקן 1, 1 = שחקן 2)]
  var ING = {
    bun_bottom: ['svg:ing_bun_bottom', 'bottom bun', 'לחמנייה תחתונה', 0], patty: ['svg:ing_patty', 'patty', 'קציצה', 0], cheese: ['svg:ing_cheese', 'cheese', 'גבינה', 0], bun_top: ['svg:ing_bun_top', 'top bun', 'לחמנייה עליונה', 0],
    lettuce: ['svg:ing_lettuce', 'lettuce', 'חסה', 1], tomato: ['svg:ing_tomato', 'tomato', 'עגבנייה', 1], cucumber: ['svg:ing_cucumber', 'cucumber', 'מלפפון', 1], onion: ['svg:ing_onion', 'onion', 'בצל', 1],
    pizza: ['svg:food_pizza', 'pizza', 'פיצה', 0], mushroom: ['svg:ing_mushroom', 'mushroom', 'פטרייה', 1], pepper: ['svg:ing_pepper', 'pepper', 'פלפל', 1], olive: ['svg:ing_olive', 'olive', 'זית', 1], pineapple: ['svg:ing_pineapple', 'pineapple', 'אננס', 1],
    vanilla: ['svg:ing_vanilla', 'vanilla', 'וניל', 0], straw: ['svg:ing_straw', 'strawberry', 'תות', 0], choc: ['svg:ing_choc', 'chocolate', 'שוקולד', 0], blue: ['svg:ing_blue', 'blueberry', 'אוכמנייה', 0], cherry: ['svg:ing_cherry', 'cherry', 'דובדבן', 1], cream: ['🍦', 'whipped cream', 'קצפת', 1],
    pancake: ['🥞', 'pancake', 'פנקייק', 0], banana: ['🍌', 'banana', 'בננה', 1], honey: ['🍯', 'honey', 'דבש', 1], egg: ['🍳', 'egg', 'ביצה', 0],
    donut: ['🍩', 'donut', 'דונאט', 0], sprinkles: ['🌈', 'sprinkles', 'סוכריות', 1], cookie: ['🍪', 'cookie', 'עוגייה', 1], star: ['⭐', 'star', 'כוכב', 1]
  };
  // RECIPES: שם המנה → רשימת מתכונים אפשריים (רצף מזהי מרכיבים)
  var RECIPES = {
    burger: { name: 'המבורגר', ico: '🍔', en: 'burger', list: [['bun_bottom', 'patty', 'cheese', 'lettuce', 'bun_top'], ['bun_bottom', 'patty', 'tomato', 'cucumber', 'bun_top'], ['bun_bottom', 'patty', 'cheese', 'onion', 'tomato', 'bun_top']] },
    pizza: { name: 'פיצה', ico: '🍕', en: 'pizza', list: [['pizza', 'cheese', 'mushroom', 'olive'], ['pizza', 'cheese', 'pepper', 'pineapple'], ['pizza', 'cheese', 'olive', 'mushroom', 'pepper']] },
    shake: { name: 'מילקשייק', ico: '🥤', en: 'milkshake', list: [['vanilla', 'straw', 'cream', 'cherry'], ['choc', 'blue', 'cream'], ['straw', 'vanilla', 'cherry']] },
    pancake: { name: 'פנקייק', ico: '🥞', en: 'pancake', list: [['pancake', 'banana', 'honey'], ['pancake', 'egg', 'cherry', 'honey'], ['pancake', 'straw', 'cream']] },
    donut: { name: 'דונאט', ico: '🍩', en: 'donut', list: [['donut', 'choc', 'sprinkles'], ['donut', 'straw', 'cookie', 'star'], ['donut', 'sprinkles', 'cherry']] }
  };
  var CUSTS = ['cust_bear', 'cust_cat', 'cust_bunny', 'cust_panda', 'cust_dog', 'cust_fox', 'cust_frog', 'cust_penguin', 'cust_pig', 'cust_mouse'];
  var CUST_NAMES = { cust_bear: 'דובי', cust_cat: 'חתולה', cust_bunny: 'ארנב', cust_panda: 'פנדה', cust_dog: 'כלבלב', cust_fox: 'שועלה', cust_frog: 'צפרדע', cust_penguin: 'פינגווין', cust_pig: 'חזרזיר', cust_mouse: 'עכברון' };
  var PCOL = ['#29e0ff', '#ff5ca8'];

  /* ---------- עזרים ---------- */
  function $(id) { return document.getElementById(id); }
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function say(t) { try { Voice.say(t, { interrupt: true }); } catch (e) {} }
  function sayEn(t) { try { Voice.en(t); } catch (e) {} }
  function snd(n) { try { if (window.Sound && Sound[n]) Sound[n](); } catch (e) {} }
  function tap(p) { try { KidsUI.KidsAudio.tap(p); } catch (e) {} }
  function track(ev) { try { if (window.Progress) Progress.track(ev); } catch (e) {} }
  function pick(a) { return a[(Math.random() * a.length) | 0]; }
  function view(id) { var d = ING[id][0]; return d.indexOf('svg:') === 0 ? '<img src="assets/art/' + d.slice(4) + '.svg" alt="">' : '<span class="emo">' + d + '</span>'; }

  /* ---------- פרק 2 — מצב ---------- */
  function load() { try { return Object.assign({ best: 0, rounds: 0, words: {} }, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { return { best: 0, rounds: 0, words: {} }; } }
  var S = load(); function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  var G = null, last = 0;

  /* ---------- פרק 3 — ממשק ---------- */
  function newOrder() {
    var keys = Object.keys(RECIPES), k = keys[G.n % keys.length], r = RECIPES[k], seq = pick(r.list);
    G.order = { k: k, r: r, seq: seq, i: 0, cust: pick(CUSTS), pat: PATIENCE, done: false };
    $('custImg').src = 'assets/art/' + G.order.cust + '.svg'; $('custName').textContent = CUST_NAMES[G.order.cust] + ' רוצה ' + r.name + ' ' + r.ico;
    $('plate').innerHTML = ''; $('plate').className = 'plate ' + k;
    renderChain(); renderTrays();
    say(CUST_NAMES[G.order.cust] + ' רוצה ' + r.name + '! ' + (ING[seq[0]][3] === 0 ? 'שחקן 1' : 'שחקן 2') + ' מתחיל: ' + ING[seq[0]][2]);
    try { LearnFX.word(r.en, r.name, r.ico, { tag: '🇬🇧 ההזמנה', pos: 'top', quiet: true }); } catch (e) {}
  }
  function renderChain() {
    var o = G.order; $('chain').innerHTML = o.seq.map(function (id, i) { return '<span class="ch' + (i < o.i ? ' done' : i === o.i ? ' next' : '') + ' p' + ING[id][3] + '">' + view(id) + '<b>' + (i + 1) + '</b></span>'; }).join('<i class="arr">◀</i>');
  }
  function renderTrays() {
    var o = G.order;
    for (var p = 0; p < 2; p++) {
      var mine = o.seq.filter(function (id) { return ING[id][3] === p; }), pool = Object.keys(ING).filter(function (id) { return ING[id][3] === p && mine.indexOf(id) < 0; });
      var items = mine.slice(); while (items.length < 6 && pool.length) items.push(pool.splice((Math.random() * pool.length) | 0, 1)[0]);
      items.sort(function () { return Math.random() - .5; });
      var tray = $('tray' + p); tray.innerHTML = items.map(function (id) { return '<button type="button" class="ing" data-id="' + id + '" data-p="' + p + '">' + view(id) + '<small dir="ltr">' + ING[id][1] + '</small></button>'; }).join('');
    }
  }
  function onIng(btn) {
    if (!G || !G.run || !G.order || G.order.done) return;
    var id = btn.dataset.id, p = +btn.dataset.p, o = G.order, need = o.seq[o.i];
    if (id === need) {
      o.i++; G.ok++; G.learned[ING[id][1]] = ING[id][2]; S.words[ING[id][1]] = ING[id][2];
      fly(btn, $('plate')); var layer = el('div', 'layer', view(id)); layer.style.setProperty('--i', o.i); $('plate').appendChild(layer);
      try { LearnFX.word(ING[id][1], ING[id][2], ING[id][0].indexOf('svg:') === 0 ? o.r.ico : ING[id][0], { tag: '🇬🇧 ' + (p ? 'שחקן 2' : 'שחקן 1'), pos: 'bottom', quiet: true }); } catch (e) {} sayEn(ING[id][1]);
      try { TapFX.word(btn.getBoundingClientRect().left + 40, btn.getBoundingClientRect().top, 'YUM!'); } catch (e) {}
      snd('pop'); G.score[p]++;
      if (o.i >= o.seq.length) serve(); else renderChain();
    } else {
      G.oops++; btn.classList.remove('shake'); void btn.offsetWidth; btn.classList.add('shake'); tap(240);
      var who = ING[need][3] === p ? 'אצלך' : (ING[need][3] ? 'אצל שחקן 2' : 'אצל שחקן 1');
      say('לא זה… עכשיו צריך ' + ING[need][2] + ' — ' + who);
    }
  }
  function fly(from, to) {
    var a = from.getBoundingClientRect(), b = to.getBoundingClientRect(), f = el('div', 'fly', from.firstElementChild.outerHTML); f.style.left = a.left + a.width / 2 + 'px'; f.style.top = a.top + a.height / 2 + 'px'; document.body.appendChild(f);
    requestAnimationFrame(function () { f.style.transform = 'translate(' + (b.left + b.width / 2 - a.left - a.width / 2) + 'px,' + (b.top + b.height / 2 - a.top - a.height / 2) + 'px) scale(.6)'; f.style.opacity = '0'; }); setTimeout(function () { f.remove(); }, 700);
  }

  /* ---------- פרק 4 — זרימה ---------- */
  function serve() {
    var o = G.order; o.done = true; var tipc = 2 + Math.round(o.pat / PATIENCE * 3); G.tips += tipc; G.served++;
    $('custName').textContent = CUST_NAMES[o.cust] + ': תודה! יאמי! 🪙 +' + tipc; snd('cha_ching'); sayEn('Order up!'); say('ההזמנה מוכנה! ' + CUST_NAMES[o.cust] + ' נותן טיפ של ' + tipc + ' מטבעות');
    try { HeroRewards.award(1, $('plate'), { word: 'מוכן!' }); } catch (e) {} track('answer');
    G.n++; hud();
    setTimeout(function () { if (!G || !G.run) return; if (G.n >= ORDERS) finish(); else newOrder(); }, 1800);
  }
  function loop(now) {
    requestAnimationFrame(loop); var dt = Math.min(.05, (now - last) / 1000); last = now; if (!G || !G.run || !G.order || G.order.done) return;
    G.order.pat -= dt; $('patBar').style.width = Math.max(0, G.order.pat / PATIENCE * 100) + '%'; $('patBar').parentNode.classList.toggle('low', G.order.pat < 10);
    if (G.order.pat <= 0) { G.order.done = true; G.late++; say(CUST_NAMES[G.order.cust] + ' מחכה יותר מדי… ניסיון חדש!'); G.n++; setTimeout(function () { if (!G || !G.run) return; if (G.n >= ORDERS) finish(); else newOrder(); }, 1200); }
  }
  function hud() { $('hServed').textContent = '🍽️ ' + G.served + '/' + ORDERS; $('hTips').textContent = '🪙 ' + G.tips; $('hP1').textContent = 'שחקן 1 · ' + G.score[0]; $('hP2').textContent = 'שחקן 2 · ' + G.score[1]; }
  function newRound() {
    G = { run: true, n: 0, served: 0, tips: 0, ok: 0, oops: 0, late: 0, score: [0, 0], learned: {}, order: null };
    $('startScreen').classList.remove('show'); $('endScreen').classList.remove('show'); hud(); newOrder(); last = performance.now();
    try { TapFX.set('light'); } catch (e) {}
  }
  function finish() {
    G.run = false; try { TapFX.set('full'); } catch (e) {}
    var ws = Object.keys(G.learned), stars = G.served >= 6 ? 3 : G.served >= 4 ? 2 : 1;
    S.rounds++; S.best = Math.max(S.best, G.tips); save();
    $('eServed').textContent = G.served + '/' + ORDERS; $('eTips').textContent = G.tips; $('eP').textContent = G.score[0] + ' : ' + G.score[1]; $('eOops').textContent = G.oops;
    $('eStars').textContent = '⭐'.repeat(stars); $('learned').innerHTML = ws.map(function (w) { return '<span>' + w + ' · ' + G.learned[w] + '</span>'; }).join('');
    $('endText').textContent = G.served === ORDERS ? 'כל הלקוחות יצאו שמחים! צוות מטבח מושלם 👩‍🍳👨‍🍳' : 'עוד ' + (ORDERS - G.served) + ' לקוחות בפעם הבאה — עובדים מהר ויחד!';
    try { Wallet.add(G.tips); } catch (e) {} try { HeroRewards.award(stars, $('kHud'), { word: 'שפים!' }); HeroRewards.confetti(); } catch (e) {}
    try { Achievements.hit('kitchen:done'); if (G.served === ORDERS) Achievements.hit('kitchen:perfect'); } catch (e) {}
    track('kitchen:done'); try { TapFX.set('full'); } catch (e) {}
    say('סיימנו! ' + G.served + ' הזמנות, ' + G.tips + ' מטבעות טיפ. ' + (G.served === ORDERS ? 'צוות מושלם!' : 'כל הכבוד!'));
    $('endScreen').classList.add('show');
  }
  function bind() {
    $('goBtn').addEventListener('click', function () { tap(); newRound(); });
    $('againBtn').addEventListener('click', function () { tap(); newRound(); });
    $('backBtn').addEventListener('click', function () { tap(); $('endScreen').classList.remove('show'); $('startScreen').classList.add('show'); });
    document.querySelectorAll('.tray').forEach(function (t) { t.addEventListener('pointerdown', function (e) { var b = e.target.closest('.ing'); if (b) { e.preventDefault(); onIng(b); } }); });
    $('kBest').textContent = S.best ? 'שיא טיפים: 🪙 ' + S.best : '';
  }
  if (window.addEventListener) window.addEventListener('DOMContentLoaded', function () { bind(); $('startScreen').classList.add('show'); requestAnimationFrame(function (t) { last = t; loop(t); }); });

  /* ---------- פרק 5 — API ---------- */
  /* englishLines — כל המילים באנגלית במטבח (ל-tools/gen_voice.py) */
  function englishLines() { var out = ['Order up!', 'burger', 'milkshake']; Object.keys(ING).forEach(function (k) { out.push(ING[k][1]); }); Object.keys(RECIPES).forEach(function (k) { out.push(RECIPES[k].en); }); return out; }
  window.Kitchen = { englishLines: englishLines, state: function () { return G; }, start: newRound, tapIng: function (id) { var b = document.querySelector('.ing[data-id="' + id + '"]'); if (b) onIng(b); }, need: function () { return G && G.order ? G.order.seq[G.order.i] : null; }, finish: finish, ING: ING, RECIPES: RECIPES };
})();
