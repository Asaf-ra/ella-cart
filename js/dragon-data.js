/* =====================================================================
   js/dragon-data.js — תוכן "משימות הדרקון": אנגלית (במרכז) + חשבון מאתגר
   ---------------------------------------------------------------------
   פרק 1 — אוצר מילים באנגלית לפי נושאים. כל מילה: [מילה, אימוג'י, עברית, הגייה בעברית, טיפ]
           הטיפ מסביר צליל/כתיב מיוחד (למשל "C נשמעת כאן כמו ק").
   פרק 2 — מסלול האנגלית: 13 סטים (נושא לכל סט), 8 שאלות בכל סט, סוגי שאלות מתחלפים:
           listen (שומעים → בוחרים ציור), pic2word (ציור → בוחרים מילה), word2pic (קוראים → בוחרים ציור),
           missing (אות חסרה), spell (בונים מילה מאותיות), sentence (משפט → ציור)
   פרק 3 — מסלול החשבון: 7 סטים עם מחוללי שאלות (חיבור/חיסור עד 20, קבוצות, השוואה, סדרות, בעיות)
   פרק 4 — englishLines(): כל המילים והמשפטים — ל-tools/gen_voice.py (הקלטות רגילות + איטיות)
   ===================================================================== */
(function (root) {
  'use strict';

  /* ---------- פרק 1 — אוצר מילים ---------- */
  const T = {
    animals: { name: 'חיות', icon: '🐾', words: [
      ['cat', '🐱', 'חתול', 'קֶט', 'האות C נשמעת כאן כמו ק'], ['dog', '🐶', 'כלב', 'דוֹג', ''], ['fish', '🐟', 'דג', 'פִישׁ', 'sh ביחד נשמעים כמו ש'],
      ['bird', '🐦', 'ציפור', 'בֶּרְד', 'ir נשמע כמו "אֶר"'], ['lion', '🦁', 'אריה', 'לַיְאֶן', 'i נשמעת כאן כמו "אַי"'], ['horse', '🐴', 'סוס', 'הוֹרְס', ''],
      ['cow', '🐮', 'פרה', 'קַאוּ', 'ow נשמע כמו "אַאוּ"'], ['duck', '🦆', 'ברווז', 'דַק', 'ck ביחד נשמעים כמו ק אחת'] ] },
    food: { name: 'אוכל', icon: '🍎', words: [
      ['apple', '🍎', 'תפוח', 'אֶפֶּל', ''], ['banana', '🍌', 'בננה', 'בָּנָנָה', ''], ['bread', '🍞', 'לחם', 'בְּרֶד', 'ea נשמע כאן כמו "אֶ"'],
      ['milk', '🥛', 'חלב', 'מִילְק', ''], ['egg', '🥚', 'ביצה', 'אֶג', ''], ['cake', '🎂', 'עוגה', 'קֵייק', 'ה-e בסוף שקטה והופכת את a ל"אֵיי"'],
      ['pizza', '🍕', 'פיצה', 'פִּיצָה', 'zz נשמעים כמו צ'], ['water', '💧', 'מים', 'ווֹטֶר', ''] ] },
    colors: { name: 'צבעים', icon: '🎨', words: [
      ['red', '🔴', 'אדום', 'רֶד', ''], ['blue', '🔵', 'כחול', 'בְּלוּ', ''], ['green', '🟢', 'ירוק', 'גְרִין', 'ee נשמע כמו "אִי"'],
      ['yellow', '🟡', 'צהוב', 'יֶלוֹ', ''], ['black', '⚫', 'שחור', 'בְּלֶק', ''], ['white', '⚪', 'לבן', 'ווַייט', 'h שקטה, וה-e בסוף הופכת את i ל"אַי"'],
      ['pink', '🩷', 'ורוד', 'פִּינְק', ''], ['orange', '🟠', 'כתום', 'אוֹרֶנְג׳', 'ge בסוף נשמע כמו ג׳'] ] },
    body: { name: 'הגוף', icon: '🖐️', words: [
      ['head', '🙂', 'ראש', 'הֶד', ''], ['eyes', '👀', 'עיניים', 'אַייז', ''], ['nose', '👃', 'אף', 'נוֹז', ''],
      ['mouth', '👄', 'פה', 'מַאוּת׳', 'th נשמע כמו ת׳ — לשון בין השיניים'], ['ears', '👂', 'אוזניים', 'אִירְז', ''], ['hand', '✋', 'יד', 'הֶנְד', ''],
      ['foot', '🦶', 'כף רגל', 'פוּט', 'oo נשמע כמו "אוּ"'], ['hair', '💇', 'שיער', 'הֶר', ''] ] },
    home: { name: 'בבית', icon: '🏠', words: [
      ['house', '🏠', 'בית', 'הַאוּס', ''], ['bed', '🛏️', 'מיטה', 'בֶּד', ''], ['door', '🚪', 'דלת', 'דוֹר', ''],
      ['chair', '🪑', 'כיסא', 'צֶ׳ר', 'ch נשמע כמו צ׳'], ['book', '📖', 'ספר', 'בּוּק', ''], ['ball', '⚽', 'כדור', 'בּוֹל', ''],
      ['lamp', '💡', 'מנורה', 'לֶמְפּ', ''], ['clock', '⏰', 'שעון', 'קְלוֹק', ''] ] },
    numbers: { name: 'מספרים', icon: '🔢', words: [
      ['one', '1️⃣', 'אחת', 'ווַאן', 'נכתב o אבל נשמע "וו"'], ['two', '2️⃣', 'שתיים', 'טוּ', 'ה-w שקטה'], ['three', '3️⃣', 'שלוש', 'ת׳רִי', 'th + ee'],
      ['four', '4️⃣', 'ארבע', 'פוֹר', ''], ['five', '5️⃣', 'חמש', 'פַייב', ''], ['six', '6️⃣', 'שש', 'סִיקְס', 'x נשמע כמו "קס"'],
      ['seven', '7️⃣', 'שבע', 'סֶבֶן', ''], ['eight', '8️⃣', 'שמונה', 'אֵייט', 'gh שקטות'] ] },
    clothes: { name: 'בגדים', icon: '👕', words: [
      ['shirt', '👕', 'חולצה', 'שֶׁרְט', ''], ['pants', '👖', 'מכנסיים', 'פֶּנְטְס', ''], ['dress', '👗', 'שמלה', 'דְרֶס', ''],
      ['shoes', '👟', 'נעליים', 'שׁוּז', ''], ['hat', '🧢', 'כובע', 'הֶט', ''], ['socks', '🧦', 'גרביים', 'סוֹקְס', ''],
      ['coat', '🧥', 'מעיל', 'קוֹט', 'oa נשמע כמו "אוֹ"'], ['glasses', '👓', 'משקפיים', 'גְלֶסֶז', ''] ] },
    nature: { name: 'טבע', icon: '🌳', words: [
      ['sun', '☀️', 'שמש', 'סַאן', ''], ['moon', '🌙', 'ירח', 'מוּן', 'oo נשמע כמו "אוּ"'], ['star', '⭐', 'כוכב', 'סְטַאר', ''],
      ['tree', '🌳', 'עץ', 'טְרִי', ''], ['flower', '🌸', 'פרח', 'פְלַאוֶּר', ''], ['rain', '🌧️', 'גשם', 'רֵיין', 'ai נשמע כמו "אֵיי"'],
      ['snow', '❄️', 'שלג', 'סְנוֹ', ''], ['sea', '🌊', 'ים', 'סִי', 'ea נשמע כאן כמו "אִי"'] ] },
    transport: { name: 'כלי תחבורה', icon: '🚗', words: [
      ['car', '🚗', 'מכונית', 'קַאר', ''], ['bus', '🚌', 'אוטובוס', 'בַּאס', ''], ['train', '🚂', 'רכבת', 'טְרֵיין', ''],
      ['plane', '✈️', 'מטוס', 'פְּלֵיין', ''], ['boat', '⛵', 'סירה', 'בּוֹט', ''], ['bike', '🚲', 'אופניים', 'בַּייק', ''],
      ['truck', '🚚', 'משאית', 'טְרַאק', ''], ['rocket', '🚀', 'טיל', 'רוֹקֶט', ''] ] },
    family: { name: 'משפחה', icon: '👨‍👩‍👦', words: [
      ['mom', '👩', 'אמא', 'מוֹם', ''], ['dad', '👨', 'אבא', 'דֶד', ''], ['baby', '👶', 'תינוק', 'בֵּייבִּי', ''],
      ['brother', '👦', 'אח', 'בְּרָאדֶ׳ר', 'th נשמע כאן כמו ד׳ רכה'], ['sister', '👧', 'אחות', 'סִיסְטֶר', ''], ['grandma', '👵', 'סבתא', 'גְרֶנְמָה', ''],
      ['grandpa', '👴', 'סבא', 'גְרֶנְפָּה', ''], ['friend', '🧒', 'חברה', 'פְרֶנְד', 'ie נשמע כאן כמו "אֶ"'] ] },
    actions: { name: 'פעולות', icon: '🏃', words: [
      ['run', '🏃', 'לרוץ', 'רַאן', ''], ['jump', '🤸', 'לקפוץ', 'ג׳ַאמְפּ', ''], ['eat', '🍽️', 'לאכול', 'אִיט', ''],
      ['sleep', '😴', 'לישון', 'סְלִיפּ', ''], ['swim', '🏊', 'לשחות', 'סְווִים', ''], ['read', '📚', 'לקרוא', 'רִיד', ''],
      ['sing', '🎤', 'לשיר', 'סִינְג', 'ng נשמע כמו נ שמתחברת לג'], ['dance', '💃', 'לרקוד', 'דֶנְס', 'ce נשמע כמו ס'] ] },
    opposites: { name: 'הפכים', icon: '↔️', words: [
      ['big', '🐘', 'גדול', 'בִּיג', 'ההפך: small'], ['small', '🐭', 'קטן', 'סְמוֹל', 'ההפך: big'], ['hot', '🔥', 'חם', 'הוֹט', 'ההפך: cold'],
      ['cold', '🧊', 'קר', 'קוֹלְד', 'ההפך: hot'], ['happy', '😀', 'שמח', 'הֶפִּי', 'ההפך: sad'], ['sad', '😢', 'עצוב', 'סֶד', 'ההפך: happy'],
      ['fast', '🐆', 'מהיר', 'פֶסְט', 'ההפך: slow'], ['slow', '🐢', 'איטי', 'סְלוֹ', 'ההפך: fast'] ] }
  };

  /* משפטים לסט המשפטים: [משפט, תמונה נכונה, תרגום, תמונות מסיחות] */
  const SENTENCES = [
    ['I see a cat.', '👀🐱', 'אני רואה חתול.', ['👀🐶', '👀🐟', '👀🐦']],
    ['The ball is red.', '🔴⚽', 'הכדור אדום.', ['🔵⚽', '🟢⚽', '🟡⚽']],
    ['I have two apples.', '🍎🍎', 'יש לי שני תפוחים.', ['🍎', '🍎🍎🍎', '🍌🍌']],
    ['The sun is hot.', '☀️🔥', 'השמש חמה.', ['❄️🧊', '🌙⭐', '🌧️☂️']],
    ['I can swim.', '🏊', 'אני יודעת לשחות.', ['🏃', '😴', '🎤']],
    ['The dog is big.', '🐕🐘', 'הכלב גדול.', ['🐶🐭', '🐱🐘', '🐟🐭']],
    ['My mom is happy.', '👩😀', 'אמא שלי שמחה.', ['👩😢', '👨😀', '👶😢']],
    ['The bird can fly.', '🐦✈️', 'הציפור יודעת לעוף.', ['🐟🌊', '🐴🏃', '🐮🌾']]
  ];

  /* ---------- פרק 2 — מסלול האנגלית ---------- */
  const EN_ORDER = ['animals', 'food', 'colors', 'body', 'home', 'numbers', 'clothes', 'nature', 'transport', 'family', 'actions', 'opposites', 'sentences'];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pickN = (a, n, not) => shuffle(a.filter(x => x !== not)).slice(0, n);
  function wordObj(w) { return { en: w[0], pic: w[1], he: w[2], say: w[3], tip: w[4] }; }

  /* enSet(themeId) — 8 שאלות בסדר: listen, pic2word, word2pic, listen, missing, pic2word, spell, word2pic */
  function enSet(themeId) {
    if (themeId === 'sentences') return shuffle(SENTENCES).map(s => ({ type: 'sentence', text: s[0], he: s[2], answer: s[1], options: shuffle([s[1]].concat(s[3])) }));
    const th = T[themeId], words = th.words.map(wordObj), order = shuffle(words);
    const types = ['listen', 'pic2word', 'word2pic', 'listen', 'missing', 'pic2word', 'spell', 'word2pic'];
    return types.map((type, i) => {
      const w = order[i % order.length], others = pickN(words, 3, w);
      const q = { type, word: w, options: shuffle([w].concat(others)) };
      if (type === 'missing') {
        const idx = Math.min(w.en.length - 1, 1 + ((Math.random() * (w.en.length - 1)) | 0));
        q.idx = idx; q.letter = w.en[idx];
        const pool = 'aeioubcdfghklmnprstw'.split('').filter(c => c !== q.letter);
        q.letters = shuffle([q.letter].concat(pickN(pool, 3)));
      }
      if (type === 'spell' && w.en.length > 6) q.type = 'pic2word';
      return q;
    });
  }

  /* ---------- פרק 3 — מסלול החשבון ---------- */
  const R = (a, b) => a + ((Math.random() * (b - a + 1)) | 0);
  const FRUIT = ['🍎', '🍓', '⭐', '🍪', '🎈', '🐟'];
  /* numOptions — 4 תשובות קרובות (בלי כפילויות ובלי שליליים) */
  function numOptions(ans) { const s = new Set([ans]); while (s.size < 4) s.add(Math.max(0, ans + R(-4, 4))); return shuffle([...s]); }
  const MATH = [
    { id: 'add10', name: 'חיבור עד 10', icon: '➕', gen: () => { const a = R(2, 7), b = R(1, 10 - a), e = FRUIT[R(0, 5)]; return { q: a + ' + ' + b + ' = ?', say: a + ' ועוד ' + b, visual: [a, b, e], ans: a + b, why: 'סופרים ' + a + ' ועוד ' + b + ' — מתחילים מ-' + a + ' וממשיכים ' + b + ' צעדים: ' + (a + b) }; } },
    { id: 'sub10', name: 'חיסור עד 10', icon: '➖', gen: () => { const a = R(4, 10), b = R(1, a - 1), e = FRUIT[R(0, 5)]; return { q: a + ' − ' + b + ' = ?', say: a + ' פחות ' + b, visual: [a, -b, e], ans: a - b, why: 'היו ' + a + ', הורדנו ' + b + ' — נשארו ' + (a - b) }; } },
    { id: 'add20', name: 'חיבור עד 20', icon: '🔟', gen: () => { const a = R(6, 12), b = R(3, 20 - a); const to10 = Math.max(0, 10 - a); return { q: a + ' + ' + b + ' = ?', say: a + ' ועוד ' + b, ans: a + b, why: to10 && to10 < b ? a + ' ועוד ' + to10 + ' זה 10, ועוד ' + (b - to10) + ' זה ' + (a + b) : 'מחברים: ' + a + ' ועוד ' + b + ' = ' + (a + b) }; } },
    { id: 'sub20', name: 'חיסור עד 20', icon: '🎯', gen: () => { const a = R(11, 20), b = R(2, 9); const down = a - 10; return { q: a + ' − ' + b + ' = ?', say: a + ' פחות ' + b, ans: a - b, why: down && down < b ? a + ' פחות ' + down + ' זה 10, ופחות עוד ' + (b - down) + ' זה ' + (a - b) : a + ' פחות ' + b + ' = ' + (a - b) }; } },
    { id: 'groups', name: 'קבוצות (כפל)', icon: '✖️', gen: () => { const g = R(2, 4), n = R(2, 5), e = FRUIT[R(0, 5)]; return { q: g + ' קבוצות של ' + n + ' — כמה בסך הכול?', say: g + ' קבוצות של ' + n, groups: [g, n, e], ans: g * n, why: n + Array(g).join(' + ' + n) + ' = ' + g * n }; } },
    { id: 'pattern', name: 'סדרות והשוואה', icon: '🧩', gen: () => { if (Math.random() < .5) { const st = R(1, 6), d = [2, 3, 5, 10][R(0, 3)], seq = [0, 1, 2, 3].map(i => st + i * d); return { q: seq.join(', ') + ', ?', say: 'מה המספר הבא בסדרה?', ans: st + 4 * d, why: 'כל פעם מוסיפים ' + d + ': ' + seq[3] + ' ועוד ' + d + ' = ' + (st + 4 * d) }; } const a = R(3, 19); let b = R(3, 19); if (b === a) b++; return { q: 'איזה מספר גדול יותר?', say: 'איזה מספר גדול יותר, ' + a + ' או ' + b + '?', choices: [a, b], ans: Math.max(a, b), why: Math.max(a, b) + ' גדול מ-' + Math.min(a, b) }; } },
    { id: 'story', name: 'בעיות סיפור', icon: '📜', gen: () => { const k = R(0, 2); if (k === 0) { const a = R(3, 9), b = R(2, 8); return { q: 'לדרקון היו ' + a + ' תפוחים 🍎 והוא קיבל עוד ' + b + '. כמה יש לו עכשיו?', say: 'לדרקון היו ' + a + ' תפוחים והוא קיבל עוד ' + b + '. כמה יש לו עכשיו?', ans: a + b, why: a + ' + ' + b + ' = ' + (a + b) }; } if (k === 1) { const a = R(8, 15), b = R(2, 7); return { q: 'על העץ היו ' + a + ' ציפורים 🐦. ' + b + ' עפו. כמה נשארו?', say: 'על העץ היו ' + a + ' ציפורים. ' + b + ' עפו. כמה נשארו?', ans: a - b, why: a + ' − ' + b + ' = ' + (a - b) }; } const g = R(2, 4), n = R(2, 4); return { q: 'לכל אחד מ-' + g + ' גיבורים יש ' + n + ' כוכבים ⭐. כמה כוכבים יש לכולם?', say: 'לכל אחד מ-' + g + ' גיבורים יש ' + n + ' כוכבים. כמה כוכבים יש לכולם?', ans: g * n, why: g + ' × ' + n + ' = ' + g * n }; } }
  ];
  function mathSet(id) {
    const m = MATH.find(x => x.id === id);
    return Array.from({ length: 8 }, () => { const q = m.gen(); q.type = 'math'; q.options = q.choices ? q.choices : numOptions(q.ans); return q; });
  }

  /* TRACKS — שני מסלולי המשימות (לפי הסדר; כל סט נפתח אחרי הקודם) */
  const TRACKS = {
    en: EN_ORDER.map(id => ({ id: 'en:' + id, theme: id, name: id === 'sentences' ? 'משפטים' : T[id].name, icon: id === 'sentences' ? '💬' : T[id].icon })),
    math: MATH.map(m => ({ id: 'math:' + m.id, math: m.id, name: m.name, icon: m.icon }))
  };
  function build(setId) { const [kind, id] = setId.split(':'); return kind === 'en' ? enSet(id) : mathSet(id); }

  /* ---------- פרק 4 — שורות לקול ---------- */
  function englishLines() {
    const out = [];
    Object.keys(T).forEach(k => T[k].words.forEach(w => out.push(w[0])));
    SENTENCES.forEach(s => out.push(s[0]));
    return out;
  }

  root.DragonData = { THEMES: T, SENTENCES, TRACKS, build, englishLines, shuffle };
})(typeof window !== 'undefined' ? window : this);
