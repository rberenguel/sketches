import {
  createBaseGUI,
  Command,
  GUI,
  Integer,
  Float,
  Key,
  Control,
  Seeder,
} from "../libraries/gui/gui.js";

import { getLargeCanvas, signature, smoothStep } from "../libraries/misc.js";

import {
  c82GeoPrimesPalette,
  solarizedDark,
  shimmeringColorArray,
  solarizedDarkPalette,
} from "../libraries/palettes.js";

import { canvasRGBA } from "../libraries/3rdparty/stackblur.js";

const sketch = (s) => {
  let gui, R;
  let debug = true;
  let dly; // Base debug layer, if used

  const palette = solarizedDarkPalette;

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

  function bubble(scene, x, y, d, mask) {
    // A strange correction to avoid superdense bubbles at high res
    const NR = 1.2 / cfg.hd;
    mask.push();
    mask.fill("black");
    mask.circle(x, y, 1.001 * 2 * d);
    mask.pop();
    scene.push();
    scene.translate(x, y);
    const random = scene.random;
    const ITER = d * d;
    for (let i = 0; i < ITER; i++) {
      const a = random(PI * 2);
      const r = d * (1.0 - random(random(random(random(random())))));
      const rr = d - r;
      const foo = a / (2 * PI);
      let col = scene.color(360 * foo, 90, 90);
      col.setAlpha(0.05);
      scene.stroke(col);
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      scene.circle(x, y, NR);
    }
    scene.pop();
    scene.push();
    scene.translate(x, y);
    scene.rotate(-0.3);
    const nd = 0.8 * d;
    const L = 2 * PI - PI / 4;
    for (let i = 0; i < ITER; i++) {
      const a = random(PI * 2);
      if (L - a > 0.3) {
        continue;
      }
      const r = nd * (1.0 - random(random(random(random(random())))));
      let col = scene.color(250);
      col.setAlpha(0.1 * (1.5 - smoothStep(0, nd, r)));
      scene.stroke(col);
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      scene.circle(x, y, NR);
    }

    scene.pop();
    scene.push();
    scene.translate(x, y);
    scene.rotate(0.85 * PI);
    const nnd = 0.78 * d;
    const nL = 2 * PI - PI / 4;
    for (let i = 0; i < ITER; i++) {
      const a = random(PI * 2);
      if (nL - a > -0.3) {
        continue;
      }
      const r = nnd * (1.0 - random(random(random(random(random())))));
      let col = scene.color(250);
      col.setAlpha(0.1 * (1.5 - smoothStep(0, nnd, r)));
      scene.stroke(col);
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      scene.circle(x, y, NR);
    }

    scene.pop();
  }

  function plot() {
    let scene = s.createGraphics(
      (cfg.hd * s.width) << 0,
      (cfg.hd * s.height) << 0,
    );
    (W = scene.width), (H = scene.height);
    let bubbly = s.createGraphics(W, H);
    let mask = s.createGraphics(W, H);
    let dly = s.createGraphics(W, H);
    scene.randomSeed(cfg.seeder.get());
    scene.noiseSeed(cfg.seeder.get());
    bubbly.randomSeed(cfg.seeder.get());
    bubbly.noiseSeed(cfg.seeder.get());
    dly.randomSeed(cfg.seeder.get());
    dly.noiseSeed(cfg.seeder.get());

    if (debug && dly) {
      let c = dly.get();
      scene.image(dly, 0, 0);
    }

    bubbly.noFill();
    bubbly.strokeWeight(cfg.hd);

    bubbly.background(solarizedDark.base01);
    bubbly.colorMode(s.HSB);
    for (let i = 0; i < 50; i++) {
      const fx = bubbly.random(0.1, 0.9);
      const fy = bubbly.random(0.1, 0.9);
      const d = bubbly.random(0.02, 0.1);
      bubble(bubbly, fx * W, fy * H, d * H, mask);
      if (i % 2 == 0) {
        canvasRGBA(bubbly.canvas, 0, 0, W, H, Math.max(1, (0.5 + cfg.hd) << 0));
      }
    }
    canvasRGBA(bubbly.canvas, 0, 0, W, H, Math.max(1, (0.5 + cfg.hd) << 0));
    let d = bubbly.get();
    d.mask(mask);
    scene.background(solarizedDark.base01);
    scene.image(d, 0, 0);
    const identifier = `${cfg.seeder.hex()}@${cfg.hd.toPrecision(2)}`;
    const sigCfg = {
      s: s,
      scene: scene,
      color: "#101020",
      shadow: "darkgrey",
      fontsize: 9,
      right: scene.width,
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
    cfg.title = "Bubbles, RB 2023/5";
    cfg.info = "Just some bubbles";
    cfg.subinfo =
      "Based on the ideas about point distribution from <a href='https://openprocessing.org/sketch/1575230/'>here</a><br/>Not much more than stacked blur on top and some masking.<br/>Only reproducible at the exact same resolution.";
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

    cfg.commands = [resetCanvas, cfg.seeder.command];
    cfg.controls = [cfg.seeder.control];

    gui = createBaseGUI(cfg);
    return gui;
  };

  s.keyReleased = () => {
    gui.dispatch(s.key);
  };
};

p5.disableFriendlyErrors = true;
let p5sketch = new p5(sketch);
