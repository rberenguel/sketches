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
  easeInSqr,
  easeInSq
} from '../libraries/eases.js'

import {
  solarizedDark,
} from '../libraries/palettes.js'

const sketch = (s) => {

    let gui
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
        const hu = scene.randomGaussian(180+f*60, 90)
        const sa = scene.randomGaussian(50, 5)
        const br = scene.randomGaussian(10, 3)
        const col = scene.color(hu, sa, br, scene.random(0.05))
        scene.fill(col)
        let rrr = scene.randomGaussian(4, 2)
        if(scene.random()<0.01){
          rrr = scene.randomGaussian(25, 10)
          const col = scene.color(hu, sa, br, scene.random(0.3))
          scene.noFill()
          scene.stroke(col)
        }
        if(scene.random()< 0.1 ){
            const col = scene.color(hu, sa, br, scene.random(0.8))
            scene.noFill()
            scene.stroke(col)
        }
        if(scene.random()< 0.01){
          const col = scene.color(hu, 100, scene.randomGaussian(70, 10), 0.2)
          //scene.stroke(col)
          scene.fill(col)
          scene.noStroke()
        }
        if(scene.random()<0.001){
          const col = scene.color(hu, scene.randomGaussian(30, 60), scene.randomGaussian(70, 20), scene.random(0.4))
          scene.stroke(col)
           circ(scene, [x, y, rrr], 1, true, col)
        } else {
          scene.circle(x, y, rrr)
        }
        if(scene.random()<0.05){
          if(lit.length > 0){
            const col = scene.color(ff*360, 20, 20, scene.random(0.01))
            scene.noFill()
            scene.stroke(col)
            lin(scene, ...lit, x, y, scene.random(150), stack, true)
            lit = []
          } else {
            lit = [x, y]
          }
        }
        scene.noStroke()
      }
    }

    function circ(scene, [cx, cy, cr], npts, fast, col){
//      scene.push()
//      scene.strokeWeight(1)
//      const col = scene.color(0, 0, 0 , 0.4)
//      scene.stroke(col)
//      scene.fill(col)
      let innerCol
      if(fast){
        const h = scene.hue(col)
        const s = scene.saturation(col)
        const b = scene.brightness(col)
        const alpha = scene.alpha(col)
        innerCol = scene.color(h, s, b, scene.random(alpha/2))
      }
     for(let i=0;i<100*npts;i++){
        const L = scene.randomGaussian(10*cr, 12)
        const a = 2*PI*i/npts
        const aa = scene.randomGaussian(a, 5./npts)
        const dx = cr*Math.cos(aa)
        const dy = cr*Math.sin(aa)
        const x = cx + dx
        const y = cy + dy
        const N = n(dx, dy)
        const ndx = dy/N
        const ndy = -dx/N
        if(!fast){
          lin(scene, x - L*ndx, y - L*ndy, x + L*ndx, y + L*ndy, scene.randomGaussian(15, 0.3))
        } else {
          scene.stroke(innerCol)
          const f = scene.random(3)
          tapered(scene, x - f*L*ndx, y - f*L*ndy, x + f*L*ndx, y + f*L*ndy, innerCol)
        }
      }
  //    scene.pop()
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
        scene.circle(x, y, 1*cfg.hd)
        scene.noFill()
      }
    }

    s.draw = () => {
        let scene = s.createGraphics(cfg.hd * 1800 << 0, cfg.hd * 1200 << 0)
        W = scene.width, H = scene.height
        let dly = s.createGraphics(W, H)
        scene.randomSeed(cfg.seeder.get())
        scene.noiseSeed(cfg.seeder.get())
        dly.randomSeed(cfg.seeder.get())
        dly.noiseSeed(cfg.seeder.get())

        scene.background("#000912")
        // Here your code against scene and possibly dly
        if (debug && dly) {
            let c = dly.get()
            scene.image(dly, 0, 0)
        }
        scene.push()
        scene.colorMode(s.HSB)
        scene.translate(W/2, H/2)
        scene.scale(0.9)
        circ(scene, [0, 0, 0.05*H], 200)
        scene.pop()
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
        cfg.title = "Big Bang, RB 2023/ \u{1F1E8}\u{1F1ED}"
        cfg.info = "Exploration of circles that went too far"
        cfg.subinfo = "Not fully resolution independent, but not too bad either"
        cfg.s = s
        let R = new Key("r", () => {
          gui.spin(() => {
            cfg.s.clear()
            cfg.s.draw()
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
