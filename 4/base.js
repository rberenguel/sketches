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

import { getLargeCanvas, signature } from "../libraries/misc.js";

import {
  shimmeringColorHex,
  shimmeringColorHSB,
  solarizedColor,
  solarizedDark,
} from "../libraries/palettes.js";

const sketch = (s) => {
  let gui;
  let debug = true;
  let dly; // Base debug layer, if used

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
  };

  function copyColorHSB(sc, c) {
    let c2 = sc.color(0);
    c2.setRed(sc.red(c));
    c2.setBlue(sc.blue(c));
    c2.setGreen(sc.green(c));
    return c2;
  }

  function clothPatch(scene, x, y, w, h, c1, c2) {
    let highSwap = true;
    const shift = 6 * cfg.hd;
    const half = (shift / 2) << 0;
    const mainW = cfg.hd;
    scene.strokeWeight(mainW);
    let s1 = copyColorHSB(scene, c1);
    s1.setBlue(5);
    let s2 = copyColorHSB(scene, c2);
    s2.setBlue(5);
    scene.push();
    scene.translate(x, y);
    for (let j = -1; j < h; j += shift) {
      let swap = highSwap;
      for (let i = -1; i < w; i += half) {
        if (swap) {
          scene.stroke(c1);
          scene.line(i - cfg.hd, 0, i - cfg.hd, shift);
          scene.stroke(s1);
          scene.line(i + cfg.hd, 0, i, shift);
          scene.stroke(c2);
          scene.line(i - half, half, i + shift - cfg.hd, half);
          scene.stroke(s2);
          scene.line(
            i - half,
            half + cfg.hd,
            i + shift - cfg.hd,
            half + cfg.hd,
          );
        } else {
          scene.stroke(c2);
          scene.line(i - half, half, i + shift - cfg.hd, half);
          scene.stroke(s2);
          scene.line(
            i - half,
            half + cfg.hd,
            i + shift - cfg.hd,
            half + cfg.hd,
          );
          scene.stroke(c1);
          scene.line(i - cfg.hd, 0, i - cfg.hd, shift);
          scene.stroke(s1);
          scene.line(i, 0, i, shift);
        }
        swap = !swap;
      }
      scene.translate(0, half);
      highSwap = !highSwap;
    }
    scene.pop();
  }

  s.draw = () => {
    let scene = s.createGraphics(cfg.hd * s.width, cfg.hd * s.height);
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
    scene.colorMode(s.HSB, 360, 100, 100, 100);
    scene.background(solarizedDark.base01);
    for (let i = 0; i < 20; i++) {
      const x = scene.random(0.05, 0.8);
      const y = scene.random(0.05, 0.9);
      const w = scene.random(0.2, 0.3);
      const f = scene.random(0.9, 1.1);
      //const c1 = scene.color(scene.random(0, 360), scene.random(50, 90), 50)
      //const c2 = scene.color(scene.random(0, 360), scene.random(50, 90), 50)
      let sc1 = scene.color(solarizedColor(scene));
      let h1 = scene.hue(sc1);
      let s1 = scene.saturation(sc1);
      let b1 = scene.brightness(sc1);
      let sc2 = scene.color(solarizedColor(scene));
      while (sc2 == sc1) {
        sc2 = scene.color(solarizedColor(scene));
      }
      let h2 = scene.hue(sc2);
      let s2 = scene.saturation(sc2);
      let b2 = scene.brightness(sc2);
      let c1 = scene.color(h1, s1, (0.6 * b1) << 0);
      let c2 = scene.color(h2, s2, (0.6 * b2) << 0);
      clothPatch(scene, x * W, y * H, w * W, f * w * W, c1, c2);
    }

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
  };

  const createGUI = (gui) => {
    cfg.title = "Something, RB 2020/";
    cfg.info = "Info";
    cfg.subinfo =
      "Subinfo<br/>Very high resolutions can fail depending on the browser";
    cfg.s = s;
    let R = new Key("r", () => {
      gui.spin(() => {
        cfg.s.clear();
        cfg.s.draw();
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
