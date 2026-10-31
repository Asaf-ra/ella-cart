/* =====================================================================
   shared/real-fx.js — "מנוע ריאליזם" לקנבס (שלב 20 · גרסה 6.0)
   ---------------------------------------------------------------------
   מטרה: להפוך את משחקי הקנבס (מכוניות, רכיבה, חווה, משחקי שניים) לחדים
   וריאליסטיים יותר — בלי תמונות חיצוניות ובלי לפגוע בביצועים באייפד.
   כל הפונקציות מקבלות קנבס (c) ומציירות עליו; כל מה שיקר מצויר פעם אחת
   לקנבס נסתר ונשמר בזיכרון (cache), ובכל פריים רק "מודבק" (drawImage).

   מפת פרקים (לאיתור תקלות — חפשו "פרק N"):
   פרק 1 — עזרי צבע: hex→rgb, ערבוב, הבהרה/הכהיה
   פרק 2 — ספרייטים חדים: אימוג'י ב-256px (במקום 128) + החלקה איכותית
   פרק 3 — שמיים: גרדיאנט רב-שלבי + אובך אופק (פרספקטיבה אווירית)
   פרק 4 — שמש: ליבה, הילה (bloom), קורונה והשתקפויות עדשה (lens flare)
   פרק 5 — עננים נפחיים: 3 דגמים מצוירים מראש עם הצללה תחתונה
   פרק 6 — רכסי הרים/גבעות: קו רכס רב-תדרי, גרדיאנט אנכי, קו אור (rim light), שלג
   פרק 7 — צל מגע: אליפסה רכה מתחת לכל עצם (הדבר שהכי "מושיב" עצמים בעולם)
   פרק 8 — זוהר/פנסים: הילת אור רכה (פנסי בלם, רמזור, פנסים קדמיים)
   פרק 9 — דירוג צבע קולנועי: ויניטה + אור חם מלמעלה (פעם אחת בסוף הפריים)
   פרק 10 — סימון הדף כ"חד": מבטל את רסטר הנקודות של marvel-skin מעל הקנבס
   ===================================================================== */
(function () {
  'use strict';

  /* ================= פרק 1 — עזרי צבע ================= */
  /* rgb(hex) — '#ff8800' → [255,136,0]. מקבל גם 'rgb(r,g,b)'. ערך לא תקין → אפור */
  function rgb(h) {
    if (!h) return [128, 128, 128];
    if (h[0] === '#') { if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3]; var n = parseInt(h.slice(1, 7), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
    var m = h.match(/[\d.]+/g); return m ? [+m[0], +m[1], +m[2]] : [128, 128, 128];
  }
  /* mix(a, b, t) — ערבוב שני צבעים: t=0 → a, t=1 → b */
  function mix(a, b, t) { var A = rgb(a), B = rgb(b); return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(A[i] + (B[i] - A[i]) * t); }).join(',') + ')'; }
  /* shade(col, k) — k>0 מבהיר לכיוון לבן, k<0 מכהה לכיוון שחור-כחלחל (צל אמיתי אינו שחור טהור) */
  function shade(col, k) { return k >= 0 ? mix(col, '#ffffff', k) : mix(col, '#0a0f24', -k); }
  /* rgba(col, a) — אותו צבע עם שקיפות */
  function rgba(col, a) { var A = rgb(col); return 'rgba(' + A[0] + ',' + A[1] + ',' + A[2] + ',' + a + ')'; }

  /* ================= פרק 2 — ספרייטים חדים ================= */
  var SPR = {};
  var EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  /* sprite(e, px) — אימוג'י כתמונה ברזולוציה גבוהה (ברירת מחדל 256px). שומר במטמון לפי אימוג'י+גודל.
     ההבדל מול 128px: באייפד (DPR 2) עצם בגובה 120 נקודות כבר לא נמתח ולא מטושטש */
  function sprite(e, px) {
    px = px || 256; var k = e + '|' + px; if (SPR[k]) return SPR[k];
    var c = document.createElement('canvas'); c.width = c.height = px; var x = c.getContext('2d');
    x.font = Math.round(px * .8125) + 'px ' + EMOJI_FONT; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e, px / 2, px * .5625);
    return (SPR[k] = c);
  }
  /* smooth(c) — החלקה איכותית לכל drawImage מוקטן (ברירת המחדל בספארי היא 'low') */
  function smooth(c) { try { c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; } catch (e) {} }
  /* soft(c, fn) — לתמונות רכות (הילה, ענן, ויניטה, צל) מספיקה החלקה רגילה; 'high' על הגדלה גדולה יקר מאוד בכל פריים */
  function soft(c, fn) { var q = c.imageSmoothingQuality; try { c.imageSmoothingQuality = 'low'; } catch (e) {} fn(); try { c.imageSmoothingQuality = q; } catch (e) {} }

  /* ================= פרק 3 — שמיים ================= */
  /* sky(c, W, H, horizonY, top, mid, low) — גרדיאנט שמיים + פס אובך בהיר מעל קו האופק.
     באמת, השמיים בהירים ולבנבנים ליד האופק (פיזור אור באוויר) — זה מה שנותן עומק */
  function sky(c, W, H, hy, top, mid, low, night) {
    var g = c.createLinearGradient(0, 0, 0, hy);
    g.addColorStop(0, shade(top, -.08)); g.addColorStop(.45, top); g.addColorStop(.8, mid); g.addColorStop(1, low);
    c.fillStyle = g; c.fillRect(-W, -H, W * 3, hy + H);
    var hz = c.createLinearGradient(0, hy - H * .16, 0, hy + 4);
    hz.addColorStop(0, 'rgba(255,255,255,0)'); hz.addColorStop(1, night ? 'rgba(120,140,220,.22)' : 'rgba(255,250,235,.55)');
    c.fillStyle = hz; c.fillRect(-W, hy - H * .16, W * 3, H * .16 + 4);
  }

  /* ================= פרק 4 — שמש ================= */
  /* sun(c, x, y, r, opts) — שמש ריאליסטית: הילה רחבה (bloom), קורונה, ליבה לבנה-חמה.
     opts.col = גוון (ברירת מחדל צהוב-חם), opts.moon = ירח (קר ובלי bloom חזק), opts.W/H = לצורך השתקפויות עדשה */
  var SUNS = {}, GHOSTS = {};
  /* sunImg(col, moon) — ביצועים: ההילה והליבה מצוירות פעם אחת לקנבס 256px (רדיוס בסיס 14), ובכל פריים רק מוגדלות */
  function sunImg(col, moon) {
    var k = col + moon; if (SUNS[k]) return SUNS[k];
    var cv = document.createElement('canvas'); cv.width = cv.height = 256; var c = cv.getContext('2d'), x = 128, y = 128, r = 14;
    var big = c.createRadialGradient(x, y, r * .5, x, y, r * (moon ? 4 : 9));
    big.addColorStop(0, rgba(col, moon ? .35 : .55)); big.addColorStop(.25, rgba(col, moon ? .12 : .22)); big.addColorStop(1, rgba(col, 0));
    c.fillStyle = big; c.fillRect(0, 0, 256, 256);
    var core = c.createRadialGradient(x - r * .2, y - r * .2, r * .1, x, y, r);
    core.addColorStop(0, '#ffffff'); core.addColorStop(.7, moon ? '#f4f1dc' : '#fffbe6'); core.addColorStop(1, moon ? '#d9d4b8' : col);
    c.fillStyle = core; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    if (moon) { c.globalAlpha = .18; c.fillStyle = '#9a9478'; [[-.3, -.2, .22], [.25, .15, .17], [-.05, .38, .12]].forEach(function (m) { c.beginPath(); c.arc(x + m[0] * r, y + m[1] * r, m[2] * r, 0, 7); c.fill(); }); }
    return (SUNS[k] = cv);
  }
  function ghostImg(col) {
    if (GHOSTS[col]) return GHOSTS[col]; var cv = document.createElement('canvas'); cv.width = cv.height = 64; var c = cv.getContext('2d');
    var g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, col); g.addColorStop(.75, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); return (GHOSTS[col] = cv);
  }
  /* sun(c, x, y, r, opts) — שמש ריאליסטית: הילה רחבה (bloom), קורונה, ליבה לבנה-חמה.
     opts.col = גוון (ברירת מחדל צהוב-חם), opts.moon = ירח (קר, עם מכתשים), opts.W/H = השתקפויות עדשה, opts.noFlare = בלי השתקפויות */
  function sun(c, x, y, r, o) {
    o = o || {}; var col = o.col || '#fff1b0', moon = !!o.moon, k = r / 14;
    soft(c, function () { c.drawImage(sunImg(col, moon), x - 128 * k, y - 128 * k, 256 * k, 256 * k); });
    /* השתקפויות עדשה: עיגולים שקופים על הקו מהשמש אל מרכז המסך — כמו מצלמה אמיתית */
    if (!moon && o.W && !o.noFlare) {
      var cx = o.W / 2, cy = o.H / 2, dx = cx - x, dy = cy - y; c.save(); c.globalCompositeOperation = 'lighter';
      [[.45, .6, 'rgba(255,200,120,.05)'], [.8, .18, 'rgba(140,220,255,.045)'], [1.25, 1.1, 'rgba(255,160,220,.03)'], [1.6, .3, 'rgba(255,255,200,.04)']].forEach(function (f) {
        var fr = r * f[1]; c.drawImage(ghostImg(f[2]), x + dx * f[0] - fr, y + dy * f[0] - fr, fr * 2, fr * 2); });
      c.restore();
    }
  }

  /* ================= פרק 5 — עננים נפחיים ================= */
  var CLOUDS = {};
  /* cloudImg(v, tint) — מצייר פעם אחת ענן "קומולוס": 18 בועות עם גרדיאנט רדיאלי (מואר מלמעלה),
     ואז הצללה תחתונה כחלחלה בשיטת source-atop. v = דגם 0..2, tint = 'day' / 'dusk' / 'storm' */
  function cloudImg(v, tint) {
    var k = v + tint; if (CLOUDS[k]) return CLOUDS[k];
    var w = 512, h = 220, cv = document.createElement('canvas'); cv.width = w; cv.height = h; var x = cv.getContext('2d');
    var seed = 7 + v * 31; function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    var base = tint === 'storm' ? '#b9c2d3' : tint === 'dusk' ? '#ffe2c8' : '#ffffff';
    for (var i = 0; i < 18; i++) {
      var t = i / 17, bx = 70 + t * (w - 140) + (rnd() - .5) * 40, br = 38 + Math.sin(t * Math.PI) * 52 + rnd() * 18, by = h - 50 - Math.sin(t * Math.PI) * 50 - rnd() * 22;
      var g = x.createRadialGradient(bx - br * .25, by - br * .35, br * .1, bx, by, br);
      g.addColorStop(0, base); g.addColorStop(.75, rgba(base, .95)); g.addColorStop(1, rgba(base, 0));
      x.fillStyle = g; x.beginPath(); x.arc(bx, by, br, 0, 7); x.fill();
    }
    x.globalCompositeOperation = 'source-atop';
    var sh = x.createLinearGradient(0, h * .3, 0, h);
    sh.addColorStop(0, 'rgba(120,140,180,0)'); sh.addColorStop(1, tint === 'storm' ? 'rgba(60,70,95,.65)' : tint === 'dusk' ? 'rgba(170,110,150,.45)' : 'rgba(120,145,190,.42)');
    x.fillStyle = sh; x.fillRect(0, 0, w, h);
    return (CLOUDS[k] = cv);
  }
  /* cloud(c, x, y, width, alpha, v, tint) — מדביק ענן מוכן במיקום וברוחב נתונים */
  function cloud(c, x, y, wd, a, v, tint) { var im = cloudImg((v || 0) % 3, tint || 'day'); c.globalAlpha = a == null ? 1 : a; soft(c, function () { c.drawImage(im, x - wd / 2, y - wd * .43, wd, wd * .43); }); c.globalAlpha = 1; }
  /* cloudLayer(c, W, H, t, off, opts) — שכבת עננים נעה: n עננים, גובה בין y0 ל-y1, פרלקסה לפי off */
  function cloudLayer(c, W, H, t, off, o) {
    o = o || {}; var n = o.n || 5, y0 = o.y0 == null ? .08 : o.y0, y1 = o.y1 == null ? .3 : o.y1, span = W + 700;
    for (var i = 0; i < n; i++) {
      var sp = 6 + (i % 3) * 5, px = ((i * 397 + t * sp - off * (.3 + (i % 2) * .2)) % span + span) % span - 350, py = H * (y0 + (y1 - y0) * ((i * 37) % 10) / 10), wd = W * (.22 + (i % 3) * .08) * (1 - (py / H - y0) * .8);
      cloud(c, px, py, wd, o.a == null ? .95 : o.a, i, o.tint);
    }
  }

  /* ================= פרק 6 — רכסים וגבעות ================= */
  /* ridgeY(x, seed, amp) — גובה הרכס בנקודה x: סכום 4 גלי סינוס בתדרים שונים = קו טבעי ולא "גלי" */
  function ridgeY(x, seed, rough) {
    return (Math.sin(x / 260 + seed) * .45 + Math.sin(x / 113 + seed * 2.3) * .28 + Math.sin(x / 47 + seed * 3.7) * .14 * rough + Math.sin(x / 19 + seed * 5.1) * .06 * rough + .93) / 1.86;
  }
  /* ridge(c, W, H, yBase, amp, off, o) — רכס עם גרדיאנט אנכי (בהיר-כחלחל למעלה = רחוק, כהה למטה),
     o.top / o.bottom = צבעים, o.seed, o.rough (0..1 = חספוס), o.snow = כיפות שלג, o.rim = קו אור על הרכס, o.haze = אובך בבסיס */
  function ridge(c, W, H, yB, amp, off, o) {
    o = o || {}; var seed = o.seed || 1, rough = o.rough == null ? 1 : o.rough, step = 14, pts = [];
    for (var x = -step; x <= W + step; x += step) pts.push([x, yB - ridgeY(x + off, seed, rough) * amp]);
    var g = c.createLinearGradient(0, yB - amp, 0, yB + 6); g.addColorStop(0, o.top); g.addColorStop(1, o.bottom || shade(o.top, -.25));
    c.beginPath(); c.moveTo(-step, H + 10); pts.forEach(function (p) { c.lineTo(p[0], p[1]); }); c.lineTo(W + step, H + 10); c.closePath(); c.fillStyle = g; c.fill();
    if (o.snow) { c.save(); c.clip(); var sg = c.createLinearGradient(0, yB - amp, 0, yB - amp * .55); sg.addColorStop(0, 'rgba(255,255,255,.95)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = sg; c.fillRect(0, yB - amp - 4, W, amp * .5); c.restore(); }
    if (o.rim !== false) { c.beginPath(); pts.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.lineWidth = 2; c.strokeStyle = o.rim || 'rgba(255,255,255,.28)'; c.stroke(); }
    if (o.haze) { var hg = c.createLinearGradient(0, yB - amp * .5, 0, yB + 6); hg.addColorStop(0, rgba(o.haze, 0)); hg.addColorStop(1, rgba(o.haze, .6)); c.fillStyle = hg; c.fillRect(-step, yB - amp * .5, W + step * 2, amp * .5 + 6); }
  }
  /* treeLine(c, W, yB, h, off, col) — שורת עצים רחוקים כצללית (פרלקסה) — יוצר "יער" בקו האופק */
  function treeLine(c, W, yB, h, off, col) {
    c.fillStyle = col; c.beginPath(); c.moveTo(-20, yB + 2);
    for (var x = -20; x <= W + 20; x += 9) { var wx = x + off, k = (Math.sin(wx * .37) * .5 + Math.sin(wx * .11 + 1) * .5 + 1) / 2; c.lineTo(x, yB - h * (.35 + .65 * k)); }
    c.lineTo(W + 20, yB + 2); c.closePath(); c.fill();
  }

  /* ================= פרק 7 — צל מגע ================= */
  /* contact(c, x, y, w, a) — צל רך אליפטי במרכז (x,y), ברוחב w. a = עוצמה (ברירת מחדל .35).
     ביצועים: הצל מצויר פעם אחת לקנבס קטן (SHADOW) ובכל קריאה רק "מוטבע" עם שקיפות — במקום גרדיאנט חדש לכל עצם בכל פריים */
  var SHADOW = null;
  function shadowImg() {
    if (SHADOW) return SHADOW; var cv = document.createElement('canvas'); cv.width = 128; cv.height = 128; var x = cv.getContext('2d');
    var g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(10,14,30,1)'); g.addColorStop(.6, 'rgba(10,14,30,.45)'); g.addColorStop(1, 'rgba(10,14,30,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128); return (SHADOW = cv);
  }
  function contact(c, x, y, w, a) {
    if (w < 2) return; var h = w * .22, ga = c.globalAlpha;
    c.globalAlpha = ga * (a == null ? .35 : a); soft(c, function () { c.drawImage(shadowImg(), x - w / 2, y - h / 2, w, h); }); c.globalAlpha = ga;
  }

  /* ================= פרק 8 — זוהר ================= */
  /* glow(c, x, y, r, col, a) — הילת אור רכה בהוספה (lighter) — פנסים, רמזורים, ניצוצות */
  function glow(c, x, y, r, col, a) {
    if (r < 1) return; c.save(); c.globalCompositeOperation = 'lighter';
    var g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a == null ? .6 : a)); g.addColorStop(.35, rgba(col, (a == null ? .6 : a) * .35)); g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore();
  }

  /* ================= פרק 9 — דירוג צבע קולנועי ================= */
  /* grade(c, W, H, o) — ויניטה (כהות בפינות) + אור חם עדין מלמעלה. o.night = כחלחל, o.warm = 0..1, o.force = גם ביום.
     נקרא פעם אחת בסוף כל פריים, אחרי העולם ולפני טקסט ה-HUD */
  var GRADES = {};
  function grade(c, W, H, o) {
    o = o || {};
    /* הוויניטה והאור החם מגיעים מ-CSS (body[data-sharp]::before ב-marvel-skin.css) — מורכב ב-GPU בלי עלות לפריים.
       על הקנבס מציירים רק כשמבקשים במפורש (o.force) — שכבה על כל המסך בכל פריים עולה ~15% מקצב הפריימים */
    if (!o.force) return; var w = o.warm == null ? .5 : o.warm, k = Math.round(W) + 'x' + Math.round(H) + (o.night ? 'n' : 'd') + w;
    /* ביצועים: השכבה מצוירת פעם אחת ברבע רזולוציה (היא רכה לגמרי, אז ההגדלה לא נראית) ומודבקת בכל פריים */
    if (!GRADES[k]) {
      var cv = document.createElement('canvas'), gw = Math.max(8, Math.round(W / 4)), gh = Math.max(8, Math.round(H / 4)); cv.width = gw; cv.height = gh; var x = cv.getContext('2d');
      var v = x.createRadialGradient(gw / 2, gh * .48, Math.min(gw, gh) * .42, gw / 2, gh * .48, Math.hypot(gw, gh) * .62);
      v.addColorStop(0, 'rgba(8,10,28,0)'); v.addColorStop(1, o.night ? 'rgba(4,6,24,.55)' : 'rgba(8,10,28,.32)'); x.fillStyle = v; x.fillRect(0, 0, gw, gh);
      if (w > 0 && !o.night) { var t = x.createLinearGradient(0, 0, 0, gh * .5); t.addColorStop(0, 'rgba(255,214,150,' + (.10 * w) + ')'); t.addColorStop(1, 'rgba(255,214,150,0)'); x.fillStyle = t; x.fillRect(0, 0, gw, gh * .5); }
      GRADES = {}; GRADES[k] = cv;   /* שומרים רק את הגודל האחרון (סיבוב מסך יוצר חדש) */
    }
    soft(c, function () { c.drawImage(GRADES[k], 0, 0, W, H); });
  }

  /* ================= פרק 10 — דף "חד" ================= */
  /* sharpPage() — מסמן את ה-body כך ש-marvel-skin.css לא יצייר רסטר נקודות מעל הקנבס (נשארת רק ויניטה).
     הרסטר יפה בתפריטים, אבל מעל משחק הוא "מלכלך" את התמונה ומוריד חדות */
  function sharpPage() { try { document.body.setAttribute('data-sharp', '1'); } catch (e) {} }
  if (typeof document !== 'undefined') { if (document.body) sharpPage(); else document.addEventListener('DOMContentLoaded', sharpPage); }

  window.RealFX = { rgb: rgb, mix: mix, shade: shade, rgba: rgba, sprite: sprite, smooth: smooth, sky: sky, sun: sun, cloud: cloud, cloudLayer: cloudLayer, ridge: ridge, ridgeY: ridgeY, treeLine: treeLine, contact: contact, glow: glow, grade: grade, sharpPage: sharpPage };
})();
