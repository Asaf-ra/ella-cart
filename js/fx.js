/* ===== אפקטים: נצנוצים, קונפטי, כוכבים (Canvas) ===== */
const FX = (function () {
  let cv, ctx, W, H, parts = [], raf = null;

  function init() {
    cv = document.getElementById('fx');
    ctx = cv.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }
  function resize() {
    W = cv.width = window.innerWidth;
    H = cv.height = window.innerHeight;
  }

  const EMO = ['⭐','✨','💖','🌟','🎉','💛','💫'];

  function burst(x, y, n, opts) {
    opts = opts || {};
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (opts.spread || 6) * (0.4 + Math.random());
      parts.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - (opts.up || 3),
        g: opts.g != null ? opts.g : 0.18,
        life: 1,
        decay: 0.012 + Math.random() * 0.012,
        emoji: opts.emoji || EMO[(Math.random() * EMO.length) | 0],
        size: (opts.size || 26) + Math.random() * 16,
        rot: Math.random() * 6,
        vr: (Math.random() - 0.5) * 0.3
      });
    }
    start();
  }

  // קונפטי שיורד מלמעלה לכל הרוחב
  function confetti(n) {
    for (let i = 0; i < n; i++) {
      parts.push({
        x: Math.random() * W, y: -20,
        vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 3,
        g: 0.05, life: 1, decay: 0.006,
        emoji: EMO[(Math.random() * EMO.length) | 0],
        size: 22 + Math.random() * 18, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4
      });
    }
    start();
  }

  function start() { if (!raf) raf = requestAnimationFrame(loop); }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      p.life -= p.decay;
      if (p.life <= 0 || p.y > H + 40) { parts.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.font = p.size + 'px serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(p.emoji, 0, 0);
      ctx.restore();
    }
    if (parts.length) raf = requestAnimationFrame(loop);
    else { raf = null; ctx.clearRect(0, 0, W, H); }
  }

  return { init, burst, confetti };
})();
