/* =====================================================================
   js/flight.js — טיסת גיבורה: אלה טסה בעיר, אוספת כוכבים ומצילה חתולים
   ---------------------------------------------------------------------
   פרק 1 — הגדרות: אזורים, משימות, כוחות-על, שמירה (ella-flight-v1)
   פרק 2 — קנבס ומידות: עולם וירטואלי בגובה 800, רוחב לפי יחס המסך
   פרק 3 — ספרייטים: אימוג'י מצוירים מראש לקנבס (מהיר), והגיבורה מ-HeroAvatar
   פרק 4 — רקע פרלקסה: כוכבים, בניינים רחוקים וקרובים (או עננים/חלל/קשת)
   פרק 5 — ישויות: כוכבים, מטבעות, חתולים על עננים, ענני סערה
   פרק 6 — שליטה: האצבע קובעת גובה יעד, אלה נעה אליו ברכות
   פרק 7 — לולאת משחק: עדכון, התנגשויות, ציור, HUD
   פרק 8 — מסכים: פתיחה ובחירת אזור, השהיה, תוצאות
   אין פסילה ואין Game Over — סערה רק מסחררת לרגע.
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- פרק 1 — הגדרות ---------- */
  var ROUND = 90;                        // אורך סבב בשניות
  var SAVE = 'ella-flight-v1';

  /* 5 אזורים: שמיים (גרדיאנט), סוג קרקע, צבעי בניינים, קצב */
  var ZONES = [
    { name: 'עיר בלילה',   ico: '🌃', sky: ['#1d0b4a', '#3a1177', '#6a1b8f'], ground: 'city', b1: '#2a1260', b2: '#3b1a6e', speed: 1.0 },
    { name: 'שקיעה',       ico: '🌇', sky: ['#3a1177', '#ff5d8f', '#ffb36b'], ground: 'city', b1: '#4a1c6e', b2: '#6a2474', speed: 1.1 },
    { name: 'מעל העננים',  ico: '☁️', sky: ['#5cc8ff', '#a9e4ff', '#fff3e0'], ground: 'clouds', speed: 1.2 },
    { name: 'חלל',         ico: '🪐', sky: ['#05021a', '#140a33', '#2a1260'], ground: 'space', speed: 1.3 },
    { name: 'ארץ הקשת',    ico: '🌈', sky: ['#ffd6ec', '#d9c2ff', '#b6f0ff'], ground: 'rainbow', speed: 1.4 }
  ];

  /* משימות קצרות — אחת בכל סבב, בונוס 3 מטבעות */
  var MISSIONS = [
    { t: 'אספי 25 כוכבים ⭐', k: 'stars', n: 25 }, { t: 'הצילי 3 חתולים 🐱', k: 'cats', n: 3 },
    { t: 'אספי 3 מטבעות 🪙', k: 'coins', n: 3 },   { t: 'אספי 40 כוכבים ⭐', k: 'stars', n: 40 },
    { t: 'הצילי 5 חתולים 🐱', k: 'cats', n: 5 }
  ];

  /* כוחות-על לפי הכוח שבחרה בארון התחפושות */
  var POWERS = {
    aura_sparkle: { name: 'כוכבים כפולים ✨', key: 'double' },
    aura_bolt:    { name: 'מגנט כוכבים ⚡', key: 'magnet' },
    aura_wings:   { name: 'כנפיים מהירות 🪽', key: 'fast' },
    aura_shield:  { name: 'מגן סערות 🛡️', key: 'shield' },
    aura_hearts:  { name: 'חתולים כפולים 💗', key: 'cats2' },
    aura_bubbles: { name: 'בועת הגנה 🫧', key: 'bubble' }
  };

  /* שמירה: כמה אזורים פתוחים + שיאים */
  function loadSave() { try { return Object.assign({ open: 1, best: 0, cats: 0, zone: 0 }, JSON.parse(localStorage.getItem(SAVE)) || {}); } catch (e) { return { open: 1, best: 0, cats: 0, zone: 0 }; } }
  var save = loadSave();
  function persist() { try { localStorage.setItem(SAVE, JSON.stringify(save)); } catch (e) {} }

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
  /* emoji(ch, size) — מצייר אימוג'י פעם אחת לקנבס קטן ומחזיר אותו (ציור מהיר בכל פריים) */
  var cache = {};
  function emoji(ch, size) {
    var k = ch + size; if (cache[k]) return cache[k];
    var c = document.createElement('canvas'); c.width = c.height = Math.ceil(size * 1.3);
    var x = c.getContext('2d'); x.font = size + 'px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(ch, c.width / 2, c.height / 2 + size * .05);
    return (cache[k] = c);
  }
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
  /* מצייר שכבה שחוזרת על עצמה בגלילה */
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

  /* ---------- פרק 5 — ישויות ---------- */
  var ents = [], fx = [];
  /* spawn — מוסיף ישות מימין למסך בגובה אקראי */
  function spawn(kind) {
    var y = 110 + Math.random() * (VH - 260);
    if (kind === 'stars') { /* שרשרת של 5 כוכבים בגל */
      for (var i = 0; i < 5; i++) ents.push({ k: 'star', x: VW + 60 + i * 70, y: y + Math.sin(i * .9) * 50, r: 30 });
      return;
    }
    ents.push({ k: kind, x: VW + 80, y: y, r: kind === 'storm' ? 58 : kind === 'cat' ? 46 : 32, bob: Math.random() * 6 });
  }
  var spawnT = { stars: 0, coin: 4, cat: 6, storm: 5 };

  /* ---------- פרק 6 — שליטה ---------- */
  var targetY = VH / 2;
  function pointerY(e) { return (e.clientY * dpr) / scale; }
  cv.addEventListener('pointerdown', function (e) { targetY = pointerY(e); try { Sound.unlock(); } catch (x) {} });
  cv.addEventListener('pointermove', function (e) { if (e.buttons || e.pointerType === 'touch') targetY = pointerY(e); });

  /* ---------- פרק 7 — לולאת משחק ---------- */
  var game = { on: false, paused: false, zone: 0, t: 0, dist: 0, hy: VH / 2, stars: 0, cats: 0, coins: 0, dizzy: 0, bubble: false, mission: null, done: false, power: null };
  var last = 0, timeScale = 1;
  var $ = function (id) { return document.getElementById(id); };

  function hud() {
    $('hStars').textContent = '⭐ ' + game.stars; $('hCats').textContent = '🐱 ' + game.cats; $('hCoins').textContent = '🪙 ' + game.coins;
    var m = game.mission, v = m ? game[m.k] : 0;
    $('hMission').textContent = m ? (game.done ? '✓ ' + m.t + ' — בונוס!' : m.t + ' (' + Math.min(v, m.n) + '/' + m.n + ')') : '';
    $('hMission').classList.toggle('done', game.done);
    $('timeFill').style.width = Math.max(0, 100 - game.t / ROUND * 100) + '%';
  }
  function checkMission() {
    var m = game.mission;
    if (m && !game.done && game[m.k] >= m.n) { game.done = true; try { Sound.ding(); Voice.say('משימה הושלמה!'); } catch (e) {} if (window.HeroRewards) HeroRewards.confetti(); }
  }
  /* פיצוץ POW במיקום עולם → מסך */
  function pow(x, y, w) {
    if (!window.HeroRewards) return;
    var px = x * scale / dpr, py = y * scale / dpr;
    HeroRewards.pow({ getBoundingClientRect: function () { return { left: px, top: py, width: 0, height: 0 }; } }, w);
  }
  /* חלקיקי ניצוץ קטנים */
  function sparks(x, y, color, n) { for (var i = 0; i < n; i++) { var a = Math.random() * 7, s = 80 + Math.random() * 220; fx.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: .6, c: color }); } }

  function update(dt) {
    var z = ZONES[game.zone], p = game.power ? game.power.key : '';
    var speed = 300 * z.speed * (p === 'fast' ? 1.25 : 1);
    game.t += dt; game.dist += speed * dt;
    /* תנועת הגיבורה: מתקרבת לגובה היעד ברכות */
    game.hy += (Math.max(80, Math.min(VH - 80, targetY)) - game.hy) * Math.min(1, dt * 7);
    if (game.dizzy > 0) game.dizzy -= dt;
    /* יצירת ישויות לפי טיימרים */
    spawnT.stars -= dt; spawnT.coin -= dt; spawnT.cat -= dt; spawnT.storm -= dt;
    if (spawnT.stars <= 0) { spawn('stars'); spawnT.stars = 1.6 + Math.random(); }
    if (spawnT.coin <= 0) { spawn('coin'); spawnT.coin = 9 + Math.random() * 6; }
    if (spawnT.cat <= 0) { spawn('cat'); spawnT.cat = 7 + Math.random() * 5; }
    if (spawnT.storm <= 0) { spawn('storm'); spawnT.storm = (4.5 + Math.random() * 3) / z.speed; }
    var hx = VW * .22, hy = game.hy;
    for (var i = ents.length - 1; i >= 0; i--) {
      var e = ents[i];
      e.x -= speed * dt * (e.k === 'storm' ? 1.15 : 1);
      /* מגנט: כוכבים ומטבעות קרובים נמשכים לגיבורה */
      if (p === 'magnet' && (e.k === 'star' || e.k === 'coin')) { var dx = hx - e.x, dy = hy - e.y, d = Math.hypot(dx, dy); if (d < 230) { e.x += dx / d * 520 * dt; e.y += dy / d * 520 * dt; } }
      var hit = Math.hypot(hx - e.x, hy - e.y) < e.r + 52;
      if (hit) {
        if (e.k === 'star') { if (game.dizzy <= 0) { game.stars += p === 'double' ? 2 : 1; sparks(e.x, e.y, '#ffd95a', 6); try { Sound.sparkle(); } catch (x) {} } ents.splice(i, 1); }
        else if (e.k === 'coin') { game.coins++; if (window.Wallet) Wallet.add(1); sparks(e.x, e.y, '#ffc93c', 12); pow(e.x, e.y, '🪙'); try { Sound.cha_ching(); } catch (x) {} ents.splice(i, 1); }
        else if (e.k === 'cat') { game.cats += p === 'cats2' ? 2 : 1; fx.push({ x: e.x, y: e.y, vx: -60, vy: -260, life: 1.4, cat: true }); pow(e.x, e.y, 'הצלה!'); try { Sound.happy(); Voice.say(['הצלת את החתול!', 'מיאו! תודה אלה!', 'גיבורה אמיתית!'][game.cats % 3]); } catch (x) {} ents.splice(i, 1); }
        else if (e.k === 'storm' && !e.used) {
          e.used = true;
          if (p === 'shield') { sparks(e.x, e.y, '#29e0ff', 14); }
          else if (p === 'bubble' && !game.bubble) { game.bubble = true; sparks(e.x, e.y, '#8fe9ff', 14); try { Voice.say('בועת הגנה!'); } catch (x) {} }
          else { game.dizzy = 1.2; try { Sound.sad(); } catch (x) {} }
        }
        checkMission();
        continue;
      }
      if (e.x < -140) ents.splice(i, 1);
    }
    for (i = fx.length - 1; i >= 0; i--) { var f = fx[i]; f.x += f.vx * dt; f.y += f.vy * dt; f.life -= dt; if (f.life <= 0) fx.splice(i, 1); }
    if (game.t >= ROUND) endRound();
  }

  function draw(t) {
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    drawBackground(t);
    /* ישויות */
    ents.forEach(function (e) {
      if (e.k === 'star') ctx.drawImage(emoji('⭐', 52), e.x - 34, e.y - 34);
      else if (e.k === 'coin') { ctx.save(); ctx.translate(e.x, e.y); ctx.scale(Math.abs(Math.cos(t * 4)) * .7 + .3, 1); ctx.drawImage(emoji('🪙', 56), -36, -36); ctx.restore(); }
      else if (e.k === 'cat') { var by = Math.sin(t * 3 + e.bob) * 6; drawCloud(e.x - 50, e.y + 34 + by, .9, .95); ctx.drawImage(emoji('🐱', 64), e.x - 42, e.y - 46 + by); ctx.drawImage(emoji('🆘', 26), e.x + 14, e.y - 64 + by); }
      else if (e.k === 'storm') { ctx.globalAlpha = e.used ? .4 : 1; ctx.drawImage(emoji('⛈️', 110), e.x - 72, e.y - 72); ctx.globalAlpha = 1; }
    });
    /* אפקטים */
    fx.forEach(function (f) {
      if (f.cat) { ctx.drawImage(emoji('😻', 60), f.x - 40, f.y - 40); ctx.drawImage(emoji('🎈', 44), f.x - 26, f.y - 96); }
      else { ctx.globalAlpha = Math.max(0, f.life / .6); ctx.fillStyle = f.c; ctx.beginPath(); ctx.arc(f.x, f.y, 5, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
    });
    /* הגיבורה: נטויה קדימה, מתנדנדת; מסתחררת אחרי סערה */
    var hx = VW * .22, hy = game.hy, tilt = (targetY - game.hy) * .0025;
    ctx.save(); ctx.translate(hx, hy + Math.sin(t * 4) * 5);
    ctx.rotate(game.dizzy > 0 ? game.dizzy * 9 : .35 + tilt);
    if (game.power && (game.power.key === 'shield' || (game.power.key === 'bubble' && !game.bubble))) { ctx.strokeStyle = 'rgba(143,233,255,.8)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, 86, 0, 7); ctx.stroke(); }
    if (heroReady) ctx.drawImage(heroImg, -72, -90, 144, 180); else ctx.drawImage(emoji('🦸‍♀️', 110), -70, -70);
    ctx.restore();
    /* שובל נצנצים */
    if (Math.random() < .5) fx.push({ x: hx - 60, y: hy + 10 + (Math.random() - .5) * 30, vx: -200, vy: (Math.random() - .5) * 40, life: .5, c: ['#ffd95a', '#ff7ec2', '#8fe9ff'][(Math.random() * 3) | 0] });
  }

  function frame(now) {
    var dt = Math.min(.05, (now - last) / 1000 || 0) * timeScale; last = now;
    if (game.on && !game.paused) { update(dt); hud(); }
    draw(now / 1000);
    requestAnimationFrame(frame);
  }

  /* ---------- פרק 8 — מסכים ---------- */
  var selZone = Math.min(save.zone || 0, save.open - 1);
  function renderZones() {
    var box = $('zones'); box.innerHTML = '';
    ZONES.forEach(function (z, i) {
      var b = document.createElement('button'); b.type = 'button';
      var locked = i >= save.open;
      b.className = 'zone' + (i === selZone ? ' sel' : '') + (locked ? ' locked' : '');
      b.style.background = 'linear-gradient(170deg,' + z.sky.join(',') + ')';
      b.innerHTML = (locked ? '<span class="lock">🔒</span>' : '') + '<span><span class="z-ico">' + z.ico + '</span><br>' + z.name + '</span>';
      b.addEventListener('click', function () { if (locked) { try { Sound.sad(); Voice.say('מסיימים טיסה כדי לפתוח אזור חדש!'); } catch (e) {} return; } selZone = i; try { Sound.bubble(); } catch (e) {} renderZones(); });
      box.appendChild(b);
    });
  }
  function startRound() {
    game.on = true; game.paused = false; game.zone = selZone; game.t = 0; game.dist = 0; game.hy = targetY = VH / 2;
    game.stars = game.cats = game.coins = 0; game.dizzy = 0; game.bubble = false; game.done = false;
    game.mission = MISSIONS[(Math.random() * MISSIONS.length) | 0];
    var aura = window.HeroRewards ? HeroRewards.outfit.aura : 'aura_none';
    game.power = POWERS[aura] || null;
    $('powerChip').innerHTML = game.power ? '<span class="chip">כוח-על: ' + game.power.name + '</span>' : '';
    ents = []; fx = []; spawnT = { stars: .3, coin: 5, cat: 4, storm: 5 };
    save.zone = selZone; persist();
    ['startScreen', 'endScreen', 'pauseScreen'].forEach(function (id) { $(id).classList.remove('show'); });
    try { Sound.unlock(); Voice.say('טסים! ' + game.mission.t.replace(/[^֐-׿0-9 ]/g, '')); } catch (e) {}
    hud();
  }
  function endRound() {
    game.on = false;
    if (game.done && window.Wallet) Wallet.add(3);
    var newZone = false;
    if (save.open < ZONES.length && selZone === save.open - 1) { save.open++; newZone = true; }
    save.best = Math.max(save.best, game.stars); save.cats += game.cats; persist();
    /* משימת היום "הצילי חתולים" + מעקב התקדמות */
    try { if (window.Progress && game.cats) Progress.track('flight:cats', game.cats); } catch (e) {}
    $('rStars').textContent = game.stars; $('rCats').textContent = game.cats; $('rCoins').innerHTML = '<bdi dir="ltr">' + game.coins + (game.done ? ' +3' : '') + '</bdi>';
    $('endKicker').textContent = game.stars >= save.best && game.stars > 0 ? 'שיא חדש! 🏆' : 'הטיסה הסתיימה!';
    $('endText').textContent = (game.done ? 'המשימה הושלמה — קיבלת 3 מטבעות בונוס! ' : '') + (newZone ? 'נפתח אזור חדש: ' + ZONES[save.open - 1].name + ' ' + ZONES[save.open - 1].ico : 'סה״כ חתולים שהצלת: ' + save.cats + ' 🐱');
    $('endScreen').classList.add('show');
    if (newZone) selZone = save.open - 1;
    renderZones();
    if (window.HeroRewards) HeroRewards.confetti();
    try { Sound.ding(); Voice.say(newZone ? 'כל הכבוד! נפתח אזור חדש!' : 'איזו טיסה!'); } catch (e) {}
  }

  $('goBtn').addEventListener('click', startRound);
  $('againBtn').addEventListener('click', startRound);
  $('zonesBtn').addEventListener('click', function () { $('endScreen').classList.remove('show'); $('startScreen').classList.add('show'); });
  $('pauseBtn').addEventListener('click', function () { if (!game.on) return; game.paused = true; $('pauseScreen').classList.add('show'); });
  $('resumeBtn').addEventListener('click', function () { game.paused = false; last = performance.now(); $('pauseScreen').classList.remove('show'); });
  $('quitBtn').addEventListener('click', function () { game.on = false; $('pauseScreen').classList.remove('show'); $('startScreen').classList.add('show'); });
  /* יציאה לרקע (אפליקציה אחרת) = השהיה אוטומטית */
  document.addEventListener('visibilitychange', function () { if (document.hidden && game.on) { game.paused = true; $('pauseScreen').classList.add('show'); } });

  $('heroPrev').innerHTML = window.HeroAvatar ? HeroAvatar.svg(window.HeroRewards ? HeroRewards.outfit : null) : '🦸‍♀️';
  buildBackground(); renderZones(); hud();
  requestAnimationFrame(function (n) { last = n; frame(n); });

  /* כלי בדיקה (לא משפיע על המשחק): האצת זמן ומצב */
  window.__flight = { speed: function (k) { timeScale = k; }, state: function () { return { on: game.on, t: game.t, stars: game.stars, cats: game.cats, coins: game.coins, open: save.open, zone: game.zone, done: game.done }; }, aim: function (y) { targetY = y; }, ents: function () { return ents.map(function (e) { return { k: e.k, x: e.x, y: e.y }; }); } };
})();
