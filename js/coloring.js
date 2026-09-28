/* =====================================================================
   js/coloring.js — סטודיו הציור של הגיבורה (DOM + SVG + Canvas, בלי Phaser)
   ---------------------------------------------------------------------
   פרק 1  — הגדרות: 24 צבעים (+6 בשדרוג), סגנונות מילוי, מכחולים, מדבקות, רקעים, רעיונות
   פרק 2  — מצב ושמירה: ella-art-v1 (מצב אחרון), ella-art-work-v1 (צביעה בתהליך לכל דף)
   פרק 3  — עזרים: DOM, קול, הודעה קופצת, צבעים, אקראי קבוע, שכבת נצנצים
   פרק 4  — דפים: ספריית ArtPages + דמויות המשחק + צוות הגיבורים → דף צביעה
   פרק 5  — מצב צביעה: הקשה צובעת אזור בצבע ובסגנון (רגיל/מעבר/נצנצים/נקודות/פסים/לבבות)
   פרק 6  — מצב צבע-לפי-מספר: מספור אזורים, פלטה ממוספרת, בדיקה עדינה וחגיגה
   פרק 7  — מצב חבר-את-הנקודות: 1-2-3 / א-ב-ג / A-B-C, קו שגדל, חשיפת הציור
   פרק 8  — מצב ציור חופשי: 9 מכחולים, 3 גדלים, מראה, מדבקות, 8 רקעים, קווי דף מעל
   פרק 9  — סרגלים: פלטה (שמאל) וכלים (ימין) לפי המצב
   פרק 10 — ביטול / ניקוי / רעיון
   פרק 11 — שמירה לגלריה + פרסים; גלריה: צפייה, המשך צביעה, מחיקה
   פרק 12 — חלון בחירת דף, החלפת מצב ואתחול
   תלויות: js/art-pages.js, shared/hero-avatar.js, shared/hero-rewards.js, shared/progress.js,
           shared/wallet.js, js/audio.js, shared/kids-ui.js
   ===================================================================== */
(function () {
  'use strict';

  /* ================= פרק 1 — הגדרות ================= */
  /* 24 צבעים עם שמות — השם מוקרא כשבוחרים צבע */
  var COLORS = [
    ['#ff5ca8', 'ורוד'], ['#ff2e93', 'פוקסיה'], ['#ff3b3b', 'אדום'], ['#b0183d', 'בורדו'],
    ['#ff8a3c', 'כתום'], ['#ffc49b', 'אפרסק'], ['#ffd93c', 'צהוב'], ['#fff27a', 'לימון'],
    ['#8ee07a', 'ירוק בהיר'], ['#2fb85a', 'ירוק'], ['#1e7a44', 'ירוק יער'], ['#3fe0c5', 'טורקיז'],
    ['#9fe0ff', 'תכלת'], ['#3d7bff', 'כחול'], ['#1f3a93', 'כחול לילה'], ['#9b5cff', 'סגול'],
    ['#d3b5ff', 'לילך'], ['#9c6b3f', 'חום'], ['#e8c9a0', 'בז׳'], ['#9aa0ab', 'אפור'],
    ['#1b1036', 'שחור'], ['#ffffff', 'לבן'], ['#f2b61c', 'זהב'], ['#c9d2de', 'כסף']
  ];
  /* שדרוג "עוד צבעים" מעגלת השדרוגים — 6 צבעי ניאון ופסטל מיוחדים */
  if (typeof Wallet !== 'undefined' && Wallet.lvl('brushes') > 0) {
    COLORS.push(['#ff00c8', 'ניאון ורוד'], ['#00ffa3', 'ניאון ירוק'], ['#00d5ff', 'ניאון כחול'], ['#fffb00', 'ניאון צהוב'], ['#ffb3de', 'פסטל ורוד'], ['#b3f0ff', 'פסטל תכלת']);
  }
  /* סגנונות מילוי במצב צביעה */
  var FILLS = [['solid', 'רגיל'], ['grad', 'מעבר קסום'], ['glitter', 'נצנצים'], ['dots', 'נקודות'], ['stripes', 'פסים'], ['hearts', 'לבבות']];
  /* מכחולים במצב ציור חופשי */
  var BRUSHES = [['pencil', '✏️', 'עיפרון'], ['marker', '🖊️', 'טוש'], ['crayon', '🖍️', 'צבע שעווה'], ['spray', '💨', 'ספריי'], ['rainbow', '🌈', 'קשת'],
                 ['glitter', '✨', 'נצנצים'], ['neon', '💡', 'ניאון'], ['stamp', '⭐', 'מדבקות'], ['eraser', '🧽', 'מחק']];
  var SIZES = [7, 16, 30];                  // עובי מכחול: קטן / בינוני / גדול
  var STAMP_SIZES = [44, 72, 110];          // גודל מדבקה לפי אותו בורר
  var STICKERS = ['⭐', '🌟', '💖', '🦄', '🌈', '🦋', '🌸', '🌻', '🍓', '🍭', '🧁', '🎈', '🎀', '👑', '💎', '🐱', '🐶', '🐰', '🐼', '🦊',
                  '🐸', '🐙', '🐠', '🐬', '🦕', '🚀', '🪐', '🌙', '☀️', '☁️', '⚡', '🔥', '❄️', '🍀', '🌳', '🏠', '🚗', '🎵', '🦸‍♀️', '✨'];
  var BGS = [['plain', 'לבן'], ['lines', 'מחברת'], ['grid', 'משבצות'], ['meadow', 'אחו'], ['sea', 'ים'], ['night', 'לילה'], ['space', 'חלל'], ['rainbow', 'קשת']];
  /* רעיונות לציור חופשי (כפתור 💡) — מעודדים דמיון */
  var PROMPTS = ['ציירי חתול עם כתר 👑🐱', 'ציירי בית על עץ 🌳🏠', 'ציירי דג שעף בשמיים 🐟☁️', 'ציירי את המשפחה שלך 👨‍👩‍👧', 'ציירי רובוט שאוהב פרחים 🤖🌸',
                 'ציירי ארמון של ממתקים 🍭🏰', 'ציירי חד-קרן על קשת 🦄🌈', 'ציירי את אלה עפה מעל העיר 🦸‍♀️', 'ציירי מפלצת חמודה 👾', 'ציירי גן חיות בחלל 🚀🦁',
                 'ציירי את המאכל שהכי טעים לך 🍕', 'ציירי אי עם אוצר 💎', 'ציירי פרצוף מצחיק 😜', 'ציירי דינוזאור ביום הולדת 🦖🎂', 'ציירי מכונית שנוסעת על ענן 🚗☁️', 'ציירי פרפר ענק 🦋'];
  /* שמות אותיות — כדי שהקול יקריא "אָלֶף" ולא רק את הסימן */
  var HE_LETTERS = 'אבגדהוזחטיכלמנסעפצקרשת'.split('');
  var HE_NAMES = ['אָלֶף', 'בֵּית', 'גִּימֶל', 'דָּלֶת', 'הֵא', 'וָו', 'זַיִן', 'חֵית', 'טֵית', 'יוּד', 'כַּף', 'לָמֶד', 'מֵם', 'נוּן', 'סָמֶךְ', 'עַיִן', 'פֵּא', 'צָדִי', 'קוּף', 'רֵישׁ', 'שִׁין', 'תָּו'];
  var MODE_NAMES = { color: 'צביעה', draw: 'ציור חופשי', cbn: 'צבע לפי מספר', dots: 'חבר את הנקודות' };
  var INK = '#1b1036';

  /* ================= פרק 2 — מצב ושמירה ================= */
  var KEY = 'ella-art-v1', WORK_KEY = 'ella-art-work-v1', GALLERY_KEY = 'ella-coloring-gallery', MAX_GALLERY = 18;
  function readJSON(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function writeJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  /* S — ההעדפות האחרונות: מצב, דף, מכחול, גודל, רקע, סגנון מילוי, צבע */
  var S = Object.assign({ mode: 'color', page: 'hero:1', dot: 'd_star', brush: 'marker', size: 1, bg: 'plain', fill: 'solid', color: 0,
                          dotStyle: 'num', line: false, mirror: false, sticker: '⭐', hue: 0 }, readJSON(KEY) || {});
  if (S.color >= COLORS.length) S.color = 0;
  function saveState() { writeJSON(KEY, S); }
  /* work — צביעה בתהליך: { מפתח-דף: { אינדקס-אזור: "סגנון|צבע" } } — חוזרים לדף ומוצאים את העבודה */
  var work = readJSON(WORK_KEY) || {};
  var workTimer = null;
  function saveWork() {
    clearTimeout(workTimer);
    workTimer = setTimeout(function () {
      var keys = Object.keys(work); while (keys.length > 40) delete work[keys.shift()];   // שומרים עד 40 דפים
      writeJSON(WORK_KEY, work);
    }, 350);
  }

  /* ================= פרק 3 — עזרים ================= */
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function svgEl(tag, attrs) { var e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function say(t) { try { if (window.Voice) Voice.say(t, { interrupt: true }); } catch (e) {} }
  function sayEn(t) { try { if (window.Voice) Voice.read([{ text: t, lang: 'en-US' }], { interrupt: true }); } catch (e) {} }
  function snd(n) { try { if (window.Sound && Sound[n]) Sound[n](); } catch (e) {} }
  function tap(p) { try { KidsUI.KidsAudio.tap(p); } catch (e) {} }
  function track(evt, n) { try { if (window.Progress) Progress.track(evt, n); } catch (e) {} }
  function award(n, origin, word) { try { if (window.HeroRewards) HeroRewards.award(n, origin || $('stage'), { word: word }); } catch (e) {} }
  function confetti() { try { if (window.HeroRewards) HeroRewards.confetti(); } catch (e) {} }
  /* toast — הודעה קופצת קצרה במרכז המסך */
  function toast(t) { var d = el('div', 'toast', t); document.body.appendChild(d); setTimeout(function () { d.remove(); }, 1900); }
  /* mix — ערבוב צבע hex עם לבן (t>0) או שחור (t<0) */
  function mix(hex, t) {
    var h = hex.replace('#', ''); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var c = [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); });
    var to = t > 0 ? 255 : 0, a = Math.abs(t);
    return '#' + c.map(function (v) { return ('0' + Math.round(v + (to - v) * a).toString(16)).slice(-2); }).join('');
  }
  /* בהירות צבע (לזיהוי פרטים כהים שלא צובעים בדמויות) */
  function luminance(hex) {
    if (!hex || hex[0] !== '#') return -1;
    var h = hex.length === 4 ? '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3] : hex;
    return 0.2126 * parseInt(h.slice(1, 3), 16) + 0.7152 * parseInt(h.slice(3, 5), 16) + 0.0722 * parseInt(h.slice(5, 7), 16);
  }
  /* rng — מחולל אקראי קבוע (mulberry32): אותה משיכה נראית זהה גם אחרי ביטול וציור מחדש */
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  var stage = $('stage'), holder = $('svgHolder'), lineArt = $('lineArt'), idea = $('idea');
  var bgCanvas = $('bgCanvas'), drawCanvas = $('drawCanvas'), fxCanvas = $('fxCanvas');
  var bctx = bgCanvas.getContext('2d'), dctx = drawCanvas.getContext('2d'), fctx = fxCanvas.getContext('2d');
  var W = 0, H = 0, DPR = 1;

  /* stagePos — מיקום האצבע ביחס לבמה */
  function stagePos(e) { var r = stage.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }

  /* שכבת נצנצים: חלקיקים שנפלטים בכל צביעה/משיכה (קנבס עליון, לא נשמר) */
  var parts = [];
  function sparkle(x, y, color, n) {
    for (var i = 0; i < (n || 8); i++) {
      if (parts.length > 260) parts.shift();
      var a = Math.random() * Math.PI * 2, sp = 40 + Math.random() * 160;
      parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, life: 1, decay: 1.6 + Math.random() * 1.4, r: 2 + Math.random() * 4, color: color || '#fff' });
    }
  }
  var lastT = performance.now(), fxDirty = false;
  (function fxLoop(t) {
    var dt = Math.min(0.05, (t - lastT) / 1000); lastT = t;
    if (parts.length || fxDirty) {
      fctx.clearRect(0, 0, W, H); fxDirty = parts.length > 0;
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i]; p.life -= p.decay * dt;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 220 * dt;
        fctx.globalAlpha = Math.max(0, p.life); fctx.fillStyle = p.color;
        fctx.beginPath(); fctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2); fctx.fill();
      }
      fctx.globalAlpha = 1;
    }
    requestAnimationFrame(fxLoop);
  })(lastT);
  function burst(n) { for (var i = 0; i < (n || 40); i++) sparkle(W / 2 + (Math.random() - .5) * W * .6, H / 2 + (Math.random() - .5) * H * .5, COLORS[i % COLORS.length][0], 2); }

  /* sizeCanvases — קנבסים בגודל הבמה (תקרת רזולוציה 1.5 — חוסך זיכרון באייפד) */
  function sizeCanvases() {
    var r = stage.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    [bgCanvas, drawCanvas, fxCanvas].forEach(function (cv) { cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); });
    [bctx, dctx, fctx].forEach(function (c) { c.setTransform(DPR, 0, 0, DPR, 0, 0); });
    drawBg(bctx, S.bg, W, H); replay();
  }
  window.addEventListener('resize', function () { setTimeout(sizeCanvases, 150); });

  /* ================= פרק 4 — דפים ================= */
  /* דפי הגיבורה: תחפושות שונות של אלה */
  var HERO_PAGES = {
    'hero:1': { cape: 'cape_pink', suit: 'suit_magenta', mask: 'mask_classic', emblem: 'emb_heart', aura: 'aura_none', acc: 'acc_crown' },
    'hero:2': { cape: 'cape_hearts', suit: 'suit_sun', mask: 'mask_cat', emblem: 'emb_star', aura: 'aura_wings', acc: 'acc_none' },
    'hero:3': { cape: 'cape_sky', suit: 'suit_cyan', mask: 'mask_butterfly', emblem: 'emb_flower', aura: 'aura_bubbles', acc: 'acc_bow' }
  };
  var CHAR_NAMES = { 'hero:1': 'אלה הגיבורה', 'hero:2': 'אלה החתולה', 'hero:3': 'אלה הפרפר', ella: 'אלה', cust_girl: 'ילדה', cust_boy: 'ילד', cust_bunny: 'ארנבת', cust_bear: 'דובי',
                     cust_cat: 'חתולה', cust_panda: 'פנדה', cust_penguin: 'פינגווין', cust_dog: 'כלבלב', cust_fox: 'שועל', cust_frog: 'צפרדע', cust_mouse: 'עכבר', cust_pig: 'חזרזיר',
                     food_burger: 'המבורגר', food_pizza: 'פיצה', food_donut: 'דונאט', food_shake: 'מילקשייק', food_pancake: 'פנקייק' };
  /* חברי צוות הגיבורים (אם מוגדרים ב-HeroAvatar) נכנסים גם הם כדפי צביעה */
  function charKeys() {
    var keys = ['hero:1', 'hero:2', 'hero:3'];
    if (window.HeroAvatar && HeroAvatar.HEROES) HeroAvatar.HEROES.slice(1).forEach(function (h) { keys.push('team:' + h.id); CHAR_NAMES['team:' + h.id] = h.name; });
    return keys.concat(Object.keys(CHAR_NAMES).filter(function (k) { return k.indexOf(':') < 0; }));
  }
  var artById = {};
  ArtPages.PAGES.forEach(function (p) { artById[p.id] = p; });
  var PACK_ICO = {}; ArtPages.PACKS.forEach(function (p) { PACK_ICO[p[0]] = p[2]; }); PACK_ICO.chars = '🦸‍♀️';
  /* pageInfo — מידע על דף לפי מפתח: ספרייה (art) או דמות (char) */
  function pageInfo(key) {
    if (artById[key]) return { key: key, kind: 'art', pg: artById[key], name: artById[key].name, pack: artById[key].pack };
    if (!CHAR_NAMES[key]) charKeys();
    return { key: key, kind: 'char', name: CHAR_NAMES[key] || 'דמות', pack: 'chars' };
  }
  /* charOutfit — תחפושת לדף דמות גיבורה */
  function charOutfit(key) {
    if (HERO_PAGES[key]) return HERO_PAGES[key];
    if (key.indexOf('team:') === 0) return Object.assign(HeroAvatar.defaultOutfit(), { hero: key.slice(5) });
    return null;
  }
  var svgCache = {};
  /* rawSvg — טקסט ה-SVG המקורי (בצבע) של דף; cb(text) */
  function rawSvg(info, cb) {
    if (info.kind === 'art') { cb(ArtPages.svg(info.pg)); return; }
    var outfit = charOutfit(info.key);
    if (outfit) { cb(window.HeroAvatar ? HeroAvatar.svg(outfit) : ''); return; }
    if (svgCache[info.key]) { cb(svgCache[info.key]); return; }
    fetch('assets/art/' + info.key + '.svg').then(function (r) { return r.text(); })
      .then(function (t) { svgCache[info.key] = t; cb(t); }).catch(function () { cb(''); });
  }
  /* toColoring — הופך דמות צבעונית לדף צביעה: אזורים בהירים → לבן עם קו דיו,
     פרטים כהים (עיניים) נשארים, ידיים שמצוירות כקו עבה → הקו עצמו צביע */
  function toColoring(svg) {
    var i = 0;
    svg.querySelectorAll('path,circle,ellipse,rect,polygon').forEach(function (e) {
      var fill = e.getAttribute('fill'), sw = parseFloat(e.getAttribute('stroke-width') || '0'), st = e.getAttribute('stroke');
      if (fill === 'none' && sw >= 12 && st && st !== INK && st !== '#5a3d5c') {
        e.dataset.o = st; e.setAttribute('stroke', '#ffffff'); e.classList.add('colorable'); e.dataset.stroke = '1'; e.dataset.i = i++; return;
      }
      if (fill === 'none') return;
      var lum = luminance(fill || '#000000');
      if (lum >= 0 && lum < 90) return;
      e.dataset.o = fill || ''; e.dataset.i = i++;
      e.setAttribute('fill', '#ffffff'); e.setAttribute('stroke', INK); e.setAttribute('stroke-width', '2.5');
      e.classList.add('colorable');
    });
  }
  /* coloredSvg — גרסה צבועה של דף (לתמונות ממוזערות ול"רעיון"); cb(text) */
  function coloredSvg(info, cb) {
    if (info.kind !== 'art') { rawSvg(info, cb); return; }
    cb(ArtPages.svg(info.pg).replace(/fill="#ffffff"([^>]*?)data-c="([^"]+)"/g, 'fill="$2"$1data-c="$2"'));
  }

  /* ================= פרק 5 — מצב צביעה ================= */
  var curSvg = null, curInfo = null, undo = [], finished = false, loadToken = 0;
  /* loadPage — טוען דף לבמה (צביעה או צבע-לפי-מספר) */
  function loadPage(key, silent) {
    var info = pageInfo(key), token = ++loadToken;
    curInfo = info; S.page = key; saveState(); undo = []; finished = false; showIdea(false);
    setChip(PACK_ICO[info.pack] || '🎨', info.name);
    rawSvg(info, function (text) {
      if (token !== loadToken) return;          // בינתיים נבחר דף אחר
      holder.innerHTML = text;
      curSvg = holder.querySelector('svg');
      if (!curSvg) return;
      if (info.kind === 'char') toColoring(curSvg);
      if (S.mode === 'cbn') setupCbn(); else restoreWork();
      if (!silent) speakPage(info);
    });
  }
  /* speakPage — מקריא את שם הדף (דפי אותיות באנגלית — בקול אנגלי) */
  function speakPage(info) {
    if (info.pg && info.pg.ltr) { sayEn(info.pg.letter[0] + '. ' + info.pg.word); return; }
    if (info.pg && info.pg.word) { say(info.pg.name + ' — ' + info.pg.word); return; }
    say(info.name);
  }
  /* defFor — יוצר (פעם אחת) דוגמת מילוי ב-<defs> של הדף ומחזיר את המזהה */
  function defFor(style, c) {
    var id = 'f-' + style + '-' + c.slice(1);
    if (curSvg.querySelector('#' + id)) return id;
    var defs = curSvg.querySelector('defs') || curSvg.insertBefore(svgEl('defs', {}), curSvg.firstChild);
    var L = mix(c, .55), P = function (w, h, inner, extra) { return '<pattern id="' + id + '" patternUnits="userSpaceOnUse" width="' + w + '" height="' + h + '"' + (extra || '') + '><rect width="' + w + '" height="' + h + '" fill="' + c + '"/>' + inner + '</pattern>'; };
    var html = '';
    if (style === 'grad') html = '<radialGradient id="' + id + '" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="' + mix(c, .75) + '"/><stop offset=".55" stop-color="' + c + '"/><stop offset="1" stop-color="' + mix(c, -.28) + '"/></radialGradient>';
    else if (style === 'glitter') html = P(26, 26, '<circle cx="4" cy="5" r="1.6" fill="#fff"/><circle cx="15" cy="3" r="1.2" fill="#fff3b0"/><circle cx="10" cy="14" r="1.8" fill="#fff" opacity=".8"/><circle cx="21" cy="18" r="1.3" fill="#ffe0f0"/><circle cx="4" cy="21" r="1" fill="#fff"/><path d="M19 8 l1 2.2 2.2 1 -2.2 1 -1 2.2 -1 -2.2 -2.2 -1 2.2 -1z" fill="#fff"/>');
    else if (style === 'dots') html = P(22, 22, '<circle cx="11" cy="11" r="4.2" fill="' + L + '"/>');
    else if (style === 'stripes') html = P(18, 18, '<rect width="7" height="18" fill="' + L + '"/>', ' patternTransform="rotate(40)"');
    else if (style === 'hearts') html = P(30, 30, '<path d="M15 21 C6 14 8 7 12.5 8.5 C14 9 15 10.5 15 10.5 C15 10.5 16 9 17.5 8.5 C22 7 24 14 15 21Z" fill="' + L + '"/>');
    defs.insertAdjacentHTML('beforeend', html);
    return id;
  }
  /* applyFill — צובע אזור (בלי רישום לביטול) */
  function applyFill(e, style, c) {
    if (e.dataset.stroke) { e.setAttribute('stroke', c); e.dataset.w = 'solid|' + c; return; }
    e.setAttribute('fill', style === 'solid' ? c : 'url(#' + defFor(style, c) + ')');
    e.dataset.w = style + '|' + c;
  }
  /* paint — צביעה עם רישום לביטול ולשמירת העבודה */
  function paint(e, style, c) {
    undo.push({ t: 'fill', e: e, attr: e.dataset.stroke ? 'stroke' : 'fill', prev: e.getAttribute(e.dataset.stroke ? 'stroke' : 'fill'), w: e.dataset.w || '' });
    applyFill(e, style, c);
    if (S.mode === 'color' && curInfo) { var m = work[curInfo.key] || (work[curInfo.key] = {}); m[e.dataset.i] = e.dataset.w; saveWork(); }
  }
  /* restoreWork — מחזיר צביעה שנשמרה לדף הזה */
  function restoreWork() {
    var m = curInfo && work[curInfo.key]; if (!m || !curSvg) return;
    curSvg.querySelectorAll('.colorable').forEach(function (e) { var w = m[e.dataset.i]; if (w) { var p = w.split('|'); applyFill(e, p[0], p[1]); } });
  }
  /* checkFinished — כל האזורים צבועים? חגיגה פעם אחת לכל טעינה */
  function checkFinished() {
    if (finished || !curSvg) return;
    var all = curSvg.querySelectorAll('.colorable'); if (!all.length) return;
    for (var i = 0; i < all.length; i++) { var w = all[i].dataset.w; if (!w || /\|#ffffff$/i.test(w)) return; }
    finished = true;
    setTimeout(function () { toast('סיימת את הדף! איזה יופי ⭐'); say('סיימת את הדף! איזה יופי!'); confetti(); award(1, $('btnSave'), 'יפה!'); }, 300);
  }
  /* הקשה על אזור בבמה — לפי המצב */
  holder.addEventListener('pointerdown', function (ev) {
    var t = ev.target.closest && ev.target.closest('.colorable');
    if (!t || (S.mode === 'dots' && (!dots || !dots.done))) return;
    ev.preventDefault();
    var p = stagePos(ev), c = COLORS[S.color][0];
    if (S.mode === 'cbn') { cbnTap(t, p); return; }
    paint(t, t.classList.contains('dot-shape') ? 'solid' : S.fill, c);
    sparkle(p.x, p.y, c, 14); snd('bubble');
    if (S.mode === 'color') checkFinished();
  });

  /* ================= פרק 6 — צבע לפי מספר ================= */
  var cbn = null;   // { colors:[], left, sel, need: Map(אזור→מספר) }
  /* visiblePoint — מקום למספר בתוך האזור: נקודה שרואים אותה (לא מוסתרת ע"י אזור אחר) ושיש סביבה מרווח
     בגודל הספרה — כדי שהמספר לא ייפול על קו. אם אין מקום — מקטינים את הספרה. מחזיר [x, y, גודל] */
  function visiblePoint(e, fs) {
    var bb = e.getBBox(), m = e.getScreenCTM(); if (!m || !bb.width) return null;
    var cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2, pts = [];
    for (var i = 1; i < 10; i++) for (var j = 1; j < 10; j++) pts.push([bb.x + bb.width * i / 10, bb.y + bb.height * j / 10]);
    pts.sort(function (a, b) { return Math.hypot(a[0] - cx, a[1] - cy) - Math.hypot(b[0] - cx, b[1] - cy); });
    function hit(x, y) { return document.elementFromPoint(m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f) === e; }
    var seen = pts.filter(function (p) { return hit(p[0], p[1]); });
    for (var size = fs; size >= 10; size *= .75) {
      var r = size * .6;
      for (var k = 0; k < seen.length; k++) { var p = seen[k]; if (hit(p[0] - r, p[1]) && hit(p[0] + r, p[1]) && hit(p[0], p[1] - r) && hit(p[0], p[1] + r)) return [p[0], p[1], size]; }
    }
    if (seen.length) return [seen[0][0], seen[0][1], 11];
    return e.tagName === 'text' ? [cx, cy, fs] : null;
  }
  /* setupCbn — ממספר את האזורים לפי הצבע המומלץ (לבן = כבר גמור, בלי מספר) */
  function setupCbn() {
    var shapes = Array.prototype.slice.call(curSvg.querySelectorAll('.colorable'));
    cbn = { colors: [], left: 0, sel: 1, need: new Map() };
    shapes.forEach(function (s) { var c = (s.dataset.c || '').toLowerCase(); if (c && c !== '#ffffff' && cbn.colors.indexOf(c) < 0) cbn.colors.push(c); });
    var labels = [];
    shapes.forEach(function (s) {
      var c = (s.dataset.c || '').toLowerCase(); if (!c || c === '#ffffff') return;
      var bb = s.getBBox(), p = visiblePoint(s, Math.max(13, Math.min(30, Math.min(bb.width, bb.height) * .45))); if (!p) return;
      var n = cbn.colors.indexOf(c) + 1, fs = p[2];
      var t = svgEl('text', { x: p[0], y: p[1] + fs * .36, 'font-size': fs, 'text-anchor': 'middle', 'class': 'cbn-num' }); t.textContent = n;
      labels.push(t); s._lbl = t; cbn.need.set(s, n); cbn.left++;
    });
    var g = svgEl('g', { 'class': 'cbn-layer' }); labels.forEach(function (t) { g.appendChild(t); }); curSvg.appendChild(g);
    buildPalette(); buildTools();
  }
  /* cbnTap — הקשה על אזור: המספר הנכון → נצבע; אחר → רמז עדין (בלי עונש) */
  function cbnTap(s, p) {
    var n = cbn && cbn.need.get(s); if (!n || s.dataset.w) return;
    if (n === cbn.sel) {
      undo.push({ t: 'cbn', e: s });
      applyFill(s, 'solid', cbn.colors[n - 1]); s._lbl.classList.add('gone'); cbn.left--;
      sparkle(p.x, p.y, cbn.colors[n - 1], 14); snd('bubble');
      refreshCbn();
      if (!cbn.left) cbnDone();
    } else {
      s.classList.add('cbn-glow'); setTimeout(function () { s.classList.remove('cbn-glow'); }, 900);
      var sw = document.querySelector('.sw[data-n="' + n + '"]'); if (sw) { sw.classList.remove('nudge'); void sw.offsetWidth; sw.classList.add('nudge'); }
      tap(300); say('כאן צריך את מספר ' + n);
    }
  }
  /* refreshCbn — מסמן מספרים שהסתיימו ומעדכן את מונה ההתקדמות */
  function refreshCbn() {
    var leftBy = {}; cbn.need.forEach(function (n, s) { if (!s.dataset.w) leftBy[n] = (leftBy[n] || 0) + 1; });
    document.querySelectorAll('.sw[data-n]').forEach(function (b) { b.classList.toggle('done', !leftBy[b.dataset.n]); });
    var pr = $('cbnLeft'); if (pr) pr.innerHTML = cbn.left + '<small>אזורים נשארו</small>';
    /* המספר הנבחר נגמר? עוברים אוטומטית למספר הבא שנשאר */
    if (!leftBy[cbn.sel] && cbn.left) { for (var k = 1; k <= cbn.colors.length; k++) if (leftBy[k]) { selectNum(k, true); break; } }
  }
  function selectNum(n, quiet) {
    cbn.sel = n;
    document.querySelectorAll('.sw[data-n]').forEach(function (b) { b.classList.toggle('on', +b.dataset.n === n); });
    if (!quiet) { tap(480 + n * 40); say('מספר ' + n); }
  }
  function cbnDone() {
    setTimeout(function () {
      toast('ציור מושלם! 🎉'); say('וואו! ציור מושלם! כל הכבוד!'); confetti(); burst(60);
      award(2, $('stage'), 'מושלם!'); if (typeof Wallet !== 'undefined') Wallet.add(3); track('art:cbn');
    }, 350);
  }

  /* ================= פרק 7 — חבר את הנקודות ================= */
  var dots = null;   // { pic, i (האחרונה שחוברה), line, done }
  /* labelFor — התווית של נקודה לפי הסגנון שנבחר (מספרים / אותיות עבריות / אנגליות) */
  function labelFor(i, n) {
    if (S.dotStyle === 'he' && n <= 22) return HE_LETTERS[i];
    if (S.dotStyle === 'en' && n <= 26) return String.fromCharCode(65 + i);
    return String(i + 1);
  }
  function speakLabel(i, n) {
    if (S.dotStyle === 'he' && n <= 22) say(HE_NAMES[i]);
    else if (S.dotStyle === 'en' && n <= 26) sayEn(String.fromCharCode(65 + i));
    else say(String(i + 1));
  }
  /* loadDots — בונה את ציור הנקודות: צורה נסתרת, קו, נקודות עם תוויות */
  function loadDots(id) {
    var pic = ArtPages.DOTS.filter(function (d) { return d.id === id; })[0] || ArtPages.DOTS[0];
    S.dot = pic.id; saveState(); undo = []; showIdea(false);
    var pts = pic.pts, n = pts.length, cx = 0, cy = 0;
    pts.forEach(function (p) { cx += p[0] / n; cy += p[1] / n; });
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">' +
      '<polygon class="dot-shape colorable" points="' + pts.map(function (p) { return p.join(','); }).join(' ') + '" fill="#ffffff" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round" opacity="0" data-i="0"/>' +
      '<polyline class="dot-line" points="' + pts[0].join(',') + '" fill="none" stroke="' + INK + '" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/><g class="dot-g">';
    pts.forEach(function (p, i) {
      var dx = p[0] - cx, dy = p[1] - cy, d = Math.hypot(dx, dy) || 1, lx = p[0] + dx / d * 24, ly = p[1] + dy / d * 24 + 6;
      s += '<circle class="dot-pt' + (i === 0 ? ' done' : i === 1 ? ' next' : '') + '" data-k="' + i + '" cx="' + p[0] + '" cy="' + p[1] + '" r="9"/>' +
           '<text class="dot-lbl" x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '" text-anchor="middle">' + labelFor(i, n) + '</text>';
    });
    s += '</g></svg>';
    holder.innerHTML = s; curSvg = holder.querySelector('svg'); curInfo = null;
    dots = { pic: pic, i: 0, line: curSvg.querySelector('.dot-line'), done: false };
    setChip('✨', 'מה מסתתר בנקודות?');
    buildTools();
    say('מחברים את הנקודות לפי הסדר. מתחילים מ' + (S.dotStyle === 'he' ? HE_NAMES[0] : S.dotStyle === 'en' ? 'A' : 'אחת'));
  }
  /* svgPoint — ממיר מיקום אצבע לקואורדינטות הציור (0–400) */
  function svgPoint(ev) { var m = curSvg.getScreenCTM(); if (!m) return null; var q = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(m.inverse()); return [q.x, q.y]; }
  /* tryConnect — אם האצבע ליד הנקודה הבאה — מחברים אותה */
  function tryConnect(ev, wrongFeedback) {
    if (!dots || dots.done) return;
    var q = svgPoint(ev); if (!q) return;
    var pts = dots.pic.pts, nx = pts[dots.i + 1];
    if (nx && Math.hypot(q[0] - nx[0], q[1] - nx[1]) < 30) { connect(); return; }
    if (!wrongFeedback) return;
    for (var k = dots.i + 2; k < pts.length; k++) if (Math.hypot(q[0] - pts[k][0], q[1] - pts[k][1]) < 22) {
      tap(260); var nd = curSvg.querySelector('.dot-pt.next'); if (nd) { nd.classList.remove('next'); void nd.getBBox(); nd.classList.add('next'); }
      say('מחפשים את ' + (S.dotStyle === 'he' ? HE_NAMES[dots.i + 1] : labelFor(dots.i + 1, pts.length))); return;
    }
  }
  /* connect — מחבר את הנקודה הבאה: הקו גדל, צליל עולה, הקראת התווית */
  function connect() {
    var pts = dots.pic.pts, n = pts.length; dots.i++;
    undo.push({ t: 'dot' });
    dots.line.setAttribute('points', pts.slice(0, dots.i + 1).map(function (p) { return p.join(','); }).join(' '));
    var cs = curSvg.querySelectorAll('.dot-pt');
    cs[dots.i].classList.remove('next'); cs[dots.i].classList.add('done'); if (cs[dots.i + 1]) cs[dots.i + 1].classList.add('next');
    var r = stage.getBoundingClientRect(), m = curSvg.getScreenCTM(), p = pts[dots.i];
    sparkle(m.a * p[0] + m.e - r.left, m.d * p[1] + m.f - r.top, '#ffc93c', 10);
    tap(420 + dots.i * 28); speakLabel(dots.i, n);
    if (dots.i === n - 1) dotsDone();
  }
  /* dotsDone — סוגרים את הקו, חושפים את הציור בצבע, והוא הופך לצביע */
  function dotsDone() {
    dots.done = true;
    var pts = dots.pic.pts;
    dots.line.setAttribute('points', pts.concat([pts[0]]).map(function (p) { return p.join(','); }).join(' '));
    var shape = curSvg.querySelector('.dot-shape');
    setTimeout(function () {
      shape.setAttribute('opacity', '1'); shape.setAttribute('fill', dots.pic.fill); shape.dataset.w = 'solid|' + dots.pic.fill;
      curSvg.querySelector('.dot-g').style.opacity = '.25'; dots.line.style.opacity = '0';
      setChip('✨', dots.pic.name + '!');
      toast('זה ' + dots.pic.name + '! 🎉'); say('וואו! זה ' + dots.pic.name + '! עכשיו אפשר לצבוע אותו'); confetti(); burst(40);
      award(1, stage, 'יש!'); track('art:dots'); buildTools();
    }, 450);
  }
  holder.addEventListener('pointerdown', function (ev) { if (S.mode === 'dots' && dots && !dots.done) { ev.preventDefault(); dotsDown = true; tryConnect(ev, true); } });
  var dotsDown = false;
  holder.addEventListener('pointermove', function (ev) { if (dotsDown && S.mode === 'dots') tryConnect(ev, false); });
  window.addEventListener('pointerup', function () { dotsDown = false; });

  /* ================= פרק 8 — ציור חופשי ================= */
  var strokes = [], cur = null, activeId = null, cleared = null;
  /* drawBg — מצייר רקע לציור (גם לתמונות הממוזערות בבורר) */
  function drawBg(c, type, w, h) {
    var R = rng(7), g, i;
    c.save(); c.clearRect(0, 0, w, h);
    c.fillStyle = '#fffaf0'; c.fillRect(0, 0, w, h);
    if (type === 'lines') {
      c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.strokeStyle = '#a9c8ff'; c.lineWidth = 1.5;
      for (var y = 44; y < h; y += 34) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
      c.strokeStyle = '#ff8fa3'; c.lineWidth = 2; c.beginPath(); c.moveTo(w - 50, 0); c.lineTo(w - 50, h); c.stroke();
    } else if (type === 'grid') {
      c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.strokeStyle = '#cfe0ff'; c.lineWidth = 1;
      for (var x = 0; x < w; x += 28) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
      for (y = 0; y < h; y += 28) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    } else if (type === 'meadow') {
      g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#8fd8ff'); g.addColorStop(.6, '#d9f4ff'); c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.fillStyle = '#ffd93c'; c.beginPath(); c.arc(w * .85, h * .16, Math.min(w, h) * .08, 0, 7); c.fill();
      c.fillStyle = '#7fd66b'; c.beginPath(); c.moveTo(0, h * .72); c.quadraticCurveTo(w * .3, h * .58, w * .6, h * .72); c.quadraticCurveTo(w * .85, h * .8, w, h * .68); c.lineTo(w, h); c.lineTo(0, h); c.fill();
      c.fillStyle = '#4fbf5a'; c.beginPath(); c.moveTo(0, h * .84); c.quadraticCurveTo(w * .5, h * .74, w, h * .86); c.lineTo(w, h); c.lineTo(0, h); c.fill();
      c.fillStyle = '#fff'; [[.2, .18], [.5, .1]].forEach(function (p) { c.beginPath(); c.arc(w * p[0], h * p[1], 22, 0, 7); c.arc(w * p[0] + 26, h * p[1] - 8, 26, 0, 7); c.arc(w * p[0] + 54, h * p[1], 20, 0, 7); c.fill(); });
    } else if (type === 'sea') {
      g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#5fd3ff'); g.addColorStop(1, '#1a5fd6'); c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 3;
      for (y = 40; y < h * .8; y += 60) { c.beginPath(); for (x = 0; x <= w; x += 20) c.lineTo(x, y + Math.sin(x / 30 + y) * 6); c.stroke(); }
      c.fillStyle = '#ffe7a8'; c.beginPath(); c.moveTo(0, h * .88); c.quadraticCurveTo(w * .5, h * .8, w, h * .9); c.lineTo(w, h); c.lineTo(0, h); c.fill();
      c.fillStyle = 'rgba(255,255,255,.55)'; for (i = 0; i < 18; i++) { c.beginPath(); c.arc(R() * w, R() * h * .8, 3 + R() * 7, 0, 7); c.fill(); }
    } else if (type === 'night' || type === 'space') {
      g = c.createLinearGradient(0, 0, 0, h);
      if (type === 'night') { g.addColorStop(0, '#0b1a4a'); g.addColorStop(1, '#3a1177'); } else { g.addColorStop(0, '#120327'); g.addColorStop(1, '#2b0a4f'); }
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      for (i = 0; i < 90; i++) { c.fillStyle = 'rgba(255,255,255,' + (.4 + R() * .6) + ')'; c.beginPath(); c.arc(R() * w, R() * h, R() * 1.8 + .4, 0, 7); c.fill(); }
      if (type === 'night') { c.fillStyle = '#fff3b0'; c.beginPath(); c.arc(w * .82, h * .18, Math.min(w, h) * .07, 0, 7); c.fill(); c.fillStyle = '#0f1e55'; c.beginPath(); c.arc(w * .84, h * .16, Math.min(w, h) * .06, 0, 7); c.fill();
        c.fillStyle = '#1a0f3d'; for (x = 0; x < w; x += 46) { var bh = 40 + R() * 90; c.fillRect(x, h - bh, 40, bh); } }
      else { c.fillStyle = '#ff7ec2'; c.beginPath(); c.arc(w * .18, h * .78, Math.min(w, h) * .12, 0, 7); c.fill(); c.strokeStyle = '#ffc93c'; c.lineWidth = 5; c.beginPath(); c.ellipse(w * .18, h * .78, Math.min(w, h) * .2, Math.min(w, h) * .05, -.3, 0, 7); c.stroke();
        c.fillStyle = '#29e0ff'; c.beginPath(); c.arc(w * .85, h * .2, Math.min(w, h) * .06, 0, 7); c.fill(); }
    } else if (type === 'rainbow') {
      c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
      ['#ff3b3b', '#ff8a3c', '#ffd93c', '#2fb85a', '#3d7bff', '#9b5cff'].forEach(function (col, k) { c.strokeStyle = col; c.globalAlpha = .35; c.lineWidth = Math.min(w, h) * .05; c.beginPath(); c.arc(w / 2, h * 1.05, Math.min(w, h) * (.78 - k * .05), Math.PI, 0); c.stroke(); });
      c.globalAlpha = 1;
    }
    c.restore();
  }
  /* seg — מצייר קטע אחד של משיכה לפי סוג המכחול */
  function seg(c, st, a, b, i) {
    var R = rng(st.seed * 997 + i), sz = st.s, col = st.c;
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    switch (st.b) {
      case 'pencil':
        c.globalAlpha = .9; c.strokeStyle = col; c.lineWidth = Math.max(2, sz * .32); line(c, a, b); break;
      case 'marker':
        c.strokeStyle = col; c.lineWidth = sz; line(c, a, b); break;
      case 'crayon': {
        c.fillStyle = col; var d = Math.hypot(b.x - a.x, b.y - a.y), n = Math.max(3, d * sz / 5);
        for (var k = 0; k < n; k++) { var t = R(), ox = (R() - .5) * sz, oy = (R() - .5) * sz; c.globalAlpha = .35 + R() * .45; c.fillRect(a.x + (b.x - a.x) * t + ox, a.y + (b.y - a.y) * t + oy, 1.5 + R() * 2.2, 1.5 + R() * 2.2); }
        break;
      }
      case 'spray': {
        c.fillStyle = col; var cnt = 10 + sz;
        for (var s2 = 0; s2 < cnt; s2++) { var ang = R() * 6.283, rr = Math.sqrt(R()) * sz * 1.4; c.globalAlpha = .55; c.fillRect(b.x + Math.cos(ang) * rr, b.y + Math.sin(ang) * rr, 1.6, 1.6); }
        break;
      }
      case 'rainbow': {
        var hue = (st.hue + i * 5) % 360;
        c.globalAlpha = .3; c.strokeStyle = 'hsl(' + hue + ',95%,72%)'; c.lineWidth = sz * 1.9; line(c, a, b);
        c.globalAlpha = 1; c.strokeStyle = 'hsl(' + hue + ',95%,58%)'; c.lineWidth = sz; line(c, a, b); break;
      }
      case 'glitter': {
        c.globalAlpha = .85; c.strokeStyle = col; c.lineWidth = sz * .7; line(c, a, b);
        var gl = ['#ffffff', '#fff3b0', '#ffd6ec', '#d9fbff'];
        for (var g2 = 0; g2 < 3; g2++) { c.globalAlpha = .9; c.fillStyle = gl[(R() * 4) | 0]; var gx = b.x + (R() - .5) * sz * 1.8, gy = b.y + (R() - .5) * sz * 1.8, gr = 1 + R() * sz * .12;
          c.beginPath(); c.moveTo(gx, gy - gr * 2.2); c.lineTo(gx + gr * .6, gy - gr * .6); c.lineTo(gx + gr * 2.2, gy); c.lineTo(gx + gr * .6, gy + gr * .6); c.lineTo(gx, gy + gr * 2.2); c.lineTo(gx - gr * .6, gy + gr * .6); c.lineTo(gx - gr * 2.2, gy); c.lineTo(gx - gr * .6, gy - gr * .6); c.fill(); }
        break;
      }
      case 'neon':
        c.globalAlpha = .22; c.strokeStyle = col; c.lineWidth = sz * 2.4; line(c, a, b);
        c.globalAlpha = .6; c.lineWidth = sz * 1.2; line(c, a, b);
        c.globalAlpha = 1; c.strokeStyle = mix(col, .75); c.lineWidth = Math.max(2, sz * .38); line(c, a, b); break;
      case 'eraser':
        c.globalCompositeOperation = 'destination-out'; c.strokeStyle = '#000'; c.lineWidth = sz * 1.7; line(c, a, b); break;
    }
    c.restore();
  }
  function line(c, a, b) { c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x + (a === b ? .01 : 0), b.y); c.stroke(); }
  /* stamp — מדבקת אימוג'י */
  function stamp(c, st) {
    c.save(); c.font = st.s + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(st.e, st.x, st.y); if (st.m) c.fillText(st.e, st.w - st.x, st.y); c.restore();
  }
  /* segMirror — קטע + השתקפות (מצב מראה 🪞: מה שמציירים בצד אחד מופיע גם בשני) */
  function segM(c, st, a, b, i) {
    seg(c, st, a, b, i);
    if (st.m) { var fa = { x: st.w - a.x, y: a.y }, fb = a === b ? fa : { x: st.w - b.x, y: b.y }; seg(c, st, fa, fb, i + 5000); }
  }
  /* replay — מצייר מחדש את כל המשיכות (אחרי ביטול / שינוי גודל) */
  function replay() {
    dctx.clearRect(0, 0, W, H);
    strokes.forEach(function (st) {
      if (st.b === 'stamp') { stamp(dctx, st); return; }
      var p = st.pts; segM(dctx, st, p[0], p[0], 0);
      for (var i = 1; i < p.length; i++) segM(dctx, st, p[i - 1], p[i], i);
    });
  }
  drawCanvas.addEventListener('pointerdown', function (e) {
    if (activeId !== null) return;              // אצבע אחת בכל פעם (כף יד לא מקלקלת)
    closePops(); activeId = e.pointerId; drawCanvas.setPointerCapture(e.pointerId);
    var p = stagePos(e);
    if (S.brush === 'stamp') {
      var st = { b: 'stamp', e: S.sticker, x: p.x, y: p.y, s: STAMP_SIZES[S.size], m: S.mirror, w: W };
      strokes.push(st); stamp(dctx, st); sparkle(p.x, p.y, '#ffc93c', 12); snd('pop'); cleared = null; return;
    }
    cur = { b: S.brush, c: COLORS[S.color][0], s: SIZES[S.size], m: S.mirror, w: W, seed: (Math.random() * 1e6) | 0, hue: S.hue, pts: [p] };
    strokes.push(cur); cleared = null;
    segM(dctx, cur, p, p, 0);
    if (S.brush !== 'eraser') snd('sparkle');
  });
  drawCanvas.addEventListener('pointermove', function (e) {
    if (!cur || e.pointerId !== activeId) return;
    var list = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];       // תנועה חלקה (עט / אצבע מהירה)
    for (var k = 0; k < list.length; k++) {
      var p = stagePos(list[k]), last = cur.pts[cur.pts.length - 1];
      if (Math.hypot(p.x - last.x, p.y - last.y) < 2.5) continue;
      cur.pts.push(p); segM(dctx, cur, last, p, cur.pts.length - 1);
    }
    var lp = cur.pts[cur.pts.length - 1];
    if (cur.b === 'glitter' || cur.b === 'rainbow' || cur.b === 'neon') sparkle(lp.x, lp.y, cur.b === 'rainbow' ? 'hsl(' + ((cur.hue + cur.pts.length * 5) % 360) + ',95%,70%)' : cur.c, 1);
  });
  ['pointerup', 'pointercancel'].forEach(function (evn) {
    drawCanvas.addEventListener(evn, function (e) {
      if (e.pointerId !== activeId) return;
      activeId = null;
      if (cur && cur.b === 'rainbow') { S.hue = (cur.hue + cur.pts.length * 5) % 360; saveState(); }
      cur = null;
    });
  });
  /* setLineArt — קווי דף הצביעה הנוכחי מעל הציור (אפשר לצבוע בחופשיות בתוך הקווים) */
  function setLineArt() {
    document.body.classList.toggle('line-on', !!S.line);
    if (!S.line) { lineArt.innerHTML = ''; return; }
    var info = pageInfo(artById[S.page] || CHAR_NAMES[S.page] ? S.page : 'cat');
    rawSvg(info, function (text) {
      lineArt.innerHTML = text; var s = lineArt.querySelector('svg'); if (!s) return;
      if (info.kind === 'char') toColoring(s);
      s.querySelectorAll('.colorable').forEach(function (e) { if (e.dataset.stroke) e.setAttribute('stroke', 'none'); else e.setAttribute('fill', 'none'); });
    });
  }

  /* ================= פרק 9 — סרגלים ================= */
  var pal = $('pal'), tools = $('tools');
  function setChip(ico, name) { document.querySelector('#pageChip .pc-ico').textContent = ico; $('pageName').textContent = name; }
  /* buildPalette — פלטה רגילה, או פלטה ממוספרת במצב צבע-לפי-מספר */
  function buildPalette() {
    pal.innerHTML = '';
    if (S.mode === 'cbn' && cbn) {
      cbn.colors.forEach(function (c, i) {
        var b = el('button', 'sw' + (i + 1 === cbn.sel ? ' on' : ''), String(i + 1)); b.type = 'button'; b.style.background = c; b.dataset.n = i + 1;
        b.addEventListener('pointerdown', function () { selectNum(i + 1); });
        pal.appendChild(b);
      });
      refreshCbn(); return;
    }
    COLORS.forEach(function (col, i) {
      var b = el('button', 'sw' + (i === S.color ? ' on' : '')); b.type = 'button'; b.style.background = col[0]; b.setAttribute('aria-label', col[1]);
      b.addEventListener('pointerdown', function () {
        S.color = i; saveState();
        pal.querySelectorAll('.sw').forEach(function (s) { s.classList.remove('on'); }); b.classList.add('on');
        tap(480 + (i % 12) * 35); say(col[1]);
        if (S.mode === 'color') buildTools();
      });
      pal.appendChild(b);
    });
  }
  /* toolBtn — כפתור כלי */
  function toolBtn(parent, html, on, fn, cls) {
    var b = el('button', 'tool' + (cls ? ' ' + cls : '') + (on ? ' on' : ''), html); b.type = 'button';
    b.addEventListener('pointerdown', function (e) { e.preventDefault(); fn(b); });
    parent.appendChild(b); return b;
  }
  function group(label) { var g = el('div', 'tgroup'); if (label) g.appendChild(el('div', 'tlabel', label)); tools.appendChild(g); return g; }
  /* fillPreview — דוגמה קטנה של סגנון המילוי בצבע הנוכחי (CSS) */
  function fillPreview(style, c) {
    var L = mix(c, .55);
    if (style === 'grad') return 'radial-gradient(circle at 35% 30%,' + mix(c, .75) + ',' + c + ' 55%,' + mix(c, -.28) + ')';
    if (style === 'glitter') return 'radial-gradient(circle,#fff 1.5px,transparent 2px) 0 0/9px 9px,radial-gradient(circle,#fff3b0 1px,transparent 1.6px) 4px 5px/9px 9px,' + c;
    if (style === 'dots') return 'radial-gradient(circle,' + L + ' 3px,transparent 3.5px) 0 0/12px 12px,' + c;
    if (style === 'stripes') return 'repeating-linear-gradient(40deg,' + L + ' 0 5px,' + c + ' 5px 11px)';
    if (style === 'hearts') return c;
    return c;
  }
  /* buildTools — לוח הכלים משתנה לפי המצב */
  function buildTools() {
    tools.innerHTML = '';
    var g;
    if (S.mode === 'color') {
      g = group('סגנון מילוי');
      FILLS.forEach(function (f) {
        var b = toolBtn(g, '<i style="background:' + fillPreview(f[0], COLORS[S.color][0]) + '"></i>' + (f[0] === 'hearts' ? '<b style="position:relative;color:#fff;font-size:20px;-webkit-text-stroke:1px #1b1036">♥</b>' : ''), S.fill === f[0], function () { S.fill = f[0]; saveState(); tap(600); say(f[1]); buildTools(); }, 'fs');
        b.setAttribute('aria-label', f[1]);
      });
      g = group('דפים');
      toolBtn(g, '📚 כל הדפים', false, function () { openPages(); }, 'wide');
      toolBtn(g, '🎲 דף הפתעה', false, surprise, 'wide');
    } else if (S.mode === 'draw') {
      g = group('מכחולים');
      BRUSHES.forEach(function (br) {
        var b = toolBtn(g, br[1], S.brush === br[0], function () {
          S.brush = br[0]; saveState(); tap(640); say(br[2]); buildTools();
          if (br[0] === 'stamp') openPop('stkPop'); else closePops();
        });
        b.setAttribute('aria-label', br[2]);
      });
      g = group('גודל');
      SIZES.forEach(function (sz, i) { toolBtn(g, '<span class="dot" style="width:' + (8 + i * 9) + 'px;height:' + (8 + i * 9) + 'px"></span>', S.size === i, function () { S.size = i; saveState(); tap(500 + i * 90); buildTools(); }); });
      g.appendChild(el('div'));
      g = group('קסמים');
      toolBtn(g, '🪞', S.mirror, function () { S.mirror = !S.mirror; saveState(); tap(700); say(S.mirror ? 'מראה קסם! מה שמציירים בצד אחד מופיע גם בשני' : 'בלי מראה'); buildTools(); }).setAttribute('aria-label', 'מראה');
      toolBtn(g, '🖼️', false, function () { openPop('bgPop'); }).setAttribute('aria-label', 'רקע');
      toolBtn(g, '📚 דף מתחת', S.line, function () { openPages(); }, 'wide');
    } else if (S.mode === 'cbn') {
      g = group('');
      g.appendChild(el('div', 'progress', '<span id="cbnLeft"></span>'));
      toolBtn(g, '💡 איפה?', false, function () {
        tap(700); if (!cbn) return;
        cbn.need.forEach(function (n, s) { if (n === cbn.sel && !s.dataset.w) { s.classList.add('cbn-glow'); setTimeout(function () { s.classList.remove('cbn-glow'); }, 2800); } });
        say('הנה כל האזורים של מספר ' + cbn.sel);
      }, 'wide');
      g = group('דפים');
      toolBtn(g, '📚 כל הדפים', false, function () { openPages(); }, 'wide');
      toolBtn(g, '🎲 דף הפתעה', false, surprise, 'wide');
      if (cbn) refreshCbn();
    } else if (S.mode === 'dots') {
      g = group('סדר הנקודות');
      [['num', '1 2 3'], ['he', 'א ב ג'], ['en', 'A B C']].forEach(function (d) {
        toolBtn(g, '<span dir="' + (d[0] === 'he' ? 'rtl' : 'ltr') + '">' + d[1] + '</span>', S.dotStyle === d[0], function () { S.dotStyle = d[0]; saveState(); tap(600); loadDots(S.dot); }, 'wide');
      });
      g = group('');
      if (!dots || !dots.done) toolBtn(g, '💡 רמז', false, function () {
        var sh = curSvg && curSvg.querySelector('.dot-shape'); if (!sh) return;
        sh.setAttribute('opacity', '.18'); setTimeout(function () { if (!dots.done) sh.setAttribute('opacity', '0'); }, 1800);
        var nx = dots.i + 1; if (nx < dots.pic.pts.length) speakLabel(nx, dots.pic.pts.length);
      }, 'wide');
      toolBtn(g, '▶ ציור הבא', !!(dots && dots.done), nextDots, 'wide');
      toolBtn(g, '📚 כל הציורים', false, function () { openPages(); }, 'wide');
    }
  }
  function nextDots() { var L = ArtPages.DOTS, i = L.map(function (d) { return d.id; }).indexOf(S.dot); snd('happy'); loadDots(L[(i + 1) % L.length].id); }

  /* חלונות קופצים: מדבקות ורקעים */
  function openPop(id) { closePops(); $(id).classList.add('show'); }
  function closePops() { ['stkPop', 'bgPop'].forEach(function (id) { $(id).classList.remove('show'); }); }
  (function buildPops() {
    var sk = $('stickers');
    STICKERS.forEach(function (s) {
      var b = el('button', 'stk' + (s === S.sticker ? ' on' : ''), s); b.type = 'button';
      b.addEventListener('pointerdown', function () { S.sticker = s; saveState(); sk.querySelectorAll('.stk').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); tap(760); setTimeout(closePops, 180); });
      sk.appendChild(b);
    });
    var bg = $('bgs');
    BGS.forEach(function (x) {
      var b = el('button', 'bgc' + (x[0] === S.bg ? ' on' : '')); b.type = 'button';
      var cv = document.createElement('canvas'); cv.width = 120; cv.height = 90; drawBg(cv.getContext('2d'), x[0], 120, 90);
      b.appendChild(cv); b.appendChild(el('span', '', x[1]));
      b.addEventListener('pointerdown', function () { S.bg = x[0]; saveState(); drawBg(bctx, S.bg, W, H); bg.querySelectorAll('.bgc').forEach(function (y) { y.classList.remove('on'); }); b.classList.add('on'); tap(620); say(x[1]); });
      bg.appendChild(b);
    });
    $('lineToggle').addEventListener('pointerdown', function () { S.line = !S.line; saveState(); setLineArt(); tap(700); buildTools(); updateChip(); });
  })();

  /* ================= פרק 10 — ביטול / ניקוי / רעיון ================= */
  $('btnUndo').addEventListener('pointerdown', function () {
    tap(520);
    if (S.mode === 'draw') {
      if (strokes.length) strokes.pop(); else if (cleared) { strokes = cleared; cleared = null; }
      replay(); return;
    }
    var u = undo.pop(); if (!u) return;
    if (u.t === 'fill') { u.e.setAttribute(u.attr, u.prev); if (u.w) u.e.dataset.w = u.w; else delete u.e.dataset.w; if (curInfo && work[curInfo.key]) { if (u.w) work[curInfo.key][u.e.dataset.i] = u.w; else delete work[curInfo.key][u.e.dataset.i]; saveWork(); } }
    else if (u.t === 'clear') { u.snap.forEach(function (x) { if (x.w) { var p = x.w.split('|'); applyFill(x.e, p[0], p[1]); } }); if (curInfo) { work[curInfo.key] = u.work; saveWork(); } }
    else if (u.t === 'cbn') { u.e.setAttribute('fill', '#ffffff'); delete u.e.dataset.w; u.e._lbl.classList.remove('gone'); cbn.left++; refreshCbn(); }
    else if (u.t === 'dot' && dots && !dots.done) {
      var cs = curSvg.querySelectorAll('.dot-pt'); if (cs[dots.i + 1]) cs[dots.i + 1].classList.remove('next');
      cs[dots.i].classList.remove('done'); cs[dots.i].classList.add('next'); dots.i--;
      dots.line.setAttribute('points', dots.pic.pts.slice(0, dots.i + 1).map(function (p) { return p.join(','); }).join(' '));
    }
  });
  $('btnClear').addEventListener('pointerdown', function () {
    snd('pop');
    if (S.mode === 'draw') { if (strokes.length) { cleared = strokes; strokes = []; replay(); burst(24); } return; }
    if (S.mode === 'cbn') { loadPage(S.page, true); return; }
    if (S.mode === 'dots') { loadDots(S.dot); return; }
    if (!curSvg) return;
    var snap = [];
    curSvg.querySelectorAll('.colorable').forEach(function (e) { snap.push({ e: e, w: e.dataset.w }); e.setAttribute(e.dataset.stroke ? 'stroke' : 'fill', '#ffffff'); delete e.dataset.w; });
    undo.push({ t: 'clear', snap: snap, work: curInfo && work[curInfo.key] });
    if (curInfo) { delete work[curInfo.key]; saveWork(); }
    finished = false; burst(24);
  });
  /* רעיון: דף צבוע קטן בפינה (צביעה/מספרים), רעיון לציור (ציור חופשי), צל הציור (נקודות) */
  function showIdea(on) { idea.classList.toggle('show', !!on); $('btnIdea').classList.toggle('on', !!on); if (!on) idea.innerHTML = ''; }
  $('btnIdea').addEventListener('pointerdown', function () {
    tap(760);
    if (S.mode === 'draw') { var p = PROMPTS[(Math.random() * PROMPTS.length) | 0]; toast('💡 ' + p); say(p.replace(/[^֐-׿\s\-]/g, '')); return; }
    if (S.mode === 'dots') { if (dots && !dots.done) { var sh = curSvg.querySelector('.dot-shape'); sh.setAttribute('opacity', '.18'); setTimeout(function () { if (!dots.done) sh.setAttribute('opacity', '0'); }, 1800); } return; }
    if (idea.classList.contains('show') || !curInfo) { showIdea(false); return; }
    coloredSvg(curInfo, function (t) { idea.innerHTML = t; showIdea(true); say('רעיון לצבעים'); });
  });

  /* ================= פרק 11 — שמירה וגלריה ================= */
  function loadGallery() { return readJSON(GALLERY_KEY) || []; }
  /* saveGallery — שומר; אם הזיכרון מלא — מוחק ציורים ישנים ומנסה שוב */
  function saveGallery(list) { while (list.length > MAX_GALLERY) list.pop(); while (!writeJSON(GALLERY_KEY, list) && list.length > 1) list.pop(); }
  /* cleanSvg — עותק נקי לשמירה: בלי מספרי "צבע לפי מספר" ובלי מאזינים */
  function cleanSvg() {
    var c = curSvg.cloneNode(true);
    c.querySelectorAll('.cbn-layer').forEach(function (n) { n.remove(); });
    if (dots && S.mode === 'dots' && dots.done) c.querySelectorAll('.dot-g').forEach(function (n) { n.remove(); });
    return c.outerHTML;
  }
  /* composite — הציור החופשי כתמונה אחת (רקע + משיכות + קווי דף), JPEG קטן לחיסכון במקום */
  function composite(cb) {
    var w = 560, h = Math.round(560 * H / W), cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    var c = cv.getContext('2d'); c.drawImage(bgCanvas, 0, 0, w, h); c.drawImage(drawCanvas, 0, 0, w, h);
    var s = S.line && lineArt.querySelector('svg');
    if (!s) { cb(cv.toDataURL('image/jpeg', .86)); return; }
    var img = new Image(), r = s.getBoundingClientRect(), sr = stage.getBoundingClientRect(), k = w / W;
    img.onload = function () { c.drawImage(img, (r.left - sr.left) * k, (r.top - sr.top) * k, r.width * k, r.height * k); cb(cv.toDataURL('image/jpeg', .86)); };
    img.onerror = function () { cb(cv.toDataURL('image/jpeg', .86)); };
    var clone = s.cloneNode(true); clone.setAttribute('width', 400); clone.setAttribute('height', 400);
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(clone.outerHTML);
  }
  $('btnSave').addEventListener('pointerdown', function () {
    var btn = this;
    function done(item) {
      var list = loadGallery(); item.t = Date.now(); list.unshift(item); saveGallery(list);
      snd('ding'); say('נשמר בגלריה! כל הכבוד!'); burst(30);
      if (typeof Wallet !== 'undefined') Wallet.add(2);
      award(1, btn, 'נשמר!'); track('art:save');
      toast('🖼️ נשמר בגלריה · 🪙 +2');
    }
    if (S.mode === 'draw') { if (!strokes.length) { toast('קודם מציירים משהו 🎨'); return; } composite(function (d) { done({ type: 'img', data: d }); }); return; }
    if (!curSvg) return;
    var item = { type: 'svg', data: cleanSvg() };
    if (S.mode === 'color' && curInfo) { item.key = curInfo.key; item.work = Object.assign({}, work[curInfo.key] || {}); }
    done(item);
  });
  /* פתיחת הגלריה: רשת ציורים; נגיעה → תצוגה גדולה עם "להמשיך לצבוע" / "למחוק" */
  function openGallery() {
    var grid = $('galGrid'), list = loadGallery(); grid.innerHTML = '';
    if (!list.length) grid.innerHTML = '<div class="gal-empty">עוד אין ציורים שמורים 🎨<br>מציירים משהו יפה ולוחצים 💾</div>';
    list.forEach(function (it, idx) {
      var c = el('button', 'card gal-item'); c.type = 'button';
      var th = el('div', 'th'); if (it.type === 'svg') th.innerHTML = it.data; else { var im = new Image(); im.src = it.data; th.appendChild(im); }
      c.appendChild(th); c.addEventListener('click', function () { viewItem(idx); }); grid.appendChild(c);
    });
    $('galOv').classList.add('show');
  }
  function viewItem(idx) {
    var list = loadGallery(), it = list[idx]; if (!it) return;
    var big = $('galBig'), acts = $('galActs'); big.innerHTML = ''; acts.innerHTML = '';
    if (it.type === 'svg') big.innerHTML = it.data; else { var im = new Image(); im.src = it.data; big.appendChild(im); }
    function act(txt, cls, fn) { var b = el('button', 'h-btn ' + cls, txt); b.type = 'button'; b.addEventListener('click', fn); acts.appendChild(b); return b; }
    if (it.key && it.work) act('🖍️ להמשיך לצבוע', 'gold', function () { work[it.key] = Object.assign({}, it.work); saveWork(); closeOv('galView'); closeOv('galOv'); setMode('color', it.key); });
    var del = act('🗑️ למחוק', 'violet', function () {
      if (!del.dataset.sure) { del.dataset.sure = 1; del.textContent = 'בטוח? לגעת שוב למחיקה'; return; }
      list.splice(idx, 1); saveGallery(list); closeOv('galView'); openGallery(); snd('pop');
    });
    act('✖ סגירה', 'cyan', function () { closeOv('galView'); });
    $('galView').classList.add('show');
  }
  $('btnGallery').addEventListener('pointerdown', function () { tap(); openGallery(); });
  function closeOv(id) { $(id).classList.remove('show'); }
  document.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', function () { tap(); closeOv(b.dataset.close); }); });
  document.querySelectorAll('.ov').forEach(function (o) { o.addEventListener('pointerdown', function (e) { if (e.target === o) closeOv(o.id); }); });

  /* ================= פרק 12 — בחירת דף, החלפת מצב, אתחול ================= */
  var curPack = null;
  /* packsFor — אילו חבילות מתאימות למצב (מספרים: רק דפי הספרייה; נקודות: רק ציורי נקודות) */
  function packsFor(mode) {
    if (mode === 'dots') return [['dots', 'חבר את הנקודות', '✨']];
    var list = ArtPages.PACKS.slice();
    if (mode !== 'cbn') list.unshift(['chars', 'דמויות', '🦸‍♀️']);
    return list;
  }
  /* itemsOf — הכרטיסים בחבילה: { key, name, thumb(cb) } */
  function itemsOf(pack) {
    if (pack === 'dots') return ArtPages.DOTS.map(function (d) {
      return { key: d.id, name: '✨ ציור ' + (ArtPages.DOTS.indexOf(d) + 1), thumb: function () {
        return '<svg viewBox="0 0 400 400">' + d.pts.map(function (p, i) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="11" fill="' + (i ? '#fff' : '#ff2e93') + '" stroke="#1b1036" stroke-width="4"/>'; }).join('') + '</svg>'; } };
    });
    if (pack === 'chars') return charKeys().map(function (k) {
      return { key: k, name: CHAR_NAMES[k], thumb: function () {
        var o = charOutfit(k); return '<img alt="" src="' + (o ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(HeroAvatar.svg(o)) : 'assets/art/' + k + '.svg') + '">'; } };
    });
    return ArtPages.pagesIn(pack).map(function (p) {
      return { key: p.id, name: p.name, thumb: function () { var t = ''; coloredSvg(pageInfo(p.id), function (s) { t = s; }); return t; } };
    });
  }
  function openPages() {
    closePops();
    var packs = packsFor(S.mode), curKey = S.mode === 'dots' ? S.dot : S.page;
    var info = S.mode === 'dots' ? { pack: 'dots' } : pageInfo(S.page);
    curPack = packs.some(function (p) { return p[0] === info.pack; }) ? info.pack : packs[0][0];
    $('pagesTitle').textContent = S.mode === 'dots' ? '✨ בוחרים ציור נקודות' : S.mode === 'draw' ? '📚 דף צביעה מתחת לציור' : '📚 בוחרים דף';
    var bar = $('packs'); bar.innerHTML = '';
    packs.forEach(function (p) {
      var b = el('button', 'pack' + (p[0] === curPack ? ' on' : ''), '<b>' + p[2] + '</b>' + p[1]); b.type = 'button';
      b.addEventListener('click', function () { curPack = p[0]; bar.querySelectorAll('.pack').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); tap(620); renderGrid(curKey); });
      bar.appendChild(b);
    });
    renderGrid(curKey);
    $('pagesOv').classList.add('show');
    setTimeout(function () { var on = bar.querySelector('.pack.on'); if (on && on.scrollIntoView) on.scrollIntoView({ inline: 'center', block: 'nearest' }); }, 30);
  }
  function renderGrid(curKey) {
    var grid = $('pagesGrid'), items = itemsOf(curPack); grid.innerHTML = '';
    var sp = el('button', 'card surprise', '<div class="th">🎲</div>הפתעה!'); sp.type = 'button';
    sp.addEventListener('click', function () { choose(items[(Math.random() * items.length) | 0].key); });
    grid.appendChild(sp);
    items.forEach(function (it) {
      var c = el('button', 'card' + (it.key === curKey ? ' cur' : ''), '<div class="th">' + it.thumb() + '</div>' + it.name); c.type = 'button';
      c.addEventListener('click', function () { choose(it.key); });
      grid.appendChild(c);
    });
    grid.scrollTop = 0;
  }
  /* choose — נבחר דף מהחלון */
  function choose(key) {
    closeOv('pagesOv'); snd('happy');
    if (S.mode === 'dots') { loadDots(key); return; }
    if (S.mode === 'draw') { S.page = key; S.line = true; saveState(); setLineArt(); buildTools(); updateChip(); speakPage(pageInfo(key)); return; }
    loadPage(key);
  }
  /* surprise — דף אקראי מכל הספרייה שמתאים למצב */
  function surprise() {
    var pool = S.mode === 'cbn' ? ArtPages.drawn() : ArtPages.PAGES;
    var p = pool[(Math.random() * pool.length) | 0]; snd('happy'); loadPage(p.id);
  }
  function updateChip() {
    if (S.mode === 'draw') setChip('✏️', S.line ? 'ציור חופשי · ' + pageInfo(S.page).name : 'ציור חופשי — מה שבא לך!');
  }
  $('pageChip').addEventListener('click', function () { tap(); openPages(); });

  /* setMode — מעבר בין 4 המצבים */
  function setMode(m, pageKey) {
    S.mode = m; saveState(); closePops(); showIdea(false);
    document.body.className = document.body.className.replace(/\bm-\w+/g, '').trim() + ' m-' + m;
    document.querySelectorAll('.mode').forEach(function (b) { b.classList.toggle('on', b.dataset.m === m); });
    cbn = null; if (m !== 'dots') dots = null;
    if (m === 'draw') { sizeCanvases(); setLineArt(); updateChip(); }
    else if (m === 'dots') loadDots(S.dot);
    else {
      var key = pageKey || S.page;
      if (m === 'cbn' && !artById[key]) key = 'cat';
      if (!artById[key] && !CHAR_NAMES[key] && key.indexOf(':') < 0) key = 'hero:1';
      loadPage(key, true);
    }
    buildPalette(); buildTools();
  }
  document.querySelectorAll('.mode').forEach(function (b) {
    b.addEventListener('pointerdown', function () { if (S.mode === b.dataset.m) return; tap(600); setMode(b.dataset.m); say(MODE_NAMES[b.dataset.m]); });
  });

  window.addEventListener('DOMContentLoaded', function () {
    charKeys();
    sizeCanvases();
    setMode(S.mode in MODE_NAMES ? S.mode : 'color');
  });
  /* לבדיקות אוטומטיות */
  window.ArtStudio = { setMode: setMode, loadPage: loadPage, loadDots: loadDots, state: function () { return { S: S, cbn: cbn, dots: dots, strokes: strokes.length }; } };
})();
