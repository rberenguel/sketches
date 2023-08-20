import {
  createBaseGUI,
  Command,
  GUI,
  Integer,
  Float,
  Key,
  Control,
  Seeder,
} from '../libraries/gui/gui.js'

import {
  getLargeCanvas,
  signature,
  smoothStep
} from '../libraries/misc.js'

import {
  easeInSqr,
  easeInSq
} from '../libraries/eases.js'

import {
  solarizedDark,
} from '../libraries/palettes.js'

const sketch = (s) => 
{
  let gui, R
  let debug = true
  let dly // Base debug layer, if used

  let moon, C_DENSITY // Moon color and crater "density"

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

  const n = (x, y) => Math.sqrt(x*x + y*y)

  function lin(scene, x0, y0, x1, y1, npts, rec, flg){
    scene.strokeWeight(2*cfg.hd)
    if(flg){
      scene.line(x0, y0, x1, y1)
    }
    const stack = rec === undefined ? 0 : rec + 1
    if(stack > 2){
      return
    }
    scene.noStroke()
    let vx = x1 - x0
    let vy = y1 - y0
    const N = n(vx, vy)
    vx /= N
    vy /= N
    let lit = []
    for(let i=0;i<npts;i++){
      const f = i/npts
      const ff = easeInSq(2*(f-0.5))
      if(Math.sqrt(ff) < 0.3*scene.random()){
        continue
      }
      if(scene.random()< 0.4){
        continue
      }
      const x = x0 + f*N*vx
      const y = y0 + f*N*vy
      const hu = (scene.randomGaussian(moon[0]+f*12, 5) + 360) % 360
      const sa = scene.randomGaussian(moon[1], 12)
      const br = scene.randomGaussian(moon[2], 10)
      const col = scene.color(hu, sa, br, scene.random(0.05))
      scene.fill(col)
      let rrr = scene.randomGaussian(4, 2)
      if(scene.random()<C_DENSITY){
        // "Crater" generation
        rrr = scene.randomGaussian(25, 12)
        const col = scene.color(hu, scene.randomGaussian(20, 40), scene.randomGaussian(60, 20), 0.1+scene.randomGaussian(0.5, 0.2))
        scene.stroke(col)
        circ(scene, [x, y, rrr], 1.5, true, col)
      } else {
      }
      if(scene.random()<0.05){
        if(lit.length > 0){
          const col = scene.color(hu, 20, 20, scene.random(0.01))
          scene.noFill()
          scene.stroke(col)
          lin(scene, ...lit, x, y, scene.random(100), stack, true)
          lit = []
        } else {
          lit = [x, y]
        }
      }
      scene.noStroke()
    }
  }

  function circ(scene, [cx, cy, cr], npts, fast, col){
    let innerCol
    if(fast){
      const h = scene.hue(col)
      const s = scene.saturation(col)
      const b = scene.brightness(col)
      const alpha = scene.alpha(col)
      innerCol = scene.color(h, s, b, scene.random(alpha/2))
    }
    const ang = Math.atan2(cy, cx)
    const rad = n(cx, cy)
    for(let i=0;i<100*npts;i++){
      const L = scene.randomGaussian(10*cr, 12)
      const a = 2*PI*i/npts
      const aa = scene.randomGaussian(a, 5./npts)
      const ox = cr*Math.cos(aa)
      const oy = cr*Math.sin(aa)
      const ooy = oy
      const oox = cr/(1+0.002*rad)*Math.cos(aa)
      const dx = Math.cos(ang)*oox - Math.sin(ang)*ooy
      const dy = Math.sin(ang)*oox + Math.cos(ang)*ooy
      // Rotated the frame of the circle to align it with the normal.
      // This way the major axis is along the tangent
      const x = cx + dx
      const y = cy + dy
      const N = n(ox, oy)
      const ndx = oy/N
      const ndy = -ox/N
      if(!fast){
        lin(scene, x - L*ndx, y - L*ndy, x + L*ndx, y + L*ndy, scene.randomGaussian(15, 0.3))
      } else {
        scene.stroke(innerCol)
        const f = scene.random(3)
        tapered(scene, x - f*L*ndx, y - f*L*ndy, x + f*L*ndx, y + f*L*ndy, innerCol)
      }
    }
  }

  function tapered(scene, x0, y0, x1, y1, col){
    const h = scene.hue(col)
    const s = scene.saturation(col)
    const b = scene.brightness(col)
    const alpha = scene.alpha(col)
    let vx = x1 - x0
    let vy = y1 - y0
    const N = n(vx, vy)
    vx /= N
    vy /= N
    const STEPS = 10*Math.log(N)
    const e = (x) => -(x-0)*(x-1)
    for(let i=0;i<STEPS;i++){
      const f =  i/STEPS
      if(e(f)<0.3*scene.random()){
        continue
      }
      const x = x0 + vx*N*f
      const y = y0 + vy*N*f
      let innerCol = scene.color(h, s, b, e(f))
      scene.fill(innerCol)
      scene.circle(x, y, 1*cfg.hd+scene.random(0.5))
      scene.noFill()
    }
  }

  function plot(){
    let scene = s.createGraphics(cfg.hd * 1800 << 0, cfg.hd * 1200 << 0)
    W = scene.width, H = scene.height
    let mask = s.createGraphics(W, H)
    let backdrop = s.createGraphics(W, H)
    scene.randomSeed(cfg.seeder.get())
    scene.noiseSeed(cfg.seeder.get())

    scene.background("#000912")
    scene.push()
    scene.colorMode(s.HSB)
    scene.translate(W/2, H/2)
    scene.scale(0.9)
    mask.push()
    mask.fill("black")
    mask.translate(W/2, H/2)
    mask.scale(0.9)
    mask.circle(0,0,0.9*H+5)
    mask.pop()
    const h = scene.random(360) % 360
    moon = [h, scene.randomGaussian(16, 4), scene.randomGaussian(30, 10)]
    C_DENSITY = 0.001+scene.random(0.003)
    scene.fill(...moon, 0.8)
    scene.circle(0,0,0.9*H)
    circ(scene, [0, 0, 0.05*H], 200)
    scene.pop()
    backdrop.background("black")
    backdrop.colorMode(s.HSB)
    for (let i = 0; i < W / cfg.hd; i++) {
      for (let j = 0; j < H / cfg.hd; j++) {
        let cc = backdrop.color((scene.randomGaussian(240, 100)+360) % 360, 
          scene.randomGaussian(15, 10), 
          scene.randomGaussian(80, 10))
        backdrop.fill(cc)
        backdrop.stroke(cc)
        const nn = scene.random()
        const f = Math.floor(nn * 28000)
        if (f == 1 || f == 42 || (f > 90 && f < 100)) {
          const rr = 10 * cfg.hd * easeInSq(scene.random())
          for (let k = 0; k < 10; k++) {
            const a = smoothStep(0, 10, k)
            const r = smoothStep(0, 10, k)
            cc.setAlpha(a * 1)
            backdrop.fill(cc)
            backdrop.circle(i * cfg.hd, j * cfg.hd, (1 - r) * rr)
          }
        }
      }
    }

    const identifier = `${cfg.seeder.hex()}@${cfg.hd.toPrecision(2)}`
    const sigCfg = {
      s: s,
      scene: backdrop,
      color: "#AABAEA",
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

    let c = scene.get()
    c.mask(mask)
    backdrop.image(c, 0, 0)
    let d = backdrop.get()
    cfg.largeCanvas = backdrop
    d.resize(s.width, 0)
    s.image(d, 0, 0)
  }

  s.draw = () => {
  }


  const createGUI = (gui) => {
    cfg.title = "That's no moon, RB 2023/8 \u{1F1E8}\u{1F1ED}"
    cfg.info = "Exploration of circles follow-up"
    cfg.subinfo = "Not fully resolution independent, but not too bad either if increased."
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
