/* =====================================================================
   js/ride-data.js — תוכן משחק הרכיבה (נתונים בלבד, בלי DOM)
   ---------------------------------------------------------------------
   פרק 1 — TRACKS: 6 מסלולים (שמיים, קרקע, דרך, נוף בצדדים, מכשולים וקצב). בגרסת הבנים: מדבר וטורניר אבירים
   פרק 2 — TRICKS: 5 טריקים (אימוג'י, שם, ניקוד, באוויר / על הקרקע, איזה מסלול פותח אותם)
   פרק 3 — שערי למידה: צבעים ("Ride to the red gate!"), מילים ("Where is the apple?"), חשבון (לפי שכבת הגיל)
   פרק 4 — englishLines(): כל המשפטים באנגלית ל-tools/gen_voice.py (הקלטה רגילה + איטית)
   ===================================================================== */
(function (root) {
  'use strict';
  var BOY = !!(root && root.RIDE_BOY);

  /* ---------- פרק 1 — מסלולים ----------
     sky: 3 צבעים מלמעלה למטה · grass: 2 צבעי דשא (פסים) · road: 2 צבעי שביל · edge: שוליים · side: אימוג'י בצידי הדרך
     obs: מכשולים אפשריים · curve: כמה המסלול מתפתל · hills: גבעות · night: כוכבים */
  var TRACKS = [
    { id: 'meadow', name: 'שדה הפרחים', ico: '🌼', sky: ['#7fd0ff', '#b9e8ff', '#fff3d6'], grass: ['#8ee07a', '#7fd66b'], road: ['#e8c9a0', '#dfbd92'], edge: '#ffffff', side: ['🌼', '🌷', '🌳', '🦋', '🌻'], obs: ['fence', 'hay', 'log'], curve: .6, hills: .3 },
    { id: 'forest', name: 'היער הקסום', ico: '🌲', sky: ['#5fb8e8', '#9fdcc0', '#e6ffe0'], grass: ['#4fbf5a', '#44b04f'], road: ['#c9a36a', '#bf9960'], edge: '#8a6440', side: ['🌲', '🌳', '🍄', '🦊', '🌲'], obs: ['log', 'rock', 'fence', 'bush'], curve: 1, hills: .5 },
    BOY ? { id: 'desert', name: 'מרוץ המדבר', ico: '🌵', sky: ['#ffb36b', '#ffd79a', '#fff0cf'], grass: ['#f3cf8a', '#ebc47c'], road: ['#d9a86a', '#cf9d60'], edge: '#b87a40', side: ['🌵', '🪨', '🌵', '🦎', '🏜️'], obs: ['rock', 'log', 'cactus', 'fence'], curve: .9, hills: .7 }
        : { id: 'beach', name: 'דהירה בחוף', ico: '🏖️', sky: ['#4fc3ff', '#9fe0ff', '#fff6dc'], grass: ['#ffe7a8', '#ffe09a'], road: ['#f7d99a', '#efcf8e'], edge: '#5fd3ff', side: ['🌴', '🐚', '⛱️', '🦀', '🌴'], obs: ['puddle', 'rock', 'hay'], curve: .7, hills: .2 },
    { id: 'sunset', name: 'רכיבה בשקיעה', ico: '🌅', sky: ['#5a2a8f', '#ff6f91', '#ffc27a'], grass: ['#c98b4f', '#b97f47'], road: ['#f0b87a', '#e6ad70'], edge: '#ffd9a0', side: ['🌾', '🌳', '🌻', '🐦', '🌾'], obs: ['fence', 'log', 'hay', 'puddle'], curve: .9, hills: .6 },
    { id: 'snow', name: 'ארץ השלג', ico: '❄️', sky: ['#9fc7ff', '#d6e9ff', '#ffffff'], grass: ['#ffffff', '#eef6ff'], road: ['#cfe0f5', '#c4d7ee'], edge: '#9fc7ff', side: ['🌲', '⛄', '❄️', '🐧', '🌲'], obs: ['log', 'rock', 'fence', 'bush'], curve: 1.1, hills: .8, snow: true },
    BOY ? { id: 'arena', name: 'טורניר האבירים', ico: '🏰', sky: ['#3d7bff', '#9fc7ff', '#e8f3ff'], grass: ['#5fb84f', '#55ab46'], road: ['#e8c9a0', '#dfbd92'], edge: '#ff3b3b', side: ['🚩', '🏰', '🛡️', '🎺', '🚩'], obs: ['fence', 'fence', 'log', 'hay'], curve: .5, hills: .1, contest: true }
        : { id: 'arena', name: 'תחרות הקפיצות', ico: '🏆', sky: ['#7fd0ff', '#b9e8ff', '#fff3d6'], grass: ['#5fb84f', '#55ab46'], road: ['#e8c9a0', '#dfbd92'], edge: '#ff5ca8', side: ['🎪', '🚩', '🌸', '🎺', '🚩'], obs: ['fence', 'fence', 'log', 'hay'], curve: .5, hills: .1, contest: true }
  ];

  /* ---------- פרק 2 — טריקים ----------
     [מזהה, אימוג'י, שם, ניקוד, air (רק באוויר) / ground (רק על הקרקע), נפתח אחרי מסלול n (0 = מההתחלה)] */
  var TRICKS = [
    ['jump', '⬆️', 'קפיצה', 1, 'ground', 0],
    ['spin', '🌀', 'סיבוב באוויר', 3, 'air', 0],
    ['rear', '🐴', 'עמידה על שתיים', 2, 'ground', 1],
    [BOY ? 'lasso' : 'flowers', BOY ? '🤠' : '🌸', BOY ? 'לאסו' : 'קשת פרחים', 3, 'air', 2],
    ['star', '⭐', 'כוכב נופל', 4, 'air', 3]
  ];

  /* ---------- פרק 3 — שערי למידה ---------- */
  var COLORS = [['red', '#ff3b3b', 'אדום'], ['blue', '#3d7bff', 'כחול'], ['yellow', '#ffd93c', 'צהוב'], ['green', '#2fb85a', 'ירוק'], ['pink', '#ff5ca8', 'ורוד'], ['purple', '#9b5cff', 'סגול'], ['orange', '#ff8a3c', 'כתום']];
  var ITEMS = [['apple', '🍎', 'תפוח'], ['carrot', '🥕', 'גזר'], ['banana', '🍌', 'בננה'], ['horse', '🐴', 'סוס'], ['cat', '🐱', 'חתול'], ['dog', '🐶', 'כלב'], ['fish', '🐟', 'דג'], ['star', '⭐', 'כוכב'], ['flower', '🌸', 'פרח'], ['sun', '☀️', 'שמש']];
  function colorLine(c) { return 'Ride to the ' + c + ' gate!'; }
  function itemLine(w) { return 'Where is the ' + w + '?'; }

  /* ---------- פרק 4 — שורות לקול ---------- */
  function englishLines() {
    var out = ['Jump!', 'Spin!', 'Stand up!', 'Gallop!', 'Whoa!', 'Good horse!', 'Yee-haw!', 'fence', 'gate', 'Ride to the gate!', 'Great riding!', 'hay', 'saddle', 'brush', 'hoof', 'mane'];
    COLORS.forEach(function (c) { out.push(colorLine(c[0])); out.push(c[0]); });
    ITEMS.forEach(function (i) { out.push(itemLine(i[0])); out.push(i[0]); });
    return out;
  }

  root.RideData = { TRACKS: TRACKS, TRICKS: TRICKS, COLORS: COLORS, ITEMS: ITEMS, colorLine: colorLine, itemLine: itemLine, englishLines: englishLines, BOY: BOY };
})(typeof window !== 'undefined' ? window : this);
