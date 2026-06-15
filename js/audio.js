/* ===== צלילים — נוצרים בקוד עם Web Audio API (בלי קבצים חיצוניים) ===== */
const Sound = (function () {
  let ctx = null;
  let on = true;

  function ensure() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // צליל בסיסי: תדר, משך, סוג גל, עוצמה
  function tone(freq, dur, type, vol, slideTo) {
    if (!on) return;
    const c = ensure(); if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, c.currentTime);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, c.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g); g.connect(c.destination);
    o.start(); o.stop(c.currentTime + dur + 0.02);
  }

  function chord(freqs, dur, type, vol) {
    freqs.forEach(f => tone(f, dur, type, (vol || 0.18) / freqs.length));
  }

  return {
    isOn: () => on,
    toggle() { on = !on; if (on) { ensure(); this.tap(); } return on; },
    unlock() { ensure(); },

    tap()    { tone(660, 0.08, 'triangle', 0.15); },
    pop()    { tone(900, 0.10, 'sine', 0.2, 1400); },
    bubble() { tone(500, 0.12, 'sine', 0.18, 1000); },
    chop()   { tone(180, 0.07, 'square', 0.22, 90); },
    cha_ching() { // קצ'ינג של כסף
      tone(880, 0.10, 'square', 0.15, 1320);
      setTimeout(() => tone(1320, 0.18, 'square', 0.15, 1760), 80);
    },
    happy() { // מנגינת שמחה קצרה
      const notes = [523, 659, 784, 1047];
      notes.forEach((f, i) => setTimeout(() => tone(f, 0.18, 'triangle', 0.2), i * 90));
    },
    sad()  { tone(440, 0.25, 'sine', 0.16, 240); },
    sparkle() { tone(1500, 0.12, 'sine', 0.10, 2400); },
    ding() { chord([784, 988, 1175], 0.5, 'sine', 0.2); }
  };
})();
