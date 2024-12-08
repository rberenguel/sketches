import {
  Command,
  GUI,
  Integer,
  Float,
  Key,
  Control,
} from "../libraries/gui/gui.js";

import { getLargeCanvas } from "../libraries/misc.js";

// Base to avoid writing always the same

const sketch = (s) => {
  let gui;
  let largeCanvas;
  let hd = 1;
  let shader,
    vert,
    frag,
    includesGLSL = {};
  let includes = [];
  let W, H;
  s.setup = () => {
    let { w, h } = getLargeCanvas(s, 1600);
    let canvas = s.createCanvas(w, h);
    s.pixelDensity(1);
    canvas.mousePressed(() => {});
    s.frameRate(20);
    s.noLoop();
    gui = createGUI();
    gui.toggle();
  };

  s.preload = () => {
    includes = ["noise2d.glsl", "cnoise2d.glsl", "cellular2d.glsl"];
    frag = s.loadStrings("shader.frag");
    vert = s.loadStrings("shader.vert");
    for (let include of includes) {
      includesGLSL[include] = s.loadStrings(include);
    }
  };

  s.draw = () => {
    let scene = s.createGraphics(1800, 1200, s.WEBGL);
    W = scene.width;
    H = scene.height;
    let fragment = "";
    for (let i = 0; i < frag.length; i++) {
      let line = frag[i];
      if (line.startsWith("#include")) {
        const lib = line.replace("#include", "").replaceAll('"', "").trim();
        const glsl = includesGLSL[lib].join("\n");
        fragment += glsl + "\n";
      } else {
        fragment += line + "\n";
      }
    }
    const sh = scene.createShader(vert.join("\n"), fragment);
    scene.shader(sh);
    sh.setUniform("u_resolution", [1.0 * W, 1.0 * H]);
    scene.noStroke();
    scene.rect(0, 0, scene.width, scene.height);
    largeCanvas = scene;
    let c = scene.get();

    c.resize(0, s.height);
    if (c.width > s.width) {
      c.resize(s.width, 0);
    }
    const gap = s.width - c.width;
    s.push();
    if (gap > 0) {
      s.translate(gap / 2, 0);
    }
    s.image(c, 0, 0);
    s.pop();
  };

  function createGUI() {
    let info = "Info";
    let subinfo =
      "Subinfo<br/>Very high resolutions can fail depending on the browser";
    let S = new Key("s", () => {
      largeCanvas.save("img.png");
    });
    let saveCmd = new Command(S, "save the canvas");
    let R = new Key("r", () => {
      gui.spin(() => {
        s.clear();
        s.draw();
        gui.spin();
      });
    });

    let resetCanvas = new Command(R, "reset");

    let incR = new Key(")", () => {});
    let decR = new Key("(", () => {});
    let rInt = new Integer(() => {});
    let rControl = new Control([decR, incR], "+/- something", rInt);

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
      "Something, RB 2020/",
      info,
      subinfo,
      [saveCmd, resetCanvas],
      [rControl, hdControl],
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

p5.disableFriendlyErrors = false;

let p5sketch = new p5(sketch);
