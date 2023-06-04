// 5C0D looks pretty nice

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
  solarizedDark,
} from '../libraries/palettes.js'

import {
  oldieHD,
} from '../libraries/effects.js'

const sketch = (s) => {

  let gui, R

  let cfg = {
    hd: 1,
    seeder: undefined,
    largeCanvas: undefined
  }

  let W, H

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

  function d([x, y, r1], [p, q, r2]){
    return Math.sqrt((x-p)*(x-p)+(y-q)*(y-q))
  }

  function pseudoblue() {
    // The pseudo-blue noise function by Fil https://observablehq.com/@fil/pseudoblue
    const xmix = (x, y) => ((x * 212281 + y * 384817) & 0x5555555) * 0.003257328990228013;
    const ymix = (x, y) => ((x * 484829 + y * 112279) & 0x5555555) * 0.002004008016032064;
    const s = 6;
    let a, b;
    return (x, y) => {
      let v = 0;
      for (let i = 0; i < s; ++i) {
        b = y;
        a = 1 & (x ^ xmix((x >>= 1), (y >>= 1)));
        b = 1 & (b ^ ymix(x, y));
        v = (v << 2) | (a + (b << 1) + 1) % 4;
      }
      return v / (1 << (s << 1));
    };
  }

  function plot() {
    let scene = s.createGraphics(cfg.hd * 1800 << 0, cfg.hd * 1200 << 0)
    W = scene.width, H = scene.height

    let cv = s.createGraphics(W, H)
    let dly = s.createGraphics(W, H)
    scene.randomSeed(cfg.seeder.get())
    scene.noiseSeed(cfg.seeder.get())

    scene.colorMode(s.RGB, 1.0)
    cv.colorMode(s.RGB, 1.0)
    cv.fill(0.15)
    cv.background(0.87)
    let circles = []
    for(let i=0;i<12;i++){
      // Lazy circle packing
      const x = scene.random(0.1*W, 0.9*W)
      const y = scene.random(0.1*H, 0.9*H)
      const r = scene.random(0.05*H, 0.3*H)
      let valid = true
      for(let circle of circles){
        const dis = d([x, y, r], circle) 
        const rr = circle[2]
        if(dis < r+rr+Math.min(r, rr)/2){
          valid = false
          break
        }
      }
      if(valid){
        circles.push([x, y, r])
      } else {
        i--
        continue
      }
    }
    for(let circle of circles){
      cv.circle(...circle)
    }
    const blu = pseudoblue()
    let ps = []
    const factor = 4
    cv.loadPixels()
    // Blue noise dithering without dithering.
    // Tweaked to have some "error" (that 0.9 factor)
    for(let i=0;i<W;i+=factor){
      for(let j=0;j<H;j+=factor){
        const f = blu(i, j)
        const index = 4 * (j * W + i);
        const r = cv.pixels[index]
        const g = cv.pixels[index+1]
        const b = cv.pixels[index+2]
        const gr = (r+g+b)/(3.0*255.0)
        if(gr < 0.9*f){
          scene.stroke(0)
          scene.fill(0)
          ps.push([i, j])
        } else {
          scene.stroke(100)
          scene.fill(100)
        }
      }
    }
    scene.stroke(0)
    scene.fill(0)
    scene.colorMode(s.HSB, 360, 100, 100, 1)
    scene.background(solarizedDark.base02)
    for(let j=0;j<30000;j++){
      const p1 = scene.random(ps.length) << 0
      const p2 = scene.random(ps.length) << 0
      const weight = 1*cfg.hd << 0
      scene.strokeWeight(weight >= 1 ? weight : 1)
      const _h = 90+360*scene.noise(j/10000)
      const h = _h > 360 ? _h - 360 : _h
      const s = scene.random(50, 100)
      const b = scene.random(70, 100)
      const alpha = 0.05+0.25*scene.noise(j/10000)
      let color 
      scene.noFill()
      if(scene.random()<0.8){
        const _hh = h + 90
        const hh = _hh > 360 ? _hh - 360 : _hh
        let color2
        if(scene.random()<0.5){
          color2 = scene.color(hh, s*2.0, b, alpha)
        } else {
          color2 = scene.color(hh, s/3.0, b, alpha)
        }
        scene.stroke(color2)
        if(scene.random()<0.3){
          const weight = 3*cfg.hd << 0
          scene.strokeWeight(weight >= 1 ? weight : 1)
        }
        scene.circle(...ps[p1], scene.random(5, 20)*cfg.hd << 0)
        scene.circle(...ps[p2], scene.random(5, 20)*cfg.hd << 0)
      } else {
        if(scene.random()<0.3){
          color = scene.color(h, s*3.0, b, alpha)
        } else {
          color = scene.color(h, s, b, alpha)
        }
        scene.stroke(color)
        scene.line(...ps[p1], ...ps[p2])
      }
    }

    // Add a texture, makes it look better at high res particularly
    oldieHD(s, scene, 0.1, cfg.hd, s.HARD_LIGHT)


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
    cfg.title = "Ideas, RB 2023/6 \u{1F1E8}\u{1F1ED}"
    cfg.info = "Lately I'm in \"circles\"."
    cfg.subinfo = "Not fully resolution independent because I use a blue noise function on almost every pixel, and that depends on the resolution. Added a texture overlay because otherwise it felt a bit too flat when zoomed"
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
