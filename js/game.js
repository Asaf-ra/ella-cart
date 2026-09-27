/* ===== העגלה של אלה — גרסת מנוע Phaser 3 ===== */
/* קונפיג, טעינה, יצירת טקסטורות בקוד, והרצת המשחק */

const DESIGN = { w: 1280, h: 800 };

const Palette = {
  pink:0xff7eb9, pinkD:0xff5ca8, yellow:0xffd24c, mint:0x7ee8c0,
  ink:0x5a3d5c, white:0xffffff, grassFar:0x9be08a, grassNear:0x6fd06a,
  hillFar:0xbdf0a0, hillNear:0x8fd86a, sun:0xfff2a8, gold:0xf5b301
};

/* ---------- עוזרים גלובליים (נקראים בזמן ריצה) ---------- */
const Helper = {
  // הוספת זוהר (רק ב-WebGL; לא שובר ב-Canvas)
  glow(scene, obj, color, strength) {
    try {
      if (scene.renderer && scene.renderer.type === Phaser.WEBGL && obj.postFX)
        return obj.postFX.addGlow(color == null ? 0xffffff : color, strength || 4);
    } catch (e) {}
    return null;
  },

  // הצללה רכה מתחת לאובייקט (תלת-ממד)
  shadowEl(scene, x, y, w, h) {
    return Helper.softShadow(scene, x, y, w, h);
  },

  // צל רך מדורג (גרדיאנט רדיאלי) — נראה תלת-ממדי הרבה יותר מאליפסה שטוחה
  softShadow(scene, x, y, w, h) {
    if (scene.textures.exists('shadowSoft')) {
      const s = scene.add.image(x, y, 'shadowSoft');
      s.setDisplaySize(w * 1.6, h * 1.9);
      return s;
    }
    return scene.add.ellipse(x, y, w, h, 0x000000, 0.18);
  },

  // הילת זוהר רכה (בלום) — להוספת אור/קסם מאחורי אובייקט
  bloom(scene, x, y, size, color, alpha) {
    if (!scene.textures.exists('glowSoft')) return null;
    const b = scene.add.image(x, y, 'glowSoft').setDisplaySize(size, size);
    b.setBlendMode(Phaser.BlendModes.ADD).setTint(color == null ? 0xffffff : color);
    if (alpha != null) b.setAlpha(alpha);
    return b;
  },

  // כפתור עגול תלת-ממדי עם אמוג'י + מיץ לחיצה
  circleBtn(scene, x, y, emoji, r, onTap) {
    const c = scene.add.container(x, y);
    const g = scene.add.graphics();
    /* סגנון "גיבורים 2026": נייר בהיר, מסגרת דיו עבה וצל קומיקס קשיח */
    g.fillStyle(0x1b1036, 1); g.fillCircle(0, 5, r + 3);                      // צל קומיקס קשיח
    g.fillStyle(0x1b1036, 1); g.fillCircle(0, 0, r + 3);                      // מסגרת דיו
    g.fillGradientStyle(0xfffaf0, 0xfffaf0, 0xffe9c7, 0xffe9c7, 1);
    g.fillCircle(0, 0, r - 2);                                                // פני הכפתור
    g.fillStyle(0xffffff, 0.7); g.fillEllipse(0, -r * 0.45, r * 1.1, r * 0.5); // ברק עליון
    const t = scene.add.text(0, 0, emoji, { fontSize: (r * 1.05) + 'px' }).setOrigin(0.5);
    c.add([g, t]);
    c.setSize(r * 2, r * 2);
    c.setInteractive(new Phaser.Geom.Circle(0, 0, r), Phaser.Geom.Circle.Contains);
    c.on('pointerdown', () => {
      Sound.tap();
      scene.tweens.add({ targets: c, scale: 0.85, duration: 70, yoyo: true });
      if (onTap) onTap();
    });
    return c;
  },

  // כפתור גלולה תלת-ממדי עם טקסט
  pillBtn(scene, x, y, label, color, onTap) {
    const c = scene.add.container(x, y);
    const w = Math.max(220, label.length * 26 + 120), h = 96;
    const dark = Phaser.Display.Color.IntegerToColor(color).darken(22).color;
    const light = Phaser.Display.Color.IntegerToColor(color).lighten(18).color;
    const g = scene.add.graphics();
    g.fillStyle(0x1b1036, 1); g.fillRoundedRect(-w/2 - 5, -h/2 + 3, w + 10, h + 10, (h + 10)/2); // צל קומיקס קשיח
    g.fillStyle(0x1b1036, 1); g.fillRoundedRect(-w/2 - 5, -h/2 - 5, w + 10, h + 10, (h + 10)/2); // מסגרת דיו
    g.fillStyle(dark, 1); g.fillRoundedRect(-w/2, -h/2 + 4, w, h - 4, h/2);        // שוליים תחתונים
    g.fillGradientStyle(light, light, color, color, 1); g.fillRoundedRect(-w/2, -h/2, w, h - 6, h/2); // פנים
    g.fillStyle(0xffffff, 0.35); g.fillRoundedRect(-w/2 + 14, -h/2 + 7, w - 28, h * 0.34, h * 0.17); // ברק
    const t = scene.add.text(0, 0, label, { fontFamily:'Rubik, Varela Round, Heebo, sans-serif',
      fontSize:'42px', color:'#ffffff', fontStyle:'900' }).setOrigin(0.5);
    t.setStroke('#1b1036', 7); t.setShadow(2, 3, '#1b1036', 0, true, true);
    c.add([g, t]);
    c.setSize(w, h);
    c.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains); // hit-area לקונטיינר נבדק אחרי הוספת displayOrigin (w/2,h/2) — חייב להתחיל מ-(0,0)
    c.on('pointerdown', () => {
      Sound.tap();
      scene.tweens.add({ targets: c, scale: 0.92, duration: 70, yoyo: true });
      if (onTap) onTap();
    });
    c._label = t;
    return c;
  },

  txt(scene, x, y, s, size, color) {
    return scene.add.text(x, y, s, { fontFamily:'Rubik, Varela Round, Heebo, sans-serif',
      fontSize: size + 'px', color: color || '#1b1036', fontStyle:'900' }).setOrigin(0.5);
  },

  // אייקון מאכל: תמונה מצוירת אם קיימת, אחרת אמוג'י (נפילה חכמה)
  foodIcon(scene, x, y, foodKey, displaySize) {
    const key = 'food_' + foodKey;
    if (scene.textures.exists(key)) {
      const im = scene.add.image(x, y, key); im.setDisplaySize(displaySize, displaySize); return im;
    }
    return scene.add.text(x, y, G.FOODS[foodKey].emoji, { fontSize: Math.round(displaySize * 0.9) + 'px' }).setOrigin(0.5);
  },

  // תמונת דמות בגובה רצוי; null אם אין טקסטורה
  charImg(scene, x, y, key, displayH) {
    if (!scene.textures.exists(key)) return null;
    const im = scene.add.image(x, y, key);
    im.setScale(displayH / im.height);
    return im;
  },

  // אייקון מרכיב לפי אמוג'י: תמונה מצוירת אם יש, אחרת אמוג'י. מחזיר אובייקט עם _base (סקייל בסיס)
  icon(scene, x, y, emoji, size) {
    const key = EMOJI_ART[emoji];
    if (key && scene.textures.exists(key)) {
      const im = scene.add.image(x, y, key); im.setScale(size / im.width); im._base = im.scaleX; return im;
    }
    const t = scene.add.text(x, y, emoji, { fontSize: Math.round(size * 0.95) + 'px' }).setOrigin(0.5);
    t._base = 1; return t;
  }
};

// מיפוי אמוג'י → טקסטורת איור מצוירת (משותף לכל הקבצים)
const EMOJI_ART = {
  '🍞':'ing_bun_bottom', '🍔':'ing_bun_top', '🥩':'ing_patty', '🧀':'ing_cheese', '🥬':'ing_lettuce',
  '🍅':'ing_tomato', '🥒':'ing_cucumber', '🧅':'ing_onion',
  '🍓':'ing_straw', '🍫':'ing_choc', '🍦':'ing_vanilla', '🫐':'ing_blue',
  '🍒':'ing_cherry', '⭐':'star', '🍄':'ing_mushroom', '🫑':'ing_pepper', '🫒':'ing_olive', '🍍':'ing_pineapple'
};

/* ---------- סצנת טעינה: יצירת טקסטורות בקוד ---------- */
class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    // נקודה לבנה לחלקיקים
    let g = this.make.graphics({ x:0, y:0, add:false });
    g.fillStyle(0xffffff, 1); g.fillCircle(16, 16, 16);
    g.generateTexture('dot', 32, 32); g.clear();

    // ניצוץ קטן
    g.fillStyle(0xffffff, 1); g.fillCircle(8, 8, 8);
    g.generateTexture('spark', 16, 16); g.clear();

    // מטבע זהב
    g.fillStyle(0xffffff, 0.0); g.fillRect(0,0,40,40);
    g.fillStyle(0xf5b301, 1); g.fillCircle(20, 20, 18);
    g.fillStyle(0xffe27a, 1); g.fillCircle(20, 20, 12);
    g.generateTexture('coin', 40, 40); g.clear();

    // ענן
    g.fillStyle(0xffffff, 1);
    g.fillCircle(45, 55, 35); g.fillCircle(90, 45, 45);
    g.fillCircle(140, 55, 38); g.fillCircle(95, 70, 40);
    g.fillRoundedRect(20, 55, 150, 35, 18);
    g.generateTexture('cloud', 190, 100); g.clear();

    // כוכב
    this.starTexture(g);

    // לב
    g.clear();
    g.fillStyle(0xff5ca8, 1);
    g.fillCircle(14, 14, 12); g.fillCircle(34, 14, 12);
    g.fillTriangle(2, 18, 46, 18, 24, 46);
    g.generateTexture('heart', 48, 48); g.clear();

    // פתית גבינה מגוררת
    g.fillStyle(0xffd24c, 1); g.fillRoundedRect(0, 4, 30, 9, 4);
    g.fillStyle(0xffe27a, 1); g.fillRoundedRect(2, 5, 22, 4, 2);
    g.generateTexture('shred', 32, 16); g.clear();

    g.destroy();

    // ----- מראה פרימיום: טקסטורות גרדיאנט רדיאלי (זוהר רך, צל רך, וינייטה) -----
    this.makeRadial('glowSoft', 256, [[0,'rgba(255,255,255,1)'],[0.35,'rgba(255,255,255,0.55)'],[1,'rgba(255,255,255,0)']]);
    this.makeRadial('shadowSoft', 256, [[0,'rgba(38,22,44,0.5)'],[0.55,'rgba(38,22,44,0.3)'],[1,'rgba(38,22,44,0)']]);
    this.makeRadial('vignette', 512, [[0,'rgba(30,14,38,0)'],[0.62,'rgba(30,14,38,0)'],[1,'rgba(30,14,38,0.55)']]);
    // כתם רוטב רך — נמרח חלק במקום נקודות קשות
    this.makeRadial('sauceDab', 128, [[0,'rgba(206,42,38,0.92)'],[0.5,'rgba(216,54,40,0.62)'],[1,'rgba(216,54,40,0)']]);

    // טעינת אומנות וקטורית מצוירת (SVG) — דמויות, מאכלים ומרכיבים
    ['ella','cust_girl','cust_boy','cust_bunny','cust_bear','cust_cat','cust_panda',
     'cust_dog','cust_fox','cust_frog','cust_penguin','cust_pig','cust_mouse']
      .forEach(k => this.load.svg(k, 'assets/art/' + k + '.svg', { width: 240, height: 264 }));
    ['food_shake','food_burger','food_pizza','food_donut','food_pancake']
      .forEach(k => this.load.svg(k, 'assets/art/' + k + '.svg', { width: 150, height: 150 }));
    ['ing_bun_top','ing_bun_bottom','ing_patty','ing_cheese','ing_lettuce','ing_tomato','ing_cucumber','ing_onion',
     'ing_straw','ing_choc','ing_vanilla','ing_blue','ing_cherry','ing_mushroom','ing_pepper','ing_olive','ing_pineapple']
      .forEach(k => this.load.svg(k, 'assets/art/' + k + '.svg', { width: 128, height: 128 }));
  }

  // יוצר טקסטורת גרדיאנט רדיאלי מתוך רשימת עצירות צבע
  makeRadial(key, size, stops) {
    if (this.textures.exists(key)) return;
    const tex = this.textures.createCanvas(key, size, size);
    if (!tex) return;
    const ctx = (typeof tex.getContext === 'function') ? tex.getContext() : tex.context;
    if (!ctx) return;
    const r = size / 2;
    const grd = ctx.createRadialGradient(r, r, 0, r, r, r);
    stops.forEach(s => grd.addColorStop(s[0], s[1]));
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, size, size);
    tex.refresh();
  }

  starTexture(g) {
    g.clear();
    g.fillStyle(0xffe27a, 1);
    const cx = 32, cy = 32, spikes = 5, outer = 28, inner = 12;
    let rot = -Math.PI / 2;
    const step = Math.PI / spikes;
    const pts = [];
    for (let i = 0; i < spikes; i++) {
      pts.push(new Phaser.Geom.Point(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer)); rot += step;
      pts.push(new Phaser.Geom.Point(cx + Math.cos(rot) * inner, cy + Math.sin(rot) * inner)); rot += step;
    }
    g.fillPoints(pts, true);
    g.generateTexture('star', 64, 64);
  }

  /* create — לפני המשחק: יוצרים טקסטורה של אלה גיבורת-העל מהתחפושת השמורה (HeroAvatar),
     ורק אז עוברים למסך הפתיחה. אם משהו נכשל — ממשיכים עם אלה הרגילה אחרי זמן קצוב. */
  create() {
    let started = false;
    const go = () => { if (!started) { started = true; this.scene.start('Title'); } };
    try {
      if (window.HeroAvatar) {
        const outfit = window.HeroRewards ? HeroRewards.outfit : null;
        const svg = HeroAvatar.svg(outfit).replace('<svg ', '<svg width="360" height="450" ');
        const img = new Image();
        img.onload = () => { if (!this.textures.exists('ella_hero')) this.textures.addImage('ella_hero', img); go(); };
        img.onerror = go;
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
        setTimeout(go, 1500);
        return;
      }
    } catch (e) {}
    go();
  }
}

/* ---------- הרצה ---------- */
window.addEventListener('DOMContentLoaded', function () {
  G.applyCosmetics();
  if (!G.soundOn) Sound.toggle();      // מסנכרן מצב סאונד שמור (ברירת מחדל: דלוק)

  const config = {
    type: Phaser.AUTO,
    transparent: true,            // הרקע מגיע מ-CSS (גרדיאנט שמיים) — מסך נקי בלי letterbox
    parent: 'game',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: DESIGN.w, height: DESIGN.h
    },
    scene: [BootScene, TitleScene, WorldScene, MiniGameScene, StoreScene],
    render: { antialias: true, roundPixels: false }
  };

  window.gameInstance = new Phaser.Game(config);

  // טעינת-רקע עצלה של מנוע ה-3D — המשחק נפתח מיד; Babylon מוכן עד ההגשה הראשונה
  setTimeout(function () { try { Hero3D.preload(); } catch (e) {} }, 1500);

  // ניקוי מחוות/בחירה
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('gesturestart', e => e.preventDefault());
});
