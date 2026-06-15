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
  // כפתור עגול עם אמוג'י + מיץ לחיצה
  circleBtn(scene, x, y, emoji, r, onTap) {
    const c = scene.add.container(x, y);
    const g = scene.add.graphics();
    g.fillStyle(0x000000, 0.12); g.fillCircle(0, 6, r);
    g.fillStyle(Palette.white, 1); g.fillCircle(0, 0, r);
    const t = scene.add.text(0, 0, emoji, { fontSize: (r * 1.1) + 'px' }).setOrigin(0.5);
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

  // כפתור גלולה עם טקסט (הגשה / שחקו)
  pillBtn(scene, x, y, label, color, onTap) {
    const c = scene.add.container(x, y);
    const w = Math.max(220, label.length * 26 + 120), h = 96;
    const g = scene.add.graphics();
    g.fillStyle(0x000000, 0.18); g.fillRoundedRect(-w/2, -h/2 + 8, w, h, h/2);
    g.fillStyle(color, 1); g.fillRoundedRect(-w/2, -h/2, w, h, h/2);
    const t = scene.add.text(0, 0, label, { fontFamily:'Varela Round, Heebo, sans-serif',
      fontSize:'42px', color:'#ffffff', fontStyle:'bold' }).setOrigin(0.5);
    c.add([g, t]);
    c.setSize(w, h);
    c.setInteractive(new Phaser.Geom.Rectangle(-w/2, -h/2, w, h), Phaser.Geom.Rectangle.Contains);
    c.on('pointerdown', () => {
      Sound.tap();
      scene.tweens.add({ targets: c, scale: 0.92, duration: 70, yoyo: true });
      if (onTap) onTap();
    });
    c._label = t;
    return c;
  },

  txt(scene, x, y, s, size, color) {
    return scene.add.text(x, y, s, { fontFamily:'Varela Round, Heebo, sans-serif',
      fontSize: size + 'px', color: color || '#5a3d5c', fontStyle:'bold' }).setOrigin(0.5);
  }
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

    g.destroy();
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

  create() { this.scene.start('Title'); }
}

/* ---------- הרצה ---------- */
window.addEventListener('DOMContentLoaded', function () {
  G.applyCosmetics();

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

  // ניקוי מחוות/בחירה
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('gesturestart', e => e.preventDefault());
});
