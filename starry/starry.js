import {
  createBaseGUI,
  Command,
  GUI,
  Integer,
  Float,
  Key,
  Control,
  Seeder
} from '../libraries/gui/gui.js'

import {
  getLargeCanvas,
  signature
} from '../libraries/misc.js'

import {
  canvasRGBA
} from '../libraries/3rdparty/stackblur.js'

import {
  c82GeoPrimesPalette,
  solarizedDark,
  shimmeringColorArray,
  solarizedDarkPalette
} from '../libraries/palettes.js'



const sketch = (s) => {

  let R, gui
  let debug = true
  let dly // Base debug layer, if used

  // Globals needed in controls, commands or deep arguments
  let cfg = {
    hd: 1,
    seeder: undefined,
    largeCanvas: undefined
  }

  let W, H // Helpful globals to avoid typing scene.width so much

  const PI = s.PI

  s.preload = () => {
    cfg.font = s.loadFont("../libraries/fonts/Monoid-Retina.ttf")
  }

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
    cfg.seeder = new Seeder()
    gui = createGUI()
    gui.fetch()
    gui.toggle()
    R.action()
  }

  const lineByAngle = (s, x0, y0, a, l) => {
    const x1 = x0 + l*Math.cos(a)
    const y1 = y0 + l*Math.sin(a)
    s.line(x0, y0, x1, y1)
  }

  const lineDivisions = (n, x0, y0, a, l) => {
    let pts = []
    for(let i=1;i<=n;i++){
      const ln = i*l/n
      const x1 = x0 + ln*Math.cos(a)
      const y1 = y0 + ln*Math.sin(a)
      pts.push([x1, y1])
    }
    return pts
  }

  const starAt = (opts = {}) => {
    const {s, x, y, l, n, m, a} = opts;
    // l: size
    // n: spikes
    // m: subdivisions
    // a: rotation angle
    let pts0 = null
    s.push()
    s.translate(x, y)
    s.rotate(a)
    for(let i=0; i<=n; i++){
      //lineByAngle(s, 0, 0, i*2*PI/n, l)
      let pts1 = lineDivisions(m, 0, 0, i*2*PI/n, l)
      if(!pts0){
        pts0 = pts1
      } else {
        pts0.reverse();
        for(let j=0; j<m; j++){
          const [x0, y0] = pts0[j]
          const [x1, y1] = pts1[j]
          s.line(x0, y0, x1, y1)
        }
        pts0 = pts1
      }
    }
    s.pop()

  }

  s.draw = () => {}
  function plot() {
    let scene = s.createGraphics((cfg.hd * s.width) << 0, (cfg.hd * s.height) << 0)
    W = scene.width, H = scene.height
    let starry = s.createGraphics(W, H)
    let mask = s.createGraphics(W, H)
    let dly = s.createGraphics(W, H)
    scene.randomSeed(cfg.seeder.get())
    scene.noiseSeed(cfg.seeder.get())
    starry.randomSeed(cfg.seeder.get())
    starry.noiseSeed(cfg.seeder.get())
    dly.randomSeed(cfg.seeder.get())
    dly.noiseSeed(cfg.seeder.get())

 
    starry.noFill()
    starry.strokeWeight(cfg.hd)


    starry.background(solarizedDark.base01)
    starry.colorMode(starry.HSB)
    scene.colorMode(scene.HSB)
    for (let i = 0; i < 60; i++) {
      const fx = starry.random(0.01, 0.99)
      const fy = starry.random(0.01, 0.99)
      const d = starry.random(0.02, 0.1)
      const l = d*H
      const density = starry.random(20, 100)
      const n = Math.floor(Math.sqrt(density))
      const m = n
      const a = starry.random(2*PI)
      const j = 20-starry.random(40)

      const sat = 20-starry.random(40)
      const bri = 20-starry.random(40)
      const base = starry.random([30, 180, 180, 180, 180, 180, 120, 270])
      let col = starry.color(0, 0, 100)
      col.setAlpha(0.8)
      starry.stroke(col)
      starry.line(fx*W, 0, fx*W, fy*H-l/2)
      col = starry.color(base+j, 80+sat, 80+bri)
      col.setAlpha(0.5)
      starry.stroke(col)
      starAt({s: starry, x: fx * W, y: fy * H, l: l, n: n, m: m, a: a})
      if (i % 4 == 0) {
        canvasRGBA( starry.canvas, 0, 0, W, H, Math.max(1, (0.5 + cfg.hd) << 0))
      }
    }
    //canvasRGBA( starry.canvas, 0, 0, W, H, Math.max(1, (0.5 + cfg.hd) << 0))

    //starAt(scene, 500, 500, 100, 6, 6, 0.1)
    let d = starry.get()
    scene.background(solarizedDark.base01)
    scene.image(d, 0, 0)
 
    if (debug && dly) {
      let c = dly.get()
      scene.image(dly, 0, 0)
    }



    const identifier = `${cfg.seeder.hex()}@${cfg.hd.toPrecision(2)}`
    const sigCfg = {
      s: s,
      scene: scene,
      color: "#101020",
      shadow: "darkgrey",
      fontsize: 9,
      right: scene.width,
      bottom: scene.height,
      identifier: identifier,
      sig: "rb'23",
      hd: cfg.hd,
      font: cfg.font
    }
    signature(sigCfg)

    cfg.largeCanvas = scene
    let c = scene.get()
    c.resize(s.width, 0)
    s.image(c, 0, 0)
  }


  const createGUI = (gui) => {
    cfg.title = "Starry, RB 2024/ \u{1F1E8}\u{1F1ED}"
    cfg.info = "Line stars"
    cfg.subinfo = "Inspired by a Christmas postcard I did in 2008 in PostScript."
    cfg.s = s
    R = new Key("r", () => {
      gui.spin(() => {
        cfg.s.clear()
        plot()
        gui.spin()
        gui.unmark()
        gui.update()
      })
    })

    let resetCanvas = new Command(R, "reset")        

    cfg.commands = [resetCanvas, cfg.seeder.command]
    cfg.controls = [cfg.seeder.control]

    gui = createBaseGUI(cfg)
    return gui
  }



  s.keyReleased = () => {
    gui.dispatch(s.key)
  }
}

p5.disableFriendlyErrors = true
let p5sketch = new p5(sketch)
