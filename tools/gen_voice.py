#!/usr/bin/env python3
# =====================================================================
# tools/gen_voice.py — יצירת הקלטות קול טבעיות באנגלית (Kokoro, קוד פתוח)
# ---------------------------------------------------------------------
# פרק 1 — איסוף הטקסטים: כל מה שהאפליקציה מקריאה באנגלית
#          (AcademyModules.englishPhrases() + סיפורי אנגלית STORIES.englishLines() + דרקון, טיפול, רכיבה, חווה, מכוניות (CarsData), מדריכי החווה (FarmLearn) + שמות אותיות + משפטים קבועים)
# פרק 2 — נרמול: אותו נרמול כמו ב-js/audio.js (normEn) כדי שהמפתחות יתאימו
# פרק 3 — יצירה: Kokoro (קול af_heart), חיתוך שקט, נרמול עוצמה, MP3 מונו 48kbps
# פרק 4 — מניפסט: js/voice-en.js → window.VOICE_EN = { "טקסט מנורמל": "קובץ" }
# פרק 5 — הקלטות איטיות וברורות למשימות הדרקון (DragonData.englishLines, מהירות 0.68):
#          assets/voice/en-slow/ + js/voice-en-slow.js → window.VOICE_EN_SLOW
# הרצה (פעם אחת, כשמוסיפים מילים חדשות):
#   pip install kokoro-onnx soundfile lameenc
#   curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/kokoro-v1.0.int8.onnx
#   curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
#   python3 tools/gen_voice.py --model kokoro-v1.0.int8.onnx --voices voices-v1.0.bin
# קבצים שכבר קיימים לא נוצרים מחדש.
# =====================================================================
import argparse, json, os, re, subprocess, hashlib
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'assets', 'voice', 'en')

# ---------- פרק 2 — נרמול (חייב להיות זהה ל-normEn ב-js/audio.js) ----------
def norm(t):
    t = t.lower().replace('’', "'")
    t = re.sub(r"[^a-z0-9' ]+", ' ', t)
    return re.sub(r'\s+', ' ', t).strip()

def slug(n):
    s = re.sub(r"[^a-z0-9]+", '-', n).strip('-')
    return s if len(s) <= 40 else s[:32] + '-' + hashlib.md5(n.encode()).hexdigest()[:6]

# שמות האותיות כפי שהוגים אותם (אחרת "A" נקרא כמו מילית)
LETTERS = {'A': 'Ay.', 'B': 'Bee.', 'C': 'See.', 'D': 'Dee.', 'E': 'Ee.', 'F': 'Eff.', 'G': 'Gee.', 'H': 'Aitch.', 'I': 'Eye.', 'J': 'Jay.', 'K': 'Kay.',
           'L': 'Ell.', 'M': 'Em.', 'N': 'En.', 'O': 'Oh.', 'P': 'Pee.', 'Q': 'Cue.', 'R': 'Are.', 'S': 'Ess.', 'T': 'Tee.', 'U': 'You.', 'V': 'Vee.',
           'W': 'Double you.', 'X': 'Ex.', 'Y': 'Why.', 'Z': 'Zee.'}
EXTRA = ['Great answer!', 'Great job!', 'Excellent!', 'Yes!', 'Well done!', 'Hello!', 'You are a super hero.',
         'Hello! You are a super hero. Let us learn some English words together!',
         # מילות טיפול בדרקון (טמגוצ'י): אמבטיה, שינה, משחק, אוכל, אהבה
         'bath', 'clean', 'dirty', 'wash', 'bubbles', 'play', 'yummy', 'hungry', 'I love you', 'Time for a bath!', "Let's play!", 'Good night!', 'Good morning!', 'Surprise!',
         # שלב 16/22 — מרוץ המכוניות (שני דגמי המוסך) וספירה בכרטיסי הלמידה (shared/learn-fx.js: 'one cone', 'three cones'...)
         'monster truck', 'ice cream truck', 'one cone', 'two cones', 'three cones', 'four cones', 'five cones', 'six cones', 'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']

def collect():
    # ---------- פרק 1 — איסוף ----------
    js = ("global.window={};global.document={createElement:()=>({})};require('./js/academy-modules.js');require('./js/story-data.js');require('./js/dragon-data.js');require('./js/care-data.js');require('./js/ride-data.js');require('./js/farm-data.js');require('./js/cars-data.js');require('./js/farm-learn.js');require('./js/kitchen.js');require('./js/duel.js');"
          "process.stdout.write(JSON.stringify(window.AcademyModules.englishPhrases().concat(window.STORIES.englishLines(), window.DragonData.englishLines(), window.CareData.englishLines(), window.RideData.englishLines(), window.FarmData.englishLines(), window.CarsData.englishLines(), window.FarmLearn.englishLines(), window.Kitchen.englishLines(), window.Duel.englishLines())))")
    phrases = json.loads(subprocess.check_output(['node', '-e', js], cwd=ROOT))
    items = {}
    for p in phrases + EXTRA:
        n = norm(p)
        if n and n not in items: items[n] = p
    for L, spoken in LETTERS.items(): items[L.lower()] = spoken
    return items

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--model', required=True); ap.add_argument('--voices', required=True)
    ap.add_argument('--voice', default='af_heart'); ap.add_argument('--speed', type=float, default=0.9)
    a = ap.parse_args()
    from kokoro_onnx import Kokoro
    import lameenc
    os.makedirs(OUT_DIR, exist_ok=True)
    items = collect()
    k = Kokoro(a.model, a.voices)
    gen(k, a.voice, a.speed, items, OUT_DIR, 'voice-en.js', 'VOICE_EN', 'assets/voice/en')
    # ---------- פרק 5 — הקלטות איטיות (לאט וברור) לכל ההקלטות ----------
    js = "global.window={};require('./js/dragon-data.js');process.stdout.write(JSON.stringify(window.DragonData.englishLines()))"
    slow = {norm(t): t for t in json.loads(subprocess.check_output(['node', '-e', js], cwd=ROOT))}
    slow.update(items)   # גם כל המילים והמשפטים של האקדמיה והטיסה — כל "🐢 לאט" והחזרה האיטית אחרי תשובה נשמעים בהקלטה טבעית
    gen(k, a.voice, 0.68, slow, os.path.join(ROOT, 'assets', 'voice', 'en-slow'), 'voice-en-slow.js', 'VOICE_EN_SLOW', 'assets/voice/en-slow')

def gen(k, voice, speed, items, out_dir, manifest_file, var, rel):
    import lameenc
    os.makedirs(out_dir, exist_ok=True)
    manifest = {}
    for i, (n, text) in enumerate(sorted(items.items())):
        name = slug(n) + '.mp3'; path = os.path.join(out_dir, name)
        manifest[n] = name
        if os.path.exists(path): continue
        # ---------- פרק 3 — יצירה ----------
        samples, sr = k.create(text, voice=voice, speed=speed, lang='en-us')
        x = np.asarray(samples, dtype=np.float32)
        idx = np.where(np.abs(x) > 0.01)[0]                       # חיתוך שקט בהתחלה ובסוף
        if len(idx): x = x[max(0, idx[0] - int(sr * .04)): idx[-1] + int(sr * .12)]
        x = x / max(1e-4, np.max(np.abs(x))) * 0.89               # נרמול עוצמה אחיד
        enc = lameenc.Encoder(); enc.set_bit_rate(48); enc.set_in_sample_rate(sr); enc.set_channels(1); enc.set_quality(2)
        data = enc.encode((x * 32767).astype(np.int16).tobytes()) + enc.flush()
        open(path, 'wb').write(data)
        print(f'[{i + 1}/{len(items)}] {rel}/{name} ({len(data) // 1024}KB)', flush=True)
    # ---------- פרק 4 — מניפסט ----------
    body = json.dumps(manifest, ensure_ascii=False, sort_keys=True, indent=0)
    open(os.path.join(ROOT, 'js', manifest_file), 'w', encoding='utf-8').write(
        '/* js/' + manifest_file + ' — נוצר אוטומטית ע"י tools/gen_voice.py (אל תערכו ידנית).\n'
        '   מפת הקלטות קול טבעיות באנגלית: טקסט מנורמל → קובץ ב-' + rel + ' */\n'
        'window.' + var + ' = ' + body + ';\n')
    print('manifest:', manifest_file, len(manifest))

if __name__ == '__main__':
    main()
