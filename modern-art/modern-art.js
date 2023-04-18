import {
  Command,
  GUI,
  Integer,
  Float,
  Key,
  Control
} from '../libraries/gui/gui.js'

import {
  getLargeCanvas,

} from '../libraries/misc.js'

import {
  textile
} from '../libraries/textile.js'

const sketch = (s) => {

  let gui
  let dly
  let debug = false
  let largeCanvas
  let hd = 1
  const PI = s.PI
  s.setup = () => {
    let {
      w,
      h
    } = getLargeCanvas(s, 1600)
    let canvas = s.createCanvas(w, h)
    s.pixelDensity(1)
    canvas.mousePressed(() => {})
    s.frameRate(20)
    gui = createGUI()
    gui.toggle()
    s.noLoop()
  }

  function setLineDash(scene, list) {
    scene.drawingContext.setLineDash(list);
  }

  function patch(scene, x, y, r, dly) {
    scene.push()
    const size = (r + r * scene.random()) << 0
    let drawingMask = s.createGraphics(size, size)
    let cloth = s.createGraphics(size, size)
    cloth.background("red") // This does nothing in the end except remove transparency
    drawingMask.fill("white")
    let thing = (scene) => {
      scene.circle(0, 0, size / 2 << 0)
    }
    drawingMask.push()
    drawingMask.translate(size / 2 << 0, size / 2 << 0)
    thing(drawingMask)
    drawingMask.pop()
    textile(cloth, 0, 0, size, size, 1, 8)
    let c = cloth.get()
    c.mask(drawingMask)
    scene.stroke(s.color(0, 0, 0, 100))
    let ctx = scene.drawingContext
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.shadowBlur = 8
    ctx.shadowColor = "#10101099"
    scene.push()
    scene.translate(x, y)
    scene.image(c, 0, 0)
    scene.translate(size / 2 << 0, size / 2 << 0)
    scene.scale(0.99)
    setLineDash(scene, [3, 5, 3, 5])
    scene.strokeWeight(1.5)
    scene.noFill()
    thing(scene)
    scene.noStroke()
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.shadowBlur = 5
    ctx.shadowColor = "black"
    scene.circle((x + size / 2) << 0, (y + size / 2) << 0, size / 2 << 0)
    scene.pop()
  }

  s.draw = () => {
    const numPixels = hd * s.width * hd * s.height
    let scene = s.createGraphics(hd * s.width, hd * s.height)
    let canvas = s.createGraphics(scene.width, scene.height)
    let dly
    if (debug) {
      dly = s.createGraphics(scene.width, scene.height)
    }
    scene.background(200)
    scene.strokeWeight(30) & scene.stroke("black")
    scene.fill("white")
    let ctx = scene.drawingContext
    ctx.shadowOffsetX = 10
    ctx.shadowOffsetY = 10
    ctx.shadowBlur = 1
    ctx.shadowColor = "#00000099"

    scene.rect(0.1 * scene.width - 50, 0.2 * scene.height - 50, 0.6 * scene.width + 100, 0.6 * scene.height + 100)
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.shadowBlur = 0
    ctx.shadowColor = "white"
    scene.rect(0.1 * scene.width - 50, 0.2 * scene.height - 50, 0.6 * scene.width + 100, 0.6 * scene.height + 100)
    textile(canvas, 0.1 * scene.width, 0.2 * scene.height, 0.6 * scene.width, 0.6 * scene.height, 1, 8, dly)
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2
    ctx.shadowBlur = 2
    ctx.shadowColor = "#00000099"
    let c = canvas.get()
    scene.image(c, 0, 0)
    if (debug) {
      let c = dly.get()
      scene.image(c, 0, 0)
    }
    const w = scene.width
    const h = scene.height
    let x = 0.1 * w + scene.random(0.1 * w)
    let y = 0.2 * h + scene.random(0.1 * h)
    let r = 0.1 * h + scene.random(0.1 * h)
    patch(scene, x << 0, y << 0, r << 0, dly)
    x = 0.3 * w + scene.random(0.1 * w)
    y = 0.3 * h + scene.random(0.1 * h)
    r = 0.2 * h + scene.random(0.1 * h)
    patch(scene, x << 0, y << 0, r << 0, dly)

    // Tag
    ctx.shadowOffsetX = 1
    ctx.shadowOffsetY = 1
    ctx.shadowBlur = 1
    ctx.shadowColor = "#00000033"
    scene.textFont('Helvetica')
    scene.noStroke()
    const l = 0.77
    const t = 0.75
    scene.rect(l * w, t * h, 0.2 * h, 0.1 * h)
    ctx = scene.drawingContext
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.shadowBlur = 0
    scene.noStroke()
    scene.fill("black")
    scene.textSize(0.015 * h)
    scene.text("Ruben Berenguel", (l + 0.008) * w, (t + 0.01) * h, 0.2 * h, 0.1 * h)
    scene.textSize(0.012 * h)
    scene.textStyle(s.BOLD)
    scene.text("Modern art", (l + 0.008) * w, (t + 0.03) * h, 0.2 * h, 0.1 * h)
    scene.textStyle(s.NORMAL)
    scene.text("2023", (l + 0.062) * w, (t + 0.03) * h, 0.2 * h, 0.1 * h)
    scene.text("Algorithm on HTMLCanvas", (l + 0.008) * w, (t + 0.05) * h, 0.2 * h, 0.1 * h)
    scene.textStyle(s.ITALIC)
    scene.text("Simulated cloth and stitch effects", (l + 0.008) * w, (t + 0.07) * h, 0.2 * h, 0.1 * h)
    largeCanvas = scene
    c = scene.get()
    c.resize(s.width, 0)
    s.image(c, 0, 0)
  }


  function createGUI() {
    let info =
      "Tried to improve on my generative embroidery project, and ended up with a very convincing cloth texture. Enriched it with <a href='https://github.com/rvanwijnen/spectral.js'>spectral.js</a> color mixing and using <a href='http://www.complexification.net/gallery/machines/substrate/'>Jared Tarbell's Substrate</a> colours"
    let subinfo = "When I got a stitched patch on I thought it looked like what I'd find in a modern museum, so went all in on the idea. <em>This is designed for landscape only</em>"
    let S = new Key("s", () => {
      largeCanvas.save("img.png")
    })
    let saveCmd = new Command(S, "save the canvas")
    let R = new Key("r", () => {
      gui.spin(() => {
        s.clear();
        s.draw()
        gui.spin();
      });
    });

    let resetCanvas = new Command(R, "reset")

    let incR = new Key(")", () => {})
    let decR = new Key("(", () => {})
    let rInt = new Integer(() => {})
    let rControl = new Control([decR, incR],
      "+/- something", rInt)

    let decH = new Key("(", () => {
      if (hd > 0) {
        hd -= 0.1
      }
    })
    let incH = new Key(")", () => {
      if (hd < 10) {
        hd += 0.1
      }
    })
    let hdInfo = new Float(() => hd)
    let hdControl = new Control([decH, incH],
      "+/- resolution export factor", hdInfo)


    let gui = new GUI("Modern art, RB 2023/04 \u{1F1E8}\u{1F1ED}", info, subinfo, [saveCmd,
        resetCanvas
      ],
      [rControl, hdControl])

    let QM = new Key("?", () => gui.toggle())
    let hide = new Command(QM, "hide this")

    gui.addCmd(hide)
    gui.update()
    return gui
  }

  s.keyReleased = () => {
    gui.dispatch(s.key)
  }
}

p5.disableFriendlyErrors = true
let p5sketch = new p5(sketch)