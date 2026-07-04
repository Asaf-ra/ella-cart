/* ===== ארנק משותף לכל העולם של אלה =====
   מטבע אחד לכל המשחקים: משתמש באותו מפתח שמירה של משחק העגלה —
   מטבעות שמרוויחים בבלונים/צביעה נכנסים לאותו ארנק של העגלה, ולהפך.
   שדרוגי המשחקים החדשים נשמרים במפתח נפרד (ella-shop-v1).            */
const Wallet = (function () {
  const CART_KEY = 'ella_cart_save_v1';   // ארנק העגלה — מקור אמת יחיד למטבעות
  const SHOP_KEY = 'ella-shop-v1';

  function cart() { try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch (e) { return {}; } }
  function saveCart(s) { try { localStorage.setItem(CART_KEY, JSON.stringify(s)); } catch (e) {} }
  function shop() { try { return JSON.parse(localStorage.getItem(SHOP_KEY)) || {}; } catch (e) { return {}; } }
  function saveShop(s) { try { localStorage.setItem(SHOP_KEY, JSON.stringify(s)); } catch (e) {} }

  return {
    /* פריטי עגלת השדרוגים — מוגדרים כאן כדי שהחנות והמשחקים יקראו מאותו מקום */
    ITEMS: [
      { id: 'bigBalloons', ico: '🎈', name: 'בלוני ענק',   costs: [40, 90],  desc: 'בלונים גדולים יותר' },
      { id: 'turbo',       ico: '🚀', name: 'טורבו',        costs: [60, 130], desc: 'הבלונים טסים מהר!' },
      { id: 'magic',       ico: '🦄', name: 'בלוני קסם',   costs: [80],      desc: 'חדי-קרן, כוכבים ולבבות' },
      { id: 'brushes',     ico: '🖌️', name: 'עוד צבעים',   costs: [50],      desc: 'שישה צבעים חדשים לצביעה' }
    ],

    get coins() { const c = cart(); return c.coins || 0; },
    add(n) { const c = cart(); c.coins = (c.coins || 0) + n; saveCart(c); return c.coins; },
    spend(n) { const c = cart(); if ((c.coins || 0) < n) return false; c.coins -= n; saveCart(c); return true; },

    lvl(id) { return shop()[id] || 0; },
    maxLvl(id) { const it = this.ITEMS.find(i => i.id === id); return it ? it.costs.length : 0; },
    nextCost(id) { const it = this.ITEMS.find(i => i.id === id); if (!it) return null;
      const l = this.lvl(id); return l >= it.costs.length ? null : it.costs[l]; },
    buy(id) {
      const cost = this.nextCost(id);
      if (cost === null || !this.spend(cost)) return false;
      const s = shop(); s[id] = (s[id] || 0) + 1; saveShop(s);
      return true;
    }
  };
})();
window.Wallet = Wallet;
