/* =====================================================================
   js/dragon-care.js — המטבח של הדרקון 🍳 ומרפאת הווטרינר 🩺
   ---------------------------------------------------------------------
   פרק 0 — עוזרים: הקראה (עברית/אנגלית ברצף), צלילים, בניית אלמנטים, עיצוב (CSS מוזרק)
   פרק 1 — ספר המתכונים: 8 מתכונים; מתכון נפתח כשמבשלים את הקודם; בישול עולה 🍎 אחד
   פרק 2 — בישול: (א) מה צריך  (ב) מזווה — שומעים מילה באנגלית ומוצאים את המצרך
           (ג) ערבוב — מסובבים את האצבע בסיר  (ד) על האש  (ה) הגשה — הדרקון אוכל, גדל ומאושר
   פרק 3 — מרפאה: ד״ר ינשוף 🦉. בודקים או מטפלים (הצטננות / מכה / שן / בטן):
           בכל צעד שומעים את שם הכלי באנגלית, בוחרים אותו מהמגש, ונוגעים/משפשפים את הדרקון
   פרק 4 — סיום ביקור: הדרקון בריא, מדבקת אומץ 🏅, מונה ביקורים
   API: DragonCare.cook({ onDone(growth) }) · DragonCare.vet({ onDone() })
   תלויות: CareData (js/care-data.js), Pet (shared/pet.js), Voice/Sound (js/audio.js), HeroRewards (confetti)
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- פרק 0 — עוזרים ---------- */
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const snd = n => { try { Sound[n](); } catch (e) {} };
  const readP = parts => { try { Voice.read(parts, { interrupt: true }); } catch (e) {} };
  const he = t => ({ text: t, lang: 'he-IL' }), en = (t, slow) => ({ text: t, lang: 'en-US', slow: !!slow });
  const confetti = () => { try { HeroRewards.confetti(); } catch (e) {} };
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const name = () => (Pet.state.name || 'הדרקון');
  const D = () => window.CareData;
  /* float — אימוג'י שעף למעלה ונעלם מעל אלמנט */
  function float(host, t, x, y) { const f = el('span', 'kc-float', t); f.style.left = (x == null ? 50 : x) + '%'; f.style.top = (y == null ? 40 : y) + '%'; host.appendChild(f); setTimeout(() => f.remove(), 1200); }
  /* rubber — מודד "שפשוף" (תנועת אצבע) על אלמנט; קורא ל-onProg(0..100) ובסוף ל-onDone */
  function rubber(host, onProg, onDone, speed) {
    let prog = 0, last = null, ended = false;
    const h = e => {
      if (e.type === 'pointermove' && !(e.buttons || e.pointerType === 'touch')) return;
      const r = host.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      const d = last ? Math.hypot(x - last[0], y - last[1]) : 20; last = [x, y];
      if (d < 5 || ended) return;
      prog = Math.min(100, prog + Math.min(5, d / (speed || 12)));
      onProg(prog, x, y);
      if (prog >= 100) { ended = true; stop(); onDone(); }
    };
    const stop = () => { host.removeEventListener('pointerdown', h); host.removeEventListener('pointermove', h); };
    host.addEventListener('pointerdown', h); host.addEventListener('pointermove', h);
    return stop;
  }
  /* overlay — חלון מלא עם כותרת וכפתור ✖ */
  function overlay(title, cls) {
    const ov = el('div', 'kc-ov'), card = el('div', 'kc-card ' + (cls || ''));
    card.innerHTML = '<button type="button" class="kc-x" aria-label="סגירה">✖</button><h2 class="kc-title">' + title + '</h2><div class="kc-body"></div>';
    ov.appendChild(card); document.body.appendChild(ov);
    return { ov, card, body: $('.kc-body', card), close: () => { try { Voice.silence(); } catch (e) {} ov.remove(); } };
  }
  const style = el('style');
  style.textContent =
    '.kc-ov{position:fixed;inset:0;z-index:70;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;display:grid;place-items:center;padding:14px;background:rgba(8,16,40,.72)}' +
    '.kc-card{position:relative;width:min(96vw,1100px);height:min(92vh,760px);display:grid;grid-template-rows:auto 1fr;padding:16px 20px;border:5px solid var(--h-ink);border-radius:30px;background:#fffaf0;box-shadow:0 8px 0 var(--h-ink);color:var(--h-ink);overflow:hidden}' +
    '.kc-card.vet{background:linear-gradient(180deg,#eafcff,#d4f4ff)}.kc-card.kitchen{background:linear-gradient(180deg,#fff8e6,#ffe9c4)}' +
    '.kc-x{position:absolute;top:12px;right:12px;z-index:5;width:52px;height:52px;border:4px solid var(--h-ink);border-radius:50%;background:var(--h-magenta);color:#fff;font:900 22px var(--h-font);cursor:pointer;box-shadow:0 4px 0 var(--h-ink)}' +
    '.kc-title{font:900 clamp(24px,3vw,36px)/1.1 var(--h-font);text-align:center;margin-bottom:8px}' +
    '.kc-body{position:relative;min-height:0;overflow:auto;padding:6px 8px 10px}' +
    '.kc-float{position:absolute;z-index:9;font-size:40px;pointer-events:none;transform:translate(-50%,-50%);animation:kcUp 1.2s ease-out forwards}' +
    '@keyframes kcUp{to{transform:translate(-50%,-150px) scale(1.4);opacity:0}}' +
    '.kc-ins{margin:0 auto 10px;max-width:92%;padding:10px 16px;border:4px solid var(--h-ink);border-radius:20px;background:#fff;font:900 clamp(18px,2.2vw,26px)/1.3 var(--h-font);text-align:center;box-shadow:0 4px 0 var(--h-ink)}' +
    '.kc-ins .e{direction:ltr;unicode-bidi:isolate;display:inline-block;padding:0 8px;border-radius:10px;background:#ffd95a;font-family:Rubik,sans-serif}' +
    /* ספר המתכונים */
    '.kc-book{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}' +
    '.kc-rec{position:relative;display:grid;justify-items:center;gap:2px;padding:12px 6px;border:4px solid var(--h-ink);border-radius:22px;background:#fff;box-shadow:0 5px 0 var(--h-ink);cursor:pointer;font-family:var(--h-font);color:var(--h-ink);transition:transform .15s var(--h-spring)}' +
    '.kc-rec:hover{transform:translateY(-3px)}.kc-rec .ri{font-size:62px;line-height:1.1}.kc-rec b{font-size:20px}.kc-rec i{font:800 15px Rubik,sans-serif;color:#1b3c8f;font-style:normal}' +
    '.kc-rec .ing{font-size:24px;letter-spacing:2px}.kc-rec .star{position:absolute;top:6px;left:8px;font-size:22px}.kc-rec.lock{opacity:.5;cursor:default;filter:grayscale(.8)}.kc-rec.new{box-shadow:0 0 0 5px #ffd95a,0 5px 0 var(--h-ink);animation:kcPulse 1.3s ease-in-out infinite}' +
    '@keyframes kcPulse{50%{transform:scale(1.04)}}' +
    '.kc-note{margin-top:12px;text-align:center;font-weight:800;color:#6a5d87}' +
    /* בישול */
    '.kc-cook{display:grid;grid-template-columns:1fr 1.15fr;gap:16px;align-items:center;height:calc(100% - 70px)}' +
    '.kc-potwrap{position:relative;display:grid;place-items:center;height:100%;min-height:300px;touch-action:none}' +
    '.kc-pot{position:relative;width:min(100%,380px);aspect-ratio:1.35;border:6px solid var(--h-ink);border-radius:30px 30px 150px 150px;background:linear-gradient(180deg,#9aa8c7,#5d6b8f);box-shadow:0 8px 0 var(--h-ink);display:grid;place-items:center}' +
    '.kc-pot::before,.kc-pot::after{content:"";position:absolute;top:22%;width:34px;height:22px;border:6px solid var(--h-ink);border-radius:14px;background:#5d6b8f}.kc-pot::before{right:-40px}.kc-pot::after{left:-40px}' +
    '.kc-slots{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;padding:10px}' +
    '.kc-slot{min-width:84px;padding:6px 8px;border:4px dashed #fff;border-radius:16px;background:rgba(255,255,255,.18);color:#fff;font:900 18px Rubik,sans-serif;text-align:center}' +
    '.kc-slot.f{border-style:solid;background:#fff;color:var(--h-ink)}.kc-slot .p{display:block;font-size:40px;line-height:1.1}' +
    '.kc-fire{position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);font-size:54px;letter-spacing:-8px;animation:kcFire .4s ease-in-out infinite alternate;pointer-events:none}' +
    '@keyframes kcFire{to{transform:translateX(-50%) scale(1.1,1.2)}}' +
    '.kc-spoon{position:absolute;z-index:6;font-size:56px;pointer-events:none;transform:translate(-50%,-70%) rotate(-30deg)}' +
    '.kc-pantry{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}' +
    '.kc-tile{aspect-ratio:1;border:4px solid var(--h-ink);border-radius:22px;background:#fff;box-shadow:0 5px 0 var(--h-ink);font-size:clamp(40px,5vw,60px);cursor:pointer;transition:transform .15s var(--h-spring)}' +
    '.kc-tile:active{transform:translateY(3px)}.kc-tile.used{visibility:hidden}.kc-tile.no{animation:kcShake .45s}.kc-tile.ok{background:#b6ffdc}' +
    '@keyframes kcShake{25%{transform:translateX(-10px) rotate(-6deg)}75%{transform:translateX(10px) rotate(6deg)}}' +
    '.kc-bar{position:relative;height:30px;margin:10px auto 0;width:80%;border:4px solid var(--h-ink);border-radius:999px;background:#fff;overflow:hidden}.kc-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#ffd95a,#ff9f1c);transition:width .15s}' +
    '.kc-serve{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:center;justify-items:center;height:calc(100% - 20px)}' +
    '.kc-dish{font-size:min(28vh,200px);line-height:1;animation:kcPulse 1.2s ease-in-out infinite}.kc-drg{width:min(44vh,330px)}.kc-drg svg{width:100%;height:auto}' +
    '.kc-row{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:12px}' +
    /* מרפאה */
    '.kc-vet{display:grid;grid-template-columns:1.1fr 1fr;gap:16px;height:calc(100% - 10px)}' +
    '.kc-exam{position:relative;display:grid;place-items:end center;border:4px solid var(--h-ink);border-radius:26px;background:radial-gradient(circle at 50% 30%,#fff,#bfefff);overflow:hidden;touch-action:none;min-height:320px}' +
    '.kc-exam::after{content:"";position:absolute;left:8%;right:8%;bottom:0;height:16%;border:4px solid var(--h-ink);border-bottom:0;border-radius:20px 20px 0 0;background:#fff}' +
    '.kc-exam .vd{position:relative;z-index:2;width:min(70%,330px);margin-bottom:8%;cursor:pointer}.kc-exam .vd svg{width:100%;height:auto;display:block}' +
    '.kc-exam .vd.target{filter:drop-shadow(0 0 16px #ffd95a)}' +
    '.kc-owl{display:flex;gap:10px;align-items:center}.kc-owl .o{font-size:70px;animation:kcPulse 2s ease-in-out infinite}' +
    '.kc-talk{flex:1;padding:10px 14px;border:4px solid var(--h-ink);border-radius:20px;background:#fff;font:900 clamp(17px,2vw,23px)/1.3 var(--h-font);box-shadow:0 4px 0 var(--h-ink)}' +
    '.kc-pips{display:flex;gap:8px;justify-content:center;margin:10px 0}.kc-pips i{width:22px;height:22px;border:3px solid var(--h-ink);border-radius:50%;background:#fff}.kc-pips i.d{background:#3ff2b0}.kc-pips i.c{background:#ffd95a;animation:kcPulse 1s infinite}' +
    '.kc-tray{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:8px}' +
    '.kc-tool{display:grid;justify-items:center;padding:8px 4px;border:4px solid var(--h-ink);border-radius:20px;background:#fff;box-shadow:0 5px 0 var(--h-ink);cursor:pointer;font-family:var(--h-font);color:var(--h-ink)}' +
    '.kc-tool b{font-size:44px;line-height:1.1}.kc-tool i{font:800 14px Rubik,sans-serif;color:#1b3c8f;font-style:normal}.kc-tool.no{animation:kcShake .45s}.kc-tool.on{background:#b6ffdc;box-shadow:0 0 0 4px #3ff2b0,0 5px 0 var(--h-ink)}' +
    '.kc-held{position:absolute;top:10px;right:10px;z-index:6;padding:6px 12px;border:4px solid var(--h-ink);border-radius:999px;background:#fff3c4;font:900 18px var(--h-font)}' +
    '.kc-thermo{position:absolute;top:14%;left:10%;z-index:6;padding:8px 14px;border:4px solid var(--h-ink);border-radius:16px;background:#fff;font:900 34px Rubik,sans-serif;color:#ff5a6e}' +
    '.kc-plaster{position:absolute;z-index:5;font-size:44px;pointer-events:none}.kc-blanket{position:absolute;z-index:4;left:18%;right:18%;bottom:14%;height:26%;border:4px solid var(--h-ink);border-radius:30px 30px 10px 10px;background:repeating-linear-gradient(45deg,#8fe9ff 0 16px,#b6f2ff 16px 32px);animation:kcIn .5s ease}' +
    '@keyframes kcIn{from{transform:translateY(40px);opacity:0}}' +
    '.kc-medal{font-size:120px;line-height:1;animation:kcPulse 1.2s ease-in-out infinite}' +
    '@media (max-width:820px){.kc-cook,.kc-vet,.kc-serve{grid-template-columns:1fr;height:auto}.kc-book{grid-template-columns:repeat(2,1fr)}}';
  document.head.appendChild(style);

  /* ---------- פרק 1 — ספר המתכונים ---------- */
  const cooked = id => (Pet.state.cook || {})[id] || 0;
  const unlocked = i => i < 2 || cooked(D().RECIPES[i - 1].id) > 0;
  function cook(opts) {
    opts = opts || {};
    const W = overlay('🍳 המטבח של ' + name(), 'kitchen');
    $('.kc-x', W.card).onclick = () => { W.close(); if (opts.onDone) opts.onDone(null); };
    book(W, opts);
    readP([en("Let's cook!"), he('בואו נבשל ל' + name() + '! בוחרים מתכון.')]);
  }
  function book(W, opts) {
    const R = D().RECIPES, ING = D().ING;
    W.body.innerHTML = '<div class="kc-book">' + R.map((r, i) => {
      const open = unlocked(i), n = cooked(r.id);
      return '<button type="button" class="kc-rec' + (open ? '' : ' lock') + (open && !n ? ' new' : '') + '" data-i="' + i + '"' + (open ? '' : ' disabled') + '>' +
        (n ? '<span class="star">⭐</span>' : '') + '<span class="ri">' + (open ? r.ico : '🔒') + '</span><b>' + (open ? r.he : 'מתכון סודי') + '</b><i dir="ltr">' + (open ? r.en : '???') + '</i>' +
        '<span class="ing">' + (open ? r.ing.map(k => ING[k][0]).join('') : '') + '</span></button>';
    }).join('') + '</div><p class="kc-note">בישול עולה 🍎 אחד (יש לך ' + (Pet.state.food || 0) + ') · מתכון חדש נפתח כשמבשלים את הקודם · כל מנה מגדלת את ' + name() + '!</p>';
    $$('.kc-rec', W.body).forEach(b => b.onclick = () => {
      if (b.disabled) return;
      if (!(Pet.state.food > 0)) { snd('sad'); readP([he('צריך תפוח אחד כדי לבשל. עונים על שאלות באקדמיה ומקבלים תפוחים!')]); return; }
      Pet.state.food--; Pet.save();
      snd('bubble'); recipe(W, R[+b.dataset.i], opts);
    });
  }

  /* ---------- פרק 2 — בישול ---------- */
  function recipe(W, r, opts) {
    const ING = D().ING, need = r.ing.slice(), got = [];
    /* מזווה: המצרכים של המתכון + 3–4 מסיחים (לפעמים פריט מצחיק) */
    const others = shuffle(Object.keys(ING).filter(k => need.indexOf(k) < 0 && !ING[k][3])).slice(0, 8 - need.length - 1);
    const funny = Math.random() < .7 ? [Math.random() < .5 ? 'sock' : 'shoe'] : [shuffle(Object.keys(ING).filter(k => need.indexOf(k) < 0 && others.indexOf(k) < 0 && !ING[k][3]))[0]];
    const pantry = shuffle(need.concat(others, funny));
    W.body.innerHTML = '<div class="kc-ins" id="kIns"></div><div class="kc-cook"><div class="kc-potwrap" id="kPotW"><div class="kc-pot" id="kPot"><div class="kc-slots">' +
      need.map(k => '<span class="kc-slot" data-k="' + k + '" dir="ltr">' + ING[k][1] + '</span>').join('') + '</div></div></div>' +
      '<div class="kc-pantry">' + pantry.map(k => '<button type="button" class="kc-tile" data-k="' + k + '" aria-label="' + ING[k][1] + '">' + ING[k][0] + '</button>').join('') + '</div></div>';
    const ins = $('#kIns', W.body), nextNeed = () => need.find(k => got.indexOf(k) < 0);
    readP([en(r.en), he(r.he + '! צריך:')].concat(need.map(k => en(ING[k][1]))).concat([he('מצאו את'), en(ING[need[0]][1])]));
    ins.innerHTML = r.ico + ' ' + r.he + ' — מצאו את <span class="e">' + ING[need[0]][1] + '</span> 🔎';
    $$('.kc-tile', W.body).forEach(t => t.onclick = () => {
      const k = t.dataset.k, it = ING[k];
      if (need.indexOf(k) >= 0 && got.indexOf(k) < 0) {           /* נכון: עף לסיר */
        got.push(k); t.classList.add('ok'); snd('pop'); setTimeout(() => t.classList.add('used'), 250);
        const sl = $('.kc-slot[data-k="' + k + '"]', W.body); sl.classList.add('f'); sl.innerHTML = '<span class="p">' + it[0] + '</span>' + it[1];
        float($('#kPotW', W.body), it[0]);
        if (got.length === need.length) { readP([en(it[1]), he('יש את הכול!')]); setTimeout(() => stir(W, r, opts), 900); }
        else { const n = nextNeed(); readP([en(it[1]), he(it[2] + '. יופי! עכשיו מצאו את'), en(ING[n][1])]); ins.innerHTML = r.ico + ' ' + r.he + ' — מצאו את <span class="e">' + ING[n][1] + '</span> 🔎'; }
      } else {                                                     /* לא במתכון (או כבר בסיר) */
        t.classList.remove('no'); void t.offsetWidth; t.classList.add('no'); snd('sad');
        const n = nextNeed();
        if (it[3]) readP([he(it[2] + '?! איכס! לא מבשלים ' + (k === 'sock' ? 'גרביים' : 'נעליים') + '!'), en(it[1]), he('אנחנו מחפשים'), en(ING[n][1])]);
        else readP([he('זה'), en(it[1]), he(it[2] + '. זה לא במתכון. אנחנו מחפשים'), en(ING[n][1])]);
      }
    });
  }
  /* (ג) ערבוב — מסובבים את האצבע בסיר, הכף עוקבת אחרי האצבע */
  function stir(W, r, opts) {
    const wrap = $('#kPotW', W.body), ins = $('#kIns', W.body);
    ins.innerHTML = '🥄 ערבבו! סובבו את האצבע בתוך הסיר <span class="e">mix</span>';
    readP([en('mix'), he('לערבב! סובבו את האצבע בתוך הסיר.')]);
    const bar = el('div', 'kc-bar', '<i></i>'), spoon = el('span', 'kc-spoon', '🥄');
    wrap.appendChild(spoon); wrap.after(bar); $('.kc-pantry', W.body).style.opacity = '.35';
    rubber(wrap, (p, x, y) => { $('i', bar).style.width = p + '%'; spoon.style.left = x + 'px'; spoon.style.top = y + 'px'; if (Math.random() < .3) float(wrap, Math.random() < .5 ? '🫧' : '✨', x / wrap.clientWidth * 100, y / wrap.clientHeight * 100); if (Math.random() < .12) snd('bubble'); },
      () => { spoon.remove(); snd('ding'); if (r.oven) fire(W, r, opts, bar); else serve(W, r, opts); }, 14);
  }
  /* (ד) על האש — 3 שניות של אש מתחת לסיר */
  function fire(W, r, opts, bar) {
    const ins = $('#kIns', W.body), pot = $('#kPot', W.body);
    ins.innerHTML = '🔥 מבשלים על האש... <span class="e">cook</span>';
    readP([en('cook'), he('לבשל! מחכים שהאוכל יהיה מוכן.')]);
    const f = el('div', 'kc-fire', '🔥🔥🔥'); pot.appendChild(f);
    $('i', bar).style.width = '0'; $('i', bar).style.background = 'linear-gradient(90deg,#ff9f1c,#ff5a6e)';
    const t0 = performance.now(), T = setInterval(() => { const p = Math.min(1, (performance.now() - t0) / 3000); $('i', bar).style.width = p * 100 + '%'; if (Math.random() < .4) float(pot, '💨', 30 + Math.random() * 40, 10); if (p >= 1) { clearInterval(T); snd('ding'); serve(W, r, opts); } }, 150);
  }
  /* (ה) הגשה — המנה, הדרקון אוכל, גדילה + שובע + כיף; מתכון חדש נפתח */
  function serve(W, r, opts) {
    const R = D().RECIPES, idx = R.indexOf(r), first = !cooked(r.id);
    Pet.state.cook[r.id] = cooked(r.id) + 1; Pet.save();
    const g = Pet.grow(3); Pet.addNeed('food', 40); Pet.addNeed('fun', 10); Pet.markCare();
    try { if (window.Progress) Progress.track('pet:cook'); } catch (e) {}
    const nextOpen = first && R[idx + 1] ? R[idx + 1] : null;
    W.body.innerHTML = '<div class="kc-ins">מוכן! ' + r.ico + ' ' + r.he + ' · <span class="e">' + r.en + '</span></div><div class="kc-serve"><div class="kc-dish">' + r.ico + '</div><div class="kc-drg">' + Pet.svg({ face: 'eat' }) + '</div></div>' +
      (nextOpen ? '<div class="kc-ins">⭐ מתכון חדש נפתח: ' + nextOpen.ico + ' ' + nextOpen.he + '!</div>' : '') +
      '<div class="kc-row"><button type="button" class="h-btn gold" id="kMore">📖 עוד מתכון</button><button type="button" class="h-btn violet" id="kDone">✓ סיום</button></div>';
    confetti(); snd('happy');
    setTimeout(() => { const d = $('.kc-drg', W.body); if (d) d.innerHTML = Pet.svg({ face: 'love' }); }, 1600);
    readP([he('מוכן!'), en(r.en), he('בעברית: ' + r.he + '.'), en(r.en, true), he('יאמי! ' + name() + ' אוהב את זה!')].concat(nextOpen ? [he('מתכון חדש נפתח: ' + nextOpen.he + '!')] : []));
    $('#kMore', W.body).onclick = () => { if (g.to > g.from) { W.close(); if (opts.onDone) opts.onDone(g); return; } book(W, opts); };
    $('#kDone', W.body).onclick = () => { W.close(); if (opts.onDone) opts.onDone(g); };
  }

  /* ---------- פרק 3 — מרפאת הווטרינר ---------- */
  function vet(opts) {
    opts = opts || {};
    const P = Pet.state, sick = P.sick && P.sick.k, proc = D().PROCS[sick || 'checkup'], TOOLS = D().TOOLS;
    const W = overlay('🩺 המרפאה של ד״ר ינשוף', 'vet');
    $('.kc-x', W.card).onclick = () => { W.close(); if (opts.onDone) opts.onDone(); };
    const toolKeys = proc.steps.map(s => s.t), extra = shuffle(Object.keys(TOOLS).filter(k => toolKeys.indexOf(k) < 0)).slice(0, 6 - new Set(toolKeys).size);
    const tray = shuffle(Array.from(new Set(toolKeys)).concat(extra));
    const intro = sick ? 'שלום! אני ד״ר ינשוף. ' + name() + ' לא מרגיש טוב — ' + proc.he + '. בואי נטפל בו יחד!' : 'שלום! אני ד״ר ינשוף. בדיקה שגרתית — נבדוק ש' + name() + ' בריא וחזק!';
    W.body.innerHTML = '<div class="kc-vet"><div class="kc-exam" id="vEx"><div class="vd" id="vD">' + Pet.svg() + '</div></div>' +
      '<div><div class="kc-owl"><span class="o">🦉</span><div class="kc-talk" id="vTalk">' + intro + '</div></div>' +
      '<div class="kc-pips">' + proc.steps.map(() => '<i></i>').join('') + '</div>' +
      '<div class="kc-ins" id="vIns"></div><div class="kc-tray">' + tray.map(k => '<button type="button" class="kc-tool" data-t="' + k + '"><b>' + TOOLS[k][0] + '</b><i dir="ltr">' + TOOLS[k][1] + '</i></button>').join('') + '</div></div></div>';
    const ex = $('#vEx', W.body), dr = $('#vD', W.body), ins = $('#vIns', W.body), talk = $('#vTalk', W.body), pips = $$('.kc-pips i', W.body);
    let i = 0, holding = null, stopRub = null;
    const toolEn = k => TOOLS[k][1];
    function step() {
      pips.forEach((p, k) => p.className = k < i ? 'd' : k === i ? 'c' : '');
      if (i >= proc.steps.length) return finish();
      const s = proc.steps[i]; holding = null; dr.classList.remove('target');
      $$('.kc-tool', W.body).forEach(b => b.classList.remove('on'));
      ins.innerHTML = (i + 1) + '. ' + s.he + ' — איפה ה<span class="e">' + toolEn(s.t) + '</span>?';
      readP([he(s.he + '. איפה ה'), en(toolEn(s.t)), he('?')]);
    }
    $$('.kc-tool', W.body).forEach(b => b.onclick = () => {
      if (i >= proc.steps.length || holding) return;
      const s = proc.steps[i], k = b.dataset.t;
      if (k !== s.t) { b.classList.remove('no'); void b.offsetWidth; b.classList.add('no'); snd('sad'); readP([he('זה'), en(toolEn(k)), he(TOOLS[k][2] + '. אנחנו צריכים'), en(toolEn(s.t))]); return; }
      holding = k; b.classList.add('on'); snd('pop'); dr.classList.add('target');
      ins.innerHTML = TOOLS[k][0] + ' ' + (s.a === 'rub' ? 'שפשפו את הדרקון בעדינות!' : 'געו בדרקון!');
      readP([en(toolEn(k)), he(s.a === 'rub' ? 'שפשפו בעדינות.' : 'עכשיו געו בדרקון.')]);
      if (s.a === 'rub') {
        const bar = el('div', 'kc-bar', '<i></i>'); bar.style.cssText = 'position:absolute;bottom:18px;left:10%;width:80%;z-index:7;margin:0'; ex.appendChild(bar);
        stopRub = rubber(ex, (p, x, y) => { $('i', bar).style.width = p + '%'; if (Math.random() < .35) float(ex, Math.random() < .5 ? TOOLS[k][0] : '✨', x / ex.clientWidth * 100, y / ex.clientHeight * 100); }, () => { bar.remove(); act(s); }, 10);
      }
    });
    dr.onclick = () => { if (!holding) { dr.innerHTML = Pet.svg({ face: 'love' }); float(ex, '💗'); setTimeout(() => { dr.innerHTML = Pet.svg(); }, 900); return; } const s = proc.steps[i]; if (s.a === 'tap') act(s); };
    /* act — מה שהכלי עושה (אפקט + משפט), ואז לצעד הבא */
    function act(s) {
      holding = 'busy'; dr.classList.remove('target'); snd('ding');
      if (s.fx === 'heart') { for (let k = 0; k < 4; k++) setTimeout(() => { float(ex, '❤️', 50, 45); snd('pop'); }, k * 320); }
      if (s.fx === 'temp') { const t = el('div', 'kc-thermo', '🌡️ 35°'); ex.appendChild(t); let v = 35; const T = setInterval(() => { v++; t.textContent = '🌡️ ' + v + '°'; if (v >= s.temp) { clearInterval(T); t.style.color = v > 37 ? '#ff5a6e' : '#10a36a'; setTimeout(() => t.remove(), 1800); } }, 300); }
      if (s.fx === 'spoon') { float(ex, TOOLS[s.t][0], 50, 55); dr.innerHTML = Pet.svg({ face: 'eat' }); }
      if (s.fx === 'plaster') { const pl = el('span', 'kc-plaster', '🩹'); pl.style.left = '56%'; pl.style.top = '22%'; ex.appendChild(pl); }
      if (s.fx === 'blanket') ex.appendChild(el('div', 'kc-blanket'));
      if (s.fx === 'tall') { const t = el('div', 'kc-thermo', '📏 ' + (30 + Pet.stage() * 9) + ' ס״מ'); t.style.color = '#1b3c8f'; ex.appendChild(t); setTimeout(() => t.remove(), 2200); }
      if (s.fx === 'sparkle') { float(ex, '✨', 40, 40); float(ex, '✨', 60, 50); }
      talk.textContent = '🦉 ' + s.sayHe;
      readP((s.say ? [en(s.say)] : []).concat([he(s.sayHe)]));
      /* אחרי כל צעד הסימנים הולכים ונעלמים — בסוף הדרקון בריא */
      setTimeout(() => { if (s.fx !== 'spoon') dr.innerHTML = Pet.svg({ face: i >= proc.steps.length - 1 ? 'love' : undefined }); i++; step(); }, 2100);
    }
    /* ---------- פרק 4 — סיום ביקור ---------- */
    function finish() {
      if (stopRub) stopRub();
      Pet.heal(); Pet.addNeed('fun', 10); Pet.markCare();
      try { if (window.Progress) Progress.track('pet:vet'); } catch (e) {}
      confetti(); snd('happy');
      W.body.innerHTML = '<div class="kc-serve"><div style="text-align:center"><div class="kc-medal">🏅</div><h2 style="font:900 clamp(26px,3vw,38px) var(--h-font)">מדבקת אומץ!</h2>' +
        '<p style="font:800 20px var(--h-font)">' + name() + ' בריא ושמח! <span dir="ltr" style="font-family:Rubik">healthy</span> = בריא<br>ביקורים אצל ד״ר ינשוף: ' + Pet.state.vet + '</p>' +
        '<button type="button" class="h-btn gold" id="vDone">✓ תודה, ד״ר ינשוף!</button></div><div class="kc-drg">' + Pet.svg({ face: 'love', sick: null }) + '</div></div>';
      readP([en('Good job, doctor!'), he(name() + ' בריא!'), en('healthy'), he('בעברית: בריא. קיבלת מדבקת אומץ!')]);
      $('#vDone', W.body).onclick = () => { W.close(); if (opts.onDone) opts.onDone(); };
    }
    readP([he(intro)]);
    setTimeout(step, 2600);
  }

  window.DragonCare = { cook, vet };
})();
