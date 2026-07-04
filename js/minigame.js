/* ===== מיני-משחקים (הכנה לפי הזמנה) + חנות ===== */

// שמות טעמים/צבעים להקראה — הילדה לא קוראת, הקול מאשר לה מה בחרה
const FLAVOR_NAMES = { '🍦':'וניל', '🍓':'תות', '🍫':'שוקולד', '🫐':'אוכמניות', '🍋':'לימון',
  '🩷':'ורוד', '🤎':'שוקולד', '🤍':'וניל', '💙':'כחול', '💜':'סגול' };

// שמות מרכיבים להקראה בזמן ההרכבה
const INGREDIENT_NAMES = { '🧀':'גבינה', '🥬':'חסה', '🍅':'עגבנייה', '🥒':'מלפפון', '🍳':'ביצה', '🧅':'בצל' };
// צבע מיץ לחיתוך לפי ירק
const VEG_JUICE = { '🥒':0x8bd84a, '🍅':0xff5b5b, '🧅':0xd9b3ff };

class MiniGameScene extends Phaser.Scene {
  constructor() { super('MiniGame'); }
  init(data) { this.food = data.food; this.order = data.order || { food: data.food, base: null, toppings: [] }; this.cust = data.cust || null; }

  create() {
    const W = DESIGN.w, H = DESIGN.h;
    this.cameras.main.fadeIn(250, 255, 246, 252);
    this.build = { base: null, toppings: [] };
    this.input.dragDistanceThreshold = 14;   // רעד אצבע קטן ≠ גרירה — אחרת הקשות של ילדה קטנה נבלעות

    const bg = this.add.graphics();
    bg.fillStyle(0xfff6fc, 1); bg.fillRect(0, 0, W, H);
    bg.fillStyle(0xe8fff6, 0.7); bg.fillRect(0, H - 180, W, 180);

    Helper.txt(this, W / 2, 52, G.FOODS[this.food].name + ' ' + G.FOODS[this.food].emoji, 46, '#ff5ca8');
    Helper.circleBtn(this, 70, 70, '✖', 42, () => this.finish(false));

    this.showTarget();
    this.buildCustomerCard();
    this.hintText = Helper.txt(this, W / 2, 215, '', 30, '#5a3d5c');

    if (this.food === 'burger') this.startBurgerCut();
    else if (this.food === 'shake') this.startShake();
    else if (this.food === 'pizza') this.startPizza();
    else if (this.food === 'donut') this.startDonut();

    this.time.delayedCall(350, () => Voice.say('מכינים ' + G.FOODS[this.food].name + '!'));   // מספרים לילדה מה מכינים
  }

  // כרטיס "מה להכין" — מציג את ההזמנה של הלקוח
  showTarget() {
    const o = this.order, cx = DESIGN.w / 2;
    const n = 1 + (o.base ? 1 : 0) + o.toppings.length;
    const cell = 52, padX = 24, w = n * cell + padX * 2 + 150, h = 84, y = 150;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.10); g.fillRoundedRect(cx - w/2, y - h/2 + 6, w, h, 22);
    g.fillStyle(0xffffff, 1); g.fillRoundedRect(cx - w/2, y - h/2, w, h, 22);
    g.lineStyle(4, 0xffd24c, 1); g.strokeRoundedRect(cx - w/2, y - h/2, w, h, 22);
    this.add.text(cx - w/2 + 78, y, 'להכין:', { fontFamily:'Heebo,sans-serif', fontSize:'30px', color:'#ff5ca8', fontStyle:'bold' }).setOrigin(0.5);
    let x = cx - w/2 + 150 + cell/2;
    Helper.foodIcon(this, x, y, this.food, 44); x += cell;
    if (o.base) { const b = Helper.icon(this, x, y, o.base, 40); this.bevel(b); x += cell; }
    o.toppings.forEach(t => { const it = Helper.icon(this, x, y, t, 38); this.bevel(it); x += cell; });
  }
  bevel(o) { /* רמז ויזואלי קטן */ if (o.setStroke) o.setStroke('#ffd24c', 2); }

  // כרטיס לקוח חי — רואים את מי מכינים, הטיים-בר מתקצר, והוא נעשה עצבני ככל שעובר הזמן
  buildCustomerCard() {
    if (!this.cust) return;
    const c = this.cust;
    const card = this.add.container(DESIGN.w - 180, 192).setDepth(40);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.08); g.fillRoundedRect(-140, -120, 280, 252, 26);
    g.fillStyle(0xffffff, 1); g.fillRoundedRect(-140, -128, 280, 252, 26);
    g.fillStyle(0xfff0f8, 1); g.fillRoundedRect(-140, -128, 280, 52, { tl:26, tr:26, bl:0, br:0 });
    card.add(g);
    card.add(this.add.text(0, -102, 'מכינים בשביל:', { fontFamily:'Heebo,sans-serif', fontSize:'24px', color:'#ff5ca8', fontStyle:'bold' }).setOrigin(0.5));

    let face = Helper.charImg(this, 0, 0, c.charKey, 150);
    if (!face) face = this.add.text(0, 0, c.face || '🙂', { fontSize: '92px' }).setOrigin(0.5);
    card.add(face); this._custFace = face;
    this.tweens.add({ targets: face, y: face.y - 6, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    this._custMood = this.add.text(106, -104, '😀', { fontSize: '46px' }).setOrigin(0.5);
    card.add(this._custMood);

    const barBg = this.add.graphics();
    barBg.fillStyle(0xeadff0, 1); barBg.fillRoundedRect(-104, 94, 208, 28, 14);
    const clock = this.add.text(-120, 108, '⏰', { fontSize: '34px' }).setOrigin(0.5);
    this._custBarW = 198;
    this._custBar = this.add.rectangle(-99, 108, this._custBarW, 20, 0x48d39a).setOrigin(0, 0.5);
    card.add([barBg, this._custBar, clock]);
    this._custCard = card;
  }

  // מחבר את הטיים-בר ומצב-הרוח לסבלנות החיה של הלקוח (שעדיין רצה בעולם מאחור)
  update(time) {
    if (!this.cust || !this._custBar) return;
    const c = this.cust;
    const r = Phaser.Math.Clamp(c.patience / c.patienceMax, 0, 1);
    this._custBar.width = this._custBarW * r;
    this._custBar.setFillStyle(r > 0.5 ? 0x48d39a : r > 0.25 ? 0xf5b301 : 0xff5b5b);
    this._custMood.setText(r > 0.6 ? '😀' : r > 0.35 ? '🙂' : r > 0.15 ? '😟' : '😣');
    if (r < 0.25 && this._custFace) this._custFace.setAngle(Math.sin(time / 70) * 6);
  }

  addTop(id) { if (this.build.toppings.indexOf(id) < 0) this.build.toppings.push(id); }

  finish(success) {
    if (success) { Sound.cha_ching(); this.confetti && this.confetti.emitParticleAt(DESIGN.w/2, DESIGN.h/2, 24); }
    this.time.delayedCall(success ? 250 : 0, () => this.game.events.emit('mg-done', { success: success, build: this.build, food: this.food }));
  }

  // כפתור הגשה (ירוק) עם מצב פעיל/כבוי; onServe מותאם (ברירת מחדל: סיום מיידי)
  serveButton(onServe) {
    const c = this.add.container(DESIGN.w / 2, DESIGN.h - 58);
    const g = this.add.graphics();
    const t = this.add.text(0, 0, '✓ הגישו!', { fontFamily:'Heebo,sans-serif', fontSize:'42px', color:'#fff', fontStyle:'bold' }).setOrigin(0.5);
    t.setShadow(0, 2, 'rgba(0,0,0,0.25)', 2);
    const draw = (on) => { g.clear();
      g.fillStyle(0x000000, 0.2); g.fillRoundedRect(-150, -36, 300, 86, 43);
      g.fillStyle(on ? 0x2aa57e : 0x9aa39c, 1); g.fillRoundedRect(-150, -43, 300, 86, 43);
      g.fillGradientStyle(on?0x6fe6bf:0xc6cdc8, on?0x6fe6bf:0xc6cdc8, on?0x34c79a:0xafb8b2, on?0x34c79a:0xafb8b2, 1); g.fillRoundedRect(-150, -48, 300, 86, 43);
      g.fillStyle(0xffffff, 0.28); g.fillRoundedRect(-140, -42, 280, 30, 15); };
    c.add([g, t]); c.setSize(300, 86).setInteractive(new Phaser.Geom.Rectangle(0, 0, 300, 86), Phaser.Geom.Rectangle.Contains); // hit-area לקונטיינר נבדק אחרי הוספת displayOrigin (w/2,h/2) — חייב להתחיל מ-(0,0)
    c._on = false; draw(false);
    c.enable = (v) => { c._on = v; draw(v); return c; };
    c.on('pointerdown', () => { if (c._on) { this.tweens.add({ targets:c, scale:0.92, duration:70, yoyo:true }); (onServe || (() => this.finish(true)))(); } else Sound.tap(); });
    this.confetti = this.add.particles(0, 0, 'star', { lifespan:1500, speed:{min:200,max:480}, angle:{min:200,max:340}, gravityY:700, scale:{start:0.7,end:0}, rotate:{min:0,max:360}, emitting:false }).setDepth(50);
    return c;
  }

  // כפתור פעולה תלת-ממדי דינמי (שלבי פיצה / המשך חיתוך)
  actionBtn(x, y, label, color) {
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    const t = this.add.text(0, 0, label, { fontFamily:'Heebo,sans-serif', fontSize:'38px', color:'#fff', fontStyle:'bold' }).setOrigin(0.5);
    t.setShadow(0, 2, 'rgba(0,0,0,0.25)', 2);
    const dark = Phaser.Display.Color.IntegerToColor(color).darken(24).color;
    const light = Phaser.Display.Color.IntegerToColor(color).lighten(16).color;
    const draw = (on) => { g.clear();
      g.fillStyle(0x000000, 0.22); g.fillRoundedRect(-150, -36, 300, 86, 43);
      g.fillStyle(on ? dark : 0x9aa39c, 1); g.fillRoundedRect(-150, -43, 300, 86, 43);
      g.fillGradientStyle(on?light:0xc6cdc8, on?light:0xc6cdc8, on?color:0xafb8b2, on?color:0xafb8b2, 1); g.fillRoundedRect(-150, -48, 300, 86, 43);
      g.fillStyle(0xffffff, 0.28); g.fillRoundedRect(-140, -42, 280, 30, 15); };
    c.add([g, t]); c.setSize(300, 86).setInteractive(new Phaser.Geom.Rectangle(0, 0, 300, 86), Phaser.Geom.Rectangle.Contains); // hit-area לקונטיינר נבדק אחרי הוספת displayOrigin (w/2,h/2) — חייב להתחיל מ-(0,0)
    c._on = false; draw(false);
    c.enable = (v) => { c._on = v; draw(v); return c; };
    c.setLabel = (s) => { t.setText(s); return c; };
    c.onTap = (fn) => { c._fn = fn; return c; };
    c.on('pointerdown', () => { if (c._on && c._fn) { this.tweens.add({ targets:c, scale:0.92, duration:70, yoyo:true }); c._fn(); } else Sound.tap(); });
    return c;
  }

  imgOrText(x, y, emoji, size) { return Helper.icon(this, x, y, emoji, size); }

  // עיניים גוגלי — עוקבות אחרי האצבע, ממצמצות; מחזיר lookAt/pop לחיווט
  googlyEyes(cx, cy, gap, r) {
    const eyes = this.add.container(cx, cy).setDepth(6);
    const mk = (ox) => {
      const w = this.add.graphics();
      w.fillStyle(0xffffff, 1); w.fillCircle(ox, 0, r);
      w.lineStyle(3, 0x5a3d5c, 0.2); w.strokeCircle(ox, 0, r);
      const pupil = this.add.graphics();
      pupil.fillStyle(0x3a2a3c, 1); pupil.fillCircle(0, 0, r * 0.4);
      pupil.fillStyle(0xffffff, 0.9); pupil.fillCircle(-r * 0.13, -r * 0.13, r * 0.13);
      pupil.setPosition(ox, 0);
      eyes.add([w, pupil]);
      return { ox, pupil };
    };
    const eL = mk(-gap), eR = mk(gap);
    const lookAt = (px, py) => { [eL, eR].forEach(e => {
      const ax = cx + e.ox, dx = px - ax, dy = py - cy, d = Math.hypot(dx, dy) || 1, m = Math.min(r * 0.4, d * 0.25);
      e.pupil.setPosition(e.ox + dx / d * m, dy / d * m); }); };
    const pop = () => { this.tweens.killTweensOf(eyes); eyes.setScale(1.16); this.tweens.add({ targets: eyes, scale: 1, duration: 180, ease: 'Back.out' }); };
    this.time.addEvent({ delay: 2800, loop: true, callback: () => this.tweens.add({ targets: eyes, scaleY: 0.12, duration: 90, yoyo: true }) });
    return { eyes, lookAt, pop };
  }

  // פריט נגרר (מרכיב המבורגר) — גם הקשה פשוטה מוסיפה (חשוב לגיל 3!)
  ingredient(x, y, emoji, onPlace) {
    const t = this.imgOrText(x, y, emoji, 86);
    t.setInteractive({ draggable: true }); this.input.setDraggable(t);
    // בלי סף — כל תזוזת אצבע קטנה נחשבת גרירה והקשה נכשלת (באג אייפד); הסף נקבע בסצנה
    const home = { x, y }; let moved = false;
    t.on('pointerdown', () => { moved = false; });
    t.on('drag', (p, dx, dy) => { moved = true; t.x = dx; t.y = dy; t.setScale(t._base * 1.15); });
    t.on('dragend', (p) => { t.setScale(t._base); if (p.y < DESIGN.h - 210) { Sound.pop(); onPlace(); } this.tweens.add({ targets: t, x: home.x, y: home.y, duration: 150 }); });
    t.on('pointerup', () => { if (!moved) { Sound.pop(); onPlace(); } });
    return t;
  }

  // פריט בהקשה
  tapItem(x, y, emoji, onTap) {
    const t = this.imgOrText(x, y, emoji, 70);
    t.setInteractive({ useHandCursor: true });
    t.on('pointerdown', () => { this.tweens.add({ targets:t, scale:t._base * 1.2, duration:80, yoyo:true }); onTap(); });
    return t;
  }

  /* ============ המבורגר ============ */
  startBurgerCut() {
    this.hintText.setText('חתכו ירקות (כיף!) ואז המשיכו להרכבה 🔪');
    this.cutObjs = [];
    Helper.shadowEl(this, DESIGN.w/2, 532, 700, 56);
    const board = this.add.graphics();
    board.fillStyle(0x946c34, 1); board.fillRoundedRect(DESIGN.w/2 - 340, 312, 680, 210, 30);
    board.fillGradientStyle(0xdab474, 0xdab474, 0xc09250, 0xc09250, 1); board.fillRoundedRect(DESIGN.w/2 - 340, 304, 680, 210, 30);
    board.fillStyle(0xffffff, 0.10); board.fillRoundedRect(DESIGN.w/2 - 320, 316, 640, 36, 18);
    // סיבי עץ על הקרש — פרט קטן שעושה הרבה
    board.lineStyle(2, 0xb08448, 0.5);
    for (let i = 0; i < 5; i++) { board.beginPath(); board.moveTo(DESIGN.w/2 - 300, 340 + i * 36); board.lineTo(DESIGN.w/2 + 300, 336 + i * 36); board.strokePath(); }
    this.cutObjs.push(board);

    const knife = this.add.text(0, 0, '🔪', { fontSize: '84px' }).setOrigin(0.5).setDepth(5).setVisible(false);
    const vegs = ['🥒', '🍅', '🧅']; let idx = 0;
    const contBtn = this.actionBtn(DESIGN.w / 2, DESIGN.h - 58, '✓ המשך', 0x34c79a);

    const loadVeg = () => {
      const veg = this.imgOrText(DESIGN.w / 2, 388, vegs[idx], 140); this.cutObjs.push(veg);
      Voice.say('חותכים ' + (INGREDIENT_NAMES[vegs[idx]] || '') + '!');
      const slices = []; let lastX = null, pressing = false;
      contBtn.enable(true).setLabel(idx < vegs.length - 1 ? '✓ המשך' : '✓ להרכבה');
      const onDown = (p) => { pressing = true; lastX = p.x; knife.setVisible(true).setPosition(p.x, p.y); };
      const onMove = (p) => { if (!pressing) return; knife.setPosition(p.x, p.y); if (lastX != null && Math.abs(p.x - lastX) > 60) { lastX = p.x; cut(p); } };
      const onUp = () => { pressing = false; };
      const cut = (p) => { Sound.chop(); this.cutFx(p.x, p.y, VEG_JUICE[vegs[idx]]);
        // סוווש — קו חיתוך לבן שנעלם מהר
        const sw = this.add.graphics().setDepth(4);
        sw.lineStyle(5, 0xffffff, 0.85); sw.beginPath(); sw.moveTo(p.x - 8, p.y - 46); sw.lineTo(p.x + 8, p.y + 46); sw.strokePath();
        this.tweens.add({ targets: sw, alpha: 0, duration: 220, onComplete: () => sw.destroy() });
        this.tweens.add({ targets: veg, scaleX: veg._base * 1.08, duration: 80, yoyo: true });
        const slot = slices.length % 7;
        const s = this.imgOrText(DESIGN.w/2 - 260 + slot * 80, 472, vegs[idx], 64); s.setAngle(Phaser.Math.Between(-20, 20));
        const b = s._base || 1; s.setScale(b * 0.4); this.tweens.add({ targets: s, scale: b, duration: 200, ease: 'Back.out' });
        if (slices[slot]) slices[slot].destroy(); slices[slot] = s; this.cutObjs.push(s); };
      contBtn.onTap(() => {
        this.input.off('pointerdown', onDown); this.input.off('pointermove', onMove); this.input.off('pointerup', onUp);
        this.tweens.add({ targets: veg, alpha: 0, duration: 200, onComplete: () => veg.destroy() });
        slices.forEach(o => o && this.tweens.add({ targets:o, alpha:0, y:o.y+40, duration:250, onComplete:()=>o.destroy() }));
        idx++;
        if (idx < vegs.length) { knife.setVisible(false); loadVeg(); }
        else { Sound.ding(); knife.destroy(); contBtn.destroy(); this.startBurgerStack(); }
      });
      this.input.on('pointerdown', onDown); this.input.on('pointermove', onMove); this.input.on('pointerup', onUp);
    };
    loadVeg();
  }

  cutFx(x, y, color) {
    const p = this.add.particles(x, y, 'spark', { lifespan: 500, speed:{min:60,max:160}, scale:{start:0.6,end:0}, tint: color || 0x8bd84a, emitting: false });
    p.explode(10, x, y); this.time.delayedCall(600, () => p.destroy());
  }

  /* ----- שכבות המבורגר מצוירות — כל שכבה נראית כמו המרכיב האמיתי ----- */
  // מחזיר { c: container, adv: כמה גובה השכבה מוסיפה לערימה }
  burgerLayer(type) {
    const c = this.add.container(0, 0);
    const g = this.add.graphics();
    c.add(g);
    let adv = 26;
    switch (type) {
      case '🍞': { // לחמנייה תחתונה
        g.fillStyle(0xb97a2e, 1); g.fillRoundedRect(-165, -14, 330, 42, { tl:10, tr:10, bl:22, br:22 });
        g.fillGradientStyle(0xf2b660, 0xf2b660, 0xd9963f, 0xd9963f, 1); g.fillRoundedRect(-165, -18, 330, 42, { tl:10, tr:10, bl:22, br:22 });
        g.fillStyle(0xfff0d0, 0.55); g.fillRoundedRect(-150, -12, 300, 10, 5);
        adv = 26; break;
      }
      case '🥩': { // קציצה עסיסית עם פסי צריבה
        g.fillStyle(0x5a3820, 1); g.fillRoundedRect(-170, -12, 340, 40, 20);
        g.fillGradientStyle(0x8a5330, 0x8a5330, 0x6b3f22, 0x6b3f22, 1); g.fillRoundedRect(-170, -16, 340, 40, 20);
        g.fillStyle(0x4a2c16, 0.8);
        for (let i = 0; i < 5; i++) g.fillRoundedRect(-140 + i * 66, -10, 34, 7, 3);   // פסי גריל
        g.fillStyle(0xb87848, 0.5); g.fillRoundedRect(-150, -13, 130, 7, 3);           // ברק עסיסי
        adv = 24; break;
      }
      case '🧀': { // גבינה נמסה — ריבוע עם פינות שנשפכות
        g.fillStyle(0xe8a30e, 1);
        g.fillRoundedRect(-160, -8, 320, 18, 4);
        g.fillTriangle(-160, 8, -120, 8, -140, 30);                                    // טפטוף שמאל
        g.fillTriangle(60, 8, 110, 8, 86, 34);                                         // טפטוף ימין
        g.fillTriangle(-30, 8, 14, 8, -8, 26);
        g.fillGradientStyle(0xffcf50, 0xffcf50, 0xf0b020, 0xf0b020, 1); g.fillRoundedRect(-160, -11, 320, 16, 4);
        adv = 10; break;
      }
      case '🥬': { // חסה מסולסלת שמציצה מהצדדים
        g.fillStyle(0x4f9e3f, 1);
        for (let i = 0; i < 9; i++) g.fillEllipse(-176 + i * 44, 4, 60, 22);
        g.fillStyle(0x7ecb5a, 1);
        for (let i = 0; i < 9; i++) g.fillEllipse(-176 + i * 44 + 4, -2, 56, 20);
        g.fillStyle(0xa8e88a, 0.7);
        for (let i = 0; i < 9; i++) g.fillEllipse(-176 + i * 44 + 6, -6, 34, 10);
        adv = 12; break;
      }
      case '🍅': { // שתי פרוסות עגבנייה עם גרעינים
        [-80, 80].forEach(ox => {
          g.fillStyle(0xb32020, 1); g.fillEllipse(ox, 4, 168, 26);
          g.fillStyle(0xe23b3b, 1); g.fillEllipse(ox, 0, 168, 26);
          g.fillStyle(0xff7a6e, 0.9); g.fillEllipse(ox, 0, 132, 17);
          g.fillStyle(0xffd6c8, 0.9);
          for (let i = 0; i < 5; i++) { const a = i * 1.257 + 0.4; g.fillEllipse(ox + Math.cos(a) * 44, Math.sin(a) * 5, 10, 4); } // גרעינים
        });
        adv = 12; break;
      }
      case '🥒': { // שלוש פרוסות מלפפון חמוץ עם פסים
        [-96, 0, 96].forEach(ox => {
          g.fillStyle(0x4e8c2e, 1); g.fillEllipse(ox, 4, 96, 22);
          g.fillStyle(0x74b842, 1); g.fillEllipse(ox, 0, 96, 22);
          g.fillStyle(0xa8d878, 0.9); g.fillEllipse(ox, 0, 70, 14);
          g.fillStyle(0x4e8c2e, 0.55);
          for (let i = 0; i < 4; i++) { const a = i * 1.57 + 0.6; g.fillEllipse(ox + Math.cos(a) * 22, Math.sin(a) * 4, 8, 3); }
        });
        adv = 12; break;
      }
      case '🧅': { // טבעות בצל שקופות-סגלגלות
        [-90, 0, 90].forEach((ox, i) => {
          g.lineStyle(9, 0xc9a0e8, 1); g.strokeEllipse(ox, 2 - (i % 2) * 4, 92, 26);
          g.lineStyle(4, 0xf2e2ff, 0.9); g.strokeEllipse(ox, 1 - (i % 2) * 4, 78, 20);
        });
        adv = 10; break;
      }
      case '🍳': { // ביצת עין — חלבון גלי וחלמון מבריק
        g.fillStyle(0xe8e0d0, 1); g.fillEllipse(0, 6, 300, 26);
        g.fillStyle(0xffffff, 1);
        g.fillEllipse(0, 0, 300, 26); g.fillEllipse(-90, -2, 130, 22); g.fillEllipse(80, -3, 150, 24);
        g.fillStyle(0xf5b301, 1); g.fillCircle(10, -6, 26);
        g.fillStyle(0xffd75e, 1); g.fillCircle(10, -8, 21);
        g.fillStyle(0xfff3c0, 0.95); g.fillEllipse(2, -14, 16, 8);
        adv = 16; break;
      }
      case '🍔': { // לחמנייה עליונה — כיפה עם שומשום
        const dome = this.add.graphics();
        dome.fillStyle(0xc9852f, 1); dome.slice(0, 14, 168, Math.PI, 0, false); dome.fillPath();
        dome.fillGradientStyle(0xf2b660, 0xf2b660, 0xd9963f, 0xd9963f, 1); dome.slice(0, 10, 165, Math.PI, 0, false); dome.fillPath();
        dome.fillStyle(0xfff0d0, 0.45); dome.slice(-30, 0, 100, Math.PI * 1.05, Math.PI * 1.75, false); dome.fillPath();
        dome.setScale(1, 0.62);                                                        // כיפה אליפטית
        c.add(dome);
        const seeds = this.add.graphics();                                             // שומשום (לא נמעך עם הכיפה)
        seeds.fillStyle(0xfff3da, 1);
        [[-96,-28,-20],[-52,-58,10],[0,-70,0],[52,-58,-12],[96,-28,22],[-24,-40,14],[30,-42,-18]]
          .forEach(s => { seeds.save(); seeds.translateCanvas(s[0], s[1]); seeds.rotateCanvas(s[2] * Math.PI / 180); seeds.fillEllipse(0, 0, 15, 8); seeds.restore(); });
        c.add(seeds);
        adv = 0; break;
      }
    }
    return { c, adv };
  }

  startBurgerStack() {
    (this.cutObjs || []).forEach(o => o.destroy()); this.cutObjs = [];
    // תלת-ממד חי אם Babylon מוכן; אחרת נפילה חכמה ל-2D המצויר
    let use3d = false;
    try { use3d = (typeof Hero3D !== 'undefined' && Hero3D.builderStart && Hero3D.builderStart('burger')); } catch (e) {}
    if (use3d) return this.stack3D();
    this.hintText.setText('הוסיפו את מה שביקשו, ואז הגישו! 🍔');
    const cx = DESIGN.w / 2;
    Helper.shadowEl(this, cx, 600, 460, 56);
    const pg = this.add.graphics();
    pg.fillStyle(0xcdc7da, 1); pg.fillEllipse(cx, 584, 430, 78);
    pg.fillStyle(0xffffff, 1); pg.fillEllipse(cx, 576, 410, 66);
    pg.fillStyle(0xe8e2f2, 0.8); pg.fillEllipse(cx, 578, 330, 44);                     // שקע פנימי בצלחת
    pg.fillStyle(0xffffff, 0.7); pg.fillEllipse(cx - 90, 562, 130, 18);                // ברק

    let topY = 560;                       // גובה הערימה הנוכחי (יורד עם כל שכבה)
    let layers = 0, served = false;
    const MAX_LAYERS = 11;                // שלא נגיע לכרטיס ההזמנה

    const dropLayer = (emoji, onLand) => {
      const spec = this.burgerLayer(emoji);
      topY -= spec.adv;
      const L = spec.c.setPosition(cx, topY - 230).setDepth(3 + layers);
      layers++;
      this.tweens.add({ targets: L, y: topY, duration: 320, ease: 'Bounce.out',
        onComplete: () => {
          // סקווש נחיתה + פירורים
          this.tweens.add({ targets: L, scaleY: 0.82, duration: 70, yoyo: true, ease: 'Quad.out' });
          this.cutFx(cx + Phaser.Math.Between(-90, 90), topY + 8, 0xffe0a0);
          if (onLand) onLand();
        } });
      return L;
    };

    // בסיס אוטומטי: לחמנייה תחתונה + קציצה
    dropLayer('🍞'); this.time.delayedCall(200, () => dropLayer('🥩'));

    // הגשה: הלחמנייה העליונה נוחתת, הבורגר מקבל פרצוף, ורק אז מסיימים
    const serve = this.serveButton(() => {
      if (served) return; served = true;
      serve.enable(false);
      dropLayer('🍔', () => {
        const eyes = this.googlyEyes(cx, topY - 42, 34, 15);          // עיניים על הכיפה
        eyes.eyes.setDepth(29);                                        // מעל כל השכבות (שכבות = 3+layers)
        eyes.pop();
        const smile = this.add.graphics().setDepth(30);
        smile.lineStyle(6, 0x5a3d5c, 1);
        smile.beginPath(); smile.arc(cx, topY - 26, 20, 0.2 * Math.PI, 0.8 * Math.PI, false); smile.strokePath();
        // אדים חמים מעל הבורגר
        const steam = this.add.particles(cx, topY - 90, 'spark', { tint: 0xffffff, alpha: { start: 0.45, end: 0 },
          speedY: { min: -70, max: -30 }, speedX: { min: -14, max: 14 }, scale: { start: 0.8, end: 1.6 },
          lifespan: 900, quantity: 1, frequency: 90 });
        Sound.happy();
        this.time.delayedCall(1100, () => { steam.stop(); this.finish(true); });
      });
    });
    this.time.delayedCall(700, () => serve.enable(true));

    // מגש מרכיבים: מה שנחתך זמין תמיד + מה שנפתח בתפריט (בלי כפילויות)
    const tops = Array.from(new Set(G.availToppings('burger').map(t => t.id).concat(['🍅', '🥒', '🧅'])));
    const startX = cx - (tops.length - 1) * 84 / 2;
    tops.forEach((e, i) => this.ingredient(startX + i * 84, DESIGN.h - 158, e, () => {
      if (served) return;
      if (layers >= MAX_LAYERS) {                                     // מגדל ענק — רק מתנדנד בצחוק
        this.cameras.main.shake(80, 0.003); Sound.bubble(); return;
      }
      dropLayer(e); this.addTop(e);
      Voice.say(INGREDIENT_NAMES[e] || '');
    }));
  }

  // הרכבה בתלת-ממד חי: המרכיבים נופלים כשכבות 3D, אצבע מסובבת את הבורגר
  stack3D() {
    this.hintText.setText('הוסיפו מרכיבים — ואפשר לסובב באצבע! 🍔');
    this.events.once('shutdown', () => { try { Hero3D.builderEnd(); } catch (e) {} });
    let served = false;

    // ----- במת תיאטרון: רקע כהה + זרקור — המנה זוהרת כמו ב-show הקולנועי -----
    const theater = this.add.container(0, 0).setDepth(1).setAlpha(0);
    const panel = this.add.graphics();
    panel.fillStyle(0x14091f, 0.95); panel.fillRoundedRect(150, 246, 980, 356, 38);          // מסגרת חיצונית
    panel.fillGradientStyle(0x32173f, 0x32173f, 0x190b26, 0x190b26, 1);
    panel.fillRoundedRect(158, 252, 964, 344, 34);                                           // פנים הבמה
    panel.fillStyle(0xffffff, 0.05); panel.fillRoundedRect(170, 260, 940, 60, 26);           // הבהוב עליון עדין
    theater.add(panel);
    // אלומת זרקור מהתקרה
    const beam = this.add.graphics();
    beam.fillGradientStyle(0xffe9b8, 0xffe9b8, 0xffe9b8, 0xffe9b8, 0.16, 0.16, 0.02, 0.02);
    beam.fillTriangle(640, 250, 400, 596, 880, 596);
    theater.add(beam);
    // הילת ספוט חמה מאחורי המנה + כתם אור על הרצפה
    const spot = this.add.image(640, 440, 'glowSoft').setDisplaySize(640, 430)
      .setTint(0xffd9a0).setAlpha(0.55).setBlendMode(Phaser.BlendModes.ADD);
    const floor = this.add.image(640, 560, 'glowSoft').setDisplaySize(560, 130)
      .setTint(0xffc890).setAlpha(0.4).setBlendMode(Phaser.BlendModes.ADD);
    theater.add([spot, floor]);
    // כוכבים מנצנצים על הבמה
    for (let i = 0; i < 14; i++) {
      const s = this.add.image(Phaser.Math.Between(210, 1070), Phaser.Math.Between(275, 575), 'spark')
        .setTint(0xfff0c8).setScale(Phaser.Math.FloatBetween(0.2, 0.55)).setAlpha(0.3);
      this.tweens.add({ targets: s, alpha: { from: 0.12, to: 0.85 }, scale: '+=0.15',
        duration: Phaser.Math.Between(700, 1600), yoyo: true, repeat: -1, delay: Math.random() * 1200 });
      theater.add(s);
    }
    this.tweens.add({ targets: theater, alpha: 1, duration: 450, ease: 'Quad.out' });
    this.tweens.add({ targets: spot, alpha: { from: 0.4, to: 0.62 }, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    const serve = this.serveButton(() => {
      if (served) return; served = true;
      serve.enable(false);
      Sound.happy();
      Hero3D.builderServe(() => this.finish(true));   // לחמנייה עליונה + אדים, ואז הקולנוע של world
    });
    this.time.delayedCall(800, () => serve.enable(true));

    const tops = Array.from(new Set(G.availToppings('burger').map(t => t.id).concat(['🍅', '🥒', '🧅'])));
    const startX = DESIGN.w / 2 - (tops.length - 1) * 84 / 2;
    tops.forEach((e, i) => this.ingredient(startX + i * 84, DESIGN.h - 158, e, () => {
      if (served) return;
      const r = Hero3D.builderAdd(e);
      if (r === 'full') { this.cameras.main.shake(80, 0.003); Sound.bubble(); return; }  // מגדל ענק
      if (!r) return;
      this.addTop(e);
      Voice.say(INGREDIENT_NAMES[e] || '');
    }));
  }

  /* ============ גלידה ============ */
  startShake() {
    this.hintText.setText('בחרו טעם והוסיפו את התוספות שביקשו! 🍦');
    const cx = DESIGN.w / 2, cyTop = 300, cupW = 190, cupH = 270, cyBot = cyTop + cupH;

    Helper.shadowEl(this, cx, cyBot + 18, cupW + 30, 40);
    const cup = this.add.graphics();
    cup.fillGradientStyle(0xffffff, 0xdfeaf2, 0xeef4f8, 0xcdd9e2, 0.5); cup.fillRoundedRect(cx - cupW/2, cyTop, cupW, cupH, { tl:24, tr:24, bl:48, br:48 });
    const maskG = this.make.graphics();
    maskG.fillStyle(0xffffff); maskG.fillRoundedRect(cx - cupW/2 + 8, cyTop + 8, cupW - 16, cupH - 16, { tl:18, tr:18, bl:42, br:42 });
    const fill = this.add.rectangle(cx, cyBot - 8, cupW - 16, 0, 0xff9ec4).setOrigin(0.5, 1).setMask(maskG.createGeometryMask());
    const gloss = this.add.graphics(); gloss.fillStyle(0xffffff, 0.35); gloss.fillRoundedRect(cx - cupW/2 + 16, cyTop + 18, 24, cupH - 80, 12);
    const rim = this.add.graphics(); rim.lineStyle(10, 0xffffff, 1); rim.strokeRoundedRect(cx - cupW/2, cyTop, cupW, cupH, { tl:24, tr:24, bl:48, br:48 });

    const tops = []; let level = 0;
    const serve = this.serveButton();

    // פרצוף חמוד על הכוס — עוקב אחרי האצבע ושמח בכל בחירה
    const face = this.googlyEyes(cx, cyTop + 92, 36, 18);
    this.input.on('pointermove', (p) => face.lookAt(p.x, p.y));

    const bases = G.availBases('shake');
    const bx0 = cx - 100 - (bases.length - 1) * 88 / 2;   // מוזז שמאלה — שלא יתנגש בשורת התוספות
    bases.forEach((f, i) => this.tapItem(bx0 + i * 88, DESIGN.h - 158, f.id, () => {
      this.build.base = f.id; level = Math.max(level, 70);
      fill.setFillStyle(f.color); this.tweens.add({ targets: fill, height: (cupH - 30) * (level/100), duration: 250 });
      Sound.bubble(); serve.enable(true); face.pop();
      Voice.say(FLAVOR_NAMES[f.id] || 'איזה יופי');
    }));

    const tlist = G.availToppings('shake');
    const tx = cx + 220;
    tlist.forEach((t, i) => this.tapItem(tx + i * 76, DESIGN.h - 158, t.id, () => {
      if (!this.build.base) { Sound.tap(); return; }
      const o = this.imgOrText(cx - 60 + tops.length * 30, cyTop - 6, t.id, 46);
      const b = o._base || 1; o.setScale(b*0.4); this.tweens.add({ targets:o, scale:b, duration:200, ease:'Back.out' });
      tops.push(o); this.addTop(t.id); Sound.sparkle(); face.pop();
    }));
  }

  /* ============ פיצה ============ */
  startPizza() {
    this.hintText.setText('מרחו רוטב על כל הפיצה — כמה שבא לכם! 🍅');
    const cx = DESIGN.w / 2, cy = 422, R = 180;

    Helper.shadowEl(this, cx, cy + R * 0.86, R * 2.1, R * 0.5);
    const dough = this.add.graphics();
    dough.fillStyle(0xa86a30, 1); dough.fillCircle(cx, cy + 8, R);                                   // צל תחתון של הקרום (נפח)
    dough.fillStyle(0xcf9050, 1); dough.fillCircle(cx, cy, R);                                       // קרום
    dough.fillStyle(0xe6ab64, 1); dough.fillCircle(cx, cy - 3, R - 3);                               // קרום עליון מואר
    dough.fillStyle(0xcf9a58, 1); dough.fillCircle(cx, cy, R - 22);                                  // AO — טבעת פנימית כהה
    dough.fillStyle(0xeac085, 1); dough.fillCircle(cx, cy - 2, R - 28);                              // בצק פנימי
    dough.fillStyle(0xf4d29a, 1); dough.fillEllipse(cx - 8, cy - 12, (R - 30) * 1.85, (R - 30) * 1.45); // אזור מואר
    dough.fillStyle(0xfff0cf, 0.45); dough.fillEllipse(cx - 42, cy - 40, (R - 44) * 1.05, (R - 44) * 0.62); // הבהק ספקולרי שמאל-עליון
    dough.fillStyle(0x9c6228, 0.4);
    for (let i = 0; i < 9; i++) { const a = Math.random() * 6.283, rr = R - 12; dough.fillCircle(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 3 + Math.random() * 3); } // נקודות חריכה על הקרום

    const rt = this.add.renderTexture(cx - R, cy - R, R * 2, R * 2).setOrigin(0, 0).setDepth(1);
    const softSauce = this.textures.exists('sauceDab');
    const sauceStamp = this.add.image(0, 0, softSauce ? 'sauceDab' : 'dot').setVisible(false);
    if (softSauce) sauceStamp.setScale(0.62); else sauceStamp.setTint(0xd62828).setScale(2.2);
    const cheeseLayer = this.add.container(0, 0).setDepth(2);
    const topLayer = this.add.container(0, 0).setDepth(3);

    // ----- עיניים מצחיקות (גוגלי) שעוקבות אחרי האצבע, ממצמצות, ומחייכות בסוף -----
    const eyes = this.add.container(cx, cy - 30).setDepth(6);
    const makeEye = (ox) => {
      const w = this.add.graphics();
      w.fillStyle(0xffffff, 1); w.fillCircle(ox, 0, 23);
      w.lineStyle(3, 0x5a3d5c, 0.2); w.strokeCircle(ox, 0, 23);
      const pupil = this.add.graphics();
      pupil.fillStyle(0x3a2a3c, 1); pupil.fillCircle(0, 0, 9);
      pupil.fillStyle(0xffffff, 0.9); pupil.fillCircle(-3, -3, 3);
      pupil.setPosition(ox, 0);
      eyes.add([w, pupil]);
      return { ox, pupil };
    };
    const eL = makeEye(-48), eR = makeEye(48);
    const lookAt = (px, py) => { [eL, eR].forEach(e => {
      const ax = cx + e.ox, ay = cy - 30, dx = px - ax, dy = py - ay, d = Math.hypot(dx, dy) || 1, m = Math.min(9, d * 0.25);
      e.pupil.setPosition(e.ox + dx / d * m, dy / d * m); }); };
    const eyePop = () => { this.tweens.killTweensOf(eyes); eyes.setScale(1.16); this.tweens.add({ targets: eyes, scale: 1, duration: 180, ease: 'Back.out' }); };
    this.time.addEvent({ delay: 2800, loop: true, callback: () => this.tweens.add({ targets: eyes, scaleY: 0.12, duration: 90, yoyo: true }) });

    let stepName = 'sauce', dabs = 0, shreds = 0, baked = false, selected = null, pressing = false, lastSnd = 0;
    const throttle = (fn) => { const n = this.time.now; if (n - lastSnd > 90) { lastSnd = n; fn(); } };
    const inR = (p, rad) => { const dx = p.x - cx, dy = p.y - cy; return dx*dx + dy*dy <= rad*rad; };

    const serve = this.serveButton(); serve.setVisible(false);
    const stepBtn = this.actionBtn(cx, DESIGN.h - 58, '🧀 עכשיו גבינה', 0xffb02e);

    // רוטב וגבינה — בלי שום הגבלה; הכפתור רק נפתח מוקדם, הילדה מוסיפה עד שבא לה ולוחצת המשך
    const paintSauce = (p) => { if (!inR(p, R - 12)) return; rt.draw(sauceStamp, p.x - (cx - R), p.y - (cy - R)); dabs++; if (dabs >= 8) stepBtn.enable(true); };
    const sprinkleCheese = (p) => { if (!inR(p, R - 10)) return;
      if (cheeseLayer.length > 220) return;                       // תקרת ביצועים שקטה (עדיין מרגיש אינסופי)
      for (let i = 0; i < 2; i++) { const a = Math.random()*6.283, rr = Math.random()*22;
        const sh = this.add.image(p.x+Math.cos(a)*rr, p.y+Math.sin(a)*rr, 'shred').setAngle(Math.random()*360);
        const sc = 0.7 + Math.random()*0.6; sh.setScale(sc*0.5); this.tweens.add({ targets: sh, scale: sc, duration: 160, ease: 'Back.out' });
        cheeseLayer.add(sh); shreds++; }
      if (shreds >= 10) stepBtn.enable(true); };
    const placeTopping = (p) => { if (!selected || !inR(p, R)) return;
      const o = this.imgOrText(p.x, p.y, selected, 52); topLayer.add(o);
      const b = o._base || 1; o.setScale(b*0.4); this.tweens.add({ targets:o, scale:b, duration:200, ease:'Back.out' });
      this.addTop(selected); Sound.pop(); eyePop(); };

    const onDown = (p) => { if (baked) return; pressing = true; lookAt(p.x, p.y);
      if (stepName === 'sauce') { paintSauce(p); throttle(()=>Sound.bubble()); eyePop(); }
      else if (stepName === 'cheese') { sprinkleCheese(p); throttle(()=>Sound.pop()); eyePop(); }
      else if (stepName === 'toppings') placeTopping(p); };
    const onMove = (p) => { lookAt(p.x, p.y); if (!pressing || baked) return;
      if (stepName === 'sauce') { paintSauce(p); throttle(()=>Sound.bubble()); }
      else if (stepName === 'cheese') { sprinkleCheese(p); throttle(()=>Sound.pop()); } };
    const onUp = () => { pressing = false; };
    this.input.on('pointerdown', onDown); this.input.on('pointermove', onMove); this.input.on('pointerup', onUp);

    const trayItems = [];
    const buildTray = () => {
      const list = G.availToppings('pizza').map(t => t.id);
      const sx = cx - (list.length - 1) * 84 / 2;
      list.forEach((t, i) => { const it = this.tapItem(sx + i * 84, DESIGN.h - 158, t, () => {
        selected = t; Sound.tap(); trayItems.forEach(o => o.clearTint && o.clearTint()); it.setTint && it.setTint(0x9ad0ff);
      }); trayItems.push(it); });
    };

    const goCheese = () => { stepName='cheese'; this.hintText.setText('פזרו גבינה — כמה שבא לכם! 🧀'); stepBtn.setLabel('🍅 עכשיו תוספות').enable(false).onTap(goToppings); };
    const goToppings = () => { stepName='toppings'; this.hintText.setText('בחרו תוספת והניחו על הפיצה 🍕'); buildTray(); stepBtn.setLabel('🔥 לאפות!').enable(true).onTap(bake); };
    const bake = () => { if (baked) return; baked = true; stepName='done'; Sound.ding();
      this.hintText.setText('אופה... 🔥'); stepBtn.setVisible(false);
      const melt = this.add.graphics().setDepth(2); melt.fillStyle(0xffcf6b, 0.26); melt.fillCircle(cx, cy, R - 16); // גבינה נמסה
      const heat = this.add.particles(cx, cy, 'spark', { tint:0xffa030, lifespan:900, speed:{min:20,max:90}, scale:{start:0.6,end:0}, quantity:2, frequency:60 });
      this.tweens.add({ targets: dough, alpha: 0.9, duration: 700, yoyo: true });
      this.tweens.add({ targets: eyes, y: cy - 38, duration: 420, yoyo: true, repeat: 1, ease: 'Sine.inOut' });
      this.time.delayedCall(1500, () => { heat.stop(); this.hintText.setText('מוכן! הגישו 😋');
        const smile = this.add.graphics().setDepth(6); smile.lineStyle(8, 0x5a3d5c, 1);
        smile.beginPath(); smile.arc(cx, cy + 4, 36, 0.15*Math.PI, 0.85*Math.PI, false); smile.strokePath();
        this.tweens.add({ targets: eyes, scale: 1.12, duration: 200, yoyo: true });
        serve.setVisible(true).enable(true); Sound.happy(); }); };
    stepBtn.onTap(goCheese);
  }

  /* ============ דונאט ============ */
  startDonut() {
    this.hintText.setText('בחרו ציפוי, והוסיפו את התוספות שביקשו! 🍩');
    const cx = DESIGN.w / 2, cy = 388, R = 165, hole = R * 0.36;

    Helper.shadowEl(this, cx, cy + R * 0.92, R * 2.1, R * 0.5);
    const base = this.add.graphics();
    base.fillStyle(0x9c6a34, 1); base.fillCircle(cx, cy + 8, R);                                 // צל תחתון (נפח)
    base.fillStyle(0xc98a4b, 1); base.fillCircle(cx, cy, R);                                     // גוף הדונאט
    base.fillStyle(0xdca263, 1); base.fillCircle(cx, cy - 5, R - 6);                             // צד עליון מואר
    base.fillStyle(0xe9b878, 1); base.fillEllipse(cx - 26, cy - 30, R * 1.0, R * 0.52);          // אזור מואר שמאל-עליון
    base.fillStyle(0xfff0d8, 0.4); base.fillEllipse(cx - 46, cy - 42, R * 0.6, R * 0.26);        // הבהק ספקולרי
    base.fillStyle(0x000000, 0.16); base.fillCircle(cx, cy, hole + 15);                          // AO סביב החור
    base.fillStyle(0xc98a4b, 1); base.fillCircle(cx, cy, hole + 6);
    base.fillStyle(0xfff6fc, 1); base.fillCircle(cx, cy, hole);                                  // החור

    const glaze = this.add.graphics().setDepth(1);
    const topLayer = this.add.container(0, 0).setDepth(2);
    const serve = this.serveButton();

    const drawGlaze = (color) => {
      glaze.clear();
      const light = Phaser.Display.Color.IntegerToColor(color).lighten(14).color;
      glaze.fillStyle(color, 1);
      glaze.beginPath(); glaze.arc(cx, cy - 4, R - 8, 0, Math.PI*2, false); glaze.arc(cx, cy - 4, hole + 8, 0, Math.PI*2, true); glaze.fillPath();
      for (let i = 0; i < 7; i++) { const a = 0.5 + i * 0.32; glaze.fillCircle(cx + Math.cos(a)*(R-12), cy - 4 + Math.sin(a)*(R-12), 9 + (i%3)*4); }
      glaze.fillStyle(light, 1);
      glaze.beginPath(); glaze.arc(cx, cy - 10, R - 14, Math.PI*1.05, Math.PI*1.95, false); glaze.arc(cx, cy - 10, hole + 12, Math.PI*1.95, Math.PI*1.05, true); glaze.fillPath();
      this.tweens.add({ targets: glaze, scaleX:1.04, scaleY:1.04, duration:120, yoyo:true });
    };

    const bases = G.availBases('donut');
    const startX = cx - 100 - (bases.length - 1) * 92 / 2;   // מוזז שמאלה — מקום ל-5 ציפויים בלי התנגשות בתוספות
    bases.forEach((f, i) => this.tapItem(startX + i * 92, DESIGN.h - 158, f.id, () => {
      this.build.base = f.id; drawGlaze(f.color); Sound.bubble(); serve.enable(true);
      Voice.say(FLAVOR_NAMES[f.id] || 'איזה יופי');
    }));

    const tlist = G.availToppings('donut');
    const tx = cx + 250;
    tlist.forEach((t, i) => this.tapItem(tx + i * 76, DESIGN.h - 158, t.id, () => {
      if (!this.build.base) { Sound.tap(); return; }
      const ang = Math.random()*6.283, rr = (hole + 18) + Math.random()*(R - hole - 36);
      const o = this.imgOrText(cx + Math.cos(ang)*rr, cy + Math.sin(ang)*rr, t.id, 40);
      const b = o._base || 1; o.setScale(b*0.4); this.tweens.add({ targets:o, scale:b, duration:180, ease:'Back.out' });
      topLayer.add(o); this.addTop(t.id); Sound.sparkle();
    }));
  }
}

/* ============ חנות שדרוגים ============ */
class StoreScene extends Phaser.Scene {
  constructor() { super('Store'); }

  create() {
    const W = DESIGN.w, H = DESIGN.h;
    this.cameras.main.fadeIn(250, 255, 246, 252);
    const bg = this.add.graphics();
    bg.fillStyle(0xfff6fc, 1); bg.fillRect(0, 0, W, H);

    Helper.txt(this, W / 2, 56, '🛒 חנות השדרוגים', 50, '#ff5ca8');
    Helper.circleBtn(this, 70, 70, '✖', 42, () => this.close());

    this.add.image(W - 240, 70, 'coin');
    this.coinText = this.add.text(W - 210, 70, '' + G.coins, { fontFamily:'Heebo,sans-serif', fontSize:'44px', color:'#e09b00', fontStyle:'bold' }).setOrigin(0, 0.5);

    this.cards = [];
    const cols = 4, cw = 290, ch = 300, gapX = 10, gapY = 20;
    const totalW = cols * cw + (cols - 1) * gapX;
    const startX = (W - totalW) / 2 + cw / 2, startY = 280;
    G.UPGRADES.forEach((u, i) => {
      const col = i % cols, row = (i / cols) | 0;
      this.cards.push(this.buildCard(u, startX + col * (cw + gapX), startY + row * (ch + gapY)));
    });
    this.refresh();
  }

  buildCard(u, x, y) {
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.08); g.fillRoundedRect(-135, -122, 270, 280, 24);
    g.fillStyle(0xffffff, 1); g.fillRoundedRect(-135, -130, 270, 280, 24);
    const ico = this.add.text(0, -78, u.ico, { fontSize: '76px' }).setOrigin(0.5);
    const name = Helper.txt(this, 0, -8, u.name, 30, '#5a3d5c');
    const lvl = Helper.txt(this, 0, 32, '', 24, '#9a7a9c');
    const buy = this.add.container(0, 96);
    const bg = this.add.graphics();
    const bt = this.add.text(0, 0, '', { fontFamily:'Heebo,sans-serif', fontSize:'30px', color:'#fff', fontStyle:'bold' }).setOrigin(0.5);
    buy.add([bg, bt]); buy.setSize(200, 64).setInteractive(new Phaser.Geom.Rectangle(0, 0, 200, 64), Phaser.Geom.Rectangle.Contains);
    buy.on('pointerdown', () => this.tryBuy(u, c));
    c.add([g, ico, name, lvl, buy]);
    c._lvl = lvl; c._buyBg = bg; c._buyTxt = bt; c._u = u;
    return c;
  }

  tryBuy(u, card) {
    if (G.buy(u.id)) {
      Sound.cha_ching();
      this.tweens.add({ targets: card, scale: 1.06, duration: 100, yoyo: true });
      this.add.particles(card.x, card.y - 60, 'star', { lifespan:1000, speed:{min:120,max:300}, scale:{start:0.6,end:0}, gravityY:500, emitting:false }).explode(12, card.x, card.y - 60);
      this.refresh();
    } else { Sound.sad(); this.tweens.add({ targets: card, x: card.x + 8, duration: 50, yoyo: true, repeat: 3 }); }
  }

  refresh() {
    this.coinText.setText('' + G.coins);
    this.cards.forEach(card => {
      const u = card._u, l = G.lvl(u.id), maxLvl = u.costs.length, cost = G.nextCost(u.id);
      card._lvl.setText('רמה ' + l + ' / ' + maxLvl);
      const bg = card._buyBg; bg.clear();
      if (cost === null) { bg.fillStyle(0x8fd3b6, 1); bg.fillRoundedRect(-100, -32, 200, 64, 32); card._buyTxt.setText('✓ מקסימום'); }
      else { const can = G.coins >= cost; bg.fillStyle(can ? 0xf5a800 : 0xc9b78a, 1); bg.fillRoundedRect(-100, -32, 200, 64, 32); card._buyTxt.setText('🪙 ' + cost); }
    });
  }

  close() { this.game.events.emit('store-closed'); this.scene.stop(); }
}
