/* =====================================================================
   js/ride.js — רכיבה על סוסים: משחק במבט הרוכב/ת (POV) + פינת טיפולים בחווה
   ---------------------------------------------------------------------
   פרק 1  — הגדרות ושמירה (הסוס והשיאים נשמרים ב-Horse — js/horse.js)
   פרק 2  — קנבס ומנוע "דרך לעומק" (pseudo-3D): מקטעים, עיקולים, גבעות, הטלה למסך
   פרק 3  — בניית מסלול: מכשולים (גדר/בול עץ/שלולית = קופצים; חציר/סלע/שיח = עוקפים), פירות, מטבעות,
            כוכבים, קשתות טריקים, ושערי למידה — לפי המסלול וזרע קבוע (בתחרות השבועית — אותו מסלול לכולם באותו שבוע)
   פרק 4  — ספרייטים: אימוג'י מצוירים מראש לקנבס (מהיר באייפד)
   פרק 5  — שליטה: גרירה ימינה/שמאלה = פנייה, החלקה למעלה = קפיצה, למטה = האטה; הטיה (אופציונלי); מקלדת; כפתורי טריקים
   פרק 6  — טריקים וקומבו: קפיצה, סיבוב באוויר, עמידה על שתיים, קשת פרחים/לאסו, כוכב נופל; קשת טריקים = ×2
   פרק 7  — שערי למידה: 3 קשתות — צבע באנגלית / "Where is the apple?" / חשבון. נכון = ⭐3, טעות = הסבר עדין
   פרק 8  — קול וצלילים: קליפ-קלופ של פרסות (WebAudio), צהלה, קול מוקלט באנגלית (Voice)
   פרק 9  — לולאת משחק: תנועה, קפיצה, התנגשויות (בלי פסילה — רק מעידה והאטה), זמן
   פרק 10 — ציור: שמיים, גבעות, דרך, ספרייטים, מכשולים, והסוס במבט הרוכב/ת (אוזניים, רעמה, מושכות, ידיים)
   פרק 11 — HUD ומסכים: פתיחה ובחירת מסלול, השהיה, תוצאות ומדליה, תחרות שבועית ותעודה
   פרק 12 — החווה: צרכים, מברשת, מקלחת, אוכל, פרסות, צמות, סוכר, מנוחה, ארון עיצוב ושם
   תלויות: js/horse.js, js/ride-data.js, js/audio.js (Voice, Sound), shared/kids-ui.js, hero-rewards, wallet, progress, share
   ===================================================================== */
(function () {
  'use strict';
  var BOY = !!window.RIDE_BOY, D = window.RideData, HS = window.Horse;
  var ROUND = 75;                                          // שניות לסבב
  var RIDER = BOY ? 'רוכב' : 'רוכבת';

  /* ================= פרק 1 — עזרים ================= */
  function $(id) { return document.getElementById(id); }
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function say(t) { try { Voice.say(t, { interrupt: true }); } catch (e) {} }
  function sayEn(t) { try { Voice.en(t); } catch (e) {} }
  function teach(en, he) { try { Voice.teach(en, he); } catch (e) { say(he); } }
  function snd(n) { try { if (window.Sound && Sound[n]) Sound[n](); } catch (e) {} }
  function tap(p) { try { KidsUI.KidsAudio.tap(p); } catch (e) {} }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function weekId() { var d = new Date(), j = new Date(d.getFullYear(), 0, 1); return d.getFullYear() + '-' + Math.ceil(((d - j) / 864e5 + j.getDay() + 1) / 7); }
  function grade() { try { var p = Profile.active; return p && p.grade === 'big' ? 'big' : 'young'; } catch (e) { return 'young'; } }

  /* ================= פרק 2 — קנבס ומנוע ================= */
  var cv = $('rideCv'), ctx = cv.getContext('2d'), W = 0, H = 0, DPR = 1;
  var SEG = 200, RUMBLE = 3, ROAD_W = 2000, CAM_H = 1000, FOV = 100, DEPTH = 1 / Math.tan(FOV / 2 * Math.PI / 180), DRAW = 150;
  var PZ = CAM_H * DEPTH;                                  // המרחק של "הרוכבת" מהמצלמה
  var LANES = [-0.62, 0, 0.62];
  function resize() { DPR = Math.min(window.devicePixelRatio || 1, 1.5); W = innerWidth; H = innerHeight; cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); cv.style.width = W + 'px'; cv.style.height = H + 'px'; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); }
  window.addEventListener('resize', resize);
  var segs = [], LEN = 0;
  function project(p, cx, cy, cz) {
    var x = -cx, y = p.y - cy, z = p.z - cz; if (z < 1) z = 1;
    p.s = DEPTH / z; p.X = W / 2 + p.s * x * W / 2; p.Y = H / 2 - p.s * y * H / 2; p.Wd = p.s * ROAD_W * W / 2;
  }

  /* ================= פרק 3 — בניית מסלול ================= */
  var T = null, G = null;   // T = מסלול נוכחי, G = מצב סבב
  function build(track, seed) {
    var R = rng(seed), n = 2600; segs = [];
    for (var i = 0; i < n; i++) {
      var c = Math.sin(i / 90) * 2.2 * track.curve + Math.sin(i / 37 + 1) * 1.2 * track.curve;
      if (i < 60) c = 0;
      var y = Math.sin(i / 55) * 900 * track.hills + Math.sin(i / 23) * 250 * track.hills;
      segs.push({ i: i, curve: c, p1: { y: 0, z: i * SEG }, p2: { y: 0, z: (i + 1) * SEG }, dark: ((i / RUMBLE) | 0) % 2, side: [], ents: [], _y: y });
    }
    for (i = 0; i < n; i++) { segs[i].p1.y = segs[i]._y; segs[i].p2.y = segs[(i + 1) % n]._y; }
    LEN = n * SEG;
    /* נוף בצדי הדרך */
    for (i = 12; i < n; i += 3) { if (R() < .75) segs[i].side.push({ e: track.side[(R() * track.side.length) | 0], off: (R() < .5 ? -1 : 1) * (1.35 + R() * 1.4), sz: 500 + R() * 500 }); }
    /* אירועים: כל ~22 מקטעים. שער למידה כל ~420 מקטעים */
    var tricksOn = D.TRICKS.filter(function (t) { return t[5] <= HS.state.tracks - 1; }).length > 1;
    for (i = 80; i < n - 40; i += 18 + ((R() * 14) | 0)) {
      if (i % 420 < 30 && i > 200) { gate(i, R); i += 40; continue; }
      var r = R();
      if (r < .34) { var o = track.obs[(R() * track.obs.length) | 0]; segs[i].ents.push({ k: o, lane: /hay|rock|bush|cactus/.test(o) ? (R() * 3) | 0 : -1 }); }
      else if (r < .72) { var lane = (R() * 3) | 0, kind = R() < .45 ? '⭐' : R() < .6 ? (R() < .5 ? '🍎' : '🥕') : '🪙'; for (var k = 0; k < 5; k++) segs[i + k * 2].ents.push({ k: 'item', e: kind, lane: lane }); }
      else if (r < .84 && tricksOn) segs[i].ents.push({ k: 'arch', lane: -1 });
      else { var l2 = (R() * 3) | 0; segs[i].ents.push({ k: 'item', e: '🌸', lane: l2 }); segs[i + 3].ents.push({ k: 'item', e: '⭐', lane: (l2 + 1) % 3 }); }
    }
    if (track.contest) for (i = 120; i < n - 40; i += 60) if (!segs[i].ents.length) segs[i].ents.push({ k: 'fence', lane: -1 });
  }
  /* gate — שער למידה: 3 קשתות בנתיבים. השאלה מוקראת 60 מקטעים לפני */
  function gate(i, R) {
    var type = ['color', 'item', 'math'][(R() * 3) | 0], opts = [], ans = (R() * 3) | 0, q;
    if (type === 'color') { var cs = D.COLORS.slice().sort(function () { return R() - .5; }).slice(0, 3); cs.forEach(function (c) { opts.push({ col: c[1], label: '' }); }); q = { type: type, en: D.colorLine(cs[ans][0]), word: cs[ans][0], he: 'רוכבים לשער ה' + cs[ans][2] + '!', heAns: cs[ans][2] }; }
    else if (type === 'item') { var it = D.ITEMS.slice().sort(function () { return R() - .5; }).slice(0, 3); it.forEach(function (x) { opts.push({ col: '#ffffff', label: x[1] }); }); q = { type: type, en: D.itemLine(it[ans][0]), word: it[ans][0], he: 'איפה ה' + it[ans][2] + '?', heAns: it[ans][2] }; }
    else {
      var big = grade() === 'big', a = 1 + ((R() * (big ? 12 : 5)) | 0), b = 1 + ((R() * (big ? 8 : 4)) | 0), minus = big && R() < .4 && a > b, v = minus ? a - b : a + b, set = [v];
      while (set.length < 3) { var w = Math.max(0, v + ((R() * 7) | 0) - 3); if (set.indexOf(w) < 0) set.push(w); }
      set.sort(function () { return R() - .5; }); ans = set.indexOf(v);
      set.forEach(function (x) { opts.push({ col: '#fff3b0', label: String(x) }); });
      q = { type: type, he: a + (minus ? ' פחות ' : ' ועוד ') + b + ' — כמה זה?', show: a + (minus ? ' − ' : ' + ') + b + ' = ?', heAns: String(v) };
    }
    segs[i].ents.push({ k: 'gate', lane: -1, opts: opts, ans: ans, q: q });
    segs[Math.max(0, i - 60)].ents.push({ k: 'ask', q: q, lane: -1 });
  }

  /* ================= פרק 4 — ספרייטים ================= */
  var SPR = {};
  function spr(e) {
    if (SPR[e]) return SPR[e];
    var c = document.createElement('canvas'); c.width = c.height = 128; var x = c.getContext('2d');
    x.font = '104px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e, 64, 72);
    return (SPR[e] = c);
  }

  /* ================= פרק 5 — שליטה ================= */
  var input = { dragX: null, startX: 0, startY: 0, t0: 0, baseX: 0, keys: {}, tilt: null };
  cv.addEventListener('pointerdown', function (e) { if (!G || !G.run) return; input.dragX = e.clientX; input.startX = e.clientX; input.startY = e.clientY; input.t0 = performance.now(); input.baseX = G.tx; });
  window.addEventListener('pointermove', function (e) { if (input.dragX == null || !G) return; G.tx = Math.max(-1, Math.min(1, input.baseX + (e.clientX - input.startX) / (W * .32))); });
  window.addEventListener('pointerup', function (e) {
    if (input.dragX == null || !G) return;
    var dy = e.clientY - input.startY, dx = e.clientX - input.startX, dt = performance.now() - input.t0; input.dragX = null;
    if (dt < 450 && dy < -60 && Math.abs(dy) > Math.abs(dx)) doTrick('jump');
    else if (dt < 450 && dy > 60 && Math.abs(dy) > Math.abs(dx)) { G.slow = 1.2; sayEn('Whoa!'); }
    else if (dt < 220 && Math.abs(dx) < 12 && Math.abs(dy) < 12) { var lane = e.clientX < W / 2 ? -1 : 1; G.tx = Math.max(-1, Math.min(1, laneOf(G.tx) + lane)) * LANES[2] / 1; }
  });
  function laneOf(x) { return x < -.31 ? -1 : x > .31 ? 1 : 0; }
  window.addEventListener('keydown', function (e) {
    if (!G || !G.run) return;
    if (e.key === 'ArrowLeft') G.tx = Math.max(-1, G.tx - .62); if (e.key === 'ArrowRight') G.tx = Math.min(1, G.tx + .62);
    if (e.key === 'ArrowUp' || e.key === ' ') doTrick('jump'); if (e.key === 'ArrowDown') G.slow = 1.2;
    var k = { '1': 'spin', '2': 'rear', '3': D.TRICKS[3][0], '4': 'star' }[e.key]; if (k) doTrick(k);
  });
  /* ---------- 5.1 לוח חיצים (שלב 16) ----------
     ⬅️/➡️: הקשה = מעבר נתיב; החזקה = פנייה רציפה (G.tx זוחל לקצה בקצב PAD_RATE). ⬆️ = קפיצה. ⬇️ = האטה.
     ההעדפה (דלוק/כבוי) נשמרת במכשיר: <pfx>-ride-pad. הלוח מוצג רק בזמן רכיבה (hud()). */
  var PAD_KEY = (BOY ? 'eitan' : 'ella') + '-ride-pad', padOn = false, padHeld = {};
  try { padOn = localStorage.getItem(PAD_KEY) === '1'; } catch (e) {}
  var PAD_RATE = 2.4;                                  // כמה מהר הסוס פונה כשמחזיקים חץ (יחידות נתיב לשנייה)
  function padStep(dt) { if (!padOn || !G || !G.run) return; var dir = (padHeld.right ? 1 : 0) - (padHeld.left ? 1 : 0); if (dir) G.tx = Math.max(-1, Math.min(1, G.tx + dir * PAD_RATE * dt)); }
  function padPress(k) {
    if (!G || !G.run) return;
    if (k === 'up') doTrick('jump');
    else if (k === 'down') { G.slow = 1.2; sayEn('Whoa!'); }
    else { var dir = k === 'right' ? 1 : -1; padHeld[k] = { t: performance.now() }; G.tx = Math.max(-1, Math.min(1, laneOf(G.tx) + dir)) * LANES[2]; }
    tap(k === 'up' ? 820 : 600);
  }
  function padRelease(k) { delete padHeld[k]; }
  function setPad(on) { padOn = !!on; try { localStorage.setItem(PAD_KEY, padOn ? '1' : '0'); } catch (e) {} $('padBtn').classList.toggle('on', padOn); $('pad').classList.toggle('show', padOn && !!(G && G.run)); padBtn2(); }
  function bindPad() {
    document.querySelectorAll('#pad .pk').forEach(function (b) {
      var k = b.dataset.k;
      b.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); try { b.setPointerCapture(e.pointerId); } catch (x) {} b.classList.add('on'); padPress(k); });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) { b.addEventListener(ev, function () { b.classList.remove('on'); padRelease(k); }); });
    });
    $('padBtn').addEventListener('click', function () { setPad(!padOn); say(padOn ? 'לוח חיצים: שמאלה, ימינה, למעלה קופצים, למטה מאטים' : 'לוח החיצים כבוי — גוררים על המסך'); });
    $('padBtn').classList.toggle('on', padOn); padBtn2();
    $('padBtn2').addEventListener('click', function () { setPad(!padOn); padBtn2(); tap(); say(padOn ? 'לוח חיצים דלוק! ⬅️ ➡️ פונים, ⬆️ קופצים, ⬇️ מאטים' : 'לוח החיצים כבוי'); });
  }
  /* padBtn2 — הכפתור במסך הפתיחה: מראה אם הלוח דלוק */
  function padBtn2() { var b = $('padBtn2'); if (!b) return; b.textContent = padOn ? '🎮 חיצים: דלוק ✔' : '🎮 חיצים'; b.setAttribute('aria-pressed', padOn ? 'true' : 'false'); b.className = 'h-btn ' + (padOn ? 'gold' : 'violet'); }
  /* הטיה: באייפד צריך אישור (לחיצה על הכפתור 📱) */
  function enableTilt() {
    function on() { window.addEventListener('deviceorientation', function (e) { if (e.gamma == null) return; var ang = Math.abs(window.orientation) === 90 ? (window.orientation > 0 ? e.beta : -e.beta) : e.gamma; input.tilt = Math.max(-1, Math.min(1, ang / 22)); }); say('מטים את האייפד כדי לפנות'); }
    try { if (window.DeviceOrientationEvent && DeviceOrientationEvent.requestPermission) DeviceOrientationEvent.requestPermission().then(function (s) { if (s === 'granted') on(); }).catch(function () {}); else on(); } catch (e) {}
  }

  /* ================= פרק 6 — טריקים וקומבו ================= */
  function doTrick(id) {
    if (!G || !G.run) return;
    var t = D.TRICKS.filter(function (x) { return x[0] === id; })[0]; if (!t) return;
    if (t[5] > HS.state.tracks - 1) { say('הטריק הזה נפתח בהמשך — ממשיכים לרכוב!'); return; }
    var air = G.jz > 20;
    if (id === 'jump') { if (air || G.rear > 0) return; G.vz = 1500; G.jumps++; neigh(.4); sayEn('Jump!'); return; }
    if (t[4] === 'air' && !air) { doTrick('jump'); G.queue = id; return; }       // לחיצה על טריק אוויר מהקרקע = קופצים ואז מבצעים
    if (t[4] === 'ground' && air) return;
    if (air && G.airTrick) return;                                               // טריק אוויר אחד בכל קפיצה
    if (air) G.airTrick = id;
    G.trick = { id: id, t: 0, dur: id === 'rear' ? 1.1 : .8 };
    if (id === 'rear') { G.rear = 1.1; neigh(1); sayEn('Stand up!'); }
    if (id === 'spin') sayEn('Spin!');
    if (id === 'flowers') for (var i = 0; i < 40; i++) G.fx.push({ x: W / 2, y: H * .55, vx: (Math.random() - .5) * 900, vy: -500 - Math.random() * 500, e: ['🌸', '🌼', '🌷', '💐'][i % 4], life: 1.6 });
    if (id === 'lasso') { G.lasso = 1; sayEn('Yee-haw!'); }
    if (id === 'star') { G.flash = .5; for (i = 0; i < 26; i++) G.fx.push({ x: W / 2, y: H * .4, vx: Math.cos(i / 26 * 6.28) * 700, vy: Math.sin(i / 26 * 6.28) * 700, e: '⭐', life: 1 }); }
    /* ניקוד: קומבו (טריקים ברצף תוך 4 שניות) ובונוס קשת טריקים */
    var now = G.time, mult = now - G.lastTrick < 4 ? Math.min(5, G.combo + 1) : 1; G.combo = mult; G.lastTrick = now;
    var pts = t[3] * mult * (G.archT > 0 ? 2 : 1);
    G.stars += pts; G.tricks++; G.bestCombo = Math.max(G.bestCombo, mult);
    pop((G.archT > 0 ? '✨ מושלם! ' : '') + t[1] + ' ' + t[2] + (mult > 1 ? ' ×' + mult : '') + ' +' + pts + '⭐', G.archT > 0 ? '#ffd93c' : '#ffffff');
    snd(mult > 2 ? 'unlock' : 'sparkle');
  }

  /* ================= פרק 7 — שערי למידה ================= */
  function ask(q) {
    G.q = q; $('rQ').innerHTML = q.type === 'math' ? '<b dir="ltr">' + q.show + '</b>' : q.type === 'color' ? '🎨 <b dir="ltr">' + q.en + '</b>' : '🔎 <b dir="ltr">' + q.en + '</b>';
    $('rQ').classList.add('show'); G.slowFor = 3.2;
    if (q.type === 'math') say(q.he); else teach(q.en, q.he);
  }
  function passGate(ent) {
    var lane = laneOf(G.x) + 1, ok = lane === ent.ans, q = ent.q;
    $('rQ').classList.remove('show'); G.q = null; G.gates++;
    /* אפקט לימודי (שלב 16): כרטיס המילה/המספר קופץ בצד עם הקול (shared/learn-fx.js). חשבון — התשובה כספרה גדולה */
    var LF = window.LearnFX, wordEmo = q.type === 'color' ? '🎨' : (D.ITEMS.filter(function (i) { return i[0] === q.word; })[0] || ['', '🔎'])[1];
    if (ok) { G.stars += 3; G.good++; pop('✔ נכון! +3⭐', '#3ff2b0'); snd('unlock'); if (q.type === 'math') { say('נכון! ' + q.heAns + '!'); if (LF) LF.count(+q.heAns, {}); } else if (LF) LF.word(q.word, q.heAns, wordEmo, { pre: 'נכון!', tag: '🇬🇧 למדנו!' }); else teach(q.word, 'נכון! ' + q.heAns + '!'); try { HeroRewards.award(1, $('rHud'), { word: 'נכון!' }); } catch (e) {} }
    else { pop('כמעט! התשובה: ' + (q.type === 'math' ? q.heAns : q.heAns), '#ffc27a'); tap(260); if (q.type === 'math') say('כמעט! התשובה היא ' + q.heAns); else if (LF) LF.word(q.word, q.heAns, wordEmo, { pre: 'כמעט! זה', tag: '🇬🇧 נזכור לפעם הבאה' }); else teach(q.word, 'כמעט! זה ה' + q.heAns + '. בפעם הבאה!'); }
    try { if (window.Progress) Progress.track('answer'); } catch (e) {}
  }

  /* ================= פרק 8 — קול וצלילים ================= */
  var AC = null;
  function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (AC && AC.state === 'suspended') AC.resume(); return AC; }
  function hoof(hi) {                                   // קליפ-קלופ: רעש קצר ומסונן
    var a = ac(); if (!a || muted()) return;
    var len = .05, buf = a.createBuffer(1, a.sampleRate * len, a.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
    var s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); s.buffer = buf; f.type = 'bandpass'; f.frequency.value = hi ? 1400 : 900; f.Q.value = 3; g.gain.value = .22;
    s.connect(f); f.connect(g); g.connect(a.destination); s.start();
  }
  function neigh(amt) {                                 // צהלה: סינוס עם רטט שיורד בתדר
    var a = ac(); if (!a || muted()) return;
    var o = a.createOscillator(), lfo = a.createOscillator(), lg = a.createGain(), g = a.createGain(), t = a.currentTime, d = .45 + amt * .5;
    o.type = 'sawtooth'; o.frequency.setValueAtTime(620, t); o.frequency.exponentialRampToValueAtTime(330, t + d);
    lfo.frequency.value = 22; lg.gain.value = 40; lfo.connect(lg); lg.connect(o.frequency);
    var f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1800;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.09, t + .05); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(f); f.connect(g); g.connect(a.destination); o.start(t); lfo.start(t); o.stop(t + d + .05); lfo.stop(t + d + .05);
  }
  function muted() { try { return window.Sound && Sound.isOn && !Sound.isOn(); } catch (e) { return false; } }

  /* ================= פרק 9 — לולאת משחק ================= */
  function newRound(ti) {
    T = D.TRACKS[ti];
    var wk = weekId(), seed = T.contest ? wk.split('-').reduce(function (a, b) { return a * 131 + +b; }, 7) : (Math.random() * 1e9) | 0;
    build(T, seed);
    G = { ti: ti, run: true, pos: 0, speed: 0, x: 0, tx: 0, jz: 0, vz: 0, time: 0, stars: 0, coins: 0, food: 0, jumps: 0, clean: 0, hits: 0, tricks: 0, combo: 0, bestCombo: 0, lastTrick: -9,
      gates: 0, good: 0, q: null, slow: 0, slowFor: 0, rear: 0, trick: null, airTrick: null, queue: null, archT: 0, lasso: 0, flash: 0, shake: 0, fx: [], pops: [], sky: 0, gait: 0, lastSeg: -1, stumble: 0 };
    ['startScreen', 'endScreen', 'pauseScreen', 'farm'].forEach(function (id) { $(id).classList.remove('show'); });
    $('rQ').classList.remove('show'); buildTrickBar(); hud();
    say(T.name + '! גוררים ימינה ושמאלה כדי לפנות, ומחליקים למעלה כדי לקפוץ. יאללה, ' + HS.state.name + '!');
    try { TapFX.set('light'); } catch (e) {}                                  // בזמן רכיבה: רק טבעת קלה בנגיעה, בלי מילים שמסתירות את הדרך
    neigh(.6); last = performance.now();
  }
  var last = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    var dt = Math.min(.05, (now - last) / 1000); last = now;
    if (G && G.run) update(dt);
    if (G) render(dt);
  }
  function update(dt) {
    G.time += dt;
    /* מהירות: צעד → טרוט → דהירה לאורך הסבב; האטה ליד שערים, בהחלקה למטה, בעמידה ובמעידה */
    var target = 2600 + Math.min(1, G.time / 25) * 2400 + (T.contest ? 500 : 0);
    if (G.slowFor > 0) { G.slowFor -= dt; target *= .62; }
    if (G.slow > 0) { G.slow -= dt; target *= .55; }
    if (G.rear > 0) { G.rear -= dt; target *= .35; }
    if (G.stumble > 0) { G.stumble -= dt; target *= .4; }
    G.speed += (target - G.speed) * Math.min(1, dt * 1.6);
    G.pos = (G.pos + G.speed * dt) % LEN;
    /* פנייה: הטיה או גרירה; העיקול דוחף מעט החוצה (ילדים לא צריכים להילחם בזה — חלש) */
    if (input.tilt != null && input.dragX == null) G.tx = input.tilt;
    padStep(dt);                                                             // לוח חיצים: החזקה = פנייה רציפה
    G.x += (G.tx - G.x) * Math.min(1, dt * 7);
    var seg = segs[Math.floor((G.pos + PZ) / SEG) % segs.length];
    G.x -= seg.curve * G.speed / 12000 * dt * .35; G.x = Math.max(-1.1, Math.min(1.1, G.x));
    G.sky += seg.curve * G.speed * dt * .00002;
    /* קפיצה */
    if (G.jz > 0 || G.vz > 0) { G.vz -= 3300 * dt; G.jz += G.vz * dt; if (G.jz <= 0) { G.jz = 0; G.vz = 0; land(); } }
    if (G.queue && G.jz > 60) { var q = G.queue; G.queue = null; doTrick(q); }
    if (G.trick) { G.trick.t += dt; if (G.trick.t > G.trick.dur) G.trick = null; }
    if (G.archT > 0) G.archT -= dt; if (G.flash > 0) G.flash -= dt; if (G.shake > 0) G.shake -= dt; if (G.lasso > 0) G.lasso -= dt * 1.2;
    /* צעדי פרסות לפי מהירות */
    var gaitRate = G.speed / 900; G.gait += dt * gaitRate * 2.2;
    if (G.jz === 0 && Math.floor(G.gait) !== Math.floor(G.gait - dt * gaitRate * 2.2)) hoof(Math.floor(G.gait) % 2);
    /* התנגשויות: בודקים כל מקטע שחצינו מאז הפריים הקודם */
    var ps = Math.floor((G.pos + PZ) / SEG);
    if (G.lastSeg < 0) G.lastSeg = ps;
    while (G.lastSeg !== ps) { G.lastSeg = (G.lastSeg + 1) % segs.length; hitSeg(segs[G.lastSeg]); }
    /* אפקטים */
    G.fx.forEach(function (f) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 900 * dt; f.life -= dt; }); G.fx = G.fx.filter(function (f) { return f.life > 0; });
    G.pops.forEach(function (p) { p.t += dt; }); G.pops = G.pops.filter(function (p) { return p.t < 1.4; });
    if (G.time >= ROUND) finish();
    hud();
  }
  function land() {
    G.airTrick = null;
    if (G.trick && G.trick.id !== 'rear') { /* נחיתה באמצע טריק — עדיין בסדר, בלי עונש */ }
  }
  function hitSeg(s) {
    s.ents.forEach(function (e) {
      if (e.done) return;
      var lane = laneOf(G.x);
      if (e.k === 'ask') { e.done = 1; ask(e.q); return; }
      if (e.k === 'gate') { e.done = 1; passGate(e); return; }
      if (e.k === 'arch') { e.done = 1; G.archT = .9; pop('✨ קשת טריקים! עכשיו טריק!', '#ffd93c'); snd('bubble'); return; }
      if (e.k === 'item') { if (lane !== e.lane - 1) return; e.done = 1; collect(e.e); return; }
      /* מכשולים ברוחב הדרך: צריך להיות באוויר */
      if (e.lane < 0) { e.done = 1; if (G.jz > 90) { G.clean++; G.stars += 1; pop('⬆️ קפיצה נקייה! +1⭐', '#ffffff'); snd('ding'); } else stumble(e.k); return; }
      /* מכשולים בנתיב: עוקפים (או קופצים מעליהם) */
      if (lane === e.lane - 1) { e.done = 1; if (G.jz > 90) { G.clean++; G.stars += 1; pop('⬆️ מעל המכשול! +1⭐', '#ffffff'); snd('ding'); } else stumble(e.k); }
    });
  }
  function collect(e) {
    if (e === '⭐') { G.stars++; snd('sparkle'); }
    else if (e === '🪙') { G.coins++; snd('ding'); }
    else if (e === '🍎' || e === '🥕') { G.food++; snd('pop'); }
    else { G.stars++; snd('bubble'); }
    G.fx.push({ x: W / 2 + (G.x * W * .18), y: H * .5, vx: (Math.random() - .5) * 200, vy: -500, e: e, life: .8 });
  }
  var OOPS = { fence: 'אופס! גדר — מחליקים למעלה כדי לקפוץ', log: 'אופס! בול עץ — קופצים מעליו', puddle: 'שפלאש! שלולית', hay: 'אופס! חבילת חציר — עוקפים הצידה', rock: 'אופס! סלע — עוקפים', bush: 'שיח! עוקפים הצידה', cactus: 'אאוץ׳! קקטוס — עוקפים' };
  function stumble(k) {
    G.hits++; G.stumble = .9; G.shake = .4; G.combo = 0; neigh(.3); tap(200);
    pop(OOPS[k] || 'אופס!', '#ffc27a');
    if (G.hits <= 2) say(OOPS[k] || 'אופס!');
  }
  function pop(t, col) { G.pops.push({ t: 0, txt: t, col: col || '#fff' }); }

  /* ================= פרק 10 — ציור ================= */
  function render(dt) {
    var tr = T, c = ctx;
    c.save();
    if (G.shake > 0) c.translate((Math.random() - .5) * 14, (Math.random() - .5) * 10);
    /* סיבוב באוויר: כל העולם מסתובב סביב מרכז המסך */
    if (G.trick && G.trick.id === 'spin') { var k = G.trick.t / G.trick.dur; c.translate(W / 2, H / 2); c.rotate(k * Math.PI * 2); c.translate(-W / 2, -H / 2); }
    /* שמיים */
    var g = c.createLinearGradient(0, 0, 0, H * .62); g.addColorStop(0, tr.sky[0]); g.addColorStop(.6, tr.sky[1]); g.addColorStop(1, tr.sky[2]);
    c.fillStyle = g; c.fillRect(-W, -H, W * 3, H * 3);
    c.fillStyle = tr.id === 'sunset' ? '#ffd9a0' : tr.id === 'snow' ? '#ffffff' : '#fff3a0'; c.beginPath(); c.arc(W * .78 - G.sky * 400 % W, H * .18, Math.min(W, H) * .06, 0, 7); c.fill();
    /* גבעות רחוקות בשתי שכבות (פרלקסה לפי העיקולים) */
    hills(c, H * .5, H * .1, tr.grass[1], .6, G.sky * 300); hills(c, H * .55, H * .07, tr.grass[0], 1, G.sky * 600);
    /* הדרך: מחשבים הטלה מקרוב לרחוק, מציירים מרחוק לקרוב */
    var base = Math.floor(G.pos / SEG), pct = (G.pos % SEG) / SEG, bs = segs[base % segs.length];
    var py = bs.p1.y + (bs.p2.y - bs.p1.y) * pct, camY = CAM_H + py + G.jz * .9 + (G.rear > 0 ? 180 * Math.sin(Math.min(1, (1.1 - G.rear) / .3) * Math.PI / 2) : 0);
    var x = 0, dx = -(bs.curve * pct), list = [];
    for (var n = 0; n < DRAW; n++) {
      var s = segs[(base + n) % segs.length], loop = s.i < base ? LEN : 0;
      project(s.p1, G.x * ROAD_W - x, camY, G.pos - loop); project(s.p2, G.x * ROAD_W - x - dx, camY, G.pos - loop);
      x += dx; dx += s.curve;
      if (s.p1.z - (G.pos - loop) <= PZ * .2) continue;
      list.push(s);
    }
    var fog = tr.sky[2];
    for (var j = list.length - 1; j >= 0; j--) {
      s = list[j]; var p1 = s.p1, p2 = s.p2;
      if (p2.Y >= p1.Y + .5 && j < list.length - 1) { /* מאחורי גבעה — עדיין מציירים ספרייטים? לא */ }
      c.fillStyle = s.dark ? tr.grass[1] : tr.grass[0]; c.fillRect(-W, p2.Y, W * 3, p1.Y - p2.Y + 1);
      quad(c, p1.X, p1.Y, p1.Wd * 1.12, p2.X, p2.Y, p2.Wd * 1.12, s.dark ? tr.edge : shade(tr.edge));
      quad(c, p1.X, p1.Y, p1.Wd, p2.X, p2.Y, p2.Wd, s.dark ? tr.road[0] : tr.road[1]);
      if (s.dark) { var lw1 = p1.Wd / 40, lw2 = p2.Wd / 40; [-1 / 3, 1 / 3].forEach(function (L) { quad(c, p1.X + p1.Wd * L * 2, p1.Y, lw1, p2.X + p2.Wd * L * 2, p2.Y, lw2, 'rgba(255,255,255,.35)'); }); }
      var fogA = Math.min(.85, j / DRAW * 1.1); if (fogA > .05) { c.globalAlpha = fogA; c.fillStyle = fog; c.fillRect(-W, p2.Y, W * 3, p1.Y - p2.Y + 1); c.globalAlpha = 1; }
      drawSeg(c, s, fogA);
    }
    /* אפקטים וטקסט */
    if (G.lasso > 0) { c.strokeStyle = '#c98b4f'; c.lineWidth = 6; c.beginPath(); c.ellipse(W / 2, H * .3, W * .18 * G.lasso + 30, H * .06 * G.lasso + 10, 0, 0, 7); c.stroke(); }
    G.fx.forEach(function (f) { c.globalAlpha = Math.min(1, f.life * 2); c.drawImage(spr(f.e), f.x - 24, f.y - 24, 48, 48); }); c.globalAlpha = 1;
    if (tr.snow) { c.fillStyle = 'rgba(255,255,255,.85)'; for (var sn = 0; sn < 60; sn++) { var sx = (sn * 97 + G.time * 40 * (1 + sn % 3)) % W, sy = (sn * 53 + G.time * 90 * (1 + sn % 2)) % H; c.beginPath(); c.arc(sx, sy, 2 + sn % 3, 0, 7); c.fill(); } }
    c.restore();
    pov(c);
    if (G.flash > 0) { c.fillStyle = 'rgba(255,255,220,' + G.flash + ')'; c.fillRect(0, 0, W, H); }
    G.pops.forEach(function (p, i) {
      var a = 1 - Math.max(0, p.t - 1) / .4, y = H * .3 - p.t * 60 - i * 6;
      c.globalAlpha = Math.max(0, a); c.font = '900 ' + Math.round(Math.min(W, H) * .045) + 'px ' + getComputedStyle(document.body).fontFamily; c.textAlign = 'center';
      c.lineWidth = 7; c.strokeStyle = HS.INK; c.strokeText(p.txt, W / 2, y); c.fillStyle = p.col; c.fillText(p.txt, W / 2, y);
    }); c.globalAlpha = 1;
  }
  function shade(hex) { try { var n = parseInt(hex.slice(1), 16); return 'rgb(' + [(n >> 16) * .85, ((n >> 8) & 255) * .85, (n & 255) * .85].map(Math.round).join(',') + ')'; } catch (e) { return hex; } }
  function quad(c, x1, y1, w1, x2, y2, w2, col) { c.fillStyle = col; c.beginPath(); c.moveTo(x1 - w1, y1); c.lineTo(x2 - w2, y2); c.lineTo(x2 + w2, y2); c.lineTo(x1 + w1, y1); c.closePath(); c.fill(); }
  function hills(c, y, h, col, f, off) { c.fillStyle = col; c.beginPath(); c.moveTo(-W, H); for (var x = -W; x <= W * 2; x += 20) c.lineTo(x, y - Math.abs(Math.sin((x + off) / (180 * f))) * h - Math.sin((x + off) / (70 * f)) * h * .2); c.lineTo(W * 2, H); c.closePath(); c.fill(); }
  /* drawSeg — ספרייטים של מקטע: נוף, פריטים, מכשולים, קשתות ושערים */
  function drawSeg(c, s, fogA) {
    var p = s.p1, scale = p.s * W / 2;
    s.side.forEach(function (o) { var sz = o.sz * scale, x = p.X + p.Wd * o.off; if (sz < 3) return; c.drawImage(spr(o.e), x - sz / 2, p.Y - sz * .92, sz, sz); });
    s.ents.forEach(function (e) {
      if (e.done && e.k !== 'gate' && e.k !== 'arch') return;
      var roadL = p.X - p.Wd, roadR = p.X + p.Wd;
      if (e.k === 'item') { var sz = 330 * scale, x = p.X + p.Wd * LANES[e.lane]; c.drawImage(spr(e.e), x - sz / 2, p.Y - sz * 1.3, sz, sz); return; }
      if (e.k === 'fence') { var h = 260 * scale; c.fillStyle = '#ffffff'; c.strokeStyle = HS.INK; c.lineWidth = Math.max(1, 5 * scale * 4);
        [.35, .75].forEach(function (f) { c.fillRect(roadL, p.Y - h * f, roadR - roadL, h * .14); c.strokeRect(roadL, p.Y - h * f, roadR - roadL, h * .14); });
        for (var k = 0; k <= 6; k++) { var fx = roadL + (roadR - roadL) * k / 6; c.fillStyle = '#ff5ca8'; c.fillRect(fx - h * .05, p.Y - h, h * .1, h); c.strokeRect(fx - h * .05, p.Y - h, h * .1, h); } return; }
      if (e.k === 'log') { var lh = 150 * scale; c.fillStyle = '#9c6b3f'; c.strokeStyle = HS.INK; c.lineWidth = Math.max(1, 3 * scale * 4); rr(c, roadL, p.Y - lh, roadR - roadL, lh, lh / 2); c.fill(); c.stroke(); c.fillStyle = '#e8c9a0'; c.beginPath(); c.ellipse(roadL + lh * .5, p.Y - lh / 2, lh * .35, lh * .42, 0, 0, 7); c.fill(); c.stroke(); return; }
      if (e.k === 'puddle') { c.fillStyle = '#5fb8ff'; c.strokeStyle = '#ffffff'; c.lineWidth = Math.max(1, 3 * scale * 4); c.beginPath(); c.ellipse(p.X, p.Y - 10 * scale, p.Wd * .95, Math.max(3, 80 * scale), 0, 0, 7); c.fill(); c.stroke(); return; }
      if (e.k === 'arch') { var ah = 900 * scale, aw = p.Wd * .9; c.lineWidth = Math.max(2, 60 * scale); var grd = c.createLinearGradient(p.X - aw, 0, p.X + aw, 0); ['#ff5ca8', '#ffd93c', '#3fe0c5', '#9b5cff'].forEach(function (col, i) { grd.addColorStop(i / 3, col); }); c.strokeStyle = grd; c.beginPath(); c.ellipse(p.X, p.Y, aw, ah, 0, Math.PI, 0); c.stroke(); return; }
      if (e.k === 'gate') { e.opts.forEach(function (o, i) { var gx = p.X + p.Wd * LANES[i], gw = p.Wd * .27, gh = 700 * scale; c.lineWidth = Math.max(2, 40 * scale); c.strokeStyle = HS.INK; c.fillStyle = o.col; rr(c, gx - gw, p.Y - gh, gw * 2, gh * .42, gw * .3); c.fill(); c.stroke(); c.fillRect(gx - gw, p.Y - gh * .6, gw * .18, gh * .6); c.fillRect(gx + gw * .82, p.Y - gh * .6, gw * .18, gh * .6);
          if (o.label) { var fs = gh * .26; if (/\d/.test(o.label)) { c.font = '900 ' + Math.round(fs) + 'px sans-serif'; c.textAlign = 'center'; c.fillStyle = HS.INK; c.fillText(o.label, gx, p.Y - gh * .69); } else c.drawImage(spr(o.label), gx - fs * .6, p.Y - gh * .98, fs * 1.2, fs * 1.2); } }); return; }
      /* מכשולים בנתיב */
      var em = { hay: '🌾', rock: '🪨', bush: '🌳', cactus: '🌵' }[e.k] || '🪨', osz = (e.k === 'hay' ? 420 : 380) * scale, ox = p.X + p.Wd * LANES[e.lane];
      if (e.k === 'hay') { c.fillStyle = '#ffd97a'; c.strokeStyle = HS.INK; c.lineWidth = Math.max(1, 3 * scale * 4); rr(c, ox - osz * .6, p.Y - osz * .7, osz * 1.2, osz * .7, osz * .12); c.fill(); c.stroke(); c.beginPath(); c.moveTo(ox - osz * .6, p.Y - osz * .35); c.lineTo(ox + osz * .6, p.Y - osz * .35); c.stroke(); }
      else c.drawImage(spr(em), ox - osz / 2, p.Y - osz * .95, osz, osz);
    });
  }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  /* pov — הסוס במבט הרוכבת: צוואר עולה מתחתית המסך, ראש, אוזניים, רעמה, מושכות וידיים */
  function pov(c) {
    var col = HS.povColors(), ink = HS.INK;
    var bobA = G.jz > 0 ? 0 : Math.min(1, G.speed / 5000) * H * .018, bob = Math.sin(G.gait * Math.PI) * bobA;
    var rear = G.rear > 0 ? Math.sin(Math.min(1, (1.1 - G.rear) / .25) * Math.PI / 2) * (G.rear < .25 ? G.rear / .25 : 1) : 0;
    var tilt = (G.tx - G.x) * .12 + (G.jz > 0 ? -.05 : 0);
    var cx = W / 2, top = H * .74 - bob - rear * H * .22 - (G.jz > 0 ? H * .03 : 0), bw = W * .26, tw = W * .09;
    c.save(); c.translate(cx, H); c.rotate(tilt); c.translate(-cx, -H);
    c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = ink; c.lineWidth = 5;
    /* צוואר */
    c.fillStyle = col.coat; c.beginPath(); c.moveTo(cx - bw, H + 10); c.quadraticCurveTo(cx - tw * 1.3, top + H * .1, cx - tw, top); c.lineTo(cx + tw, top); c.quadraticCurveTo(cx + tw * 1.3, top + H * .1, cx + bw, H + 10); c.closePath(); c.fill(); c.stroke();
    /* אוזניים */
    [-1, 1].forEach(function (sd) { var ex = cx + sd * tw * .75, ey = top + 6; c.fillStyle = col.coat; c.beginPath(); c.moveTo(ex - tw * .32, ey); c.quadraticCurveTo(ex + sd * tw * .1, ey - H * .12, ex + sd * tw * .12, ey - H * .13); c.quadraticCurveTo(ex + tw * .32, ey - H * .05, ex + tw * .3, ey); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#ff8fc4'; c.beginPath(); c.moveTo(ex - tw * .14, ey - 4); c.quadraticCurveTo(ex + sd * tw * .08, ey - H * .09, ex + sd * tw * .1, ey - H * .1); c.quadraticCurveTo(ex + tw * .16, ey - H * .04, ex + tw * .14, ey - 4); c.closePath(); c.fill(); });
    /* ראש (קודקוד) */
    c.fillStyle = col.coat; c.beginPath(); c.ellipse(cx, top + 6, tw * 1.05, H * .035, 0, Math.PI, 0); c.fill(); c.stroke();
    /* רעמה במרכז הצוואר (ובליטת פוני בין האוזניים); צמות אם נקלעו */
    var mc = col.rainbow ? c.createLinearGradient(cx - tw, 0, cx + tw, 0) : col.mane; if (col.rainbow) ['#ff5ca8', '#ffd93c', '#3fe0c5', '#3d7bff', '#9b5cff'].forEach(function (x, i) { mc.addColorStop(i / 4, x); });
    c.fillStyle = mc; c.beginPath(); c.moveTo(cx - tw * .45, top - 6);
    for (var i = 0; i <= 6; i++) { var yy = top + (H - top) * i / 6, wv = Math.sin(i * 1.7 + G.gait * 2) * tw * .12; c.lineTo(cx - tw * (.32 + i * .06) + wv, yy); }
    for (i = 6; i >= 0; i--) { yy = top + (H - top) * i / 6; wv = Math.sin(i * 1.7 + G.gait * 2) * tw * .12; c.lineTo(cx + tw * (.32 + i * .06) + wv, yy); }
    c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(cx - tw * .45, top); c.quadraticCurveTo(cx, top - H * .06, cx + tw * .45, top); c.quadraticCurveTo(cx, top + H * .02, cx - tw * .45, top); c.fill(); c.stroke();
    if (HS.state.braids > 0) for (i = 1; i <= HS.state.braids; i++) { c.fillStyle = '#ff5ca8'; c.beginPath(); c.arc(cx, top + (H - top) * i / 5, 7, 0, 7); c.fill(); c.stroke(); }
    if (col.acc.indexOf('flowers') >= 0) ['#ff5ca8', '#ffd93c', '#9b5cff'].forEach(function (f, i) { c.fillStyle = f; c.beginPath(); c.arc(cx + (i - 1) * tw * .45, top - H * .035, tw * .16, 0, 7); c.fill(); c.stroke(); });
    if (col.acc.indexOf('crown') >= 0) { c.fillStyle = '#ffc93c'; c.beginPath(); c.moveTo(cx - tw * .4, top - H * .02); c.lineTo(cx - tw * .4, top - H * .08); c.lineTo(cx - tw * .15, top - H * .05); c.lineTo(cx, top - H * .1); c.lineTo(cx + tw * .15, top - H * .05); c.lineTo(cx + tw * .4, top - H * .08); c.lineTo(cx + tw * .4, top - H * .02); c.closePath(); c.fill(); c.stroke(); }
    if (col.acc.indexOf('plume') >= 0) { c.fillStyle = '#3fe0c5'; c.beginPath(); c.moveTo(cx, top - 6); c.quadraticCurveTo(cx - tw * .7, top - H * .18, cx + tw * .1, top - H * .22); c.quadraticCurveTo(cx - tw * .2, top - H * .12, cx + tw * .12, top - 6); c.fill(); c.stroke(); }
    if (col.acc.indexOf('wings') >= 0) { c.fillStyle = '#ffd93c'; c.beginPath(); c.moveTo(cx - tw * .1, top - 6); c.lineTo(cx, top - H * .16); c.lineTo(cx + tw * .1, top - 6); c.fill(); c.stroke(); }
    /* מושכות: מהרסן בצידי הראש אל הידיים */
    var hy = H - H * .06 + bob * .4, hxL = cx - W * .2, hxR = cx + W * .2;
    c.strokeStyle = col.rein; c.lineWidth = 8;
    c.beginPath(); c.moveTo(cx - tw * .95, top + H * .05); c.quadraticCurveTo(cx - W * .16, top + H * .16, hxL, hy); c.stroke();
    c.beginPath(); c.moveTo(cx + tw * .95, top + H * .05); c.quadraticCurveTo(cx + W * .16, top + H * .16, hxR, hy); c.stroke();
    c.restore();
    /* ידיים עם כפפות ושרוולים */
    var glove = BOY ? '#3d7bff' : '#ff5ca8', sleeve = BOY ? '#1f3a93' : '#9b5cff';
    [hxL, hxR].forEach(function (hx, i) { var sx = i ? 1 : -1;
      c.fillStyle = sleeve; c.strokeStyle = ink; c.lineWidth = 5; c.beginPath(); c.moveTo(hx + sx * W * .02, hy + 4); c.lineTo(hx + sx * W * .1, H + 20); c.lineTo(hx + sx * W * .2, H + 20); c.lineTo(hx + sx * W * .07, hy - 10); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = glove; c.beginPath(); c.ellipse(hx, hy, W * .032, H * .04, sx * .3, 0, 7); c.fill(); c.stroke(); });
  }

  /* ================= פרק 11 — HUD ומסכים ================= */
  function hud() {
    if (!G) return;
    $('hS').textContent = '⭐ ' + G.stars; $('hF').textContent = '🥕 ' + G.food; $('hC').textContent = '🪙 ' + G.coins;
    $('hCombo').style.display = G.combo > 1 && G.time - G.lastTrick < 4 ? '' : 'none'; $('hCombo').textContent = '🔥 ×' + G.combo;
    $('rTime').style.width = Math.max(0, 100 - G.time / ROUND * 100) + '%';
    $('pad').classList.toggle('show', padOn && G.run);                       // לוח החיצים רק בזמן רכיבה
    var air = G.jz > 20;
    document.querySelectorAll('.tb').forEach(function (b) { var t = b.dataset.t, def = D.TRICKS.filter(function (x) { return x[0] === t; })[0]; b.classList.toggle('hot', G.archT > 0 && t !== 'jump'); b.classList.toggle('dim', def[4] === 'ground' && air); });
  }
  function buildTrickBar() {
    var bar = $('tricks'); bar.innerHTML = '';
    D.TRICKS.forEach(function (t) {
      var lock = t[5] > HS.state.tracks - 1, b = el('button', 'tb' + (lock ? ' lock' : ''), '<b>' + (lock ? '🔒' : t[1]) + '</b><span>' + t[2] + '</span>'); b.type = 'button'; b.dataset.t = t[0];
      b.addEventListener('pointerdown', function (e) { e.stopPropagation(); e.preventDefault(); doTrick(t[0]); });
      bar.appendChild(b);
    });
  }
  /* ספי מדליות (כוילו בבוט שרוכב סבב שלם: רוכב מושלם ~230, בינוני ~120) */
  var MEDAL = { gold: 110, silver: 60, bronze: 25 };
  function medalOf(st) { return st >= MEDAL.gold ? ['🥇', 'זהב'] : st >= MEDAL.silver ? ['🥈', 'כסף'] : st >= MEDAL.bronze ? ['🥉', 'ארד'] : ['🎗️', 'השתתפות']; }
  function finish() {
    G.run = false; $('rQ').classList.remove('show');
    try { TapFX.set('full'); } catch (e) {}                                   // במסך הסיום חוזרים לתגובות המלאות
    var st = G.stars, m = medalOf(st), S = HS.state, ti = G.ti, unlocked = false;
    S.best[T.id] = Math.max(S.best[T.id] || 0, st);
    if (st >= MEDAL.bronze && S.tracks === ti + 1 && S.tracks < D.TRACKS.length) { S.tracks++; unlocked = true; }
    HS.afterRide(Math.min(3, Math.floor(st / 40)));
    HS.bump('food', 0);
    try { if (window.Wallet) Wallet.add(G.coins + (st >= MEDAL.silver ? 3 : 1)); } catch (e) {}
    try { if (window.Progress) Progress.track('ride:done'); } catch (e) {}
    try { HeroRewards.confetti(); } catch (e) {}
    /* תחרות שבועית: שיא השבוע + תעודה על מדליית זהב (פעם בשבוע) */
    var wk = weekId();
    if (T.contest) { if (S.week.id !== wk) S.week = { id: wk, best: 0, cert: 0 }; S.week.best = Math.max(S.week.best, st);
      if (st >= MEDAL.gold && !S.week.cert && window.Share) { S.week.cert = 1; setTimeout(function () { try { Share.award({ key: 'ride:' + wk, line: (BOY ? 'רוכב מצטיין' : 'רוכבת מצטיינת') + ' — ' + T.name, ico: '🏆' }); } catch (e) {} }, 1800); } }
    HS.save();
    $('rMedal').textContent = m[0]; $('rMedalT').textContent = 'מדליית ' + m[1] + '!';
    $('eS').textContent = st; $('eF').textContent = G.food; $('eC').textContent = G.coins; $('eT').textContent = G.tricks; $('eG').textContent = G.good + '/' + G.gates; $('eJ').textContent = G.clean;
    $('endText').textContent = (unlocked ? '🔓 מסלול חדש נפתח: ' + D.TRACKS[S.tracks - 1].name + '! ' : '') + (G.food ? 'אספת ' + G.food + ' פירות — אפשר להאכיל את ' + S.name + ' בחווה 🧺' : '') + (T.contest ? ' · שיא השבוע: ' + S.week.best + '⭐' : '');
    $('endScreen').classList.add('show');
    say('סיימנו! מדליית ' + m[1] + '! ' + (unlocked ? 'ונפתח מסלול חדש: ' + D.TRACKS[S.tracks - 1].name + '!' : '') + (G.food ? ' ' + S.name + ' מחכה לגזר בחווה.' : ''));
    G.pendingFood = G.food;
  }
  var selTrack = 0;
  function startScreen() {
    G = null; ['endScreen', 'pauseScreen', 'farm'].forEach(function (id) { $(id).classList.remove('show'); });
    $('pad').classList.remove('show'); try { TapFX.set('full'); } catch (e) {}   // לוח החיצים מוסתר במסך הפתיחה
    var S = HS.state, box = $('tracks'); box.innerHTML = '';
    selTrack = Math.min(selTrack, S.tracks - 1);
    D.TRACKS.forEach(function (t, i) {
      var lock = i >= S.tracks, best = S.best[t.id] || 0, b = el('button', 'trk' + (i === selTrack ? ' sel' : '') + (lock ? ' locked' : ''),
        (lock ? '<span class="lock">🔒</span>' : '') + '<span class="t-ico">' + t.ico + '</span>' + t.name + (best ? '<small>' + medalOf(best)[0] + ' ' + best + '⭐</small>' : t.contest ? '<small>🏆 תחרות השבוע</small>' : ''));
      b.type = 'button'; b.style.background = 'linear-gradient(180deg,' + t.sky[0] + ',' + t.sky[2] + ')';
      b.addEventListener('click', function () { if (lock) { say('משיגים מדליית ארד — ' + MEDAL.bronze + ' כוכבים — במסלול הקודם כדי לפתוח'); tap(250); return; } selTrack = i; tap(640); say(t.name); startScreen(); });
      box.appendChild(b);
    });
    $('horsePrev').innerHTML = HS.svg({ face: HS.mood() === 'tired' ? 'sleep' : 'happy' });
    $('horseName').textContent = S.name;
    var md = HS.mood(); $('horseMood').textContent = md === 'happy' ? '💖 ' + S.name + ' ' + HS.MOOD_HE.happy + ' ומוכנ' + (BOY ? '' : 'ה') + ' לרכיבה!' : '🧺 ' + S.name + ' ' + HS.MOOD_HE[md] + ' — ביקור בחווה יעזור';
    $('startScreen').classList.add('show');
  }

  /* ================= פרק 12 — החווה ================= */
  var farmTool = 'brush', rubAcc = 0, wet = 0;
  var TOOLS = [['brush', '🪮', 'מברשת'], ['wash', '🚿', 'מקלחת'], ['carrot', '🥕', 'גזר'], ['apple', '🍎', 'תפוח'], ['hay', '🌾', 'חציר'], ['water', '💧', 'מים'], ['hoof', '🧽', 'פרסות'], ['braid', '🎀', 'צמות'], ['sugar', '🍬', 'סוכר'], ['rest', '🛏️', 'מנוחה'], ['closet', '🎨', 'ארון']];
  function openFarm() {
    ['startScreen', 'endScreen'].forEach(function (id) { $(id).classList.remove('show'); });
    $('farm').classList.add('show'); buildFarmTools(); drawFarm();
    var S = HS.state, md = HS.mood();
    if (G && G.pendingFood) { say('הבאת ' + G.pendingFood + ' פירות מהרכיבה! נותנים ל' + S.name + ' גזר?'); G.pendingFood = 0; }
    else say('ברוכים הבאים לחווה! ' + S.name + ' ' + HS.MOOD_HE[md] + '. בוחרים כלי ומטפלים.');
  }
  function buildFarmTools() {
    var box = $('farmTools'); box.innerHTML = '';
    TOOLS.forEach(function (t) { var b = el('button', 'ft' + (farmTool === t[0] ? ' on' : ''), '<b>' + t[1] + '</b><span>' + t[2] + '</span>'); b.type = 'button';
      b.addEventListener('click', function () { tap(620); useTool(t[0]); }); box.appendChild(b); });
  }
  var face = 'happy', faceT = 0;
  function drawFarm() {
    var n = HS.needs();
    $('farmHorse').innerHTML = HS.svg({ face: face, wet: wet > 0 });
    [['food', '🥕'], ['clean', '🪮'], ['happy', '💖'], ['energy', '⚡']].forEach(function (k) { var b = $('m_' + k[0]); b.querySelector('i').style.width = n[k[0]] + '%'; b.classList.toggle('low', n[k[0]] < 30); });
    $('farmName').textContent = HS.state.name;
  }
  function setFace(f, t) { face = f; faceT = t || 1.6; drawFarm(); clearTimeout(setFace.tm); setFace.tm = setTimeout(function () { face = 'happy'; drawFarm(); }, (t || 1.6) * 1000); }
  function useTool(id) {
    var S = HS.state; farmTool = id; buildFarmTools();
    if (id === 'brush') say('משפשפים את ' + S.name + ' עם המברשת');
    else if (id === 'wash') say('משפשפים עם המקלחת — קצף ובועות!');
    else if (id === 'hoof') say('נוגעים בכל פרסה כדי לנקות');
    else if (id === 'braid') say('נוגעים ברעמה כדי לקלוע צמה');
    else if (id === 'carrot' || id === 'apple' || id === 'hay' || id === 'water') feed(id);
    else if (id === 'sugar') { if (HS.needs().food < 60) { say(S.name + ' צריכ' + (BOY ? '' : 'ה') + ' קודם אוכל אמיתי — גזר או חציר'); return; } HS.bump('happy', 25); setFace('love', 2); neigh(.8); sayEn('Good horse!'); farmFx('💖'); }
    else if (id === 'rest') { HS.bump('energy', 45); setFace('sleep', 3); say(S.name + ' נח' + (BOY ? '' : 'ה') + ' באורווה... ששש'); farmFx('💤'); }
    else if (id === 'closet') openCloset();
  }
  function feed(kind) {
    var S = HS.state, food = { carrot: ['🥕', 20, 'carrot', 'גזר'], apple: ['🍎', 18, 'apple', 'תפוח'], hay: ['🌾', 30, 'hay', 'חציר'], water: ['💧', 10, 'water', 'מים'] }[kind];
    if (HS.needs().food >= 98 && kind !== 'water') { say(S.name + ' שבע' + (BOY ? '' : 'ה') + '! אולי מברשת או משחק?'); return; }
    HS.bump('food', food[1]); HS.bump('happy', 5); setFace('eat', 1.8); farmFx(food[0]); snd('pop');
    teach(food[2], 'יאמי! ' + food[3] + '!');
  }
  function farmFx(e) { var f = el('div', 'ffx', e); f.style.left = (40 + Math.random() * 20) + '%'; $('farmStage').appendChild(f); setTimeout(function () { f.remove(); }, 1400); }
  /* שפשוף על הסוס: מברשת / מקלחת; נגיעה בפרסה / ברעמה */
  function bindFarm() {
    var stage = $('farmHorse'), down = false, lastP = null;
    stage.addEventListener('pointerdown', function (e) {
      down = true; lastP = [e.clientX, e.clientY];
      var r = stage.getBoundingClientRect(), fx = (e.clientX - r.left) / r.width * 400, fy = (e.clientY - r.top) / r.height * 320, S = HS.state;
      if (farmTool === 'hoof') { var hx = [142, 122, 250, 270], k = -1; hx.forEach(function (x, i) { if (Math.abs(fx - x) < 22 && fy > 250) k = i; }); if (k >= 0 && !S.hoof[k]) { S.hoof[k] = 1; HS.save(); HS.bump('clean', 8); drawFarm(); farmFx('✨'); snd('sparkle'); if (S.hoof.every(function (h) { return h; })) say('כל הפרסות נקיות! כל הכבוד!'); } else if (k >= 0) say('הפרסה הזאת כבר נקייה'); }
      if (farmTool === 'braid' && fx > 220 && fx < 320 && fy < 200) { if (S.braids < 4) { S.braids++; HS.save(); HS.bump('happy', 6); drawFarm(); snd('sparkle'); say(S.braids === 4 ? 'ארבע צמות! איזה יופי!' : 'צמה ' + S.braids + '!'); } else { S.braids = 0; HS.save(); drawFarm(); say('פותחים את הצמות'); } }
    });
    window.addEventListener('pointermove', function (e) {
      if (!down || (farmTool !== 'brush' && farmTool !== 'wash')) return;
      var d = Math.hypot(e.clientX - lastP[0], e.clientY - lastP[1]); lastP = [e.clientX, e.clientY]; rubAcc += d;
      if (Math.random() < .25) { var f = el('div', 'rub', farmTool === 'wash' ? '🫧' : '✨'); var r = $('farmStage').getBoundingClientRect(); f.style.left = (e.clientX - r.left) + 'px'; f.style.top = (e.clientY - r.top) + 'px'; $('farmStage').appendChild(f); setTimeout(function () { f.remove(); }, 900); }
      if (rubAcc > 260) { rubAcc = 0; var S = HS.state;
        if (farmTool === 'brush') { if (S.mud > 0) S.mud--; HS.bump('clean', 7); HS.bump('happy', 3); tap(700); }
        else { wet = 2.5; if (S.mud > 0) S.mud--; HS.bump('clean', 10); tap(760); }
        HS.save(); drawFarm();
        if (HS.needs().clean >= 100 && S.mud === 0) { say(S.name + ' נקי' + (BOY ? '' : 'ה') + ' ומבריק' + (BOY ? '' : 'ה') + '!'); setFace('love', 1.6); }
      }
    });
    window.addEventListener('pointerup', function () { down = false; });
    setInterval(function () { if (wet > 0) { wet -= .5; if (wet <= 0) drawFarm(); } }, 500);
  }
  /* ארון העיצוב: פרווה, רעמה, אוכף, אביזרים (מחיר במטבעות מהארנק), ושם */
  function openCloset() {
    var box = $('closet'), S = HS.state; box.innerHTML = '';
    function row(title, list, key, multi) {
      box.appendChild(el('h4', '', title)); var r = el('div', 'crow');
      list.forEach(function (it) {
        var owned = !it[3] || S.own.indexOf(key + ':' + it[0]) >= 0, on = multi ? S.acc.indexOf(it[0]) >= 0 : S[key] === it[0];
        var sw = it[1].charAt(0) === '#' ? '<i style="background:' + it[1] + '"></i>' : it[1] === 'rainbow' ? '<i style="background:linear-gradient(#ff5ca8,#ffd93c,#3fe0c5,#9b5cff)"></i>' : '<i class="em">' + it[1] + '</i>';
        var b = el('button', 'cb' + (on ? ' on' : '') + (owned ? '' : ' buy'), sw + '<span>' + it[2] + '</span>' + (owned ? '' : '<small>🪙 ' + it[3] + '</small>')); b.type = 'button';
        b.addEventListener('click', function () {
          if (!owned) { var have = 0; try { have = Wallet.coins; } catch (e) {} if (have < it[3] || !Wallet.spend(it[3])) { say('צריך עוד ' + (it[3] - have) + ' מטבעות. רוכבים ואוספים 🪙!'); tap(250); return; } S.own.push(key + ':' + it[0]); snd('unlock'); }
          if (multi) { var i = S.acc.indexOf(it[0]); if (i >= 0) S.acc.splice(i, 1); else S.acc.push(it[0]); } else S[key] = it[0];
          HS.save(); tap(700); say(it[2]); drawFarm(); openCloset();
        });
        r.appendChild(b);
      });
      box.appendChild(r);
    }
    row('🐴 צבע פרווה', HS.COATS, 'coat'); row('💇 רעמה', HS.MANES, 'mane'); row('🏇 אוכף ורסן', HS.SADDLES, 'saddle'); row('✨ אביזרים', HS.ACCS, 'acc', true);
    var nm = el('div', 'crow'), inp = el('input'); inp.value = S.name; inp.maxLength = 12; inp.className = 'cname';
    inp.addEventListener('change', function () { var v = inp.value.replace(/[<>]/g, '').trim(); if (v) { S.name = v; HS.save(); drawFarm(); say('שלום ' + v + '!'); } });
    box.appendChild(el('h4', '', '✏️ השם של ' + (BOY ? 'הסוס' : 'הסוסה'))); nm.appendChild(inp); box.appendChild(nm);
    $('closetOv').classList.add('show');
  }

  /* ---------- חיבורים ---------- */
  function bind() {
    $('goBtn').addEventListener('click', function () { tap(); ac(); newRound(selTrack); });
    $('farmBtn').addEventListener('click', function () { tap(); openFarm(); });
    $('tiltBtn').addEventListener('click', function () { tap(); enableTilt(); $('tiltBtn').classList.add('on'); });
    $('pauseBtn').addEventListener('click', function () { if (!G || !G.run) return; G.run = false; $('pauseScreen').classList.add('show'); });
    $('resumeBtn').addEventListener('click', function () { $('pauseScreen').classList.remove('show'); G.run = true; last = performance.now(); });
    $('quitBtn').addEventListener('click', function () { startScreen(); });
    $('againBtn').addEventListener('click', function () { tap(); newRound(G ? G.ti : selTrack); });
    $('tracksBtn').addEventListener('click', function () { tap(); startScreen(); });
    $('endFarmBtn').addEventListener('click', function () { tap(); openFarm(); });
    $('farmBack').addEventListener('click', function () { tap(); startScreen(); });
    $('closetX').addEventListener('click', function () { tap(); $('closetOv').classList.remove('show'); });
    document.addEventListener('visibilitychange', function () { if (document.hidden && G && G.run) { G.run = false; $('pauseScreen').classList.add('show'); } });
    bindFarm(); bindPad();
  }
  resize(); bind();
  window.addEventListener('DOMContentLoaded', function () { if (location.hash === '#farm') openFarm(); else startScreen(); requestAnimationFrame(function (t) { last = t; loop(t); }); });
  /* לבדיקות אוטומטיות */
  window.RideGame = { state: function () { return G; }, start: newRound, trick: doTrick, farm: openFarm, tool: useTool, finish: function () { if (G) G.time = ROUND; }, segs: function () { return segs; } };
})();
