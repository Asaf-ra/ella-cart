/* =====================================================================
   js/art-series.js — סדרות "סדנת ציור" לסטודיו (נטען אחרי js/art-pages.js)
   ---------------------------------------------------------------------
   כל הדמויות והעולמות כאן מקוריים (בהשראת סוגי חוויות שילדים אוהבים — בית בובות, מרדף חתול-ועכבר,
   כלבלבי הצלה — בלי דמויות מוגנות בזכויות יוצרים).
   פרק 1 — מנוע: Kit = לוח ציור של דף. part(x, y, גודל, היפוך) ממקם "חלק" (דמות/רהיט) בכל מקום ובכל גודל:
           כל חלק מצויר במסגרת מקומית של כ-100×100 סביב (0,0), והמנוע ממיר נתיבים/עיגולים/מלבנים לקואורדינטות הדף.
           רמות קושי: lv 1 = 🟢 קל (אזורים גדולים), 2 = 🟡 בינוני, 3 = 🔴 מאתגר (אריחים, טפטים ופרטים קטנים — עבודת דיוק)
   פרק 2 — רקעים: חדר (קיר + רצפה + אריחים/טפט), שמיים ודשא, מתחת לים, במה, לילה
   פרק 3 — חלקים: חתולה, עכבר, כלבלב (6 תפקידים + כובעים), דרקון, נסיכה, רקדנית, בת ים, רובוט, חיות חווה וגן חיות,
           רהיטים, ממתקים, רכבים, מבנים, אוכל ומתנות
   פרק 4 — 14 סדרות, ~122 דפים (כל סדרה = חבילה בחלון הדפים)
   פרק 5 — חיבור ל-ArtPages: הדפים נוספים ל-PAGES, והחבילות לראש הרשימה (סדרות הסדנה קודם)
   ===================================================================== */
(function () {
  'use strict';
  var ArtPages = window.ArtPages; if (!ArtPages) return;

  /* ================= פרק 1 — מנוע ================= */
  var NUM = /[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g;
  function f1(v) { return Math.round(v * 10) / 10; }
  /* Kit — אוסף הצורות (s) והקישוטים (d) של דף אחד */
  function Kit() { this.s = []; this.d = []; }
  /* at(x, y, k, flip) — מחזיר "עט" שמצייר במסגרת מקומית: נקודה (a,b) → (x ± a·k, y + b·k) */
  Kit.prototype.at = function (x, y, k, flip) {
    var K = this, sx = flip ? -k : k, lw = Math.max(1.6, Math.min(3.5, 3.5 * Math.sqrt(k)));
    function X(a) { return f1(x + a * sx); } function Y(b) { return f1(y + b * k); }
    function path(d) { var i = 0; return d.replace(NUM, function (t) { if (/[A-Za-z]/.test(t)) { i = 0; return t; } var v = +t; return (i++ % 2 === 0 ? X(v) : Y(v)); }); }
    function push(sh) { sh.w = lw; K.s.push(sh); }
    return {
      c: function (a, b, r, col) { push(['c', X(a), Y(b), f1(r * k), col]); },
      e: function (a, b, rx, ry, col) { push(['e', X(a), Y(b), f1(rx * k), f1(ry * k), col]); },
      r: function (a, b, w, h, rr, col) { var x0 = flip ? X(a + w) : X(a); push(['r', x0, Y(b), f1(w * k), f1(h * k), f1(rr * k), col]); },
      p: function (d, col) { push(['p', path(d), col]); },
      g: function (pts, col) { push(['g', pts.replace(/(-?[\d.]+),(-?[\d.]+)/g, function (m, a, b) { return X(+a) + ',' + Y(+b); }), col]); },
      ink: function (d, w) { K.d.push(['p', path(d), f1(Math.max(1.4, (w || 4) * Math.sqrt(k)))]); },
      dot: function (a, b, r) { K.d.push(['o', X(a), Y(b), f1(Math.max(1.6, r * k))]); },
      txt: function (a, b, size, t) { K.d.push(['t', X(a), Y(b), f1(size * k), t]); },
      k: k
    };
  };
  var PAGES = [];
  /* pg — מגדיר דף: חבילה, מזהה, שם, רמה, ופונקציית ציור שמקבלת Kit */
  function pg(pack, id, name, lv, draw) { var K = new Kit(); draw(K); PAGES.push({ pack: pack, id: 's_' + id, name: name, lv: lv, s: K.s, d: K.d }); }

  /* ================= פרק 2 — רקעים ================= */
  /* room — קיר ורצפה. o.tiles = אריחי רצפה (מספר בשורה), o.dots = טפט נקודות, o.stripes = טפט פסים, o.win = חלון */
  function room(K, wall, floor, o) {
    o = o || {}; var P = K.at(0, 0, 1);
    P.r(0, 0, 400, 290, 0, wall);
    if (o.stripes) for (var x = 0; x < 400; x += 50) P.r(x, 0, 25, 290, 0, o.stripes);
    if (o.dots) for (var yy = 30; yy < 280; yy += 56) for (var xx = (yy / 56) % 2 ? 30 : 58; xx < 400; xx += 56) P.c(xx, yy, 7, o.dots);
    P.r(0, 290, 400, 110, 0, floor);
    if (o.tiles) { var n = o.tiles, w = 400 / n; for (var r = 0; r < 2; r++) for (var i = 0; i < n; i++) if ((i + r) % 2) P.r(i * w, 290 + r * 55, w, 55, 0, o.tile2 || '#ffffff'); }
    P.r(0, 282, 400, 12, 0, o.board || '#c98b4f');
    if (o.win) window1(K, o.win[0], o.win[1], o.win[2] || 1);
  }
  /* sky — שמיים, שמש, עננים ודשא גבעי */
  function sky(K, o) {
    o = o || {}; var P = K.at(0, 0, 1);
    P.r(0, 0, 400, 400, 0, o.sky || '#9fe0ff');
    var cl = o.clouds || [[80, 60], [220, 40]];
    /* השמש נבחרת במקום הכי רחוק מהעננים שבחלק העליון (כדי שלא יחפפו) */
    var sx = [340, 60, 200].sort(function (a, b) { function far(x) { return Math.min.apply(null, cl.filter(function (c) { return c[1] < 140; }).map(function (c) { return Math.abs(c[0] - x); }).concat([999])); } return far(b) - far(a); })[0];
    if (o.sun !== false) P.c(o.sunX || sx, 60, 32, '#ffd93c');
    cl.forEach(function (c) { cloud(K, c[0], c[1], c[2] || 1); });
    P.p('M0 290 Q100 250 200 285 Q300 315 400 275 L400 400 L0 400 Z', o.grass || '#8ee07a');
    if (o.hill2) P.p('M0 340 Q150 310 260 345 Q340 365 400 340 L400 400 L0 400 Z', o.hill2);
  }
  function cloud(K, x, y, k) { var P = K.at(x, y, k); P.p('M-40 10 Q-44 -10 -24 -10 Q-18 -30 4 -24 Q20 -36 34 -18 Q52 -16 46 6 Q46 16 30 16 L-30 16 Q-44 16 -40 10 Z', '#ffffff'); }
  function sea(K, o) {
    o = o || {}; var P = K.at(0, 0, 1);
    P.r(0, 0, 400, 400, 0, o.water || '#5fd3ff');
    P.p('M0 330 Q120 300 220 330 Q320 355 400 320 L400 400 L0 400 Z', '#ffe7a8');
    if (o.bubbles !== false) [[40, 60, 8], [60, 90, 5], [360, 120, 9], [340, 80, 5], [300, 40, 6]].forEach(function (b) { P.c(b[0], b[1], b[2], '#d9fbff'); });
    if (o.weed) { weed(K, 30, 335, 1, '#2fb85a'); weed(K, 370, 330, .9, '#1e7a44'); }
  }
  function stageBg(K, o) {
    o = o || {}; var P = K.at(0, 0, 1);
    P.r(0, 0, 400, 400, 0, o.back || '#3a1177');
    P.r(0, 300, 400, 100, 0, o.floor || '#c98b4f');
    if (o.planks) for (var x = 0; x < 400; x += 50) P.r(x, 300, 50, 100, 0, x % 100 ? '#b5773f' : '#c98b4f');
    P.p('M0 0 L90 0 Q70 120 110 300 L0 300 Z', o.curtain || '#ff3b3b');
    P.p('M400 0 L310 0 Q330 120 290 300 L400 300 Z', o.curtain || '#ff3b3b');
    P.p('M0 0 L400 0 L400 34 Q300 60 200 34 Q100 60 0 34 Z', o.valance || '#ffc93c');
    if (o.lights) [60, 140, 220, 300].forEach(function (x) { P.g((x + 40) + ',40 ' + (x + 26) + ',70 ' + (x + 54) + ',70', '#fff27a'); });
  }
  function night(K) { var P = K.at(0, 0, 1); P.r(0, 0, 400, 400, 0, '#1f3a93'); P.c(330, 70, 34, '#fff27a'); P.c(346, 60, 30, '#1f3a93'); [[60, 50], [150, 90], [240, 40], [100, 150], [300, 160]].forEach(function (s) { star(K, s[0], s[1], .5, '#ffd93c'); }); }

  /* ================= פרק 3 — חלקים ================= */
  function star(K, x, y, k, col) { var P = K.at(x, y, k), p = []; for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? 16 : 38; p.push(f1(Math.cos(a) * q) + ',' + f1(Math.sin(a) * q)); } P.g(p.join(' '), col); }
  function heart(K, x, y, k, col) { K.at(x, y, k).p('M0 30 C-50 0 -36 -40 0 -16 C36 -40 50 0 0 30 Z', col); }
  function weed(K, x, y, k, col) { K.at(x, y, k).p('M0 0 Q-16 -30 0 -60 Q14 -86 -4 -110 Q14 -90 10 -60 Q-4 -30 12 0 Z', col); }
  function window1(K, x, y, k) {
    var P = K.at(x, y, k); P.r(-44, -40, 88, 80, 6, '#9fe0ff'); P.c(26, -18, 10, '#ffd93c');
    P.p('M-44 -40 Q-20 0 -44 40 L-44 -40 Z', '#ff8fc4'); P.p('M44 -40 Q20 0 44 40 L44 -40 Z', '#ff8fc4');
    P.ink('M0 -40 L0 40 M-44 0 L44 0', 3); P.r(-50, 40, 100, 8, 3, '#ffffff');
  }
  function frame(K, x, y, k, col) { var P = K.at(x, y, k); P.r(-26, -20, 52, 40, 3, col || '#ffc93c'); P.r(-18, -12, 36, 24, 2, '#9fe0ff'); P.p('M-18 12 L-6 -2 L4 8 L10 2 L18 12 Z', '#2fb85a'); }
  function plant(K, x, y, k) { var P = K.at(x, y, k); P.p('M0 -10 Q-30 -30 -26 -60 Q-6 -40 0 -10 Z', '#2fb85a'); P.p('M0 -10 Q30 -34 22 -64 Q4 -40 0 -10 Z', '#8ee07a'); P.p('M0 -10 Q-4 -50 4 -74 Q10 -44 0 -10 Z', '#1e7a44'); P.p('M-18 -10 L18 -10 L12 22 L-12 22 Z', '#ff8a3c'); }
  function lamp(K, x, y, k) { var P = K.at(x, y, k); P.r(-3, -30, 6, 60, 2, '#c9d2de'); P.p('M-22 -30 L22 -30 L14 -60 L-14 -60 Z', '#fff27a'); P.e(0, 32, 16, 5, '#9b5cff'); }
  function rug(K, x, y, k, a, b) { var P = K.at(x, y, k); P.e(0, 0, 90, 22, a); P.e(0, 0, 60, 13, b); }

  /* --- חתולה (ישיבה, מבט קדימה). o: bow, apron, crown, pose='wave' --- */
  function cat(K, x, y, k, col, o) {
    o = o || {}; var P = K.at(x, y, k, o.flip), L = o.light || '#fff3dc';
    P.p('M24 40 Q64 30 56 -2 Q52 -14 45 -2 Q50 24 20 28 Z', col);
    P.e(0, 24, 32, 28, col);
    if (o.apron) { P.p('M-18 6 L18 6 L24 48 L-24 48 Z', o.apron); P.r(-8, 22, 16, 10, 3, '#ffffff'); }
    else P.e(0, 30, 17, 17, L);
    P.g('-30,-36 -26,-62 -8,-44', col); P.g('30,-36 26,-62 8,-44', col);
    P.c(0, -24, 28, col); P.g('-25,-43 -23,-55 -14,-46', '#ff8fc4'); P.g('25,-43 23,-55 14,-46', '#ff8fc4');
    P.e(0, -12, 12, 8, L); P.g('-4,-18 4,-18 0,-14', '#ff8fc4');
    if (o.pose === 'wave') { P.e(-32, -2, 8, 14, col); } else { P.e(-22, 20, 8, 12, col); P.e(22, 20, 8, 12, col); }
    P.e(-12, 50, 10, 5, L); P.e(12, 50, 10, 5, L);
    if (o.bow) { P.g('0,-50 -18,-58 -18,-42', o.bow); P.g('0,-50 18,-58 18,-42', o.bow); P.c(0, -50, 5, o.bow); }
    if (o.crown) P.g('-16,-50 -16,-66 -8,-58 0,-70 8,-58 16,-66 16,-50', '#ffc93c');
    if (o.hat) { P.p('M-24 -44 Q0 -80 24 -44 Z', o.hat); }
    P.dot(-10, -28, 3.6); P.dot(10, -28, 3.6); P.ink('M0 -14 Q-4 -8 -8 -11 M0 -14 Q4 -8 8 -11', 2.6);
    P.ink('M-14 -16 L-31 -19 M-14 -12 L-31 -10 M14 -16 L31 -19 M14 -12 L31 -10', 2);
  }
  /* --- עכבר --- */
  function mouse(K, x, y, k, o) {
    o = o || {}; var P = K.at(x, y, k, o.flip), col = o.col || '#c9d2de';
    P.ink('M14 34 Q46 36 40 10 Q36 -4 48 -10', 3);
    P.c(-15, -26, 12, col); P.c(15, -26, 12, col); P.c(-15, -26, 7, '#ff8fc4'); P.c(15, -26, 7, '#ff8fc4');
    P.e(0, 20, 16, 18, col); P.e(0, 24, 9, 10, '#ffffff');
    P.c(0, -10, 17, col); P.c(0, -2, 3.5, '#ff5ca8'); P.e(-8, 38, 7, 4, '#ff8fc4'); P.e(8, 38, 7, 4, '#ff8fc4');
    if (o.cheese) { P.g('14,6 40,-4 40,16 14,20', '#ffd93c'); P.c(30, 6, 3, '#ffc93c'); }
    if (o.scarf) P.r(-14, 4, 28, 7, 3, o.scarf);
    P.dot(-6, -13, 2.6); P.dot(6, -13, 2.6); P.ink('M-5 2 L-18 0 M-5 4 L-18 7 M5 2 L18 0 M5 4 L18 7', 1.6);
  }
  /* --- כלבלב הצלה: role = fire / police / pilot / sea / build / medic --- */
  var ROLE = { fire: '#ff3b3b', police: '#3d7bff', pilot: '#9fe0ff', sea: '#ff8a3c', build: '#ffd93c', medic: '#ffffff' };
  function pup(K, x, y, k, col, role, o) {
    o = o || {}; var P = K.at(x, y, k, o.flip), rc = ROLE[role] || '#ff5ca8', ear = o.ear || '#9c6b3f';
    P.p('M20 36 Q46 30 40 12', col); P.ink('M20 36 Q46 30 42 10', 3);
    P.e(0, 24, 24, 24, col);
    P.r(-20, 8, 40, 26, 9, rc); P.c(0, 20, 7, '#ffc93c');
    P.e(-12, 48, 10, 5, col); P.e(12, 48, 10, 5, col);
    P.e(-27, -18, 10, 20, ear); P.e(27, -18, 10, 20, ear);
    P.c(0, -22, 26, col); P.e(0, -10, 15, 10, '#fff3dc'); P.e(0, -15, 6, 4, '#2b2b3a'); P.e(0, -2, 5, 4, '#ff6f91');
    if (role === 'fire') { P.p('M-30 -38 Q0 -72 30 -38 L38 -34 L-38 -34 Z', rc); P.c(0, -50, 6, '#ffc93c'); }
    else if (role === 'police') { P.r(-24, -56, 48, 14, 5, rc); P.p('M-28 -42 L28 -42 L22 -35 L-22 -35 Z', '#1f3a93'); P.c(0, -49, 4, '#ffc93c'); }
    else if (role === 'pilot') { P.p('M-26 -38 Q0 -66 26 -38 Z', '#9c6b3f'); P.e(-10, -38, 8, 6, '#9fe0ff'); P.e(10, -38, 8, 6, '#9fe0ff'); }
    else if (role === 'sea') { P.p('M-28 -38 Q0 -60 28 -38 L34 -34 L-34 -34 Z', '#ffffff'); P.r(-28, -40, 56, 5, 2, rc); }
    else if (role === 'build') { P.p('M-28 -36 Q0 -72 28 -36 Z', rc); P.r(-34, -38, 68, 6, 3, rc); P.r(-3, -62, 6, 22, 2, '#ff8a3c'); }
    else if (role === 'medic') { P.r(-22, -54, 44, 16, 6, '#ffffff'); P.r(-3, -52, 6, 12, 1, '#ff3b3b'); P.r(-6, -49, 12, 6, 1, '#ff3b3b'); }
    P.dot(-10, -26, 3.4); P.dot(10, -26, 3.4); P.ink('M0 -11 Q-5 -6 -9 -8 M0 -11 Q5 -6 9 -8', 2.2);
  }
  /* --- דרקון קטן --- */
  function dragon(K, x, y, k, col, o) {
    o = o || {}; var P = K.at(x, y, k, o.flip), L = o.light || '#fff3b0';
    P.p('M18 30 Q60 40 64 10 Q66 -2 76 -6 Q70 10 72 18 Q66 48 20 42 Z', col);
    P.p('M-14 -6 Q-60 -40 -50 4 Q-40 -8 -30 10 Z', o.wing || '#ff8fc4'); P.p('M14 -6 Q60 -40 50 4 Q40 -8 30 10 Z', o.wing || '#ff8fc4');
    P.e(0, 20, 28, 26, col); P.e(0, 26, 16, 18, L);
    P.g('-14,-44 -10,-60 -4,-44', '#ffc93c'); P.g('14,-44 10,-60 4,-44', '#ffc93c');
    P.c(0, -22, 26, col); P.e(0, -10, 16, 10, L);
    P.e(-12, 46, 10, 5, col); P.e(12, 46, 10, 5, col);
    P.dot(-10, -26, 3.8); P.dot(10, -26, 3.8); P.dot(-5, -10, 1.8); P.dot(5, -10, 1.8); P.ink('M-8 -4 Q0 2 8 -4', 2.4);
    if (o.fire) { P.p('M26 -14 Q46 -26 56 -14 Q46 -12 58 -4 Q42 -2 26 -10 Z', '#ff8a3c'); }
  }
  /* --- ילדה/נסיכה/רקדנית: dress צבע שמלה, hair צבע שיער, o.crown / o.tutu / o.wand --- */
  function girl(K, x, y, k, dress, hair, o) {
    o = o || {}; var P = K.at(x, y, k, o.flip);
    if (o.boy) return boy(K, x, y, k, dress, hair, o);
    P.p('M-24 -46 Q-34 -10 -26 14 L26 14 Q34 -10 24 -46 Z', hair);
    if (o.tutu) { P.p('M-10 6 L10 6 L10 30 L-10 30 Z', dress); P.p('M-40 28 Q0 12 40 28 Q30 44 0 40 Q-30 44 -40 28 Z', o.tutu); }
    else P.p('M-12 4 L12 4 L34 62 L-34 62 Z', dress);
    P.r(-14, o.tutu ? 38 : 60, 8, 22, 4, '#ffd9b8'); P.r(6, o.tutu ? 38 : 60, 8, 22, 4, '#ffd9b8');
    P.e(-10, o.tutu ? 62 : 84, 9, 5, o.shoe || '#ff5ca8'); P.e(10, o.tutu ? 62 : 84, 9, 5, o.shoe || '#ff5ca8');
    /* ידיים: צורות צביעות בצבע עור — למטה (ליד הגוף) או למעלה (ריקוד / נפנוף) */
    if (o.arms === 'up') { P.p('M-10 6 L-16 0 L-40 -26 L-32 -32 Z', '#ffd9b8'); P.p('M10 6 L16 0 L40 -26 L32 -32 Z', '#ffd9b8'); }
    else { P.p('M-10 6 L-17 4 L-36 36 L-28 40 Z', '#ffd9b8'); P.p('M10 6 L17 4 L36 36 L28 40 Z', '#ffd9b8'); }
    P.c(0, -26, 22, '#ffd9b8');
    P.p('M-22 -30 Q-20 -54 0 -52 Q22 -54 22 -30 Q10 -44 -22 -30 Z', hair);
    if (o.crown) P.g('-14,-48 -14,-66 -6,-56 0,-70 6,-56 14,-66 14,-48', '#ffc93c');
    if (o.bow) { P.g('14,-46 30,-56 30,-38', o.bow); P.c(16, -46, 4, o.bow); }
    if (o.wand) { P.ink('M40 34 L58 -4', 3); var W = K.at(x + (o.flip ? -60 : 60) * k, y - 10 * k, .35 * k); var sp = []; for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? 16 : 38; sp.push(f1(Math.cos(a) * q) + ',' + f1(Math.sin(a) * q)); } W.g(sp.join(' '), '#ffd93c'); }
    P.dot(-8, -26, 2.8); P.dot(8, -26, 2.8); P.ink('M-6 -16 Q0 -11 6 -16', 2.2); P.c(-13, -19, 4, '#ff8fc4'); P.c(13, -19, 4, '#ff8fc4');
  }
  /* boy — ילד (בגרסת הבנים): שיער קצר, חולצה ומכנסיים. shirt = צבע החולצה */
  function boy(K, x, y, k, shirt, hair, o) {
    var P = K.at(x, y, k, o.flip);
    P.r(-16, 40, 13, 42, 5, '#3d7bff'); P.r(3, 40, 13, 42, 5, '#3d7bff'); P.e(-10, 84, 10, 5, '#2b2b3a'); P.e(10, 84, 10, 5, '#2b2b3a');
    if (o.arms === 'up') { P.p('M-12 6 L-18 0 L-40 -26 L-32 -32 Z', '#ffd9b8'); P.p('M12 6 L18 0 L40 -26 L32 -32 Z', '#ffd9b8'); }
    else { P.p('M-14 6 L-22 4 L-38 38 L-30 42 Z', '#ffd9b8'); P.p('M14 6 L22 4 L38 38 L30 42 Z', '#ffd9b8'); }
    P.r(-22, 2, 44, 44, 10, shirt); P.c(0, 20, 7, '#ffd93c');
    P.c(0, -26, 22, '#ffd9b8'); P.p('M-23 -26 Q-24 -54 0 -52 Q24 -54 23 -26 Q16 -40 0 -38 Q-12 -44 -23 -26 Z', hair);
    if (o.crown) P.g('-14,-48 -14,-66 -6,-56 0,-70 6,-56 14,-66 14,-48', '#ffc93c');
    P.dot(-8, -26, 2.8); P.dot(8, -26, 2.8); P.ink('M-6 -16 Q0 -11 6 -16', 2.2);
  }
  var BOY = !!window.ART_BOY;         /* בגרסת הבנים (eitan-world) מוגדר ב-coloring.html לפני הטעינה */
  function mermaid(K, x, y, k, tail, hair) {
    var P = K.at(x, y, k);
    P.p('M-24 -46 Q-38 0 -30 30 L30 30 Q38 0 24 -46 Z', hair);
    P.p('M-14 10 Q-20 50 0 80 Q16 50 14 10 Z', tail); P.p('M0 76 Q-30 84 -34 100 Q-10 94 0 86 Q10 94 34 100 Q30 84 0 76 Z', tail);
    P.r(-14, -4, 28, 18, 6, '#ffd9b8'); P.e(-7, 2, 7, 6, '#ff8fc4'); P.e(7, 2, 7, 6, '#ff8fc4');
    P.ink('M-12 0 Q-30 10 -36 -12 M12 0 Q30 10 36 24', 7);
    P.c(0, -26, 22, '#ffd9b8'); P.p('M-22 -30 Q-20 -54 0 -52 Q22 -54 22 -30 Q10 -44 -22 -30 Z', hair);
    P.c(18, -44, 6, '#ff5ca8');
    P.dot(-8, -26, 2.8); P.dot(8, -26, 2.8); P.ink('M-6 -16 Q0 -11 6 -16', 2.2); P.ink('M-8 30 Q0 36 8 30 M-6 46 Q0 52 6 46', 2);
  }
  function robot(K, x, y, k, col, o) {
    o = o || {}; var P = K.at(x, y, k, o.flip);
    P.r(-8, -72, 16, 16, 3, '#c9d2de'); P.c(0, -76, 7, '#ff3b3b');
    P.r(-30, -60, 60, 44, 10, col); P.r(-20, -50, 40, 22, 6, '#9fe0ff'); P.c(-10, -39, 5, '#ffffff'); P.c(10, -39, 5, '#ffffff');
    P.r(-36, -12, 72, 56, 10, o.body || col); P.r(-18, 0, 36, 26, 5, '#ffffff'); P.c(-8, 10, 4, '#ff3b3b'); P.c(4, 10, 4, '#ffd93c'); P.r(-12, 18, 24, 4, 2, '#2fb85a');
    P.r(-54, -8, 16, 40, 7, '#c9d2de'); P.r(38, -8, 16, 40, 7, '#c9d2de'); P.c(-46, 38, 9, col); P.c(46, 38, 9, col);
    P.r(-26, 44, 18, 24, 5, '#9aa0ab'); P.r(8, 44, 18, 24, 5, '#9aa0ab'); P.r(-30, 64, 26, 10, 4, col); P.r(4, 64, 26, 10, 4, col);
    P.dot(-10, -39, 2.4); P.dot(10, -39, 2.4); P.ink('M-8 -30 Q0 -25 8 -30', 2);
  }
  /* --- חיות חווה וגן חיות --- */
  function cow(K, x, y, k, o) {
    o = o || {}; var P = K.at(x, y, k, o.flip);
    P.r(-50, -10, 90, 50, 22, '#ffffff'); P.e(-20, 0, 14, 12, '#2b2b3a'); P.e(18, 20, 12, 10, '#2b2b3a');
    P.r(-44, 34, 12, 26, 4, '#ffffff'); P.r(24, 34, 12, 26, 4, '#ffffff'); P.e(4, 38, 10, 7, '#ff8fc4');
    P.ink('M40 4 Q56 10 52 28', 3);
    P.g('-64,-34 -70,-48 -56,-40', '#e8c9a0'); P.g('-38,-34 -32,-48 -46,-40', '#e8c9a0');
    P.e(-68, -26, 10, 6, '#ffffff'); P.e(-34, -26, 10, 6, '#ffffff');
    P.r(-66, -36, 32, 36, 14, '#ffffff'); P.e(-50, -6, 18, 12, '#ff8fc4'); P.dot(-56, -6, 2); P.dot(-44, -6, 2); P.dot(-58, -22, 3); P.dot(-42, -22, 3);
  }
  function pig(K, x, y, k, o) {
    o = o || {}; var P = K.at(x, y, k, o.flip);
    P.ink('M34 0 Q48 -6 42 -14 Q36 -8 44 4', 2.6);
    P.e(0, 4, 38, 28, '#ffb3de'); P.r(-28, 24, 10, 18, 4, '#ffb3de'); P.r(18, 24, 10, 18, 4, '#ffb3de');
    P.g('-44,-26 -40,-44 -28,-30', '#ff8fc4'); P.g('-18,-26 -22,-44 -34,-30', '#ff8fc4');
    P.c(-30, -12, 20, '#ffb3de'); P.e(-38, -6, 10, 8, '#ff8fc4'); P.dot(-41, -6, 1.8); P.dot(-35, -6, 1.8); P.dot(-34, -18, 2.6); P.dot(-22, -18, 2.6);
  }
  function sheep(K, x, y, k) {
    var P = K.at(x, y, k);
    P.r(-26, 20, 10, 22, 4, '#2b2b3a'); P.r(16, 20, 10, 22, 4, '#2b2b3a');
    P.p('M-40 0 Q-46 -24 -24 -24 Q-16 -40 4 -32 Q22 -42 32 -24 Q50 -20 42 2 Q50 20 30 24 Q14 34 -4 26 Q-24 34 -34 20 Q-50 14 -40 0 Z', '#ffffff');
    P.e(-36, -8, 14, 18, '#9aa0ab'); P.dot(-40, -10, 2.4); P.dot(-32, -10, 2.4);
  }
  function chick(K, x, y, k, col) { var P = K.at(x, y, k); P.e(0, 10, 22, 18, col || '#ffd93c'); P.c(-12, -10, 13, col || '#ffd93c'); P.g('-26,-10 -34,-6 -26,-4', '#ff8a3c'); P.ink('M-4 28 L-4 36 M6 28 L6 36', 2.4); P.dot(-15, -13, 2.2); P.p('M4 4 Q16 0 20 12 Q10 14 4 4 Z', col ? '#fff27a' : '#ffc93c'); }
  function horse(K, x, y, k) {
    var P = K.at(x, y, k);
    P.r(-44, -6, 80, 40, 18, '#c98b4f'); P.r(-40, 26, 10, 32, 4, '#c98b4f'); P.r(24, 26, 10, 32, 4, '#c98b4f');
    P.p('M36 0 Q60 4 58 36 Q50 20 38 18 Z', '#7a4a22');
    P.p('M-40 0 L-58 -44 L-40 -52 L-24 -10 Z', '#c98b4f'); P.r(-72, -60, 30, 22, 10, '#c98b4f'); P.p('M-40 -52 Q-26 -40 -24 -14 L-32 -12 Q-34 -34 -44 -48 Z', '#7a4a22');
    P.g('-52,-58 -48,-72 -44,-58', '#c98b4f'); P.dot(-56, -52, 2.6); P.dot(-68, -44, 1.8);
  }
  function lion(K, x, y, k) {
    var P = K.at(x, y, k), m = [];
    for (var i = 0; i < 16; i++) { var a = i * Math.PI / 8, q = i % 2 ? 40 : 50; m.push(f1(Math.cos(a) * q) + ',' + f1(Math.sin(a) * q - 20)); }
    P.p('M20 40 Q60 44 58 10', '#ffc93c'); P.ink('M20 40 Q60 44 58 10', 3); P.c(58, 8, 6, '#ff8a3c');
    P.e(0, 30, 30, 26, '#ffc93c'); P.g(m.join(' '), '#ff8a3c'); P.c(0, -20, 28, '#ffc93c'); P.e(0, -8, 14, 10, '#fff3dc'); P.g('-6,-14 6,-14 0,-8', '#9c6b3f');
    P.e(-12, 54, 10, 5, '#ffc93c'); P.e(12, 54, 10, 5, '#ffc93c'); P.dot(-10, -24, 3.4); P.dot(10, -24, 3.4); P.ink('M0 -8 Q-5 -2 -9 -4 M0 -8 Q5 -2 9 -4', 2.2);
  }
  function elephant(K, x, y, k) {
    var P = K.at(x, y, k);
    P.r(-40, -10, 84, 54, 26, '#9aa0ab'); P.r(-34, 34, 14, 26, 5, '#9aa0ab'); P.r(22, 34, 14, 26, 5, '#9aa0ab');
    P.e(-30, -22, 26, 30, '#c9d2de'); P.c(-50, -28, 24, '#9aa0ab');
    P.p('M-66 -20 Q-80 10 -70 40 Q-62 44 -60 36 Q-68 10 -56 -12 Z', '#9aa0ab'); P.dot(-52, -34, 3);
    P.ink('M44 6 Q54 12 50 24', 3);
  }
  function giraffe(K, x, y, k) {
    var P = K.at(x, y, k);
    P.r(-30, 0, 60, 34, 14, '#ffd93c'); P.r(-26, 28, 9, 34, 3, '#ffd93c'); P.r(17, 28, 9, 34, 3, '#ffd93c');
    P.p('M-24 6 L-40 -80 L-24 -84 L-6 4 Z', '#ffd93c'); P.r(-56, -104, 36, 24, 11, '#ffd93c');
    P.c(-8, 14, 6, '#c98b4f'); P.c(12, 10, 7, '#c98b4f'); P.c(-30, -40, 5, '#c98b4f'); P.c(-34, -64, 4, '#c98b4f');
    P.r(-42, -114, 4, 12, 2, '#c98b4f'); P.r(-32, -114, 4, 12, 2, '#c98b4f'); P.dot(-46, -96, 2.6); P.dot(-54, -86, 1.6);
  }
  function monkey(K, x, y, k) {
    var P = K.at(x, y, k); P.ink('M18 30 Q50 30 44 0 Q40 -12 52 -16', 3);
    P.e(0, 22, 20, 22, '#9c6b3f'); P.e(0, 26, 12, 14, '#e8c9a0'); P.c(-24, -20, 10, '#e8c9a0'); P.c(24, -20, 10, '#e8c9a0');
    P.c(0, -18, 22, '#9c6b3f'); P.e(0, -12, 16, 14, '#e8c9a0'); P.dot(-6, -18, 2.6); P.dot(6, -18, 2.6); P.ink('M-6 -6 Q0 0 6 -6', 2);
    P.e(-10, 44, 8, 5, '#9c6b3f'); P.e(10, 44, 8, 5, '#9c6b3f');
  }
  function penguin(K, x, y, k) { var P = K.at(x, y, k); P.e(0, 0, 26, 38, '#1f3a93'); P.e(0, 6, 17, 30, '#ffffff'); P.g('-6,-18 6,-18 0,-10', '#ff8a3c'); P.e(-10, 38, 9, 4, '#ff8a3c'); P.e(10, 38, 9, 4, '#ff8a3c'); P.dot(-8, -24, 2.6); P.dot(8, -24, 2.6); }
  function zebra(K, x, y, k) {
    var P = K.at(x, y, k);
    P.r(-40, -6, 76, 36, 16, '#ffffff'); P.r(-36, 24, 10, 30, 4, '#ffffff'); P.r(22, 24, 10, 30, 4, '#ffffff');
    P.p('M-36 0 L-52 -40 L-36 -46 L-22 -8 Z', '#ffffff'); P.r(-66, -54, 28, 20, 9, '#ffffff'); P.p('M-36 -46 Q-24 -40 -22 -14 L-30 -12 Q-32 -32 -42 -44 Z', '#2b2b3a');
    P.ink('M-20 -4 L-16 26 M-4 -6 L0 28 M12 -6 L16 28 M28 -2 L30 24 M-44 -30 L-34 -34 M-46 -20 L-34 -24', 4);
    P.dot(-50, -48, 2.4);
  }
  function bunny(K, x, y, k, col) { var P = K.at(x, y, k); P.e(-10, -44, 8, 22, col); P.e(10, -44, 8, 22, col); P.e(-10, -44, 4, 14, '#ff8fc4'); P.e(10, -44, 4, 14, '#ff8fc4'); P.e(0, 14, 22, 22, col); P.c(0, -16, 18, col); P.c(20, 26, 7, '#ffffff'); P.dot(-6, -18, 2.4); P.dot(6, -18, 2.4); P.c(0, -10, 3, '#ff5ca8'); }

  /* --- רהיטים ובית --- */
  function bed(K, x, y, k, col, blanket) { var P = K.at(x, y, k); P.r(-70, -40, 16, 80, 6, col); P.r(-60, -6, 130, 40, 8, '#ffffff'); P.r(-60, 0, 130, 34, 8, blanket); P.e(-38, -12, 20, 12, '#ffffff'); P.r(58, -16, 14, 56, 6, col); P.r(-66, 30, 8, 16, 2, col); P.r(60, 30, 8, 16, 2, col); P.ink('M-10 8 L-10 30 M20 8 L20 30', 2); }
  function sofa(K, x, y, k, col) { col = col || '#3fe0c5'; var P = K.at(x, y, k); P.r(-70, -40, 140, 50, 18, col); P.r(-80, -10, 26, 46, 10, col); P.r(54, -10, 26, 46, 10, col); P.r(-54, 0, 54, 26, 8, '#ffffff'); P.r(0, 0, 54, 26, 8, '#ffffff'); P.r(-40, -32, 26, 24, 6, '#ffd93c'); P.r(-72, 34, 8, 10, 2, '#9c6b3f'); P.r(64, 34, 8, 10, 2, '#9c6b3f'); }
  function table(K, x, y, k, col) { var P = K.at(x, y, k); P.r(-60, -8, 120, 14, 5, col); P.r(-52, 6, 10, 44, 3, col); P.r(42, 6, 10, 44, 3, col); }
  function tub(K, x, y, k) { var P = K.at(x, y, k); [[-40, -30, 12], [-10, -46, 16], [24, -34, 13], [50, -44, 9]].forEach(function (b) { P.c(b[0], b[1], b[2], '#d9fbff'); }); P.p('M-70 -20 L70 -20 L60 30 Q50 44 30 44 L-30 44 Q-50 44 -60 30 Z', '#ffffff'); P.r(-74, -26, 148, 12, 6, '#9fe0ff'); P.r(-54, 42, 10, 12, 3, '#ffc93c'); P.r(44, 42, 10, 12, 3, '#ffc93c'); P.r(52, -60, 8, 36, 3, '#c9d2de'); }
  function stove(K, x, y, k) { var P = K.at(x, y, k); P.r(-44, -40, 88, 90, 8, '#ffffff'); P.r(-34, -4, 68, 44, 6, '#9aa0ab'); P.c(-20, -26, 9, '#2b2b3a'); P.c(20, -26, 9, '#2b2b3a'); P.r(-44, -50, 88, 12, 5, '#ff8fc4'); P.r(-26, 4, 52, 6, 3, '#c9d2de'); }
  function fridge(K, x, y, k) { var P = K.at(x, y, k); P.r(-30, -80, 60, 150, 10, '#d9fbff'); P.r(-30, -80, 60, 50, 10, '#ffffff'); P.r(18, -66, 5, 22, 2, '#9aa0ab'); P.r(18, -20, 5, 30, 2, '#9aa0ab'); heart(K, x - 6 * k, y + 10 * k, .3 * k, '#ff5ca8'); }
  function pot(K, x, y, k, col) { var P = K.at(x, y, k); P.p('M-26 -10 L26 -10 L22 24 L-22 24 Z', col); P.r(-32, -16, 64, 8, 4, '#c9d2de'); P.r(-40, -8, 12, 6, 3, '#9aa0ab'); P.r(28, -8, 12, 6, 3, '#9aa0ab'); P.ink('M-10 -24 Q-16 -34 -8 -42 M8 -24 Q2 -34 10 -42', 2.4); }
  function teapot(K, x, y, k, col) { var P = K.at(x, y, k); P.p('M22 -6 Q42 -14 44 -28 L38 -30 Q34 -18 22 -14 Z', col); P.e(0, 0, 26, 22, col); P.p('M-24 -8 Q-42 -6 -38 12 Q-34 18 -24 10', col); P.r(-12, -28, 24, 8, 4, col); P.c(0, -32, 5, col); heart(K, x, y + 2 * k, .22 * k, '#ffffff'); }
  function cupcake(K, x, y, k, col, top) { var P = K.at(x, y, k); P.p('M-22 0 L22 0 L16 30 L-16 30 Z', col); P.p('M-26 2 Q-30 -20 -10 -22 Q0 -38 12 -22 Q30 -22 26 2 Z', top); P.c(0, -34, 6, '#ff3b3b'); P.ink('M-8 4 L-6 28 M8 4 L6 28', 2); }
  function gift(K, x, y, k, col, rib) { var P = K.at(x, y, k); P.r(-30, -20, 60, 50, 5, col); P.r(-34, -30, 68, 14, 4, col); P.r(-6, -30, 12, 60, 2, rib); P.p('M0 -30 Q-24 -52 -26 -34 Q-18 -28 0 -30 Z', rib); P.p('M0 -30 Q24 -52 26 -34 Q18 -28 0 -30 Z', rib); }
  function balloon(K, x, y, k, col) { var P = K.at(x, y, k); P.ink('M0 30 Q-8 60 6 90', 2.4); P.e(0, 0, 22, 28, col); P.g('-5,28 5,28 0,34', col); P.e(-8, -10, 5, 8, '#ffffff'); }
  function cake(K, x, y, k, a, b) { var P = K.at(x, y, k); P.r(-60, 0, 120, 44, 8, a); P.r(-44, -40, 88, 42, 8, b); P.p('M-44 -30 Q-34 -18 -24 -30 Q-14 -18 -4 -30 Q6 -18 16 -30 Q26 -18 36 -30 Q40 -24 44 -30 L44 -40 L-44 -40 Z', '#ffffff'); [-24, 0, 24].forEach(function (cx) { P.r(cx - 4, -64, 8, 24, 3, '#9fe0ff'); P.p('M' + cx + ' -66 Q' + (cx - 7) + ' -76 ' + cx + ' -86 Q' + (cx + 7) + ' -76 ' + cx + ' -66 Z', '#ffd93c'); }); P.e(0, 46, 72, 8, '#c9d2de'); }
  function hatParty(K, x, y, k, col) { var P = K.at(x, y, k); P.g('-18,20 18,20 0,-30', col); P.c(0, -32, 6, '#ffd93c'); P.ink('M-10 0 L10 6 M-14 12 L14 16', 2); }
  function garland(K, y, cols) { var P = K.at(0, 0, 1); P.ink('M0 ' + y + ' Q100 ' + (y + 30) + ' 200 ' + y + ' Q300 ' + (y + 30) + ' 400 ' + y, 2.4); for (var i = 0; i < 8; i++) { var x = 25 + i * 50, yy = y + Math.sin((i % 4) * Math.PI / 4) * 16 + 8; P.g((x - 14) + ',' + yy + ' ' + (x + 14) + ',' + yy + ' ' + x + ',' + (yy + 26), cols[i % cols.length]); } }
  /* --- ממתקים --- */
  function lolly(K, x, y, k, a, b) { var P = K.at(x, y, k); P.r(-4, 20, 8, 70, 3, '#ffffff'); P.c(0, 0, 30, a); P.c(0, 0, 20, b); P.c(0, 0, 10, a); P.r(-10, 18, 20, 8, 3, '#ff5ca8'); }
  function cane(K, x, y, k) { var P = K.at(x, y, k); P.p('M-8 70 L-8 -20 Q-8 -50 18 -50 Q44 -50 44 -24 L32 -24 Q32 -38 18 -38 Q4 -38 4 -20 L4 70 Z', '#ffffff'); P.r(-8, 0, 12, 12, 1, '#ff3b3b'); P.r(-8, 30, 12, 12, 1, '#ff3b3b'); P.r(-8, 56, 12, 12, 1, '#ff3b3b'); P.c(18, -46, 5, '#ff3b3b'); }
  function gumdrop(K, x, y, k, col) { K.at(x, y, k).p('M-18 14 Q-20 -18 0 -20 Q20 -18 18 14 Z', col); }
  function icecream(K, x, y, k, a, b) { var P = K.at(x, y, k); P.g('-20,0 20,0 0,56', '#e8c9a0'); P.ink('M-12 12 L6 40 M12 12 L-6 40', 2); P.c(0, -10, 22, a); P.c(-10, -32, 18, b); P.c(12, -30, 16, '#fff3dc'); P.c(2, -50, 6, '#ff3b3b'); }
  function gingerHouse(K, x, y, k) { var P = K.at(x, y, k); P.r(-70, -30, 140, 100, 4, '#c98b4f'); P.g('-86,-24 0,-100 86,-24', '#ff8fc4'); P.p('M-86 -24 Q-64 -10 -43 -24 Q-22 -10 0 -24 Q22 -10 43 -24 Q64 -10 86 -24 L86 -18 L-86 -18 Z', '#ffffff'); P.r(-18, 14, 36, 56, 18, '#ff5ca8'); P.r(-58, 0, 28, 28, 4, '#fff27a'); P.r(30, 0, 28, 28, 4, '#fff27a'); P.c(-44, -54, 8, '#3fe0c5'); P.c(0, -70, 8, '#ffd93c'); P.c(44, -54, 8, '#9b5cff'); P.c(10, 42, 3, '#ffd93c'); }
  /* --- רכבים ומבנים --- */
  function fireTruck(K, x, y, k) { var P = K.at(x, y, k); P.r(-80, -30, 110, 54, 8, '#ff3b3b'); P.r(30, -46, 50, 70, 10, '#ff3b3b'); P.r(40, -36, 30, 24, 5, '#9fe0ff'); P.r(-76, -52, 100, 10, 3, '#c9d2de'); P.ink('M-70 -52 L-70 -42 M-50 -52 L-50 -42 M-30 -52 L-30 -42 M-10 -52 L-10 -42 M10 -52 L10 -42', 2.4); P.r(50, -58, 20, 12, 4, '#3d7bff'); P.c(-50, 28, 16, '#2b2b3a'); P.c(-50, 28, 7, '#c9d2de'); P.c(46, 28, 16, '#2b2b3a'); P.c(46, 28, 7, '#c9d2de'); P.r(-60, -16, 60, 20, 4, '#ffd93c'); }
  function policeCar(K, x, y, k) { var P = K.at(x, y, k); P.p('M-70 10 L-60 -16 L-30 -20 L-16 -44 L30 -44 L46 -20 L70 -14 L70 10 Z', '#ffffff'); P.r(-72, 6, 144, 18, 8, '#3d7bff'); P.p('M-12 -38 L26 -38 L38 -20 L-24 -20 Z', '#9fe0ff'); P.r(-4, -56, 12, 12, 3, '#ff3b3b'); P.r(8, -56, 12, 12, 3, '#3d7bff'); P.c(-42, 26, 15, '#2b2b3a'); P.c(42, 26, 15, '#2b2b3a'); P.c(-42, 26, 6, '#c9d2de'); P.c(42, 26, 6, '#c9d2de'); star(K, x + 4 * k, y - 4 * k, .25 * k, '#ffc93c'); }
  function heli(K, x, y, k) { var P = K.at(x, y, k); P.r(-8, -58, 16, 14, 3, '#9aa0ab'); P.r(-80, -64, 160, 8, 4, '#c9d2de'); P.p('M36 -6 L100 -18 L104 -6 L40 8 Z', '#ff8a3c'); P.e(0, -10, 48, 34, '#ff8a3c'); P.p('M-10 -34 Q-44 -30 -44 -6 L-10 -6 Z', '#9fe0ff'); P.r(-40, 34, 80, 6, 3, '#9aa0ab'); P.ink('M-26 22 L-26 34 M26 22 L26 34', 3); }
  function boat(K, x, y, k, col) { var P = K.at(x, y, k); P.p('M-80 0 L80 0 L60 36 L-60 36 Z', col); P.r(-4, -80, 8, 80, 3, '#9c6b3f'); P.g('4,-76 4,-6 64,-6', '#ffffff'); P.g('-4,-70 -4,-10 -50,-10', '#ff8fc4'); P.c(-40, 18, 8, '#ffffff'); P.c(0, 18, 8, '#ffffff'); P.c(40, 18, 8, '#ffffff'); }
  function tower(K, x, y, k, col) { var P = K.at(x, y, k); P.r(-30, -80, 60, 160, 4, col); P.g('-40,-80 0,-120 40,-80', '#ff3b3b'); P.r(-14, -60, 28, 30, 12, '#9fe0ff'); P.r(-14, 30, 28, 50, 12, '#9c6b3f'); P.r(-4, -142, 4, 26, 1, '#9aa0ab'); P.g('0,-142 22,-136 0,-130', '#ffd93c'); }
  function house(K, x, y, k, wall, roof) { var P = K.at(x, y, k); P.r(-60, -30, 120, 90, 4, wall); P.g('-74,-24 0,-90 74,-24', roof); P.r(-14, 10, 28, 50, 4, '#9c6b3f'); P.r(-48, -10, 26, 26, 3, '#9fe0ff'); P.r(22, -10, 26, 26, 3, '#9fe0ff'); P.r(30, -80, 16, 30, 2, '#c9d2de'); }
  function castle(K, x, y, k, col) {
    var P = K.at(x, y, k);
    P.r(-90, -40, 40, 130, 4, col); P.r(50, -40, 40, 130, 4, col); P.r(-50, -10, 100, 100, 4, col);
    P.g('-98,-40 -70,-100 -42,-40', '#ff8fc4'); P.g('42,-40 70,-100 98,-40', '#ff8fc4');
    [-50, -26, -2, 22].forEach(function (cx) { P.r(cx, -26, 16, 18, 2, col); });
    P.r(-20, 30, 40, 60, 20, '#9c6b3f'); P.r(-78, -10, 16, 22, 8, '#9fe0ff'); P.r(62, -10, 16, 22, 8, '#9fe0ff');
    P.g('-70,-100 -70,-122 -52,-114', '#ffd93c'); P.g('70,-100 70,-122 88,-114', '#ffd93c');
  }
  function barn(K, x, y, k) { var P = K.at(x, y, k); P.r(-70, -30, 140, 100, 4, '#ff3b3b'); P.g('-80,-26 0,-90 80,-26', '#b0183d'); P.r(-26, 10, 52, 60, 3, '#ffffff'); P.ink('M-26 10 L26 70 M26 10 L-26 70', 3); P.r(-14, -60, 28, 22, 3, '#ffffff'); }
  function tree(K, x, y, k, col) { var P = K.at(x, y, k); P.r(-10, 0, 20, 60, 4, '#9c6b3f'); P.c(0, -26, 36, col || '#2fb85a'); P.c(-26, -6, 24, col || '#2fb85a'); P.c(26, -6, 24, col || '#2fb85a'); P.c(-10, -30, 5, '#ff3b3b'); P.c(14, -12, 5, '#ff3b3b'); }
  function fence(K, y, col) { var P = K.at(0, 0, 1); P.r(0, y + 10, 400, 10, 2, col); P.r(0, y + 34, 400, 10, 2, col); for (var x = 10; x < 400; x += 40) P.p('M' + x + ' ' + (y + 60) + ' L' + x + ' ' + y + ' L' + (x + 10) + ' ' + (y - 12) + ' L' + (x + 20) + ' ' + y + ' L' + (x + 20) + ' ' + (y + 60) + ' Z', col); }
  function coral(K, x, y, k, col) { K.at(x, y, k).p('M-6 0 L-6 -30 Q-26 -36 -24 -56 Q-14 -44 -6 -44 L-6 -60 Q-6 -74 4 -74 Q8 -60 6 -44 Q16 -54 26 -50 Q20 -34 6 -30 L6 0 Z', col); }
  function fish(K, x, y, k, col, flip) { var P = K.at(x, y, k, flip); P.g('24,0 44,-16 44,16', col); P.e(0, 0, 28, 18, col); P.p('M-6 -18 Q6 -30 14 -16 Z', col); P.dot(-14, -4, 2.6); P.ink('M4 -14 Q10 0 4 14', 2); }
  function turtle(K, x, y, k) { var P = K.at(x, y, k); P.e(-30, -18, 12, 8, '#8ee07a'); P.e(30, -18, 12, 8, '#8ee07a'); P.e(-30, 18, 12, 8, '#8ee07a'); P.e(30, 18, 12, 8, '#8ee07a'); P.c(-44, 0, 13, '#8ee07a'); P.e(0, 0, 34, 28, '#2fb85a'); P.g('-12,-10 12,-10 18,6 0,16 -18,6', '#8ee07a'); P.dot(-48, -3, 2.4); }
  function seahorse(K, x, y, k, col) { var P = K.at(x, y, k); P.p('M0 -40 Q24 -44 20 -20 Q14 0 20 20 Q24 40 6 44 Q-8 44 -6 32 Q2 36 6 28 Q0 10 4 -8 Q-18 -6 -16 -24 Q-14 -40 0 -40 Z', col); P.g('-16,-26 -34,-22 -16,-18', col); P.p('M18 -10 Q30 -4 20 8 Z', '#ffd93c'); P.dot(-2, -30, 2.4); }
  function chest(K, x, y, k) { var P = K.at(x, y, k); P.r(-44, -10, 88, 44, 5, '#9c6b3f'); P.p('M-44 -10 Q-44 -44 0 -44 Q44 -44 44 -10 Z', '#c98b4f'); P.r(-8, -18, 16, 20, 3, '#ffc93c'); P.c(-20, -48, 7, '#ffd93c'); P.c(4, -54, 8, '#ffd93c'); P.c(26, -46, 6, '#3fe0c5'); P.r(-44, 8, 88, 6, 2, '#ffc93c'); }
  function sub(K, x, y, k, col) { var P = K.at(x, y, k); P.r(-10, -56, 28, 26, 6, col); P.r(8, -76, 6, 22, 2, '#9aa0ab'); P.e(0, 0, 76, 34, col); P.c(-30, 0, 12, '#9fe0ff'); P.c(0, 0, 12, '#9fe0ff'); P.c(30, 0, 12, '#9fe0ff'); P.g('-76,0 -100,-22 -100,22', '#ff8a3c'); }
  function truck(K, x, y, k, col) { var P = K.at(x, y, k); P.r(-80, -36, 100, 50, 6, col); P.r(20, -50, 56, 64, 8, col); P.r(32, -40, 32, 22, 4, '#9fe0ff'); P.c(-50, 20, 16, '#2b2b3a'); P.c(46, 20, 16, '#2b2b3a'); P.c(-50, 20, 6, '#c9d2de'); P.c(46, 20, 6, '#c9d2de'); }
  function digger(K, x, y, k) { var P = K.at(x, y, k); P.r(-70, 10, 120, 24, 12, '#2b2b3a'); P.c(-52, 22, 9, '#9aa0ab'); P.c(-16, 22, 9, '#9aa0ab'); P.c(20, 22, 9, '#9aa0ab'); P.r(-60, -30, 90, 40, 6, '#ffd93c'); P.r(-40, -70, 50, 44, 6, '#ffd93c'); P.r(-32, -62, 34, 26, 4, '#9fe0ff'); P.p('M28 -20 L80 -70 L92 -60 L40 -10 Z', '#ff8a3c'); P.p('M80 -70 L110 -40 L96 -20 L76 -48 Z', '#9aa0ab'); }
  function crane(K, x, y, k) { var P = K.at(x, y, k); P.r(-10, -150, 20, 200, 2, '#ffd93c'); P.r(-80, -160, 180, 14, 2, '#ffd93c'); P.ink('M-6 -140 L6 -120 M6 -110 L-6 -90 M-6 -80 L6 -60 M6 -50 L-6 -30 M-6 -20 L6 0', 2.4); P.ink('M80 -146 L80 -90', 2); P.r(64, -90, 32, 26, 3, '#ff8a3c'); P.r(-80, -146, 30, 26, 3, '#9aa0ab'); }
  function cone(K, x, y, k) { var P = K.at(x, y, k); P.g('-14,20 14,20 0,-26', '#ff8a3c'); P.r(-8, -4, 16, 6, 1, '#ffffff'); P.r(-20, 18, 40, 8, 2, '#ff8a3c'); }
  function bricks(K, x, y, cols, rows, a, b) { var P = K.at(x, y, 1); for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) P.r(c * 30 + (r % 2 ? 15 : 0), -r * 16, 30, 16, 2, (r + c) % 2 ? a : b); }
  /* --- סופרמרקט --- */
  function shelf(K, x, y, k) { var P = K.at(x, y, k); P.r(-90, -90, 180, 180, 4, '#c98b4f'); P.r(-84, -84, 168, 50, 2, '#fff3dc'); P.r(-84, -26, 168, 50, 2, '#fff3dc'); P.r(-84, 32, 168, 50, 2, '#fff3dc'); }
  function jar(K, x, y, k, col) { var P = K.at(x, y, k); P.r(-12, -18, 24, 32, 5, col); P.r(-14, -24, 28, 8, 3, '#c9d2de'); P.r(-8, -8, 16, 12, 2, '#ffffff'); }
  function box(K, x, y, k, col) { var P = K.at(x, y, k); P.r(-14, -24, 28, 40, 3, col); P.c(0, -6, 7, '#ffffff'); }
  function cart(K, x, y, k) { var P = K.at(x, y, k); P.p('M-60 -40 L60 -40 L48 10 L-48 10 Z', '#c9d2de'); P.ink('M-40 -40 L-32 10 M-16 -40 L-12 10 M8 -40 L6 10 M32 -40 L26 10 M-54 -16 L54 -16', 2); P.ink('M60 -40 L74 -60 L88 -60', 4); P.r(-50, 10, 100, 8, 3, '#9aa0ab'); P.c(-40, 28, 9, '#2b2b3a'); P.c(40, 28, 9, '#2b2b3a'); }
  function fruit(K, x, y, k, kind) {
    var P = K.at(x, y, k);
    if (kind === 'apple') { P.c(0, 0, 16, '#ff3b3b'); P.p('M0 -14 Q10 -26 18 -20 Q10 -12 0 -14 Z', '#2fb85a'); }
    else if (kind === 'banana') P.p('M-24 -10 Q0 26 26 -14 Q28 -6 20 4 Q0 22 -20 4 Q-26 -2 -24 -10 Z', '#ffd93c');
    else if (kind === 'orange') { P.c(0, 0, 15, '#ff8a3c'); P.c(0, -14, 3, '#2fb85a'); }
    else if (kind === 'pear') P.p('M0 -20 Q10 -20 8 -4 Q20 6 14 18 Q0 26 -14 18 Q-20 6 -8 -4 Q-10 -20 0 -20 Z', '#8ee07a');
    else if (kind === 'grapes') { [[-8, -8], [8, -8], [0, 4], [-12, 6], [12, 6], [0, 16]].forEach(function (g) { P.c(g[0], g[1], 7, '#9b5cff'); }); }
  }
  function register(K, x, y, k) { var P = K.at(x, y, k); P.r(-50, -20, 100, 60, 6, '#9b5cff'); P.r(-30, -50, 60, 32, 4, '#c9d2de'); P.r(-22, -44, 44, 18, 3, '#8ee07a'); [[-30, -8], [-10, -8], [10, -8], [30, -8], [-30, 10], [-10, 10], [10, 10], [30, 10]].forEach(function (b) { P.r(b[0] - 7, b[1] - 6, 14, 12, 3, '#ffffff'); }); }

  /* ================= פרק 4 — הסדרות ================= */
  var PINK = '#ff8fc4', CATS = ['#ff9a3c', '#c9d2de', '#ffffff', '#9c6b3f', '#ffd93c', '#d3b5ff'];

  /* ---- 1. בית הבובות של החתולות 🏠 ---- */
  pg('dollhouse', 'dh1', 'בית הבובות — מבחוץ', 1, function (K) {
    sky(K, { clouds: [[70, 50]] });
    var P = K.at(200, 250, 1);
    P.r(-120, -120, 240, 190, 6, '#ffb3de'); P.g('-140,-114 0,-200 140,-114', '#9b5cff');
    P.r(-100, -90, 90, 70, 6, '#9fe0ff'); P.r(10, -90, 90, 70, 6, '#9fe0ff'); P.r(-100, -6, 90, 66, 6, '#fff27a'); P.r(24, -6, 50, 76, 22, '#ff5ca8');
    P.c(0, -150, 16, '#fff27a'); heart(K, 200, 100, .35, '#ff3b3b');
    cat(K, 150, 262, .72, CATS[0], { bow: '#ff5ca8' }); cat(K, 255, 180, .5, CATS[1], { flip: true, pose: 'wave' });
  });
  pg('dollhouse', 'dh2', 'חדר השינה של החתולות', 1, function (K) {
    room(K, '#d3b5ff', '#ffc49b', { win: [290, 120] });
    bed(K, 160, 285, 1.1, '#ff5ca8', '#9fe0ff'); cat(K, 150, 236, .8, CATS[2], { bow: '#ff5ca8' });
    frame(K, 90, 110, 1.2, '#ffc93c'); lamp(K, 340, 320, 1);
  });
  pg('dollhouse', 'dh3', 'המטבח של החתולה השפית', 2, function (K) {
    room(K, '#fff27a', '#9fe0ff', { tiles: 8, tile2: '#ffffff', board: '#ff8fc4' });
    fridge(K, 60, 250, 1); stove(K, 180, 250, 1.1); pot(K, 170, 180, .9, '#ff3b3b');
    cat(K, 300, 290, .8, CATS[0], { apron: '#ff5ca8', hat: '#ffffff', flip: true });
    cupcake(K, 250, 100, .8, '#9fe0ff', '#ffb3de'); teapot(K, 340, 100, .9, '#3fe0c5');
  });
  pg('dollhouse', 'dh4', 'אמבטיית קצף', 2, function (K) {
    room(K, '#9fe0ff', '#ffffff', { dots: '#ffffff' });
    cat(K, 190, 236, .85, CATS[5], { bow: '#ff5ca8' }); tub(K, 200, 310, 1.4);
    [[80, 120], [320, 100], [260, 60]].forEach(function (b) { K.at(b[0], b[1], 1).c(0, 0, 18, '#d9fbff'); });
    K.at(90, 350, .8).p('M-20 0 Q-20 -20 0 -20 Q10 -34 20 -20 Q30 -10 20 0 Z', '#ffd93c');
  });
  pg('dollhouse', 'dh5', 'מסיבת תה בסלון', 2, function (K) {
    room(K, '#ffb3de', '#c98b4f', { stripes: '#ffd9ee', win: [310, 110] });
    sofa(K, 150, 250, 1); table(K, 200, 330, .9, '#9b5cff'); teapot(K, 180, 305, .7, '#3fe0c5'); cupcake(K, 230, 305, .5, '#ffd93c', '#ffffff');
    cat(K, 110, 222, .6, CATS[3], { crown: true }); cat(K, 190, 222, .6, CATS[4], { bow: '#3d7bff', flip: true });
    frame(K, 70, 90, 1);
  });
  pg('dollhouse', 'dh6', 'הגינה של בית הבובות', 1, function (K) {
    sky(K, { clouds: [[100, 60]] }); fence(K, 250, '#ffffff');
    tree(K, 320, 240, 1.3); [[60, 350], [110, 360], [160, 345]].forEach(function (f, i) { flower(K, f[0], f[1], .8, ['#ff5ca8', '#ffd93c', '#9b5cff'][i]); });
    cat(K, 225, 315, 1, CATS[0], { bow: '#ff5ca8', pose: 'wave' }); mouse(K, 350, 350, .6);
  });
  pg('dollhouse', 'dh7', 'חדר המוזיקה', 3, function (K) {
    room(K, '#d3b5ff', '#ffc49b', { tiles: 10, tile2: '#fff3dc', dots: '#ffffff' });
    var P = K.at(120, 270, 1); P.r(-70, -70, 140, 90, 8, '#2b2b3a'); P.r(-60, -10, 120, 24, 3, '#ffffff'); for (var i = -50; i < 60; i += 20) P.r(i, -10, 10, 14, 1, '#2b2b3a'); P.r(-60, 20, 10, 40, 3, '#2b2b3a'); P.r(50, 20, 10, 40, 3, '#2b2b3a');
    cat(K, 120, 180, .5, CATS[2], { bow: '#ff5ca8' }); cat(K, 290, 300, .7, CATS[4], { flip: true, pose: 'wave' });
    K.at(300, 120, 1).txt(0, 0, 44, '♪'); K.at(350, 80, 1).txt(0, 0, 36, '♫'); frame(K, 250, 90, .9, '#ff5ca8');
  });
  pg('dollhouse', 'dh8', 'חדר השינה — פרטים קטנים', 3, function (K) {
    room(K, '#9fe0ff', '#ffb3de', { tiles: 10, tile2: '#ffffff', stripes: '#c7efff', win: [320, 110] });
    bed(K, 150, 285, 1, '#9b5cff', '#ffd93c'); cat(K, 140, 256, .45, CATS[1], { crown: true });
    frame(K, 80, 100, .9, '#3fe0c5'); frame(K, 170, 90, .7, '#ff5ca8'); lamp(K, 330, 320, .9); rug(K, 280, 370, .6, '#ff5ca8', '#fff27a');
    mouse(K, 260, 340, .35, { scarf: '#ff3b3b' });
  });
  pg('dollhouse', 'dh9', 'קופסת ההפתעה', 1, function (K) {
    room(K, '#fff27a', '#ff8fc4', {});
    gift(K, 200, 300, 2, '#9b5cff', '#ffd93c'); cat(K, 200, 170, .8, CATS[5], { bow: '#ff5ca8', pose: 'wave' });
    star(K, 70, 90, .6, '#ffd93c'); star(K, 330, 80, .5, '#3fe0c5'); heart(K, 90, 200, .5, '#ff5ca8'); heart(K, 320, 190, .45, '#ff3b3b');
  });
  pg('dollhouse', 'dh10', 'כל החתולות בבית', 3, function (K) {
    var P = K.at(200, 210, 1);
    sky(K, { clouds: [[60, 40]], sun: false });
    P.r(-180, -150, 360, 330, 6, '#ffb3de'); P.g('-194,-146 0,-205 194,-146', '#9b5cff');
    P.r(-170, -130, 165, 140, 4, '#fff27a'); P.r(5, -130, 165, 140, 4, '#9fe0ff'); P.r(-170, 20, 165, 150, 4, '#d3b5ff'); P.r(5, 20, 165, 150, 4, '#ffc49b');
    bed(K, 290, 135, .6, '#ff5ca8', '#ffd93c'); cat(K, 285, 115, .3, CATS[1]);
    stove(K, 80, 125, .6); cat(K, 150, 132, .35, CATS[0], { apron: '#ff5ca8' });
    tub(K, 110, 350, .7); cat(K, 105, 325, .3, CATS[5], { bow: '#3d7bff' });
    sofa(K, 300, 350, .6, '#3fe0c5'); cat(K, 280, 330, .3, CATS[4], { crown: true }); cat(K, 320, 330, .3, CATS[3], { bow: '#ff5ca8' });
  });
  function flower(K, x, y, k, col) { var P = K.at(x, y, k); P.r(-3, 0, 6, 40, 3, '#2fb85a'); P.e(-12, 22, 10, 5, '#8ee07a'); for (var i = 0; i < 6; i++) { var a = i * Math.PI / 3; P.c(f1(Math.cos(a) * 14), f1(Math.sin(a) * 14 - 6), 9, col); } P.c(0, -6, 8, '#ffd93c'); }

  /* ---- 2. חתול ועכבר: המרדף 🐭 ---- */
  pg('catmouse', 'cm1', 'העכבר והגבינה', 1, function (K) {
    room(K, '#ffc49b', '#c98b4f', {});
    var P = K.at(300, 250, 1); P.p('M-40 40 L-40 -20 Q-40 -60 0 -60 Q40 -60 40 -20 L40 40 Z', '#2b2b3a');
    mouse(K, 180, 320, 1.1, { cheese: true }); K.at(90, 330, 1.2).g('-40,20 40,-10 40,30', '#ffd93c');
  });
  pg('catmouse', 'cm2', 'המרדף במטבח', 2, function (K) {
    room(K, '#fff27a', '#9fe0ff', { tiles: 8 });
    table(K, 200, 300, 1.4, '#c98b4f'); cat(K, 300, 300, .9, CATS[3], { flip: true });
    mouse(K, 150, 260, .6, { cheese: true }); pot(K, 230, 270, .6, '#ff3b3b');
    K.at(100, 330, 1).ink('M-30 0 L-60 0 M-30 14 L-56 14', 3);
  });
  pg('catmouse', 'cm3', 'החתול ישן — ששש!', 1, function (K) {
    room(K, '#9fe0ff', '#c98b4f', { win: [300, 110] });
    rug(K, 170, 330, 1.1, '#ff3b3b', '#ffd93c'); cat(K, 170, 300, 1, CATS[1], {});
    mouse(K, 320, 330, .7, { flip: true }); K.at(240, 190, 1).txt(0, 0, 40, 'Z'); K.at(270, 160, 1).txt(0, 0, 30, 'z');
  });
  pg('catmouse', 'cm4', 'העכבר בחור בקיר', 1, function (K) {
    room(K, '#d3b5ff', '#c98b4f', {});
    var P = K.at(200, 290, 1.4); P.p('M-50 0 L-50 -40 Q-50 -80 0 -80 Q50 -80 50 -40 L50 0 Z', '#2b2b3a');
    mouse(K, 200, 260, .9, { scarf: '#ff3b3b' }); cat(K, 340, 300, .7, CATS[0], { flip: true });
  });
  pg('catmouse', 'cm5', 'מגדל הגבינות', 2, function (K) {
    room(K, '#ffc49b', '#9c6b3f', {});
    [[200, 340, 1.5], [200, 280, 1.2], [200, 230, .9]].forEach(function (c) { K.at(c[0], c[1], c[2]).g('-50,20 50,20 50,-14 -50,-4', '#ffd93c'); });
    mouse(K, 200, 170, .7); cat(K, 80, 300, .7, CATS[4], { pose: 'wave' });
    [[330, 80], [60, 90]].forEach(function (s) { star(K, s[0], s[1], .45, '#ffd93c'); });
  });
  pg('catmouse', 'cm6', 'חברים אחרי המרדף', 1, function (K) {
    sky(K, { clouds: [[90, 60]] });
    cat(K, 150, 290, 1.2, CATS[3], {}); mouse(K, 270, 320, .9, {}); heart(K, 210, 150, .7, '#ff5ca8');
  });
  pg('catmouse', 'cm7', 'פיקניק בגינה', 2, function (K) {
    sky(K, { clouds: [[80, 60], [260, 50]], hill2: '#2fb85a' });
    var P = K.at(200, 340, 1); P.p('M-150 0 L150 0 L120 50 L-120 50 Z', '#ff3b3b'); for (var i = -120; i < 140; i += 40) P.r(i, 0, 20, 50, 0, '#ffffff');
    cat(K, 110, 300, .7, CATS[0], {}); mouse(K, 280, 318, .55, { cheese: true }); fruit(K, 200, 330, 1, 'apple'); cupcake(K, 240, 330, .5, '#9fe0ff', '#ffb3de');
  });
  pg('catmouse', 'cm8', 'מרדף מסביב לבית', 3, function (K) {
    sky(K, { clouds: [[70, 50]], hill2: '#2fb85a' }); fence(K, 280, '#ffffff');
    house(K, 200, 200, 1.1, '#fff27a', '#ff3b3b'); tree(K, 60, 230, .9); tree(K, 340, 230, .9, '#8ee07a');
    cat(K, 120, 350, .55, CATS[3], {}); mouse(K, 280, 360, .4, { cheese: true });
    [[40, 380], [360, 380]].forEach(function (f, i) { flower(K, f[0], f[1], .5, i ? '#9b5cff' : '#ff5ca8'); });
  });
  pg('catmouse', 'cm9', 'החתול עם כדור הצמר', 1, function (K) {
    room(K, '#ffb3de', '#c98b4f', {});
    cat(K, 150, 290, 1.1, CATS[0], {}); var P = K.at(290, 340, 1); P.c(0, 0, 34, '#9b5cff'); P.ink('M-26 -14 Q0 -30 26 -8 M-30 6 Q0 -10 30 14 M-18 24 Q0 10 20 28', 2.4); P.ink('M34 0 Q70 10 80 40', 2.4);
  });
  pg('catmouse', 'cm10', 'המטבח הגדול — פרטים', 3, function (K) {
    room(K, '#fff27a', '#ffffff', { tiles: 10, tile2: '#ff8fc4', stripes: '#fff9c2' });
    fridge(K, 50, 250, .9); stove(K, 150, 255, .9); table(K, 290, 320, 1, '#9b5cff');
    teapot(K, 260, 290, .5, '#3fe0c5'); cupcake(K, 320, 292, .45, '#ffd93c', '#ffffff');
    cat(K, 250, 220, .45, CATS[1], { flip: true }); mouse(K, 150, 190, .35, { cheese: true });
    frame(K, 330, 100, .8); window1(K, 200, 100, .7);
  });

  /* ---- 3. כלבלבי ההצלה 🐶 ---- */
  var PUPS = [['#e8c9a0', 'fire', '#9c6b3f'], ['#9aa0ab', 'police', '#1f3a93'], ['#ffffff', 'pilot', '#9c6b3f'], ['#ffd93c', 'sea', '#c98b4f'], ['#c98b4f', 'build', '#7a4a22'], ['#ffc49b', 'medic', '#ff8fc4']];
  pg('rescue', 'rs1', 'כלבלב הכבאי', 1, function (K) { sky(K, { clouds: [[80, 60]] }); fireTruck(K, 230, 300, 1.2); pup(K, 110, 290, 1, PUPS[0][0], 'fire', { ear: PUPS[0][2] }); });
  pg('rescue', 'rs2', 'כלבלבת השוטרת', 1, function (K) { sky(K, { clouds: [[260, 60]], sky: '#c7efff' }); policeCar(K, 240, 310, 1.2); pup(K, 100, 290, 1, PUPS[1][0], 'police', { ear: PUPS[1][2] }); });
  pg('rescue', 'rs3', 'כלבלב הטייס', 2, function (K) { sky(K, { clouds: [[70, 80], [300, 200, .8]], sky: '#9fe0ff' }); heli(K, 220, 140, 1.2); pup(K, 190, 138, .45, PUPS[2][0], 'pilot', { ear: PUPS[2][2] }); tree(K, 70, 300, .8); house(K, 320, 320, .7, '#fff27a', '#ff3b3b'); });
  pg('rescue', 'rs4', 'הצלה בים', 2, function (K) { sea(K, { weed: true }); boat(K, 200, 170, 1.2, '#ff8a3c'); pup(K, 170, 150, .5, PUPS[3][0], 'sea', { ear: PUPS[3][2] }); fish(K, 110, 260, .8, '#ff5ca8'); fish(K, 290, 290, .7, '#ffd93c', true); turtle(K, 200, 350, .7); });
  pg('rescue', 'rs5', 'כלבלב הבנאי', 1, function (K) { sky(K, { clouds: [[100, 60]] }); digger(K, 250, 300, 1); pup(K, 90, 300, .9, PUPS[4][0], 'build', { ear: PUPS[4][2] }); cone(K, 180, 360, .8); });
  pg('rescue', 'rs6', 'כלבלבת החובשת', 1, function (K) { room(K, '#d9fbff', '#ffffff', { tiles: 6, tile2: '#9fe0ff' }); pup(K, 140, 290, 1, PUPS[5][0], 'medic', { ear: PUPS[5][2] }); bunny(K, 280, 310, .9, '#ffffff'); K.at(282, 280, 1).r(-10, -4, 20, 8, 3, '#ff8fc4'); heart(K, 210, 140, .5, '#ff3b3b'); });
  pg('rescue', 'rs7', 'מגדל התצפית', 2, function (K) { sky(K, { clouds: [[80, 70]], hill2: '#2fb85a' }); tower(K, 200, 230, 1.2, '#9fe0ff'); pup(K, 80, 330, .8, PUPS[0][0], 'fire', { ear: PUPS[0][2] }); pup(K, 320, 330, .8, PUPS[2][0], 'pilot', { ear: PUPS[2][2], flip: true }); });
  pg('rescue', 'rs8', 'כל הצוות!', 3, function (K) { sky(K, { clouds: [[70, 60], [300, 50]], hill2: '#2fb85a' }); PUPS.forEach(function (p, i) { pup(K, 55 + i * 58, i % 2 ? 250 : 330, .62, p[0], p[1], { ear: p[2], flip: i > 2 }); }); star(K, 200, 90, .6, '#ffd93c'); });
  pg('rescue', 'rs9', 'מכבים שריפה בעץ', 3, function (K) { sky(K, { clouds: [[300, 60]], hill2: '#2fb85a' }); tree(K, 110, 260, 1.4); K.at(110, 200, 1).p('M-20 10 Q-30 -20 -10 -30 Q-6 -10 0 -20 Q10 -40 18 -14 Q30 -24 26 10 Z', '#ff8a3c'); fireTruck(K, 290, 330, .9); pup(K, 220, 290, .6, PUPS[0][0], 'fire', { ear: PUPS[0][2], flip: true }); K.at(200, 250, 1).ink('M0 0 Q-40 -60 -70 -50', 5); [[140, 220], [150, 190], [128, 175]].forEach(function (d) { K.at(d[0], d[1], 1).e(0, 0, 5, 7, '#9fe0ff'); }); });
  pg('rescue', 'rs10', 'תחנת ההצלה', 2, function (K) { sky(K, { clouds: [[80, 50]] }); var P = K.at(200, 250, 1); P.r(-150, -110, 300, 180, 6, '#ff3b3b'); P.r(-160, -130, 320, 30, 6, '#b0183d'); P.r(-120, -60, 100, 130, 8, '#ffffff'); P.r(20, -60, 100, 130, 8, '#ffffff'); star(K, 200, 135, .5, '#ffd93c'); pup(K, 130, 300, .75, PUPS[0][0], 'fire', { ear: PUPS[0][2] }); pup(K, 270, 300, .75, PUPS[1][0], 'police', { ear: PUPS[1][2], flip: true }); });

  /* ---- 4. ארץ הממתקים 🍭 ---- */
  pg('candy', 'cd1', 'בית הממתקים', 1, function (K) { sky(K, { sky: '#ffd9ee', grass: '#ffb3de', clouds: [[80, 60]] }); gingerHouse(K, 200, 260, 1.4); lolly(K, 50, 290, .7, '#ff5ca8', '#ffffff'); cane(K, 350, 300, .8); });
  pg('candy', 'cd2', 'גלידה ענקית', 1, function (K) { sky(K, { sky: '#fff3dc', grass: '#ffb3de', sun: false, clouds: [] }); icecream(K, 200, 210, 2.6, '#ff8fc4', '#9fe0ff'); });
  pg('candy', 'cd3', 'יער הסוכריות', 2, function (K) { sky(K, { sky: '#d3b5ff', grass: '#ff8fc4', clouds: [[300, 50]] }); lolly(K, 80, 200, 1, '#ff5ca8', '#fff27a'); lolly(K, 200, 170, 1.2, '#3fe0c5', '#ffffff'); lolly(K, 320, 210, .9, '#ff8a3c', '#ffd93c'); [[60, 360, '#ff3b3b'], [130, 350, '#2fb85a'], [270, 360, '#9b5cff'], [340, 350, '#ffd93c']].forEach(function (g) { gumdrop(K, g[0], g[1], 1, g[2]); }); });
  pg('candy', 'cd4', 'מסיבת קאפקייקס', 2, function (K) { room(K, '#fff27a', '#ff8fc4', { dots: '#ffffff' }); table(K, 200, 300, 1.6, '#9b5cff'); [[120, '#9fe0ff', '#ffb3de'], [200, '#ffd93c', '#ffffff'], [280, '#ff8fc4', '#9b5cff']].forEach(function (c) { cupcake(K, c[0], 250, 1.1, c[1], c[2]); }); });
  pg('candy', 'cd5', 'רכבת הממתקים', 3, function (K) { sky(K, { sky: '#ffd9ee', grass: '#ffb3de', clouds: [[70, 50], [260, 60]] }); var cols = ['#ff5ca8', '#3fe0c5', '#ffd93c', '#9b5cff']; cols.forEach(function (c, i) { var P = K.at(60 + i * 90, 300, 1); P.r(-38, -34, 76, 50, 8, c); P.c(-20, 22, 12, '#ffffff'); P.c(20, 22, 12, '#ffffff'); P.c(-20, 22, 5, '#ff3b3b'); P.c(20, 22, 5, '#ff3b3b'); if (i) { gumdrop(K, 60 + i * 90 - 14, 258, .7, '#ff3b3b'); gumdrop(K, 60 + i * 90 + 14, 258, .7, '#2fb85a'); } else { P.r(-20, -70, 24, 38, 4, '#ffffff'); P.r(10, -56, 14, 22, 3, '#ff8a3c'); } }); cane(K, 380, 240, .5); lolly(K, 30, 170, .5, '#ff3b3b', '#fff27a'); });
  pg('candy', 'cd6', 'גלידות בשורה', 2, function (K) { sky(K, { sky: '#c7efff', grass: '#ffb3de', clouds: [[200, 50]] }); [['#ff8fc4', '#fff27a'], ['#8ee07a', '#ffffff'], ['#9b5cff', '#ff5ca8']].forEach(function (c, i) { icecream(K, 90 + i * 110, 230, 1.3, c[0], c[1]); }); });
  pg('candy', 'cd7', 'מלכת הממתקים', 3, function (K) { sky(K, { sky: '#ffd9ee', grass: '#ff8fc4', clouds: [[80, 50]] }); castle(K, 290, 250, .8, '#fff27a'); girl(K, 110, 250, 1.1, '#ff5ca8', '#9c6b3f', { crown: true, wand: true }); [[220, 370, '#3fe0c5'], [260, 380, '#ff3b3b'], [360, 370, '#9b5cff']].forEach(function (g) { gumdrop(K, g[0], g[1], .7, g[2]); }); });
  pg('candy', 'cd8', 'סוכריה על מקל', 1, function (K) { sky(K, { sky: '#fff3dc', grass: '#ffb3de', sun: false, clouds: [[80, 60], [320, 80]] }); lolly(K, 200, 180, 3, '#ff5ca8', '#fff27a'); });

  /* ---- 5. ממלכת הנסיכות 👑 ---- */
  pg('princess', 'pr1', 'הנסיכה והטירה', 1, function (K) { sky(K, { clouds: [[80, 60]] }); castle(K, 270, 240, .9, '#d3b5ff'); girl(K, 100, 260, 1.1, '#ff8fc4', '#ffd93c', { crown: true }); });
  pg('princess', 'pr2', 'נשף בארמון', 2, function (K) { room(K, '#d3b5ff', '#fff3dc', { tiles: 8, tile2: '#ffb3de' }); girl(K, 130, 240, 1.1, '#9fe0ff', '#9c6b3f', { crown: true, arms: 'up' }); girl(K, 280, 240, 1.1, '#ff5ca8', '#2b2b3a', { crown: true, flip: true }); [[60, 70], [200, 60], [340, 70]].forEach(function (c) { K.at(c[0], c[1], 1).c(0, 0, 14, '#fff27a'); }); });
  pg('princess', 'pr3', 'הכתר של הנסיכה', 1, function (K) { room(K, '#ffb3de', '#9b5cff', {}); var P = K.at(200, 220, 2); P.p('M-60 30 L-60 -30 L-30 0 L0 -44 L30 0 L60 -30 L60 30 Z', '#ffc93c'); P.c(0, 10, 10, '#ff3b3b'); P.c(-34, 14, 7, '#3fe0c5'); P.c(34, 14, 7, '#9b5cff'); P.c(0, -44, 6, '#ffffff'); P.c(-60, -30, 6, '#ffffff'); P.c(60, -30, 6, '#ffffff'); P.r(-66, 28, 132, 14, 5, '#ff5ca8'); });
  pg('princess', 'pr4', 'נסיכה וחד-קרן', 2, function (K) { sky(K, { clouds: [[300, 60]], hill2: '#2fb85a' }); horse(K, 260, 280, 1.2); K.at(190, 212, 1.2).g('-6,-10 6,-10 0,-40', '#ffd93c'); girl(K, 100, 260, 1, '#9b5cff', '#ffd93c', { crown: true }); [[40, 380], [170, 385]].forEach(function (f) { flower(K, f[0], f[1], .5, '#ff5ca8'); }); });
  pg('princess', 'pr5', 'חדר הנסיכה', 3, function (K) { room(K, '#ffb3de', '#d3b5ff', { tiles: 10, tile2: '#ffffff', stripes: '#ffd9ee', win: [310, 110] }); bed(K, 150, 290, 1, '#ffc93c', '#ff5ca8'); frame(K, 90, 100, .9, '#ffc93c'); lamp(K, 330, 320, .9); girl(K, 290, 270, .7, '#9fe0ff', '#9c6b3f', { crown: true, flip: true }); rug(K, 150, 370, .6, '#9b5cff', '#fff27a'); });
  pg('princess', 'pr6', 'שמלת נשף', 1, function (K) { room(K, '#fff27a', '#ffc49b', {}); girl(K, 200, 210, 2, '#ff5ca8', '#c98b4f', { crown: true, bow: '#9b5cff' }); });
  pg('princess', 'pr7', 'המרכבה', 3, function (K) { sky(K, { clouds: [[80, 50], [280, 60]], hill2: '#2fb85a' }); horse(K, 110, 300, .9); var P = K.at(280, 280, 1); P.e(0, -10, 70, 56, '#ffb3de'); P.r(-30, -40, 60, 40, 20, '#9fe0ff'); P.g('-20,-66 -20,-84 -8,-74 0,-90 8,-74 20,-84 20,-66', '#ffc93c'); P.c(-44, 50, 22, '#ffc93c'); P.c(44, 50, 22, '#ffc93c'); P.c(-44, 50, 8, '#ffffff'); P.c(44, 50, 8, '#ffffff'); K.at(170, 270, 1).ink('M0 0 L40 0', 3); });
  pg('princess', 'pr8', 'הנסיכה והקוסמת', 2, function (K) { night(K); castle(K, 200, 310, .8, '#d3b5ff'); girl(K, 80, 300, .8, '#3fe0c5', '#ffd93c', { crown: true, wand: true }); girl(K, 320, 300, .8, '#9b5cff', '#2b2b3a', { flip: true, wand: true }); });

  /* ---- 6. החווה 🐄 ---- */
  pg('farm', 'fm1', 'הרפת האדומה', 1, function (K) { sky(K, { clouds: [[80, 60]] }); barn(K, 200, 240, 1.4); chick(K, 330, 350, 1); });
  pg('farm', 'fm2', 'פרה וחזיר', 1, function (K) { sky(K, { clouds: [[300, 60]] }); fence(K, 250, '#ffffff'); cow(K, 140, 320, 1.1); pig(K, 300, 340, 1, { flip: true }); });
  pg('farm', 'fm3', 'כבשה בשדה', 1, function (K) { sky(K, { clouds: [[100, 60], [260, 80]] }); sheep(K, 200, 300, 1.8); flower(K, 60, 360, .6, '#ffd93c'); flower(K, 340, 360, .6, '#ff5ca8'); });
  pg('farm', 'fm4', 'התרנגולת והאפרוחים', 2, function (K) { sky(K, { clouds: [[80, 50]], hill2: '#2fb85a' }); var P = K.at(170, 300, 1.6); P.e(0, 10, 30, 24, '#ffffff'); P.c(-20, -16, 16, '#ffffff'); P.p('M-26 -32 Q-20 -44 -14 -32 Q-10 -42 -6 -30 Z', '#ff3b3b'); P.g('-36,-16 -46,-12 -36,-8', '#ff8a3c'); P.dot(-24, -18, 2.6); P.p('M20 0 Q40 -20 44 6 Q34 10 20 6 Z', '#ffffff'); P.ink('M-6 34 L-6 44 M8 34 L8 44', 2.4); [[270, 350], [320, 360], [370, 345]].forEach(function (c) { chick(K, c[0], c[1], .7); }); });
  pg('farm', 'fm5', 'הסוס בחווה', 2, function (K) { sky(K, { clouds: [[300, 50]] }); fence(K, 250, '#c98b4f'); horse(K, 220, 300, 1.4); tree(K, 60, 250, .8); });
  pg('farm', 'fm6', 'הטרקטור', 2, function (K) { sky(K, { clouds: [[80, 60]], hill2: '#2fb85a' }); var P = K.at(200, 300, 1.3); P.r(-60, -30, 80, 40, 6, '#2fb85a'); P.r(-10, -70, 50, 60, 6, '#2fb85a'); P.r(0, -60, 30, 26, 4, '#9fe0ff'); P.r(-50, -50, 8, 24, 2, '#9aa0ab'); P.c(24, 18, 30, '#2b2b3a'); P.c(24, 18, 12, '#ffd93c'); P.c(-44, 24, 18, '#2b2b3a'); P.c(-44, 24, 7, '#ffd93c'); });
  pg('farm', 'fm7', 'כל חיות החווה', 3, function (K) { sky(K, { clouds: [[70, 50]], hill2: '#2fb85a' }); barn(K, 300, 190, .8); fence(K, 240, '#ffffff'); cow(K, 100, 320, .7); pig(K, 230, 350, .6); sheep(K, 330, 330, .7); chick(K, 180, 380, .5); chick(K, 40, 385, .45, '#fff27a'); });
  pg('farm', 'fm8', 'גינת הירקות', 3, function (K) { sky(K, { clouds: [[80, 50], [300, 60]] }); var P = K.at(0, 0, 1); P.r(20, 300, 360, 80, 8, '#9c6b3f'); for (var i = 0; i < 6; i++) { var x = 50 + i * 60; P.g((x - 10) + ',310 ' + (x + 10) + ',310 ' + x + ',360', '#ff8a3c'); P.p('M' + x + ' 310 Q' + (x - 16) + ' 280 ' + (x - 4) + ' 270 Q' + x + ' 290 ' + x + ' 310 Z', '#2fb85a'); P.p('M' + x + ' 310 Q' + (x + 16) + ' 280 ' + (x + 6) + ' 270 Q' + x + ' 290 ' + x + ' 310 Z', '#8ee07a'); } bunny(K, 330, 250, .7, '#ffffff'); });

  /* ---- 7. גן החיות 🦁 ---- */
  pg('zoo', 'zo1', 'האריה המחייך', 1, function (K) { sky(K, { sky: '#fff3b0', grass: '#ffd93c', clouds: [[80, 60]] }); lion(K, 200, 260, 1.8); });
  pg('zoo', 'zo2', 'הפיל והמזרקה', 1, function (K) { sky(K, { clouds: [[300, 60]] }); elephant(K, 220, 290, 1.6); [[90, 140], [70, 110], [110, 100]].forEach(function (d) { K.at(d[0], d[1], 1).e(0, 0, 7, 10, '#9fe0ff'); }); });
  pg('zoo', 'zo3', 'הג׳ירפה הגבוהה', 2, function (K) { sky(K, { clouds: [[80, 60]] }); giraffe(K, 230, 300, 1.8); tree(K, 70, 260, 1, '#8ee07a'); });
  pg('zoo', 'zo4', 'קופים על העץ', 2, function (K) { sky(K, { clouds: [[300, 60]], hill2: '#2fb85a' }); tree(K, 200, 240, 2.2); monkey(K, 120, 200, .8); monkey(K, 280, 160, .7); fruit(K, 200, 130, 1.2, 'banana'); });
  pg('zoo', 'zo5', 'פינגווינים על הקרח', 1, function (K) { sky(K, { sky: '#c7efff', grass: '#ffffff', sun: false, clouds: [[80, 60], [300, 60]] }); penguin(K, 130, 290, 1.4); penguin(K, 270, 300, 1.1); });
  pg('zoo', 'zo6', 'הזברה', 2, function (K) { sky(K, { sky: '#fff3b0', grass: '#8ee07a', clouds: [[300, 60]] }); zebra(K, 230, 290, 1.7); });
  pg('zoo', 'zo7', 'ספארי', 3, function (K) { sky(K, { sky: '#ffd9a0', grass: '#ffd93c', clouds: [[300, 50]], hill2: '#ffc93c' }); giraffe(K, 90, 300, .9); elephant(K, 300, 310, .8); lion(K, 200, 340, .6); tree(K, 330, 190, .7, '#2fb85a'); });
  pg('zoo', 'zo8', 'ביקור בגן החיות', 3, function (K) { sky(K, { clouds: [[70, 50]], hill2: '#2fb85a' }); fence(K, 270, '#c98b4f'); monkey(K, 80, 230, .6); penguin(K, 330, 240, .7); zebra(K, 210, 230, .6); girl(K, 120, 330, .6, BOY ? '#3fe0c5' : '#ff5ca8', '#9c6b3f', { bow: '#ffd93c', boy: BOY }); balloon(K, 180, 280, .8, '#3fe0c5'); });

  /* ---- 8. בלט ובמה 🩰 ---- */
  pg('ballet', 'bl1', 'רקדנית בלט', 1, function (K) { stageBg(K, {}); girl(K, 200, 220, 1.7, '#ffb3de', '#9c6b3f', { tutu: '#ff8fc4', arms: 'up', bow: '#ff5ca8' }); });
  pg('ballet', 'bl2', 'על הבמה', 2, function (K) { stageBg(K, { planks: true, lights: true }); girl(K, 140, 240, 1.1, '#9fe0ff', '#ffd93c', { tutu: '#d9fbff', arms: 'up' }); girl(K, 270, 240, 1.1, '#fff27a', '#2b2b3a', { tutu: '#ffd93c', flip: true }); });
  pg('ballet', 'bl3', 'נעלי בלט', 1, function (K) { room(K, '#ffb3de', '#c98b4f', {}); [[160, 250, false], [250, 300, true]].forEach(function (sh) { var P = K.at(sh[0], sh[1], 1.6, sh[2]); P.ink('M-10 -12 Q-40 -60 -10 -90 Q10 -70 -20 -40', 3); P.ink('M10 -14 Q40 -60 20 -96 Q0 -70 26 -40', 3); P.p('M-56 8 Q-60 -14 -34 -18 L34 -22 Q60 -20 58 4 Q54 22 24 22 L-34 22 Q-54 22 -56 8 Z', '#ff8fc4'); P.e(-6, -10, 30, 9, '#ffffff'); P.g('34,-18 22,-30 22,-8', '#ff5ca8'); P.g('34,-18 46,-30 46,-8', '#ff5ca8'); P.c(34, -18, 4, '#ff5ca8'); }); });
  pg('ballet', 'bl4', 'מופע הברבורים', 3, function (K) { stageBg(K, { planks: true, lights: true, back: '#1f3a93' }); [[100, '#ffffff'], [200, '#d9fbff'], [300, '#ffffff']].forEach(function (d, i) { girl(K, d[0], 250, .9, d[1], ['#ffd93c', '#9c6b3f', '#2b2b3a'][i], { tutu: d[1], arms: i === 1 ? 'up' : 'down', flip: i === 2 }); }); });
  pg('ballet', 'bl5', 'חדר חזרות', 2, function (K) { room(K, '#fff3dc', '#c98b4f', { stripes: '#ffe9c2' }); var P = K.at(0, 0, 1); P.r(20, 170, 360, 8, 4, '#c9d2de'); P.r(40, 40, 320, 110, 6, '#d9fbff'); girl(K, 200, 250, 1.1, '#9b5cff', '#c98b4f', { tutu: '#d3b5ff', arms: 'up' }); });
  pg('ballet', 'bl6', 'קופסת נגינה', 2, function (K) { room(K, '#d3b5ff', '#9b5cff', {}); var P = K.at(200, 320, 1.4); P.r(-70, -30, 140, 60, 8, '#ff8fc4'); P.r(-74, -40, 148, 14, 5, '#ffc93c'); heart(K, 200, 330, .5, '#ffffff'); girl(K, 200, 170, .9, '#ffffff', '#ffd93c', { tutu: '#ffb3de', arms: 'up' }); K.at(330, 100, 1).txt(0, 0, 40, '♪'); });
  pg('ballet', 'bl7', 'קידה בסוף המופע', 3, function (K) { stageBg(K, { planks: true, lights: true }); girl(K, 200, 240, 1.2, '#ff5ca8', '#9c6b3f', { tutu: '#ffb3de', crown: true }); [[80, 360], [320, 360], [130, 380], [270, 380]].forEach(function (f, i) { flower(K, f[0], f[1], .45, ['#ff3b3b', '#ffd93c', '#9b5cff', '#ff5ca8'][i]); }); });
  pg('ballet', 'bl8', 'כוכבת הבמה', 1, function (K) { stageBg(K, {}); star(K, 200, 200, 3, '#ffd93c'); });

  /* ---- 9. הסופרמרקט 🛒 ---- */
  pg('market', 'mk1', 'עגלת קניות', 1, function (K) { room(K, '#fff27a', '#ffffff', { tiles: 6, tile2: '#9fe0ff' }); cart(K, 200, 270, 2); fruit(K, 170, 170, 1.4, 'apple'); fruit(K, 230, 175, 1.4, 'banana'); });
  pg('market', 'mk2', 'דוכן הפירות', 2, function (K) { room(K, '#c7efff', '#ffffff', { tiles: 8, tile2: '#fff3dc' }); var P = K.at(200, 300, 1); P.r(-160, -40, 320, 100, 8, '#c98b4f'); P.p('M-170 -170 L170 -170 L150 -130 L-150 -130 Z', '#ff3b3b'); for (var i = -150; i < 150; i += 50) P.r(i, -130, 25, 20, 0, '#ffffff'); ['apple', 'orange', 'pear', 'grapes', 'banana'].forEach(function (f, j) { fruit(K, 80 + j * 60, 250, 1.2, f); }); });
  pg('market', 'mk3', 'המדפים', 3, function (K) { room(K, '#fff3dc', '#ffffff', { tiles: 10, tile2: '#c7efff' }); shelf(K, 200, 190, 1.4); var cs = ['#ff5ca8', '#3fe0c5', '#ffd93c', '#9b5cff', '#ff8a3c', '#2fb85a']; for (var r = 0; r < 3; r++) for (var c = 0; c < 6; c++) (r === 1 ? box : jar)(K, 100 + c * 40, 120 + r * 72, 1, cs[(r * 2 + c) % 6]); });
  pg('market', 'mk4', 'בקופה', 2, function (K) { room(K, '#d3b5ff', '#ffffff', { tiles: 8 }); register(K, 250, 270, 1.4); girl(K, 100, 250, 1, '#3fe0c5', '#9c6b3f', { bow: '#ff5ca8', boy: BOY }); });
  pg('market', 'mk5', 'סל הפירות', 1, function (K) { room(K, '#fff27a', '#c98b4f', {}); var P = K.at(200, 290, 1.6); P.p('M-80 -20 L80 -20 L60 50 L-60 50 Z', '#c98b4f'); P.ink('M-60 0 L60 0 M-54 24 L54 24 M-20 -20 L-16 50 M20 -20 L16 50', 2.4); P.ink('M-70 -20 Q0 -110 70 -20', 5); ['apple', 'orange', 'banana'].forEach(function (f, i) { fruit(K, 150 + i * 50, 240, 1.3, f); }); });
  pg('market', 'mk6', 'המאפייה', 2, function (K) { room(K, '#ffc49b', '#fff3dc', { tiles: 8, tile2: '#ffffff' }); table(K, 200, 300, 1.6, '#9c6b3f'); [[110, '#e8c9a0'], [200, '#c98b4f'], [290, '#e8c9a0']].forEach(function (b) { K.at(b[0], 270, 1).e(0, 0, 36, 20, b[1]); K.at(b[0], 270, 1).ink('M-18 -8 L-12 8 M0 -10 L4 8 M16 -8 L20 8', 2.4); }); cake(K, 200, 140, .9, '#ff8fc4', '#fff3dc'); });
  pg('market', 'mk7', 'קונים בסופר', 3, function (K) { room(K, '#c7efff', '#ffffff', { tiles: 10, tile2: '#fff3dc' }); shelf(K, 320, 180, .8); for (var i = 0; i < 4; i++) jar(K, 270 + i * 34, 130, .8, ['#ff5ca8', '#3fe0c5', '#ffd93c', '#9b5cff'][i]); cart(K, 150, 320, 1.1); fruit(K, 130, 270, 1, 'apple'); fruit(K, 170, 272, 1, 'banana'); girl(K, 60, 300, .7, '#ff8a3c', '#2b2b3a', { boy: BOY }); });
  pg('market', 'mk8', 'גלידה במקרר', 1, function (K) { room(K, '#d9fbff', '#ffffff', {}); fridge(K, 200, 240, 1.6); icecream(K, 320, 270, .8, '#ff8fc4', '#fff27a'); });

  /* ---- 10. מסיבת יום הולדת 🎂 ---- */
  pg('party', 'pt1', 'עוגת יום הולדת', 1, function (K) { room(K, '#ffb3de', '#9b5cff', {}); cake(K, 200, 260, 1.6, '#9fe0ff', '#ff8fc4'); });
  pg('party', 'pt2', 'בלונים!', 1, function (K) { sky(K, { clouds: [[80, 60]] }); balloon(K, 120, 150, 1.6, '#ff5ca8'); balloon(K, 210, 120, 1.8, '#3fe0c5'); balloon(K, 300, 160, 1.5, '#ffd93c'); });
  pg('party', 'pt3', 'ערימת מתנות', 2, function (K) { room(K, '#fff27a', '#ff8fc4', { dots: '#ffffff' }); gift(K, 140, 310, 1.4, '#9b5cff', '#ffd93c'); gift(K, 260, 320, 1.2, '#3fe0c5', '#ff5ca8'); gift(K, 200, 210, 1, '#ff3b3b', '#ffffff'); });
  pg('party', 'pt4', 'כובעי מסיבה', 1, function (K) { room(K, '#9fe0ff', '#ffc49b', {}); hatParty(K, 120, 230, 2.2, '#ff5ca8'); hatParty(K, 280, 240, 2, '#9b5cff'); garland(K, 30, ['#ff3b3b', '#ffd93c', '#2fb85a', '#3d7bff']); });
  pg('party', 'pt5', 'החתולה חוגגת', 2, function (K) { room(K, '#d3b5ff', '#ffc49b', {}); garland(K, 26, ['#ff5ca8', '#ffd93c', '#3fe0c5']); cat(K, 200, 280, 1.1, CATS[0], { bow: '#ff5ca8' }); hatParty(K, 200, 180, .9, '#3fe0c5'); balloon(K, 70, 150, 1, '#ff3b3b'); balloon(K, 330, 140, 1, '#ffd93c'); });
  pg('party', 'pt6', 'שולחן המסיבה', 3, function (K) { room(K, '#fff27a', '#9fe0ff', { tiles: 10, tile2: '#ffffff', stripes: '#fff9c2' }); garland(K, 20, ['#ff3b3b', '#9b5cff', '#2fb85a', '#ff8a3c']); table(K, 200, 310, 1.6, '#ff5ca8'); cake(K, 200, 245, .6, '#9fe0ff', '#ffffff'); cupcake(K, 110, 285, .5, '#ffd93c', '#ffb3de'); cupcake(K, 290, 285, .5, '#9fe0ff', '#fff3dc'); balloon(K, 60, 130, .8, '#3fe0c5'); balloon(K, 340, 130, .8, '#ff5ca8'); });
  pg('party', 'pt7', 'כולם שרים', 3, function (K) { room(K, '#ffb3de', '#c98b4f', { dots: '#ffd9ee' }); garland(K, 22, ['#ffd93c', '#3fe0c5', '#9b5cff']); cake(K, 200, 330, .8, '#ffffff', '#ff8fc4'); cat(K, 80, 300, .55, CATS[1], {}); pup(K, 320, 300, .55, '#e8c9a0', 'medic', { flip: true }); girl(K, 200, 170, .7, '#9b5cff', '#9c6b3f', { crown: true, arms: 'up' }); });
  pg('party', 'pt8', 'קאפקייק עם נר', 1, function (K) { room(K, '#9fe0ff', '#ff8fc4', {}); cupcake(K, 200, 230, 3, '#ffd93c', '#ffb3de'); });

  /* ---- 11. הרפתקה מתחת לים 🧜‍♀️ ---- */
  pg('sea2', 'sa1', 'בת הים', 1, function (K) { sea(K, { weed: true }); mermaid(K, 200, 180, 1.6, '#3fe0c5', '#ff5ca8'); });
  pg('sea2', 'sa2', 'תיבת האוצר', 2, function (K) { sea(K, { weed: true }); chest(K, 200, 320, 1.5); fish(K, 110, 150, .9, '#ffd93c'); fish(K, 290, 120, .8, '#ff5ca8', true); });
  pg('sea2', 'sa3', 'צוללת צהובה', 2, function (K) { sea(K, {}); sub(K, 210, 200, 1.4, '#ffd93c'); fish(K, 80, 300, .7, '#3fe0c5'); coral(K, 320, 340, 1, '#ff5ca8'); });
  pg('sea2', 'sa4', 'סוסון ים וצב', 1, function (K) { sea(K, { weed: true }); seahorse(K, 130, 200, 2, '#ff8a3c'); turtle(K, 280, 250, 1.4); });
  pg('sea2', 'sa5', 'שונית האלמוגים', 3, function (K) { sea(K, {}); [[50, '#ff5ca8'], [110, '#ff8a3c'], [170, '#9b5cff'], [230, '#ffd93c'], [290, '#3fe0c5'], [350, '#ff3b3b']].forEach(function (c, i) { coral(K, c[0], 350, .8 + (i % 2) * .3, c[1]); }); fish(K, 100, 150, .7, '#ffd93c'); fish(K, 220, 110, .6, '#ff5ca8', true); fish(K, 300, 200, .7, '#3d7bff'); seahorse(K, 60, 250, .7, '#9b5cff'); });
  pg('sea2', 'sa6', 'בת הים והדגים', 2, function (K) { sea(K, { weed: true }); mermaid(K, 140, 180, 1.1, '#9b5cff', '#ffd93c'); fish(K, 280, 140, .9, '#ff8a3c', true); fish(K, 300, 250, .8, '#3fe0c5', true); });
  pg('sea2', 'sa7', 'מסיבה בקרקעית', 3, function (K) { sea(K, { weed: true }); mermaid(K, 100, 190, .8, '#3fe0c5', '#ff5ca8'); turtle(K, 280, 300, .8); chest(K, 200, 350, .6); seahorse(K, 330, 160, .6, '#ffd93c'); fish(K, 220, 110, .6, '#9b5cff'); coral(K, 360, 350, .6, '#ff8a3c'); });
  pg('sea2', 'sa8', 'דג גדול', 1, function (K) { sea(K, {}); fish(K, 200, 200, 3.2, '#ff8a3c'); });

  /* ---- 12. עולם הדרקונים 🐉 ---- */
  pg('dragons', 'dg1', 'דרקון תינוק', 1, function (K) { sky(K, { clouds: [[80, 60]] }); dragon(K, 200, 240, 2, '#8ee07a', {}); });
  pg('dragons', 'dg2', 'ביצת הדרקון', 1, function (K) { room(K, '#d3b5ff', '#c98b4f', {}); var P = K.at(200, 250, 2); P.e(0, 0, 50, 64, '#fff27a'); P.c(-18, -20, 10, '#ff8fc4'); P.c(20, 10, 12, '#9fe0ff'); P.c(-10, 30, 8, '#8ee07a'); P.ink('M-10 -60 L0 -44 L-8 -34 L6 -24', 3); rug(K, 200, 370, 1, '#ff5ca8', '#ffd93c'); });
  pg('dragons', 'dg3', 'דרקון ליד הטירה', 2, function (K) { sky(K, { clouds: [[300, 60]], hill2: '#2fb85a' }); castle(K, 120, 250, .8, '#c9d2de'); dragon(K, 290, 260, 1.2, '#ff8fc4', { wing: '#9b5cff', flip: true }); });
  pg('dragons', 'dg4', 'דרקון נושף אש', 2, function (K) { night(K); dragon(K, 170, 250, 1.6, '#3fe0c5', { fire: true }); });
  pg('dragons', 'dg5', BOY ? 'הרופא והדרקון' : 'הרופאה והדרקון', 2, function (K) { room(K, '#d9fbff', '#ffffff', { tiles: 8, tile2: '#9fe0ff' }); dragon(K, 250, 290, 1.1, '#ff9a3c', { flip: true }); girl(K, 100, 250, 1, '#ffffff', '#9c6b3f', { bow: '#ff3b3b', boy: BOY }); K.at(100, 245, 1).r(-8, -4, 16, 16, 2, '#ff3b3b'); });
  pg('dragons', 'dg6', 'שני חברים דרקונים', 3, function (K) { sky(K, { clouds: [[80, 50]], hill2: '#2fb85a' }); dragon(K, 120, 290, .9, '#9b5cff', { wing: '#ffd93c' }); dragon(K, 290, 290, .9, '#ff5ca8', { wing: '#3fe0c5', flip: true }); heart(K, 205, 170, .6, '#ff3b3b'); [[40, 380], [360, 380], [200, 385]].forEach(function (f, i) { flower(K, f[0], f[1], .45, ['#ffd93c', '#ff5ca8', '#9fe0ff'][i]); }); });
  pg('dragons', 'dg7', 'דרקון בעננים', 3, function (K) { sky(K, { clouds: [[80, 80], [300, 60], [200, 330, 1.4]], grass: '#9fe0ff', sky: '#c7efff' }); dragon(K, 200, 190, 1.2, '#ffd93c', { wing: '#ff8fc4' }); star(K, 60, 200, .4, '#ffd93c'); star(K, 340, 220, .4, '#ff5ca8'); });
  pg('dragons', 'dg8', 'אוצר הדרקון', 3, function (K) { room(K, '#9aa0ab', '#c98b4f', { tiles: 8, tile2: '#9c6b3f' }); chest(K, 280, 330, 1); dragon(K, 130, 290, 1, '#2fb85a', { wing: '#ffd93c' }); [[220, 370], [340, 375], [300, 380]].forEach(function (c) { K.at(c[0], c[1], 1).c(0, 0, 8, '#ffd93c'); }); });

  /* ---- 13. רובוטים 🤖 ---- */
  pg('robots', 'rb1', 'רובוט חמוד', 1, function (K) { room(K, '#9fe0ff', '#c9d2de', {}); robot(K, 200, 230, 1.9, '#ff8a3c'); });
  pg('robots', 'rb2', 'רובוט ושמש', 1, function (K) { sky(K, { clouds: [[80, 60]] }); robot(K, 200, 250, 1.6, '#3d7bff', { body: '#9fe0ff' }); });
  pg('robots', 'rb3', 'חנות הרובוטים', 2, function (K) { room(K, '#fff27a', '#ffffff', { tiles: 8, tile2: '#c7efff' }); robot(K, 110, 260, 1, '#ff5ca8'); robot(K, 290, 260, 1, '#2fb85a', { flip: true }); });
  pg('robots', 'rb4', 'רובוט בחלל', 2, function (K) { night(K); robot(K, 200, 240, 1.4, '#c9d2de', { body: '#9b5cff' }); K.at(70, 330, 1).c(0, 0, 40, '#ff8fc4'); });
  pg('robots', 'rb5', 'רובוט וכלבלב', 2, function (K) { sky(K, { clouds: [[300, 60]] }); robot(K, 130, 260, 1.2, '#3fe0c5'); pup(K, 290, 310, .9, '#ffd93c', 'build', { flip: true }); });
  pg('robots', 'rb6', 'מפעל הרובוטים', 3, function (K) { room(K, '#c9d2de', '#9aa0ab', { tiles: 10, tile2: '#c9d2de' }); var P = K.at(0, 0, 1); P.r(0, 320, 400, 20, 4, '#2b2b3a'); for (var x = 20; x < 400; x += 40) P.c(x, 330, 7, '#9aa0ab'); robot(K, 90, 250, .7, '#ff8a3c'); robot(K, 200, 250, .7, '#3d7bff'); robot(K, 310, 250, .7, '#ff5ca8'); [[80, 80], [320, 80]].forEach(function (g) { K.at(g[0], g[1], 1).c(0, 0, 26, '#ffd93c'); }); });
  pg('robots', 'rb7', 'רובוט גנן', 3, function (K) { sky(K, { clouds: [[80, 50]], hill2: '#2fb85a' }); robot(K, 150, 260, 1, '#9b5cff'); [[260, 360], [300, 350], [340, 365], [230, 380]].forEach(function (f, i) { flower(K, f[0], f[1], .6, ['#ff5ca8', '#ffd93c', '#ff8a3c', '#3fe0c5'][i]); }); tree(K, 340, 250, .8); });
  pg('robots', 'rb8', 'רובוט ענק', 1, function (K) { room(K, '#d3b5ff', '#9fe0ff', {}); robot(K, 200, 220, 2.3, '#ffd93c', { body: '#ff8a3c' }); });

  /* ---- 14. אתר בנייה 🚜 ---- */
  pg('build', 'bd1', 'המחפר', 1, function (K) { sky(K, { clouds: [[80, 60]], grass: '#e8c9a0' }); digger(K, 200, 300, 1.6); });
  pg('build', 'bd2', 'משאית', 1, function (K) { sky(K, { clouds: [[300, 60]], grass: '#e8c9a0' }); truck(K, 200, 300, 1.5, '#ff8a3c'); });
  pg('build', 'bd3', 'עגורן', 2, function (K) { sky(K, { clouds: [[300, 80]] }); crane(K, 160, 330, 1.4); bricks(K, 250, 360, 4, 4, '#ff8a3c', '#ffb36b'); });
  pg('build', 'bd4', 'בונים קיר', 3, function (K) { sky(K, { clouds: [[80, 50], [300, 60]], grass: '#e8c9a0' }); bricks(K, 40, 330, 10, 8, '#ff3b3b', '#ff8a3c'); pup(K, 320, 330, .6, '#c98b4f', 'build', { flip: true }); cone(K, 40, 370, .6); cone(K, 110, 370, .6); });
  pg('build', 'bd5', 'כלבלב הבנאי במשאית', 2, function (K) { sky(K, { clouds: [[80, 60]], grass: '#e8c9a0' }); truck(K, 220, 310, 1.2, '#ffd93c'); pup(K, 290, 262, .45, '#c98b4f', 'build', { flip: true }); cone(K, 60, 360, .8); });
  pg('build', 'bd6', 'בונים בית', 3, function (K) { sky(K, { clouds: [[300, 60]], grass: '#e8c9a0' }); var P = K.at(150, 300, 1); P.r(-80, -80, 160, 110, 2, '#fff3dc'); P.ink('M-80 -80 L80 30 M80 -80 L-80 30 M0 -80 L0 30 M-80 -25 L80 -25', 3); crane(K, 300, 330, .9); cone(K, 60, 370, .6); cone(K, 240, 370, .6); });
  pg('build', 'bd7', 'כל הכלים', 3, function (K) { sky(K, { clouds: [[80, 50]], grass: '#e8c9a0' }); digger(K, 110, 250, .7); truck(K, 290, 260, .7, '#ff8a3c'); cone(K, 60, 360, .6); cone(K, 140, 365, .6); pup(K, 220, 340, .5, '#c98b4f', 'build', {}); bricks(K, 250, 380, 4, 2, '#ff3b3b', '#ff8a3c'); });
  pg('build', 'bd8', 'קונוס תנועה', 1, function (K) { sky(K, { clouds: [[80, 60], [300, 70]], grass: '#e8c9a0' }); cone(K, 200, 260, 3.4); });

  /* ================= פרק 4.5 — מדבקות צבעוניות ורקעים לציור החופשי ================= */
  /* colored(K, vb) — מחרוזת SVG צבועה (כל אזור בצבע המומלץ שלו) מתוך Kit; vb = viewBox */
  function colored(K, vb) {
    return ArtPages.svg({ s: K.s, d: K.d }).replace('viewBox="0 0 400 400"', 'viewBox="' + (vb || '0 0 400 400') + '"')
      .replace(/fill="#ffffff"([^>]*?)data-c="([^"]+)"/g, 'fill="$2"$1data-c="$2"');
  }
  /* STK — ספריית מדבקות לפי נושא: [מזהה, פונקציית ציור במסגרת 200×200 (מרכז 100,100)] */
  var STK = {
    home: [['bed', function (K) { bed(K, 100, 110, 1.1, '#ff5ca8', '#9fe0ff'); }], ['sofa', function (K) { sofa(K, 100, 110, 1, '#3fe0c5'); }], ['table', function (K) { table(K, 100, 100, 1.2, '#9b5cff'); }],
      ['lamp', function (K) { lamp(K, 100, 110, 2); }], ['tub', function (K) { tub(K, 100, 110, 1.1); }], ['fridge', function (K) { fridge(K, 100, 105, 1); }], ['stove', function (K) { stove(K, 100, 105, 1.4); }],
      ['plant', function (K) { plant(K, 100, 120, 1.6); }], ['frame', function (K) { frame(K, 100, 100, 2.6, '#ffc93c'); }], ['window', function (K) { window1(K, 100, 100, 1.5); }], ['rug', function (K) { rug(K, 100, 100, 1, '#ff5ca8', '#fff27a'); }],
      ['teapot', function (K) { teapot(K, 100, 110, 2, '#3fe0c5'); }], ['pot', function (K) { pot(K, 100, 110, 2, '#ff3b3b'); }], ['house', function (K) { house(K, 100, 120, 1, '#fff27a', '#ff3b3b'); }]],
    pets: [['cat1', function (K) { cat(K, 100, 110, 1.3, '#ff9a3c', { bow: '#ff5ca8' }); }], ['cat2', function (K) { cat(K, 100, 110, 1.3, '#c9d2de', { crown: true }); }], ['cat3', function (K) { cat(K, 100, 110, 1.3, '#d3b5ff', { pose: 'wave', bow: '#3d7bff' }); }],
      ['mouse', function (K) { mouse(K, 100, 110, 1.8, { cheese: true }); }], ['pup1', function (K) { pup(K, 100, 115, 1.3, '#e8c9a0', 'fire', { ear: '#9c6b3f' }); }], ['pup2', function (K) { pup(K, 100, 115, 1.3, '#9aa0ab', 'police', { ear: '#1f3a93' }); }],
      ['pup3', function (K) { pup(K, 100, 115, 1.3, '#ffc49b', 'medic', { ear: '#ff8fc4' }); }], ['bunny', function (K) { bunny(K, 100, 120, 1.6, '#ffffff'); }], ['dragon', function (K) { dragon(K, 100, 110, 1.3, '#8ee07a', {}); }],
      ['penguin', function (K) { penguin(K, 100, 110, 1.8); }], ['lion', function (K) { lion(K, 100, 115, 1.2); }], ['chick', function (K) { chick(K, 100, 100, 2.4); }], ['pig', function (K) { pig(K, 110, 110, 1.6); }], ['fish', function (K) { fish(K, 100, 100, 2.2, '#ff8a3c'); }]],
    sweets: [['cupcake', function (K) { cupcake(K, 100, 100, 2.4, '#9fe0ff', '#ffb3de'); }], ['lolly', function (K) { lolly(K, 100, 80, 1.6, '#ff5ca8', '#fff27a'); }], ['icecream', function (K) { icecream(K, 100, 90, 1.7, '#ff8fc4', '#9fe0ff'); }],
      ['cane', function (K) { cane(K, 90, 90, 1.3); }], ['cake', function (K) { cake(K, 100, 120, 1.1, '#9fe0ff', '#ff8fc4'); }], ['gift', function (K) { gift(K, 100, 110, 1.8, '#9b5cff', '#ffd93c'); }], ['balloon', function (K) { balloon(K, 100, 70, 1.7, '#ff3b3b'); }],
      ['gum', function (K) { gumdrop(K, 100, 100, 3, '#3fe0c5'); }], ['apple', function (K) { fruit(K, 100, 100, 3.6, 'apple'); }], ['banana', function (K) { fruit(K, 100, 100, 3, 'banana'); }], ['hat', function (K) { hatParty(K, 100, 100, 2.4, '#ff5ca8'); }]],
    magic: [['crown', function (K) { var P = K.at(100, 100, 1.4); P.p('M-60 30 L-60 -30 L-30 0 L0 -44 L30 0 L60 -30 L60 30 Z', '#ffc93c'); P.c(0, 10, 10, '#ff3b3b'); P.c(-34, 14, 7, '#3fe0c5'); P.c(34, 14, 7, '#9b5cff'); }],
      ['star', function (K) { star(K, 100, 100, 2, '#ffd93c'); }], ['heart', function (K) { heart(K, 100, 100, 2, '#ff5ca8'); }], ['flower', function (K) { flower(K, 100, 90, 2.4, '#ff5ca8'); }], ['castle', function (K) { castle(K, 100, 120, .8, '#d3b5ff'); }],
      ['cloud', function (K) { cloud(K, 100, 100, 1.8); }], ['rainbow', function (K) { var P = K.at(100, 130, 1); ['#ff3b3b', '#ff8a3c', '#ffd93c', '#2fb85a', '#3d7bff', '#9b5cff'].forEach(function (c, i) { var r = 90 - i * 12; P.p('M' + (-r) + ' 0 Q' + (-r) + ' ' + (-r * 1.2) + ' 0 ' + (-r * 1.2) + ' Q' + r + ' ' + (-r * 1.2) + ' ' + r + ' 0 L' + (r - 12) + ' 0 Q' + (r - 12) + ' ' + (-(r - 12) * 1.2) + ' 0 ' + (-(r - 12) * 1.2) + ' Q' + (-(r - 12)) + ' ' + (-(r - 12) * 1.2) + ' ' + (-(r - 12)) + ' 0 Z', c); }); }],
      ['princess', function (K) { girl(K, 100, 100, 1.1, '#ff8fc4', '#ffd93c', { crown: true, wand: true }); }], ['mermaid', function (K) { mermaid(K, 100, 80, 1, '#3fe0c5', '#ff5ca8'); }], ['robot', function (K) { robot(K, 100, 110, 1.1, '#ff8a3c'); }],
      ['tree', function (K) { tree(K, 100, 110, 1.6); }], ['sub', function (K) { sub(K, 110, 110, 1, '#ffd93c'); }], ['truck', function (K) { fireTruck(K, 100, 110, .95); }], ['heli', function (K) { heli(K, 100, 120, .95); }]]
  };
  var STK_TABS = [['emoji', '😀', 'אימוג׳י'], ['home', '🏠', 'בית ורהיטים'], ['pets', '🐱', 'חיות'], ['sweets', '🧁', 'ממתקים ומסיבה'], ['magic', '👑', 'קסם ועוד']];
  var stkCache = {};
  /* sticker(id) — SVG צבעוני של מדבקה (viewBox 200×200) */
  function sticker(id) {
    if (stkCache[id]) return stkCache[id];
    for (var t in STK) for (var i = 0; i < STK[t].length; i++) if (STK[t][i][0] === id) { var K = new Kit(); STK[t][i][1](K); return (stkCache[id] = colored(K, '0 0 200 200')); }
    return '';
  }
  /* BGS2 — 16 רקעים חדשים לציור החופשי: סצנה צבעונית (בלי דמויות) שנמתחת לכל הבמה */
  var BGS2 = [
    ['dollroom', 'חדר בובות', function (K) { room(K, '#ffb3de', '#ffc49b', { stripes: '#ffd9ee', win: [300, 120] }); frame(K, 90, 110, 1.2); rug(K, 200, 350, 1.2, '#9b5cff', '#fff27a'); }],
    ['kitchen', 'מטבח', function (K) { room(K, '#fff27a', '#9fe0ff', { tiles: 8 }); fridge(K, 60, 250, 1); stove(K, 330, 250, 1.1); window1(K, 200, 120, 1); }],
    ['garden', 'גינה', function (K) { sky(K, { clouds: [[80, 60]] }); fence(K, 250, '#ffffff'); [[40, 360, '#ff5ca8'], [110, 370, '#ffd93c'], [300, 365, '#9b5cff'], [370, 360, '#ff8a3c']].forEach(function (f) { flower(K, f[0], f[1], .7, f[2]); }); }],
    ['palace', 'ארמון', function (K) { room(K, '#d3b5ff', '#fff3dc', { tiles: 8, tile2: '#ffb3de' }); var P = K.at(0, 0, 1); [50, 350].forEach(function (x) { P.r(x - 20, 40, 40, 250, 4, '#ffffff'); P.r(x - 28, 30, 56, 16, 4, '#ffc93c'); }); P.p('M120 0 L280 0 Q260 80 200 90 Q140 80 120 0 Z', '#ff5ca8'); }],
    ['beach', 'חוף הים', function (K) { var P = K.at(0, 0, 1); P.r(0, 0, 400, 400, 0, '#9fe0ff'); P.c(320, 70, 34, '#ffd93c'); P.r(0, 200, 400, 110, 0, '#3d7bff'); P.p('M0 290 Q200 260 400 295 L400 400 L0 400 Z', '#ffe7a8'); cloud(K, 90, 60, 1); var U = K.at(90, 300, 1); U.r(-3, -60, 6, 70, 2, '#ffffff'); U.p('M-60 -56 Q0 -110 60 -56 Z', '#ff3b3b'); }],
    ['forest', 'יער', function (K) { sky(K, { clouds: [[300, 60]], hill2: '#2fb85a' }); tree(K, 60, 250, 1.3); tree(K, 170, 230, 1, '#8ee07a'); tree(K, 330, 250, 1.4, '#1e7a44'); }],
    ['circus', 'קרקס', function (K) { var P = K.at(0, 0, 1); P.r(0, 0, 400, 400, 0, '#fff3dc'); for (var x = 0; x < 400; x += 50) P.p('M' + x + ' 300 L' + (x + 25) + ' 300 L200 20 Z', '#ff3b3b'); P.p('M0 300 L400 300 L400 400 L0 400 Z', '#ffc93c'); P.g('190,20 210,20 200,-10', '#ffd93c'); P.e(200, 350, 120, 26, '#ff5ca8'); }],
    ['stage', 'במה', function (K) { stageBg(K, { planks: true, lights: true }); }],
    ['classroom', 'כיתה', function (K) { room(K, '#fff3dc', '#c98b4f', {}); var P = K.at(0, 0, 1); P.r(60, 50, 280, 150, 8, '#1e7a44'); P.r(52, 42, 296, 12, 4, '#9c6b3f'); P.r(52, 196, 296, 12, 4, '#9c6b3f'); P.txt(200, 140, 44, 'א ב ג'); }],
    ['snow', 'שלג', function (K) { var P = K.at(0, 0, 1); P.r(0, 0, 400, 400, 0, '#c7efff'); P.p('M0 280 Q120 240 220 280 Q320 310 400 270 L400 400 L0 400 Z', '#ffffff'); [[60, 60], [150, 120], [250, 50], [340, 130], [100, 200], [300, 210]].forEach(function (s) { K.at(s[0], s[1], 1).ink('M-10 0 L10 0 M0 -10 L0 10 M-7 -7 L7 7 M7 -7 L-7 7', 2.4); }); var M = K.at(310, 320, 1); M.c(0, 20, 34, '#ffffff'); M.c(0, -30, 24, '#ffffff'); M.g('-2,-30 22,-26 -2,-22', '#ff8a3c'); M.dot(-8, -36, 3); M.dot(6, -36, 3); M.r(-20, -8, 40, 8, 3, '#ff3b3b'); }],
    ['reef', 'שונית', function (K) { sea(K, { weed: true }); coral(K, 120, 350, 1, '#ff5ca8'); coral(K, 280, 345, 1.2, '#ff8a3c'); }],
    ['candyland', 'ארץ ממתקים', function (K) { sky(K, { sky: '#ffd9ee', grass: '#ffb3de', clouds: [[80, 60]] }); lolly(K, 60, 230, .8, '#ff5ca8', '#fff27a'); lolly(K, 340, 220, .9, '#3fe0c5', '#ffffff'); cane(K, 200, 260, .6); }],
    ['farmyard', 'חווה', function (K) { sky(K, { clouds: [[80, 60]] }); barn(K, 300, 200, .9); fence(K, 250, '#ffffff'); }],
    ['city', 'עיר ביום', function (K) { var P = K.at(0, 0, 1); P.r(0, 0, 400, 400, 0, '#9fe0ff'); cloud(K, 90, 60, 1); [[0, 150, '#ff8fc4'], [70, 110, '#ffd93c'], [150, 170, '#3fe0c5'], [220, 90, '#9b5cff'], [300, 140, '#ff8a3c'], [360, 180, '#8ee07a']].forEach(function (b) { P.r(b[0], b[1], 70, 320 - b[1], 4, b[2]); for (var y = b[1] + 16; y < 290; y += 36) { P.r(b[0] + 12, y, 16, 18, 2, '#fff27a'); P.r(b[0] + 40, y, 16, 18, 2, '#fff27a'); } }); P.r(0, 320, 400, 80, 0, '#9aa0ab'); P.ink('M0 360 L60 360 M100 360 L160 360 M200 360 L260 360 M300 360 L360 360', 5); }],
    ['chalk', 'לוח גיר', null], ['kraft', 'נייר חום', null]
  ];
  var bgCache = {};
  /* bgSvg(id) — SVG צבעוני של רקע (או null לרקעים שמצוירים ישירות בקנבס) */
  function bgSvg(id) {
    if (bgCache[id] !== undefined) return bgCache[id];
    var b = BGS2.filter(function (x) { return x[0] === id; })[0];
    if (!b || !b[2]) return (bgCache[id] = null);
    var K = new Kit(); b[2](K); return (bgCache[id] = colored(K).replace('<svg ', '<svg preserveAspectRatio="xMidYMid slice" width="400" height="400" '));
  }

  /* ================= פרק 5 — חיבור ל-ArtPages ================= */
  var SERIES = [
    ['dollhouse', 'בית הבובות', '🏠'], ['catmouse', 'חתול ועכבר', '🐭'], ['rescue', 'כלבלבי ההצלה', '🐶'], ['candy', 'ארץ הממתקים', '🍭'],
    ['princess', 'ממלכת הנסיכות', '👑'], ['farm', 'החווה', '🐄'], ['zoo', 'גן החיות', '🦁'], ['ballet', 'בלט ובמה', '🩰'],
    ['market', 'הסופרמרקט', '🛒'], ['party', 'יום הולדת', '🎂'], ['sea2', 'הרפתקה בים', '🧜‍♀️'], ['dragons', 'עולם הדרקונים', '🐉'],
    ['robots', 'רובוטים', '🤖'], ['build', 'אתר בנייה', '🚜']
  ];
  /* בגרסת הבנים: רובוטים, אתר בנייה, כלבלבי ההצלה ודרקונים קודם; נסיכות ובלט בסוף */
  if (BOY) { var FIRST = ['robots', 'build', 'rescue', 'dragons', 'catmouse', 'zoo', 'farm', 'sea2', 'market', 'party', 'candy', 'dollhouse', 'princess', 'ballet'];
    SERIES.sort(function (a, b) { return FIRST.indexOf(a[0]) - FIRST.indexOf(b[0]); }); SERIES.forEach(function (x) { if (x[0] === 'sea2') x[2] = '🐠'; }); }
  PAGES.forEach(function (p) { ArtPages.PAGES.push(p); });
  Array.prototype.unshift.apply(ArtPages.PACKS, SERIES);
  ArtPages.SERIES = SERIES.map(function (s) { return s[0]; });
  ArtPages.LEVELS = { 1: ['🟢', 'קל'], 2: ['🟡', 'בינוני'], 3: ['🔴', 'מאתגר'] };
  /* מדבקות ורקעים לסטודיו (פרק 4.5) */
  ArtPages.sticker = sticker;
  ArtPages.STK_TABS = STK_TABS;
  ArtPages.stickersIn = function (tab) { return (STK[tab] || []).map(function (x) { return x[0]; }); };
  ArtPages.BGS2 = BGS2.map(function (b) { return [b[0], b[1]]; });
  ArtPages.bgSvg = bgSvg;
})();
