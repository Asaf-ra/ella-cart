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
    getCtx: ensure,
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

/* ===== מוזיקת רקע עליזה — נוצרת ב-Web Audio, בלולאה, בלי קבצים ===== */
const Music = (function () {
  let playing = false, timer = null, master = null, step = 0;

  // C4..C5 ועוד — תווים לפי תדר
  const N = { C3:130.81, E3:164.81, F3:174.61, G3:196.00, A3:220.00, B3:246.94,
    C4:261.63, D4:293.66, E4:329.63, F4:349.23, G4:392.00, A4:440.00, B4:493.88,
    C5:523.25, D5:587.33, E5:659.25, F5:698.46, G5:783.99, A5:880.00 };

  // התקדמות אקורדים שמחה (C–G–Am–F) עם מלודיה קופצנית
  const bars = [
    { chord:[N.C3, N.E4, N.G4], mel:[N.E5, N.G5, N.E5, N.C5] },
    { chord:[N.G3, N.B3, N.D5], mel:[N.D5, N.G5, N.D5, N.B4] },
    { chord:[N.A3, N.C4, N.E4], mel:[N.C5, N.E5, N.C5, N.A4] },
    { chord:[N.F3, N.A3, N.C5], mel:[N.A4, N.C5, N.F5, N.C5] }
  ];

  function play(ctx, freq, start, dur, type, vol) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(master);
    o.start(start); o.stop(start + dur + 0.05);
  }

  function playBar() {
    if (!playing) return;
    const ctx = Sound.getCtx(); if (!ctx || !master) return;
    const t = ctx.currentTime + 0.06;
    const bar = bars[step % bars.length]; step++;
    bar.chord.forEach(f => play(ctx, f, t, 1.7, 'sine', 0.045));     // כרית אקורד רכה
    bar.mel.forEach((f, i) => play(ctx, f, t + i * 0.42, 0.28, 'triangle', 0.06)); // מלודיה
  }

  return {
    start() {
      if (playing) return;
      const ctx = Sound.getCtx(); if (!ctx) return;
      playing = true;
      master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 1.2);
      master.connect(ctx.destination);
      playBar();
      timer = setInterval(playBar, 1700);
    },
    stop() {
      playing = false;
      if (timer) { clearInterval(timer); timer = null; }
      const ctx = Sound.getCtx();
      if (master && ctx) { try { master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.4); } catch (e) {} }
      master = null;
    },
    isPlaying() { return playing; }
  };
})();

/* ===== קול מדבר בעברית — Web Speech API מובנה (אופליין, בלי קבצים) ===== */
const Voice = (function () {
  let voice = null, last = 0;
  const ok = (typeof window !== 'undefined') && ('speechSynthesis' in window);

  function pick() {
    try {
      const vs = window.speechSynthesis.getVoices();
      voice = vs.find(v => /he|iw/i.test(v.lang)) || voice;
    } catch (e) {}
  }
  if (ok) { pick(); try { window.speechSynthesis.onvoiceschanged = pick; } catch (e) {} }

  return {
    say(text, opts) {
      if (!ok || !Sound.isOn()) return;
      const now = Date.now();
      if (now - last < 650) return;                 // לא לדבר אחד על השני
      last = now;
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'he-IL'; if (voice) u.voice = voice;
        u.rate = (opts && opts.rate) || 1.0;
        u.pitch = (opts && opts.pitch) || 1.3;       // עליז וילדותי
        u.volume = 1;
        window.speechSynthesis.speak(u);
      } catch (e) {}
    },
    praise() { const p = ['כל הכבוד!', 'מעולה!', 'יופי אלה!', 'וואו!', 'איזה יופי!', 'כל הכבוד אלה!']; this.say(p[(Math.random() * p.length) | 0]); },
    silence() { if (ok) { try { window.speechSynthesis.cancel(); } catch (e) {} } }
  };
})();
