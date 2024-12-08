import {
  Command,
  GUI,
  Integer,
  Float,
  Key,
  Control,
} from "../libraries/gui/gui.js";

import {
  getLargeCanvas,
  gaussColor,
  darken,
  shuffle,
} from "../libraries/misc.js";

import { sweepFloodfill } from "../libraries/floodfill.js";

import { granulateChannelsBW } from "../libraries/effects.js";

import { glassTexture } from "../libraries/glassLibraries.js";

// Base to avoid writing always the same

const sketch = (s) => {
  let gui,
    debug = false;
  let largeCanvas;
  let hd = 1;
  let R;
  s.setup = () => {
    let { w, h } = getLargeCanvas(s, 1600);
    let canvas = s.createCanvas(w, h);
    s.pixelDensity(1);
    canvas.mousePressed(() => {});
    s.frameRate(20);
    s.noLoop();
    gui = createGUI();
    gui.toggle();
    R.action();
  };

  const burgundy = "#752D26";
  const crimson = "#752D26";
  const blueIris = "#5A2CE8";
  const beige = "#D0A985";
  const pink = "#F07070";
  const green = "#227A62";
  const darkSea = "#1F3336";

  const colors = [burgundy, crimson, blueIris, beige, pink, green, darkSea];

  const gray100 = [100, 100, 100, 255];

  s.draw = () => {};

  function plot(hd, seed) {
    let scene = s.createGraphics(hd * s.width, hd * s.height);
    scene.background(100);

    curvy(scene, 5, 5, "black", 1 * hd, seed);
    glassy(scene, 5, 5);
    glassTexture(s, scene, seed, hd);
    let metal = s.createGraphics(hd * s.width, hd * s.height);
    metal.background("#00000000");
    curvy(metal, 5, 5, 100, 15 * hd, seed);
    curvy(metal, 5, 5, 70, 14 * hd, seed);
    curvy(metal, 5, 5, 50, 13 * hd, seed);
    curvy(metal, 5, 5, 30, 12 * hd, seed);
    curvy(metal, 5, 5, "black", 11 * hd, seed);
    granulateChannelsBW(metal, [40, 0], true);
    let c = metal.get();
    scene.image(c, 0, 0);
    largeCanvas = scene;
    c = scene.get();
    c.resize(s.width, 0);
    s.image(c, 0, 0);
  }

  function curvy(scene, nh, nv, color, weight, seed) {
    // Create a curvy matrix
    const vspan = scene.height / nv;
    const hspan = scene.width / nh;
    scene.randomSeed(seed);
    scene.strokeWeight(weight);
    scene.stroke(color);
    scene.noFill();
    for (let i = 1; i < nh; i++) {
      let x = Math.floor(i * hspan);
      scene.beginShape();
      scene.curveVertex(x, 0);
      scene.curveVertex(x, 1);
      for (let j = 1; j <= nv + 1; j++) {
        x += scene.random(-hspan / 5, hspan / 5);
        let y = Math.floor(j * vspan) + scene.random(-vspan / 5, vspan / 5);
        scene.curveVertex(x, y);
      }
      scene.curveVertex(x, scene.height);
      scene.endShape();
    }
    for (let i = 1; i < nv; i++) {
      let y = Math.floor(i * vspan);
      scene.beginShape();
      scene.curveVertex(0, y);
      scene.curveVertex(1, y);
      for (let j = 1; j <= nv + 1; j++) {
        y += scene.random(-vspan / 5, vspan / 5);
        let x = Math.floor(j * hspan) + scene.random(-hspan / 5, hspan / 5);
        scene.curveVertex(x, y);
      }
      scene.curveVertex(scene.width, y);
      scene.endShape();
    }
  }

  function glassy(scene, nh, nv) {
    const vspan = scene.height / nv;
    const hspan = scene.width / nh;
    if (debug) {
      scene.stroke("red");
      scene.strokeWeight(3);
    }
    for (let i = 0; i < nh; i++) {
      let x = hspan / 2 + Math.floor(i * hspan);
      for (let j = 0; j <= nv + 1; j++) {
        let y = vspan / 2 + Math.floor(j * vspan);
        if (debug) {
          scene.point(x, y);
        } else {
          let index = Math.floor(Math.random() * colors.length);
          const c2p = colors[index];
          let c2 = darken(scene, gaussColor(scene, c2p, 30), 0.7);
          sweepFloodfill(scene, x, y, gray100, c2);
        }
      }
    }
  }

  function createGUI() {
    let info =
      "Stained glass, formed of several layers of noise based on arcs. Can be slow to generate";
    let subinfo =
      "This is just a testbed for a project where I need generative stained glass<br/>Very high resolutions can fail depending on the browser";
    let S = new Key("s", () => {
      largeCanvas.save("img.png");
    });
    let saveCmd = new Command(S, "save the canvas");
    R = new Key("r", () => {
      gui.spin(() => {
        s.clear();
        plot(hd, window.performance.now());
        gui.spin();
      });
    });

    let resetCanvas = new Command(R, "reset");

    let decH = new Key("(", () => {
      if (hd > 0) {
        hd -= 0.1;
      }
    });
    let incH = new Key(")", () => {
      if (hd < 10) {
        hd += 0.1;
      }
    });
    let hdInfo = new Float(() => hd);
    let hdControl = new Control(
      [decH, incH],
      "+/- resolution export factor",
      hdInfo,
    );

    let gui = new GUI(
      "Stained, RB 2023/04",
      info,
      subinfo,
      [saveCmd, resetCanvas],
      [hdControl],
    );

    let QM = new Key("?", () => gui.toggle());
    let hide = new Command(QM, "hide this");

    gui.addCmd(hide);
    gui.update();
    return gui;
  }

  s.keyReleased = () => {
    gui.dispatch(s.key);
  };
};

p5.disableFriendlyErrors = true;
let p5sketch = new p5(sketch);
