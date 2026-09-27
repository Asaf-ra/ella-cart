/* ===== צביעה וציור קסם — דף DOM+SVG+Canvas (בלי Phaser) =====
   מצב צביעה: דמויות ה-SVG של המשחק הופכות לדפי צביעה — אזורים בהירים
   מולבנים ומקבלים קו מתאר, הקשה צובעת בצבע הנבחר.
   מצב ציור קסם: מכחול קשת עם שובל נצנצים על קנבס.
   שמירה לגלריה ב-localStorage (ella-coloring-gallery).                  */
(function () {
  'use strict';

  /* ---------- הגדרות ---------- */
  /* דפי צביעה של גיבורות: נוצרים מ-HeroAvatar (מפתח שמתחיל ב-hero:) */
  const HERO_PAGES = {
    'hero:1': { cape: 'cape_pink', suit: 'suit_magenta', mask: 'mask_classic', emblem: 'emb_heart', aura: 'aura_none', acc: 'acc_crown' },
    'hero:2': { cape: 'cape_hearts', suit: 'suit_sun', mask: 'mask_cat', emblem: 'emb_star', aura: 'aura_wings', acc: 'acc_none' },
    'hero:3': { cape: 'cape_sky', suit: 'suit_cyan', mask: 'mask_butterfly', emblem: 'emb_flower', aura: 'aura_bubbles', acc: 'acc_bow' }
  };
  function heroSVG(key) { return window.HeroAvatar ? HeroAvatar.svg(HERO_PAGES[key]) : ''; }
  const CHARS = ['hero:1','hero:2','hero:3','ella','cust_bunny','cust_bear','cust_cat','cust_panda','cust_penguin','cust_dog','cust_fox',
                 'food_burger','food_pizza','food_donut','food_shake'];
  const COLORS = [
    { c:'#ff5ca8', name:'ורוד'  }, { c:'#ff4c4c', name:'אדום'  },
    { c:'#ff8a4c', name:'כתום'  }, { c:'#ffd24c', name:'צהוב'  },
    { c:'#6fd06a', name:'ירוק'  }, { c:'#7ee8c0', name:'טורקיז'},
    { c:'#7ec8ff', name:'תכלת'  }, { c:'#4d6dff', name:'כחול'  },
    { c:'#b28dff', name:'סגול'  }, { c:'#a5714d', name:'חום'   },
    { c:'#9aa0ab', name:'אפור'  }, { c:'#ffffff', name:'לבן'   }
  ];
  // צבעים שנפתחים עם השדרוג "עוד צבעים" מעגלת השדרוגים
  const EXTRA_COLORS = [
    { c:'#ff2d78', name:'פוקסיה' }, { c:'#00c9a7', name:'ים'     },
    { c:'#845ec2', name:'לילך'   }, { c:'#f9f871', name:'ליים'   },
    { c:'#ffc75f', name:'זהב'    }, { c:'#2c2c54', name:'לילה'   }
  ];
  if (typeof Wallet !== 'undefined' && Wallet.lvl('brushes') > 0) EXTRA_COLORS.forEach(c => COLORS.push(c));
  const INK = '#5a3d5c';          // צבע קו המתאר
  const GALLERY_KEY = 'ella-coloring-gallery';
  const MAX_GALLERY = 12;
  const MAX_PARTICLES = 300;

  let currentColor = COLORS[0];
  let currentChar = CHARS[0];
  let drawMode = false;
  const svgCache = {};            // טקסט SVG גולמי לפי מפתח
  const undoColor = [];           // מצב צביעה: {el, fill}
  let strokes = [];               // מצב ציור: רשימת משיכות לצורך undo
  let hueBase = 0;

  const stage = document.getElementById('stage');
  const holder = document.getElementById('svgHolder');
  const drawCanvas = document.getElementById('drawCanvas');
  const fxCanvas = document.getElementById('fxCanvas');
  const dctx = drawCanvas.getContext('2d');
  const fctx = fxCanvas.getContext('2d');

  /* ---------- עזרי צבע ---------- */
  function luminance(hex) {
    if (!hex || hex === 'none') return -1;
    let h = hex.trim();
    if (h[0] !== '#') return -1;                       // שמות צבע לא בשימוש בקבצים שלנו
    if (h.length === 4) h = '#' + h[1]+h[1] + h[2]+h[2] + h[3]+h[3];
    const r = parseInt(h.slice(1,3),16), g = parseInt(h.slice(3,5),16), b = parseInt(h.slice(5,7),16);
    return 0.2126*r + 0.7152*g + 0.0722*b;
  }

  /* ---------- קנבסים בגודל הבמה ---------- */
  function sizeCanvases() {
    const r = stage.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);   // תקרת רזולוציה — זיכרון A10X
    [drawCanvas, fxCanvas].forEach(cv => {
      cv.width = Math.round(r.width * dpr);
      cv.height = Math.round(r.height * dpr);
    });
    dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redrawStrokes();
  }
  window.addEventListener('resize', () => setTimeout(sizeCanvases, 150));

  /* ---------- חלקיקי נצנצים (שכבת fx משותפת) ---------- */
  const parts = [];
  function sparkle(x, y, color, n) {
    for (let i = 0; i < (n || 8); i++) {
      if (parts.length >= MAX_PARTICLES) parts.shift();
      const a = Math.random() * Math.PI * 2, sp = 40 + Math.random() * 160;
      parts.push({
        x, y, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp - 40,
        life: 1, decay: 1.6 + Math.random() * 1.4,
        r: 2 + Math.random() * 4, color: color || '#fff'
      });
    }
  }
  let lastT = performance.now();
  (function fxLoop(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000); lastT = t;
    const r = stage.getBoundingClientRect();
    fctx.clearRect(0, 0, r.width, r.height);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= p.decay * dt;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 220 * dt;
      fctx.globalAlpha = Math.max(0, p.life);
      fctx.fillStyle = p.color;
      fctx.beginPath(); fctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2); fctx.fill();
    }
    fctx.globalAlpha = 1;
    requestAnimationFrame(fxLoop);
  })(lastT);

  function stagePos(e) {
    const r = stage.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  /* ---------- מצב צביעה: טעינת דמות והפיכתה לדף צביעה ---------- */
  function loadCharacter(key) {
    currentChar = key;
    undoColor.length = 0;
    const apply = (text) => {
      holder.innerHTML = text;
      const svg = holder.querySelector('svg');
      if (!svg) return;
      svg.querySelectorAll('path,circle,ellipse,rect,polygon').forEach(el => {
        const fill = el.getAttribute('fill');
        /* ידיים של הגיבורה מצוירות כקו עבה צבעוני — הופכים אותן ללבן וצובעים את הקו עצמו */
        const sw = parseFloat(el.getAttribute('stroke-width') || '0'), st = el.getAttribute('stroke');
        if (fill === 'none' && sw >= 12 && st && st !== INK && st !== '#1b1036') {
          el.setAttribute('stroke', '#ffffff'); el.classList.add('colorable');
          el.addEventListener('pointerdown', (e) => { e.stopPropagation(); undoColor.push({ el, fill: el.getAttribute('stroke'), stroke: true }); el.setAttribute('stroke', currentColor.c); const p = stagePos(e); sparkle(p.x, p.y, currentColor.c, 12); Sound.bubble(); });
          return;
        }
        if (fill === 'none') return;                       // קו — נשאר כמו שהוא
        const lum = luminance(fill || '#000000');
        if (lum >= 0 && lum < 90) return;                  // פרטים כהים (עיניים) — נשארים
        el.dataset.orig = fill || '';
        el.setAttribute('fill', '#ffffff');
        el.setAttribute('stroke', INK);
        el.setAttribute('stroke-width', '2.5');
        el.classList.add('colorable');
        el.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          undoColor.push({ el, fill: el.getAttribute('fill') });
          el.setAttribute('fill', currentColor.c);
          const p = stagePos(e);
          sparkle(p.x, p.y, currentColor.c, 12);
          Sound.bubble();
        });
      });
    };
    if (key.indexOf('hero:') === 0) { apply(heroSVG(key)); return; }
    if (svgCache[key]) { apply(svgCache[key]); return; }
    fetch('assets/art/' + key + '.svg')
      .then(res => res.text())
      .then(text => { svgCache[key] = text; apply(text); })
      .catch(() => {});
  }

  /* ---------- מצב ציור קסם: מכחול קשת + נצנצים ---------- */
  let drawing = false, lastPt = null, curStroke = null;

  function hueColor(h, l) { return 'hsl(' + (h % 360) + ',95%,' + (l || 62) + '%)'; }

  function drawSegment(a, b, hue) {
    // שתי שכבות: הילה רחבה שקופה + ליבה — מראה "קסם" בלי shadowBlur יקר
    dctx.lineCap = 'round'; dctx.lineJoin = 'round';
    dctx.globalAlpha = 0.30;
    dctx.strokeStyle = hueColor(hue, 72); dctx.lineWidth = 24;
    dctx.beginPath(); dctx.moveTo(a.x, a.y); dctx.lineTo(b.x, b.y); dctx.stroke();
    dctx.globalAlpha = 1;
    dctx.strokeStyle = hueColor(hue, 58); dctx.lineWidth = 12;
    dctx.beginPath(); dctx.moveTo(a.x, a.y); dctx.lineTo(b.x, b.y); dctx.stroke();
  }

  function redrawStrokes() {
    const r = stage.getBoundingClientRect();
    dctx.clearRect(0, 0, r.width, r.height);
    strokes.forEach(st => {
      for (let i = 1; i < st.pts.length; i++) {
        drawSegment(st.pts[i-1], st.pts[i], st.hue0 + i * 4);
      }
    });
  }

  drawCanvas.addEventListener('pointerdown', (e) => {
    drawing = true;
    drawCanvas.setPointerCapture(e.pointerId);
    lastPt = stagePos(e);
    curStroke = { pts: [lastPt], hue0: hueBase };
    strokes.push(curStroke);
    Sound.sparkle();
  });
  drawCanvas.addEventListener('pointermove', (e) => {
    if (!drawing) return;
    const p = stagePos(e);
    const d = Math.hypot(p.x - lastPt.x, p.y - lastPt.y);
    if (d < 3) return;
    curStroke.pts.push(p);
    const hue = curStroke.hue0 + curStroke.pts.length * 4;
    drawSegment(lastPt, p, hue);
    sparkle(p.x, p.y, hueColor(hue, 70), 2);
    lastPt = p;
  });
  ['pointerup','pointercancel'].forEach(ev => drawCanvas.addEventListener(ev, () => {
    drawing = false;
    if (curStroke) hueBase = (curStroke.hue0 + curStroke.pts.length * 4) % 360;
    curStroke = null;
  }));

  /* ---------- כלים ---------- */
  const btnColor = document.getElementById('btnColorMode');
  const btnDraw = document.getElementById('btnDrawMode');

  function setMode(draw) {
    drawMode = draw;
    document.body.classList.toggle('draw-mode', draw);
    btnDraw.classList.toggle('active', draw);
    btnColor.classList.toggle('active', !draw);
    Voice.say(draw ? 'ציור קסם!' : 'צביעה!');
  }
  btnColor.addEventListener('pointerdown', () => { KidsUI.KidsAudio.tap(); setMode(false); });
  btnDraw.addEventListener('pointerdown', () => { KidsUI.KidsAudio.tap(); setMode(true); });

  document.getElementById('btnUndo').addEventListener('pointerdown', () => {
    KidsUI.KidsAudio.tap(520);
    if (drawMode) { strokes.pop(); redrawStrokes(); }
    else {
      const u = undoColor.pop();
      if (u) u.el.setAttribute(u.stroke ? 'stroke' : 'fill', u.fill);
    }
  });

  document.getElementById('btnClear').addEventListener('pointerdown', () => {
    Sound.pop();
    if (drawMode) {
      strokes = [];
      redrawStrokes();
      const r = stage.getBoundingClientRect();
      for (let i = 0; i < 24; i++) sparkle(Math.random()*r.width, Math.random()*r.height, '#fff', 2);
    } else {
      holder.querySelectorAll('.colorable').forEach(el => el.setAttribute(el.getAttribute('fill') === 'none' ? 'stroke' : 'fill', '#ffffff'));
      undoColor.length = 0;
    }
  });

  /* ---------- שמירה וגלריה ---------- */
  function loadGallery() {
    try { return JSON.parse(localStorage.getItem(GALLERY_KEY)) || []; }
    catch (e) { return []; }
  }
  function saveGallery(list) {
    try { localStorage.setItem(GALLERY_KEY, JSON.stringify(list)); } catch (e) {}
  }

  document.getElementById('btnSave').addEventListener('pointerdown', () => {
    const list = loadGallery();
    if (drawMode) {
      // ציור נשמר כתמונה מוקטנת — חוסך מקום ב-localStorage
      const small = document.createElement('canvas');
      const w = 340, h = Math.round(340 * drawCanvas.height / Math.max(1, drawCanvas.width));
      small.width = w; small.height = h;
      small.getContext('2d').drawImage(drawCanvas, 0, 0, w, h);
      list.unshift({ type: 'img', data: small.toDataURL('image/png') });
    } else {
      const svg = holder.querySelector('svg');
      if (!svg) return;
      list.unshift({ type: 'svg', data: svg.outerHTML });
    }
    while (list.length > MAX_GALLERY) list.pop();
    saveGallery(list);
    Sound.ding();
    Voice.praise();
    const r = stage.getBoundingClientRect();
    for (let i = 0; i < 30; i++) sparkle(r.width/2 + (Math.random()-0.5)*300, r.height/2 + (Math.random()-0.5)*200, currentColor.c, 2);
    // ציור שמור = 2 מטבעות לארנק המשותף
    if (typeof Wallet !== 'undefined') {
      Wallet.add(2);
      const f = document.createElement('div');
      f.textContent = '🪙 +2';
      Object.assign(f.style, { position: 'fixed', left: '50%', top: '42%', transform: 'translate(-50%,-50%)',
        font: 'bold 54px Varela Round, Heebo, sans-serif', color: '#e09b00', zIndex: 50,
        textShadow: '0 2px 6px rgba(255,255,255,.9)', pointerEvents: 'none', transition: 'all 1s ease-out', opacity: 1 });
      document.body.appendChild(f);
      requestAnimationFrame(() => { f.style.top = '20%'; f.style.opacity = 0; });
      setTimeout(() => f.remove(), 1100);
    }
  });

  const gallery = document.getElementById('gallery');
  const galleryBox = document.getElementById('galleryBox');
  document.getElementById('btnGallery').addEventListener('pointerdown', () => {
    KidsUI.KidsAudio.tap();
    galleryBox.innerHTML = '';
    const list = loadGallery();
    if (!list.length) {
      galleryBox.innerHTML = '<div class="gal-empty">עוד אין ציורים שמורים 🎨<br>צבעי משהו יפה ולחצי 💾</div>';
    } else {
      list.forEach(item => {
        const d = document.createElement('div');
        d.className = 'gal-item';
        if (item.type === 'svg') d.innerHTML = item.data;
        else { const im = document.createElement('img'); im.src = item.data; d.appendChild(im); }
        galleryBox.appendChild(d);
      });
    }
    gallery.classList.add('open');
  });
  gallery.addEventListener('pointerdown', (e) => {
    if (e.target === gallery) gallery.classList.remove('open');
  });

  /* ---------- בניית פלטה ודמויות ---------- */
  const palette = document.getElementById('palette');
  COLORS.forEach((col, i) => {
    const b = document.createElement('button');
    b.className = 'swatch' + (i === 0 ? ' active' : '');
    b.style.background = col.c;
    b.addEventListener('pointerdown', () => {
      currentColor = col;
      palette.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
      b.classList.add('active');
      KidsUI.KidsAudio.tap(500 + i * 40);
      Voice.say(col.name);
    });
    palette.appendChild(b);
  });

  const chars = document.getElementById('chars');
  CHARS.forEach((key, i) => {
    const b = document.createElement('button');
    b.className = 'char-thumb' + (i === 0 ? ' active' : '');
    const im = document.createElement('img');
    im.src = key.indexOf('hero:') === 0 ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(heroSVG(key)) : 'assets/art/' + key + '.svg';
    b.appendChild(im);
    b.addEventListener('pointerdown', () => {
      chars.querySelectorAll('.char-thumb').forEach(s => s.classList.remove('active'));
      b.classList.add('active');
      Sound.happy();
      setMode(false);
      loadCharacter(key);
    });
    chars.appendChild(b);
  });

  /* ---------- אתחול ---------- */
  window.addEventListener('DOMContentLoaded', () => {
    sizeCanvases();
    btnColor.classList.add('active');
    loadCharacter(currentChar);
  });
})();
