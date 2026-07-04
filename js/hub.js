/* ===== העולם של אלה — מסך הבית (Hub) =====
   דף עצמאי: Phaser + audio.js + kids-ui.js בלבד (בלי שאר קבצי משחק העגלה).
   שלושה כרטיסי משחק ענקיים, רקע חי בסגנון world.js, ברכת קול.            */

const DESIGN = { w: 1280, h: 800 };

const HubPalette = {
  pink:0xff7eb9, pinkD:0xff5ca8, yellow:0xffd24c, mint:0x7ee8c0,
  ink:0x5a3d5c, white:0xffffff, hillFar:0xbdf0a0, hillNear:0x8fd86a, sun:0xfff2a8,
  sky:0x9adcf5, purple:0xb28dff
};

/* הגדרת שלושת המשחקים */
const HUB_GAMES = [
  { key:'cart',     url:'./cart.html',     name:'העגלה של אלה',  say:'העגלה של אלה!', emoji:'🛒', art:'food_burger', color:0xff7eb9 },
  { key:'coloring', url:'./coloring.html', name:'ציור קסם',      say:'ציור קסם!',     emoji:'🎨', art:null,          color:0xb28dff },
  { key:'balloons', url:'./balloons.html', name:'בלונים',        say:'בלונים!',       emoji:'🎈', art:null,          color:0x7ee8c0 }
];

class HubScene extends Phaser.Scene {
  constructor() { super('Hub'); }

  preload() {
    // טקסטורות בסיס בקוד — אותו סגנון כמו BootScene של העגלה
    let g = this.make.graphics({ x:0, y:0, add:false });
    g.fillStyle(0xffffff, 1); g.fillCircle(8, 8, 8);
    g.generateTexture('spark', 16, 16); g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(45, 55, 35); g.fillCircle(90, 45, 45);
    g.fillCircle(140, 55, 38); g.fillCircle(95, 70, 40);
    g.fillRoundedRect(20, 55, 150, 35, 18);
    g.generateTexture('cloud', 190, 100); g.clear();
    g.destroy();
    this.makeRadial('glowSoft', 256, [[0,'rgba(255,255,255,1)'],[0.35,'rgba(255,255,255,0.55)'],[1,'rgba(255,255,255,0)']]);
    this.makeRadial('shadowSoft', 256, [[0,'rgba(38,22,44,0.5)'],[0.55,'rgba(38,22,44,0.3)'],[1,'rgba(38,22,44,0)']]);

    this.load.svg('ella', 'assets/art/ella.svg', { width: 240, height: 264 });
    this.load.svg('food_burger', 'assets/art/food_burger.svg', { width: 150, height: 150 });
  }

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

  create() {
    const W = DESIGN.w, H = DESIGN.h;

    /* ----- רקע חי: גבעות, שמש, עננים ----- */
    const bg = this.add.graphics();
    bg.fillStyle(HubPalette.hillFar, 1);  bg.fillEllipse(W*0.22, H+40, W*1.1, 460);
    bg.fillStyle(HubPalette.hillNear, 1); bg.fillEllipse(W*0.85, H+80, W*1.0, 420);

    // שמש עם קרניים מסתובבות
    const sun = this.add.container(W - 150, 130);
    const rays = this.add.graphics();
    rays.fillStyle(HubPalette.sun, 0.5);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      rays.fillTriangle(
        Math.cos(a) * 66, Math.sin(a) * 66,
        Math.cos(a + 0.14) * 108, Math.sin(a + 0.14) * 108,
        Math.cos(a - 0.14) * 108, Math.sin(a - 0.14) * 108
      );
    }
    const disk = this.add.circle(0, 0, 62, HubPalette.sun);
    const face = this.add.text(0, 0, '😊', { fontSize: '52px' }).setOrigin(0.5);
    sun.add([rays, disk, face]);
    this.tweens.add({ targets: rays, angle: 360, duration: 24000, repeat: -1 });

    // עננים נסחפים
    for (let i = 0; i < 3; i++) {
      const c = this.add.image(Phaser.Math.Between(0, W), 90 + i * 75, 'cloud')
        .setAlpha(0.85).setScale(0.7 + i * 0.25);
      this.tweens.add({
        targets: c, x: '+=' + (W + 300), duration: Phaser.Math.Between(40000, 70000),
        repeat: -1, onRepeat: () => { c.x = -220; }
      });
    }

    /* ----- כותרת ----- */
    const title = this.add.text(W/2, 92, 'העולם של אלה', {
      fontFamily: 'Varela Round, Heebo, sans-serif', fontSize: '76px',
      color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);
    title.setShadow(0, 5, 'rgba(90,61,92,0.45)', 8);
    this.tweens.add({ targets: title, scale: 1.04, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    // נצנוץ כוכבים סביב הכותרת
    this.time.addEvent({ delay: 700, loop: true, callback: () => {
      const s = this.add.image(W/2 + Phaser.Math.Between(-330, 330), 92 + Phaser.Math.Between(-46, 46), 'spark')
        .setScale(0).setTint(0xfff2a8);
      this.tweens.add({ targets: s, scale: Phaser.Math.FloatBetween(0.5, 1.2), alpha: 0,
        duration: 900, ease: 'Cubic.out', onComplete: () => s.destroy() });
    }});

    /* ----- אלה מנופפת ----- */
    const ella = this.add.image(150, H - 210, 'ella').setScale(1.15);
    this.add.image(150, H - 80, 'shadowSoft').setDisplaySize(230, 60);
    this.tweens.add({ targets: ella, y: '-=14', angle: 2, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    /* ----- שלושת כרטיסי המשחק ----- */
    const cardW = 264, cardH = 320, gap = 46;
    const total = HUB_GAMES.length * cardW + (HUB_GAMES.length - 1) * gap;
    const startX = W/2 - total/2 + cardW/2 + 70;   // הסטה קלה ימינה — אלה עומדת משמאל
    HUB_GAMES.forEach((game, i) => {
      const card = this.makeCard(startX + i * (cardW + gap), H/2 + 60, cardW, cardH, game);
      // כניסה קופצנית מדורגת
      card.setScale(0);
      this.tweens.add({ targets: card, scale: 1, delay: 250 + i * 150, duration: 500, ease: 'Back.out' });
      // ריחוף עדין מדורג
      this.tweens.add({ targets: card, y: '-=12', duration: 1900 + i * 250, yoyo: true, repeat: -1,
        ease: 'Sine.inOut', delay: 800 + i * 300 });
    });

    /* ----- ברכת קול במגע ראשון (audio unlock) ----- */
    this.input.once('pointerdown', () => {
      Sound.unlock();
      Voice.say('שלום אלה! למה נשחק היום?');
    });

    // ניקוי מחוות
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('gesturestart', e => e.preventDefault());
  }

  /* כרטיס משחק גדול: צל, גוף מעוגל עם גרדיאנט, אייקון ענק, שם */
  makeCard(x, y, w, h, game) {
    const c = this.add.container(x, y);
    const dark = Phaser.Display.Color.IntegerToColor(game.color).darken(20).color;
    const light = Phaser.Display.Color.IntegerToColor(game.color).lighten(22).color;

    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.20); g.fillRoundedRect(-w/2 + 6, -h/2 + 14, w, h, 34);    // צל
    g.fillStyle(dark, 1); g.fillRoundedRect(-w/2, -h/2 + 6, w, h, 34);                 // שוליים
    g.fillGradientStyle(light, light, game.color, game.color, 1);
    g.fillRoundedRect(-w/2, -h/2, w, h, 34);                                           // פנים
    g.fillStyle(0xffffff, 0.30); g.fillRoundedRect(-w/2 + 14, -h/2 + 12, w - 28, h * 0.30, 22); // ברק
    c.add(g);

    // הילה מאחורי האייקון
    const halo = this.add.image(0, -34, 'glowSoft').setDisplaySize(190, 190).setAlpha(0.6);
    halo.setBlendMode(Phaser.BlendModes.ADD);
    c.add(halo);

    // אייקון: איור SVG אם הוגדר, אחרת אימוג'י ענק
    let icon;
    if (game.art && this.textures.exists(game.art)) {
      icon = this.add.image(0, -34, game.art).setDisplaySize(150, 150);
    } else {
      icon = this.add.text(0, -34, game.emoji, { fontSize: '118px' }).setOrigin(0.5);
    }
    c.add(icon);
    this.tweens.add({ targets: icon, angle: { from: -4, to: 4 }, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    // שם המשחק
    const label = this.add.text(0, h/2 - 62, game.name, {
      fontFamily: 'Varela Round, Heebo, sans-serif', fontSize: '38px',
      color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);
    label.setShadow(0, 3, 'rgba(0,0,0,0.3)', 4);
    c.add(label);

    // אינטראקציה — hit-area לקונטיינר חייב להתחיל מ-(0,0) (Phaser מוסיף displayOrigin)
    c.setSize(w, h);
    c.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
    c.on('pointerdown', () => {
      Sound.happy();
      Voice.say(game.say);
      this.tweens.add({ targets: c, scale: 1.12, duration: 120, yoyo: true, ease: 'Quad.out',
        onComplete: () => KidsUI.PageFade.go(game.url) });
      // התזת ניצוצות מהכרטיס
      for (let i = 0; i < 14; i++) {
        const s = this.add.image(c.x + Phaser.Math.Between(-w/2, w/2), c.y + Phaser.Math.Between(-h/2, h/2), 'spark')
          .setTint(game.color).setScale(Phaser.Math.FloatBetween(0.4, 1));
        this.tweens.add({ targets: s, y: '-=' + Phaser.Math.Between(40, 130),
          alpha: 0, duration: 600, ease: 'Cubic.out', onComplete: () => s.destroy() });
      }
    });
    return c;
  }
}

/* ---------- הרצה ---------- */
window.addEventListener('DOMContentLoaded', function () {
  const config = {
    type: Phaser.AUTO,
    transparent: true,
    parent: 'game',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: DESIGN.w, height: DESIGN.h
    },
    scene: [HubScene],
    render: { antialias: true, roundPixels: false }
  };
  window.gameInstance = new Phaser.Game(config);
});
