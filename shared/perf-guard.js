/* =====================================================================
   shared/perf-guard.js — שומר ביצועים לאייפד ישן (שלב 17)
   ---------------------------------------------------------------------
   מה הקובץ עושה: מודד את קצב הפריימים ברקע. אם במשך 2 חלונות רצופים של 2 שניות הקצב נמוך
   מ-38 פריימים לשנייה (והמסך גלוי) — עוברים ל"מצב קל": מכבים את שכבות העור של מארוול
   (body[data-skin="off"] → בלי רסטר/הברקת עדשה), ושולחים אירוע perf:low שהמשחקים מאזינים לו
   כדי להוריד את רזולוציית הקנבס (DPR 1). ההחלטה נשמרת במכשיר (kids-perf-low), כך שבפתיחה
   הבאה המצב הקל מופעל מיד. אזור ההורים יכול לאפס (PerfGuard.reset()).

   פרק 1 — מדידה: requestAnimationFrame, חלונות של 2 שניות, מתעלמים כשהמסך מוסתר
   פרק 2 — מצב קל: applyLow() — תכונת skin, אירוע perf:low, שמירה
   פרק 3 — ייצוא: window.PerfGuard = { low, reset, fps }
   תקלה נפוצה: המסך "נראה פשוט" פתאום? זה המצב הקל. PerfGuard.reset() ב-DevTools + רענון מחזיר.
   ===================================================================== */
(function () {
  'use strict';
  var KEY = 'kids-perf-low', WINDOW_MS = 2000, MIN_FPS = 38, STRIKES = 2;
  var frames = 0, t0 = 0, strikes = 0, low = false, lastFps = 60, started = false;

  /* ---------- פרק 2 — מצב קל ---------- */
  function applyLow(fps, remembered) {
    if (low) return; low = true;
    try { document.body.dataset.skin = 'off'; } catch (e) {}
    try { localStorage.setItem(KEY, '1'); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent('perf:low', { detail: { fps: fps, remembered: !!remembered } })); } catch (e) {}
  }

  /* ---------- פרק 1 — מדידה ---------- */
  function tick(t) {
    if (low) return;                                                   // כבר במצב קל — אין צורך למדוד
    frames++;
    if (!t0) t0 = t;
    if (t - t0 >= WINDOW_MS) {
      lastFps = frames * 1000 / (t - t0); frames = 0; t0 = t;
      if (document.visibilityState === 'visible') { if (lastFps < MIN_FPS) strikes++; else strikes = 0; }
      if (strikes >= STRIKES) { applyLow(lastFps, false); return; }
    }
    requestAnimationFrame(tick);
  }
  function start() {
    if (started) return; started = true;
    var remembered = false; try { remembered = localStorage.getItem(KEY) === '1'; } catch (e) {}
    if (remembered) { applyLow(0, true); return; }
    /* מתחילים למדוד רק אחרי 3 שניות — הטעינה הראשונה תמיד איטית ולא מעידה על המכשיר */
    setTimeout(function () { requestAnimationFrame(tick); }, 3000);
  }

  /* ---------- פרק 3 — ייצוא ---------- */
  window.PerfGuard = {
    low: function () { return low; },
    fps: function () { return Math.round(lastFps); },
    reset: function () { low = false; strikes = 0; try { localStorage.removeItem(KEY); } catch (e) {} try { delete document.body.dataset.skin; } catch (e) {} }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
