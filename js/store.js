/* ===== חנות שדרוגים ===== */
const Store = (function () {
  let grid, coinsEl;

  function init() {
    grid = document.getElementById('storeGrid');
    coinsEl = document.getElementById('storeCoins');
  }

  function render() {
    coinsEl.textContent = G.coins;
    grid.innerHTML = '';
    G.UPGRADES.forEach(u => {
      const card = document.createElement('div');
      card.className = 'card';

      const lvl = G.lvl(u.id);
      const maxLvl = u.costs.length;
      const cost = G.nextCost(u.id);
      const max = cost === null;

      const buy = document.createElement('button');
      if (max) {
        buy.className = 'buy max';
        buy.textContent = '✓ מקסימום';
      } else {
        const canAfford = G.coins >= cost;
        buy.className = 'buy' + (canAfford ? '' : ' cant');
        buy.innerHTML = '<span class="coin-ico">🪙</span>' + cost;
        buy.addEventListener('pointerdown', e => {
          e.preventDefault();
          if (G.buy(u.id)) {
            Sound.cha_ching();
            const r = card.getBoundingClientRect();
            FX.burst(r.left + r.width / 2, r.top + r.height / 2, 12, {});
            render();
            UI.updateCoins();
          } else {
            Sound.sad();
          }
        });
      }

      card.innerHTML =
        '<div class="ico">' + u.ico + '</div>' +
        '<div class="name">' + u.name + '</div>' +
        '<div class="lvl">רמה ' + lvl + ' / ' + maxLvl + '</div>';
      card.appendChild(buy);
      grid.appendChild(card);
    });
  }

  return { init, render };
})();
