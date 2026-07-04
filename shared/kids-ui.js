/* ===== kids-ui.js — שירותים משותפים לכל דפי המשחקים =====
   HomeButton — כפתור 🏠 עם "נעילת הורים": לחיצה ארוכה (2 שניות) חוזרת למסך הבית,
                כדי שאלה לא תצא מהמשחק בטעות. טבעת התקדמות מציירת את משך הלחיצה.
   PageFade   — מעבר עדין בין דפים (fade-in בטעינה, fade-out בניווט).
   KidsAudio  — פתיחת AudioContext במגע ראשון (חובה ב-iOS) + צליל לחיצה קטן.
   WakeGuard  — בקשת Screen Wake Lock שהמסך לא יכבה באמצע משחק (Safari 16.4+).       */
(function () {
  'use strict';

  /* ---------- הזרקת סגנון פעם אחת ---------- */
  var css = [
    '#kui-fade{position:fixed;inset:0;background:#fff;z-index:9999;pointer-events:none;',
    ' opacity:0;transition:opacity .35s ease;}',
    '#kui-fade.kui-on{opacity:1;pointer-events:all;}',
    '#kui-home{position:fixed;top:10px;left:10px;z-index:9000;width:64px;height:64px;',
    ' border:none;border-radius:50%;background:rgba(255,255,255,.55);font-size:30px;',
    ' line-height:64px;text-align:center;padding:0;cursor:pointer;user-select:none;',
    ' -webkit-user-select:none;-webkit-tap-highlight-color:transparent;touch-action:none;',
    ' box-shadow:0 2px 8px rgba(0,0,0,.18);}',
    '#kui-home svg{position:absolute;top:-4px;left:-4px;pointer-events:none;}',
    '#kui-home .kui-ring{fill:none;stroke:#ff7eb9;stroke-width:5;stroke-linecap:round;',
    ' stroke-dasharray:214;stroke-dashoffset:214;transform:rotate(-90deg);transform-origin:36px 36px;}',
    '#kui-hint{position:fixed;top:82px;left:10px;z-index:9000;background:rgba(0,0,0,.65);',
    ' color:#fff;font:16px/1.4 -apple-system,Arial,sans-serif;border-radius:12px;padding:6px 12px;',
    ' opacity:0;transition:opacity .25s;pointer-events:none;direction:rtl;}'
  ].join('');
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ---------- PageFade ---------- */
  var fadeEl = null;
  function ensureFade() {
    if (!fadeEl) {
      fadeEl = document.createElement('div');
      fadeEl.id = 'kui-fade';
      document.body.appendChild(fadeEl);
    }
    return fadeEl;
  }
  var PageFade = {
    /* fade-in בכניסה לדף */
    onload: function () {
      var el = ensureFade();
      el.classList.add('kui-on');
      /* force reflow ואז דהייה החוצה */
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { el.classList.remove('kui-on'); });
      });
    },
    /* fade-out וניווט */
    go: function (url) {
      var el = ensureFade();
      el.classList.add('kui-on');
      setTimeout(function () { location.href = url; }, 360);
    }
  };

  /* ---------- KidsAudio — פתיחה במגע ראשון + צלילי UI ---------- */
  var AC = window.AudioContext || window.webkitAudioContext;
  var ctx = null;
  function audioCtx() {
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  var KidsAudio = {
    unlock: function () { audioCtx(); },
    /* צליל "בועה" קצר ללחיצות UI */
    tap: function (pitch) {
      var c = audioCtx(); if (!c) return;
      var o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
      o.type = 'sine';
      o.frequency.setValueAtTime(pitch || 620, t);
      o.frequency.exponentialRampToValueAtTime((pitch || 620) * 1.6, t + 0.09);
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      o.connect(g); g.connect(c.destination);
      o.start(t); o.stop(t + 0.18);
    },
    ctx: audioCtx
  };
  /* פתיחת אודיו במגע הראשון בכל דף */
  ['pointerdown', 'touchstart'].forEach(function (ev) {
    window.addEventListener(ev, function once() {
      KidsAudio.unlock();
      window.removeEventListener(ev, once);
    }, { passive: true });
  });

  /* ---------- WakeGuard — שהמסך לא יכבה ---------- */
  var wakeLock = null;
  function requestWake() {
    if (!('wakeLock' in navigator)) return;
    navigator.wakeLock.request('screen').then(function (wl) { wakeLock = wl; }).catch(function () {});
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && wakeLock) requestWake();
  });
  /* Wake Lock דורש user gesture בחלק מהדפדפנים — מבקשים במגע ראשון */
  window.addEventListener('pointerdown', function onceWake() {
    requestWake();
    window.removeEventListener('pointerdown', onceWake);
  }, { passive: true });

  /* ---------- HomeButton — לחיצה ארוכה 2 שניות ---------- */
  var HOLD_MS = 2000;
  var HomeButton = {
    attach: function () {
      if (document.getElementById('kui-home')) return;
      var btn = document.createElement('button');
      btn.id = 'kui-home';
      btn.innerHTML = '🏠<svg width="72" height="72"><circle class="kui-ring" cx="36" cy="36" r="34"/></svg>';
      document.body.appendChild(btn);

      var hint = document.createElement('div');
      hint.id = 'kui-hint';
      hint.textContent = 'להחזיק כדי לחזור הביתה 🏠';
      document.body.appendChild(hint);

      var ring = btn.querySelector('.kui-ring');
      var timer = null, raf = null, t0 = 0;

      function reset() {
        if (timer) { clearTimeout(timer); timer = null; }
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        ring.style.strokeDashoffset = 214;
        hint.style.opacity = 0;
      }
      function tick() {
        var p = Math.min(1, (performance.now() - t0) / HOLD_MS);
        ring.style.strokeDashoffset = 214 * (1 - p);
        if (p < 1) raf = requestAnimationFrame(tick);
      }
      btn.addEventListener('pointerdown', function (e) {
        e.preventDefault(); e.stopPropagation();
        btn.setPointerCapture(e.pointerId);
        t0 = performance.now();
        hint.style.opacity = 1;
        raf = requestAnimationFrame(tick);
        timer = setTimeout(function () {
          reset();
          KidsAudio.tap(760);
          PageFade.go('./index.html');
        }, HOLD_MS);
      });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
        btn.addEventListener(ev, reset);
      });
    }
  };

  /* ---------- עדכון מיידי: כשגרסה חדשה של ה-service worker משתלטת — רענון חד-פעמי ----------
     בלי זה האייפד מציג את הגרסה הישנה מהמטמון עד הפתיחה השנייה. הרענון קורה רק אם
     כבר היה SW פעיל (עדכון אמיתי), לא בהתקנה ראשונה — כדי לא ליפול ללולאת רענונים. */
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    var kuiReloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (kuiReloaded) return; kuiReloaded = true;
      location.reload();
    });
  }

  /* ---------- ייצוא ---------- */
  window.KidsUI = { HomeButton: HomeButton, PageFade: PageFade, KidsAudio: KidsAudio };

  /* fade-in אוטומטי בטעינת הדף */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', PageFade.onload);
  } else {
    PageFade.onload();
  }
})();
