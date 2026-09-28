/* =====================================================================
   js/world.js — עגלת הגיבורות: שער הקומיקס + סצנת המשחק הראשית
   ---------------------------------------------------------------------
   פרק 1 — buildEnvironment: עיר הקומיקס (Comic.city) + מסגרת פאנל
   פרק 2 — buildCart: "סופר-טראק" בקווי דיו — סוכך לפי עיצוב העגלה מהחנות, סמל מגן, הגיבור בחלון
   פרק 3 — TitleScene: שער של גיליון קומיקס — כותרת בולטת, הגיבור על רקע פיצוץ, בלגנון מציץ
   פרק 4 — WorldScene: לולאת המשחק
           4.1 משימה: יעד הגשות (5–10), סרגל התקדמות, פתיח "משימה N"
           4.2 לקוחות: גיבורות הצוות (HeroAvatar) ואזרחים, בועת דיבור קומיקס, מד סבלנות
           4.3 הגשה: הגיבור עף מהעגלה אל הלקוח, "בום!", מטבעות, קומבו
           4.4 כוח-על: מד שמתמלא מהגשות → "זמן גיבורות!" (הזמן נעצר + מטבעות כפולים)
           4.5 בוס: בלגנון תוקף בסוף המשימה — מקישים עליו ועל כתמי הבלגן שהוא זורק
           4.6 סיום משימה: פאנל עם כוכבים, פרס, "המשימה הבאה"
           4.7 מצב יצירה חופשית (בלי לקוחות ובלי לחץ)
   אין פסילה ואין עונש: לקוח שמתעצבן פשוט הולך, ובלגנון שלא הובס פשוט בורח.
   תלויות: Phaser, Comic (js/hero-comic.js), Helper/DESIGN/Palette (js/game.js), G (js/state.js),
           Sound/Voice/Music (js/audio.js), Hero3D (js/hero3d.js), אופציונלי: Profile, HeroAvatar, Progress
   ===================================================================== */

/* nm — טקסט עם שם הילדה במקום "אלה" (shared/profile.js) */
function nm(t) { return window.Profile ? Profile.fix(t) : t; }

/* ---------- פרק 1 — הסביבה ---------- */
function buildEnvironment(scene) {
  const env = Comic.city(scene);
  Comic.panelFrame(scene, 19);
  return env;
}

/* ---------- פרק 2 — הסופר-טראק ---------- */
function buildCart(scene, x, y) {
  const I = Comic.C.ink, cart = scene.add.container(x, y).setDepth(5);
  const skin = (document.body && document.body.dataset.cart) || 'default';
  /* צבעי הטראק לפי "עיצוב עגלה" מהחנות */
  const SK = {
    default: { body: [0xff5fb0, 0xc2187a], trim: 0xffd23c, stripes: [0xff2e93, 0xffffff] },
    royal:   { body: [0xa98bff, 0x5a2bb0], trim: 0xffd23c, stripes: [0x8b5cff, 0xffd23c] },
    rainbow: { body: [0x3fcf7a, 0x16753f], trim: 0xffffff, stripes: [0xff3b30, 0xff9f1c, 0xffd23c, 0x3fcf7a, 0x29c5ff, 0x7a3fe0] }
  };
  const S = SK[skin] || SK.default;

  const shadow = Helper.softShadow(scene, 0, 166, 320, 46);

  /* גלגלים */
  const wheels = scene.add.graphics();
  [-150, 150].forEach(wx => {
    wheels.fillStyle(I, 1); wheels.fillCircle(wx, 150, 42);
    wheels.fillStyle(0x3a4256, 1); wheels.fillCircle(wx, 150, 34);
    wheels.fillStyle(0xd9dde8, 1); wheels.fillCircle(wx, 150, 15);
    wheels.lineStyle(4, I, 1); wheels.strokeCircle(wx, 150, 15);
  });

  /* גוף הטראק: מילוי בהדרגה, פס קישוט, קו דיו עבה, הבהק ורסטר */
  const body = scene.add.graphics();
  body.fillStyle(I, 1); body.fillRoundedRect(-230, -18, 460, 166, 28);
  body.fillGradientStyle(S.body[0], S.body[0], S.body[1], S.body[1], 1); body.fillRoundedRect(-222, -10, 444, 150, 24);
  body.fillStyle(S.trim, 1); body.fillRect(-222, 92, 444, 18);
  body.lineStyle(4, I, 1); body.lineBetween(-222, 92, 222, 92); body.lineBetween(-222, 110, 222, 110);
  body.fillStyle(0xffffff, 0.3); body.fillRoundedRect(-208, 0, 416, 16, 8);
  Comic.halftone(body, -210, 60, 420, 30, 0x000000, 0.12, 12, 2.4, 'down');

  /* סמל מגן עם ברק על דופן הטראק */
  const SH = [[0, -40], [36, -28], [32, 12], [0, 40], [-32, 12], [-36, -28]];
  const emblem = scene.add.graphics({ x: 150, y: 44 });
  emblem.fillStyle(I, 1); emblem.fillPoints(SH.map(p => new Phaser.Geom.Point(p[0] * 1.14, p[1] * 1.14)), true);
  emblem.fillStyle(Comic.C.yellow, 1); emblem.fillPoints(SH.map(p => new Phaser.Geom.Point(p[0], p[1])), true);
  emblem.fillStyle(I, 1); emblem.fillPoints([[6, -26], [-12, 4], [0, 4], [-8, 28], [14, -4], [2, -4], [10, -26]].map(p => new Phaser.Geom.Point(p[0], p[1])), true);

  /* דלפק */
  const counter = scene.add.graphics();
  counter.fillStyle(I, 1); counter.fillRoundedRect(-244, 12, 488, 36, 14);
  counter.fillGradientStyle(0xfffaf0, 0xfffaf0, 0xd9dde8, 0xd9dde8, 1); counter.fillRoundedRect(-238, 16, 476, 26, 10);

  /* חלון המטבח + הגיבור בפנים (טקסטורת hero_me מה-Boot) */
  const win = scene.add.graphics();
  win.fillStyle(I, 1); win.fillRoundedRect(-160, -130, 150, 140, 18);
  win.fillGradientStyle(0xbfeaff, 0xbfeaff, 0xeef9ff, 0xeef9ff, 1); win.fillRoundedRect(-152, -122, 134, 124, 14);
  let hero = Helper.charImg(scene, -85, -40, 'hero_me', 150) || Helper.charImg(scene, -85, -48, 'ella', 120);
  if (!hero) hero = scene.add.text(-85, -55, '🦸', { fontSize: '78px' }).setOrigin(0.5);
  scene.tweens.add({ targets: hero, y: hero.y - 7, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  const glass = scene.add.graphics();
  glass.fillStyle(0xffffff, 0.35); glass.fillRoundedRect(-146, -116, 30, 96, 8);

  /* לוח תפריט קומיקס */
  const board = scene.add.graphics();
  board.fillStyle(I, 1); board.fillRoundedRect(4, -136, 162, 142, 16);
  board.fillStyle(0xffffff, 1); board.fillRoundedRect(10, -130, 150, 130, 12);
  board.fillStyle(Comic.C.blue, 1); board.fillRoundedRect(10, -130, 150, 30, { tl: 12, tr: 12, bl: 0, br: 0 });
  const boardTitle = scene.add.text(85, -115, 'תפריט', { fontFamily: Comic.C.font, fontSize: '20px', color: '#fff', fontStyle: '900' }).setOrigin(0.5);
  const m1 = Helper.foodIcon(scene, 50, -70, 'shake', 40), m2 = Helper.foodIcon(scene, 120, -70, 'burger', 40);
  const m3 = Helper.foodIcon(scene, 50, -28, 'pizza', 40), m4 = Helper.foodIcon(scene, 120, -28, 'donut', 40);

  /* סוכך מפוספס עם שוליים מסולסלים וקווי דיו */
  const awning = scene.add.graphics();
  const stripeW = 56, n = 8, sx = -224;
  awning.fillStyle(I, 1); awning.fillRoundedRect(-232, -178, 464, 72, 8);
  for (let i = 0; i < n; i++) { awning.fillStyle(I, 1); awning.fillCircle(sx + i * stripeW + stripeW / 2, -110, stripeW / 2 + 4); }
  for (let i = 0; i < n; i++) {
    awning.fillStyle(S.stripes[i % S.stripes.length], 1);
    awning.fillRect(sx + i * stripeW, -170, stripeW, 60);
    awning.fillCircle(sx + i * stripeW + stripeW / 2, -110, stripeW / 2);
  }
  awning.fillStyle(S.trim, 1); awning.fillRoundedRect(-240, -192, 480, 24, 10);
  awning.lineStyle(5, I, 1); awning.strokeRoundedRect(-240, -192, 480, 24, 10);

  /* שלט "סופר-טראק" על הגג */
  const sign = Comic.caption(scene, 0, -224, '⚡ סופר-טראק ⚡', { size: 26 });

  const steam = scene.add.particles(60, -120, 'dot', {
    scale: { start: 0.3, end: 0 }, alpha: { start: 0.4, end: 0 },
    speedY: { min: -40, max: -70 }, lifespan: 1500, frequency: 400, tint: 0xffffff
  });

  cart.add([shadow, wheels, body, emblem, counter, win, hero, glass, board, boardTitle, m1, m2, m3, m4, awning, sign, steam]);
  cart._hero = hero;
  scene.tweens.add({ targets: cart, y: y - 6, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  return cart;
}

/* ---------- פרק 3 — שער הקומיקס ---------- */
class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    const W = DESIGN.w, C = Comic.C;
    this.cameras.main.fadeIn(300, 16, 30, 54);
    buildEnvironment(this);

    /* 3.1 הגיבור על רקע פיצוץ קרניים מסתובב (אדום/צהוב) בתוך עיגול דיו */
    const rays = this.add.graphics({ x: 960, y: 400 }).setDepth(6);
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      rays.fillStyle(i % 2 ? C.red : C.yellow, 0.92);
      rays.fillTriangle(0, 0, Math.cos(a) * 340, Math.sin(a) * 340, Math.cos(a + Math.PI / 12) * 340, Math.sin(a + Math.PI / 12) * 340);
    }
    const maskG = this.make.graphics({ x: 960, y: 400, add: false }); maskG.fillStyle(0xffffff); maskG.fillCircle(0, 0, 250);
    rays.setMask(maskG.createGeometryMask());
    const ring = this.add.graphics({ x: 960, y: 400 }).setDepth(6);
    ring.lineStyle(12, C.ink, 1); ring.strokeCircle(0, 0, 250);
    this.tweens.add({ targets: rays, angle: 360, duration: 40000, repeat: -1 });
    const hero = Helper.charImg(this, 960, 420, 'hero_me', 400);
    if (hero) { hero.setDepth(7); this.tweens.add({ targets: hero, y: 400, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' }); }

    /* 3.2 הטראק משמאל */
    buildCart(this, 400, 520).setScale(0.82);

    /* 3.3 כותרת בולטת + תיבת קריינות */
    const t = Comic.title(this, 470, 128, nm('העגלה של אלה'), 86, '#ffffff', 21);
    this.tweens.add({ targets: t, scale: 1.04, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    Comic.caption(this, 470, 222, 'הפוד-טראק של גיבורת-העל!', { size: 32, angle: -2, depth: 21 });
    Comic.caption(this, 470, 288, 'משימה ' + G.mission + '  ·  ניצחונות על בלגנון: ' + G.bossWins, { size: 22, fill: 0xffffff, depth: 21, angle: 1 });

    /* 3.4 פינת גיליון (כמו בשער קומיקס) */
    const box = this.add.container(1150, 96).setDepth(21);
    const bg = this.add.graphics();
    bg.fillStyle(C.ink, 1); bg.fillRect(-82, -58, 172, 124);
    bg.fillStyle(0xffffff, 1); bg.fillRect(-76, -52, 160, 112);
    bg.fillStyle(C.red, 1); bg.fillRect(-76, -52, 160, 36);
    box.add([bg,
      this.add.text(4, -34, 'גיליון', { fontFamily: C.font, fontSize: '22px', color: '#fff', fontStyle: '900' }).setOrigin(0.5),
      this.add.text(4, 4, '#' + G.mission, { fontFamily: C.font, fontSize: '40px', color: C.inkCss, fontStyle: '900' }).setOrigin(0.5),
      this.add.text(4, 42, 'מחיר: חינם!', { fontFamily: C.font, fontSize: '18px', color: '#b3161e', fontStyle: '900' }).setOrigin(0.5)]);
    box.setAngle(4);

    /* 3.5 בלגנון מציץ עם בועת דיבור */
    const v = Helper.charImg(this, 110, 390, 'villain', 150);
    if (v) {
      v.setDepth(8).setAngle(-12);
      this.tweens.add({ targets: v, y: 375, angle: -4, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      const b = this.add.container(170, 272).setDepth(8);
      b.add([Comic.balloon(this, 230, 74), this.add.text(0, 0, 'חה חה! אני אבלגן\nלכם את העגלה!', { fontFamily: C.font, fontSize: '21px', color: C.inkCss, fontStyle: '900', align: 'center' }).setOrigin(0.5)]);
      this.tweens.add({ targets: b, scale: 1.05, duration: 900, yoyo: true, repeat: -1 });
    }

    /* 3.6 כפתורים */
    Helper.pillBtn(this, W / 2 - 190, 722, '▶  יוצאים למשימה!', C.red, () => this.scene.start('World')).setDepth(22)._label.setFontSize(34);
    Helper.pillBtn(this, W / 2 + 230, 722, '🎨 חופשי', 0x34c79a, () => this.scene.start('World', { free: true })).setDepth(22)._label.setFontSize(30);

    const sBtn = Helper.circleBtn(this, 180, 70, G.soundOn ? '🔊' : '🔇', 42, () => {
      const on = Sound.toggle(); G.soundOn = on;
      if (on) { Music.start(); Voice.say('יאללה, יוצאים למשימה!'); } else { Music.stop(); Voice.silence(); }
      sBtn.list[1].setText(on ? '🔊' : '🔇');
    });
    sBtn.setDepth(22);

    this.add.particles(0, 0, 'star', {
      x: { min: 700, max: 1220 }, y: { min: 160, max: 640 },
      scale: { start: 0.45, end: 0 }, alpha: { start: 0.9, end: 0 }, lifespan: 1600, frequency: 380
    }).setDepth(8);
  }
}

/* ---------- פרק 4 — סצנת המשחק ---------- */
class WorldScene extends Phaser.Scene {
  constructor() { super('World'); }

  init(data) { this.freeMode = !!(data && data.free); }

  create() {
    this.cameras.main.fadeIn(300, 16, 30, 54);
    Sound.unlock();
    if (G.soundOn) Music.start();
    buildEnvironment(this);
    this.cart = buildCart(this, DESIGN.w / 2, 500);

    this.customers = [];
    this.busyCustomer = null;
    this.combo = 0;
    this.spawnTimer = 0.5;
    this.PATIENCE_BASE = 18;

    /* מצב המשימה */
    this.mission = G.mission;
    this.goal = G.missionGoal(this.mission);
    this.served = 0; this.missed = 0; this.earned = 0;
    this.phase = this.freeMode ? 'free' : 'intro';      // intro → play → boss → done
    /* כוח-על */
    this.POWER_MAX = 5; this.power = 0; this.heroTime = 0; this.powerAnnounced = false;
    this.boss = null;

    this.buildHUD();
    this.buildFx();

    if (this.freeMode) this.openFreeMenu();
    else this.missionIntro();

    this.game.events.on('mg-done', this.onMiniGameDone, this);
    this.events.once('shutdown', () => this.game.events.off('mg-done', this.onMiniGameDone, this));
  }

  /* ----- HUD ----- */
  buildHUD() {
    const C = Comic.C, W = DESIGN.w;
    const hud = this.add.container(0, 0).setDepth(20);

    /* מטבעות (ימין למעלה) */
    const coinBg = this.add.graphics();
    coinBg.fillStyle(C.ink, 1); coinBg.fillRoundedRect(W - 305, 31, 274, 86, 43);
    coinBg.fillStyle(C.ink, 1); coinBg.fillRoundedRect(W - 305, 25, 274, 86, 43);
    coinBg.fillStyle(0xfffaf0, 1); coinBg.fillRoundedRect(W - 300, 30, 264, 76, 38);
    const coinIco = this.add.image(W - 270, 68, 'coin').setScale(1.1);
    this.tweens.add({ targets: coinIco, angle: 360, duration: 4000, repeat: -1 });
    this.coinText = this.add.text(W - 240, 68, '' + G.coins, { fontFamily: C.font, fontSize: '48px', color: '#e09b00', fontStyle: '900' }).setOrigin(0, 0.5);
    this.coinText.setStroke(C.inkCss, 4);
    hud.add([coinBg, coinIco, this.coinText]);

    /* חנות (שמאל למעלה — ליד כפתור הבית המשותף) */
    hud.add(Helper.circleBtn(this, 180, 70, '🛒', 44, () => {
      if (this.phase === 'boss' || this.phase === 'intro') return;    // לא באמצע קרב/פתיח
      this.scene.launch('Store'); this.scene.bringToTop('Store'); this.scene.pause();
    }));
    this.game.events.on('store-closed', () => { this.scene.resume(); this.input.enabled = true; this.updateCoins(); }, this);
    this.events.once('shutdown', () => this.game.events.off('store-closed'));

    if (this.freeMode) return;

    /* סרגל המשימה (למעלה במרכז): "משימה N" + עיגולי התקדמות */
    this.missionBar = this.add.container(W / 2 - 30, 62).setDepth(20);
    this.drawMissionBar();

    /* מד כוח-על (שמאל): עיגול עם ברק שמתמלא */
    this.powerBtn = this.add.container(104, 540).setDepth(21);
    this.powerG = this.add.graphics();
    this.powerIco = this.add.text(0, -4, '⚡', { fontSize: '54px' }).setOrigin(0.5);
    this.powerLbl = this.add.text(0, 80, 'כוח-על', { fontFamily: C.font, fontSize: '22px', color: '#ffffff', fontStyle: '900' }).setOrigin(0.5);
    this.powerLbl.setStroke(C.inkCss, 6);
    this.powerBtn.add([this.powerG, this.powerIco, this.powerLbl]);
    this.powerBtn.setSize(140, 140).setInteractive(new Phaser.Geom.Circle(70, 70, 72), Phaser.Geom.Circle.Contains);
    this.powerBtn.on('pointerdown', () => this.activatePower());
    this.drawPower();

    /* קומבו */
    this.comboBadge = this.add.container(W - 170, 170).setDepth(20).setVisible(false);
    this.comboBadge.add(Comic.burst(this, 0, 0, 58, C.yellow, 10));
    this.comboText = this.add.text(0, 0, '', { fontFamily: C.font, fontSize: '26px', color: '#ff3b30', fontStyle: '900', align: 'center' }).setOrigin(0.5);
    this.comboText.setStroke(C.inkCss, 5);
    this.comboBadge.add(this.comboText);

    this.hint = Comic.caption(this, W / 2, DESIGN.h - 44, 'הקישו על לקוח כדי להכין את ההזמנה שלו 👆', { size: 24, fill: 0xffffff, depth: 20 });
  }

  /* drawMissionBar — כיתוב המשימה ועיגולים (מימין לשמאל): מלא = הוגש */
  drawMissionBar() {
    const C = Comic.C, b = this.missionBar; b.removeAll(true);
    const n = this.goal, cell = 34, w = 170 + n * cell, h = 64;
    const g = this.add.graphics();
    g.fillStyle(C.ink, 1); g.fillRect(-w / 2 + 6, -h / 2 + 6, w, h);
    g.fillStyle(C.ink, 1); g.fillRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8);
    g.fillStyle(C.yellow, 1); g.fillRect(-w / 2, -h / 2, w, h);
    b.add(g);
    b.add(this.add.text(w / 2 - 80, 0, 'משימה ' + this.mission, { fontFamily: C.font, fontSize: '28px', color: C.inkCss, fontStyle: '900' }).setOrigin(0.5));
    for (let i = 0; i < n; i++) {
      const x = w / 2 - 176 - i * cell, done = i < this.served;
      const d = this.add.graphics({ x: x, y: 0 });
      d.fillStyle(C.ink, 1); d.fillCircle(0, 0, 14);
      d.fillStyle(done ? C.red : 0xffffff, 1); d.fillCircle(0, 0, 10);
      b.add(d);
      if (done) b.add(this.add.text(x, 1, '★', { fontSize: '17px', color: '#ffd23c' }).setOrigin(0.5));
    }
  }

  /* drawPower — ציור מד כוח-העל לפי this.power (או זמן הגיבורות שנותר) */
  drawPower() {
    if (!this.powerG) return;
    const C = Comic.C, g = this.powerG, r = 58;
    const full = this.power >= this.POWER_MAX, frac = this.heroTime > 0 ? this.heroTime / 9 : this.power / this.POWER_MAX;
    g.clear();
    g.fillStyle(C.ink, 1); g.fillCircle(0, 6, r + 6);
    g.fillStyle(C.ink, 1); g.fillCircle(0, 0, r + 6);
    g.fillStyle(full || this.heroTime > 0 ? C.yellow : 0x3a4256, 1); g.fillCircle(0, 0, r);
    if (frac > 0) {
      g.fillStyle(this.heroTime > 0 ? C.cyan : C.orange, 1);
      g.slice(0, 0, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, frac), false); g.fillPath();
    }
    g.fillStyle(0xffffff, 0.3); g.fillEllipse(-14, -26, 50, 20);
    this.powerLbl.setText(this.heroTime > 0 ? 'זמן גיבורות!' : full ? 'הקישו!' : 'כוח-על');
  }

  buildFx() {
    this.confetti = this.add.particles(0, 0, 'star', {
      lifespan: 1600, speed: { min: 200, max: 500 }, angle: { min: 220, max: 320 },
      gravityY: 700, scale: { start: 0.7, end: 0 }, rotate: { min: 0, max: 360 }, emitting: false
    }).setDepth(30);
    this.trail = this.add.particles(0, 0, 'star', {
      lifespan: 500, speed: { min: 10, max: 60 }, scale: { start: 0.45, end: 0 }, alpha: { start: 1, end: 0 }, emitting: false
    }).setDepth(29);
  }

  /* ----- 4.1 פתיח משימה ----- */
  missionIntro() {
    const W = DESIGN.w;
    this.input.enabled = false;
    const lines = Comic.speedLines(this, W / 2, 330, { depth: 38, alpha: 0.5 });
    const t = Comic.title(this, W / 2, 300, 'משימה ' + this.mission + '!', 110, '#ffd23c', 40);
    const cap = Comic.caption(this, W / 2, 410, 'הגישו ' + this.goal + ' הזמנות לגיבורות העיר — ואז בלגנון יגיע!', { size: 30, depth: 40 });
    [t, cap].forEach(o => o.setScale(0.3));
    this.tweens.add({ targets: [t, cap], scale: 1, duration: 380, ease: 'Back.out' });
    Sound.ding();
    Voice.say('משימה ' + this.mission + '! הגישו ' + this.goal + ' הזמנות!');
    this.time.delayedCall(2300, () => {
      this.tweens.add({ targets: [t, cap, lines], alpha: 0, duration: 300, onComplete: () => { t.destroy(); cap.destroy(); lines.destroy(); } });
      this.input.enabled = true;
      this.phase = 'play';
      this.fillSlots();
    });
  }

  /* ----- 4.2 לקוחות ----- */
  citizens() { return ['cust_girl', 'cust_boy', 'cust_bunny', 'cust_bear', 'cust_cat', 'cust_panda', 'cust_dog', 'cust_fox', 'cust_frog', 'cust_penguin', 'cust_pig', 'cust_mouse']; }
  faces() { return ['🧒', '👦', '🐰', '🐻', '🐱', '🐼', '🐶', '🦊', '🐸', '🐧', '🐷', '🐭']; }
  heroKeys() { return (window.HeroAvatar ? HeroAvatar.HEROES.slice(1) : []).map(h => 'team_' + h.id).filter(k => this.textures.exists(k)); }
  foodKeys() { return Object.keys(G.FOODS); }

  slotPositions() {
    const max = G.maxSlots(), pos = [];
    const spread = Math.min(max, 5), gap = 900 / spread;
    const startX = DESIGN.w / 2 - (gap * (spread - 1)) / 2 + 40;
    for (let i = 0; i < max; i++) pos.push({ x: startX + i * gap, y: 610 });
    return pos;
  }

  /* roomLeft — כמה לקוחות עוד מותר להכניס עד היעד (הגשות + ממתינים) */
  roomLeft() {
    const active = this.customers.filter(c => !c.leaving).length;
    return Math.max(0, this.goal - this.served - active);
  }

  fillSlots() {
    if (this.phase !== 'play') return;
    const pos = this.slotPositions();
    const active = this.customers.filter(c => !c.leaving);
    for (let i = active.length; i < pos.length && this.roomLeft() > 0; i++) this.spawnCustomer(i);
    this.reflowQueue();
  }

  reflowQueue() {
    const pos = this.slotPositions();
    this.customers.filter(c => !c.leaving).forEach((c, i) => {
      const target = pos[Math.min(i, pos.length - 1)];
      c.slot = target; c.slotIndex = i;
      if (!c.busy && !c.landing && Math.abs(c.cont.x - target.x) > 2) this.tweens.add({ targets: c.cont, x: target.x, y: target.y, duration: 900, ease: 'Sine.inOut' });
    });
  }

  spawnCustomer(index) {
    const C = Comic.C, pos = this.slotPositions();
    const slot = pos[Math.min(index, pos.length - 1)];
    const enterX = pos[pos.length - 1].x + 860;
    const foods = this.foodKeys(), food = foods[(Math.random() * foods.length) | 0];
    const order = G.makeOrder(food);
    const heroes = this.heroKeys(), isHero = heroes.length > 0 && Math.random() < 0.5;
    const golden = !isHero && Math.random() < 0.12;
    const i = (Math.random() * this.citizens().length) | 0;
    const charKey = isHero ? heroes[(Math.random() * heroes.length) | 0] : this.citizens()[i];
    const patienceMax = this.PATIENCE_BASE * G.patienceMul() * (golden ? 0.85 : 1);

    const cont = this.add.container(enterX, slot.y).setDepth(6);
    const shadow = Helper.softShadow(this, 0, 76, 90, 24);
    let faceObj = Helper.charImg(this, 0, -30, charKey, isHero ? 190 : 168), faceBaseY = -30;
    if (!faceObj) { faceObj = this.add.text(0, 0, this.faces()[i], { fontSize: '96px' }).setOrigin(0.5); faceBaseY = 0; }

    const parts = [shadow];
    if (golden) {
      faceObj.setTint(0xffe27a);
      parts.push(this.add.particles(0, 0, 'spark', { lifespan: 800, scale: { start: 0.5, end: 0 }, alpha: { start: 1, end: 0 },
        speed: { min: 20, max: 60 }, frequency: 200, emitZone: { type: 'random', source: new Phaser.Geom.Circle(0, 0, 60) } }));
    }

    /* תג שם לגיבורי הצוות (עם שם חלופי אם זהה לשם הילד) */
    let tag = null;
    if (isHero) tag = Comic.caption(this, 0, 98, HeroAvatar.hero(charKey.slice(5)).name, { size: 18 });

    const bubble = this.add.container(0, -172);
    this.fillOrderBubble(bubble, food, order);

    const barBg = this.add.graphics();
    barBg.fillStyle(C.ink, 1); barBg.fillRoundedRect(-68, 56, 136, 22, 11);
    barBg.fillStyle(0xdfe4f0, 1); barBg.fillRoundedRect(-64, 59, 128, 16, 8);
    const barFill = this.add.rectangle(-62, 67, 124, 11, 0x48d39a).setOrigin(0, 0.5);

    const hit = this.add.zone(0, -30, 190, 270);
    parts.push(faceObj, bubble, barBg, barFill);
    if (tag) parts.push(tag);
    parts.push(hit);
    cont.add(parts);
    this.tweens.add({ targets: faceObj, y: faceBaseY - 8, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    const c = { food, order, golden, isHero, cont, faceObj, faceBaseY, bubble, barFill, patienceMax, patience: patienceMax,
                busy: false, leaving: false, slot, slotIndex: index, charKey, face: this.faces()[i] };

    /* גיבורה נוחתת מהשמיים; אזרח הולך פנימה מימין */
    if (isHero) {
      c.landing = true;
      cont.x = slot.x; cont.y = slot.y - 560;
      this.tweens.add({ targets: cont, y: slot.y, duration: 720, ease: 'Bounce.out', onComplete: () => {
        c.landing = false;
        if (!c.leaving) { Comic.sfx(this, cont.x + 50, slot.y + 20, 'וווש!', { size: 30, hold: 240, depth: 12 }); this.reflowQueue(); }
      } });
    } else {
      this.tweens.add({ targets: cont, x: slot.x, duration: 1300, ease: 'Sine.inOut' });
    }

    hit.setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => { if (!c.busy && !c.leaving && this.phase === 'play') this.startOrder(c); });
    this.customers.push(c);
  }

  /* בועת דיבור קומיקס: המאכל + בסיס + תוספות באייקונים (מימין לשמאל) */
  fillOrderBubble(bubble, food, order) {
    bubble.removeAll(true);
    const n = 1 + (order.base ? 1 : 0) + order.toppings.length;
    const cell = 44, padX = 18, w = n * cell + padX * 2, h = 62;
    bubble.add(Comic.balloon(this, w, h));
    let x = w / 2 - padX - cell / 2;
    bubble.add(Helper.foodIcon(this, x, 0, food, 38)); x -= cell;
    if (order.base) { bubble.add(Helper.icon(this, x, 0, order.base, 34)); x -= cell; }
    order.toppings.forEach(t => { bubble.add(Helper.icon(this, x, 0, t, 32)); x -= cell; });
    this.tweens.add({ targets: bubble, scale: 1.06, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  setBubbleResult(c, str, color) {
    this.tweens.killTweensOf(c.bubble);
    c.bubble.setScale(1); c.bubble.removeAll(true);
    const t = this.add.text(0, 0, str, { fontFamily: Comic.C.font, fontSize: '28px', color: color, fontStyle: '900' }).setOrigin(0.5);
    c.bubble.add([Comic.balloon(this, Math.max(120, t.width + 40), 60), t]);
  }

  update(time, delta) {
    if (this.freeMode) return;
    const dt = delta / 1000;

    /* זמן גיבורות: הסבלנות לא יורדת, המד מתרוקן */
    if (this.heroTime > 0) {
      this.heroTime -= dt;
      if (this.heroTime <= 0) this.endHeroTime(); else this.drawPower();
    }

    if (this.phase === 'play') {
      this.customers.forEach(c => {
        if (c.leaving) return;
        if (this.heroTime <= 0) c.patience -= dt;
        const r = Phaser.Math.Clamp(c.patience / c.patienceMax, 0, 1);
        c.barFill.width = 124 * r;
        c.barFill.setFillStyle(this.heroTime > 0 ? 0x29e0ff : r > 0.5 ? 0x48d39a : r > 0.25 ? 0xf5b301 : 0xff5b5b);
        if (!c.busy) {
          if (r < 0.25) { c.faceObj.setAngle(Math.sin(time / 80) * 6); if (!c.golden && c.faceObj.setTint) c.faceObj.setTint(0xffb0b0); }
          else if (r < 0.5) { c.faceObj.setAngle(Math.sin(time / 180) * 3); if (!c.golden && c.faceObj.clearTint) c.faceObj.clearTint(); }
          else if (!c.golden && c.faceObj.clearTint) c.faceObj.clearTint();
        }
        if (c.patience <= 0) { if (c.busy) c.patience = 0; else this.leaveAngry(c); }
      });
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0 && this.customers.filter(c => !c.leaving).length < G.maxSlots() && this.roomLeft() > 0) {
        this.fillSlots();
        this.spawnTimer = (4 + Math.random() * 3) * G.paceMul();
      }
    }
    if (this.phase === 'boss') this.updateBoss(time, dt);
  }

  startOrder(c) {
    c.busy = true;
    this.busyCustomer = c;
    this.input.enabled = false;
    this.scene.launch('MiniGame', { food: c.food, order: c.order, cust: c });
    this.scene.bringToTop('MiniGame');
  }

  onMiniGameDone(data) {
    this.scene.stop('MiniGame');
    this.input.enabled = true;
    const c = this.busyCustomer;
    this.busyCustomer = null;
    if (this.freeMode) {
      if (data && data.success) {
        G.addCoins(3); this.updateCoins();
        Comic.sfx(this, DESIGN.w / 2, 300, 'יצירה מהממת!', { size: 44, color: Comic.C.yellow });
        this.confetti.emitParticleAt(DESIGN.w / 2, 320, 18);
        Hero3D.show(data.food || (c && c.food) || 'donut', undefined, data.build);
        Sound.happy();
      }
      this.openFreeMenu(); return;
    }
    if (!c) return;
    if (data && data.success) {
      if (G.orderMatches(c.order, data.build)) this.serveOk(c, data.build);
      else this.serveWrong(c);
    } else { c.busy = false; if (c.faceObj) c.faceObj.setAngle(0); }
  }

  /* ----- 4.3 הגשה: הגיבור עף עם המנה אל הלקוח ----- */
  serveOk(c, build) {
    const ratio = Phaser.Math.Clamp(c.patience / c.patienceMax, 0, 1);
    const base = G.FOODS[c.food].base;
    let total = base + Math.round(base * G.tipMul() * ratio) + c.order.toppings.length * 2;
    if (c.golden) total *= 2;
    this.combo = Math.min(this.combo + 1, 9);
    if (this.combo >= 2) total += this.combo * 2;
    const doubled = this.heroTime > 0;
    if (doubled) total *= 2;
    c.leaving = true;
    this.served++; this.drawMissionBar();
    const last = this.served >= this.goal;
    this.flyDelivery(c, () => {
      G.addCoins(total); this.earned += total;
      this.updateCoins();
      try { if (window.Progress) Progress.track('cart:order'); } catch (e) {}
      const sx = c.cont.x, sy = c.cont.y;
      Comic.sfx(this, sx, sy - 120, ratio > 0.66 ? 'סופר מהר!' : c.golden ? 'זהב!' : null, { size: ratio > 0.66 ? 42 : 56 });
      Comic.flash(this, 0xffffff, 0.3, 200);
      this.flyCoins(sx, sy, Math.min(14, 3 + (total / 5) | 0));
      this.floatMsg(sx, sy - 240, '+' + total + ' 🪙' + (doubled ? ' ×2' : ''), '#ffd23c');
      if (ratio > 0.66) Voice.say('וואו, מהר מאוד!'); else Voice.praise();
      this.confetti.emitParticleAt(sx, sy - 90, c.golden ? 30 : 16);
      this.cameras.main.shake(140, 0.005);
      Sound.happy();
      this.showCombo();
      this.addPower(ratio > 0.66 ? 2 : 1);
      this.time.delayedCall(420, () => Hero3D.show(c.food, ratio > 0.66 ? 2600 : 2000, build));
      this.leaveHappy(c, ratio > 0.6 ? 3 : ratio > 0.3 ? 2 : 1);
      if (last) this.time.delayedCall(2800, () => this.startBoss());
    });
  }

  /* flyDelivery — הגיבור יוצא מחלון הטראק, עף בקשת אל הלקוח (שובל כוכבים) ומגיש */
  flyDelivery(c, onArrive) {
    const hero = this.cart && this.cart._hero;
    const from = { x: this.cart.x - 85, y: this.cart.y - 40 };
    const to = { x: c.cont.x, y: c.cont.y - 150 };
    const fly = Helper.charImg(this, from.x, from.y, 'hero_me', 120) || this.add.text(from.x, from.y, '🦸', { fontSize: '70px' }).setOrigin(0.5);
    fly.setDepth(28).setAngle(to.x > from.x ? 16 : -16);
    const dish = Helper.foodIcon(this, from.x, from.y - 44, c.food, 56).setDepth(29);
    if (hero) hero.setAlpha(0);
    Sound.pop();
    const mid = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - 180 };
    const curve = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(from.x, from.y), new Phaser.Math.Vector2(mid.x, mid.y), new Phaser.Math.Vector2(to.x, to.y));
    const p = { t: 0 }, sc = fly.scale;
    this.tweens.add({ targets: p, t: 1, duration: 480, ease: 'Sine.inOut',
      onUpdate: () => { const v = curve.getPoint(p.t); fly.setPosition(v.x, v.y); dish.setPosition(v.x, v.y - 44); this.trail.emitParticleAt(v.x, v.y, 2); },
      onComplete: () => {
        dish.destroy(); onArrive();
        this.tweens.add({ targets: fly, x: from.x, y: from.y, angle: 0, scale: sc * 0.9, duration: 420, delay: 180, ease: 'Sine.inOut',
          onComplete: () => { fly.destroy(); if (hero && hero.active) hero.setAlpha(1); } });
      } });
  }

  serveWrong(c) {
    this.combo = 0; this.showCombo(); this.missed++;
    Sound.sad();
    Voice.say('אופס, ננסה שוב');
    this.floatMsg(c.cont.x, c.cont.y - 160, 'אוי, לא בדיוק מה שביקשתי 😅', '#ff7a1c');
    this.leaveSad(c, 'לא נורא!', '😕');
  }

  leaveHappy(c, stars) {
    c.leaving = true;
    this.setBubbleResult(c, '⭐'.repeat(stars), '#ff7a1c');
    c.faceObj.setAngle(0); if (c.faceObj.clearTint && !c.golden) c.faceObj.clearTint();
    if (c.faceObj.type === 'Text') c.faceObj.setText('😄');
    if (c.isHero) {           // גיבורה ממריאה בחזרה לשמיים
      this.tweens.add({ targets: c.cont, y: c.cont.y - 760, angle: -10, duration: 800, delay: 700, ease: 'Cubic.in', onComplete: () => this.removeCustomer(c) });
    } else {
      this.tweens.add({ targets: c.cont, y: c.cont.y - 60, duration: 200, yoyo: true });
      this.tweens.add({ targets: c.cont, x: c.cont.x - 760, alpha: 0, duration: 1100, delay: 700, onComplete: () => this.removeCustomer(c) });
    }
  }

  leaveAngry(c) { this.combo = 0; this.showCombo(); this.missed++; this.leaveSad(c, 'אוף, לא הספקתי!', '😣'); }

  leaveSad(c, msg, emoji) {
    if (c.sad) return;
    c.leaving = true; c.sad = true;
    if (c.faceObj.type === 'Text') c.faceObj.setText(emoji); else c.faceObj.setTint(0xffc2c2);
    this.setBubbleResult(c, msg, '#ff7a1c');
    this.tweens.add({ targets: c.cont, x: c.cont.x + 380, alpha: 0, angle: 8, duration: 750, delay: 250, onComplete: () => this.removeCustomer(c) });
  }

  removeCustomer(c) {
    const i = this.customers.indexOf(c);
    if (i >= 0) this.customers.splice(i, 1);
    this.tweens.killTweensOf([c.cont, c.faceObj, c.bubble, c.barFill]);
    c.cont.destroy();
    if (this.phase === 'play' && this.scene.isActive()) {
      this.reflowQueue();
      this.time.delayedCall(600, () => { if (this.phase === 'play' && this.scene.isActive()) this.fillSlots(); });
    }
  }

  /* showCombo — תג קומבו מתפוצץ (מ-2 ומעלה) */
  showCombo() {
    if (!this.comboBadge) return;
    if (this.combo >= 2) {
      this.comboText.setText('קומבו\n×' + this.combo);
      this.comboBadge.setVisible(true).setScale(0.3);
      this.tweens.add({ targets: this.comboBadge, scale: 1, duration: 260, ease: 'Back.out' });
    } else this.comboBadge.setVisible(false);
  }

  /* ----- 4.4 כוח-על ----- */
  addPower(n) {
    if (this.heroTime > 0 || !this.powerBtn) return;
    this.power = Math.min(this.POWER_MAX, this.power + n);
    this.drawPower();
    if (this.power >= this.POWER_MAX && !this.powerPulse) {
      this.powerPulse = this.tweens.add({ targets: this.powerBtn, scale: 1.12, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      if (!this.powerAnnounced) { this.powerAnnounced = true; Voice.say('כוח-העל מוכן! הקישו על הברק!'); }
    }
  }
  activatePower() {
    if (this.power < this.POWER_MAX || this.heroTime > 0 || this.phase !== 'play') { Sound.tap(); return; }
    const W = DESIGN.w, C = Comic.C;
    this.power = 0; this.heroTime = 9;
    if (this.powerPulse) { this.powerPulse.stop(); this.powerPulse = null; } this.powerBtn.setScale(1);
    Comic.flash(this, C.yellow, 0.75, 350);
    Comic.speedLines(this, W / 2, 380, { depth: 37, alpha: 0.6, life: 600, hold: 500 });
    const t = Comic.title(this, W / 2, 300, 'זמן גיבורות!', 96, '#29e0ff', 40).setScale(0.3);
    this.tweens.add({ targets: t, scale: 1, duration: 300, ease: 'Back.out' });
    this.tweens.add({ targets: t, alpha: 0, duration: 400, delay: 1300, onComplete: () => t.destroy() });
    const cap = Comic.caption(this, W / 2, 400, 'הזמן נעצר · כל המטבעות כפולים!', { size: 30, depth: 40 });
    this.tweens.add({ targets: cap, alpha: 0, duration: 400, delay: 1500, onComplete: () => cap.destroy() });
    /* הגיבור חוצה את המסך בטיסה */
    const fly = Helper.charImg(this, -120, 250, 'hero_me', 170);
    if (fly) { fly.setDepth(36).setAngle(20); this.tweens.add({ targets: fly, x: W + 140, y: 200, duration: 1100, ease: 'Sine.inOut', onUpdate: () => this.trail.emitParticleAt(fly.x - 40, fly.y, 3), onComplete: () => fly.destroy() }); }
    /* מסגרת תכלת זוהרת כל עוד זמן הגיבורות פעיל */
    this.heroGlow = this.add.graphics().setDepth(17);
    this.heroGlow.lineStyle(26, C.cyan, 0.45); this.heroGlow.strokeRect(0, 0, W, DESIGN.h);
    this.tweens.add({ targets: this.heroGlow, alpha: 0.4, duration: 500, yoyo: true, repeat: -1 });
    Sound.ding(); Voice.say(nm('זמן גיבורות! אלה עוצרת את הזמן!'));
    this.drawPower();
  }
  endHeroTime() {
    this.heroTime = 0;
    if (this.heroGlow) { this.tweens.killTweensOf(this.heroGlow); this.heroGlow.destroy(); this.heroGlow = null; }
    this.drawPower();
  }

  /* ----- 4.5 בוס: בלגנון ----- */
  startBoss() {
    if (this.phase !== 'play') return;
    this.phase = 'boss';
    this.endHeroTime();
    const W = DESIGN.w, C = Comic.C;
    this.customers.filter(c => !c.leaving).forEach(c => this.leaveSad(c, 'עזרה! בלגנון!', '😱'));
    if (this.hint) this.hint.setVisible(false);
    if (this.powerBtn) this.powerBtn.setVisible(false);
    if (this.comboBadge) this.comboBadge.setVisible(false);

    Comic.flash(this, C.villain, 0.5, 400);
    const cap = Comic.caption(this, W / 2, 150, 'בינתיים… בלגנון תוקף את העגלה!', { size: 34, depth: 40 });
    this.tweens.add({ targets: cap, alpha: 0, duration: 400, delay: 2200, onComplete: () => cap.destroy() });
    Voice.say('בלגנון מגיע! תקישו עליו מהר!');

    const hpMax = Math.min(14, 7 + this.mission);
    const v = Helper.charImg(this, W + 200, 280, 'villain', 190) || this.add.text(W + 200, 280, '🧙‍♂️', { fontSize: '140px' }).setOrigin(0.5);
    v.setDepth(26);
    const boss = this.boss = { v, hp: hpMax, hpMax, timeLeft: 25, gooT: 2.4, goos: [], over: false, ready: false };

    boss.bar = this.add.graphics().setDepth(27);
    boss.label = this.add.text(0, 0, 'בלגנון', { fontFamily: C.font, fontSize: '22px', color: '#ffffff', fontStyle: '900' }).setOrigin(0.5).setDepth(27);
    boss.label.setStroke(C.inkCss, 5);
    boss.timer = Comic.caption(this, W / 2, DESIGN.h - 44, '⏰ 25', { size: 26, fill: 0xffffff, depth: 27 });

    this.tweens.add({ targets: v, x: W - 330, duration: 1100, ease: 'Back.out', onComplete: () => {
      if (boss.over) return;
      const laugh = this.add.container(v.x - 170, v.y - 150).setDepth(27);
      laugh.add([Comic.balloon(this, 260, 66), this.add.text(0, 0, 'חה חה! אני אבלגן הכול!', { fontFamily: C.font, fontSize: '22px', color: C.inkCss, fontStyle: '900' }).setOrigin(0.5)]);
      this.tweens.add({ targets: laugh, alpha: 0, duration: 300, delay: 1600, onComplete: () => laugh.destroy() });
      boss.ready = true; this.bossMove();
    } });

    v.setInteractive({ useHandCursor: true });
    v.on('pointerdown', (ptr) => this.hitBoss(ptr));
  }
  /* bossMove — בלגנון מרחף לנקודה אקראית בשמיים */
  bossMove() {
    const b = this.boss; if (!b || b.over) return;
    b.moveTw = this.tweens.add({ targets: b.v, x: Phaser.Math.Between(280, DESIGN.w - 280), y: Phaser.Math.Between(190, 390),
      angle: Phaser.Math.Between(-12, 12), duration: Phaser.Math.Between(900, 1500), ease: 'Sine.inOut', onComplete: () => this.bossMove() });
  }
  hitBoss(ptr) {
    const b = this.boss; if (!b || !b.ready || b.over) return;
    b.hp--;
    Comic.sfx(this, ptr.worldX, ptr.worldY - 20, null, { size: 46, hold: 320 });
    Sound.chop(); this.cameras.main.shake(90, 0.006);
    b.v.setTint(0xff9a9a); this.time.delayedCall(120, () => { if (b.v.active) b.v.clearTint(); });
    G.addCoins(2); this.earned += 2; this.flyCoins(b.v.x, b.v.y, 2);
    if (b.hp <= 0) this.endBoss(true);
  }
  /* updateBoss — שעון, פס חיים וזריקת כתמי בלגן לעבר הטראק */
  updateBoss(time, dt) {
    const b = this.boss; if (!b || b.over || !b.ready) return;
    const C = Comic.C;
    b.timeLeft -= dt;
    b.timer._text.setText('⏰ ' + Math.max(0, Math.ceil(b.timeLeft)));
    const x = b.v.x, y = b.v.y - 126, w = 160, f = Math.max(0, b.hp / b.hpMax);
    b.bar.clear();
    b.bar.fillStyle(C.ink, 1); b.bar.fillRoundedRect(x - w / 2 - 4, y - 4, w + 8, 24, 12);
    b.bar.fillStyle(0xdfe4f0, 1); b.bar.fillRoundedRect(x - w / 2, y, w, 16, 8);
    if (f > 0) { b.bar.fillStyle(C.villain, 1); b.bar.fillRoundedRect(x - w / 2, y, Math.max(16, w * f), 16, 8); }
    b.label.setPosition(x, y - 18);
    b.gooT -= dt;
    if (b.gooT <= 0) { b.gooT = Math.max(1.2, 2.4 - this.mission * 0.1); this.throwGoo(); }
    if (b.timeLeft <= 0) this.endBoss(false);
  }
  /* throwGoo — כתם בלגן סגול נופל לעבר הטראק; הקשה מפוצצת אותו (+1 מטבע) */
  throwGoo() {
    const b = this.boss, C = Comic.C;
    const g = this.add.graphics({ x: b.v.x, y: b.v.y + 40 }).setDepth(25);
    g.fillStyle(C.ink, 1); g.fillCircle(0, 0, 30); g.fillStyle(C.villain, 1); g.fillCircle(0, 0, 25);
    g.fillStyle(0x3fcf7a, 1); g.fillCircle(-8, -8, 7); g.fillStyle(0xffffff, 0.6); g.fillCircle(8, -10, 5);
    g.setInteractive(new Phaser.Geom.Circle(0, 0, 46), Phaser.Geom.Circle.Contains);
    const tx = this.cart.x + Phaser.Math.Between(-180, 180), ty = this.cart.y - 60;
    const tw = this.tweens.add({ targets: g, x: tx, y: ty, angle: 360, duration: 1900, ease: 'Quad.in', onComplete: () => {
      Sound.sad();
      const s = this.add.graphics({ x: tx, y: ty }).setDepth(7);
      s.fillStyle(C.villain, 0.85); s.fillCircle(0, 0, 34); s.fillCircle(-26, 10, 16); s.fillCircle(24, 14, 14); s.fillCircle(6, 30, 12);
      this.tweens.add({ targets: s, alpha: 0, duration: 600, delay: 1400, onComplete: () => s.destroy() });
      g.destroy();
    } });
    g.on('pointerdown', () => {
      if (!g.active) return;
      tw.stop(); Sound.pop();
      Comic.sfx(this, g.x, g.y, 'פלופ!', { size: 30, hold: 220, color: 0x3fcf7a });
      G.addCoins(1); this.earned += 1; this.updateCoins();
      g.destroy();
    });
    b.goos.push(g);
  }
  endBoss(won) {
    const b = this.boss; if (!b || b.over) return;
    b.over = true;
    const W = DESIGN.w, C = Comic.C;
    this.tweens.killTweensOf(b.v);
    b.goos.forEach(g => { if (g.active) { this.tweens.killTweensOf(g); g.destroy(); } });
    b.bar.destroy(); b.label.destroy(); b.timer.destroy();
    b.v.disableInteractive();
    let bonus;
    if (won) {
      bonus = 20 + this.mission * 5;
      Comic.flash(this, 0xffffff, 0.8, 400);
      Comic.sfx(this, b.v.x, b.v.y, 'קבוום!', { size: 80, hold: 900, color: C.yellow });
      this.cameras.main.shake(320, 0.012);
      this.confetti.emitParticleAt(b.v.x, b.v.y, 40);
      Sound.happy(); Voice.say(nm('ניצחת את בלגנון! כל הכבוד, אלה!'));
      this.tweens.add({ targets: b.v, x: W + 300, y: -200, angle: 720, scale: 0.2, duration: 1300, ease: 'Cubic.in', onComplete: () => b.v.destroy() });
      const cap = Comic.caption(this, W / 2, 170, 'בלגנון: "אני עוד אחזור!!"', { size: 30, fill: 0xffffff, depth: 40 });
      this.tweens.add({ targets: cap, alpha: 0, duration: 400, delay: 2000, onComplete: () => cap.destroy() });
    } else {
      bonus = 5;
      Voice.say('בלגנון ברח! בפעם הבאה נתפוס אותו!');
      this.tweens.add({ targets: b.v, x: -300, y: 120, duration: 1100, ease: 'Sine.in', onComplete: () => b.v.destroy() });
      const cap = Comic.caption(this, W / 2, 170, 'חה חה! לא תפסתם אותי!', { size: 30, fill: 0xffffff, depth: 40 });
      this.tweens.add({ targets: cap, alpha: 0, duration: 400, delay: 1800, onComplete: () => cap.destroy() });
    }
    G.addCoins(bonus); this.earned += bonus; this.updateCoins();
    this.boss = null;
    this.time.delayedCall(2300, () => this.missionComplete(won));
  }

  /* ----- 4.6 סיום משימה: פאנל קומיקס עם כוכבים ----- */
  missionComplete(won) {
    this.phase = 'done';
    const W = DESIGN.w, H = DESIGN.h, C = Comic.C;
    const stars = this.missed === 0 ? 3 : this.missed <= 2 ? 2 : 1;
    G.completeMission(stars, won);
    try { if (window.Progress) Progress.track('cart:mission'); } catch (e) {}

    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.45).setDepth(50).setInteractive();
    const p = this.add.container(W / 2, H / 2 - 20).setDepth(51);
    const g = this.add.graphics();
    g.fillStyle(C.ink, 1); g.fillRect(-392, -252, 800, 520);
    g.fillStyle(C.ink, 1); g.fillRect(-404, -264, 808, 528);
    g.fillStyle(0xfffaf0, 1); g.fillRect(-396, -256, 792, 512);
    Comic.halftone(g, -396, -256, 792, 170, C.yellow, 0.35, 16, 4, 'up');
    p.add(g);
    p.add(Comic.title(this, 0, -190, 'המשימה הושלמה!', 70, '#ffd23c'));
    for (let i = 0; i < 3; i++) {
      const on = i < stars, s = this.add.text((1 - i) * 120, -70, on ? '⭐' : '☆', { fontSize: '96px', color: '#c9ced9' }).setOrigin(0.5).setScale(0);
      p.add(s);
      this.tweens.add({ targets: s, scale: 1, angle: 360, duration: 420, delay: 300 + i * 260, ease: 'Back.out', onStart: () => { if (on) Sound.sparkle(); } });
    }
    p.add(this.add.text(0, 44, 'הגשת ' + this.served + ' הזמנות  ·  ' + (won ? 'ניצחת את בלגנון! 🏆' : 'בלגנון ברח 💨'),
      { fontFamily: C.font, fontSize: '30px', color: C.inkCss, fontStyle: '900' }).setOrigin(0.5));
    p.add(this.add.text(0, 98, 'הרווחת במשימה: ' + this.earned + ' 🪙', { fontFamily: C.font, fontSize: '34px', color: '#e09b00', fontStyle: '900' }).setOrigin(0.5).setStroke(C.inkCss, 4));
    Helper.pillBtn(this, W / 2 - 160, H / 2 + 176, '▶  משימה ' + (this.mission + 1), C.red, () => this.scene.restart({ free: false })).setDepth(52)._label.setFontSize(34);
    Helper.pillBtn(this, W / 2 + 200, H / 2 + 176, '📖 לשער', C.blue, () => this.scene.start('Title')).setDepth(52)._label.setFontSize(30);
    this.confetti.emitParticleAt(W / 2, H / 2 - 150, 40);
    Sound.happy();
    Voice.say('המשימה הושלמה! קיבלת ' + stars + ' כוכבים!');
  }

  /* ----- מיץ: מטבעות עפים + הודעות ----- */
  flyCoins(x, y, n) {
    for (let i = 0; i < n; i++) {
      const coin = this.add.image(x + Phaser.Math.Between(-40, 40), y + Phaser.Math.Between(-40, 40), 'coin').setDepth(31);
      this.tweens.add({ targets: coin, x: DESIGN.w - 270, y: 68, scale: 0.7, duration: 500 + i * 30, ease: 'Cubic.in',
        onComplete: () => { coin.destroy(); this.updateCoins(); Sound.sparkle(); } });
    }
    Sound.cha_ching();
  }

  floatMsg(x, y, txt, color) {
    const label = Helper.txt(this, Phaser.Math.Clamp(x, 240, DESIGN.w - 240), y, txt, 40, color || '#ffd23c').setDepth(32);
    label.setStroke(Comic.C.inkCss, 8).setScale(0.4);
    this.tweens.add({ targets: label, scale: 1, duration: 300, ease: 'Back.out' });
    this.tweens.add({ targets: label, y: y - 80, alpha: 0, duration: 1000, delay: 700, onComplete: () => label.destroy() });
  }

  updateCoins() {
    this.coinText.setText('' + G.coins);
    this.tweens.add({ targets: this.coinText, scale: 1.3, duration: 120, yoyo: true });
  }

  goHome() { this.scene.stop('Store'); this.scene.start('Title'); }

  /* ----- 4.7 יצירה חופשית ----- */
  openFreeMenu() {
    if (this.freeMenu) this.freeMenu.destroy();
    const m = this.add.container(0, 0).setDepth(25);
    m.add(Comic.caption(this, DESIGN.w / 2, 170, '🎨 יצירה חופשית — בחרו מה להכין', { size: 36, depth: 25 }));
    const foods = this.foodKeys();
    const gap = 230, startX = DESIGN.w / 2 + (gap * (foods.length - 1)) / 2;
    foods.forEach((k, i) => {
      const btn = this.add.container(startX - i * gap, 420);
      const g = this.add.graphics();
      Helper.comicCard(g, -90, -90, 180, 180, 24, 0xffffff);
      btn.add([g, Helper.foodIcon(this, 0, -20, k, 110), Helper.txt(this, 0, 60, G.FOODS[k].name, 30, Comic.C.inkCss)]);
      btn.setSize(180, 180).setInteractive(new Phaser.Geom.Rectangle(0, 0, 180, 180), Phaser.Geom.Rectangle.Contains);
      btn.on('pointerdown', () => {
        Sound.tap();
        this.input.enabled = false;
        this.scene.launch('MiniGame', { food: k, order: G.makeOrder(k) });
        this.scene.bringToTop('MiniGame');
      });
      m.add(btn);
    });
    this.freeMenu = m;
  }
}
