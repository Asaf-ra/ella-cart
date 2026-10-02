/* =====================================================================
   js/cars-data.js — תוכן משחק המכוניות (נתונים בלבד, בלי DOM) — שלב 16
   ---------------------------------------------------------------------
   פרק 1 — CARS: 6 מכוניות (צבעים, סוג, מחיר במטבעות, מהירות, המילה באנגלית). בגרסת הבנים: מונסטר טראק; בבנות: משאית גלידה
   פרק 2 — TRACKS: 5 מסלולים (עיר, כביש מהיר, מדבר, שלג, עיר בלילה) — שמיים, צדדים, כביש, נוף, מכשולים, קצב, אירועי למידה
   פרק 3 — למידה: צבעים ("Drive to the red gate!"), כלי רכב ("Where is the bus?"), ספירה ("How many cones?"), חשבון, תמרורים ורמזור
   פרק 4 — SAFETY: עובדות בטיחות בדרכים שמופיעות בתחנת הדלק ("הידעת?")
   פרק 5 — englishLines(): כל המשפטים באנגלית (ל-tools/gen_voice.py — הקלטה רגילה + איטית)
   ===================================================================== */
(function (root) {
  'use strict';
  var BOY = !!(root && root.CARS_BOY);

  /* ---------- פרק 1 — מכוניות ----------
     id · שם · צבע גוף · צבע משני · סוג ציור (sport/police/taxi/fire/monster/race/icecream) · מחיר · בונוס מהירות · מילה באנגלית · פירוש · אימוג'י לכרטיס */
  var CARS = [
    { id: 'sport', name: 'מכונית ספורט', body: '#ff3b3b', acc: '#ffffff', kind: 'sport', cost: 0, speed: 1.0, en: 'sports car', he: 'מכונית ספורט', ico: '🏎️' },
    { id: 'police', name: 'ניידת משטרה', body: '#2f6bff', acc: '#ffffff', kind: 'police', cost: 0, speed: .98, en: 'police car', he: 'ניידת משטרה', ico: '🚓' },
    { id: 'taxi', name: 'מונית', body: '#ffd93c', acc: '#101e36', kind: 'taxi', cost: 0, speed: .95, en: 'taxi', he: 'מונית', ico: '🚕' },
    { id: 'fire', name: 'כבאית', body: '#e0162b', acc: '#ffd93c', kind: 'fire', cost: 30, speed: .96, en: 'fire truck', he: 'כבאית', ico: '🚒' },
    BOY ? { id: 'monster', name: 'מונסטר טראק', body: '#2fb85a', acc: '#101e36', kind: 'monster', cost: 50, speed: 1.04, en: 'monster truck', he: 'מונסטר טראק', ico: '🛻' }
        : { id: 'icecream', name: 'משאית גלידה', body: '#ff8fc4', acc: '#9fe0ff', kind: 'icecream', cost: 50, speed: 1.02, en: 'ice cream truck', he: 'משאית גלידה', ico: '🍦' },
    { id: 'race', name: 'מכונית מרוץ', body: '#9b5cff', acc: '#ffc93c', kind: 'race', cost: 80, speed: 1.1, en: 'race car', he: 'מכונית מרוץ', ico: '🏁' }
  ];

  /* ---------- פרק 2 — מסלולים ----------
     sky: 3 צבעים · side: 2 צבעי שוליים (פסים) · road: 2 צבעי אספלט · edge: קו שוליים · scenery: אימוג'י בצדדים
     obs: מכשולים אפשריים (cone / oil / car / puddle) · curve · hills · night (פנסים) · lights: רמזורים · fuel: תחנות דלק */
  var TRACKS = [
    { id: 'city', name: 'העיר', ico: '🏙️', sky: ['#7fd0ff', '#b9e8ff', '#fff3d6'], side: ['#b9b9c9', '#a9a9bb'], road: ['#4a4a5e', '#555569'], edge: '#ffffff', scenery: ['🏢', '🏠', '🌳', '🏪', '🚏', '🏫'], obs: ['cone', 'car', 'puddle'], curve: .6, hills: .1, lights: true, fuel: true },
    { id: 'highway', name: 'הכביש המהיר', ico: '🛣️', sky: ['#5fb8e8', '#9fdcc0', '#e6ffe0'], side: ['#8ee07a', '#7fd66b'], road: ['#4a4a5e', '#555569'], edge: '#ffd93c', scenery: ['🌳', '🌲', '🏭', '🌾', '🛻', '🌳'], obs: ['car', 'car', 'cone', 'oil'], curve: .4, hills: .4, fast: true, fuel: true },
    { id: 'desert', name: 'ראלי במדבר', ico: '🏜️', sky: ['#ffb36b', '#ffd79a', '#fff0cf'], side: ['#f3cf8a', '#ebc47c'], road: ['#c9a36a', '#bf9960'], edge: '#b87a40', scenery: ['🌵', '🪨', '🐪', '🌵', '🏜️', '🦎'], obs: ['cone', 'oil', 'puddle', 'car'], curve: 1.0, hills: .8, fuel: true },
    { id: 'snow', name: 'כביש השלג', ico: '❄️', sky: ['#9fc7ff', '#d6e9ff', '#ffffff'], side: ['#ffffff', '#eef6ff'], road: ['#9fb4cc', '#93a9c2'], edge: '#5fb8ff', scenery: ['🌲', '⛄', '🏔️', '🐧', '🌲', '🏠'], obs: ['oil', 'cone', 'car', 'puddle'], curve: 1.1, hills: .6, snow: true, slippery: true, fuel: true },
    { id: 'night', name: 'העיר בלילה', ico: '🌃', sky: ['#0b1a4a', '#2a1a6a', '#5a2a8f'], side: ['#2a2a44', '#242438'], road: ['#2e2e42', '#36364c'], edge: '#29e0ff', scenery: ['🏙️', '🌆', '🏢', '🎡', '🌃', '🏨'], obs: ['car', 'cone', 'oil'], curve: .8, hills: .2, night: true, lights: true, fuel: true, contest: true }
  ];

  /* ---------- פרק 3 — למידה ---------- */
  var COLORS = [['red', '#ff3b3b', 'אדום'], ['blue', '#3d7bff', 'כחול'], ['yellow', '#ffd93c', 'צהוב'], ['green', '#2fb85a', 'ירוק'], ['orange', '#ff8a3c', 'כתום'], ['purple', '#9b5cff', 'סגול'], ['white', '#ffffff', 'לבן'], ['black', '#2a2a3a', 'שחור']];
  var VEHICLES = [['bus', '🚌', 'אוטובוס'], ['truck', '🚚', 'משאית'], ['ambulance', '🚑', 'אמבולנס'], ['police car', '🚓', 'ניידת משטרה'], ['fire truck', '🚒', 'כבאית'], ['tractor', '🚜', 'טרקטור'], ['bicycle', '🚲', 'אופניים'], ['motorcycle', '🏍️', 'אופנוע'], ['train', '🚆', 'רכבת'], ['airplane', '✈️', 'מטוס'], ['boat', '⛵', 'סירה'], ['helicopter', '🚁', 'מסוק']];
  function colorLine(c) { return 'Drive to the ' + c + ' gate!'; }
  function vehicleLine(v) { return 'Where is the ' + v + '?'; }
  var COUNT_LINE = 'How many cones?';
  /* תמרורים שמופיעים בצד הדרך (מילה באנגלית + מה עושים) — נלמדים כשעוברים לידם */
  var SIGNS = [['stop', 'Stop!', 'תמרור עצור — עוצרים ומסתכלים'], ['crosswalk', 'Crosswalk!', 'מעבר חצייה — מאטים'], ['school', 'School!', 'בית ספר — ילדים בדרך, לאט'], ['fuel', 'Gas station!', 'תחנת דלק']];
  /* רמזור: אדום (עוצרים — לוחצים ברקס) → ירוק (נוסעים) */
  var LIGHT = { red: 'Red light! Stop!', yellow: 'Yellow light! Get ready!', green: 'Green light! Go!' };

  /* ---------- פרק 4 — בטיחות בדרכים ("הידעת?" בתחנת הדלק) ---------- */
  var SAFETY = [
    ['🪢', 'חגורת בטיחות תמיד', 'גם בנסיעה קצרה — כולם חוגרים לפני שהמכונית זזה. גיבורים חוגרים!'],
    ['🚦', 'אדום עוצרים, ירוק נוסעים', 'וצהוב אומר: עוד רגע מתחלף — מתכוננים'],
    ['🦓', 'מעבר חצייה — עוצרים להולכי רגל', 'הנהג מאט ליד הפסים הלבנים, והולכי הרגל עוברים קודם'],
    ['👀', 'חוצים כביש? מסתכלים שמאלה, ימינה ושוב שמאלה', 'ומחכים שהמכוניות יעצרו לגמרי לפני שחוצים'],
    ['🪖', 'קסדה על אופניים וקורקינט', 'הקסדה שומרת על הראש — כמו שריון של גיבור'],
    ['🚗', 'ילדים יושבים מאחור במושב בטיחות', 'המושב מותאם לגודל שלנו ומגן הרבה יותר'],
    ['📵', 'הנהג לא מסתכל בטלפון', 'שתי עיניים על הכביש, שתי ידיים על ההגה'],
    ['🌧️', 'בגשם ובשלג נוסעים לאט', 'הכביש חלק והמכונית צריכה יותר מקום כדי לעצור'],
    ['⛽', 'מתדלקים לפני שהדלק נגמר', 'מחוג הדלק באדום = זמן לתחנה. בלי דלק המכונית עוצרת']
  ];

  /* ---------- פרק 5 — שורות לקול ---------- */
  function englishLines() {
    var out = ['Vroom!', 'Go!', 'Brake!', 'Boost!', 'Turbo!', 'Great driving!', 'Fill up!', 'Oops!', 'Beep beep!', 'Nice turn!', COUNT_LINE, 'cone', 'cones', 'oil', 'car', 'road', 'wheel', 'gas station', 'traffic light'];
    COLORS.forEach(function (c) { out.push(colorLine(c[0])); out.push(c[0]); });
    VEHICLES.forEach(function (v) { out.push(vehicleLine(v[0])); out.push(v[0]); });
    CARS.forEach(function (c) { out.push(c.en); });
    SIGNS.forEach(function (s) { out.push(s[1]); });
    Object.keys(LIGHT).forEach(function (k) { out.push(LIGHT[k]); });
    return out;
  }

  root.CarsData = { CARS: CARS, TRACKS: TRACKS, COLORS: COLORS, VEHICLES: VEHICLES, SIGNS: SIGNS, LIGHT: LIGHT, SAFETY: SAFETY, COUNT_LINE: COUNT_LINE, colorLine: colorLine, vehicleLine: vehicleLine, englishLines: englishLines, BOY: BOY };
})(typeof window !== 'undefined' ? window : this);
