import {
  Command,
  GUI,
  Integer,
  String,
  Boolean,
  Key,
  Control,
  Input,
} from "../libraries/gui/gui.js";

import { getLargeCanvas, mod, argMax } from "../libraries/misc.js";

import { colorKmeans } from "../libraries/colorKmeans.js";

// Naive k-means to find dominant colours. It will adjust number of clusters in case of problems (i.e. empty clusters).

const sketch = (s) => {
  let baseImage;
  let gui,
    quantized = false,
    palette = [],
    histogram,
    seed;
  let numClusters = 6,
    colorThreshold = 50;
  let colors = [],
    centroids,
    closeColors,
    colorAssignments,
    withText = false,
    kmeans = false;
  let vCutout, hCutout, imageW, imageH, canvas;

  s.preload = () => {
    baseImage = s.loadImage("../resources/gw.jpg");
  };

  function prepareImageAndCentroids(image) {
    let img = prepareImageAndDisplay(image);
    baseImage = img;
    drawCentroids(img);
  }

  function prepareImageAndDisplay(image) {
    let { w, h } = getLargeCanvas(s, 1600);
    if (canvas) {
      canvas.remove();
    }
    hCutout = s.int(w / 4.0);
    vCutout = s.int(h / 6.0);
    image.resize(w - hCutout, 0);
    image.resize(0, h - vCutout);
    w = Math.min(w, image.width);
    h = Math.min(h, image.height);
    imageW = w;
    imageH = h;
    canvas = s.createCanvas(w + hCutout, h + vCutout).id("canvas");
    s.image(image, 0, 0);
    image.loadPixels();
    colors = [];
    for (let j = 0; j < image.pixels.length; j += 4) {
      let r = image.pixels[j];
      let g = image.pixels[j + 1];
      let b = image.pixels[j + 2];
      colors.push([r, g, b]);
    }
    histogram = colorHistogram(colors, 8);
    drawHistogram(histogram);
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
    console.log(seed);
    drawSeed(seed, 10);
    histogram = colorHistogram(colors);
    return image;
  }

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

  function drawHistogram(histogram) {
    let { r, g, b } = histogram;
    let max = s.max(s.max(r), s.max(g), s.max(b));
    let barWt = imageW / (2 * 3 * r.length);
    for (let i = 0; i < r.length; i++) {
      let barHt = (vCutout * r[i]) / max;
      s.fill(s.color(200, 0, 0));
      s.rect(3 * i * barWt, imageH, barWt, barHt);
    }
    for (let i = 0; i < g.length; i++) {
      let barHt = (vCutout * g[i]) / max;
      s.fill(s.color(0, 200, 0));
      s.rect(3 * i * barWt + barWt, imageH, barWt, barHt);
    }
    for (let i = 0; i < b.length; i++) {
      let barHt = (vCutout * b[i]) / max;
      s.fill(s.color(0, 0, 200));
      s.rect(3 * i * barWt + 2 * barWt, imageH, barWt, barHt);
    }
  }

  function drawSeed(seed, num) {
    let colWt = imageW / (2 * num);
    for (let i = 0; i < num; i++) {
      let [r, g, b] = seed[i];
      s.fill(s.color(r, g, b));
      s.rect(imageW / 2 + i * colWt, imageH, colWt, vCutout);
    }
  }

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
    prepareImageAndDisplay(image);
    drawRectangles();
  }

  function loadImageFromInput(callback) {
    return (inputEvent) => {
      let filename = inputEvent.target.files[0];
      let fr = new FileReader();
      fr.onload = (fileEvent) => {
        let rawImage = new Image();
        rawImage.src = fileEvent.target.result;
        rawImage.onload = () => {
          let image = s.createImage(rawImage.width, rawImage.height);
          image.drawingContext.drawImage(rawImage, 0, 0);
          callback(image);
        };
      };
      fr.readAsDataURL(filename);
    };
  }
  s.setup = () => {
    prepareImageAndCentroids(baseImage);

    gui = createGUI();
    gui.toggle();
  };

  function colorSum(col) {
    return s.red(col) + s.green(col) + s.blue(col);
  }

  function balancedOppositeColor(col) {
    let r = 255 - s.red(col);
    let g = 255 - s.green(col);
    let b = 255 - s.blue(col);
    let rev = s.color(r, g, b);
    if (Math.abs(colorSum(rev) - colorSum(col)) < 150) {
      r -= 40;
      g -= 40;
      b -= 40;
    }
    return s.color(r, g, b);
  }

  function drawRectangle(col, x, y, ht) {
    s.fill(col);
    s.rect(x, y, hCutout, ht);
    if (withText) {
      s.textAlign(s.CENTER, s.CENTER);
      s.fill(balancedOppositeColor(col));
      let rs = s.red(col).toString().padStart(2, "0");
      let gs = s.green(col).toString().padStart(2, "0");
      let bs = s.blue(col).toString().padStart(2, "0");
      let text = `(${rs}, ${gs}, ${bs})`;
      s.text("RGB" + text, x + hCutout / 2.0, y + ht / 2.0);
      palette.push("s.color" + text);
    }
  }

  function drawRectangles() {
    let c;
    palette = [];
    let ht = s.int(imageH / (1.0 * centroids.length));
    centroids.sort((a, b) => a[3] - b[3]);
    for (c = 0; c < centroids.length - 1; c++) {
      let [r, g, b, k] = kmeans ? centroids[c] : closeColors[c];
      drawRectangle(s.color(r, g, b), imageW, ht * c, ht);
    }

    if (withText) {
      console.log("[" + palette.join(", ") + "]");
    }

    let [r, g, b, k] = kmeans ? centroids[c] : closeColors[c];

    let leftover = imageH - ht * c;
    drawRectangle(s.color(r, g, b), imageW, ht * c, leftover);
  }

  function drawCentroids() {
    let c;
    histogram = colorHistogram(colors);
    let { r, g, b, f } = histogram;
    // Histogram as a seed for k-means is sub-par
    /*for(let i=0;i<5;i++){
            let sr = argMax(r)
            let sg = argMax(g)
            let sb = argMax(b)
            r.splice(sr, 1)
            g.splice(sg, 1)
            b.splice(sb, 1)
            seed.push([sr, 0, 0])
            seed.push([0, 0, sb])
            seed.push([0, sg, 0])                        
        }
        for(let i=0;i<5;i++){
            let sr = argMax(r)
            let sg = argMax(g)
            let sb = argMax(b)
            r.splice(sr, 1)
            g.splice(sg, 1)
            b.splice(sb, 1)        
            seed.push([sr, sg, 0])
            seed.push([sr, sg, sb])
            seed.push([sr, 0, sb])
            seed.push([0, sg, sb])        
        }
        */
    histogram = colorHistogram(colors);
    [centroids, closeColors] = colorKmeans(colors, numClusters, 3, seed);
    drawRectangles();
  }

  function createGUI() {
    let info = `Naive k-means`;
    let subinfo = "";
    let S = new Key("s", () => {
      s.save("img.png");
    });
    let saveCmd = new Command(S, "save the canvas");
    let R = new Key("r", () => {
      drawCentroids();
    });
    let resetCmd = new Command(R, "recompute");

    let C = new Key("c", () => {
      withText = !withText;
      drawRectangles();
    });
    let rgbCmd = new Command(C, "show RGB values");

    let quantizedBool = new Boolean(() => quantized);
    let Q = new Key("q", () => {
      if (!quantized) {
        let quantizedImage = s.createImage(baseImage.width, baseImage.height);
        quantizedImage.copy(
          baseImage,
          0,
          0,
          baseImage.width,
          baseImage.height,
          0,
          0,
          quantizedImage.width,
          quantizedImage.height,
        );
        quantizedImage.loadPixels();
        quantize(quantizedImage);

        quantized = true;
      } else {
        prepareImageAndDisplay(baseImage);
        drawRectangles();
        quantized = false;
      }
    });
    let quantizeControl = new Control([Q], "quantize", quantizedBool);

    let A = new Key("a", () => {
      kmeans = !kmeans;
      drawRectangles();
    });

    let kmeansStates = ["centroids", "close color"];
    let kmeansString = new String(() => kmeansStates[kmeans + 0]);
    let kmeansControl = new Control([A], "cluster centroid?", kmeansString);

    let incC = new Key(")", () => {
      numClusters += 1;
    });
    let decC = new Key("(", () => {
      if (numClusters >= 1) {
        numClusters -= 1;
      }
    });
    let numClustersInt = new Integer(() => numClusters);
    let numClustersControl = new Control(
      [decC, incC],
      "+/- num clusters",
      numClustersInt,
    );
    let incT = new Key(".", () => {
      colorThreshold += 25;
    });
    let decT = new Key(",", () => {
      if (colorThreshold > 25) {
        colorThreshold -= 25;
      }
    });
    let colorThresholdInt = new Integer(() => colorThreshold);
    let colorThresholdControl = new Control(
      [decT, incT],
      "+/- seed threshold",
      colorThresholdInt,
    );

    let fileInput = new Input(
      "Choose your own image",
      "file",
      "image/*",
      loadImageFromInput((img) => {
        s.clear();
        prepareImageAndCentroids(img);
      }),
    );
    let gui = new GUI(
      "K-means on colors, RB 2020/05",
      info,
      subinfo,
      [resetCmd, saveCmd, rgbCmd],
      [
        quantizeControl,
        kmeansControl,
        numClustersControl,
        colorThresholdControl,
        fileInput,
      ],
    );
    let QM = new Key("?", () => {
      gui.toggle();
    });
    let hide = new Command(QM, "hide this");

    gui.addCmd(hide);
    gui.update();
    return gui;
  }

  s.keyReleased = () => {
    gui.dispatch(s.key);
  };
};

//p5.disableFriendlyErrors = true
let p5sketch = new p5(sketch);
