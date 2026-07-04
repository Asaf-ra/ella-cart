/* ===== עולם חי: סצנת פתיחה + סצנת משחק ראשית ===== */

/* בונה סביבה חיה (משמש גם במסך הפתיחה וגם במשחק) — מראה 2.5D פרימיום */
function buildEnvironment(scene) {
  const W = DESIGN.w, H = DESIGN.h;

  // ----- זוהר-אופק חמים ועדין (תחושת עומק, בלי להלבין את הסצנה) -----
  const haze = scene.add.graphics().setDepth(0);
  haze.fillGradientStyle(0xfff6e8, 0xfff6e8, 0xfff6e8, 0xfff6e8, 0, 0, 0.3, 0.3);
  haze.fillRect(0, H - 220, W, 110);

  // ----- שמש עם בלום רך, הילה וקרניים -----
  const sun = scene.add.container(165, 150).setDepth(0);
  const bloom = Helper.bloom(scene, 0, 0, 360, 0xfff0b0, 0.5);
  if (bloom) { sun.add(bloom); scene.tweens.add({ targets: bloom, scale: 1.12, alpha: 0.36, duration: 3200, yoyo: true, repeat: -1, ease: 'Sine.inOut' }); }
  const rays = scene.add.graphics();
  rays.fillStyle(0xfff2a8, 0.35);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    rays.fillTriangle(
      Math.cos(a) * 72, Math.sin(a) * 72,
      Math.cos(a + 0.12) * 160, Math.sin(a + 0.12) * 160,
      Math.cos(a - 0.12) * 160, Math.sin(a - 0.12) * 160
    );
  }
  const core = scene.add.graphics();
  core.fillStyle(0xffe27a, 1); core.fillCircle(0, 0, 64);
  core.fillStyle(0xfff1bd, 1); core.fillCircle(0, 0, 50);
  core.fillStyle(0xffffff, 0.9); core.fillCircle(-16, -18, 22);   // נקודת אור
  sun.add([rays, core]);
  Helper.glow(scene, core, 0xfff2a8, 10);
  scene.tweens.add({ targets: rays, angle: 360, duration: 50000, repeat: -1 });
  scene.tweens.add({ targets: core, scale: 1.06, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

  // ----- גבעות (שלוש שכבות לעומק, עם הבהק-קצה רך) -----
  const hillFar = scene.add.graphics().setDepth(1);
  hillFar.fillStyle(0xcdf2b4, 0.85);
  hillFar.fillEllipse(330, H - 120, 900, 360);
  hillFar.fillEllipse(980, H - 130, 1000, 400);

  const hillMid = scene.add.graphics().setDepth(2);
  hillMid.fillStyle(Palette.hillFar, 1);
  hillMid.fillEllipse(620, H - 90, 1100, 360);
  hillMid.fillStyle(0xe6ffcf, 0.5);                               // הבהק עליון רך
  hillMid.fillEllipse(620, H - 150, 1040, 300);

  const hillNear = scene.add.graphics().setDepth(3);
  hillNear.fillStyle(Palette.hillNear, 1);
  hillNear.fillEllipse(180, H - 60, 760, 320);
  hillNear.fillEllipse(1120, H - 70, 820, 340);
  hillNear.fillStyle(0xa8e886, 0.55);
  hillNear.fillEllipse(180, H - 110, 700, 240);
  hillNear.fillEllipse(1120, H - 122, 760, 250);

  // ----- קרקע דשא עם הדרגה וקצה רך -----
  const ground = scene.add.graphics().setDepth(4);
  ground.fillGradientStyle(0x86d97e, 0x86d97e, Palette.grassNear, Palette.grassNear, 1);
  ground.fillRect(0, H - 110, W, 110);
  ground.fillStyle(0xffffff, 0.10); ground.fillRect(0, H - 110, W, 8); // קו אור עליון
  ground.fillStyle(0x5cc15a, 1);
  for (let x = 0; x < W; x += 34) {
    ground.fillTriangle(x, H - 110, x + 12, H - 134, x + 24, H - 110);
  }

  // ----- פרחים קטנים מפוזרים על הדשא -----
  const flowerCols = [0xff8ac4, 0xffd24c, 0xff6f91, 0x9b8cff, 0xffffff];
  for (let i = 0; i < 14; i++) {
    const fx = 60 + Math.random() * (W - 120), fy = H - 84 + Math.random() * 60;
    const col = flowerCols[(Math.random() * flowerCols.length) | 0];
    const fl = scene.add.graphics().setDepth(4);
    fl.fillStyle(col, 1);
    for (let p = 0; p < 5; p++) { const a = (p / 5) * Math.PI * 2; fl.fillCircle(fx + Math.cos(a) * 6, fy + Math.sin(a) * 6, 5); }
    fl.fillStyle(0xffe27a, 1); fl.fillCircle(fx, fy, 4);
    scene.tweens.add({ targets: fl, angle: Phaser.Math.Between(-6, 6), duration: 1800 + Math.random() * 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  // ----- עצים מתנדנדים (עם צל רך וצללית עלווה) -----
  [[80, H - 130, 1], [1180, H - 140, 1.1], [1010, H - 120, 0.8]].forEach(([x, y, s]) => {
    Helper.softShadow(scene, x, y + 14, 90 * s, 26 * s);
    const tree = scene.add.container(x, y).setDepth(3).setScale(s);
    const trunk = scene.add.graphics();
    trunk.fillStyle(0x7d5430, 1); trunk.fillRoundedRect(-12, -70, 24, 80, 8);
    trunk.fillStyle(0x9b6b3f, 1); trunk.fillRoundedRect(-12, -70, 14, 80, 8);
    const leaves = scene.add.graphics();
    leaves.fillStyle(0x3fa83f, 1);
    leaves.fillCircle(0, -88, 48); leaves.fillCircle(-34, -68, 36); leaves.fillCircle(34, -70, 38);
    leaves.fillStyle(0x66c95e, 1);                                // הבהק עלווה
    leaves.fillCircle(-8, -100, 30); leaves.fillCircle(22, -84, 22);
    tree.add([trunk, leaves]);
    scene.tweens.add({ targets: tree, angle: 3, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  });

  // ----- אובך-עומק רך נסחף (בלום לבן עדין) -----
  if (scene.textures.exists('glowSoft')) {
    for (let i = 0; i < 3; i++) {
      const hz = scene.add.image(-200, 120 + Math.random() * 160, 'glowSoft')
        .setDepth(1).setAlpha(0.07).setBlendMode(Phaser.BlendModes.ADD)
        .setDisplaySize(380, 200).setTint(0xffffff);
      scene.tweens.add({ targets: hz, x: W + 200, duration: 38000 + Math.random() * 20000, repeat: -1, delay: i * 8000,
        onRepeat: () => { hz.y = 100 + Math.random() * 180; } });
    }
  }

  // ----- עננים נסחפים (רכים יותר) -----
  for (let i = 0; i < 5; i++) {
    const c = scene.add.image(-300, 80 + Math.random() * 200, 'cloud')
      .setDepth(2).setAlpha(0.92).setScale(0.6 + Math.random() * 0.7);
    scene.tweens.add({
      targets: c, x: W + 300, duration: 28000 + Math.random() * 20000,
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

  // ----- וינייטה עדינה (ממסגרת ומוסיפה עומק קולנועי) -----
  if (scene.textures.exists('vignette')) {
    scene.add.image(W / 2, H / 2, 'vignette').setDisplaySize(W + 40, H + 40).setDepth(9).setAlpha(0.5);
  }
}

/* בונה עגלה מצוירת חמודה. מחזיר container */
function buildCart(scene, x, y) {
  const cart = scene.add.container(x, y).setDepth(5);

  const shadow = Helper.softShadow(scene, 0, 158, 300, 46);

  const body = scene.add.graphics();
  body.fillStyle(0xc8860c, 1); body.fillRoundedRect(-220, 84, 440, 56, 18);                              // בסיס כהה (נפח/צל תחתון)
  body.fillGradientStyle(0xfff0b4, 0xffe884, 0xeaa916, 0xd99410, 1); body.fillRoundedRect(-220, -10, 440, 150, 26); // גוף עם מידול-אור (בהיר למעלה, כהה למטה)
  body.fillStyle(0xffffff, 0.32); body.fillRoundedRect(-205, 2, 410, 20, 10);                            // הבהק ספקולרי עליון
  body.fillStyle(0xffffff, 0.12); body.fillRoundedRect(-205, 28, 410, 7, 4);                             // רפלקס משני רך
  body.fillStyle(0xffe9a0, 0.6);  body.fillRoundedRect(-216, -6, 7, 142, 6);                             // רים-לייט שמאלי
  body.fillStyle(0x9c6a08, 0.32); body.fillRoundedRect(212, -6, 7, 142, 6);                              // צל-קצה ימני

  // דלפק תלת-ממדי עם שפה מתכתית מבריקה
  const counter = scene.add.graphics();
  counter.fillStyle(0xcdb074, 1); counter.fillRoundedRect(-235, 26, 470, 28, 12);                        // צל מתחת לדלפק
  counter.fillGradientStyle(0xfff8e8, 0xfff8e8, 0xe9d2a2, 0xe9d2a2, 1); counter.fillRoundedRect(-235, 18, 470, 26, 12); // משטח
  counter.fillStyle(0xffffff, 0.55); counter.fillRoundedRect(-228, 20, 456, 5, 3);                       // הבהק ספקולרי על השפה

  // חלון + אלה (תמונה מצוירת, עם נפילה לאמוג'י) — חלון עם עומק פנימי כמו מטבח אמיתי
  const win = scene.add.graphics();
  win.fillStyle(0xffffff, 1); win.fillRoundedRect(-152, -122, 134, 124, 16);                         // מסגרת לבנה
  win.fillGradientStyle(0xa9dced, 0xa9dced, 0xe6f7ff, 0xe6f7ff, 1); win.fillRoundedRect(-142, -112, 114, 104, 12); // פנים החלון (עומק)
  win.fillStyle(0x7cc0d4, 0.45); win.fillRect(-142, -36, 114, 7);                                     // מדף פנימי
  win.fillStyle(0x7cc0d4, 0.3); win.fillCircle(-34, -52, 7); win.fillCircle(-46, -50, 6);             // צנצנות על המדף
  // אלה עובדת בפנים — מתנדנדת קלות עם תנועת-עבודה
  let ella = Helper.charImg(scene, -85, -48, 'ella', 120);
  if (!ella) ella = scene.add.text(-85, -55, '👧', { fontSize: '78px' }).setOrigin(0.5);
  scene.tweens.add({ targets: ella, y: ella.y - 7, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  scene.tweens.add({ targets: ella, angle: { from: -3.5, to: 3.5 }, duration: 850, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  const glass = scene.add.graphics();
  glass.fillStyle(0xffffff, 0.4); glass.fillRoundedRect(-138, -108, 34, 92, 8);                       // השתקפות זכוכית

  // שלט תפריט עם אייקוני מאכל
  const board = scene.add.graphics();
  board.fillStyle(0xffffff, 1); board.fillRoundedRect(10, -130, 150, 130, 16);
  board.fillStyle(0xff5ca8, 1); board.fillRoundedRect(10, -130, 150, 30, { tl:16, tr:16, bl:0, br:0 });
  const boardTitle = scene.add.text(85, -115, 'תפריט', { fontFamily:'Heebo, sans-serif', fontSize:'20px', color:'#fff', fontStyle:'bold' }).setOrigin(0.5);
  const m1 = Helper.foodIcon(scene, 50, -70, 'shake', 40);
  const m2 = Helper.foodIcon(scene, 120, -70, 'burger', 40);
  const m3 = Helper.foodIcon(scene, 50, -28, 'pizza', 40);
  const m4 = Helper.foodIcon(scene, 120, -28, 'donut', 40);

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

  cart.add([shadow, wheels, body, counter, win, ella, glass, board, boardTitle, m1, m2, m3, m4, awning, steam]);
  scene.tweens.add({ targets: cart, y: y - 8, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  return cart;
}

/* ============ מסך פתיחה ============ */
class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    this.cameras.main.fadeIn(300, 174, 228, 255);
    buildEnvironment(this);
    buildCart(this, DESIGN.w / 2, 450);

    const t = Helper.txt(this, DESIGN.w / 2, 150, 'העגלה של אלה', 96, '#ffffff');
    t.setStroke('#ff5ca8', 12); t.setShadow(0, 8, 'rgba(90,61,92,0.3)', 12);
    Helper.glow(this, t, 0xffd1ec, 5);
    this.tweens.add({ targets: t, scale: 1.04, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    const sub = Helper.txt(this, DESIGN.w / 2, 232, 'פוד-טראק כיפי וצבעוני 🍔🍕🍦', 36, '#5a3d5c');
    sub.setBackgroundColor('rgba(255,255,255,0.6)').setPadding(16, 6, 16, 6);

    Helper.pillBtn(this, DESIGN.w / 2 - 180, 720, '▶  שחקו', Palette.pinkD, () => this.scene.start('World')).setDepth(20);
    Helper.pillBtn(this, DESIGN.w / 2 + 180, 720, '🎨 חופשי', 0x34c79a, () => this.scene.start('World', { free: true })).setDepth(20)._label.setFontSize(30);

    // כפתור צליל
    const sBtn = Helper.circleBtn(this, 70, 70, G.soundOn ? '🔊' : '🔇', 42, () => {
      const on = Sound.toggle(); G.soundOn = on;
      if (on) { Music.start(); Voice.say('יאללה, בואו נשחק!'); } else { Music.stop(); Voice.silence(); }
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
    this.cameras.main.fadeIn(300, 174, 228, 255);
    Sound.unlock();
    if (G.soundOn) Music.start();          // מוזיקת רקע (אחרי מחוות-משתמש = ניגון תקין)
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
    Helper.glow(this, coinIco, 0xffd24c, 5);
    this.tweens.add({ targets: coinIco, angle: 360, duration: 4000, repeat: -1 });
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
  chars() { return ['cust_girl','cust_boy','cust_bunny','cust_bear','cust_cat','cust_panda','cust_dog','cust_fox','cust_frog','cust_penguin','cust_pig','cust_mouse']; }
  faces() { return ['🧒','👦','🐰','🐻','🐱','🐼','🐶','🦊','🐸','🐧','🐷','🐭']; }
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
    for (let i = active.length; i < pos.length; i++) this.spawnCustomer(i);
    this.reflowQueue();
  }

  // מסדר מחדש את התור: כל לקוח (לפי סדר ההגעה) זוחל לאט למקומו — כשהקדמי עוזב, כולם מתקדמים
  reflowQueue() {
    const pos = this.slotPositions();
    const active = this.customers.filter(c => !c.leaving);
    active.forEach((c, i) => {
      const target = pos[Math.min(i, pos.length - 1)];
      c.slot = target; c.slotIndex = i;
      if (!c.busy && Math.abs(c.cont.x - target.x) > 2) {
        this.tweens.add({ targets: c.cont, x: target.x, y: target.y, duration: 950, ease: 'Sine.inOut' });
      }
    });
  }

  spawnCustomer(index) {
    const pos = this.slotPositions();
    const slot = pos[Math.min(index, pos.length - 1)];
    const enterX = pos[pos.length - 1].x + 860;       // נכנס מרחוק מצד ימין
    const foods = this.foodKeys();
    const food = foods[(Math.random() * foods.length) | 0];
    const order = G.makeOrder(food);
    const golden = Math.random() < 0.12;            // לקוח זהב (תוכן/גיוון)
    const i = (Math.random() * this.chars().length) | 0;
    const patienceMax = this.PATIENCE_BASE * G.patienceMul() * (golden ? 0.85 : 1);

    const cont = this.add.container(enterX, slot.y).setDepth(6);

    const shadow = Helper.softShadow(this, 0, 76, 90, 24);

    let faceObj = Helper.charImg(this, 0, -28, this.chars()[i], 168);
    let faceBaseY = -28;
    if (!faceObj) { faceObj = this.add.text(0, 0, this.faces()[i], { fontSize: '96px' }).setOrigin(0.5); faceBaseY = 0; }

    let goldEmitter = null;
    if (golden) {
      faceObj.setTint(0xffe27a);
      Helper.glow(this, faceObj, 0xffe27a, 6);
      goldEmitter = this.add.particles(0, 0, 'spark', { lifespan: 800, scale:{start:0.5,end:0}, alpha:{start:1,end:0},
        speed:{min:20,max:60}, frequency: 200, emitZone: { type:'random', source: new Phaser.Geom.Circle(0,0,60) } });
    }

    // בועת הזמנה (מציגה בדיוק מה הלקוח רוצה)
    const bubble = this.add.container(0, -150);
    this.fillOrderBubble(bubble, food, order);

    // מד סבלנות
    const barBg = this.add.graphics();
    barBg.fillStyle(0xeadff0, 1); barBg.fillRoundedRect(-65, 54, 130, 18, 9);
    const barFill = this.add.rectangle(-63, 63, 126, 12, 0x48d39a).setOrigin(0, 0.5);

    // אזור-מגע גדול וסלחני (קל לאצבע קטנה — בלי צורך לכוון על הפרצוף)
    const hit = this.add.zone(0, -20, 190, 250);

    const parts = [shadow];
    if (goldEmitter) parts.push(goldEmitter);
    parts.push(faceObj, bubble, barBg, barFill, hit);
    cont.add(parts);
    this.tweens.add({ targets: faceObj, y: faceBaseY - 8, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    const c = { food, order, golden, cont, faceObj, faceBaseY, bubble, barFill, patienceMax, patience: patienceMax,
                busy: false, leaving: false, slot, slotIndex: index, charKey: this.chars()[i], face: this.faces()[i] };

    // הליכה פנימה איטית מצד ימין (כמו בתור אמיתי) + ניתור קל
    this.tweens.add({ targets: cont, x: slot.x, duration: 1300, ease: 'Sine.inOut' });
    this.tweens.add({ targets: faceObj, angle: { from: -4, to: 4 }, duration: 150, yoyo: true, repeat: 4 });

    hit.setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => { if (!c.busy && !c.leaving) this.startOrder(c); });

    this.customers.push(c);
  }

  // ממלא את בועת ההזמנה: מאכל + בסיס + תוספות באייקונים
  fillOrderBubble(bubble, food, order) {
    bubble.removeAll(true);
    const n = 1 + (order.base ? 1 : 0) + order.toppings.length;
    const cell = 44, padX = 14, w = n * cell + padX * 2, h = 60;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.12); g.fillRoundedRect(-w/2, -h/2 + 6, w, h, 18);
    g.fillStyle(0xffffff, 1); g.fillRoundedRect(-w/2, -h/2, w, h, 18);
    g.fillTriangle(-12, h/2 - 2, 12, h/2 - 2, 0, h/2 + 20);
    bubble.add(g);
    let x = -w/2 + padX + cell/2;
    bubble.add(Helper.foodIcon(this, x, 0, food, 38)); x += cell;
    if (order.base) { bubble.add(Helper.icon(this, x, 0, order.base, 34)); x += cell; }
    order.toppings.forEach(t => { bubble.add(Helper.icon(this, x, 0, t, 32)); x += cell; });
    this.tweens.add({ targets: bubble, scale: 1.06, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  // מחליף את הבועה בתוצאה (כוכבים / הודעה)
  setBubbleResult(c, str, color) {
    this.tweens.killTweensOf(c.bubble);
    c.bubble.setScale(1); c.bubble.removeAll(true);
    const w = Math.max(120, str.length * 20 + 40), h = 60;
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1); g.fillRoundedRect(-w/2, -h/2, w, h, 18); g.fillTriangle(-12, h/2 - 2, 12, h/2 - 2, 0, h/2 + 20);
    const t = this.add.text(0, 0, str, { fontFamily:'Heebo, sans-serif', fontSize: '30px', color: color, fontStyle:'bold' }).setOrigin(0.5);
    c.bubble.add([g, t]);
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
      // עצבנות מתגברת — רעד וגוון אדמדם ככל שאוזל הזמן (אבל לא בזמן הכנה ולא ללקוח-זהב)
      if (!c.busy) {
        if (r < 0.25) {
          c.faceObj.setAngle(Math.sin(time / 80) * 6);
          if (!c.golden && c.faceObj.setTint) c.faceObj.setTint(0xffb0b0);
        } else if (r < 0.5) {
          c.faceObj.setAngle(Math.sin(time / 180) * 3);
          if (!c.golden && c.faceObj.clearTint) c.faceObj.clearTint();
        } else if (!c.golden && c.faceObj.clearTint) {
          c.faceObj.clearTint();
        }
      }
      if (c.patience <= 0) { if (c.busy) c.patience = 0; else this.leaveAngry(c); }
    });

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.customers.filter(c => !c.leaving).length < G.maxSlots()) {
      this.fillSlots();
      this.spawnTimer = (4.5 + Math.random() * 3) * G.paceMul();   // קצב רגוע, כמו תור אמיתי
    }
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
        this.floatMsg(DESIGN.w/2, 300, 'יצירה מהממת! +3 🪙', '#ff5ca8');
        this.confetti.emitParticleAt(DESIGN.w/2, 320, 18);
        Hero3D.show(data.food || (c && c.food) || 'donut', undefined, data.build);   // המנה ה-3D נבנית לפי מה שהוכן
        Sound.happy();
      }
      this.openFreeMenu(); return;
    }
    if (!c) return;
    if (data && data.success) {
      if (G.orderMatches(c.order, data.build)) this.serveOk(c, data.build);
      else this.serveWrong(c);
    } else { c.busy = false; if (c.faceObj) c.faceObj.setAngle(0); } // ויתור — בלי עונש
  }

  serveOk(c, build) {
    const ratio = Phaser.Math.Clamp(c.patience / c.patienceMax, 0, 1);
    const base = G.FOODS[c.food].base;
    const speedBonus = Math.round(base * G.tipMul() * ratio);     // טיפ לפי מהירות ההכנה
    let total = base + speedBonus + c.order.toppings.length * 2;
    if (c.golden) total *= 2;
    this.combo = Math.min(this.combo + 1, 9);
    if (this.combo >= 2) { total += this.combo * 2; this.comboText.setText('🔥 קומבו x' + this.combo); }

    G.addCoins(total);
    this.updateCoins();
    const sx = c.cont.x, sy = c.cont.y;
    this.flyCoins(sx, sy, Math.min(14, 3 + (total / 5) | 0));
    this.popPraise(sx, sy - 150, '+' + total + ' 🪙' + (c.golden ? '  זהב!' : ''));
    // הצגת בונוס-מהירות — שהילדה תרגיש שמהר = יותר מטבעות
    const speedTxt = ratio > 0.66 ? 'מהר מאוד! ⚡ טיפ ענק' : ratio > 0.33 ? 'יפה ומהר! 👍' : 'בדיוק בזמן ⏰';
    this.floatMsg(sx, sy - 222, speedTxt, ratio > 0.66 ? '#ff9500' : '#7a5cff');
    if (ratio > 0.66) Voice.say('וואו, מהר מאוד!'); else Voice.praise();
    this.confetti.emitParticleAt(sx, sy - 90, c.golden ? 30 : 16);
    this.hearts.emitParticleAt(sx, sy - 50, 8);
    this.cameras.main.shake(120, 0.004);
    Sound.happy();
    Hero3D.show(c.food, ratio > 0.66 ? 2800 : 2200, build);   // רגע-גיבור: המנה שהיא באמת הכינה, ב-3D
    this.leaveHappy(c, ratio > 0.6 ? 3 : ratio > 0.3 ? 2 : 1);
  }

  serveWrong(c) {
    this.combo = 0; this.comboText.setText('');
    Sound.sad();
    Voice.say('אופס, ננסה שוב');
    this.floatMsg(c.cont.x, c.cont.y - 150, 'אוי, לא בדיוק מה שביקשתי 😅', '#e07b39');
    this.leaveSad(c, 'לא נורא, אולי בפעם הבאה', '😕');
  }

  leaveHappy(c, stars) {
    c.leaving = true;
    this.setBubbleResult(c, '⭐'.repeat(stars), '#ff5ca8');
    c.faceObj.setAngle(0).clearTint();
    if (c.faceObj.type === 'Text') c.faceObj.setText('😄');
    this.tweens.add({ targets: c.cont, y: c.cont.y - 60, duration: 200, yoyo: true });
    this.tweens.add({ targets: c.cont, y: c.cont.y - 260, alpha: 0, angle: 8, duration: 700, delay: 250,
      onComplete: () => this.removeCustomer(c) });
  }

  // איחור (פג הזמן) — בלי מטבעות, אווירה קלילה
  leaveAngry(c) { this.combo = 0; this.comboText.setText(''); this.leaveSad(c, 'אוף, לא הספקתי!', '😣'); }

  leaveSad(c, msg, emoji) {
    if (c.leaving) return;
    c.leaving = true;
    if (c.faceObj.type === 'Text') c.faceObj.setText(emoji); else c.faceObj.setTint(0xffc2c2);
    this.setBubbleResult(c, msg, '#e07b39');
    this.tweens.add({ targets: c.cont, x: c.cont.x + 340, alpha: 0, angle: 8, duration: 750, delay: 200,
      onComplete: () => this.removeCustomer(c) });
  }

  removeCustomer(c) {
    const i = this.customers.indexOf(c);
    if (i >= 0) this.customers.splice(i, 1);
    this.tweens.killTweensOf([c.cont, c.faceObj, c.bubble, c.barFill]);
    c.cont.destroy();
    if (!this.freeMode && this.scene.isActive()) this.reflowQueue();   // התור מתקדם מיד
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

  floatMsg(x, y, txt, color) {
    const label = Helper.txt(this, Phaser.Math.Clamp(x, 240, DESIGN.w - 240), y, txt, 40, color || '#ff5ca8').setDepth(32);
    label.setStroke('#ffffff', 8).setScale(0.4);
    this.tweens.add({ targets: label, scale: 1, duration: 300, ease: 'Back.out' });
    this.tweens.add({ targets: label, y: y - 80, alpha: 0, duration: 1000, delay: 600, onComplete: () => label.destroy() });
  }

  popPraise(x, y, txt) {
    const praises = ['כל הכבוד אלה!', 'מהמם!', 'יופי!', 'מעולה!', 'וואו!'];
    this.floatMsg(x, y, praises[(Math.random() * praises.length) | 0] + '  ' + txt, '#ff5ca8');
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
      const e = Helper.foodIcon(this, 0, -20, k, 110);
      const nm = Helper.txt(this, 0, 60, G.FOODS[k].name, 30, '#5a3d5c');
      btn.add([g, e, nm]); btn.setSize(180, 180);
      btn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 180, 180), Phaser.Geom.Rectangle.Contains);
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
