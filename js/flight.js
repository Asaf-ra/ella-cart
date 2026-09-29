/* =====================================================================
   js/flight.js — טיסת גיבורה 2.0: אלה טסה בעיר, אוספת כוכבים, מצילה חתולים,
   בונה מילים באנגלית ונלחמת בבלגנון באמצע הטיסה
   ---------------------------------------------------------------------
   פרק 1  — הגדרות: אזורים (+ רשימת מכשולים לכל אזור), משימות, כוחות-על, שמירה
   פרק 2  — קנבס ומידות: עולם וירטואלי בגובה 800, רוחב לפי יחס המסך
   פרק 3  — ספרייטים: אימוג'י מצוירים מראש לקנבס (מהיר), והגיבורה מ-HeroAvatar
   פרק 4  — רקע פרלקסה: כוכבים, בניינים רחוקים וקרובים (או עננים/חלל/קשת)
   פרק 5  — ישויות ויצירה (spawn): חיוביות (כוכבים, טבעות, אותיות, מתנות)
            ומכשולים (סערה, ציפורים, ברק, רוח, בועה, דבק, מטאור)
   פרק 6  — שליטה: האצבע קובעת גובה יעד; הקשות משחררות מבועה
   פרק 7  — פידבק: טקסט קומיקס קופץ, ניצוצות, רעידת מסך, קומבו ושבחים
   פרק 8  — מילים באנגלית: בוחרים מילה, אותיות מופיעות לפי הסדר, הקראה
   פרק 9  — בוס באמצע הסבב: בלגנון זורק דבק, 3 טבעות זהב מגרשות אותו
   פרק 10 — לולאת משחק: עדכון, פגיעות (hit), התנגשויות, קושי עולה
   פרק 11 — ציור: ישויות, אפקטים, גיבורה, רוח וברקים
   פרק 12 — HUD
   פרק 13 — מסכים: פתיחה ובחירת אזור, השהיה, תוצאות ומדליה
   אין פסילה ואין Game Over: פגיעה רק מסחררת לרגע ומפילה עד 3 כוכבים,
   ואפשר לתפוס אותם שוב.
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- פרק 1 — הגדרות ---------- */
  var ROUND = 90;                        // אורך סבב בשניות
  var SAVE = 'ella-flight-v1';
  var HERO_WORD = 'גיבורה אמיתית!';      // ביטוי השבח (בגרסת הבנים: "גיבור אמיתי!")
  var HERO_EMOJI = '🦸‍♀️';

  /* 5 אזורים: שמיים (גרדיאנט), סוג קרקע, צבעי בניינים, קצב, ורשימת המכשולים (hz) */
  var ZONES = [
    { name: 'עיר בלילה',   ico: '🌃', sky: ['#1d0b4a', '#3a1177', '#6a1b8f'], ground: 'city', b1: '#2a1260', b2: '#3b1a6e', speed: 1.0, hz: ['storm', 'birds', 'goo'] },
    { name: 'שקיעה',       ico: '🌇', sky: ['#3a1177', '#ff5d8f', '#ffb36b'], ground: 'city', b1: '#4a1c6e', b2: '#6a2474', speed: 1.1, hz: ['storm', 'birds', 'gust', 'bubble'] },
    { name: 'מעל העננים',  ico: '☁️', sky: ['#5cc8ff', '#a9e4ff', '#fff3e0'], ground: 'clouds', speed: 1.2, hz: ['storm', 'bolt', 'gust', 'bubble'] },
    { name: 'חלל',         ico: '🪐', sky: ['#05021a', '#140a33', '#2a1260'], ground: 'space', speed: 1.3, hz: ['meteor', 'goo', 'bolt', 'bubble'] },
    { name: 'ארץ הקשת',    ico: '🌈', sky: ['#ffd6ec', '#d9c2ff', '#b6f0ff'], ground: 'rainbow', speed: 1.4, hz: ['storm', 'birds', 'bolt', 'gust', 'bubble', 'goo', 'meteor'] }
  ];

  /* משימות קצרות: אחת בכל סבב, בונוס 3 מטבעות */
  var MISSIONS = [
    { t: 'אספי 25 כוכבים ⭐', k: 'stars', n: 25 }, { t: 'הצילי 3 חתולים 🐱', k: 'cats', n: 3 },
    { t: 'אספי 3 מטבעות 🪙', k: 'coins', n: 3 },   { t: 'אספי 40 כוכבים ⭐', k: 'stars', n: 40 },
    { t: 'הצילי 5 חתולים 🐱', k: 'cats', n: 5 },     { t: 'בני מילה באנגלית 🔤', k: 'words', n: 1 },
    { t: 'עופי דרך 12 טבעות 💫', k: 'rings', n: 12 }, { t: 'קומבו של 15 🔥', k: 'bestCombo', n: 15 }
  ];

  /* כוחות-על לפי הכוח שנבחר בארון התחפושות */
  var POWERS = {
    aura_sparkle: { name: 'כוכבים כפולים ✨', key: 'double' },
    aura_bolt:    { name: 'מגנט כוכבים ⚡', key: 'magnet' },
    aura_wings:   { name: 'כנפיים מהירות 🪽', key: 'fast' },
    aura_shield:  { name: 'מגן סערות 🛡️', key: 'shield' },
    aura_hearts:  { name: 'חתולים כפולים 💗', key: 'cats2' },
    aura_bubbles: { name: 'בועת הגנה 🫧', key: 'bubble' }
  };

  /* מתנות שנאספות באוויר: מגנט ורקטה פעילים לזמן קצוב, מגן לפגיעה אחת, ומטר כוכבים */
  var PICKUPS = { magnet: { ico: '🧲', dur: 7, say: 'מגנט!' }, rocket: { ico: '🚀', dur: 4.5, say: 'רקטה!' }, shield: { ico: '🛡️', dur: 0, say: 'מגן!' }, shower: { ico: '🌠', dur: 0, say: 'מטר כוכבים!' } };

  var PRAISE = ['אלופה!', 'מדהים!', 'וואו!', 'איזו טייסת!', 'סופר!', HERO_WORD];

  /* שמירה: כמה אזורים פתוחים + שיאים */
  var DEF = { open: 1, best: 0, cats: 0, zone: 0, words: 0, bestCombo: 0, bossWins: 0 };
  function loadSave() { try { return Object.assign({}, DEF, JSON.parse(localStorage.getItem(SAVE)) || {}); } catch (e) { return Object.assign({}, DEF); } }
  var save = loadSave();
  function persist() { try { localStorage.setItem(SAVE, JSON.stringify(save)); } catch (e) {} }

  /* קיצורים בטוחים לצלילים ולקול (לא נופלים אם audio.js חסר) */
  function snd(n) { try { Sound[n](); } catch (e) {} }
  function say(t) { try { Voice.say(t); } catch (e) {} }
  function sayEn(t) { try { Voice.en(t); } catch (e) {} }
  /* readP — רצף עברית/אנגלית לפי הסדר (למשל "תפסו את" + [See]) */
  function readP(parts) { try { Voice.read(parts, { interrupt: true }); } catch (e) {} }

  /* ---------- פרק 2 — קנבס ומידות ---------- */
  var cv = document.getElementById('sky'), ctx = cv.getContext('2d');
  var VH = 800, VW = 1280, scale = 1, dpr = 1;
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr);
    scale = cv.height / VH; VW = cv.width / scale;
  }
  window.addEventListener('resize', resize); resize();

  /* ---------- פרק 3 — ספרייטים ---------- */
  /* emoji(ch, size): מצייר אימוג'י פעם אחת לקנבס קטן ומחזיר אותו (ציור מהיר בכל פריים) */
  var cache = {};
  function emoji(ch, size) {
    var k = ch + size; if (cache[k]) return cache[k];
    var c = document.createElement('canvas'); c.width = c.height = Math.ceil(size * 1.3);
    var x = c.getContext('2d'); x.font = size + 'px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(ch, c.width / 2, c.height / 2 + size * .05);
    return (cache[k] = c);
  }
  /* drawE: אימוג'י ממורכז בנקודה (x,y) */
  function drawE(ch, size, x, y) { var c = emoji(ch, size); ctx.drawImage(c, x - c.width / 2, y - c.height / 2); }
  /* הגיבורה בתחפושת השמורה (SVG → Image) */
  var heroImg = new Image(), heroReady = false;
  heroImg.onload = function () { heroReady = true; };
  if (window.HeroAvatar) heroImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(HeroAvatar.svg(window.HeroRewards ? HeroRewards.outfit : null).replace('<svg ', '<svg width="240" height="300" '));

  /* ---------- פרק 4 — רקע פרלקסה ---------- */
  var bgStars = [], far = [], near = [], puffs = [];
  function buildBackground() {
    bgStars = []; for (var i = 0; i < 90; i++) bgStars.push({ x: Math.random() * 2000, y: Math.random() * 520, r: Math.random() < .2 ? 2.4 : 1.3, tw: Math.random() * 6 });
    far = []; for (var x = 0; x < 2600;) { var w = 60 + Math.random() * 70; far.push({ x: x, w: w, h: 120 + Math.random() * 200 }); x += w; }
    near = []; for (x = 0; x < 2600;) { w = 80 + Math.random() * 90; var b = { x: x, w: w, h: 90 + Math.random() * 170, win: [] };
      for (var wy = 14; wy < b.h - 14; wy += 26) for (var wx = 10; wx < w - 12; wx += 20) if (Math.random() < .35) b.win.push([wx, wy]);
      near.push(b); x += w; }
    puffs = []; for (i = 0; i < 9; i++) puffs.push({ x: Math.random() * 2200, y: 120 + Math.random() * 500, s: .6 + Math.random() * .9 });
  }
  /* מיקום של שכבה שחוזרת על עצמה בגלילה */
  function loopX(x, span, off) { return ((x - off) % span + span) % span - 120; }
  function drawBackground(t) {
    var z = ZONES[game.zone];
    var g = ctx.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, z.sky[0]); g.addColorStop(.55, z.sky[1]); g.addColorStop(1, z.sky[2]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
    /* כוכבים וירח באזורי לילה/חלל */
    if (z.ground === 'city' || z.ground === 'space') {
      bgStars.forEach(function (s) { ctx.globalAlpha = .45 + .45 * Math.sin(t * 2 + s.tw); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(loopX(s.x, 2000, game.dist * .05), s.y, s.r, 0, 7); ctx.fill(); });
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff3c4'; ctx.beginPath(); ctx.arc(VW - 170, 120, 46, 0, 7); ctx.fill();
      ctx.fillStyle = z.sky[0]; ctx.beginPath(); ctx.arc(VW - 150, 108, 40, 0, 7); ctx.fill();
    }
    if (z.ground === 'space') { /* כוכבי לכת */
      ctx.drawImage(emoji('🪐', 110), loopX(900, 2400, game.dist * .12), 150);
      ctx.drawImage(emoji('🌍', 90), loopX(1900, 2400, game.dist * .12), 470);
    }
    if (z.ground === 'rainbow') { /* קשתות */
      ['#ff4f7b', '#ffa53b', '#ffe45c', '#4fe0a0', '#4fb4ff', '#9b6bff'].forEach(function (c, i) {
        ctx.strokeStyle = c; ctx.lineWidth = 22; ctx.beginPath(); ctx.arc(loopX(700, 2200, game.dist * .15), VH + 60, 520 - i * 22, Math.PI, 0); ctx.stroke();
      });
    }
    /* עננים רכים */
    puffs.forEach(function (p) { drawCloud(loopX(p.x, 2200, game.dist * .25), p.y, p.s, z.ground === 'clouds' ? .95 : .35); });
    /* קרקע */
    if (z.ground === 'city') {
      far.forEach(function (b) { var x = loopX(b.x, 2600, game.dist * .3); ctx.fillStyle = z.b1; ctx.fillRect(x, VH - b.h - 60, b.w + 1, b.h + 60); });
      near.forEach(function (b) {
        var x = loopX(b.x, 2600, game.dist * .6); ctx.fillStyle = z.b2; ctx.fillRect(x, VH - b.h, b.w + 1, b.h);
        ctx.fillStyle = 'rgba(255,217,90,.8)'; b.win.forEach(function (w) { ctx.fillRect(x + w[0], VH - b.h + w[1], 7, 10); });
      });
    } else if (z.ground === 'clouds') {
      for (var i = 0; i < 12; i++) drawCloud(loopX(i * 220, 2640, game.dist * .6), VH - 40, 2.2, 1);
    }
  }
  /* ענן מעוגל */
  function drawCloud(x, y, s, a) {
    ctx.globalAlpha = a; ctx.fillStyle = '#fff'; ctx.beginPath();
    ctx.arc(x, y, 28 * s, 0, 7); ctx.arc(x + 32 * s, y - 16 * s, 34 * s, 0, 7); ctx.arc(x + 66 * s, y, 26 * s, 0, 7); ctx.fill();
    ctx.fillRect(x, y - 2, 66 * s, 26 * s); ctx.globalAlpha = 1;
  }

  /* ---------- פרק 5 — ישויות ויצירה ---------- */
  var ents = [], fx = [];
  var HX = function () { return VW * .22; };     // מיקום הגיבורה על ציר X (קבוע, העולם זז)
  function rndY() { return 110 + Math.random() * (VH - 260); }
  /* spawn(kind): מוסיף ישות (או קבוצת ישויות) מימין למסך */
  function spawn(kind, opt) {
    var y = rndY(), x0 = VW + 80, i;
    switch (kind) {
      /* --- חיוביות --- */
      case 'stars': for (i = 0; i < 5; i++) ents.push({ k: 'star', x: x0 + i * 70, y: y + Math.sin(i * .9) * 50, r: 30 }); return;
      case 'rings': { /* שרשרת 5 טבעות בקשת: כל טבעת ברצף מכפילה את הבונוס */
        var chain = ++ringChainId;
        for (i = 0; i < 5; i++) ents.push({ k: 'ring', x: x0 + i * 150, y: Math.max(120, Math.min(VH - 140, y + Math.sin(i * .8) * 110)), r: 40, chain: chain, idx: i });
        return; }
      case 'coin': ents.push({ k: 'coin', x: x0, y: y, r: 32 }); return;
      case 'cat': ents.push({ k: 'cat', x: x0, y: y, r: 46, bob: Math.random() * 6 }); return;
      case 'pickup': { var keys = Object.keys(PICKUPS), pk = (opt && opt.p) || keys[(Math.random() * keys.length) | 0];
        ents.push({ k: 'pickup', p: pk, x: x0, y: y, r: 40, bob: Math.random() * 6 }); return; }
      case 'letter': ents.push({ k: 'letter', ch: opt.ch, good: opt.good, x: x0 + (opt.dx || 0), y: opt.y || y, r: 42, bob: Math.random() * 6 }); return;
      case 'shower': for (i = 0; i < 22; i++) ents.push({ k: 'star', x: VW * .3 + Math.random() * VW * .8, y: -40 - Math.random() * 600, vy: 260 + Math.random() * 120, r: 30 }); return;
      /* --- מכשולים --- */
      case 'storm': ents.push({ k: 'storm', x: x0, y: y, r: 58 }); return;
      case 'birds': { var n = 3 + ((Math.random() * 3) | 0); for (i = 0; i < n; i++) ents.push({ k: 'bird', x: x0 + i * 60, y0: y + (i % 2) * 40, y: y, ph: i * .6, r: 30 }); pop(VW - 160, y - 60, 'ציפורים!', '#fff', 30); return; }
      case 'meteor': ents.push({ k: 'meteor', x: x0, y: Math.random() * 300, vy: 140 + Math.random() * 120, r: 40 }); return;
      case 'goo': ents.push({ k: 'goo', x: x0, y: y, r: 46 }); return;
      case 'bubble': ents.push({ k: 'bubble', x: x0, y: y, r: 44, bob: Math.random() * 6 }); return;
      case 'bolt': { /* ברק: אזהרה של 1.3 שניות ואז עמוד ברק מלמעלה או מלמטה (חצי מסך) */
        var fromTop = Math.random() < .5, cut = 330 + Math.random() * 140;
        var sp = worldSpeed();
        ents.push({ k: 'bolt', x: HX() + sp * 1.3 + (Math.random() - .3) * 160, t: 1.3, top: fromTop, cut: cut, r: 0 });
        snd('pop'); return; }
      case 'gust': { /* רוח: דוחפת את הגיבורה למעלה או למטה במשך 2.4 שניות */
        game.gust = { t: 2.4, dir: Math.random() < .5 ? -1 : 1 };
        pop(VW * .5, 180, game.gust.dir < 0 ? 'רוח למעלה! 🌬️' : 'רוח למטה! 🌬️', '#bff3ff', 40); snd('bubble'); return; }
      case 'boss': startBoss(); return;
    }
  }
  var ringChainId = 0;
  var spawnT = {};

  /* ---------- פרק 6 — שליטה ---------- */
  var targetY = VH / 2;
  function pointerY(e) { return (e.clientY * dpr) / scale; }
  cv.addEventListener('pointerdown', function (e) {
    try { Sound.unlock(); } catch (x) {}
    /* לכוד בבועה? כל הקשה מקרבת לשחרור */
    if (game.trap) { tapTrap(); return; }
    targetY = pointerY(e);
  });
  cv.addEventListener('pointermove', function (e) { if (!game.trap && (e.buttons || e.pointerType === 'touch')) targetY = pointerY(e); });

  /* ---------- פרק 7 — פידבק ---------- */
  /* pop: טקסט קומיקס קופץ (דיו כהה + מילוי צבעוני) במיקום עולם */
  function pop(x, y, text, color, size) { fx.push({ pop: true, x: x, y: Math.max(200, Math.min(VH - 60, y)), text: text, c: color || '#ffd95a', s: size || 34, life: 1.1, max: 1.1 }); }
  /* פיצוץ POW של HeroRewards במיקום עולם → מסך */
  function pow(x, y, w) {
    if (!window.HeroRewards) return;
    var px = x * scale / dpr, py = y * scale / dpr;
    HeroRewards.pow({ getBoundingClientRect: function () { return { left: px, top: py, width: 0, height: 0 }; } }, w);
  }
  /* חלקיקי ניצוץ קטנים */
  function sparks(x, y, color, n) { for (var i = 0; i < n; i++) { var a = Math.random() * 7, s = 80 + Math.random() * 220; fx.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: .6, c: color }); } }
  /* קומבו: כל איסוף מגדיל, פגיעה מאפסת; כל 10 = שבח גדול */
  function combo() {
    game.combo++; if (game.combo > game.bestCombo) game.bestCombo = game.combo;
    if (game.combo % 10 === 0) { pop(HX() + 60, game.hy - 120, PRAISE[(game.combo / 10 - 1) % PRAISE.length] + ' ×' + game.combo, '#ff5fd2', 46); snd('ding'); say(PRAISE[(game.combo / 10 - 1) % PRAISE.length]); game.flash = .25; }
  }
  function addStars(n, x, y) { game.stars += n; sparks(x, y, '#ffd95a', 6); combo(); }

  /* ---------- פרק 8 — מילים באנגלית ---------- */
  var WORDS = [];
  (function buildWords() {
    var T = window.DragonData && DragonData.THEMES;
    if (T) Object.keys(T).forEach(function (k) { T[k].words.forEach(function (w) { if (/^[a-z]{3,4}$/.test(w[0])) WORDS.push({ en: w[0], pic: w[1], he: w[2] }); }); });
    if (!WORDS.length) WORDS = [{ en: 'cat', pic: '🐱', he: 'חתול' }, { en: 'sun', pic: '☀️', he: 'שמש' }, { en: 'dog', pic: '🐶', he: 'כלב' }];
  })();
  function newWord() {
    game.word = WORDS[(Math.random() * WORDS.length) | 0]; game.wi = 0;
    spawnT.letter = 2.5;
  }
  /* אות הבאה: האות הנכונה, ולפעמים גם אות מטעה בגובה אחר (בלי עונש, רק "לא זאת") */
  function spawnLetter() {
    var ch = game.word.en[game.wi], y = rndY();
    spawn('letter', { ch: ch, good: true, y: y });
    if (Math.random() < .45 + game.zone * .08) {
      var abc = 'abcdefghijklmnopqrstuvwxyz', bad; do { bad = abc[(Math.random() * 26) | 0]; } while (bad === ch);
      spawn('letter', { ch: bad, good: false, y: y > VH / 2 ? y - 240 : y + 240, dx: 30 });
    }
    readP([{ text: 'תפסו את האות', lang: 'he-IL' }, { text: ch, lang: 'en-US' }]);
  }
  function gotLetter(e) {
    game.wi++; addStars(1, e.x, e.y); snd('sparkle'); sayEn(e.ch);
    pop(e.x, e.y - 50, e.ch.toUpperCase(), '#8fe9ff', 54);
    if (game.wi >= game.word.en.length) { /* מילה שלמה! */
      var w = game.word; game.words++; game.stars += 10; game.coins += 2; if (window.Wallet) Wallet.add(2);
      pop(VW * .5, VH * .36, w.pic + ' ' + w.en.toUpperCase() + ' = ' + w.he, '#ffd95a', 58);
      /* סדר ברור: שבח → המילה באנגלית → הפירוש בעברית → שוב המילה לאט */
      readP([{ text: 'כל הכבוד! בנית את המילה', lang: 'he-IL' }, { text: w.en, lang: 'en-US' }, { text: 'בעברית: ' + w.he + '.', lang: 'he-IL' }, { text: w.en, lang: 'en-US', slow: true }]);
      snd('ding'); if (window.HeroRewards) HeroRewards.confetti(); game.flash = .3;
      game.word = null; spawnT.word = 6;
      checkMission();
    } else spawnT.letter = 1.2;
  }

  /* ---------- פרק 9 — בוס: בלגנון ---------- */
  function startBoss() {
    game.boss = { x: VW + 200, y: VH / 2, hp: 3, t: 0, throwT: 2, ringT: 1, hurt: 0, out: false };
    game.bossDone = true;
    ents = ents.filter(function (e) { return e.k === 'star' || e.k === 'letter' || e.k === 'cat'; });
    pop(VW * .5, VH * .3, 'בלגנון הגיע! 🦹', '#c77dff', 56); game.shake = .5; snd('sad');
    say('בלגנון הגיע! עופו דרך 3 טבעות זהב כדי לגרש אותו!');
  }
  function updateBoss(dt) {
    var b = game.boss; if (!b) return;
    b.t += dt; if (b.hurt > 0) b.hurt -= dt;
    if (b.out) { b.x += 700 * dt; b.y -= 200 * dt; if (b.x > VW + 300) game.boss = null; return; }
    b.x += ((VW - 230) - b.x) * Math.min(1, dt * 2);
    b.y = VH / 2 + Math.sin(b.t * 1.3) * 230;
    b.throwT -= dt; b.ringT -= dt;
    if (b.throwT <= 0) { /* זורק כדור דבק לעבר הגיבורה */
      b.throwT = 1.9 - (3 - b.hp) * .25;
      var dx = HX() - b.x, dy = game.hy - b.y, d = Math.hypot(dx, dy) || 1;
      ents.push({ k: 'blob', x: b.x - 60, y: b.y, vx: dx / d * 420, vy: dy / d * 420, r: 30, free: true });
      snd('pop');
    }
    if (b.ringT <= 0) { b.ringT = 2.4; ents.push({ k: 'gring', x: VW + 60, y: rndY(), r: 48 }); }
    if (b.t > 18) { b.out = true; pop(b.x - 100, b.y, 'אחזור! 😈', '#c77dff', 40); say('בלגנון ברח! נתפוס אותו בפעם הבאה'); }
  }
  function hitBoss(e) {
    var b = game.boss; if (!b || b.out) return;
    b.hp--; b.hurt = .5; game.shake = .35; snd('cha_ching'); pow(b.x, b.y, 'בום!'); sparks(b.x, b.y, '#ffd95a', 20);
    pop(e.x, e.y - 60, b.hp ? 'עוד ' + b.hp + '!' : '', '#ffd95a', 44);
    if (!b.hp) {
      b.out = true; game.bossWin = true; save.bossWins++;
      pop(VW * .5, VH * .32, 'קבוום! ניצחת את בלגנון!', '#ffd95a', 60); game.flash = .4;
      say('קבוום! ניצחת את בלגנון! ' + HERO_WORD); snd('ding'); if (window.HeroRewards) HeroRewards.confetti();
      spawn('shower'); game.stars += 15;
      ents = ents.filter(function (x) { return x.k !== 'blob'; });
    }
  }

  /* ---------- פרק 10 — לולאת משחק ---------- */
  var game = { on: false, paused: false, zone: 0, t: 0, dist: 0, hy: VH / 2, stars: 0, cats: 0, coins: 0, rings: 0, words: 0, combo: 0, bestCombo: 0,
    dizzy: 0, bubble: false, mission: null, done: false, power: null, act: {}, shieldP: false, slow: 0, trap: null, gust: null, shake: 0, flash: 0,
    word: null, wi: 0, boss: null, bossDone: false, bossWin: false };
  var last = 0, timeScale = 1;
  var $ = function (id) { return document.getElementById(id); };

  /* diff: קושי שעולה במהלך הסבב (עד +35%) */
  function diff() { return 1 + .35 * Math.min(1, game.t / ROUND); }
  function worldSpeed() {
    var z = ZONES[game.zone], p = game.power ? game.power.key : '';
    return 300 * z.speed * (1 + .15 * Math.min(1, game.t / ROUND)) * (p === 'fast' ? 1.25 : 1) * (game.act.rocket > 0 ? 1.6 : 1) * (game.slow > 0 ? .5 : 1);
  }
  function protectedNow() { return game.act.rocket > 0 || (game.power && game.power.key === 'shield'); }

  function checkMission() {
    var m = game.mission;
    if (m && !game.done && game[m.k] >= m.n) { game.done = true; snd('ding'); say('משימה הושלמה!'); pop(VW * .5, 140, 'משימה הושלמה! ✓', '#3ff2b0', 44); if (window.HeroRewards) HeroRewards.confetti(); }
  }

  /* hit(e, word): פגיעה ממכשול. הגנות קודם; אחרת סחרור, רעידה, איבוד קומבו ונפילת עד 3 כוכבים שאפשר לתפוס שוב */
  function hit(e, word) {
    if (protectedNow()) { sparks(e.x, e.y, '#29e0ff', 14); pop(e.x, e.y - 40, 'בינג!', '#8fe9ff', 34); return false; }
    if (game.shieldP) { game.shieldP = false; sparks(e.x, e.y, '#29e0ff', 18); pop(e.x, e.y - 40, 'המגן הציל!', '#8fe9ff', 36); snd('bubble'); return false; }
    if (game.power && game.power.key === 'bubble' && !game.bubble) { game.bubble = true; sparks(e.x, e.y, '#8fe9ff', 14); say('בועת הגנה!'); return false; }
    game.dizzy = 1.0; game.shake = .35; game.combo = 0; snd('sad');
    pop(HX() + 40, game.hy - 90, word || 'אאוץ׳!', '#ff6b6b', 38);
    var lose = Math.min(3, game.stars); game.stars -= lose;
    for (var i = 0; i < lose; i++) ents.push({ k: 'star', x: HX() + 260 + i * 90, y: Math.max(120, Math.min(VH - 120, game.hy + (i - 1) * 70)), r: 30, lost: true });
    return true;
  }
  /* בועה: הגיבורה לכוד ומרחף למעלה עד 5 הקשות (או 4 שניות) */
  function tapTrap() {
    var tr = game.trap; tr.taps++; snd('pop'); sparks(HX(), game.hy, '#bff3ff', 5);
    if (tr.taps >= 5) { game.trap = null; pop(HX() + 40, game.hy - 100, 'פופ! השתחררת!', '#8fe9ff', 40); addStars(2, HX(), game.hy); snd('happy'); }
  }

  function update(dt) {
    var p = game.power ? game.power.key : '', hx = HX(), d = diff();
    var speed = worldSpeed();
    game.t += dt; game.dist += speed * dt;
    /* טיימרים של מצבים */
    ['dizzy', 'slow', 'shake', 'flash'].forEach(function (k) { if (game[k] > 0) game[k] -= dt; });
    Object.keys(game.act).forEach(function (k) { if (game.act[k] > 0) game.act[k] -= dt; });
    /* תנועת הגיבורה: מתקרב לגובה היעד ברכות (בדבק לאט יותר); רוח דוחפת; בועה מרימה */
    if (game.trap) { game.trap.t -= dt; game.hy = Math.max(230, game.hy - 60 * dt); if (game.trap.t <= 0) { game.trap = null; pop(hx + 40, game.hy - 90, 'השתחררת!', '#8fe9ff', 34); } }
    else game.hy += (Math.max(170, Math.min(VH - 80, targetY)) - game.hy) * Math.min(1, dt * (game.slow > 0 ? 2.5 : 7));
    if (game.gust) { game.gust.t -= dt; if (!game.trap) { game.hy = Math.max(170, Math.min(VH - 80, game.hy + game.gust.dir * 230 * dt)); targetY += game.gust.dir * 120 * dt; } if (game.gust.t <= 0) game.gust = null; }

    /* יצירת ישויות לפי טיימרים; בזמן בוס רק כוכבים */
    Object.keys(spawnT).forEach(function (k) { spawnT[k] -= dt; });
    if (spawnT.stars <= 0) { spawn('stars'); spawnT.stars = 1.6 + Math.random(); }
    if (!game.boss) {
      if (spawnT.coin <= 0) { spawn('coin'); spawnT.coin = 9 + Math.random() * 6; }
      if (spawnT.cat <= 0) { spawn('cat'); spawnT.cat = 7 + Math.random() * 5; }
      if (spawnT.rings <= 0) { spawn('rings'); spawnT.rings = 11 + Math.random() * 5; }
      if (spawnT.pickup <= 0) { spawn('pickup'); spawnT.pickup = 12 + Math.random() * 6; }
      if (spawnT.hz <= 0) { var hz = ZONES[game.zone].hz; spawn(hz[(Math.random() * hz.length) | 0]); spawnT.hz = (3.2 + Math.random() * 2.4) / (ZONES[game.zone].speed * d); }
      if (!game.word && spawnT.word <= 0) newWord();
      if (game.word && spawnT.letter <= 0 && !ents.some(function (e) { return e.k === 'letter' && e.good; })) spawnLetter();
      if (!game.bossDone && game.t >= ROUND * .55) spawn('boss');
    }
    updateBoss(dt);

    var hy = game.hy, magnet = p === 'magnet' || game.act.magnet > 0;
    for (var i = ents.length - 1; i >= 0; i--) {
      var e = ents[i];
      /* תנועה לפי סוג */
      if (e.k === 'blob') { e.x += e.vx * dt; e.y += e.vy * dt; }
      else if (e.k === 'bolt') { e.x -= speed * dt; e.t -= dt; if (e.t < -.4) { ents.splice(i, 1); continue; } }
      else e.x -= speed * dt * (e.k === 'storm' ? 1.15 : e.k === 'bird' ? 1.45 : e.k === 'meteor' ? 1.5 : 1);
      if (e.k === 'bird') e.y = e.y0 + Math.sin(game.t * 5 + e.ph) * 45;
      if (e.k === 'meteor') e.y += e.vy * dt;
      if (e.vy && e.k === 'star') { e.y += e.vy * dt; if (e.y > 100) e.vy = Math.max(0, e.vy - 600 * dt); }
      /* מגנט: כוכבים, מטבעות ואותיות נכונות נמשכים לגיבורה */
      if (magnet && (e.k === 'star' || e.k === 'coin' || (e.k === 'letter' && e.good))) { var dx = hx - e.x, dy = hy - e.y, dd = Math.hypot(dx, dy); if (dd < 250 && dd > 1) { e.x += dx / dd * 560 * dt; e.y += dy / dd * 560 * dt; } }
      /* ברק: פוגע רק ברגע הפגיעה, רק בצד שלו (למעלה/למטה) */
      if (e.k === 'bolt') {
        if (e.t <= 0 && !e.struck) { e.struck = true; game.shake = .2; snd('chop'); }
        if (e.struck && !e.used && Math.abs(e.x - hx) < 60 && (e.top ? hy < e.cut + 40 : hy > e.cut - 40)) { e.used = true; hit(e, 'זזזט! ⚡'); }
        continue;
      }
      /* טבעת שהוחמצה שוברת את השרשרת */
      if (e.k === 'ring' && e.x < hx - 70 && !e.missed) { e.missed = true; if (game.chain.id === e.chain) game.chain = { id: 0, n: 0 }; }
      var hit_ = Math.hypot(hx - e.x, hy - e.y) < e.r + 50;
      if (hit_ && !game.trap) {
        var remove = true;
        switch (e.k) {
          case 'star': if (game.dizzy <= 0 || e.lost) { addStars(p === 'double' ? 2 : 1, e.x, e.y); snd('sparkle'); } break;
          case 'coin': game.coins++; if (window.Wallet) Wallet.add(1); sparks(e.x, e.y, '#ffc93c', 12); pow(e.x, e.y, '🪙'); snd('cha_ching'); combo(); break;
          case 'cat': game.cats += p === 'cats2' ? 2 : 1; fx.push({ x: e.x, y: e.y, vx: -60, vy: -260, life: 1.4, cat: true }); pow(e.x, e.y, 'הצלה!'); snd('happy'); say(['הצלת את החתול!', 'מיאו! תודה אלה!', HERO_WORD][game.cats % 3]); combo(); break;
          case 'ring': {
            if (e.missed) break;
            if (game.chain.id !== e.chain) game.chain = { id: e.chain, n: 0 };
            game.chain.n++; game.rings++; addStars(game.chain.n, e.x, e.y); snd('bubble');
            pop(e.x, e.y - 50, '×' + game.chain.n, '#ffd95a', 36 + game.chain.n * 4);
            if (game.chain.n === 5) { game.stars += 5; pop(VW * .5, 200, 'שרשרת מושלמת! +5', '#ffd95a', 48); snd('ding'); say('שרשרת מושלמת!'); game.chain = { id: 0, n: 0 }; }
            break; }
          case 'gring': sparks(e.x, e.y, '#ffd95a', 16); hitBoss(e); combo(); break;
          case 'pickup': {
            var P = PICKUPS[e.p]; pop(e.x, e.y - 50, P.ico + ' ' + P.say, '#fff', 40); say(P.say); snd('ding'); combo();
            if (e.p === 'shield') game.shieldP = true; else if (e.p === 'shower') spawn('shower'); else game.act[e.p] = P.dur;
            break; }
          case 'letter':
            if (game.word && e.good && e.ch === game.word.en[game.wi]) gotLetter(e);
            else { e.x += 90; e.bounced = true; remove = false; if (!e.nope) { e.nope = true; pop(e.x - 90, e.y - 50, 'לא האות הזאת', '#fff', 26); snd('pop'); } }
            break;
          case 'storm': if (!e.used) { e.used = true; hit(e, 'סערה! ⛈️'); } remove = false; break;
          case 'bird': case 'meteor': case 'blob':
            if (!e.used) { e.used = true; hit(e, e.k === 'bird' ? 'ציוץ! 🐦' : e.k === 'meteor' ? 'בום! ☄️' : 'איכס! 🟣'); } break;
          case 'goo': if (!protectedNow()) { game.slow = 1.8; game.combo = 0; pop(hx + 40, hy - 90, 'דביק! 🟣', '#c77dff', 38); snd('sad'); } break;
          case 'bubble':
            if (protectedNow() || game.shieldP) { if (game.shieldP) game.shieldP = false; sparks(e.x, e.y, '#bff3ff', 12); pop(e.x, e.y - 40, 'פופ!', '#bff3ff', 34); }
            else { game.trap = { taps: 0, t: 4 }; pop(hx + 40, hy - 110, 'לכוד! הקישו 5 פעמים!', '#bff3ff', 34); say('הקישו מהר כדי לצאת מהבועה!'); snd('bubble'); }
            break;
        }
        checkMission();
        if (remove) { ents.splice(i, 1); continue; }
      }
      if (e.x < -160 || e.y > VH + 120 || e.y < -900) ents.splice(i, 1);
    }
    for (i = fx.length - 1; i >= 0; i--) { var f = fx[i]; if (f.pop) f.y -= 40 * dt; else { f.x += f.vx * dt; f.y += f.vy * dt; } f.life -= dt; if (f.life <= 0) fx.splice(i, 1); }
    if (game.t >= ROUND) endRound();
  }

  /* ---------- פרק 11 — ציור ---------- */
  function draw(t) {
    var sx = game.shake > 0 ? (Math.random() - .5) * 18 : 0, sy = game.shake > 0 ? (Math.random() - .5) * 18 : 0;
    ctx.setTransform(scale, 0, 0, scale, sx * scale, sy * scale);
    drawBackground(t);
    /* רוח: פסי מהירות לבנים בכיוון הדחיפה */
    if (game.gust) {
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 4;
      for (var g = 0; g < 14; g++) { var gx = (g * 173 - t * 900) % (VW + 200); gx = gx < 0 ? gx + VW + 200 : gx; var gy = (g * 97 + t * game.gust.dir * 300) % VH; gy = gy < 0 ? gy + VH : gy;
        ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + 90, gy - game.gust.dir * 24); ctx.stroke(); }
    }
    /* ישויות */
    ents.forEach(function (e) {
      var by = Math.sin(t * 3 + (e.bob || 0)) * 6;
      switch (e.k) {
        case 'star': ctx.globalAlpha = e.lost ? .6 + .4 * Math.sin(t * 16) : 1; drawE('⭐', 52, e.x, e.y); ctx.globalAlpha = 1; break;
        case 'coin': ctx.save(); ctx.translate(e.x, e.y); ctx.scale(Math.abs(Math.cos(t * 4)) * .7 + .3, 1); drawE('🪙', 56, 0, 0); ctx.restore(); break;
        case 'cat': drawCloud(e.x - 50, e.y + 34 + by, .9, .95); drawE('🐱', 64, e.x, e.y - 8 + by); drawE('🆘', 26, e.x + 28, e.y - 50 + by); break;
        case 'storm': ctx.globalAlpha = e.used ? .4 : 1; drawE('⛈️', 110, e.x, e.y); ctx.globalAlpha = 1; break;
        case 'ring': case 'gring': {
          var gold = e.k === 'gring', lit = !e.missed && game.chain.id === e.chain;
          ctx.save(); ctx.translate(e.x, e.y); ctx.globalAlpha = e.missed ? .3 : 1;
          ctx.lineWidth = gold ? 14 : 10; ctx.strokeStyle = '#101e36'; ctx.beginPath(); ctx.ellipse(0, 0, gold ? 30 : 24, gold ? 58 : 48, 0, 0, 7); ctx.stroke();
          ctx.lineWidth = gold ? 8 : 6; ctx.strokeStyle = gold ? '#ffd95a' : lit ? '#ff5fd2' : '#8fe9ff'; ctx.stroke();
          if (gold) { ctx.globalAlpha = .25 + .2 * Math.sin(t * 8); ctx.fillStyle = '#ffd95a'; ctx.fill(); }
          ctx.restore(); ctx.globalAlpha = 1; break; }
        case 'pickup': {
          ctx.save(); ctx.translate(e.x, e.y + by);
          ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.arc(0, 0, 44 + Math.sin(t * 6) * 4, 0, 7); ctx.fill();
          ctx.strokeStyle = '#ffd95a'; ctx.lineWidth = 4; ctx.stroke(); drawE(PICKUPS[e.p].ico, 54, 0, 0); ctx.restore(); break; }
        case 'letter': {
          ctx.save(); ctx.translate(e.x, e.y + by);
          ctx.fillStyle = '#fffaf0'; ctx.strokeStyle = '#101e36'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 40, 0, 7); ctx.fill(); ctx.stroke();
          ctx.font = '900 54px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillStyle = e.good ? '#1b3c8f' : '#6a5d87'; ctx.fillText(e.ch.toUpperCase(), 0, 3); ctx.restore(); break; }
        case 'bird': ctx.save(); ctx.translate(e.x, e.y); ctx.scale(-1, 1); ctx.rotate(Math.sin(t * 14 + e.ph) * .15); drawE('🐦', 50, 0, 0); ctx.restore(); break;
        case 'meteor': ctx.save(); ctx.translate(e.x, e.y); drawE('☄️', 72, 0, 0); ctx.restore(); break;
        case 'goo': ctx.fillStyle = '#9b4dff'; ctx.globalAlpha = .85; ctx.beginPath(); ctx.ellipse(e.x, e.y, 50 + Math.sin(t * 5) * 4, 36, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1; drawE('👁️', 22, e.x - 14, e.y - 6); drawE('👁️', 22, e.x + 14, e.y - 6); break;
        case 'blob': ctx.fillStyle = '#9b4dff'; ctx.beginPath(); ctx.arc(e.x, e.y, 26, 0, 7); ctx.fill(); ctx.strokeStyle = '#101e36'; ctx.lineWidth = 4; ctx.stroke(); break;
        case 'bubble': ctx.save(); ctx.translate(e.x, e.y + by); ctx.strokeStyle = 'rgba(191,243,255,.95)'; ctx.fillStyle = 'rgba(191,243,255,.22)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, 44, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-14, -16, 8, 0, 7); ctx.fill(); ctx.restore(); break;
        case 'bolt': {
          var y0 = e.top ? 0 : e.cut, y1 = e.top ? e.cut : VH;
          if (!e.struck) { /* אזהרה: אזור מסומן מהבהב + ⚠️ */
            ctx.globalAlpha = .18 + .14 * Math.sin(t * 20); ctx.fillStyle = '#ffe45c'; ctx.fillRect(e.x - 55, y0, 110, y1 - y0); ctx.globalAlpha = 1;
            drawE('⚠️', 50, e.x, e.top ? 60 : VH - 60);
          } else { /* ברק זיגזג */
            ctx.strokeStyle = '#fff7a8'; ctx.lineWidth = 12; ctx.shadowColor = '#ffe45c'; ctx.shadowBlur = 24; ctx.beginPath(); ctx.moveTo(e.x, y0);
            for (var yy = y0; yy < y1; yy += 50) ctx.lineTo(e.x + (Math.random() - .5) * 50, yy + 50);
            ctx.stroke(); ctx.shadowBlur = 0;
          }
          break; }
      }
    });
    /* בוס */
    var b = game.boss;
    if (b) {
      ctx.save(); ctx.translate(b.x, b.y);
      if (b.out) ctx.rotate(t * 10);
      ctx.fillStyle = 'rgba(155,77,255,.35)'; ctx.beginPath(); ctx.arc(0, 0, 110 + Math.sin(t * 5) * 8, 0, 7); ctx.fill();
      ctx.globalAlpha = b.hurt > 0 && Math.sin(t * 50) > 0 ? .3 : 1; drawE('🦹', 150, 0, 0); ctx.globalAlpha = 1;
      if (!b.out) for (var h = 0; h < 3; h++) drawE(h < b.hp ? '💜' : '🖤', 28, -40 + h * 40, -110);
      ctx.restore();
    }
    /* אפקטים */
    fx.forEach(function (f) {
      if (f.cat) { drawE('😻', 60, f.x, f.y); drawE('🎈', 44, f.x, f.y - 70); }
      else if (f.pop) {
        var a = Math.min(1, f.life / .3), k = 1 + Math.max(0, (f.life - (f.max - .15)) / .15) * .5;
        ctx.save(); ctx.globalAlpha = a; ctx.translate(Math.min(VW - 200, Math.max(200, f.x)), f.y); ctx.scale(k, k);
        ctx.font = '900 ' + f.s + 'px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = /[֐-׿]/.test(f.text) ? 'rtl' : 'ltr';
        ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(6, f.s * .2); ctx.strokeStyle = '#101e36'; ctx.strokeText(f.text, 0, 0);
        ctx.fillStyle = f.c; ctx.fillText(f.text, 0, 0); ctx.restore();
      }
      else { ctx.globalAlpha = Math.max(0, f.life / .6); ctx.fillStyle = f.c; ctx.beginPath(); ctx.arc(f.x, f.y, 5, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
    });
    /* הגיבורה: נוטה קדימה ומתנדנד; מסתחרר אחרי פגיעה; להבת רקטה; בועה סביבו כשלכוד */
    var hx = HX(), hy = game.hy, tilt = (targetY - game.hy) * .0025;
    ctx.save(); ctx.translate(hx, hy + Math.sin(t * 4) * 5);
    if (game.act.rocket > 0) { drawE('🔥', 70, -100, 20); ctx.fillStyle = 'rgba(255,160,60,.25)'; ctx.beginPath(); ctx.arc(0, 0, 100, 0, 7); ctx.fill(); }
    ctx.rotate(game.dizzy > 0 ? game.dizzy * 9 : game.trap ? Math.sin(t * 3) * .2 : .35 + tilt);
    if (game.power && (game.power.key === 'shield' || (game.power.key === 'bubble' && !game.bubble)) || game.shieldP) { ctx.strokeStyle = 'rgba(143,233,255,.8)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, 86, 0, 7); ctx.stroke(); }
    if (game.slow > 0) { ctx.globalAlpha = .9; ctx.fillStyle = 'rgba(155,77,255,.35)'; ctx.beginPath(); ctx.arc(0, 30, 70, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
    if (heroReady) ctx.drawImage(heroImg, -72, -90, 144, 180); else drawE(HERO_EMOJI, 110, 0, 0);
    if (game.dizzy > 0) drawE('💫', 40, 0, -100);
    ctx.restore();
    if (game.trap) { ctx.strokeStyle = 'rgba(191,243,255,.95)'; ctx.fillStyle = 'rgba(191,243,255,.25)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(hx, hy, 110, 0, 7); ctx.fill(); ctx.stroke();
      for (var q = 0; q < 5; q++) { ctx.fillStyle = q < game.trap.taps ? '#3ff2b0' : 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(hx - 48 + q * 24, hy + 130, 9, 0, 7); ctx.fill(); } }
    /* הבזק לבן לרגעי שיא */
    if (game.flash > 0) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = 'rgba(255,255,255,' + Math.min(.45, game.flash) + ')'; ctx.fillRect(0, 0, cv.width, cv.height); }
    /* שובל נצנצים */
    if (game.on && !game.paused && Math.random() < .5) fx.push({ x: hx - 60, y: hy + 10 + (Math.random() - .5) * 30, vx: -200, vy: (Math.random() - .5) * 40, life: .5, c: ['#ffd95a', '#ff7ec2', '#8fe9ff'][(Math.random() * 3) | 0] });
  }

  function frame(now) {
    var dt = Math.min(.05, (now - last) / 1000 || 0) * timeScale; last = now;
    if (game.on && !game.paused) { update(dt); hud(); }
    draw(now / 1000);
    requestAnimationFrame(frame);
  }

  /* ---------- פרק 12 — HUD ---------- */
  function hud() {
    $('hStars').textContent = '⭐ ' + game.stars; $('hCats').textContent = '🐱 ' + game.cats; $('hCoins').textContent = '🪙 ' + game.coins;
    var m = game.mission, v = m ? game[m.k] : 0;
    $('hMission').textContent = m ? (game.done ? '✓ ' + m.t + ' — בונוס!' : m.t + ' (' + Math.min(v, m.n) + '/' + m.n + ')') : '';
    $('hMission').classList.toggle('done', game.done);
    $('timeFill').style.width = Math.max(0, 100 - game.t / ROUND * 100) + '%';
    /* מילה: האותיות שנאספו מודגשות, האות הבאה מהבהבת */
    var w = game.word, wh = '';
    if (w) { wh = w.pic + ' <bdi dir="ltr">'; for (var i = 0; i < w.en.length; i++) wh += i < game.wi ? '<b class="got">' + w.en[i].toUpperCase() + '</b>' : i === game.wi ? '<b class="next">' + w.en[i].toUpperCase() + '</b>' : '<b class="todo">_</b>'; wh += '</bdi>'; }
    setHTML('hWord', wh);
    setHTML('hCombo', game.combo >= 3 ? '🔥 ×' + game.combo : '');
    var a = [];
    if (game.act.magnet > 0) a.push('🧲 ' + Math.ceil(game.act.magnet)); if (game.act.rocket > 0) a.push('🚀 ' + Math.ceil(game.act.rocket));
    if (game.shieldP) a.push('🛡️'); if (game.slow > 0) a.push('🟣 דביק'); if (game.boss && !game.boss.out) a.push('🦹 ' + game.boss.hp);
    setHTML('hActive', a.join(' · '));
  }
  var hudCache = {};
  function setHTML(id, h) { if (hudCache[id] === h) return; hudCache[id] = h; var el = $(id); if (!el) return; el.innerHTML = h; el.style.display = h ? '' : 'none'; }

  /* ---------- פרק 13 — מסכים ---------- */
  var selZone = Math.min(save.zone || 0, save.open - 1);
  function renderZones() {
    var box = $('zones'); box.innerHTML = '';
    ZONES.forEach(function (z, i) {
      var b = document.createElement('button'); b.type = 'button';
      var locked = i >= save.open;
      b.className = 'zone' + (i === selZone ? ' sel' : '') + (locked ? ' locked' : '');
      b.style.background = 'linear-gradient(170deg,' + z.sky.join(',') + ')';
      b.innerHTML = (locked ? '<span class="lock">🔒</span>' : '') + '<span><span class="z-ico">' + z.ico + '</span><br>' + z.name + '</span>';
      b.addEventListener('click', function () { if (locked) { snd('sad'); say('מסיימים טיסה כדי לפתוח אזור חדש!'); return; } selZone = i; snd('bubble'); renderZones(); });
      box.appendChild(b);
    });
  }
  function startRound() {
    Object.assign(game, { on: true, paused: false, zone: selZone, t: 0, dist: 0, hy: VH / 2, stars: 0, cats: 0, coins: 0, rings: 0, words: 0, combo: 0, bestCombo: 0,
      dizzy: 0, bubble: false, done: false, act: {}, shieldP: false, slow: 0, trap: null, gust: null, shake: 0, flash: 0, word: null, wi: 0,
      boss: null, bossDone: false, bossWin: false, chain: { id: 0, n: 0 } });
    targetY = VH / 2;
    game.mission = MISSIONS[(Math.random() * MISSIONS.length) | 0];
    var aura = window.HeroRewards ? HeroRewards.outfit.aura : 'aura_none';
    game.power = POWERS[aura] || null;
    $('powerChip').innerHTML = game.power ? '<span class="chip">כוח-על: ' + game.power.name + '</span>' : '';
    ents = []; fx = []; spawnT = { stars: .3, coin: 5, cat: 4, rings: 3, pickup: 8, hz: 4, word: 5, letter: 99 };
    save.zone = selZone; persist();
    ['startScreen', 'endScreen', 'pauseScreen'].forEach(function (id) { $(id).classList.remove('show'); });
    try { Sound.unlock(); } catch (e) {}
    say('טסים! ' + game.mission.t.replace(/[^֐-׿0-9 ]/g, ''));
    hud();
  }
  function endRound() {
    game.on = false; game.trap = null; game.gust = null;
    if (game.done && window.Wallet) Wallet.add(3);
    var newZone = false;
    if (save.open < ZONES.length && selZone === save.open - 1) { save.open++; newZone = true; }
    var record = game.stars > save.best && game.stars > 0;
    save.best = Math.max(save.best, game.stars); save.cats += game.cats; save.words += game.words; save.bestCombo = Math.max(save.bestCombo, game.bestCombo); persist();
    /* משימת היום "הצילי חתולים" + מעקב התקדמות */
    try { if (window.Progress && game.cats) Progress.track('flight:cats', game.cats); } catch (e) {}
    /* ניקוד ומדליה */
    var score = game.stars + game.cats * 5 + game.coins * 3 + game.words * 10 + (game.bossWin ? 20 : 0);
    var medal = score >= 150 ? ['🏆', 'גביע הזהב!'] : score >= 100 ? ['🥇', 'מדליית זהב!'] : score >= 60 ? ['🥈', 'מדליית כסף!'] : ['🥉', 'מדליית ארד!'];
    $('rMedal').textContent = medal[0]; $('rMedalT').textContent = medal[1] + ' · ' + score + ' נקודות';
    $('rStars').textContent = game.stars; $('rCats').textContent = game.cats; $('rCoins').innerHTML = '<bdi dir="ltr">' + game.coins + (game.done ? ' +3' : '') + '</bdi>';
    $('rRings').textContent = game.rings; $('rWords').textContent = game.words; $('rCombo').textContent = game.bestCombo;
    $('endKicker').textContent = record ? 'שיא חדש! 🏆' : game.bossWin ? 'ניצחת את בלגנון! 🦹' : 'הטיסה הסתיימה!';
    $('endText').textContent = (game.done ? 'המשימה הושלמה — קיבלת 3 מטבעות בונוס! ' : '') + (newZone ? 'נפתח אזור חדש: ' + ZONES[save.open - 1].name + ' ' + ZONES[save.open - 1].ico : 'סה״כ חתולים שהצלת: ' + save.cats + ' 🐱 · מילים באנגלית: ' + save.words + ' 🔤');
    $('endScreen').classList.add('show');
    if (newZone) selZone = save.open - 1;
    renderZones();
    if (window.HeroRewards) HeroRewards.confetti();
    snd('ding'); say(medal[1] + (newZone ? ' נפתח אזור חדש!' : ' איזו טיסה!'));
  }

  $('goBtn').addEventListener('click', startRound);
  $('againBtn').addEventListener('click', startRound);
  $('zonesBtn').addEventListener('click', function () { $('endScreen').classList.remove('show'); $('startScreen').classList.add('show'); });
  $('pauseBtn').addEventListener('click', function () { if (!game.on) return; game.paused = true; $('pauseScreen').classList.add('show'); });
  $('resumeBtn').addEventListener('click', function () { game.paused = false; last = performance.now(); $('pauseScreen').classList.remove('show'); });
  $('quitBtn').addEventListener('click', function () { game.on = false; $('pauseScreen').classList.remove('show'); $('startScreen').classList.add('show'); });
  /* יציאה לרקע (אפליקציה אחרת) = השהיה אוטומטית */
  document.addEventListener('visibilitychange', function () { if (document.hidden && game.on) { game.paused = true; $('pauseScreen').classList.add('show'); } });

  $('heroPrev').innerHTML = window.HeroAvatar ? HeroAvatar.svg(window.HeroRewards ? HeroRewards.outfit : null) : HERO_EMOJI;
  game.chain = { id: 0, n: 0 };
  buildBackground(); renderZones(); hud();
  requestAnimationFrame(function (n) { last = n; frame(n); });

  /* כלי בדיקה (לא משפיעים על המשחק): האצת זמן, מצב, כיוון, יצירה וסיום */
  window.__flight = {
    speed: function (k) { timeScale = k; },
    state: function () { return { on: game.on, t: game.t, stars: game.stars, cats: game.cats, coins: game.coins, rings: game.rings, words: game.words, combo: game.combo, bestCombo: game.bestCombo, open: save.open, zone: game.zone, done: game.done, boss: !!game.boss, bossWin: game.bossWin, trap: !!game.trap, word: game.word && game.word.en, wi: game.wi }; },
    aim: function (y) { targetY = y; },
    ents: function () { return ents.map(function (e) { return { k: e.k, x: e.x, y: e.y, ch: e.ch, good: e.good }; }); },
    spawn: function (k, o) { spawn(k, o); },
    tap: function () { if (game.trap) tapTrap(); },
    end: function () { endRound(); }
  };
})();
