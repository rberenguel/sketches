import {
  createBaseGUI,
  Command,
  GUI,
  Integer,
  String,
  Float,
  Key,
  Control,
  Seeder
} from '../libraries/gui/gui.js'

import {
  getLargeCanvas,
  sceneShuffle,
  signature
} from '../libraries/misc.js'


// Base to avoid writing always the same

const sketch = (s) => {

  let gui
  let debug = false
  let hd = 2
  let shader, vert, frag, includesGLSL = {}
  let includes = []
  let palette = []
  let W, H, R, sh, scene
  // Globals needed in controls, commands or deep arguments
  let cfg = {
    hd: 1.0,
    seeder: undefined,
    largeCanvas: undefined,
    palette: [],
    lightPalette: []
  }

  let a = 1.1, b = -1.1, m = 2, n = 7, k = 0, quat = true
  s.setup = () => {
    let {
      w,
      h
    } = getLargeCanvas(s, 1600)
    let canvas = s.createCanvas(w, h)
    s.pixelDensity(1)
    canvas.mousePressed(() => {})
    s.frameRate(20)
    s.noLoop()
    scene = s.createGraphics(1000*hd, 1000*hd, s.WEBGL)
    cfg.seeder = new Seeder()
    gui = createGUI()
    gui.toggle()
    scene.randomSeed(cfg.seeder.get())
     gui.spin(() => {
      s.clear();
      initStuff()
      gui.spin();
    });
  }

  s.preload = () => {
    cfg.font = s.loadFont("../libraries/fonts/Monoid-Retina.ttf")
    frag = s.loadStrings('shader.frag')
    vert = s.loadStrings('shader.vert')
  }


  s.draw = () => {
  }

  const paletteHex = [   
    "#a27f5b",
    "#77a16e",
    "#b43a1e",
    "#ffac90",
    "#884a41",
    "#c6905c",
    "#912826",
    "#888885",
    "#536487",
    "#c78863",
    "#875440",
    "#ab2f28",
    "#b4874b",
    "#76a276",
    "#76655c",
    "#f08680",
    "#7b7c9a",
    "#6f767f",
    "#a5ccd1",
  ]
  const lightHex = [
    "#c8d1d0",
    "#c7a27f",
    "#b3a291",
    "#c6b599",
    "#aaaaac",
  ]
  function h2vGL(sc, h){
    // Assumes a 255-based RGBA
    const c = sc.color(h)
    const r = sc.red(c)
    const g = sc.green(c)
    const b = sc.blue(c)
    const a = sc.alpha(c)
    return [r/255.0, g/255.0, b/255.0]
  }

  function initStuff(){
    W = scene.width
    H = scene.height
    cfg.result = s.createGraphics(W, H)
    cfg.dirt= s.createGraphics(W, H)
    cfg.dirt.strokeWeight(1)
    cfg.concrete = s.createGraphics(W, H)
    cfg.concrete.strokeWeight(1)
    if(debug){
      cfg.dirt.background("white")
      cfg.concrete.background("white")
    } else {
      for(let i=0;i<W;i++){
        for(let j=0;j<H;j++){
          cfg.dirt.stroke(255*cfg.dirt.noise(40*i/W, 40*j/H))
          cfg.dirt.point(i, j)
        }
      }
      cfg.concrete.noStroke()
      for(let i=0;i<W;i+=hd){
        for(let j=0;j<H;j+=hd){
          cfg.concrete.fill(255*cfg.concrete.random())
          cfg.concrete.circle(i, j, hd)
        }
      }
    }
    sh = scene.createShader(vert.join("\n"), frag.join("\n"))
    scene.shader(sh)
    for(let i = 0; i<paletteHex.length;i++){
      const h = paletteHex[i]
      const v = h2vGL(scene, h)
      cfg.palette.push(v)
    }
    for(let i = 0; i<lightHex.length;i++){
      const h = lightHex[i]
      const v = h2vGL(scene, h)
      cfg.lightPalette.push(v)
    }
   R.action()
  }

  function plot(){
    scene.clear()
    scene.background("white")
    scene.randomSeed(cfg.seeder.get())
    let shifts = []
    for(let i=0;i<4;i++){
      const x = 2*(0.5-scene.random())/W
      const y = 2*(0.5-scene.random())/W
      shifts.push(x)
      shifts.push(y)
    }
    sh.setUniform("u_shifts", shifts)
    sh.setUniform("u_resolution",[1.0*W,1.0*H])
    sh.setUniform("u_params",[a, b, m, n])
    sh.setUniform("u_kind", k)
    sh.setUniform("u_quat", quat)
    let paletteCopy = [...cfg.palette]
    let lightPaletteCopy = [...cfg.lightPalette]
    const shuffledPalette = sceneShuffle(scene, paletteCopy)
    const shuffledLightPalette = sceneShuffle(scene, lightPaletteCopy)
    let flattened = []
    for(let c of [shuffledPalette[0], shuffledLightPalette[0], shuffledPalette[1], shuffledLightPalette[1], shuffledPalette[2], shuffledLightPalette[2]]){
      const [r, g, b] = c
      flattened.push(r, g, b)
    }
    sh.setUniform("u_p", flattened)//[[1, 0, 0], [0, 1, 0]])
    sh.setUniform("u_dirt", cfg.dirt)
    sh.setUniform("u_concrete", cfg.concrete)
    scene.noStroke()
    scene.rectMode(s.CORNERS)
    scene.rect(0,0,W,H)
    cfg.result.clear()
    cfg.result.image(scene, 0, 0)
    const idParams = `${a.toPrecision(2)}:${b.toPrecision(2)}:${m.toPrecision(2)}:${n.toPrecision(2)}:${k.toPrecision(2)}`
    const identifier = `${idParams}/${cfg.seeder.hex()}@${cfg.hd.toPrecision(2)}`
    const sigCfg = {
      s: s,
      scene: cfg.result,
      color: "#101020",
      shadow: "darkgrey",
      fontsize: 14,
      right: 0.97*W,
      bottom: H,
      identifier: identifier,
      sig: "Rajola | rb'23",
      hd: cfg.hd,
      font: cfg.font,
      adjustFont: true
    }
    signature(sigCfg)




    cfg.largeCanvas = cfg.result
    let c = cfg.result.get()

    c.resize(0, 0.9*s.height)
    if (c.width > s.width) {
      c.resize(s.width, 0)
    }
    const gap = s.width - c.width
    s.push()
    if (gap > 0) {
      s.translate(gap / 2, 0)
    }
    s.image(c, 0, 0)
    s.pop()
  }

  function createGUI() {
    cfg.title = "Rajola, RB 2023/6 \u{1F1E8}\u{1F1ED}"
    cfg.info = "Inspired by <a href='https://www.theguardian.com/cities/2018/jun/19/the-tile-hunter-of-barcelona-preserving-a-unique-form-of-local-art-in-pictures'>Catalan hydraulic tiles</i> (<i>cement carpets</i>)"
    cfg.subinfo = "The palette is extracted from images of real tiles. All is drawn in a GLSL shader. The patterns are in essence <a href='https://en.wikipedia.org/wiki/Ernst_Chladni#Chladni_figures'>Chladni patterns</a> although the <code>k</code> parameter brings into play other, different patterns (similar formulas to Chladni's).<hr/><code>m</code> and <code>n</code> control periods, <code>p</code> and <code>q</code> amplitudes (they map to <code>a</code> and <code>b</code> in the usual Chladni formulation), <code>k</code> changes the formula smoothly."
    cfg.s = s
    R = new Key("r", () => {
      gui.spin(() => {
        s.clear();
        plot()
        gui.spin();
      });
    });

    let resetCanvas = new Command(R, "draw with current settings")

    let incA = new Key("P", () => {a+=0.1; R.action()})
    let decA = new Key("p", () => {a-=0.1; R.action()})
    let aInt = new Float(() => a)
    let aControl = new Control([decA, incA],
      "+/- a", aInt)
    let incB = new Key("Q", () => {b+=0.1; R.action()})
    let decB = new Key("q", () => {b-=0.1; R.action()})
    let bInt = new Float(() => b)
    let bControl = new Control([decB, incB],
      "+/- b", bInt)
    let incM = new Key("M", () => {m+=0.1; R.action()})
    let decM = new Key("m", () => {m-=0.1; R.action()})
    let mInt = new Float(() => m)
    let mControl = new Control([decM, incM],
      "+/- m", mInt)
    let incN = new Key("N", () => {n+=0.1; R.action()})
    let decN = new Key("n", () => {n-=0.1; R.action()})
    let nInt = new Float(() => n)
    let nControl = new Control([decN, incN],
      "+/- n", nInt)
    let incK = new Key("K", () => {k=((k+0.5)+40)%40; R.action()})
    let decK = new Key("k", () => {k=((k-0.5)+40)%40; R.action()})
    let kInt = new Float(() => k)
    let kControl = new Control([decK, incK],
      "+/- k", kInt)
    let SP = new Key("i", () => {quat=!quat; R.action()})
    let spString = new String(() => quat ? "Split" : "Not split")
    let spControl = new Control([SP],
      "Split in 4 or not", spString)



    cfg.commands = [resetCanvas, cfg.seeder.command]
    cfg.controls = [aControl, bControl, mControl, nControl, kControl, cfg.seeder.control, spControl]
    cfg.skipHD = true
    gui = createBaseGUI(cfg)
    return gui
  }

  s.keyReleased = () => {
    gui.dispatch(s.key)
  }
}

// Hack while WEBGL2 is not released (should be in the next p5js release)
p5.RendererGL.prototype._initContext = function() {
  try {
    this.drawingContext =
      this.canvas.getContext('webgl2', this._pInst._glAttributes) ||
      this.canvas.getContext('experimental-webgl', this._pInst._glAttributes);
    if (this.drawingContext === null) {
      throw new Error('Error creating webgl context');
    } else {
      const gl = this.drawingContext;
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      this._viewport = this.drawingContext.getParameter(
        this.drawingContext.VIEWPORT
      );
    }
  } catch (er) {
    throw er;
  }
};


p5.disableFriendlyErrors = false

let p5sketch = new p5(sketch)
