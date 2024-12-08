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

import {
  createBlots,
  drawCloud,
  drawBlot,
  canvasUpdate,
  blotPtsInMesh,
  paintPalette,
} from "../libraries/blotLibraries.js";

import {
  getLargeCanvas,
  signature,
  copyColorHSB,
  copyColor,
  darken,
} from "../libraries/misc.js";

import { dateTo19Encoding } from "../libraries/compactTime.js";

const sketch = (s) => {
  let gui;
  let seed = 42;
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
    s.colorMode(s.HSB, 360, 100, 100, 1);
    s.pixelDensity(1);
    canvas.mousePressed(() => {});
    s.frameRate(20);
    s.noLoop();
    cfg.seeder = new Seeder();
    gui = createGUI();
    gui.toggle();
  };

  const smoothStep = (a, b, x) => (
    (x -= a), (x /= b - a), x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x)
  );

  function wobble(scene, cx, cy, r, c, seed) {
    const d = copyColor(s, c);
    const da = s.alpha(d);
    if (seed) {
      scene.randomSeed(seed);
      scene.noiseSeed(seed);
    }
    const wx = (cx + (2 * r - scene.random(r))) << 0;
    const wy = (cy + (2 * r - scene.random(r))) << 0;
    const maxJ = 3;
    for (let j = 0; j < maxJ; j++) {
      const smj = smoothStep(0, maxJ, j);
      const rr = (5 - 5 * smj) * r + 0.5 * scene.noise(cx, cy) * r;
      d.setAlpha(da * smj);
      scene.fill(d);
      scene.stroke(d);
      scene.beginShape();
      for (let i = 0; i <= 15; i++) {
        const w = 0.2 * rr + 0.8 * rr * scene.noise(cx, cy, i);
        const x = wx + w * Math.cos((i * 2 * PI) / 15);
        const y = wy + 2 * w * Math.sin((i * 2 * PI) / 15);
        scene.vertex(x, y);
      }
      scene.endShape(s.CLOSE);
    }
  }

  // Suggestion (Jeff Palmer) vary the color per bristle!

  function downStroke(scene, x, y, width, length, color) {
    console.log(color);
    scene.push();
    let load = [];
    let previousLoad = [];
    let maxCap = 0;
    let bristleColor = [];
    const hue = scene.hue(color);
    const sat = scene.saturation(color);
    const bri = scene.brightness(color);
    const alp = scene.alpha(color);
    console.log(alp);
    scene.colorMode(s.HSB, 360, 100, 100, 1);
    let nh, ns, nb;
    for (let i = 0; i < width; i += 2) {
      load[i] =
        1 * length * Math.sqrt(scene.noise(i * 1000)) * scene.noise(i * 1000);
      const _nh = scene.random(hue - 5, hue + 5);
      nh = _nh < 0 ? _nh + 360 : _nh;
      ns = scene.random(sat - 5, sat + 5) % 100;
      nb = scene.random(bri - 3, bri + 3) % 100;
      console.log(nh << 0, ns << 0, nb << 0, alp);
      let foo = scene.color(0);
      foo.setRed(nh << 0);
      foo.setGreen(ns << 0);
      foo.setBlue(nb << 0);
      foo.setAlpha(alp);
      bristleColor[i] = foo;
      console.log(bristleColor[i]);
      if (load[i] > maxCap) {
        maxCap = load[i];
      }
      previousLoad[i] = 1;
    }
    //let c = copyColor(s, color)
    //let d = darken(s, c, 0.95)
    for (let i = 0; i < length; i += 1) {
      for (let j = 0; j < width; j += 2) {
        if (i < length / 8.0) {
          if (scene.noise(j / 8) > smoothStep(0, length / 8, i)) {
            continue;
          }
        }
        const pigment = load[j];
        const op = smoothStep(0, maxCap, maxCap - pigment);
        const nop = 0.5 * smoothStep(0, 0.7 * length, i);
        const previous = previousLoad[j];
        const drop = Math.abs(
          0.5 * previous +
            0.5 * previous * scene.noise(i / 50) +
            (-2 + 4 * scene.random()),
        );
        if (pigment > drop) {
          load[j] -= drop;
          previousLoad[j] = drop;
          bristleColor[j].setAlpha(1);
        } else {
          if (previous < 0.01 && previous > 0) {
            let e = copyColorHSB(scene, bristleColor[j]);
            //console.log(e)
            e.setAlpha(1.0 * (0.5 - nop));
            if (i > 0.7 * length) {
              e.setAlpha(0);
            }
            scene.stroke(e);
            scene.fill(e);
            wobble(scene, x + j, y + i, 0.4 * drop, e);
          }
          previousLoad[j] = 0;
          continue;
        }
        if (scene.random() < 0.2) {
          previousLoad[j] = 0;
          continue;
        }
        let paintColor;
        if (previous < 0.0001) {
          const veryAlpha = copyColorHSB(scene, bristleColor[j]);
          veryAlpha.setAlpha(0.1);
          paintColor = veryAlpha;
        } else {
          paintColor = bristleColor[j];
        }
        //scene.fill(c)
        /*if(pigment < 1){
          b = darken(s, c, 1.5*pigment)
        } else {
          b = c
        }*/
        scene.fill(paintColor);
        scene.strokeWeight(0.5);
        const internalSeed = (10000 * scene.random()) << 0;
        wobble(scene, x + j, y + i, 0.35 * drop, paintColor, internalSeed); // was d
        //wobble(scene, x + j, y + i, 0.3 * drop, b, internalSeed)
      }
    }
    scene.pop();
  }

  function sideStroke(scene, x, y, width, length, color) {
    scene.push();
    let load = [];
    let previousLoad = [];
    let maxCap = 0;
    for (let i = 0; i < width; i += 2) {
      load[i] =
        1 * length * Math.sqrt(scene.noise(i / 8)) * scene.noise(i / 16);
      if (load[i] > maxCap) {
        maxCap = load[i];
      }
      previousLoad[i] = 0.6;
    }
    let c = copyColor(s, color);
    let d = darken(s, c, 0.95);
    for (let j = 0; j < width; j += 2) {
      for (let i = 0; i < length; i += 1) {
        if (i < length / 8.0) {
          if (scene.noise(j / 8) > smoothStep(0, length / 8, i)) {
            continue;
          }
        }
        const pigment = load[j];
        const op = smoothStep(0, maxCap, maxCap - pigment);
        const nop = 0.5 * smoothStep(0, length / 2, i); // This creates the smooth drop
        const previous = previousLoad[j];
        const drop = Math.abs(
          0.5 * previous +
            0.5 * previous * scene.noise(i / 50) +
            (-2 + 4 * scene.random()),
        );
        if (pigment > drop) {
          load[j] -= drop;
          previousLoad[j] = drop;
          c.setAlpha(255);
        } else {
          if (previous < 0.1) {
            let e = copyColor(s, c);
            e.setAlpha(140 * (0.5 - nop));
            if (i > 0.7 * length) {
              e.setAlpha(0);
            }
            scene.stroke(e);
            scene.fill(e);
            wobble(scene, x + i, y + j, 0.4 * drop, e);
          }
          continue;
        }
        if (scene.random() < 0.6) {
          continue;
        }
        if (pigment < 1) {
          load[j] = 0;
        }
        scene.fill(c);
        scene.strokeWeight(0.5);
        const internalSeed = (10000 * scene.random()) << 0;
        wobble(scene, x + i, y + j, 0.35 * drop, d, internalSeed);
        wobble(scene, x + i, y + j, 0.3 * drop, c, internalSeed);
        if (j >= 0.9 * width) {
          if (drop > 1 && scene.random() < 0.1) {
            const drip = 30 * drop;
            for (let k = 0; k < drip; k++) {
              let fop = 0.5 * smoothStep(0, 0.9 * drip, k);
              let e = copyColor(s, c);
              e.setAlpha(200 * (0.5 - fop));
              scene.stroke(e);
              scene.fill(e);
              wobble(scene, x + i, y + j + k, 0.1 * drop, e);
            }
          }
        }
      }
    }
    scene.pop();
  }

  // This generates an interesting "at sea" effect, unexpectedly
  function interestingWave(scene, x, y, width, length) {
    scene.fill("black");
    scene.stroke("black");
    scene.strokeWeight(1);
    let c = s.color(0, 0, 50, 255);
    for (let i = 0; i < length; i += 4) {
      const op = smoothStep(0, length, i);
      //console.log(op)
      c.setAlpha(255 - 200 * op);
      scene.fill(c);
      scene.stroke(c);
      //scene.line(x, y+i, x+width, y+i)
      for (let j = 0; j < width; j += 3) {
        const di = 4 - scene.noise(i / (100 * op), j / (100 * op)) * 2 * 8;
        scene.circle(
          x + j,
          y + i + di,
          8 * scene.noise(i / (100 * op), j / (100 * op)),
        );
      }
    }
  }

  function baseEvenMesh(spread) {
    let pxs = [];
    for (let j = 0; j < spread; j++) {
      for (let i = 0; i < spread; i++) {
        let cx = spread / 2.0 - i;
        let cy = spread / 2.0 - j;
        if (Math.sqrt(cx * cx + cy * cy) > 200) continue;
        pxs.push([i, j]);
      }
    }
    return pxs;
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

    scene.background("#353530");
    const w1 = scene.random(0.02 * scene.width, 0.08 * scene.width);
    const x1 = 0.12 * scene.width; //scene.random(0.1*scene.width, 0.3*scene.width)
    const y1 = 0.08 * scene.height; //scene.random(0.2*scene.height, 0.4*scene.height)
    scene.colorMode(s.HSB, 360, 100, 100, 1);
    const l1 = scene.random(0.6 * scene.height, 0.6 * scene.height);
    const black = scene.color(240, 10, 10, 0.95);
    const white = scene.color(120, 10, 90, 0.95);
    const red = scene.color(0, 60, 70, 0.95);
    const foo = scene.color(120, 60, 70, 0.95);
    const blood = scene.color("#880808");
    let x = x1;
    let y = y1;
    console.log(scene.hue(red), scene.red(red), red);
    downStroke(scene, x, y, w1, 1.5 * l1, foo);
    /*downStroke(scene, x + 0.2 * w1, y + w1, 0.5 * w1, 0.8 * l1, white)
    sideStroke(scene, x + 0.8 * w1, y + 0.5 * w1, w1, 1.5 * l1, black)
    sideStroke(scene, x + w1, y + 0.8 * w1, 0.5 * w1, 1.5 * l1, white)
    x = x + 0.1 * scene.width
    y = y + 0.1 * scene.height
    downStroke(scene, x, y, w1, 1.5 * l1, black)
    downStroke(scene, x + 0.2 * w1, y + w1, 0.5 * w1, 0.8 * l1, white)
    sideStroke(scene, x + 0.8 * w1, y + 0.5 * w1, w1, 1.5 * l1, black)
    sideStroke(scene, x + w1, y + 0.8 * w1, 0.5 * w1, 1.5 * l1, white)
    x = 0.30 * scene.width
    y = 0.30 * scene.height
    const g1 = s.color("#00b25d")
    const g2 = s.color("#0df24599")
    downStroke(scene, x, y, 1.5 * w1, l1, g1)
    downStroke(scene, x + 0.2 * w1, y + 1 * w1, 0.8 * w1, 0.8 * l1, g2)
    x = 0.9 * scene.width
    y = 0.05 * scene.height
    downStroke(scene, x, y, 1.5 * w1, 2.5 * l1, black)
    downStroke(scene, x + 0.2 * w1, y + 1.5 * w1, 0.8 * w1, 0.8 * l1, white)
    */
    /*drawBlot({
      s: s,
      canvas: scene,
      background: scene,
      paint: 0,
      drawPotential: false,
    }, scene.width / 2, scene.height / 2, blood, {
      mesh: baseEvenMesh(400),
      blotPointsArray: new Array(5000)
    }, {
      blotCount: 20,
      blotStrength: 200,
      blotSpread: 50,
      vectors: false,
    })*/

    if (debug && dly) {
      let c = dly.get();
      scene.image(dly, 0, 0);
    }
    const now = new Date();
    const timeSignature = dateTo19Encoding(now).toUpperCase();
    const identifier = `${cfg.seeder.hex()}@${cfg.hd.toPrecision(2)}(${timeSignature})`;
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
    cfg.commands = [cfg.seeder.command];
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
