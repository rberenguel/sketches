import {
  createBaseGUI,
  Command,
  GUI,
  Integer,
  Float,
  Boolean,
  Key,
  Control,
  Seeder
} from '../libraries/gui/gui.js'

import {
  getLargeCanvas,
  addText,
  smoothStep
} from '../libraries/misc.js'

import {
  ctxGranulateChannels
} from '../libraries/effects.js'

import {
  easeInSq
} from '../libraries/eases.js'

const sketch = (s) => {

  let gui, debug = false,
    maskIt = true
  let largeCanvas
  let cfg = {
    hd: 1.5,
    seeder: undefined,
    largeCanvas: undefined
  }
  let monoid
  const white = s.color(255, 255, 255)
  const black = s.color("#000")

  const neonBlue = s.color("#00fbff")
  const neonOrange = s.color("#ff9f00")
  const neonPink = s.color("#f400ff")
  const neonGreen = s.color("#1aff00")

  s.preload = () => {
    monoid = s.loadFont("../libraries/fonts/Monoid-Retina.ttf")
  }

  s.setup = () => {
    let {
      w,
      h
    } = getLargeCanvas(s, 1600)
    let canvas
    if (w > h) {
      canvas = s.createCanvas(w, h)
    } else {
      canvas = s.createCanvas(w, w / 1.4)
    }
    s.pixelDensity(1)
    canvas.mousePressed(() => {})
    s.frameRate(20)
    s.noLoop()
    cfg.seeder = new Seeder()
    gui = createGUI()
    gui.toggle()
  }

  s.draw = () => {
    scenery()
  }

  function copyColor(color) {
    const r = s.red(color)
    const g = s.green(color)
    const b = s.blue(color)
    const a = s.alpha(color)
    return s.color(r, g, b, a)
  }

  const sunParams = (scene) => {
    return {
      x: 0.6 * scene.width,
      y: 0.4 * scene.height,
      r: 0.35 * scene.height
    }
  }

  function drawShootingStar(scene, params) {
    // Simple shooting star
    const x = 0.4 * scene.width * scene.random(0.8, 1.1)
    const y = 0.3 * scene.height * scene.random(0.8, 1.1)
    const length = scene.random(150 * cfg.hd, 250 * cfg.hd)
    const angle = -scene.random(0.8, 1.2) * Math.PI / 4
    scene.push()
    scene.strokeWeight(cfg.hd * 1)
    for (let i = 1; i < length; i++) {
      for (let j = 0; j < 200; j++) {
        if (scene.random() < .5 / i) {
          const r = scene.random(220, 250)
          const g = scene.random(200, 250)
          const b = scene.random(200, 250)
          const color = s.color(r, g, b, 10)
          scene.stroke(color)
          scene.fill(color)
          const R = 5 * scene.random(1 / i)
          const th = scene.random(0, 2 * Math.PI)
          scene.circle(x + i * Math.cos(angle) + R * Math.cos(th), y + i * Math.sin(angle) + R * Math.sin(th), 1.5 * cfg.hd)
        }
      }
    }
    scene.pop()
  }


  function drawStarfield(scene, params) {
    scene.push()
    scene.fill(neonGreen)
    let c = copyColor(neonGreen)
    let ctx = scene.drawingContext
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.shadowBlur = 1
    ctx.shadowColor = neonGreen
    scene.noStroke()
    for (let i = 0; i < scene.width; i++) {
      for (let j = 0; j < params.bottom; j++) {
        const n = scene.random()
        const f = Math.floor(n * 15000)
        if (f == 1 || f == 42) {
          const rr = 10 * cfg.hd * easeInSq(scene.random())
          for (let k = 0; k < 10; k++) {
            const a = smoothStep(0, 10, k)
            const r = smoothStep(0, 10, k)
            c.setAlpha(a * 255)
            scene.fill(c)
            scene.circle(i, j, (1 - r) * rr)
          }
        }
      }
    }
    scene.pop()
  }

  function glowLine(scene, x1, y1, x2, y2, color, r) {
    // I like this better than using context shadow
    let colorCopy = s.color(s.red(color), s.green(color), s.blue(color), s.alpha(color))
    colorCopy.setAlpha(0)
    const steps = 3 * r
    for (let i = 1; i < steps; i++) {
      scene.strokeWeight(cfg.hd * r * i / steps)
      scene.stroke(s.color(s.red(color), s.green(color), s.blue(color), 5))
      scene.line(x1, y1, x2, y2)
    }
    scene.strokeWeight(cfg.hd * 0.5)
    scene.stroke(color)
    scene.line(x1, y1, x2, y2)
  }

  function drawMountain(scene, params, back) {
    scene.push()
    scene.strokeJoin(scene.ROUND)
    let color = copyColor(neonBlue)
    if (back) {
      scene.scale(0.9)
      scene.translate(0, 0.11 * params.bottom)
      color.setAlpha(200)
    } else {
      scene.scale(1.1)
      scene.translate(0, -0.09 * params.bottom)
    }
    scene.stroke(color)
    scene.strokeWeight(cfg.hd * 1)
    let ctx = scene.drawingContext
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.shadowBlur = 12
    ctx.shadowColor = color
    scene.fill(0)
    if (debug) scene.strokeWeight(cfg.hd * 1)
    scene.beginShape()
    for (const p of params.ridge) {
      scene.vertex(p[0], p[1])
    }
    scene.endShape()

    scene.strokeWeight(cfg.hd * 1)
    scene.stroke(color)
    scene.fill(0)


    // First level of slopes
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.shadowBlur = 10


    let slope = -1.1 * scene.random(Math.PI / 16, Math.PI / 8)
    let sign = params.sign ? params.sign : scene.random(-1, 1) > 0 ? 1 : -1
    slope *= sign

    for (let i = 0; i < params.ridge.length; i++) {
      if (i % 2 == 1) {
        // Has to be a peak
        let localSlope = slope
        let cx = params.ridge[i][0]
        let cy = params.ridge[i][1]
        let slopeL = [params.ridge[i - 1][0] - cx, params.ridge[i - 1][1] - cy]
        let slopeR = [params.ridge[i + 1][0] - cx, params.ridge[i + 1][1] - cy]
        cy = cy
        const nrmL = Math.sqrt(slopeL[0] * slopeL[0] + slopeL[1] * slopeL[1]) // unused
        const nrmR = Math.sqrt(slopeR[0] * slopeR[0] + slopeR[1] * slopeR[1]) // unused		  

        for (let j = 0; j < 3; j++) {
          const maxHeight = params.bottom - cy
          let r = scene.random(0.3 * maxHeight, 0.5 * maxHeight)
          localSlope *= 1.35 * scene.random(0.8, 1.1)
          if (j == 2) {
            r = maxHeight
          }
          let x = cx + r * Math.sin(localSlope)
          let y = cy + r * Math.cos(localSlope)
          if (debug) {
            // TODO Missing code to prevent outliers
            scene.push()
            scene.stroke("red")
            scene.strokeWeight(cfg.hd * 15)
            scene.point(cx, cy)
            scene.pop()
          }
          scene.strokeWeight(cfg.hd * 2)
          scene.line(cx, cy, x, y) // Down line

          // (Faint) Moon/sun glow against the ridges 
          scene.push()
          let shift = 7
          let glowNeonOrange = copyColor(neonOrange)
          scene.strokeWeight(cfg.hd * shift + Math.floor(shift / 2))
          glowNeonOrange.setAlpha(15)
          scene.stroke(glowNeonOrange)
          scene.line(cx + shift, cy + shift, x + shift, y + shift)
          scene.pop()
          scene.push()
          shift = 3
          glowNeonOrange = copyColor(neonOrange)
          scene.strokeWeight(cfg.hd * (shift + shift / 2))
          glowNeonOrange.setAlpha(15)
          scene.stroke(glowNeonOrange)
          scene.line(cx + shift, cy + shift, x + shift, y + shift)
          scene.pop()

          const L = scene.random(0.2 / (j + 1), 0.3 / (j + 1))
          let mul = nrmL <= nrmR ? nrmL : nrmR
          mul *= scene.random(0.7, 0.9)
          if (j == 2) {
            continue
          }

          scene.line(x, y, x + mul * L, y + mul * L)
          scene.line(x, y, x - mul * L, y + mul * L)
          cx = x
          cy = y
        }
      }
    }

    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.shadowBlur = 10
    ctx.shadowColor = white

    if (debug) scene.noFill()
    if (debug) scene.strokeWeight(cfg.hd * 1)
    scene.beginShape()
    scene.noFill()
    for (const p of params.ridge) {
      scene.vertex(p[0], p[1])
    }
    scene.endShape()
    scene.pop()
  }

  function drawTerrain(scene, params) {
    const numLines = scene.random(15, 25)
    const gap = scene.width / numLines
    scene.stroke(neonPink)
    scene.strokeWeight(cfg.hd * 2)
    let ctx = scene.drawingContext
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.shadowBlur = 0

    for (let i = 0; i < 8 * numLines; i++) {
      const end = i * gap
      glowLine(scene, sunParams(scene).x, 0.5 * scene.height, 6 * scene.width - 2 * end, 1.5 * scene.height, neonPink, 15)
    }
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.shadowBlur = 0

    scene.fill(0)
    scene.noStroke()
    scene.rectMode(scene.CORNERS)
    scene.rect(0, 0, scene.width, params.bottom)
    scene.strokeWeight(cfg.hd * 5)
    scene.stroke(neonBlue)
    scene.line(0, params.bottom, scene.width, params.bottom)
  }

  function drawSun(scene) {
    let ctx = scene.drawingContext
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.shadowBlur = 0
    const sun = sunParams(scene)
    let maskSun = s.createGraphics(scene.width, scene.height)
    maskSun.clear()
    maskSun.noStroke()
    let alphaWhite = s.color(200, 200, 200, 100)
    for (let i = 0; i < 100; i++) {
      const a = smoothStep(0, 100, i)
      const alpha = (1 + 100 * a) << 0
      alphaWhite.setAlpha(alpha)
      const f = a * 0.93 + (1 - a) * 1.1
      maskSun.fill(alphaWhite)
      maskSun.circle(sun.x, sun.y, sun.r * f)
    }
    maskSun.fill("#00000000")
    maskSun.circle(sun.x, sun.y, sun.r * 0.93)
    let sunG = s.createGraphics(scene.width, scene.height)
    sunG.rectMode(s.CORNERS)
    sunG.fill(black)
    sunG.noStroke()
    sunG.rect(0, 0, scene.width, scene.height)
    let startY = sun.y - scene.random(0.8, 1.0) * sun.r / 8
    sunG.fill(neonOrange)
    sunG.rect(0, 0, sunG.width, startY)
    const inc = sun.r / 12
    for (let i = 0; i < 10; i++) {
      startY += scene.random(0.9, 1.0) * inc
      if (i % 2 == 0) {
        sunG.fill(neonOrange)
        sunG.rect(0, startY, sunG.width, startY + inc)
      }
    }
    let c = sunG.get()
    c.mask(maskSun)
    scene.image(c, 0, 0)
  }

  function generateRidge(scene, params) {
    // Draws a mountain ridge with pure 45 degree angles.
    // Given a bottom line and two points L left, R right,
    // fits a mountain ridge in a right angle triangle with
    // top at x=(R+L)/2 Enable debug to see the bounding triangle.
    // When the tracing reaches a point out of the bounding, pull it
    // to the edge and finish.
    // This is an improved version on 70s-Logo
    scene.strokeWeight(cfg.hd * 15)
    scene.stroke(white)

    scene.stroke("red")
    let ridge = [
      [params.left, params.bottom]
    ]
    let peaks = Math.floor(scene.random(1, 3)) * 2 + 1
    let peakSpan = (params.right - params.left) / peaks

    let up = true
    const sqr2 = Math.sqrt(2) / 2
    if (debug) scene.point(params.left, params.bottom)
    let rise = params.bottom // The next peak or valley
    let ridgeLeft = params.left // and where it starts from
    if (debug) {
      scene.push()
      scene.strokeWeight(cfg.hd * 6)
      scene.noFill()
      scene.triangle(params.left, params.bottom, params.right, params.bottom, params.left + (params.right - params.left) / 2, params.bottom - (params.right - params.left) / 2)
      scene.pop()
    }
    let finished = false
    while (ridgeLeft < params.right) {
      if (finished) break
      if (debug) scene.strokeWeight(cfg.hd * 15)
      if (ridgeLeft > params.right) {
        ridgeLeft = params.right
      }
      let next
      if (up) {
        next = scene.random(0.5 * peakSpan, 0.9 * peakSpan)
      } else {
        next = scene.random(0.3 * peakSpan, 0.5 * peakSpan)
      }
      ridgeLeft = ridgeLeft + next
      if (up) {
        rise = rise - next
        if (debug) scene.point(ridgeLeft, rise)
        up = false
      } else {
        rise = rise + next
        if (debug) scene.point(ridgeLeft, rise)
        up = true
      }
      // This is the case of "next point is outside the BTriangle"
      if (params.bottom - rise > (params.right - ridgeLeft)) {
        finished = true
        if (debug) {
          scene.stroke("blue")
          scene.point(ridgeLeft, rise)
        }
        const mid = (rise + params.bottom - (params.right - ridgeLeft)) / 2
        if (debug) {
          scene.stroke("yellow")
          scene.point(ridgeLeft, mid)
        }
        const diff = mid - rise
        rise = rise + diff
        ridgeLeft -= diff
        if (debug) {
          scene.stroke("green")
          scene.point(ridgeLeft, rise)
        }
      }

      ridge.push([ridgeLeft, rise])
    }
    ridge.push([params.right, params.bottom])
    scene.stroke("red")
    if (debug) scene.point(params.right, params.bottom)
    if (debug) scene.strokeWeight(cfg.hd * 6)
    return ridge
  }

  function scenery() {
    const numPixels = cfg.hd * s.width * cfg.hd * s.height
    let scene = s.createGraphics(Math.floor(cfg.hd * s.width), Math.floor(cfg.hd * s.height))
    let backdrop = s.createGraphics(cfg.hd * s.width, cfg.hd * s.height)
    scene.randomSeed(cfg.seeder.get())
    backdrop.randomSeed(cfg.seeder.get())
    let ctx = scene.drawingContext
    scene.background(0)

    const top = 0.25 * scene.height
    const left = 0.25 * scene.width
    const right = 0.75 * scene.width
    const bottom = 0.6 * scene.height

    let params = {
      left: left,
      top: top,
      bottom: bottom,
      right: right,
    }

    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.shadowBlur = 10
    ctx.shadowColor = white

    const ridges = [generateRidge(scene, params), generateRidge(scene, params), generateRidge(scene, params)]
    params.sign = scene.random(-1, 1) > 0 ? 1 : -1
    drawTerrain(scene, params)
    drawStarfield(scene, params)
    scene.randomSeed(cfg.seeder.get())
    drawShootingStar(scene)
    scene.randomSeed(cfg.seeder.get())
    if (!maskIt) {
      params.ridge = ridges[1]
      scene.push()
      scene.translate(0.3 * scene.width, 0)
      drawMountain(scene, params, true)
      scene.pop()
      params.ridge = ridges[2]
      scene.push()
      scene.translate(-0.2 * scene.width, 0)
      drawMountain(scene, params, true)
      scene.pop()
    }
    params.ridge = ridges[0]
    drawSun(scene)
    drawMountain(scene, params, false)
    const maskCircleParams = {
      x: scene.width / 2,
      y: 0.4 * scene.height,
      r: 0.75 * scene.height
    }
    let maskCircle = s.createGraphics(scene.width, scene.height)
    maskCircle.clear()
    maskCircle.stroke(white)
    maskCircle.fill(white)
    maskCircle.circle(maskCircleParams.x, maskCircleParams.y, maskCircleParams.r + 10)
    if (debug) {
      scene.strokeWeight(cfg.hd * 5)
      scene.stroke(black)
      scene.noFill()
      scene.circle(scene.width / 2, 0.4 * scene.height, 0.75 * scene.height)
    }

    let c = scene.get()
    if (!debug && maskIt) c.mask(maskCircle)
    s.background(255, 0)
    backdrop.background(255, 0)

    backdrop.image(c, 0, 0)
    const darkgr = "#404040"
    backdrop.stroke(darkgr)
    backdrop.noFill()
    backdrop.strokeWeight(16 * cfg.hd)
    if (maskIt) backdrop.circle(maskCircleParams.x, maskCircleParams.y, maskCircleParams.r)

    // The code below is quite messy, I could reuse the same config but didn't bother with it.
    // Stole the circular signature from 70s Patch, which I ported to the new GUI earlier.
    const textCfg = {
      s: s,
      scene: backdrop,
      hd: cfg.hd,
      fontsize: 9,
      font: monoid,
      shadowColor: "darkgray",
      color: "white"
    }
    const identifier = `#${cfg.seeder.hex()}@${cfg.hd.toPrecision(2)}`
    if (!maskIt) {
      addText(textCfg, scene.width - 10, textCfg.fontsize * cfg.hd + 3, identifier)
      addText(textCfg, scene.width - 10, textCfg.fontsize * cfg.hd * 2 + 3 * cfg.hd, "rb'23")
    } else {
      const textParams = {
        x: maskCircleParams.x,
        y: maskCircleParams.y,
        r: maskCircleParams.r,
        fontsize: 9,
        font: monoid,
        shadowColor: "darkgray",
        color: "white"
      }
      addTextCircle(backdrop, textParams, identifier + " | rb'23")
    }
    c = backdrop.get()
    cfg.largeCanvas = backdrop
    c.resize(s.width, 0)
    s.image(c, 0, 0)
  }

  function addTextCircle(scene, params, content) {
    scene.push()
    scene.noStroke()
    scene.fill(params.color)
    scene.textAlign(s.CENTER)
    scene.textFont(params.font, cfg.hd * params.fontsize)
    let ctx = scene.drawingContext
    ctx.shadowOffsetX = 1
    ctx.shadowOffsetY = 1
    ctx.shadowBlur = 1
    ctx.shadowColor = params.shadow //cfg.shadow
    const nr = 1.008 * params.r / 2
    const ftf = Math.cos(s.PI / 4)
    const arcW = cfg.hd * params.fontsize / nr // Correction factor for spacing
    for (let i = 0; i < content.length; i++) {
      scene.push()
      const char = content[i]
      const arcPos = s.PI / 4 - i * arcW
      let x = params.x + nr * Math.cos(arcPos)
      let y = params.y + nr * Math.sin(arcPos)
      scene.translate(x, y)
      scene.rotate(-s.PI / 2 + arcPos)
      scene.text(char, 0, 0)
      scene.pop()
    }
    scene.pop()
  }

  function bezierer(scene, anchor1, control1, control2, anchor2) {
    scene.beginShape()
    scene.vertex(anchor1[0], anchor1[1])
    scene.bezierVertex(control1[0], control1[1], control2[0], control2[1], anchor2[0], anchor2[1])
    scene.endShape()
    if (debug) {
      scene.push()
      scene.strokeWeight(cfg.hd * 15)
      scene.stroke("#EEEE00")
      scene.point(anchor1[0], anchor1[1])
      scene.stroke("#EE0000")
      scene.point(anchor2[0], anchor2[1])
      scene.stroke("#00EE00")
      scene.point(control1[0], control1[1])
      scene.stroke("#0000EE")
      scene.point(control2[0], control2[1])
      scene.pop()
    }
  }


  const createGUI = (gui) => {
    cfg.title = "Synthwave, RB 2023/04"
    cfg.info = "Reusing some  code from 70s-Patch but improving some parts, particularly the mountains"
    cfg.subinfo = "This goes well with <a href='https://gavinharrisonsounds.bandcamp.com/track/groove-overload'>Groove overload</a> by Gavin Harrison<br/>Very high resolutions can fail depending on the browser"
    cfg.s = s
    let R = new Key("r", () => {
      gui.spin(() => {
        cfg.s.clear()
        scenery()
        gui.spin()
        gui.unmark()
        gui.update()
      })
    })

    let resetCanvas = new Command(R, "reset")

    let M = new Key("m", () => {
      maskIt = !maskIt;
      R.action()
    })

    let maskItBool = new Boolean(() => maskIt)
    let maskItBoolControl = new Control([M], "masking?",
      maskItBool)


    cfg.commands = [resetCanvas, cfg.seeder.command]
    cfg.controls = [cfg.seeder.control, maskItBoolControl]

    gui = createBaseGUI(cfg)
    return gui
  }

  s.keyReleased = () => {
    gui.dispatch(s.key)
  }
}

p5.disableFriendlyErrors = false
let p5sketch = new p5(sketch)