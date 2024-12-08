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
  solarizedDarkPalette,
  wernerBase,
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
    gui.fetch();
    gui.toggle();
  };

  function painted(scene, [cx, cy, rr], color) {
    scene.push();
    const steps = rr * rr;
    const random = scene.random;
    scene.colorMode(s.HSB);
    scene.noStroke();
    let [hu, sa, br, aa] = color;
    const a = aa ? aa : 0.95;
    for (let i = 0; i < steps; i++) {
      const r = rr * (1.0 - Math.sqrt(Math.sqrt(random())));
      const alpha = a - a * smoothStep(0, rr, r);
      const c = scene.color(...color, alpha);
      scene.fill(c);
      const x = cx + r * Math.cos((i / steps) * 2 * PI);
      const y = cy + r * Math.sin((i / steps) * 2 * PI);
      scene.circle(x, y, 1);
    }
    scene.pop();
  }

  s.draw = () => {
    let scene = s.createGraphics((cfg.hd * 1800) << 0, (cfg.hd * 1200) << 0);
    let mask = s.createGraphics((cfg.hd * 1800) << 0, (cfg.hd * 1200) << 0);
    let drop = s.createGraphics((cfg.hd * 1800) << 0, (cfg.hd * 1200) << 0);

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

    scene.background(wernerBase.red);
    for (let i = 0; i < 5; i++) {
      const x = scene.randomGaussian(0.5 * W, 0.01 * W);
      const y = scene.randomGaussian(0.5 * H, 0.01 * H);
      painted(scene, [x, y, 0.08 * H], [0, 0, 0, 0.95]);
    }
    painted(scene, [W / 2, H / 2, 0.1 * H], [0, 0, 0, 0.95]);
    mask.noStroke();
    mask.fill("black");
    mask.circle(W / 2, 0.45 * H, 0.12 * H);
    for (let i = 0; i < 6; i++) {
      const x = scene.randomGaussian(0.5 * W, 0.008 * W);
      const y = scene.randomGaussian(0.41 * H, 0.01 * H);
      painted(drop, [x, y, 0.1 * H], [0, 0, 0, 0.7]);
    }
    painted(drop, [W / 2, 0.39 * H, 0.1 * H], [0, 0, 100, 0.5]);
    for (let i = 0; i < 3; i++) {
      const x = scene.randomGaussian(W / 2, 0.008 * W);
      const y = scene.randomGaussian(0.52 * H, 0.0001 * H);
      painted(drop, [x, y, 0.1 * H], [0, 0, 100, 0.3]);
    }
    let d = drop.get();
    d.mask(mask);
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
  };

  const createGUI = (gui) => {
    cfg.title = "Something, RB 2023/ \u{1F1E8}\u{1F1ED}";
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
