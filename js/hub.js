/* =====================================================================
   js/hub.js — מטה הגיבורים (מסך הבית של העולם של אלה)
   ---------------------------------------------------------------------
   גרסה 2026: מסך HTML/CSS קל (בלי Phaser) — נטען מהר יותר באייפד.
   פרק 1 — כוכבים ברקע
   פרק 2 — הגיבורה: ציור לפי התחפושת השמורה + עדכון כשמחליפים תחפושת
   פרק 3 — פתיח קולנועי ("ההשתנות") — פעם אחת בכל פתיחה
   פרק 4 — כרטיסי משימה: ניווט עם אפקט
   פרק 5 — סרגל עליון: HUD, ארון תחפושות, חנות שדרוגים, אזור הורים, צליל
   פרק 6 — משימות היום: 3 משימות → פרס + פרק חדש ב"הרפתקאות אלה"
   פרק 7 — נבל השבוע (כרטיס) וחיית המחמד (מרחפת ליד הגיבורה)
   תלויות: audio.js (Sound/Voice), kids-ui.js, wallet.js, hero-avatar.js, hero-rewards.js,
           progress.js, pet.js, parents.js, voice-settings.js
   ===================================================================== */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  /* ---------- פרק 1 — כוכבים מנצנצים בשמיים ---------- */
  var sky = $('sky');
  for (var i = 0; i < 38; i++) {
    var s = document.createElement('i');
    s.className = 'h-star';
    s.style.left = (Math.random() * 100) + '%';
    s.style.top = (Math.random() * 62) + '%';
    s.style.animationDelay = (Math.random() * 2.6) + 's';
    if (Math.random() < .3) { s.style.width = s.style.height = '6px'; }
    sky.appendChild(s);
  }

  /* ---------- פרק 2 — הגיבורה ---------- */
  var heroEl = $('hero');
  /* drawHero — מצייר את הדמות הפעילה מהצוות + שלט השם שלה */
  function drawHero() {
    heroEl.innerHTML = HeroAvatar.svg(HeroRewards.outfit);
    var h = HeroRewards.hero;
    $('nameplate').textContent = h.name + (h.g === 'f' ? ' · גיבורת-העל' : ' · גיבור-העל');
  }
  drawHero();
  /* כשמלבישים פריט חדש (בארון / בחלון רמה) — מציירים מחדש עם אפקט "זאפ" */
  window.addEventListener('hero:outfit', function () {
    drawHero();
    heroEl.classList.remove('zap'); void heroEl.offsetWidth; heroEl.classList.add('zap');
  });
  /* נגיעה בגיבורה: קפיצה + משפט עידוד */
  var LINES = ['בואי נלמד משהו חדש!', 'כל תשובה נותנת לי אנרגיה!', 'יש לי כוחות-על!'];
  heroEl.addEventListener('click', function () {
    heroEl.classList.remove('zap'); void heroEl.offsetWidth; heroEl.classList.add('zap');
    Sound.sparkle();
    /* כל דמות בצוות אומרת את המשפט שלה (או משפט עידוד) */
    Voice.say(Math.random() < .5 ? HeroRewards.hero.say : LINES[(Math.random() * LINES.length) | 0]);
  });

  /* ---------- פרק 3 — פתיח קולנועי ---------- */
  var intro = $('intro');
  $('introHero').innerHTML = HeroAvatar.svg(HeroRewards.outfit);
  var seen = false;
  try { seen = sessionStorage.getItem('ella-intro-seen') === '1'; } catch (e) {}
  if (seen) {
    intro.remove();
  } else {
    intro.addEventListener('click', function () {
      /* הלחיצה הראשונה פותחת את מנוע השמע (חובה ב-iOS) */
      Sound.unlock();
      Sound.ding();
      var f = document.createElement('div'); f.className = 'flash'; document.body.appendChild(f);
      setTimeout(function () { f.remove(); }, 750);
      intro.classList.add('gone');
      setTimeout(function () { intro.remove(); }, 520);
      try { sessionStorage.setItem('ella-intro-seen', '1'); } catch (e) {}
      setTimeout(function () { Voice.say('שלום אלה גיבורת-העל! לאן טסים היום?'); }, 400);
    }, { once: true });
  }
  /* אם הפתיח כבר נצפה — פותחים שמע במגע הראשון */
  document.addEventListener('pointerdown', function () { Sound.unlock(); }, { once: true });

  /* ---------- פרק 4 — כרטיסי משימה ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.mission'), function (card) {
    card.addEventListener('click', function () {
      Sound.happy();
      Voice.say(card.dataset.say);
      HeroRewards.pow(card, 'טסים!');   // פיצוץ ויזואלי בלבד — אנרגיה מרוויחים רק בלמידה
      setTimeout(function () { KidsUI.PageFade.go(card.dataset.go); }, 380);
    });
  });

  /* ---------- פרק 5 — סרגל עליון ---------- */
  HeroRewards.mountHUD($('hudSlot'));

  /* 5.0 תיבת הפתעה יומית — מופיעה רק אם עוד לא נפתחה היום */
  var giftBtn = $('giftBtn');
  if (HeroRewards.giftAvailable()) giftBtn.hidden = false;
  giftBtn.addEventListener('click', function () { if (HeroRewards.claimGift(giftBtn)) giftBtn.hidden = true; });

  $('wardrobeBtn').addEventListener('click', function () {
    Sound.tap(); Voice.say('ארון התחפושות!');
    HeroRewards.openWardrobe();
  });

  /* כפתור צליל: מצב מוצג לפי Sound.isOn */
  var soundBtn = $('soundBtn');
  soundBtn.addEventListener('click', function () {
    var on = Sound.toggle();
    soundBtn.querySelector('.ico').textContent = on ? '🔊' : '🔇';
  });

  /* 5.1 חנות השדרוגים (אותם פריטים ואותו ארנק כמו קודם — Wallet.ITEMS) */
  $('shopBtn').addEventListener('click', function () {
    Sound.tap(); Voice.say('עגלת השדרוגים!');
    openShop();
  });
  function openShop() {
    var m = document.createElement('div');
    m.className = 'h-modal show';
    var card = document.createElement('div');
    card.className = 'h-modal-card h-panel shop-card';
    m.appendChild(card); document.body.appendChild(m);
    function render() {
      card.innerHTML = '<button type="button" class="shop-close" aria-label="סגירה">✖</button>' +
        '<span class="h-modal-kicker">🛒 עגלת השדרוגים</span>' +
        '<h2 style="font-size:28px;margin-top:10px">יש לך 🪙 ' + Wallet.coins + '</h2>' +
        '<div class="shop-grid">' + Wallet.ITEMS.map(function (it) {
          var lvl = Wallet.lvl(it.id), max = it.costs.length, cost = Wallet.nextCost(it.id);
          var status = max > 1 ? 'רמה ' + lvl + '/' + max : '';
          var action = cost === null ? '<span class="owned">✓ שלי!</span>'
            : '<button type="button" class="h-btn ' + (Wallet.coins >= cost ? 'gold' : 'violet') + '" data-buy="' + it.id + '">🪙 ' + cost + '</button>';
          return '<div class="shop-item"><span class="ico">' + it.ico + '</span><b>' + it.name + '</b><small>' + it.desc + (status ? ' · ' + status : '') + '</small>' + action + '</div>';
        }).join('') + '</div>';
      card.querySelector('.shop-close').onclick = function () { Sound.tap(); m.remove(); HeroRewards.refresh(); };
      Array.prototype.forEach.call(card.querySelectorAll('[data-buy]'), function (b) {
        b.onclick = function () {
          if (Wallet.buy(b.dataset.buy)) { Sound.cha_ching(); Voice.praise(); HeroRewards.confetti(); render(); HeroRewards.refresh(); }
          else { Sound.sad(); Voice.say('צריך עוד קצת מטבעות!'); }
        };
      });
    }
    render();
  }

  /* 5.2 אזור הורים (שער הורים → לוח מעקב וזמן מסך) */
  $('parentsBtn').addEventListener('click', function () { Sound.tap(); if (window.Parents) Parents.open(); });

  /* ---------- פרק 6 — משימות היום ---------- */
  function renderQuests() {
    if (!window.Progress) return;
    var qs = Progress.questsToday(), done = qs.filter(function (q) { return q.done; }).length, claimed = Progress.dailyClaimed();
    $('questCount').textContent = claimed ? '✓ הושלם!' : done + '/3';
    $('questList').innerHTML = qs.map(function (q) { return '<span class="q-chip' + (q.done ? ' done' : '') + '">' + q.ico + ' ' + (q.done ? '✓' : q.v + '/' + q.n) + '</span>'; }).join('');
    $('questBtn').classList.toggle('ready', done === 3 && !claimed);
  }
  function openQuests() {
    var qs = Progress.questsToday(), all = qs.every(function (q) { return q.done; }), claimed = Progress.dailyClaimed();
    var html = '<span class="h-modal-kicker">📜 משימות היום</span><h2>' + (claimed ? 'כל המשימות הושלמו! 🎉' : all ? 'השלמת הכול! מגיע לך פרס!' : 'שלוש משימות — ופרס גדול') + '</h2>' +
      '<p>' + (claimed ? 'מחר מחכות משימות חדשות. פרק חדש כבר מחכה בספרייה!' : 'בסיום: 🪙 10 מטבעות, אנרגיה, ופרק חדש ב"הרפתקאות אלה"') + '</p><div class="q-rows">' +
      qs.map(function (q) {
        return '<div class="q-row' + (q.done ? ' done' : '') + '"><span class="qi">' + q.ico + '</span><div><b>' + q.t + '</b><div class="h-meter"><div class="h-meter-fill" style="width:' + (q.v / q.n * 100) + '%"></div></div></div>' +
          (q.done ? '<span style="font-size:30px">✅</span>' : '<button type="button" class="h-btn cyan" data-go="' + q.go + '">יאללה!</button>') + '</div>';
      }).join('') + '</div>';
    var buttons = [];
    if (all && !claimed) buttons.push({ text: '🎁 לקבל את הפרס!', cls: 'h-btn gold', fn: claim });
    else if (claimed) buttons.push({ text: '📖 לספרייה', cls: 'h-btn gold', fn: function () { KidsUI.PageFade.go('./stories.html#ep' + Math.min(STORY_EPS, Progress.storyEpisode() + 1)); } });
    buttons.push({ text: 'סגירה', cls: 'h-btn violet', fn: function () {} });
    var m = HeroRewards.openModal(html, buttons);
    m.querySelectorAll('[data-go]').forEach(function (b) {
      b.addEventListener('click', function () {
        Sound.happy(); var go = b.dataset.go;
        if (go.indexOf('#pet') >= 0) { m.remove(); if (window.Pet) Pet.open(); return; }
        KidsUI.PageFade.go(go);
      });
    });
    Voice.say(claimed ? 'כל המשימות הושלמו!' : 'משימות היום: ' + qs.map(function (q) { return q.t; }).join('. '));
  }
  var STORY_EPS = 7;
  /* claim — פרס משימות היום: מטבעות + אנרגיה + פתיחת פרק בסיפור */
  function claim() {
    var ep = Progress.claimDaily(); if (!ep) return;
    Wallet.add(10); HeroRewards.award(2, $('questBtn'), { word: 'משימה!' }); HeroRewards.confetti(); Sound.cha_ching();
    var epNum = Math.min(STORY_EPS, ep + 1);
    setTimeout(function () {
      HeroRewards.openModal('<span class="h-modal-kicker">🎁 פרס משימות היום</span><div style="font-size:84px;line-height:1.1;margin:8px 0">📖✨</div><h2>פרק ' + epNum + ' בהרפתקאות אלה נפתח!</h2><p>🪙 +10 מטבעות · ⚡ אנרגיה</p>',
        [{ text: 'לקרוא עכשיו! 📖', cls: 'h-btn gold', fn: function () { KidsUI.PageFade.go('./stories.html#ep' + epNum); } }, { text: 'אחר כך', cls: 'h-btn violet', fn: function () {} }]);
      Voice.say('כל הכבוד! פרק חדש בהרפתקאות אלה נפתח בספרייה!');
    }, 1400);
    renderQuests();
  }
  $('questBtn').addEventListener('click', function () { Sound.tap(); openQuests(); });
  renderQuests();
  window.addEventListener('progress:track', renderQuests);

  /* ---------- פרק 7 — נבל השבוע + חיית המחמד ---------- */
  if (window.Progress) {
    var b = Progress.boss();
    $('bossIco').textContent = b.villain.ico; $('bossName').textContent = b.villain.name;
    if (b.won) { $('bossCard').classList.add('won'); $('bossTag').textContent = '🏆 ניצחת!'; $('bossText').textContent = 'נבל חדש בשבוע הבא'; }
    else $('bossText').textContent = '❤️ ' + b.hp + '/' + b.max + ' — מנצחים בתשובות!';
  }
  if (window.Pet) {
    Pet.mini($('heroStack'), { size: Math.round(Math.min(innerWidth * .09, innerHeight * .15)) });
    if (location.hash === '#pet') setTimeout(Pet.open, 500);
  }

  /* ניקוי מחוות מערכת (תפריט לחיצה ארוכה, זום בצביטה) */
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
})();
