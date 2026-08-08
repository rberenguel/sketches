import {
  Command, GUI, Integer, Float, Boolean, Key, Control, Input,
} from "../libraries/gui/gui.js";

import { getLargeCanvas } from "../libraries/misc.js";
import { analyzeImage } from "./analysis.js";
import { SplatRenderer } from "./splat-renderer.js";

const sketch = (s) => {
  let gui;
  let source;
  let analysis;
  let splatRenderer;
  let glCanvas;
  let workingW, workingH;

  // Tunable params
  let baseCount = 4000;
  let broadCount = 200000;
  let glazeCount = 30000;
  let maxSize = 70;
  let minSize = 2.0;
  let elongation = 4;
  let noiseBend = 0.5;
  let detailScale = 1.0;
  let broadAlpha = 0.75;
  let glazeAlpha = 0.45;
  let hardness = 1.5;
  let grainAmount = 6;
  let seedOffset = 0;

  // Layer toggles for debugging
  let enableBase = true;
  let enableBroad = true;
  let enableGlaze = true;
  let enableFine = true;

  s.preload = () => {
    source = s.loadImage("../resources/gw.jpg");
  };

  s.setup = () => {
    let { w, h } = getLargeCanvas(s, 1600);
    s.createCanvas(w, h);
    s.pixelDensity(1);
    s.noLoop();

    // Offscreen WebGL canvas for splat rendering
    glCanvas = document.createElement("canvas");
    glCanvas.width = w;
    glCanvas.height = h;
    splatRenderer = new SplatRenderer(glCanvas);

    gui = createGUI();
    gui.toggle();
  };

  // Best-fit image within canvas bounds, preserving aspect ratio.
  // Never upscale beyond original resolution.
  function fitImage(img, cw, ch) {
    const scale = Math.min(cw / img.width, ch / img.height, 1);
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const x = Math.round((cw - w) / 2);
    const y = Math.round((ch - h) / 2);
    return { w, h, x, y, scale };
  }

  s.draw = () => {
    if (!source) return;
    const fit = fitImage(source, s.width, s.height);
    s.image(source, fit.x, fit.y, fit.w, fit.h);
  };

  function regenerate() {
    performance.mark("generate-start");

    const fit = fitImage(source, s.width, s.height);
    workingW = fit.w;
    workingH = fit.h;

    // Resize glCanvas to fit dimensions
    glCanvas.width = workingW;
    glCanvas.height = workingH;

    // Create temporary analysis image so we don't mutate the original
    let analysisImg = s.createImage(workingW, workingH);
    analysisImg.copy(source, 0, 0, source.width, source.height, 0, 0, workingW, workingH);
    analysisImg.loadPixels();

    // 2. CPU analysis
    performance.mark("analysis-start");
    analysis = analyzeImage(analysisImg);
    performance.measure("analysis", "analysis-start");

    // 3. Generate splats
    performance.mark("splatgen-start");
    const splats = buildSplats(analysis, analysisImg, seedOffset);
    performance.measure("splatgen", "splatgen-start");

    // 4. GPU render
    glCanvas.width = workingW;
    glCanvas.height = workingH;
    performance.mark("render-start");
    splatRenderer.setSplats(splats);
    splatRenderer.render(workingW, workingH, hardness, 2.0);
    performance.measure("render", "render-start");

    // 5. Blit centered
    s.clear();
    s.drawingContext.drawImage(glCanvas, fit.x, fit.y);

    // 6. Paper grain
    if (grainAmount > 0) {
      applyGrain(s.drawingContext, workingW, workingH, grainAmount, fit.x, fit.y);
    }

    performance.measure("generate", "generate-start");
    console.log(`Splats: ${splats.length}`);
  }

  function buildSplats(analysis, img, seed) {
    const { angle, coherence, detail, w, h } = analysis;
    const splats = [];
    const imgData = img;
    const noiseScale = 0.006;

    // ── Layer 1: Base underpainting ──
    if (enableBase) {
    for (let i = 0; i < baseCount; i++) {
      const x = hash2D(i, seed + 0) * w;
      const y = hash2D(i, seed + 1) * h;
      const c = sampleColor(imgData, x, y);
      const sz = maxSize * (0.85 + hash2D(i, seed + 2) * 0.3);
      splats.push({
        x, y,
        angle: hash2D(i, seed + 3) * Math.PI * 2,
        sx: sz,
        sy: sz * 0.7,
        r: c[0], g: c[1], b: c[2],
        a: 1.0,
      });
    }
    }

    // ── Layer 2: Broad adaptive strokes ──
    if (enableBroad) {
    // Detail map drives density + size. Edge tensor drives rotation + elongation.
    // Per-seed Perlin phase offsets kill the fabric-weave artifact.
    for (let i = 0; i < broadCount; i++) {
      const h1 = hash2D(i, seed + 10000);
      const h2 = hash2D(i, seed + 10001);
      const h3 = hash2D(i, seed + 10002);

      let x = h1 * w;
      let y = h2 * h;

      const ix = Math.min(Math.max(Math.floor(x), 0), w - 1);
      const iy = Math.min(Math.max(Math.floor(y), 0), h - 1);
      const idx = iy * w + ix;

      const d = detail[idx];

      // Rejection sampling: probability = detail * scale, capped at 1
      if (h3 > Math.min(d * detailScale, 1.0)) continue;

      const coh = coherence[idx];
      const ang = angle[idx];
      const c = sampleColor(imgData, x, y);

      // Size adapts: high detail → small, low detail → large
      const baseSz = minSize + (maxSize - minSize) * (1.0 - d);
      const sz = baseSz * (0.8 + hash2D(i, seed + 10003) * 0.4);

      // Elongation proportional to coherence
      const sx = sz * (1.0 + coh * elongation);
      const sy = sz;

      // Per-seed Perlin phase: each stroke gets independent wobble
      const phaseX = hash2D(i, seed + 10005) * 1000;
      const phaseY = hash2D(i, seed + 10006) * 1000;
      const noiseAngle = s.noise(x * noiseScale + phaseX, y * noiseScale + phaseY) * Math.PI * 2;
      const blend = (1.0 - coh) * noiseBend;
      const finalAngle = ang + blend * (noiseAngle - ang);

      const alphaNoise = 0.6 + hash2D(i, seed + 10004) * 0.4;

      splats.push({
        x, y,
        angle: finalAngle,
        sx, sy,
        r: c[0], g: c[1], b: c[2],
        a: broadAlpha * alphaNoise,
      });
    }

    }

    // ── Layer 3: Mid-tier glazes ──
    if (enableGlaze) {
    // Translucent washes that bring out general shapes.
    // Placed everywhere but sized by detail: smaller where detail is high.
    for (let i = 0; i < glazeCount; i++) {
      const h1 = hash2D(i, seed + 30000);
      const h2 = hash2D(i, seed + 30001);
      let x = h1 * w;
      let y = h2 * h;

      const ix = Math.min(Math.max(Math.floor(x), 0), w - 1);
      const iy = Math.min(Math.max(Math.floor(y), 0), h - 1);
      const idx = iy * w + ix;
      const d = detail[idx];

      // Glazes are slightly more accepted in flat regions
      if (hash2D(i, seed + 30002) > 0.7) continue;

      const coh = coherence[idx];
      const ang = angle[idx];
      const c = sampleColor(imgData, x, y);

      // Medium size, somewhat detail-adaptive
      const sz = (maxSize * 0.25) * (1.2 - d * 0.4) * (0.8 + hash2D(i, seed + 30003) * 0.4);
      const sx = sz * (1.0 + coh * elongation * 0.5);
      const sy = sz;

      const phaseX = hash2D(i, seed + 30005) * 1000;
      const phaseY = hash2D(i, seed + 30006) * 1000;
      const noiseAngle = s.noise(x * noiseScale + phaseX, y * noiseScale + phaseY) * Math.PI * 2;
      const blend = (1.0 - coh) * noiseBend * 0.7;
      const finalAngle = ang + blend * (noiseAngle - ang);

      splats.push({
        x, y,
        angle: finalAngle,
        sx, sy,
        r: c[0], g: c[1], b: c[2],
        a: glazeAlpha * (0.7 + hash2D(i, seed + 30004) * 0.3),
      });
    }

    }

    // ── Layer 4: Fine edge chains ──
    if (enableFine) {
    // Along strong edges, trace tapered segments.
    // Sample color from the STARTING position (the side we're on).
    // Color boundary stop prevents crossing to the other side.
    const fineCount = Math.floor(broadCount * 0.15);
    const fineStep = 2.0;
    const colorStopThresh = 35;
    for (let i = 0; i < fineCount; i++) {
      const h1 = hash2D(i, seed + 40000);
      const h2 = hash2D(i, seed + 40001);

      let x = h1 * w;
      let y = h2 * h;

      const ix = Math.min(Math.max(Math.floor(x), 0), w - 1);
      const iy = Math.min(Math.max(Math.floor(y), 0), h - 1);
      const idx = iy * w + ix;

      const coh = coherence[idx];
      if (coh < 0.45) continue; // only very strong edges

      const ang = angle[idx];
      const startColor = sampleColorByte(imgData, x, y);
      const c = sampleColor(imgData, x, y);

      const chainLen = 8 + Math.floor(coh * 16 + hash2D(i, seed + 40002) * 10);
      const chainPhase = hash2D(i, seed + 40008) * 1000;

      for (let step = 0; step < chainLen; step++) {
        const t = step / (chainLen - 1);
        const taper = Math.pow(1.0 - t, 0.8);

        const bend = s.noise(step * 0.12 + chainPhase, i * 0.001) * 0.3;
        const segAngle = ang + bend;

        const cx = x + Math.cos(segAngle) * step * fineStep;
        const cy = y + Math.sin(segAngle) * step * fineStep;

        if (cx < 0 || cx >= w || cy < 0 || cy >= h) break;

        const hereColor = sampleColorByte(imgData, cx, cy);
        const dist = colorDist(startColor, hereColor);
        if (dist > colorStopThresh) break;

        const segAlpha = Math.min(0.92, broadAlpha * 1.3 * taper);
        const segSize = minSize * 2.2 * taper;

        splats.push({
          x: cx, y: cy,
          angle: segAngle,
          sx: segSize,
          sy: segSize * 0.6,
          r: c[0], g: c[1], b: c[2],
          a: segAlpha,
        });
      }
    }

    }
    return splats;
  }

  function colorDist(a, b) {
    return Math.abs(a[0]-b[0]) + Math.abs(a[1]-b[1]) + Math.abs(a[2]-b[2]);
  }

  function sampleColorByte(img, x, y) {
    const xi = Math.min(Math.max(Math.floor(x), 0), img.width - 1);
    const yi = Math.min(Math.max(Math.floor(y), 0), img.height - 1);
    const idx = (yi * img.width + xi) * 4;
    const d = img.pixels;
    return [d[idx], d[idx+1], d[idx+2]];
  }

  function sampleColor(img, x, y) {
    const xi = Math.min(Math.max(Math.floor(x), 0), img.width - 1);
    const yi = Math.min(Math.max(Math.floor(y), 0), img.height - 1);
    const idx = (yi * img.width + xi) * 4;
    const d = img.pixels;
    return [d[idx] / 255, d[idx + 1] / 255, d[idx + 2] / 255];
  }

  // 2D avalanche hash — every input bit affects every output bit.
  // Avoids Marsaglia hyperplane streaks from linear hashes.
  function hash2D(i, j) {
    let x = (i >>> 0) * 374761393;
    let y = (j >>> 0) * 668265263;
    let s = (x ^ y) + 0x9e3779b9;
    s = (s ^ (s >>> 13)) * 1274126177;
    s = (s ^ (s >>> 16)) * 0x85ebca6b;
    s = s ^ (s >>> 13);
    return (s >>> 0) / 0x100000000;
  }

  function applyGrain(ctx, w, h, amount, offsetX, offsetY) {
    const d = ctx.getImageData(offsetX, offsetY, w, h);
    const px = d.data;
    const n = px.length;
    for (let i = 0; i < n; i += 4) {
      const g = (Math.random() - 0.5) * amount;
      px[i] = Math.min(255, Math.max(0, px[i] + g));
      px[i + 1] = Math.min(255, Math.max(0, px[i + 1] + g));
      px[i + 2] = Math.min(255, Math.max(0, px[i + 2] + g));
    }
    ctx.putImageData(d, offsetX, offsetY);
  }

  // ── GUI ──
  function createGUI() {
    let info = `GPU Gaussian splat painter. Adapted from <a href='https://yogthos.net/posts/2026-08-03-splat-painter.html' target='_blank'>yogthos' Painting with Gaussians</a>.`;
    let subinfo = `Analysis → splat placement → WebGL billboard render`;

    let R = new Key("r", () => {
      seedOffset++;
      gui.spin(() => {
        s.clear();
        regenerate();
        gui.spin();
      });
    });
    let regenCmd = new Command(R, "regenerate (new seed)");

    let S = new Key("s", () => {
      s.save("splat.png");
    });
    let saveCmd = new Command(S, "save canvas");

    let C = new Key("c", () => {
      s.clear();
    });
    let clearCmd = new Command(C, "clear canvas");

    let P = new Key("p", () =>
      console.log(performance.getEntriesByType("measure"))
    );
    let perfCmd = new Command(P, "log performance");

    // Controls
    let incBC = new Key(">", () => broadCount += 20000);
    let decBC = new Key("<", () => { if (broadCount > 20000) broadCount -= 20000; });
    let bcInt = new Integer(() => broadCount);
    let bcControl = new Control([decBC, incBC], "+/- broad count", bcInt);

    let incS = new Key(")", () => maxSize += 2);
    let decS = new Key("(", () => { if (maxSize > minSize + 1) maxSize -= 2; });
    let sFloat = new Float(() => maxSize);
    let sControl = new Control([decS, incS], "+/- max brush size", sFloat);

    let incE = new Key("]", () => elongation += 0.5);
    let decE = new Key("[", () => { if (elongation > 0) elongation -= 0.5; });
    let eFloat = new Float(() => elongation);
    let eControl = new Control([decE, incE], "+/- elongation", eFloat);

    let incN = new Key("+", () => noiseBend = Math.min(noiseBend + 0.1, 1));
    let decN = new Key("-", () => noiseBend = Math.max(noiseBend - 0.1, 0));
    let nFloat = new Float(() => noiseBend);
    let nControl = new Control([decN, incN], "+/- noise bend", nFloat);

    let incDS = new Key("*", () => detailScale += 0.2);
    let decDS = new Key("/", () => detailScale = Math.max(detailScale - 0.2, 0.2));
    let dsFloat = new Float(() => detailScale);
    let dsControl = new Control([decDS, incDS], "+/- detail density", dsFloat);

    let incH = new Key(";", () => hardness += 0.05);
    let decH = new Key("'", () => hardness = Math.max(hardness - 0.05, 0.1));
    let hFloat = new Float(() => hardness);
    let hControl = new Control([decH, incH], "+/- hardness", hFloat);

    let incGC = new Key("}", () => glazeCount += 2000);
    let decGC = new Key("{", () => { if (glazeCount > 2000) glazeCount -= 2000; });
    let gcInt = new Integer(() => glazeCount);
    let gcControl = new Control([decGC, incGC], "+/- glaze count", gcInt);

    let incGA = new Key("=", () => glazeAlpha = Math.min(glazeAlpha + 0.05, 1));
    let decGA = new Key("_", () => glazeAlpha = Math.max(glazeAlpha - 0.05, 0));
    let gaFloat = new Float(() => glazeAlpha);
    let gaControl = new Control([decGA, incGA], "+/- glaze alpha", gaFloat);

    let incGR = new Key(".", () => grainAmount += 2);
    let decGR = new Key(",", () => { if (grainAmount > 0) grainAmount -= 2; });
    let grInt = new Integer(() => grainAmount);
    let grControl = new Control([decGR, incGR], "+/- grain", grInt);

    let B = new Key("b", () => enableBase = !enableBase);
    let baseBool = new Boolean(() => enableBase);
    let baseToggle = new Control([B], "toggle base layer", baseBool);

    let D = new Key("d", () => enableBroad = !enableBroad);
    let broadBool = new Boolean(() => enableBroad);
    let broadToggle = new Control([D], "toggle broad layer", broadBool);

    let Z = new Key("z", () => enableGlaze = !enableGlaze);
    let glazeBool = new Boolean(() => enableGlaze);
    let glazeToggle = new Control([Z], "toggle glaze layer", glazeBool);

    let F = new Key("f", () => enableFine = !enableFine);
    let fineBool = new Boolean(() => enableFine);
    let fineToggle = new Control([F], "toggle fine layer", fineBool);

    let fileInput = new Input(
      "Choose image",
      "file",
      "image/*",
      loadImageFromInput((img) => {
        source = img;
        seedOffset = 0;
        gui.spin(() => {
          regenerate();
          gui.spin();
        });
      })
    );

    let guiObj = new GUI(
      "Splat Painter, Kimi 2.6 + RB 2026",
      info,
      subinfo,
      [regenCmd, saveCmd, clearCmd, perfCmd],
      [fileInput, bcControl, sControl, eControl, nControl, dsControl, hControl, gcControl, gaControl, grControl, baseToggle, broadToggle, glazeToggle, fineToggle]
    );

    let QM = new Key("?", () => guiObj.toggle());
    let hide = new Command(QM, "hide this");
    guiObj.addCmd(hide);
    guiObj.update();
    return guiObj;
  }

  function loadImageFromInput(callback) {
    return (evt) => {
      let file = evt.target.files[0];
      if (!file) return;
      let fr = new FileReader();
      fr.onload = (e) => {
        let raw = new Image();
        raw.src = e.target.result;
        raw.onload = () => {
          let pImg = s.createImage(raw.width, raw.height);
          pImg.drawingContext.drawImage(raw, 0, 0);
          callback(pImg);
        };
      };
      fr.readAsDataURL(file);
    };
  }

  s.keyReleased = () => {
    gui.dispatch(s.key);
  };
};

p5.disableFriendlyErrors = true;
new p5(sketch);
