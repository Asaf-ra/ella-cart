/* ===== Service Worker — עבודה אופליין מלאה =====
   פרק 1 — רשימת קבצים לשמירה מראש (דפים, קוד, גופנים, ציורים)
   פרק 2 — הקלטות הקול באנגלית: הרשימה נקראת מ-js/voice-en.js (אותו מניפסט שהאפליקציה משתמשת בו)
   פרק 3 — התקנה / ניקוי מטמונים ישנים / הגשה מהמטמון (cache-first) */
const CACHE = 'ella-cart-v53';
const ART = [
  'ella','cust_girl','cust_boy','cust_bunny','cust_bear','cust_cat','cust_panda',
  'cust_dog','cust_fox','cust_frog','cust_penguin','cust_pig','cust_mouse',
  'food_shake','food_burger','food_pizza','food_donut','food_pancake',
  'ing_bun_top','ing_bun_bottom','ing_patty','ing_cheese','ing_lettuce','ing_tomato','ing_cucumber','ing_onion',
  'ing_straw','ing_choc','ing_vanilla','ing_blue','ing_cherry','ing_mushroom','ing_pepper','ing_olive','ing_pineapple'
].map(function (k) { return './assets/art/' + k + '.svg'; });
const ASSETS = [
  './',
  './index.html',
  './cart.html',
  './learning.html',
  './coloring.html',
  './balloons.html',
  './flight.html',
  './stories.html',
  './welcome.html',
  './dragon.html',
  './js/dragon.js',
  './js/care-data.js',
  './js/dragon-care.js',
  './js/dragon-data.js',
  './js/voice-en-slow.js',
  './style.css',
  './manifest.json',
  './assets/icon.svg',
  './vendor/phaser.min.js',
  './vendor/babylon.js',
  './shared/kids-ui.js',
  './shared/wallet.js',
  './shared/theme.css',
  './shared/hero-avatar.js',
  './shared/hero-rewards.js',
  './shared/voice-settings.js',
  './shared/progress.js',
  './shared/pet.js',
  './shared/parents.js',
  './shared/profile.js',
  './shared/onboarding.js',
  './shared/share.js',
  './shared/qr.js',
  './shared/seasons.js',
  './shared/stickers.js',
  './js/art-pages.js',
  './js/story-data.js',
  './js/stories.js',
  './js/voice-en.js',
  './js/academy-modules.js',
  './js/academy-puzzle.js',
  './js/flight.js',
  './assets/fonts/rubik-hebrew-wght-normal.woff2',
  './assets/fonts/rubik-latin-wght-normal.woff2',
  './assets/icons/icon-180.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './js/audio.js',
  './js/state.js',
  './js/hero3d.js',
  './js/hero-comic.js',
  './js/world.js',
  './js/minigame.js',
  './js/game.js',
  './js/hub.js',
  './js/coloring.js',
  './js/balloons.js'
].concat(ART);

/* ---------- פרק 2 — הקלטות קול טבעיות באנגלית ---------- */
var VOICE = [];
try {
  self.window = self;                       // voice-en.js כותב ל-window.VOICE_EN
  importScripts('./js/voice-en.js');
  var seen = {};
  Object.keys(self.VOICE_EN || {}).forEach(function (k) { var f = self.VOICE_EN[k]; if (!seen[f]) { seen[f] = 1; VOICE.push('./assets/voice/en/' + f); } });
  importScripts('./js/voice-en-slow.js');   // הקלטות איטיות וברורות למשימות הדרקון
  Object.keys(self.VOICE_EN_SLOW || {}).forEach(function (k) { var f = self.VOICE_EN_SLOW[k]; if (!seen['s/' + f]) { seen['s/' + f] = 1; VOICE.push('./assets/voice/en-slow/' + f); } });
} catch (err) {}

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) {
    /* קודם הקבצים החיוניים; ההקלטות אחריהם — הקלטה שנכשלה לא מפילה את ההתקנה */
    return c.addAll(ASSETS).then(function () {
      return Promise.all(VOICE.map(function (u) { return c.add(u).catch(function () {}); }));
    });
  }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      /* מוחקים רק גרסאות ישנות של האפליקציה הזו — אפליקציות אחרות באותו אתר (למשל העולם של איתן) נשארות */
      return Promise.all(keys.filter(function (k) { return k !== CACHE && k.indexOf('ella-cart-') === 0; })
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
