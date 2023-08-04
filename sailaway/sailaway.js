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
    signature,
    smoothStep
} from '../libraries/misc.js'

import {
  c82GeoPrimesPalette
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
    
    const hr = (scene, h, sig) => scene.randomGaussian(h, sig) + 360 % 360
    const sr = (scene, s, sig) => scene.randomGaussian(s, sig) + 100 % 100
    const br = (scene, b, sig) => scene.randomGaussian(b, sig) + 100 % 100
 
    function circ(scene, [cx, cy], [cw, ch]){
      //scene.circle(x, y, r)
      const steps = 200
      const repeats = 50
      scene.push()
      scene.rectMode(s.CORNERS)
      scene.ellipseMode(s.CORNERS)
      scene.colorMode(s.HSB)
      const baseHue = scene.random(0, 360)
      scene.noFill()
      for(let rep=0;rep<repeats;rep++){
        const k = smoothStep(0, repeats, rep)
        for(let i=0; i<steps;i++){
          const alpha = scene.random(0.01, 0.05)
          const color = scene.color(hr(scene, baseHue, 2), sr(scene, 1, 3), br(scene, 95, 2), alpha)
          scene.fill(color)
          scene.noStroke()
          const x = cx + scene.randomGaussian(k*0.5*cw, 0.15*cw)*Math.cos(i*2*PI/steps)
          const y = cy + scene.randomGaussian(k*0.5*ch, 0.15*ch)*Math.sin(i*2*PI/steps)
          //scene.circle(x, y, 3)
          const dx = scene.random(0.05*cw, 0.19*cw) << 0
          const dy = scene.random(0.05*cw, 0.19*cw) << 0
          const w  = scene.random(0.05*cw, 0.19*cw) << 0
          const h  = scene.random(0.05*cw, 0.19*cw) << 0
          if(scene.random() < 0.5){
            scene.rect(x-dx, y-dy, x-dx+w, y-dy+h)
          } else {
            scene.ellipse(x-dx, y-dy, x-dx+w, y-dy+h)
          }
        }
      }
      scene.pop()
    }

    function cloudySun(scene, [W, H]){
      scene.push()
      let clouds = []
      for(let items=0; items < 25; items++){
        const x = scene.random(-0.1*W, 1.1*W)
        const y = scene.random(-0.1*H, 0.6*H)
        const w = scene.random(0.15*H, 0.3*H)
        const h = scene.random(0.2*w, 0.6*w)
        clouds.push([x, y, w, h])
      }
      scene.noStroke()
      let mx = 0, my = 0, cnt = 0
      for(let cloud of clouds){
        let [x, y] = cloud
        mx += x
        my += y
        cnt += 1
      }
      mx /= cnt
      my /= cnt
      for(let layer=0; layer<100; layer++){
        const halo = smoothStep(0, 100, layer)
        const color = scene.color(60, 90, 105, 1. - 0.999*halo)
        scene.fill(color)
        scene.circle(mx, my, 0.08*H+0.1*H*halo)
      }
      for(let cloud of clouds){
        let [x, y, w, h] = cloud
        circ(scene, [x, y], [w, h])
      }
      scene.pop()
      return [mx, my, 0.15*H]
    }

    function sea(scene, [ux, uy], [bx, by], [sunx, suny, sunr]){
      scene.push()
      scene.ellipseMode(s.RADIUS)
      scene.noStroke()
      //scene.rect(ux, uy, bx, by)
      const repeats = 25
      const factor = sunr/100
      const WSTEPS = factor*100 << 0
      const HSTEPS = factor*100 << 0 
      for(let reps=0;reps<repeats;reps++){
        for(let i=0;i<HSTEPS;i++){
          for(let j=0;j<WSTEPS;j++){
            const sea = [hr(scene, 195, 1), sr(scene, 70, 2), br(scene, 60, 8)]
            const alpha = scene.random(0.03, 0.08)
            scene.fill(scene.color(...sea, alpha))
            const x = bx + j*(ux-bx)/WSTEPS + scene.randomGaussian(0, 4*factor)
            const y = by + i*(uy-by)/HSTEPS + scene.randomGaussian(0, 4*factor)
            const w = scene.random(6*factor, 12*factor)
            const h = scene.random(0.2*w, 0.5*w)
            const diff = Math.abs(x-sunx) 
            if(diff < sunr){
              const sunnySea = [hr(scene, 60, 1), sr(scene, 70, 2), br(scene, 60, 8)]
              const smoo = 1.0 -smoothStep(0, sunr, diff)
              if(scene.random()<0.08*smoo){
                scene.fill(scene.color(...sunnySea, alpha))
              }
            }
            scene.push()
            scene.translate(x, y)
            scene.rotate(scene.random(-0.03, 0.03))
            scene.ellipse(0, 0, w, h)
            scene.pop()
          }
        }
      }
     scene.pop()
    }

    function paperShip(scene, [x, y], size){
      scene.push()
      scene.colorMode(s.HSB)
      scene.strokeJoin(s.ROUND)
      const stroke = [hr(scene, 0, 3), sr(scene, 0, 3), br(scene, 50, 5)]
      scene.strokeWeight(cfg.hd*1.5)
      scene.stroke(...stroke)
      const fill = [hr(scene, 192, 3), sr(scene, 5, 5), br(scene, 103, 1)]
      scene.fill(...fill)
      scene.translate(x, y)
      scene.rotate(scene.random(-0.02, 0.02))
      const baseL = [-0.5*size, 0.5*size]
      const baseR = [0.5*size, 0.5*size]
      const baseLL = [-0.7*size, 0.5*size]
      const baseRR = [0.7*size, 0.5*size]
      const flatL = [-size, 0]
      const flatR = [size, 0]
      const top = [0, -size/3]
      const vTR = [baseRR[0]-top[0], baseRR[1]-top[1]]
      const l = -top[1]/vTR[1]
      const evR = [top[0]+l*vTR[0], top[1]+l*vTR[1]]
      const evL = [-evR[0], evR[1]]
      scene.triangle(...evL, ...top, ...evR)
      scene.quad(...baseL, ...baseR, ...flatR, ...flatL)
      scene.pop()
    }

    s.draw = () => {
      let scene = s.createGraphics(cfg.hd * 1800 << 0, cfg.hd * 1200 << 0)
      W = scene.width, H = scene.height
      let dly = s.createGraphics(W, H)
      scene.randomSeed(cfg.seeder.get())
      scene.noiseSeed(cfg.seeder.get())
      dly.randomSeed(cfg.seeder.get())
      dly.noiseSeed(cfg.seeder.get())

      // Here your code against scene and possibly dly
      if (debug && dly) {
        let c = dly.get()
        scene.image(dly, 0, 0)
      }
      scene.colorMode(s.HSB)
      const sky = [hr(scene, 190, 4), sr(scene, 42, 5), br(scene, 90, 2)]
      scene.background(scene.color(...sky))
      const sun = cloudySun(scene, [W, H])
      const px = scene.random(0.3*W, 0.6*W)
      const py = scene.random(0.7*H, 0.9*H)
      const siz = scene.random(0.08*H, 0.105*H)
      sea(scene, [-0.05*H, 0.7*H], [1.01*W, 1.01*H], sun)
      paperShip(scene, [px, py], siz)
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
        cfg.title = "Sail away, RB 2023/08 \u{1F1E8}\u{1F1ED}"
        cfg.info = "Started adding some very translucent rectangles in circles, got clouds for some reason and then, this happened."
        cfg.subinfo = "Very high resolutions can fail depending on the browser"
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
