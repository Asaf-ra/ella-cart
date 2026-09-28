/* =====================================================================
   shared/profile.js — הילדות במכשיר: שם, מראה הגיבורה, רמה ויום הולדת
   חייב להיטען ראשון בכל דף (לפני כל קוד שקורא שמירות)!
   ---------------------------------------------------------------------
   פרק 1 — רשימת הילדות (ella-profiles-v1): { list: [ {id, name, look, color, grade, bday} ], last }
   פרק 2 — מי משחקת עכשיו: sessionStorage (ella-who) — בכל פתיחה של האפליקציה בוחרים מחדש
           כשיש יותר מילדה אחת
   פרק 3 — הפרדת שמירות בין אחיות: כל מפתח ella… של ילדה 2 ואילך נשמר עם קידומת p{id}:
           (הילדה הראשונה — בלי קידומת, כך שהשמירות הקיימות נשארות שלה). הקול והרשימה משותפים.
   פרק 4 — השם שלה בכל מקום: Profile.fix(text) מחליף "אלה" בשם הילדה (כולל ו/ל/ב לפני השם);
           מתקן גם טקסט שנוסף למסך (MutationObserver) ואת כותרת הדף. הקול מקבל את השם ב-js/audio.js.
           אם לילדה קוראים כמו אחת החברות (נועה, מאיה, מיצי…) — החברה מקבלת שם אחר (friendName/friendFix)
   פרק 5 — מראה הגיבורה שלה: צבע עור, תסרוקת וצבע שיער (משמש את HeroAvatar לדמות "אני")
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- פרק 1 — רשימת הילדות ---------- */
  var REG = 'ella-profiles-v1', WHO = 'ella-who';
  var SHARED = { 'ella-profiles-v1': 1, 'ella-voice-v1': 1 };   // משותפים לכל הילדות במכשיר
  var SP = Storage.prototype, rawGet = SP.getItem, rawSet = SP.setItem, rawDel = SP.removeItem;
  var LS = null; try { LS = window.localStorage; } catch (e) {}
  function readReg() { try { return JSON.parse(rawGet.call(LS, REG)) || null; } catch (e) { return null; } }
  function writeReg() { try { rawSet.call(LS, REG, JSON.stringify(R)); } catch (e) {} }
  var R = LS ? readReg() : null;
  if (R && (!R.list || !R.list.length)) R = null;

  /* ---------- פרק 2 — מי משחקת ---------- */
  var who = null; try { who = sessionStorage.getItem(WHO); } catch (e) {}
  var active = null, needChoose = false;
  if (R) {
    active = R.list.filter(function (p) { return String(p.id) === who; })[0] || null;
    if (!active) {
      needChoose = R.list.length > 1;                     // כמה ילדות ועוד לא בחרו בפתיחה הזו
      active = R.list.filter(function (p) { return p.id === R.last; })[0] || R.list[0];
    }
  }

  /* ---------- פרק 3 — הפרדת שמירות ---------- */
  var PFX = active && active.id !== 1 ? 'p' + active.id + ':' : '';
  function mapKey(store, k) { return (PFX && store === LS && typeof k === 'string' && !SHARED[k] && /^ella/.test(k)) ? PFX + k : k; }
  if (PFX) {
    SP.getItem = function (k) { return rawGet.call(this, mapKey(this, k)); };
    SP.setItem = function (k, v) { return rawSet.call(this, mapKey(this, k), v); };
    SP.removeItem = function (k) { return rawDel.call(this, mapKey(this, k)); };
  }

  /* ---------- פרק 4 — השם שלה בכל מקום ---------- */
  function wordRe(w) { return new RegExp('(^|[^\\u0590-\\u05FF])([ולב]?)' + w + '(?![\\u0590-\\u05FF])', 'g'); }
  var NAME = active ? active.name : 'אלה';
  /* מחליפים רק אם השם שונה מ"אלה" ואינו מכיל אותה (אחרת ההחלפה הייתה חוזרת על עצמה) */
  var doName = NAME !== 'אלה' && !wordRe('אלה').test(NAME);
  var RE_ELLA = wordRe('אלה');
  function fix(t) {
    if (t == null || !doName) return t;
    return String(t).replace(RE_ELLA, '$1$2' + NAME);
  }
  /* חברות בצוות ובסיפורים — אם השם שלהן זהה לשם הילדה, הן מקבלות שם חלופי (במקור, לפני התצוגה) */
  var ALT = { 'נועה': 'טליה', 'מאיה': 'שירה', 'מיצי': 'פוצי', 'רובי': 'ביפי', 'קשתית': 'זוהרית', 'בובו': 'דובי', 'בלגנון': 'בלגנוני' };
  var altTo = ALT[NAME] || null, RE_FRIEND = altTo ? wordRe(NAME) : null;
  function friendName(n) { return altTo && n === NAME ? altTo : n; }
  function friendFix(t) { return altTo && t != null ? String(t).replace(RE_FRIEND, '$1$2' + altTo) : t; }
  var active2 = doName;
  var TEST = /אלה/;
  /* data-noname — אזורים שמציגים שמות של ילדות אחרות (אשף, "מי משחקת") — לא מחליפים בהם */
  function skip(n) { var p = n.nodeType === 1 ? n : n.parentNode; return !!(p && p.closest && p.closest('[data-noname]')); }
  function fixText(n) { if (TEST.test(n.data) && !skip(n)) { var v = fix(n.data); if (v !== n.data) n.data = v; } }
  function fixEl(el) {
    if (el.nodeType === 3) { fixText(el); return; }
    if (el.nodeType !== 1 || /^(SCRIPT|STYLE|TEXTAREA|INPUT)$/.test(el.tagName) || skip(el)) return;
    ['aria-label', 'title', 'alt'].forEach(function (a) { var v = el.getAttribute && el.getAttribute(a); if (v && TEST.test(v)) el.setAttribute(a, fix(v)); });
    var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), n;
    while ((n = w.nextNode())) { var p = n.parentNode; if (p && /^(SCRIPT|STYLE|TEXTAREA)$/.test(p.tagName)) continue; fixText(n); }
  }
  function pass() { if (!active2) return; if (document.title) document.title = fix(document.title); if (document.body) fixEl(document.body); }
  if (active2 && window.MutationObserver) {
    var mo = new MutationObserver(function (ms) {
      ms.forEach(function (m) {
        if (m.type === 'characterData') fixText(m.target);
        else if (m.type === 'attributes') fixEl(m.target);
        else m.addedNodes.forEach(fixEl);
      });
    });
    var start = function () { pass(); mo.observe(document.documentElement, { childList: true, subtree: true, characterData: true }); };
    if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  }

  /* ---------- פרק 5 — מראה הגיבורה ---------- */
  var SKINS = [['#ffe2c6', '#f2c49d'], ['#f0c49b', '#dca57a'], ['#c68a5c', '#a86f45'], ['#8d5a3b', '#6e4428']];
  var HAIRS = [['#ffcf5a', '#f0a92a', 'בלונדיני'], ['#8a4b22', '#5e3014', 'חום'], ['#2b1a12', '#140a06', 'שחור'], ['#e2572b', '#b33d17', 'ג׳ינג׳י'], ['#ff7ec2', '#e0418a', 'ורוד קסום']];
  var STYLES = [['pony', 'קוקו'], ['buns', 'שתי פקעות'], ['bob', 'קארה'], ['curly', 'תלתלים'], ['braid', 'צמה']];
  /* lookFor(look) — מה ש-HeroAvatar צריך כדי לצייר את "אני": style, skin, skinD, hair, hairD */
  function lookFor(look) {
    look = look || (active && active.look) || {};
    var s = SKINS[look.skin | 0] || SKINS[0], h = HAIRS[look.hair == null ? 0 : look.hair] || HAIRS[0];
    return { style: look.style || 'pony', skin: s[0], skinD: s[1], hair: h[0], hairD: h[1] };
  }

  /* ---------- ייצוא ---------- */
  window.Profile = {
    get has() { return !!R; },                          // האם כבר הוגדרה ילדה (אחרת — אשף פתיחה)
    get list() { return R ? R.list.slice() : []; },
    get active() { return active; },
    get name() { return NAME; },
    get needChoose() { return needChoose; },
    fix: fix, pass: pass, lookFor: lookFor, friendName: friendName, friendFix: friendFix, SKINS: SKINS, HAIRS: HAIRS, STYLES: STYLES,
    /* readFor(id, key) — קריאת שמירה של ילדה מסוימת (למשל התחפושת שלה במסך "מי משחקת") */
    readFor: function (id, key) { try { return JSON.parse(rawGet.call(LS, (id === 1 ? '' : 'p' + id + ':') + key)); } catch (e) { return null; } },
    /* switchWho — חזרה למסך "מי משחקת?" */
    switchWho: function () { try { sessionStorage.removeItem(WHO); sessionStorage.removeItem('ella-intro-seen'); } catch (e) {} location.reload(); },
    /* create — ילדה חדשה (הראשונה מקבלת id 1 ואת השמירות הקיימות במכשיר) */
    create: function (p) {
      R = R || { list: [], last: 1, next: 1 };
      var id = R.next || (Math.max.apply(null, R.list.map(function (x) { return x.id; }).concat(0)) + 1);
      p = Object.assign({ name: 'אלה', look: { skin: 0, hair: 0, style: 'pony' }, color: '#ff2e93', grade: 'young', bday: null }, p, { id: id });
      R.list.push(p); R.next = id + 1; R.last = id; writeReg();
      return p;
    },
    /* update — עדכון פרטים (שם, מראה, יום הולדת) */
    update: function (id, patch) { if (!R) return; R.list.forEach(function (p) { if (p.id === id) Object.assign(p, patch); }); writeReg(); },
    /* choose — בחירת מי משחקת עכשיו (טוען מחדש כדי שכל השמירות יתחלפו) */
    choose: function (id) { try { sessionStorage.setItem(WHO, String(id)); } catch (e) {} if (R) { R.last = id; writeReg(); } location.reload(); },
    /* remove — מחיקת ילדה וכל השמירות שלה */
    remove: function (id) {
      if (!R) return;
      var pfx = id === 1 ? '' : 'p' + id + ':', keys = [];
      for (var i = 0; i < LS.length; i++) { var k = LS.key(i); if (id === 1 ? (/^ella/.test(k) && !SHARED[k]) : k.indexOf(pfx) === 0) keys.push(k); }
      keys.forEach(function (k) { rawDel.call(LS, k); });
      R.list = R.list.filter(function (p) { return p.id !== id; });
      if (!R.list.length) { rawDel.call(LS, REG); R = null; } else { if (R.last === id) R.last = R.list[0].id; writeReg(); }
      try { sessionStorage.removeItem(WHO); } catch (e) {}
    },
    /* rawKeys — כל מפתחות השמירה של הילדה הפעילה (לגיבוי) */
    exportData: function () {
      var out = {};
      for (var i = 0; i < LS.length; i++) {
        var k = LS.key(i);
        if (SHARED[k] || !/^(p\d+:)?ella/.test(k)) continue;
        var mine = PFX ? k.indexOf(PFX) === 0 : /^ella/.test(k);
        if (mine) out[PFX ? k.slice(PFX.length) : k] = rawGet.call(LS, k);
      }
      return { app: 'ella-world', v: 1, profile: active, data: out, at: new Date().toISOString() };
    },
    importData: function (obj) {
      if (!obj || obj.app !== 'ella-world' || !obj.data) return false;
      Object.keys(obj.data).forEach(function (k) { if (/^ella/.test(k) && !SHARED[k]) rawSet.call(LS, PFX + k, obj.data[k]); });
      if (obj.profile && active) this.update(active.id, { name: obj.profile.name, look: obj.profile.look, color: obj.profile.color, bday: obj.profile.bday });
      return true;
    }
  };
})();
