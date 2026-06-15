/* ===== לקוחות: הגעה, הזמנה, סבלנות, עזיבה ===== */
const Customers = (function () {
  let host;                 // אלמנט המכל
  let list = [];            // לקוחות פעילים
  let nextId = 1;
  let lastTick = 0;
  let running = false;
  let spawnTimer = 0;
  let onStartFood = null;   // קולבק: פתיחת מיני-משחק

  // דמויות חמודות (פנים) שמשתנות לפי מצב רוח
  const FACES_HAPPY = ['🧒','👦','👧','🧑','🐰','🐻','🐱','🐶','🐼','🦄','🐯','🐸'];
  const PATIENCE_BASE = 14; // שניות בסיס

  function init(hostEl, startFoodCb) {
    host = hostEl;
    onStartFood = startFoodCb;
  }

  function start() {
    list.forEach(c => c.el.remove());
    list = [];
    running = true;
    spawnTimer = 0.3;
    lastTick = performance.now();
    // לקוח ראשון מיד
    fillSlots();
    requestAnimationFrame(tick);
  }
  function stop() { running = false; }

  function foodKeys() { return Object.keys(G.FOODS); }

  function makeCustomer() {
    const foods = foodKeys();
    const food = foods[(Math.random() * foods.length) | 0];
    const face = FACES_HAPPY[(Math.random() * FACES_HAPPY.length) | 0];
    const patienceMax = PATIENCE_BASE * G.patienceMul();

    const el = document.createElement('div');
    el.className = 'customer enter tapable';
    el.innerHTML =
      '<div class="bubble want">' + G.FOODS[food].emoji + '</div>' +
      '<div class="face">' + face + '</div>' +
      '<div class="patience"><i></i></div>';

    const c = {
      id: nextId++, food, face, el,
      bar: el.querySelector('.patience > i'),
      faceEl: el.querySelector('.face'),
      patienceMax, patience: patienceMax,
      busy: false, leaving: false
    };

    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      if (c.busy || c.leaving) return;
      Sound.tap();
      if (onStartFood) onStartFood(c);
    });

    host.appendChild(el);
    setTimeout(() => el.classList.remove('enter'), 500);
    return c;
  }

  function fillSlots() {
    const max = G.maxSlots();
    while (list.filter(c => !c.leaving).length < max) {
      list.push(makeCustomer());
    }
  }

  function tick(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - lastTick) / 1000);
    lastTick = now;

    list.forEach(c => {
      if (c.leaving) return;
      c.patience -= dt; // הסבלנות יורדת תמיד — מהירות הכנה = טיפ גדול יותר
      const r = Math.max(0, c.patience / c.patienceMax);
      c.bar.style.width = (r * 100) + '%';
      // צבע פס + הבעת פנים לפי הסבלנות
      if (r > 0.5)      c.bar.style.background = 'linear-gradient(90deg,#48d39a,#7ee8c0)';
      else if (r > 0.25){ c.bar.style.background = 'linear-gradient(90deg,#f5b301,#ffd76b)'; c.faceEl.style.transform = 'rotate(-3deg)'; }
      else              { c.bar.style.background = 'linear-gradient(90deg,#ff5b5b,#ff9a9a)'; c.faceEl.style.transform = 'rotate(3deg)'; }

      // לקוח שמכינים לו לא בורח באמצע — רק נעצר ב-0
      if (c.patience <= 0) { if (c.busy) c.patience = 0; else leaveAngry(c); }
    });

    // השלמת לקוחות חדשים בקצב נינוח
    spawnTimer -= dt;
    if (spawnTimer <= 0 && list.filter(c => !c.leaving).length < G.maxSlots()) {
      list.push(makeCustomer());
      spawnTimer = (2.5 + Math.random() * 2) * G.paceMul();
    }

    requestAnimationFrame(tick);
  }

  function remove(c) {
    const i = list.indexOf(c);
    if (i >= 0) list.splice(i, 1);
    setTimeout(() => { if (c.el.parentNode) c.el.remove(); }, 750);
    // השלמה לאחר עזיבה
    setTimeout(fillSlots, 800);
  }

  function leaveAngry(c) {
    if (c.leaving) return;
    c.leaving = true;
    c.faceEl.textContent = '😣';
    c.el.querySelector('.bubble').textContent = 'אוף, לא הספקתי!';
    c.el.querySelector('.bubble').style.fontSize = '3vh';
    c.el.classList.remove('tapable');
    c.el.classList.add('leave-sad');
    Sound.sad();
    remove(c);
  }

  function leaveHappy(c, stars) {
    if (c.leaving) return;
    c.leaving = true;
    c.faceEl.textContent = '😄';
    c.el.querySelector('.bubble').textContent = '⭐'.repeat(stars || 1);
    c.el.classList.remove('tapable');
    c.el.classList.add('leave-happy');
    const rect = c.faceEl.getBoundingClientRect();
    FX.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 14, { emoji:'💖' });
    remove(c);
  }

  // יחס הסבלנות שנותר (לחישוב טיפ)
  function patienceRatio(c) { return Math.max(0, c.patience / c.patienceMax); }

  function setBusy(c, b) { if (c) c.busy = b; }

  return { init, start, stop, leaveHappy, leaveAngry, patienceRatio, setBusy };
})();
