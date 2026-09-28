/* ===== צלילים — נוצרים בקוד עם Web Audio API (בלי קבצים חיצוניים) ===== */
const Sound = (function () {
  let ctx = null;
  let on = true;
  let bus = null;          // מגביל-עוצמה משותף — מונע סדקים כשמקישים/מפוצצים מהר מדי
  let activeTones = 0;
  const MAX_ACTIVE = 12;

  function ensure() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  // כל הצלילים עוברים דרך compressor אחד לפני הרמקול — כך הקשות מהירות (בלונים, מיני-משחק)
  // לא חותכות/מסדקות את הפלט כשכמה צלילים מתנגשים באותו רגע.
  function outBus() {
    if (!ctx) return null;
    if (!bus) {
      bus = ctx.createDynamicsCompressor();
      try {
        bus.threshold.setValueAtTime(-18, ctx.currentTime);
        bus.knee.setValueAtTime(22, ctx.currentTime);
        bus.ratio.setValueAtTime(9, ctx.currentTime);
        bus.attack.setValueAtTime(0.003, ctx.currentTime);
        bus.release.setValueAtTime(0.16, ctx.currentTime);
      } catch (e) {}
      bus.connect(ctx.destination);
    }
    return bus;
  }

  // צליל בסיסי: תדר, משך, סוג גל, עוצמה
  function tone(freq, dur, type, vol, slideTo) {
    if (!on) return;
    const c = ensure(); if (!c) return;
    if (activeTones >= MAX_ACTIVE) return;   // הגנה מפני ריבוי קולות בו-זמנית בהקשות מהירות
    const out = outBus() || c.destination;
    activeTones++;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, c.currentTime);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, c.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g); g.connect(out);
    o.start(); o.stop(c.currentTime + dur + 0.02);
    o.onended = () => { activeTones = Math.max(0, activeTones - 1); };
  }

  function chord(freqs, dur, type, vol) {
    freqs.forEach(f => tone(f, dur, type, (vol || 0.18) / freqs.length));
  }

  return {
    isOn: () => on,
    getCtx: ensure,
    getBus: outBus,
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
      master.connect(Sound.getBus() || ctx.destination);
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

/* ===== קול מדבר — Web Speech API מובנה (אופליין, בלי קבצים) =====
   פרק 1 — בחירת קולות: עברית (he-IL, ב-iOS עדיפות ל-Carmit) ואנגלית (en-US)
   פרק 2 — ניקוי טקסט: בלי אימוג'י, סימנים הופכים למילים (+ → ועוד, ₪ → שקלים…)
   פרק 3 — תור הקראה: משפטים לא "נבלעים"; interrupt מתחיל מחדש (שאלה חדשה),
           ומשפט רגיל מחליף רק משפט שעוד ממתין (כדי שלא תיווצר ערימה)
   פרק 4 — שומר-זמן: ב-Safari לפעמים onend לא מגיע — ממשיכים לבד אחרי זמן סביר
   API: Voice.say(text, opts) · Voice.read([{text, lang}], opts) · Voice.praise() · Voice.silence() · Voice.clean(text, lang) */
const Voice = (function () {
  const ok = (typeof window !== 'undefined') && ('speechSynthesis' in window) && ('SpeechSynthesisUtterance' in window);
  let he = null, en = null, voices = [];

  /* ---------- פרק 1 — בחירת קולות ----------
     הקול ה"רובוטי" מגיע בדרך כלל מקול בסיסי (Compact). מעדיפים קולות איכותיים:
     Premium / Enhanced / Siri / Neural / Natural / Google — ומאפשרים להורה לבחור ידנית (נשמר במכשיר). */
  const PREF_KEY = 'ella-voice-v1';
  function prefs() { try { return JSON.parse(localStorage.getItem(PREF_KEY)) || {}; } catch (e) { return {}; } }
  function savePrefs(p) { try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch (e) {} }
  /* ציון איכות לקול: גבוה יותר = טבעי יותר */
  function quality(v, favorites) {
    let q = 0;
    if (/premium|neural|natural/i.test(v.name)) q += 60;
    if (/enhanced|siri|משופר/i.test(v.name)) q += 45;
    if (/google/i.test(v.name)) q += 30;
    if (/compact|eloquence|novelty|bad news|bells|boing|bubbles|cellos|jester|organ|superstar|trinoids|whisper|wobble|zarvox|albert|fred|junior|ralph|bahh/i.test(v.name)) q -= 80;
    favorites.forEach((f, i) => { if (new RegExp(f, 'i').test(v.name)) q += 20 - i * 3; });
    if (v.localService) q += 4;                       // עובד גם בלי אינטרנט
    return q;
  }
  function best(list, favorites) { return list.slice().sort((a, b) => quality(b, favorites) - quality(a, favorites))[0] || null; }
  function pick() {
    try {
      voices = window.speechSynthesis.getVoices() || [];
      const p = prefs();
      const heAll = voices.filter(v => /^(he|iw)/i.test(v.lang));
      const enAll = voices.filter(v => /^en[-_](US|GB|AU)/i.test(v.lang));
      he = heAll.find(v => v.name === p.he) || best(heAll, ['carmit']) || he;
      en = enAll.find(v => v.name === p.en) || best(enAll.filter(v => /^en[-_]US/i.test(v.lang)).concat(enAll), ['ava', 'samantha', 'allison', 'nicky', 'google us', 'zoe', 'evan', 'susan']) || voices.find(v => /^en/i.test(v.lang)) || en;
    } catch (e) {}
  }
  if (ok) { pick(); try { window.speechSynthesis.onvoiceschanged = pick; } catch (e) {} }

  /* ---------- פרק 2 — ניקוי טקסט ---------- */
  let EMOJI = null;
  try { EMOJI = new RegExp('[\\p{Extended_Pictographic}\\u{1F1E6}-\\u{1F1FF}\\u{FE0F}\\u{200D}\\u{20E3}\\u{1F3FB}-\\u{1F3FF}]', 'gu'); } catch (e) {}
  function clean(text, lang) {
    let t = String(text == null ? '' : text);
    if (EMOJI) t = t.replace(EMOJI, ' ');
    t = t.replace(/[←→⟵⟶➜✓✔✖✦★☆●▲■◆♥·•]/g, ' ');
    if (!lang || /^he/i.test(lang)) {
      t = t.replace(/(\d+)\s*\/\s*(\d+)/g, '$1 מתוך $2')     // 3/3 → 3 מתוך 3
           .replace(/\s*\+\s*/g, ' ועוד ')
           .replace(/\s*[−–]\s*(?=\d)/g, ' פחות ')
           .replace(/(\d)\s*-\s*(?=\d)/g, '$1 פחות ')
           .replace(/\s*=\s*/g, ' שווה ')
           .replace(/₪/g, ' שקלים ')
           .replace(/_/g, ' ');
    }
    return t.replace(/\s{2,}/g, ' ').replace(/\s+([!?.,])/g, '$1').trim();
  }

  /* ---------- פרק 3 — תור הקראה ---------- */
  let queue = [], speaking = false, watchdog = null, lastText = '', lastAt = 0;
  function next() {
    clearTimeout(watchdog);
    const item = queue.shift();
    if (!item) { speaking = false; return; }
    speaking = true;
    const u = new SpeechSynthesisUtterance(item.text);
    const isEn = /^en/i.test(item.lang || '');
    u.lang = isEn ? 'en-US' : 'he-IL';
    const v = isEn ? en : he; if (v) u.voice = v;
    const p = prefs(), speed = p.rate || 1;
    /* קצב וגובה טבעיים: גובה מוגזם (1.2+) הוא מה שנשמע "רובוטי/סנאי" — מגבילים ל-1.05 */
    u.rate = Math.max(.7, Math.min(1.2, (item.rate || (isEn ? .9 : .97)) * speed));
    u.pitch = Math.max(.95, Math.min(1.05, item.pitch || 1.02));
    u.volume = 1;
    u.onend = u.onerror = function () { next(); };
    /* ---------- פרק 4 — שומר-זמן ---------- */
    watchdog = setTimeout(next, 1800 + item.text.length * 110);
    try { window.speechSynthesis.speak(u); } catch (e) { next(); }
  }
  function read(parts, opts) {
    if (!ok || (typeof Sound !== 'undefined' && !Sound.isOn())) return;
    opts = opts || {};
    let items = (parts || []).map(p => ({ text: clean(p.text, p.lang), lang: p.lang || 'he-IL', rate: opts.rate, pitch: opts.pitch })).filter(p => p.text);
    /* מאחדים קטעים רצופים באותה שפה למשפט אחד — פחות "קטיעות" בין מילים = דיבור זורם */
    items = items.reduce((acc, it) => {
      const last = acc[acc.length - 1];
      if (last && /^en/i.test(last.lang) === /^en/i.test(it.lang)) last.text += (/[.!?,:]$/.test(last.text) ? ' ' : ', ') + it.text;
      else acc.push(Object.assign({}, it));
      return acc;
    }, []);
    if (!items.length) return;
    const key = items.map(p => p.text).join('|'), now = Date.now();
    if (key === lastText && now - lastAt < 1200) return;      // אותו משפט פעמיים ברצף — פעם אחת מספיקה
    lastText = key; lastAt = now;
    if (opts.interrupt) {                                      // שאלה חדשה: מפסיקים הכול ומתחילים מחדש
      queue = []; clearTimeout(watchdog);
      try { window.speechSynthesis.cancel(); } catch (e) {}
      speaking = false;
    } else if (speaking && queue.length) {                     // משפט רגיל מחליף משפטים שעוד ממתינים
      queue = [];
    }
    queue = queue.concat(items);
    if (!speaking) next();
  }

  /* splitLang — מפצל משפט לקטעי עברית וקטעי אנגלית (למשל "נכון! Apple זה תפוח") */
  function splitLang(text) {
    return String(text == null ? '' : text).split(/([A-Za-z][A-Za-z' \-]*[A-Za-z]|[A-Za-z])/)
      .filter(s => s && s.trim()).map(s => ({ text: s, lang: /[A-Za-z]/.test(s) ? 'en-US' : 'he-IL' }));
  }

  return {
    clean: clean,
    splitLang: splitLang,
    /* להגדרות הקול (shared/voice-settings.js) */
    voices() { pick(); return voices.slice(); },
    current() { return { he: he && he.name, en: en && en.name, rate: prefs().rate || 1 }; },
    setPref(k, v) { const p = prefs(); p[k] = v; savePrefs(p); pick(); },
    read: read,
    /* say — משפט בעברית; מילים באנגלית בתוכו מוקראות אוטומטית בקול אנגלי (פיצול לפי שפה) */
    say(text, opts) { read(splitLang(text), opts); },
    praise() { const p = ['כל הכבוד!', 'מעולה!', 'יופי אלה!', 'וואו!', 'איזה יופי!', 'כל הכבוד אלה!']; this.say(p[(Math.random() * p.length) | 0]); },
    silence() { queue = []; clearTimeout(watchdog); speaking = false; if (ok) { try { window.speechSynthesis.cancel(); } catch (e) {} } }
  };
})();

/* חשיפה גלובלית: const בראש קובץ לא יוצר window.Sound / window.Voice — ודפים שבודקים
   "if (window.Voice)" (האקדמיה, מערכת הפרסים, הטיסה) היו שותקים. כך כולם מוצאים אותם. */
window.Sound = Sound; window.Music = Music; window.Voice = Voice;
