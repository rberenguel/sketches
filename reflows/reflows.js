import {
  Command,
  GUI,
  Integer,
  Float,
  String,
  Key,
  Control,
} from "../libraries/gui/gui.js";

import { getLargeCanvas, smoothStep, darken } from "../libraries/misc.js";

import {
  solarizedDark,
  solarizedDarkPalette,
  wernerBase,
  wernerBasePalette,
  shimmeringColorArray,
  c82GeoPrimesPalette,
} from "../libraries/palettes.js";

import { canvasRGBA } from "../libraries/3rdparty/stackblur.js";

import { $ } from "../libraries/gui/dom.js";

const sketch = (s) => {
  let PI = s.PI;
  let gui;
  let largeCanvas;
  let hd = 1;
  let freq = 50;
  let squiggly;
  let lineStroke = 0.8 * hd;
  let dist;
  let layers = 1;
  let R;
  let palette = {};
  let mode = "fine";
  let drawer;
  let seed = 42;
  let monoid;
  const MAX_STEPS = 1500;
  const ESCAPE = 500;
  //const BLUR = 10
  //let counter = 0

  function setMode() {
    if (mode == "fine") {
      dist = 1.2 * lineStroke;
      drawer = (c, x, y, ns) => c.ellipse(x, y, ns);
    } else {
      dist = 16 * lineStroke;
      drawer = (c, x, y, ns) => c.rect(x, y, 14 * ns, 6 * ns, 2 * ns);
    }
  }

  const werner = () => {
    (palette.colors = wernerBasePalette),
      (palette.name = "Werner"),
      (palette.short = "we"),
      (palette.background = wernerBase.lightBrown);
  };

  const solarized = () => {
    (palette.colors = solarizedDarkPalette),
      (palette.name = "SolarizedDark"),
      (palette.short = "sd"),
      (palette.background = solarizedDark.base01);
  };

  const shimmering = () => {
    (palette.colors = shimmeringColorArray),
      (palette.name = "Shimmering"),
      (palette.short = "sh"),
      (palette.background = shimmeringColorArray[0]);
  };

  const geometricPrimes = () => {
    (palette.colors = c82GeoPrimesPalette.slice(
      0,
      c82GeoPrimesPalette.length - 2,
    )),
      (palette.name = "±C82GeoPrimes"),
      (palette.short = "gp"),
      (palette.background =
        c82GeoPrimesPalette[c82GeoPrimesPalette.length - 1]);
  };

  let ha = 1.2,
    hb = 1.01;
  const lx = 0.5;
  const rx = 0.9;
  const uy = -0.5;
  const by = 0.5;
  function henon(scene, px, py, ha, hb) {
    // Map x: -1:1 and y 0.4:-0.4 to canvas coordinates
    const x = lx + (px * (rx - lx)) / scene.width;
    const y = uy + (py * (by - uy)) / scene.height; // This is probably reflexed
    //console.log(x, y)
    const csa = Math.cos(ha);
    const sna = Math.sin(ha);
    const ds = y - x * x;
    const nx = x * csa - ds * sna;
    const ny = x * sna + ds * csa;
    //console.log(nx, ny)
    return [
      ((nx - lx) * scene.width) / (rx - lx),
      ((ny - uy) * scene.height) / (by - uy),
      x,
      y,
    ];
  }

  // Mostly the implementation in here:
  // https://www.schmidtynotes.com/blog/p5/2022-03-05-random-vectors/
  // with added stop conditions

  class Particle {
    constructor(rand, x, y, size, color, alpha, _dist) {
      this.x = x;
      this.y = y;
      this.size = size;
      this.color = color;

      this.alpha = alpha ? _alpha : 10;
      this.dist = 150; //_dist ? _dist : dist
      this.stopped = false;
      this.rand = rand;
    }
    move(scene) {
      //let [px, py, xx, yy] = henon(scene, this.x, this.y, this.ha, this.hb)
      //this.x = px
      //this.y = py
      //this.xx = xx
      //this.yy = yy
      //this.steps+=1
      let theta =
        scene.noise(
          this.x * squiggly + this.rand,
          this.y * squiggly + this.rand,
        ) *
        PI *
        2;
      let v = p5.Vector.fromAngle(
        theta,
        scene.random(0.1 * this.dist, 1.5 * this.dist),
      );
      this.x += v.x;
      this.y += v.y;
    }
    draw(scene, mask) {
      if (
        this.x < scene.width &&
        this.x >= 0 &&
        this.y < scene.height &&
        this.y >= 0
      ) {
        //const ns = scene.random(1.5 * this.size, 3 * this.size)
        const ns = scene.random(0.9 * this.size, 1.1 * this.size);
        bubble(scene, this.x, this.y, ns, mask);
        //scene.stroke("red")
        //scene.fill("red")
        //scene.circle(this.x, this.y, scene.random(5, 10))
      }
    }
    /*stop(scene) {
      if(this.steps > MAX_STEPS){
        this.stopped = true
      }
      if(this.xx*this.xx+this.yy*this.yy>ESCAPE){
          this.stopped = true
      }
    }*/
    stop(scene) {
      if (this.x > scene.width || this.x < 0) {
        this.dist = 0;
        this.stopped = true;
      }
      if (this.y > scene.height || this.y < 0) {
        this.dist = 0;
        this.stopped = true;
      }
      if (this.stopped && scene.random() < 0.3) {
        canvasRGBA(
          scene.canvas,
          0,
          0,
          scene.width,
          scene.height,
          Math.max(1, (0.5 + hd) << 0),
        );
        //counter++
      }
    }
  }

  function bubble(scene, x, y, d, mask) {
    // A strange correction to avoid superdense bubbles at high res
    const NR = 1.2 / hd;
    mask.push();
    mask.fill("black");
    mask.circle(x, y, 1.001 * 2 * d);
    mask.pop();
    scene.push();
    scene.translate(x, y);
    const random = scene.random;
    const ITER = d * d;
    for (let i = 0; i < ITER; i++) {
      const a = random(PI * 2);
      const r = d * (1.0 - random(random(random(random(random())))));
      const rr = d - r;
      const foo = a / (2 * PI);
      let col = scene.color(360 * foo, 90, 90);
      col.setAlpha(0.05);
      scene.stroke(col);
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      scene.circle(x, y, NR);
    }
    scene.pop();
    scene.push();
    scene.translate(x, y);
    scene.rotate(-0.3);
    const nd = 0.8 * d;
    const L = 2 * PI - PI / 4;
    for (let i = 0; i < ITER; i++) {
      const a = random(PI * 2);
      if (L - a > 0.3) {
        continue;
      }
      const r = nd * (1.0 - random(random(random(random(random())))));
      let col = scene.color(250);
      col.setAlpha(0.1 * (1.5 - smoothStep(0, nd, r)));
      scene.stroke(col);
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      scene.circle(x, y, NR);
    }

    scene.pop();
    scene.push();
    scene.translate(x, y);
    scene.rotate(0.85 * PI);
    const nnd = 0.78 * d;
    const nL = 2 * PI - PI / 4;
    for (let i = 0; i < ITER; i++) {
      const a = random(PI * 2);
      if (nL - a > -0.3) {
        continue;
      }
      const r = nnd * (1.0 - random(random(random(random(random())))));
      let col = scene.color(250);
      col.setAlpha(0.1 * (1.5 - smoothStep(0, nnd, r)));
      scene.stroke(col);
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      scene.circle(x, y, NR);
    }

    scene.pop();
  }

  s.preload = () => {
    monoid = s.loadFont("../libraries/fonts/Monoid-Retina.ttf");
  };

  s.setup = () => {
    let { w, h } = getLargeCanvas(s, 1600);
    let canvas = s.createCanvas(w, h);
    squiggly = 1 / (Math.max(s.width, s.height) * 0.1);
    s.pixelDensity(1);
    canvas.mousePressed(() => {});
    s.frameRate(1);
    solarized();
    seed = (window.performance.now() << 0) % 1000000;
    gui = createGUI();
    gui.toggle();
    let lab = $.cel("label");
    lab.for = "seedInput";
    lab.innerHTML = "Enter a custom seed (integer)<br/>";
    let inp = $.cel("input");
    inp.type = "number";
    inp.id = "seedInput";
    inp.onkeydown = inputSeed;
    let span = $.cel("span");
    span.innerHTML = "<br/>Dismiss by pressing <code>enter</code>";
    span.id = "seedInfo";
    $.byId("seed").append(lab, inp, span);
    s.noStroke();
    s.noLoop();
    setMode();
    R.action();
  };

  function allStop(particles) {
    let cond = true;
    for (let p of particles) {
      cond = cond && p.stopped;
      if (!cond) {
        return false;
      }
    }
    return true;
  }

  function createParticles(scene, whatever) {
    /*let particles = [];
    const particleSeed = scene.noise(whatever)
    const base = scene.random(freq) << 0
    //const basey = scene.random(freq) << 0
    const ul = {x: 0, y: 0}
    const lr = {x: scene.width, y: scene.height}
    const span = scene.height+scene.width
    for(let i=0;i<10;i++){
      particles.push(new Particle(particleSeed, scene.random(scene.width) << 0, scene.random(scene.height) << 0, 0, 0))
    }*/
    let particles = [];
    const particleSeed = scene.noise(whatever);
    const base = scene.random(freq);
    for (let x = base; x < scene.width; x += freq) {
      let stroke = scene.random(10, 50);
      let c = (scene.noise(x * squiggly) * palette.colors.length) << 0;
      let color = scene.color(palette.colors[c]);
      particles.push(new Particle(particleSeed, x, 0, stroke, color));
      particles.push(
        new Particle(particleSeed, x, scene.height, stroke, color),
      );
    }
    for (let y = base; y < scene.height; y += freq) {
      let stroke = scene.random(10, 50);
      let c = (scene.noise(y * squiggly) * palette.colors.length) << 0;
      let color = scene.color(palette.colors[c]);
      particles.push(new Particle(particleSeed, 0, y, stroke, color));
      particles.push(new Particle(particleSeed, scene.width, y, stroke, color));
    }
    return particles;

    /*
    for (let x = basex; x < scene.width; x += freq) {
      for(let y = basey; y < scene.height; y+= freq) {
    	  		//let x = ul.x + th/span*(ul.x-lr.x)
    	  		//let y = ul.y + th/span*(ul.y-lr.y)        
            const xx = lx + x*(rx-lx)/scene.width 
            const yy = uy + y*(by-uy)/scene.height // This is probably reflexed
    
      			let stroke = lineStroke;
      			let c = (scene.noise(xx, yy) * palette.colors.length) << 0
      			let color = scene.color(palette.colors[c])
      			particles.push(new Particle(particleSeed, x, y, stroke, color));
      		//particles.push(new Particle(particleSeed, _x, scene.height, stroke, color));
    }
  }*/
    /*const na = -0.0001 + 0.0002*scene.noise(whatever)
  const nb = -0.0001 + 0.0002*scene.noise(whatever)  
  const nha = ha + na
  const nhb = hb + nb
  
  for(let p = base; p < scene.width+scene.height; p+=freq){
    let x = ul.x + p/span*(-ul.x+lr.x)
    let y = ul.y + p/span*(-ul.y+lr.y)        
    const xx = lx + x*(rx-lx)/scene.width 
    const yy = uy + y*(by-uy)/scene.height // This is probably reflexed
    
    let stroke = lineStroke;
    let c = (scene.noise(xx, yy) * palette.colors.length) << 0
    let color = scene.color(palette.colors[c])
    particles.push(new Particle(nha, nhb, x, y, stroke, color));
    x = scene.width - x
    y = y    
    particles.push(new Particle(nha, nhb, x, y, stroke, color));
  }*/
    /*
    for (let y = base; y < scene.height; y += freq) {
      let _y = y;
      let stroke = lineStroke;
      let c = (scene.noise(_y * squiggly) * palette.colors.length) << 0
      let color = scene.color(palette.colors[c])
      particles.push(new Particle(particleSeed, 0, _y, stroke, color));
      particles.push(new Particle(particleSeed, scene.width, _y, stroke, color));
    }
	*/
    return particles;
  }

  function stepThrough(scene, particles, mask) {
    let i = 0;
    while (!allStop(particles)) {
      //console.log("Stepping")
      for (let p of particles) {
        if (p.stopped) {
          continue;
        }
        p.move(scene);
        p.stop(scene);
        p.draw(scene, mask);
        //if (i % 15 == 0) {

        //}
        i++;
      }
    }
  }

  function inputSeed(t) {
    if (t.key.toLowerCase() === "enter") {
      let num = $.byId("seedInput").valueAsNumber;
      if (!isNaN(num)) {
        seed = num;
      }
      $.byId("seed").style.visibility = "hidden";
      gui.update();
      $.byId("seedInput").value = "";
    }
  }

  function plot() {
    let scene = s.createGraphics(hd * 1800, hd * 1200); // fixed 3:2 aspect ratio
    let mask = s.createGraphics(scene.width, scene.height);
    let bubbly = s.createGraphics(scene.width, scene.height);
    bubbly.colorMode(s.HSB);
    s.colorMode(s.HSB);
    const foo = darken(scene, palette.background, 1);
    bubbly.background(foo);
    bubbly.randomSeed(seed);
    bubbly.noiseSeed(seed);
    let particles;
    bubbly.noFill();
    bubbly.strokeWeight(hd);
    for (let i = 0; i < layers; i++) {
      particles = createParticles(scene, (0.4 * i) / layers);
      stepThrough(bubbly, particles, mask);
    }

    let d = bubbly.get();
    d.mask(mask);
    scene.background(solarizedDark.base01);
    scene.image(d, 0, 0);

    const identifier = `${palette.short}.${seed}.${layers}×${hd.toPrecision(2)}`;
    addText(scene, scene.width - 10 * hd, scene.height - 15 * hd, identifier);
    addText(scene, scene.width - 10 * hd, scene.height - 7 * hd, "rb'23");
    largeCanvas = scene;
    let c = scene.get();
    c.resize(s.width, 0);
    s.image(c, 0, 0);
  }

  function addText(scene, x, y, content) {
    scene.push();
    scene.noStroke();
    scene.fill("black");
    scene.textAlign(s.RIGHT);
    scene.textFont(monoid, hd * 7);
    let ctx = scene.drawingContext;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.shadowBlur = hd * 1;
    ctx.shadowColor = "darkgray";
    scene.text(content, x, y);
    scene.pop();
  }

  function createGUI() {
    let info =
      "Layered particle flow in noise field. Saving uses at least 1600&times;1200 resolution on export.<ul><li>Use the e<b>X</b>plore function</li><li>while in rough <b>M</b>ode to figure out what shape you like,</li><li>then switch to fine <b>M</b>ode</li><li>and set layering to 100 with <b>)</b>.</li></ul>Optionally increase export resolution with <b>.</b>, but this needs to be done <i>first</i>, before exploration.";
    let subinfo =
      "<hr/>Very high resolutions can fail depending on the browser";
    let S = new Key("s", () => {
      largeCanvas.save("img-" + seed + ".png");
    });
    let saveCmd = new Command(S, "save the canvas (3:2)");
    R = new Key("r", () => {
      gui.spin(() => {
        s.clear();
        plot();
        gui.spin();
      });
    });

    let sol = new Key("d", solarized);
    let solCmd = new Command(sol, "use Solarized Dark palette");
    let wer = new Key("w", werner);
    let werCmd = new Command(wer, "use Werner nomenclature palette");
    let shi = new Key("p", shimmering);
    let shiCmd = new Command(shi, "use Pollock's shimmering palette");
    let geo = new Key("g", geometricPrimes);
    let geoCmd = new Command(geo, "use C82 Geometric Primes 1 palette");
    let paletteShow = new String(() => palette.name);
    let paletteControl = new Control([], "Current palette", paletteShow);
    let M = new Key("m", () => {
      if (mode == "fine") {
        mode = "rough";
      } else {
        mode = "fine";
      }
      setMode();
    });
    let modeShow = new String(() => mode);
    let modeControl = new Control([M], "Current mode", modeShow);
    let resetCanvas = new Command(R, "reset");
    let X = new Key("x", () => {
      seed = (window.performance.now() << 0) % 1000000;
    });
    let seedShow = new Integer(() => seed);
    let seedControl = new Control([X], "Random seed", seedShow);
    let incR = new Key(")", () => {
      layers += 10;
    });
    let E = new Key("e", () => {
      $.byId("seedInput").value = "";
      $.byId("seed").style.visibility = "visible";
      $.byId("seedInput").focus();
    });
    let enterSeedCommand = new Command(E, "manually enter seed");

    let decR = new Key("(", () => {
      if (layers > 10) {
        layers -= 10;
      }
    });
    let rInt = new Integer(() => layers);
    let rControl = new Control([decR, incR], "+/- layering", rInt);

    let decH = new Key(",", () => {
      if (hd > 0) {
        hd -= 0.1;
      }
    });
    let incH = new Key(".", () => {
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
      "Flows, RB 2023/04 \u{1F1E8}\u{1F1ED}",
      info,
      subinfo,
      [saveCmd, resetCanvas, enterSeedCommand, solCmd, werCmd, shiCmd, geoCmd],
      [modeControl, seedControl, paletteControl, rControl, hdControl],
    );

    let QM = new Key("?", () => gui.toggle());
    let hide = new Command(QM, "hide this");

    gui.addCmd(hide);
    gui.update();
    return gui;
  }

  s.keyReleased = () => {
    if (s.key.toLowerCase() === "tab") {
      $.byId("seed").style.visibility = "hidden";
      $.byId("container").focus();
    } else {
      gui.dispatch(s.key);
    }
  };
};

p5.disableFriendlyErrors = true;
let p5sketch = new p5(sketch);
