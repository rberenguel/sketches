import {
  createBaseGUI,
  Command,
  GUI,
  Integer,
  Float,
  String,
  Key,
  Control,
  Seeder,
} from "../libraries/gui/gui.js";

import {
  getLargeCanvas,
  smoothStep,
  sceneShuffle,
  signature,
} from "../libraries/misc.js";

import {
  solarizedDark,
  solarizedDarkPalette,
  wernerBase,
  wernerBasePalette,
  shimmeringColorArray,
  c82GeoPrimesPalette,
} from "../libraries/palettes.js";

const sketch = (s) => {
  let gui;
  let debug = true;

  // Globals needed in controls, commands or deep arguments
  let cfg = {
    hd: 1,
    seeder: undefined,
    largeCanvas: undefined,
  };

  let W, H; // Helpful globals to avoid typing scene.width so much

  const PI = s.PI;

  let scene, shadow, mask;
  const FRAMERATE = 100;

  s.preload = () => {
    cfg.font = s.loadFont("../libraries/fonts/Monoid-Retina.ttf");
  };
  const hg = (scene, h, sig) => (scene.randomGaussian(h, sig) + 360) % 360;
  const sg = (scene, s, sig) => (scene.randomGaussian(s, sig) + 100) % 100;
  const bg = (scene, b, sig) => (scene.randomGaussian(b, sig) + 100) % 100;

  // Palette controls stolen from Flows
  let palette = {};

  const werner = () => {
    (palette.colors = wernerBasePalette),
      (palette.name = "Werner"),
      (palette.short = "we"),
      (palette.background = wernerBase.lightBrown);
  };

  const solarized = () => {
    (palette.colors = solarizedDarkPalette),
      (palette.name = "SolarizedDark"),
      (palette.short = "sd"),
      (palette.background = solarizedDark.base01);
  };

  const shimmering = () => {
    (palette.colors = shimmeringColorArray),
      (palette.name = "Shimmering"),
      (palette.short = "sh"),
      (palette.background = shimmeringColorArray[0]);
  };

  const geometricPrimes = () => {
    (palette.colors = c82GeoPrimesPalette.slice(
      0,
      c82GeoPrimesPalette.length - 2,
    )),
      (palette.name = "±C82GeoPrimes"),
      (palette.short = "gp"),
      (palette.background =
        c82GeoPrimesPalette[c82GeoPrimesPalette.length - 1]);
  };

  const palettes = [solarized, werner, shimmering, geometricPrimes];
  let palettesIndex = 0;

  function cyclePalettes() {
    palettesIndex = (palettesIndex + 1) % palettes.length;
    palettes[palettesIndex]();
  }

  s.setup = () => {
    let { w, h } = getLargeCanvas(s, 1600);
    let canvas = s.createCanvas(w, h);
    s.pixelDensity(1);
    canvas.mousePressed(() => {});
    s.setFrameRate(FRAMERATE);
    //s.noLoop()
    cfg.seeder = new Seeder();
    scene = s.createGraphics((cfg.hd * 1800) << 0, (cfg.hd * 1200) << 0);
    (W = scene.width), (H = scene.height);

    init();
    gui = createGUI();
    gui.fetch();
    gui.toggle();
  };
  function* bubbly(scene, cx, cy, d, color) {
    const NR = 1.2 / cfg.hd;
    const random = scene.random;
    const ITER = d * d; // tweaked * d
    let step = 0;
    const hu = scene.hue(color);
    const sa = scene.saturation(color) * 2;
    const br = scene.brightness(color);
    const al = scene.alpha(color);
    scene.strokeWeight(1.5 * cfg.hd);
    for (let i = 0; i < 2 * ITER; i++) {
      step++;
      const a = random(PI * 2);
      const r = d * (1.0 - random(random(random(random())))); // 1 less than bubbles
      const rr = d - r;
      const foo = a / (2 * PI);
      const smoob = 0.5 * br + 0.5 * br * smoothStep(d / 2, d, rr);
      const smooa = 0.2 + 0.5 * al + 0.5 * al * smoothStep(d / 2, d, rr);
      const col = scene.color(hu, sa, smoob, smooa);
      scene.stroke(col);
      scene.fill(col);
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      scene.circle(x, y, NR);
      if (step % ((50 * d) << 0) == 0) {
        yield;
      }
    }
  }

  function* base(scene, color) {
    const hu = scene.hue(color);
    const sa = scene.saturation(color);
    const br = 0.3 * scene.brightness(color);
    const factor = 10;
    const WSTEPS = (factor * 100) << 0;
    const HSTEPS = (factor * 100) << 0;
    scene.noStroke();
    let coords = [];
    for (let i = 0; i < HSTEPS; i++) {
      for (let j = 0; j < WSTEPS / 2; j++) {
        coords.push([i, j]);
      }
    }
    const shuf = sceneShuffle(scene, coords);
    let step = 0;
    for (let coord of coords) {
      const [i, j] = coord;
      step++;
      const sea = [hg(scene, hu, 5), sa, bg(scene, br, 5)];
      const alpha = scene.random(0.03, 0.08);
      const x1 = (j * W) / WSTEPS + scene.randomGaussian(0, 4 * factor);
      const y1 = (i * H) / HSTEPS + scene.randomGaussian(0, 4 * factor);
      const w1 = scene.random(6 * factor, 12 * factor);
      const h1 = scene.random(0.2 * w1, 0.5 * w1);
      const x2 = W - (j * W) / WSTEPS + scene.randomGaussian(0, 4 * factor);
      const y2 = (i * H) / HSTEPS + scene.randomGaussian(0, 4 * factor);
      const w2 = scene.random(6 * factor, 12 * factor);
      const h2 = scene.random(0.2 * w2, 0.5 * w2);
      scene.push();
      scene.fill(scene.color(...sea, alpha));
      scene.translate(x1, y1);
      scene.rotate(scene.random(-0.03, 0.03));
      scene.ellipse(0, 0, w1, h1);
      scene.pop();
      scene.push();
      scene.fill(scene.color(...sea, alpha));
      scene.translate(x2, y2);
      scene.rotate(scene.random(-0.03, 0.03));
      scene.ellipse(0, 0, w2, h2);
      scene.pop();
      if (step > (W * H) / 300) {
        return;
      }
      if (step % 200 == 0) {
        yield;
      }
    }
  }

  // Generators created in init
  let drawBackground, drawCircleStuff;
  // Global signature
  let sigCfg;
  function init() {
    let background, spheres;
    scene.randomSeed(cfg.seeder.get());
    scene.noiseSeed(cfg.seeder.get());
    scene.colorMode(s.HSB);
    palettes[palettesIndex](); // Init palette
    let e = [...palette.colors];
    let shuf = sceneShuffle(scene, e);
    background = shuf[0];
    spheres = shuf.slice(1);
    const hu = scene.hue(scene.color(background));
    const sa = 0.3 * scene.saturation(scene.color(background));
    const br = 100 - scene.brightness(scene.color(background));
    console.log(hu, sa, br);
    scene.background(scene.color(hu, sa, br));
    const identifier = `${cfg.seeder.hex()}@${cfg.hd.toPrecision(2)}`;
    sigCfg = {
      s: s,
      scene: scene,
      color: "#101020",
      shadow: "#CFFFFB",
      fontsize: 11,
      right: scene.width,
      bottom: scene.height,
      identifier: identifier,
      sig: "rb'23",
      hd: cfg.hd,
      font: cfg.font,
    };

    let circles = [];
    for (let j = 0; j < 10; j++) {
      circles.push([
        scene.randomGaussian(W / 2, W / 4),
        scene.randomGaussian(H / 2, H / 4),
        scene.randomGaussian(H / 4, H / 50),
      ]);
    }
    backgroundDone = false;
    circleStuffDone = false;
    drawBackground = base(scene, scene.color(background));
    drawCircleStuff = circleStuff(scene, circles, spheres);
  }

  function out(x, y) {
    return x < 0 || y < 0 || x > W * cfg.hd || y > H * cfg.hd;
  }

  function* circleStuff(scene, circles, spheres) {
    const C_STEPS = FRAMERATE;
    const C_SPEED = 8;
    const numColors = spheres.length;

    const alfactor = 0.09;
    const SHADOW_STEPS = (5 * 1) / alfactor;
    let shadowSteps = 0;

    let bubbleColor;
    let circCounter = 0;
    for (let circ of circles) {
      const sphere = spheres[circCounter % numColors];
      const color = scene.color(sphere);
      const hu = scene.hue(color);
      const sa = scene.saturation(color);
      const br = scene.brightness(color);

      circCounter++;
      const nhu = (scene.randomGaussian(hu, 5) + 360) % 360;
      const nsa = (scene.randomGaussian(sa, 5) + 100) % 100;
      const nbr = (0.75 * br + scene.random(0.3 * br) + 100) % 100;
      bubbleColor = scene.color(nhu, nsa, 0.8 * nbr);
      const ballColor = scene.color(nhu, nsa, nbr);
      scene.fill(ballColor);
      let [x, y, r] = circ;
      const [dx, dy, f] = [r * 0.5, r * 0.5, 0.2];
      if (out(x, y)) {
        continue;
      }
      scene.noStroke();
      let bubbled = false,
        bubbling;
      for (let i = 0; i < C_STEPS; i++) {
        const easing = smoothStep(0, C_STEPS, i);
        const rr = r * Math.sqrt(easing);
        if (i >= C_STEPS - 1) {
          scene.strokeWeight(3 * cfg.hd);
          scene.stroke("black");
          scene.noFill();
          scene.circle(x, y, (rr + 2.5) << 0);
          scene.strokeWeight(3 * cfg.hd);
          scene.stroke(scene.color(nhu, nsa, 0.3 * nbr));
          scene.circle(x, y, (rr + 1.5) << 0);
        }
        scene.fill(ballColor);
        scene.circle(x, y, rr << 0);
        if (i % C_SPEED == 0) {
          yield;
        }
        for (let j = 0; j < SHADOW_STEPS; j++) {
          shadowSteps++;
          // And again I find myself writing this thing
          // Start with maximum radius, minimum alpha
          const col = scene.color(
            0,
            0,
            0,
            alfactor * smoothStep(0, SHADOW_STEPS, j),
          ); // darkens j -> SHADOW_STEPS
          const radF = 1 - f + f * (1 - smoothStep(0, SHADOW_STEPS, j));
          scene.fill(col);
          scene.noStroke();
          scene.circle(x + dx, y + dy, rr * radF);
          scene.fill(ballColor);
          scene.circle(x, y, rr);
        }
      }
      // Generator based on Bubbles, creates the sphere effect
      bubbling = bubbly(scene, x, y, r / 2, bubbleColor);

      while (!bubbled) {
        bubbled = bubbling.next().done;
        yield;
      }
    }
    return;
  }

  // State machine globals are better close to s.draw
  let backgroundDone, circleStuffDone;
  let capture,
    captureIt = false,
    started = true;

  s.draw = () => {
    if (started && captureIt) {
      capture = P5Capture.getInstance();
      capture.start({
        width: s.width % 2 == 0 ? s.width : s.width + 1,
        height: s.height % 2 == 0 ? s.height : s.height + 1,
        framerate: 24,
      });
      started = false;
    }
    if (!backgroundDone) {
      backgroundDone = drawBackground.next().done;
    } else {
      if (!circleStuffDone) {
        circleStuffDone = drawCircleStuff.next().done;
      } else {
        s.noLoop();
        if (capture) {
          capture.stop();
        }
      }
    }
    signature(sigCfg);
    cfg.largeCanvas = scene;
    console.log(cfg.largeCanvas.width, cfg.largeCanvas.height);
    let c = scene.get();
    c.resize(W, 0);
    s.image(c, 0, 0);
  };

  const createGUI = (gui) => {
    cfg.title = "Palette spheres, RB 2023/8 \u{1F1E8}\u{1F1ED}";
    cfg.info =
      "I explored circles-with-shadows on a lazy Saturday and then tried to spice it up and animate";
    cfg.subinfo = "No high res available to avoid making recording explode.";
    cfg.s = s;
    let R = new Key("r", () => {
      gui.spin(() => {
        cfg.s.clear();
        cfg.largeCanvas.clear();
        captureIt = false;
        started = true;
        init();
        cfg.s.loop();
        gui.spin();
        gui.unmark();
        gui.update();
      });
    });
    let G = new Key("g", () => {
      gui.spin(() => {
        cfg.s.clear();
        cfg.largeCanvas.clear();
        captureIt = true;
        started = true;
        init();
        cfg.s.loop();
        gui.spin();
        gui.unmark();
        gui.update();
      });
    });
    let pals = new Key("q", cyclePalettes);
    let paletteShow = new String(() => palette.name);
    let paletteControl = new Control([pals], "Cycle palettes", paletteShow);

    let resetCanvas = new Command(R, "reset");
    let withRec = new Command(G, "reset & record");

    cfg.commands = [resetCanvas, withRec, cfg.seeder.command];
    cfg.controls = [paletteControl, cfg.seeder.control];
    cfg.skipHD = true;
    gui = createBaseGUI(cfg);
    return gui;
  };

  s.keyReleased = () => {
    gui.dispatch(s.key);
  };
};

P5Capture.setDefaultOptions({ disableUi: true, format: "png", bitrate: 5000 });
p5.disableFriendlyErrors = true;
let p5sketch = new p5(sketch);
