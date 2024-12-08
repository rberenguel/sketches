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
  getLargeCanvas,
  signature,
  copyColor,
  smoothStep,
} from "../libraries/misc.js";

import { easeInSqr, easeInSq } from "../libraries/eases.js";

const sketch = (s) => {
  let gui;
  let debug = true;
  let dly; // Base debug layer, if used

  // Globals needed in controls, commands or deep arguments
  let cfg = {
    hd: 2,
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
    gui.toggle();
  };
  const nrm = (v) => Math.sqrt(v[0] * v[0] + v[1] * v[1]);

  function sketchedLine(scene, x1, y1, x2, y2, _color) {
    let color = copyColor(scene, _color);
    for (let i = 0; i < 20; i++) {
      const p1 = [
        (x1 + cfg.hd * (1 - 2 * scene.random())) << 0,
        (y1 + cfg.hd * (1 - 2 * scene.random())) << 0,
      ];
      const p2 = [
        (x2 + cfg.hd * (1 - 2 * scene.random())) << 0,
        (y2 + cfg.hd * (1 - 2 * scene.random())) << 0,
      ];
      const v = [p2[0] - p1[0], p2[1] - p1[1]];
      const n = nrm(v);
      const nv = [v[0] / n, v[1] / n];
      const nn = scene.randomGaussian(n, n / 2.0);
      const halfDiff = (nn - n) / 2;
      const np1 = [p1[0] + halfDiff * nv[0], p1[1] + halfDiff * nv[1]];
      const np2 = [p2[0] - halfDiff * nv[0], p2[1] - halfDiff * nv[1]];
      scene.strokeWeight(scene.random(cfg.hd * 3, cfg.hd * 4) << 0);
      color.setAlpha(scene.random(5, 10));
      scene.stroke(color);
      scene.line(...np1, ...np2);
    }
  }

  function calculateCentroid(points) {
    let nx = 0,
      ny = 0;
    for (let p of points) {
      const [x, y] = p;
      nx += x;
      ny += y;
    }
    return [nx / points.length, ny / points.length];
  }

  function deformation(scene, points) {
    let acc = [];

    let tweaked = [points[0]];
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      if (scene.random() < 0.2) {
        const prev = tweaked[tweaked.length - 1];
        const [px, py] = prev;
        const [x, y] = point;
        const mid = [(px + x) / 2, (py + y) / 2];
        tweaked.push(mid);
      }
      tweaked.push(point);
    }

    for (let i = 0; i < tweaked.length; i++) {
      const ns = scene.noise(i / 100);
      const p = tweaked[i];
      const [x, y] = p;
      const v = [x, y];
      const n = nrm(v);
      const nv = [v[0] / n, v[1] / n];
      // TODO: This deformation needs to be intrinsic, can't depend on centroid distance. Otherwise larger blobs are more altered, which looks artificial
      const nn = scene.random(n - 5 * cfg.hd, n + 5 * cfg.hd);
      const xx = (nn * nv[0] + cfg.hd * (2 - 4 * ns)) << 0;
      const yy = (nn * nv[1] + cfg.hd * (2 - 4 * ns)) << 0;
      acc.push([xx, yy]);
    }
    return acc;
  }

  function watercolor(scene, points, _color, _scale, _layers) {
    const centroid = calculateCentroid(points);
    const scale = _scale ? _scale : 1;
    const layers = _layers ? _layers : 150;
    const [cx, cy] = centroid;
    let corrected = [];
    for (let point of points) {
      let [x, y] = point;
      corrected.push([x - cx, y - cy]);
    }
    const deformation1 = deformation(scene, corrected);
    let deformation2 = deformation(scene, deformation1);
    let color = copyColor(scene, _color);
    scene.fill(color);
    scene.noStroke();
    for (let i = 0; i < layers; i++) {
      color.setAlpha(scene.random(1, 2));
      let deformed;
      if (scene.random > 0.5) {
        deformed = deformation(scene, deformation2);
      } else {
        deformed = deformation(scene, deformation1);
      }
      scene.push();
      //scene.blendMode(scene.REPLACE)
      scene.noStroke();
      scene.translate(...centroid);
      scene.scale(scale);
      for (let k = 0; k < deformed.length; k++) {
        const [x, y] = deformed[k];
        const v = [x, y];
        const n = nrm(v);
        const dv = [v[0] / n, v[1] / n];
        for (let j = 0; j < 2 + scene.noise(k / 30) * 3; j++) {
          const nn = n * easeInSqr(1 - scene.random());
          const ss = smoothStep(0, n, nn);
          // Flow should be a property of canvas size, not of figure size
          const flow = easeInSqr(1 - ss) * 180;

          const r = flow * Math.sqrt(scene.random());
          const theta = scene.random(2 * PI);
          const dx = Math.cos(theta) * r;
          const dy = Math.sin(theta) * r;

          //const np = [nn*dv[0]+cfg.hd*(flow-2*flow*scene.random()), nn*dv[1]+cfg.hd*(flow-2*flow*scene.random())]
          const np = [nn * dv[0] + dx, nn * dv[1] + dy];
          //const np = v
          scene.circle(...np, 20 + scene.random() * 50 + (1 - ss) * 50);
        }
      }
      /*scene.beginShape()
        for(let p of deformed){
          scene.curveVertex(...p)
        }        
        scene.endShape(s.CLOSE)
		*/
      scene.pop();
      deformation2 = deformed;
    }
  }

  function sketchedCircle(scene, cx, cy, r, _color) {
    scene.noFill();
    let color = copyColor(scene, _color);
    scene.push();
    scene.translate(cx, cy);
    const STEPS = 100;
    const sqrtr = Math.sqrt(r / 3);
    for (let i = 0; i < 20; i++) {
      scene.rotate(scene.random(0, 2 * PI));
      scene.push();
      scene.translate(
        (cfg.hd * (2 - 4 * scene.random())) << 0,
        (cfg.hd * (2 - 4 * scene.random())) << 0,
      );
      const nh = scene.randomGaussian(r, sqrtr);
      const nw = scene.randomGaussian(r, sqrtr);
      scene.strokeWeight(scene.random(3, 4) << 0);
      color.setAlpha(scene.random(5, 10));
      scene.stroke(color);
      //scene.ellipse(0, 0, nw, nh)
      scene.beginShape();
      const innerSteps = scene.randomGaussian(STEPS, STEPS / 2);
      for (let j = 0; j <= innerSteps; j++) {
        const sm = smoothStep(0, STEPS, j);
        const a = (j * 2 * PI) / STEPS;
        const x = (r + sm * (nh - r)) * Math.cos(a);
        const y = (r + sm * (nw - r)) * Math.sin(a);
        scene.vertex(x, y);
      }
      scene.endShape();
      scene.pop();
    }
    scene.pop();
  }

  function linePoints(p0, p1, num) {
    const v = [p1[0] - p0[0], p1[1] - p0[1]];
    const n = nrm(v);
    const dv = [v[0] / n, v[1] / n];
    const step = n / num;
    let accum = [[p0[0] + 1, p0[1] + 1]];
    for (let i = 0; i <= num; i++) {
      accum.push([p0[0] + i * step * dv[0], p0[1] + i * step * dv[1]]);
    }
    accum = accum.concat([p1]);
    return accum;
  }

  s.draw = () => {
    let scene = s.createGraphics(cfg.hd * s.width, cfg.hd * s.height, s.WEBGL);
    (W = scene.width), (H = scene.height);
    scene.setAttributes("premultipliedAlpha", false);
    scene.setAttributes("alpha", false);

    //let gl=scene.GL
    //gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    //gl.enable(gl.BLEND)
    scene.blendMode(s.BLEND);
    //gl.blendFuncSeparate(gl.ONE_MINUS_CONSTANT_ALPHA, gl.CONSTANT_ALPHA, gl.ONE, gl.ONE);
    //gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_REVERSE_SUBTRACT);
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

    let x1 = scene.random(-0.1 * scene.width, -0.2 * scene.width);
    let x2 = scene.random(0.2 * scene.width, 0.2 * scene.width);
    let y1 = scene.random(-0.2 * scene.height, -0.3 * scene.height);
    let y2 = scene.random(-0.2 * scene.height, -0.3 * scene.height);

    scene.strokeWeight(1);
    scene.stroke("red");
    scene.colorMode(s.HSB, 360, 100, 100, 100);
    scene.background("white");
    let color = scene.color(0, 0, 0);

    const dx = scene.random(0.1 * scene.width, 0.2 * scene.width);
    const dy = scene.random(0.1 * scene.height, 0.2 * scene.height);

    const reddish = s.color(0, 100, 70, 1);
    let cx = 0.1 * scene.width;
    let cy = 0.2 * scene.height;
    let r = 0.3 * scene.height;
    let circlePoints = [];
    const COUNT = 20;
    for (let j = 0; j <= 5 * COUNT; j++) {
      const a = (j * 2 * PI) / COUNT;
      const x = cx + r * 0.7 * Math.cos(a);
      const y = cy - r * 0.7 * Math.sin(a);
      circlePoints.push([x, y]);
    }
    watercolor(scene, circlePoints, reddish);

    const greenish = s.color(120, 80, 50, 1);
    let c2x = -0.3 * scene.width;
    let c2y = -0.3 * scene.height;
    let c2r = 0.1 * scene.height;
    let circle2Points = [];
    for (let j = 0; j <= COUNT; j++) {
      const a = (j * 2 * PI) / COUNT;
      const x = c2x + c2r * Math.cos(a);
      const y = c2y - c2r * Math.sin(a);
      circle2Points.push([x, y]);
    }
    watercolor(scene, circle2Points, greenish, 0.7);
    scene.push();
    for (let p of circle2Points) {
      scene.stroke("red");
      scene.strokeWeight(2);
      scene.point(...p);
    }
    scene.pop();

    const yellowish = s.color(60, 80, 50, 1);
    let quad = [];
    quad = quad.concat(linePoints([x1, y1], [x2, y2], 15));
    quad = quad.concat(linePoints([x2, y2], [x2 + dx, y2 + dy], 15));
    quad = quad.concat(linePoints([x2 + dx, y2 + dy], [x1 + dx, y1 + dy], 15));
    quad = quad.concat(linePoints([x1 + dx, y1 + dy], [x1, y1], 15));
    //console.log(quad)
    watercolor(scene, quad, yellowish, 0.9, 100);
    sketchedCircle(scene, c2x, c2y, c2r, color);
    sketchedCircle(scene, cx, cy, r, color);

    sketchedLine(scene, x1, y1, x2, y2, color);

    sketchedLine(scene, x2, y2, x2 + dx, y2 + dy, color);
    sketchedLine(scene, x1, y1, x1 + dx, y1 + dy, color);
    sketchedLine(scene, x1 + dx, y1 + dy, x2 + dx, y2 + dy, color);

    const identifier = `${cfg.seeder.get()}@${cfg.hd.toPrecision(2)}`;
    const sigCfg = {
      s: s,
      scene: scene,
      color: "#101020",
      shadow: "darkgrey",
      fontsize: 9,
      right: scene.width / 2,
      bottom: scene.height / 2,
      identifier: identifier,
      sig: "rb'23",
      hd: cfg.hd,
      font: cfg.font,
    };
    signature(sigCfg, s.WEBGL);

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
