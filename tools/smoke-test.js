/* =====================================================================
   tools/smoke-test.js — בדיקת עשן אוטומטית לכל האפליקציה (Playwright + Chromium)
   ---------------------------------------------------------------------
   מה הסקריפט עושה: מרים שרת סטטי מקומי, פותח כל דף ובודק 0 שגיאות קונסול ו-0 קבצים חסרים,
   ואז מריץ תרחישים קצרים במשחקים: מרוץ מכוניות (סבב מלא + שני שחקנים), רכיבה (לוח חיצים),
   חווה (מדריך + חידון), בית ("מה חדש", הישגים). נכשל (exit 1) על כל שגיאה.
   הרצה מקומית:  node tools/smoke-test.js        (דורש: npm i -g playwright && npx playwright install chromium)
   ב-GitHub Actions: .github/workflows/test.yml מריץ אותו על כל push ו-PR.
   פרק 1 — שרת סטטי | פרק 2 — כל הדפים | פרק 3 — תרחישי משחק | פרק 4 — סיכום
   ===================================================================== */
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const MIME = { html: 'text/html; charset=utf-8', js: 'text/javascript', css: 'text/css', json: 'application/json', png: 'image/png', jpg: 'image/jpeg', svg: 'image/svg+xml', woff2: 'font/woff2', mp3: 'audio/mpeg', webmanifest: 'application/manifest+json' };

/* ---------- פרק 1 — שרת סטטי ---------- */
function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
      fs.readFile(p, (err, data) => { if (err) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': MIME[path.extname(p).slice(1)] || 'application/octet-stream' }); res.end(data); });
    }).listen(0, () => resolve(srv));
  });
}
const fails = [];
function fail(msg) { fails.push(msg); console.log('  ❌ ' + msg); }
function ok(msg) { console.log('  ✅ ' + msg); }

(async () => {
  const srv = await serve(), base = 'http://localhost:' + srv.address().port + '/';
  const br = await chromium.launch();
  /* ---------- פרק 2 — כל הדפים ---------- */
  const pages = ['index.html', 'cars.html', 'farm.html', 'ride.html', 'welcome.html', 'dragon.html', 'stories.html', 'coloring.html', 'learning.html', 'balloons.html', 'flight.html', 'cart.html'];
  console.log('פרק 2 — דפים');
  for (const p of pages) {
    const ctx = await br.newContext({ viewport: { width: 1180, height: 820 } }), pg = await ctx.newPage(), errs = [], missing = [];
    pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    pg.on('response', r => { if (r.status() >= 400) missing.push(r.status() + ' ' + r.url().split('/').pop()); });
    await pg.goto(base + p, { waitUntil: 'load' }); await pg.waitForTimeout(1000);
    if (errs.length || missing.length) fail(p + ': ' + errs.concat(missing).slice(0, 3).join(' | ')); else ok(p);
    await ctx.close();
  }
  /* ---------- פרק 3 — תרחישי משחק ---------- */
  console.log('פרק 3 — משחקים');
  const ctx = await br.newContext({ viewport: { width: 1180, height: 820 } }), pg = await ctx.newPage(), errs = [];
  pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const drive = async (n) => { for (let i = 0; i < n; i++) { await pg.evaluate(() => { [CarsGame.state(), CarsGame.p2()].forEach(g => { if (!g) return; g.time += 2; g.pos += 3800; if (g.light) g.inp.brake = true; }); }); await pg.waitForTimeout(60); } };
  // מכוניות — שחקן יחיד
  await pg.goto(base + 'cars.html'); await pg.waitForTimeout(600); await pg.click('#goBtn'); await pg.waitForTimeout(800);
  let st = await pg.evaluate(() => ({ run: CarsGame.state().run, wheel: document.getElementById('wheel').classList.contains('show') }));
  if (st.run && st.wheel) ok('מכוניות: סבב התחיל, ההגה מוצג'); else fail('מכוניות: לא התחיל ' + JSON.stringify(st));
  await drive(32);
  st = await pg.evaluate(() => { const g = CarsGame.state(); return { gates: g.gates, learned: Object.keys(g.learned).length, run: g.run }; });
  if (st.gates >= 1 && st.learned >= 1) ok('מכוניות: שערים ' + st.gates + ', מילים ' + st.learned); else fail('מכוניות: אין שערים/מילים ' + JSON.stringify(st));
  await pg.evaluate(() => CarsGame.finish()); await pg.waitForTimeout(600);
  if (await pg.evaluate(() => document.getElementById('endScreen').classList.contains('show'))) ok('מכוניות: מסך סיום'); else fail('מכוניות: אין מסך סיום');
  // מכוניות — שני שחקנים
  await pg.click('#garageBtn'); await pg.waitForTimeout(300); await pg.click('#twoBtn'); await pg.waitForTimeout(800);
  st = await pg.evaluate(() => ({ two: CarsGame.twoP(), p2: !!CarsGame.p2(), twop: document.body.classList.contains('twop') }));
  if (st.two && st.p2 && st.twop) ok('מכוניות: שני שחקנים התחילו'); else fail('מכוניות: שני שחקנים ' + JSON.stringify(st));
  await pg.mouse.move(900, 500); await pg.mouse.down(); await pg.mouse.move(1050, 500, { steps: 6 }); await pg.waitForTimeout(200);
  st = await pg.evaluate(() => ({ p1: +CarsGame.state().tx.toFixed(2), p2: +CarsGame.p2().tx.toFixed(2) }));
  if (st.p2 > .3 && Math.abs(st.p1) < .1) ok('מכוניות: גרירה בצד ימין מסובבת רק את שחקן 2'); else fail('מכוניות: אזורי מגע ' + JSON.stringify(st));
  await pg.mouse.up(); await drive(36); await pg.evaluate(() => { CarsGame.state().time = 999; }); await pg.waitForTimeout(400);
  const t = await pg.evaluate(() => document.getElementById('cMedalT').textContent);
  if (/שחקן|תיקו/.test(t)) ok('מכוניות: סיום שני שחקנים — ' + t); else fail('מכוניות: סיום שני שחקנים ' + t);
  // עיצוב המכונית
  await pg.click('#garageBtn'); await pg.waitForTimeout(300); await pg.click('#designBtn'); await pg.waitForTimeout(300);
  const nb = await pg.evaluate(() => document.querySelectorAll('#design .cb').length); if (nb >= 15) ok('מכוניות: עיצוב — ' + nb + ' אפשרויות'); else fail('מכוניות: עיצוב ' + nb);
  // רכיבה — לוח חיצים
  await pg.goto(base + 'ride.html'); await pg.waitForTimeout(500); await pg.click('#padBtn2'); await pg.click('#goBtn'); await pg.waitForTimeout(700);
  if (await pg.evaluate(() => document.getElementById('pad').classList.contains('show'))) ok('רכיבה: לוח חיצים'); else fail('רכיבה: לוח חיצים לא מוצג');
  // חווה — מדריך וחידון
  await pg.goto(base + 'farm.html'); await pg.waitForTimeout(900); await pg.evaluate(() => FarmGame.zoom('dog')); await pg.waitForTimeout(700);
  await pg.click('#zonePanel [data-act="learn"]'); await pg.waitForTimeout(300);
  const steps = await pg.evaluate(() => document.querySelectorAll('#guideBox .gstep').length); if (steps === 4) ok('חווה: מדריך 4 צעדים'); else fail('חווה: מדריך ' + steps);
  await pg.click('[data-close="guideOv"]'); await pg.click('#zonePanel [data-act="quiz"]'); await pg.waitForTimeout(300); await pg.click('#quizOpts .qopt'); await pg.waitForTimeout(300);
  if (await pg.evaluate(() => document.getElementById('quizWhy').classList.contains('show'))) ok('חווה: חידון עם הסבר'); else fail('חווה: חידון בלי הסבר');
  // הישגים
  const ach = await pg.evaluate(() => ({ n: Achievements.count(), total: Achievements.total, guide: Achievements.state().c['farm:guide'] }));
  if (ach.guide >= 1 && ach.total >= 24) ok('הישגים: מונים עובדים (' + ach.n + '/' + ach.total + ')'); else fail('הישגים ' + JSON.stringify(ach));
  await pg.evaluate(() => Achievements.open()); await pg.waitForTimeout(300);
  if (await pg.evaluate(() => document.querySelectorAll('.ach-b').length >= 24)) ok('הישגים: אלבום'); else fail('הישגים: אלבום לא נפתח');
  if (errs.length) fail('שגיאות קונסול בתרחישים: ' + errs.slice(0, 3).join(' | ')); else ok('תרחישים: 0 שגיאות קונסול');
  await br.close(); srv.close();
  /* ---------- פרק 4 — סיכום ---------- */
  console.log(fails.length ? '\n❌ ' + fails.length + ' כשלונות' : '\n✅ הכול עבר');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
