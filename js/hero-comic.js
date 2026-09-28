/* =====================================================================
   js/hero-comic.js — ערכת הקומיקס של "עגלת הגיבורות" (Phaser 3)
   ---------------------------------------------------------------------
   מראה קומיקס-גיבורים מקורי (לא דמויות מוגנות): קווי דיו עבים, נקודות רסטר,
   פיצוצי "בום!", בועות דיבור, תיבות קריינות צהובות וקווי מהירות.
   פרק 1 — פלטה: צבעי הגרסה (בנות: מג׳נטה/סגול/זהב; בגרסת הבנים: כחול/אדום/צהוב)
   פרק 2 — כלי ציור בסיסיים: רסטר, כוכב-פיצוץ, קווי מהירות, מסגרת פאנל
   פרק 3 — טקסט קומיקס: כותרת תלת-ממדית, מילות-קול (SFX), תיבת קריינות, בועת דיבור
   פרק 4 — אפקטים חיים: הבזק מסך, פאנל "המשימה הושלמה", מונה קומבו
   פרק 5 — העיר: שמיים לפי ערכת הרקע, סימן הגיבור בשמיים, קו רקיע בדיו, רחוב
   פרק 6 — הנבל בלגנון: SVG מקורי (קוסם קטן ושובב) שנטען כטקסטורה
   תלויות: Phaser, DESIGN (js/game.js). נטען לפני js/world.js.
   ===================================================================== */
const Comic = (function () {
  'use strict';

  /* ---------- פרק 1 — פלטה ---------- */
  const C = {
    ink: 0x1b1036, inkCss: '#1b1036', paper: 0xfffaf0,
    red: 0xff2e93, redD: 0xc2187a, yellow: 0xffd23c, yellowD: 0xe09b00,
    blue: 0x8b5cff, blueD: 0x3a1177, cyan: 0x29e0ff, orange: 0xff9f1c, green: 0x3fcf7a,
    villain: 0x2fb36a, villainD: 0x16753f,
    /* צבעי פיצוצי SFX (מתחלפים) */
    burst: [0xffd23c, 0xff2e93, 0x29e0ff, 0xff9f1c, 0xffffff],
    /* מילות-קול בעברית — כמו בקומיקס */
    words: ['בום!', 'פאו!', 'וואם!', 'זאפ!', 'קבוום!', 'בנג!', 'וווש!'],
    font: 'Rubik, Varela Round, Heebo, sans-serif'
  };

  /* ---------- פרק 2 — כלי ציור בסיסיים ---------- */

  /* halftone — נקודות רסטר שגדלות לכיוון אחד (dir: 'down' = גדלות כלפי מטה) */
  function halftone(g, x, y, w, h, color, alpha, step, rMax, dir) {
    g.fillStyle(color, alpha);
    for (let yy = 0, row = 0; yy <= h; yy += step, row++) {
      const k = dir === 'up' ? 1 - yy / h : yy / h;
      const r = Math.max(0.6, rMax * k);
      for (let xx = row % 2 ? step / 2 : 0; xx <= w; xx += step) g.fillCircle(x + xx, y + yy, r);
    }
  }

  /* burstPoints — נקודות של כוכב-פיצוץ משונן (קצוות לא אחידים = מראה קומיקס) */
  function burstPoints(r, spikes, jag) {
    const pts = [];
    for (let i = 0; i < spikes * 2; i++) {
      const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
      const rr = i % 2 ? r * (0.62 + Math.sin(i * 7.3) * 0.06) : r * (1 - (jag || 0.12) * Math.abs(Math.sin(i * 3.1)));
      pts.push(new Phaser.Geom.Point(Math.cos(a) * rr, Math.sin(a) * rr));
    }
    return pts;
  }
  /* burst — כוכב-פיצוץ: צל דיו, מסגרת דיו ומילוי צבע */
  function burst(scene, x, y, r, fill, spikes) {
    const g = scene.add.graphics({ x: x, y: y });
    const pts = burstPoints(r, spikes || 12);
    g.fillStyle(C.ink, 1); g.fillPoints(pts.map(p => new Phaser.Geom.Point(p.x + 7, p.y + 9)), true);   // צל קשיח
    g.fillStyle(C.ink, 1); g.fillPoints(burstPoints(r + 7, spikes || 12), true);                        // מסגרת
    g.fillStyle(fill == null ? C.yellow : fill, 1); g.fillPoints(pts, true);
    g.fillStyle(0xffffff, 0.35); g.fillPoints(burstPoints(r * 0.55, spikes || 12), true);               // הבהק פנימי
    return g;
  }

  /* speedLines — קווי מהירות רדיאליים שמתכנסים לנקודה (אפקט "זום" של קומיקס) */
  function speedLines(scene, cx, cy, opts) {
    opts = opts || {};
    const g = scene.add.graphics().setDepth(opts.depth || 40);
    const n = opts.n || 44, R = 1600, inner = opts.inner || 230;
    g.fillStyle(opts.color == null ? 0xffffff : opts.color, opts.alpha == null ? 0.55 : opts.alpha);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.05, w = 0.012 + Math.random() * 0.02;
      const r0 = inner + Math.random() * 120;
      g.fillTriangle(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0,
                     cx + Math.cos(a - w) * R, cy + Math.sin(a - w) * R,
                     cx + Math.cos(a + w) * R, cy + Math.sin(a + w) * R);
    }
    if (opts.life) scene.tweens.add({ targets: g, alpha: 0, duration: opts.life, delay: opts.hold || 200, onComplete: () => g.destroy() });
    return g;
  }

  /* panelFrame — מסגרת פאנל קומיקס סביב המסך (שוליים לבנים + קו דיו עבה) */
  function panelFrame(scene, depth) {
    const W = DESIGN.w, H = DESIGN.h, g = scene.add.graphics().setDepth(depth || 18);
    g.lineStyle(14, 0xffffff, 1); g.strokeRect(7, 7, W - 14, H - 14);
    g.lineStyle(7, C.ink, 1); g.strokeRect(16, 16, W - 32, H - 32);
    return g;
  }

  /* ---------- פרק 3 — טקסט קומיקס ---------- */

  /* title — כותרת "בולטת" תלת-ממדית: שכבות דיו מוסטות (אקסטרוזיה) + מילוי + קו מתאר */
  function title(scene, x, y, text, size, fill, depth) {
    const c = scene.add.container(x, y).setDepth(depth || 20);
    const style = { fontFamily: C.font, fontSize: size + 'px', color: C.inkCss, fontStyle: '900' };
    const steps = Math.max(4, Math.round(size / 14));
    for (let i = steps; i > 0; i--) {                                   // שכבות האקסטרוזיה
      const t = scene.add.text(i * 1.2, i * 1.6, text, style).setOrigin(0.5);
      t.setStroke(C.inkCss, Math.round(size / 6)); c.add(t);
    }
    const main = scene.add.text(0, 0, text, Object.assign({}, style, { color: fill || '#ffffff' })).setOrigin(0.5);
    main.setStroke(C.inkCss, Math.round(size / 6));
    c.add(main); c._main = main;
    return c;
  }

  /* sfx — מילת-קול מתפוצצת ("בום!") על כוכב-פיצוץ; נעלמת לבד */
  function sfx(scene, x, y, word, opts) {
    opts = opts || {};
    const size = opts.size || 64, c = scene.add.container(x, y).setDepth(opts.depth || 45);
    const col = opts.color == null ? C.burst[(Math.random() * C.burst.length) | 0] : opts.color;
    const b = burst(scene, 0, 0, size * 1.25, col, 11);
    const t = title(scene, 0, 0, word || C.words[(Math.random() * C.words.length) | 0], size, col === 0xffffff || col === C.yellow ? '#ff3b30' : '#ffffff');
    c.add([b, t]);
    c.setScale(0.2).setAngle(opts.angle == null ? Phaser.Math.Between(-14, 14) : opts.angle);
    scene.tweens.add({ targets: c, scale: opts.scale || 1, duration: 230, ease: 'Back.out' });
    scene.tweens.add({ targets: c, alpha: 0, scale: (opts.scale || 1) * 1.15, duration: 300, delay: opts.hold || 520, onComplete: () => c.destroy() });
    return c;
  }

  /* caption — תיבת קריינות צהובה ("בינתיים, בעיר…") עם מסגרת דיו וצל קשיח */
  function caption(scene, x, y, text, opts) {
    opts = opts || {};
    const size = opts.size || 30;
    const t = scene.add.text(0, 0, text, { fontFamily: C.font, fontSize: size + 'px', color: C.inkCss, fontStyle: '900', align: 'center' }).setOrigin(0.5);
    const w = t.width + 44, h = t.height + 22;
    const g = scene.add.graphics();
    g.fillStyle(C.ink, 1); g.fillRect(-w / 2 + 7, -h / 2 + 7, w, h);
    g.fillStyle(C.ink, 1); g.fillRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8);
    g.fillStyle(opts.fill == null ? C.yellow : opts.fill, 1); g.fillRect(-w / 2, -h / 2, w, h);
    const c = scene.add.container(x, y, [g, t]).setDepth(opts.depth || 22).setAngle(opts.angle || 0);
    c._text = t; c.w = w; c.h = h;
    return c;
  }

  /* balloon — בועת דיבור לבנה עם קו דיו ו"זנב" כלפי מטה; מחזירה graphics */
  function balloon(scene, w, h) {
    const g = scene.add.graphics();
    const r = Math.min(h / 2, 30);
    g.fillStyle(C.ink, 1);
    g.fillRoundedRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8, r + 4);
    g.fillTriangle(-16, h / 2 - 2, 14, h / 2 - 2, -6, h / 2 + 30);   // זנב (מסגרת)
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, r);
    g.fillTriangle(-10, h / 2 - 4, 8, h / 2 - 4, -4, h / 2 + 20);    // זנב (מילוי)
    return g;
  }

  /* ---------- פרק 4 — אפקטים חיים ---------- */

  /* flash — הבזק מסך קצר (לבן/צהוב) לרגעי אקשן */
  function flash(scene, color, alpha, ms) {
    const r = scene.add.rectangle(DESIGN.w / 2, DESIGN.h / 2, DESIGN.w, DESIGN.h, color == null ? 0xffffff : color, alpha == null ? 0.7 : alpha).setDepth(60);
    scene.tweens.add({ targets: r, alpha: 0, duration: ms || 260, onComplete: () => r.destroy() });
  }

  /* heroFlyBy — צללית גיבור עם גלימה שחולפת בשמיים (אווירה) */
  function heroFlyBy(scene, y, depth, color) {
    const W = DESIGN.w, s = scene.add.graphics({ x: -80, y: y }).setDepth(depth || 1);
    s.fillStyle(color == null ? C.ink : color, 0.85);
    s.fillEllipse(0, 0, 44, 12);                     // גוף אופקי
    s.fillCircle(24, -2, 7);                         // ראש
    s.fillTriangle(-6, -4, -44, -14, -40, 8);        // גלימה מתנופפת
    s.fillRect(14, -8, 22, 4);                       // יד קדימה
    scene.tweens.add({ targets: s, x: W + 80, y: y - 60, duration: 5200, ease: 'Sine.inOut', onComplete: () => s.destroy() });
    scene.tweens.add({ targets: s, scaleY: 0.85, duration: 180, yoyo: true, repeat: -1 });
  }

  /* ---------- פרק 5 — העיר ---------- */
  /* THEMES — שמיים לפי "רקע חדש" מהחנות (G.UPGRADES theme): עליון, תחתון, צבע בניינים, לילה? */
  const THEMES = {
    default: { top: 0x3a1177, bot: 0xff7ec2, far: 0x5a2bb0, near: 0x2a1260, win: 0xffd95a, night: false },   // שקיעה ורודה
    beach:   { top: 0x2f8fff, bot: 0xbfeaff, far: 0x7fb4e6, near: 0x3d6fb8, win: 0xfff3b0, night: false },   // יום
    park:    { top: 0x4aa8ff, bot: 0xfff0c0, far: 0x7fc2a0, near: 0x3a8a6a, win: 0xfff3b0, night: false },   // בוקר
    city:    { top: 0x140a33, bot: 0x6a1b9a, far: 0x3a1a6e, near: 0x1d0b4a, win: 0x29e0ff, night: true },    // ניאון
    space:   { top: 0x050a1f, bot: 0x1a2c6a, far: 0x1c2a5a, near: 0x0d1636, win: 0xffd95a, night: true }     // לילה
  };
  function themeName() { return (document.body && document.body.dataset.theme) || 'default'; }
  function theme() { return THEMES[themeName()] || THEMES.default; }

  /* bake — ציור סטטי כבד (אלפי נקודות רסטר) נאפה פעם אחת לטקסטורה ומוצג כתמונה.
     Graphics של Phaser מצויר מחדש בכל פריים — בלי אפייה זה מאט מאוד את האייפד. */
  function bake(scene, key, depth, draw) {
    if (!scene.textures.exists(key)) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      draw(g);
      g.generateTexture(key, DESIGN.w, DESIGN.h);
      g.destroy();
    }
    return scene.add.image(0, 0, key).setOrigin(0).setDepth(depth);
  }

  /* city — בונה את כל הרקע: שמיים + רסטר, סימן הגיבור, 2 שכבות בניינים בדיו, רחוב ומדרכה */
  function city(scene) {
    const W = DESIGN.w, H = DESIGN.h, T = theme();
    const STREET = H - 150;                                            // קו המדרכה

    /* 5.1 שמיים בהדרגה + רסטר עדין בחלק העליון (נאפה פעם אחת לכל ערכת רקע) */
    const tk = 'city_' + themeName() + '_';
    bake(scene, tk + 'sky', 0, sky => {
        sky.fillGradientStyle(T.top, T.top, T.bot, T.bot, 1); sky.fillRect(0, 0, W, STREET);
        halftone(sky, 0, 0, W, 300, 0xffffff, T.night ? 0.08 : 0.12, 18, 3.2, 'up');
        if (T.night) for (let i = 0; i < 60; i++) { sky.fillStyle(0xffffff, 0.4 + Math.random() * 0.6); sky.fillCircle(Math.random() * W, Math.random() * 320, Math.random() < 0.2 ? 2.4 : 1.3); }
    });

    /* 5.2 סימן הגיבור: אלומת זרקור מהעיר אל ענן, ובו סמל ברק בתוך עיגול */
    const sig = scene.add.container(0, 0).setDepth(0);
    const beam = scene.add.graphics();
    beam.fillStyle(0xfff6c0, T.night ? 0.22 : 0.16); beam.fillTriangle(250, STREET - 140, 330, 120, 470, 150);
    const emb = scene.add.graphics({ x: 400, y: 128 });
    emb.fillStyle(0xfff6c0, T.night ? 0.75 : 0.55); emb.fillEllipse(0, 0, 150, 96);
    emb.fillStyle(C.ink, T.night ? 0.8 : 0.6);
    emb.fillPoints([[8, -38], [-20, 4], [-2, 4], [-12, 38], [22, -8], [4, -8], [16, -38]].map(p => new Phaser.Geom.Point(p[0], p[1])), true);
    sig.add([beam, emb]);
    scene.tweens.add({ targets: sig, angle: { from: -2.5, to: 2.5 }, duration: 4200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    scene.tweens.add({ targets: emb, alpha: 0.6, duration: 1300, yoyo: true, repeat: -1 });

    /* 5.3 עננים קומיקסיים (מילוי + קו דיו) נסחפים */
    for (let i = 0; i < 4; i++) {
      const cl = scene.add.graphics({ x: Math.random() * W, y: 70 + Math.random() * 170 }).setDepth(1);
      cl.lineStyle(5, C.ink, 0.9); cl.fillStyle(0xffffff, T.night ? 0.25 : 0.95);
      [[0, 0, 34], [36, -14, 42], [80, 0, 34], [40, 12, 36]].forEach(p => { cl.fillCircle(p[0], p[1], p[2]); });
      [[0, 0, 34], [36, -14, 42], [80, 0, 34]].forEach(p => { cl.beginPath(); cl.arc(p[0], p[1], p[2], Math.PI * 0.95, Math.PI * 2.05); cl.strokePath(); });
      cl.setScale(0.6 + Math.random() * 0.6);
      scene.tweens.add({ targets: cl, x: cl.x + W + 260, duration: 60000 + Math.random() * 30000, repeat: -1,
        onRepeat: () => { cl.x = -260; } });
    }

    /* 5.4 בניינים — שכבה רחוקה (ללא דיו, עם רסטר) ושכבה קרובה (קווי דיו עבים + חלונות) */
    bake(scene, tk + 'far', 1, far => {
      far.fillStyle(T.far, 1);
      for (let x = -20; x < W; x += 70 + ((x * 13) % 50)) { const h = 170 + ((x * 37) % 150); far.fillRect(x, STREET - h, 64, h); }
      halftone(far, 0, STREET - 330, W, 330, 0xffffff, 0.06, 14, 2.4, 'down');
    });

    bake(scene, tk + 'near', 2, near => {
      const B = [[0, 190, 110], [120, 260, 90], [220, 150, 120], [350, 300, 100], [460, 210, 80], [555, 170, 120],
                 [690, 280, 90], [790, 200, 110], [910, 320, 90], [1010, 180, 120], [1140, 250, 150]];
      B.forEach(([x, h, w], i) => {
        const top = STREET - h;
        near.fillStyle(T.near, 1); near.fillRect(x, top, w, h);
        near.fillStyle(0xffffff, 0.06); near.fillRect(x, top, w * 0.28, h);                     // צד מואר
        near.fillStyle(T.win, T.night ? 0.9 : 0.55);
        for (let wy = top + 18; wy < STREET - 24; wy += 30) for (let wx = x + 12; wx < x + w - 16; wx += 22)
          if (((wx * 7 + wy * 3 + i) % 5) < 2) near.fillRect(wx, wy, 10, 14);
        if (i % 3 === 1) { near.fillStyle(T.near, 1); near.fillRect(x + w / 2 - 14, top - 30, 28, 30); near.fillTriangle(x + w / 2 - 18, top - 30, x + w / 2 + 18, top - 30, x + w / 2, top - 50); } // מיכל מים
        if (i % 4 === 3) { near.lineStyle(4, C.ink, 1); near.lineBetween(x + w / 2, top, x + w / 2, top - 44); }                                                                 // אנטנה
        near.lineStyle(5, C.ink, 1); near.strokeRect(x, top, w, h + 4);                             // קו דיו
    });
    });
    const beacon = scene.add.circle(915 + 45, STREET - 320 - 48, 7, C.red).setDepth(2);
    scene.tweens.add({ targets: beacon, alpha: 0.2, duration: 650, yoyo: true, repeat: -1 });

    /* 5.5 רחוב: מדרכה, שפה, כביש עם פסים — הכול בקווי דיו */
    bake(scene, tk + 'street', 4, st => {
      st.fillStyle(0xd9dde8, 1); st.fillRect(0, STREET, W, 56);                                   // מדרכה
      st.lineStyle(3, C.ink, 0.35); for (let x = 0; x < W; x += 80) st.lineBetween(x, STREET, x - 20, STREET + 56);
      st.fillStyle(0xb7bdcc, 1); st.fillRect(0, STREET + 56, W, 12);                             // שפת מדרכה
      st.fillStyle(0x3a4256, 1); st.fillRect(0, STREET + 68, W, H - STREET - 68);                 // כביש
      st.fillStyle(0xffd23c, 1); for (let x = 20; x < W; x += 120) st.fillRect(x, STREET + 112, 60, 8);
      st.lineStyle(6, C.ink, 1); st.lineBetween(0, STREET, W, STREET); st.lineBetween(0, STREET + 68, W, STREET + 68);
      halftone(st, 0, STREET + 70, W, H - STREET - 70, 0x000000, 0.12, 16, 2.6, 'down');
    });

    /* 5.6 גיבורות חולפות בשמיים מדי פעם */
    scene.time.addEvent({ delay: 7000, loop: true, callback: () => heroFlyBy(scene, 110 + Math.random() * 140, 1) });

    /* 5.7 וינייטה קולנועית */
    if (scene.textures.exists('vignette')) scene.add.image(W / 2, H / 2, 'vignette').setDisplaySize(W + 40, H + 40).setDepth(9).setAlpha(0.55);
    return { street: STREET };
  }

  /* ---------- פרק 6 — הנבל בלגנון (SVG מקורי) ---------- */
  function villainSVG() {
    const I = '#1b1036';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 300">' +
      /* גלימה עם בטנה ירוקה וסמל "?" */
      '<path d="M60 170 Q120 140 180 170 L214 286 Q120 300 26 286 Z" fill="#2fb36a" stroke="' + I + '" stroke-width="7" stroke-linejoin="round"/>' +
      '<path d="M84 180 L66 282 Q120 292 174 282 L156 180 Q120 166 84 180 Z" fill="#ffd23c" stroke="' + I + '" stroke-width="5" stroke-linejoin="round"/>' +
      '<circle cx="120" cy="226" r="24" fill="#ffd23c" stroke="' + I + '" stroke-width="5"/>' +
      '<text x="120" y="240" text-anchor="middle" font-family="Rubik, Arial" font-weight="900" font-size="38" fill="' + I + '">?</text>' +
      /* ידיים + שרביט עם כוכב */
      '<path d="M66 190 Q40 178 30 150" fill="none" stroke="' + I + '" stroke-width="16" stroke-linecap="round"/><path d="M66 190 Q40 178 30 150" fill="none" stroke="#2fb36a" stroke-width="9" stroke-linecap="round"/>' +
      '<path d="M26 150 L10 96" stroke="' + I + '" stroke-width="9" stroke-linecap="round"/><path d="M26 150 L10 96" stroke="#c98b56" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M10 70 L16 86 L32 88 L20 98 L24 114 L10 105 L-4 114 L0 98 L-12 88 L4 86 Z" transform="translate(4 0)" fill="#ffd23c" stroke="' + I + '" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M174 190 Q204 184 212 160" fill="none" stroke="' + I + '" stroke-width="16" stroke-linecap="round"/><path d="M174 190 Q204 184 212 160" fill="none" stroke="#2fb36a" stroke-width="9" stroke-linecap="round"/>' +
      '<circle cx="212" cy="156" r="11" fill="#ffe2c6" stroke="' + I + '" stroke-width="4"/>' +
      /* ראש: פנים, גבות שובבות, חיוך ערמומי */
      '<circle cx="120" cy="128" r="44" fill="#ffe2c6" stroke="' + I + '" stroke-width="7"/>' +
      '<path d="M88 112 L108 120 M152 112 L132 120" stroke="' + I + '" stroke-width="6" stroke-linecap="round"/>' +
      '<circle cx="104" cy="128" r="7" fill="' + I + '"/><circle cx="136" cy="128" r="7" fill="' + I + '"/><circle cx="106" cy="126" r="2.4" fill="#fff"/><circle cx="138" cy="126" r="2.4" fill="#fff"/>' +
      '<path d="M98 146 Q120 166 144 144 Q122 154 98 146 Z" fill="#fff" stroke="' + I + '" stroke-width="5" stroke-linejoin="round"/>' +
      '<circle cx="92" cy="144" r="7" fill="#ff9e8a" opacity=".6"/><circle cx="150" cy="144" r="7" fill="#ff9e8a" opacity=".6"/>' +
      /* כובע קוסם עקום עם כוכבים ו"?" */
      '<path d="M70 98 Q120 80 170 98 L150 104 Q120 96 90 104 Z" fill="#16753f" stroke="' + I + '" stroke-width="6" stroke-linejoin="round"/>' +
      '<path d="M88 100 Q100 40 150 10 Q140 50 152 100 Z" fill="#2fb36a" stroke="' + I + '" stroke-width="7" stroke-linejoin="round"/>' +
      '<circle cx="150" cy="12" r="9" fill="#ffd23c" stroke="' + I + '" stroke-width="4"/>' +
      '<text x="120" y="84" text-anchor="middle" font-family="Rubik, Arial" font-weight="900" font-size="26" fill="#ffd23c" stroke="' + I + '" stroke-width="1.5">?</text>' +
      '</svg>';
  }
  /* loadSVG — טוען מחרוזת SVG כטקסטורה (cb נקרא בכל מקרה, גם בכישלון) */
  function loadSVG(scene, key, svg, w, h, cb) {
    if (scene.textures.exists(key)) { if (cb) cb(); return; }
    const img = new Image();
    img.onload = () => { if (!scene.textures.exists(key)) scene.textures.addImage(key, img); if (cb) cb(); };
    img.onerror = () => { if (cb) cb(); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace('<svg ', '<svg width="' + w + '" height="' + h + '" '));
  }

  return { C, bake, halftone, burst, burstPoints, speedLines, panelFrame, title, sfx, caption, balloon, flash, heroFlyBy, city, theme, THEMES, villainSVG, loadSVG };
})();
window.Comic = Comic;
