/* =====================================================================
   js/care-data.js — תוכן "המטבח של הדרקון" ו"מרפאת הווטרינר" (נתונים בלבד, בלי DOM)
   ---------------------------------------------------------------------
   פרק 1 — ING: מצרכים [אימוג'י, מילה באנגלית, עברית]. funny = פריט מצחיק שאסור לבשל (גרב!)
   פרק 2 — RECIPES: 8 מתכונים לפי הסדר. כל מתכון שמבשלים בפעם הראשונה פותח את הבא.
           oven = צריך לבשל על האש/בתנור אחרי הערבוב
   פרק 3 — TOOLS: כלי הווטרינר [אימוג'י, אנגלית, עברית]
   פרק 4 — PROCS: טיפולים. כל צעד: כלי, פעולה (tap = נוגעים בדרקון, rub = משפשפים),
           הוראה בעברית, ומה קורה (fx: heart / temp / plaster / blanket / sparkle / spoon)
           checkup = בדיקה שגרתית (אפשר תמיד); cold / bump / tooth / tummy = כשהדרקון לא מרגיש טוב
   פרק 4.5 — מעבדת התרופות של הרופאה: BOTTLES (צבעים ודבש), POTIONS (מתכון תרופה לכל טיפול — כמה טיפות מכל צבע),
             FUNNY (תגובות מצחיקות של הדרקון אחרי שבולע תרופה)
   פרק 5 — englishLines(): כל המילים באנגלית, ל-tools/gen_voice.py (הקלטה רגילה + איטית)
   ===================================================================== */
(function (root) {
  'use strict';

  /* ---------- פרק 1 — מצרכים ---------- */
  const ING = {
    apple: ['🍎', 'apple', 'תפוח'], banana: ['🍌', 'banana', 'בננה'], grapes: ['🍇', 'grapes', 'ענבים'], bread: ['🍞', 'bread', 'לחם'],
    cheese: ['🧀', 'cheese', 'גבינה'], cucumber: ['🥒', 'cucumber', 'מלפפון'], egg: ['🥚', 'egg', 'ביצה'], milk: ['🥛', 'milk', 'חלב'],
    flour: ['🌾', 'flour', 'קמח'], carrot: ['🥕', 'carrot', 'גזר'], potato: ['🥔', 'potato', 'תפוח אדמה'], water: ['💧', 'water', 'מים'],
    strawberry: ['🍓', 'strawberry', 'תות'], tomato: ['🍅', 'tomato', 'עגבנייה'], sugar: ['🍬', 'sugar', 'סוכר'], pepper: ['🌶️', 'pepper', 'פלפל חריף'],
    onion: ['🧅', 'onion', 'בצל'],
    /* פריטים מצחיקים שמופיעים במזווה — "גרב במרק?! איכס!" */
    sock: ['🧦', 'sock', 'גרב', true], shoe: ['👟', 'shoe', 'נעל', true]
  };

  /* ---------- פרק 2 — מתכונים ---------- */
  const RECIPES = [
    { id: 'salad', ico: '🥗', en: 'fruit salad', he: 'סלט פירות', ing: ['apple', 'banana', 'grapes'] },
    { id: 'sandwich', ico: '🥪', en: 'sandwich', he: 'כריך', ing: ['bread', 'cheese', 'cucumber'] },
    { id: 'smoothie', ico: '🥤', en: 'smoothie', he: 'שייק', ing: ['banana', 'strawberry', 'milk'] },
    { id: 'pancakes', ico: '🥞', en: 'pancakes', he: 'פנקייקים', ing: ['egg', 'milk', 'flour'], oven: true },
    { id: 'soup', ico: '🍲', en: 'soup', he: 'מרק', ing: ['carrot', 'potato', 'water'], oven: true },
    { id: 'pizza', ico: '🍕', en: 'pizza', he: 'פיצה', ing: ['bread', 'cheese', 'tomato'], oven: true },
    { id: 'cake', ico: '🎂', en: 'cake', he: 'עוגה', ing: ['egg', 'flour', 'sugar', 'strawberry'], oven: true },
    { id: 'hotsoup', ico: '🌶️', en: 'hot soup', he: 'מרק חריף של דרקון', ing: ['pepper', 'tomato', 'onion', 'water'], oven: true }
  ];

  /* ---------- פרק 3 — כלי הווטרינר ---------- */
  const TOOLS = {
    stethoscope: ['🩺', 'stethoscope', 'מכשיר שמיעה (סטטוסקופ)'], thermometer: ['🌡️', 'thermometer', 'מדחום'], flashlight: ['🔦', 'flashlight', 'פנס'],
    medicine: ['🥄', 'medicine', 'תרופה'], tissue: ['🧻', 'tissue', 'טישו'], bandage: ['🩹', 'bandage', 'פלסטר'], ice: ['🧊', 'ice', 'קרח'],
    water: ['💧', 'water', 'מים'], toothbrush: ['🪥', 'toothbrush', 'מברשת שיניים'], tea: ['🍵', 'tea', 'תה חם'], blanket: ['🛏️', 'blanket', 'שמיכה'],
    scale: ['📏', 'ruler', 'סרגל גובה'], heart: ['❤️', 'kiss', 'נשיקה']
  };

  /* ---------- פרק 4 — טיפולים ---------- */
  const PROCS = {
    checkup: { he: 'בדיקה שגרתית', ico: '🩺', steps: [
      { t: 'stethoscope', a: 'tap', he: 'מקשיבים ללב של הדרקון', fx: 'heart', say: 'heart', sayHe: 'הלב דופק חזק ובריא!' },
      { t: 'thermometer', a: 'tap', he: 'מודדים חום', fx: 'temp', temp: 37, sayHe: 'שלושים ושבע מעלות — אין חום!' },
      { t: 'flashlight', a: 'tap', he: 'מסתכלים באוזניים ובפה', fx: 'sparkle', say: 'ear', sayHe: 'האוזניים נקיות!' },
      { t: 'scale', a: 'tap', he: 'מודדים גובה', fx: 'tall', sayHe: 'הדרקון גדל!' } ] },
    cold: { he: 'הצטננות', ico: '🤧', steps: [
      { t: 'thermometer', a: 'tap', he: 'מודדים חום', fx: 'temp', temp: 38, sayHe: 'שלושים ושמונה — קצת חם. נטפל בזה!' },
      { t: 'medicine', a: 'tap', he: 'נותנים סירופ בטעם תות', fx: 'spoon', sayHe: 'יאמי, תרופה בטעם תות!' },
      { t: 'tissue', a: 'rub', he: 'מנגבים את האף', fx: 'sparkle', sayHe: 'האף נקי!' },
      { t: 'blanket', a: 'tap', he: 'מכסים בשמיכה חמה', fx: 'blanket', sayHe: 'חם ונעים. ככה מבריאים!' } ] },
    bump: { he: 'מכה בראש', ico: '🤕', steps: [
      { t: 'water', a: 'rub', he: 'שוטפים בעדינות', fx: 'sparkle', sayHe: 'נקי!' },
      { t: 'ice', a: 'tap', he: 'שמים קרח קר', fx: 'sparkle', sayHe: 'הקרח מקרר ומרגיע.' },
      { t: 'bandage', a: 'tap', he: 'מדביקים פלסטר', fx: 'plaster', sayHe: 'פלסטר על המכה!' },
      { t: 'heart', a: 'tap', he: 'נשיקה שמרגישה טוב', fx: 'heart', sayHe: 'נשיקה עוזרת תמיד!' } ] },
    tooth: { he: 'כאב שיניים', ico: '🦷', steps: [
      { t: 'flashlight', a: 'tap', he: 'מסתכלים בפה — פתחו גדול!', fx: 'sparkle', say: 'mouth', sayHe: 'רואים שן אחת שצריך לנקות.' },
      { t: 'toothbrush', a: 'rub', he: 'מצחצחים שיניים', fx: 'sparkle', sayHe: 'השיניים מבריקות!' },
      { t: 'water', a: 'tap', he: 'שוטפים את הפה', fx: 'sparkle', sayHe: 'שוטפים ויורקים!' } ] },
    tummy: { he: 'כאב בטן', ico: '🤢', steps: [
      { t: 'stethoscope', a: 'tap', he: 'מקשיבים לבטן', fx: 'heart', sayHe: 'הבטן מקרקרת... אכל יותר מדי ממתקים!' },
      { t: 'tea', a: 'tap', he: 'שותים תה חם', fx: 'spoon', sayHe: 'תה חם מרגיע את הבטן.' },
      { t: 'blanket', a: 'tap', he: 'נחים קצת', fx: 'blanket', sayHe: 'מנוחה, ומחר אוכלים פירות וירקות!' } ] }
  };

  /* ---------- פרק 4.5 — מעבדת התרופות ---------- */
  const BOTTLES = { blue: ['#3d8bff', 'blue', 'כחול'], pink: ['#ff5fd2', 'pink', 'ורוד'], yellow: ['#ffd95a', 'yellow', 'צהוב'],
                    green: ['#3ff2b0', 'green', 'ירוק'], purple: ['#9b6bff', 'purple', 'סגול'], honey: ['#ffb13b', 'honey', 'דבש'] };
  const POTIONS = {
    checkup: { he: 'ויטמין כוח 💪', drops: { pink: 1, yellow: 1, green: 1 } },
    cold: { he: 'סירופ קסם נגד הצטננות', drops: { blue: 2, pink: 1, honey: 1 } },
    bump: { he: 'משחת קרח ירוקה', drops: { green: 2, blue: 1 } },
    tooth: { he: 'שטיפת פה בטעם מנטה', drops: { green: 1, yellow: 1, blue: 1 } },
    tummy: { he: 'תה מרגיע לבטן', drops: { yellow: 2, honey: 1 } }
  };
  /* תגובות מצחיקות אחרי התרופה (אחת בהגרלה) */
  const FUNNY = [
    { id: 'rainbow', he: 'וואו! הדרקון הפך לקשת! 🌈', en: 'rainbow' },
    { id: 'hiccup', he: 'היק! היק! שיהוקים של בועות! 🫧', en: 'hiccup' },
    { id: 'smoke', he: 'פוף! עשן יוצא לו מהאוזניים! 💨', en: 'Achoo!' },
    { id: 'fire', he: 'אפצ׳י של אש קטנה! 🔥', en: 'Achoo!' },
    { id: 'burp', he: 'בורפ! סליחה! 😅', en: 'Yummy!' }
  ];

  /* ---------- פרק 5 — שורות לקול ---------- */
  function englishLines() {
    const out = ["Let's cook!", 'mix', 'cook', 'doctor', 'healthy', 'Open wide!', 'Say ah!', 'Good job, doctor!', 'kiss',
      'drop', 'shake', 'spoon', 'Here comes the airplane!', 'No, thank you!', 'Yuck!', 'bath', 'bubbles', 'duck', 'Quack!', 'towel', 'Achoo!', 'hiccup', 'rainbow', 'Yummy!'];
    Object.keys(BOTTLES).forEach(k => out.push(BOTTLES[k][1]));
    Object.keys(ING).forEach(k => out.push(ING[k][1]));
    RECIPES.forEach(r => out.push(r.en));
    Object.keys(TOOLS).forEach(k => out.push(TOOLS[k][1]));
    Object.keys(PROCS).forEach(k => PROCS[k].steps.forEach(s => { if (s.say) out.push(s.say); }));
    return out;
  }

  root.CareData = { ING, RECIPES, TOOLS, PROCS, BOTTLES, POTIONS, FUNNY, englishLines };
})(typeof window !== 'undefined' ? window : this);
