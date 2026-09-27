/* =====================================================================
   js/hub.js — מטה הגיבורים (מסך הבית של העולם של אלה)
   ---------------------------------------------------------------------
   גרסה 2026: מסך HTML/CSS קל (בלי Phaser) — נטען מהר יותר באייפד.
   פרק 1 — כוכבים ברקע
   פרק 2 — הגיבורה: ציור לפי התחפושת השמורה + עדכון כשמחליפים תחפושת
   פרק 3 — פתיח קולנועי ("ההשתנות") — פעם אחת בכל פתיחה
   פרק 4 — כרטיסי משימה: ניווט עם אפקט
   פרק 5 — סרגל עליון: HUD, ארון תחפושות, חנות שדרוגים, צליל
   תלויות: audio.js (Sound/Voice), kids-ui.js, wallet.js, hero-avatar.js, hero-rewards.js
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
  function drawHero() { heroEl.innerHTML = HeroAvatar.svg(HeroRewards.outfit); }
  drawHero();
  /* כשמלבישים פריט חדש (בארון / בחלון רמה) — מציירים מחדש עם אפקט "זאפ" */
  window.addEventListener('hero:outfit', function () {
    drawHero();
    heroEl.classList.remove('zap'); void heroEl.offsetWidth; heroEl.classList.add('zap');
  });
  /* נגיעה בגיבורה: קפיצה + משפט עידוד */
  var LINES = ['אני אלה גיבורת-העל!', 'בואי נלמד משהו חדש!', 'כל תשובה נותנת לי אנרגיה!', 'יש לי כוחות-על!'];
  heroEl.addEventListener('click', function () {
    heroEl.classList.remove('zap'); void heroEl.offsetWidth; heroEl.classList.add('zap');
    Sound.sparkle();
    Voice.say(LINES[(Math.random() * LINES.length) | 0]);
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

  /* ניקוי מחוות מערכת (תפריט לחיצה ארוכה, זום בצביטה) */
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
})();
