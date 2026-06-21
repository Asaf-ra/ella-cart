/* ===== מיני-משחקים + חנות (Phaser) ===== */

/* מיפוי אמוג'י → טקסטורת איור מצוירת (נפילה לאמוג'י אם אין) */
const ING = {
  '🍞':'ing_bun_bottom', '🍔':'ing_bun_top', '🥩':'ing_patty', '🧀':'ing_cheese', '🥬':'ing_lettuce',
  '🍅':'ing_tomato', '🥒':'ing_cucumber', '🧅':'ing_onion',
  '🍓':'ing_straw', '🍫':'ing_choc', '🍦':'ing_vanilla', '🫐':'ing_blue',
  '🍒':'ing_cherry', '⭐':'star', '🍄':'ing_mushroom', '🫑':'ing_pepper', '🫒':'ing_olive', '🍍':'ing_pineapple'
};

class MiniGameScene extends Phaser.Scene {
  constructor() { super('MiniGame'); }
  init(data) { this.food = data.food; }

  create() {
    const W = DESIGN.w, H = DESIGN.h;
    this.cameras.main.fadeIn(250, 255, 246, 252);
    // רקע מלא
    const bg = this.add.graphics();
    bg.fillStyle(0xfff6fc, 1); bg.fillRect(0, 0, W, H);
    bg.fillStyle(0xe8fff6, 0.7); bg.fillRect(0, H - 180, W, 180);

    Helper.txt(this, W / 2, 60, G.FOODS[this.food].name + ' ' + G.FOODS[this.food].emoji, 50, '#ff5ca8');
    Helper.circleBtn(this, 70, 70, '✖', 42, () => this.finish(false));

    this.hintText = Helper.txt(this, W / 2, 130, '', 32, '#5a3d5c');

    if (this.food === 'burger') this.startBurgerCut();
    else if (this.food === 'shake') this.startShake();
    else if (this.food === 'pizza') this.startPizza();
    else if (this.food === 'donut') this.startDonut();
  }

  finish(success) {
    if (success) {
      Sound.cha_ching();
      this.confetti && this.confetti.emitParticleAt(DESIGN.w / 2, DESIGN.h / 2, 24);
    }
    this.time.delayedCall(success ? 250 : 0, () => this.game.events.emit('mg-done', { success }));
  }

  // כפתור הגשה עם מצב פעיל/כבוי
  serveButton() {
    const c = this.add.container(DESIGN.w / 2, DESIGN.h - 58);
    const g = this.add.graphics();
    const t = this.add.text(0, 0, '✓ הגישו!', { fontFamily:'Heebo, sans-serif', fontSize:'42px', color:'#fff', fontStyle:'bold' }).setOrigin(0.5);
    const draw = (on) => { g.clear(); g.fillStyle(0x000000, 0.18); g.fillRoundedRect(-150, -40, 300, 86, 43);
      g.fillStyle(on ? 0x34c79a : 0xb9c7c0, 1); g.fillRoundedRect(-150, -48, 300, 86, 43); };
    c.add([g, t]);
    c.setSize(300, 86).setInteractive(new Phaser.Geom.Rectangle(-150, -48, 300, 86), Phaser.Geom.Rectangle.Contains);
    c._on = false; draw(false);
    c.enable = (v) => { c._on = v; draw(v); };
    c.on('pointerdown', () => { if (c._on) { this.tweens.add({ targets:c, scale:0.92, duration:70, yoyo:true }); this.finish(true); } else Sound.tap(); });
    this.confetti = this.add.particles(0, 0, 'star', { lifespan:1500, speed:{min:200,max:480}, angle:{min:200,max:340},
      gravityY:700, scale:{start:0.7,end:0}, rotate:{min:0,max:360}, emitting:false }).setDepth(50);
    return c;
  }

  /* ---------- אובייקט מרכיב: תמונה מצוירת אם קיימת, אחרת אמוג'י ---------- */
  imgOrText(x, y, emoji, size) {
    const key = ING[emoji];
    if (key && this.textures.exists(key)) {
      const im = this.add.image(x, y, key); im.setScale(size / im.width); im._base = im.scaleX; return im;
    }
    const t = this.add.text(x, y, emoji, { fontSize: Math.round(size * 0.95) + 'px' }).setOrigin(0.5);
    t._base = 1; return t;
  }

  /* ---------- מגש מרכיבים נגרר ---------- */
  ingredient(x, y, emoji, onPlace) {
    const t = this.imgOrText(x, y, emoji, 88);
    t.setInteractive({ draggable: true });
    const home = { x, y };
    let moved = false;
    this.input.setDraggable(t);
    t.on('pointerdown', () => { moved = false; });
    t.on('drag', (p, dx, dy) => { moved = true; t.x = dx; t.y = dy; t.setScale(t._base * 1.15); });
    t.on('dragend', (p) => { t.setScale(t._base); if (p.y < DESIGN.h - 230) { Sound.pop(); onPlace(); }
      this.tweens.add({ targets: t, x: home.x, y: home.y, duration: 150 }); });
    t.on('pointerup', () => { if (!moved) { Sound.pop(); onPlace(); } });
    return t;
  }

  /* ============ המבורגר ============ */
  startBurgerCut() {
    this.hintText.setText('העבירו את האצבע על הירק כדי לחתוך — כמה שרוצים! 🔪');
    this.cutObjs = [];
    // קרש חיתוך תלת-ממדי
    Helper.shadowEl(this, DESIGN.w/2, 514, 740, 60);
    const board = this.add.graphics();
    board.fillStyle(0x946c34, 1); board.fillRoundedRect(DESIGN.w/2 - 360, 272, 720, 238, 30);
    board.fillGradientStyle(0xdab474, 0xdab474, 0xc09250, 0xc09250, 1); board.fillRoundedRect(DESIGN.w/2 - 360, 262, 720, 238, 30);
    board.fillStyle(0xffffff, 0.10); board.fillRoundedRect(DESIGN.w/2 - 340, 276, 680, 40, 18);
    this.cutObjs.push(board);

    const knife = this.add.text(0, 0, '🔪', { fontSize: '90px' }).setOrigin(0.5).setDepth(5).setVisible(false);
    const vegs = ['🥒', '🍅', '🧅'];
    let idx = 0;
    const continueBtn = this.actionBtn(DESIGN.w / 2, DESIGN.h - 58, '✓ המשך', 0x34c79a);

    const loadVeg = () => {
      const veg = this.imgOrText(DESIGN.w / 2, 360, vegs[idx], 150);
      this.cutObjs.push(veg);
      const slices = [];
      let lastX = null, pressing = false;
      continueBtn.enable(false).setLabel(idx < vegs.length - 1 ? '✓ המשך' : '✓ סיימתי');

      const onDown = (p) => { pressing = true; lastX = p.x; knife.setVisible(true).setPosition(p.x, p.y); };
      const onMove = (p) => {
        if (!pressing) return;
        knife.setPosition(p.x, p.y);
        if (lastX != null && Math.abs(p.x - lastX) > 60) { lastX = p.x; doCut(p); }
      };
      const onUp = () => { pressing = false; };
      const doCut = (p) => {
        Sound.chop(); this.cutFx(p.x, p.y);
        this.tweens.add({ targets: veg, scaleX: veg._base * 1.08, duration: 80, yoyo: true });
        const slot = slices.length % 8;
        const s = this.imgOrText(DESIGN.w/2 - 280 + slot * 80, 466, vegs[idx], 70); s.setAngle(Phaser.Math.Between(-20, 20));
        const b = s._base || 1; s.setScale(b * 0.4); this.tweens.add({ targets: s, scale: b, duration: 200, ease: 'Back.out' });
        if (slices[slot]) slices[slot].destroy();
        slices[slot] = s; this.cutObjs.push(s);
        continueBtn.enable(true);
      };
      continueBtn.onTap(() => {
        this.input.off('pointerdown', onDown); this.input.off('pointermove', onMove); this.input.off('pointerup', onUp);
        this.tweens.add({ targets: veg, alpha: 0, duration: 200, onComplete: () => veg.destroy() });
        slices.forEach(o => o && this.tweens.add({ targets: o, alpha: 0, y: o.y + 40, duration: 250, onComplete: () => o.destroy() }));
        idx++;
        if (idx < vegs.length) { knife.setVisible(false); loadVeg(); }
        else { Sound.ding(); knife.destroy(); this.startBurgerStack(); }
      });
      this.input.on('pointerdown', onDown); this.input.on('pointermove', onMove); this.input.on('pointerup', onUp);
    };
    loadVeg();
  }

  cutFx(x, y) {
    const p = this.add.particles(x, y, 'spark', { lifespan: 500, speed:{min:60,max:160}, scale:{start:0.6,end:0},
      tint: 0x8bd84a, quantity: 8, emitting: false });
    p.explode(8, x, y);
    this.time.delayedCall(600, () => p.destroy());
  }

  startBurgerStack() {
    (this.cutObjs || []).forEach(o => o.destroy());
    this.cutObjs = [];
    this.hintText.setText('גררו או הקישו על המרכיבים לבניית ההמבורגר! 🍔');

    // צלחת תלת-ממדית
    const cx = DESIGN.w / 2;
    Helper.shadowEl(this, cx, 588, 420, 56);
    const pg = this.add.graphics();
    pg.fillStyle(0xcdc7da, 1); pg.fillEllipse(cx, 572, 380, 76);
    pg.fillGradientStyle(0xffffff, 0xffffff, 0xe6e2ee, 0xe6e2ee, 1); pg.fillEllipse(cx, 564, 360, 64);
    pg.fillStyle(0xffffff, 0.6); pg.fillEllipse(cx - 60, 552, 120, 20);
    let count = 0;
    const baseY = 540;
    const serve = this.serveButton();

    const addLayer = (emoji) => {
      const ly = baseY - count * 30;
      const L = this.imgOrText(DESIGN.w / 2, ly - 200, emoji, 150);
      this.tweens.add({ targets: L, y: ly, duration: 300, ease: 'Bounce.out' });
      count++;
      if (count >= 4) serve.enable(true);
    };

    const items = ['🍞','🥩','🧀','🥬','🍅','🥒','🧅','🍔'];
    const startX = DESIGN.w / 2 - (items.length - 1) * 70 / 2;
    items.forEach((e, i) => this.ingredient(startX + i * 70, DESIGN.h - 158, e, () => addLayer(e)));
  }

  /* ============ מילקשייק ============ */
  startShake() {
    this.hintText.setText('בחרו טעם, מלאו את הכוס, והוסיפו קצפת ותוספות! 🥤');
    const cx = DESIGN.w / 2, cyTop = 250, cupW = 200, cupH = 300, cyBot = cyTop + cupH;

    // כוס תלת-ממדית: צל + זכוכית עם גרדיאנט
    Helper.shadowEl(this, cx, cyBot + 18, cupW + 30, 40);
    const cup = this.add.graphics();
    cup.fillGradientStyle(0xffffff, 0xdfeaf2, 0xeef4f8, 0xcdd9e2, 0.5); cup.fillRoundedRect(cx - cupW/2, cyTop, cupW, cupH, { tl:24, tr:24, bl:48, br:48 });

    // מסכה לפי צורת הכוס
    const maskG = this.make.graphics();
    maskG.fillStyle(0xffffff); maskG.fillRoundedRect(cx - cupW/2 + 8, cyTop + 8, cupW - 16, cupH - 16, { tl:18, tr:18, bl:42, br:42 });
    const mask = maskG.createGeometryMask();

    const fill = this.add.rectangle(cx, cyBot - 8, cupW - 16, 0, 0xff9ec4).setOrigin(0.5, 1);
    fill.setMask(mask);
    // ברק זכוכית
    const gloss = this.add.graphics();
    gloss.fillStyle(0xffffff, 0.35); gloss.fillRoundedRect(cx - cupW/2 + 18, cyTop + 20, 26, cupH - 80, 13);

    const rim = this.add.graphics();
    rim.lineStyle(10, 0xffffff, 1); rim.strokeRoundedRect(cx - cupW/2, cyTop, cupW, cupH, { tl:24, tr:24, bl:48, br:48 });

    let level = 0, flavor = null, cream = false;
    const tops = [];
    const serve = this.serveButton();

    const setLevel = () => {
      const h = (cupH - 30) * (level / 100);
      this.tweens.add({ targets: fill, height: h, duration: 250 });
      serve.enable(flavor && level >= 40);
    };

    const flavors = [
      { e:'🍓', c:0xff9ec4 }, { e:'🍫', c:0x8a5a3c }, { e:'🍦', c:0xfff3da }, { e:'🫐', c:0x7e8cff }
    ];
    const startX = cx - 360;
    flavors.forEach((f, i) => {
      this.ingredient(startX + i * 90, DESIGN.h - 158, f.e, () => {
        flavor = f; level = Math.min(100, level + 24); fill.setFillStyle(f.c); setLevel(); Sound.bubble();
      });
    });

    // קצפת
    this.tapItem(startX + 4 * 90 + 40, DESIGN.h - 158, '🍦', () => {
      if (!cream && level >= 40) { cream = true; const c = this.imgOrText(cx, cyTop + 6, '🍦', 80); tops.push(c); Sound.pop(); }
    });

    // תוספות
    const toppings = ['🍒','🍓','🍫','🫐','🥥','⭐'];
    const allowed = 4 + G.extraToppings();
    toppings.forEach((t, i) => {
      const locked = i >= allowed;
      this.tapItem(cx + 120 + i * 80, DESIGN.h - 158, t, () => {
        if (locked || level < 20) { Sound.tap(); return; }
        const obj = this.imgOrText(cx - 60 + tops.length * 26, cyTop - 10, t, 48);
        tops.push(obj); Sound.sparkle();
      }, locked);
    });
  }

  // פריט שמגיבים בהקשה (לא נגרר)
  tapItem(x, y, emoji, onTap, locked) {
    const t = this.imgOrText(x, y, emoji, 70);
    if (locked) t.setAlpha(0.35);
    t.setInteractive({ useHandCursor: true });
    t.on('pointerdown', () => { this.tweens.add({ targets:t, scale:t._base * 1.2, duration:80, yoyo:true }); onTap(); });
    return t;
  }

  /* ============ פיצה ============ */
  // כפתור פעולה תלת-ממדי עם מצב פעיל/כבוי, תווית ופעולה דינמיות
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
      g.fillStyle(0xffffff, 0.28); g.fillRoundedRect(-140, -42, 280, 30, 15);
    };
    c.add([g, t]); c.setSize(300, 86).setInteractive(new Phaser.Geom.Rectangle(-150, -48, 300, 86), Phaser.Geom.Rectangle.Contains);
    c._on = false; draw(false);
    c.enable = (v) => { c._on = v; draw(v); return c; };
    c.setLabel = (s) => { t.setText(s); return c; };
    c.onTap = (fn) => { c._fn = fn; return c; };
    c.on('pointerdown', () => { if (c._on && c._fn) { this.tweens.add({ targets:c, scale:0.92, duration:70, yoyo:true }); c._fn(); } else Sound.tap(); });
    return c;
  }

  startPizza() {
    this.hintText.setText('מרחו רוטב על כל הפיצה! 🍅');
    const cx = DESIGN.w / 2, cy = 372, R = 200;

    // בצק תלת-ממדי: צל, שוליים, קרום, בצק פנימי, ברק (הצללה חלקה, בלי גרדיאנט על עיגול)
    Helper.shadowEl(this, cx, cy + R * 0.86, R * 2.1, R * 0.5);
    const dough = this.add.graphics();
    dough.fillStyle(0xb87838, 1); dough.fillCircle(cx, cy + 9, R);            // עומק שוליים
    dough.fillStyle(0xd99a52, 1); dough.fillCircle(cx, cy, R);                // קרום
    dough.fillStyle(0xe7ad62, 1); dough.fillCircle(cx, cy - 4, R - 5);        // הארה עליונה לקרום
    dough.fillStyle(0xe6b878, 1); dough.fillCircle(cx, cy, R - 26);           // בצק פנימי
    dough.fillStyle(0xf6cf90, 1); dough.fillEllipse(cx, cy - 12, (R - 30) * 1.9, (R - 30) * 1.5); // הארה עליונה לבצק
    dough.fillStyle(0xffffff, 0.12); dough.fillEllipse(cx, cy - R * 0.42, R * 1.1, R * 0.5);      // ברק

    const rt = this.add.renderTexture(cx - R, cy - R, R * 2, R * 2).setOrigin(0, 0).setDepth(1);
    const sauceStamp = this.add.image(0, 0, 'dot').setVisible(false).setTint(0xd62828).setScale(2.4);
    const cheeseLayer = this.add.container(0, 0).setDepth(2);
    const topLayer = this.add.container(0, 0).setDepth(3);

    let step = 'sauce', dabs = 0, shreds = 0, baked = false, selected = null, pressing = false, lastSnd = 0;
    const throttle = (fn) => { const n = this.time.now; if (n - lastSnd > 90) { lastSnd = n; fn(); } };
    const inR = (p, rad) => { const dx = p.x - cx, dy = p.y - cy; return dx*dx + dy*dy <= rad*rad; };

    const serve = this.serveButton(); serve.setVisible(false);
    const stepBtn = this.actionBtn(cx, DESIGN.h - 58, '🧀 עכשיו גבינה', 0xffb02e);

    const paintSauce = (p) => { if (!inR(p, R - 16)) return;
      rt.draw(sauceStamp, p.x - (cx - R), p.y - (cy - R)); dabs++;
      if (dabs >= 12) stepBtn.enable(true); };
    const sprinkleCheese = (p) => { if (!inR(p, R - 12)) return;
      for (let i = 0; i < 2; i++) { const a = Math.random()*6.283, rr = Math.random()*20;
        cheeseLayer.add(this.add.image(p.x+Math.cos(a)*rr, p.y+Math.sin(a)*rr, 'shred').setAngle(Math.random()*360).setScale(0.8+Math.random()*0.5)); shreds++; }
      if (shreds >= 16) stepBtn.enable(true); };
    const placeTopping = (p) => { if (!selected || !inR(p, R)) return;
      const o = this.imgOrText(p.x, p.y, selected, 52); topLayer.add(o);
      const b = o._base || 1; o.setScale(b*0.4); this.tweens.add({ targets:o, scale:b, duration:200, ease:'Back.out' });
      Sound.pop(); stepBtn.enable(true); };

    const onDown = (p) => { if (baked) return; pressing = true;
      if (step === 'sauce') { paintSauce(p); throttle(()=>Sound.bubble()); }
      else if (step === 'cheese') { sprinkleCheese(p); throttle(()=>Sound.pop()); }
      else if (step === 'toppings') placeTopping(p); };
    const onMove = (p) => { if (!pressing || baked) return;
      if (step === 'sauce') { paintSauce(p); throttle(()=>Sound.bubble()); }
      else if (step === 'cheese') { sprinkleCheese(p); throttle(()=>Sound.pop()); } };
    const onUp = () => { pressing = false; };
    this.input.on('pointerdown', onDown); this.input.on('pointermove', onMove); this.input.on('pointerup', onUp);

    const trayItems = [];
    const buildToppingTray = () => {
      const list = ['🍄','🫑','🌶️','🫒','🧅','🍍'];
      const allowed = 4 + G.extraToppings();
      const startX = cx - 320;
      list.forEach((t, i) => {
        const locked = i >= allowed;
        const it = this.tapItem(startX + i * 86, DESIGN.h - 158, t, () => {
          if (locked) { Sound.tap(); return; }
          selected = t; Sound.tap();
          trayItems.forEach(o => o.clearTint && o.clearTint());
          it.setTint && it.setTint(0x9ad0ff);
        }, locked);
        trayItems.push(it);
      });
    };

    const goCheese = () => { step = 'cheese'; this.hintText.setText('פזרו גבינה — כמה שבא לכם! 🧀'); stepBtn.setLabel('🍅 עכשיו תוספות').enable(false).onTap(goToppings); };
    const goToppings = () => { step = 'toppings'; this.hintText.setText('בחרו תוספת והניחו — כמה שרוצים! 🍕'); buildToppingTray(); stepBtn.setLabel('🔥 לאפות!').enable(true).onTap(bake); };
    const bake = () => {
      if (baked) return; baked = true; step = 'done'; Sound.ding();
      this.hintText.setText('אופה... 🔥'); stepBtn.setVisible(false);
      const heat = this.add.particles(cx, cy, 'spark', { tint: 0xffa030, lifespan: 900, speed:{min:20,max:90}, scale:{start:0.6,end:0}, quantity: 2, frequency: 60 });
      this.tweens.add({ targets: dough, alpha: 0.9, duration: 700, yoyo: true });
      this.time.delayedCall(1500, () => { heat.stop(); this.hintText.setText('מוכן! הגישו 😋'); serve.setVisible(true).enable(true); Sound.happy(); });
    };
    stepBtn.onTap(goCheese);
  }

  /* ============ דונאט (מאכל חדש) ============ */
  startDonut() {
    this.hintText.setText('בחרו ציפוי, ואז העבירו אצבע על הדונאט לסוכריות — כמה שרוצים! 🍩');
    const cx = DESIGN.w / 2, cy = 380, R = 175, hole = R * 0.36;

    // דונאט תלת-ממדי: צל + בצק עם גרדיאנט + צל פנימי
    Helper.shadowEl(this, cx, cy + R * 0.92, R * 2.1, R * 0.5);
    const base = this.add.graphics();
    base.fillStyle(0xa9743a, 1); base.fillCircle(cx, cy + 8, R);          // עומק
    base.fillStyle(0xc98a4b, 1); base.fillCircle(cx, cy, R);              // בצק
    base.fillStyle(0xdca263, 1); base.fillCircle(cx, cy - 5, R - 6);      // הארה עליונה
    base.fillStyle(0x000000, 0.12); base.fillCircle(cx, cy, hole + 14);   // צל פנימי
    base.fillStyle(0xfff6fc, 1); base.fillCircle(cx, cy, hole);           // חור

    const glaze = this.add.graphics().setDepth(1);
    const sprLayer = this.add.container(0, 0).setDepth(2);
    let glazed = false;
    const serve = this.serveButton();

    const drawGlaze = (color) => {
      glaze.clear();
      const light = Phaser.Display.Color.IntegerToColor(color).lighten(14).color;
      glaze.fillStyle(color, 1);
      glaze.beginPath(); glaze.arc(cx, cy - 4, R - 8, 0, Math.PI * 2, false); glaze.arc(cx, cy - 4, hole + 8, 0, Math.PI * 2, true); glaze.fillPath();
      glaze.fillStyle(light, 1);
      glaze.beginPath(); glaze.arc(cx, cy - 10, R - 14, Math.PI * 1.05, Math.PI * 1.95, false); glaze.arc(cx, cy - 10, hole + 12, Math.PI * 1.95, Math.PI * 1.05, true); glaze.fillPath();
      // נטיפות תחתונות
      glaze.fillStyle(color, 1);
      for (let i = 0; i < 7; i++) { const a = 0.5 + i * 0.32; glaze.fillCircle(cx + Math.cos(a) * (R - 12), cy - 4 + Math.sin(a) * (R - 12), 9 + (i % 3) * 4); }
      // ברק
      glaze.fillStyle(0xffffff, 0.30); glaze.slice(cx, cy - 4, R - 14, Math.PI * 1.15, Math.PI * 1.55, false); glaze.fillPath();
      glazed = true; serve.enable(true); Sound.bubble();
      this.tweens.add({ targets: glaze, scaleX: 1.04, scaleY: 1.04, duration: 120, yoyo: true });
    };

    const colors = [ {e:'🩷', c:0xff8ac4}, {e:'🤎', c:0x8a5a3c}, {e:'🤍', c:0xfff3da}, {e:'💙', c:0x7ec8ff} ];
    const startX = cx - 300;
    colors.forEach((f, i) => this.tapItem(startX + i * 100, DESIGN.h - 158, f.e, () => drawGlaze(f.c)));

    const sprColors = [0xff4d6d, 0xffd24c, 0x5fd06a, 0x5fb0ff, 0xa06bff, 0xffffff];
    let pressing = false, lastSnd = 0;
    const sprinkle = (p) => {
      const dx = p.x - cx, dy = p.y - cy, d = Math.sqrt(dx*dx + dy*dy);
      if (d < hole + 12 || d > R - 10) return;
      const s = this.add.rectangle(p.x + Phaser.Math.Between(-8,8), p.y + Phaser.Math.Between(-8,8), 22, 8, sprColors[(Math.random()*sprColors.length)|0], 1)
        .setAngle(Math.random() * 360);
      sprLayer.add(s);
      const n = this.time.now; if (n - lastSnd > 70) { lastSnd = n; Sound.sparkle(); }
    };
    const hit = this.add.circle(cx, cy, R, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', (p) => { if (!glazed) { Sound.tap(); return; } pressing = true; sprinkle(p); });
    hit.on('pointermove', (p) => { if (pressing && glazed) sprinkle(p); });
    this.input.on('pointerup', () => { pressing = false; });
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

    const coinIco = this.add.image(W - 240, 70, 'coin');
    this.coinText = this.add.text(W - 210, 70, '' + G.coins, { fontFamily:'Heebo,sans-serif', fontSize:'44px', color:'#e09b00', fontStyle:'bold' }).setOrigin(0, 0.5);

    this.cards = [];
    const cols = 4, cw = 290, ch = 300, gapX = 10, gapY = 20;
    const totalW = cols * cw + (cols - 1) * gapX;
    const startX = (W - totalW) / 2 + cw / 2;
    const startY = 280;
    G.UPGRADES.forEach((u, i) => {
      const col = i % cols, row = (i / cols) | 0;
      const x = startX + col * (cw + gapX), y = startY + row * (ch + gapY);
      this.cards.push(this.buildCard(u, x, y));
    });
    this.refresh();
  }

  buildCard(u, x, y) {
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.08); g.fillRoundedRect(-135, -130 + 8, 270, 280, 24);
    g.fillStyle(0xffffff, 1); g.fillRoundedRect(-135, -130, 270, 280, 24);
    const ico = this.add.text(0, -78, u.ico, { fontSize: '76px' }).setOrigin(0.5);
    const name = Helper.txt(this, 0, -8, u.name, 30, '#5a3d5c');
    const lvl = Helper.txt(this, 0, 32, '', 24, '#9a7a9c');

    const buy = this.add.container(0, 96);
    const bg = this.add.graphics();
    const bt = this.add.text(0, 0, '', { fontFamily:'Heebo,sans-serif', fontSize:'30px', color:'#fff', fontStyle:'bold' }).setOrigin(0.5);
    buy.add([bg, bt]); buy.setSize(200, 64)
      .setInteractive(new Phaser.Geom.Rectangle(-100, -32, 200, 64), Phaser.Geom.Rectangle.Contains);
    buy.on('pointerdown', () => this.tryBuy(u, c));

    c.add([g, ico, name, lvl, buy]);
    c._lvl = lvl; c._buyBg = bg; c._buyTxt = bt; c._buy = buy; c._u = u;
    return c;
  }

  tryBuy(u, card) {
    if (G.buy(u.id)) {
      Sound.cha_ching();
      this.tweens.add({ targets: card, scale: 1.06, duration: 100, yoyo: true });
      this.add.particles(card.x, card.y - 60, 'star', { lifespan:1000, speed:{min:120,max:300},
        scale:{start:0.6,end:0}, gravityY:500, quantity:12, emitting:false }).explode(12, card.x, card.y - 60);
      this.refresh();
    } else { Sound.sad(); }
  }

  refresh() {
    this.coinText.setText('' + G.coins);
    this.cards.forEach(card => {
      const u = card._u, lvl = G.lvl(u.id), maxLvl = u.costs.length, cost = G.nextCost(u.id);
      card._lvl.setText('רמה ' + lvl + ' / ' + maxLvl);
      const bg = card._buyBg; bg.clear();
      if (cost === null) {
        bg.fillStyle(0x8fd3b6, 1); bg.fillRoundedRect(-100, -32, 200, 64, 32);
        card._buyTxt.setText('✓ מקסימום');
      } else {
        const can = G.coins >= cost;
        bg.fillStyle(can ? 0xf5a800 : 0xc9b78a, 1); bg.fillRoundedRect(-100, -32, 200, 64, 32);
        card._buyTxt.setText('🪙 ' + cost);
      }
    });
  }

  close() { this.game.events.emit('store-closed'); this.scene.stop(); }
}
