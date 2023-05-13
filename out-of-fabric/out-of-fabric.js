import {
  Command,
  GUI,
  Integer,
  Float,
  Key,
  Control,
  Seeder,
  createBaseGUI
} from '../libraries/gui/gui.js'

import {
  getLargeCanvas,
  releaseCanvas,
  mod,
  signature
} from '../libraries/misc.js'

import {
  textile
} from '../libraries/textile.js'

import {
  canvasRGBA
} from '../libraries/3rdparty/stackblur.js'

import {
  dateTo19Encoding
} from '../libraries/compactTime.js'


const sketch = (s) => {

  let gui
  const PI = s.PI
  let R

  let cfg = {
    hd: 1.0,
    seeder: undefined,
    largeCanvas: undefined
  }

  let cachedRedCloth = []
  let cachedBlueCloth, cachedGreenCloth

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
    s.frameRate(1)
    s.noLoop()
    cfg.seeder = new Seeder()
    gui = createGUI()
    gui.toggle()
    gui.fetch()
    R.action()
  }

  const hsb2rgb = (foo, c) => {
    let r, g, b, i, f, p, q, t
    const h = c.h / 360.0
    const s = c.s / 100.0
    const v = c.b / 100.0


    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
      case 0:
        r = v, g = t, b = p;
        break;
      case 1:
        r = q, g = v, b = p;
        break;
      case 2:
        r = p, g = v, b = t;
        break;
      case 3:
        r = p, g = q, b = v;
        break;
      case 4:
        r = t, g = p, b = v;
        break;
      case 5:
        r = v, g = p, b = q;
        break;
    }
    return `rgb(${(255*r)<<0}, ${(255*g)<<0}, ${(255*b)<<0})`
  }


  function applique(s, scene, cloth, drawer, w, h, transf, x, y) {
    // Generates a canvas texture running cloth(canvas, w, h) translated to x, y
    // Generates a clipping mask running drawer(mask, 1) translated to the center
    // Drawer can't set up any coloring or stroke
    // Will sew the cloth to scene.
    // transf.canvas[] will contain transformations to canvas
    // transf.mask[] will contain transformations to mask
    let d, f
    let canvas = s.createGraphics(w, h)
    let mask = s.createGraphics(w, h)
    let shadow = s.createGraphics(w, h)
    canvas.randomSeed(cfg.seeder.get())
    canvas.noiseSeed(cfg.seeder.get())
    mask.randomSeed(cfg.seeder.get())
    mask.noiseSeed(cfg.seeder.get())
    shadow.randomSeed(cfg.seeder.get())
    shadow.noiseSeed(cfg.seeder.get())
    let ctx
    const mx = scene.width / 2
    const my = scene.height / 2
    scene.push()
    scene.translate(-w / 2, -h / 2)
    scene.translate(x, y)
    canvas.translate(w / 2, h / 2)
    mask.translate(w / 2, h / 2)
    if (transf && transf.canvas) {
      transf.canvas(canvas)
    }
    // Resolution independent shadow
    shadow.translate(w / 2, h / 2)
    shadow.fill("#10101090")
    shadow.stroke("#10101090")
    drawer(shadow, 1.04)
    ctx = shadow.drawingContext
    // Trick because Safari has no ctx.filter(blur)
    canvasRGBA(shadow.canvas, 0, 0, w, h, 5 * cfg.hd)
    scene.image(shadow, 0, 0)

    // Cut applique out of canvas
    cloth(canvas, w, h)
    mask.fill("white")
    mask.translate(0, 0)
    drawer(mask, 1)
    ctx = mask.drawingContext
    ctx.globalCompositeOperation = 'source-in'
    mask.image(canvas, -w / 2, -h / 2)
    scene.image(mask, 0, 0)

    // Stitch shadow and stitches
    scene.push()
    f = cfg.hd
    if (transf && transf.stitchScaleCorrection) {
      f *= 1.0 / transf.stitchScaleCorrection
    }
    scene.translate(w / 2, h / 2)
    ctx = scene.drawingContext
    ctx.setLineDash([3 * f << 0, 5 * f << 0, 3 * f << 0, 5 * f << 0])
    scene.stroke("#10101030")
    scene.noFill()
    scene.strokeWeight(4 * f << 0)
    drawer(scene, 0.97)
    scene.stroke("#10101090")
    scene.strokeWeight(1 * f << 0)
    drawer(scene, 0.97)
    scene.pop()
    scene.pop()

    releaseCanvas(shadow)
    releaseCanvas(mask)
    releaseCanvas(canvas)

    shadow.remove()
    mask.remove()
    canvas.remove()
  }

  function petal(scene, angle, scale) {
    scene.push()
    if (scale !== undefined) {
      scene.scale(scale)
    }
    scene.rotate(angle)
    const anch1 = [10, -10]
    const anch2 = [-10, -10]
    const ctrl1 = [100, -110]
    const ctrl2 = [-100, -110]
    const ctrl3 = [0, -15]
    const ctrl4 = [0, -15]
    scene.beginShape()
    scene.vertex(...anch1)
    scene.bezierVertex(...ctrl1, ...ctrl2, ...anch2)
    scene.bezierVertex(...ctrl3, ...ctrl4, ...anch1)
    scene.endShape()
    scene.pop()
  }


  function gaussianHSB(scene, h, s, b, sigma) {
    const _hue = scene.randomGaussian(h, sigma)
    const _sat = mod(scene.randomGaussian(s, sigma), 100)
    const _bri = mod(scene.randomGaussian(b, sigma), 100)
    const hue = _hue < 0 ? _hue + 360 : _hue
    const c = {
      h: hue << 0,
      s: _sat << 0,
      b: _bri << 0
    }
    return c
  }

  function flower(scene, x, y, _scale, shift) {
    let transf = {}
    scene.push()
    // No cloth caching: 3.2 seconds, caching: 0.6 sec
    if (!cachedRedCloth || cachedRedCloth.length < 5) {
      cachedRedCloth.push(s.createGraphics(600 * cfg.hd, 600 * cfg.hd))
      const l = cachedRedCloth.length
      cachedRedCloth[l - 1].randomSeed(cfg.seeder.get())
      cachedRedCloth[l - 1].noiseSeed(cfg.seeder.get())
      const r1 = hsb2rgb(scene, gaussianHSB(scene, 0, 70, 70, 15))
      const r2 = hsb2rgb(scene, gaussianHSB(scene, 0, 70, 70, 15))
      const r3 = hsb2rgb(scene, gaussianHSB(scene, 0, 70, 70, 15))
      textile(cachedRedCloth[l - 1], 0, 0, 600 * cfg.hd, 600 * cfg.hd, 1, 8, [r1, r2, r3])
    }
    transf.stitchScaleCorrection = _scale
    for (let i = 0; i < 6; i++) {
      const a = i * PI / 3 + shift
      let angle = scene.random(a - PI / 37, a + PI / 37)
      transf.canvas = (e) => {
        e.rotate(angle) & e.translate(-300 * cfg.hd, -300 * cfg.hd)
      }
      const c = (e, w, h) => {
        const l = cachedRedCloth.length
        e.image(cachedRedCloth[e.random(l - 1) << 0], 0, 0)
      }
      const d = (e, scale) => petal(e, angle + shift, scale * _scale) //wtf
      applique(s, scene, c, d, 600 * cfg.hd, 600 * cfg.hd, transf, x, y)
    }
    if (!cachedBlueCloth) {
      cachedBlueCloth = s.createGraphics(300 * cfg.hd, 300 * cfg.hd)
      cachedBlueCloth.randomSeed(cfg.seeder.get())
      cachedBlueCloth.noiseSeed(cfg.seeder.get())
      const b1 = hsb2rgb(scene, gaussianHSB(scene, 240, 70, 50, 5))
      const b2 = hsb2rgb(scene, gaussianHSB(scene, 240, 70, 50, 5))
      const b3 = hsb2rgb(scene, gaussianHSB(scene, 240, 70, 50, 5))
      textile(cachedBlueCloth, 0, 0, 300 * cfg.hd, 300 * cfg.hd, 1, 8, [b1, b2, b3])
    }
    transf.stitchScaleCorrection = _scale * 0.5
    for (let i = 0; i < 5; i++) {
      const a = i * 0.4 * PI + shift
      let angle = scene.random(a - PI / 37, a + PI / 37)
      transf.canvas = (e) => {
        e.rotate(angle) & e.translate(-150 * cfg.hd, -150 * cfg.hd)
      }
      const c = (e, w, h) => {
        e.image(cachedBlueCloth, 0, 0)
      }
      const d = (e, scale) => petal(e, angle, 0.5 * scale * _scale)
      applique(s, scene, c, d, 300 * cfg.hd, 300 * cfg.hd, transf, x, y)
    }
    transf.canvas = (e) => {
      e.translate(-50 * cfg.hd, -50 * cfg.hd)
    }
    transf.stitchScaleCorrection = _scale

    cachedGreenCloth = s.createGraphics(scene.width, scene.height)
    cachedGreenCloth.randomSeed(cfg.seeder.get())
    cachedGreenCloth.noiseSeed(cfg.seeder.get())

    textile(cachedGreenCloth, 0, 0, 100 * cfg.hd, 100 * cfg.hd, 1, 8, [...greens()])


    const greenClother = (e, w, h) => {
      e.image(cachedGreenCloth, 0, 0)
    }
    const drawer = (e, scale) => {
      e.push()
      e.scale(scale)
      e.circle(0, 0, 25 * Math.sqrt(cfg.hd))
      e.pop()
    }
    applique(s, scene, greenClother, drawer, 100, 100, transf, x, y)
    scene.pop()
  }

  function drawStalk(scene, scale) {
    scene.push()
    scene.translate(0, -150)
    if (scale) {
      scene.scale(scale)
    }
    const W = scene.width
    const H = scene.height
    let anc1 = [0, 400]
    let ctl1 = [10, 350]
    let ctl2 = [10, 250]
    let anc2 = [0, 200]
    scene.beginShape()
    scene.vertex(...anc1)
    scene.bezierVertex(...ctl1, ...ctl2, ...anc2)
    ctl1 = [-10, 150]
    ctl2 = [-10, 50]
    anc2 = [0, 0]
    scene.bezierVertex(...ctl1, ...ctl2, ...anc2)
    anc1 = [-5, 0]
    ctl1 = [-15, 50]
    ctl2 = [-15, 150]
    anc2 = [-5, 200]
    scene.vertex(...anc1)
    scene.bezierVertex(...ctl1, ...ctl2, ...anc2)
    ctl1 = [5, 250]
    ctl2 = [5, 350]
    anc2 = [-5, 400]
    scene.bezierVertex(...ctl1, ...ctl2, ...anc2)
    scene.endShape(s.CLOSE)
    scene.pop()
  }

  function drawLeaf(scene, scale) {
    scene.push()
    scene.translate(0, -150)
    if (scale) {
      scene.scale(scale)
    }
    const W = scene.width
    const H = scene.height

    let anc1 = [0, 220]
    let ctl1 = [10, 240]
    let ctl2 = [10, 240]
    let anc2 = [30, 150]
    scene.beginShape()
    scene.vertex(...anc1)
    scene.bezierVertex(...ctl1, ...ctl2, ...anc2)
    scene.endShape(s.CLOSE)
    scene.pop()
  }

  function stalk(scene, x, y, scale) {
    scene.push()
    let transf = {}
    transf.canvas = (e) => {
      e.translate(-300 * cfg.hd, -300 * cfg.hd)
    }
    transf.stitchScaleCorrection = scale

    cachedGreenCloth = s.createGraphics(scene.width, scene.height)
    cachedGreenCloth.randomSeed(cfg.seeder.get())
    cachedGreenCloth.noiseSeed(cfg.seeder.get())

    textile(cachedGreenCloth, 0, 0, 400 * cfg.hd, scene.height, 1, 8, [...greens()])


    const greenClother = (e, w, h) => {
      e.image(cachedGreenCloth, 0, 0)
    }
    const drawer = (e) => { // WHAAAT
      e.push()
      drawStalk(e, scale)
      e.pop()
    }
    applique(s, scene, greenClother, drawer, scene.width, scene.height, transf, x, y)
    scene.pop()
  }

  function drawBase(scene, scale) {
    scene.push()
    const W = scene.width
    const H = scene.height
    scene.translate(0, 0)
    if (scale) {
      scene.scale(scale)
    }
    let anc1 = [-0.5 * W, 0]
    let ctl1 = [-0.2 * W, -0.01 * H]
    let ctl2 = [0.2 * W, -0.02 * H]
    let anc2 = [0.5 * W, 0]
    scene.beginShape()
    scene.vertex(-0.5 * W, H)
    scene.vertex(...anc1)
    scene.bezierVertex(...ctl1, ...ctl2, ...anc2)
    scene.vertex(0.5 * W, H)
    scene.endShape(s.CLOSE)

    scene.pop()
  }


  function base(scene, x, y, scale) {
    scene.push()
    let transf = {}
    transf.canvas = (e) => {
      e.translate(-0.5 * scene.width, -0.2 * scene.height)
    }
    transf.stitchScaleCorrection = scale
    cachedGreenCloth = s.createGraphics(scene.width, scene.height)
    cachedGreenCloth.randomSeed(cfg.seeder.get())
    cachedGreenCloth.noiseSeed(cfg.seeder.get())

    textile(cachedGreenCloth, 0, 0, scene.width, scene.height / 2, 1, 8, [...greens()])

    const greenClother = (e, w, h) => {
      e.image(cachedGreenCloth, 0, 0)
    }
    const drawer = (e) => {
      e.push()
      drawBase(e, scale)
      e.pop()
    }
    applique(s, scene, greenClother, drawer, scene.width, scene.height, transf, x, y)
    scene.pop()
  }

  const greens = () => {
    const g1 = hsb2rgb(s, gaussianHSB(s, 140, 70, 40, 5))
    const g2 = hsb2rgb(s, gaussianHSB(s, 115, 70, 40, 5))
    const g3 = hsb2rgb(s, gaussianHSB(s, 130, 70, 40, 5))
    const g4 = hsb2rgb(s, gaussianHSB(s, 120, 70, 40, 3))
    return [g1, g2, g3, g4]
  }

  function leaf(scene, x, y, scale, rot) {
    scene.push()
    scene.rotate(rot)
    let transf = {}
    transf.canvas = (e) => {
      e.translate(-300 * cfg.hd, -300 * cfg.hd)
    }
    transf.stitchScaleCorrection = scale
    textile(cachedGreenCloth, 0, 0, 400 * cfg.hd, scene.height, 1, 8, [...greens()])
    const greenClother = (e, w, h) => {
      e.image(cachedGreenCloth, 0, 0)
    }
    const drawer = (e) => { // WHAAAT
      e.push()
      drawLeaf(e, scale)
      e.pop()
    }
    applique(s, scene, greenClother, drawer, scene.width, scene.height, transf, x, y)
    scene.pop()
  }

  function plot() {
    let scene = s.createGraphics(1800 * cfg.hd, 1200 * cfg.hd)
    scene.randomSeed(cfg.seeder.get())
    scene.noiseSeed(cfg.seeder.get())
    let redCloth
    let petalMask

    textile(scene, 0, 0, scene.width, scene.height, 1, 8)

    const flowers = scene.random(6, 12) << 0
    let gap = scene.width / flowers
    let gaps = [scene.random(0.8 * gap, 1.2 * gap)]
    for (let i = 1; i < flowers; i++) {
      const next = scene.random(0.8 * gap, 1.2 * gap)
      const step = gaps[i - 1] + next
      if (step > 0.9 * scene.width) {
        break
      }
      gaps.push(step)
    }
    scene.push()
    scene.translate(0, -0.15 * scene.height)
    for (let gap of gaps) {
      const scale = scene.random(0.8, 1.2)
      scene.push()
      scene.translate(0, 0.15 * scene.height / scale)
      stalk(scene, gap, 0.5 * scene.height, scale)
      const rotL = scene.random(0, 0.01)
      const rotF = scene.random(0, 0.01)
      leaf(scene, gap, 0.5 * scene.height, scale, rotL)
      flower(scene, gap, 0.35 * scene.height, scale, rotF)
      scene.pop()
    }
    scene.pop()
    scene.randomSeed(cfg.seeder.get())
    scene.noiseSeed(cfg.seeder.get())
    cachedGreenCloth = undefined
    base(scene, 0.5 * scene.width, 0.6 * scene.height, 1)
    cachedGreenCloth = undefined
    base(scene, 0.5 * scene.width, 0.8 * scene.height, 1)

    const now = new Date()
    const timeSignature = dateTo19Encoding(now).toUpperCase()
    const identifier = `#${cfg.seeder.hex()}@${cfg.hd.toPrecision(2)}(${timeSignature})`
    const sigCfg = {
      s: s,
      scene: scene,
      color: "#e1e856",
      shadow: "#b3ba32",
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
    cfg.title = "Out of fabric, RB 2023/05"
    cfg.info = "For some reason the green fabric in the base will <i>always</i> be random regardless of seed. I can't figure out why (after all, the code is similar for any other applique in the piece).<br/>Resolution controls are disabled because placement is broken at the moment: flowers and stalks are disjoint in higher resolutions."
    cfg.subinfo = "This generative cloth was a <i>happy accident</i> trying to do something else. I created the applique effect as an experiment (which I applied to <a href='../modern-art/'>Modern Art</a>) and here I tried to take it further. I don't think I'll push more: this is very memory intensive and to save memory (to have more appliques) I converted the code into a crazy mess that barely works. There is heavy fabric caching, which shows as repeated patterns in petals. But that would happen exactly the same with real cloth: you waste nothing!"
    cfg.skipHD = true
    cfg.s = s
    R = new Key("r", () => {
      gui.spin(() => {
        cfg.s.clear()
        cachedRedCloth = []
        cachedBlueCloth = undefined
        cachedGreenCloth = undefined
        plot()
        gui.spin()
        gui.unmark()
        gui.update()
      })
    })

    let resetCanvas = new Command(R, "redraw")


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