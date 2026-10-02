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
  const pages = ['index.html', 'cars.html', 'kitchen.html', 'duel.html', 'draw2.html', 'farm.html', 'ride.html', 'welcome.html', 'dragon.html', 'stories.html', 'coloring.html', 'learning.html', 'balloons.html', 'flight.html', 'cart.html'];
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
  // חווה לשניים
  await pg.click('[data-close="quizOv"]'); await pg.click('#duoBtn'); await pg.waitForTimeout(300);
  if (await pg.evaluate(() => document.querySelectorAll('.duo-g').length === 4)) ok('חווה לשניים: 4 משחקים'); else fail('חווה לשניים: תפריט');
  await pg.click('.duo-g[data-g="eggs"]'); await pg.waitForTimeout(600); await pg.evaluate(() => { FarmDuo.state().phase = 'play'; }); await pg.waitForTimeout(1200);
  for (let i = 0; i < 12; i++) { await pg.mouse.click(300 + (i % 5) * 60, 300 + (i % 3) * 120); await pg.mouse.click(900 + (i % 5) * 50, 300 + (i % 3) * 120); await pg.waitForTimeout(70); }
  const ds = await pg.evaluate(() => FarmDuo.state().score); if (ds[0] + ds[1] > 0) ok('חווה לשניים: ביצים נאספו ' + ds); else fail('חווה לשניים: אין ניקוד');
  await pg.evaluate(() => FarmDuo.finish()); await pg.waitForTimeout(300);
  if (await pg.evaluate(() => document.getElementById('duoEnd').style.display === 'grid')) ok('חווה לשניים: סיום'); else fail('חווה לשניים: אין מסך סיום');
  // המטבח לשניים
  await pg.goto(base + 'kitchen.html'); await pg.waitForTimeout(500); await pg.click('#goBtn'); await pg.waitForTimeout(500);
  await pg.evaluate(() => { const need = Kitchen.need(); const wrong = Array.from(document.querySelectorAll('.ing')).map(b => b.dataset.id).filter(id => id !== need)[0]; Kitchen.tapIng(wrong); }); const oops = await pg.evaluate(() => Kitchen.state().oops);   /* מרכיב לא נכון שקיים במגש */
  for (let i = 0; i < 7; i++) { const n = await pg.evaluate(() => Kitchen.need()); if (!n) break; await pg.evaluate(id => Kitchen.tapIng(id), n); await pg.waitForTimeout(150); }
  const ks = await pg.evaluate(() => ({ served: Kitchen.state().served, oops: Kitchen.state().oops }));
  if (ks.served === 1 && ks.oops >= 1) ok('מטבח לשניים: הזמנה הוגשה, אופס נספר'); else fail('מטבח לשניים: ' + JSON.stringify(ks) + ' oops0=' + oops);
  await pg.evaluate(() => Kitchen.finish()); await pg.waitForTimeout(300);
  if (await pg.evaluate(() => document.getElementById('endScreen').classList.contains('show'))) ok('מטבח לשניים: מסך סיום'); else fail('מטבח לשניים: אין מסך סיום');
  // דו-קרב ידע
  await pg.goto(base + 'duel.html'); await pg.waitForTimeout(400); await pg.click('#goBtn'); await pg.waitForTimeout(2900);
  await pg.evaluate(() => Duel.answer(1, false)); await pg.waitForTimeout(80);
  const frozen = await pg.evaluate(() => document.getElementById('side1').classList.contains('frozen'));
  await pg.evaluate(() => Duel.answer(0, true)); await pg.waitForTimeout(80);
  const dsc = await pg.evaluate(() => Duel.state().score);
  if (frozen && dsc[0] === 1 && dsc[1] === 0) ok('דו-קרב: טעות מקפיאה, נכון נותן נקודה'); else fail('דו-קרב: ' + frozen + ' ' + dsc);
  await pg.evaluate(() => Duel.finish()); await pg.waitForTimeout(200);
  if (await pg.evaluate(() => document.getElementById('endScreen').classList.contains('show'))) ok('דו-קרב: מסך סיום'); else fail('דו-קרב: אין מסך סיום');
  // ציור לשניים
  await pg.goto(base + 'draw2.html'); await pg.waitForTimeout(500);
  await pg.mouse.move(400, 400); await pg.mouse.down(); await pg.mouse.move(600, 500, { steps: 6 }); await pg.mouse.up();
  await pg.mouse.move(800, 300); await pg.mouse.down(); await pg.mouse.move(700, 600, { steps: 6 }); await pg.mouse.up();
  const d2 = await pg.evaluate(() => Draw2.strokes().map(s => s.p)); if (d2.length === 2 && d2[0] === 0 && d2[1] === 1) ok('ציור לשניים: קו משמאל = שחקן 1, מימין = שחקן 2'); else fail('ציור לשניים: ' + d2);
  await pg.click('#shareBtn'); await pg.waitForTimeout(500); if (await pg.evaluate(() => !!document.querySelector('.sh-ov'))) ok('ציור לשניים: שיתוף'); else fail('ציור לשניים: אין חלון שיתוף');
  // מרוץ סוסים לשניים
  await pg.goto(base + 'ride.html'); await pg.waitForTimeout(500); await pg.click('#rduoBtn'); await pg.waitForTimeout(3800);
  for (let i = 0; i < 10; i++) { await pg.mouse.click(600, 700); await pg.waitForTimeout(40); }
  const rx = await pg.evaluate(() => RideDuo.state().P.map(p => Math.round(p.x))); if (rx[0] > 0 && rx[1] === 0) ok('מרוץ סוסים: נגיעות למטה מזיזות רק את שחקן 1'); else fail('מרוץ סוסים: ' + rx);
  await pg.evaluate(() => { const d = RideDuo.state(); d.P[0].x = RideDuo.LEN + 1; d.P[0].nextFence = 99; d.P[1].x = RideDuo.LEN + 1; d.P[1].nextFence = 99; }); await pg.waitForTimeout(500);
  if (await pg.evaluate(() => document.getElementById('rduoEnd').style.display === 'grid')) ok('מרוץ סוסים: סיום'); else fail('מרוץ סוסים: אין מסך סיום');
  // בלונים לשניים
  await pg.goto(base + 'balloons.html'); await pg.waitForTimeout(1200); await pg.click('#bduoBtn'); await pg.waitForTimeout(5200);
  const bp = await pg.evaluate(() => { const d = BalloonsDuo.state(); let n = 0; [0, 1].forEach(p => { const b = d.bal[p][0]; if (b) { BalloonsDuo.pop(p, b); n++; } }); return { n: n, sleeping: !window.gameInstance.loop.running }; });
  if (bp.n === 2 && bp.sleeping) ok('בלונים לשניים: פיצוץ בשני הצדדים, Phaser ישן'); else fail('בלונים לשניים: ' + JSON.stringify(bp));
  await pg.click('#bduoX').catch(() => {}); await pg.evaluate(() => BalloonsDuo.close()); if (await pg.evaluate(() => window.gameInstance.loop.running)) ok('בלונים לשניים: Phaser התעורר'); else fail('בלונים לשניים: Phaser לא התעורר');
  // הישגים (אחרי המשחקים)
  const ach = await pg.evaluate(() => ({ n: Achievements.count(), total: Achievements.total, guide: Achievements.state().c['ride:duo'] }));
  if (ach.guide >= 1 && ach.total >= 24) ok('הישגים: מונים עובדים (' + ach.n + '/' + ach.total + ')'); else fail('הישגים ' + JSON.stringify(ach));
  await pg.evaluate(() => Achievements.open()); await pg.waitForTimeout(300);
  if (await pg.evaluate(() => document.querySelectorAll('.ach-b').length >= 24)) ok('הישגים: אלבום'); else fail('הישגים: אלבום לא נפתח');
  if (errs.length) fail('שגיאות קונסול בתרחישים: ' + errs.slice(0, 3).join(' | ')); else ok('תרחישים: 0 שגיאות קונסול');
  await br.close(); srv.close();
  /* ---------- פרק 4 — סיכום ---------- */
  console.log(fails.length ? '\n❌ ' + fails.length + ' כשלונות' : '\n✅ הכול עבר');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
