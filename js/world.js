/* ===== עולם חי: סצנת פתיחה + סצנת משחק ראשית ===== */

/* בונה סביבה חיה (משמש גם במסך הפתיחה וגם במשחק) */
function buildEnvironment(scene) {
  const W = DESIGN.w, H = DESIGN.h;

  // ----- שמש עם קרניים מסתובבות -----
  const sun = scene.add.container(150, 140).setDepth(0);
  const rays = scene.add.graphics();
  rays.fillStyle(0xfff2a8, 0.5);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    rays.fillTriangle(
      Math.cos(a) * 70, Math.sin(a) * 70,
      Math.cos(a + 0.13) * 150, Math.sin(a + 0.13) * 150,
      Math.cos(a - 0.13) * 150, Math.sin(a - 0.13) * 150
    );
  }
  const core = scene.add.graphics();
  core.fillStyle(0xffe27a, 1); core.fillCircle(0, 0, 62);
  core.fillStyle(0xfff6cf, 1); core.fillCircle(0, 0, 46);
  sun.add([rays, core]);
  scene.tweens.add({ targets: rays, angle: 360, duration: 40000, repeat: -1 });
  scene.tweens.add({ targets: core, scale: 1.06, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

  // ----- גבעות (שתי שכבות לעומק) -----
  const hillFar = scene.add.graphics().setDepth(1);
  hillFar.fillStyle(Palette.hillFar, 1);
  hillFar.fillEllipse(330, H - 120, 900, 360);
  hillFar.fillEllipse(980, H - 130, 1000, 400);

  const hillNear = scene.add.graphics().setDepth(3);
  hillNear.fillStyle(Palette.hillNear, 1);
  hillNear.fillEllipse(180, H - 60, 760, 320);
  hillNear.fillEllipse(1120, H - 70, 820, 340);

  // ----- קרקע דשא -----
  const ground = scene.add.graphics().setDepth(4);
  ground.fillStyle(Palette.grassNear, 1);
  ground.fillRect(0, H - 110, W, 110);
  ground.fillStyle(0x5cc15a, 1);
  for (let x = 0; x < W; x += 34) {
    ground.fillTriangle(x, H - 110, x + 12, H - 134, x + 24, H - 110);
  }

  // ----- עצים מתנדנדים -----
  [[80, H - 130, 1], [1180, H - 140, 1.1], [1010, H - 120, 0.8]].forEach(([x, y, s]) => {
    const tree = scene.add.container(x, y).setDepth(3).setScale(s);
    const trunk = scene.add.graphics();
    trunk.fillStyle(0x9b6b3f, 1); trunk.fillRoundedRect(-12, -70, 24, 80, 8);
    const leaves = scene.add.graphics();
    leaves.fillStyle(0x4fb84a, 1);
    leaves.fillCircle(0, -90, 46); leaves.fillCircle(-34, -70, 34); leaves.fillCircle(34, -72, 36);
    tree.add([trunk, leaves]);
    scene.tweens.add({ targets: tree, angle: 3, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  });

  // ----- עננים נסחפים -----
  for (let i = 0; i < 5; i++) {
    const c = scene.add.image(-300, 80 + Math.random() * 200, 'cloud')
      .setDepth(2).setAlpha(0.9).setScale(0.6 + Math.random() * 0.7);
    scene.tweens.add({
      targets: c, x: W + 300, duration: 26000 + Math.random() * 20000,
      repeat: -1, delay: i * 5000,
      onRepeat: () => { c.y = 70 + Math.random() * 200; c.setScale(0.6 + Math.random() * 0.7); }
    });
  }

  // ----- ציפורים שעוברות מדי פעם -----
  scene.time.addEvent({
    delay: 5000, loop: true, callback: () => {
      const y = 120 + Math.random() * 160;
      const bird = scene.add.container(-40, y).setDepth(2);
      const wing = scene.add.graphics();
      wing.lineStyle(5, 0x5a3d5c, 1);
      wing.beginPath(); wing.arc(-12, 0, 12, Math.PI, 0); wing.strokePath();
      wing.beginPath(); wing.arc(12, 0, 12, Math.PI, 0); wing.strokePath();
      bird.add(wing);
      scene.tweens.add({ targets: wing, scaleY: 0.4, duration: 250, yoyo: true, repeat: -1 });
      scene.tweens.add({
        targets: bird, x: W + 60, y: y - 40, duration: 8000, ease: 'Sine.inOut',
        onComplete: () => bird.destroy()
      });
    }
  });
}

/* בונה עגלה מצוירת חמודה. מחזיר container */
function buildCart(scene, x, y) {
  const cart = scene.add.container(x, y).setDepth(5);

  const shadow = scene.add.ellipse(0, 150, 460, 50, 0x000000, 0.15);

  const body = scene.add.graphics();
  body.fillStyle(0xffd24c, 1); body.fillRoundedRect(-220, -10, 440, 150, 26);
  body.fillStyle(0xf5b301, 1); body.fillRoundedRect(-220, 90, 440, 50, 16);

  // דלפק
  const counter = scene.add.graphics();
  counter.fillStyle(0xfff0c2, 1); counter.fillRoundedRect(-235, 20, 470, 26, 12);

  // חלון + אלה
  const win = scene.add.graphics();
  win.fillStyle(0xffffff, 1); win.fillRoundedRect(-150, -110, 130, 110, 16);
  win.fillStyle(0xd9f3ff, 1); win.fillRoundedRect(-140, -100, 110, 90, 12);
  const ella = scene.add.text(-85, -55, '👧', { fontSize: '78px' }).setOrigin(0.5);
  scene.tweens.add({ targets: ella, y: -62, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

  // שלט תפריט
  const board = scene.add.graphics();
  board.fillStyle(0xffffff, 1); board.fillRoundedRect(10, -120, 150, 120, 16);
  board.fillStyle(0xff5ca8, 1); board.fillRoundedRect(10, -120, 150, 30, { tl:16, tr:16, bl:0, br:0 });
  const boardTitle = scene.add.text(85, -105, 'תפריט', { fontFamily:'Heebo, sans-serif', fontSize:'20px', color:'#fff', fontStyle:'bold' }).setOrigin(0.5);
  const menuItems = scene.add.text(85, -50, '🥤  🍔\n🍕  🍩', { fontSize:'30px', align:'center' }).setOrigin(0.5);

  // סוכך מפוספס עם שוליים מסולסלים
  const awning = scene.add.graphics();
  const stripeW = 56, n = 8, startX = -224;
  for (let i = 0; i < n; i++) {
    awning.fillStyle(i % 2 ? 0xffffff : 0xff5ca8, 1);
    awning.fillRect(startX + i * stripeW, -170, stripeW, 60);
  }
  for (let i = 0; i < n; i++) {
    awning.fillStyle(i % 2 ? 0xffffff : 0xff5ca8, 1);
    awning.fillCircle(startX + i * stripeW + stripeW / 2, -110, stripeW / 2);
  }
  awning.fillStyle(0xffd24c, 1); awning.fillRoundedRect(-236, -184, 472, 22, 10);

  // גלגלים
  const wheels = scene.add.graphics();
  [-150, 150].forEach(wx => {
    wheels.fillStyle(0x5a3d5c, 1); wheels.fillCircle(wx, 150, 36);
    wheels.fillStyle(0xd9d9e8, 1); wheels.fillCircle(wx, 150, 15);
  });

  // אדים מהבישול
  const steam = scene.add.particles(60, -120, 'dot', {
    scale: { start: 0.3, end: 0 }, alpha: { start: 0.4, end: 0 },
    speedY: { min: -40, max: -70 }, lifespan: 1500, frequency: 400, tint: 0xffffff
  });

  cart.add([shadow, wheels, body, counter, win, ella, board, boardTitle, menuItems, awning, steam]);
  scene.tweens.add({ targets: cart, y: y - 8, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  return cart;
}

/* ============ מסך פתיחה ============ */
class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    buildEnvironment(this);
    buildCart(this, DESIGN.w / 2, 450);

    const t = Helper.txt(this, DESIGN.w / 2, 150, 'העגלה של אלה', 96, '#ffffff');
    t.setStroke('#ff5ca8', 12); t.setShadow(0, 8, 'rgba(90,61,92,0.3)', 12);
    this.tweens.add({ targets: t, scale: 1.04, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    const sub = Helper.txt(this, DESIGN.w / 2, 232, 'פוד-טראק כיפי וצבעוני 🍔🍕🍦', 36, '#5a3d5c');
    sub.setBackgroundColor('rgba(255,255,255,0.6)').setPadding(16, 6, 16, 6);

    Helper.pillBtn(this, DESIGN.w / 2 - 180, 720, '▶  שחקו', Palette.pinkD, () => this.scene.start('World')).setDepth(20);
    Helper.pillBtn(this, DESIGN.w / 2 + 180, 720, '🎨 חופשי', 0x34c79a, () => this.scene.start('World', { free: true })).setDepth(20)._label.setFontSize(30);

    // כפתור צליל
    const sBtn = Helper.circleBtn(this, 70, 70, G.soundOn ? '🔊' : '🔇', 42, () => {
      const on = Sound.toggle(); G.soundOn = on;
      sBtn.list[1].setText(on ? '🔊' : '🔇');
    });

    // נצנוצים עדינים סביב הכותרת
    this.add.particles(0, 0, 'star', {
      x: { min: DESIGN.w / 2 - 300, max: DESIGN.w / 2 + 300 }, y: { min: 150, max: 320 },
      scale: { start: 0.4, end: 0 }, alpha: { start: 0.9, end: 0 },
      lifespan: 1800, frequency: 500, speedY: { min: -10, max: 10 }
    }).setDepth(6);
  }
}

/* ============ סצנת המשחק הראשית ============ */
class WorldScene extends Phaser.Scene {
  constructor() { super('World'); }

  init(data) { this.freeMode = !!(data && data.free); }

  create() {
    Sound.unlock();
    buildEnvironment(this);
    this.cart = buildCart(this, DESIGN.w / 2, 560);

    this.customers = [];
    this.busyCustomer = null;
    this.combo = 0;
    this.spawnTimer = 0.5;
    this.PATIENCE_BASE = 16;

    this.fxLayer = this.add.container(0, 0).setDepth(10);

    this.buildHUD();
    this.buildFx();

    if (this.freeMode) this.openFreeMenu();
    else this.fillSlots();

    // האזנה לסיום מיני-משחק
    this.game.events.on('mg-done', this.onMiniGameDone, this);
    this.events.once('shutdown', () => this.game.events.off('mg-done', this.onMiniGameDone, this));
  }

  /* ----- HUD ----- */
  buildHUD() {
    const hud = this.add.container(0, 0).setDepth(20);

    // מטבעות (ימין למעלה)
    const coinBg = this.add.graphics();
    coinBg.fillStyle(0x000000, 0.12); coinBg.fillRoundedRect(DESIGN.w - 300, 36, 264, 76, 38);
    coinBg.fillStyle(0xffffff, 1); coinBg.fillRoundedRect(DESIGN.w - 300, 30, 264, 76, 38);
    const coinIco = this.add.image(DESIGN.w - 270, 68, 'coin').setScale(1.1);
    this.coinText = this.add.text(DESIGN.w - 240, 68, '' + G.coins, {
      fontFamily:'Varela Round, Heebo, sans-serif', fontSize:'48px', color:'#e09b00', fontStyle:'bold'
    }).setOrigin(0, 0.5);
    hud.add([coinBg, coinIco, this.coinText]);

    // קומבו
    this.comboText = Helper.txt(this, DESIGN.w - 168, 132, '', 30, '#ff5ca8');
    hud.add(this.comboText);

    // כפתורים שמאל למעלה
    hud.add(Helper.circleBtn(this, 70, 70, '🏠', 44, () => this.goHome()));
    hud.add(Helper.circleBtn(this, 180, 70, '🛒', 44, () => { this.scene.launch('Store'); this.scene.bringToTop('Store'); this.scene.pause(); }));

    // המשך אחרי חזרה מהחנות
    this.game.events.on('store-closed', () => { this.scene.resume(); this.input.enabled = true; this.updateCoins(); }, this);
    this.events.once('shutdown', () => this.game.events.off('store-closed'));

    if (!this.freeMode)
      this.hint = Helper.txt(this, DESIGN.w / 2, DESIGN.h - 36, 'הקישו על לקוח כדי להכין את ההזמנה שלו 👆', 30, '#5a3d5c');
  }

  buildFx() {
    this.confetti = this.add.particles(0, 0, 'star', {
      lifespan: 1600, speed: { min: 200, max: 500 }, angle: { min: 220, max: 320 },
      gravityY: 700, scale: { start: 0.7, end: 0 }, rotate: { min: 0, max: 360 },
      emitting: false
    }).setDepth(30);
    this.hearts = this.add.particles(0, 0, 'heart', {
      lifespan: 1200, speed: { min: 80, max: 200 }, angle: { min: 230, max: 310 },
      gravityY: 200, scale: { start: 0.8, end: 0 }, emitting: false
    }).setDepth(30);
  }

  /* ----- לקוחות ----- */
  faces() { return ['🧒','👦','👧','🧑','👶','👩','🧓','🐰','🐻','🐱','🐶','🐼','🦄','🐯','🐸','🐵','🦊','🐨']; }
  foodKeys() { return Object.keys(G.FOODS); }

  slotPositions() {
    const max = G.maxSlots();
    const pos = [];
    const spread = Math.min(max, 5);
    const gap = 900 / spread;
    const startX = DESIGN.w / 2 - (gap * (spread - 1)) / 2;
    for (let i = 0; i < max; i++) pos.push({ x: startX + i * gap, y: 600 });
    return pos;
  }

  fillSlots() {
    const pos = this.slotPositions();
    const active = this.customers.filter(c => !c.leaving);
    for (let i = active.length; i < pos.length; i++) this.spawnCustomer(pos[i]);
  }

  spawnCustomer(slot) {
    const foods = this.foodKeys();
    const food = foods[(Math.random() * foods.length) | 0];
    const golden = Math.random() < 0.12;            // לקוח זהב (תוכן/גיוון)
    const face = this.faces()[(Math.random() * this.faces().length) | 0];
    const patienceMax = this.PATIENCE_BASE * G.patienceMul() * (golden ? 0.85 : 1);

    const cont = this.add.container(slot.x, slot.y + 400).setDepth(6);

    const shadow = this.add.ellipse(0, 70, 120, 26, 0x000000, 0.12);
    const faceTxt = this.add.text(0, 0, face, { fontSize: '96px' }).setOrigin(0.5);
    let goldEmitter = null;
    if (golden) {
      faceTxt.setTint(0xffe27a);
      goldEmitter = this.add.particles(0, 0, 'spark', { lifespan: 800, scale:{start:0.5,end:0}, alpha:{start:1,end:0},
        speed:{min:20,max:60}, frequency: 200, emitZone: { type:'random', source: new Phaser.Geom.Circle(0,0,50) } });
    }

    // בועת הזמנה
    const bubble = this.add.graphics();
    bubble.fillStyle(0xffffff, 1);
    bubble.fillRoundedRect(-55, -180, 110, 90, 20);
    bubble.fillTriangle(-12, -92, 12, -92, 0, -70);
    const orderTxt = this.add.text(0, -135, G.FOODS[food].emoji, { fontSize: '54px' }).setOrigin(0.5);

    // מד סבלנות
    const barBg = this.add.graphics();
    barBg.fillStyle(0xeadff0, 1); barBg.fillRoundedRect(-65, 52, 130, 18, 9);
    const barFill = this.add.rectangle(-63, 61, 126, 12, 0x48d39a).setOrigin(0, 0.5);

    const parts = [shadow];
    if (goldEmitter) parts.push(goldEmitter);
    parts.push(faceTxt, bubble, orderTxt, barBg, barFill);
    cont.add(parts);
    this.tweens.add({ targets: faceTxt, y: -8, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.tweens.add({ targets: orderTxt, scale: 1.12, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    const c = { food, golden, cont, faceTxt, orderTxt, barFill, patienceMax, patience: patienceMax, busy: false, leaving: false, slot };

    // כניסה עם קפיצה
    this.tweens.add({ targets: cont, y: slot.y, duration: 500, ease: 'Back.out' });

    faceTxt.setInteractive({ useHandCursor: true });
    faceTxt.on('pointerdown', () => { if (!c.busy && !c.leaving) this.startOrder(c); });

    this.customers.push(c);
  }

  update(time, delta) {
    if (this.freeMode) return;
    const dt = delta / 1000;
    this.customers.forEach(c => {
      if (c.leaving) return;
      c.patience -= dt;
      const r = Phaser.Math.Clamp(c.patience / c.patienceMax, 0, 1);
      c.barFill.width = 126 * r;
      c.barFill.setFillStyle(r > 0.5 ? 0x48d39a : r > 0.25 ? 0xf5b301 : 0xff5b5b);
      if (r < 0.5 && !c.busy) c.faceTxt.setAngle(r < 0.25 ? 4 : -3);
      if (c.patience <= 0) { if (c.busy) c.patience = 0; else this.leaveAngry(c); }
    });

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.customers.filter(c => !c.leaving).length < G.maxSlots()) {
      this.fillSlots();
      this.spawnTimer = (2.6 + Math.random() * 2) * G.paceMul();
    }
  }

  startOrder(c) {
    c.busy = true;
    this.busyCustomer = c;
    this.input.enabled = false;
    this.scene.launch('MiniGame', { food: c.food });
    this.scene.bringToTop('MiniGame');
  }

  onMiniGameDone(data) {
    this.scene.stop('MiniGame');
    this.input.enabled = true;
    const c = this.busyCustomer;
    this.busyCustomer = null;
    if (this.freeMode) { this.openFreeMenu(); return; }
    if (!c) return;
    if (data && data.success) this.serve(c);
    else { c.busy = false; if (c.faceTxt) c.faceTxt.setAngle(0); } // ויתור — בלי עונש
  }

  serve(c) {
    const ratio = Phaser.Math.Clamp(c.patience / c.patienceMax, 0, 1);
    const base = G.FOODS[c.food].base;
    let total = base + Math.round(base * G.tipMul() * ratio);
    if (c.golden) total *= 2;
    this.combo = Math.min(this.combo + 1, 9);
    if (this.combo >= 2) { total += this.combo * 2; this.comboText.setText('🔥 קומבו x' + this.combo); }

    G.addCoins(total);
    const sx = c.cont.x, sy = c.cont.y;
    this.flyCoins(sx, sy, Math.min(12, 3 + (total / 6) | 0));
    this.popPraise(sx, sy - 120, '+' + total + ' 🪙' + (c.golden ? '  זהב!' : ''));
    this.confetti.emitParticleAt(sx, sy - 80, c.golden ? 30 : 16);
    this.hearts.emitParticleAt(sx, sy - 40, 8);
    this.cameras.main.shake(120, 0.004);
    Sound.happy();
    this.leaveHappy(c, ratio > 0.6 ? 3 : ratio > 0.3 ? 2 : 1);
  }

  leaveHappy(c, stars) {
    c.leaving = true;
    c.orderTxt.setText('⭐'.repeat(stars));
    c.faceTxt.setText('😄').setAngle(0);
    this.tweens.add({ targets: c.cont, y: c.cont.y - 60, duration: 200, yoyo: true });
    this.tweens.add({ targets: c.cont, y: c.cont.y - 260, alpha: 0, angle: 8, duration: 700, delay: 200,
      onComplete: () => this.removeCustomer(c) });
  }

  leaveAngry(c) {
    c.leaving = true;
    this.combo = 0; this.comboText.setText('');
    c.faceTxt.setText('😣');
    c.orderTxt.setText('אוף!').setFontSize(24);
    Sound.sad();
    this.tweens.add({ targets: c.cont, x: c.cont.x + 300, alpha: 0, angle: 10, duration: 700,
      onComplete: () => this.removeCustomer(c) });
  }

  removeCustomer(c) {
    const i = this.customers.indexOf(c);
    if (i >= 0) this.customers.splice(i, 1);
    c.cont.destroy();
    this.time.delayedCall(600, () => { if (!this.freeMode && this.scene.isActive()) this.fillSlots(); });
  }

  /* ----- מיץ: מטבעות עפים + הודעת עידוד ----- */
  flyCoins(x, y, n) {
    for (let i = 0; i < n; i++) {
      const coin = this.add.image(x + Phaser.Math.Between(-40, 40), y + Phaser.Math.Between(-40, 40), 'coin').setDepth(31);
      this.tweens.add({
        targets: coin, x: DESIGN.w - 270, y: 68, scale: 0.7, duration: 500 + i * 30, ease: 'Cubic.in',
        onComplete: () => { coin.destroy(); this.updateCoins(); Sound.sparkle(); }
      });
    }
    Sound.cha_ching();
  }

  popPraise(x, y, txt) {
    const praises = ['כל הכבוד אלה!', 'מהמם!', 'יופי!', 'מעולה!', 'וואו!'];
    const p = praises[(Math.random() * praises.length) | 0];
    const label = Helper.txt(this, Phaser.Math.Clamp(x, 200, DESIGN.w - 200), y, p + '  ' + txt, 44, '#ff5ca8').setDepth(32);
    label.setStroke('#ffffff', 8).setScale(0.4);
    this.tweens.add({ targets: label, scale: 1, duration: 300, ease: 'Back.out' });
    this.tweens.add({ targets: label, y: y - 80, alpha: 0, duration: 900, delay: 500, onComplete: () => label.destroy() });
  }

  updateCoins() {
    this.coinText.setText('' + G.coins);
    this.tweens.add({ targets: this.coinText, scale: 1.3, duration: 120, yoyo: true });
  }

  goHome() { this.scene.stop('Store'); this.scene.start('Title'); }

  /* ----- מצב יצירה חופשית ----- */
  openFreeMenu() {
    if (this.freeMenu) this.freeMenu.destroy();
    const m = this.add.container(0, 0).setDepth(25);
    const title = Helper.txt(this, DESIGN.w / 2, 160, '🎨 יצירה חופשית — בחרו מה להכין', 40, '#5a3d5c');
    m.add(title);
    const foods = this.foodKeys();
    const gap = 240, startX = DESIGN.w / 2 - (gap * (foods.length - 1)) / 2;
    foods.forEach((k, i) => {
      const btn = this.add.container(startX + i * gap, 420);
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 1); g.fillRoundedRect(-90, -90, 180, 180, 28);
      const e = this.add.text(0, -20, G.FOODS[k].emoji, { fontSize: '90px' }).setOrigin(0.5);
      const nm = Helper.txt(this, 0, 60, G.FOODS[k].name, 30, '#5a3d5c');
      btn.add([g, e, nm]); btn.setSize(180, 180);
      btn.setInteractive(new Phaser.Geom.Rectangle(-90, -90, 180, 180), Phaser.Geom.Rectangle.Contains);
      btn.on('pointerdown', () => {
        Sound.tap();
        this.input.enabled = false;
        this.scene.launch('MiniGame', { food: k });
        this.scene.bringToTop('MiniGame');
      });
      m.add(btn);
    });
    this.freeMenu = m;
  }
}
