import { Command, GUI, Integer, Key, Control } from "../libraries/gui/gui.js";

import { getLargeCanvas, mod, argMax } from "../libraries/misc.js";

import { colorKmeans } from "../libraries/colorKmeans.js";

const sketch = (s) => {
  let gui,
    image,
    colors,
    imageW,
    imageH,
    points,
    mult = 10;
  let histogram,
    seed,
    colorThreshold = 25,
    numClusters = 8,
    centroids,
    closeColors,
    cloth;

  s.preload = () => {
    image = s.loadImage("../resources/be.png");
    cloth = s.loadImage("../resources/cloth3.jpg");
  };

  function colorHistogram(colors, bucketSize = 8) {
    let buckets = s.int(255 / bucketSize) + 1;
    let rHist = Array(buckets).fill(0);
    let gHist = Array(buckets).fill(0);
    let bHist = Array(buckets).fill(0);
    let rgbHist = Array(buckets * buckets * buckets).fill(0);
    for (let colour of colors) {
      let [r, g, b] = colour;
      let rBucket = s.int(r / bucketSize);
      let gBucket = s.int(g / bucketSize);
      let bBucket = s.int(b / bucketSize);
      rHist[rBucket]++;
      gHist[gBucket]++;
      bHist[bBucket]++;
      rgbHist[rBucket + buckets * gBucket + buckets * buckets * bBucket]++;
    }
    return {
      r: rHist,
      g: gHist,
      b: bHist,
      f: rgbHist,
      bucketSize: bucketSize,
      buckets: buckets,
    };
  }

  function embroid(colour, x0, y0, dv, mult) {
    let [r, g, b] = colour;
    let m = s.randomGaussian(mult, 5);
    s.strokeWeight(1.5);
    s.stroke(s.color(0.3 * r, 0.3 * g, 0.3 * b, 150));
    s.beginShape();
    s.curveVertex(x0, y0);
    s.curveVertex(x0, y0);
    s.curveVertex(x0 - (m / 4) * dv.x, y0 - (m / 6) * dv.y);
    s.curveVertex(x0 - (m / 2) * dv.x, y0 - ((2 * m) / 3) * dv.y);
    s.curveVertex(x0 - m * dv.x, y0 - 2 * m * dv.y);
    s.endShape();
    s.stroke(s.color(0.8 * r, 0.8 * g, 0.8 * b, 50));
    s.beginShape();
    s.curveVertex(x0 + 0.9, y0);
    s.curveVertex(x0 + 0.9, y0);
    s.curveVertex(x0 + 0.9 - (m / 4) * dv.x, y0 - (m / 6) * dv.y);
    s.curveVertex(x0 + 0.9 - (m / 2) * dv.x, y0 - ((2 * m) / 3) * dv.y);
    s.curveVertex(x0 + 0.9 - m * dv.x, y0 - 2 * m * dv.y);
    s.endShape();
    s.stroke(s.color(1.1 * r, 1.1 * g, 1.1 * b, 35));
    s.beginShape();
    s.curveVertex(x0, y0 + 0.9);
    s.curveVertex(x0, y0 + 0.9);
    s.curveVertex(x0 - (m / 4) * dv.x, y0 + 0.5 - (m / 6) * dv.y);
    s.curveVertex(x0 - (m / 2) * dv.x, y0 - 0.9 + 0.5 - ((2 * m) / 3) * dv.y);
    s.curveVertex(x0 - m * dv.x, y0 - 0.9 - 2 * m * dv.y);
    s.endShape();
  }

  s.setup = () => {
    let { w, h } = getLargeCanvas(s, 1600);
    s.frameRate(20);
    if (image.height > image.width) {
      image.resize(0, h);
    } else {
      image.resize(w, 0);
    }
    imageW = image.width;
    imageH = image.height;
    let canvas = s.createCanvas(imageW, imageH);
    canvas.mousePressed(() => {});
    image.loadPixels();
    colors = [];
    for (let j = 0; j < image.pixels.length; j += 4) {
      let r = image.pixels[j];
      let g = image.pixels[j + 1];
      let b = image.pixels[j + 2];
      let a = image.pixels[j + 3];
      colors.push([r, g, b, a]);
    }
    debugger;
    histogram = colorHistogram(colors, 8);
    seed = [];
    let f = histogram.f;
    let buckets = histogram.buckets;
    let bucketSize = histogram.bucketSize;
    for (let i = 0; i < f.length; i++) {
      let m = argMax(f);
      let rr = Math.floor(mod(m, buckets));
      let gg = Math.floor(mod((m - rr) / buckets, buckets));
      let bb = Math.floor((m - rr - gg * buckets) / (buckets * buckets));
      f.splice(m, 1);
      let fac = bucketSize - 0.5;
      let col = [fac * rr, fac * gg, fac * bb];
      let mindist = 999;
      for (let see of seed) {
        let [rs, gs, bs] = see;
        let dist =
          Math.abs(rs - bucketSize * rr) +
          Math.abs(gs - bucketSize * gg) +
          Math.abs(bs - bucketSize * bb);
        if (dist < mindist) mindist = dist;
      }
      if ((mindist > colorThreshold && mindist < 999) || seed.length == 0)
        seed.push(col);
    }

    [centroids, closeColors] = colorKmeans(colors, numClusters, 3);
    quantize(image);
    image.loadPixels();
    colors = [];
    for (let j = 0; j < image.pixels.length; j += 4) {
      let r = image.pixels[j];
      let g = image.pixels[j + 1];
      let b = image.pixels[j + 2];
      let a = image.pixels[j + 3];
      colors.push([r, g, b, a]);
    }
    gui = createGUI();
    gui.toggle();
    cloth.resize(0, imageH);
    thingy();
  };

  function quantize(image) {
    for (let j = 0; j < image.pixels.length; j += 4) {
      let r = image.pixels[j];
      let g = image.pixels[j + 1];
      let b = image.pixels[j + 2];
      let closestColor = centroids[0];
      let minDist = 255 * 3;
      for (let c = 0; c < centroids.length; c++) {
        let [cr, cg, cb] = centroids[c];
        let dist = Math.abs(cr - r) + Math.abs(cg - g) + Math.abs(cb - b);
        if (dist < minDist) {
          minDist = dist;
          closestColor = centroids[c];
        }
      }
      let [cr, cg, cb] = closestColor;
      image.pixels[j] = cr;
      image.pixels[j + 1] = cg;
      image.pixels[j + 2] = cb;
    }
    image.updatePixels();
  }

  function nbd(i, j) {
    let count = 0;
    let rad = 2;
    for (let ii = -rad; ii < rad; ii++) {
      for (let jj = -rad; jj < rad; jj++) {
        let x = i + ii,
          y = j + jj;
        if (x < 0 || y < 0) continue;
        if (x >= imageW || y >= imageH) continue;
        let [r, g, b, a] = colors[x + y * imageW];
        if (a < 10) count++;
      }
    }
    return count;
  }

  function thingy() {
    s.clear();
    s.image(cloth, 0, 0);
    points = [];
    let dv = { x: -Math.sqrt(2) / 2, y: -Math.sqrt(2) / 2 };
    for (let j = 0; j < imageH; j = j + 1) {
      for (let i = 0; i < imageW; i = i + 1) {
        if (s.random() < 0.85) continue;
        let [r, g, b, a] = colors[i + j * imageW];
        if (a > 0) {
          let nei = nbd(i, j);
          let pos = [i + s.random(-1, 1), j + s.random(-1, 1)];
          let colour = [r, g, b];
          points.push({ pos: pos, colour: colour, nei: nei });
        }
      }
    }
    for (let point of points) {
      for (let j = 0; j < 4; j++) {
        let { pos, colour, nei } = point;
        if (nei < 1 && s.random() < 0.6 && j == 0) continue;
        if (nei < 1 && s.random() < 0.8 && j == 1) continue;
        let [r, g, b] = colour;
        let [x, y] = pos;
        s.strokeWeight(1);
        let cf = j ? 1 : 0;
        let alpha = j == 0 ? 150 : 50;
        s.stroke(s.color(cf * r, cf * g, cf * b, alpha));
        let darning = 1;
        if (nei > 0) darning = 3;
        let delta;
        if (j == 0) {
          delta = { x: -0.5, y: 0.5 };
        } else {
          delta = { x: 0, y: 0 };
        }
        for (let darn = 0; darn < darning; darn++) {
          embroid([r, g, b], x, y, dv, mult);
        }
      }
    }
  }

  s.draw = () => {};

  function createGUI() {
    let info = "Simulated embroidery, based on the procedure used in <a href='https://www.sidefx.com/tutorials/fakebroidery/'>this</a> Houdini tutorial";
    let subinfo = "I wrote this several months ago, but never posted the code because I wanted to rewrite/clean it. I'd still want to rewrite it, but I guess it's better in the open";
    let S = new Key("s", () => {
      s.save("img.png");
    });
    let saveCmd = new Command(S, "save the canvas");
    let R = new Key("r", () => {});
    let resetCanvas = new Command(R, "reset");

    let incR = new Key(")", () => {
      mult += 0.1;
      thingy();
    });
    let decR = new Key("(", () => {
      mult -= 0.1;
      thingy();
    });
    let rInt = new Integer(() => mult);
    let rControl = new Control([decR, incR], "+/- something", rInt);

    let gui = new GUI(
      "Fakembroidery, RB 2020/?",
      info,
      subinfo,
      [saveCmd, resetCanvas],
      [rControl]
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
