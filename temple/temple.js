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
  oldieHD
} from '../libraries/effects.js'

import {
  canvasRGBA
} from '../libraries/3rdparty/stackblur.js'


const sketch = (s) => {

  let gui
  let debug = true
  let dly // Base debug layer, if used

  let cfg = {
    hd: 1,
    seeder: undefined,
    largeCanvas: undefined
  }

  let R
  
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
    gui.toggle()
    R.action()
  }

  const dist = (p, q) => {
    return (p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y)
  }

  function shadow(scene, fig, sun) {
    const eps = 1e-8
    let min = 1000000
    let closer
    for (let p of fig) {
      let d = dist(p, sun)
      if (d < min) {
        closer = p
        min = d
      }
    }

    let tans = []

    for (let p of fig) {
      if (p == closer) {
        //continue
      }
      const vvx = p.x - sun.x
      const vvy = p.y - sun.y
      const tan = scene.atan2(vvy, vvx)
      const v = p5.Vector.fromAngle(tan)
      let d = dist(p, sun)
      tans.push({
        p: p,
        d: d,
        tan: tan,
        v: v
      })
    }
    tans.sort((a, b) => a.tan - b.tan)
    const p0 = tans[0]
    const p1 = tans[3]

    scene.push()
    scene.fill(0)
    scene.beginShape()
    scene.vertex(p0.p.x + 100000 * p0.v.x, p0.p.y + 100000 * p0.v.y)
    scene.vertex(p0.p.x, p0.p.y)
    scene.vertex(p1.p.x, p1.p.y)
    scene.vertex(p1.p.x + 100000 * p1.v.x, p1.p.y + 100000 * p1.v.y)
    scene.endShape(s.CLOSE)
    scene.pop()
    scene.push()
    scene.strokeWeight(3)
    scene.stroke(scene.color(64, 58, 48))
    const hvx = 0.5 * (100000 * p0.v.x + 100000 * p1.v.x)
    const hvy = 0.5 * (p0.p.y + 100000 * p0.v.y + p1.p.y + 100000 * p1.v.y)
    scene.line(p0.p.x, 0.5 * (p0.p.y + p1.p.y), p0.p.x + hvx, 0.5 * (p0.p.y + p1.p.y) + hvy)
    scene.pop()

  }

  function sqfigr(scene, maxs) {
    let ur = {
      x: scene.random(0.1 * W, 0.5 * W),
      y: scene.random(0.1 * H, 0.9 * H)
    }
    return sqfig(scene, ur, maxs)
  }

  function sqfig(scene, ur, maxs) {
    return [
      ur, {
        x: ur.x + maxs,
        y: ur.y
      }, {
        x: ur.x + maxs,
        y: ur.y + maxs
      }, {
        x: ur.x,
        y: ur.y + maxs
      }
    ]
  }


  function plot() {
    let scene = s.createGraphics(cfg.hd * s.width << 0, cfg.hd * s.height << 0)
    W = scene.width, H = scene.height
    let dly = s.createGraphics(W, H)
    scene.randomSeed(cfg.seeder.get())
    scene.noiseSeed(cfg.seeder.get())
    dly.randomSeed(cfg.seeder.get())
    dly.noiseSeed(cfg.seeder.get())

    scene.colorMode(s.HSB)

    if (debug && dly) {
      let c = dly.get()
      scene.image(dly, 0, 0)
    }

    const sun = {
      x: scene.random(0.1 * W, 1.9 * W),
      y: scene.random(0, H)
    }


    let figs = []
    
    let ctx = scene.drawingContext

    let x = scene.random(0.05 * W, 0.2 * W)
    scene.noStroke()
    const gradient1 = ctx.createLinearGradient(0, H / 2 << 0, sun.x, H / 2 << 0)
    const h1 = scene.random(10, 350)
    const h2 = scene.random(0.3 * h1, 0.7 * h1)
    const c1 = scene.color(h1, 10, 10) // dark
    const c2 = scene.color(h2, 10, 100) // bright    
    gradient1.addColorStop(0, c1)
    gradient1.addColorStop(1, c2)

    ctx.fillStyle = gradient1

    const firstSize = scene.random(30, 50)
    const secondSize = firstSize / scene.random(1.5, 3)

    scene.rectMode(s.CORNERS)
    scene.rect(0, 0, x + 30 * cfg.hd << 0, H)
    const stepping = (H / scene.random(8, 15)) << 0
    for (let i = 0; i < H; i += 4 * stepping) {
      let ur = {
        x: x,
        y: i
      }
      figs.push(sqfig(scene, ur, secondSize * cfg.hd << 0))
    }

    x += 0.2 * W
    scene.rect(0, 0, W, H)
    x += 0.2 * W
    scene.rect(0, 0, W, H)
    for (let i = 0; i < H; i += stepping) {
      let ur = {
        x: x,
        y: i
      }
      figs.push(sqfig(scene, ur, firstSize * cfg.hd))
    }

    x += 0.4 * W
    for (let i = 0; i < H; i += stepping) {
      let ur = {
        x: x,
        y: i
      }
      figs.push(sqfig(scene, ur, firstSize * cfg.hd))
    }
    const hor = (W / 15)
    const ver = (H / 15)
    scene.strokeWeight(3 * cfg.hd << 0)
    scene.stroke(scene.color(27, 55, 10, 0.8))
    for (let j = 0; j < H; j += ver) {
      for (let i = 0; i < W; i += hor) {
        if (scene.random() > 0.3) {
          const shift = j % 2 == 0 ? 0.5 * hor << 0 : 0
          const s = (0.5 * shift + scene.random(0, 0.25 * hor))
          const e = (scene.random(0, 0.25 * hor))
          const h = (scene.random(-6, 6))
          scene.line(i + s, j + h, i + 0.5 * hor + e, j + h)
        }
        if (scene.random() > 0.3) {
          const shift = j % 2 == 0 ? 0.5 * hor << 0 : 0
          const s = (0.5 * shift + scene.random(0, 0.25 * hor))
          const e = (scene.random(0, 0.25 * hor))
          const h = (scene.random(-6, 6))
          scene.line(i, j + 0.5 * s, i, j + e)
        }

      }
    }


    scene.fill(0)
    for (let fig of figs) {
      scene.beginShape()
      for (let p of fig) {
        scene.vertex(p.x, p.y)
      }
      scene.endShape(s.CLOSE)
      shadow(scene, fig, sun)
    }

    canvasRGBA(scene.canvas, 0, 0, W, H, Math.max(3, 2 + (0.5 + cfg.hd) << 0))
    oldieHD(s, scene, 0.4, cfg.hd*cfg.hd, s.HARD_LIGHT)

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
    cfg.title = "Temple, RB 2023/05 \u{1F1E8}\u{1F1ED}"
    cfg.info = "Not a lot going on in here"
    cfg.subinfo = "Inspired by what became 'Impossible Distance' by <a href='https://twitter.com/ippsketch/status/1645884276158636040?s=61&t=8Ko3mXJTcDWYao4IgQoBBg'>Ippsketch</a>.<br/>I liked a lot the shadow concept, but here just wanted a quick shot, so the shadows are not even properly computed. Just convincingly enough so. <br/>Very high resolutions can fail depending on the browser"
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