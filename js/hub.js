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
  { key:'learning', url:'./learning.html', name:'איזור למידה',    say:'איזור למידה!',   emoji:'📚', art:null,          color:0x7cc7ff },
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

    // קשת בענן רכה מאחורי הכרטיסים
    const rainbow = this.add.graphics().setDepth(0);
    [0xff5ca8, 0xff8a4c, 0xffd24c, 0x6fd06a, 0x7ec8ff, 0xb28dff].forEach((col, i) => {
      rainbow.lineStyle(18, col, 0.30);
      rainbow.beginPath();
      rainbow.arc(W/2 + 70, H + 330, 650 - i * 18, Math.PI * 1.14, Math.PI * 1.86, false);
      rainbow.strokePath();
    });

    // פרפרים מרחפים
    const fly = (delay) => {
      const b = this.add.text(-60, Phaser.Math.Between(170, 400), '🦋', { fontSize: '40px' }).setDepth(3);
      this.tweens.add({ targets: b, angle: { from: -16, to: 16 }, duration: 240, yoyo: true, repeat: -1 });
      this.tweens.add({ targets: b, x: W + 80, duration: Phaser.Math.Between(15000, 22000), delay,
        onUpdate: (tw) => { b.y += Math.sin(tw.progress * 22) * 1.3; },
        onComplete: () => { b.destroy(); fly(Phaser.Math.Between(3000, 9000)); } });
    };
    fly(1200); fly(7000);

    // כוכב נופל מדי פעם — נגיעת קסם
    this.time.addEvent({ delay: 9000, loop: true, callback: () => {
      const x0 = Phaser.Math.Between(260, W - 80);
      const star = this.add.image(x0, 50, 'spark').setTint(0xfff2a8).setScale(1.4).setDepth(1);
      for (let i = 0; i < 5; i++) {
        const tr = this.add.image(x0, 50, 'spark').setTint(0xfff2a8).setScale(0.7 - i * 0.12).setDepth(1);
        this.tweens.add({ targets: tr, x: x0 - 200 - i * 14, y: 190 + i * 12, alpha: 0,
          duration: 800, delay: i * 45, ease: 'Quad.in', onComplete: () => tr.destroy() });
      }
      this.tweens.add({ targets: star, x: x0 - 260, y: 230, alpha: 0, duration: 850, ease: 'Quad.in',
        onComplete: () => star.destroy() });
    }});

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

    /* ----- ארנק: מונה מטבעות (משותף לכל המשחקים) ----- */
    const cg = this.make.graphics({ x: 0, y: 0, add: false });
    cg.fillStyle(0xf5b301, 1); cg.fillCircle(20, 20, 18);
    cg.fillStyle(0xffe27a, 1); cg.fillCircle(20, 20, 12);
    cg.generateTexture('coin', 40, 40); cg.destroy();
    this.add.image(150, 54, 'coin').setDepth(20);
    this.coinText = this.add.text(178, 54, '' + Wallet.coins, {
      fontFamily: 'Varela Round, Heebo, sans-serif', fontSize: '40px', color: '#e09b00', fontStyle: 'bold'
    }).setOrigin(0, 0.5).setDepth(20);
    this.coinText.setShadow(0, 2, 'rgba(255,255,255,0.85)', 3);

    /* ----- כפתור עגלת השדרוגים — זהב, פועם ----- */
    const shopBtn = this.add.container(W - 110, H - 100).setDepth(20);
    const sg = this.add.graphics();
    sg.fillStyle(0x000000, 0.2); sg.fillCircle(4, 10, 58);
    sg.fillStyle(0xb37c00, 1); sg.fillCircle(0, 5, 58);
    sg.fillGradientStyle(0xffd75e, 0xffd75e, 0xf5a800, 0xf5a800, 1); sg.fillCircle(0, 0, 58);
    sg.fillStyle(0xffffff, 0.4); sg.fillEllipse(0, -24, 74, 30);
    const si = this.add.text(0, -6, '🛒', { fontSize: '54px' }).setOrigin(0.5);
    const sl = this.add.text(0, 38, 'שדרוגים', {
      fontFamily: 'Varela Round, Heebo, sans-serif', fontSize: '20px', color: '#7a5200', fontStyle: 'bold'
    }).setOrigin(0.5);
    shopBtn.add([sg, si, sl]);
    shopBtn.setSize(120, 120);
    shopBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 120, 120), Phaser.Geom.Rectangle.Contains);
    this.tweens.add({ targets: shopBtn, scale: 1.07, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    shopBtn.on('pointerdown', () => { Sound.tap(); Voice.say('עגלת השדרוגים!'); this.openShop(); });

    /* ----- ברכת קול במגע ראשון (audio unlock) ----- */
    this.input.once('pointerdown', () => {
      Sound.unlock();
      Voice.say('שלום אלה! למה נשחק היום?');
    });

    // ניקוי מחוות
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('gesturestart', e => e.preventDefault());
  }

  /* ============ עגלת השדרוגים ============ */
  openShop() {
    if (this.shopUI) { this.shopUI.setVisible(true); this.refreshShop(); return; }
    const W = DESIGN.w, H = DESIGN.h;
    const ui = this.add.container(0, 0).setDepth(100);
    this.shopUI = ui;

    // עמעום מלא — חוסם לחיצות על מה שמתחת
    const dim = this.add.rectangle(W/2, H/2, W, H, 0x241030, 0.62).setInteractive();
    ui.add(dim);

    // לוח החנות
    const pg = this.add.graphics();
    pg.fillStyle(0x000000, 0.25); pg.fillRoundedRect(W/2 - 490, H/2 - 264, 980, 552, 40);
    pg.fillStyle(0xfff6fc, 1); pg.fillRoundedRect(W/2 - 490, H/2 - 272, 980, 552, 40);
    pg.fillStyle(0xffe9f5, 1); pg.fillRoundedRect(W/2 - 490, H/2 - 272, 980, 92, { tl: 40, tr: 40, bl: 0, br: 0 });
    ui.add(pg);
    const title = this.add.text(W/2, H/2 - 226, '🛒 עגלת השדרוגים', {
      fontFamily: 'Varela Round, Heebo, sans-serif', fontSize: '46px', color: '#ff5ca8', fontStyle: 'bold'
    }).setOrigin(0.5);
    ui.add(title);

    // יתרה בתוך החנות
    ui.add(this.add.image(W/2 - 420, H/2 - 226, 'coin'));
    this.shopCoinText = this.add.text(W/2 - 392, H/2 - 226, '' + Wallet.coins, {
      fontFamily: 'Varela Round, Heebo, sans-serif', fontSize: '38px', color: '#e09b00', fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    ui.add(this.shopCoinText);

    // כפתור סגירה
    const close = this.add.container(W/2 + 430, H/2 - 226);
    const cgr = this.add.graphics();
    cgr.fillStyle(0xff5ca8, 1); cgr.fillCircle(0, 0, 34);
    cgr.fillStyle(0xffffff, 0.35); cgr.fillEllipse(0, -12, 44, 20);
    close.add([cgr, this.add.text(0, 0, '✖', { fontSize: '30px', color: '#fff' }).setOrigin(0.5)]);
    close.setSize(68, 68).setInteractive(new Phaser.Geom.Rectangle(0, 0, 68, 68), Phaser.Geom.Rectangle.Contains);
    close.on('pointerdown', () => { Sound.tap(); ui.setVisible(false); });
    ui.add(close);

    // כרטיסי שדרוג — רשת 3×2
    this.shopCards = [];
    const items = Wallet.ITEMS, cw = 296, ch = 212, gapX = 20, gapY = 22;
    const sx = W/2 - (3 * cw + 2 * gapX) / 2 + cw/2;
    items.forEach((item, i) => {
      const col = i % 3, row = (i / 3) | 0;
      const card = this.buildShopCard(item, sx + col * (cw + gapX), H/2 - 66 + row * (ch + gapY), cw, ch);
      ui.add(card);
      this.shopCards.push(card);
    });
    this.refreshShop();

    // כניסה קופצנית
    ui.setScale(0.85).setAlpha(0);
    this.tweens.add({ targets: ui, scale: 1, alpha: 1, duration: 260, ease: 'Back.out' });
  }

  buildShopCard(item, x, y, w, h) {
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.10); g.fillRoundedRect(-w/2 + 4, -h/2 + 8, w, h, 22);
    g.fillStyle(0xffffff, 1); g.fillRoundedRect(-w/2, -h/2, w, h, 22);
    g.lineStyle(4, 0xffd24c, 1); g.strokeRoundedRect(-w/2, -h/2, w, h, 22);
    c.add(g);
    const ico = this.add.text(0, -h/2 + 44, item.ico, { fontSize: '52px' }).setOrigin(0.5);
    this.tweens.add({ targets: ico, angle: { from: -5, to: 5 }, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    c.add(ico);
    c.add(this.add.text(0, -h/2 + 92, item.name, {
      fontFamily: 'Varela Round, Heebo, sans-serif', fontSize: '25px', color: '#5a3d5c', fontStyle: 'bold'
    }).setOrigin(0.5));
    c.add(this.add.text(0, -h/2 + 122, item.desc, {
      fontFamily: 'Heebo, sans-serif', fontSize: '16px', color: '#9a7a9c',
      align: 'center', wordWrap: { width: w - 26 }
    }).setOrigin(0.5));
    const lvlText = this.add.text(-w/2 + 52, h/2 - 38, '', {
      fontFamily: 'Varela Round, Heebo, sans-serif', fontSize: '19px', color: '#f5a800', fontStyle: 'bold'
    }).setOrigin(0.5);
    c.add(lvlText);

    const buy = this.add.container(w/2 - 88, h/2 - 40);
    const bg = this.add.graphics();
    const bt = this.add.text(0, 0, '', {
      fontFamily: 'Varela Round, Heebo, sans-serif', fontSize: '24px', color: '#fff', fontStyle: 'bold'
    }).setOrigin(0.5);
    buy.add([bg, bt]);
    buy.setSize(150, 52).setInteractive(new Phaser.Geom.Rectangle(0, 0, 150, 52), Phaser.Geom.Rectangle.Contains);
    buy.on('pointerdown', () => this.tryBuy(item, c));
    c.add(buy);

    c._item = item; c._lvlText = lvlText; c._buyBg = bg; c._buyText = bt;
    return c;
  }

  tryBuy(item, card) {
    if (Wallet.buy(item.id)) {
      Sound.cha_ching();
      Voice.praise();
      this.tweens.add({ targets: card, scale: 1.08, duration: 110, yoyo: true });
      for (let i = 0; i < 16; i++) {
        const s = this.add.image(card.x + Phaser.Math.Between(-90, 90), card.y + Phaser.Math.Between(-160, 160), 'spark')
          .setDepth(110).setTint(0xffd24c).setScale(Phaser.Math.FloatBetween(0.5, 1.1));
        this.tweens.add({ targets: s, y: '-=' + Phaser.Math.Between(50, 140), alpha: 0, duration: 700, onComplete: () => s.destroy() });
      }
      this.refreshShop();
    } else {
      Sound.sad();
      this.tweens.add({ targets: card, x: card.x + 8, duration: 50, yoyo: true, repeat: 3 });
    }
  }

  refreshShop() {
    const balance = '' + Wallet.coins;
    if (this.shopCoinText) this.shopCoinText.setText(balance);
    if (this.coinText) this.coinText.setText(balance);
    (this.shopCards || []).forEach(card => {
      const item = card._item, lvl = Wallet.lvl(item.id), max = item.costs.length, cost = Wallet.nextCost(item.id);
      card._lvlText.setText(max > 1 ? ('רמה ' + lvl + ' / ' + max) : (lvl ? '✓ פתוח!' : ''));
      const bg = card._buyBg; bg.clear();
      if (cost === null) {
        bg.fillStyle(0x8fd3b6, 1); bg.fillRoundedRect(-75, -26, 150, 52, 26);
        card._buyText.setText('✓ שלי!');
      } else {
        const can = Wallet.coins >= cost;
        bg.fillStyle(0x000000, 0.18); bg.fillRoundedRect(-75, -21, 150, 52, 26);
        bg.fillStyle(can ? 0xf5a800 : 0xc9b78a, 1); bg.fillRoundedRect(-75, -26, 150, 52, 26);
        bg.fillStyle(0xffffff, 0.3); bg.fillRoundedRect(-66, -22, 132, 18, 9);
        card._buyText.setText('🪙 ' + cost);
      }
    });
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
