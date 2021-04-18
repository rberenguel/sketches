import { Command, GUI, Integer, Key, Control } from "../libraries/gui/gui.js";

import { getLargeCanvas } from "../libraries/misc.js";

const sketch = (s) => {
  let gui, canvas;

  let vertexes = [];
  let edges = [];
  let count = 700;
  let depth = 600;
  let c = 10; // Confusion factor
  let f = 10; // Focus factor

  s.setup = () => {
    // A large canvas works best for this
    let { w, h } = getLargeCanvas(s, 1800);
    canvas = s.createCanvas(w, h);
    canvas.mousePressed(() => {});
    s.frameRate(20);
    gui = createGUI();
    gui.toggle(() => {
      gui.spin(() => {
        plot();
        gui.spin();
      });
    });
  };

  function randomVec(r) {
    const rad = s.random(s.TAU);
    const l = s.random(r);

    return [s.cos(rad) * l, s.sin(rad) * l];
  }

  function lerp3D(a, b, t) {
    return [
      s.lerp(a[0], b[0], t),
      s.lerp(a[1], b[1], t),
      s.lerp(a[2], b[2], t),
    ];
  }

  function sqdistance(a, b) {
    const d1 = a[0] - b[0];
    const d2 = a[1] - b[1];
    const d3 = a[2] - b[2];
    return d1 * d1 + d2 * d2 + d3 * d3;
  }

  function generateEdgesAndVertices() {
    const w = canvas.width;
    const h = canvas.height;
    const seed = s.random(42);
    const spread = 4;
    vertexes = new Array(count + 1)
      .fill(0)
      .map((_, i) => i)
      .map((i) => [
        s.noise((i + seed) / spread) * w,
        s.noise((i + seed + 300) / spread) * h,
        s.noise((i + seed + 600) / spread) * depth * 2 - depth,
      ]);

    edges = [];

    for (let i = 0; i < count; i++) {
      let neighbours = 0;
      for (let j = i + 1; j < count; j++) {
        if (sqdistance(vertexes[i], vertexes[j]) < 6 * w) {
          edges.push([i, j]);
          neighbours += 1;
        }
        if (neighbours > 5) break;
      }
    }
  }

  function plot() {
    s.background(0);
    generateEdgesAndVertices();
    const numEdges = edges.length;
    for (let j = 0; j < numEdges; j++) {
      const [ia, ib] = edges[j];
      const a = vertexes[ia];
      const b = vertexes[ib];
      const sqd = sqdistance(a, b);
      const ang = 1 - s.abs(b[2] - a[2]) / sqd;
      const len = (ang * sqd) / 3;
      for (let i = 0; i < len; i++) {
        const n = lerp3D(a, b, s.random());
        const d = s.abs(n[2] - c);
        let red = 20; //s.lerp(20, 170, s.noise(j+1))
        let green = s.lerp(110, 150, j / (1.0 * len));
        let blue = s.lerp(150, 250, s.noise(j + 3));
        s.stroke(red, green, blue, (1 - s.min(d / depth, 1) * 5) * 20);
        // Focus and confusion appear here. Tweaking these factors (the multiplier and the exponent) can have interesting impact in the result
        const r = 0.17 * s.pow(s.abs(f - d), 0.8);
        const [x, y] = randomVec(r);
        s.rect(x + n[0], y + n[1], 0.0001, 0.0001);
      }
    }
  }

  s.draw = () => {};

  function createGUI() {
    let info =
      "Mostly the same code as in <a href='https://codecember.ink/2020/11'>Codecember, 11th 2020</a> (which in turn, is based in the description in <a href='https://inconvergent.net/2019/depth-of-field/'>Depth of Field</a> by the great Anders Hoff.";
    let subinfo =
      "I plan on adding different graphs to this, publishing it as is as a base";
    let S = new Key("s", () => {
      s.save("img.png");
    });
    let saveCmd = new Command(S, "save the canvas");

    let gui = new GUI(
      "Depth of Field, RB 2020/12",
      info,
      subinfo,
      [saveCmd],
      []
    );
    let QM = new Key("?", () => gui.toggle());
    let hide = new Command(QM, "hide this");
    gui.addCmd(hide);

    let R = new Key("r", () => {
      gui.spin(() => {
        canvas.clear();
        plot();
        gui.spin();
      });
    });
    let resetCanvas = new Command(R, "reset");
    gui.addCmd(resetCanvas);
    gui.update();
    return gui;
  }

  s.keyReleased = () => {
    gui.dispatch(s.key);
  };
};

p5.disableFriendlyErrors = true;
let p5sketch = new p5(sketch);
