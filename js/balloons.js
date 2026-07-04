/* ===== בלונים ובועות — משחק פיצוץ רגוע לגיל 3 =====
   בלונים צבעוניים ובועות שקופות עולים; הקשה מפוצצת עם קונפטי וצליל.
   למידה עדינה: על חלק מהבלונים מספר/צורה — נאמר בקול בפיצוץ.
   בלי כישלון, בלי ניקוד לחוץ; קצב מסתגל לקצב של אלה.                 */

const DESIGN = { w: 1280, h: 800 };

/* צבעי בלונים + שמות בעברית להקראה */
const BALLOON_COLORS = [
  { c: 0xff5ca8, name: 'ורוד' },
  { c: 0x4da6ff, name: 'כחול' },
  { c: 0xffd24c, name: 'צהוב' },
  { c: 0x6fd06a, name: 'ירוק' },
  { c: 0xb28dff, name: 'סגול' },
  { c: 0xff8a4c, name: 'כתום' },
  { c: 0xff4c4c, name: 'אדום' }
];
const NUMBERS = ['1','2','3','4','5'];
const NUMBER_NAMES = { '1':'אחת', '2':'שתיים', '3':'שלוש', '4':'ארבע', '5':'חמש' };
const MAGIC_EMOJIS = ['🦄', '⭐', '💖'];

/* שדרוגים מעגלת השדרוגים (נקראים פעם אחת בטעינה) */
function upgrades() {
  const W = (typeof Wallet !== 'undefined') ? Wallet : { lvl: () => 0 };
  return {
    sizeMul: 1 + 0.16 * W.lvl('bigBalloons'),   // בלוני ענק
    speedMul: 1 + 0.28 * W.lvl('turbo'),        // טורבו
    magic: W.lvl('magic') > 0,                   // בלוני קסם
    bubbles: W.lvl('bubbles') > 0,               // מכונת בועות
    sky: W.lvl('sky') > 0                        // שמיים קסומים
  };
}

class BalloonScene extends Phaser.Scene {
  constructor() { super('Balloons'); }

  preload() {
    let g = this.make.graphics({ x:0, y:0, add:false });
    // חלקיק עגול
    g.fillStyle(0xffffff, 1); g.fillCircle(8, 8, 8);
    g.generateTexture('spark', 16, 16); g.clear();
    // פיסת קונפטי מלבנית
    g.fillStyle(0xffffff, 1); g.fillRoundedRect(0, 0, 18, 10, 3);
    g.generateTexture('confetti', 18, 10); g.clear();
    // ענן
    g.fillStyle(0xffffff, 1);
    g.fillCircle(45, 55, 35); g.fillCircle(90, 45, 45);
    g.fillCircle(140, 55, 38); g.fillCircle(95, 70, 40);
    g.fillRoundedRect(20, 55, 150, 35, 18);
    g.generateTexture('cloud', 190, 100); g.clear();
    g.destroy();

    // גוף בלון לבן (מקבל גוון בזמן ריצה): אליפסה + ברק + קשר
    this.makeBalloonTexture();
    // בועה: טבעת שקופה + ברק
    this.makeBubbleTexture();
  }

  makeBalloonTexture() {
    const w = 160, h = 200;
    const tex = this.textures.createCanvas('balloon', w, h);
    const ctx = (typeof tex.getContext === 'function') ? tex.getContext() : tex.context;
    // גוף עם גרדיאנט רדיאלי — נראה תלת-ממדי, וגוון (tint) צובע אותו יפה
    const grd = ctx.createRadialGradient(w*0.38, h*0.28, 12, w*0.5, h*0.42, w*0.62);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.25, 'rgba(235,235,235,1)');
    grd.addColorStop(1, 'rgba(150,150,150,1)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.ellipse(w/2, h*0.42, w*0.44, h*0.40, 0, 0, Math.PI*2);
    ctx.fill();
    // קשר
    ctx.beginPath();
    ctx.moveTo(w/2 - 12, h*0.82);
    ctx.lineTo(w/2 + 12, h*0.82);
    ctx.lineTo(w/2, h*0.90);
    ctx.closePath();
    ctx.fill();
    // ברק לבן
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.ellipse(w*0.36, h*0.24, w*0.10, h*0.13, -0.5, 0, Math.PI*2);
    ctx.fill();
    tex.refresh();
  }

  makeBubbleTexture() {
    const s = 140;
    const tex = this.textures.createCanvas('bubble', s, s);
    const ctx = (typeof tex.getContext === 'function') ? tex.getContext() : tex.context;
    const r = s/2 - 4;
    const grd = ctx.createRadialGradient(s/2, s/2, r*0.6, s/2, s/2, r);
    grd.addColorStop(0, 'rgba(255,255,255,0.06)');
    grd.addColorStop(0.85, 'rgba(255,255,255,0.20)');
    grd.addColorStop(1, 'rgba(255,255,255,0.55)');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(s/2, s/2, r, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(s/2, s/2, r, 0, Math.PI*2); ctx.stroke();
    // ברק
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.ellipse(s*0.34, s*0.30, s*0.10, s*0.06, -0.6, 0, Math.PI*2); ctx.fill();
    tex.refresh();
  }

  create() {
    const W = DESIGN.w, H = DESIGN.h;
    this.items = [];          // בלונים/בועות חיים
    this.recentPops = [];     // חותמות זמן של פיצוצים — לקצב מסתגל
    this.popCount = 0;
    this.upg = upgrades();    // שדרוגים מעגלת השדרוגים

    // מטבע זהב (לתצוגת הארנק ולמטבע המעופף)
    const cg = this.make.graphics({ x: 0, y: 0, add: false });
    cg.fillStyle(0xf5b301, 1); cg.fillCircle(20, 20, 18);
    cg.fillStyle(0xffe27a, 1); cg.fillCircle(20, 20, 12);
    cg.generateTexture('coin', 40, 40); cg.destroy();

    // שמיים קסומים (שדרוג): שקיעה סגולה, ירח זוהר וכוכבים
    if (this.upg.sky) {
      document.body.style.background = 'linear-gradient(180deg, #2c1a5e 0%, #7b3fa0 48%, #ff9a6a 88%, #ffd9a0 100%)';
      const moonGlow = this.add.circle(W - 170, 120, 62, 0xfff6d8, 0.25).setDepth(0);
      const moon = this.add.circle(W - 170, 120, 42, 0xfff2c8).setDepth(0);
      this.add.circle(W - 182, 112, 9, 0xe8d8a8, 0.6).setDepth(0);
      this.add.circle(W - 156, 132, 6, 0xe8d8a8, 0.5).setDepth(0);
      this.tweens.add({ targets: moonGlow, scale: 1.18, duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      for (let i = 0; i < 22; i++) {
        const st = this.add.image(Phaser.Math.Between(30, W - 30), Phaser.Math.Between(30, 330), 'spark')
          .setTint(0xfff6d8).setScale(Phaser.Math.FloatBetween(0.25, 0.6)).setAlpha(0.5).setDepth(0);
        this.tweens.add({ targets: st, alpha: { from: 0.2, to: 0.95 },
          duration: Phaser.Math.Between(600, 1500), yoyo: true, repeat: -1, delay: Math.random() * 1200 });
      }
    }

    // עננים רכים ברקע
    for (let i = 0; i < 3; i++) {
      const c = this.add.image(Phaser.Math.Between(0, W), 90 + i * 85, 'cloud')
        .setAlpha(this.upg.sky ? 0.25 : 0.7).setScale(0.8 + i * 0.3).setDepth(0);
      this.tweens.add({ targets: c, x: '+=' + (W + 300), duration: Phaser.Math.Between(50000, 80000),
        repeat: -1, onRepeat: () => { c.x = -220; } });
    }

    // מונה פיצוצים חגיגי (לא ניקוד — רק שמחה)
    this.counter = this.add.text(W/2, 54, '🎈 0', {
      fontFamily: 'Varela Round, Heebo, sans-serif', fontSize: '46px',
      color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(50);
    this.counter.setShadow(0, 3, 'rgba(90,61,92,0.4)', 6);

    // ארנק — המטבעות משותפים לכל המשחקים
    this.add.image(W - 200, 54, 'coin').setDepth(50);
    this.coinText = this.add.text(W - 172, 54, '' + (typeof Wallet !== 'undefined' ? Wallet.coins : 0), {
      fontFamily: 'Varela Round, Heebo, sans-serif', fontSize: '40px', color: '#e09b00', fontStyle: 'bold'
    }).setOrigin(0, 0.5).setDepth(50);
    this.coinText.setShadow(0, 2, 'rgba(255,255,255,0.8)', 3);

    // מערכות חלקיקים לפיצוץ (ממוחזרות — לא נוצרות מחדש בכל פיצוץ)
    this.burstTint = 0xffffff;
    this.burst = this.add.particles(0, 0, 'confetti', {
      tint: () => this.burstTint,
      speed: { min: 180, max: 460 },
      angle: { min: 0, max: 360 },
      rotate: { min: 0, max: 360 },
      gravityY: 500,
      lifespan: { min: 500, max: 950 },
      scale: { start: 1.1, end: 0.2 },
      emitting: false
    }).setDepth(40);
    this.sparkBurst = this.add.particles(0, 0, 'spark', {
      speed: { min: 120, max: 320 },
      angle: { min: 0, max: 360 },
      lifespan: { min: 300, max: 600 },
      scale: { start: 0.9, end: 0 },
      blendMode: 'ADD',
      emitting: false
    }).setDepth(41);

    // ברכה במגע ראשון
    this.input.once('pointerdown', () => {
      Sound.unlock();
      Voice.say('לפוצץ בלונים!');
    });

    // לולאת יצירה — הקצב נקבע דינמית
    this.spawnNext();

    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('gesturestart', e => e.preventDefault());
  }

  /* קצב מסתגל: יותר פיצוצים ב-10 שניות האחרונות ⇒ בלונים מגיעים מהר יותר */
  spawnDelay() {
    const now = this.time.now;
    this.recentPops = this.recentPops.filter(t => now - t < 10000);
    const rate = this.recentPops.length;                    // 0..20
    return Phaser.Math.Clamp(1000 - rate * 75, 300, 1000) / this.upg.speedMul;
  }

  spawnNext() {
    if (this.items.length < (this.upg.bubbles ? 17 : 14)) {
      const bubbleChance = this.upg.bubbles ? 0.52 : 0.28;   // מכונת בועות — המון בועות
      (Math.random() < bubbleChance) ? this.spawnBubble() : this.spawnBalloon();
    }
    this.time.delayedCall(this.spawnDelay(), () => this.spawnNext());
  }

  spawnBalloon() {
    const W = DESIGN.w, H = DESIGN.h;
    const col = Phaser.Utils.Array.GetRandom(BALLOON_COLORS);
    const x = Phaser.Math.Between(90, W - 90);
    const scale = Phaser.Math.FloatBetween(0.85, 1.25) * this.upg.sizeMul;
    const isMagic = this.upg.magic && Math.random() < 0.18;   // בלון קסם — זהב עם הפתעה

    const c = this.add.container(x, H + 130).setDepth(10);
    // חוט
    const string = this.add.graphics();
    string.lineStyle(3, 0xffffff, 0.8);
    string.beginPath(); string.moveTo(0, 78 * 1);
    string.lineTo(6, 120); string.lineTo(-4, 160);
    string.strokePath();
    const body = this.add.image(0, 0, 'balloon').setTint(isMagic ? 0xffd24c : col.c);
    c.add([string, body]);

    let labelText = null;
    if (isMagic) {
      // הילה נוצצת + אימוג'י קסם
      const t = this.add.text(0, -14, Phaser.Utils.Array.GetRandom(MAGIC_EMOJIS), { fontSize: '60px' }).setOrigin(0.5);
      c.add(t);
      this.tweens.add({ targets: t, angle: { from: -10, to: 10 }, duration: 500, yoyo: true, repeat: -1 });
    } else if (Math.random() < 0.4) {
      // תווית למידה עדינה על ~40% מהבלונים: מספר
      const n = Phaser.Utils.Array.GetRandom(NUMBERS);
      labelText = n;
      const t = this.add.text(0, -14, n, {
        fontFamily: 'Varela Round, Heebo, sans-serif', fontSize: '64px',
        color: '#ffffff', fontStyle: 'bold'
      }).setOrigin(0.5);
      t.setShadow(0, 3, 'rgba(0,0,0,0.3)', 4);
      c.add(t);
    }

    c.setScale(scale);
    c.setSize(150, 190);
    c.setInteractive(new Phaser.Geom.Rectangle(0, 0, 150, 190), Phaser.Geom.Rectangle.Contains);
    c.once('pointerdown', () => this.popBalloon(c, isMagic ? { c: 0xffd24c, name: 'קסם' } : col, labelText, isMagic));

    // תנועה: עלייה + נדנוד סינוס — מהירים! (טורבו מאיץ עוד)
    c._vy = Phaser.Math.FloatBetween(95, 160) * this.upg.speedMul;
    c._sway = Phaser.Math.FloatBetween(0.8, 1.6);
    c._phase = Math.random() * Math.PI * 2;
    c._x0 = x;
    c._isBalloon = true;
    this.items.push(c);
  }

  spawnBubble() {
    const W = DESIGN.w, H = DESIGN.h;
    const x = Phaser.Math.Between(80, W - 80);
    const scale = Phaser.Math.FloatBetween(0.6, 1.15);
    const b = this.add.image(x, H + 90, 'bubble').setDepth(9).setScale(scale);
    b.setInteractive();
    b.once('pointerdown', () => this.popBubble(b));
    b._vy = Phaser.Math.FloatBetween(125, 200) * this.upg.speedMul;   // בועות קלות — הכי מהירות
    b._sway = Phaser.Math.FloatBetween(1.5, 2.6);
    b._phase = Math.random() * Math.PI * 2;
    b._x0 = x;
    this.items.push(b);
  }

  popBalloon(c, col, labelText, isMagic) {
    this.removeItem(c);
    Sound.pop();
    this.recentPops.push(this.time.now);
    this.bumpCounter();

    // קונפטי בצבע הבלון + ניצוצות
    this.burstTint = col.c;
    this.burst.explode(isMagic ? 44 : 22, c.x, c.y);
    this.sparkBurst.explode(isMagic ? 26 : 12, c.x, c.y);
    this.cameras.main.shake(90, isMagic ? 0.007 : 0.004);

    if (isMagic) { Voice.praise(); this.earnCoin(c.x, c.y); }            // בלון קסם — מטבע בונוס!
    else if (labelText) Voice.say(NUMBER_NAMES[labelText] || labelText); // מספר
    else Voice.say(col.name);                                            // שם הצבע

    // כל 4 פיצוצים — מטבע לארנק; כל 10 — חגיגה!
    if (this.popCount % 4 === 0) this.earnCoin(c.x, c.y);
    if (this.popCount % 10 === 0) this.celebrate();

    c.destroy();
  }

  /* מטבע מעופף לארנק — ההרווחה מרגישה אמיתית */
  earnCoin(x, y) {
    if (typeof Wallet === 'undefined') return;
    const coin = this.add.image(x, y, 'coin').setDepth(60).setScale(0);
    this.tweens.add({ targets: coin, scale: 1.3, duration: 180, ease: 'Back.out' });
    this.tweens.add({
      targets: coin, x: DESIGN.w - 200, y: 54, scale: 0.8, delay: 260, duration: 520, ease: 'Cubic.in',
      onComplete: () => {
        coin.destroy();
        Sound.cha_ching();
        this.coinText.setText('' + Wallet.add(1));
        this.tweens.add({ targets: this.coinText, scale: 1.3, duration: 110, yoyo: true });
      }
    });
  }

  popBubble(b) {
    this.removeItem(b);
    Sound.bubble();
    this.recentPops.push(this.time.now);
    this.bumpCounter();
    // בועה מתפצלת לטיפות
    this.sparkBurst.explode(16, b.x, b.y);
    b.destroy();
  }

  bumpCounter() {
    this.popCount++;
    this.counter.setText('🎈 ' + this.popCount);
    this.tweens.add({ targets: this.counter, scale: 1.25, duration: 110, yoyo: true, ease: 'Quad.out' });
  }

  /* גשם קונפטי חגיגי + מחמאה */
  celebrate() {
    Sound.happy();
    Voice.praise();
    const W = DESIGN.w;
    for (let i = 0; i < 5; i++) {
      this.time.delayedCall(i * 120, () => {
        const col = Phaser.Utils.Array.GetRandom(BALLOON_COLORS);
        this.burstTint = col.c;
        this.burst.explode(18, Phaser.Math.Between(100, W - 100), Phaser.Math.Between(60, 220));
      });
    }
  }

  removeItem(o) {
    const i = this.items.indexOf(o);
    if (i >= 0) this.items.splice(i, 1);
  }

  update(time, delta) {
    const dt = delta / 1000;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const o = this.items[i];
      o.y -= o._vy * dt;
      o.x = o._x0 + Math.sin(time / 1000 * o._sway + o._phase) * 34;
      if (o.y < -220) {              // ברח למעלה — פשוט נעלם, בלי עונש
        this.items.splice(i, 1);
        o.destroy();
      }
    }
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
    scene: [BalloonScene],
    render: { antialias: true, roundPixels: false }
  };
  window.gameInstance = new Phaser.Game(config);
});
