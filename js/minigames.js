/* ===== מיני-משחקים: המבורגר (+חיתוך), מילקשייק, פיצה ===== */
const MiniGames = (function () {
  let stage, bottom, titleEl, screen;
  let onDone = null;       // קולבק בסיום (קבלת ההזמנה)
  let freeMode = false;
  let cleanup = [];        // מאזינים לניקוי

  function init() {
    screen  = document.getElementById('minigame');
    stage   = document.getElementById('mgStage');
    bottom  = document.getElementById('mgBottom');
    titleEl = document.getElementById('mgTitle');
  }

  function open(food, doneCb, isFree) {
    onDone = doneCb;
    freeMode = !!isFree;
    titleEl.textContent = G.FOODS[food].name + ' ' + G.FOODS[food].emoji;
    clear();
    if (food === 'burger') startBurger();
    else if (food === 'shake') startShake();
    else if (food === 'pizza') startPizza();
  }

  function clear() {
    cleanup.forEach(fn => fn());
    cleanup = [];
    stage.innerHTML = '';
    bottom.innerHTML = '';
  }

  function finish() {
    Sound.cha_ching();
    const r = stage.getBoundingClientRect();
    FX.burst(r.left + r.width / 2, r.top + r.height / 2, 20, {});
    const cb = onDone; clear();
    if (cb) cb();
  }

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  /* ---------- גרירה/הקשה משותפת להוספת מרכיב ---------- */
  function makeDraggable(node, emoji, onPlace, dropZoneTest) {
    node.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      Sound.tap();
      const start = { x: e.clientX, y: e.clientY };
      const ghost = el('div', null, emoji);
      ghost.style.cssText = 'position:fixed;font-size:9vh;z-index:80;pointer-events:none;transform:translate(-50%,-50%);';
      ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px';
      document.body.appendChild(ghost);

      function move(ev) { ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px'; }
      function up(ev) {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        ghost.remove();
        const moved = Math.hypot(ev.clientX - start.x, ev.clientY - start.y);
        const ok = dropZoneTest ? dropZoneTest(ev.clientX, ev.clientY) : true;
        if (ok || moved < 24) onPlace(ev.clientX, ev.clientY); // הקשה קצרה גם נחשבת
      }
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
    });
  }

  /* ========================================================
     1) המבורגר — חיתוך ירקות ואז הרכבה בשכבות
  ======================================================== */
  function startBurger() {
    cutStage(['🥒','🍅'], function () { assembleStage(); });
  }

  // שלב חיתוך אינטראקטיבי
  function cutStage(vegs, next) {
    let idx = 0;
    const hint = el('div', null, 'העבירו את האצבע על הירק כדי לחתוך! 🔪');
    hint.style.cssText = 'position:absolute;top:2vh;left:0;right:0;text-align:center;font-size:3.2vh;color:#5a3d5c;';
    stage.appendChild(hint);

    const board = el('div', 'cutboard');
    stage.appendChild(board);

    const knife = el('div', 'knife', '🔪');
    knife.style.display = 'none';
    board.appendChild(knife);

    function loadVeg() {
      board.querySelectorAll('.veg').forEach(n => n.remove());
      const veg = el('div', 'veg');
      const whole = el('span', 'slice', vegs[idx]);
      veg.appendChild(whole);
      board.appendChild(veg);
      let cuts = 0, lastX = null, pressing = false;
      const needed = 3;

      function pos(ev) {
        const r = board.getBoundingClientRect();
        knife.style.left = (ev.clientX - r.left) + 'px';
        knife.style.top  = (ev.clientY - r.top) + 'px';
      }
      function down(ev) { ev.preventDefault(); pressing = true; lastX = ev.clientX; knife.style.display = 'block'; pos(ev); }
      function move(ev) {
        if (!pressing) return;
        pos(ev);
        if (lastX != null && Math.abs(ev.clientX - lastX) > 55) {
          lastX = ev.clientX; chop();
        }
      }
      function upHandler() { pressing = false; }

      function chop() {
        if (cuts >= needed) return;
        cuts++;
        Sound.chop();
        FX.burst(parseFloat(knife.style.left) + board.getBoundingClientRect().left,
                 parseFloat(knife.style.top) + board.getBoundingClientRect().top,
                 6, { emoji:'💚', size:18, up:1 });
        // הוספת פרוסה מתפזרת
        const s = el('span', 'slice cut', vegs[idx]);
        s.style.fontSize = '6vh';
        s.style.transform = 'translateX(' + ((cuts - 2) * 7) + 'vh) rotate(' + ((cuts - 2) * 10) + 'deg)';
        veg.appendChild(s);
        whole.style.transform = 'scale(' + (1 - cuts * 0.18) + ')';
        if (cuts >= needed) {
          whole.style.opacity = '0';
          setTimeout(nextVeg, 450);
        }
      }
      function nextVeg() {
        board.removeEventListener('pointerdown', down);
        board.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', upHandler);
        idx++;
        knife.style.display = 'none';
        if (idx < vegs.length) loadVeg();
        else { Sound.ding(); next(); }
      }

      board.addEventListener('pointerdown', down);
      board.addEventListener('pointermove', move);
      document.addEventListener('pointerup', upHandler);
      cleanup.push(() => {
        board.removeEventListener('pointerdown', down);
        board.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', upHandler);
      });
    }
    loadVeg();
  }

  // שלב הרכבת ההמבורגר
  function assembleStage() {
    stage.innerHTML = '';
    bottom.innerHTML = '';

    const hint = el('div', null, 'גררו או הקישו על המרכיבים כדי לבנות את ההמבורגר! 🍔');
    hint.style.cssText = 'position:absolute;top:1.5vh;left:0;right:0;text-align:center;font-size:3vh;color:#5a3d5c;';
    stage.appendChild(hint);

    const plate = el('div', 'plate'); stage.appendChild(plate);
    const build = el('div', 'build'); stage.appendChild(build);

    let layers = 0;

    function plateZone(x, y) {
      const r = stage.getBoundingClientRect();
      return y > r.top + r.height * 0.3; // החצי התחתון של הבמה
    }

    const items = [
      { e:'🍞', label:'לחמנייה' }, { e:'🥩', label:'קציצה' }, { e:'🧀', label:'גבינה' },
      { e:'🥬', label:'חסה' }, { e:'🍅', label:'עגבנייה' }, { e:'🥒', label:'מלפפון' },
      { e:'🥫', label:'רוטב' }, { e:'🍔', label:'לחמנייה עליונה' }
    ];

    const tray = el('div', 'tray');
    const sb = el('button', 'serve-btn disabled', '✓ הגישו!');
    sb.addEventListener('pointerdown', e => { e.preventDefault(); if (!sb.classList.contains('disabled')) finish(); else Sound.tap(); });

    function addLayer(emoji) {
      const L = el('div', 'layer', emoji);
      build.appendChild(L);
      layers++;
      Sound.pop();
      sb.classList.toggle('disabled', layers < 4);
    }

    items.forEach(it => {
      const ing = el('div', 'ingredient', it.e);
      makeDraggable(ing, it.e, () => addLayer(it.e), plateZone);
      tray.appendChild(ing);
    });

    bottom.appendChild(tray);
    bottom.appendChild(sb);
  }

  /* ========================================================
     2) מילקשייק / גלידה
  ======================================================== */
  function startShake() {
    const hint = el('div', null, 'בחרו טעם, מלאו את הכוס, והוסיפו קצפת ותוספות! 🥤');
    hint.style.cssText = 'position:absolute;top:1.5vh;left:0;right:0;text-align:center;font-size:3vh;color:#5a3d5c;';
    stage.appendChild(hint);

    const cup = el('div', 'cup');
    const fill = el('div', 'fill');
    const tops = el('div', 'toppings');
    cup.appendChild(fill); cup.appendChild(tops);
    stage.appendChild(cup);

    let level = 0, flavor = null, cream = false;

    const flavors = [
      { e:'🍓', c:'#ff9ec4', name:'תות' },
      { e:'🍫', c:'#8a5a3c', name:'שוקולד' },
      { e:'🍦', c:'#fff3da', name:'וניל' },
      { e:'🫐', c:'#7e8cff', name:'אוכמניות' }
    ];
    const tray = el('div', 'tray');

    flavors.forEach(f => {
      const ing = el('div', 'ingredient', f.e);
      makeDraggable(ing, f.e, () => {
        flavor = f;
        level = Math.min(100, level + 22);
        fill.style.background = f.c;
        fill.style.height = level + '%';
        Sound.bubble();
        refresh();
      }, () => true);
      tray.appendChild(ing);
    });

    // קצפת
    const creamBtn = el('div', 'ingredient', '🍶');
    creamBtn.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (!cream && level >= 40) { cream = true; tops.textContent = '🍦' + (tops.textContent || ''); Sound.pop(); }
      else Sound.tap();
      refresh();
    });
    tray.appendChild(creamBtn);

    // תוספות (חלקן נפתחות בשדרוג)
    const toppings = ['🍒','🌈','🍓','🍫','🥥','⭐'];
    const allowed = 4 + G.extraToppings();
    toppings.forEach((t, i) => {
      const ing = el('div', 'ingredient' + (i >= allowed ? ' locked' : ''), t);
      if (i < allowed) ing.addEventListener('pointerdown', e => {
        e.preventDefault();
        if (level < 20) { Sound.tap(); return; }
        tops.textContent = t + (tops.textContent || '');
        Sound.sparkle();
        const r = cup.getBoundingClientRect();
        FX.burst(r.left + r.width/2, r.top + r.height*0.2, 5, { emoji:t, size:18, up:1 });
      });
      tray.appendChild(ing);
    });

    bottom.appendChild(tray);
    const sb = el('button', 'serve-btn disabled', '✓ הגישו!');
    sb.addEventListener('pointerdown', e => { e.preventDefault(); if (!sb.classList.contains('disabled')) finish(); else Sound.tap(); });
    bottom.appendChild(sb);
    function refresh() { sb.classList.toggle('disabled', !(flavor && level >= 40)); }
    refresh();
  }

  /* ========================================================
     3) פיצה — מריחת רוטב, גבינה, תוספות, אפייה
  ======================================================== */
  function startPizza() {
    const hint = el('div', null, 'מרחו רוטב בתנועה מעגלית! 🍕');
    hint.style.cssText = 'position:absolute;top:1.5vh;left:0;right:0;text-align:center;font-size:3vh;color:#5a3d5c;';
    stage.appendChild(hint);

    const pizza = el('div', 'pizza');
    const canvas = el('canvas');
    canvas.width = 400; canvas.height = 400;
    pizza.appendChild(canvas);
    stage.appendChild(pizza);
    const cx = canvas.getContext('2d');

    let dabs = 0, pressing = false, sauceDone = false, cheeseDone = false, baked = false;
    let selectedTopping = null;

    function paint(ev) {
      const r = canvas.getBoundingClientRect();
      const x = (ev.clientX - r.left) / r.width * canvas.width;
      const y = (ev.clientY - r.top) / r.height * canvas.height;
      const dx = x - 200, dy = y - 200;
      if (dx*dx + dy*dy > 200*200) return; // בתוך העיגול בלבד
      cx.fillStyle = 'rgba(214,40,40,0.85)';
      cx.beginPath(); cx.arc(x, y, 30, 0, Math.PI*2); cx.fill();
      dabs++;
      if (!sauceDone && dabs > 35) { sauceDone = true; Sound.ding(); hint.textContent = 'יופי! עכשיו פזרו גבינה 🧀'; showCheeseBtn(); }
    }
    function down(ev){ if (sauceDone) return; ev.preventDefault(); pressing = true; paint(ev); Sound.bubble(); }
    function move(ev){ if (pressing && !sauceDone) paint(ev); }
    function up(){ pressing = false; }
    pizza.addEventListener('pointerdown', down);
    pizza.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    cleanup.push(() => document.removeEventListener('pointerup', up));

    const sb = el('button', 'serve-btn disabled', '✓ הגישו!');
    sb.addEventListener('pointerdown', e => { e.preventDefault(); if (!sb.classList.contains('disabled')) finish(); else Sound.tap(); });

    function showCheeseBtn() {
      bottom.innerHTML = '';
      const cheese = el('div', 'ingredient', '🧀');
      cheese.addEventListener('pointerdown', e => {
        e.preventDefault();
        if (cheeseDone) { Sound.tap(); return; }
        cheeseDone = true;
        cx.fillStyle = 'rgba(255,221,120,0.55)';
        cx.beginPath(); cx.arc(200, 200, 190, 0, Math.PI*2); cx.fill();
        Sound.pop();
        hint.textContent = 'בחרו תוספת והקישו על הפיצה 🍕';
        showToppings();
      });
      bottom.appendChild(cheese);
    }

    function showToppings() {
      bottom.innerHTML = '';
      const tray = el('div', 'tray');
      const list = ['🍄','🫑','🌶️','🫒','🧅','🍍'];
      const allowed = 4 + G.extraToppings();
      list.forEach((t, i) => {
        const ing = el('div', 'ingredient' + (i >= allowed ? ' locked' : ''), t);
        if (i < allowed) ing.addEventListener('pointerdown', e => {
          e.preventDefault();
          selectedTopping = t;
          tray.querySelectorAll('.ingredient').forEach(n => n.style.outline = '');
          ing.style.outline = '.6vh solid #ff7eb9';
          Sound.tap();
        });
        tray.appendChild(ing);
      });
      bottom.appendChild(tray);

      // הקשה על הפיצה כדי להניח תוספת
      function place(ev) {
        if (!selectedTopping || baked) return;
        const r = pizza.getBoundingClientRect();
        const x = ev.clientX - r.left, y = ev.clientY - r.top;
        const dx = x - r.width/2, dy = y - r.height/2;
        if (dx*dx + dy*dy > (r.width/2)*(r.width/2)) return;
        const t = el('div', 'pz-topping', selectedTopping);
        t.style.left = x + 'px'; t.style.top = y + 'px';
        pizza.appendChild(t);
        Sound.pop();
        if (!bakeBtn.parentNode) bottom.insertBefore(bakeBtn, bottom.firstChild.nextSibling || null);
        bakeBtn.style.display = 'inline-block';
      }
      pizza.addEventListener('pointerdown', place);
      cleanup.push(() => pizza.removeEventListener('pointerdown', place));

      // כפתור אפייה
      const bakeBtn = el('button', 'serve-btn', '🔥 לאפות!');
      bakeBtn.style.display = 'none';
      bakeBtn.addEventListener('pointerdown', e => {
        e.preventDefault();
        if (baked) return;
        baked = true;
        pizza.classList.add('baking');
        Sound.ding();
        hint.textContent = 'אופה... 🔥';
        bakeBtn.textContent = '⏳';
        setTimeout(() => {
          hint.textContent = 'מוכן! הגישו 😋';
          sb.classList.remove('disabled');
          bottom.innerHTML = ''; bottom.appendChild(sb);
        }, 1600);
      });
      bottom.appendChild(bakeBtn);
      bottom.appendChild(sb);
    }
  }

  return { init, open };
})();
