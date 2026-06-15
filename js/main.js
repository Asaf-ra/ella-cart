/* ===== ניצוח ראשי: מסכים, הגשה, כלכלה, יצירה חופשית ===== */
const UI = (function () {
  let coinsVal, coinsBox, toastEl;
  let currentCustomer = null;
  let mgBack = null;       // פעולת חזרה דינמית למסך המיני-משחק
  let helperTimer = null;

  function $(id) { return document.getElementById(id); }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('show'));
    $(id).classList.add('show');
  }

  function updateCoins() {
    coinsVal.textContent = G.coins;
    $('storeCoins').textContent = G.coins;
    coinsBox.classList.remove('pop'); void coinsBox.offsetWidth; coinsBox.classList.add('pop');
  }

  function toast(txt) {
    toastEl.textContent = txt;
    toastEl.classList.remove('show'); void toastEl.offsetWidth; toastEl.classList.add('show');
  }

  const PRAISE = ['כל הכבוד אלה! 🌟', 'מהמם! 💖', 'יופי של עבודה! 🎉', 'הלקוח מאושר! 😄', 'איזה כיף! ✨'];
  function praise() { return PRAISE[(Math.random() * PRAISE.length) | 0]; }

  // ----- מצב משחק רגיל -----
  function startPlay() {
    showScreen('scene');
    currentCustomer = null;
    Customers.start();
    startHelper();
  }

  function onCustomerTap(c) {
    currentCustomer = c;
    Customers.setBusy(c, true);
    showScreen('minigame');
    mgBack = function () {                 // ויתור על הזמנה — בלי עונש
      Customers.setBusy(c, false);
      currentCustomer = null;
      showScreen('scene');
    };
    MiniGames.open(c.food, function () { onServed(c); }, false);
  }

  function onServed(c) {
    const ratio = Customers.patienceRatio(c);
    const base = G.FOODS[c.food].base;
    const tip = Math.round(base * G.tipMul() * ratio);
    const total = base + tip;
    const stars = ratio > 0.6 ? 3 : ratio > 0.3 ? 2 : 1;

    G.addCoins(total);
    updateCoins();
    Customers.leaveHappy(c, stars);
    FX.confetti(stars * 8);
    Sound.happy();
    toast(praise() + '  +' + total + '🪙');

    currentCustomer = null;
    showScreen('scene');
  }

  // ----- עוזר אוטומטי (הכנסה פסיבית קטנה) -----
  function startHelper() {
    if (helperTimer) clearInterval(helperTimer);
    helperTimer = setInterval(function () {
      const rate = G.helperRate();
      if (rate > 0 && $('scene').classList.contains('show')) {
        G.addCoins(rate);
        updateCoins();
        Sound.sparkle();
      }
    }, 6000);
  }

  // ----- מצב יצירה חופשית -----
  function openFreeMenu() {
    showScreen('minigame');
    $('mgTitle').textContent = '🎨 יצירה חופשית';
    const stage = $('mgStage'), bottom = $('mgBottom');
    bottom.innerHTML = '';
    stage.innerHTML = '<div class="free-menu"></div>';
    const menu = stage.querySelector('.free-menu');
    menu.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:5vw;flex-wrap:wrap;';
    Object.keys(G.FOODS).forEach(k => {
      const f = G.FOODS[k];
      const b = document.createElement('button');
      b.className = 'big-btn play';
      b.style.fontSize = '4vh';
      b.innerHTML = f.emoji + '<br>' + f.name;
      b.addEventListener('pointerdown', e => {
        e.preventDefault(); Sound.tap();
        mgBack = openFreeMenu;
        MiniGames.open(k, function () {
          toast(praise());
          G.addCoins(2); updateCoins();
          openFreeMenu();
        }, true);
      });
      menu.appendChild(b);
    });
    mgBack = function () { showScreen('splash'); };
  }

  // ----- אתחול -----
  function init() {
    coinsVal = $('coinsVal');
    coinsBox = $('coinsBox');
    toastEl  = $('toast');

    FX.init();
    Store.init();
    MiniGames.init();
    Customers.init($('customers'), onCustomerTap);
    G.applyCosmetics();
    updateCoins();

    // כפתורי פתיחה
    $('btnPlay').addEventListener('pointerdown', e => { e.preventDefault(); Sound.unlock(); Sound.tap(); startPlay(); });
    $('btnFree').addEventListener('pointerdown', e => { e.preventDefault(); Sound.unlock(); Sound.tap(); openFreeMenu(); });

    // צליל
    const sBtn = $('btnSound');
    sBtn.textContent = G.soundOn ? '🔊' : '🔇';
    sBtn.addEventListener('pointerdown', e => {
      e.preventDefault();
      const on = Sound.toggle();
      G.soundOn = on;
      sBtn.textContent = on ? '🔊' : '🔇';
    });

    // ניווט סצנה
    $('btnHome').addEventListener('pointerdown', e => { e.preventDefault(); Sound.tap(); Customers.stop(); showScreen('splash'); });
    $('btnStore').addEventListener('pointerdown', e => { e.preventDefault(); Sound.tap(); Store.render(); showScreen('store'); });
    $('btnStoreBack').addEventListener('pointerdown', e => { e.preventDefault(); Sound.tap(); showScreen('scene'); });

    // חזרה מהמיני-משחק (פעולה דינמית)
    $('btnMgBack').addEventListener('pointerdown', e => { e.preventDefault(); Sound.tap(); if (mgBack) mgBack(); });

    // עננים מעופפים ברקע (נוצרים בקוד)
    spawnClouds(document.querySelector('.splash-clouds'));

    // מניעת תפריט הקשר/בחירה
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('gesturestart', e => e.preventDefault());
    document.addEventListener('dblclick', e => e.preventDefault());
  }

  function spawnClouds(host) {
    if (!host) return;
    for (let i = 0; i < 5; i++) {
      const c = document.createElement('div');
      c.className = 'cloud';
      const size = 6 + Math.random() * 6;
      c.style.width = size + 'vh';
      c.style.height = size + 'vh';
      c.style.top = (5 + Math.random() * 40) + 'vh';
      c.style.animationDuration = (22 + Math.random() * 22) + 's';
      c.style.animationDelay = (-Math.random() * 20) + 's';
      host.appendChild(c);
    }
  }

  return { init, updateCoins, showScreen, toast };
})();

window.addEventListener('DOMContentLoaded', UI.init);
