import {
  Command,
  FluentGUI,
  Integer,
  Key,
  Control,
} from "../libraries/gui/gui.js";

import { getLargeCanvas } from "../libraries/misc.js";

const sketch = (s) => {
  let gui, night, moonPosition, canvasSize;

  function star(gr, p) {
    let r = s.random(10, 100);
    let g = s.random(10, 100);
    let b = s.random(100, 255);
    let transpNight = s.color(s.red(night), s.green(night), s.blue(night), 0.9);
    let x = s.random(s.width),
      y = s.random(s.height);
    let [mx, my] = moonPosition;
    let dist = Math.sqrt((mx - x) * (mx - x) + (my - y) * (my - y));

    let starColour = s.color(r, g, b);
    if (dist < 200) {
      p = p * (dist / 150);
    }
    gr.beginShape();
    for (let i = 0; i < p * 7.0; i++) {
      let colour = s.lerpColor(starColour, transpNight, i / (p * 10.0));
      gr.stroke(colour);
      gr.circle(x, y, i / 10.0);
    }
    gr.endShape();
  }

  function moon(moonColour) {
    let transpNight = s.color(s.red(night), s.green(night), s.blue(night), 0);
    let moonlightBorder = s.lerpColor(moonColour, transpNight, 0.1);
    let transpMoonlightBorder = s.color(
      s.red(moonlightBorder),
      s.green(moonlightBorder),
      s.blue(moonlightBorder),
      0.001,
    );
    let [x, y] = moonPosition;
    for (let i = 0; i < 30; i++) {
      let colour = s.lerpColor(moonColour, transpMoonlightBorder, i / 30.0);
      s.fill(colour);
      s.circle(x, y, i * 3.2);
    }
  }

  function moonlight(g, moonColour, alpha, factor1, factor2) {
    let transpNight = s.color(s.red(night), s.green(night), s.blue(night), 0);
    let transpMoonlightBorder = s.color(
      s.red(moonColour),
      s.green(moonColour),
      s.blue(moonColour),
      alpha,
    );
    let [x, y] = moonPosition;
    g.beginShape();
    for (let i = 0; i < 20; i++) {
      g.fill(transpMoonlightBorder);
      g.circle(x, y, i * 24);
    }
    g.endShape();
  }

  function layer(k, dark) {
    s.noiseSeed(s.random(100));
    s.beginShape();
    s.noStroke();
    s.fill(dark);
    s.curveVertex(0, s.height);
    s.curveVertex(0, (3 * s.height) / 4);
    let pts = s.randomGaussian(5, 3);
    for (let i = 0; i <= pts; i++) {
      s.curveVertex(
        (i * s.width) / pts,
        (1 * s.height) / 3 +
          2 * s.noise((i + 1) * (3 + k)) * ((Math.sqrt(k) * s.height) / 6),
      );
    }
    s.curveVertex(s.width, s.height);
    s.endShape(s.CLOSE);
  }

  function generate() {
    s.clear();
    let { w, h } = canvasSize;
    let low = s.randomGaussian(5, 15);
    let high = s.randomGaussian(25, 10);
    night = s.color(low, low, 25);
    let graf = s.createGraphics(w, h);
    graf.background(night);
    moonPosition = [s.randomGaussian(800, 100), s.randomGaussian(200, 50)];
    let numStars = s.randomGaussian(60, 30);
    for (let i = 0; i < numStars; i++) {
      star(graf, s.randomGaussian(2, 1));
    }
    s.image(graf, 0, 0);
    for (let k = 1; k <= 4; k++) {
      let r = s.randomGaussian(12, 7);
      let g = s.randomGaussian(13, 6);
      let b = s.randomGaussian(11, 7);

      let dark = s.color(r + k, g + s.noise(k) * 15, b + s.noise(k) * 65);

      layer(k, dark);
    }

    let r = s.randomGaussian(200, 10);
    let g = s.randomGaussian(200, 10);
    let b = s.randomGaussian(160, 10);
    let a = s.randomGaussian(250, 20);

    let moonColour = s.color(r, g, b, a);
    moonlight(s, moonColour, 0.003, 29, 60);
    moon(moonColour);
  }

  s.setup = () => {
    let { w, h } = getLargeCanvas(s, 1600);
    canvasSize = {
      w: w,
      h: h,
    };
    s.colorMode(s.RGB, 255, 255, 255, 1);
    let canvas = s.createCanvas(w, h);
    s.frameRate(20);
    gui = createGUI();
    gui.toggle();
    generate();
  };

  function createGUI() {
    let info =
      "Started as an exploration of random star fields, then added the rolling hills and moon";
    let subinfo =
      "Sorry about the banding around the moonlight, haven't figured out a way around it (yet)";
    let S = new Key("s", () => {
      s.save("img.png");
    });
    let saveCmd = new Command(S, "save the canvas");
    let R = new Key("r", () => {
      generate();
    });
    let resetCanvas = new Command(R, "reset");

    let gui = new FluentGUI();

    gui
      .withTitle("Crazy, crazy nights, RB 2020/05")
      .withInfo(info)
      .withSubinfo(subinfo)
      .withCommands([saveCmd, resetCanvas]);

    gui.setup();

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
