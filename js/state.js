/* ===== מצב המשחק + כלכלה + שמירה מקומית ===== */
const G = (function () {
  const KEY = 'ella_cart_save_v1';

  // הגדרת שלושת המאכלים
  const FOODS = {
    shake:  { id:'shake',  name:'מילקשייק', emoji:'🥤', base:10 },
    donut:  { id:'donut',  name:'דונאט',    emoji:'🍩', base:12 },
    burger: { id:'burger', name:'המבורגר',  emoji:'🍔', base:15 },
    pizza:  { id:'pizza',  name:'פיצה',      emoji:'🍕', base:20 }
  };

  // הגדרת שדרוגים. כל שדרוג: רמות עם מחיר; effect מחושב לפי רמה.
  const UPGRADES = [
    { id:'slots', name:'עוד מקום בתור', ico:'👨‍👩‍👧', desc:'יותר לקוחות בו-זמנית',
      costs:[60,150,300], baseVal:2, perLvl:1 }, // 2..5
    { id:'patience', name:'לקוחות סבלניים', ico:'😌',
      costs:[40,90,180,320], baseVal:1, perLvl:0.25 }, // מכפיל סבלנות
    { id:'tip', name:'טיפים גדולים', ico:'⭐',
      costs:[50,120,250,420], baseVal:1, perLvl:0.3 }, // מכפיל טיפ
    { id:'pace', name:'קצב נינוח', ico:'🐢',
      costs:[45,100,210], baseVal:1, perLvl:0.18 }, // מאט הגעת לקוחות
    { id:'helper', name:'עוזר לעגלה', ico:'🧑‍🍳',
      costs:[120,300,600], baseVal:0, perLvl:1 }, // הכנסה אוטומטית/עוזר
    { id:'toppings', name:'תוספות חדשות', ico:'🍒',
      costs:[70,160], baseVal:0, perLvl:1 }, // פותח תוספות נוספות
    { id:'cart', name:'עיצוב עגלה', ico:'🎨',
      costs:[90,200], baseVal:0, perLvl:1, skins:['default','royal','rainbow'] },
    { id:'theme', name:'רקע חדש', ico:'🏝️',
      costs:[110,110,110,110], baseVal:0, perLvl:1, themes:['default','beach','park','city','space'] }
  ];

  const defaults = { coins: 0, lvls: {}, soundOn: true };

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return Object.assign({}, defaults, JSON.parse(raw));
    } catch (e) {}
    return JSON.parse(JSON.stringify(defaults));
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  function lvl(id) { return state.lvls[id] || 0; }
  function upg(id) { return UPGRADES.find(u => u.id === id); }

  // ערך נוכחי של שדרוג לפי רמתו
  function val(id) {
    const u = upg(id); if (!u) return 0;
    return u.baseVal + lvl(id) * u.perLvl;
  }

  function nextCost(id) {
    const u = upg(id); const l = lvl(id);
    if (l >= u.costs.length) return null; // מקסימום
    return u.costs[l];
  }
  function isMax(id) { return nextCost(id) === null; }

  function buy(id) {
    const cost = nextCost(id);
    if (cost === null || state.coins < cost) return false;
    state.coins -= cost;
    state.lvls[id] = lvl(id) + 1;
    save();
    applyCosmetics();
    return true;
  }

  function addCoins(n) { state.coins += n; save(); }

  // החלת מראה (סקין/רקע) על ה-body
  function applyCosmetics() {
    const cartU = upg('cart');
    document.body.dataset.cart = cartU.skins[Math.min(lvl('cart'), cartU.skins.length - 1)];
    const themeU = upg('theme');
    document.body.dataset.theme = themeU.themes[Math.min(lvl('theme'), themeU.themes.length - 1)];
  }

  // פרמטרים נגזרים למשחק
  function maxSlots()    { return Math.round(val('slots')); }            // 2..5
  function patienceMul() { return val('patience'); }                     // 1..2
  function tipMul()      { return val('tip'); }                          // 1..2.2
  function paceMul()     { return val('pace'); }                         // 1..1.5 (מאריך מרווחים)
  function helperRate()  { return lvl('helper'); }                       // 0..3 (מטבעות/מחזור)
  function extraToppings(){ return lvl('toppings'); }                    // 0..2

  return {
    FOODS, UPGRADES,
    get coins(){ return state.coins; },
    get soundOn(){ return state.soundOn; },
    set soundOn(v){ state.soundOn = v; save(); },
    lvl, val, nextCost, isMax, buy, addCoins, save, applyCosmetics,
    maxSlots, patienceMul, tipMul, paceMul, helperRate, extraToppings
  };
})();
