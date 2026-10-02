/* =====================================================================
   js/cars.js — מרוץ המכוניות: משחק נהיגה במבט מאחורי המכונית + מוסך + למידה בדרך (שלב 16)
   ---------------------------------------------------------------------
   פרק 1  — הגדרות ושמירה (<pfx>-cars-v1): מכונית נבחרת, מכוניות שנקנו, מסלולים שנפתחו, שיאים, סוג שליטה
   פרק 2  — קנבס ומנוע "דרך לעומק" (pseudo-3D): מקטעים, עיקולים, גבעות, הטלה למסך (כמו ride.js)
   פרק 3  — בניית מסלול: קונוסים (בקבוצות 1–5 לספירה), שמן, מכוניות אחרות, שלוליות, דלק, מטבעות, פסי טורבו,
            שערי למידה (צבע / כלי רכב / ספירה / חשבון), רמזורים ותמרורים בצד הדרך
   פרק 4  — ספרייטים: אימוג'י מצוירים מראש (מהיר באייפד)
   פרק 5  — שליטה: 🎡 הגה (גרירה מסובבת, חוזר למרכז) · 🎮 לוח חיצים (החזקה = פנייה) · 👆 גרירה · 📱 הטיה · מקלדת;
            דוושות ברקס 🛑 וטורבו ⚡ בכל המצבים
   פרק 6  — למידה: שערים (נוסעים לנתיב של התשובה), רמזור (אדום = ברקס עד הירוק), תמרורים, מילים של כלי רכב בעקיפה,
            "הידעת?" בטיחות בדרכים בתחנת הדלק — הכול דרך shared/learn-fx.js (כרטיס + קול)
   פרק 7  — קול: מנוע (WebAudio לפי מהירות), חריקה, צפצוף, טורבו; קול מוקלט באנגלית (Voice)
   פרק 8  — לולאת משחק: מהירות, דלק, טורבו, התנגשויות (בלי פסילה — רק האטה ו-"SCREECH!"), ניקוד
   פרק 9  — ציור: שמיים (יום/לילה), בניינים וגבעות, כביש עם פסי נתיב, ספרייטים, המכונית מאחור (6 דגמים), פיצוצי SFX
   פרק 10 — HUD ומסכים: מד מהירות עם מחוג, דלק, פתיחה (מכונית/מסלול/שליטה + קנייה במטבעות), השהיה, תוצאות ומדליה
   פרק 11 — API לבדיקות: window.CarsGame
   תלויות: js/cars-data.js, js/audio.js (Voice, Sound), shared/kids-ui.js, learn-fx, tap-fx, wallet, hero-rewards, progress, share
   ===================================================================== */
(function () {
  'use strict';
  var BOY = !!window.CARS_BOY, D = window.CarsData, INK = '#101e36';
  var ROUND = 70;                                          // שניות לסבב
  var PFX = BOY ? 'eitan' : 'ella', KEY = PFX + '-cars-v1';

  /* ================= פרק 1 — הגדרות ושמירה ================= */
  function blank() { return { car: 'sport', own: ['sport', 'police', 'taxi'], tracks: 1, best: {}, ctl: 'wheel', rounds: 0, words: {}, week: {} }; }
  function load() { try { var b = blank(), s = JSON.parse(localStorage.getItem(KEY)); if (!s) return b; Object.keys(b).forEach(function (k) { if (s[k] == null) s[k] = b[k]; }); return s; } catch (e) { return blank(); } }
  var S = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function carOf(id) { return D.CARS.filter(function (c) { return c.id === id; })[0] || D.CARS[0]; }

  /* ---------- עזרים ---------- */
  function $(id) { return document.getElementById(id); }
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function say(t) { try { Voice.say(t, { interrupt: true }); } catch (e) {} }
  function sayEn(t) { try { Voice.en(t); } catch (e) {} burst(t.toUpperCase().replace(/[^A-Z! -]/g, ''), W / 2 + (Math.random() - .5) * W * .3, H * .32); }
  function teach(en, he) { try { Voice.teach(en, he); } catch (e) { say(he); } }
  function snd(n) { try { if (window.Sound && Sound[n]) Sound[n](); } catch (e) {} }
  function tap(p) { try { KidsUI.KidsAudio.tap(p); } catch (e) {} }
  function track(ev) { try { if (window.Progress) Progress.track(ev); } catch (e) {} }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function weekId() { var d = new Date(), j = new Date(d.getFullYear(), 0, 1); return d.getFullYear() + '-' + Math.ceil(((d - j) / 864e5 + j.getDay() + 1) / 7); }
  function grade() { try { var p = Profile.active; return p && p.grade === 'big' ? 'big' : 'young'; } catch (e) { return 'young'; } }
  function kidName() { try { return (window.Profile && Profile.active && Profile.active.name) || (BOY ? 'איתן' : 'אלה'); } catch (e) { return BOY ? 'איתן' : 'אלה'; } }
  function muted() { try { return window.Sound && Sound.isOn && !Sound.isOn(); } catch (e) { return false; } }
  var LF = function () { return window.LearnFX; };

  /* ================= פרק 2 — קנבס ומנוע ================= */
  var cv = $('carsCv'), ctx = cv.getContext('2d'), W = 0, H = 0, DPR = 1;
  var SEG = 200, RUMBLE = 3, ROAD_W = 2200, CAM_H = 1100, FOV = 100, DEPTH = 1 / Math.tan(FOV / 2 * Math.PI / 180), DRAW = 160;
  var PZ = CAM_H * DEPTH;                                  // המרחק של המכונית מהמצלמה
  var LANES = [-0.62, 0, 0.62];
  function resize() { DPR = Math.min(window.devicePixelRatio || 1, 1.5); W = innerWidth; H = innerHeight; cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); cv.style.width = W + 'px'; cv.style.height = H + 'px'; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); }
  window.addEventListener('resize', resize);
  var segs = [], LEN = 0;
  function project(p, cx, cy, cz) { var x = -cx, y = p.y - cy, z = p.z - cz; if (z < 1) z = 1; p.s = DEPTH / z; p.X = W / 2 + p.s * x * W / 2; p.Y = H / 2 - p.s * y * H / 2; p.Wd = p.s * ROAD_W * W / 2; }
  function laneOf(x) { return x < -.31 ? -1 : x > .31 ? 1 : 0; }

  /* ================= פרק 3 — בניית מסלול ================= */
  var T = null, G = null, CAR = null;   // T = מסלול, G = מצב סבב, CAR = המכונית הנבחרת
  function build(trk, seed) {
    var R = rng(seed), n = 2400; segs = [];
    for (var i = 0; i < n; i++) {
      var c = Math.sin(i / 90) * 2.2 * trk.curve + Math.sin(i / 37 + 1) * 1.1 * trk.curve; if (i < 60) c = 0;
      var y = Math.sin(i / 55) * 800 * trk.hills + Math.sin(i / 23) * 220 * trk.hills;
      segs.push({ i: i, curve: c, p1: { y: 0, z: i * SEG }, p2: { y: 0, z: (i + 1) * SEG }, dark: ((i / RUMBLE) | 0) % 2, side: [], ents: [], _y: y });
    }
    for (i = 0; i < n; i++) { segs[i].p1.y = segs[i]._y; segs[i].p2.y = segs[(i + 1) % n]._y; }
    LEN = n * SEG;
    /* נוף בצדי הדרך + תמרורים (sign) שמלמדים כשעוברים לידם */
    for (i = 12; i < n; i += 3) { if (R() < .72) segs[i].side.push({ e: trk.scenery[(R() * trk.scenery.length) | 0], off: (R() < .5 ? -1 : 1) * (1.4 + R() * 1.5), sz: 520 + R() * 560 }); }
    for (i = 150; i < n - 60; i += 330 + ((R() * 120) | 0)) { var sg = D.SIGNS[(R() * (D.SIGNS.length - 1)) | 0]; segs[i].side.push({ sign: sg[0], off: 1.25, sz: 420 }); segs[i].ents.push({ k: 'signpass', sign: sg, lane: -1 }); }
    /* אירועים כל ~20 מקטעים; שער למידה כל ~380; רמזור כל ~600 (אם במסלול); דלק כל ~450 */
    for (i = 80; i < n - 40; i += 16 + ((R() * 12) | 0)) {
      if (i % 380 < 28 && i > 200) { gate(i, R); i += 44; continue; }
      if (trk.lights && i % 600 < 28 && i > 300) { segs[Math.max(0, i - 70)].ents.push({ k: 'lightask', lane: -1 }); segs[i].ents.push({ k: 'light', lane: -1 }); i += 50; continue; }
      if (trk.fuel && i % 450 < 28 && i > 150) { var fl = (R() * 3) | 0; segs[i].ents.push({ k: 'item', e: '⛽', lane: fl }); segs[i].side.push({ sign: 'fuel', off: 1.25, sz: 420 }); continue; }
      var r = R();
      if (r < .30) { var cn = 1 + ((R() * 5) | 0), ln = (R() * 3) | 0; for (var k = 0; k < cn; k++) segs[i + k * 2].ents.push({ k: 'cone', lane: ln, grp: i, n: cn, idx: k }); i += cn * 2; }
      else if (r < .42) segs[i].ents.push({ k: 'oil', lane: (R() * 3) | 0 });
      else if (r < .58) { var v = D.VEHICLES[(R() * 6) | 0]; segs[i].ents.push({ k: 'car', lane: (R() * 3) | 0, v: v, rel: .45 + R() * .25 }); }
      else if (r < .64) segs[i].ents.push({ k: 'puddle', lane: (R() * 3) | 0 });
      else if (r < .86) { var l2 = (R() * 3) | 0, kind = R() < .55 ? '⭐' : '🪙'; for (k = 0; k < 5; k++) segs[i + k * 2].ents.push({ k: 'item', e: kind, lane: l2 }); i += 8; }
      else segs[i].ents.push({ k: 'boost', lane: -1 });
    }
  }
  /* gate — שער למידה: 3 קשתות בנתיבים; השאלה מוקראת 60 מקטעים לפני */
  function gate(i, R) {
    var type = ['color', 'vehicle', 'count', 'math'][(R() * 4) | 0], opts = [], ans = (R() * 3) | 0, q;
    if (type === 'color') { var cs = D.COLORS.slice(0, 6).sort(function () { return R() - .5; }).slice(0, 3); cs.forEach(function (c) { opts.push({ col: c[1], label: '' }); }); q = { type: type, en: D.colorLine(cs[ans][0]), word: cs[ans][0], he: 'נוסעים לשער ה' + cs[ans][2] + '!', heAns: cs[ans][2], emo: '🎨' }; }
    else if (type === 'vehicle') { var vs = D.VEHICLES.slice().sort(function () { return R() - .5; }).slice(0, 3); vs.forEach(function (x) { opts.push({ col: '#ffffff', label: x[1] }); }); q = { type: type, en: D.vehicleLine(vs[ans][0]), word: vs[ans][0], he: 'איפה ה' + vs[ans][2] + '?', heAns: vs[ans][2], emo: vs[ans][1] }; }
    else if (type === 'count') { var cnt = 1 + ((R() * 5) | 0), set = [cnt]; while (set.length < 3) { var w = 1 + ((R() * 6) | 0); if (set.indexOf(w) < 0) set.push(w); } set.sort(function () { return R() - .5; }); ans = set.indexOf(cnt); set.forEach(function (x) { opts.push({ col: '#fff3b0', label: String(x) }); }); q = { type: type, en: D.COUNT_LINE, he: 'כמה קונוסים יש בדרך? סופרים!', heAns: String(cnt), cnt: cnt, emo: '🔶' };
      for (var k = 0; k < cnt; k++) segs[i - 40 + k * 4].ents.push({ k: 'countcone', lane: 1, idx: k }); }
    else {
      var big = grade() === 'big', a = 1 + ((R() * (big ? 12 : 5)) | 0), b = 1 + ((R() * (big ? 8 : 4)) | 0), minus = big && R() < .4 && a > b, v = minus ? a - b : a + b, st = [v];
      while (st.length < 3) { var w2 = Math.max(0, v + ((R() * 7) | 0) - 3); if (st.indexOf(w2) < 0) st.push(w2); }
      st.sort(function () { return R() - .5; }); ans = st.indexOf(v); st.forEach(function (x) { opts.push({ col: '#fff3b0', label: String(x) }); });
      q = { type: type, he: a + (minus ? ' פחות ' : ' ועוד ') + b + ' — כמה זה?', show: a + (minus ? ' − ' : ' + ') + b + ' = ?', heAns: String(v), emo: '🔢' };
    }
    segs[i].ents.push({ k: 'gate', lane: -1, opts: opts, ans: ans, q: q });
    segs[Math.max(0, i - (type === 'count' ? 70 : 60))].ents.push({ k: 'ask', q: q, lane: -1 });
  }

  /* ================= פרק 4 — ספרייטים ================= */
  var SPR = {};
  function spr(e) { if (SPR[e]) return SPR[e]; var c = document.createElement('canvas'); c.width = c.height = 128; var x = c.getContext('2d'); x.font = '104px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e, 64, 72); return (SPR[e] = c); }
  var SIGN_IMG = {};
  function signImg(k) { if (SIGN_IMG[k]) return SIGN_IMG[k]; var im = new Image(), svg = SIGN_SVG[k]; im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace('<svg ', '<svg width="200" height="200" ')); SIGN_IMG[k] = im; return im; }
  /* ציורי התמרורים לצד הדרך (אותם ציורים כמו ב-learn-fx, בלי טקסט ארוך) */
  var SIGN_SVG = {
    stop: '<svg viewBox="0 0 120 200" xmlns="http://www.w3.org/2000/svg"><rect x="55" y="110" width="10" height="90" fill="#8a8a9a" stroke="#101e36" stroke-width="4"/><polygon points="35,4 85,4 116,35 116,85 85,116 35,116 4,85 4,35" fill="#e0162b" stroke="#101e36" stroke-width="6"/><text x="60" y="74" text-anchor="middle" font-family="Arial" font-weight="900" font-size="32" fill="#fff">STOP</text></svg>',
    crosswalk: '<svg viewBox="0 0 120 200" xmlns="http://www.w3.org/2000/svg"><rect x="55" y="110" width="10" height="90" fill="#8a8a9a" stroke="#101e36" stroke-width="4"/><rect x="6" y="6" width="108" height="108" rx="12" fill="#2f6bff" stroke="#101e36" stroke-width="6"/><polygon points="60,10 110,60 60,110 10,60" fill="#fff"/><g fill="#101e36"><rect x="30" y="76" width="60" height="6"/><rect x="36" y="86" width="48" height="6"/></g><circle cx="62" cy="38" r="8" fill="#101e36"/><path d="M62 46 L62 66 L54 80 M62 66 L72 80 M50 56 L62 50 L76 58" stroke="#101e36" stroke-width="6" fill="none"/></svg>',
    school: '<svg viewBox="0 0 120 200" xmlns="http://www.w3.org/2000/svg"><rect x="55" y="110" width="10" height="90" fill="#8a8a9a" stroke="#101e36" stroke-width="4"/><polygon points="60,6 114,110 6,110" fill="#ffd93c" stroke="#101e36" stroke-width="6"/><circle cx="48" cy="58" r="7" fill="#101e36"/><circle cx="72" cy="54" r="7" fill="#101e36"/><path d="M48 66 L48 92 M72 62 L72 92" stroke="#101e36" stroke-width="6"/></svg>',
    fuel: '<svg viewBox="0 0 120 200" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="40" width="80" height="160" rx="12" fill="#2fb85a" stroke="#101e36" stroke-width="6"/><rect x="32" y="56" width="56" height="40" rx="6" fill="#fff" stroke="#101e36" stroke-width="4"/><text x="60" y="160" text-anchor="middle" font-family="Arial" font-weight="900" font-size="40">⛽</text></svg>'
  };

  /* ================= פרק 5 — שליטה ================= */
  var input = { dragX: null, startX: 0, startY: 0, t0: 0, baseX: 0, tilt: null, held: {}, brake: false, wheel: null };
  function ctl() { return S.ctl; }
  /* 5.1 גרירה על הקנבס (מצב drag) — וגם במצב הגה/חיצים: הקשה מהירה בצד = מעבר נתיב */
  cv.addEventListener('pointerdown', function (e) { if (!G || !G.run) return; input.dragX = e.clientX; input.startX = e.clientX; input.startY = e.clientY; input.t0 = performance.now(); input.baseX = G.tx; });
  window.addEventListener('pointermove', function (e) { if (input.dragX == null || !G || ctl() !== 'drag') return; G.tx = Math.max(-1, Math.min(1, input.baseX + (e.clientX - input.startX) / (W * .32))); });
  window.addEventListener('pointerup', function (e) {
    if (input.dragX == null || !G) return;
    var dy = e.clientY - input.startY, dx = e.clientX - input.startX, dt = performance.now() - input.t0; input.dragX = null;
    if (dt < 450 && dy < -60 && Math.abs(dy) > Math.abs(dx)) useBoost();
    else if (dt < 450 && dy > 60 && Math.abs(dy) > Math.abs(dx)) { G.slow = 1; sayEn('Brake!'); }
    else if (dt < 220 && Math.abs(dx) < 12 && Math.abs(dy) < 12 && ctl() === 'drag') { var lane = e.clientX < W / 2 ? -1 : 1; G.tx = Math.max(-1, Math.min(1, laneOf(G.tx) + lane)) * LANES[2]; }
  });
  /* 5.2 מקלדת */
  window.addEventListener('keydown', function (e) {
    if (!G || !G.run) return;
    if (e.key === 'ArrowLeft') input.held.left = 1; if (e.key === 'ArrowRight') input.held.right = 1;
    if (e.key === 'ArrowUp' || e.key === ' ') useBoost(); if (e.key === 'ArrowDown') input.brake = true;
  });
  window.addEventListener('keyup', function (e) { if (e.key === 'ArrowLeft') delete input.held.left; if (e.key === 'ArrowRight') delete input.held.right; if (e.key === 'ArrowDown') input.brake = false; });
  /* 5.3 לוח חיצים: ⬅️➡️ החזקה = פנייה רציפה (PAD_RATE), הקשה = מעבר נתיב · ⬆️ טורבו · ⬇️ ברקס (מחזיקים) */
  var PAD_RATE = 2.4;
  function padStep(dt) { if (!G || !G.run) return; var dir = (input.held.right ? 1 : 0) - (input.held.left ? 1 : 0); if (dir) G.tx = Math.max(-1, Math.min(1, G.tx + dir * PAD_RATE * dt)); }
  function bindPad() {
    document.querySelectorAll('#pad .pk').forEach(function (b) {
      var k = b.dataset.k;
      b.addEventListener('pointerdown', function (e) {
        e.preventDefault(); e.stopPropagation(); try { b.setPointerCapture(e.pointerId); } catch (x) {} b.classList.add('on'); if (!G || !G.run) return;
        if (k === 'up') useBoost(); else if (k === 'down') input.brake = true;
        else { var dir = k === 'right' ? 1 : -1; input.held[k] = 1; G.tx = Math.max(-1, Math.min(1, laneOf(G.tx) + dir)) * LANES[2]; }
        tap(k === 'up' ? 820 : 600);
      });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) { b.addEventListener(ev, function () { b.classList.remove('on'); if (k === 'down') input.brake = false; else delete input.held[k]; }); });
    });
  }
  /* 5.4 הגה: גוררים סביב מרכז ההגה; הזווית (±120°) = פנייה. כששומטים — ההגה חוזר למרכז בקפיציות */
  var wheelAng = 0, wheelDown = null;
  function wheelCenter() { var r = $('wheel').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
  function bindWheel() {
    var w = $('wheel');
    w.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); try { w.setPointerCapture(e.pointerId); } catch (x) {} var c = wheelCenter(); wheelDown = { a0: Math.atan2(e.clientY - c.y, e.clientX - c.x), base: wheelAng }; tap(500); });
    w.addEventListener('pointermove', function (e) { if (!wheelDown) return; var c = wheelCenter(), a = Math.atan2(e.clientY - c.y, e.clientX - c.x), d = a - wheelDown.a0; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; wheelAng = Math.max(-2.1, Math.min(2.1, wheelDown.base + d)); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) { w.addEventListener(ev, function () { wheelDown = null; }); });
  }
  function wheelStep(dt) {
    if (ctl() !== 'wheel') return;
    if (!wheelDown) wheelAng += (0 - wheelAng) * Math.min(1, dt * 6);                     // חזרה למרכז
    if (G && G.run) G.tx = Math.max(-1, Math.min(1, wheelAng / 2.1));
    $('wheelSvg').style.transform = 'rotate(' + (wheelAng * 180 / Math.PI) + 'deg)';
  }
  /* 5.5 הטיה (באייפד צריך אישור) */
  function enableTilt() {
    function on() { window.addEventListener('deviceorientation', function (e) { if (e.gamma == null) return; var ang = Math.abs(window.orientation) === 90 ? (window.orientation > 0 ? e.beta : -e.beta) : e.gamma; input.tilt = Math.max(-1, Math.min(1, ang / 22)); }); say('מטים את האייפד כדי לפנות'); }
    try { if (window.DeviceOrientationEvent && DeviceOrientationEvent.requestPermission) DeviceOrientationEvent.requestPermission().then(function (s) { if (s === 'granted') on(); }).catch(function () {}); else on(); } catch (e) {}
  }
  /* 5.6 דוושות */
  function bindPedals() {
    var b = $('brake'), t = $('boost');
    b.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); try { b.setPointerCapture(e.pointerId); } catch (x) {} input.brake = true; b.classList.add('on'); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) { b.addEventListener(ev, function () { input.brake = false; b.classList.remove('on'); }); });
    t.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); useBoost(); });
  }
  /* applyCtl — מציג את כלי השליטה של המצב הנבחר */
  var CTLS = [['wheel', '🎡', 'הגה', 'מסובבים את ההגה'], ['pad', '🎮', 'חיצים', 'שמאלה / ימינה / טורבו / ברקס'], ['drag', '👆', 'גרירה', 'גוררים על הכביש'], ['tilt', '📱', 'הטיה', 'מטים את האייפד']];
  function applyCtl() {
    var run = !!(G && G.run), c = ctl();
    $('wheel').classList.toggle('show', run && c === 'wheel'); $('pad').classList.toggle('show', run && c === 'pad'); $('pedals').classList.toggle('show', run && c !== 'pad');
    if (c === 'tilt' && run && input.tilt == null) enableTilt();
  }
  function setCtl(c) { S.ctl = c; save(); applyCtl(); }

  /* ================= פרק 6 — למידה ================= */
  function ask(q) {
    G.q = q; var Q = $('cQ'); Q.className = 'show';
    Q.innerHTML = q.type === 'math' ? '<b dir="ltr">' + q.show + '</b>' : q.type === 'count' ? '🔶 <b dir="ltr">' + q.en + '</b>' : (q.type === 'color' ? '🎨 ' : '🔎 ') + '<b dir="ltr">' + q.en + '</b>';
    G.slowFor = 3.4;
    if (q.type === 'math') say(q.he); else if (q.type === 'count') { sayEn(q.en); setTimeout(function () { say(q.he); }, 1500); G.counting = 0; } else teach(q.en, q.he);
  }
  function passGate(ent) {
    var lane = laneOf(G.x) + 1, ok = lane === ent.ans, q = ent.q, L = LF();
    $('cQ').className = ''; G.q = null; G.gates++;
    if (ok) {
      G.stars += 3; G.good++; pop('✔ נכון! +3⭐', '#3ff2b0'); snd('unlock'); try { HeroRewards.award(1, $('cHud'), { word: 'נכון!' }); } catch (e) {}
      if (q.type === 'math' || q.type === 'count') { say('נכון! ' + q.heAns + '!'); if (L) L.count(+q.heAns, q.type === 'count' ? { what: 'cones' } : {}); }
      else { if (L) L.word(q.word, q.heAns, q.emo, { pre: 'נכון!', tag: '🇬🇧 למדנו!' }); else teach(q.word, 'נכון! ' + q.heAns); learned(q.word, q.heAns); }
    } else {
      pop('כמעט! התשובה: ' + q.heAns, '#ffc27a'); tap(260);
      if (q.type === 'math' || q.type === 'count') { say('כמעט! התשובה היא ' + q.heAns); if (L) L.count(+q.heAns, {}); }
      else { if (L) L.word(q.word, q.heAns, q.emo, { pre: 'כמעט! זה', tag: '🇬🇧 נזכור לפעם הבאה' }); else teach(q.word, 'כמעט! זה ה' + q.heAns); learned(q.word, q.heAns); }
    }
    track('answer'); try { Progress.recordAnswer('cars', ok); } catch (e) {}
  }
  function learned(en, he) { G.learned[en] = he; S.words[en] = he; save(); }
  /* רמזור: אדום 2.2 שניות (צריך להחזיק ברקס לפחות 1.1 שניות מצטבר) → צהוב 0.8 → ירוק. בלי פסילה — רק הסבר */
  function lightStart() {
    G.light = { phase: 'red', t: 0, braked: 0, done: false }; var Q = $('cQ'); Q.className = 'show red'; Q.innerHTML = '🔴 אדום! ברקס 🛑';
    sayEn(D.LIGHT.red); try { LF().sign('red', { quiet: true, life: 2.4 }); } catch (e) {}
  }
  function lightStep(dt) {
    var L = G.light; if (!L) return; L.t += dt;
    if (L.phase === 'red') { if (input.brake || G.slow > 0) L.braked += dt; if (L.t > 2.2) { L.phase = 'yellow'; L.t = 0; $('cQ').className = 'show'; $('cQ').innerHTML = '🟡 מתכוננים…'; sayEn(D.LIGHT.yellow); } }
    else if (L.phase === 'yellow') { if (L.t > .8) { L.phase = 'green'; L.t = 0; $('cQ').className = 'show green'; $('cQ').innerHTML = '🟢 ירוק! GO!'; sayEn(D.LIGHT.green); try { LF().sign('green', { quiet: true, life: 1.6 }); } catch (e) {}
        if (L.braked >= 1.1) { G.stars += 3; G.stops++; pop('🚦 עצרנו באדום! +3⭐', '#3ff2b0'); snd('happy'); say('כל הכבוד! אדום עוצרים, ירוק נוסעים!'); } else { pop('אדום = עוצרים! בפעם הבאה 🛑', '#ffc27a'); say('ברמזור אדום עוצרים ומחכים לירוק. בפעם הבאה לוחצים על הברקס!'); } } }
    else if (L.t > 1.4) { G.light = null; $('cQ').className = ''; }
  }
  /* תמרור בצד הדרך: כרטיס קטן + קול (כל סוג פעם אחת בסבב) */
  function signPass(sg) { if (G.signs[sg[0]]) return; G.signs[sg[0]] = 1; try { LF().sign(sg[0], { life: 3 }); } catch (e) { teach(sg[1], sg[2]); } learned(sg[1].replace('!', ''), sg[2].split(' — ')[0]); }
  /* עקיפת מכונית: לומדים את שם כלי הרכב (לא יותר מפעם ב-12 שניות) */
  function overtake(v) { if (G.time - G.lastWord < 12) return; G.lastWord = G.time; try { LF().word(v[0], v[2], v[1], { tag: '🇬🇧 עקפנו!', pos: 'bottom' }); } catch (e) { teach(v[0], v[2]); } learned(v[0], v[2]); }
  /* תחנת דלק: ממלאים + "הידעת?" בטיחות (לא יותר מפעם ב-20 שניות) */
  function refuel() { G.fuel = Math.min(100, G.fuel + 40); G.fuels++; pop('⛽ מלא! Fill up!', '#3ff2b0'); snd('ding'); sayEn('Fill up!'); if (G.time - G.lastFact > 20) { G.lastFact = G.time; var f = D.SAFETY[(G.factI++) % D.SAFETY.length]; setTimeout(function () { try { LF().fact('הידעת? ' + f[1], f[2], f[0], { life: 6, pos: 'top' }); } catch (e) {} }, 1200); } }

  /* ================= פרק 7 — קול ================= */
  var AC = null, eng = null;
  function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (AC && AC.state === 'suspended') AC.resume(); return AC; }
  /* engine — מנוע: אוסילטור sawtooth + מסנן; התדר עולה עם המהירות, הטורבו מוסיף "שריקה" */
  function engineStart() { var a = ac(); if (!a || eng) return; var o = a.createOscillator(), o2 = a.createOscillator(), f = a.createBiquadFilter(), g = a.createGain(); o.type = 'sawtooth'; o2.type = 'square'; f.type = 'lowpass'; f.frequency.value = 400; g.gain.value = 0; o.connect(f); o2.connect(f); f.connect(g); g.connect(a.destination); o.start(); o2.start(); eng = { o: o, o2: o2, f: f, g: g }; }
  function engineStep() { if (!eng) return; var on = G && G.run && !muted(), sp = G ? G.speed : 0; var fr = 55 + sp / 45 + (G && G.boost > 0 ? 60 : 0); eng.o.frequency.setTargetAtTime(fr, AC.currentTime, .08); eng.o2.frequency.setTargetAtTime(fr / 2, AC.currentTime, .08); eng.f.frequency.setTargetAtTime(300 + sp / 6, AC.currentTime, .1); eng.g.gain.setTargetAtTime(on ? .035 + Math.min(.03, sp / 200000) : 0, AC.currentTime, .15); }
  function skid() { var a = ac(); if (!a || muted()) return; var len = .3, buf = a.createBuffer(1, a.sampleRate * len, a.sampleRate), d = buf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 1.5); var s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); s.buffer = buf; f.type = 'bandpass'; f.frequency.value = 2200; f.Q.value = 2; g.gain.value = .18; s.connect(f); f.connect(g); g.connect(a.destination); s.start(); }
  function horn() { var a = ac(); if (!a || muted()) return; [440, 554].forEach(function (fr) { var o = a.createOscillator(), g = a.createGain(), t = a.currentTime; o.type = 'square'; o.frequency.value = fr; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.06, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + .35); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + .4); }); }
  function whoosh() { var a = ac(); if (!a || muted()) return; var o = a.createOscillator(), g = a.createGain(), t = a.currentTime; o.type = 'sine'; o.frequency.setValueAtTime(200, t); o.frequency.exponentialRampToValueAtTime(1600, t + .5); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.12, t + .1); g.gain.exponentialRampToValueAtTime(.0001, t + .6); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + .65); }

  /* ================= פרק 8 — לולאת משחק ================= */
  function newRound(ti) {
    T = D.TRACKS[ti]; CAR = carOf(S.car);
    var wk = weekId(), seed = T.contest ? wk.split('-').reduce(function (a, b) { return a * 131 + +b; }, 7) : (Math.random() * 1e9) | 0;
    build(T, seed);
    G = { ti: ti, run: true, pos: 0, speed: 0, x: 0, tx: 0, time: 0, stars: 0, coins: 0, gates: 0, good: 0, stops: 0, clean: 0, hits: 0, boosts: 0, fuels: 0, q: null, slow: 0, slowFor: 0, spin: 0, shake: 0, flash: 0,
      boost: 0, boostE: 40, fuel: 100, light: null, signs: {}, learned: {}, lastWord: -99, lastFact: -99, factI: (Math.random() * 9) | 0, fx: [], pops: [], sky: 0, wheelRot: 0, lastSeg: -1, counting: 0, combo: 0, lastClean: -9, puff: 0 };
    ['startScreen', 'endScreen', 'pauseScreen'].forEach(function (id) { $(id).classList.remove('show'); });
    $('cQ').className = ''; wheelAng = 0; input.held = {}; input.brake = false; applyCtl(); hud();
    try { TapFX.set('light'); } catch (e) {}
    say(T.name + '! ' + CTLS.filter(function (c) { return c[0] === S.ctl; })[0][3] + '. יאללה, ' + kidName() + '!');
    engineStart(); sayEn('Vroom!'); last = performance.now();
  }
  var last = 0;
  function loop(now) { requestAnimationFrame(loop); var dt = Math.min(.05, (now - last) / 1000); last = now; wheelStep(dt); if (G && G.run) update(dt); if (G) render(dt); engineStep(); }
  function update(dt) {
    G.time += dt;
    /* מהירות: עולה לאורך הסבב; האטה ליד שערים, בברקס, בהחלקה; טורבו מכפיל; בלי דלק — זוחלים */
    var target = (3000 + Math.min(1, G.time / 25) * 2600 + (T.fast ? 700 : 0)) * CAR.speed;
    if (G.slowFor > 0) { G.slowFor -= dt; target *= .6; }
    if (G.slow > 0) { G.slow -= dt; target *= .5; }
    if (G.spin > 0) { G.spin -= dt; target *= .45; }
    if (G.boost > 0) { G.boost -= dt; target *= 1.55; G.fuel -= dt * 2; }
    if (input.brake) target *= .12;
    if (G.fuel <= 0) { G.fuel = 0; target *= .35; if (!G.noFuelSaid) { G.noFuelSaid = true; pop('⛽ אין דלק! אוספים דלק בדרך', '#ffc27a'); say('הדלק נגמר! נוסעים לאט עד שאוספים דלק'); } } else G.noFuelSaid = false;
    G.speed += (target - G.speed) * Math.min(1, dt * (input.brake ? 4 : 1.6));
    G.pos = (G.pos + G.speed * dt) % LEN;
    G.fuel = Math.max(0, G.fuel - dt * 1.1);
    G.boostE = Math.min(100, G.boostE + dt * 4);
    /* פנייה לפי אמצעי השליטה; העיקול דוחף מעט החוצה; שלג מחליק יותר */
    if (ctl() === 'tilt' && input.tilt != null && input.dragX == null) G.tx = input.tilt;
    padStep(dt);
    var ease = T.slippery ? 4 : 7; G.x += (G.tx - G.x) * Math.min(1, dt * ease);
    var seg = segs[Math.floor((G.pos + PZ) / SEG) % segs.length];
    G.x -= seg.curve * G.speed / 12000 * dt * .35; G.x = Math.max(-1.1, Math.min(1.1, G.x));
    G.sky += seg.curve * G.speed * dt * .00002;
    G.wheelRot += G.speed * dt / 60;
    if (G.shake > 0) G.shake -= dt; if (G.flash > 0) G.flash -= dt;
    lightStep(dt);
    /* התנגשויות: כל מקטע שחצינו מאז הפריים הקודם */
    var ps = Math.floor((G.pos + PZ) / SEG); if (G.lastSeg < 0) G.lastSeg = ps;
    while (G.lastSeg !== ps) { G.lastSeg = (G.lastSeg + 1) % segs.length; hitSeg(segs[G.lastSeg]); }
    /* אפקטים */
    G.fx.forEach(function (f) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 900 * dt; f.life -= dt; }); G.fx = G.fx.filter(function (f) { return f.life > 0; });
    G.pops.forEach(function (p) { p.t += dt; }); G.pops = G.pops.filter(function (p) { return p.t < 1.4; });
    bursts.forEach(function (b) { b.t += dt; }); bursts = bursts.filter(function (b) { return b.t < b.life; });
    if (G.time >= ROUND) finish();
    hud();
  }
  function hitSeg(s) {
    s.ents.forEach(function (e) {
      if (e.done) return;
      var lane = laneOf(G.x);
      if (e.k === 'ask') { e.done = 1; ask(e.q); return; }
      if (e.k === 'gate') { e.done = 1; passGate(e); return; }
      if (e.k === 'lightask') { e.done = 1; G.slowFor = 2; pop('🚦 רמזור לפנינו — מתכוננים לברקס', '#fff'); say('רמזור לפנינו! כשהוא אדום — לוחצים על הברקס'); return; }
      if (e.k === 'light') { e.done = 1; lightStart(); return; }
      if (e.k === 'boost') { e.done = 1; G.boost = 1.6; G.boosts++; G.stars += 1; pop('⚡ BOOST! +1⭐', '#7ef0ff'); whoosh(); sayEn('Boost!'); return; }
      if (e.k === 'signpass') { e.done = 1; signPass(e.sign); return; }
      if (e.k === 'countcone') { e.done = 1; G.counting++; try { LF().count(G.counting, { what: G.counting === 1 ? 'cone' : 'cones' }); } catch (x) {} return; }
      if (e.k === 'item') { if (lane !== e.lane - 1) return; e.done = 1; collect(e.e); return; }
      if (e.k === 'car') { e.done = 1; if (lane === e.lane - 1 && G.boost <= 0) bump('car'); else overtake(e.v); return; }
      /* מכשולים בנתיב */
      if (lane === e.lane - 1) { e.done = 1; if (G.boost > 0 && e.k === 'cone') { G.fx.push({ x: W / 2, y: H * .8, vx: (Math.random() - .5) * 600, vy: -700, e: '🔶', life: .9 }); return; } bump(e.k); }
      else if (e.k === 'cone') { e.done = 1; G.clean++; if (G.clean % 3 === 0) { G.stars += 1; pop('🔶 עקיפה נקייה ×3! +1⭐', '#fff'); snd('ding'); } }
    });
  }
  function collect(e) {
    if (e === '⭐') { G.stars++; snd('sparkle'); } else if (e === '🪙') { G.coins++; snd('ding'); } else if (e === '⛽') { refuel(); }
    G.fx.push({ x: W / 2 + (G.x * W * .18), y: H * .62, vx: (Math.random() - .5) * 200, vy: -500, e: e, life: .8 });
  }
  var OOPS = { cone: ['SCREECH!', 'אופס! קונוס — עוקפים לנתיב אחר'], oil: ['WHOA!', 'שמן! המכונית מחליקה… מחזיקים את ההגה'], car: ['BEEP!', 'ביפ ביפ! מכונית לפנינו — עוקפים בנתיב פנוי'], puddle: ['SPLASH!', 'שלולית! בכביש רטוב נוסעים לאט'] };
  function bump(k) {
    G.hits++; G.shake = .4; G.combo = 0; var o = OOPS[k] || ['OOPS!', 'אופס!'];
    if (k === 'oil') { G.spin = 1; G.slow = .8; skid(); } else if (k === 'car') { G.slow = .9; horn(); } else if (k === 'puddle') { G.slow = .4; snd('bubble'); for (var i = 0; i < 14; i++) G.fx.push({ x: W / 2, y: H * .8, vx: (Math.random() - .5) * 500, vy: -400 - Math.random() * 400, e: '💧', life: .9 }); } else { G.slow = .7; skid(); }
    burst(o[0], W / 2 + (Math.random() - .5) * 120, H * .45); pop(o[1], '#ffc27a');
    if (G.hits <= 2 || k === 'oil') say(o[1]);
  }
  function useBoost() { if (!G || !G.run || G.boost > 0 || G.boostE < 50) { if (G && G.run && G.boostE < 50) { pop('⚡ הטורבו נטען…', '#9fe0ff'); tap(300); } return; } G.boostE -= 50; G.boost = 1.6; G.boosts++; whoosh(); sayEn('Turbo!'); G.flash = .25; }
  function pop(t, col) { G.pops.push({ t: 0, txt: t, col: col || '#fff' }); }
  /* פיצוצי SFX על הקנבס (כוכב משונן עם דיו — כמו בחווה) */
  var bursts = [], SFX_COL = ['#ffe14a', '#ff5ca8', '#29e0ff', '#3ff2b0', '#ff9f1c', '#b18cff'];
  function burst(txt, x, y) { if (!txt) return; bursts.push({ txt: txt, x: x, y: y, col: SFX_COL[(bursts.length + txt.length) % SFX_COL.length], t: 0, life: 1.1, rot: (Math.random() - .6) * .3, spk: 12 + (txt.length % 4) }); if (bursts.length > 4) bursts.shift(); }
  function drawBursts(c) {
    bursts.forEach(function (b) {
      var p = b.t / b.life, sc = b.t < .14 ? (b.t / .14) * 1.2 : b.t < .26 ? 1.2 - (b.t - .14) / .12 * .2 : 1, a = p > .72 ? (1 - p) / .28 : 1;
      c.save(); c.translate(b.x, b.y - p * 30); c.rotate(b.rot); c.scale(sc, sc); c.globalAlpha = Math.max(0, a);
      c.font = 'italic 900 ' + Math.round(Math.min(W, H) * .06) + 'px ' + FONT; var w = Math.max(80, c.measureText(b.txt).width * .62 + 40), hgt = w * .6;
      [[8, 9, INK], [0, 0, b.col]].forEach(function (L) { c.beginPath(); for (var i = 0; i <= b.spk * 2; i++) { var an = i / (b.spk * 2) * Math.PI * 2, r = i % 2 ? .66 : 1.06 + (i % 4 ? 0 : .12); var px = Math.cos(an) * w * r + L[0], py = Math.sin(an) * hgt * r + L[1]; if (i) c.lineTo(px, py); else c.moveTo(px, py); } c.closePath(); c.fillStyle = L[2]; c.fill(); if (L[2] !== INK) { c.lineWidth = 4; c.strokeStyle = INK; c.stroke(); } });
      c.direction = 'ltr'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 7; c.strokeStyle = INK; c.strokeText(b.txt, 0, 2); c.fillStyle = '#fff'; c.fillText(b.txt, 0, 2);
      c.restore();
    });
  }

  /* ================= פרק 9 — ציור ================= */
  var FONT = '"Rubik","Varela Round","Heebo",sans-serif';
  function render(dt) {
    var tr = T, c = ctx;
    c.save();
    if (G.shake > 0) c.translate((Math.random() - .5) * 14, (Math.random() - .5) * 10);
    /* שמיים */
    var g = c.createLinearGradient(0, 0, 0, H * .62); g.addColorStop(0, tr.sky[0]); g.addColorStop(.6, tr.sky[1]); g.addColorStop(1, tr.sky[2]); c.fillStyle = g; c.fillRect(-W, -H, W * 3, H * 3);
    if (tr.night) { c.fillStyle = '#fff'; for (var i = 0; i < 70; i++) { var sx = (i * 137.5 - G.sky * 300) % (W + 40), sy = (i * 71.3) % (H * .45); c.globalAlpha = .4 + .6 * Math.abs(Math.sin(G.time * 2 + i)); c.fillRect(sx < 0 ? sx + W + 40 : sx, sy, 2.2, 2.2); } c.globalAlpha = 1; c.fillStyle = '#fff6c8'; c.beginPath(); c.arc(W * .75 - G.sky * 300 % W, H * .16, Math.min(W, H) * .05, 0, 7); c.fill(); }
    else { c.fillStyle = tr.id === 'desert' ? '#fff3a0' : tr.snow ? '#ffffff' : '#fff3a0'; c.beginPath(); c.arc(W * .78 - G.sky * 400 % W, H * .18, Math.min(W, H) * .06, 0, 7); c.fill(); }
    /* רקע: בניינים בעיר / גבעות בשטח — שתי שכבות פרלקסה */
    if (tr.id === 'city' || tr.night) { skyline(c, H * .56, tr.night ? '#1a1a3a' : '#8a93b8', .6, G.sky * 300, tr.night); skyline(c, H * .58, tr.night ? '#2a2a4e' : '#6b7496', 1, G.sky * 600, tr.night); }
    else { hills(c, H * .5, H * .1, tr.side[1], .6, G.sky * 300); hills(c, H * .55, H * .07, tr.side[0], 1, G.sky * 600); }
    /* הדרך: הטלה מקרוב לרחוק, ציור מרחוק לקרוב */
    var base = Math.floor(G.pos / SEG), pct = (G.pos % SEG) / SEG, bs = segs[base % segs.length];
    var py = bs.p1.y + (bs.p2.y - bs.p1.y) * pct, camY = CAM_H + py;
    var x = 0, dx = -(bs.curve * pct), list = [];
    for (var n = 0; n < DRAW; n++) { var s = segs[(base + n) % segs.length], loop = s.i < base ? LEN : 0; project(s.p1, G.x * ROAD_W - x, camY, G.pos - loop); project(s.p2, G.x * ROAD_W - x - dx, camY, G.pos - loop); x += dx; dx += s.curve; if (s.p1.z - (G.pos - loop) <= PZ * .2) continue; list.push(s); }
    var fog = tr.night ? '#0b1a4a' : tr.sky[2];
    for (var j = list.length - 1; j >= 0; j--) {
      s = list[j]; var p1 = s.p1, p2 = s.p2;
      c.fillStyle = s.dark ? tr.side[1] : tr.side[0]; c.fillRect(-W, p2.Y, W * 3, p1.Y - p2.Y + 1);
      quad(c, p1.X, p1.Y, p1.Wd * 1.1, p2.X, p2.Y, p2.Wd * 1.1, s.dark ? tr.edge : '#101e36');                       /* אבני שפה */
      quad(c, p1.X, p1.Y, p1.Wd, p2.X, p2.Y, p2.Wd, s.dark ? tr.road[0] : tr.road[1]);
      if (s.dark) { var lw1 = p1.Wd / 80, lw2 = p2.Wd / 80; [-.33, .33].forEach(function (L) { quad(c, p1.X + p1.Wd * L, p1.Y, lw1, p2.X + p2.Wd * L, p2.Y, lw2, 'rgba(255,255,255,.8)'); }); }   /* פסי נתיב דקים בגבולות הנתיבים (±0.33) */   /* פסי נתיב מקווקווים */
      var fogA = Math.min(.85, j / DRAW * 1.1); if (fogA > .05) { c.globalAlpha = fogA; c.fillStyle = fog; c.fillRect(-W, p2.Y, W * 3, p1.Y - p2.Y + 1); c.globalAlpha = 1; }
      drawSeg(c, s, fogA);
    }
    /* קווי מהירות בטורבו */
    if (G.boost > 0) { c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 3; for (i = 0; i < 24; i++) { var an = i / 24 * Math.PI * 2 + G.time * 3, r0 = Math.min(W, H) * .25, r1 = Math.max(W, H); c.beginPath(); c.moveTo(W / 2 + Math.cos(an) * r0, H / 2 + Math.sin(an) * r0); c.lineTo(W / 2 + Math.cos(an) * r1, H / 2 + Math.sin(an) * r1); c.stroke(); } }
    G.fx.forEach(function (f) { c.globalAlpha = Math.min(1, f.life * 2); c.drawImage(spr(f.e), f.x - 24, f.y - 24, 48, 48); }); c.globalAlpha = 1;
    if (tr.snow) { c.fillStyle = 'rgba(255,255,255,.85)'; for (var sn = 0; sn < 60; sn++) { var fx2 = (sn * 97 + G.time * 40 * (1 + sn % 3)) % W, fy2 = (sn * 53 + G.time * 90 * (1 + sn % 2)) % H; c.beginPath(); c.arc(fx2, fy2, 2 + sn % 3, 0, 7); c.fill(); } }
    /* המכונית שלנו — מאחור, במרכז-למטה, נוטה בפנייה; מסתובבת על שמן */
    var lean = (G.tx - G.x) * .9 + G.x * .12, cx = W / 2, cy = H * .9, sc = Math.min(W, H) / 560;
    c.save(); c.translate(cx, cy); if (G.spin > 0) c.rotate((1 - G.spin) * Math.PI * 2); c.rotate(lean * .15); c.translate(G.x * W * .02, 0);
    drawCar(c, 0, 0, sc, CAR, lean, G.wheelRot, input.brake, G.boost > 0, tr.night, G.time); c.restore();
    c.restore();
    if (G.flash > 0) { c.fillStyle = 'rgba(200,240,255,' + G.flash + ')'; c.fillRect(0, 0, W, H); }
    if (tr.night) { c.fillStyle = 'rgba(10,8,40,.22)'; c.fillRect(0, 0, W, H); var hl = c.createRadialGradient(W / 2, H * .62, 20, W / 2, H * .62, W * .45); hl.addColorStop(0, 'rgba(255,250,200,.28)'); hl.addColorStop(1, 'rgba(255,250,200,0)'); c.fillStyle = hl; c.fillRect(0, 0, W, H); }   /* פנסים */
    drawBursts(c);
    G.pops.forEach(function (p, i) { var a = 1 - Math.max(0, p.t - 1) / .4, y = H * .3 - p.t * 60 - i * 6; c.globalAlpha = Math.max(0, a); c.font = '900 ' + Math.round(Math.min(W, H) * .045) + 'px ' + FONT; c.textAlign = 'center'; c.lineWidth = 7; c.strokeStyle = INK; c.strokeText(p.txt, W / 2, y); c.fillStyle = p.col; c.fillText(p.txt, W / 2, y); }); c.globalAlpha = 1;
  }
  function quad(c, x1, y1, w1, x2, y2, w2, col) { c.fillStyle = col; c.beginPath(); c.moveTo(x1 - w1, y1); c.lineTo(x2 - w2, y2); c.lineTo(x2 + w2, y2); c.lineTo(x1 + w1, y1); c.closePath(); c.fill(); }
  function hills(c, y, h, col, f, off) { c.fillStyle = col; c.beginPath(); c.moveTo(-W, H); for (var x = -W; x <= W * 2; x += 20) c.lineTo(x, y - Math.abs(Math.sin((x + off) / (180 * f))) * h - Math.sin((x + off) / (70 * f)) * h * .2); c.lineTo(W * 2, H); c.closePath(); c.fill(); }
  /* skyline — קו רקיע של עיר: בניינים בגבהים קבועים (זרע לפי x) עם חלונות דולקים בלילה */
  function skyline(c, yB, col, f, off, nightOn) {
    c.fillStyle = col; var bw = 70;
    for (var x = -bw; x <= W + bw; x += bw) { var wx = Math.floor((x + off * f) / bw), hgt = 40 + ((wx * 7919) % 97) + ((wx * 31) % 3) * 30; var bx = x - ((off * f) % bw); c.fillRect(bx, yB - hgt, bw - 6, hgt + 40);
      if (nightOn) { c.fillStyle = '#ffe08a'; for (var wy = yB - hgt + 10; wy < yB - 10; wy += 16) for (var wxx = bx + 8; wxx < bx + bw - 14; wxx += 14) if (((wx * 13 + wy + wxx) | 0) % 3) c.fillRect(wxx, wy, 6, 8); c.fillStyle = col; } }
  }
  /* drawSeg — ספרייטים של מקטע: נוף, תמרורים, פריטים, מכשולים, פסי טורבו, רמזור, שערים */
  function drawSeg(c, s, fogA) {
    var p = s.p1, scale = p.s * W / 2;
    s.side.forEach(function (o) { var sz = o.sz * scale, x = p.X + p.Wd * o.off; if (sz < 3) return; if (o.sign) { var im = signImg(o.sign); if (im.complete && im.naturalWidth) c.drawImage(im, x - sz * .3, p.Y - sz, sz * .6, sz); } else c.drawImage(spr(o.e), x - sz / 2, p.Y - sz * .92, sz, sz); });
    s.ents.forEach(function (e) {
      if (e.done && e.k !== 'gate' && e.k !== 'boost' && e.k !== 'light') return;
      var roadL = p.X - p.Wd, roadR = p.X + p.Wd, lx = e.lane >= 0 ? p.X + p.Wd * LANES[e.lane] : p.X;
      if (e.k === 'item') { var sz = 330 * scale; c.drawImage(spr(e.e), lx - sz / 2, p.Y - sz * 1.2, sz, sz); return; }
      if (e.k === 'cone' || e.k === 'countcone') { var ch = 300 * scale; c.fillStyle = '#ff7a1c'; c.strokeStyle = INK; c.lineWidth = Math.max(1, 12 * scale); c.beginPath(); c.moveTo(lx - ch * .42, p.Y); c.lineTo(lx - ch * .12, p.Y - ch); c.lineTo(lx + ch * .12, p.Y - ch); c.lineTo(lx + ch * .42, p.Y); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#fff'; c.fillRect(lx - ch * .28, p.Y - ch * .55, ch * .56, ch * .14); c.fillStyle = INK; c.fillRect(lx - ch * .5, p.Y - ch * .06, ch, ch * .08); return; }
      if (e.k === 'oil') { c.fillStyle = '#1b1b2e'; c.beginPath(); c.ellipse(lx, p.Y - 8 * scale, p.Wd * .3, Math.max(3, 90 * scale), 0, 0, 7); c.fill(); c.fillStyle = 'rgba(120,140,255,.4)'; c.beginPath(); c.ellipse(lx - p.Wd * .08, p.Y - 14 * scale, p.Wd * .12, Math.max(2, 30 * scale), 0, 0, 7); c.fill(); return; }
      if (e.k === 'puddle') { c.fillStyle = '#5fb8ff'; c.strokeStyle = '#fff'; c.lineWidth = Math.max(1, 3 * scale * 4); c.beginPath(); c.ellipse(lx, p.Y - 8 * scale, p.Wd * .3, Math.max(3, 70 * scale), 0, 0, 7); c.fill(); c.stroke(); return; }
      if (e.k === 'car') { var vs = 560 * scale; c.drawImage(spr(e.v[1]), lx - vs / 2, p.Y - vs * .95, vs, vs); return; }
      if (e.k === 'boost') { var gr = c.createLinearGradient(roadL, 0, roadR, 0); gr.addColorStop(0, '#29e0ff'); gr.addColorStop(.5, '#7ef0ff'); gr.addColorStop(1, '#29e0ff'); c.fillStyle = gr; c.globalAlpha = e.done ? .3 : .85; c.fillRect(roadL, p.Y - 60 * scale, roadR - roadL, Math.max(3, 70 * scale)); c.globalAlpha = 1; c.fillStyle = '#fff'; for (var k = 0; k < 3; k++) { var ax = roadL + (roadR - roadL) * (k + .5) / 3, ah = 60 * scale; c.beginPath(); c.moveTo(ax - ah * .5, p.Y - ah * .2); c.lineTo(ax, p.Y - ah); c.lineTo(ax + ah * .5, p.Y - ah * .2); c.closePath(); c.fill(); } return; }
      if (e.k === 'light') { var ph = 1300 * scale, pw = Math.max(2, 50 * scale); c.fillStyle = '#5a5a6e'; c.fillRect(roadR + pw, p.Y - ph, pw, ph); c.fillRect(roadL - pw * 2, p.Y - ph, pw, ph); c.fillRect(roadL - pw * 2, p.Y - ph, roadR - roadL + pw * 4, pw * .8);
        var bh = 420 * scale, bw2 = 160 * scale, bx = p.X - bw2 / 2, by = p.Y - ph + pw; c.fillStyle = '#1a1a2e'; c.strokeStyle = INK; c.lineWidth = Math.max(1, 10 * scale); rr(c, bx, by, bw2, bh, bw2 * .2); c.fill(); c.stroke();
        var phase = G.light ? G.light.phase : (e.done ? 'green' : 'red'); [['red', '#ff2e3b'], ['yellow', '#ffd93c'], ['green', '#2fe06a']].forEach(function (L, i) { c.fillStyle = phase === L[0] ? L[1] : '#2a2a3a'; c.beginPath(); c.arc(p.X, by + bh * (.2 + i * .3), bw2 * .3, 0, 7); c.fill(); if (phase === L[0]) { c.globalAlpha = .35; c.beginPath(); c.arc(p.X, by + bh * (.2 + i * .3), bw2 * .5, 0, 7); c.fill(); c.globalAlpha = 1; } }); return; }
      if (e.k === 'gate') { e.opts.forEach(function (o, i) { var gx = p.X + p.Wd * LANES[i], gw = p.Wd * .27, gh = 700 * scale; c.lineWidth = Math.max(2, 40 * scale); c.strokeStyle = INK; c.fillStyle = o.col; rr(c, gx - gw, p.Y - gh, gw * 2, gh * .42, gw * .3); c.fill(); c.stroke(); c.fillRect(gx - gw, p.Y - gh * .6, gw * .18, gh * .6); c.fillRect(gx + gw * .82, p.Y - gh * .6, gw * .18, gh * .6);
          if (o.label) { var fs = gh * .26; if (/\d/.test(o.label)) { c.font = '900 ' + Math.round(fs) + 'px sans-serif'; c.textAlign = 'center'; c.fillStyle = INK; c.fillText(o.label, gx, p.Y - gh * .69); } else c.drawImage(spr(o.label), gx - fs * .6, p.Y - gh * .98, fs * 1.2, fs * 1.2); } }); return; }
    });
  }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  /* drawCar — המכונית מאחור: גלגלים, גוף טרפזי, גג, חלון אחורי, פנסים אחוריים (זוהרים בברקס), פליטה, ותוספות לפי הדגם.
     c = קנבס, (x,y) = מרכז תחתית, k = קנה מידה (1 = 560px מסך), lean = נטייה (-1..1), rot = סיבוב גלגלים, brake, boost, night, t = זמן */
  function drawCar(c, x, y, k, car, lean, rot, brake, boost, night, t) {
    c.save(); c.translate(x, y); c.scale(k, k); c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = INK; c.lineWidth = 6;
    var big = car.kind === 'monster', tall = car.kind === 'fire' || car.kind === 'icecream' || big, bw = 230, bh = tall ? 150 : 110, wr = big ? 54 : 34, wy = big ? -70 : -34;
    /* צל */
    c.fillStyle = 'rgba(16,30,54,.35)'; c.beginPath(); c.ellipse(0, 6, bw * .62, 16, 0, 0, 7); c.fill();
    /* פליטה: עשן (או אש בטורבו) */
    for (var i = 0; i < 4; i++) { var pf = ((t * 3 + i * .25) % 1); c.globalAlpha = (1 - pf) * .5; c.fillStyle = boost ? ['#7ef0ff', '#29e0ff', '#fff'][i % 3] : '#c9c9d9'; c.beginPath(); c.arc(-bw * .32 - pf * 60 * (boost ? 1.6 : 1), -16 + Math.sin(pf * 6) * 6, 8 + pf * (boost ? 14 : 10), 0, 7); c.fill(); } c.globalAlpha = 1;
    /* גלגלים אחוריים */
    [-1, 1].forEach(function (sd) { var wxp = sd * (bw * .44); c.fillStyle = '#1b1b2e'; c.beginPath(); c.arc(wxp, wy, wr, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#c9c9d9'; c.beginPath(); c.arc(wxp, wy, wr * .5, 0, 7); c.fill(); c.strokeStyle = '#8a8a9a'; c.lineWidth = 4; for (var sp = 0; sp < 4; sp++) { var a = rot + sp * Math.PI / 2; c.beginPath(); c.moveTo(wxp, wy); c.lineTo(wxp + Math.cos(a) * wr * .45, wy + Math.sin(a) * wr * .45); c.stroke(); } c.strokeStyle = INK; c.lineWidth = 6; });
    /* גוף (טרפז רחב למטה) */
    c.save(); c.translate(0, wy - wr * .3); c.rotate(-lean * .08);
    c.fillStyle = car.body; c.beginPath(); c.moveTo(-bw / 2, 0); c.lineTo(-bw / 2 + 10, -bh); c.lineTo(bw / 2 - 10, -bh); c.lineTo(bw / 2, 0); c.closePath(); c.fill(); c.stroke();
    /* הברקה כרום */
    var gl = c.createLinearGradient(0, -bh, 0, 0); gl.addColorStop(0, 'rgba(255,255,255,.45)'); gl.addColorStop(.4, 'rgba(255,255,255,.05)'); gl.addColorStop(1, 'rgba(0,0,0,.18)'); c.fillStyle = gl; c.beginPath(); c.moveTo(-bw / 2, 0); c.lineTo(-bw / 2 + 10, -bh); c.lineTo(bw / 2 - 10, -bh); c.lineTo(bw / 2, 0); c.closePath(); c.fill();
    /* פס משני + פגוש */
    c.fillStyle = car.acc; c.fillRect(-bw / 2 + 6, -bh * .42, bw - 12, 14); c.strokeRect(-bw / 2 + 6, -bh * .42, bw - 12, 14);
    c.fillStyle = '#2a2a3a'; rr(c, -bw / 2 + 4, -22, bw - 8, 22, 8); c.fill(); c.stroke();
    /* לוחית רישוי */
    c.fillStyle = '#ffd93c'; rr(c, -34, -20, 68, 18, 4); c.fill(); c.stroke(); c.fillStyle = INK; c.font = '900 12px ' + FONT; c.textAlign = 'center'; c.direction = 'ltr'; c.fillText(kidName().slice(0, 6).toUpperCase(), 0, -6);
    /* פנסים אחוריים — זוהרים בברקס */
    [-1, 1].forEach(function (sd) { var lx = sd * (bw / 2 - 30); if (brake) { c.save(); c.globalAlpha = .45; c.fillStyle = '#ff2e3b'; c.beginPath(); c.arc(lx, -bh * .22, 34, 0, 7); c.fill(); c.restore(); } c.fillStyle = brake ? '#ff5c5c' : '#c40f26'; rr(c, lx - 20, -bh * .3, 40, 18, 6); c.fill(); c.stroke(); });
    /* גג וחלון אחורי */
    var rw = bw * .68, rh = bh * .62; c.fillStyle = car.body; c.beginPath(); c.moveTo(-rw / 2, -bh); c.lineTo(-rw / 2 + 16, -bh - rh); c.lineTo(rw / 2 - 16, -bh - rh); c.lineTo(rw / 2, -bh); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = night ? '#1a2a5a' : '#9fe0ff'; c.beginPath(); c.moveTo(-rw / 2 + 12, -bh - 6); c.lineTo(-rw / 2 + 24, -bh - rh + 10); c.lineTo(rw / 2 - 24, -bh - rh + 10); c.lineTo(rw / 2 - 12, -bh - 6); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.moveTo(-rw / 2 + 20, -bh - 10); c.lineTo(-rw / 2 + 30, -bh - rh + 16); c.lineTo(-rw / 2 + 50, -bh - rh + 16); c.lineTo(-rw / 2 + 36, -bh - 10); c.closePath(); c.fill();
    /* ראש של הנהג/ת בחלון */
    c.fillStyle = '#f2c9a0'; c.beginPath(); c.arc(0, -bh - rh * .45, rh * .22, 0, 7); c.fill(); c.stroke(); c.fillStyle = BOY ? '#3d7bff' : '#ff5ca8'; c.beginPath(); c.arc(0, -bh - rh * .5, rh * .24, Math.PI, 0); c.fill(); c.stroke();
    /* תוספות לפי דגם */
    var top = -bh - rh;
    if (car.kind === 'police') { var on = Math.floor(t * 6) % 2; c.fillStyle = '#2a2a3a'; rr(c, -60, top - 18, 120, 18, 6); c.fill(); c.stroke(); c.fillStyle = on ? '#ff2e3b' : '#7a1a1a'; rr(c, -56, top - 16, 52, 14, 4); c.fill(); c.fillStyle = on ? '#1a3aff' : '#1a1a7a'; rr(c, 4, top - 16, 52, 14, 4); c.fill(); c.save(); c.globalAlpha = .35; c.fillStyle = on ? '#ff2e3b' : '#1a3aff'; c.beginPath(); c.arc(on ? -30 : 30, top - 10, 50, 0, 7); c.fill(); c.restore(); }
    if (car.kind === 'taxi') { c.fillStyle = '#ffd93c'; rr(c, -44, top - 26, 88, 26, 6); c.fill(); c.stroke(); c.fillStyle = INK; c.font = '900 16px ' + FONT; c.fillText('TAXI', 0, top - 7); }
    if (car.kind === 'fire') { c.fillStyle = '#c9c9d9'; rr(c, -rw / 2, top - 14, rw, 14, 4); c.fill(); c.stroke(); c.strokeStyle = '#8a8a9a'; c.lineWidth = 4; for (i = -rw / 2 + 14; i < rw / 2; i += 22) { c.beginPath(); c.moveTo(i, top - 14); c.lineTo(i, top); c.stroke(); } c.strokeStyle = INK; c.lineWidth = 6; c.fillStyle = Math.floor(t * 5) % 2 ? '#ff2e3b' : '#7a1a1a'; c.beginPath(); c.arc(0, top - 26, 12, 0, 7); c.fill(); c.stroke(); }
    if (car.kind === 'race') { c.fillStyle = car.acc; rr(c, -bw / 2 - 10, -bh - 30, bw + 20, 16, 6); c.fill(); c.stroke(); c.fillRect(-bw / 2 + 20, -bh - 14, 12, 14); c.fillRect(bw / 2 - 32, -bh - 14, 12, 14); c.fillStyle = '#fff'; c.font = '900 34px ' + FONT; c.fillText('1', 0, -bh * .55); c.strokeText('1', 0, -bh * .55); }
    if (car.kind === 'sport') { c.fillStyle = INK; rr(c, -bw / 2 + 10, -bh - 20, bw - 20, 12, 5); c.fill(); c.fillRect(-bw / 2 + 30, -bh - 8, 10, 8); c.fillRect(bw / 2 - 40, -bh - 8, 10, 8); }
    if (car.kind === 'monster') { c.fillStyle = '#ffd93c'; for (i = 0; i < 4; i++) { c.beginPath(); c.arc(-45 + i * 30, top - 10, 9, 0, 7); c.fill(); c.stroke(); } c.fillStyle = '#fff'; c.font = '900 26px ' + FONT; c.fillText('ROAR', 0, -bh * .6); c.strokeText('ROAR', 0, -bh * .6); }
    if (car.kind === 'icecream') { c.drawImage(spr('🍦'), -40, top - 80, 80, 80); c.fillStyle = '#fff'; c.font = '900 22px ' + FONT; c.fillText('ICE CREAM', 0, -bh * .6); c.strokeText('ICE CREAM', 0, -bh * .6); }
    c.restore(); c.restore();
  }

  /* ================= פרק 10 — HUD ומסכים ================= */
  function hud() {
    if (!G) return;
    $('hS').firstChild.textContent = '⭐ ' + G.stars; $('hC').firstChild.textContent = '🪙 ' + G.coins;
    $('fuelBar').style.width = G.fuel + '%'; $('hFuel').classList.toggle('low', G.fuel < 25);
    $('cTime').style.width = Math.max(0, 100 - G.time / ROUND * 100) + '%';
    var kmh = Math.round(G.speed / 42), ang = Math.min(170, G.speed / 9000 * 170); $('needle').style.transform = 'rotate(' + ang + 'deg)';   /* המחוג מצויר שמאלה (0 קמ"ש); סיבוב עד 170° = ימינה */ $('kmh').textContent = kmh;
    $('boost').classList.toggle('dim', G.boostE < 50); $('boost').classList.toggle('ready', G.boostE >= 50 && G.boost <= 0);
  }
  var MEDAL = { gold: 30, silver: 17, bronze: 7 };
  function medalOf(st) { return st >= MEDAL.gold ? ['🥇', 'זהב'] : st >= MEDAL.silver ? ['🥈', 'כסף'] : st >= MEDAL.bronze ? ['🥉', 'ארד'] : ['🎗️', 'השתתפות']; }
  function finish() {
    G.run = false; $('cQ').className = ''; applyCtl(); try { TapFX.set('full'); } catch (e) {}
    var st = G.stars, m = medalOf(st), ti = G.ti, unlocked = false;
    S.best[T.id] = Math.max(S.best[T.id] || 0, st); S.rounds++;
    if (st >= MEDAL.bronze && S.tracks === ti + 1 && S.tracks < D.TRACKS.length) { S.tracks++; unlocked = true; }
    save();
    $('cMedal').textContent = m[0]; $('cMedalT').textContent = 'מדליית ' + m[1] + ' · ' + T.name;
    $('eS').textContent = st; $('eG').textContent = G.good + '/' + G.gates; $('eL').textContent = G.stops; $('eO').textContent = G.clean; $('eB').textContent = G.boosts; $('eC').textContent = G.coins;
    var ws = Object.keys(G.learned); $('learned').innerHTML = ws.length ? ws.map(function (w) { return '<span>' + w + ' · ' + G.learned[w] + '</span>'; }).join('') : '<span style="direction:rtl">בפעם הבאה עוברים ליד תמרורים ועוקפים מכוניות 🚗</span>';
    $('endText').textContent = (unlocked ? '🎉 נפתח מסלול חדש: ' + D.TRACKS[ti + 1].name + '! ' : '') + (G.hits ? 'נגענו ב-' + G.hits + ' מכשולים — בפעם הבאה עוקפים מוקדם יותר.' : 'נהיגה נקייה בלי מכשולים! 🏆');
    try { if (window.Wallet) Wallet.add(G.coins + (st >= MEDAL.silver ? 3 : 1)); } catch (e) {}
    try { HeroRewards.award(st >= MEDAL.gold ? 3 : st >= MEDAL.silver ? 2 : 1, $('cHud'), { word: m[1] + '!' }); if (st >= MEDAL.silver) HeroRewards.confetti(); } catch (e) {}
    track('cars:done');
    say('הגענו לקו הסיום! מדליית ' + m[1] + '. ' + st + ' כוכבים!' + (unlocked ? ' נפתח מסלול חדש!' : ''));
    if (T.contest && st >= MEDAL.gold) { var wk = weekId(); if (!S.week[wk] && window.Share) { S.week[wk] = 1; save(); setTimeout(function () { try { Share.award({ key: 'cars:' + wk, line: (BOY ? 'נהג מצטיין' : 'נהגת מצטיינת') + ' — ' + T.name, ico: '🏁' }); } catch (e) {} }, 1800); } }
    $('endScreen').classList.add('show');
  }
  /* --- מסך הפתיחה: מכונית, מסלול, שליטה --- */
  var selTrack = 0, prevT = 0;
  function startScreen() {
    G = null; ['endScreen', 'pauseScreen'].forEach(function (id) { $(id).classList.remove('show'); }); applyCtl(); $('cQ').className = ''; try { TapFX.set('full'); } catch (e) {}
    var cars = $('cars'); cars.innerHTML = '';
    D.CARS.forEach(function (car) {
      var own = S.own.indexOf(car.id) >= 0, b = el('button', 'cc' + (car.id === S.car ? ' sel' : '') + (own ? '' : ' locked'), '<span class="ci">' + car.ico + '</span>' + car.name + (own ? '' : '<small>🔒 ' + car.cost + ' 🪙</small>')); b.type = 'button';
      b.addEventListener('click', function () {
        tap(600);
        if (!own) { var have = 0; try { have = Wallet.coins; } catch (e) {} if (have < car.cost || !Wallet.spend(car.cost)) { say('צריך עוד ' + (car.cost - have) + ' מטבעות. נוסעים ואוספים 🪙!'); tap(250); return; } S.own.push(car.id); snd('cha_ching'); try { HeroRewards.confetti(); } catch (e) {} say('מכונית חדשה במוסך! ' + car.name); }
        S.car = car.id; save(); startScreen(); try { LF().word(car.en, car.he, car.ico, { tag: '🇬🇧 המכונית שלנו', pos: 'top' }); } catch (e) { teach(car.en, car.he); }
      });
      cars.appendChild(b);
    });
    var box = $('tracks'); box.innerHTML = ''; selTrack = Math.min(selTrack, S.tracks - 1);
    D.TRACKS.forEach(function (t, i) {
      var lock = i >= S.tracks, b = el('button', 'trk' + (i === selTrack ? ' sel' : '') + (lock ? ' locked' : ''), '<span class="t-ico">' + t.ico + '</span>' + t.name + '<small>' + (lock ? '🔒' : S.best[t.id] ? medalOf(S.best[t.id])[0] + ' ' + S.best[t.id] + '⭐' : 'חדש') + '</small>' + (lock ? '<span class="lock">🔒</span>' : '')); b.type = 'button';
      b.style.background = 'linear-gradient(180deg,' + t.sky[0] + ',' + t.sky[2] + ' 60%,' + t.side[0] + ' 60%)';
      b.addEventListener('click', function () { tap(); if (lock) { say('המסלול נפתח אחרי מדליית ארד במסלול הקודם'); return; } selTrack = i; startScreen(); say(t.name + (t.contest ? ' — תחרות השבוע!' : '')); });
      box.appendChild(b);
    });
    var cs = $('ctrls'); cs.innerHTML = '';
    CTLS.forEach(function (c) { var b = el('button', 'ct' + (c[0] === S.ctl ? ' sel' : ''), '<b>' + c[1] + '</b>' + c[2] + '<small>' + c[3] + '</small>'); b.type = 'button'; b.addEventListener('click', function () { tap(); setCtl(c[0]); startScreen(); say(c[2] + ': ' + c[3]); }); cs.appendChild(b); });
    var car = carOf(S.car); $('carName').textContent = car.name; $('carEn').textContent = car.en;
    $('startScreen').classList.add('show');
  }
  /* תצוגה מקדימה של המכונית הנבחרת — מונפשת (גלגלים מסתובבים, פנסי משטרה) */
  function drawPreview(t) {
    var pc = $('carPrev'); if (!pc || !$('startScreen').classList.contains('show')) return;
    var x = pc.getContext('2d'); x.clearRect(0, 0, pc.width, pc.height); drawCar(x, 200, 330, .95, carOf(S.car), Math.sin(t / 900) * .4, t / 200, Math.floor(t / 1200) % 3 === 0, false, false, t / 1000);
  }
  function bind() {
    $('goBtn').addEventListener('click', function () { tap(); ac(); newRound(selTrack); });
    $('ctlBtn').addEventListener('click', function () { var i = CTLS.map(function (c) { return c[0]; }).indexOf(S.ctl); setCtl(CTLS[(i + 1) % CTLS.length][0]); var c = CTLS.filter(function (c) { return c[0] === S.ctl; })[0]; tap(); say(c[2] + ': ' + c[3]); $('ctlBtn').textContent = c[1]; });
    $('pauseBtn').addEventListener('click', function () { if (!G || !G.run) return; G.run = false; applyCtl(); $('pauseScreen').classList.add('show'); });
    $('resumeBtn').addEventListener('click', function () { $('pauseScreen').classList.remove('show'); G.run = true; applyCtl(); last = performance.now(); });
    $('quitBtn').addEventListener('click', function () { startScreen(); });
    $('againBtn').addEventListener('click', function () { tap(); newRound(G ? G.ti : selTrack); });
    $('garageBtn').addEventListener('click', function () { tap(); startScreen(); });
    document.addEventListener('visibilitychange', function () { if (document.hidden && G && G.run) { G.run = false; applyCtl(); $('pauseScreen').classList.add('show'); } });
    bindPad(); bindWheel(); bindPedals();
  }
  resize(); bind();
  window.addEventListener('DOMContentLoaded', function () { startScreen(); requestAnimationFrame(function (t) { last = t; loop(t); }); (function pv(t) { drawPreview(t || 0); requestAnimationFrame(pv); })(0); });

  /* ================= פרק 11 — API לבדיקות ================= */
  window.CarsGame = { state: function () { return G; }, save: function () { return S; }, start: newRound, boost: useBoost, brake: function (on) { input.brake = !!on; }, steer: function (x) { if (G) G.tx = x; }, ctl: setCtl, finish: function () { if (G) G.time = ROUND; }, segs: function () { return segs; }, drawCar: drawCar };
})();
