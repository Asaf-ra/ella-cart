/* =====================================================================
   js/stories.js — ספריית הסיפורים: מדף ספרים, קריאה בקול עם הדגשת מילים, שאלת הבנה
   ---------------------------------------------------------------------
   פרק 1 — שמירה (ella-stories-v1): אילו סיפורים נקראו (ענו נכון על שאלת ההבנה)
   פרק 2 — מדף הספרים: 3 לשוניות (סיפורים / הרפתקאות אלה / English), נעילת פרקים בהמשכים
   פרק 3 — פתיחת ספר ועמוד: סצנה מצוירת (אימוג'י על רקע לפי נושא) + מילים שאפשר לגעת בהן
   פרק 4 — הקראה עם הדגשה: מילה-אחר-מילה (גבולות מילים מהמכשיר, או הערכת זמן לפי אורך),
           מצב "▶ הקראה" ממשיך לבד לעמוד הבא; נגיעה במילה — שומעים רק אותה
   פרק 5 — שאלת הבנה בסוף: תשובה נכונה = פרס (אנרגיה + מטבעות + 🍎🍎 לחיית המחמד)
   פרק 6 — אתחול: קישור ישיר לפרק (stories.html#ep3)
   תלויות: js/story-data.js (STORIES), js/audio.js, shared/hero-rewards.js, shared/progress.js, shared/wallet.js
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- פרק 1 — שמירה ---------- */
  var KEY = 'ella-stories-v1';
  var D = (function () { try { return JSON.parse(localStorage.getItem(KEY)) || { read: {} }; } catch (e) { return { read: {} }; } })();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) {} }
  function $(id) { return document.getElementById(id); }
  function snd(n) { try { if (window.Sound && Sound[n]) Sound[n](); } catch (e) {} }
  function say(t, opts) { try { if (window.Voice) Voice.say(t, Object.assign({ interrupt: true }, opts || {})); } catch (e) {} }
  var LIST = STORIES.list;

  /* episodeOpen — פרק 1 פתוח תמיד; כל פרק נוסף נפתח בכל פעם שמשלימים את "משימת היום" */
  function episodeOpen(s) { if (!s.series) return true; var got = window.Progress ? Progress.storyEpisode() : 0; return s.ep <= got + 1; }

  /* ---------- פרק 2 — מדף הספרים ---------- */
  var tab = 'he';
  function renderShelf() {
    var shelf = $('shelf'); shelf.innerHTML = '';
    var items = LIST.filter(function (s) { return tab === 'ella' ? s.series === 'ella' : !s.series && s.lang === tab; });
    /* בתקופת חג — סיפור החג ראשון במדף (shared/seasons.js) */
    var ev = window.Seasons ? Seasons.current() : null;
    if (ev && ev.story) items.sort(function (a, b) { return (b.id === ev.story) - (a.id === ev.story); });
    items.forEach(function (s, i) {
      var open = episodeOpen(s), done = !!D.read[s.id];
      var b = document.createElement('button'); b.type = 'button';
      b.className = 'book' + (open ? '' : ' locked'); b.style.animationDelay = (i * .05) + 's';
      b.innerHTML = '<div class="cover th-' + s.theme + '"><span>' + s.cover + '</span></div><div class="info"><b' + (s.lang === 'en' ? ' dir="ltr"' : '') + '>' + (window.Profile ? Profile.friendFix(s.title) : s.title) + '</b><div class="tags">' +
        (s.holiday ? '<span class="tag"' + (ev && ev.story === s.id ? ' style="background:#ffc93c"' : '') + '>' + (ev && ev.story === s.id ? '✨ עכשיו חג!' : '🎉 סיפור חג') + '</span>' :
         s.level === 'young' ? '<span class="tag">🌱 5–6</span>' : s.level === 'big' ? '<span class="tag">🚀 7–8</span>' : '<span class="tag">📺 פרק ' + s.ep + '</span>') +
        '<span class="tag">' + s.pages.length + ' עמודים</span>' + (done ? '<span class="tag done">✓ נקרא</span>' : '') + '</div>' +
        (open ? '' : '<div class="lock-note">נפתח כשמשלימים את משימת היום 📜</div>') + '</div>';
      b.addEventListener('click', function () {
        if (!open) { snd('sad'); say('הפרק הזה נפתח כשמשלימים את משימת היום במסך הבית!'); return; }
        openStory(s);
      });
      shelf.appendChild(b);
    });
    var n = Object.keys(D.read).length;
    $('readCount').textContent = '⭐ קראת ' + n + ' מתוך ' + LIST.length;
  }
  document.querySelectorAll('.tab').forEach(function (t) {
    t.addEventListener('click', function () {
      tab = t.dataset.t; document.querySelectorAll('.tab').forEach(function (x) { x.classList.toggle('on', x === t); });
      snd('bubble'); say(t.textContent.replace(/[^֐-׿A-Za-z ]/g, '')); renderShelf();
    });
  });

  /* ---------- פרק 3 — פתיחת ספר ועמוד ---------- */
  var cur = null, idx = 0, auto = false, showTrans = true, timers = [], readToken = 0;
  var DECO = {
    sky: '☁️', sea: '🫧', space: '✨', night: '⭐', forest: '🌼', city: '✨', home: '💖', party: '🎉'
  };
  /* withFriends — עותק של הסיפור שבו חברה בשם זהה לשם הילדה מקבלת שם חלופי (shared/profile.js) */
  function withFriends(s) {
    if (!window.Profile || !Profile.friendFix) return s;
    var f = Profile.friendFix;
    return Object.assign({}, s, { title: f(s.title), pages: s.pages.map(function (p) { return Object.assign({}, p, { text: f(p.text) }); }),
      quiz: Object.assign({}, s.quiz, { q: f(s.quiz.q), o: s.quiz.o.map(f) }) });
  }
  function openStory(s) {
    s = withFriends(s);
    cur = s; idx = 0; auto = false;
    $('libScreen').classList.remove('show'); $('readScreen').classList.add('show');
    $('readTitle').textContent = s.title; $('readTitle').dir = s.lang === 'en' ? 'ltr' : 'rtl';
    $('transBtn').hidden = s.lang !== 'en';
    setAuto(false);
    snd('happy');
    renderPage(true);
    /* קוראים את שם הסיפור ואז את העמוד הראשון */
    var tk = ++readToken;
    readTitle(function () { if (tk !== readToken) return; setAuto(true); readPage(); });
  }
  function readTitle(then) {
    if (cur.lang === 'en') Voice.read([{ text: cur.title, lang: 'en-US' }], { interrupt: true, onEnd: then });
    else Voice.read([{ text: cur.title.replace(/^פרק \d+: /, function (m) { return m.replace(':', '.'); }), lang: 'he-IL' }], { interrupt: true, onEnd: then });
    if (window.Sound && !Sound.isOn()) setTimeout(then, 600);
  }
  function renderPage(enter) {
    stopRead();
    var p = cur.pages[idx], scene = $('scene');
    scene.className = 'scene th-' + cur.theme + (enter ? ' enter' : '');
    /* קישוטים ברקע הסצנה (עננים / בועות / כוכבים) */
    scene.querySelectorAll('.deco').forEach(function (d) { d.remove(); });
    for (var i = 0; i < 6; i++) {
      var d = document.createElement('span'); d.className = 'deco'; d.textContent = DECO[cur.theme] || '✨';
      d.style.cssText = 'left:' + (8 + i * 15 + (i % 2) * 5) + '%;top:' + (8 + (i * 37) % 60) + '%;font-size:' + (22 + (i % 3) * 12) + 'px;opacity:.75';
      scene.appendChild(d);
    }
    $('chars').innerHTML = Array.from(p.scene).length ? splitEmoji(p.scene).map(function (e) { return '<span>' + e + '</span>'; }).join('') : '';
    void scene.offsetWidth; scene.classList.add('enter');
    /* הטקסט: כל מילה בתוך span עם מיקום התו שבו היא מתחילה (לסנכרון עם ההקראה) */
    var box = $('pageText'); box.className = 'page-text' + (cur.lang === 'en' ? ' ltr' : '');
    var html = '<div class="line">', pos = 0;
    p.text.split(/(\s+)/).forEach(function (tok) {
      if (tok && !/^\s+$/.test(tok)) html += '<span class="w" data-s="' + pos + '">' + tok + '</span> ';
      pos += tok.length;
    });
    html += '</div>';
    if (cur.lang === 'en' && p.he) html += '<div class="trans' + (showTrans ? '' : ' hide') + '">' + p.he + '</div>';
    box.innerHTML = html;
    box.querySelectorAll('.w').forEach(function (w) {
      w.addEventListener('click', function () {
        setAuto(false); stopRead();
        var word = w.textContent.replace(/[.,!?:;"״׳']+$/g, '').replace(/^["״]+/, '');
        w.classList.add('tapped'); setTimeout(function () { w.classList.remove('tapped'); }, 700);
        if (cur.lang === 'en') Voice.read([{ text: word, lang: 'en-US' }], { interrupt: true }); else say(word);
      });
    });
    /* נקודות התקדמות + כפתורים */
    $('dots').innerHTML = cur.pages.map(function (_, i) { return '<i class="' + (i === idx ? 'on' : i < idx ? 'done' : '') + '"></i>'; }).join('');
    $('prevBtn').disabled = idx === 0; $('prevBtn').style.opacity = idx === 0 ? .4 : 1;
    $('nextBtn').textContent = idx === cur.pages.length - 1 ? 'סיימתי! ⭐' : 'קדימה ←';
  }
  /* splitEmoji — מפרק מחרוזת אימוג'י לדמויות נפרדות (כולל אימוג'י מורכבים עם ZWJ) */
  function splitEmoji(str) {
    try { if (window.Intl && Intl.Segmenter) return Array.from(new Intl.Segmenter('he', { granularity: 'grapheme' }).segment(str), function (x) { return x.segment; }).filter(function (x) { return x.trim(); }); } catch (e) {}
    return str.match(/(\p{Extended_Pictographic}(️|‍\p{Extended_Pictographic}|[\u{1F3FB}-\u{1F3FF}])*)/gu) || [str];
  }

  /* ---------- פרק 4 — הקראה עם הדגשת מילים ---------- */
  function stopRead() { readToken++; timers.forEach(clearTimeout); timers = []; }
  function highlight(i) {
    var ws = $('pageText').querySelectorAll('.w');
    ws.forEach(function (w, k) { w.classList.toggle('on', k === i); w.classList.toggle('past', k < i); });
  }
  /* schedule — הדגשה לפי הערכת זמן: לכל מילה חלק מהזמן לפי האורך שלה */
  function schedule(durMs, token) {
    var ws = Array.prototype.slice.call($('pageText').querySelectorAll('.w'));
    var lens = ws.map(function (w) { return w.textContent.length + 2; }), total = lens.reduce(function (a, b) { return a + b; }, 0), t = 0;
    ws.forEach(function (w, k) {
      timers.push(setTimeout(function () { if (token === readToken) highlight(k); }, t));
      t += durMs * lens[k] / total;
    });
    return t;
  }
  function estimate(text) { var rate = (window.Voice && Voice.current) ? (Voice.current().rate || 1) : 1; return text.length / (cur.lang === 'en' ? 12 : 13.5) * 1000 / rate + 400; }
  /* readPage — מקריא את העמוד הנוכחי; במצב אוטומטי ממשיך לבד לעמוד הבא */
  function readPage() {
    stopRead();
    var token = readToken, p = cur.pages[idx], started = false, gotBoundary = false, t0 = Date.now();
    /* מיקומי תחילת המילים בטקסט שהקול באמת מקריא (אחרי ניקוי — למשל ניקוד השם "אלה") */
    var spoken = window.Voice && Voice.clean ? Voice.clean(p.text, cur.lang === 'en' ? 'en-US' : 'he-IL') : p.text, starts = [], pos = 0;
    spoken.split(/(\s+)/).forEach(function (tok) { if (tok && !/^\s+$/.test(tok)) starts.push(pos); pos += tok.length; });
    function finish() {
      if (token !== readToken) return;
      highlight(starts.length);
      if (auto) timers.push(setTimeout(function () { if (token === readToken) goNext(true); }, 900));
    }
    /* בלי צליל / בלי מנוע דיבור — הדגשה לפי זמן בלבד */
    if (window.Sound && !Sound.isOn()) { var d = schedule(estimate(p.text), token); timers.push(setTimeout(finish, d + 300)); return; }
    Voice.read([{ text: p.text, lang: cur.lang === 'en' ? 'en-US' : 'he-IL' }], {
      interrupt: true,
      onStart: function (dur) { if (token !== readToken) return; started = true; t0 = Date.now(); if (!gotBoundary) schedule(dur ? dur * 1000 : estimate(p.text), token); },
      onBoundary: function (ci) {
        if (token !== readToken) return;
        if (!gotBoundary) { gotBoundary = true; timers.forEach(clearTimeout); timers = []; }
        var k = 0; for (var i = 0; i < starts.length; i++) if (starts[i] <= ci) k = i; highlight(k);
      },
      onEnd: function () {
        if (token !== readToken) return;
        if (!started && Date.now() - t0 < 300) { var d2 = schedule(estimate(p.text), token); timers.push(setTimeout(finish, d2 + 300)); return; }
        finish();
      }
    });
  }
  function setAuto(on) { auto = on; var b = $('autoBtn'); b.classList.toggle('on', on); b.textContent = on ? '⏸ עצירה' : '▶ הקראה'; }
  $('autoBtn').addEventListener('click', function () {
    snd('tap');
    if (auto) { setAuto(false); stopRead(); try { Voice.silence(); } catch (e) {} highlight(-1); }
    else { setAuto(true); readPage(); }
  });
  $('transBtn').addEventListener('click', function () { showTrans = !showTrans; var t = document.querySelector('.trans'); if (t) t.classList.toggle('hide', !showTrans); snd('tap'); });
  function goNext(fromAuto) {
    if (idx < cur.pages.length - 1) { idx++; snd('pop'); renderPage(true); if (auto) readPage(); return; }
    setAuto(false); stopRead(); openQuiz();
  }
  $('nextBtn').addEventListener('click', function () { if (!auto) stopRead(); goNext(false); });
  $('prevBtn').addEventListener('click', function () { if (idx === 0) return; idx--; snd('pop'); renderPage(true); if (auto) readPage(); });
  $('backBtn').addEventListener('click', backToShelf);
  function backToShelf() {
    stopRead(); setAuto(false); try { Voice.silence(); } catch (e) {}
    $('quiz').classList.remove('show'); $('readScreen').classList.remove('show'); $('libScreen').classList.add('show');
    renderShelf(); snd('bubble');
    if (location.hash) history.replaceState(null, '', location.pathname);
  }

  /* ---------- פרק 5 — שאלת הבנה ---------- */
  function openQuiz() {
    var q = cur.quiz, order = q.o.map(function (_, i) { return i; }).sort(function () { return Math.random() - .5; });
    var card = $('quizCard');
    card.innerHTML = '<span class="h-modal-kicker">🧠 שאלת גיבורים</span><h2>' + q.q + '</h2><div class="opts">' +
      order.map(function (i) { return '<button class="opt" type="button" data-i="' + i + '">' + q.o[i] + '</button>'; }).join('') + '</div>';
    $('quiz').classList.add('show');
    say(q.q + ' ' + order.map(function (i) { return q.o[i]; }).join(', '));
    card.querySelectorAll('.opt').forEach(function (b) {
      b.addEventListener('click', function () {
        if (+b.dataset.i !== q.a) { b.classList.add('wrong'); snd('sad'); say('כמעט! נסי תשובה אחרת.'); return; }
        b.classList.add('right'); snd('happy');
        setTimeout(function () { finishStory(b); }, 500);
      });
    });
  }
  function finishStory(origin) {
    var first = !D.read[cur.id];
    D.read[cur.id] = Date.now(); save();
    /* תעודות: כל 5 סיפורים, וסיום כל פרקי ההרפתקאות */
    if (window.Share) {
      var nRead = Object.keys(D.read).length;
      if (first && nRead % 5 === 0) Share.award({ key: 'stories:' + nRead, line: 'קראה ' + nRead + ' סיפורים', ico: '📚' });
      else if (first && cur.series && cur.ep === STORIES.EPISODES) Share.award({ key: 'series:ella', line: 'קראה את כל הרפתקאות אלה', ico: '🦸‍♀️' });
    }
    try { if (window.Progress) Progress.track('story:read'); } catch (e) {}
    try { if (window.HeroRewards) { HeroRewards.award(first ? 2 : 1, origin, { word: 'קראת!' }); HeroRewards.confetti(); } } catch (e) {}
    if (first && typeof Wallet !== 'undefined') Wallet.add(5);
    var hero = window.HeroAvatar ? HeroAvatar.svg(window.HeroRewards ? HeroRewards.outfit : null) : '🦸‍♀️';
    var nextEp = cur.series ? LIST.filter(function (s) { return s.series === cur.series && s.ep === cur.ep + 1; })[0] : null;
    $('quizCard').innerHTML = '<span class="h-modal-kicker">⭐ כל הכבוד!</span><div class="end-hero">' + hero + '</div><h2>קראת את הסיפור עד הסוף!</h2>' +
      '<p style="font-weight:800;color:var(--h-text-soft);margin-bottom:10px">' + (first ? '🪙 +5 מטבעות · ⚡ אנרגיה · 🍎🍎 לחיית המחמד' : '⚡ אנרגיה · 🍎🍎 לחיית המחמד') + '</p>' +
      (nextEp && !episodeOpen(nextEp) ? '<p style="font-weight:800">📜 הפרק הבא ייפתח כשתשלימי את משימת היום!</p>' : '') +
      '<div class="h-modal-actions">' + (nextEp && episodeOpen(nextEp) ? '<button class="h-btn gold" type="button" id="nextEpBtn">לפרק הבא ▶</button>' : '') +
      '<button class="h-btn cyan" type="button" id="againBtn">🔁 שוב</button><button class="h-btn violet" type="button" id="shelfBtn">📚 לספרייה</button></div>';
    say('כל הכבוד! קראת את הסיפור עד הסוף!');
    $('shelfBtn').onclick = backToShelf;
    $('againBtn').onclick = function () { $('quiz').classList.remove('show'); openStory(cur); };
    if ($('nextEpBtn')) $('nextEpBtn').onclick = function () { $('quiz').classList.remove('show'); openStory(nextEp); };
  }

  /* ---------- פרק 6 — אתחול ---------- */
  renderShelf();
  /* קישור ישיר לסיפור לפי מזהה (למשל stories.html#hol-hanukkah מסרט החג) */
  var mh = location.hash.match(/^#([a-z][\w-]+)$/), direct = mh && LIST.filter(function (x) { return x.id === mh[1] && !x.series; })[0];
  if (direct) { tab = direct.lang; document.querySelectorAll('.tab').forEach(function (x) { x.classList.toggle('on', x.dataset.t === tab); }); renderShelf(); setTimeout(function () { openStory(direct); }, 300); }
  var m = location.hash.match(/^#ep(\d+)$/);
  if (m) {
    var s = LIST.filter(function (x) { return x.series === 'ella' && x.ep === +m[1]; })[0];
    tab = 'ella'; document.querySelectorAll('.tab').forEach(function (x) { x.classList.toggle('on', x.dataset.t === 'ella'); }); renderShelf();
    if (s && episodeOpen(s)) setTimeout(function () { openStory(s); }, 300);
  }
  window.StoryApp = { open: function (id) { var s = LIST.filter(function (x) { return x.id === id; })[0]; if (s) openStory(s); }, state: function () { return { cur: cur && cur.id, idx: idx, auto: auto }; } };
})();
