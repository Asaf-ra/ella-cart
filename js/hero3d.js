/* ===== רגע-גיבור תלת-ממד (Babylon.js) — הפקה קולנועית של המנה המוגמרת =====
   שכבת קנבס שקופה מעל המשחק; נטענת ורצה רק כשמציגים. בלי תלות באסטים חיצוניים. */
const Hero3D = (function () {
  let engine = null, scene = null, canvas = null, root = null, pipeline = null, cam = null;
  let plate = null, shadowDisc = null, ring = null, sparks = null, twinkle = null, steam = null, shadowGen = null;
  let ready = false, visible = false, hideTimer = null, fadeTimer = null, builders = {}, current = null, t0 = 0;
  let babylonLoading = false;
  let bumpFine = null, bumpCoarse = null;
  let dragging = false, dragX = 0, lastInteract = 0;
  let cartRoot = null, cartMode = false;   // חשיפת העגלה: נבנית פעם אחת, קבועה — לא נהרסת/נבנית כמו מאכל

  // ---- טעינת Babylon דינמית ברקע (המשחק נפתח מיד) ----
  function loadBabylon() {
    if (typeof BABYLON !== 'undefined' || babylonLoading) return;
    babylonLoading = true;
    const s = document.createElement('script');
    s.src = 'vendor/babylon.js'; s.async = true;
    s.onerror = () => { babylonLoading = false; console.warn('Hero3D: Babylon load failed'); };
    document.head.appendChild(s);
  }

  // ---- טקסטורות קנבס (רדיאלי / כוכב / סביבת-סטודיו) ----
  function radialURL(size, stops) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const x = c.getContext('2d'), r = size / 2;
    const g = x.createRadialGradient(r, r, 0, r, r, r);
    stops.forEach(s => g.addColorStop(s[0], s[1]));
    x.fillStyle = g; x.fillRect(0, 0, size, size);
    return c.toDataURL();
  }
  function envURL() {
    const c = document.createElement('canvas'); c.width = 512; c.height = 256;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#eaf1ff'); g.addColorStop(0.42, '#ffffff');
    g.addColorStop(0.6, '#ffe9c8'); g.addColorStop(1, '#5a4a5e');
    x.fillStyle = g; x.fillRect(0, 0, 512, 256);
    // כתמי אור רכים (key lights) לרפלקציות מעניינות
    [[140, 70, 70, 'rgba(255,255,255,0.9)'], [380, 90, 90, 'rgba(255,240,210,0.8)'], [260, 40, 50, 'rgba(255,255,255,0.7)']]
      .forEach(([cx, cy, rr, col]) => { const rg = x.createRadialGradient(cx, cy, 0, cx, cy, rr);
        rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = rg; x.fillRect(0, 0, 512, 256); });
    return c.toDataURL();
  }
  // מפת נורמלים פרוצדורלית מרעש-כתמים — בליטות אמיתיות (סוכר / בצק / פטי)
  function noiseNormalURL(size, blobs, amp) {
    const h = new Float32Array(size * size);
    for (let i = 0; i < blobs; i++) {
      const bx = Math.random() * size, by = Math.random() * size;
      const br = size * (0.015 + Math.random() * 0.05), bh = Math.random() * 2 - 1;
      // עטיפה מודולרית — טקסטורה ללא-תפר (הטורוס חושף כל תפר)
      for (let y = Math.floor(by - br); y <= Math.ceil(by + br); y++) for (let x = Math.floor(bx - br); x <= Math.ceil(bx + br); x++) {
        const d = Math.hypot(x - bx, y - by) / br;
        if (d < 1) { const f = 1 - d; h[((y + size) % size) * size + ((x + size) % size)] += bh * f * f; }
      }
    }
    const c = document.createElement('canvas'); c.width = c.height = size;
    const ctx = c.getContext('2d'), img = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const l = h[y * size + (x - 1 + size) % size], r = h[y * size + (x + 1) % size];
      const u = h[((y - 1 + size) % size) * size + x], d = h[((y + 1) % size) * size + x];
      let nx = (l - r) * amp, ny = (u - d) * amp;
      const n = Math.hypot(nx, ny, 1), o = (y * size + x) * 4;
      img.data[o] = (nx / n * 0.5 + 0.5) * 255; img.data[o + 1] = (ny / n * 0.5 + 0.5) * 255;
      img.data[o + 2] = (1 / n * 0.5 + 0.5) * 255; img.data[o + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL();
  }
  function getBump(kind) {
    if (kind === 'coarse') { if (!bumpCoarse) bumpCoarse = new BABYLON.Texture(noiseNormalURL(256, 260, 3.2), scene); return bumpCoarse; }
    if (!bumpFine) bumpFine = new BABYLON.Texture(noiseNormalURL(256, 1400, 2.2), scene);
    return bumpFine;
  }

  // ---- טקסטורות אוכל פרוצדורליות — אטלס לגליל: כיפה משמאל (u 0..0.5), דופן מימין (u 0.57..1) ----
  // אלה מה שהופך "צבע שטוח" לאוכל אמיתי: קלייה, חריכה, גרעינים, עסיסיות.
  let foodTexes = {};
  function foodAtlasURL(kind) {
    const W = 512, H = 256, c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d');
    const cx = 128, cy = 128, R = 126;
    const capClip = () => { x.save(); x.beginPath(); x.arc(cx, cy, R, 0, 6.284); x.clip(); };
    const spots = (n, col, a0, a1, r0, r1) => { for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.284, rr = Math.sqrt(Math.random()) * (R - 8);
      x.globalAlpha = a0 + Math.random() * (a1 - a0); x.fillStyle = col;
      x.beginPath(); x.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, r0 + Math.random() * (r1 - r0), 0, 6.284); x.fill();
    } x.globalAlpha = 1; };
    const side = (draw) => { x.save(); x.translate(292, 0); draw(220, 256); x.restore(); };

    if (kind === 'bun') {
      capClip();
      const g = x.createRadialGradient(cx - 20, cy - 20, 10, cx, cy, R);
      g.addColorStop(0, '#f6c26e'); g.addColorStop(0.62, '#e09a3e'); g.addColorStop(1, '#b26a1c');
      x.fillStyle = g; x.fillRect(0, 0, 256, 256);
      spots(46, '#a35f18', 0.05, 0.13, 4, 16);            // כתמי אפייה
      spots(30, '#ffe2a8', 0.06, 0.12, 2, 7);             // הבהובי קמח
      x.restore();
      side((w, h) => { const sg = x.createLinearGradient(0, 0, 0, h);
        sg.addColorStop(0, '#dd9838'); sg.addColorStop(0.55, '#eaaf55'); sg.addColorStop(1, '#f6dfa8');   // תחתית בהירה — צד הלחם
        x.fillStyle = sg; x.fillRect(0, 0, w, h); });
    } else if (kind === 'patty') {
      capClip();
      const g = x.createRadialGradient(cx, cy, 10, cx, cy, R);
      g.addColorStop(0, '#5c3016'); g.addColorStop(1, '#3c1e0c');
      x.fillStyle = g; x.fillRect(0, 0, 256, 256);
      spots(120, '#6f3d1c', 0.15, 0.3, 2, 6);             // מרקם בשר
      spots(26, '#2a1206', 0.25, 0.45, 3, 8);             // חריכה
      x.strokeStyle = 'rgba(20,8,2,0.55)'; x.lineWidth = 10; x.lineCap = 'round';
      for (let i = -2; i <= 2; i++) { x.beginPath(); x.moveTo(cx - 90, cy + i * 38); x.lineTo(cx + 90, cy + i * 38); x.stroke(); }   // פסי גריל
      spots(16, '#ffb36a', 0.10, 0.22, 1.5, 3.5);         // נצנוץ עסיסי
      x.restore();
      side((w, h) => { const sg = x.createLinearGradient(0, 0, 0, h);
        sg.addColorStop(0, '#4a2610'); sg.addColorStop(1, '#331708');
        x.fillStyle = sg; x.fillRect(0, 0, w, h);
        for (let i = 0; i < 60; i++) { x.globalAlpha = 0.2; x.fillStyle = Math.random() < 0.5 ? '#63351a' : '#2a1206';
          x.fillRect(Math.random() * w, Math.random() * h, 3 + Math.random() * 7, 2 + Math.random() * 4); }
        x.globalAlpha = 1; });
    } else if (kind === 'tomato') {
      capClip();
      x.fillStyle = '#e23b2e'; x.fillRect(0, 0, 256, 256);                       // בשר העגבנייה
      const g = x.createRadialGradient(cx, cy, 6, cx, cy, R);
      g.addColorStop(0, '#ff6f52'); g.addColorStop(0.42, '#ef4b38'); g.addColorStop(1, '#d02a1e');
      x.fillStyle = g; x.fillRect(0, 0, 256, 256);
      for (let s = 0; s < 5; s++) {                                              // 5 מגורות גרעינים
        const a = s * 1.257 - 0.5;
        x.save(); x.translate(cx + Math.cos(a) * 62, cy + Math.sin(a) * 62); x.rotate(a);
        x.fillStyle = 'rgba(255,140,115,0.9)';
        x.beginPath(); x.ellipse(0, 0, 34, 20, 0, 0, 6.284); x.fill();
        x.fillStyle = '#ffdfb0';
        for (let k = 0; k < 6; k++) { x.save(); x.translate((Math.random() - 0.5) * 44, (Math.random() - 0.5) * 22);
          x.rotate(Math.random() * 3); x.beginPath(); x.ellipse(0, 0, 6, 3.6, 0, 0, 6.284); x.fill(); x.restore(); }
        x.restore();
      }
      x.fillStyle = 'rgba(255,190,170,0.85)'; x.beginPath(); x.arc(cx, cy, 17, 0, 6.284); x.fill();  // ליבה
      x.lineWidth = 9; x.strokeStyle = '#c21f14'; x.beginPath(); x.arc(cx, cy, R - 5, 0, 6.284); x.stroke();  // קליפה
      x.restore();
      side((w, h) => { x.fillStyle = '#d5281c'; x.fillRect(0, 0, w, h);
        const sg = x.createLinearGradient(0, 0, 0, h); sg.addColorStop(0, 'rgba(255,255,255,0.25)'); sg.addColorStop(0.4, 'rgba(255,255,255,0)');
        x.fillStyle = sg; x.fillRect(0, 0, w, h); });
    } else if (kind === 'cheese') {
      const g = x.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#ffd558'); g.addColorStop(0.5, '#f8b62e'); g.addColorStop(1, '#e89e18');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      for (let i = 0; i < 14; i++) {                                              // חורים קטנים של גבינה
        const px = 20 + Math.random() * (W - 40), py = 20 + Math.random() * (H - 40), pr = 4 + Math.random() * 9;
        x.fillStyle = 'rgba(200,125,10,0.5)'; x.beginPath(); x.arc(px, py + 2, pr, 0, 6.284); x.fill();
        x.fillStyle = 'rgba(255,220,120,0.9)'; x.beginPath(); x.arc(px, py, pr, 0, 6.284); x.fill();
      }
    } else if (kind === 'bunTop') {                                               // גרדיאנט אנכי לספרה (equirect)
      const g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#b96f1e'); g.addColorStop(0.35, '#d68f36'); g.addColorStop(0.75, '#efb968'); g.addColorStop(1, '#f8d9a0');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      for (let i = 0; i < 90; i++) { x.globalAlpha = 0.05 + Math.random() * 0.08;
        x.fillStyle = Math.random() < 0.6 ? '#a35f18' : '#ffe2a8';
        x.beginPath(); x.arc(Math.random() * W, Math.random() * H * 0.8, 3 + Math.random() * 10, 0, 6.284); x.fill(); }
      x.globalAlpha = 1;
    }
    return c.toDataURL();
  }
  function foodTex(kind) {
    if (!foodTexes[kind]) foodTexes[kind] = new BABYLON.Texture(foodAtlasURL(kind), scene);
    return foodTexes[kind];
  }

  // חומר PBR מלא — o: cc (לכה רטובה) / sheen (קטיפת קצפת) / trans (אור חודר) / bump / alpha
  function pbr(name, hex, rough, metal, o) {
    o = o || {};
    const m = new BABYLON.PBRMaterial(name, scene);
    m.albedoColor = BABYLON.Color3.FromHexString(hex);
    m.metallic = metal || 0; m.roughness = rough == null ? 0.4 : rough;
    if (o.alpha != null) m.alpha = o.alpha;
    if (o.cc) { m.clearCoat.isEnabled = true; m.clearCoat.intensity = o.cc; m.clearCoat.roughness = o.ccRough == null ? 0.12 : o.ccRough; }
    if (o.sheen) { m.sheen.isEnabled = true; m.sheen.intensity = o.sheen; }
    if (o.trans) { m.subSurface.isTranslucencyEnabled = true; m.subSurface.translucencyIntensity = o.trans; m.subSurface.tintColor = m.albedoColor.clone(); }
    if (o.bump) m.bumpTexture = getBump(o.bump);
    return m;
  }

  function init() {
    if (ready) return true;
    if (typeof BABYLON === 'undefined') return false;
    try {
      canvas = document.createElement('canvas');
      canvas.id = 'hero3d';
      Object.assign(canvas.style, { position: 'fixed', left: '0', top: '0', width: '100%', height: '100%',
        zIndex: '80', pointerEvents: 'none', display: 'none', opacity: '0', transition: 'opacity 0.3s ease' });
      document.body.appendChild(canvas);

      engine = new BABYLON.Engine(canvas, true, { alpha: true, premultipliedAlpha: false, stencil: true });
      scene = new BABYLON.Scene(engine);
      scene.clearColor = new BABYLON.Color4(0.03, 0.01, 0.06, 0.44);   // עמעום-תיאטרון: מחשיך את המשחק, המנה זוהרת

      // תאורת סביבה (IBL) — השתקפויות אמיתיות על ה-PBR
      try {
        const env = new BABYLON.EquiRectangularCubeTexture(envURL(), scene, 256);
        scene.environmentTexture = env; scene.environmentIntensity = 0.5;
      } catch (e) { console.warn('Hero3D: env skipped', e); }

      const ip = scene.imageProcessingConfiguration;
      ip.toneMappingEnabled = true;
      ip.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
      ip.contrast = 1.12; ip.exposure = 0.95;

      cam = new BABYLON.ArcRotateCamera('cam', Math.PI / 2, Math.PI / 2.75, 11, BABYLON.Vector3.Zero(), scene);
      cam.fov = 0.55;

      const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0.2, 1, 0.1), scene);
      hemi.intensity = 0.35; hemi.groundColor = new BABYLON.Color3(0.35, 0.3, 0.4);
      const key = new BABYLON.DirectionalLight('key', new BABYLON.Vector3(-0.55, -1, -0.45), scene);
      key.intensity = 1.7; key.position = new BABYLON.Vector3(7, 12, 5);
      key.shadowMinZ = 1; key.shadowMaxZ = 40;
      const rim = new BABYLON.PointLight('rim', new BABYLON.Vector3(-6, 3, -6), scene);
      rim.intensity = 0.6; rim.diffuse = new BABYLON.Color3(1, 0.8, 0.92);
      const fillp = new BABYLON.PointLight('fill', new BABYLON.Vector3(6, -2, 6), scene);
      fillp.intensity = 0.28; fillp.diffuse = new BABYLON.Color3(1, 0.95, 0.85);

      // צל אמיתי רך מהמנה על הצלחת (מחליף "קרקוע" מזויף)
      try {
        shadowGen = new BABYLON.ShadowGenerator(1024, key);
        shadowGen.usePercentageCloserFiltering = true;
        shadowGen.filteringQuality = BABYLON.ShadowGenerator.QUALITY_MEDIUM;
        shadowGen.darkness = 0.15; shadowGen.bias = 0.0005;
      } catch (e) { console.warn('Hero3D: shadows skipped', e); }

      // Bloom + FXAA + Depth of Field — זוהר קולנועי ורקע רך
      try {
        pipeline = new BABYLON.DefaultRenderingPipeline('heroPipe', true, scene, [cam]);
        pipeline.bloomEnabled = true; pipeline.bloomThreshold = 0.92; pipeline.bloomWeight = 0.32;
        pipeline.bloomKernel = 48; pipeline.bloomScale = 0.5;
        pipeline.fxaaEnabled = true;
        pipeline.depthOfFieldEnabled = true;
        pipeline.depthOfFieldBlurLevel = BABYLON.DepthOfFieldEffectBlurLevel.Low;
        pipeline.depthOfField.focalLength = 90; pipeline.depthOfField.fStop = 3.4; // פוקוס עמוק — המנה כולה חדה, רק שולי העומק רכים
        pipeline.depthOfField.focusDistance = 11000;
      } catch (e) { console.warn('Hero3D: pipeline skipped', e); }

      root = new BABYLON.TransformNode('root', scene);

      // צלחת קרמיקה לבנה מבריקה (clearcoat) + צל רך
      plate = BABYLON.MeshBuilder.CreateCylinder('plate', { diameter: 5.2, height: 0.22, tessellation: 64 }, scene);
      plate.position.y = -1.75;
      plate.material = pbr('plateMat', '#ccd0dd', 0.32, 0, { cc: 0.7, ccRough: 0.18 });
      plate.material.environmentIntensity = 0.3; // פחות אור-סביבה על הצלחת — שהצל של המנה ייקרא
      plate.receiveShadows = true;

      shadowDisc = BABYLON.MeshBuilder.CreateGround('shadow', { width: 6, height: 6 }, scene);
      shadowDisc.position.y = -1.86;
      const sm = new BABYLON.StandardMaterial('shadowMat', scene);
      sm.disableLighting = true; sm.diffuseColor = new BABYLON.Color3(0, 0, 0); sm.specularColor = new BABYLON.Color3(0, 0, 0);
      sm.opacityTexture = new BABYLON.Texture(radialURL(256, [[0, 'rgba(0,0,0,0.55)'], [0.5, 'rgba(0,0,0,0.28)'], [1, 'rgba(0,0,0,0)']]), scene);
      shadowDisc.material = sm;

      // גל-הלם (טבעת שמתרחבת בכניסה)
      ring = BABYLON.MeshBuilder.CreateTorus('ring', { diameter: 3, thickness: 0.09, tessellation: 48 }, scene);
      ring.rotation.x = Math.PI / 2; ring.position.y = -1.6;
      const rm = new BABYLON.StandardMaterial('ringMat', scene);
      rm.emissiveColor = new BABYLON.Color3(1, 0.82, 0.4); rm.disableLighting = true;
      ring.material = rm; ring.setEnabled(false);

      // זיקוקי-ניצוצות
      sparks = new BABYLON.ParticleSystem('sparks', 700, scene);
      sparks.particleTexture = new BABYLON.Texture(radialURL(64, [[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,240,180,0.8)'], [1, 'rgba(255,220,120,0)']]), scene);
      sparks.emitter = new BABYLON.Vector3(0, 0.2, 0);
      sparks.minEmitBox = new BABYLON.Vector3(-0.3, -0.3, -0.3);
      sparks.maxEmitBox = new BABYLON.Vector3(0.3, 0.3, 0.3);
      sparks.color1 = new BABYLON.Color4(1, 0.9, 0.4, 1); sparks.color2 = new BABYLON.Color4(1, 0.6, 0.85, 1);
      sparks.colorDead = new BABYLON.Color4(1, 1, 1, 0);
      sparks.minSize = 0.12; sparks.maxSize = 0.4;
      sparks.minLifeTime = 0.5; sparks.maxLifeTime = 1.2;
      sparks.emitRate = 1600;
      sparks.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
      sparks.gravity = new BABYLON.Vector3(0, -3.5, 0);
      sparks.direction1 = new BABYLON.Vector3(-5, 5, -5); sparks.direction2 = new BABYLON.Vector3(5, 8, 5);
      sparks.minEmitPower = 3; sparks.maxEmitPower = 8; sparks.updateSpeed = 0.02;

      // נצנוץ עדין מתמשך — אבק-פיות שמרחף סביב המנה כל זמן התצוגה
      twinkle = new BABYLON.ParticleSystem('twinkle', 120, scene);
      twinkle.particleTexture = new BABYLON.Texture(radialURL(64, [[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,250,220,0.9)'], [1, 'rgba(255,240,180,0)']]), scene);
      twinkle.emitter = new BABYLON.Vector3(0, 0.3, 0);
      twinkle.minEmitBox = new BABYLON.Vector3(-2.4, -1.6, -2.4);
      twinkle.maxEmitBox = new BABYLON.Vector3(2.4, 2.4, 2.4);
      twinkle.color1 = new BABYLON.Color4(1, 0.95, 0.7, 0.9); twinkle.color2 = new BABYLON.Color4(1, 0.8, 0.95, 0.8);
      twinkle.colorDead = new BABYLON.Color4(1, 1, 1, 0);
      twinkle.minSize = 0.05; twinkle.maxSize = 0.16;
      twinkle.minLifeTime = 1.2; twinkle.maxLifeTime = 2.4;
      twinkle.emitRate = 26;
      twinkle.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
      twinkle.gravity = new BABYLON.Vector3(0, 0.35, 0);
      twinkle.direction1 = new BABYLON.Vector3(-0.15, 0.1, -0.15); twinkle.direction2 = new BABYLON.Vector3(0.15, 0.4, 0.15);
      twinkle.minEmitPower = 0.1; twinkle.maxEmitPower = 0.4; twinkle.updateSpeed = 0.016;

      // אדים חמים — עולים מעל מנות חמות (בורגר/פיצה)
      steam = new BABYLON.ParticleSystem('steam', 60, scene);
      steam.particleTexture = new BABYLON.Texture(radialURL(128, [[0, 'rgba(255,255,255,0.5)'], [0.55, 'rgba(255,255,255,0.18)'], [1, 'rgba(255,255,255,0)']]), scene);
      steam.emitter = new BABYLON.Vector3(0, 1.3, 0); // מעל המנה — שהפחזניות ייוולדו באוויר ולא בתוך הלחמנייה
      steam.minEmitBox = new BABYLON.Vector3(-0.6, 0, -0.6);
      steam.maxEmitBox = new BABYLON.Vector3(0.6, 0.3, 0.6);
      steam.addColorGradient(0, new BABYLON.Color4(1, 1, 1, 0));
      steam.addColorGradient(0.25, new BABYLON.Color4(1, 1, 1, 0.3));
      steam.addColorGradient(1, new BABYLON.Color4(1, 1, 1, 0));
      steam.addSizeGradient(0, 0.6); steam.addSizeGradient(1, 2.4);
      steam.minLifeTime = 1.3; steam.maxLifeTime = 2.3;
      steam.emitRate = 20;
      steam.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
      steam.direction1 = new BABYLON.Vector3(-0.12, 1, -0.12); steam.direction2 = new BABYLON.Vector3(0.12, 1, 0.12);
      steam.minEmitPower = 0.5; steam.maxEmitPower = 1.1; steam.updateSpeed = 0.016;

      // מגע: גרירה מסובבת את המנה, הקשה מנצנצת ומאריכה את התצוגה
      canvas.addEventListener('pointerdown', (e) => {
        dragging = true; dragX = e.clientX; lastInteract = performance.now();
        try { sparks.manualEmitCount = 30; sparks.start(); } catch (err) {}
        try { window.Sound && Sound.pop && Sound.pop(); } catch (err) {}
        clearTimeout(hideTimer); hideTimer = setTimeout(() => api.hide(), 3200);
      });
      canvas.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        root.rotation.y += (e.clientX - dragX) * 0.012; dragX = e.clientX; lastInteract = performance.now();
      });
      window.addEventListener('pointerup', () => { dragging = false; });

      // סיבוב/שינוי גודל: מרעננים את מנוע הרינדור, ואם יש בנייה חיה פעילה גם ממפים
      // מחדש את הקנבס לבמת ה-Phaser — אחרת סיבוב באמצע הרכבה משאיר את התלת-ממד
      // ממופה לגבולות הישנים והבורגר "בורח" מהמגש.
      // הערה קריטית: Phaser משנה את גודל קנבס-המשחק שלו באופן א-סינכרוני בתגובה
      // לאותו אירוע resize — אם נמפה מיד נקבל מלבן-ביניים ישן שלא יתוקן יותר
      // (בדקנו בפועל: קריאה מיידית תפסה רוחב/גובה ישנים לצמיתות). לכן ממתינים
      // שני requestAnimationFrame כדי שקנבס המשחק כבר יהיה בגודלו הסופי.
      function refreshStageMapping() {
        requestAnimationFrame(() => requestAnimationFrame(() => { try { if (buildMode) canvasStageArea(); } catch (e) {} }));
      }
      window.addEventListener('resize', () => { try { engine.resize(); refreshStageMapping(); } catch (e) {} });
      window.addEventListener('orientationchange', () => {
        setTimeout(() => { try { engine.resize(); refreshStageMapping(); } catch (e) {} }, 300);
      });
      ready = true;
    } catch (e) { console.warn('Hero3D init failed', e); ready = false; }
    return ready;
  }

  // ---- עזרי build: המנה ה-3D משקפת את מה שהילדה באמת הכינה ----
  function baseHex(food, build, fallback) {
    try {
      if (build && build.base && typeof G !== 'undefined' && G.baseColor) {   // const G לא יושב על window
        const c = G.baseColor(food, build.base);
        if (c != null) return '#' + ('000000' + c.toString(16)).slice(-6);
      }
    } catch (e) {}
    return fallback;
  }
  function has(build, t) { return !!(build && build.toppings && build.toppings.indexOf(t) >= 0); }
  // פיזור n עותקים על עיגול אופקי (תוספות על פיצה/דונאט)
  function scatter(node, n, rMin, rMax, y, maker) {
    for (let i = 0; i < n; i++) {
      const m = maker(i);
      const a = Math.random() * Math.PI * 2, rr = rMin + Math.random() * (rMax - rMin);
      m.position.set(Math.cos(a) * rr, y, Math.sin(a) * rr);
      m.parent = node;
    }
  }
  // דובדבן עם גבעול (משותף לשייק/דונאט)
  function makeCherry(name, scale) {
    const n = new BABYLON.TransformNode(name, scene);
    const c = BABYLON.MeshBuilder.CreateSphere(name + 'b', { diameter: 0.5 * scale, segments: 18 }, scene);
    c.material = pbr(name + 'm', '#e23047', 0.1, 0, { cc: 1, ccRough: 0.06 }); c.parent = n;
    const st = BABYLON.MeshBuilder.CreateCylinder(name + 's', { diameter: 0.055 * scale, height: 0.32 * scale, tessellation: 8 }, scene);
    st.position.y = 0.28 * scale; st.rotation.z = 0.3; st.material = pbr(name + 'sm', '#4a7c2f', 0.5); st.parent = n;
    return n;
  }
  // גוף מעוגל: 2 קופסאות חוצות + 4 גלילי-פינה — "קופסה מעוגלת" בלי extrude/earcut
  // (CreatePolygon/ExtrudePolygon תלויים ב-earcut הגלובלי שלא נטען בפרויקט — יזרקו שגיאה)
  function roundedSlab(id, w, h, d, r, mat, tess) {
    const n = new BABYLON.TransformNode(id, scene);
    const boxX = BABYLON.MeshBuilder.CreateBox(id + 'bx', { width: w, height: h, depth: Math.max(0.01, d - 2 * r) }, scene);
    const boxZ = BABYLON.MeshBuilder.CreateBox(id + 'bz', { width: Math.max(0.01, w - 2 * r), height: h, depth: d }, scene);
    boxX.material = boxZ.material = mat; boxX.parent = n; boxZ.parent = n;
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach((sgn, i) => {
      const c = BABYLON.MeshBuilder.CreateCylinder(id + 'c' + i, { diameter: r * 2, height: h, tessellation: tess || 24 }, scene);
      c.position.set(sgn[0] * (w / 2 - r), 0, sgn[1] * (d / 2 - r)); c.material = mat; c.parent = n;
    });
    return n;
  }

  function buildDonut(build) {
    const node = new BABYLON.TransformNode('donut', scene); node.parent = root;
    const cake = BABYLON.MeshBuilder.CreateTorus('dCake', { diameter: 3.2, thickness: 1.5, tessellation: 72 }, scene);
    cake.material = pbr('dGlaze', baseHex('donut', build, '#ff8ac4'), 0.13, 0, { cc: 0.9, ccRough: 0.1, bump: 'fine' }); cake.parent = node;
    if (!build || has(build, '🌈') || !build.toppings || !build.toppings.length) {
      // סוכריות צבעוניות (ברירת מחדל / כשבחרה 🌈)
      const cols = ['#fff27a', '#5fe0b0', '#5fb8ff', '#ffffff', '#ff5f86', '#a86bff'];
      for (let i = 0; i < 34; i++) {
        const s = BABYLON.MeshBuilder.CreateCapsule('sp' + i, { radius: 0.09, height: 0.5, tessellation: 8, capSubdivisions: 3 }, scene);
        s.material = pbr('spm' + i, cols[i % cols.length], 0.35, 0, { cc: 0.5 });
        const a = Math.random() * Math.PI * 2, rr = 1.62 + (Math.random() - 0.5) * 0.72;
        s.position.set(Math.cos(a) * rr, 0.62 + Math.random() * 0.12, Math.sin(a) * rr);
        s.rotation.set(Math.PI / 2 + (Math.random() - 0.5) * 0.7, Math.random() * 3, Math.random() * 3); s.parent = node;
      }
    }
    if (has(build, '🍒')) [0.5, 2.6, 4.4].forEach((a, i) => {
      const ch = makeCherry('dCh' + i, 1); ch.position.set(Math.cos(a) * 1.55, 0.78, Math.sin(a) * 1.55); ch.parent = node;
    });
    if (has(build, '⭐')) scatter(node, 6, 1.2, 1.95, 0.68, (i) => {
      const s = BABYLON.MeshBuilder.CreateSphere('dSt' + i, { diameter: 0.26, segments: 12 }, scene);
      s.material = pbr('dStM' + i, '#ffd24c', 0.15, 0.6, { cc: 0.8 }); return s;
    });
    if (has(build, '🍪')) scatter(node, 5, 1.25, 1.9, 0.66, (i) => {
      const c = BABYLON.MeshBuilder.CreateCylinder('dCk' + i, { diameter: 0.42, height: 0.1, tessellation: 16 }, scene);
      c.material = pbr('dCkM' + i, '#8a5a3c', 0.6, 0, { bump: 'fine' }); c.rotation.set(Math.random() * 0.6, 0, Math.random() * 0.6); return c;
    });
    if (has(build, '🍬')) scatter(node, 6, 1.2, 1.95, 0.66, (i) => {
      const s = BABYLON.MeshBuilder.CreateSphere('dCd' + i, { diameter: 0.24, segments: 12 }, scene);
      s.material = pbr('dCdM' + i, i % 2 ? '#ff5f86' : '#5fb8ff', 0.12, 0, { cc: 1 }); return s;
    });
    return node;
  }
  function buildPizza(build) {
    const node = new BABYLON.TransformNode('pizza', scene); node.parent = root;
    const base = BABYLON.MeshBuilder.CreateCylinder('pBase', { diameter: 3.7, height: 0.32, tessellation: 72 }, scene);
    base.material = pbr('pDough', '#e3a862', 0.75, 0, { bump: 'coarse' }); base.parent = node;
    const crust = BABYLON.MeshBuilder.CreateTorus('pCrust', { diameter: 3.65, thickness: 0.5, tessellation: 72 }, scene);
    crust.position.y = 0.06; crust.material = pbr('pCrustM', '#cf9050', 0.72, 0, { bump: 'coarse' }); crust.parent = node;
    const sauce = BABYLON.MeshBuilder.CreateCylinder('pSauce', { diameter: 3.0, height: 0.06, tessellation: 56 }, scene);
    sauce.position.y = 0.18; sauce.material = pbr('pSauceM', '#cc2b22', 0.3, 0, { cc: 0.55, ccRough: 0.2 }); sauce.parent = node;
    const cheese = BABYLON.MeshBuilder.CreateCylinder('pCheese', { diameter: 2.92, height: 0.05, tessellation: 56 }, scene);
    cheese.position.y = 0.23; cheese.material = pbr('pCheeseM', '#e89b28', 0.48, 0, { bump: 'fine', trans: 0.15 }); cheese.parent = node;
    // תוספות לפי מה שהונח באמת; בלי build — מיקס ברירת מחדל
    const makers = {
      '🍄': (i) => { const m = BABYLON.MeshBuilder.CreateSphere('pMu' + i, { diameter: 0.42, slice: 0.55, segments: 14 }, scene);
        m.material = pbr('pMuM' + i, '#e8d8c0', 0.55, 0, { bump: 'fine' }); return m; },
      '🫑': (i) => { const m = BABYLON.MeshBuilder.CreateTorus('pPe' + i, { diameter: 0.4, thickness: 0.08, tessellation: 18 }, scene);
        m.material = pbr('pPeM' + i, '#3fa83f', 0.4, 0, { cc: 0.4 }); return m; },
      '🫒': (i) => { const m = BABYLON.MeshBuilder.CreateTorus('pOl' + i, { diameter: 0.26, thickness: 0.1, tessellation: 14 }, scene);
        m.material = pbr('pOlM' + i, '#3a4028', 0.25, 0, { cc: 0.7 }); return m; },
      '🌽': (i) => { const m = BABYLON.MeshBuilder.CreateSphere('pCo' + i, { diameter: 0.16, segments: 8 }, scene);
        m.material = pbr('pCoM' + i, '#ffd24c', 0.35, 0, { cc: 0.3 }); return m; },
      '🍍': (i) => { const m = BABYLON.MeshBuilder.CreateBox('pPi' + i, { width: 0.36, height: 0.09, depth: 0.3 }, scene);
        m.material = pbr('pPiM' + i, '#ffcf3c', 0.3, 0, { cc: 0.5 }); m.rotation.y = Math.random() * 3; return m; },
      '🧅': (i) => { const m = BABYLON.MeshBuilder.CreateTorus('pOn' + i, { diameter: 0.38, thickness: 0.05, tessellation: 18 }, scene);
        m.material = pbr('pOnM' + i, '#f2e2ee', 0.35, 0, { trans: 0.4 }); return m; }
    };
    const chosen = (build && build.toppings) ? build.toppings.filter(t => makers[t]) : [];
    if (chosen.length) chosen.forEach((t, k) => scatter(node, t === '🌽' ? 12 : 6, 0.15, 1.15, 0.29, makers[t]));
    else { const tcols = ['#b3402a', '#3fa83f', '#7a3b16'];
      for (let i = 0; i < 14; i++) {
        const t = BABYLON.MeshBuilder.CreateCylinder('pt' + i, { diameter: 0.34, height: 0.09, tessellation: 12 }, scene);
        t.material = pbr('ptm' + i, tcols[i % tcols.length], 0.5);
        const a = Math.random() * 6.283, rr = Math.random() * 1.1; t.position.set(Math.cos(a) * rr, 0.28, Math.sin(a) * rr); t.parent = node;
      } }
    return node;
  }
  // ---- חלקי בורגר לשימוש חוזר: גם למנה המוגמרת וגם לבנייה החיה ----
  // כל חלק: TransformNode עם המשים ב-offset מקומי; adv = כמה גובה הוא מוסיף לערימה
  let partSeq = 0;
  function makeBurgerPart(key, parent) {
    const id = 'bp' + (partSeq++);
    const n = new BABYLON.TransformNode(id, scene); n.parent = parent;
    let adv = 0;
    // מיפוי אטלס לגלילים: כיפות = חצי שמאלי של הטקסטורה, דופן = רצועה ימנית
    const CAP_UV = new BABYLON.Vector4(0.02, 0.02, 0.48, 0.98);
    const SIDE_UV = new BABYLON.Vector4(0.58, 0.04, 0.99, 0.96);
    switch (key) {
      case 'bunB': {
        const m = BABYLON.MeshBuilder.CreateCylinder(id + 'm',
          { diameter: 3, height: 0.62, tessellation: 64, faceUV: [CAP_UV, SIDE_UV, CAP_UV] }, scene);
        const mat = pbr(id + 'mat', '#ffffff', 0.58, 0, { bump: 'coarse' });
        mat.albedoTexture = foodTex('bun');
        m.material = mat; m.parent = n;
        adv = 0.35; break;
      }
      case '🥬': {
        // עלי חסה מסולסלים — טבעת של "גלים" במקום בייגלה ירוק
        const mat = pbr(id + 'mat', '#5cb83c', 0.5, 0, { bump: 'fine', trans: 0.35 });
        for (let i = 0; i < 11; i++) {
          const a = (i / 11) * Math.PI * 2;
          const s = BABYLON.MeshBuilder.CreateSphere(id + 'l' + i, { diameter: 1.1, segments: 12 }, scene);
          s.position.set(Math.cos(a) * 1.32, 0.03, Math.sin(a) * 1.32);
          s.scaling.set(1, 0.3, 0.6);
          s.rotation.y = -a; s.rotation.x = (i % 2 ? 0.22 : -0.14);
          s.material = mat; s.parent = n;
        }
        adv = 0.18; break;
      }
      case 'patty': {
        const m = BABYLON.MeshBuilder.CreateCylinder(id + 'm',
          { diameter: 3.1, height: 0.55, tessellation: 64, faceUV: [CAP_UV, SIDE_UV, CAP_UV] }, scene);
        const mat = pbr(id + 'mat', '#ffffff', 0.62, 0, { bump: 'coarse', cc: 0.22, ccRough: 0.35 });   // לכה קלה — עסיסי
        mat.albedoTexture = foodTex('patty');
        m.position.y = 0.14; m.material = mat; m.parent = n;
        adv = 0.42; break;
      }
      case '🧀': {
        const m = BABYLON.MeshBuilder.CreateBox(id + 'm', { width: 3.15, height: 0.1, depth: 3.15 }, scene);
        const mat = pbr(id + 'mat', '#ffffff', 0.3, 0, { trans: 0.35 });
        mat.albedoTexture = foodTex('cheese');
        m.rotation.y = Math.PI / 4; m.material = mat; m.parent = n;
        adv = 0.12; break;
      }
      case '🍅': {
        const m = BABYLON.MeshBuilder.CreateCylinder(id + 'm',
          { diameter: 2.75, height: 0.18, tessellation: 48, faceUV: [CAP_UV, SIDE_UV, CAP_UV] }, scene);
        const mat = pbr(id + 'mat', '#ffffff', 0.24, 0, { cc: 0.65, ccRough: 0.14 });
        mat.albedoTexture = foodTex('tomato');
        m.position.y = 0.06; m.material = mat; m.parent = n;
        adv = 0.18; break;
      }
      case '🍳': {
        const w = BABYLON.MeshBuilder.CreateCylinder(id + 'w', { diameter: 2.3, height: 0.1, tessellation: 36 }, scene);
        w.position.y = 0.04; w.material = pbr(id + 'wm', '#fffaf2', 0.4, 0, { sheen: 0.4 }); w.parent = n;
        const yk = BABYLON.MeshBuilder.CreateSphere(id + 'y', { diameter: 0.8, segments: 18 }, scene);
        yk.position.y = 0.12; yk.scaling.y = 0.5; yk.material = pbr(id + 'ym', '#ffb527', 0.2, 0, { cc: 0.9, ccRough: 0.1 }); yk.parent = n;
        adv = 0.16; break;
      }
      case '🥒': {
        [0, 1, 2].forEach((i) => {
          // חמוצים מציצים מעבר לשולי הלחמנייה (רדיוס 1.5) — שיהיו גלויים
          const a = 0.6 + i * 2.1, rr = 1.45;
          const pk = BABYLON.MeshBuilder.CreateCylinder(id + 'p' + i, { diameter: 0.7, height: 0.1, tessellation: 16 }, scene);
          pk.position.set(Math.cos(a) * rr, 0.05, Math.sin(a) * rr);
          pk.material = pbr(id + 'pm' + i, '#5f9e3a', 0.45, 0, { cc: 0.5, bump: 'fine' }); pk.parent = n;
        });
        adv = 0.07; break;
      }
      case '🧅': {
        [0, 1].forEach((i) => {
          const on = BABYLON.MeshBuilder.CreateTorus(id + 'o' + i, { diameter: 2.1 - i * 0.5, thickness: 0.09, tessellation: 24 }, scene);
          on.position.set(i ? 0.55 : -0.4, 0.08, i ? -0.4 : 0.3); on.material = pbr(id + 'om' + i, '#f2e2ee', 0.35, 0, { trans: 0.4 }); on.parent = n;
        });
        adv = 0.07; break;
      }
      case 'bunT': {
        const m = BABYLON.MeshBuilder.CreateSphere(id + 'm', { diameter: 3, slice: 0.52, segments: 40 }, scene);
        const mat = pbr(id + 'mat', '#ffffff', 0.5, 0, { bump: 'coarse' });
        mat.albedoTexture = foodTex('bunTop');                            // קלייה: כהה למעלה, בהיר בשוליים
        m.position.y = 0.1; m.scaling.y = 0.95; m.material = mat; m.parent = n;
        const seedMat = pbr(id + 'sm', '#fff6dd', 0.45, 0, { sheen: 0.3 });
        for (let i = 0; i < 14; i++) {
          const s = BABYLON.MeshBuilder.CreateSphere(id + 's' + i, { diameter: 0.17, segments: 8 }, scene);
          s.material = seedMat;
          const a = Math.random() * 6.283, rr = Math.random() * 0.95;
          s.position.set(Math.cos(a) * rr, 0.27 + Math.random() * 0.5, Math.sin(a) * rr);
          s.scaling.set(1, 0.6, 0.75); s.rotation.y = Math.random() * 3;
          s.parent = n;
        }
        adv = 0; break;
      }
      default: { n.dispose(); return null; }
    }
    return { node: n, adv };
  }

  function buildBurger(build) {
    const node = new BABYLON.TransformNode('burger', scene); node.parent = root;
    const all = !build;
    let y = -0.95;
    const put = (key) => { const p = makeBurgerPart(key, node); p.node.position.y = y; y += p.adv; };
    put('bunB');
    if (all || has(build, '🥬')) put('🥬');
    put('patty');
    if (all || has(build, '🧀')) put('🧀');
    if (has(build, '🍅')) put('🍅');
    if (has(build, '🍳')) put('🍳');
    if (has(build, '🥒')) put('🥒');
    if (has(build, '🧅')) put('🧅');
    put('bunT');
    return node;
  }
  function buildShake(build) {
    const node = new BABYLON.TransformNode('shake', scene); node.parent = root;
    const flavor = baseHex('shake', build, '#ff86ba');
    const cup = BABYLON.MeshBuilder.CreateCylinder('sCup', { diameterTop: 2, diameterBottom: 1.5, height: 2.8, tessellation: 56 }, scene);
    cup.position.y = -0.1;
    cup.material = pbr('sGlass', '#eaf4ff', 0.06, 0, { alpha: 0.35, cc: 1, ccRough: 0.04 });
    cup.parent = node;
    const liquid = BABYLON.MeshBuilder.CreateCylinder('sLiq', { diameterTop: 1.84, diameterBottom: 1.42, height: 2.5, tessellation: 56 }, scene);
    liquid.position.y = -0.25; liquid.material = pbr('sLiqM', flavor, 0.28, 0, { cc: 0.5 }); liquid.parent = node;
    // גלידה שלוקית (סופט-סרב) — כדורים יורדים בגודל, בגוון עדין של הטעם שנבחר
    const creamCol = build && build.base && build.base !== '🍦' ? flavor : '#fff1f7';
    const cream = BABYLON.Color3.FromHexString(creamCol).add(BABYLON.Color3.White().scale(0.55));
    const creamHex = '#' + [cream.r, cream.g, cream.b].map(v => ('0' + Math.round(Math.min(1, v) * 255).toString(16)).slice(-2)).join('');
    const swirl = [[1.85, 1.25], [1.45, 1.85], [1.02, 2.35], [0.6, 2.72]];
    swirl.forEach((sw, i) => {
      const sc = BABYLON.MeshBuilder.CreateSphere('sw' + i, { diameter: sw[0], segments: 28 }, scene);
      sc.position.y = sw[1]; sc.scaling.y = 0.9; sc.material = pbr('swm' + i, creamHex, 0.34, 0, { sheen: 0.55, trans: 0.3 }); sc.parent = node;
    });
    if (!build || has(build, '🍒')) { const ch = makeCherry('sCh', 1.1); ch.position.y = 3.02; ch.parent = node; }
    if (has(build, '🌈')) for (let i = 0; i < 12; i++) {
      // סוכריות על הקצפת — צמודות לקונטור הסופט-סרב (רדיוס קטן ככל שעולים)
      const cols = ['#fff27a', '#5fe0b0', '#5fb8ff', '#ff5f86', '#a86bff'];
      const s = BABYLON.MeshBuilder.CreateCapsule('sSp' + i, { radius: 0.055, height: 0.3, tessellation: 8, capSubdivisions: 2 }, scene);
      s.material = pbr('sSpM' + i, cols[i % cols.length], 0.3, 0, { cc: 0.5 });
      const yy = 1.4 + Math.random() * 1.2, rr = Math.max(0.15, 1 - (yy - 1.4) * 0.55), a = Math.random() * Math.PI * 2;
      s.position.set(Math.cos(a) * rr, yy, Math.sin(a) * rr);
      s.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3); s.parent = node;
    }
    if (has(build, '🍪')) { const ck = BABYLON.MeshBuilder.CreateCylinder('sCk', { diameter: 0.9, height: 0.12, tessellation: 20 }, scene);
      ck.position.set(0.55, 2.5, 0.2); ck.rotation.z = 1.1; ck.material = pbr('sCkM', '#8a5a3c', 0.6, 0, { bump: 'fine' }); ck.parent = node; }
    if (has(build, '🥥')) for (let i = 0; i < 10; i++) {
      const f = BABYLON.MeshBuilder.CreateBox('sCo' + i, { width: 0.16, height: 0.04, depth: 0.1 }, scene);
      f.material = pbr('sCoM' + i, '#ffffff', 0.5, 0, { sheen: 0.4 });
      const yy = 1.5 + Math.random() * 1.1, rr = Math.max(0.15, 1 - (yy - 1.4) * 0.55), a = Math.random() * Math.PI * 2;
      f.position.set(Math.cos(a) * rr, yy, Math.sin(a) * rr);
      f.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3); f.parent = node;
    }
    if (has(build, '⭐')) { const st = BABYLON.MeshBuilder.CreateSphere('sSt', { diameter: 0.34, segments: 14 }, scene);
      st.position.set(-0.5, 2.65, 0.15); st.material = pbr('sStM', '#ffd24c', 0.15, 0.6, { cc: 0.8 }); st.parent = node; }
    return node;
  }

  function buildPancake(build) {
    const node = new BABYLON.TransformNode('pancake', scene); node.parent = root;
    const syrup = baseHex('pancake', build, '#cf8a2c');
    // מגדל שלושה פנקייקים תפוחים
    const ys = [-1.05, -0.58, -0.11], dia = [3.5, 3.3, 3.08];
    ys.forEach((yy, i) => {
      const pk = BABYLON.MeshBuilder.CreateCylinder('pk' + i, { diameter: dia[i], height: 0.44, tessellation: 56 }, scene);
      pk.position.y = yy; pk.material = pbr('pkm' + i, i === 2 ? '#e6a94e' : '#dd9f47', 0.6, 0, { bump: 'fine' }); pk.parent = node;
    });
    // בריכת סירופ מבריקה על הפסגה + נטיפות שנוזלות בצדדים
    const syrMat = pbr('pkSyrM', syrup, 0.16, 0, { cc: 0.95, ccRough: 0.07 });
    const pool = BABYLON.MeshBuilder.CreateCylinder('pkSyr', { diameter: 2.95, height: 0.14, tessellation: 48 }, scene);
    pool.position.y = 0.16; pool.material = syrMat; pool.parent = node;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.random() * 0.35;
      const d = BABYLON.MeshBuilder.CreateSphere('pkD' + i, { diameter: 0.42, segments: 12 }, scene);
      d.scaling.y = 1.6 + Math.random(); d.position.set(Math.cos(a) * 1.48, -0.05 - Math.random() * 0.7, Math.sin(a) * 1.48);
      d.material = syrMat; d.parent = node;
    }
    // חתיכת חמאה נמסה על הפסגה
    const butter = BABYLON.MeshBuilder.CreateBox('pkBut', { width: 0.75, height: 0.3, depth: 0.75 }, scene);
    butter.position.y = 0.34; butter.rotation.y = 0.4;
    butter.material = pbr('pkButM', '#ffdb63', 0.35, 0, { sheen: 0.5, cc: 0.4, ccRough: 0.2 }); butter.parent = node;
    // פירות לפי ההרכבה
    const straw = (i) => { const m = BABYLON.MeshBuilder.CreateSphere('pkS' + i, { diameter: 0.5, segments: 14 }, scene); m.scaling.y = 1.3; m.material = pbr('pkSM' + i, '#e83a4e', 0.28, 0, { cc: 0.5 }); return m; };
    const blue  = (i) => { const m = BABYLON.MeshBuilder.CreateSphere('pkB' + i, { diameter: 0.34, segments: 12 }, scene); m.material = pbr('pkBM' + i, '#5566cc', 0.3, 0, { cc: 0.6 }); return m; };
    const bana  = (i) => { const m = BABYLON.MeshBuilder.CreateCylinder('pkN' + i, { diameter: 0.44, height: 0.13, tessellation: 16 }, scene); m.material = pbr('pkNM' + i, '#ffe08a', 0.4, 0, {}); m.rotation.y = Math.random() * 3; return m; };
    if (has(build, '🍓')) scatter(node, 5, 0.3, 1.1, 0.42, straw);
    if (has(build, '🫐')) scatter(node, 8, 0.3, 1.15, 0.34, blue);
    if (has(build, '🍌')) scatter(node, 6, 0.3, 1.1, 0.3, bana);
    if (has(build, '🍒')) { const ch = makeCherry('pkCh', 1); ch.position.set(0, 0.5, 0); ch.parent = node; }
    if (has(build, '⭐')) scatter(node, 5, 0.3, 1.1, 0.44, (i) => { const s = BABYLON.MeshBuilder.CreateSphere('pkSt' + i, { diameter: 0.3, segments: 12 }, scene); s.material = pbr('pkStM' + i, '#ffd24c', 0.15, 0.6, { cc: 0.8 }); return s; });
    if (!build || !build.toppings || !build.toppings.length) { scatter(node, 6, 0.3, 1.1, 0.34, blue); scatter(node, 3, 0.3, 0.9, 0.42, straw); }
    return node;
  }

  // ---- העגלה עצמה: "רגע קולנועי" חד-פעמי בכניסה לעולם (Hero3D.showCart), לא מוצג ליד המאכלים.
  // בכוונה לא ברשימת FOOD_BUILDERS למטה — אינה "מנה" ולא עוברת דרך setCurrent/disposeBuilders.
  // בכוונה לא כוללת בסבב הזה: לוח תפריט, צנצנות, דמות אלה בחלון, דגלוני קישוט —
  // זהו צילום-רוחב של כמה שניות, לא תקריב על פרטים קטנים.
  function buildCartHero() {
    const node = new BABYLON.TransformNode('cartHero', scene); node.parent = root;
    const bodyMat = pbr('cartBody', '#f0b350', 0.45, 0, { sheen: 0.3 });
    const skirtMat = pbr('cartSkirtM', '#c8860c', 0.5, 0, {});

    const skirt = roundedSlab('cartSkirt', 6.4, 0.7, 2.4, 0.35, skirtMat, 20);
    skirt.position.y = -1.3; skirt.parent = node;
    const body = roundedSlab('cartBodyN', 6.4, 2.6, 2.4, 0.4, bodyMat, 20);
    body.position.y = 0.35; body.parent = node;

    const counter = BABYLON.MeshBuilder.CreateBox('cartCounter', { width: 3.0, height: 0.26, depth: 0.55 }, scene);
    counter.position.set(0.3, -0.7, 1.45);
    counter.material = pbr('cartCounterM', '#fff3d6', 0.4, 0, { cc: 0.25 });
    counter.parent = node;

    const frame = BABYLON.MeshBuilder.CreateBox('cartFrame', { width: 2.1, height: 0.95, depth: 0.1 }, scene);
    frame.position.set(-1.5, 0.55, 1.15);
    frame.material = pbr('cartFrameM', '#ff5ca8', 0.4, 0, { sheen: 0.25 });
    frame.parent = node;
    const glass = BABYLON.MeshBuilder.CreateBox('cartGlass', { width: 1.9, height: 0.75, depth: 0.08 }, scene);
    glass.position.set(-1.5, 0.55, 1.22);
    glass.material = pbr('cartGlassM', '#8fd6ea', 0.06, 0, { alpha: 0.6, cc: 1, ccRough: 0.04 });
    glass.parent = node;
    const glow = BABYLON.MeshBuilder.CreatePlane('cartGlow', { width: 1.75, height: 0.68 }, scene);
    glow.position.set(-1.5, 0.55, 1.08);
    const glowMat = new BABYLON.StandardMaterial('cartGlowM', scene);
    glowMat.emissiveColor = new BABYLON.Color3(1, 0.86, 0.55); glowMat.disableLighting = true;
    glow.material = glowMat; glow.parent = node;

    const awningColors = ['#ff5ca8', '#ffffff'];
    for (let i = 0; i < 8; i++) {
      const x = -3.0 + i * 0.75 + 0.375;
      const seg = BABYLON.MeshBuilder.CreateBox('cartAwn' + i, { width: 0.85, height: 0.5, depth: 0.85 }, scene);
      seg.position.set(x, 1.95, 1.5); seg.rotation.x = -0.4;
      seg.material = pbr('cartAwnM' + i, awningColors[i % 2], 0.4, 0, {});
      seg.parent = node;
      const scallop = BABYLON.MeshBuilder.CreateSphere('cartScal' + i, { diameter: 0.82, slice: 0.5, segments: 14 }, scene);
      scallop.rotation.x = Math.PI; scallop.position.set(x, 1.55, 1.9);
      scallop.material = pbr('cartScalM' + i, awningColors[i % 2], 0.4, 0, {});
      scallop.parent = node;
    }
    const trim = BABYLON.MeshBuilder.CreateBox('cartTrim', { width: 6.3, height: 0.14, depth: 0.5 }, scene);
    trim.position.set(0, 2.2, 1.1);
    trim.material = pbr('cartTrimM', '#ffd24c', 0.3, 0, { cc: 0.3 });
    trim.parent = node;

    [-1.9, 1.9].forEach((x, i) => {
      const tire = BABYLON.MeshBuilder.CreateCylinder('cartTire' + i, { diameter: 1.0, height: 0.34, tessellation: 28 }, scene);
      tire.rotation.z = Math.PI / 2; tire.position.set(x, -1.7, 0);
      tire.material = pbr('cartTireM' + i, '#4a3552', 0.6, 0, {}); tire.parent = node;
      const hub = BABYLON.MeshBuilder.CreateCylinder('cartHub' + i, { diameter: 0.42, height: 0.36, tessellation: 20 }, scene);
      hub.rotation.z = Math.PI / 2; hub.position.set(x, -1.7, 0);
      hub.material = pbr('cartHubM' + i, '#d9d9e8', 0.3, 0, { cc: 0.4 }); hub.parent = node;
    });

    node.getChildMeshes().forEach(m => { m.receiveShadows = true; });
    if (shadowGen) node.getChildMeshes().forEach(m => shadowGen.addShadowCaster(m));
    return node;
  }

  const FOOD_BUILDERS = { donut: buildDonut, pizza: buildPizza, burger: buildBurger, shake: buildShake, pancake: buildPancake };

  // בנייה טרייה בכל תצוגה — המנה משקפת את ה-build המדויק (צבע/תוספות).
  // הרכיבים ישנים נזרקים; טקסטורות ה-bump משותפות ולכן לא נמחקות.
  function disposeBuilders() {
    Object.keys(builders).forEach(k => {
      try {
        builders[k].getChildMeshes().forEach(m => { if (m.material) m.material.dispose(false, false); });
        builders[k].dispose(false);
      } catch (e) {}
    });
    builders = {};
  }
  function setCurrent(foodKey, build) {
    disposeBuilders();
    const node = (FOOD_BUILDERS[foodKey] || FOOD_BUILDERS.donut)(build);
    builders[foodKey] = node;
    if (shadowGen) node.getChildMeshes().forEach(m => shadowGen.addShadowCaster(m));
    current = foodKey;
  }

  function easeOutBack(t) { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }

  // ---- מצב בנייה חי: ההרכבה מתרחשת בתלת-ממד, מרכיבים נופלים על הצלחת ----
  let buildMode = false, buildNode = null, buildY = 0, buildParts = 0;

  function canvasFullscreen() {
    Object.assign(canvas.style, { left: '0', top: '0', width: '100%', height: '100%' });
  }
  // הקנבס ממופה בדיוק לגבולות במת התיאטרון שמציירת סצנת ההרכבה (עיצוב 1280x800:
  // x 150..1130, y 246..602) — התלת-ממד נחתך לבמה, והמגש/כפתורים שמתחת חיים
  function canvasStageArea() {
    const gc = document.querySelector('#game canvas');
    if (!gc) return;
    const r = gc.getBoundingClientRect();
    Object.assign(canvas.style, {
      left: (r.x + r.width * (150 / 1280)) + 'px',
      top: (r.y + r.height * (246 / 800)) + 'px',
      width: (r.width * (980 / 1280)) + 'px',
      height: (r.height * (356 / 800)) + 'px'
    });
  }
  // נפילה + באונס בקיפריימים ידניים — בלי easing functions (BounceEase עם
  // פרמטרים שבריים מייצרת f(1)≠1 והחלקים בורחים מתחת ליעד)
  function dropAnim(tn, targetY) {
    const start = tn.position.y, dist = start - targetY;
    const drop = new BABYLON.Animation('drop' + partSeq, 'position.y', 60,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    drop.setKeys([                                     // נפילה קוודרטית (תאוצה) + שתי קפיצות קטנות
      { frame: 0,  value: start },
      { frame: 4,  value: start - dist * 0.08 },
      { frame: 8,  value: start - dist * 0.33 },
      { frame: 12, value: start - dist * 0.72 },
      { frame: 15, value: targetY },
      { frame: 19, value: targetY + 0.34 },
      { frame: 23, value: targetY },
      { frame: 26, value: targetY + 0.1 },
      { frame: 29, value: targetY }
    ]);
    const squash = new BABYLON.Animation('sq' + partSeq, 'scaling.y', 60,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    squash.setKeys([                                   // סקווש בנחיתה הראשונה
      { frame: 0,  value: 1 },
      { frame: 15, value: 1 },
      { frame: 17, value: 0.72 },
      { frame: 22, value: 1.06 },
      { frame: 26, value: 1 }
    ]);
    tn.animations = [drop, squash];
    scene.beginAnimation(tn, 0, 29, false);
  }
  function builderRotDown(e) {
    const r = canvas.getBoundingClientRect();
    if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
      dragging = true; dragX = e.clientX; lastInteract = performance.now();
    }
  }
  function builderRotMove(e) {
    if (dragging && buildMode) { root.rotation.y += (e.clientX - dragX) * 0.012; dragX = e.clientX; lastInteract = performance.now(); }
  }
  function builderRotUp() { if (buildMode) dragging = false; }
  function builderListeners(on) {
    const f = on ? 'addEventListener' : 'removeEventListener';
    window[f]('pointerdown', builderRotDown); window[f]('pointermove', builderRotMove); window[f]('pointerup', builderRotUp);
  }
  // סגירה שקטה של מצב הבנייה (בלי להסתיר — show יכול לקחת פיקוד מיד)
  function builderTeardown() {
    if (!buildMode) return;
    buildMode = false; buildNode = null;
    builderListeners(false);
    canvasFullscreen();
    scene.clearColor = new BABYLON.Color4(0.03, 0.01, 0.06, 0.44);
    try { const keyL = scene.getLightByName('key'); if (keyL) keyL.intensity = 1.7; } catch (e) {}
    try { scene.imageProcessingConfiguration.exposure = 0.95; } catch (e) {}
    try { sparks.emitter = new BABYLON.Vector3(0, 0.2, 0); steam.emitter = new BABYLON.Vector3(0, 1.3, 0); } catch (e) {}
    try { cam.setTarget(BABYLON.Vector3.Zero()); } catch (e) {}
    try { engine.resize(); } catch (e) {}
  }
  // סגירה שקטה של מצב "חשיפת העגלה" — נקרא מראש בכניסה ל-show/builderStart, לא מתוך hide()
  // (כדי לא להיתלות בתזמון ה-fade האסינכרוני של hide(); האיפוס קורה כשהחשיפה הבאה מתחילה).
  function cartTeardown() {
    if (!cartMode) return;
    cartMode = false;
    if (cartRoot) cartRoot.setEnabled(false);
    if (plate) plate.setEnabled(true);
    cam.alpha = Math.PI / 2; cam.fov = 0.55;
  }

  function render() {
    if (buildMode) {
      // בנייה חיה: סיבוב עצל כשלא נוגעים; בלי בובינג — שהנפילות ייקראו נקי
      if (!dragging && performance.now() - lastInteract > 1500)
        root.rotation.y += engine.getDeltaTime() / 1000 * 0.45;
      // מסגור דינמי: המצלמה מתרחקת ועולה בעדינות ככל שהבורגר גדל — תמיד ממורכז ומלא בפריים
      const mid = (-1.75 + buildY) / 2 + 0.55;
      cam.target.y += (mid - cam.target.y) * 0.05;
      const want = 8.4 + Math.max(0, buildY + 0.6) * 1.0;
      cam.radius += (want - cam.radius) * 0.05;
      if (pipeline && pipeline.depthOfFieldEnabled) pipeline.depthOfField.focusDistance = cam.radius * 1000;
      scene.render();
      return;
    }
    const el = (performance.now() - t0) / 1000;
    // כניסה קופצת
    const s = el < 0.55 ? Math.max(0.001, easeOutBack(el / 0.55)) : 1;
    root.scaling.setAll(s);
    // סיבוב אוטומטי — מושהה בזמן שהילדה מסובבת בעצמה (בעגלה: הרבה יותר עדין, זו לא צלחת מסתובבת)
    if (!dragging && performance.now() - lastInteract > 1200) root.rotation.y += engine.getDeltaTime() / 1000 * (cartMode ? 0.25 : 1.3);
    root.position.y = cartMode ? 0 : Math.sin(el * 2) * 0.12; // עגלה לא צריכה "לצוף" כמו מנה
    const push = Math.min(el / 2.2, 1);
    if (cartMode) {
      // צילום-נוף רחב יותר: דולי-כניסה גדול יותר, זווית 3/4, גובה-עיניים
      cam.radius = 15 - (1 - Math.pow(1 - push, 3)) * 3;
      cam.beta = Math.PI / 2.55 + Math.sin(el * 0.6) * 0.012;
    } else {
      // דחיפת-מצלמה קולנועית איטית + נשימה קלה בזווית
      cam.radius = 11.6 - (1 - Math.pow(1 - push, 3)) * 0.7; // עדין — שלא ייחתך הדובדבן של השייק (המנה הגבוהה)
      cam.beta = Math.PI / 2.75 + Math.sin(el * 0.6) * 0.018;
    }
    if (pipeline && pipeline.depthOfFieldEnabled) pipeline.depthOfField.focusDistance = cam.radius * 1000;
    // גל-הלם — רק למאכל; לעגלה זה פחות מתאים (לא "נוחתת" כמו מנה)
    if (!cartMode && el < 0.65) { ring.setEnabled(true); const k = el / 0.65; ring.scaling.setAll(0.3 + k * 3); ring.material.alpha = 1 - k; }
    else ring.setEnabled(false);
    scene.render();
  }

  const api = {
    preload() { loadBabylon(); },

    /* ---- מצב בנייה חי: הבורגר נבנה בתלת-ממד תוך כדי המשחק ---- */
    builderStart(foodKey) {
      loadBabylon();
      if (!init() || foodKey !== 'burger') return false;
      try {
        builderTeardown();
        cartTeardown();
        disposeBuilders();
        buildNode = new BABYLON.TransformNode('liveBuild', scene);
        buildNode.parent = root;
        builders.live = buildNode;
        current = 'burger';
        buildY = -0.95; buildParts = 0; buildMode = true;
        root.scaling.setAll(1); root.rotation.y = 0; root.position.y = 0;
        cam.radius = 8.4; cam.beta = Math.PI / 2.6;                       // מעט יותר מהצד — הצבעים עשירים יותר מאשר מלמעלה
        cam.setTarget(new BABYLON.Vector3(0, -0.8, 0));                   // מתחילים ממוקדים על הצלחת; המסגור הדינמי עולה עם הערימה
        cam.alpha = Math.PI / 2;                                          // setTarget מחשב alpha מהמיקום הישן של המצלמה (יכול "לזכור" זווית עגלה) — קובעים אותו מפורשות אחרון
        cam.fov = 0.55;
        scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);                // שקוף — הבמה הכהה מגיעה מסצנת ה-Phaser (אפס תפר)
        canvasStageArea();
        canvas.style.display = 'block';
        canvas.style.pointerEvents = 'none';                              // מגע עובר למשחק; סיבוב דרך מאזיני window
        requestAnimationFrame(() => { canvas.style.opacity = '1'; });
        try { engine.resize(); } catch (e) {}
        try { steam.stop(); twinkle.start(); } catch (e) {}               // אבק-פיות גם בזמן הבנייה — כמו ב-show
        clearTimeout(hideTimer);
        if (!visible) { visible = true; engine.runRenderLoop(render); }
        builderListeners(true);
        // בסיס: לחמנייה תחתונה + קציצה נופלות אחת אחרי השנייה
        api.builderAdd('bunB');
        setTimeout(() => { if (buildMode) api.builderAdd('patty'); }, 300);
        return true;
      } catch (e) { console.warn('Hero3D builder failed', e); builderTeardown(); return false; }
    },
    builderAdd(key) {
      if (!buildMode || !buildNode) return false;
      if (buildParts >= 12) return 'full';
      const p = makeBurgerPart(key, buildNode);
      if (!p) return false;
      buildParts++;
      const target = buildY; buildY += p.adv;
      p.node.position.y = target + 3.4;
      dropAnim(p.node, target);
      if (shadowGen) p.node.getChildMeshes().forEach(m => shadowGen.addShadowCaster(m));
      try { sparks.emitter = new BABYLON.Vector3(0, target + 0.3, 0); sparks.manualEmitCount = 12; sparks.start(); } catch (e) {}
      lastInteract = performance.now();                                   // שהסיבוב האוטומטי לא יפריע לנפילה
      return true;
    },
    builderServe(onDone) {
      if (!buildMode) { if (onDone) onDone(); return; }
      api.builderAdd('bunT');
      try {
        steam.emitter = new BABYLON.Vector3(0, buildY + 1.1, 0);
        setTimeout(() => { if (buildMode) steam.start(); }, 500);
        sparks.emitter = new BABYLON.Vector3(0, buildY + 0.4, 0);
        sparks.manualEmitCount = 40; sparks.start();
      } catch (e) {}
      if (onDone) setTimeout(onDone, 1300);
    },
    builderEnd() {
      if (!buildMode) return;
      builderTeardown();
      api.hide();
    },

    /* ---- חשיפת עגלה: "רגע קולנועי" חד-פעמי בכניסה לעולם, לא רצף מתמיד ---- */
    showCart(ms) {
      loadBabylon();
      if (!init()) return;
      builderTeardown();
      disposeBuilders();                                                  // מכבים מאכל שהוצג קודם — לא רלוונטי לעגלה
      if (!cartRoot) cartRoot = buildCartHero();
      cartRoot.setEnabled(true);
      cartMode = true; current = null;
      if (plate) plate.setEnabled(false);                                 // אין הגיון לצלחת קרמיקה מתחת לעגלה
      cam.alpha = Math.PI / 2 - 0.5; cam.fov = 0.65;
      t0 = performance.now(); lastInteract = 0; dragging = false;
      root.scaling.setAll(0.001); root.rotation.y = 0;
      clearTimeout(fadeTimer);
      canvas.style.display = 'block'; canvas.style.pointerEvents = 'none'; // חשיפה סביבתית — לא צעצוע לגרירה כמו המאכל
      requestAnimationFrame(() => { canvas.style.opacity = '1'; });
      try { engine.resize(); } catch (e) {}
      try { sparks.manualEmitCount = -1; sparks.stop(); sparks.reset(); sparks.start(); setTimeout(() => { try { sparks.stop(); } catch (e) {} }, 260); } catch (e) {}
      try { twinkle.start(); } catch (e) {}
      try { steam.stop(); } catch (e) {}
      if (!visible) { visible = true; engine.runRenderLoop(render); }
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => api.hide(), ms || 3400);
    },

    show(foodKey, ms, build) {
      loadBabylon();
      if (!init()) return;
      builderTeardown();                                                  // אם באנו מבנייה חיה — show לוקח פיקוד חלק
      cartTeardown();                                                     // אם באנו מחשיפת עגלה — show לוקח פיקוד חלק
      setCurrent(foodKey || 'donut', build);
      t0 = performance.now(); lastInteract = 0; dragging = false;
      root.scaling.setAll(0.001); root.rotation.y = 0;
      clearTimeout(fadeTimer);
      canvas.style.display = 'block'; canvas.style.pointerEvents = 'auto';
      requestAnimationFrame(() => { canvas.style.opacity = '1'; });
      try { engine.resize(); } catch (e) {}
      try { sparks.manualEmitCount = -1; sparks.stop(); sparks.reset(); sparks.start(); setTimeout(() => { try { sparks.stop(); } catch (e) {} }, 260); } catch (e) {}
      try { twinkle.start(); } catch (e) {}
      try { (current === 'burger' || current === 'pizza' || current === 'pancake') ? steam.start() : steam.stop(); } catch (e) {}
      if (!visible) { visible = true; engine.runRenderLoop(render); }
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => api.hide(), ms || 2800);
    },
    hide() {
      visible = false;
      try { twinkle.stop(); } catch (e) {}
      try { steam.stop(); } catch (e) {}
      if (canvas) { canvas.style.opacity = '0'; canvas.style.pointerEvents = 'none'; }
      clearTimeout(fadeTimer);
      // עצירת הרנדר וההסתרה רק אחרי סיום ה-fade — כדי שהדעיכה תיראה
      fadeTimer = setTimeout(() => {
        if (visible) return; // show() חדש קטע את היציאה
        if (engine) try { engine.stopRenderLoop(render); } catch (e) {}
        if (canvas) canvas.style.display = 'none';
      }, 320);
    },
    isReady() { return ready; },
    debug() { return { ready: ready, visible: visible, food: current, rot: root ? root.rotation.y : null,
      casters: (shadowGen && shadowGen.getShadowMap() && shadowGen.getShadowMap().renderList) ? shadowGen.getShadowMap().renderList.length : -1 }; }
  };
  return api;
})();
window.Hero3D = Hero3D;
