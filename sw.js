/* ===== Service Worker — עבודה אופליין מלאה ===== */
const CACHE = 'ella-cart-v5';
const ART = [
  'ella','cust_girl','cust_boy','cust_bunny','cust_bear','cust_cat','cust_panda',
  'cust_dog','cust_fox','cust_frog','cust_penguin','cust_pig','cust_mouse',
  'food_shake','food_burger','food_pizza','food_donut',
  'ing_bun_top','ing_bun_bottom','ing_patty','ing_cheese','ing_lettuce','ing_tomato','ing_cucumber','ing_onion',
  'ing_straw','ing_choc','ing_vanilla','ing_blue','ing_cherry','ing_mushroom','ing_pepper','ing_olive','ing_pineapple'
].map(function (k) { return './assets/art/' + k + '.svg'; });
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './assets/icon.svg',
  './vendor/phaser.min.js',
  './js/audio.js',
  './js/state.js',
  './js/world.js',
  './js/minigame.js',
  './js/game.js'
].concat(ART);

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
                            .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// קודם מהמטמון (cache-first) — אמינות מוחלטת גם בלי אינטרנט
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      return hit || fetch(e.request).then(function (res) {
        return caches.open(CACHE).then(function (c) {
          try { c.put(e.request, res.clone()); } catch (err) {}
          return res;
        });
      }).catch(function () { return caches.match('./index.html'); });
    })
  );
});
