import {
  Command,
  GUI,
  String,
  Float,
  Key,
  Control
} from '../libraries/gui/gui.js'

import {
  getLargeCanvas
} from '../libraries/misc.js'

import {
  oldieHD
} from '../libraries/effects.js'

// Base to avoid writing always the same

const sketch = (s) => {

  let gui, canvas, inner = 57,
    outer = 74,
    innerH, outerH
  let hd = 1.0
  innerH = inner * hd
  outerH = outer * hd
  let largeCanvas
  s.setup = () => {
    let {
      w,
      h
    } = getLargeCanvas(s, 1600)
    s.pixelDensity(1)
    canvas = s.createCanvas(w, h)
    canvas.mousePressed(() => {})
    s.frameRate(20)
    gui = createGUI()
    gui.toggle(() => {
      gui.spin(() => {
        plot();
        gui.spin();
      });
    });
  }

  function pencil(scene, x, y, inner, outer, leadColor) {
    // Draws a pencil bottom with these parameters. Leadcolor is used
    // for the outer color, lead proper uses a darker shade via color
    // lerping.
    //console.log(`Pencil at ${x}, ${y} (${inner}, ${outer})`)
    let center = {
      x: x,
      y: y
    }
    const [r, g, b] = [s.noise(x, y), s.noise(y, x), s.noise(x + y, y * x)]
    let lightBrown = s.color(224 + 30 * r, 158 + 30 * g, 64 + 30 * b, 100)
    const darkBrown = s.color(151, 95, 49)
    // Outer shell, filled in noised brown-ish
    // Possible improvement: very subtle (1-2 px) curve
    scene.beginShape()
    scene.stroke(leadColor)
    scene.strokeWeight(hd * 4)
    scene.fill(darkBrown)
    for (let i = 0; i < 6; i++) {
      let hex = center.x + outer * s.cos(i * 2.0 * s.PI / 6)
      let hey = center.y + outer * s.sin(i * 2.0 * s.PI / 6)
      scene.vertex(hex, hey)
    }
    scene.endShape(s.CLOSE)
    // Color veins from outside to simulate color bleed from the 
    // outer shell.
    let density = 10
    let factor = 10
    scene.stroke(leadColor)
    for (let i = 0; i <= 5; i++) {
      let x1 = center.x + outer * s.cos(i * 2.0 * s.PI / 6)
      let y1 = center.y + outer * s.sin(i * 2.0 * s.PI / 6)
      let x2 = center.x + outer * s.cos((i + 1) * 2.0 * s.PI / 6)
      let y2 = center.y + outer * s.sin((i + 1) * 2.0 * s.PI / 6)
      scene.strokeWeight(hd * 3 * s.noise(x1, y1))
      for (let j = 0; j < density; j++) {
        let startx = x1 + j * (x2 - x1) / density
        let starty = y1 + j * (y2 - y1) / density
        let dx = center.x - startx
        let dy = center.y - starty
        let norm = Math.sqrt(dx * dx + dy * dy)
        let length = hd * s.noise(startx, starty)
        let endx = startx + dx * length * factor / norm
        let endy = starty + dy * length * factor / norm
        scene.line(startx, starty, endx, endy)
      }
    }
    // Simulating wood grain using a similar trick to what I did
    // in Iris. Lines from out to in, lighter brown with transparency
    density = hd * 30
    factor = 35 * hd
    let shift = 3 * hd
    for (let i = 0; i <= 5; i++) {
      let x1 = center.x + outer * s.cos(i * 2.0 * s.PI / 6)
      let y1 = center.y + outer * s.sin(i * 2.0 * s.PI / 6)
      let x2 = center.x + outer * s.cos((i + 1) * 2.0 * s.PI / 6)
      let y2 = center.y + outer * s.sin((i + 1) * 2.0 * s.PI / 6)
      scene.strokeWeight(hd * 2 * s.noise(x1, y1))
      for (let j = 0; j < density; j++) {
        lightBrown.setAlpha(50 + 10 * s.noise(i, j))
        scene.stroke(lightBrown)
        let squish = s.noise(i, j)
        let startx = x1 + (j + squish) * (x2 - x1) / density
        let starty = y1 + (j + squish) * (y2 - y1) / density
        let dx = center.x - startx
        let dy = center.y - starty
        let norm = Math.sqrt(dx * dx + dy * dy)
        let length = s.noise(startx, starty)
        let endx = startx + dx * length * factor / norm
        let endy = starty + dy * length * factor / norm
        scene.line(startx + dx * shift / norm, starty + dy * shift / norm, endx, endy)
      }
    }
    // Same but coming from inside
    density = hd * 150
    factor = outer
    shift = 0
    for (let i = 0; i <= 5; i++) {
      const x1 = center.x + outer * s.cos(i * 2.0 * s.PI / 6)
      const y1 = center.y + outer * s.sin(i * 2.0 * s.PI / 6)
      const x2 = center.x + outer * s.cos((i + 1) * 2.0 * s.PI / 6)
      const y2 = center.y + outer * s.sin((i + 1) * 2.0 * s.PI / 6)
      scene.strokeWeight(hd * s.noise(y1, x1))
      for (let j = 0; j < density; j++) {
        lightBrown.setAlpha(30 + 10 * s.noise(i * x, j))
        scene.stroke(lightBrown)
        const endx = x1 + j * (x2 - x1) / density
        const endy = y1 + j * (y2 - y1) / density
        const dx = endx - center.x
        const dy = endy - center.y
        const norm = Math.sqrt(dx * dx + dy * dy)
        const length = s.noise(i, j)
        scene.line(center.x + dx * shift / norm, center.y + dy * shift / norm, center.x + dx * length / norm * factor, center.y + dy * length / norm * factor)
      }
    }
    // Wiggly inner lead, similar to the main color in iris, using
    // a poorly closed curve
    const black = s.color(0)
    const darkLead = s.lerpColor(leadColor, black, 0.2)
    const evenDarkerLead = s.color(leadColor, black, 0.4)
    const adjustedLength = inner / 20
    scene.beginShape()
    for (let i = 0; i < 50; i++) {
      const angle = i * s.TWO_PI / 50
      const colour = s.lerpColor(darkLead, evenDarkerLead, s.random())
      scene.fill(darkLead)
      scene.stroke(evenDarkerLead)
      const r = inner / 2 + adjustedLength * s.noise(x * y * i)
      scene.curveVertex(x + r * Math.cos(angle), y + r * Math.sin(angle))
    }
    scene.endShape(s.CLOSE)
  }

  function plot() {
    outer = outerH * hd
    inner = innerH * hd

    let scene = s.createGraphics(hd * s.width, hd * s.height)
    scene.background(s.color(0))
    let arch = outer - outer * Math.sqrt(3) / 2;
    const hgap = outer + 2 * outer + 6 * hd
    const vgap = outer - arch + 2 * hd
    // Set up for an hexagonal grid with a very mild gap between
    // each pencil
    for (let i = 0; i <= scene.width / hgap + 1; i++) {
      for (let j = 0; j <= scene.height / vgap + 1; j++) {
        const hshift = j % 2 == 0 ? -2 * hd : outer / 2 + outer + 1 * hd
        const vshift = j % 2 != 0 ? 0 : 0
        pencil(scene, i * hgap + hshift, j * vgap + vshift, inner, outer, s.color(200 * s.noise(i * j), 200 * s.noise(i, j), 200 * s.noise(j, i)))
      }

    }
    // This granulate is based on a blog post, link in the source.
    // Granulating improves the wooden feeling by a lot. This is the 
    // same effect I used for the "old cloth feel" in 80s. It's super
    // slow though
    oldieHD(s, scene, 0.1 * hd, hd, s.MULTIPLY)
    largeCanvas = scene
    let c = scene.get()
    c.resize(s.width, 0)
    s.image(c, 0, 0)
  }

  s.draw = () => {
    s.noLoop()
  }

  function createGUI() {
    let info =
      "Inspired by <a href=\"https://twitter.com/meezwhite/status/1611791711969181697?s=12&t=ym-awO5tGUYR8G03Ua4bww\">this</a> Genuary entry by <a href=\"https://twitter.com/meezwhite\">meezwhite</a>"
    let subinfo = "Tap the canvas to enable the controls below<br/>Very high resolutions can fail depending on the browser"
    let S = new Key("s", () => {
      largeCanvas.save("img.png")
    })
    let saveCmd = new Command(S, "save the canvas")
    let R = new Key("r", () => {
      gui.spin(() => {
        canvas.clear()
        largeCanvas.clear()
        s.noiseSeed(s.random(-100, 100))
        plot();
        gui.spin();
      });
    });
    let resetCanvas = new Command(R, "redraw")

    let incR = new Key(")", () => {
      innerH += 5
      outerH += 7
    })
    let decR = new Key("(", () => {
      if (innerH > 5) {
        innerH -= 5
        outerH -= 7
      }
    })
    let rInner = new String(() => innerH + "/" + outerH)
    let rInnerControl = new Control([decR, incR],
      "+/- inner/outer radius", rInner)
    let decH = new Key(",", () => {
      if (hd > 0) {
        hd -= 0.1
      }
    })
    let incH = new Key(".", () => {
      if (hd < 10) {
        hd += 0.1
      }
    })
    let hdInfo = new Float(() => hd)
    let hdControl = new Control([decH, incH],
      "+/- resolution export factor", hdInfo)

    let gui = new GUI("Pencils, RB 2023/03", info, subinfo, [saveCmd,
        resetCanvas
      ],
      [rInnerControl, hdControl])

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