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

import { getLargeCanvas, darken, bezierB } from "../libraries/misc.js";

import { oldieHD } from "../libraries/effects.js";

// Base to avoid writing always the same

const sketch = (s) => {
  let gui,
    debug = false,
    bBlack = false;
  let largeCanvas;

  let R;
  let cfg = {
    hd: 1,
    seeder: undefined,
    largeCanvas: undefined,
  };
  const sun = s.color("#993333");
  const mount = s.color("#9999EE");
  const white = s.color(255, 255, 255);
  const black = s.color("#000");
  const darkBrown = s.color(151, 95, 49);
  const cyan = s.color(0, 250, 250);
  const sea = s.color("#03199a");
  const sunColor = s.color("#f26d50");
  const sunColorWithAlpha = s.color("#f26d50");

  s.preload = () => {
    cfg.font = s.loadFont("../libraries/fonts/Monoid-Retina.ttf");
  };

  function addText(scene, params, content) {
    scene.push();
    scene.noStroke();
    const d = darken(s, darkBrown, 0.3);
    const e = darken(s, darkBrown, 1.7);
    scene.fill(d);
    scene.textAlign(s.CENTER);
    scene.textFont(cfg.font, cfg.hd * params.fontsize);
    let ctx = scene.drawingContext;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.shadowBlur = 1;
    ctx.shadowColor = e; //cfg.shadow
    const nr = (1.0065 * params.r) / 2;
    const ftf = Math.cos(s.PI / 4);
    const arcW = (cfg.hd * params.fontsize) / nr; // Correction factor for spacing
    for (let i = 0; i < content.length; i++) {
      scene.push();
      const char = content[i];
      const arcPos = s.PI / 4 - i * arcW;
      let x = params.x + nr * Math.cos(arcPos);
      let y = params.y + nr * Math.sin(arcPos);
      scene.translate(x, y);
      scene.rotate(-s.PI / 2 + arcPos);
      scene.text(char, 0, 0);
      scene.pop();
    }
    scene.pop();
  }

  s.setup = () => {
    let { w, h } = getLargeCanvas(s, 1600);
    let canvas;
    if (w > h) {
      canvas = s.createCanvas(w, h);
    } else {
      canvas = s.createCanvas(w, w / 1.4);
    }
    s.pixelDensity(1);
    canvas.mousePressed(() => {});
    s.frameRate(20);
    s.noLoop();
    cfg.seeder = new Seeder();
    gui = createGUI();
    gui.toggle();
  };

  s.draw = () => {
    R.action();
  };

  const sunParams = (scene) => {
    return {
      x: 0.6 * scene.width,
      y: 0.4 * scene.height,
      r: 0.35 * scene.height,
    };
  };

  function drawMountain(scene, params) {
    scene.strokeJoin(scene.ROUND);

    scene.stroke(white);
    scene.strokeWeight(cfg.hd * 15);
    if (debug) scene.strokeWeight(cfg.hd * 1);
    scene.beginShape();
    for (const p of params.ridge) {
      scene.vertex(p[0], p[1]);
    }
    scene.endShape();

    scene.strokeWeight(cfg.hd * 8);
    scene.stroke(darkBrown);
    let ctx = scene.drawingContext;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = -3 * cfg.hd;
    ctx.shadowBlur = cfg.hd * 10;
    ctx.shadowColor = white;

    const gradient = ctx.createLinearGradient(
      params.left,
      params.top,
      params.left,
      params.bottom,
    );
    gradient.addColorStop(0, mount);
    gradient.addColorStop(0.4, mount);
    gradient.addColorStop(0.75, scene.color(100, 200, 50));
    gradient.addColorStop(1, "#FFFFFF");
    ctx.fillStyle = gradient;

    if (debug) scene.noFill();
    if (debug) scene.strokeWeight(cfg.hd * 1);
    scene.beginShape();
    for (const p of params.ridge) {
      scene.vertex(p[0], p[1]);
    }
    scene.endShape();
    scene.noStroke();
    scene.fill(white);
    scene.rect(0, params.bottom - 2, scene.width, scene.height);
  }

  function drawSun(scene) {
    const sun = sunParams(scene);
    let ctx = scene.drawingContext;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = cfg.hd * 10;
    ctx.shadowColor = white;

    scene.fill(sunColor);
    if (debug) scene.noFill();
    scene.strokeWeight(cfg.hd * 15);
    if (debug) scene.strokeWeight(cfg.hd * 1);
    scene.stroke(white);
    scene.circle(sun.x, sun.y, sun.r);
    if (debug) scene.strokeWeight(cfg.hd * 1);
    scene.strokeWeight(cfg.hd * 8);
    scene.stroke(darkBrown);
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = -3 * cfg.hd;
    ctx.shadowBlur = cfg.hd * 10;
    ctx.shadowColor = white;
    if (debug) scene.noFill();
    scene.circle(sun.x, sun.y, sun.r);
  }

  function generateRidge(scene, params) {
    // Draws a mountain ridge with pure 45 degree angles.
    // Given a bottom line and two points L left, R right,
    // fits a mountain ridge in a right angle triangle with
    // top at x=(R+L)/2 Enable debug to see the bounding triangle.
    // When the tracing reaches a point out of the bounding, pull it
    // to the edge and finish.
    scene.strokeWeight(cfg.hd * 15);
    scene.stroke(white);

    scene.stroke("red");
    let ridge = [[params.left, params.bottom]];
    let peaks = Math.floor(scene.random(1, 3)) * 2 + 1;
    let peakSpan = (params.right - params.left) / peaks;

    let up = true;
    const sqr2 = Math.sqrt(2) / 2;
    if (debug) scene.point(params.left, params.bottom);
    let rise = params.bottom; // The next peak or valley
    let ridgeLeft = params.left; // and where it starts from
    if (debug) {
      let w = scene.strokeWeight();
      scene.strokeWeight(cfg.hd * 6);
      scene.noFill();
      scene.triangle(
        params.left,
        params.bottom,
        params.right,
        params.bottom,
        params.left + (params.right - params.left) / 2,
        params.bottom - (params.right - params.left) / 2,
      );
      scene.strokeWeight(w);
    }
    while (ridgeLeft < params.right) {
      if (debug) scene.strokeWeight(cfg.hd * 15);
      if (ridgeLeft > params.right) {
        ridgeLeft = params.right;
      }
      let next;
      if (up) {
        next = scene.random(0.5 * peakSpan, 0.9 * peakSpan);
      } else {
        next = scene.random(0.3 * peakSpan, 0.5 * peakSpan);
      }
      ridgeLeft = ridgeLeft + next;
      if (up) {
        rise = rise - next;
        if (debug) scene.point(ridgeLeft, rise);
        up = false;
      } else {
        rise = rise + next;
        if (debug) scene.point(ridgeLeft, rise);
        up = true;
      }
      // This is the case of "next point is outside the BTriangle"
      if (params.bottom - rise > params.right - ridgeLeft) {
        if (debug) {
          scene.stroke("blue");
          scene.point(ridgeLeft, rise);
        }
        const mid = (rise + params.bottom - (params.right - ridgeLeft)) / 2;
        if (debug) {
          scene.stroke("yellow");
          scene.point(ridgeLeft, mid);
        }
        const diff = mid - rise;
        rise = rise + diff;
        ridgeLeft -= diff;
        if (debug) {
          scene.stroke("green");
          scene.point(ridgeLeft, rise);
        }
      }

      ridge.push([ridgeLeft, rise]);
    }
    ridge.push([params.right, params.bottom]);
    scene.stroke("red");
    if (debug) scene.point(params.right, params.bottom);
    if (debug) scene.strokeWeight(cfg.hd * 6);
    return ridge;
  }

  function scenery() {
    let scene = s.createGraphics(s.width * cfg.hd, s.height * cfg.hd);
    let background = s.createGraphics(s.width * cfg.hd, s.height * cfg.hd);
    s.randomSeed(cfg.seeder.get());
    s.noiseSeed(cfg.seeder.get());
    scene.randomSeed(cfg.seeder.get());
    scene.noiseSeed(cfg.seeder.get());
    background.randomSeed(cfg.seeder.get());
    background.noiseSeed(cfg.seeder.get());
    let ctx = scene.drawingContext;
    scene.background(white);

    const top = 0.25 * scene.height;
    const left = 0.25 * scene.width;
    const right = 0.75 * scene.width;
    const bottom = 0.6 * scene.height;

    // Sky
    let params = {
      left: left,
      top: top,
      bottom: bottom,
      right: right,
    };

    sky(scene, params);

    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = cfg.hd * 10;
    ctx.shadowColor = white;

    const ridge = generateRidge(scene, params);
    params.ridge = ridge;
    drawSun(scene);
    drawMountain(scene, params);
    clouds(scene, params);
    waves(scene, params);

    let maskCircle = s.createGraphics(scene.width, scene.height);
    maskCircle.clear();
    maskCircle.stroke(white);
    maskCircle.fill(white);
    const maskCircleParams = {
      x: scene.width / 2,
      y: 0.4 * scene.height,
      r: 0.75 * scene.height,
    };
    maskCircle.circle(
      maskCircleParams.x,
      maskCircleParams.y,
      maskCircleParams.r + 10 * cfg.hd,
    );
    scene.ellipseMode(s.CENTER);
    scene.stroke(darkBrown);
    scene.strokeWeight(22 * cfg.hd);
    scene.noFill();
    scene.circle(maskCircleParams.x, maskCircleParams.y, maskCircleParams.r);

    if (!debug) oldieHD(s, scene, 0.4, cfg.hd, s.HARD_LIGHT);
    let c = scene.get();
    if (!debug) c.mask(maskCircle);
    if (bBlack) {
      background.background(0, 255);
    } else {
      background.background(255, 255);
    }
    background.translate(0, 0.1 * scene.height); // Center the masked content
    background.image(c, 0, 0);

    const textParams = {
      x: maskCircleParams.x,
      y: maskCircleParams.y,
      r: maskCircleParams.r,
      fontsize: 11,
    };
    const identifier = `#${cfg.seeder.hex()}@${cfg.hd.toPrecision(2)} | rb'23`;
    addText(background, textParams, identifier);
    cfg.largeCanvas = background;
    c = background.get();
    c.resize(s.width, 0);
    s.push();
    s.translate(0, (-0.1 * scene.height) / cfg.hd);
    s.image(c, 0, 0);
    s.pop();
  }

  function bezierer(scene, anchor1, control1, control2, anchor2) {
    scene.beginShape();
    scene.vertex(anchor1[0], anchor1[1]);
    scene.bezierVertex(
      control1[0],
      control1[1],
      control2[0],
      control2[1],
      anchor2[0],
      anchor2[1],
    );
    scene.endShape();
    if (debug) {
      scene.push();
      scene.strokeWeight(cfg.hd * 15);
      scene.stroke("#EEEE00");
      scene.point(anchor1[0], anchor1[1]);
      scene.stroke("#EE0000");
      scene.point(anchor2[0], anchor2[1]);
      scene.stroke("#00EE00");
      scene.point(control1[0], control1[1]);
      scene.stroke("#0000EE");
      scene.point(control2[0], control2[1]);
      scene.pop();
    }
  }

  function sky(scene, params) {
    const bandColors = [
      s.color("#3e9cbf"),
      s.color("#a7ecf2"),
      s.color("#f2c43d"),
      s.color("#f17c37"),
      sunColor,
    ];
    const bands = bandColors.length;

    const skyBandHeight = scene.random(30, 80);
    const skyHeight = scene.random(0.9 * params.top, 0.5 * params.top);
    scene.rectMode(s.CORNERS);
    scene.noStroke();
    scene.fill(white);
    scene.rect(0, 0, scene.width, skyHeight);
    const spanV = params.bottom - params.top;
    const spanH = params.right - params.left;
    for (let i = 0; i < bands; i++) {
      const currentColor = bandColors[i];
      scene.fill(currentColor);
      scene.stroke(currentColor);
      scene.strokeWeight(cfg.hd * skyBandHeight);
      const start = scene.width * (1.1 - Math.cos((0.5 * Math.PI) / (i + 3)));
      const end = scene.width * (Math.cos((0.5 * Math.PI) / (i + 3)) - 0.1);
      scene.line(
        start,
        skyHeight + (i * spanV) / bands,
        end,
        skyHeight + (i * spanV) / bands + 2,
      );
    }
  }

  function wave(scene, params) {
    scene.beginShape();
    const ut = scene.random(1.1, 1.3);
    const us = scene.random(1.5, 1.7);
    const tt = scene.random(2.2, 2.3);
    const fh = scene.width / 2.5;
    const eh = scene.width / 1.5;
    const anc1 = [params.left, ut * params.bottom];
    const ctl1 = [ut * params.left, fh];
    const ctl2 = [us * params.left, ut * fh];
    const anc2 = [scene.width / 2, tt * params.top];
    const ctl3 = [us * params.left, eh];
    const ctl4 = [ut * params.left, eh * ut];
    const anc3 = [params.left, ut * params.bottom];
    if (!debug) {
      scene.vertex(...anc1);
      scene.bezierVertex(...ctl1, ...ctl2, ...anc2);
      scene.bezierVertex(...ctl3, ...ctl4, ...anc3);
      scene.endShape();
    } else {
      scene.stroke(sea);
      bezierB(scene, ...anc1, ...ctl1, ...ctl2, ...anc2);
      bezierB(scene, ...anc2, ...ctl3, ...ctl4, ...anc3);
    }
  }

  function waves(scene, params) {
    scene.push();
    let ctx = scene.drawingContext;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 0;
    scene.stroke("#BBDDFF");
    scene.fill(sea);
    if (scene.random(0, 2) < 1) {
      wave(scene, params);
      scene.translate(cfg.hd * 100, cfg.hd * 30);
      wave(scene, params);
      scene.translate(cfg.hd * 100, cfg.hd * 30);
      wave(scene, params);
      scene.translate(cfg.hd * 100, cfg.hd * 30);
      wave(scene, params);
      scene.translate(cfg.hd * 100, cfg.hd * 30);
      wave(scene, params);
    }
    scene.pop();
  }

  function cloud(scene, left, mid, seed) {
    // Kid style cloud drawing. Quite fixed.
    scene.randomSeed(seed);
    const cloudy = s.color(245, 235, 235);
    scene.fill(cloudy);
    if (debug) scene.noFill();
    if (debug) scene.strokeWeight(cfg.hd * 3);
    scene.stroke(cloudy);
    scene.ellipseMode(s.CORNERS);
    scene.rectMode(s.CORNERS);
    const leftR = scene.random(cfg.hd * 12, cfg.hd * 22);
    const rightR = scene.random(cfg.hd * 13, cfg.hd * 25);
    const bottom = mid + rightR;
    const gap = cfg.hd * 75;
    scene.ellipse(left, mid - leftR, left + 2 * leftR, bottom);
    scene.ellipse(
      left + gap - rightR,
      mid - rightR,
      left + gap + rightR,
      bottom,
    );
    scene.rect(left + leftR, mid, left + gap, mid + rightR);
    let r = cfg.hd * 22;
    let hShift = (left, r, factor) => left + factor * leftR;
    let vShift = (center) => center - cfg.hd * 5; //0.5*s.random(rightR-leftR, leftR-rightR)
    const one = hShift(left, r, 0.4);
    scene.ellipse(one, vShift(mid) - r, one + 2 * r, vShift(mid) + r);
    r = cfg.hd * 31;
    let two = hShift(one + cfg.hd * 5, r, 0.6);
    scene.ellipse(
      two,
      vShift(vShift(mid)) - r,
      two + 2 * r - cfg.hd * 5,
      vShift(vShift(mid)) + r - cfg.hd * 5,
    );
    r = cfg.hd * 20;
    let three = hShift(two + cfg.hd * 5, r, 1.4);
    scene.ellipse(
      three,
      vShift(vShift(vShift(mid))) - r,
      three + 2 * r,
      vShift(vShift(vShift(mid))) + r,
    );
  }

  function cloudShadow(scene, left, mid, seed) {
    // Adjust glow direction depending on sun position
    let ctx = scene.drawingContext;
    const sun = sunParams(scene);
    const dx = left - sun.x;
    const dy = mid - sun.y;
    const norm = Math.sqrt(dx * dx + dy * dy);
    if (!debug) {
      ctx.shadowOffsetX = (cfg.hd * 2 * dx) / norm;
      ctx.shadowOffsetY = (cfg.hd * 2 * dy) / norm;
      ctx.shadowBlur = cfg.hd * 20;
    }
    if (debug) {
      scene.strokeWeight(cfg.hd * 5);
      scene.point(left + (30 * dx) / norm, mid + (30 * dy) / norm);
      scene.strokeWeight(cfg.hd * 3);
      scene.stroke("black");
      scene.line(
        left,
        mid,
        left + (cfg.hd * 30 * dx) / norm,
        mid + (cfg.hd * 30 * dy) / norm,
      );
    }
    const cloudy = s.color(155, 135, 135, 100);
    sunColorWithAlpha.setAlpha(150);
    ctx.shadowColor = s.color(sunColorWithAlpha);
    // Draw a shadowed, horrible cloud we will cover with a clean cloud
    cloud(scene, left, mid, seed);
    // Reset shadows in context
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 0;
  }

  function clouds(scene, params) {
    for (let c = 0; c < scene.random(1, 5); c++) {
      const seed = scene.random(-100, 100);
      const left = scene.width * scene.random(0.3, 0.8);
      const mid = scene.height * scene.random(0.2, 0.5);
      cloudShadow(scene, left, mid, seed);
      cloud(scene, left, mid, seed);
    }
  }

  const createGUI = (gui) => {
    cfg.title = "70s patch, RB 2023/03 \u{1F1E8}\u{1F1ED}";
    cfg.info =
      'Inspired by the <i><a href="https://www.reddit.com/r/generative/comments/p0tvfu/generated_panorama_drawings_p5js/">Panoramas</a></i> by <a href="https://twitter.com/estienne_ca?s=21&t=8Ko3mXJTcDWYao4IgQoBBg">estienne_ca</a>';
    cfg.subinfo =
      "Applying the final texture takes a while.<br/>Very high resolutions can fail depending on the browser";
    cfg.s = s;
    R = new Key("r", () => {
      gui.spin(() => {
        s.clear();
        scenery();
        gui.spin();
      });
    });
    let resetCanvas = new Command(R, "reset");
    let V = new Key("v", () => {
      debug = !debug;
      R.action();
    });
    let debugBool = new Boolean(() => debug);
    let debugBoolControl = new Control([V], "toggle debug drawing", debugBool);

    cfg.commands = [resetCanvas, cfg.seeder.command];
    cfg.controls = [debugBoolControl, cfg.seeder.control];

    gui = createBaseGUI(cfg);
    return gui;
  };

  s.keyReleased = () => {
    gui.dispatch(s.key);
  };
};

p5.disableFriendlyErrors = false;
let p5sketch = new p5(sketch);
