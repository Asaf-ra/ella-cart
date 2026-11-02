/* =====================================================================
   js/shake-lab.js — 🧪 שלב 27 (ניסיון): בר המילקשייק — שדרוג המיני-משחק "גלידה" של העגלה
   ---------------------------------------------------------------------
   בעגלה: מקישים על טעם → מלבן בכוס מתמלא בצבע → מקישים על תוספת → אימוג'י מעל הכוס.
   כאן מכינים מילקשייק אמיתי בשישה שלבים במגע, בלי פסילה ובלי לחץ זמן:
   🍨 שני כדורי גלידה לבלנדר (גרירה או הקשה) → 🥛 חלב עד הקו הזהוב (מחזיקים) → 🌀 טחינה (מחזיקים) →
   🥤 מזיגה לכוס עד הקו (מחזיקים) → 🍦 קצפת בספירלה (מחזיקים) → ✨ תוספות → הגשה, שלוק, והלקוח הבא.
   הכל מצויר בקוד על קנבס אחד (בלי Phaser): הנוזל נשאר מאוזן כשמטים את הכד (נפח = שטח מתחת לפני הנוזל),
   גלים על פני הנוזל, מערבולת וצבע שמתערבב בבלנדר, קצפת בספירלה תלת-ממדית, סוכריות שנוחתות ונדבקות לקצפת.
   הדף עצמאי: לא נוגע בעגלה ולא ב-sw.js. המטבעות נכנסים לארנק המשותף (Wallet).
   פרק 1  — במה: קנבס, קנה מידה, DPR
   פרק 2  — כלים: אנימציות (tween), טיימרים, צבעים, גאומטריה של נפח
   פרק 3  — צלילים (Web Audio): מזיגה, מנוע, קצפת, פלופ, רעשן, שלוק
   פרק 4  — נתונים: טעמים, תוספות, לקוחות, מיקומים
   פרק 5  — ציורים מוכנים מראש: כדורי גלידה, קצפת, תוספות, דמויות
   פרק 6  — רקע ודלפק (שכבות שמורות — מצוירות פעם אחת)
   פרק 7  — כלי עם נוזל (Vessel): כד הבלנדר והכוס
   פרק 8  — חלקיקים ומילות קומיקס
   פרק 9  — מהלך המשמרת: לקוח → 6 שלבים → הגשה
   פרק 10 — עדכון לכל פריים
   פרק 11 — ציור העולם
   פרק 12 — ממשק: שלבים, רמז, מטבעות, בועת הזמנה, כפתור הגשה, יד מצביעה, פתיחה וסיום
   פרק 13 — קלט (מגע / עכבר / רווח)
   פרק 14 — לולאה ושומר ביצועים
   פרק 15 — חשיפה לבדיקות (window.ShakeLab)
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- פרק 1 — במה ---------- */
  const W = 1600, H = 900, CT = 690;                     // מידות הבמה (יחידות עיצוב) + קו משטח הדלפק
  const INK = '#1b1036', FONT = 'Rubik, "Varela Round", Heebo, system-ui, sans-serif';
  const EMOJI = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  const cv = document.getElementById('stage'), g = cv.getContext('2d');
  let dprCap = 2, dpr = 1, S = 1, OX = 0, OY = 0, CW = 0, CH = 0, SPEED = 1, clock = 0;
  const vL = () => -OX / S, vR = () => W + OX / S, vT = () => -OY / S, vB = () => H + OY / S;
  const fx = (s) => (window.Profile && Profile.fix) ? Profile.fix(s) : s;   // "אלה" → השם של הילדה שמשחקת
  function resize() {
    dpr = Math.min(dprCap, window.devicePixelRatio || 1);
    CW = Math.max(2, Math.round(innerWidth * dpr)); CH = Math.max(2, Math.round(innerHeight * dpr));
    cv.width = CW; cv.height = CH;
    S = Math.min(CW / W, CH / H); OX = (CW - W * S) / 2; OY = (CH - H * S) / 2;
    buildLayers();
  }
  function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  /* ---------- פרק 2 — כלים ---------- */
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const E = {
    out: t => 1 - Math.pow(1 - t, 3),
    inOut: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    back: t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    bounce: t => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375; return n * (t -= 2.625 / d) * t + .984375; }
  };
  function seeded(s) { return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

  // tween — מזיז מאפיינים מספריים של אובייקט; ערכי ההתחלה נלקחים כשההשהיה נגמרת
  const tweens = [], timers = [];
  function tween(obj, to, dur, ease, done, delay) { tweens.push({ obj, to, dur: Math.max(.001, dur), ease: ease || E.out, t: -(delay || 0), from: null, done }); }
  function after(sec, fn) { timers.push({ t: sec, fn }); }
  function stepTweens(dt) {
    for (let i = 0; i < tweens.length; i++) {
      const tw = tweens[i]; tw.t += dt; if (tw.t < 0) continue;
      if (!tw.from) { tw.from = {}; for (const k in tw.to) tw.from[k] = tw.obj[k]; }
      const p = Math.min(1, tw.t / tw.dur), e = tw.ease(p);
      for (const k in tw.to) tw.obj[k] = tw.from[k] + (tw.to[k] - tw.from[k]) * e;
      if (p >= 1) { tweens.splice(i--, 1); if (tw.done) tw.done(); }
    }
    for (let i = 0; i < timers.length; i++) { const t = timers[i]; t.t -= dt; if (t.t <= 0) { timers.splice(i--, 1); t.fn(); } }
  }

  // צבעים כמערך [r,g,b]
  const rgb = h => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
  const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const shade = (c, k) => k >= 0 ? mixc(c, [255, 255, 255], k) : mixc(c, [24, 8, 44], -k);
  const css = (c, a) => a == null ? 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')' : 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a + ')';

  // גאומטריה של נפח: הנפח של נוזל = השטח של פנים הכלי מתחת לפני הנוזל (y גדל כלפי מטה)
  function clipBelow(p, s) {
    const out = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length], ain = a[1] >= s, bin = b[1] >= s;
      if (ain) out.push(a);
      if (ain !== bin) { const t = (s - a[1]) / (b[1] - a[1]); out.push([a[0] + (b[0] - a[0]) * t, s]); }
    }
    return out;
  }
  function area(p) { let A = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; A += a[0] * b[1] - b[0] * a[1]; } return Math.abs(A) / 2; }
  /* levelFor — גובה פני הנוזל (y) כך שהשטח מתחתיו = V. עובד גם כשהכלי מוטה: הנוזל תמיד מאוזן */
  function levelFor(p, V) {
    let lo = Infinity, hi = -Infinity; for (const q of p) { if (q[1] < lo) lo = q[1]; if (q[1] > hi) hi = q[1]; }
    if (V <= 0) return hi; if (V >= area(p)) return lo;
    let a = lo, b = hi;
    for (let i = 0; i < 26; i++) { const m = (a + b) / 2; if (area(clipBelow(p, m)) > V) a = m; else b = m; }
    return (a + b) / 2;
  }
  // ציור
  function rr(c, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function poly(c, pts) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); }
  function txt(c, s, x, y, size, fill, stroke, sw) {
    c.font = '900 ' + size + 'px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.direction = 'rtl';
    if (stroke) { c.lineJoin = 'round'; c.lineWidth = sw || size * .2; c.strokeStyle = stroke; c.strokeText(s, x, y); }
    c.fillStyle = fill; c.fillText(s, x, y);
  }
  function emo(c, s, x, y, size) { c.font = size + 'px ' + EMOJI; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#000'; c.fillText(s, x, y); }
  function comicPanel(c, x, y, w, h, r, fill) {
    c.fillStyle = INK; rr(c, x + 5, y + 7, w, h, r); c.fill();
    c.fillStyle = fill; rr(c, x, y, w, h, r); c.fill(); c.lineWidth = 4; c.strokeStyle = INK; c.stroke();
  }
  function comicBtn(x, y, w, h, top, bot, label, size) {
    g.fillStyle = INK; rr(g, x + 5, y + 7, w, h, h / 2); g.fill();
    const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, top); gr.addColorStop(1, bot);
    g.fillStyle = gr; rr(g, x, y, w, h, h / 2); g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.35)'; rr(g, x + 16, y + 8, w - 32, h * .3, h * .15); g.fill();
    txt(g, label, x + w / 2, y + h / 2 + 2, size || 40, '#fff', INK, 8);
  }

  /* ---------- פרק 3 — צלילים ---------- */
  const SFX = (function () {
    let nb = null;
    function C() { try { return (window.Sound && Sound.isOn() && Sound.getCtx) ? Sound.getCtx() : null; } catch (e) { return null; } }
    function out(c) { try { return (Sound.getBus && Sound.getBus()) || c.destination; } catch (e) { return c.destination; } }
    function noise(c) { if (!nb) { nb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } return nb; }
    /* לולאה רציפה (מזיגה / מנוע / קצפת): set(level 0..1) בכל פריים; נעצרת לבד כשהרמה יורדת לאפס */
    function loop(kind) {
      let n = null;
      function start() {
        const c = C(); if (!c) return null;
        const src = c.createBufferSource(); src.buffer = noise(c); src.loop = true;
        const f = c.createBiquadFilter(), gn = c.createGain(); gn.gain.value = 0;
        let osc = null, og = null;
        if (kind === 'pour') { f.type = 'bandpass'; f.frequency.value = 650; f.Q.value = 1.1; }
        else if (kind === 'squirt') { f.type = 'highpass'; f.frequency.value = 1900; }
        else { f.type = 'lowpass'; f.frequency.value = 600; osc = c.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = 50; og = c.createGain(); og.gain.value = 0; osc.connect(og); og.connect(f); osc.start(); }
        src.connect(f); f.connect(gn); gn.connect(out(c)); src.start();
        return { c, src, f, gn, osc, og };
      }
      return {
        set(level) {
          if (level > .01 && !n) n = start();
          if (!n) return;
          const t = n.c.currentTime;
          if (kind === 'pour') { n.gn.gain.setTargetAtTime(level * .2, t, .05); n.f.frequency.setTargetAtTime(560 + 220 * Math.sin(t * 11) + 240 * level, t, .03); }
          else if (kind === 'squirt') n.gn.gain.setTargetAtTime(level * .1, t, .04);
          else { n.gn.gain.setTargetAtTime(level * .13, t, .08); n.og.gain.setTargetAtTime(level * .45, t, .08); n.osc.frequency.setTargetAtTime(45 + 95 * level, t, .15); n.f.frequency.setTargetAtTime(350 + 950 * level, t, .15); }
          if (level <= .01) { const old = n; n = null; setTimeout(() => { try { old.src.stop(); if (old.osc) old.osc.stop(); old.gn.disconnect(); } catch (e) {} }, 450); }
        }
      };
    }
    function blip(f0, f1, dur, type, vol) {
      const c = C(); if (!c) return; const o = c.createOscillator(), gn = c.createGain(), t = c.currentTime;
      o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
      gn.gain.setValueAtTime(vol || .2, t); gn.gain.exponentialRampToValueAtTime(.001, t + dur);
      o.connect(gn); gn.connect(out(c)); o.start(t); o.stop(t + dur + .02);
    }
    function hiss(dur, freq, vol, type) {
      const c = C(); if (!c) return; const s = c.createBufferSource(), f = c.createBiquadFilter(), gn = c.createGain(), t = c.currentTime;
      s.buffer = noise(c); f.type = type || 'bandpass'; f.frequency.value = freq; gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(.001, t + dur);
      s.connect(f); f.connect(gn); gn.connect(out(c)); s.start(t, Math.random()); s.stop(t + dur + .02);
    }
    return {
      pour: loop('pour'), motor: loop('motor'), squirt: loop('squirt'),
      plop() { blip(380, 110, .2, 'sine', .32); hiss(.09, 900, .08); },
      scoop() { hiss(.14, 1700, .07); blip(260, 520, .1, 'triangle', .1); },
      rattle() { hiss(.05, 4200, .1, 'highpass'); },
      whoosh() { hiss(.32, 800, .09); },
      pop() { blip(700, 1500, .09, 'sine', .16); },
      clink() { blip(2600, 2450, .25, 'sine', .07); blip(3900, 3750, .2, 'sine', .035); },
      giggle() { blip(620, 1100, .1, 'triangle', .12); setTimeout(() => blip(760, 1300, .1, 'triangle', .1), 120); },
      coin() { blip(1320, 1760, .08, 'square', .06); },
      slurp() {
        const c = C(); if (!c) return; const s = c.createBufferSource(), f = c.createBiquadFilter(), gn = c.createGain(), t = c.currentTime;
        s.buffer = noise(c); f.type = 'bandpass'; f.Q.value = 6; f.frequency.setValueAtTime(380, t); f.frequency.exponentialRampToValueAtTime(1500, t + .32);
        gn.gain.setValueAtTime(.001, t); gn.gain.exponentialRampToValueAtTime(.22, t + .05); gn.gain.exponentialRampToValueAtTime(.001, t + .38);
        s.connect(f); f.connect(gn); gn.connect(out(c)); s.start(t, Math.random()); s.stop(t + .4);
      }
    };
  })();
  function say(t) { try { if (window.Voice) Voice.say(t, { interrupt: true }); } catch (e) {} }
  function snd(name) { try { if (window.Sound && Sound[name]) Sound[name](); } catch (e) {} }

  /* ---------- פרק 4 — נתונים ---------- */
  // אותם מזהים כמו בתפריט של העגלה (js/state.js, MENU.shake) — כדי שאפשר יהיה להחליף את המיני-משחק בעתיד
  const FLAVORS = [
    { id: '🍦', name: 'וניל',     ball: 0xfff1d2, liq: 0xfff3dc, speck: '#6b4423', specks: 'bean' },
    { id: '🍓', name: 'תות',      ball: 0xff8fbf, liq: 0xffadd0, speck: '#c2185b', specks: 'seed' },
    { id: '🍫', name: 'שוקולד',   ball: 0x7b4a2c, liq: 0x9b6644, speck: '#3a1d0c', specks: 'chip' },
    { id: '🍋', name: 'לימון',    ball: 0xffe76a, liq: 0xfff2a6, speck: '#e0a800', specks: 'zest' },
    { id: '🫐', name: 'אוכמניות', ball: 0x8c7dff, liq: 0xb0a6ff, speck: '#3d2b9e', specks: 'berry' }
  ];
  const FL = {}; FLAVORS.forEach(f => FL[f.id] = f);
  const TOPS = [
    { id: '🌈', name: 'סוכריות צבעוניות', kind: 'sprinkle' },
    { id: '🍒', name: 'דובדבן', kind: 'cherry' },
    { id: '🍪', name: 'עוגייה', kind: 'cookie' },
    { id: '🥥', name: 'קוקוס', kind: 'coconut' },
    { id: '⭐', name: 'כוכב', kind: 'star' }
  ];
  const CUSTS = ['bunny', 'cat', 'girl', 'mouse', 'panda', 'fox', 'bear', 'dog', 'pig', 'boy', 'frog', 'penguin'];
  const STEPS = [{ k: 'scoop', ico: '🍨' }, { k: 'milk', ico: '🥛' }, { k: 'blend', ico: '🌀' }, { k: 'pour', ico: '🥤' }, { k: 'cream', ico: '🍦' }, { k: 'top', ico: '✨' }];
  const SPRINKLE_COLS = ['#ff4f9a', '#ffd23f', '#3fd0ff', '#7dff6a', '#b06bff', '#ff8a3d'];
  const MILK = [255, 251, 242], ROUNDS = 5, SCOOP_V = 3400;
  const joinHe = (arr) => arr.length < 2 ? (arr[0] || '') : arr.slice(0, -1).join(', ') + ' ו' + arr[arr.length - 1];
  // מיקומים על הבמה
  const BX = 600, JAR_Y = 600;                       // הבלנדר: מרכז + תחתית פנים הכד
  const GX = 1060, GB = 630, GH = 280;               // הכוס: מרכז + תחתית פנים הקערה + גובה הקערה
  const CUST_X = 1395, CUST_Y = 750, CARTON_X = 330;
  const SLOT_X = [890, 710, 530, 350, 170];          // תאי הוויטרינה — הראשון מימין (קריאה מימין לשמאל)
  const SERVE = { x: 1300, y: 806 };

  /* ---------- פרק 5 — ציורים מוכנים מראש ---------- */
  function makeScoop(f) {
    const c = mk(160, 160), x = c.getContext('2d'), R = 62, cx0 = 80, cy0 = 82, base = rgb(f.ball), r2 = seeded(f.name.length * 131 + 7);
    const outline = () => {
      x.beginPath();
      for (let i = 0; i <= 72; i++) {
        const a = i / 72 * Math.PI * 2; let r = R * (1 + .035 * Math.sin(a * 5 + 1) + .022 * Math.sin(a * 11));
        if (Math.sin(a) > .5) r += 4.5 * Math.sin(a * 16);                       // שוליים מסולסלים של הכף
        const px = cx0 + Math.cos(a) * r, py = cy0 + Math.sin(a) * r; i ? x.lineTo(px, py) : x.moveTo(px, py);
      }
      x.closePath();
    };
    outline();
    const gr = x.createRadialGradient(cx0 - 22, cy0 - 26, 6, cx0, cy0, R * 1.12);
    gr.addColorStop(0, css(shade(base, .55))); gr.addColorStop(.45, css(base)); gr.addColorStop(1, css(shade(base, -.3)));
    x.fillStyle = gr; x.fill(); x.lineWidth = 4; x.strokeStyle = css(shade(base, -.48)); x.stroke();
    x.save(); outline(); x.clip();
    x.strokeStyle = css(shade(base, -.22), .7); x.lineWidth = 3; x.beginPath(); x.ellipse(cx0, cy0 + 30, R * .95, 17, 0, 0, Math.PI); x.stroke();
    for (let i = 0; i < 26; i++) {                                                   // גרגרים לפי טעם
      const a = r2() * Math.PI * 2, d = Math.sqrt(r2()) * R * .85, px = cx0 + Math.cos(a) * d, py = cy0 + Math.sin(a) * d;
      x.fillStyle = f.speck;
      if (f.specks === 'bean') { x.beginPath(); x.arc(px, py, 1.1 + r2() * .9, 0, 6.283); x.fill(); }
      else if (f.specks === 'seed') { x.beginPath(); x.ellipse(px, py, 1.6, 2.6, a, 0, 6.283); x.fill(); }
      else if (f.specks === 'chip' && i < 11) { x.beginPath(); x.ellipse(px, py, 4 + r2() * 3, 3 + r2() * 2, a, 0, 6.283); x.fill(); }
      else if (f.specks === 'zest' && i < 16) { x.strokeStyle = f.speck; x.lineWidth = 2; x.lineCap = 'round'; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * 6, py + Math.sin(a) * 6); x.stroke(); }
      else if (f.specks === 'berry' && i < 8) { x.beginPath(); x.arc(px, py, 4.5 + r2() * 2, 0, 6.283); x.fill(); x.fillStyle = 'rgba(255,255,255,.5)'; x.beginPath(); x.arc(px - 1.5, py - 1.5, 1.4, 0, 6.283); x.fill(); }
    }
    x.fillStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.ellipse(cx0 - 22, cy0 - 30, 18, 10, -.5, 0, Math.PI * 2); x.fill();
    x.restore();
    return c;
  }
  function makeCream() {
    const c = mk(128, 128), x = c.getContext('2d');
    const gr = x.createRadialGradient(46, 40, 6, 64, 66, 62);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(.5, '#fffaf2'); gr.addColorStop(.86, '#f1e3d9'); gr.addColorStop(1, '#ddc8bd');
    x.fillStyle = gr; x.beginPath(); x.arc(64, 64, 60, 0, Math.PI * 2); x.fill();
    x.strokeStyle = 'rgba(185,150,140,.55)'; x.lineWidth = 2.5; x.stroke();
    x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 4; x.lineCap = 'round'; x.beginPath(); x.arc(64, 64, 46, -2.5, -1.7); x.stroke();
    return c;
  }
  function sprinkleOn(c, x, y, a, col, len) {
    c.save(); c.translate(x, y); c.rotate(a); c.lineCap = 'round';
    c.strokeStyle = col; c.lineWidth = 4.4; c.beginPath(); c.moveTo(-len / 2, 0); c.lineTo(len / 2, 0); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-len / 2 + 1.5, -1.1); c.lineTo(len / 2 - 1.5, -1.1); c.stroke();
    c.restore();
  }
  function flakeOn(c, x, y, a, s) {
    c.save(); c.translate(x, y); c.rotate(a); c.lineCap = 'round';
    c.strokeStyle = 'rgba(150,110,85,.55)'; c.lineWidth = 4.8 * s; c.beginPath(); c.arc(0, 4 * s, 6 * s, -2.4, -.7); c.stroke();
    c.strokeStyle = '#fffdf6'; c.lineWidth = 3 * s; c.stroke();
    c.restore();
  }
  function cherryOn(c, x, y, r) {
    c.save(); c.lineCap = 'round';
    c.strokeStyle = '#4b7a1e'; c.lineWidth = r * .22; c.beginPath(); c.moveTo(x + r * .1, y - r * .8); c.quadraticCurveTo(x + r * .2, y - r * 1.9, x + r * 1.05, y - r * 2.2); c.stroke();
    const gr = c.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r);
    gr.addColorStop(0, '#ff8a9a'); gr.addColorStop(.35, '#ef1f45'); gr.addColorStop(1, '#8e0628');
    c.fillStyle = gr; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); c.lineWidth = Math.max(2, r * .12); c.strokeStyle = '#5a0018'; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.ellipse(x - r * .38, y - r * .38, r * .26, r * .16, -.6, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  function cookieOn(c, x, y, r, a) {
    c.save(); c.translate(x, y); c.rotate(a || 0);
    const gr = c.createRadialGradient(-r * .3, -r * .3, r * .1, 0, 0, r); gr.addColorStop(0, '#f6cf8e'); gr.addColorStop(1, '#c98a45');
    c.fillStyle = gr; c.beginPath();
    for (let i = 0; i <= 22; i++) { const t = i / 22 * Math.PI * 2, q = r * (1 + .05 * Math.sin(t * 7)); c.lineTo(Math.cos(t) * q, Math.sin(t) * q); }
    c.closePath(); c.fill(); c.lineWidth = Math.max(2, r * .09); c.strokeStyle = '#7a4a1c'; c.stroke();
    c.fillStyle = '#4a2410';
    [[-.35, -.2], [.3, -.35], [.1, .25], [-.25, .45], [.45, .2], [-.55, .1]].forEach(p => { c.beginPath(); c.ellipse(p[0] * r, p[1] * r, r * .11, r * .08, p[0] * 3, 0, Math.PI * 2); c.fill(); });
    c.restore();
  }
  function starOn(c, x, y, r, a) {
    c.save(); c.translate(x, y); c.rotate(a || 0);
    c.beginPath(); for (let i = 0; i < 10; i++) { const t = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * .48 : r; c.lineTo(Math.cos(t) * q, Math.sin(t) * q); } c.closePath();
    const gr = c.createLinearGradient(0, -r, 0, r); gr.addColorStop(0, '#fff2a8'); gr.addColorStop(.5, '#ffc93c'); gr.addColorStop(1, '#ff9f1c');
    c.fillStyle = gr; c.fill(); c.lineJoin = 'round'; c.lineWidth = Math.max(2, r * .12); c.strokeStyle = INK; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(-r * .18, -r * .35, r * .16, r * .09, -.5, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  function coconutOn(c, x, y, r) {
    c.save();
    c.fillStyle = '#6b3d1f'; c.beginPath(); c.arc(x, y, r, 0, Math.PI); c.closePath(); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    c.strokeStyle = 'rgba(255,220,180,.35)'; c.lineWidth = 2; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(x, y, r * (.45 + i * .11), .3, Math.PI - .3); c.stroke(); }
    c.fillStyle = '#fffaf0'; c.beginPath(); c.ellipse(x, y, r * .92, r * .3, 0, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#5a3218'; c.lineWidth = 3; c.stroke();
    c.restore();
  }
  function makeTopIcon(kind) {
    const c = mk(96, 96), x = c.getContext('2d'), r2 = seeded(kind.length * 53);
    if (kind === 'sprinkle') for (let i = 0; i < 9; i++) sprinkleOn(x, 48 + (r2() - .5) * 46, 48 + (r2() - .5) * 46, r2() * 6.3, SPRINKLE_COLS[i % 6], 18);
    if (kind === 'cherry') cherryOn(x, 44, 62, 24);
    if (kind === 'cookie') cookieOn(x, 48, 48, 34, .2);
    if (kind === 'coconut') { coconutOn(x, 48, 42, 34); for (let i = 0; i < 6; i++) flakeOn(x, 26 + i * 9, 80 + (i % 2) * 6, r2() * 6.3, 1.1); }
    if (kind === 'star') starOn(x, 48, 50, 36, 0);
    return c;
  }
  function makeHeap(kind) {
    const c = mk(170, 110), x = c.getContext('2d'), r2 = seeded(kind.length * 97 + 3);
    if (kind === 'sprinkle' || kind === 'coconut') {
      if (kind === 'coconut') coconutOn(x, 132, 70, 26);
      for (let i = 0; i < (kind === 'sprinkle' ? 120 : 80); i++) {
        const u = r2() * 2 - 1, h = (1 - u * u) * 44 * Math.sqrt(r2()), px = 85 + u * 68 - (kind === 'coconut' ? 14 : 0), py = 96 - h;
        if (kind === 'sprinkle') sprinkleOn(x, px, py, r2() * 6.3, SPRINKLE_COLS[(r2() * 6) | 0], 12); else flakeOn(x, px, py, r2() * 6.3, 1.3);
      }
    }
    if (kind === 'cherry') [[52, 84], [88, 88], [124, 84], [70, 62], [108, 62]].forEach(p => cherryOn(x, p[0], p[1], 17));
    if (kind === 'cookie') [[60, 70, -.5], [112, 68, .6], [86, 82, .1]].forEach(p => cookieOn(x, p[0], p[1], 28, p[2]));
    if (kind === 'star') [[56, 84, -.2], [90, 86, .15], [124, 82, .4], [72, 58, .3], [108, 56, -.3]].forEach(p => starOn(x, p[0], p[1], 20, p[2]));
    return c;
  }
  /* loadArt — מצייר את דמות ה-SVG לקנבס פעם אחת ברזולוציה פי 3 (חד באייפד; ספארי מטשטש SVG שמוגדל בקנבס) */
  const ART = {};
  function art(name) {
    if (ART[name]) return ART[name];
    const o = ART[name] = { ready: false, cv: null }, scale = 3;
    const done = (im, w, h) => { const c = mk(w, h); c.getContext('2d').drawImage(im, 0, 0, w, h); o.cv = c; o.ready = true; };
    fetch('assets/art/' + name + '.svg').then(r => { if (!r.ok) throw 0; return r.text(); }).then(t => {
      const m = t.match(/viewBox="([\d.\s-]+)"/), vb = m ? m[1].trim().split(/\s+/).map(Number) : [0, 0, 200, 220];
      const w = Math.round(vb[2] * scale), h = Math.round(vb[3] * scale);
      t = t.replace(/<svg([^>]*?)\swidth="[^"]*"/, '<svg$1').replace(/<svg([^>]*?)\sheight="[^"]*"/, '<svg$1').replace('<svg', '<svg width="' + w + '" height="' + h + '"');
      const im = new Image(); im.onload = () => done(im, w, h); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(t);
    }).catch(() => { const im = new Image(); im.onload = () => done(im, 600, 660); im.src = 'assets/art/' + name + '.svg'; });
    return o;
  }
  const SCOOP = {}, TICON = {}, HEAP = {}; let CREAM = null;

  /* ---------- פרק 6 — רקע ודלפק (שכבות שמורות) ---------- */
  let layBack = null, layCounter = null;
  function buildLayers() {
    layBack = mk(CW, CH); layCounter = mk(CW, CH);
    const b = layBack.getContext('2d'); b.setTransform(S, 0, 0, S, OX, OY); drawWall(b);
    const k = layCounter.getContext('2d'); k.setTransform(S, 0, 0, S, OX, OY); drawCounter(k);
  }
  function drawWall(b) {
    const L = vL() - 2, R = vR() + 2, T = vT() - 2, r2 = seeded(11);
    let gr = b.createLinearGradient(0, T, 0, CT);
    gr.addColorStop(0, '#1d0c46'); gr.addColorStop(.5, '#4f2287'); gr.addColorStop(1, '#a8448f');
    b.fillStyle = gr; b.fillRect(L, T, R - L, CT - T + 40);
    b.globalCompositeOperation = 'lighter';                                         // בוקה — אורות רכים ברקע
    for (let i = 0; i < 26; i++) {
      const x = lerp(L, R, r2()), y = lerp(T + 20, 430, r2()), r = 10 + r2() * 28, col = ['255,120,200', '120,200,255', '255,210,120'][i % 3];
      const rg = b.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, 'rgba(' + col + ',.22)'); rg.addColorStop(1, 'rgba(' + col + ',0)');
      b.fillStyle = rg; b.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    b.globalCompositeOperation = 'source-over';
    b.save(); b.beginPath(); b.rect(L, 430, R - L, 200); b.clip();                  // אריחים בחלק התחתון של הקיר
    b.fillStyle = 'rgba(255,255,255,.075)';
    for (let y = 430, row = 0; y < 630; y += 34, row++) for (let x = Math.floor(L / 68) * 68 - (row % 2) * 34; x < R; x += 68) { rr(b, x + 2, y + 2, 64, 30, 6); b.fill(); }
    b.restore();
    for (let x = Math.floor(L / 24) * 24, i = 0; x < R; x += 24, i++) for (let r = 0; r < 2; r++) {   // פס משבצות רטרו
      b.fillStyle = (i + r) % 2 ? '#fff4fb' : '#ff7ec2'; b.fillRect(x, 626 + r * 21, 24, 21);
    }
    // מנורות תלויות + קונוס אור
    [190, 1210].forEach(x => {
      b.strokeStyle = '#120830'; b.lineWidth = 4; b.beginPath(); b.moveTo(x, T); b.lineTo(x, 66); b.stroke();
      b.globalCompositeOperation = 'lighter';
      const cg = b.createLinearGradient(0, 100, 0, CT); cg.addColorStop(0, 'rgba(255,225,170,.16)'); cg.addColorStop(1, 'rgba(255,225,170,0)');
      b.fillStyle = cg; b.beginPath(); b.moveTo(x - 36, 100); b.lineTo(x + 36, 100); b.lineTo(x + 200, CT); b.lineTo(x - 200, CT); b.closePath(); b.fill();
      const bg = b.createRadialGradient(x, 102, 0, x, 102, 70); bg.addColorStop(0, 'rgba(255,240,200,.75)'); bg.addColorStop(1, 'rgba(255,240,200,0)');
      b.fillStyle = bg; b.fillRect(x - 70, 32, 140, 140);
      b.globalCompositeOperation = 'source-over';
      const sg = b.createLinearGradient(x - 50, 0, x + 50, 0); sg.addColorStop(0, '#c2185b'); sg.addColorStop(.4, '#ff6fb5'); sg.addColorStop(1, '#9c1352');
      b.fillStyle = sg; b.beginPath(); b.moveTo(x - 14, 64); b.quadraticCurveTo(x - 52, 70, x - 54, 102); b.lineTo(x + 54, 102); b.quadraticCurveTo(x + 52, 70, x + 14, 64); b.closePath(); b.fill();
      b.lineWidth = 3; b.strokeStyle = INK; b.stroke();
      b.fillStyle = '#fff6dc'; b.beginPath(); b.ellipse(x, 103, 22, 7, 0, 0, Math.PI * 2); b.fill();
    });
    // מדף עם צנצנות סוכריות
    b.fillStyle = '#7a4a2c'; rr(b, 40, 372, 330, 14, 5); b.fill(); b.lineWidth = 3; b.strokeStyle = INK; b.stroke();
    [['#ff7ec2', 70], ['#3fd0ff', 145], ['#ffd23f', 220], ['#7dff6a', 295]].forEach(([col, x], i) => {
      b.fillStyle = 'rgba(230,245,255,.35)'; rr(b, x, 312, 54, 60, 12); b.fill(); b.strokeStyle = 'rgba(255,255,255,.7)'; b.lineWidth = 3; b.stroke();
      b.fillStyle = col; rr(b, x + 5, 334, 44, 34, 8); b.fill();
      for (let k = 0; k < 7; k++) { b.fillStyle = 'rgba(255,255,255,.55)'; b.beginPath(); b.arc(x + 12 + (k * 13) % 34, 342 + (k * 7) % 22, 3, 0, 6.283); b.fill(); }
      b.fillStyle = ['#ff2e93', '#2a6fd6', '#ff9f1c', '#14a77a'][i]; rr(b, x + 4, 302, 46, 12, 4); b.fill(); b.strokeStyle = INK; b.lineWidth = 2; b.stroke();
    });
    // שלט ניאון
    const title = fx('השייקים של אלה');
    b.fillStyle = 'rgba(14,4,36,.6)'; rr(b, 50, 160, 600, 116, 22); b.fill(); b.strokeStyle = 'rgba(255,255,255,.14)'; b.lineWidth = 3; b.stroke();
    b.save(); b.font = '900 60px ' + FONT; b.textAlign = 'center'; b.textBaseline = 'middle'; b.direction = 'rtl'; b.lineJoin = 'round';
    b.shadowColor = '#ff3fa4'; b.shadowBlur = 26 * S; b.lineWidth = 7; b.strokeStyle = '#ff5fb4'; b.strokeText(title, 392, 220);
    b.shadowBlur = 8 * S; b.lineWidth = 2.5; b.strokeStyle = '#ffe3f3'; b.strokeText(title, 392, 220);
    b.shadowColor = '#29e0ff'; b.shadowBlur = 20 * S; b.lineWidth = 5; b.strokeStyle = '#5fe8ff'; b.lineCap = 'round';   // אייקון כוס ניאון
    b.beginPath(); b.moveTo(88, 182); b.lineTo(100, 258); b.lineTo(134, 258); b.lineTo(146, 182); b.stroke();
    b.beginPath(); b.moveTo(124, 192); b.lineTo(150, 166); b.stroke();
    b.beginPath(); b.arc(117, 182, 24, Math.PI, 0); b.stroke();
    b.restore();
    const vg = b.createRadialGradient(800, 420, 300, 800, 420, 1150); vg.addColorStop(0, 'rgba(10,0,30,0)'); vg.addColorStop(1, 'rgba(10,0,30,.45)');
    b.fillStyle = vg; b.fillRect(L, T, R - L, vB() - T + 4);
  }
  function drawCounter(k) {
    const L = vL() - 2, R = vR() + 2, B = vB() + 2, r2 = seeded(5);
    let gr = k.createLinearGradient(0, 640, 0, 668); gr.addColorStop(0, 'rgba(20,0,40,0)'); gr.addColorStop(1, 'rgba(20,0,40,.4)');
    k.fillStyle = gr; k.fillRect(L, 640, R - L, 28);
    gr = k.createLinearGradient(0, 668, 0, 694); gr.addColorStop(0, '#e6daf2'); gr.addColorStop(1, '#fffaff');
    k.fillStyle = gr; k.fillRect(L, 668, R - L, 26);
    k.strokeStyle = 'rgba(150,125,175,.28)'; k.lineWidth = 1.5;                       // עורקי שיש
    for (let i = 0; i < 18; i++) { const x = lerp(L, R, r2()); k.beginPath(); k.moveTo(x, 670); k.bezierCurveTo(x + 40, 676 + r2() * 10, x + 70, 672, x + 120 + r2() * 60, 692); k.stroke(); }
    gr = k.createLinearGradient(0, 693, 0, 706); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.5, '#c9c2d8'); gr.addColorStop(1, '#8e86a3');
    k.fillStyle = gr; k.fillRect(L, 693, R - L, 13); k.fillStyle = INK; k.fillRect(L, 705, R - L, 3);
    gr = k.createLinearGradient(0, 708, 0, B); gr.addColorStop(0, '#5fd9c2'); gr.addColorStop(1, '#258f80');
    k.fillStyle = gr; k.fillRect(L, 708, R - L, B - 708);
    k.strokeStyle = 'rgba(0,60,50,.2)'; k.lineWidth = 3;
    for (let x = Math.floor(L / 110) * 110 + 40; x < R; x += 110) { k.beginPath(); k.moveTo(x, 732); k.lineTo(x, B); k.stroke(); }
    k.fillStyle = '#ff7ec2'; k.fillRect(L, 716, R - L, 9); k.fillStyle = 'rgba(255,255,255,.4)'; k.fillRect(L, 716, R - L, 3);
    k.fillStyle = INK; rr(k, 64, 736, 932, 156, 22); k.fill();                        // ויטרינת הגלידה
    gr = k.createLinearGradient(0, 742, 0, 886); gr.addColorStop(0, '#3a2a78'); gr.addColorStop(1, '#170f38');
    k.fillStyle = gr; rr(k, 72, 744, 916, 140, 16); k.fill();
    gr = k.createLinearGradient(0, 744, 0, 784); gr.addColorStop(0, 'rgba(200,235,255,.28)'); gr.addColorStop(1, 'rgba(200,235,255,0)');
    k.fillStyle = gr; rr(k, 72, 744, 916, 40, 16); k.fill();
  }

  /* ---------- פרק 7 — כלי עם נוזל ---------- */
  function Vessel(p, lipA, lipB) {
    this.poly = p; this.lipA = lipA; this.lipB = lipB; this.x = 0; this.y = 0; this.a = 0; this.V = 0; this.col = MILK.slice();
    this.N = 26; this.h = new Float32Array(this.N); this.v = new Float32Array(this.N); this.vortex = 0;
    this.minX = Math.min.apply(null, p.map(q => q[0])); this.maxX = Math.max.apply(null, p.map(q => q[0]));
  }
  Vessel.prototype.pt = function (px, py) { const c = Math.cos(this.a), s = Math.sin(this.a); return [this.x + px * c - py * s, this.y + px * s + py * c]; };
  Vessel.prototype.world = function () { return this.poly.map(q => this.pt(q[0], q[1])); };
  Vessel.prototype.level = function () { return levelFor(this.world(), this.V); };
  Vessel.prototype.cap = function () { const w = this.world(); return area(clipBelow(w, Math.max(w[this.lipA][1], w[this.lipB][1]))); };   // כמה נכנס לפני שנשפך
  Vessel.prototype.lowLip = function () { const w = this.world(); return w[this.lipA][1] > w[this.lipB][1] ? w[this.lipA] : w[this.lipB]; };
  Vessel.prototype.volAt = function (h) { return area(clipBelow(this.poly, -h)); };
  Vessel.prototype.heightOf = function (V) { let a = 0, b = 400; for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (this.volAt(m) < V) a = m; else b = m; } return a; };
  Vessel.prototype.col_i = function (wx) { return (wx - this.x - this.minX) / (this.maxX - this.minX) * (this.N - 1); };
  Vessel.prototype.splash = function (wx, amp) { const i = Math.round(this.col_i(wx)); for (let k = -2; k <= 2; k++) { const j = i + k; if (j >= 0 && j < this.N) this.v[j] += amp * (1 - Math.abs(k) * .3); } };
  Vessel.prototype.stepWaves = function (dt) {
    const N = this.N, h = this.h, v = this.v;
    for (let i = 0; i < N; i++) v[i] += (-90 * h[i] - 4 * v[i]) * dt;
    for (let p = 0; p < 2; p++) for (let i = 0; i < N; i++) { const l = i > 0 ? h[i - 1] : h[i], r = i < N - 1 ? h[i + 1] : h[i]; v[i] += (l + r - 2 * h[i]) * 160 * dt; }
    for (let i = 0; i < N; i++) h[i] = clamp(h[i] + v[i] * dt, -16, 16);
  };
  Vessel.prototype.surfAt = function (wx) {
    let y = 0; const f = this.col_i(wx), i = clamp(Math.floor(f), 0, this.N - 2);
    y += lerp(this.h[i], this.h[i + 1], clamp(f - i, 0, 1));
    if (this.vortex) { const hw = (this.maxX - this.minX) / 2, d = clamp((wx - this.x) / hw, -1, 1); y += this.vortex * (Math.pow(1 - d * d, 2) - .35); }
    return y;
  };
  /* drawLiquid — הנוזל בקואורדינטות העולם: חיתוך לפי פנים הכלי + פני נוזל עם גלים/מערבולת (רק כשהכלי זקוף) */
  Vessel.prototype.drawLiquid = function (alpha, foam) {
    if (this.V < 2) return;
    const w = this.world(), s = levelFor(w, this.V), up = Math.abs(this.a) < .09, c = this.col;
    let x0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of w) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] > y1) y1 = p[1]; }
    const N = 30, top = (i) => { const x = x0 - 4 + (x1 - x0 + 8) * i / N; return [x, s + (up ? this.surfAt(x) : 0)]; };
    g.save(); poly(g, w); g.clip(); g.globalAlpha = alpha;
    const gr = g.createLinearGradient(0, s - 12, 0, y1);
    gr.addColorStop(0, css(shade(c, .3))); gr.addColorStop(.12, css(c)); gr.addColorStop(1, css(shade(c, -.18)));
    g.fillStyle = gr; g.beginPath(); g.moveTo(x0 - 4, y1 + 4);
    for (let i = 0; i <= N; i++) { const q = top(i); g.lineTo(q[0], q[1]); }
    g.lineTo(x1 + 4, y1 + 4); g.closePath(); g.fill();
    g.globalAlpha = 1; g.strokeStyle = css(shade(c, foam ? .62 : .5), .9); g.lineWidth = foam ? 10 : 4; g.lineJoin = 'round';
    g.beginPath(); for (let i = 0; i <= N; i++) { const q = top(i); i ? g.lineTo(q[0], q[1] + (foam ? 3 : 1)) : g.moveTo(q[0], q[1] + (foam ? 3 : 1)); } g.stroke();
    if (foam && up) { g.fillStyle = css(shade(c, .75), .9); for (let i = 0; i < 9; i++) { const x = lerp(x0 + 14, x1 - 14, ((i * 37) % 9) / 8); g.beginPath(); g.arc(x, s + this.surfAt(x) + 6, 2.5 + (i % 3), 0, 6.283); g.fill(); } }
    g.restore();
  };
  // כד הבלנדר: פנים בצורת טרפז (0 = תחתית, למעלה = שלילי)
  const JAR = [[-75, 0], [75, 0], [110, -290], [-110, -290]];
  const jarHalf = (h) => 75 + 35 * clamp(h / 290, 0, 1);
  // כוס מילקשייק: קערת "צבעוני" עם תחתית מעוגלת
  const ghw = (h) => 44 + 58 * Math.pow(clamp(h / GH, 0, 1), 1.35);
  const GLASS = [];
  for (let i = 0; i <= 8; i++) { const x = -44 + 88 * i / 8; GLASS.push([x, 8 * (1 - (x / 44) * (x / 44))]); }
  for (let i = 1; i <= 16; i++) { const h = GH * i / 16; GLASS.push([ghw(h), -h]); }
  const G_LIP_R = GLASS.length - 1;
  for (let i = 16; i >= 1; i--) { const h = GH * i / 16; GLASS.push([-ghw(h), -h]); }
  const jar = new Vessel(JAR, 2, 3), glass = new Vessel(GLASS, G_LIP_R, G_LIP_R + 1);
  jar.x = BX; jar.y = JAR_Y; glass.x = GX; glass.y = GB;
  const G_TARGET = glass.volAt(GH * .88), G_TH = GH * .88, G_MAX = glass.volAt(GH - 6);
  const MILK_T = G_TARGET * 1.1 - 2 * SCOOP_V, MILK_TH = jar.heightOf(MILK_T);

  /* ---------- פרק 8 — חלקיקים ומילות קומיקס ---------- */
  const parts = [], ui = [], stuck = [], flyers = [], balls = [], flying = [], drops = [];
  function emit(o) { parts.push(Object.assign({ x: 0, y: 0, vx: 0, vy: 0, gr: 1400, t: 0, life: 1, size: 5, col: '#fff', kind: 'drop', a: 0, va: 0 }, o)); }
  function sparkle(x, y, n, col) { for (let i = 0; i < n; i++) { const a = rnd(0, 6.283), sp = rnd(90, 360); emit({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, gr: 240, life: rnd(.5, .9), size: rnd(7, 14), col: col || '#fff2a8', kind: 'spark' }); } }
  function hearts(x, y, n) { for (let i = 0; i < n; i++) emit({ x: x + rnd(-70, 70), y: y + rnd(-20, 20), vx: rnd(-30, 30), vy: rnd(-240, -130), gr: -30, life: rnd(1.1, 1.7), size: rnd(16, 26), kind: 'heart', col: ['#ff2e93', '#ff7ec2', '#ff4f6d'][i % 3] }); }
  function splashDrops(x, y, col, n) { for (let i = 0; i < n; i++) emit({ x, y, vx: rnd(-140, 140), vy: rnd(-320, -120), life: .6, size: rnd(2.5, 5), col: css(col), landY: y + 6 }); }
  function word(text, x, y, col) { ui.push({ kind: 'word', text, x, y, t: 0, life: 1.5, col: col || '#ffc93c' }); }
  const shk = { k: 0, x: 0, y: 0 };
  function shake(k) { shk.k = Math.max(shk.k, k); }
  function star4(x, y, r, col) {
    g.fillStyle = col; g.beginPath();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, q = i % 2 ? r * .28 : r; g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); }
    g.closePath(); g.fill();
  }
  function heartAt(x, y, s, col) {
    g.fillStyle = col; g.beginPath(); g.moveTo(x, y + s * .35);
    g.bezierCurveTo(x - s, y - s * .3, x - s * .45, y - s, x, y - s * .45); g.bezierCurveTo(x + s * .45, y - s, x + s, y - s * .3, x, y + s * .35);
    g.fill(); g.lineWidth = 2; g.strokeStyle = INK; g.stroke();
  }
  function coinAt(c, x, y, r) {
    const gr = c.createRadialGradient(x - r * .35, y - r * .35, r * .1, x, y, r); gr.addColorStop(0, '#fff3b0'); gr.addColorStop(.5, '#ffc93c'); gr.addColorStop(1, '#e08a00');
    c.fillStyle = gr; c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r * .68, 0, 6.283); c.stroke();
    starOn(c, x, y + 1, r * .42, 0);
  }

  /* ---------- פרק 9 — מהלך המשמרת ---------- */
  const G = {
    step: 'intro', round: 0, order: null, scoops: [], tops: {}, busy: true, hold: false, idle: 0,
    milkV: 0, milkPerfect: false, pourPerfect: false, poured: false, blendP: 0, blendV: 0, foam: false,
    preCol: MILK, mixCol: MILK, creamP: 0, cream: null, sil: null, straw: null, chunks: [],
    serveK: 0, hint: '', hintA: 0, streams: [], pourLevel: 0, motorLevel: 0, squirtLevel: 0,
    shiftStars: 0, shiftCoins: 0, lastStars: 0, roundStars: [], starPop: null, coinShow: 0, endT: 0, lastNo: 0
  };
  const cust = { key: null, art: null, x: 1950, lx: 1950, t: 0, jump: 0, sq: 0, wig: 0, bubble: 0, walking: false };
  const carton = { x: -200, y: CT, a: 0, u: 0, show: false, slide: false };
  const can = { x: 0, y: -300, a: 0, show: false, ready: false };
  const shaker = { show: false, x: 0, y: 0, a: 0, kind: 'sprinkle', t: -1, busy: false, hit: false, queue: [] };
  const lid = { dy: -420, on: false };
  const tray = { tub: 0, bowl: 1, mode: 'tubs' };
  let drag = null;

  function hint(t) { G.hint = t; G.hintA = 0; }
  function scoopAvg() { const a = G.scoops.map(id => rgb(FL[id].liq)); if (!a.length) return MILK; return [0, 1, 2].map(k => a.reduce((s, c) => s + c[k], 0) / a.length); }
  function sayOrder() { const o = G.order; if (!o) return; say('שלום! אפשר מילקשייק ' + o.flavor.name + ' עם ' + joinHe(o.tops.map(t => t.name)) + '?'); cust.wig = 1; }
  function makeOrder() {
    const f = FLAVORS[(Math.random() * FLAVORS.length) | 0], n = G.round === 1 ? 1 : (Math.random() < .55 ? 1 : 2);
    const pool = TOPS.slice(); for (let i = pool.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; const t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
    return { flavor: f, tops: pool.slice(0, n) };
  }
  function startShift() {
    G.round = 0; G.shiftStars = 0; G.shiftCoins = 0; G.roundStars = []; G.starPop = null;
    try { G.coinShow = typeof Wallet !== 'undefined' ? Wallet.coins : 0; } catch (e) {}
    if (G.step === 'intro') say(fx('ברוכים הבאים לבר המילקשייק של אלה!'));
    nextCustomer();
  }
  function nextCustomer() {
    G.round++; resetStation();
    let k; do { k = CUSTS[(Math.random() * CUSTS.length) | 0]; } while (k === cust.key);
    cust.key = k; cust.art = art('cust_' + k); cust.x = cust.lx = 1950; cust.bubble = 0; cust.jump = 0; cust.sq = 0;
    G.order = makeOrder(); G.step = 'enter'; G.busy = true; G.hint = '';
    SFX.whoosh();
    tween(cust, { x: CUST_X }, 1.25, E.out, () => {
      tween(cust, { bubble: 1 }, .4, E.back); SFX.pop(); sayOrder();
      after(1.8, () => setStep('scoop'));
    }, .4);
  }
  function resetStation() {
    balls.length = 0; flying.length = 0; drag = null; shaker.queue.length = 0; stuck.length = 0; flyers.length = 0; drops.length = 0; G.chunks.length = 0;
    G.scoops = []; G.tops = {}; G.milkPerfect = G.pourPerfect = G.poured = G.foam = false; G.blendP = G.blendV = G.creamP = 0;
    G.cream = null; G.sil = null; G.straw = null; G.serveK = 0; G.serveWanted = false;
    jar.V = 0; jar.col = MILK.slice(); jar.vortex = 0; jar.x = BX; jar.y = JAR_Y; jar.a = 0; P.mode = 'rest'; lid.on = false; lid.dy = -420;
    glass.V = 0; glass.col = MILK.slice(); glass.x = GX; glass.y = -300; glass.h.fill(0); glass.v.fill(0);
    tween(glass, { y: GB }, .75, E.bounce, () => SFX.clink(), .2);
    if (tray.mode !== 'tubs') { tray.mode = 'tubs'; tween(tray, { bowl: 1 }, .3, E.inOut, () => tween(tray, { tub: 0 }, .4, E.back)); }
  }
  function setStep(k) {
    G.step = k; G.busy = false; G.idle = 0; G.hold = false;
    const o = G.order;
    if (k === 'scoop') { hint('🍨 שני כדורי ' + o.flavor.name + ' לבלנדר!'); say('שימו שני כדורי גלידה ' + o.flavor.name + ' בבלנדר!'); }
    else if (k === 'milk') {
      carton.show = true; carton.slide = true; carton.u = 0; carton.a = 0; carton.y = CT; carton.x = -160;
      tween(carton, { x: CARTON_X }, .6, E.back, () => { carton.slide = false; });
      hint('🥛 החזיקו — חלב עד הקו הזהוב!'); say('עכשיו חלב! החזיקו ומלאו עד הקו הזהוב');
    }
    else if (k === 'blend') {
      G.preCol = jar.col.slice(); G.mixCol = mixc(scoopAvg(), MILK, .2);
      lid.on = true; lid.dy = -420; tween(lid, { dy: 0 }, .55, E.bounce, () => SFX.clink());
      hint('🌀 החזיקו — טוחנים!'); say('סוגרים מכסה. החזיקו וטוחנים!');
    }
    else if (k === 'pour') { glass.col = jar.col.slice(); hint('🥤 החזיקו — מוזגים עד הקו!'); say('מוזגים לכוס! החזיקו עד הקו הזהוב'); }
    else if (k === 'cream') {
      const s = glass.level(), h = glass.y - s;
      G.cream = { dy: s - glass.y + 4, R: ghw(h) * .96, H: 118 };
      can.show = true; can.ready = false; can.x = glass.x + 180; can.y = -280; can.a = 0;
      tween(can, { x: glass.x + 4, y: s - 150 }, .6, E.back, () => { can.ready = true; });
      hint('🍦 החזיקו — קצפת!'); say('ועכשיו קצפת! החזיקו מעל הכוס');
    }
    else if (k === 'top') {
      tray.mode = 'bowls'; tween(tray, { tub: 1 }, .3, E.inOut, () => tween(tray, { bowl: 0 }, .45, E.back));
      tween(G, { serveK: 1 }, .45, E.back, null, .8);
      hint('✨ תוספות — ואז הגישו!'); say('עכשיו התוספות: ' + joinHe(o.tops.map(t => t.name)) + '. ואז מגישים!');
    }
  }
  function notYet(msg, h) { if (clock - G.lastNo < 1.4) return; G.lastNo = clock; say(msg); hint(h); }

  // 🍨 כדורי גלידה
  function startScoop(i, x, y) {
    if (G.scoops.length >= 2 || drag) { snd('tap'); return; }
    drag = { f: FLAVORS[i], i, x, y, k: 0, t: 0 }; SFX.scoop();
  }
  function launchScoop() {
    if (!drag) return; const d = drag; drag = null;
    const moved = d.t > .3 || Math.hypot(d.x - SLOT_X[d.i], d.y - 800) > 70;
    const x0 = moved ? d.x : SLOT_X[d.i], y0 = moved ? d.y - 40 : 760;
    flying.push({ f: d.f, x0, y0, x1: BX + rnd(-26, 26), y1: JAR_Y - 330, t: 0, dur: moved ? .4 : .55, arc: moved ? .4 : 1, x: x0, y: y0 });
    G.scoops.push(d.f.id); SFX.whoosh(); say(d.f.name);
  }
  // 🥛 חלב
  const CARTON_SPOUT = [50, -186], CARTON_A = 2.0, CARTON_T = [BX - 24, 258];
  function cartonPose(u) {
    const e = E.inOut(u), a = CARTON_A * e, c = Math.cos(a), s = Math.sin(a);
    const tx = CARTON_T[0] - (CARTON_SPOUT[0] * c - CARTON_SPOUT[1] * s), ty = CARTON_T[1] - (CARTON_SPOUT[0] * s + CARTON_SPOUT[1] * c);
    return [lerp(CARTON_X, tx, e), lerp(CT, ty, e) - 90 * Math.sin(Math.PI * e), a];
  }
  function cartonSpout() { const c = Math.cos(carton.a), s = Math.sin(carton.a); return [carton.x + CARTON_SPOUT[0] * c - CARTON_SPOUT[1] * s, carton.y + CARTON_SPOUT[0] * s + CARTON_SPOUT[1] * c]; }
  function judgeMilk() {
    const d = jar.V - MILK_T;
    if (d >= -2600) {
      G.busy = true; G.milkV = jar.V;
      if (Math.abs(d) <= 2200) { G.milkPerfect = true; word('בדיוק!', BX, 330); sparkle(BX, JAR_Y - MILK_TH, 16); say('בדיוק עד הקו!'); snd('ding'); }
      else say(d > 0 ? 'וואו, הרבה חלב!' : 'יופי!');
      after(1.0, () => { carton.slide = true; tween(carton, { x: -260, a: 0, y: CT }, .5, E.inOut, () => { carton.show = false; }); setStep('blend'); });
    } else if (jar.V > 200) notYet('עוד קצת!', '🥛 עוד קצת — עד הקו הזהוב!');
  }
  // 🥤 מזיגה: הכד מסתובב סביב השפה, כך שהזרם תמיד נופל לכוס
  const P = { mode: 'rest', u: 0, a: 0, fx: 0, fy: 0, fa: 0 }, LIP = [110, -290], A0 = .45, AMAX = 2.25;
  function poseOrigin(a) { const tx = glass.x - 4, ty = glass.y - GH - 70, c = Math.cos(a), s = Math.sin(a); return [tx - (LIP[0] * c - LIP[1] * s), ty - (LIP[0] * s + LIP[1] * c)]; }
  function judgePour() {
    const d = glass.V - G_TARGET;
    if (d >= -3000) {
      G.busy = true;
      if (Math.abs(d) <= 1700) { G.pourPerfect = true; word('מושלם!', glass.x, 300); sparkle(glass.x, glass.level(), 18); say('מושלם! בדיוק עד הקו!'); snd('ding'); }
      else say('יופי!');
      after(.5, frost); after(1.2, () => setStep('cream'));
    } else if (glass.V > 400) notYet('עוד קצת!', '🥤 עוד קצת — עד הקו הזהוב!');
  }
  function frost() {     // טיפות קור על הכוס
    const top = glass.heightOf(glass.V);
    for (let i = 0; i < 30; i++) { const h = rnd(18, Math.max(30, top - 8)), hw = ghw(h) - 6; drops.push({ dx: rnd(-hw, hw), dy: -h, r: rnd(2, 5), a: 0, d: rnd(0, 1.4), vy: Math.random() < .25 ? rnd(4, 11) : 0, min: -12 }); }
  }
  // 🍦 קצפת בספירלה
  const SW_TURNS = 3.2, SW_N = 170;
  function creamBase() { return G.cream ? { x: glass.x, y: glass.y + G.cream.dy, R: G.cream.R, H: G.cream.H } : null; }
  function creamBlobs(p, b) {
    const out = [], TOT = SW_TURNS * Math.PI * 2, n = Math.floor(SW_N * clamp(p, 0, 1));
    for (let i = 0; i <= n; i++) {
      const t = i / SW_N, th = t * TOT + .6, r = b.R * Math.pow(1 - t, .85) * .9 + 3, lift = b.H * Math.pow(t, .92);
      out.push([b.x + Math.cos(th) * r, b.y - lift + Math.sin(th) * r * .3, 8 + 24 * Math.pow(1 - t, .7), Math.sin(th) * r + lift * .3]);
    }
    return out;
  }
  function makeSil() {     // קו הגובה של הקצפת — לשם נוחתות הסוכריות
    const b = creamBase(), bl = creamBlobs(1, b), N = 64, x0 = -b.R - 36, x1 = b.R + 36, a = new Float32Array(N + 1);
    for (let k = 0; k <= N; k++) {
      const x = b.x + lerp(x0, x1, k / N); let top = Infinity;
      for (const p of bl) { const dx = x - p[0]; if (Math.abs(dx) < p[2]) top = Math.min(top, p[1] - Math.sqrt(p[2] * p[2] - dx * dx)); }
      a[k] = top === Infinity ? NaN : top - glass.y;
    }
    G.sil = { x0, x1, a, N, base: b.y - glass.y };
  }
  function creamTop(wx) {
    const s = G.sil; if (!s) return null; const f = (wx - glass.x - s.x0) / (s.x1 - s.x0) * s.N;
    if (f < 0 || f > s.N) return null; const v = s.a[Math.round(f)]; return isNaN(v) ? null : glass.y + v;
  }
  // ✨ תוספות
  function addTopping(t, i) {
    const n = G.tops[t.id] || 0, b = creamBase();
    if ((t.kind === 'sprinkle' || t.kind === 'coconut') && shaker.busy && shaker.queue.length >= 2) return;
    if ((t.kind === 'cherry' || t.kind === 'cookie' || t.kind === 'star') && n) { sparkle(glass.x, b.y - b.H, 6); snd('tap'); return; }
    G.tops[t.id] = n + 1; if (!n) say(t.name);
    const x0 = SLOT_X[i], y0 = 770;
    if (t.kind === 'sprinkle' || t.kind === 'coconut') { const k = t.kind === 'sprinkle' ? 'sprinkle' : 'flake'; if (shaker.busy) shaker.queue.push([k, x0]); else useShaker(k, x0); }   // תור: לא מתעלמים מהקשה בזמן ניעור
    else if (t.kind === 'cherry') fly('cherry', x0, y0, glass.x + 2, b.y - b.H - 20, 0);
    else if (t.kind === 'cookie') fly('cookie', x0, y0, glass.x + b.R * .5, b.y - b.H * .34, .55);
    else fly('star', x0, y0, glass.x - b.R * .52, b.y - b.H * .44, -.3);
    if (!n && G.order.tops.some(o => o.id === t.id)) tween(cust, { jump: .22 }, .14, E.out, () => tween(cust, { jump: 0 }, .35, E.bounce));
  }
  function fly(kind, x0, y0, x1, y1, a1) { flyers.push({ kind, x0, y0, x1, y1, a1, t: 0, dur: .6, x: x0, y: y0, a: 0 }); SFX.whoosh(); }
  function useShaker(kind, x0) {
    const b = creamBase();
    shaker.show = true; shaker.busy = true; shaker.kind = kind; shaker.x = x0; shaker.y = 790; shaker.a = 0; shaker.t = -1; shaker.hit = false;
    tween(shaker, { x: glass.x + 6, y: b.y - b.H - 110, a: Math.PI }, .5, E.inOut, () => { shaker.t = 0; });
  }
  // 🛎️ הגשה
  function serve() {
    if (G.step !== 'top' || G.busy) return;
    if (shaker.busy || shaker.queue.length || flyers.length) { G.serveWanted = true; return; }   // מגישים מיד כשהתוספות נוחתות
    G.serveWanted = false;
    G.busy = true; G.step = 'serve'; tween(G, { serveK: 0 }, .25, E.inOut); SFX.whoosh(); snd('tap');
    G.straw = { dy: -460 }; tween(G.straw, { dy: 0 }, .5, E.bounce);
    after(.55, () => tween(glass, { x: CUST_X - 200 }, .8, E.inOut, react));
  }
  function react() {
    const o = G.order, flavorOK = G.scoops.length >= 2 && G.scoops.every(id => id === o.flavor.id);
    const topsOK = o.tops.every(t => G.tops[t.id]), perfect = G.milkPerfect || G.pourPerfect;
    const stars = Math.max(1, (flavorOK ? 1 : 0) + (topsOK ? 1 : 0) + (perfect ? 1 : 0)), coins = 6 + stars * 4;
    G.lastStars = stars; G.shiftStars += stars; G.shiftCoins += coins; G.roundStars.push(stars);
    try { if (typeof Wallet !== 'undefined') Wallet.add(coins); } catch (e) {}
    tween(cust, { bubble: 0 }, .25, E.inOut);
    tween(cust, { jump: 1 }, .22, E.out, () => tween(cust, { jump: 0 }, .45, E.bounce));
    hearts(cust.x, 520, 3 + stars * 2); snd('happy');
    say(stars === 3 ? 'הכי טעים בעולם! תודה!' : !flavorOK ? 'טעם חדש? טעים! תודה!' : stars === 2 ? 'יאמי! תודה רבה!' : 'טעים! תודה!');
    G.starPop = { n: stars, t: 0, played: 0 };
    const k = Math.min(coins, 8);
    for (let i = 0; i < k; i++) ui.push({ kind: 'coin', x0: cust.x + rnd(-40, 40), y0: 470, x1: W - 186, y1: 52, t: -i * .08, dur: .8, val: coins / k });
    after(1.9, () => {
      SFX.slurp(); after(.45, SFX.slurp); tween(glass, { V: glass.V * .55 }, 1.0, E.inOut);
      tween(cust, { sq: .1 }, .2, E.out, () => tween(cust, { sq: 0 }, .5, E.bounce));
      after(1.5, () => {
        SFX.whoosh(); tween(cust, { x: 1960 }, 1.0, E.inOut); G.starPop = null;
        tween(glass, { x: 1960 - 200 }, 1.0, E.inOut, () => { if (G.round >= ROUNDS) endShift(); else nextCustomer(); });
      });
    });
  }
  function endShift() {
    G.step = 'end'; G.endT = 0; G.busy = true; G.hint = ''; cust.bubble = 0;
    say('כל הכבוד! המשמרת הסתיימה! הרווחתם ' + G.shiftCoins + ' מטבעות');
    for (let i = 0; i < 90; i++) ui.push({ kind: 'conf', x: rnd(vL(), vR()), y: rnd(-200, -20), vx: rnd(-60, 60), vy: rnd(120, 300), a: rnd(0, 6), va: rnd(-6, 6), col: SPRINKLE_COLS[i % 6], t: 0, life: rnd(3, 5) });
    snd('happy');
  }
  function go(u) { try { KidsUI.PageFade.go(u); } catch (e) { location.href = u; } }

  /* ---------- פרק 10 — עדכון לכל פריים ---------- */
  function update(dt) {
    clock += dt;
    stepTweens(dt);
    if (!G.busy && !G.hold && !drag && G.step !== 'intro' && G.step !== 'end') G.idle += dt; else G.idle = 0;
    G.hintA = Math.min(1, G.hintA + dt * 4);
    if (G.step === 'end') G.endT += dt;
    cust.t += dt; cust.walking = Math.abs(cust.x - cust.lx) > 40 * dt; cust.lx = cust.x; cust.wig = Math.max(0, cust.wig - dt * 1.5);
    if (G.starPop) { G.starPop.t += dt; for (let i = 0; i < G.starPop.n; i++) if (G.starPop.t > i * .28 && !(G.starPop.played & (1 << i))) { G.starPop.played |= 1 << i; snd('sparkle'); } }
    jar.stepWaves(dt); glass.stepWaves(dt);
    G.streams.length = 0; G.pourLevel = 0; G.motorLevel = 0; G.squirtLevel = 0;
    if (drag) { drag.t += dt; drag.k = Math.min(1, drag.k + dt * 6); }
    stepScoops(dt); stepMilk(dt); stepBlend(dt); stepPour(dt); stepCream(dt); stepShaker(dt); stepFlyers(dt);
    if (G.serveWanted && !shaker.busy && !shaker.queue.length && !flyers.length) serve();
    for (const d of drops) { if (d.d > 0) { d.d -= dt; continue; } d.a = Math.min(1, d.a + dt * 1.5); if (d.vy && d.dy < d.min) d.dy += d.vy * dt; }
    stepParts(dt);
    shk.k = Math.max(0, shk.k - dt * 3); const sk = shk.k * shk.k * 16; shk.x = (Math.random() - .5) * sk; shk.y = (Math.random() - .5) * sk;
    SFX.pour.set(G.pourLevel); SFX.motor.set(G.motorLevel); SFX.squirt.set(G.squirtLevel);
  }
  function stepScoops(dt) {
    for (let i = flying.length - 1; i >= 0; i--) {
      const f = flying[i]; f.t += dt / f.dur; const u = Math.min(1, f.t);
      f.x = lerp(f.x0, f.x1, u); f.y = lerp(f.y0, f.y1, u) - 200 * Math.sin(Math.PI * u) * f.arc;
      if (u >= 1) { flying.splice(i, 1); balls.push({ f: f.f, x: f.x - jar.x, y: f.y - jar.y, vx: rnd(-60, 60), vy: 380, r: 40, sq: 0 }); }
    }
    if (G.step === 'blend' && G.blendP > 0) return;          // בזמן טחינה הכדורים מסתחררים (stepBlend)
    const surf = jar.V > 60 ? jar.level() - jar.y : 999;
    for (const b of balls) {
      b.vy += 1700 * dt;
      if (b.y + b.r > surf) {                                // צפים: חצי שקוע בחלב
        const sub = clamp((b.y + b.r - surf) / (2 * b.r), 0, 1); b.vy -= sub * 3600 * dt; b.vy *= 1 - 2.6 * dt; b.vx *= 1 - 2.6 * dt;
        if (!b.wet) { b.wet = true; jar.splash(jar.x + b.x, 160); splashDrops(jar.x + b.x, jar.y + surf, jar.col, 6); SFX.plop(); }
      }
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.y > -b.r) { if (b.vy > 160) { SFX.plop(); b.sq = .3; shake(.35); } b.y = -b.r; b.vy = b.vy > 160 ? -b.vy * .22 : 0; b.vx *= .85; }
      const hw = jarHalf(-b.y) - b.r * .9; if (b.x > hw) { b.x = hw; b.vx = -Math.abs(b.vx) * .4; } if (b.x < -hw) { b.x = -hw; b.vx = Math.abs(b.vx) * .4; }
      b.sq = Math.max(0, b.sq - dt * 2.2);
    }
    for (let i = 0; i < balls.length; i++) for (let j = i + 1; j < balls.length; j++) {
      const a = balls[i], b = balls[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || .01, m = a.r + b.r - 8;
      if (d < m) {
        const nx = dx / d, ny = dy / d, o = (m - d) / 2; a.x -= nx * o; a.y -= ny * o; b.x += nx * o; b.y += ny * o;
        const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny; if (rv < 0) { const im = -rv * .6; a.vx -= nx * im; a.vy -= ny * im; b.vx += nx * im; b.vy += ny * im; }
      }
    }
    if (G.step === 'scoop' && !G.busy && G.scoops.length >= 2 && !flying.length && !drag) { G.busy = true; after(.8, () => { say('יופי!'); setStep('milk'); }); }
  }
  function stepMilk(dt) {
    if (G.step !== 'milk' || !carton.show || carton.slide) return;
    const want = G.hold && !G.busy;
    carton.u = clamp(carton.u + (want ? dt / .38 : -dt / .42), 0, 1);
    const p = cartonPose(carton.u); carton.x = p[0]; carton.y = p[1]; carton.a = p[2];
    if (carton.u >= .999 && want) {
      const sp = cartonSpout(), add = 8600 * dt;
      jar.V += add; G.pourLevel = 1; G.poured = true; jar.col = mixc(MILK, scoopAvg(), .1);
      const ly = jar.V > 30 ? jar.level() : jar.y;
      G.streams.push({ x0: sp[0], y0: sp[1], x1: sp[0] + 10, y1: ly + 2, w: 13, col: MILK, bend: 14 });
      jar.splash(sp[0] + 10, 900 * dt); if (Math.random() < dt * 24) splashDrops(sp[0] + 10, ly, MILK, 2);
      if (jar.V >= MILK_T + 4200) G.hold = false;                // עצירה אוטומטית — אף פעם לא נשפך
    }
    if (!G.hold && G.poured && carton.u < .6 && !G.busy) { G.poured = false; judgeMilk(); }
  }
  function stepBlend(dt) {
    if (G.step !== 'blend') return;
    const on = G.hold && !G.busy && lid.on && lid.dy > -6;
    G.blendV = clamp(G.blendV + (on ? dt * 2.2 : -dt * 1.6), 0, 1);
    const v = G.blendV;
    if (v > 0) {
      G.blendP = Math.min(1, G.blendP + v * dt / 2.6); G.motorLevel = v;
      jar.x = BX + (Math.random() - .5) * 7 * v; jar.y = JAR_Y + (Math.random() - .5) * 3 * v; jar.vortex = 34 * v;
      if (Math.random() < dt * 20) jar.splash(BX + rnd(-90, 90), rnd(-120, 120) * v);
      const surf = jar.level() - jar.y;
      for (let i = balls.length - 1; i >= 0; i--) {
        const b = balls[i];
        if (b.ang == null) { b.ang = Math.atan2(1, b.x || 1); b.orb = clamp(Math.abs(b.x), 24, 60); }
        b.ang += v * 7.5 * dt; b.x = Math.cos(b.ang) * b.orb; b.y = lerp(b.y, surf + 4 + Math.sin(b.ang) * 10, 1 - Math.exp(-dt * 6));
        b.r = 40 * clamp(1 - G.blendP * 1.7, 0, 1);
        if (v > .2 && Math.random() < dt * 34) G.chunks.push({ ang: rnd(0, 6.283), rad: rnd(.2, .95), dy: rnd(6, 70), size: rnd(4, 9), col: b.f.ball, life: 1 });
        if (b.r < 4) balls.splice(i, 1);
      }
    } else { jar.x = BX; jar.y = JAR_Y; jar.vortex = 0; }
    for (let i = G.chunks.length - 1; i >= 0; i--) { const c = G.chunks[i]; c.ang += (v * 8 + .4) * dt; c.life -= dt * (.3 + G.blendP * .9); if (c.life <= 0) G.chunks.splice(i, 1); }
    jar.V = G.milkV + 2 * SCOOP_V * clamp(G.blendP * 1.15, 0, 1);
    jar.col = mixc(G.preCol, G.mixCol, E.inOut(clamp(G.blendP * 1.1, 0, 1)));
    if (G.blendP >= 1 && !G.busy) {
      G.busy = true; G.hold = false; G.foam = true; balls.length = 0;
      word('חלק!', BX, 250, '#3ff2b0'); sparkle(BX, JAR_Y - 200, 14); say('איזה שייק חלק!');
      after(1.1, () => { tween(lid, { dy: -420 }, .45, E.inOut, () => { lid.on = false; }); setStep('pour'); });
    }
  }
  function stepPour(dt) {
    if (G.step !== 'pour' && P.mode === 'rest') return;
    const want = G.step === 'pour' && G.hold && !G.busy;
    if (want && (P.mode === 'rest' || P.mode === 'return')) { P.mode = 'lift'; P.u = 0; P.fx = jar.x; P.fy = jar.y; P.fa = jar.a; SFX.whoosh(); }
    if (!want && (P.mode === 'lift' || P.mode === 'pour')) { const was = P.mode; P.mode = 'return'; P.u = 0; P.fx = jar.x; P.fy = jar.y; P.fa = jar.a; if (was === 'pour' && G.step === 'pour' && !G.busy) judgePour(); }
    if (P.mode === 'lift') {
      P.u = Math.min(1, P.u + dt / .45); const e = E.inOut(P.u), o = poseOrigin(A0);
      jar.x = lerp(P.fx, o[0], e); jar.y = lerp(P.fy, o[1], e) - 60 * Math.sin(Math.PI * e); jar.a = lerp(P.fa, A0, e);
      if (P.u >= 1) { P.mode = 'pour'; P.a = A0; }
    } else if (P.mode === 'pour') {
      const ex = jar.V - jar.cap();
      P.a = Math.min(AMAX, P.a + (ex > 2600 ? .14 : .95) * dt);
      const o = poseOrigin(P.a); jar.x = o[0]; jar.y = o[1]; jar.a = P.a;
      const flow = Math.min(clamp(ex * 5, 0, 9000) * dt, jar.V, Math.max(0, G_MAX - glass.V));
      if (flow > 0) {
        jar.V -= flow; glass.V += flow; G.pourLevel = Math.min(1, flow / dt / 6000);
        const lp = jar.lowLip(), ly = glass.V > 30 ? glass.level() : glass.y;
        G.streams.push({ x0: lp[0], y0: lp[1], x1: lp[0] + 8, y1: ly + 2, w: 5 + 11 * Math.sqrt(flow / dt / 9000), col: jar.col, bend: 12 });
        glass.splash(lp[0] + 8, 700 * dt); if (Math.random() < dt * 18) splashDrops(lp[0] + 8, ly, jar.col, 2);
      }
      if (glass.V >= G_MAX - 5 || jar.V < 120) G.hold = false;
    } else if (P.mode === 'return') {
      P.u = Math.min(1, P.u + dt / .55); const e = E.inOut(P.u);
      jar.x = lerp(P.fx, BX, e); jar.y = lerp(P.fy, JAR_Y, e); jar.a = lerp(P.fa, 0, e);
      if (P.u >= 1) { P.mode = 'rest'; jar.x = BX; jar.y = JAR_Y; jar.a = 0; SFX.clink(); }
    }
  }
  function stepCream(dt) {
    if (G.step !== 'cream' || !can.show || !can.ready) return;
    const b = creamBase(), k = 1 - Math.exp(-dt * 12);
    if (G.hold && !G.busy) {
      G.creamP = Math.min(1, G.creamP + dt / 2.3); G.squirtLevel = 1;
      const bl = creamBlobs(G.creamP, b), hd = bl[bl.length - 1];
      can.x = lerp(can.x, hd[0], k); can.y = lerp(can.y, hd[1] - hd[2] - 14, k);
      if (Math.random() < dt * 24) emit({ kind: 'blob', x: can.x + rnd(-4, 4), y: can.y + 4, vx: rnd(-25, 25), vy: rnd(40, 90), gr: 300, life: .22, size: rnd(5, 9) });
      if (G.creamP >= 1) {
        G.busy = true; G.hold = false; can.ready = false; makeSil();
        tween(can, { y: -320, x: can.x + 150 }, .6, E.inOut, () => { can.show = false; });
        word('קצפת!', glass.x, b.y - b.H - 70); sparkle(glass.x, b.y - b.H, 14); say('וואו, איזו קצפת!');
        after(1.0, () => setStep('top'));
      }
    } else {
      can.x = lerp(can.x, glass.x + 4, k * .5); can.y = lerp(can.y, b.y - 150 - G.creamP * b.H - Math.sin(clock * 3) * 6, k * .5);
    }
  }
  function stepShaker(dt) {
    if (!shaker.show || shaker.t < 0) return;
    shaker.t += dt; const ph = shaker.t * 14, sn = Math.sin(ph);
    shaker.a = Math.PI + sn * .35; shaker.x = glass.x + 6 + sn * 36;
    if (sn > .85 && !shaker.hit) {
      shaker.hit = true; SFX.rattle();
      for (let i = 0; i < 14; i++) emit({ kind: shaker.kind, x: shaker.x + rnd(-18, 18), y: shaker.y + 4, vx: rnd(-110, 110), vy: rnd(60, 240), gr: 1300, life: 3, a: rnd(0, 6.3), va: rnd(-8, 8), col: SPRINKLE_COLS[(Math.random() * 6) | 0] });
    }
    if (sn < 0) shaker.hit = false;
    if (shaker.t > 1.25) { shaker.t = -1; tween(shaker, { y: -320, a: Math.PI * 1.4 }, .5, E.inOut, () => { shaker.show = false; shaker.busy = false; if (shaker.queue.length) { const q = shaker.queue.shift(); useShaker(q[0], q[1]); } }); }
  }
  function stepFlyers(dt) {
    for (let i = flyers.length - 1; i >= 0; i--) {
      const f = flyers[i]; f.t += dt / f.dur; const u = Math.min(1, f.t);
      f.x = lerp(f.x0, f.x1, u); f.y = lerp(f.y0, f.y1, u) - 230 * Math.sin(Math.PI * u); f.a = f.a1 * u + Math.sin(u * 9) * .2 * (1 - u);
      if (u >= 1) {
        flyers.splice(i, 1);
        const s = { kind: f.kind, dx: f.x1 - glass.x, dy: f.y1 - glass.y, a: f.a1, bo: f.kind === 'cherry' ? -46 : 0 };
        stuck.push(s); SFX.pop(); sparkle(f.x1, f.y1, 8);
        if (f.kind === 'cherry') tween(s, { bo: 0 }, .55, E.bounce);
      }
    }
  }
  function stepParts(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.t += dt;
      if (p.t >= p.life) { parts.splice(i, 1); continue; }
      p.vy += p.gr * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.a += p.va * dt;
      if ((p.kind === 'sprinkle' || p.kind === 'flake') && p.vy > 0) {
        const top = creamTop(p.x);
        if (top != null && p.y >= top) {
          const depth = Math.max(0, (G.sil.base - (top - glass.y)) * .72);
          stuck.push({ kind: p.kind, dx: p.x - glass.x, dy: top - glass.y + 2 + Math.pow(Math.random(), 1.6) * depth, a: p.a, col: p.col });
          parts.splice(i, 1); continue;
        }
        if (p.y > CT - 3) { p.y = CT - 3; p.vy = 0; p.vx *= .4; p.gr = 0; p.va = 0; }
      }
      if (p.kind === 'drop' && p.landY && p.vy > 0 && p.y > p.landY) { parts.splice(i, 1); continue; }
    }
    for (let i = ui.length - 1; i >= 0; i--) {
      const p = ui[i]; p.t += dt;
      if (p.kind === 'coin') { if (p.t >= p.dur) { ui.splice(i, 1); G.coinShow += p.val; SFX.coin(); if (!ui.some(q => q.kind === 'coin')) { try { G.coinShow = Wallet.coins; } catch (e) {} } } continue; }
      if (p.kind === 'conf') { p.x += p.vx * dt; p.y += p.vy * dt; p.a += p.va * dt; }
      if (p.t >= p.life) ui.splice(i, 1);
    }
  }

  /* ---------- פרק 11 — ציור העולם ---------- */
  function drawCustomer() {
    if (!cust.art || !cust.art.ready || cust.x > vR() + 200) return;
    const bob = cust.walking ? -Math.abs(Math.sin(cust.t * 9)) * 14 : Math.sin(cust.t * 2.2) * 3;
    const sx = 1 + cust.sq, sy = 1 - cust.sq + Math.sin(cust.t * 2.2) * .012;
    g.save(); g.translate(cust.x, CUST_Y + bob - cust.jump * 110); g.rotate(Math.sin(cust.t * 18) * .05 * cust.wig); g.scale(sx, sy);
    g.drawImage(cust.art.cv, -150, -330, 300, 330); g.restore();
  }
  function drawCase() {
    g.save(); rr(g, 72, 744, 916, 140, 16); g.clip();
    if (G.step === 'scoop' && G.order && G.scoops.length < 2) {     // הילה סביב הטעם שהזמינו
      const x = SLOT_X[FLAVORS.indexOf(G.order.flavor)], a = .3 + .2 * Math.sin(clock * 4);
      const rg = g.createRadialGradient(x, 800, 10, x, 800, 120); rg.addColorStop(0, 'rgba(255,220,120,' + a + ')'); rg.addColorStop(1, 'rgba(255,220,120,0)');
      g.fillStyle = rg; g.fillRect(x - 120, 744, 240, 140);
    }
    if (tray.tub < .99) FLAVORS.forEach((f, i) => drawTub(i, f, tray.tub * 175));
    if (tray.bowl < .99) TOPS.forEach((t, i) => drawBowl(i, t, tray.bowl * 175));
    const gr = g.createLinearGradient(72, 744, 420, 884);
    gr.addColorStop(0, 'rgba(255,255,255,.13)'); gr.addColorStop(.42, 'rgba(255,255,255,.02)'); gr.addColorStop(.47, 'rgba(255,255,255,.1)'); gr.addColorStop(.53, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(72, 744, 916, 140);
    g.restore();
  }
  function drawTub(i, f, dy) {
    const x = SLOT_X[i], y = 790 + dy, c = rgb(f.ball);
    g.fillStyle = css(shade(c, -.4)); g.beginPath(); g.ellipse(x, y, 66, 15, 0, 0, Math.PI * 2); g.fill();
    g.drawImage(SCOOP[f.id], x - 80, y - 52, 160, 104);
    const gr = g.createLinearGradient(x - 70, 0, x + 70, 0); gr.addColorStop(0, '#cfc4ea'); gr.addColorStop(.4, '#ffffff'); gr.addColorStop(1, '#b6a8d8');
    g.fillStyle = gr; g.beginPath(); g.moveTo(x - 68, y); g.lineTo(x - 60, y + 92); g.lineTo(x + 60, y + 92); g.lineTo(x + 68, y); g.ellipse(x, y, 68, 16, 0, 0, Math.PI); g.closePath(); g.fill();
    g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
    g.fillStyle = css(c); g.beginPath(); g.moveTo(x - 66, y + 24); g.lineTo(x + 66, y + 24); g.lineTo(x + 65, y + 34); g.lineTo(x - 65, y + 34); g.closePath(); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y + 60, 25, 0, 6.283); g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
    emo(g, f.id, x, y + 62, 30);
  }
  function drawBowl(i, t, dy) {
    const x = SLOT_X[i], y = 806 + dy;
    g.fillStyle = '#d9c2f5'; g.beginPath(); g.ellipse(x, y, 74, 17, 0, 0, Math.PI * 2); g.fill();
    g.drawImage(HEAP[t.id], x - 85, y - 96, 170, 110);
    const gr = g.createLinearGradient(0, y, 0, y + 60); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#ffc6e6');
    g.fillStyle = gr; g.beginPath(); g.moveTo(x + 74, y); g.ellipse(x, y, 74, 60, 0, 0, Math.PI); g.ellipse(x, y, 74, 17, 0, Math.PI, 0, true); g.closePath(); g.fill();
    g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
    g.strokeStyle = '#ff7ec2'; g.lineWidth = 5; g.beginPath(); g.ellipse(x, y + 4, 70, 30, 0, .35, Math.PI - .35); g.stroke();
    if (G.tops[t.id]) { g.fillStyle = '#3ff2b0'; g.beginPath(); g.arc(x + 54, y + 34, 15, 0, 6.283); g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke(); txt(g, '✓', x + 54, y + 35, 20, INK); }
  }
  function drawBase() {
    const x = BX;
    g.fillStyle = 'rgba(20,0,40,.25)'; g.beginPath(); g.ellipse(x, CT - 1, 150, 10, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(x - 102, 612); g.lineTo(x + 102, 612); g.lineTo(x + 124, CT - 6); g.quadraticCurveTo(x + 126, CT, x + 116, CT); g.lineTo(x - 116, CT); g.quadraticCurveTo(x - 126, CT, x - 124, CT - 6); g.closePath();
    let gr = g.createLinearGradient(x - 125, 0, x + 125, 0); gr.addColorStop(0, '#a8185f'); gr.addColorStop(.3, '#ff6fb5'); gr.addColorStop(.55, '#ff4fa3'); gr.addColorStop(1, '#9c1352');
    g.fillStyle = gr; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
    gr = g.createLinearGradient(0, 612, 0, 626); gr.addColorStop(0, '#f4f0ff'); gr.addColorStop(1, '#9a91b5');
    g.fillStyle = gr; g.fillRect(x - 101, 614, 202, 11);
    const by = 654, on = G.step === 'blend';
    if (on && !G.busy) { g.fillStyle = 'rgba(63,242,176,' + (.25 + .2 * Math.sin(clock * 6)) + ')'; g.beginPath(); g.arc(x, by, 42, 0, 6.283); g.fill(); }
    g.fillStyle = '#fff6fb'; g.beginPath(); g.arc(x, by, 28, 0, 6.283); g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
    if (G.blendP > 0) { g.strokeStyle = '#14c78f'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.arc(x, by, 21, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * G.blendP); g.stroke(); }
    g.strokeStyle = '#ff2e93'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.arc(x, by + 1, 10, -1.1, Math.PI + 1.1, true); g.stroke(); g.beginPath(); g.moveTo(x, by - 13); g.lineTo(x, by - 2); g.stroke();
    g.fillStyle = '#fff6fb'; g.beginPath(); g.arc(x - 72, by, 13, 0, 6.283); g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
    const da = -2.2 + G.blendV * 2.6; g.strokeStyle = INK; g.beginPath(); g.moveTo(x - 72, by); g.lineTo(x - 72 + Math.cos(da) * 9, by + Math.sin(da) * 9); g.stroke();
    for (let i = 0; i < 3; i++) { g.fillStyle = G.blendV > i / 3 + .05 ? '#3ff2b0' : 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(x + 58 + i * 16, by, 5, 0, 6.283); g.fill(); }
  }
  function drawJar() {
    g.save(); g.translate(jar.x, jar.y); g.rotate(jar.a); poly(g, JAR); g.fillStyle = 'rgba(214,232,255,.16)'; g.fill(); g.restore();
    if (balls.length) { g.save(); poly(g, jar.world()); g.clip(); for (const b of balls) { const p = jar.pt(b.x, b.y); ballAt(b.f, p[0], p[1], b.r, b.sq); } g.restore(); }
    jar.drawLiquid(.92, G.foam);
    if (G.chunks.length) {
      const surf = jar.level(); g.save(); poly(g, jar.world()); g.clip();
      for (const c of G.chunks) {
        const yl = surf + c.dy * (.6 + .4 * Math.sin(c.ang)), hw = jarHalf(jar.y - yl) - 8, x = jar.x + Math.cos(c.ang) * c.rad * hw;
        g.globalAlpha = clamp(c.life, 0, 1) * .85; g.fillStyle = css(shade(rgb(c.col), Math.sin(c.ang) * .15));
        g.beginPath(); g.ellipse(x, yl, c.size, c.size * .8, c.ang, 0, 6.283); g.fill();
      }
      g.globalAlpha = 1; g.restore();
    }
    g.save(); g.translate(jar.x, jar.y); g.rotate(jar.a); drawJarFront(); g.restore();
  }
  function drawJarFront() {
    let gr = g.createLinearGradient(-90, 0, 90, 0); gr.addColorStop(0, '#3b3355'); gr.addColorStop(.35, '#8a82a6'); gr.addColorStop(1, '#2c2542');
    g.fillStyle = gr; rr(g, -92, -6, 184, 22, 8); g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
    g.lineJoin = 'round'; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-82, -6); g.lineTo(-117, -291); g.moveTo(82, -6); g.lineTo(117, -291);
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 12; g.stroke();
    g.beginPath(); g.moveTo(-89, -6); g.lineTo(-124, -292); g.moveTo(89, -6); g.lineTo(124, -292); g.strokeStyle = 'rgba(27,16,54,.75)'; g.lineWidth = 3; g.stroke();
    gr = g.createLinearGradient(-110, 0, -70, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(-86, -30); g.lineTo(-110, -268); g.lineTo(-94, -268); g.lineTo(-70, -30); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 3;
    for (const h of [72, 144, 216]) { const hw = jarHalf(h); g.beginPath(); g.moveTo(hw - 2, -h); g.lineTo(hw - 20, -h); g.stroke(); }
    if (G.step === 'milk' || (G.step === 'blend' && G.blendP === 0 && !lid.on)) {     // הקו הזהוב — עד כאן ממלאים חלב
      const hw = jarHalf(MILK_TH), y = -MILK_TH, pul = .6 + .4 * Math.sin(clock * 5);
      g.strokeStyle = 'rgba(255,201,60,' + (.35 * pul) + ')'; g.lineWidth = 14; g.beginPath(); g.moveTo(-hw + 4, y); g.lineTo(hw - 4, y); g.stroke();
      g.setLineDash([16, 10]); g.strokeStyle = '#ffc93c'; g.lineWidth = 5; g.beginPath(); g.moveTo(-hw + 4, y); g.lineTo(hw - 4, y); g.stroke(); g.setLineDash([]);
      starOn(g, hw + 26, y, 15, clock);
    }
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 4; g.beginPath(); g.ellipse(0, -292, 120, 9, 0, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = 'rgba(27,16,54,.6)'; g.lineWidth = 2; g.beginPath(); g.ellipse(0, -292, 124, 11, 0, 0, Math.PI); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.moveTo(112, -296); g.lineTo(138, -304); g.lineTo(120, -284); g.closePath(); g.fill(); g.strokeStyle = 'rgba(27,16,54,.6)'; g.lineWidth = 2; g.stroke();
    const hp = () => { g.beginPath(); g.moveTo(-106, -246); g.bezierCurveTo(-190, -244, -186, -96, -92, -86); };
    hp(); g.strokeStyle = INK; g.lineWidth = 30; g.stroke(); hp(); g.strokeStyle = '#ff4fa3'; g.lineWidth = 22; g.stroke(); hp(); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 6; g.stroke();
    if (lid.on) {
      g.save(); g.translate(0, lid.dy);
      gr = g.createLinearGradient(0, -324, 0, -290); gr.addColorStop(0, '#ff8cc6'); gr.addColorStop(1, '#d42a7d');
      g.fillStyle = gr; rr(g, -128, -322, 256, 34, 12); g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
      g.fillStyle = '#ff4fa3'; rr(g, -30, -346, 60, 28, 10); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.45)'; rr(g, -116, -317, 140, 8, 4); g.fill();
      g.restore();
    }
  }
  function ballAt(f, x, y, r, sq) {
    if (r <= .5) return; const k = r / 62, s = sq || 0;
    g.drawImage(SCOOP[f.id], x - 80 * k * (1 + s * .6), y - 82 * k * (1 - s) + 62 * k * s, 160 * k * (1 + s * .6), 160 * k * (1 - s));
  }
  function drawGlass() {
    const lift = clamp(1 - (GB - glass.y) / 400, 0, 1);
    g.fillStyle = 'rgba(20,0,40,' + (.22 * lift) + ')'; g.beginPath(); g.ellipse(glass.x, CT - 1, 84, 9, 0, 0, Math.PI * 2); g.fill();
    g.save(); g.translate(glass.x, glass.y);
    let gr = g.createLinearGradient(-76, 0, 76, 0); gr.addColorStop(0, 'rgba(190,215,240,.8)'); gr.addColorStop(.4, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(170,195,225,.8)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(0, 56, 74, 10, 0, 0, Math.PI * 2); g.fill(); g.lineWidth = 2; g.strokeStyle = 'rgba(27,16,54,.5)'; g.stroke();
    g.fillStyle = 'rgba(232,245,255,.8)'; rr(g, -11, 12, 22, 46, 6); g.fill(); g.stroke();
    poly(g, GLASS); g.fillStyle = 'rgba(214,236,255,.16)'; g.fill();
    g.restore();
    glass.drawLiquid(1, G.foam && glass.V > 100);
    if (G.straw) drawStraw();
    g.save(); g.translate(glass.x, glass.y); drawGlassFront(); g.restore();
  }
  function drawGlassFront() {
    const wall = (side, off) => { g.beginPath(); g.moveTo(side * (44 + off), 2); for (let i = 1; i <= 16; i++) { const h = GH * i / 16; g.lineTo(side * (ghw(h) + off), -h); } };
    for (const s of [-1, 1]) { wall(s, 6); g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 10; g.lineJoin = 'round'; g.stroke(); wall(s, 12); g.strokeStyle = 'rgba(27,16,54,.5)'; g.lineWidth = 2.5; g.stroke(); }
    g.fillStyle = 'rgba(225,240,255,.6)'; g.beginPath(); g.moveTo(-50, 2); g.quadraticCurveTo(0, 26, 50, 2); g.lineTo(44, 0); g.quadraticCurveTo(0, 16, -44, 0); g.closePath(); g.fill();
    const rx = ghw(GH) + 9;
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 4; g.beginPath(); g.ellipse(0, -GH, rx, 12, 0, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = 'rgba(27,16,54,.5)'; g.lineWidth = 2; g.beginPath(); g.ellipse(0, -GH, rx + 3, 14, 0, 0, Math.PI); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.42)'; g.beginPath();
    for (let i = 0; i <= 10; i++) { const h = 36 + 200 * i / 10; g.lineTo(-ghw(h) + 12, -h); }
    for (let i = 10; i >= 0; i--) { const h = 36 + 200 * i / 10; g.lineTo(-ghw(h) + 24, -h); }
    g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.3)'; rr(g, ghw(150) - 22, -190, 7, 70, 4); g.fill();
    if (G.step === 'pour') {                                    // הקו הזהוב בכוס
      const hw = ghw(G_TH), y = -G_TH, pul = .6 + .4 * Math.sin(clock * 5);
      g.strokeStyle = 'rgba(255,201,60,' + (.35 * pul) + ')'; g.lineWidth = 14; g.beginPath(); g.moveTo(-hw + 3, y); g.lineTo(hw - 3, y); g.stroke();
      g.setLineDash([14, 9]); g.strokeStyle = '#ffc93c'; g.lineWidth = 5; g.beginPath(); g.moveTo(-hw + 3, y); g.lineTo(hw - 3, y); g.stroke(); g.setLineDash([]);
      starOn(g, hw + 28, y, 15, clock);
    }
    for (const d of drops) {
      if (d.a <= 0) continue; g.globalAlpha = d.a;
      g.fillStyle = 'rgba(255,255,255,.38)'; g.beginPath(); g.ellipse(d.dx, d.dy, d.r * .85, d.r, 0, 0, 6.283); g.fill();
      g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(d.dx - d.r * .3, d.dy - d.r * .35, d.r * .3, 0, 6.283); g.fill();
    }
    g.globalAlpha = 1;
  }
  function drawStraw() {
    g.save(); g.translate(glass.x + 26, glass.y - 120 + G.straw.dy); g.rotate(.26);
    rr(g, -9, -330, 18, 330, 7); g.save(); g.clip();
    g.fillStyle = '#ffffff'; g.fillRect(-9, -330, 18, 330); g.fillStyle = '#ff4fa3';
    for (let y = -330; y < 0; y += 34) { g.beginPath(); g.moveTo(-9, y); g.lineTo(9, y - 14); g.lineTo(9, y + 2); g.lineTo(-9, y + 16); g.closePath(); g.fill(); }
    g.restore(); rr(g, -9, -330, 18, 330, 7); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
    g.restore();
  }
  function drawCream() {
    const b = creamBase(); if (!b || G.creamP <= 0) return;
    const bl = creamBlobs(G.creamP, b).sort((p, q) => p[3] - q[3]);
    for (const p of bl) g.drawImage(CREAM, p[0] - p[2], p[1] - p[2], p[2] * 2, p[2] * 2);
  }
  function drawStuck() {
    for (const pass of [0, 1]) for (const s of stuck) {
      const big = s.kind === 'cherry' || s.kind === 'cookie' || s.kind === 'star'; if (big !== !!pass) continue;
      const x = glass.x + s.dx, y = glass.y + s.dy + (s.bo || 0);
      if (s.kind === 'sprinkle') sprinkleOn(g, x, y, s.a, s.col, 11);
      else if (s.kind === 'flake') flakeOn(g, x, y, s.a, 1.1);
      else if (s.kind === 'cherry') cherryOn(g, x, y, 17);
      else if (s.kind === 'cookie') cookieOn(g, x, y, 30, s.a);
      else if (s.kind === 'star') starOn(g, x, y, 22, s.a);
    }
  }
  function drawFlyers() {
    for (const f of flyers) {
      if (f.kind === 'cherry') cherryOn(g, f.x, f.y, 17); else if (f.kind === 'cookie') cookieOn(g, f.x, f.y, 30, f.a); else starOn(g, f.x, f.y, 22, f.a);
    }
    for (const f of flying) ballAt(f.f, f.x, f.y, 40, 0);
    if (drag) {
      const x = drag.x, y = drag.y - 40;
      g.save(); g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = 17; g.beginPath(); g.moveTo(x + 18, y + 26); g.lineTo(x + 74, y + 112); g.stroke();
      g.strokeStyle = '#d8d2e8'; g.lineWidth = 10; g.stroke(); g.restore();
      ballAt(drag.f, x, y, 40 * E.back(drag.k), 0);
    }
  }
  function drawCarton() {
    if (!carton.show) return;
    g.save(); g.translate(carton.x, carton.y); g.rotate(carton.a);
    let gr = g.createLinearGradient(-46, 0, 46, 0); gr.addColorStop(0, '#e2e9f7'); gr.addColorStop(.35, '#ffffff'); gr.addColorStop(1, '#c4cfe6');
    g.fillStyle = gr; rr(g, -46, -168, 92, 168, 6); g.fill();
    g.save(); rr(g, -46, -168, 92, 168, 6); g.clip();
    g.fillStyle = '#4aa8ff'; g.fillRect(-46, -50, 92, 32); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-46, -50, 92, 6);
    g.fillStyle = INK; [[-30, -150, 12, 8], [24, -134, 10, 14], [-20, -70, 9, 7], [32, -78, 12, 8]].forEach(s => { g.beginPath(); g.ellipse(s[0], s[1], s[2], s[3], .4, 0, 6.283); g.fill(); });
    g.restore();
    txt(g, 'חלב', 0, -106, 32, '#2a6fd6', '#ffffff', 6);
    rr(g, -46, -168, 92, 168, 6); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
    g.beginPath(); g.moveTo(-46, -168); g.lineTo(0, -204); g.lineTo(46, -168); g.closePath(); g.fillStyle = '#eef3fc'; g.fill(); g.stroke();
    g.fillStyle = '#ffffff'; rr(g, -6, -214, 12, 16, 3); g.fill(); g.lineWidth = 3; g.stroke();
    g.beginPath(); g.moveTo(30, -180); g.lineTo(54, -190); g.lineTo(46, -168); g.closePath(); g.fillStyle = '#fff'; g.fill(); g.stroke();
    g.restore();
  }
  function drawCan() {
    if (!can.show) return;
    g.save(); g.translate(can.x, can.y); g.rotate(can.a);
    g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(-16, -44); g.lineTo(16, -44); g.lineTo(7, -2); g.lineTo(-7, -2); g.closePath(); g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
    g.strokeStyle = 'rgba(27,16,54,.35)'; g.lineWidth = 2; for (const xx of [-6, 0, 6]) { g.beginPath(); g.moveTo(xx * 1.6, -42); g.lineTo(xx * .6, -6); g.stroke(); }
    g.fillStyle = '#ff4fa3'; rr(g, -26, -64, 52, 22, 7); g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
    let gr = g.createLinearGradient(-36, 0, 36, 0); gr.addColorStop(0, '#d9dcef'); gr.addColorStop(.35, '#ffffff'); gr.addColorStop(1, '#c2c6de');
    g.fillStyle = gr; rr(g, -36, -214, 72, 152, 16); g.fill();
    g.save(); rr(g, -36, -214, 72, 152, 16); g.clip(); g.fillStyle = 'rgba(255,79,163,.85)';
    for (let y = -230; y < -40; y += 40) { g.beginPath(); g.moveTo(-40, y); g.lineTo(40, y - 30); g.lineTo(40, y - 16); g.lineTo(-40, y + 14); g.closePath(); g.fill(); }
    g.restore(); rr(g, -36, -214, 72, 152, 16); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.6)'; rr(g, -26, -200, 9, 120, 4); g.fill();
    g.restore();
  }
  function drawShaker() {
    if (!shaker.show) return;
    g.save(); g.translate(shaker.x, shaker.y); g.rotate(shaker.a);
    g.fillStyle = 'rgba(230,245,255,.55)'; rr(g, -34, 22, 68, 110, 14); g.fill();
    g.save(); rr(g, -34, 22, 68, 110, 14); g.clip();
    if (shaker.kind === 'sprinkle') { for (let i = 0; i < 46; i++) sprinkleOn(g, -26 + (i * 17) % 52, 60 + (i * 11) % 70, i * 1.3, SPRINKLE_COLS[i % 6], 10); }
    else { g.fillStyle = '#fffaf0'; g.fillRect(-34, 56, 68, 80); for (let i = 0; i < 20; i++) flakeOn(g, -24 + (i * 13) % 48, 62 + (i * 9) % 66, i, 1); }
    g.restore();
    rr(g, -34, 22, 68, 110, 14); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
    const gr = g.createLinearGradient(-30, 0, 30, 0); gr.addColorStop(0, '#9a91b5'); gr.addColorStop(.4, '#ffffff'); gr.addColorStop(1, '#8a82a6');
    g.fillStyle = gr; rr(g, -30, 0, 60, 26, 8); g.fill(); g.lineWidth = 3; g.stroke();
    g.fillStyle = INK; for (const xx of [-14, 0, 14]) { g.beginPath(); g.arc(xx, 6, 2.6, 0, 6.283); g.fill(); }
    g.restore();
  }
  function drawStream(s) {
    const wob = Math.sin(clock * 31) * 1.4, path = () => { g.beginPath(); g.moveTo(s.x0, s.y0); g.quadraticCurveTo(s.x0 + s.bend, s.y0 + (s.y1 - s.y0) * .25, s.x1 + wob, s.y1); };
    g.lineCap = 'round';
    path(); g.strokeStyle = css(shade(s.col, -.14)); g.lineWidth = s.w + 3; g.stroke();
    path(); g.strokeStyle = css(s.col); g.lineWidth = s.w; g.stroke();
    path(); g.strokeStyle = css(shade(s.col, .6), .85); g.lineWidth = Math.max(1.5, s.w * .25); g.stroke();
  }
  function drawParts() {
    for (const p of parts) {
      const k = 1 - p.t / p.life;
      if (p.kind === 'drop') { g.fillStyle = p.col; g.beginPath(); g.arc(p.x, p.y, p.size, 0, 6.283); g.fill(); }
      else if (p.kind === 'spark') { g.globalAlpha = k; star4(p.x, p.y, p.size * (.5 + k * .5), p.col); }
      else if (p.kind === 'heart') { g.globalAlpha = Math.min(1, k * 2); heartAt(p.x, p.y, p.size, p.col); }
      else if (p.kind === 'sprinkle') { g.globalAlpha = Math.min(1, k * 3); sprinkleOn(g, p.x, p.y, p.a, p.col, 11); }
      else if (p.kind === 'flake') { g.globalAlpha = Math.min(1, k * 3); flakeOn(g, p.x, p.y, p.a, 1.1); }
      else if (p.kind === 'blob') g.drawImage(CREAM, p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
      g.globalAlpha = 1;
    }
  }
  function drawWorld() {
    drawCustomer();
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(layCounter, shk.x * S, shk.y * S); g.restore();
    drawCase(); drawBase();
    drawJar(); drawGlass(); drawCream(); drawStuck();
    drawCarton(); drawCan(); drawShaker(); drawFlyers();
    for (const s of G.streams) drawStream(s);
    drawParts();
  }

  /* ---------- פרק 12 — ממשק ---------- */
  function drawSteps() {
    const n = STEPS.length, gap = 80, cx = 800, cy = 52, idx = STEPS.findIndex(s => s.k === G.step);
    const done = (G.step === 'serve' || G.step === 'end') ? n : idx, w = n * gap + 34;
    comicPanel(g, cx - w / 2, cy - 36, w, 72, 36, '#fffaf0');
    for (let i = 0; i < n; i++) {
      const x = cx + ((n - 1) / 2 - i) * gap, cur = i === idx, ok = i < done, r = cur ? 28 + Math.sin(clock * 5) * 1.5 : 23;
      if (cur) { g.fillStyle = 'rgba(255,46,147,.25)'; g.beginPath(); g.arc(x, cy, r + 9, 0, 6.283); g.fill(); }
      g.fillStyle = cur ? '#ff2e93' : ok ? '#3ff2b0' : '#ece4fb'; g.beginPath(); g.arc(x, cy, r, 0, 6.283); g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
      g.globalAlpha = cur || ok ? 1 : .45; emo(g, STEPS[i].ico, x, cy + 2, cur ? 30 : 24); g.globalAlpha = 1;
      if (ok) { g.fillStyle = '#14c78f'; g.beginPath(); g.arc(x + 17, cy - 17, 10, 0, 6.283); g.fill(); g.lineWidth = 2; g.strokeStyle = INK; g.stroke(); txt(g, '✓', x + 17, cy - 16, 14, '#fff'); }
    }
  }
  function drawCoins() { const x = W - 128, y = 52; comicPanel(g, x - 92, y - 32, 184, 64, 32, '#fffaf0'); coinAt(g, x - 56, y, 21); txt(g, String(Math.round(G.coinShow)), x + 22, y + 2, 34, INK); }
  function bubblePath(x, y, w, h, r, tx) {
    g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.arcTo(x + w, y, x + w, y + r, r); g.lineTo(x + w, y + h - r); g.arcTo(x + w, y + h, x + w - r, y + h, r);
    g.lineTo(tx + 24, y + h); g.lineTo(tx - 8, y + h + 38); g.lineTo(tx - 6, y + h);
    g.lineTo(x + r, y + h); g.arcTo(x, y + h, x, y + h - r, r); g.lineTo(x, y + r); g.arcTo(x, y, x + r, y, r); g.closePath();
  }
  function check(x, y) { g.fillStyle = '#3ff2b0'; g.beginPath(); g.arc(x, y, 13, 0, 6.283); g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke(); txt(g, '✓', x, y + 1, 17, INK); }
  function drawBubble() {
    if (!G.order || cust.bubble <= .01) return;
    const o = G.order, w = 170 + 76 * o.tops.length, h = 118;
    g.save(); g.translate(cust.x + 6, 300); g.scale(cust.bubble, cust.bubble);
    g.fillStyle = INK; g.save(); g.translate(5, 7); bubblePath(-w / 2, -h / 2, w, h, 26, -24); g.fill(); g.restore();
    g.fillStyle = '#fffaf0'; bubblePath(-w / 2, -h / 2, w, h, 26, -24); g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
    let x = w / 2 - 54;
    ballAt(o.flavor, x - 30, 6, 27, 0); ballAt(o.flavor, x + 2, 2, 27, 0);
    if (G.scoops.length >= 2 && G.scoops.every(id => id === o.flavor.id)) check(x + 26, 34);
    x -= 96; txt(g, '+', x + 22, 2, 34, '#b9a8d9');
    for (const t of o.tops) { g.drawImage(TICON[t.id], x - 32, -32, 64, 64); if (G.tops[t.id]) check(x + 22, 32); x -= 76; }
    emo(g, '🔊', w / 2 - 16, -h / 2 + 18, 18);
    g.restore();
  }
  function drawServe() {
    if (G.serveK <= .01) return;
    const pulse = 1 + Math.sin(clock * 5) * .04;
    g.save(); g.translate(SERVE.x, SERVE.y); g.scale(G.serveK * pulse, G.serveK * pulse); comicBtn(-150, -46, 300, 92, '#5ff5c0', '#14a77a', '✓ הגישו!', 42); g.restore();
  }
  function drawStarPop() {
    const s = G.starPop; if (!s) return;
    for (let i = 0; i < 3; i++) {
      const t = s.t - i * .28; if (t < 0) continue;
      const sc = E.back(Math.min(1, t / .35)); g.save(); g.translate(cust.x + 20 + (1 - i) * 72, 372); g.scale(sc, sc);
      if (i < s.n) starOn(g, 0, 0, 32, 0); else { g.globalAlpha = .45; starOn(g, 0, 0, 26, 0); }
      g.restore();
    }
  }
  function handTarget() {
    switch (G.step) {
      case 'scoop': return (G.scoops.length >= 2 || drag) ? null : [SLOT_X[FLAVORS.indexOf(G.order.flavor)], 800, 'tap'];
      case 'milk': return [CARTON_X, 580, 'hold'];
      case 'blend': return [BX, 654, 'hold'];
      case 'pour': return [BX + 20, 440, 'hold'];
      case 'cream': return [glass.x, 330, 'hold'];
      case 'top': { const t = G.order.tops.find(t => !G.tops[t.id]); return t ? [SLOT_X[TOPS.indexOf(t)], 790, 'tap'] : [SERVE.x, SERVE.y, 'tap']; }
    }
    return null;
  }
  function drawHand() {
    if (G.idle < 3.5 || G.busy) return; const t = handTarget(); if (!t) return;
    const ph = (clock * 1.3) % 1, press = t[2] === 'hold';
    if (press) { g.strokeStyle = 'rgba(255,255,255,' + (1 - ph) + ')'; g.lineWidth = 5; g.beginPath(); g.arc(t[0], t[1], 16 + ph * 44, 0, 6.283); g.stroke(); }
    const bob = press ? Math.max(0, Math.sin(clock * 5)) * 10 : Math.sin(clock * 6) * 9;
    g.save(); g.translate(t[0] + 22, t[1] + 52 + bob); g.rotate(-.35); emo(g, '👆', 0, 0, 76); g.restore();
  }
  function drawWord(p) {
    const k = p.t / p.life, s = k < .18 ? E.back(k / .18) : 1, a = k > .75 ? 1 - (k - .75) / .25 : 1;
    g.save(); g.globalAlpha = a; g.translate(p.x, p.y - k * 30); g.scale(s, s); g.rotate(-.08);
    g.font = '900 54px ' + FONT; const rx = g.measureText(p.text).width / 2 + 48, ry = 60;
    const burst = (ox, oy) => { g.beginPath(); for (let i = 0; i < 24; i++) { const t = i / 24 * Math.PI * 2, q = i % 2 ? .78 : 1; g.lineTo(ox + Math.cos(t) * rx * q, oy + Math.sin(t) * ry * q); } g.closePath(); };
    g.fillStyle = INK; burst(5, 6); g.fill(); g.fillStyle = p.col; burst(0, 0); g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
    txt(g, p.text, 0, 3, 54, '#fff', INK, 10);
    g.restore();
  }
  function drawUiParts() {
    for (const p of ui) {
      if (p.kind === 'word') drawWord(p);
      else if (p.kind === 'coin' && p.t > 0) { const u = E.inOut(Math.min(1, p.t / p.dur)), x = lerp(p.x0, p.x1, u), y = lerp(p.y0, p.y1, u) - Math.sin(Math.PI * u) * 160; coinAt(g, x, y, 18); }
      else if (p.kind === 'conf') { g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.fillStyle = p.col; g.fillRect(-7, -4, 14, 8); g.restore(); }
    }
  }
  function dim() { g.fillStyle = 'rgba(16,6,40,.55)'; g.fillRect(vL(), vT(), vR() - vL(), vB() - vT()); }
  function drawIntro() {
    dim(); comicPanel(g, 380, 170, 840, 540, 40, '#fffaf0');
    txt(g, fx('בר המילקשייק של אלה'), 800, 252, 64, '#ff2e93', INK, 10);
    txt(g, '🧪 גרסת ניסיון — משחק הגלידה מהעגלה, בדרך חדשה', 800, 326, 28, INK);
    STEPS.forEach((s, i) => { const x = 800 + (2.5 - i) * 112; g.fillStyle = '#efe6ff'; g.beginPath(); g.arc(x, 422, 42, 0, 6.283); g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke(); emo(g, s.ico, x, 424, 44); if (i < 5) txt(g, '←', x - 56, 424, 28, '#b9a8d9'); });
    txt(g, 'לקוחות מזמינים — אתם מכינים, מוזגים ומקשטים!', 800, 508, 30, '#5b4d7a');
    const pulse = 1 + Math.sin(clock * 4) * .03; g.save(); g.translate(800, 610); g.scale(pulse, pulse); comicBtn(-190, -52, 380, 104, '#ff8cc6', '#e2338a', '▶ מתחילים!', 48); g.restore();
  }
  const END_BTN = [{ x: 800, y: 540, w: 400, h: 100, k: 'again' }, { x: 620, y: 664, w: 320, h: 80, k: 'cart' }, { x: 980, y: 664, w: 320, h: 80, k: 'home' }];
  function drawEnd() {
    dim(); const k = E.back(Math.min(1, G.endT / .5));
    g.save(); g.translate(800, 450); g.scale(k, k); g.translate(-800, -450);
    comicPanel(g, 420, 160, 760, 580, 40, '#fffaf0');
    txt(g, 'המשמרת הסתיימה! 🎉', 800, 240, 58, '#ff2e93', INK, 10);
    for (let i = 0; i < ROUNDS; i++) for (let j = 0; j < 3; j++) {      // שלושה כוכבים קטנים לכל לקוח — מלאים לפי מה שקיבל
      const x = 800 + (2 - i) * 132 + (1 - j) * 34; g.globalAlpha = j < (G.roundStars[i] || 0) ? 1 : .22; starOn(g, x, 330, 16, 0); g.globalAlpha = 1;
    }
    txt(g, G.shiftStars + ' כוכבים מתוך ' + ROUNDS * 3, 800, 390, 34, INK);
    coinAt(g, 1005, 448, 22); txt(g, 'הרווחתם ' + G.shiftCoins + ' מטבעות', 800, 450, 34, '#5b4d7a');
    comicBtn(600, 490, 400, 100, '#ff8cc6', '#e2338a', '🔁 עוד משמרת', 42);
    comicBtn(460, 624, 320, 80, '#8fd8ff', '#2a6fd6', '🚚 לעגלה הרגילה', 30);
    comicBtn(820, 624, 320, 80, '#c9b8ff', '#7a5cff', '🏠 הביתה', 32);
    g.restore();
  }
  function drawUI() {
    if (G.step !== 'intro') { drawSteps(); drawCoins(); }
    drawBubble();
    if (G.hint && ['scoop', 'milk', 'blend', 'pour', 'cream', 'top'].indexOf(G.step) >= 0) { g.globalAlpha = G.hintA; txt(g, G.hint, 800, 128, 36, '#ffffff', INK, 9); g.globalAlpha = 1; }
    drawServe(); drawStarPop(); drawHand(); drawUiParts();
    if (G.step === 'intro') drawIntro();
    if (G.step === 'end') drawEnd();
  }

  /* ---------- פרק 13 — קלט ---------- */
  let ptr = null;
  function toDesign(e) { const r = cv.getBoundingClientRect(); return [((e.clientX - r.left) * dpr - OX) / S, ((e.clientY - r.top) * dpr - OY) / S]; }
  function slotAt(x, y) { if (y < 735 || y > 895) return -1; for (let i = 0; i < 5; i++) if (Math.abs(x - SLOT_X[i]) < 86) return i; return -1; }
  function down(x, y) {
    G.idle = 0;
    if (G.step === 'intro') { if (Math.abs(x - 800) < 200 && Math.abs(y - 610) < 60) startShift(); return; }
    if (G.step === 'end') { if (G.endT < .6) return; const b = END_BTN.find(b => Math.abs(x - b.x) < b.w / 2 && Math.abs(y - b.y) < b.h / 2); if (b) { snd('tap'); if (b.k === 'again') startShift(); else go(b.k === 'cart' ? 'cart.html' : 'index.html'); } return; }
    if (cust.bubble > .6 && Math.abs(x - cust.x) < 180 && y > 230 && y < 370) { sayOrder(); return; }
    if (G.busy) return;
    if (G.step === 'scoop' || G.step === 'top') {
      if (Math.abs(x - cust.x) < 110 && y > 450 && y < 680) { cust.wig = 1; SFX.giggle(); hearts(cust.x, 500, 2); return; }
      if (G.step === 'scoop') { const i = slotAt(x, y); if (i >= 0) startScoop(i, x, y); return; }
      if (G.serveK > .6 && Math.abs(x - SERVE.x) < 155 && Math.abs(y - SERVE.y) < 52) { serve(); return; }
      const i = slotAt(x, y); if (i >= 0) addTopping(TOPS[i], i); return;
    }
    if (y > 95) G.hold = true;      // מילוי, טחינה, מזיגה וקצפת: מחזיקים בכל מקום על המסך
  }
  function up() { G.hold = false; if (drag) launchScoop(); }
  cv.addEventListener('pointerdown', e => {
    if (ptr) return; e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (_) {}
    try { if (window.Sound) Sound.unlock(); } catch (_) {}
    const p = toDesign(e); ptr = { id: e.pointerId }; down(p[0], p[1]);
  });
  cv.addEventListener('pointermove', e => { if (!ptr || e.pointerId !== ptr.id || !drag) return; const p = toDesign(e); drag.x = p[0]; drag.y = p[1]; });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => cv.addEventListener(t, e => { if (!ptr || e.pointerId !== ptr.id) return; ptr = null; up(); }));
  addEventListener('keydown', e => { if (e.code === 'Space' && !e.repeat) { e.preventDefault(); if (['milk', 'blend', 'pour', 'cream'].indexOf(G.step) >= 0 && !G.busy) G.hold = true; } });
  addEventListener('keyup', e => { if (e.code === 'Space') G.hold = false; });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { G.hold = false; SFX.pour.set(0); SFX.motor.set(0); SFX.squirt.set(0); } });
  addEventListener('resize', () => resize());

  /* ---------- פרק 14 — לולאה ושומר ביצועים ---------- */
  let last = performance.now(), perfT = 0, perfN = 0;
  function frame(now) {
    let dt = (now - last) / 1000; last = now; if (dt < 0) dt = 0;
    if (!document.hidden && dt < .5) { perfT += dt; perfN++; if (perfT > 2.5) { if (perfT / perfN > 1 / 36 && dprCap > 1) { dprCap = dprCap > 1.5 ? 1.5 : 1; resize(); } perfT = 0; perfN = 0; } }
    dt = Math.min(dt, .05) * SPEED;
    const n = Math.ceil(dt / .034); for (let i = 0; i < n; i++) update(dt / n);
    render();
    requestAnimationFrame(frame);
  }
  function render() {
    g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(layBack, 0, 0);
    g.setTransform(S, 0, 0, S, OX + shk.x * S, OY + shk.y * S); drawWorld();
    g.setTransform(S, 0, 0, S, OX, OY); drawUI();
  }
  function init() {
    FLAVORS.forEach(f => SCOOP[f.id] = makeScoop(f)); CREAM = makeCream();
    TOPS.forEach(t => { TICON[t.id] = makeTopIcon(t.kind); HEAP[t.id] = makeHeap(t.kind); });
    try { G.coinShow = typeof Wallet !== 'undefined' ? Wallet.coins : 0; } catch (e) {}
    resize();
    try { if (document.fonts) document.fonts.load('900 60px Rubik', 'אבג').then(() => buildLayers()).catch(() => {}); } catch (e) {}
    requestAnimationFrame(frame);
  }

  /* ---------- פרק 15 — חשיפה לבדיקות ---------- */
  window.ShakeLab = {
    state: () => ({ step: G.step, round: G.round, busy: G.busy, scoops: G.scoops.slice(), jarV: Math.round(jar.V), glassV: Math.round(glass.V), blend: +G.blendP.toFixed(2), cream: +G.creamP.toFixed(2),
      tops: Object.keys(G.tops), stars: G.lastStars, shiftCoins: G.shiftCoins, order: G.order && { flavor: G.order.flavor.id, flavorIndex: FLAVORS.indexOf(G.order.flavor), tops: G.order.tops.map(t => t.id), topIndex: G.order.tops.map(t => TOPS.indexOf(t)) } }),
    targets: () => ({ milk: Math.round(MILK_T), glass: Math.round(G_TARGET), glassMax: Math.round(G_MAX) }),
    start: () => startShift(),
    tapTub: (i) => { if (G.step !== 'scoop' || G.busy) return false; startScoop(i, SLOT_X[i], 800); launchScoop(); return true; },
    hold: (on) => { G.hold = !!on && !G.busy; },
    topping: (i) => { if (G.step === 'top' && !G.busy) addTopping(TOPS[i], i); },
    serve: () => serve(),
    speed: (k) => { SPEED = k; },
    /* tick — מריץ את המשחק sec שניות בצעדים של 1/60 ומצייר פריים (בדיקות בדפדפן מוסתר, שבו requestAnimationFrame לא רץ) */
    tick: (sec) => { for (let t = 0; t < sec; t += 1 / 60) update(1 / 60); render(); return window.ShakeLab.state(); }
  };
  init();
})();
