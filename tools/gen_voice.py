#!/usr/bin/env python3
# =====================================================================
# tools/gen_voice.py — יצירת הקלטות קול טבעיות באנגלית (Kokoro, קוד פתוח)
# ---------------------------------------------------------------------
# פרק 1 — איסוף הטקסטים: כל מה שהאפליקציה מקריאה באנגלית
#          (AcademyModules.englishPhrases() + סיפורי אנגלית STORIES.englishLines() + שמות אותיות + משפטים קבועים)
# פרק 2 — נרמול: אותו נרמול כמו ב-js/audio.js (normEn) כדי שהמפתחות יתאימו
# פרק 3 — יצירה: Kokoro (קול af_heart), חיתוך שקט, נרמול עוצמה, MP3 מונו 48kbps
# פרק 4 — מניפסט: js/voice-en.js → window.VOICE_EN = { "טקסט מנורמל": "קובץ" }
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
         'Hello! You are a super hero. Let us learn some English words together!']

def collect():
    # ---------- פרק 1 — איסוף ----------
    js = ("global.window={};global.document={createElement:()=>({})};require('./js/academy-modules.js');require('./js/story-data.js');"
          "process.stdout.write(JSON.stringify(window.AcademyModules.englishPhrases().concat(window.STORIES.englishLines())))")
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
    manifest = {}
    for i, (n, text) in enumerate(sorted(items.items())):
        name = slug(n) + '.mp3'; path = os.path.join(OUT_DIR, name)
        manifest[n] = name
        if os.path.exists(path): continue
        # ---------- פרק 3 — יצירה ----------
        samples, sr = k.create(text, voice=a.voice, speed=a.speed, lang='en-us')
        x = np.asarray(samples, dtype=np.float32)
        idx = np.where(np.abs(x) > 0.01)[0]                       # חיתוך שקט בהתחלה ובסוף
        if len(idx): x = x[max(0, idx[0] - int(sr * .04)): idx[-1] + int(sr * .12)]
        x = x / max(1e-4, np.max(np.abs(x))) * 0.89               # נרמול עוצמה אחיד
        enc = lameenc.Encoder(); enc.set_bit_rate(48); enc.set_in_sample_rate(sr); enc.set_channels(1); enc.set_quality(2)
        data = enc.encode((x * 32767).astype(np.int16).tobytes()) + enc.flush()
        open(path, 'wb').write(data)
        print(f'[{i + 1}/{len(items)}] {name} ({len(data) // 1024}KB)', flush=True)
    # ---------- פרק 4 — מניפסט ----------
    body = json.dumps(manifest, ensure_ascii=False, sort_keys=True, indent=0)
    open(os.path.join(ROOT, 'js', 'voice-en.js'), 'w', encoding='utf-8').write(
        '/* js/voice-en.js — נוצר אוטומטית ע"י tools/gen_voice.py (אל תערכו ידנית).\n'
        '   מפת הקלטות קול טבעיות באנגלית: טקסט מנורמל → קובץ ב-assets/voice/en */\n'
        'window.VOICE_EN = ' + body + ';\n')
    print('manifest:', len(manifest))

if __name__ == '__main__':
    main()
