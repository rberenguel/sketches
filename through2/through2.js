import {
  createBaseGUI,
  Command,
  GUI,
  Integer,
  Float,
  Boolean,
  Key,
  Control,
  Seeder,
} from "../libraries/gui/gui.js";

import { getLargeCanvas, signature, smoothStep } from "../libraries/misc.js";

import { canvasRGBA } from "../libraries/3rdparty/stackblur.js";

const sketch = (s) => {
  let gui;
  let debug = true;
  let dly; // Base debug layer, if used

  let R;

  let maskIt = true;

  // Globals needed in controls, commands or deep arguments
  let cfg = {
    hd: 1,
    seeder: undefined,
    largeCanvas: undefined,
  };

  let W, H; // Helpful globals to avoid typing scene.width so much

  const PI = s.PI;

  s.preload = () => {
    cfg.font = s.loadFont("../libraries/fonts/Monoid-Retina.ttf");
  };

  s.setup = () => {
    let { w, h } = getLargeCanvas(s, 1600);
    let canvas = s.createCanvas(w, h);
    s.pixelDensity(1);
    canvas.mousePressed(() => {});
    s.frameRate(20);
    s.noLoop();
    cfg.seeder = new Seeder();
    gui = createGUI();
    gui.toggle();
    R.action();
  };

  function texturize(scene, x, y, maxW, maxH) {
    // TODO: radial density!
    scene.push();
    scene.translate(x, -maxH);
    let points = [];
    const sqrt = Math.sqrt;
    const rand = scene.random;
    for (let i = 0; i < 300; i++) {
      const fw = scene.random();
      let fw2 = rand(rand(rand())); // Squeeze towards 0
      points.push([fw2 * maxW, scene.random(maxH)]);
      fw2 = 1 - fw2; // Squeeze towards 1
      points.push([fw2 * maxW, scene.random(maxH)]);
    }
    scene.strokeWeight(cfg.hd);
    for (let point of points) {
      let [p, q] = point;
      scene.stroke(0, 5, 30, scene.random(0.4, 0.9));
      const end = q + scene.random(5 * cfg.hd, 55 * cfg.hd);
      const limit = Math.min(end, maxH);
      scene.line(p + cfg.hd, q + cfg.hd, p + cfg.hd, limit);
    }
    scene.stroke(0, 5, 8, 0.4);
    for (let point of points) {
      let [p, q] = point;
      const end = q + scene.random(5 * cfg.hd, 30 * cfg.hd);
      const limit = Math.min(end, maxH);
      scene.line(p, q, p, limit);
    }
    scene.pop();
  }

  function leafy(scene, width) {
    scene.push();
    const LEAVES = 50;
    for (let i = 0; i < LEAVES; i++) {
      const x = (i * width) / LEAVES + scene.random(width / LEAVES);
      const y = 0 + scene.random(0.2 * width);
      const h = 5 + scene.random(25);
      const s = 65 + scene.random(15);
      const b = 12 + scene.random(9);
      scene.fill(h, s, b, 0.5);
      scene.circle(x, y, scene.random(0.05 * width, 0.3 * width));
    }
    scene.pop();
  }

  function plot() {
    let scene = s.createGraphics(
      (cfg.hd * s.width) << 0,
      (cfg.hd * s.height) << 0,
    );
    (W = scene.width), (H = scene.height);
    let dly = s.createGraphics(W, H);
    scene.randomSeed(cfg.seeder.get());
    scene.noiseSeed(cfg.seeder.get());
    dly.randomSeed(cfg.seeder.get());
    dly.noiseSeed(cfg.seeder.get());

    // Here your code against scene and possibly dly
    if (debug && dly) {
      let c = dly.get();
      scene.image(dly, 0, 0);
    }

    scene.colorMode(s.HSB);

    scene.noStroke();
    scene.rectMode(s.CORNERS);
    scene.ellipseMode(s.CENTER);
    const lightSky = scene.color(199, 71, 80);
    const darkSky = scene.color(199, 71, 10);
    let ctx = scene.drawingContext;
    const gradient = ctx.createLinearGradient(0, 0, 0, 0.6 * H);
    gradient.addColorStop(0, lightSky);
    gradient.addColorStop(0.8, darkSky);
    ctx.fillStyle = gradient;
    scene.rect(0, 0, W, 0.6 * H);
    // Backdrop
    const SKYSTEPS = 150;
    for (let i = 0; i < SKYSTEPS; i++) {
      for (let j = 0; j < SKYSTEPS; j++) {
        const h = 75 + scene.random(25);
        const s = 85 + scene.random(15);
        const b = 15 + scene.random(9);
        scene.fill(h, s, b);
        const x = (i * W) / SKYSTEPS + scene.random(W / SKYSTEPS);
        const y = (j * H) / SKYSTEPS + scene.random(H / SKYSTEPS);
        //console.log(x, y)
        const smoothing = smoothStep(0, SKYSTEPS, j);
        const f = Math.sqrt(Math.sqrt(smoothing));
        if (scene.random() > f + 0.3) {
          continue;
        }
        scene.circle(
          x,
          y,
          scene.random((0.3 * W) / SKYSTEPS, (2 * W) / SKYSTEPS),
        );
      }
    }
    // Ground
    scene.fill(5, 72, 16);
    scene.rect(0, 0.6 * H, W, H);
    const GROUNDSTEPS = 150;
    for (let i = 0; i < GROUNDSTEPS; i++) {
      for (let j = 0; j < GROUNDSTEPS; j++) {
        const h = 5 + scene.random(25);
        const s = 65 + scene.random(15);
        const b = 12 + scene.random(9);
        scene.fill(h, s, b);
        const x = (i * W) / GROUNDSTEPS + scene.random(W / GROUNDSTEPS);
        const y =
          0.6 * H +
          (0.4 * j * H) / GROUNDSTEPS +
          scene.random((0.4 * H) / GROUNDSTEPS);
        //console.log(x, y)
        const smoothing = smoothStep(0, SKYSTEPS, j);
        const f = Math.sqrt(Math.sqrt(smoothing));
        if (scene.random() > f + 0.3) {
          continue;
        }
        scene.circle(
          x,
          y,
          scene.random((0.3 * W) / GROUNDSTEPS, (2 * W) / GROUNDSTEPS),
        );
      }
    }
    const DSTEPS = 5;
    const MAXWSTEPS = 12;
    const DGAP = 0.38 / DSTEPS;
    for (let i = 0; i < DSTEPS; i++) {
      // Depth steps
      const WSTEPS = MAXWSTEPS * (1 - smoothStep(0, DSTEPS, i));
      const WGAP = 1.0 / WSTEPS;
      let prevW = 0;
      for (let j = 0; j < WSTEPS; j++) {
        // Width steps
        const tw = scene.random(
          0.03 + 0.015 * smoothStep(0, DSTEPS, i),
          0.03 + 0.04 * smoothStep(0, DSTEPS, i),
        );
        const wpos = prevW + scene.random(0, WGAP);
        const hpos = scene.random(i * DGAP, (i + 1) * DGAP);
        prevW = wpos + tw;
        const c = wpos + tw / 2;
        //scene.fill(55, 2, 31)
        const hue =
          30 +
          scene.random(15 * smoothStep(0, 10, i), 25 * smoothStep(0, 10, i));
        const sat =
          2 +
          scene.random(20 * smoothStep(0, 10, i), 30 * smoothStep(0, 10, i));
        const bri =
          25 +
          scene.random(10 * smoothStep(0, 10, i), 15 * smoothStep(0, 10, i));
        scene.push();
        scene.fill(hue << 0, sat << 0, bri << 0);
        scene.translate(wpos * W, (0.6 + hpos) * H);
        scene.rotate(scene.random(-0.02, 0.02));
        scene.ellipse((tw * W) / 2, 0, tw * W, (tw * W) / 4);
        scene.rect(0, 0, tw * W, -(0.6 + hpos) * H);
        texturize(scene, 0, 0, tw * W, (0.6 + hpos) * H);
        leafy(scene, tw * W);
        scene.pop();
        if (scene.random() < 0.1) {
          canvasRGBA(
            scene.canvas,
            0,
            0,
            W,
            H,
            Math.max(1, (0.5 + cfg.hd) << 0),
          );
        }
      }
      canvasRGBA(scene.canvas, 0, 0, W, H, Math.max(1, (0.5 + cfg.hd) << 0));
    }

    if (maskIt) {
      let mask = s.createGraphics(scene.width, scene.height);
      mask.strokeWeight(cfg.hd);
      mask.stroke("black");
      mask.rectMode(s.CORNERS);
      let counter = 0;
      for (let i = 0; i < scene.width; i += 8 * cfg.hd) {
        if (counter % 2 == 0) {
          mask.rect(
            i + 1 * cfg.hd,
            H * (1 - scene.noise((2 * counter) / 100)),
            i + 7 * cfg.hd,
            H * scene.noise(counter / 100),
          );
        } else {
          mask.rect(
            i + 1 * cfg.hd,
            0,
            i + 7 * cfg.hd,
            H * (1 - scene.noise((2 * counter) / 100)),
          );
          mask.rect(
            i + 1 * cfg.hd,
            H * scene.noise(counter / 100),
            i + 7 * cfg.hd,
            H,
          );
        }
        counter++;
      }

      let d = scene.get();
      let e = scene.get();
      d.mask(mask);
      scene.clear();
      scene.image(e, 0, 0);
      scene.blendMode(s.OVERLAY);
      scene.image(d, 0, 0);
    }

    scene.colorMode(s.RGB);
    scene.blendMode(s.BLEND);
    const identifier = `${cfg.seeder.hex()}@${cfg.hd.toPrecision(2)}`;
    const sigCfg = {
      s: s,
      scene: scene,
      color: "#AAAA20",
      shadow: "#999970",
      fontsize: 9,
      right: scene.width + 4 * cfg.hd,
      bottom: scene.height,
      identifier: identifier,
      sig: "rb'23",
      hd: cfg.hd,
      font: cfg.font,
    };
    signature(sigCfg);

    cfg.largeCanvas = scene;
    let c = scene.get();
    c.resize(s.width, 0);
    s.image(c, 0, 0);
  }

  const createGUI = (gui) => {
    cfg.title = "(Through)&sup2; the trees, RB 2023/05 \u{1F1E8}\u{1F1ED}";
    cfg.info = "Inspired by a walk through the forest behind our home";
    cfg.subinfo =
      "Stacked blurs and many circles.<br/>Very high resolutions can fail depending on the browser";
    cfg.s = s;
    R = new Key("r", () => {
      gui.spin(() => {
        cfg.s.clear();
        plot();
        gui.spin();
        gui.unmark();
        gui.update();
      });
    });

    let resetCanvas = new Command(R, "reset");

    let M = new Key(
      "m",
      () => {
        maskIt = !maskIt;
        R.action();
      },
      (x) => {
        maskIt = x == "true";
        gui.update();
      },
      "mask",
    );

    let maskItBool = new Boolean(() => maskIt);
    let maskItBoolControl = new Control([M], "masking?", maskItBool);

    cfg.commands = [resetCanvas, cfg.seeder.command];
    cfg.controls = [cfg.seeder.control, maskItBoolControl];

    gui = createBaseGUI(cfg);
    return gui;
  };

  s.keyReleased = () => {
    gui.dispatch(s.key);
  };
};

p5.disableFriendlyErrors = true;
let p5sketch = new p5(sketch);
