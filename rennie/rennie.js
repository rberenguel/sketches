import {
  Command,
  GUI,
  Integer,
  Float,
  Boolean,
  Key,
  Control,
} from "../libraries/gui/gui.js";

import { getLargeCanvas, darken, gaussColor } from "../libraries/misc.js";

import {
  get,
  set,
  sameColor,
  sweepFloodfill,
  expandColor,
} from "../libraries/floodfill.js";

import { glassTextureForRennie2 } from "../libraries/glassLibraries.js";

const sketch = (s) => {
  let gui,
    R,
    debug = false;
  let seed = 42;
  const PI = s.PI;
  let largeCanvas;
  let hd = 1;
  let debugLayer;

  const outerStroke = (light) => {
    return light ? 5 : 10;
  };
  const innerStroke = (light) => {
    return light ? 5 : 8;
  };

  const reds = [
    s.color("#e8646e"),
    s.color("#ab2001"),
    s.color("#f0747d"),
    s.color("#9c1b04"),
  ];

  const blues = [s.color("#5c9898"), s.color("#1a4467")];

  const beige = s.color("#ecdeaa");
  const darkBeige = s.color("#c1bcaa");

  let gray100 = expandColor(s, s.color(10, 10, 10, 100));

  s.setup = () => {
    let { w, h } = getLargeCanvas(s, 1600);
    let canvas = s.createCanvas(w, h);
    s.pixelDensity(1);
    canvas.mousePressed(() => {});
    s.frameRate(20);
    gui = createGUI();
    gui.toggle();
    R.action();
  };
  s.draw = () => {};

  function plot() {
    const numPixels = hd * s.width * hd * s.height;
    let scene = s.createGraphics(hd * s.width, hd * s.height);
    debugLayer = s.createGraphics(scene.width, scene.height);
    let roseMetalLayer = s.createGraphics(scene.width, scene.height);
    let roseThickMetalLayer = s.createGraphics(scene.width, scene.height);
    let armature = s.createGraphics(scene.width, scene.height);
    let roseLayer = s.createGraphics(scene.width, scene.height);
    // Here your code against scene
    scene.background(beige);
    let crx = roseMetalLayer.random(0.5 * scene.width, 0.8 * scene.width);
    let cry = roseMetalLayer.random(0.1 * scene.height, 0.3 * scene.height);
    const seed = window.performance.now();
    const contour = rose(roseMetalLayer, crx, cry, seed, true);
    console.log("Rose drawn");
    const xs = contour.map((p) => p[0]);
    const ys = contour.map((p) => p[1]);
    xs.sort((a, b) => a - b);
    ys.sort((a, b) => a - b);
    const midY = (ys[ys.length - 1] + ys[0]) / 2;
    const midX = (xs[xs.length - 1] + xs[0]) / 2;
    let stems = [];
    for (let p of contour) {
      const [x, y] = p;
      if (x > midX && y > midY) {
        debugLayer.stroke("firebrick");
        stems.push([x, y]);
      } else {
        debugLayer.stroke("darkslateblue");
      }
      debugLayer.strokeWeight(5);
      debugLayer.point(x, y);
    }
    let midStems = [];
    console.log("Stemmed");
    stems = stems.sort((p, q) => p[0] - q[0]);
    stems = stems.slice(2, 7);
    const diffX = stems[1][0] - stems[0][0];
    for (let i = 0; i < stems.length - 1; i++) {
      const [x, y] = stems[i];
      const diffY = scene.height - stems[i][1];
      debugLayer.stroke("purple");
      debugLayer.strokeWeight(1);
      const bP = [
        x,
        y,
        x + 6 * diffX,
        y + diffY / 4,
        x + 4 * diffX,
        y + (2 * diffY) / 3,
        x + 2 * diffX,
        scene.height,
      ];
      const bPx =
        debugLayer.bezierPoint(bP[0], bP[2], bP[4], bP[6], 0.1) + diffX / 2;
      const bPy = debugLayer.bezierPoint(bP[1], bP[3], bP[5], bP[7], 0.1);
      midStems.push([bPx, bPy]);
      bezierB(debugLayer, ...bP);
      scene.stroke("black");
      scene.noFill();
      scene.strokeWeight(outerStroke(false));
      roseMetalLayer.bezier(...bP);
    }
    midStems.pop();

    // Could add sweepFloodfill on each stem separation to
    // tweak a bit the color of the glass later (but this
    // would not work if there is more metal in the middle)
    // TODO Can use stems comp to get bounding box
    console.log("Floodfilling");
    roseMetalLayer.loadPixels();
    for (let i = 0; i < roseMetalLayer.width; i++) {
      for (let j = 0; j < roseMetalLayer.height; j++) {
        const c = get(roseMetalLayer, i, j);
        if (sameColor(c, gray100)) {
          let index = Math.floor(Math.random() * reds.length);
          const c2p = reds[index];
          let c2 = darken(roseMetalLayer, gaussColor(scene, c2p, 20), 0.9);
          sweepFloodfill(roseMetalLayer, i, j, gray100, c2, roseLayer);
        }
      }
    }

    let [x, y] = stems[stems.length - 1];
    x = x + 2 * diffX;
    y = scene.height;
    debugLayer.stroke("green");
    debugLayer.strokeWeight(5);
    debugLayer.point(x, y);
    let miss = scene.width - xs[xs.length - 1];
    let end = xs[0] - scene.width / (7 * hd);
    let ends = [];
    for (let i = 0; i < 4; i++) {
      ends.push(end);
      let bez = [
        x,
        y,
        x + miss / 2,
        (2 * scene.height) / 3,
        x + miss / 4,
        scene.height / 3,
        end,
        0,
      ];
      debugLayer.strokeWeight(1);
      debugLayer.stroke("purple");
      bezierB(debugLayer, ...bez);
      if (debug) {
        armature.strokeWeight(5);
      } else {
        armature.strokeWeight(7);
      }

      armature.stroke("black");
      armature.noFill();
      armature.bezier(...bez);
      miss += 6 * diffX;
      end += diffX / 2;
    }
    ends.sort((a, b) => b - a);
    for (let i = 0; i < 4; i++) {
      let x = ends[i];
      let bez = [
        x,
        0,
        (1.2 * x) / 3 - i * diffX,
        scene.height / 3,
        x / 3 - i * diffX,
        (2 * scene.height) / 3,
        1.1 * x,
        scene.height,
      ];
      debugLayer.point(x, y);
      debugLayer.strokeWeight(1);
      debugLayer.stroke("purple");
      bezierB(debugLayer, ...bez);
      if (debug) {
        armature.strokeWeight(5);
      } else {
        armature.strokeWeight(7);
      }

      armature.stroke("black");
      armature.noFill();
      armature.bezier(...bez);
    }

    for (let ms of midStems) {
      const [mx, my] = ms;
      debugLayer.stroke("blue");
      debugLayer.strokeWeight(3);
      debugLayer.point(mx, my);
      let c2 = darken(roseMetalLayer, gaussColor(scene, beige, 15), 0.9);
      sweepFloodfill(
        roseMetalLayer,
        mx,
        my,
        s.color(0, 0, 0, 0),
        c2,
        roseLayer,
      );
    }

    let ctx = scene.random(
      0.1 * scene.width,
      Math.min(0.8 * crx, scene.width / 4),
    );
    let cty = scene.random(0.1 * scene.height, 0.3 * scene.height);
    let tulipLayer = s.createGraphics(scene.width, scene.height);
    let tulipMetalLayer = s.createGraphics(scene.width, scene.height);
    tulip(tulipMetalLayer, ctx, cty);

    tulipMetalLayer.loadPixels();
    for (let i = 0; i < tulipLayer.width; i++) {
      for (let j = 0; j < tulipLayer.height; j++) {
        const c = get(tulipMetalLayer, i, j);
        if (sameColor(c, gray100)) {
          let index = Math.floor(Math.random() * blues.length);
          const c2p = blues[index];
          let c2 = darken(tulipMetalLayer, gaussColor(scene, c2p, 20), 0.9);
          sweepFloodfill(tulipMetalLayer, i, j, gray100, c2, tulipLayer);
        }
      }
    }

    largeCanvas = scene;
    let layers = [tulipLayer];
    if (debug) {
      layers.push(debugLayer);
    }
    stackLayers(roseLayer, layers);
    //let maskingLayer1 = s.createGraphics(scene.width, scene.height)
    //let c = roseLayer.get()
    //maskingLayer1.image(c, 0, 0)
    if (!debug) {
      glassTextureForRennie2(s, roseLayer, seed, 50, hd, "arc.filled", 0.1, 2);
      glassTextureForRennie2(s, scene, seed, 50, hd, "arc.filled", 0.1, 0);
    }
    //let c = roseLayer.get()
    //c.mask(maskingLayer1)
    //maskingLayer1.image(c, 0, 0)
    stackLayers(scene, [armature, roseLayer, roseMetalLayer, tulipMetalLayer]);
    let c = scene.get();
    c.resize(s.width, 0);
    s.image(c, 0, 0);
  }

  function stackLayers(scene, layers) {
    console.log("stacking");
    for (let layer of layers) {
      let c = layer.get();
      scene.image(c, 0, 0);
    }
  }

  function rotation(x, y, angle) {
    const nx = (Math.cos(angle) * x - Math.sin(angle) * y) << 0;
    const ny = (Math.sin(angle) * x + Math.cos(angle) * y) << 0;
    return [nx, ny];
  }

  function rose(scene, crx, cry) {
    seed = window.performance.now();
    scene.push();

    let contour = [];
    let cx = 0;
    let cy = 0;
    let firstQuarter = [],
      thirdQuarter = [];
    const r1 = 200;
    const r2 = 250;
    const s1 = scene.random(20, 50);
    const s2 = scene.random(20, 50);
    const N = 30;
    const foo = scene.random(0.1, 0.7);
    let transform = (scene, apply) => {
      let tx = crx;
      let ty = cry;
      scene.randomSeed(seed);
      if (apply) {
        scene.translate(tx, ty);
      }
      const angle = scene.random(0, 2 * PI);
      const scale = scene.random(0.4, 0.6);
      if (apply) {
        scene.rotate(angle);
      }
      if (apply) {
        scene.scale(scale);
      }
      // Reverser not used
      let transformer = (x, y) => {
        const [nx, ny] = rotation(x, y, angle);
        const mx = nx * scale + tx;
        const my = ny * scale + ty;
        return [mx << 0, my << 0];
      };
      return [scale, transformer];
    };

    let [scale, transformer] = transform(scene, true);

    if (debug) {
      debugLayer.strokeWeight(6);
      debugLayer.stroke("green");
      debugLayer.point(0, 0);
    }
    scene.fill(gray100);
    scene.stroke("black");
    if (debug) {
      scene.strokeWeight(5);
    } else {
      scene.strokeWeight(15);
    }

    scene.beginShape();
    let rx = (i) =>
      r1 + s1 * Math.cos((foo * i * PI) / N) * Math.sin((2 * i * PI) / N);
    let ry = (i) =>
      r2 + s2 * Math.sin((foo * i * PI) / N) * Math.sin((2 * i * PI) / N);
    let x = cx + rx(N - 1) * Math.cos(0);
    let y = cy + ry(N - 1) * Math.sin(0);
    scene.vertex(x, y);
    for (let i = 0; i <= N; i++) {
      const th = (i * 2 * PI) / N;
      const x = cx + rx(i) * Math.cos(th);
      const y = cy + ry(i) * Math.sin(th);
      contour.push(transformer(x, y));
      if (th < PI / 2) {
        firstQuarter.push([x, y]);
      }
      if (2 * PI - th > PI / 2) {
        thirdQuarter.push([x, y]);
      }
      scene.curveVertex(x, y);
      if (debug) {
        scene.strokeWeight(5);
      } else {
        scene.strokeWeight(15);
      }
    }
    x = cx + rx(1) * Math.cos(0);
    y = cy + ry(1) * Math.sin(0);
    scene.vertex(x, y);
    scene.endShape();
    let cs = firstQuarter[Math.floor(scene.random() * firstQuarter.length)];
    if (debug) {
      debugLayer.push();
      debugLayer.stroke("blue");
      debugLayer.strokeWeight(4);
      debugLayer.point(...transform(scene, cs[0], cs[1]));
      debugLayer.pop();
    }
    scene.pop();
    let ts = transformer(cs[0], cs[1]);
    let or = transformer(0, 0);
    let dx = or[0] - ts[0],
      dy = or[1] - ts[1];
    let angle = scene.atan2(dy, dx) + scene.random(0.05 * PI, 0.1 * PI);
    (dx = Math.cos(angle)), (dy = Math.sin(angle));
    let direction = [dx, dy];
    let pull = 0.8;
    let [nextp, nextdir] = curveUntilCollision(
      scene,
      ts,
      direction,
      or,
      pull,
      scale,
    );
    pull *= -1;
    for (let i = 0; i < 6; i++) {
      pull *= 0.3;
      let [step, dir] = curveUntilCollision(
        scene,
        nextp,
        nextdir,
        or,
        pull,
        scale,
      );
      (nextp = step), (nextdir = dir);
    }
    return contour;
  }

  function tulip(scene, ctx, cty) {
    scene.push();
    scene.fill(gray100);
    const angle = 0.05 * PI;
    scene.rotate();
    if (debug) {
      scene.strokeWeight(5);
    } else {
      scene.strokeWeight(outerStroke(false));
    }

    scene.stroke("black");
    scene.ellipse(ctx, cty, 100, 200);
    let s1x = ctx + 50 * Math.cos(PI / 4);
    let s1y = cty - 100 * Math.sin(PI / 4);
    let s2x = ctx + 50 * Math.cos(PI / 2 + PI / 4);
    let s2y = cty - 100 * Math.sin(PI / 2 + PI / 4);
    let e1x = ctx + 50 * Math.cos(-PI / 4);
    let e1y = cty - 100 * Math.sin(-PI / 4);
    let e2x = ctx + 50 * Math.cos(-PI / 2 - PI / 4);
    let e2y = cty - 100 * Math.sin(-PI / 2 - PI / 4);
    if (debug) {
      debugLayer.push();
      debugLayer.strokeWeight(6);
      debugLayer.stroke("red");
      debugLayer.point(s1x, s1y);
      debugLayer.point(e1x, e1y);
      debugLayer.stroke("green");
      debugLayer.point(s2x, s2y);
      debugLayer.point(e2x, e2y);
      debugLayer.pop();
    }
    scene.noFill();
    scene.beginShape();
    scene.vertex(s1x, s1y); // anchor
    let [l1ex, l1ey] = rotation(e1x, scene.height, angle);
    scene.bezierVertex(s1x, s1y, e1x, e1y, l1ex, l1ey);
    scene.endShape();
    scene.beginShape();
    scene.vertex(s2x, s2y); // anchor
    let [l2ex, l2ey] = rotation(s2x, scene.height, angle);
    scene.bezierVertex(s2x, s2y, e2x, e2y, l2ex, l2ey);
    scene.endShape();

    scene.pop();
  }

  function bezierB(scene, x, y, c1x, c1y, c2x, c2y, ex, ey) {
    scene.line(x, y, c1x, c1y);
    scene.line(c1x, c1y, c2x, c2y);
    scene.line(c2x, c2y, ex, ey);
  }

  function arrow(scene, sx, sy, ex, ey) {
    let dx = sx - ex,
      dy = sy - ey;
    const nrm = Math.sqrt(dx * dx + dy * dy);
    (dx = dx / nrm), (dy = dy / nrm);
    const nx = dy,
      ny = -dx;
    scene.push();
    scene.line(sx, sy, ex, ey);
    const lx = ex + 0.1 * nrm * dx - 0.02 * nrm * nx;
    const ly = ey + 0.1 * nrm * dy - 0.02 * nrm * ny;
    const rx = ex + 0.1 * nrm * dx + 0.02 * nrm * nx;
    const ry = ey + 0.1 * nrm * dy + 0.02 * nrm * ny;
    scene.triangle(lx, ly, ex, ey, rx, ry);
    scene.pop();
  }

  function curveUntilCollision(
    scene,
    start,
    direction,
    origin,
    pull,
    scale,
    light,
  ) {
    let [x, y] = start;
    let [dx, dy] = direction;
    let [ox, oy] = origin;
    scene.loadPixels();
    if (debug) {
      debugLayer.push();
      debugLayer.stroke("red");
      debugLayer.strokeWeight(4);
      debugLayer.point(x, y);
      debugLayer.strokeWeight(2);
      const ex = x + 150 * dx,
        ey = y + 150 * dy;
      arrow(debugLayer, x, y, ex, ey);
      debugLayer.pop();
    }
    // Will tilt rightwards
    // Find endpoint

    let i = 0,
      count = 0;
    let cex, cey;
    while (true) {
      let nx = x + 15 * dx + 3 * scale * i * dx,
        ny = y + 15 * dy + 3 * scale * i * dy;
      const color = get(scene, nx << 0, ny << 0);
      if (sameColor(color, [0, 0, 0, 255])) {
        if (debug) {
          debugLayer.push();
          debugLayer.strokeWeight(4);
          debugLayer.stroke("orange");
          debugLayer.point(nx, ny);
          debugLayer.pop();
        }
        (cex = nx), (cey = ny);
        break;
      }
      if (debug) {
        debugLayer.push();
        debugLayer.strokeWeight(1);
        debugLayer.stroke("blue");
        debugLayer.point(nx << 0, ny << 0);
        debugLayer.pop();
      }
      i++;
      count++;
      if (count > scene.height * hd + scene.width * hd) {
        console.log("Restarting");
        // Just f-ing restart
        R.action();
      }
    }
    let ddx = cex - x,
      ddy = cey - y;
    let nnx = -ddy,
      nny = ddx;
    let nrm = Math.sqrt(nnx * nnx + nny * nny);
    (nnx = nnx / nrm), (nny = nny / nrm);
    let mx = x + ddx / 2,
      my = y + ddy / 2;
    let tocx = ox - mx,
      tocy = oy - my;
    let distm = Math.sqrt(tocx * tocx + tocy * tocy);
    (tocx = tocx / distm), (tocy = tocy / distm);
    let c1x = x + (cex - x) / 3,
      c1y = y + (cey - y) / 4;
    (c1x = c1x + pull * 1.5 * distm * nnx),
      (c1y = c1y + pull * 1.5 * distm * nny);
    let c2x = x + (3 * (cex - x)) / 4,
      c2y = y + (3 * (cey - y)) / 4;
    (c2x = c2x + pull * 1.5 * distm * nnx),
      (c2y = c2y + pull * 1.5 * distm * nny);

    if (debug) {
      debugLayer.push();
      debugLayer.stroke("purple");
      debugLayer.strokeWeight(2);
      debugLayer.point(cex, cey);
      debugLayer.point(mx, my);
      debugLayer.point(x, y);
      debugLayer.stroke("red");
      debugLayer.point(c1x, c1y);
      debugLayer.point(c2x, c2y);
      debugLayer.strokeWeight(1);
      debugLayer.stroke("purple");
      debugLayer.point(ox, oy);
      bezierB(debugLayer, x, y, c1x, c1y, c2x, c2y, cex, cey);
      arrow(debugLayer, mx, my, mx + distm * nnx, my + distm * nny);
      debugLayer.pop();
    }
    if (debug) {
      scene.strokeWeight(3);
    } else {
      scene.strokeWeight(innerStroke(light));
    }

    scene.stroke("black");
    scene.noFill();
    scene.beginShape();
    scene.vertex(x, y); // Anchor 1
    scene.bezierVertex(c1x, c1y, c2x, c2y, cex, cey); // C1, C2, Anchor 2
    scene.endShape();

    let t = 0;
    if (pull >= 0) {
      t = scene.random(0.1, 0.3);
    } else {
      t = scene.random(0.7, 0.9);
    }
    let nextx = scene.bezierPoint(x, c1x, c2x, cex, t);
    let nexty = scene.bezierPoint(y, c1y, c2y, cey, t);
    return [
      [nextx, nexty],
      [tocx, tocy],
    ];
  }

  function createGUI() {
    let info = "Info";
    let subinfo =
      "Subinfo<br/>Very high resolutions can fail depending on the browser";
    let S = new Key("s", () => {
      largeCanvas.save("img.png");
    });
    let saveCmd = new Command(S, "save the canvas");
    R = new Key("r", () => {
      gui.spin(() => {
        s.clear();
        plot();
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

    let D = new Key("d", () => {
      debug = !debug;
      R.action();
    });
    let debugBool = new Boolean(() => debug);
    let debugBoolControl = new Control([D], "toggle debug drawing", debugBool);

    let gui = new GUI(
      "Something, RB 2020/",
      info,
      subinfo,
      [saveCmd, resetCanvas],
      [rControl, hdControl, debugBoolControl],
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
