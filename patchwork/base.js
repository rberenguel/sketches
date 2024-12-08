import {
  Command,
  GUI,
  Integer,
  Float,
  Key,
  Control,
} from "../libraries/gui/gui.js";

import { getLargeCanvas } from "../libraries/misc.js";

import { textile } from "../libraries/textile.js";

const sketch = (s) => {
  let gui;
  let largeCanvas;
  let hd = 1;
  const PI = s.PI;
  s.setup = () => {
    let { w, h } = getLargeCanvas(s, 1600);
    let canvas = s.createCanvas(w, h);
    s.pixelDensity(1);
    canvas.mousePressed(() => {});
    s.frameRate(20);
    gui = createGUI();
    gui.toggle();
    s.noLoop();
  };

  function flower(scene, x, y, r, sew) {
    const wiggle = (angle) => scene.random(angle - PI / 16, angle + PI / 16);
    const baseAngles = [
      0,
      -PI / 4,
      -PI / 2,
      -PI,
      (-3 * PI) / 2,
      -(2 * PI - PI / 4),
    ];
    const angles = baseAngles.map(wiggle);
    console.log(angles);
    let mids = [];
    let vertices = [];
    scene.beginShape();
    for (let i = 1; i < angles.length; i++) {
      const prev = angles[i - 1];
      const mid = prev + (angles[i] - angles[i - 1]) / 2;
      console.log(prev, mid, angles[i]);
      const shift = scene.random(0.2 * r, 0.3 * r);
      let outer = r + shift;
      let inner = r - shift;
      if (prev > 2 * PI || mid > 2 * PI) {
        //scene.stroke("red")
        continue;
      }
      let p1 = x + outer * Math.cos(prev);
      let q1 = y + outer * Math.sin(prev);
      scene.vertex(p1, q1);
      let p2 = x + inner * Math.cos(mid);
      let q2 = y + inner * Math.sin(mid);
      scene.vertex(p2, q2);
      let innerShift = scene.random(0.1 * r, 0.15 * r);
      if (sew) {
        innerShift += 0.03 * r;
      }
      const p3 = x + innerShift * Math.cos(mid);
      const q3 = y + innerShift * Math.sin(mid);

      mids.push([p2, q2, p3, q3]); //, mid])
      vertices.push([p1, q1, p2, q2]);
    }
    scene.beginContour();
    for (let i = mids.length - 1; i >= 0; i--) {
      const mid = mids[i];
      scene.vertex(mid[2], mid[3]);
    }
    scene.endContour();
    scene.endShape(scene.CLOSE);
    return [mids, vertices];
  }

  function stalk(scene, x, y, w) {
    console.log("Drawing stalk");
    scene.beginShape();
    scene.vertex(x, y);
    scene.vertex(x + w, y);
    scene.vertex(x - 3 * w, scene.height);
    scene.vertex(x - 4 * w, scene.height);
    scene.endShape(scene.CLOSE);
    console.log("Stalk drawn");
  }

  s.draw = () => {
    const numPixels = hd * s.width * hd * s.height;
    const seed = window.performance.now();
    let scene = s.createGraphics(hd * s.width, hd * s.height);
    // Here your code against scene
    let flowerMask = s.createGraphics(scene.width, scene.height);
    let stalkMask = s.createGraphics(scene.width, scene.height);

    textile(scene, 0, 0, scene.width, scene.height, 1, 8);

    flowerMask.randomSeed(seed);
    flowerMask.noStroke();
    stalkMask.randomSeed(seed);
    stalkMask.noStroke();
    flower(
      flowerMask,
      0.5 * scene.width,
      0.3 * scene.height,
      0.15 * scene.height,
    );
    stalk(
      stalkMask,
      0.5 * scene.width,
      0.4 * scene.height,
      0.02 * scene.height,
    );
    let blueCloth = s.createGraphics(scene.width, scene.height); // This can be optimized given flower size
    let greenCloth = s.createGraphics(scene.width, scene.height); // This can be optimized given flower size
    blueCloth.background("white");
    greenCloth.background("white");

    // Cut out and sew stalk

    textile(
      greenCloth,
      0.3 * scene.width,
      0,
      0.5 * scene.width,
      scene.height,
      1,
      8,
      ["#33AA33", "#159925"],
    );
    let d = greenCloth.get();
    d.mask(stalkMask);

    let ctx = scene.drawingContext;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 3;
    ctx.shadowColor = "#00000099";
    scene.image(d, 0, 0);
    scene.randomSeed(seed);
    scene.strokeWeight(1);
    scene.stroke("#00000099");
    ctx.setLineDash([3, 5, 3, 5]);
    scene.noFill();
    // This does not work for the way I draw the stalk
    stalk(
      scene,
      0.5 * scene.width,
      0.4 * scene.height,
      0.97 * 0.02 * scene.height,
    );

    // Cut out and sew flower

    console.log("Sewing flower");
    //scene.noFill()
    //scene.noStroke()
    //flower(scene, 0.5*scene.width, 0.3*scene.height, 0.15*scene.height)
    textile(
      blueCloth,
      0.3 * scene.width,
      0.1 * scene.height,
      0.6 * scene.width,
      0.5 * scene.height,
      1,
      8,
      ["#3333BB", "#1533BB"],
    );
    let e = blueCloth.get();
    e.mask(flowerMask);
    console.log("Canvas background");
    console.log("Pasting flower");
    scene.image(e, 0, 0);
    scene.randomSeed(seed);
    scene.strokeWeight(1);
    scene.stroke("#00000099");
    ctx.setLineDash([3, 5, 3, 5]);
    scene.noFill();
    scene.randomSeed(seed);
    console.log("About to sew");
    let [sew, wat] = flower(
      scene,
      0.5 * scene.width,
      0.3 * scene.height,
      0.97 * 0.15 * scene.height,
      true,
    );
    scene.stroke("#00000050");
    ctx.setLineDash([]);
    for (let ln of sew) {
      scene.line(...ln);
    }
    console.log(wat);
    scene.stroke("#00000099");
    ctx.setLineDash([3, 5, 3, 5]);
    for (let w of wat) {
      let [p, q, r, s] = w;
      const dx = r - p;
      const dy = s - q;
      scene.line(r, s, r - 10 * dx, s - 10 * dy);
    }
    scene.stroke("#00000099");
    ctx.setLineDash([3, 5, 3, 5]);
    for (let ln of sew) {
      scene.line(...ln);
    }
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
