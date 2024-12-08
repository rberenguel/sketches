import {
  createBaseGUI,
  Command,
  GUI,
  Integer,
  Boolean,
  Float,
  Key,
  Control,
  Seeder
} from '../libraries/gui/gui.js'

import {
  getLargeCanvas,
  smoothStep,
  signature
} from '../libraries/misc.js'

import {
  canvasRGBA
} from '../libraries/3rdparty/stackblur.js'

import {
  easeInSq
} from '../libraries/eases.js'


import {
  c82GeoPrimesPalette,
  solarizedDark,
  shimmeringColorArray,
  solarizedDarkPalette
} from '../libraries/palettes.js'



const sketch = (s) => {

  let R, gui
  let debug = true
  let starStrokeWeight = 2
  let showBuildings = true
  let layers = 50
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
  
  function copyColor(color) {
    const r = s.red(color)
    const g = s.green(color)
    const b = s.blue(color)
    const a = s.alpha(color)
    return s.color(r, g, b, a)
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
    const {scene, x, y, l, n, m, a} = opts;
    // l: size
    // n: spikes
    // m: subdivisions
    // a: rotation angle
    let pts0 = null
    scene.push()

    scene.strokeWeight(cfg.hd*starStrokeWeight)
    scene.translate(x, y)
    scene.rotate(a)
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
          scene.line(x0, y0, x1, y1)
        }
        pts0 = pts1
      }
    }
    scene.pop()

  }

  const drawSnowfield = (scene, params) => {
    scene.push()
    scene.fill("white")
    let c = copyColor("white")
    let ctx = scene.drawingContext
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.shadowBlur = 1
    ctx.shadowColor = "white"
    scene.noStroke()
    for (let i = 0; i < scene.width / cfg.hd; i++) {
      for (let j = 0; j < scene.height / cfg.hd; j++) {
        const n = scene.random()
        const f = Math.floor(n * 35000)
        if (f == 1 || f == 42 || (f > 90 && f < 100)) {
          const rr = 10 * cfg.hd * easeInSq(scene.random())
          for (let k = 0; k < 10; k++) {
            const a = smoothStep(0, 10, k)
            const r = smoothStep(0, 10, k)
            c.setAlpha(a * 255)
            scene.fill(c)
            scene.circle(i * cfg.hd, j * cfg.hd, (1 - r) * rr)
          }
        }
      }
    }
    scene.pop()
  }



  const buildingAt = (opts = {}) => {
    const {scene, x, y, bW, bH, nLW, nLH} = opts;
    scene.push()
    const lW = bW/((nLW+1)/2 + nLW);
    const lH = bH/((nLH+1)/2 + nLH);
    scene.fill(0, 10, 10)
    scene.translate(x, y)
    scene.rectMode(scene.CORNER)
    scene.rect(0, 0, bW, bH)
    scene.rectMode(s.CORNERS)
    for(let i=0;i<nLW;i++){
      for(let j=0;j<nLH;j++){
        const base = scene.random([30, 30, 60, 180, 180])
        const jig = 20-scene.random(40)
        if(scene.random(5) < 1.5) {
          scene.fill(base+jig, 50, 0)
        } else {
          scene.fill(base+jig, 10, 30)
        }
        const x0 = lW/2*(i+1)+lW*i
        const x1 = lW/2*(i+1)+lW*(i+1)
        const y0 = lH/2*(j+1)+lH*j
        const y1 = lH/2*(j+1)+lH*(j+1)
        scene.rect(x0, y0, x1, y1)
      }
    }
    scene.pop()

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


    starry.background(10, 10, 20)//solarizedDark.base01)
    starry.colorMode(starry.HSB)
    scene.colorMode(scene.HSB)
    if(showBuildings){
    buildingAt({
      scene: starry, 
      x: W*0.01, 
      y: H*0.2,
      bW: W*0.15, 
      bH: H-H*0.2, 
      nLW: 5,
      nLH:11
    })
    canvasRGBA( starry.canvas, 0, 0, W, H, Math.max(1, (0.5 + cfg.hd) << 0))
    buildingAt({
      scene: starry, 
      x: W*0.04, 
      y: H*0.6,
      bW: W*0.2, 
      bH: H-H*0.4, 
      nLW: 5,
      nLH:6
    })
    buildingAt({
      scene: starry, 
      x: W*0.9, 
      y: H*0.2,
      bW: W*0.18, 
      bH: H-H*0.2, 
      nLW: 7,
      nLH:10
    })
    buildingAt({
      scene: starry, 
      x: W*0.72, 
      y: H*0.7,
      bW: W*0.24, 
      bH: H-H*0.4, 
      nLW: 6,
      nLH:5,
    })
    }
    for (let i = 0; i < layers; i++) {
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
      starAt({scene: starry, x: fx * W, y: fy * H, l: l, n: n, m: m, a: a})
      if(i < layers/2 && ((i % 3) == 0)){
        drawSnowfield(starry)
      }
      if (i % 4 == 0) {
        canvasRGBA( starry.canvas, 0, 0, W, H, Math.max(1, (0.5 + cfg.hd) << 0))
      }
    }
    //canvasRGBA( starry.canvas, 0, 0, W, H, Math.max(1, (0.5 + cfg.hd) << 0))

    //starAt(scene, 500, 500, 100, 6, 6, 0.1)
    let d = starry.get()
    scene.background(20, 20, 20)//solarizedDark.base01)
    scene.image(d, 0, 0)

    if (debug && dly) {
      let c = dly.get()
      scene.image(dly, 0, 0)
    }


    const b = showBuildings ? "b|" : ""
    const identifier = `${b}W${starStrokeWeight}|L${layers}|${cfg.seeder.hex()}@${cfg.hd.toPrecision(2)}`
    const sigCfg = {
      s: s,
      scene: scene,
      color: "#101020",
      shadow: "darkgrey",
      fontsize: 9,
      right: scene.width,
      bottom: scene.height,
      identifier: identifier,
      sig: "rb'24",
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
    cfg.title = "Starry, RB 2024/12 \u{1F1E8}\u{1F1ED}"
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
    let B = new Key("b", () => {
      showBuildings = !showBuildings;
      R.action()
    }, (x) => {
      showBuildings = x == 'true'
      gui.update()
    }, "buildings")

    let showBuildingsBool = new Boolean(() => showBuildings)
    let showBuildingsBoolControl = new Control([B], "buildings?",
      showBuildingsBool)

    let incW = new Key(")", () => {
      starStrokeWeight += 0.5
    })
    let decW = new Key("(", () => {
      starStrokeWeight -= 0.5
      if(starStrokeWeight < 0.2){
      starStrokeWeight = 0.2
      }
    })
    let wInt = new Float(() => starStrokeWeight)
    let wControl = new Control([decW, incW],
      "+/- star stroke", wInt)
    let incL = new Key("]", () => {
      layers += 5
    })
    let decL = new Key("[", () => {
      layers -= 10
      if(layers < 10){
      layers = 5
      }
    })
    let lInt = new Integer(() => layers)
    let lControl = new Control([decL, incL],
      "+/- layers", lInt)



    cfg.commands = [resetCanvas, cfg.seeder.command]
    cfg.controls = [wControl, lControl,showBuildingsBoolControl, cfg.seeder.control]

    gui = createBaseGUI(cfg)
    return gui
  }



  s.keyReleased = () => {
    gui.dispatch(s.key)
  }
}

p5.disableFriendlyErrors = true
let p5sketch = new p5(sketch)
