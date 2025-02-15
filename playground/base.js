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

  s.draw = () => {
    const numPixels = hd * s.width * hd * s.height;
    console.log("Num Pixels: " + numPixels);
    let scene = s.createGraphics(hd * s.width, hd * s.height);
    // Here your code against scene
    scene.noFill();
    scene.rectMode(s.RADIUS);
    scene.translate(scene.width / 2, scene.height / 2);
    scene.strokeWeight(10);
    scene.point(0, 0);
    scene.rect(0, 0, 100, 100);
    scene.stroke("red");
    scene.rotate(s.PI / 4);
    scene.rect(0, 0, 100, 100);
    largeCanvas = scene;
    let c = scene.get();
    c.resize(s.width, 0);
    s.image(c, 0, 0);
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

p5.disableFriendlyErrors = true;
let p5sketch = new p5(sketch);
