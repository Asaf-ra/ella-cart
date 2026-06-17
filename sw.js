/* ===== Service Worker — עבודה אופליין מלאה ===== */
const CACHE = 'ella-cart-v3';
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
  './js/game.js',
  './assets/art/ella.svg',
  './assets/art/cust_girl.svg',
  './assets/art/cust_boy.svg',
  './assets/art/cust_bunny.svg',
  './assets/art/cust_bear.svg',
  './assets/art/cust_cat.svg',
  './assets/art/cust_panda.svg',
  './assets/art/food_shake.svg',
  './assets/art/food_burger.svg',
  './assets/art/food_pizza.svg',
  './assets/art/food_donut.svg'
];

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
