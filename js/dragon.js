/* =====================================================================
   js/dragon.js — מאורת הדרקון
   ---------------------------------------------------------------------
   פרק 1 — שמירה (ella-dragon-v1): כוכבים לכל סט משימה, משחקים שנפתחו, מגבלת תפוחים יומית ממשחקים
   פרק 2 — לשונית "הדרקון שלי": הדרקון הגדול, שם ושלב, מד גדילה, מסלול 12 השלבים, האכלה ותעלול
   פרק 3 — לשונית "משימות דרקון": מסלול אנגלית (13 סטים) + מסלול חשבון (7 סטים); כל סט נפתח אחרי הקודם
   פרק 4 — נגן השאלות: 8 שאלות, ציורים גדולים, 🔊 הגייה רגילה ו-🐢 איטית, הסבר אחרי כל תשובה
   פרק 5 — סיום סט: כוכבים → תפוחים עפים לדרקון → טקס גדילה (אם עלה שלב) → מתנת משחק חדשה
   פרק 6 — משחקים עם הדרקון: כדור, בועות מילים (אנגלית!), תופסים תפוחים, טבעות בשמיים, דגדוגים
   פרס סט: 8 תפוחים + 2 לכל כוכב (פעם ראשונה), חצי בחזרה על סט — כך כל סט ראשון ≈ שלב גדילה.
   תלויות: Pet (shared/pet.js), DragonData (js/dragon-data.js), Voice/Sound (js/audio.js), HeroRewards (confetti)
   ===================================================================== */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const snd = n => { try { Sound[n](); } catch (e) {} };
  const say = (t, o) => { try { Voice.say(t, Object.assign({ interrupt: true }, o || {})); } catch (e) {} };
  const sayEn = (t, slow) => { try { Voice.en(t, { slow: slow }); } catch (e) {} };
  const confetti = () => { try { HeroRewards.confetti(); } catch (e) {} };
  const nm = t => window.Profile ? Profile.fix(t) : t;

  /* ---------- פרק 1 — שמירה ---------- */
  const KEY = 'ella-dragon-v1';
  const D = (() => { try { return Object.assign({ done: {}, toys: {}, cap: { day: '', n: 0 } }, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { return { done: {}, toys: {}, cap: { day: '', n: 0 } }; } })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) {} };
  const P = () => Pet.state;
  const dname = () => P().name || 'הדרקון';

  /* משחקי מתנה: נפתחים לפי שלב הגדילה */
  const TOYS = [
    { id: 'tickle', ico: '🪶', name: 'דגדוגים', at: 1, what: 'נוגעים בדרקון והוא צוחק' },
    { id: 'ball', ico: '🎾', name: 'זורקים כדור', at: 2, what: 'מקישים — והדרקון תופס' },
    { id: 'bubbles', ico: '🫧', name: 'בועות מילים', at: 3, what: 'שומעים מילה באנגלית ומפוצצים את הבועה הנכונה' },
    { id: 'apples', ico: '🍎', name: 'תופסים תפוחים', at: 5, what: 'גוררים את הדרקון ותופסים תפוחים' },
    { id: 'rings', ico: '🌟', name: 'טבעות בשמיים', at: 8, what: 'מקישים כדי לעוף דרך הטבעות' }
  ];
  const toyOpen = t => Pet.stage() >= t.at;

  function refreshChips() {
    $('#apples').textContent = '🍎 ' + (P().food || 0);
    $('#stageChip').textContent = '⭐ שלב ' + (Pet.stage() + 1) + '/12';
  }

  /* ---------- לשוניות ---------- */
  $$('.tab').forEach(b => b.addEventListener('click', () => {
    $$('.tab').forEach(x => x.classList.toggle('on', x === b));
    $$('.pane').forEach(p => p.classList.toggle('on', p.id === 'pane-' + b.dataset.tab));
    snd('tap'); render(b.dataset.tab);
  }));
  function render(tab) { refreshChips(); if (tab === 'missions') renderMissions(); else if (tab === 'toys') renderToys(); else renderLair(); }

  /* ---------- פרק 2 — הדרקון שלי ---------- */
  function renderLair() {
    const pane = $('#pane-lair');
    if (!P().color) {
      pane.innerHTML = '<div style="text-align:center;padding:30px"><div style="font-size:120px">🥚</div><h2 style="font:900 34px var(--h-font)">עוד אין לך ביצת דרקון!</h2><p style="font-weight:800">בוחרים ביצה — והמשימות יגדלו אותה.</p><button type="button" class="h-btn gold" id="pickEgg">🥚 לבחור ביצה</button></div>';
      $('#pickEgg').onclick = () => { Pet.open(); const t = setInterval(() => { if (!document.querySelector('.pet-card')) { clearInterval(t); render('lair'); } }, 500); };
      return;
    }
    const st = Pet.stage(), nx = Pet.nextAt(), prev = Pet.STAGES[st][0];
    const pct = nx ? Math.round((P().xp - prev) / (nx - prev) * 100) : 100;
    pane.innerHTML = '<div class="lair"><div class="scene" id="scene"><div class="dragon bob" id="bigD">' + Pet.svg() + '</div></div>' +
      '<div class="info"><div><div class="dname">' + (st ? dname() : 'ביצה מסתורית') + '</div><div class="dstage">' + Pet.STAGES[st][1] + (nx ? ' · עוד ' + (nx - P().xp) + ' 🍎 לשלב "' + Pet.STAGES[st + 1][1] + '"' : ' · השלב הכי גבוה! 👑') + '</div></div>' +
      '<div class="meter"><i style="width:' + pct + '%"></i></div>' +
      '<div class="path">' + Pet.STAGES.map((s, i) => '<div class="st ' + (i < st ? 'done' : i === st ? 'cur' : 'lock') + '" title="' + s[1] + '">' + Pet.svg({ stage: i, face: 'happy' }) + '<b>' + (i + 1) + '</b></div>').join('') + '</div>' +
      '<div class="acts"><button type="button" class="h-btn gold" id="feed">🍎 להאכיל (' + (P().food || 0) + ')</button><button type="button" class="h-btn cyan" id="trick">' + (st >= 9 ? '🔥 יריקת אש' : st >= 8 ? '☁️ לעוף' : '⭐ תעלול') + '</button></div>' +
      '<button type="button" class="h-btn violet" id="goMission">🗺️ למשימת הדרקון הבאה</button></div></div>';
    const big = $('#bigD');
    big.onclick = () => { big.innerHTML = Pet.svg({ face: 'love' }); snd('sparkle'); floatAt(big, '💗'); setTimeout(() => { big.innerHTML = Pet.svg(); }, 1100); };
    $('#feed').onclick = () => {
      if (!(P().food > 0)) { snd('sad'); say('אין תפוחים! עונים על שאלות באקדמיה או במשימות הדרקון.'); return; }
      P().food--; const r = Pet.grow(1); Pet.save && Pet.save();
      try { if (window.Progress) Progress.track('pet:feed'); } catch (e) {}
      big.innerHTML = Pet.svg({ face: 'eat' }); snd('pop'); floatAt(big, '🍎'); jump(big);
      if (r.to > r.from) setTimeout(() => ceremony(r.from, r.to, () => render('lair')), 700); else setTimeout(() => render('lair'), 900);
    };
    $('#trick').onclick = () => { jump(big); snd('happy'); if (st >= 9) { big.innerHTML = Pet.svg({ face: 'fire' }); setTimeout(() => { big.innerHTML = Pet.svg(); }, 1200); } floatAt(big, st >= 9 ? '🔥' : '⭐'); say(st >= 9 ? dname() + ' יורק אש!' : dname() + ' עושה תעלול!'); };
    $('#goMission').onclick = () => $('.tab[data-tab="missions"]').click();
  }
  function jump(n) { n.classList.remove('bob', 'jump'); void n.offsetWidth; n.classList.add('jump'); setTimeout(() => { n.classList.remove('jump'); n.classList.add('bob'); }, 750); }
  function floatAt(n, t) {
    const r = n.getBoundingClientRect(), f = el('div', 'apple-fly', t);
    f.style.left = (r.left + r.width / 2) + 'px'; f.style.top = (r.top + r.height * .3) + 'px';
    document.body.appendChild(f);
    f.animate([{ transform: 'translate(-50%,0) scale(.6)', opacity: 1 }, { transform: 'translate(-50%,-140px) scale(1.4)', opacity: 0 }], { duration: 1200, easing: 'ease-out' }).onfinish = () => f.remove();
  }

  /* ---------- פרק 3 — מפת המשימות ---------- */
  function renderMissions() {
    const pane = $('#pane-missions');
    const track = (id, title, sub, color) => {
      const sets = DragonData.TRACKS[id];
      let nextFound = false;
      return '<div class="track" style="--tc:' + color + '"><h2>' + title + ' <small>' + sub + '</small></h2><div class="nodes">' + sets.map((s, i) => {
        const stars = D.done[s.id] || 0, open = i === 0 || D.done[sets[i - 1].id] != null, isNext = open && stars === 0 && !nextFound;
        if (isNext) nextFound = true;
        return '<button type="button" class="node' + (!open ? ' lock' : isNext ? ' next' : '') + '" data-set="' + s.id + '"' + (!open ? ' disabled' : '') + '><span class="num">' + (i + 1) + '</span><div class="ic">' + s.icon + '</div><b>' + s.name + '</b>' +
          '<div class="stars">' + [0, 1, 2].map(k => '<span class="' + (k < stars ? 'on' : '') + '">★</span>').join('') + '</div><small>' + (open ? (stars ? 'שוב: +' + Math.round(reward(3) / 2) + ' 🍎' : '8 שאלות · +' + reward(3) + ' 🍎') : '🔒 נפתח אחרי הקודם') + '</small></button>';
      }).join('') + '</div></div>';
    };
    pane.innerHTML = track('en', '🇬🇧 מסלול האנגלית', '— שומעים, רואים ולומדים מילים חדשות', '#29c5ff') + track('math', '🔢 מסלול החשבון', '— אתגרים לגיבורי מספרים', '#3ff2b0');
    $$('.node[data-set]', pane).forEach(b => b.addEventListener('click', () => { if (!b.disabled) startSet(b.dataset.set); }));
  }
  const reward = stars => 8 + stars * 2;

  /* ---------- פרק 4 — נגן השאלות ---------- */
  function startSet(setId) {
    const meta = DragonData.TRACKS[setId.split(':')[0]].find(s => s.id === setId);
    const qs = DragonData.build(setId);
    const res = [];
    let i = 0, mistakes = 0;
    const ov = el('div', 'ov'), box = el('div', 'play');
    ov.appendChild(box); document.body.appendChild(ov);
    snd('bubble');
    box.innerHTML = '<div class="ph"><button type="button" class="x">✖</button><h3>' + meta.icon + ' ' + meta.name + '</h3><div class="pips">' + qs.map(() => '<i></i>').join('') + '</div></div><div class="qbox" id="qbox"></div><div></div>';
    $('.x', box).onclick = () => { Voice.silence(); ov.remove(); render('missions'); };
    const pips = $$('.pips i', box);
    function show() {
      pips.forEach((p, k) => p.className = k < i ? (res[k] ? 'ok' : 'no') : k === i ? 'cur' : '');
      const q = qs[i], qb = $('#qbox', box); qb.innerHTML = '';
      renderQ(q, qb, ok => {
        res[i] = ok; if (!ok) mistakes++;
        pips[i].className = ok ? 'ok' : 'no';
        explain(q, ok, box, () => { i++; if (i < qs.length) show(); else finish(); });
      });
    }
    function finish() {
      const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1, first = D.done[setId] == null;
      const apples = first ? reward(stars) : Math.round(reward(stars) / 2);
      D.done[setId] = Math.max(D.done[setId] || 0, stars); save();
      try { if (window.Progress) { Progress.track('dragon:set'); for (let k = 0; k < res.filter(Boolean).length; k++) Progress.track('answer:dragon'); } } catch (e) {}
      ov.remove();
      results(meta, stars, apples);
    }
    show();
  }

  /* renderQ — מציג שאלה לפי סוג; answer(ok) נקרא פעם אחת */
  function renderQ(q, qb, answer) {
    let done = false;
    const finish = (btn, ok, goodBtn) => { if (done) return; done = true; btn.classList.add(ok ? 'good' : 'bad'); if (!ok && goodBtn) goodBtn.classList.add('good'); $$('.opt', qb).forEach(b => { if (b !== btn && b !== goodBtn) b.classList.add('dim'); }); snd(ok ? 'ding' : 'sad'); setTimeout(() => answer(ok), 650); };
    const spk = (text, lbl) => { const b = el('button', 'spk', '🔊'); b.type = 'button'; b.title = 'להקשיב'; b.onclick = () => sayEn(text); const s = el('button', 'spk slow', '🐢'); s.type = 'button'; s.title = 'לאט'; s.onclick = () => sayEn(text, true); return [b, s]; };
    const ins = t => { qb.appendChild(el('div', 'qins', t)); };
    const main = el('div', 'qmain'), opts = el('div', 'opts');
    const w = q.word;
    if (q.type === 'listen') {
      ins('🎧 הקשיבו — איזו תמונה זו?');
      spk(w.en).forEach(b => main.appendChild(b)); main.firstChild.classList.add('pulse');
      q.options.forEach(o => { const b = el('button', 'opt pic', o.pic); b.type = 'button'; b.onclick = () => finish(b, o === w, $$('.opt', opts)[q.options.indexOf(w)]); opts.appendChild(b); });
      say('הקשיבו, איזו תמונה זו?', { onEnd: () => setTimeout(() => sayEn(w.en), 200) });
    } else if (q.type === 'pic2word') {
      ins('🖼️ איך אומרים את זה באנגלית?');
      main.appendChild(el('div', 'bigpic', w.pic));
      q.options.forEach(o => { const b = el('button', 'opt en', o.en); b.type = 'button'; const m = el('span', 'mini', '🔊'); m.onclick = e => { e.stopPropagation(); sayEn(o.en); }; b.appendChild(m); b.onclick = () => finish(b, o === w, $$('.opt', opts)[q.options.indexOf(w)]); opts.appendChild(b); });
      say('איך אומרים את זה באנגלית?');
    } else if (q.type === 'word2pic') {
      ins('📖 קראו את המילה — איזו תמונה מתאימה?');
      main.appendChild(el('div', 'bigword', w.en)); spk(w.en).forEach(b => main.appendChild(b));
      q.options.forEach(o => { const b = el('button', 'opt pic', o.pic); b.type = 'button'; b.onclick = () => finish(b, o === w, $$('.opt', opts)[q.options.indexOf(w)]); opts.appendChild(b); });
      say('קראו את המילה. איזו תמונה מתאימה?');
    } else if (q.type === 'missing') {
      ins('🔤 איזו אות חסרה?');
      main.appendChild(el('div', 'bigpic', w.pic));
      main.appendChild(el('div', 'bigword', w.en.split('').map((c, k) => k === q.idx ? '<span class="gap">_</span>' : c).join('')));
      spk(w.en).forEach(b => main.appendChild(b));
      q.letters.forEach(L => { const b = el('button', 'opt en tile', L); b.type = 'button'; b.onclick = () => { if (L === q.letter) { const g = $('.gap', main); if (g) g.textContent = L; } finish(b, L === q.letter, $$('.opt', opts)[q.letters.indexOf(q.letter)]); }; opts.appendChild(b); });
      say('איזו אות חסרה במילה?', { onEnd: () => sayEn(w.en) });
    } else if (q.type === 'spell') {
      ins('🧩 בנו את המילה — לחצו על האותיות לפי הסדר');
      main.appendChild(el('div', 'bigpic', w.pic)); spk(w.en).forEach(b => main.appendChild(b));
      const slots = el('div', 'slots', w.en.split('').map(() => '<i></i>').join(''));
      qb.appendChild(el('div', '')); // מרווח
      let pos = 0, err = false;
      const letters = DragonData.shuffle(w.en.split('').concat(['e', 'o', 'a', 's'].filter(c => w.en.indexOf(c) < 0).slice(0, 2)));
      opts.style.gridTemplateColumns = 'repeat(' + Math.min(8, letters.length) + ',1fr)';
      letters.forEach(L => { const b = el('button', 'opt en tile', L); b.type = 'button'; b.onclick = () => {
        if (done || b.disabled) return;
        if (L === w.en[pos]) { b.disabled = true; b.classList.add('good'); slots.children[pos].textContent = L; slots.children[pos].classList.add('f'); pos++; snd('pop');
          if (pos === w.en.length) { done = true; snd('ding'); setTimeout(() => answer(!err), 600); } }
        else { err = true; b.classList.remove('bad'); void b.offsetWidth; b.classList.add('bad'); snd('sad'); sayEn(w.en); }
      }; opts.appendChild(b); });
      qb.appendChild(main); qb.appendChild(slots); qb.appendChild(opts);
      say('בנו את המילה', { onEnd: () => sayEn(w.en) });
      return;
    } else if (q.type === 'sentence') {
      ins('💬 הקשיבו למשפט — איזו תמונה מתאימה?');
      const bw = el('div', 'bigword', q.text); bw.style.fontSize = 'clamp(30px,5vh,52px)'; main.appendChild(bw); spk(q.text).forEach(b => main.appendChild(b));
      q.options.forEach(o => { const b = el('button', 'opt pic', o); b.type = 'button'; b.onclick = () => finish(b, o === q.answer, $$('.opt', opts)[q.options.indexOf(q.answer)]); opts.appendChild(b); });
      say('הקשיבו למשפט', { onEnd: () => sayEn(q.text) });
    } else if (q.type === 'math') {
      ins(/[א-ת]/.test(q.q) ? q.q : '🔢 כמה זה?');
      if (!/[א-ת]/.test(q.q)) main.appendChild(el('div', 'mathq', q.q));
      if (q.visual) { const [a, b, e] = q.visual; main.appendChild(el('div', 'count', b < 0 ? e.repeat(a + b) + '<span class="minus">' + e.repeat(-b) + '</span>' : e.repeat(a) + ' ➕ ' + e.repeat(b))); }
      if (q.groups) { const [g, n, e] = q.groups; main.appendChild(el('div', 'groups', Array.from({ length: g }, () => '<span>' + e.repeat(n) + '</span>').join(''))); }
      q.options.forEach(v => { const b = el('button', 'opt tile', String(v)); b.type = 'button'; b.onclick = () => finish(b, v === q.ans, $$('.opt', opts)[q.options.indexOf(q.ans)]); opts.appendChild(b); });
      if (q.options.length === 2) opts.style.gridTemplateColumns = 'repeat(2,1fr)';
      say(q.say);
    }
    qb.appendChild(main); qb.appendChild(opts);
  }

  /* explain — לוח הסבר אחרי כל תשובה: ציור, מילה, הגייה, תרגום, טיפ, 🔊/🐢 */
  function explain(q, ok, box, next) {
    const ex = el('div', 'explain ' + (ok ? 'ok' : 'no'));
    let pic, body, en = null;
    if (q.word) {
      const w = q.word; en = w.en; pic = w.pic;
      body = '<b>' + (ok ? '✓ נכון! ' : 'כמעט! התשובה: ') + '</b><span class="w">' + w.en + '</span><span class="tr">' + w.say + ' · ' + w.he + '</span>' + (w.tip ? '<small>💡 ' + w.tip + '</small>' : '');
    } else if (q.type === 'sentence') {
      en = q.text; pic = q.answer;
      body = '<b>' + (ok ? '✓ נכון! ' : 'כמעט! ') + '</b><span class="w" style="font-size:clamp(22px,2.6vw,32px)">' + q.text + '</span><small>' + q.he + '</small>';
    } else {
      pic = ok ? '🎉' : '💡';
      body = '<b>' + (ok ? '✓ נכון! ' : 'כמעט! התשובה: ') + '<span style="direction:ltr;display:inline-block">' + q.ans + '</span></b><small>' + q.why + '</small>';
    }
    ex.innerHTML = '<div class="ep">' + pic + '</div><div class="et">' + body + '</div><div class="eb"></div>';
    const eb = $('.eb', ex);
    if (en) { const a = el('button', 'spk', '🔊'); a.type = 'button'; a.onclick = () => sayEn(en); const s = el('button', 'spk slow', '🐢'); s.type = 'button'; s.onclick = () => sayEn(en, true); eb.append(a, s); }
    const nb = el('button', 'h-btn gold', 'הבא ←'); nb.type = 'button'; nb.onclick = () => { ex.remove(); next(); }; eb.appendChild(nb);
    box.appendChild(ex);
    if (en) { say(ok ? 'נכון!' : 'כמעט!', { onEnd: () => setTimeout(() => sayEn(en), 150) }); }
    else say(ok ? 'נכון! ' + (q.why || '') : 'כמעט! ' + (q.why || ''));
  }

  /* ---------- פרק 5 — סיום: כוכבים, תפוחים לדרקון, גדילה ---------- */
  function results(meta, stars, apples) {
    const ov = el('div', 'ov'), c = el('div', 'cere');
    ov.appendChild(c); document.body.appendChild(ov);
    c.innerHTML = '<div class="rays"></div><div class="inner"><h2>המשימה הושלמה!</h2><div class="stars">' + [0, 1, 2].map(k => k < stars ? '⭐' : '☆').join('') + '</div>' +
      '<div class="cd" id="cd">' + Pet.svg({ face: 'happy' }) + '</div><div class="cap">' + meta.icon + ' ' + meta.name + ' · הרווחת ' + apples + ' 🍎 בשביל ' + dname() + '</div>' +
      '<button type="button" class="h-btn gold" id="feedAll">🍎 להאכיל את ' + dname() + '!</button></div>';
    confetti(); snd('happy'); say('המשימה הושלמה! הרווחת ' + apples + ' תפוחים בשביל ' + dname() + '!');
    $('#feedAll', c).onclick = function () {
      this.disabled = true;
      const cd = $('#cd', c), r = cd.getBoundingClientRect(), from = this.getBoundingClientRect();
      const n = Math.min(12, apples);
      for (let k = 0; k < n; k++) setTimeout(() => {
        const a = el('div', 'apple-fly', '🍎'); a.style.left = (from.left + from.width / 2) + 'px'; a.style.top = from.top + 'px'; document.body.appendChild(a);
        a.animate([{ transform: 'translate(-50%,0) scale(1)' }, { transform: 'translate(' + (r.left + r.width / 2 - from.left - from.width / 2 - 22) + 'px,' + (r.top + r.height * .45 - from.top) + 'px) scale(.4)', opacity: .6 }], { duration: 650, easing: 'cubic-bezier(.3,.7,.4,1)' }).onfinish = () => { a.remove(); cd.innerHTML = Pet.svg({ face: 'eat' }); snd('pop'); };
      }, k * 120);
      setTimeout(() => {
        const g = Pet.grow(apples); refreshChips();
        if (g.to > g.from) { ov.remove(); ceremony(g.from, g.to, () => render('lair')); }
        else { cd.innerHTML = Pet.svg({ face: 'love' }); say(dname() + ' אכל ומאושר! עוד קצת והוא יגדל!'); $('.cap', c).textContent = '😋 ' + dname() + ' שבע! עוד ' + (Pet.nextAt() - P().xp) + ' 🍎 לשלב הבא'; this.textContent = '▶ להמשיך'; this.disabled = false; this.onclick = () => { ov.remove(); render('missions'); }; }
      }, n * 120 + 800);
    };
  }

  /* ceremony — טקס גדילה: הבזק, קרניים, הדרקון גדל עם "פיצוץ", הכרזה ומה חדש; אחר כך מתנה/משחק */
  function ceremony(from, to, done) {
    const ov = el('div', 'ov'), c = el('div', 'cere');
    ov.appendChild(c); document.body.appendChild(ov);
    const newToy = TOYS.find(t => t.at > from && t.at <= to && !D.toys[t.id]);
    c.innerHTML = '<div class="rays"></div><div class="inner"><h2>' + (from === 0 ? 'הביצה בוקעת!' : dname() + ' גדל!') + '</h2><div class="cd" id="cd">' + Pet.svg({ stage: from, face: 'happy' }) + '</div>' +
      '<div class="cap" id="cap">✨ ✨ ✨</div><div id="after"></div></div>';
    const cd = $('#cd', c);
    snd('bubble');
    cd.animate([{ transform: 'scale(1) rotate(0)' }, { transform: 'scale(1.05) rotate(-4deg)' }, { transform: 'scale(1.05) rotate(4deg)' }, { transform: 'scale(1) rotate(0)' }], { duration: 300, iterations: 4 });
    setTimeout(() => {
      cd.innerHTML = Pet.svg({ stage: to, face: 'love' }); cd.classList.add('grow');
      confetti(); snd('ding');
      $('#cap', c).innerHTML = 'עכשיו ' + (to === 1 ? 'יש לך' : 'הוא') + ' <b>' + Pet.STAGES[to][1] + '</b>! ' + Pet.NEWS[to];
      say((from === 0 ? 'הביצה בקעה! ' : dname() + ' גדל! ') + 'עכשיו הוא ' + Pet.STAGES[to][1] + '. ' + Pet.NEWS[to]);
      setTimeout(() => {
        const aft = $('#after', c);
        if (newToy) {
          D.toys[newToy.id] = 1; save();
          aft.innerHTML = '<button type="button" class="gift" aria-label="מתנה">🎁</button><div class="cap">מתנה חדשה! הקישו לפתוח</div>';
          $('.gift', aft).onclick = () => {
            snd('cha_ching'); confetti();
            aft.innerHTML = '<div style="font-size:110px">' + newToy.ico + '</div><div class="cap">משחק חדש: ' + newToy.name + '! ' + newToy.what + '</div><div style="display:flex;gap:10px;justify-content:center"><button type="button" class="h-btn gold" id="playNow">▶ לשחק עכשיו</button><button type="button" class="h-btn violet" id="later">אחר כך</button></div>';
            say('מתנה חדשה! משחק ' + newToy.name + '!');
            $('#playNow', aft).onclick = () => { ov.remove(); done(); openToy(newToy.id); };
            $('#later', aft).onclick = () => { ov.remove(); done(); };
          };
        } else {
          aft.innerHTML = '<div style="display:flex;gap:10px;justify-content:center"><button type="button" class="h-btn gold" id="celebrate">🎉 לחגוג עם ' + dname() + '</button><button type="button" class="h-btn violet" id="later">להמשיך</button></div>';
          $('#celebrate', aft).onclick = () => { ov.remove(); done(); const open = TOYS.filter(toyOpen); openToy(open[(Math.random() * open.length) | 0].id); };
          $('#later', aft).onclick = () => { ov.remove(); done(); };
        }
      }, 1600);
    }, 1300);
  }

  /* ---------- פרק 6 — משחקים ---------- */
  function renderToys() {
    const pane = $('#pane-toys');
    pane.innerHTML = '<div class="toys">' + TOYS.map(t => {
      const open = toyOpen(t) && P().color;
      return '<button type="button" class="toy' + (open ? '' : ' lock') + '" data-toy="' + t.id + '"' + (open ? '' : ' disabled') + '><div class="ic">' + t.ico + '</div><b>' + t.name + '</b><small>' + (open ? t.what : '🔒 נפתח בשלב ' + (t.at + 1) + ': ' + Pet.STAGES[t.at][1]) + '</small></button>';
    }).join('') + '</div><p style="font-weight:800;text-align:center;margin-top:16px">🎁 משחקים חדשים נפתחים כשהדרקון גדל — וכל סט משימות מגדל אותו!</p>';
    $$('.toy[data-toy]', pane).forEach(b => b.addEventListener('click', () => { if (!b.disabled) openToy(b.dataset.toy); }));
  }

  /* dragonImg — תמונת הדרקון (SVG → Image) לציור בקנבס */
  function dragonImg(face) { const im = new Image(); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(Pet.svg({ face: face || 'happy' }).replace('<svg ', '<svg width="400" height="400" ')); return im; }

  function openToy(id) {
    const toy = TOYS.find(t => t.id === id);
    const ov = el('div', 'ov'), g = el('div', 'game');
    g.innerHTML = '<canvas width="1100" height="720"></canvas><div class="hud"><span class="chip" id="gs">' + toy.ico + ' 0</span><span class="chip" id="gt"></span></div><button type="button" class="x">✖</button>';
    ov.appendChild(g); document.body.appendChild(ov);
    const cv = $('canvas', g), ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
    let score = 0, over = false, raf = 0, last = performance.now(), t0 = last;
    const img = dragonImg('happy'), imgEat = dragonImg('eat'), imgLove = dragonImg('love'), imgFire = dragonImg('fire');
    const stopAll = () => { over = true; cancelAnimationFrame(raf); Voice.silence(); };
    $('.x', g).onclick = () => { stopAll(); ov.remove(); render($('.tab.on').dataset.tab); };
    const pos = e => { const r = cv.getBoundingClientRect(), p = e.touches ? e.touches[0] : e; return { x: (p.clientX - r.left) * W / r.width, y: (p.clientY - r.top) * H / r.height }; };
    const setScore = n => { score = n; $('#gs', g).textContent = toy.ico + ' ' + score; };
    const pops = [];
    const pop = (x, y, t, col) => pops.push({ x, y, t, col: col || '#ffd23c', life: 1 });
    function drawPops(dt) { pops.forEach(p => { p.life -= dt * 1.4; p.y -= dt * 60; ctx.globalAlpha = Math.max(0, p.life); ctx.font = '900 44px Rubik, sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 8; ctx.strokeStyle = '#101e36'; ctx.strokeText(p.t, p.x, p.y); ctx.fillStyle = p.col; ctx.fillText(p.t, p.x, p.y); ctx.globalAlpha = 1; }); for (let k = pops.length - 1; k >= 0; k--) if (pops[k].life <= 0) pops.splice(k, 1); }
    function bg(sky) {
      const gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, sky ? '#5cb8ff' : '#bfeaff'); gr.addColorStop(1, '#e9f8ff');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let y = 10; y < 260; y += 22) for (let x = (y / 22 % 2) * 11; x < W; x += 22) { ctx.beginPath(); ctx.arc(x, y, 2.4 * (1 - y / 260) + .5, 0, 7); ctx.fill(); }
      if (!sky) { ctx.fillStyle = '#6cc85a'; ctx.fillRect(0, H - 120, W, 120); ctx.fillStyle = '#101e36'; ctx.fillRect(0, H - 124, W, 6); }
    }
    function end(msg) {
      stopAll();
      let bonus = 0;
      const day = new Date().toDateString(); if (D.cap.day !== day) D.cap = { day: day, n: 0 };
      if (score > 0 && D.cap.n < 6) { bonus = Math.min(2, 6 - D.cap.n); D.cap.n += bonus; save(); Pet.addFood(bonus); refreshChips(); }
      const e = el('div', 'end', '<div><h2>' + (msg || 'כל הכבוד!') + '</h2><div style="font:900 30px var(--h-font)">' + toy.ico + ' ' + score + '</div>' + (bonus ? '<div style="font-weight:800">' + dname() + ' מצא ' + bonus + ' 🍎 במשחק!</div>' : '') + '<div style="display:flex;gap:10px;justify-content:center"><button type="button" class="h-btn gold" id="again">🔁 שוב</button><button type="button" class="h-btn violet" id="bye">✓ סיום</button></div></div>');
      g.appendChild(e); confetti(); snd('happy');
      $('#again', e).onclick = () => { ov.remove(); openToy(id); };
      $('#bye', e).onclick = () => { ov.remove(); render($('.tab.on').dataset.tab); };
    }
    const timer = sec => { const left = Math.max(0, sec - (performance.now() - t0) / 1000); $('#gt', g).textContent = '⏰ ' + Math.ceil(left); return left; };

    /* 6.1 דגדוגים — נוגעים בדרקון: צחוק, לבבות, קפיצה */
    if (id === 'tickle') {
      $('#gt', g).textContent = 'געו בדרקון!';
      const d = { x: W / 2, y: H - 110, s: 440, jump: 0, face: img };
      const lines = ['חי חי חי!', 'זה מדגדג!', 'הה הה!', 'עוד!', 'אוי, הבטן!'];
      cv.onpointerdown = e => { const p = pos(e); if (Math.abs(p.x - d.x) < d.s / 2 && p.y > d.y - d.s && p.y < d.y) { setScore(score + 1); d.jump = 1; d.face = Math.random() < .5 ? imgLove : imgEat; pop(p.x, p.y - 20, lines[score % lines.length], '#ff7ec2'); snd(['pop', 'sparkle', 'bubble'][score % 3]); if (score % 4 === 0) say(dname() + ' צוחק!'); setTimeout(() => d.face = img, 500); if (score >= 25) end(dname() + ' צחק מלא!'); } };
      const loop = now => { if (over) return; const dt = Math.min(.05, (now - last) / 1000); last = now; bg(); d.jump = Math.max(0, d.jump - dt * 3); const jy = Math.sin(d.jump * Math.PI) * 60; ctx.drawImage(d.face, d.x - d.s / 2, d.y - d.s - jy, d.s, d.s); drawPops(dt); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop); say('געו בדרקון ותדגדגו אותו!');
    }

    /* 6.2 כדור — מקישים על מקום, הכדור עף לשם והדרקון רץ וקופץ לתפוס */
    if (id === 'ball') {
      const d = { x: W / 2, y: H - 110, s: 260, vx: 0, jump: 0 }; let ball = null, throws = 0;
      cv.onpointerdown = e => { if (ball) return; const p = pos(e); throws++; ball = { x: 80, y: H - 180, tx: p.x, ty: Math.min(p.y, H - 180), t: 0 }; snd('pop'); };
      const loop = now => {
        if (over) return; const dt = Math.min(.05, (now - last) / 1000); last = now; bg();
        $('#gt', g).textContent = 'זריקה ' + Math.min(throws + (ball ? 0 : 1), 10) + '/10';
        if (ball) {
          ball.t += dt * 1.1; const k = Math.min(1, ball.t), bx = 80 + (ball.tx - 80) * k, by = (H - 180) + (ball.ty - (H - 180)) * k - Math.sin(k * Math.PI) * 220;
          d.x += Math.sign(ball.tx - d.x) * Math.min(Math.abs(ball.tx - d.x), dt * 520);
          if (k > .72 && !d.jump) d.jump = 1;
          ctx.font = '64px serif'; ctx.textAlign = 'center'; ctx.fillText('🎾', bx, by);
          if (k >= 1) { setScore(score + 1); pop(d.x, d.y - d.s - 10, ['תפס!', 'יש!', 'וואו!'][score % 3]); snd('ding'); ball = null; if (throws >= 10) setTimeout(() => end(dname() + ' תפס ' + score + ' כדורים!'), 500); }
        }
        d.jump = Math.max(0, d.jump - dt * 2.2); const jy = Math.sin(d.jump * Math.PI) * 120;
        ctx.drawImage(d.jump ? imgEat : img, d.x - d.s / 2, d.y - d.s - jy, d.s, d.s);
        ctx.font = '70px serif'; ctx.fillText('👧', 60, H - 130);
        drawPops(dt); raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop); say('הקישו איפה לזרוק את הכדור, ו' + dname() + ' יתפוס!');
    }

    /* 6.3 בועות מילים — שומעים מילה באנגלית; מקישים על הבועה עם התמונה הנכונה והדרקון יורק עליה אש */
    if (id === 'bubbles') {
      const all = []; Object.keys(DragonData.THEMES).forEach(k => DragonData.THEMES[k].words.forEach(w => all.push({ en: w[0], pic: w[1] })));
      const d = { x: W / 2, y: H - 100, s: 230 }; let bubbles = [], target = null, fire = null;
      const spawn = () => { const opts = DragonData.shuffle(all).slice(0, 4); target = opts[0]; bubbles = DragonData.shuffle(opts).map((w, k) => ({ w, x: 160 + k * 260, y: H + 80 + k * 40, r: 78, vy: 55 + Math.random() * 25, wob: Math.random() * 6 })); setTimeout(() => sayEn(target.en), 300); };
      cv.onpointerdown = e => { const p = pos(e); const b = bubbles.find(b => Math.hypot(b.x - p.x, b.y - p.y) < b.r); if (!b || fire) { if (target && Math.hypot(W - 80 - p.x, 70 - p.y) < 50) sayEn(target.en); return; } fire = { b, t: 0, ok: b.w === target };
        if (fire.ok) { snd('ding'); } else { snd('sad'); sayEn(target.en); } };
      const loop = now => {
        if (over) return; const dt = Math.min(.05, (now - last) / 1000); last = now; bg();
        const left = timer(45); if (left <= 0) return end('פוצצת ' + score + ' בועות!');
        bubbles.forEach(b => { b.y -= b.vy * dt; b.wob += dt * 2; const x = b.x + Math.sin(b.wob) * 12;
          ctx.fillStyle = 'rgba(191,234,255,.55)'; ctx.strokeStyle = '#101e36'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, b.y, b.r, 0, 7); ctx.fill(); ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(x - 26, b.y - 28, 12, 0, 7); ctx.fill();
          ctx.font = '72px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(b.w.pic, x, b.y + 4); b.dx = x; });
        if (bubbles.length && bubbles.every(b => b.y < -90)) spawn();
        if (fire) { fire.t += dt * 2.4; const b = fire.b, k = Math.min(1, fire.t);
          ctx.strokeStyle = fire.ok ? '#ff9f1c' : '#9aa3b8'; ctx.lineWidth = 26 * (1 - k * .5); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(d.x + 40, d.y - d.s * .55); ctx.lineTo(d.x + 40 + (b.dx - d.x - 40) * k, d.y - d.s * .55 + (b.y - d.y + d.s * .55) * k); ctx.stroke();
          if (k >= 1) { if (fire.ok) { setScore(score + 1); pop(b.dx, b.y, 'פופ! ' + target.en, '#ffd23c'); bubbles = []; spawn(); } else { pop(b.dx, b.y, 'לא זו…', '#ffffff'); } fire = null; } }
        ctx.drawImage(fire ? imgFire : img, d.x - d.s / 2, d.y - d.s, d.s, d.s);
        ctx.font = '60px serif'; ctx.fillText('🔊', W - 80, 76);
        ctx.font = '900 30px Rubik, sans-serif'; ctx.fillStyle = '#101e36'; ctx.fillText('איזו בועה? הקשיבו!', W - 250, 80);
        drawPops(dt); raf = requestAnimationFrame(loop);
      };
      spawn(); raf = requestAnimationFrame(loop); say('הקשיבו למילה באנגלית, והקישו על הבועה הנכונה!');
    }

    /* 6.4 תופסים תפוחים — גוררים את הדרקון; תפוח זהב = 3 */
    if (id === 'apples') {
      const d = { x: W / 2, y: H - 100, s: 210 }; let fruits = [], spawnT = 0, drag = false;
      const move = e => { if (!drag) return; d.x = Math.max(100, Math.min(W - 100, pos(e).x)); };
      cv.onpointerdown = e => { drag = true; move(e); }; cv.onpointermove = move; cv.onpointerup = () => { drag = false; };
      const loop = now => {
        if (over) return; const dt = Math.min(.05, (now - last) / 1000); last = now; bg();
        if (timer(35) <= 0) return end('תפסת ' + score + ' תפוחים!');
        spawnT -= dt; if (spawnT <= 0) { spawnT = .55 + Math.random() * .5; fruits.push({ x: 80 + Math.random() * (W - 160), y: -40, v: 190 + Math.random() * 140, gold: Math.random() < .12 }); }
        fruits.forEach(f => { f.y += f.v * dt; ctx.font = '64px serif'; ctx.textAlign = 'center'; ctx.fillText(f.gold ? '🌟' : '🍎', f.x, f.y);
          if (f.y > d.y - d.s * .7 && f.y < d.y - d.s * .3 && Math.abs(f.x - d.x) < d.s * .42) { f.hit = true; setScore(score + (f.gold ? 3 : 1)); pop(f.x, f.y - 30, f.gold ? '+3!' : '+1', f.gold ? '#ffd23c' : '#ffffff'); snd(f.gold ? 'cha_ching' : 'pop'); } });
        fruits = fruits.filter(f => !f.hit && f.y < H + 60);
        ctx.drawImage(fruits.some(f => f.y > d.y - d.s) ? imgEat : img, d.x - d.s / 2, d.y - d.s, d.s, d.s);
        drawPops(dt); raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop); say('גררו את ' + dname() + ' ותפסו תפוחים!');
    }

    /* 6.5 טבעות בשמיים — מקישים כדי לנפנף בכנפיים ולעוף דרך הטבעות (בלי פסילה) */
    if (id === 'rings') {
      const d = { x: 260, y: H / 2, vy: 0, s: 170 }; let rings = [], spawnT = 0;
      cv.onpointerdown = () => { d.vy = -430; snd('pop'); };
      const loop = now => {
        if (over) return; const dt = Math.min(.05, (now - last) / 1000); last = now; bg(true);
        if (timer(40) <= 0) return end('עברת ' + score + ' טבעות!');
        d.vy += 900 * dt; d.y += d.vy * dt; if (d.y > H - 90) { d.y = H - 90; d.vy = -260; } if (d.y < 90) { d.y = 90; d.vy = 60; }
        spawnT -= dt; if (spawnT <= 0) { spawnT = 1.6; rings.push({ x: W + 60, y: 170 + Math.random() * (H - 340), passed: false }); }
        rings.forEach(r => { r.x -= 260 * dt;
          ctx.lineWidth = 16; ctx.strokeStyle = '#101e36'; ctx.beginPath(); ctx.ellipse(r.x, r.y, 34, 92, 0, 0, 7); ctx.stroke();
          ctx.lineWidth = 9; ctx.strokeStyle = r.passed ? '#3ff2b0' : '#ffd23c'; ctx.beginPath(); ctx.ellipse(r.x, r.y, 34, 92, 0, 0, 7); ctx.stroke();
          if (!r.passed && Math.abs(r.x - d.x) < 26 && Math.abs(r.y - d.y) < 70) { r.passed = true; setScore(score + 1); pop(r.x, r.y - 110, '⭐ +1'); snd('ding'); } });
        rings = rings.filter(r => r.x > -80);
        ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(Math.max(-.5, Math.min(.5, d.vy / 900))); ctx.drawImage(img, -d.s / 2, -d.s / 2, d.s, d.s); ctx.restore();
        drawPops(dt); raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop); say('הקישו כדי לעוף, ועברו דרך הטבעות!');
    }
  }

  /* ---------- התחלה ---------- */
  render('lair');
  if (/#missions/.test(location.hash)) $('.tab[data-tab="missions"]').click();
  window.DragonLair = { startSet, openToy, ceremony, render, state: D };
})();
