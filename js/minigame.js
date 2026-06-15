/* ===== מיני-משחקים + חנות (Phaser) ===== */

class MiniGameScene extends Phaser.Scene {
  constructor() { super('MiniGame'); }
  init(data) { this.food = data.food; }

  create() {
    const W = DESIGN.w, H = DESIGN.h;
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
    const c = this.add.container(DESIGN.w / 2, DESIGN.h - 90);
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

  /* ---------- מגש מרכיבים נגרר ---------- */
  ingredient(x, y, emoji, onPlace) {
    const t = this.add.text(x, y, emoji, { fontSize: '74px' }).setOrigin(0.5).setInteractive({ draggable: true });
    const home = { x, y };
    let moved = false;
    this.input.setDraggable(t);
    t.on('pointerdown', () => { moved = false; });
    t.on('drag', (p, dx, dy) => { moved = true; t.x = dx; t.y = dy; t.setScale(1.15); });
    t.on('dragend', (p) => { t.setScale(1); if (p.y < DESIGN.h - 230) { Sound.pop(); onPlace(); }
      this.tweens.add({ targets: t, x: home.x, y: home.y, duration: 150 }); });
    t.on('pointerup', () => { if (!moved) { Sound.pop(); onPlace(); } });
    return t;
  }

  /* ============ המבורגר ============ */
  startBurgerCut() {
    this.hintText.setText('העבירו את האצבע על הירק כדי לחתוך! 🔪');
    this.cutObjs = [];
    const board = this.add.graphics();
    board.fillStyle(0x000000, 0.12); board.fillRoundedRect(DESIGN.w/2 - 360, 268, 720, 240, 30);
    board.fillStyle(0xc49a63, 1); board.fillRoundedRect(DESIGN.w/2 - 360, 260, 720, 240, 30);
    board.fillStyle(0xb0884f, 1); board.fillRoundedRect(DESIGN.w/2 - 340, 280, 680, 30, 14);
    this.cutObjs.push(board);

    const knife = this.add.text(0, 0, '🔪', { fontSize: '90px' }).setOrigin(0.5).setDepth(5).setVisible(false);
    const vegs = ['🥒', '🍅', '🧅'];
    let idx = 0;

    const loadVeg = () => {
      const veg = this.add.text(DESIGN.w / 2, 380, vegs[idx], { fontSize: '130px' }).setOrigin(0.5);
      let cuts = 0, lastX = null, pressing = false;
      const needed = 3;
      const onDown = (p) => { pressing = true; lastX = p.x; knife.setVisible(true).setPosition(p.x, p.y); };
      const onMove = (p) => {
        if (!pressing) return;
        knife.setPosition(p.x, p.y);
        if (lastX != null && Math.abs(p.x - lastX) > 70) { lastX = p.x; doCut(p); }
      };
      const onUp = () => { pressing = false; };
      const doCut = (p) => {
        if (cuts >= needed) return;
        cuts++; Sound.chop();
        this.cutFx(p.x, p.y);
        const s = this.add.text(DESIGN.w/2 + (cuts - 2) * 90, 430, vegs[idx], { fontSize: '70px' }).setOrigin(0.5).setAngle((cuts-2)*12);
        this.cutObjs.push(s);
        this.tweens.add({ targets: s, y: 440, duration: 200, ease: 'Bounce.out' });
        veg.setScale(1 - cuts * 0.18);
        if (cuts >= needed) {
          this.tweens.add({ targets: veg, alpha: 0, duration: 300, onComplete: () => veg.destroy() });
          this.time.delayedCall(400, nextVeg);
        }
      };
      const nextVeg = () => {
        this.input.off('pointerdown', onDown); this.input.off('pointermove', onMove); this.input.off('pointerup', onUp);
        idx++;
        if (idx < vegs.length) { knife.setVisible(false); loadVeg(); }
        else { Sound.ding(); knife.destroy(); this.startBurgerStack(); }
      };
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

    const plate = this.add.ellipse(DESIGN.w / 2, 560, 360, 60, 0xffffff).setStrokeStyle(6, 0xe0e0ee);
    let count = 0;
    const baseY = 540;
    const serve = this.serveButton();

    const addLayer = (emoji) => {
      const ly = baseY - count * 34;
      const L = this.add.text(DESIGN.w / 2, ly - 200, emoji, { fontSize: '96px' }).setOrigin(0.5);
      this.tweens.add({ targets: L, y: ly, duration: 300, ease: 'Bounce.out' });
      count++;
      if (count >= 4) serve.enable(true);
    };

    const items = ['🍞','🥩','🧀','🥬','🍅','🥒','🧅','🍔'];
    const startX = DESIGN.w / 2 - (items.length - 1) * 70 / 2;
    items.forEach((e, i) => this.ingredient(startX + i * 70, DESIGN.h - 130, e, () => addLayer(e)));
  }

  /* ============ מילקשייק ============ */
  startShake() {
    this.hintText.setText('בחרו טעם, מלאו את הכוס, והוסיפו קצפת ותוספות! 🥤');
    const cx = DESIGN.w / 2, cyTop = 250, cupW = 200, cupH = 300, cyBot = cyTop + cupH;

    const cup = this.add.graphics();
    cup.fillStyle(0xffffff, 0.18); cup.fillRoundedRect(cx - cupW/2, cyTop, cupW, cupH, { tl:24, tr:24, bl:48, br:48 });

    // מסכה לפי צורת הכוס
    const maskG = this.make.graphics();
    maskG.fillStyle(0xffffff); maskG.fillRoundedRect(cx - cupW/2 + 8, cyTop + 8, cupW - 16, cupH - 16, { tl:18, tr:18, bl:42, br:42 });
    const mask = maskG.createGeometryMask();

    const fill = this.add.rectangle(cx, cyBot - 8, cupW - 16, 0, 0xff9ec4).setOrigin(0.5, 1);
    fill.setMask(mask);

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
      this.ingredient(startX + i * 90, DESIGN.h - 130, f.e, () => {
        flavor = f; level = Math.min(100, level + 24); fill.setFillStyle(f.c); setLevel(); Sound.bubble();
      });
    });

    // קצפת
    this.tapItem(startX + 4 * 90 + 40, DESIGN.h - 130, '🍶', () => {
      if (!cream && level >= 40) { cream = true; const c = this.add.text(cx, cyTop + 6, '🍦', { fontSize:'70px' }).setOrigin(0.5); tops.push(c); Sound.pop(); }
    });

    // תוספות
    const toppings = ['🍒','🌈','🍓','🍫','🥥','⭐'];
    const allowed = 4 + G.extraToppings();
    toppings.forEach((t, i) => {
      const locked = i >= allowed;
      this.tapItem(cx + 120 + i * 80, DESIGN.h - 130, t, () => {
        if (locked || level < 20) { Sound.tap(); return; }
        const obj = this.add.text(cx - 60 + tops.length * 26, cyTop - 10, t, { fontSize:'44px' }).setOrigin(0.5);
        tops.push(obj); Sound.sparkle();
      }, locked);
    });
  }

  // פריט שמגיבים בהקשה (לא נגרר)
  tapItem(x, y, emoji, onTap, locked) {
    const t = this.add.text(x, y, emoji, { fontSize: '64px' }).setOrigin(0.5);
    if (locked) t.setAlpha(0.35);
    t.setInteractive({ useHandCursor: true });
    t.on('pointerdown', () => { this.tweens.add({ targets:t, scale:1.2, duration:80, yoyo:true }); onTap(); });
    return t;
  }

  /* ============ פיצה ============ */
  startPizza() {
    this.hintText.setText('מרחו רוטב בתנועה מעגלית! 🍕');
    const cx = DESIGN.w / 2, cy = 400, R = 210;

    const dough = this.add.graphics();
    dough.fillStyle(0xe0a85a, 1); dough.fillCircle(cx, cy, R);
    dough.fillStyle(0xf6c87a, 1); dough.fillCircle(cx, cy, R - 24);

    const rt = this.add.renderTexture(cx - R, cy - R, R * 2, R * 2).setOrigin(0, 0);
    const stamp = this.add.image(0, 0, 'dot').setVisible(false).setTint(0xd62828).setScale(2.2);

    let dabs = 0, pressing = false, sauceDone = false, cheeseDone = false, baked = false, selected = null;

    const onDown = (p) => { if (sauceDone) return; pressing = true; paint(p); Sound.bubble(); };
    const onMove = (p) => { if (pressing && !sauceDone) paint(p); };
    const onUp = () => { pressing = false; };
    const paint = (p) => {
      const dx = p.x - cx, dy = p.y - cy;
      if (dx*dx + dy*dy > (R-20)*(R-20)) return;
      rt.draw(stamp, p.x - (cx - R), p.y - (cy - R));
      dabs++;
      if (!sauceDone && dabs > 32) { sauceDone = true; Sound.ding(); this.hintText.setText('יופי! עכשיו פזרו גבינה 🧀'); showCheese(); }
    };
    this.input.on('pointerdown', onDown); this.input.on('pointermove', onMove); this.input.on('pointerup', onUp);

    const serve = this.serveButton();
    let cheeseBtn, bakeBtn;

    const showCheese = () => {
      cheeseBtn = this.tapItem(cx, DESIGN.h - 130, '🧀', () => {
        if (cheeseDone) return; cheeseDone = true;
        this.add.circle(cx, cy, R - 28, 0xffdd78, 0.5);
        Sound.pop(); this.hintText.setText('בחרו תוספת והקישו על הפיצה 🍕');
        cheeseBtn.destroy(); showToppings();
      });
    };

    const showToppings = () => {
      const list = ['🍄','🫑','🌶️','🫒','🧅','🍍'];
      const allowed = 4 + G.extraToppings();
      const startX = cx - 320;
      list.forEach((t, i) => {
        const locked = i >= allowed;
        const it = this.tapItem(startX + i * 90, DESIGN.h - 130, t, () => {
          if (locked) { Sound.tap(); return; }
          selected = t; Sound.tap();
          list.forEach(() => {}); it.setTint(0xff7eb9);
        }, locked);
      });
      bakeBtn = this.add.container(cx + 320, DESIGN.h - 130);
      const bg = this.add.graphics(); bg.fillStyle(0xf5a800,1); bg.fillRoundedRect(-90,-40,180,80,40);
      const bt = this.add.text(0,0,'🔥 לאפות', { fontFamily:'Heebo,sans-serif', fontSize:'30px', color:'#fff', fontStyle:'bold' }).setOrigin(0.5);
      bakeBtn.add([bg, bt]); bakeBtn.setVisible(false).setSize(180,80)
        .setInteractive(new Phaser.Geom.Rectangle(-90,-40,180,80), Phaser.Geom.Rectangle.Contains);
      bakeBtn.on('pointerdown', () => {
        if (baked) return; baked = true; Sound.ding();
        this.hintText.setText('אופה... 🔥'); bakeBtn.setVisible(false);
        this.tweens.add({ targets: dough, alpha: 0.85, duration: 800, yoyo: true });
        this.time.delayedCall(1500, () => { this.hintText.setText('מוכן! הגישו 😋'); serve.enable(true); });
      });

      // הנחת תוספת בהקשה על הפיצה
      this.input.on('pointerdown', (p) => {
        if (!selected || baked) return;
        const dx = p.x - cx, dy = p.y - cy;
        if (dx*dx + dy*dy > R*R) return;
        this.add.text(p.x, p.y, selected, { fontSize: '46px' }).setOrigin(0.5);
        Sound.pop(); bakeBtn.setVisible(true);
      });
    };
  }

  /* ============ דונאט (מאכל חדש) ============ */
  startDonut() {
    this.hintText.setText('בחרו ציפוי, ואז הקישו על הדונאט לסוכריות! 🍩');
    const cx = DESIGN.w / 2, cy = 400, R = 170;

    const base = this.add.graphics();
    base.fillStyle(0xc98a4b, 1); base.fillCircle(cx, cy, R);
    base.fillStyle(0xfff6fc, 1); base.fillCircle(cx, cy, R * 0.38);

    const glaze = this.add.graphics();
    let glazed = false;
    const serve = this.serveButton();

    const drawGlaze = (color) => {
      glaze.clear();
      glaze.fillStyle(color, 1);
      glaze.beginPath();
      glaze.arc(cx, cy, R - 6, 0, Math.PI * 2, false);
      glaze.arc(cx, cy, R * 0.40, 0, Math.PI * 2, true);
      glaze.fillPath();
      glazed = true; serve.enable(true); Sound.bubble();
    };

    const colors = [ {e:'🩷', c:0xff8ac4}, {e:'🤎', c:0x8a5a3c}, {e:'🤍', c:0xfff3da}, {e:'💙', c:0x7ec8ff} ];
    const startX = cx - 300;
    colors.forEach((f, i) => this.tapItem(startX + i * 100, DESIGN.h - 130, f.e, () => drawGlaze(f.c)));

    const sprinkles = ['🔴','🟡','🟢','🔵','⭐','🍫'];
    // הקשה על הדונאט מוסיפה סוכריות אקראיות
    const hit = this.add.circle(cx, cy, R, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', (p, lx, ly) => {
      if (!glazed) { Sound.tap(); return; }
      const ang = Math.random() * Math.PI * 2, rr = R * (0.5 + Math.random() * 0.4);
      const sx = cx + Math.cos(ang) * rr, sy = cy + Math.sin(ang) * rr;
      const s = sprinkles[(Math.random() * sprinkles.length) | 0];
      this.add.text(sx, sy, s, { fontSize: '30px' }).setOrigin(0.5).setAngle(Math.random()*360);
      Sound.sparkle();
    });
  }
}

/* ============ חנות שדרוגים ============ */
class StoreScene extends Phaser.Scene {
  constructor() { super('Store'); }

  create() {
    const W = DESIGN.w, H = DESIGN.h;
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
