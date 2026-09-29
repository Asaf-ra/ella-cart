/* =====================================================================
   js/horse.js — הסוס של הרוכב/ת: מודל, שמירה, צרכים וציור SVG (משותף לרכיבה ולחווה)
   ---------------------------------------------------------------------
   פרק 1 — קטלוג: צבעי פרווה, רעמה, אוכף, ואביזרים (חלקם חינם, חלקם במטבעות מהארנק)
   פרק 2 — מצב ושמירה: <pfx>-horse-v1 = { name, coat, mane, saddle, acc[], own[], needs, braids, mud, hoof, rides, best, tracks, week }
   פרק 3 — צרכים: אוכל 🥕, ניקיון 🪮, שמחה 💖, אנרגיה ⚡ — יורדים לאט עם הזמן (ובכל רכיבה), עולים בטיפול
   פרק 4 — ציור מהצד (svg): גוף, רגליים ופרסות, זנב, צוואר, ראש, רעמה עם צמות, אוכף, אביזרים, בוץ, טיפות, פנים לפי מצב רוח
   פרק 5 — צבעים ל-POV (מבט הרוכב/ת): povColors() — פרווה, רעמה ורסן לציור בקנבס
   window.RIDE_BOY = גרסת הבנים (שם ברירת מחדל, אביזרי אביר/קאובוי)
   ===================================================================== */
(function () {
  'use strict';
  var BOY = !!window.RIDE_BOY, PFX = BOY ? 'eitan' : 'ella', KEY = PFX + '-horse-v1', INK = BOY ? '#101e36' : '#1b1036';

  /* ================= פרק 1 — קטלוג ================= */
  /* [מזהה, צבע, שם, מחיר במטבעות (0 = חינם)] */
  var COATS = [['choco', '#9c6b3f', 'שוקולד', 0], ['white', '#f4efe8', 'לבן', 0], ['gold', '#e8b060', 'זהוב', 0], ['black', '#3a3040', 'שחור', 0],
    ['gray', '#b8bcc6', 'אפור כסוף', 5], ['cream', '#f3dcb0', 'וניל', 5], ['pink', '#ffc4de', 'ורוד קסום', 12], ['blue', '#b6dcff', 'תכלת קסום', 12]];
  var MANES = [['dark', '#4a2c18', 'חום כהה', 0], ['blond', '#ffe08a', 'בלונדיני', 0], ['white', '#ffffff', 'לבן', 0], ['black', '#1f1a24', 'שחור', 0],
    ['rainbow', 'rainbow', 'קשת', 15], ['pink', '#ff5ca8', 'ורוד', 8], ['purple', '#9b5cff', 'סגול', 8], ['mint', '#3fe0c5', 'מנטה', 8]];
  var SADDLES = [['red', '#ff3b3b', 'אדום', 0], ['brown', '#7a4a22', 'עור חום', 0], ['pink', '#ff5ca8', 'ורוד', 0], ['blue', '#3d7bff', 'כחול', 0],
    ['purple', '#9b5cff', 'סגול', 6], ['gold', '#ffc93c', 'זהב', 10]];
  /* אביזרים: [מזהה, אימוג'י לתצוגה, שם, מחיר, רק לבנים/בנות (undefined = לכולם)] */
  var ACCS = [['ribbon', '🎀', 'סרט בזנב', 0, false], ['flowers', '🌸', 'זר פרחים', 0], ['blanket', '⭐', 'שמיכת כוכבים', 6], ['bells', '🔔', 'פעמונים', 6],
    ['plume', '🪶', 'נוצה', 8], ['crown', '👑', 'כתר', 12, false], ['armor', '🛡️', 'שריון אביר', 10, true], ['bandana', '🤠', 'מטפחת קאובוי', 6, true], ['wings', '🦄', 'קרן וכנפיים', 20]];
  ACCS = ACCS.filter(function (a) { return a[4] === undefined || a[4] === BOY; });
  function find(list, id) { return list.filter(function (x) { return x[0] === id; })[0] || list[0]; }

  /* ================= פרק 2 — מצב ושמירה ================= */
  function blank() {
    var now = Date.now();
    return { name: BOY ? 'רעם' : 'כוכבית', coat: BOY ? 'black' : 'choco', mane: BOY ? 'black' : 'blond', saddle: BOY ? 'blue' : 'pink', acc: [], own: [],
      needs: { food: { v: 70, at: now }, clean: { v: 60, at: now }, happy: { v: 70, at: now }, energy: { v: 90, at: now } },
      braids: 0, mud: 3, hoof: [1, 1, 0, 1], rides: 0, best: {}, tracks: 1, week: { id: '', best: 0, cert: 0 }, stars: 0 };
  }
  function load() { try { var b = blank(), s = JSON.parse(localStorage.getItem(KEY)); if (!s) return b; Object.keys(b).forEach(function (k) { if (s[k] == null) s[k] = b[k]; }); return s; } catch (e) { return blank(); } }
  var H = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(H)); } catch (e) {} }

  /* ================= פרק 3 — צרכים ================= */
  /* קצב ירידה לשעה: אוכל 6, ניקיון 3, שמחה 4, אנרגיה 5 (מתמלאת מעצמה 10 לשעה כשהסוס נח) */
  var RATE = { food: -6, clean: -3, happy: -4, energy: 10 };
  function needs() {
    var o = {}, now = Date.now();
    Object.keys(RATE).forEach(function (k) { var n = H.needs[k]; o[k] = Math.max(0, Math.min(100, Math.round(n.v + RATE[k] * (now - n.at) / 36e5))); });
    return o;
  }
  function setNeed(k, v) { var cur = needs(); H.needs[k] = { v: Math.max(0, Math.min(100, v == null ? cur[k] : v)), at: Date.now() }; }
  function bump(k, d) { setNeed(k, needs()[k] + d); save(); }
  /* afterRide — רכיבה מעייפת, מלכלכת ומשמחת */
  function afterRide(stars) {
    var n = needs(); setNeed('energy', n.energy - 25); setNeed('food', n.food - 15); setNeed('clean', n.clean - 20); setNeed('happy', n.happy + 15);
    H.mud = Math.min(6, H.mud + 2); H.hoof = H.hoof.map(function (h, i) { return i % 2 ? 0 : h; }); H.rides++; H.stars += stars || 0; save();
  }
  function mood() { var n = needs(); if (n.energy < 25) return 'tired'; if (n.food < 30) return 'hungry'; if (n.clean < 30 || H.mud > 3) return 'dirty'; if (n.happy < 35) return 'sad'; return 'happy'; }
  /* הסוסה של אלה (כוכבית) בלשון נקבה, הסוס של איתן (רעם) בלשון זכר */
  var MOOD_HE = BOY ? { tired: 'עייף וצריך מנוחה', hungry: 'רעב', dirty: 'מלוכלך', sad: 'משועמם', happy: 'שמח' } : { tired: 'עייפה וצריכה מנוחה', hungry: 'רעבה', dirty: 'מלוכלכת', sad: 'משועממת', happy: 'שמחה' };

  /* ================= פרק 4 — ציור מהצד ================= */
  function mix(hex, t) { var n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255], to = t > 0 ? 255 : 0, a = Math.abs(t); return '#' + c.map(function (v) { return ('0' + Math.round(v + (to - v) * a).toString(16)).slice(-2); }).join(''); }
  var uid = 0;
  /* svg(o) — o.face: happy/eat/sleep/love/neigh; o.wet; o.state (לעקיפה, למשל בתצוגה מקדימה בארון) */
  function svg(o) {
    o = o || {}; var S = o.state || H, id = 'h' + (++uid);
    var coat = find(COATS, S.coat)[1], maneId = find(MANES, S.mane)[1], saddle = find(SADDLES, S.saddle)[1], dk = mix(coat, -.25), lt = mix(coat, .35);
    var mane = maneId === 'rainbow' ? 'url(#' + id + 'rb)' : maneId, st = ' stroke="' + INK + '" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';
    var acc = S.acc || [], face = o.face || 'happy', eat = face === 'eat';
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320" class="horse-svg"><defs>' +
      '<linearGradient id="' + id + 'rb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5ca8"/><stop offset=".25" stop-color="#ffd93c"/><stop offset=".5" stop-color="#3fe0c5"/><stop offset=".75" stop-color="#3d7bff"/><stop offset="1" stop-color="#9b5cff"/></linearGradient>' +
      '<radialGradient id="' + id + 'b" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="' + lt + '"/><stop offset="1" stop-color="' + coat + '"/></radialGradient></defs>';
    s += '<ellipse cx="200" cy="298" rx="150" ry="12" fill="rgba(0,0,0,.18)"/>';
    /* זנב */
    s += '<path d="M92 150 Q48 160 44 214 Q40 250 62 262 Q58 222 76 196 Q86 178 98 168 Z" fill="' + mane + '"' + st + '/>';
    if (acc.indexOf('ribbon') >= 0) s += '<path d="M60 206 l-18 -10 l0 22 z M60 206 l18 -10 l0 22 z" fill="#ff5ca8"' + st + '/><circle cx="60" cy="206" r="6" fill="#ff5ca8"' + st + '/>';
    /* רגליים אחוריות (רחוקות = כהות) ואז קדמיות; פרסות — מלוכלכות אם hoof[i] = 0 */
    function leg(x, far, i) { var c = far ? dk : coat, hc = S.hoof && !S.hoof[i] ? '#7a5a3a' : '#3a3040'; return '<path d="M' + (x - 13) + ' 196 L' + (x - 11) + ' 270 L' + (x + 11) + ' 270 L' + (x + 13) + ' 196 Z" fill="' + c + '"' + st + '/><rect x="' + (x - 14) + '" y="266" width="28" height="18" rx="5" fill="' + hc + '"' + st + '/>' + (S.hoof && !S.hoof[i] ? '<circle cx="' + (x - 4) + '" cy="276" r="3" fill="#c9a36a"/><circle cx="' + (x + 5) + '" cy="273" r="2.4" fill="#c9a36a"/>' : ''); }
    s += leg(122, true, 1) + leg(270, true, 3) + leg(142, false, 0) + leg(250, false, 2);
    /* גוף (מכסה את ראשי הרגליים) */
    s += '<ellipse cx="190" cy="176" rx="104" ry="54" fill="url(#' + id + 'b)"' + st + '/>';
    if (acc.indexOf('blanket') >= 0) s += '<path d="M120 138 Q190 120 250 138 L256 214 Q190 230 116 214 Z" fill="#3d7bff"' + st + '/><path d="M150 170 l5 11 12 1 -9 8 3 12 -11 -6 -11 6 3 -12 -9 -8 12 -1z M214 162 l4 8 9 1 -7 6 2 9 -8 -5 -8 5 2 -9 -7 -6 9 -1z" fill="#ffd93c"/>';
    if (acc.indexOf('armor') >= 0) s += '<path d="M112 140 Q190 118 262 140 L266 196 Q190 214 110 196 Z" fill="#c9d2de"' + st + '/><path d="M140 150 L140 190 M170 144 L170 198 M200 142 L200 200 M230 144 L230 196" stroke="' + INK + '" stroke-width="3"/>';
    /* בוץ */
    for (var m = 0; m < (S.mud || 0); m++) { var mx = [140, 210, 170, 240, 120, 190][m], my = [196, 206, 160, 180, 176, 214][m]; s += '<ellipse cx="' + mx + '" cy="' + my + '" rx="' + (10 + m % 3 * 3) + '" ry="7" fill="#8a6440" opacity=".85"/>'; }
    /* אוכף */
    s += '<path d="M150 128 Q190 112 232 128 L236 150 Q190 162 146 150 Z" fill="' + saddle + '"' + st + '/><rect x="186" y="150" width="8" height="44" rx="3" fill="' + mix(saddle, -.3) + '"' + st + '/><rect x="180" y="190" width="20" height="10" rx="3" fill="#c9d2de"' + st + '/>';
    if (acc.indexOf('bells') >= 0) s += '<circle cx="160" cy="154" r="7" fill="#ffc93c"' + st + '/><circle cx="220" cy="154" r="7" fill="#ffc93c"' + st + '/>';
    if (acc.indexOf('wings') >= 0) s += '<path d="M200 128 Q170 60 120 70 Q150 96 150 120 Q170 110 200 128 Z" fill="#ffffff"' + st + '/><path d="M200 128 Q190 84 160 84" fill="none" stroke="' + INK + '" stroke-width="3"/>';
    /* צוואר, רעמה וראש (ראש מורד כשאוכלים) */
    var hx = eat ? 300 : 292, hy = eat ? 222 : 74, nk = eat ? 'M258 146 Q296 160 314 206 L288 232 Q264 198 234 178 Z' : 'M244 150 Q258 100 282 64 L312 90 Q286 128 280 178 Z';
    s += '<path d="' + nk + '" fill="' + coat + '"' + st + '/>';
    /* רעמה אחת זורמת לאורך הצוואר — או צמות (braids 1–4) */
    var mp = eat ? [[262, 148], [276, 160], [290, 176], [302, 194]] : [[248, 140], [254, 118], [262, 98], [272, 80]];
    if (!(S.braids > 0)) s += (eat ? '<path d="M258 146 Q262 170 256 180 Q272 176 278 186 Q276 200 272 208 Q290 204 300 214 L312 204 Q296 162 258 146 Z"' : '<path d="M246 152 Q230 140 232 124 Q244 128 246 120 Q234 108 238 96 Q250 102 256 96 Q250 82 258 70 Q266 78 276 70 L284 64 Q260 96 250 150 Z"') + ' fill="' + mane + '"' + st + '/>';
    else mp.forEach(function (p, i) { if (i < S.braids) s += '<circle cx="' + (p[0] - 6) + '" cy="' + p[1] + '" r="8" fill="' + mane + '"' + st + '/><circle cx="' + (p[0] - 12) + '" cy="' + (p[1] + 12) + '" r="6.5" fill="' + mane + '"' + st + '/><circle cx="' + (p[0] - 16) + '" cy="' + (p[1] + 23) + '" r="5" fill="#ff5ca8"' + st + '/>'; else s += '<path d="M' + p[0] + ' ' + (p[1] - 8) + ' Q' + (p[0] - 22) + ' ' + p[1] + ' ' + (p[0] - 14) + ' ' + (p[1] + 20) + ' Q' + (p[0] - 4) + ' ' + (p[1] + 8) + ' ' + (p[0] + 6) + ' ' + (p[1] + 10) + ' Z" fill="' + mane + '"' + st + '/>'; });
    s += '<g transform="translate(' + hx + ' ' + hy + ') rotate(' + (eat ? 62 : 0) + ')">' +
      '<path d="M-14 -12 L-10 -44 L4 -16 Z" fill="' + coat + '"' + st + '/><path d="M2 -16 L10 -46 L20 -14 Z" fill="' + coat + '"' + st + '/><path d="M-9 -18 L-8 -34 L-1 -19 Z M7 -18 L10 -36 L15 -18 Z" fill="' + mix(coat, -.15) + '"/>' +
      '<path d="M-26 -12 Q0 -30 28 -18 Q60 -4 78 30 Q86 50 70 60 Q52 68 30 58 Q0 44 -18 26 Q-34 8 -26 -12 Z" fill="' + coat + '"' + st + '/>' +
      '<ellipse cx="62" cy="48" rx="19" ry="14" fill="' + lt + '"' + st + '/><ellipse cx="70" cy="44" rx="3.4" ry="4.4" fill="' + INK + '"/>' +
      '<path d="M-12 -18 Q2 -26 20 -18 Q4 -6 -12 -18 Z" fill="' + mane + '"' + st + '/>' +
      (face === 'sleep' ? '<path d="M4 6 Q12 12 20 6" fill="none" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/>' : face === 'love' ? '<path d="M12 0 c-7 -9 -18 0 0 13 c18 -13 7 -22 0 -13z" fill="#ff5ca8"' + st.replace('4"', '2.5"') + '/>' : '<ellipse cx="12" cy="4" rx="7" ry="8" fill="' + INK + '"/><circle cx="14.5" cy="1" r="2.6" fill="#fff"/><path d="M4 -6 Q12 -12 20 -6" fill="none" stroke="' + INK + '" stroke-width="2.5" stroke-linecap="round"/>') +
      (face === 'neigh' ? '<path d="M46 56 Q56 70 70 60" fill="#ff8fc4"' + st + '/>' : '<path d="M48 58 Q58 62 66 58" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/>') +
      '<ellipse cx="4" cy="22" rx="7" ry="4.5" fill="#ff8fc4" opacity=".6"/>' +
      /* רסן: רצועה מעל הלחי ורצועת אף סביב החוטם בלבד */
      '<path d="M2 -14 L40 34 M42 30 Q54 60 78 42" fill="none" stroke="' + saddle + '" stroke-width="5" stroke-linecap="round"/><circle cx="41" cy="32" r="4" fill="#c9d2de"' + st.replace('4"', '2"') + '/>' +
      (acc.indexOf('crown') >= 0 ? '<path d="M-12 -30 L-12 -48 L-4 -38 L4 -52 L12 -38 L20 -48 L20 -30 Z" fill="#ffc93c"' + st + '/>' : '') +
      (acc.indexOf('flowers') >= 0 ? '<circle cx="-10" cy="-26" r="7" fill="#ff5ca8"' + st + '/><circle cx="4" cy="-32" r="7" fill="#ffd93c"' + st + '/><circle cx="18" cy="-26" r="7" fill="#9b5cff"' + st + '/>' : '') +
      (acc.indexOf('plume') >= 0 ? '<path d="M-6 -28 Q-34 -74 4 -84 Q-12 -54 2 -30 Z" fill="#3fe0c5"' + st + '/>' : '') +
      (acc.indexOf('wings') >= 0 ? '<path d="M14 -26 L30 -76 L28 -22 Z" fill="#ffd93c"' + st + '/>' : '') +
      (acc.indexOf('bandana') >= 0 ? '<path d="M-20 20 Q6 42 30 36 L6 62 Z" fill="#ff3b3b"' + st + '/>' : '') +
      '</g>';
    if (o.wet) [[150, 120], [230, 110], [180, 90], [120, 170], [270, 140]].forEach(function (d) { s += '<path d="M' + d[0] + ' ' + d[1] + ' q6 10 0 14 q-6 -4 0 -14z" fill="#9fe0ff"' + st.replace('4', '2') + '/>'; });
    return s + '</svg>';
  }

  /* ================= פרק 5 — צבעים ל-POV ================= */
  function povColors() {
    var m = find(MANES, H.mane)[1];
    return { coat: find(COATS, H.coat)[1], dark: mix(find(COATS, H.coat)[1], -.25), mane: m === 'rainbow' ? '#ff5ca8' : m, rainbow: m === 'rainbow', rein: find(SADDLES, H.saddle)[1], acc: H.acc || [] };
  }

  window.Horse = { state: H, save: save, needs: needs, bump: bump, setNeed: setNeed, afterRide: afterRide, mood: mood, MOOD_HE: MOOD_HE, svg: svg, povColors: povColors,
    COATS: COATS, MANES: MANES, SADDLES: SADDLES, ACCS: ACCS, find: find, BOY: BOY, INK: INK };
})();
