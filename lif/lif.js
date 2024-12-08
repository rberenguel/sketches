import {
  createBaseGUI,
  Command,
  GUI,
  Integer,
  Float,
  String,
  Boolean,
  Key,
  Control,
  Seeder,
} from "../libraries/gui/gui.js";

import { getLargeCanvas, signature } from "../libraries/misc.js";

import {
  solarizedDark,
  wernerBase,
  shimmeringColorArray,
  c82GeoPrimesPalette,
} from "../libraries/palettes.js";

const sketch = (s) => {
  let gui;
  let i = 0,
    looping = false,
    blend = false;

  let R, T;

  // Globals needed in controls, commands or deep arguments
  let cfg = {
    hd: 0.5,
    seeder: undefined,
    largeCanvas: undefined,
  };

  let W, H; // Helpful globals to avoid typing scene.width so much

  let palettes = {};
  let paletteNames = ["werner1"];
  function v2c(sc, v) {
    return sc.color(v[0], v[1], v[2], v[3]);
  }
  function c2v(sc, c) {
    // Assumes and requires RGB space
    const r = sc.red(c);
    const g = sc.green(c);
    const b = sc.blue(c);
    const a = sc.alpha(c);
    return [r, g, b, a];
  }

  let paletteIdx = 0;

  function color(key) {
    return palettes[paletteNames[paletteIdx]][key];
  }

  const PI = s.PI;

  s.preload = () => {
    cfg.font = s.loadFont("../libraries/fonts/Monoid-Retina.ttf");
    cfg.frag = s.loadStrings("lif.frag");
    cfg.vert = s.loadStrings("lif.vert");
    cfg.aafrag = s.loadStrings("aa.frag");
  };

  s.setup = () => {
    let { w, h } = getLargeCanvas(s, 1600);
    let canvas = s.createCanvas(w, h);
    s.pixelDensity(1);
    canvas.mousePressed(() => {});
    s.frameRate(60);

    cfg.seeder = new Seeder();
    gui = createGUI();
    gui.toggle();
    create();
    R.action();
  };

  function create() {
    cfg.s1 = s.createGraphics(
      (cfg.hd * 1800) << 0,
      (cfg.hd * 1200) << 0,
      s.WEBGL,
    );
    W = cfg.s1.width;
    H = cfg.s1.height;

    cfg.alternate = s.createGraphics(W, H);
    cfg.s2 = s.createGraphics(W, H, s.WEBGL);
    cfg.aa = s.createGraphics(W, H, s.WEBGL);
    cfg.sh1 = cfg.s1.createShader(cfg.vert.join("\n"), cfg.frag.join("\n"));
    cfg.sh2 = cfg.s2.createShader(cfg.vert.join("\n"), cfg.frag.join("\n"));
    cfg.shaa = cfg.aa.createShader(cfg.vert.join("\n"), cfg.aafrag.join("\n"));

    cfg.s1.shader(cfg.sh1);
    cfg.s2.shader(cfg.sh2);
    cfg.aa.shader(cfg.shaa);
    // Without capping colors passing canvases as textures had strange behaviour when comparing
    cfg.s1.colorMode(s.RGB, 1.0);
    cfg.s2.colorMode(s.RGB, 1.0);
    cfg.aa.colorMode(s.RGB, 1.0);

    palettes.werner1 = {
      alive: c2v(cfg.s2, cfg.s2.color(wernerBase.red)),
      dead: c2v(cfg.s2, cfg.s2.color(wernerBase.bone)),
    };
    palettes.werner2 = {
      alive: c2v(cfg.s2, cfg.s2.color(wernerBase.yellow)),
      dead: c2v(cfg.s2, cfg.s2.color(wernerBase.lightBrown)),
    };
    palettes.werner3 = {
      alive: c2v(cfg.s2, cfg.s2.color(wernerBase.violet)),
      dead: c2v(cfg.s2, cfg.s2.color(wernerBase.darkBrown)),
    };

    palettes.solarized1 = {
      alive: c2v(cfg.s2, cfg.s2.color(solarizedDark.yellow)),
      dead: c2v(cfg.s2, cfg.s2.color(solarizedDark.base01)),
    };
    palettes.solarized2 = {
      alive: c2v(cfg.s2, cfg.s2.color(solarizedDark.orange)),
      dead: c2v(cfg.s2, cfg.s2.color(solarizedDark.base01)),
    };
    palettes.solarized3 = {
      alive: c2v(cfg.s2, cfg.s2.color(solarizedDark.blue)),
      dead: c2v(cfg.s2, cfg.s2.color(solarizedDark.base01)),
    };
    palettes.c82a = {
      alive: c2v(cfg.s2, cfg.s2.color(c82GeoPrimesPalette[3])),
      dead: c2v(cfg.s2, cfg.s2.color(c82GeoPrimesPalette[10])),
    };
    palettes.c82b = {
      alive: c2v(cfg.s2, cfg.s2.color(c82GeoPrimesPalette[7])),
      dead: c2v(cfg.s2, cfg.s2.color(c82GeoPrimesPalette[5])),
    };

    paletteNames = Object.keys(palettes);
  }

  function initializeShaders() {
    cfg.sh1.setUniform("u_canvas", cfg.s2);
    cfg.sh2.setUniform("u_canvas", cfg.s1);
    // Each canvas will receive the other one as texture
    // The pixel-level increments below are calculated here
    // to avoid computing them in each fragment
    cfg.sh1.setUniform("dx", 1.0 / W);
    cfg.sh1.setUniform("dy", 1.0 / H);
    cfg.sh2.setUniform("dx", 1.0 / W);
    cfg.sh2.setUniform("dy", 1.0 / H);
    cfg.shaa.setUniform("dx", 1.0 / W);
    cfg.shaa.setUniform("dy", 1.0 / H);
    cfg.sh1.setUniform("u_lcol", color("alive"));
    cfg.sh1.setUniform("u_dcol", color("dead"));
    cfg.sh2.setUniform("u_lcol", color("alive"));
    cfg.sh2.setUniform("u_dcol", color("dead"));

    s.clear();
    cfg.s1.clear();
    cfg.s2.clear();
    cfg.aa.clear();
    cfg.s2.fill(v2c(cfg.s2, color("alive")));
    cfg.s2.stroke(v2c(cfg.s2, color("alive")));
    cfg.s1.background(v2c(cfg.s2, color("dead")));
    cfg.s2.background(v2c(cfg.s2, color("dead")));
    cfg.aa.background(v2c(cfg.s2, color("dead")));
    cfg.s2.strokeWeight(1);
    cfg.s1.randomSeed(cfg.seeder.get());
    cfg.s1.noiseSeed(cfg.seeder.get());
    cfg.s2.randomSeed(cfg.seeder.get());
    cfg.s2.noiseSeed(cfg.seeder.get());
    // Random initialization of alive cells
    for (let i = 0; i < (100000 * cfg.hd) << 0; i++) {
      cfg.s2.point(cfg.s2.random(-W, W), cfg.s2.random(-H, H));
    }
    cfg.s1.rect(-W / 2, -H / 2, W, H);
    // The aa shader does a weighted blur (wanted to antialias
    // but that would be too much work) and also optionally
    // "blends" dead and alive cells
    cfg.shaa.setUniform("u_canvas", cfg.s1);
    cfg.shaa.setUniform("u_this", cfg.aa);
    cfg.shaa.setUniform("blend", false);
    cfg.aa.rect(-W / 2, -H / 2, W, H);
    cfg.largeCanvas = cfg.aa;
    let c = cfg.aa.get();
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
    i = 1;
    gui.update();
    s.loop();
  }

  s.draw = () => {
    let c;
    cfg.sh1.setUniform("u_canvas", cfg.s2);
    cfg.sh2.setUniform("u_canvas", cfg.s1);
    // In each cycle, make sure the other canvas is the input,
    // otherwise the shaders seem to lose the update from the canvas
    // This can be relatively expensive to pass since they are real
    // canvases, should be framebuffers.
    cfg.shaa.setUniform("u_this", cfg.aa);
    // For blending, blends with itself
    cfg.shaa.setUniform("blend", blend);

    if (i % 2 == 0) {
      cfg.s1.rect(-W / 2, -H / 2, W, H);
      cfg.shaa.setUniform("u_canvas", cfg.s1);
      cfg.aa.rect(-W / 2, -H / 2, W, H);
      cfg.largeCanvas = cfg.aa;
      c = cfg.aa.get();
    } else {
      cfg.s2.rect(-W / 2, -H / 2, W, H);
      cfg.shaa.setUniform("u_canvas", cfg.s2);
      cfg.aa.rect(-W / 2, -H / 2, W, H);
      cfg.largeCanvas = cfg.aa;
      c = cfg.aa.get();
    }
    // Depending on parity, show one or the other. Each one just computes the
    // shader using the other as texture input.
    i++;
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

  const createGUI = (gui) => {
    cfg.title = "Lif, RB 2023/6 \u{1F1E8}\u{1F1ED}";
    cfg.info = "Game of Life implemented in a shader (so fast it loses an E)";
    cfg.subinfo =
      "It was very hard to get this to work, even if it's basic. Uses a couple canvases I keep swapping as images, as far as I understand shaders and GLSL at the moment using framebuffers could be better. 3 years ago I had a lot of fun with Life variations… and I have several simulations I want to run pixel by pixel, this was a good first step.<br/>It has an additional 'aa' shader which is not really antialiasing but a weighted blur. Makes it look nicer, I think.<br/>Defaults to 0.5 resolution because otherwise you don't see the cells. <code>blend</code> leaves a trail of live and dead cells.";
    cfg.s = s;
    R = new Key("r", () => {
      i = 0;
      gui.unmark();
      gui.update();
      initializeShaders();
    });

    let resetCanvas = new Command(R, "reset");
    let B = new Key("b", () => {
      T.action();
      blend = !blend;
      R.action();
    });
    let blendInfo = new Boolean(() => blend);
    let blendControl = new Control([B], '"Blend"', blendInfo);

    T = new Key("t", () => {
      if (looping) {
        s.noLoop();
        looping = false;
      } else {
        looping = true;
        s.loop();
      }
    });
    let loopingInfo = new Boolean(() => looping);
    let stopAnimation = new Control([T], "Animation enabled", loopingInfo);
    let Pn = new Key(")", () => {
      paletteIdx = (paletteIdx + 1) % paletteNames.length;
      R.action();
    });
    let Pp = new Key("(", () => {
      paletteIdx = (paletteIdx - 1 + paletteNames.length) % paletteNames.length;
      R.action();
    });
    let paletteInfo = new String(() => paletteNames[paletteIdx]);
    let paletteControl = new Control([Pp, Pn], "Current palette", paletteInfo);

    let S = new Key("s", () => {
      let c = cfg.largeCanvas.get();
      cfg.alternate.image(c, 0, 0);
      const shortBlend = blend ? "b" : "o";
      const identifier = `${shortBlend}.${cfg.seeder.hex()}@${cfg.hd.toPrecision(2)}`;
      const sigCfg = {
        s: s,
        scene: cfg.alternate,
        color: "#101020",
        shadow: "darkgrey",
        fontsize: 9,
        right: W,
        bottom: H,
        identifier: identifier,
        sig: "rb'23",
        hd: cfg.hd,
        font: cfg.font,
        adjustFont: true,
      };
      signature(sigCfg);

      cfg.alternate.save("img.png");
    });
    let saveCmd = new Command(S, "save the canvas");

    cfg.commands = [saveCmd, resetCanvas, cfg.seeder.command];
    cfg.controls = [
      paletteControl,
      cfg.seeder.control,
      stopAnimation,
      blendControl,
    ];
    cfg.skipSaveCmd = true;
    gui = createBaseGUI(cfg);
    return gui;
  };

  s.keyReleased = () => {
    gui.dispatch(s.key);
  };
};

// Hack while WEBGL2 is not released (should be in the next p5js release)
p5.RendererGL.prototype._initContext = function () {
  try {
    this.drawingContext =
      this.canvas.getContext("webgl2", this._pInst._glAttributes) ||
      this.canvas.getContext("experimental-webgl", this._pInst._glAttributes);
    if (this.drawingContext === null) {
      throw new Error("Error creating webgl context");
    } else {
      const gl = this.drawingContext;
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      this._viewport = this.drawingContext.getParameter(
        this.drawingContext.VIEWPORT,
      );
    }
  } catch (er) {
    throw er;
  }
};

p5.disableFriendlyErrors = true;
let p5sketch = new p5(sketch);
