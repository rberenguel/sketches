import {
  Command,
  GUI,
  Integer,
  Boolean,
  Key,
  Control
} from '../libraries/gui/gui.js'

import {
  getLargeCanvas
} from '../libraries/misc.js'

import {
  ctxGranulateChannels
} from '../libraries/effects.js'

// Base to avoid writing always the same

const sketch = (s) => {

  let gui, debug = false,
    bBlack = true

  const sun = s.color("#993333")
  const mount = s.color("#9999EE")
  const white = s.color(255, 255, 255)
  const black = s.color("#000")
  const darkBrown = s.color(151, 95, 49)
  const cyan = s.color(0, 250, 250)
  const sea = s.color("#03199a")
  const sunColor = s.color("#f26d50")
  const sunColorWithAlpha = s.color("#f26d50")

  const neonBlue = s.color("#00fbff")
  const neonOrange = s.color("#ff9f00")
  const neonPink = s.color("#f400ff")
  const neonGreen = s.color("#1aff00")

  s.setup = () => {
    let {
      w,
      h
    } = getLargeCanvas(s, 1600)
    let canvas = s.createCanvas(w, h)
    canvas.mousePressed(() => {})
    s.frameRate(20)
    gui = createGUI()
    gui.toggle()
  }

  s.draw = () => {
    s.noLoop()
    scenery()
  }

  function copyColor(color){
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

  function drawStarfield(scene, params) {
    scene.push()
    scene.fill(neonGreen)
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
          scene.circle(i, j, s.random(0, 3))
        }
      }
    }
    scene.pop()
  }

  function glowLine(scene, x1, y1, x2, y2, color, r) {
    let colorCopy = s.color(s.red(color), s.green(color), s.blue(color), s.alpha(color))
    colorCopy.setAlpha(0)
    const steps = 3 * r
    for (let i = 1; i < steps; i++) {
      scene.strokeWeight(r * i / steps)
      scene.stroke(s.color(s.red(color), s.green(color), s.blue(color), 5))
      scene.line(x1, y1, x2, y2)
    }
    scene.strokeWeight(0.5)
    scene.stroke(color)
    scene.line(x1, y1, x2, y2)
  }

  function drawMountain(scene, params) {
    scene.strokeJoin(scene.ROUND)

    scene.stroke(neonBlue)
    scene.strokeWeight(1)
    let ctx = scene.drawingContext
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.shadowBlur = 12
    ctx.shadowColor = neonBlue
    scene.fill(0)
    if (debug) scene.strokeWeight(1)
    scene.beginShape()
    for (const p of params.ridge) {
      scene.vertex(p[0], p[1])
    }
    scene.endShape()

    scene.strokeWeight(1)
    scene.stroke(neonBlue)
    scene.fill(0)


    // First level of slopes
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.shadowBlur = 10

    
    let slope = -1.1*s.random(Math.PI / 16, Math.PI / 8)
    let sign = s.random(-1, 1) > 0 ? 1 : -1
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
          let r = s.random(0.3 * maxHeight, 0.5 * maxHeight)
          localSlope *= 1.35*s.random(0.8, 1.1)
          if (j == 2) {
            r = maxHeight
          }
          let x = cx + r * Math.sin(localSlope)
          let y = cy + r * Math.cos(localSlope)
          scene.strokeWeight(2)
          scene.line(cx, cy, x, y) // Down line
          // Moon/sun glow against the ridges 
          scene.push()
          let shift = 7   
          let glowNeonOrange = copyColor(neonOrange)
          scene.strokeWeight(shift + Math.floor(shift/2))
          glowNeonOrange.setAlpha(15)
          scene.stroke(glowNeonOrange)
          scene.line(cx + shift, cy+shift, x + shift, y+shift)          
          scene.pop()
          scene.push()
          shift = 3   
          glowNeonOrange = copyColor(neonOrange)
          scene.strokeWeight(shift + shift /2)
          glowNeonOrange.setAlpha(15)
          scene.stroke(glowNeonOrange)
          scene.line(cx + shift, cy+shift, x + shift, y+shift)          
          scene.pop()
          
          const L = s.random(0.2 / (j + 1), 0.3 / (j + 1)) 
          let mul = nrmL <= nrmR ? nrmL : nrmR
          mul *= s.random(0.7, 0.9)
          if(j==2){
            continue
          }
          
          scene.line(x, y, x + mul*L, y + mul*L)
          scene.line(x, y,  x - mul*L, y + mul*L)
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
    if (debug) scene.strokeWeight(1)
    scene.beginShape()
    scene.noFill()
    for (const p of params.ridge) {
      scene.vertex(p[0], p[1])
    }
    scene.endShape()
  }

  function drawTerrain(scene, params) {
    const numLines = s.random(15, 45)
    const gap = scene.width / numLines
    scene.stroke(neonPink)
    scene.strokeWeight(2)
    let ctx = scene.drawingContext
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.shadowBlur = 0
    //ctx.shadowColor = white

    for (let i = 0; i < numLines; i++) {
      const end = i * gap
      //scene.line(scene.width/2, 0, end, scene.height)
      glowLine(scene, scene.width / 2, 0, end, scene.height, neonPink, 15)
    }
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.shadowBlur = 0

    scene.fill(0)
    scene.noStroke()
    scene.rectMode(scene.CORNERS)
    scene.rect(0, 0, scene.width, params.bottom)
  }

  function drawSun(scene) {
    const sun = sunParams(scene)
    
    let maskSun = s.createGraphics(scene.width, scene.height)
    maskSun.clear()
    maskSun.stroke(white)
    maskSun.fill(white)
    maskSun.circle(sun.x, sun.y, sun.r)
    let sunG = s.createGraphics(scene.width, scene.height)
    sunG.fill(black)        
    sunG.rect(0, 0, scene.width, scene.height)            
    sunG.fill(neonOrange)            
    sunG.rectMode(s.CORNERS)
    let startY = sun.y - s.random(0.8, 1.0)*sun.r/8
    sunG.rect(0, 0, scene.width, startY)
    const inc = sun.r/12
    for(let i=0; i<10;i++){
      startY += s.random(0.9, 1.0)*inc
      if(i%2==0){
        sunG.fill(neonOrange)        
        sunG.rect(0, startY, scene.width, startY+inc)
      }
    }
    let c = sunG.get()
    c.mask(maskSun)
    scene.image(c, 0, 0)
    
    return
    let ctx = scene.drawingContext
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.shadowBlur = 10
    ctx.shadowColor = white


    scene.fill(0)
    scene.stroke(neonOrange)
    if (debug) scene.noFill()
    scene.strokeWeight(2)
    if (debug) scene.strokeWeight(1)
    scene.stroke(white)
    scene.circle(sun.x, sun.y, sun.r)
    if (debug) scene.strokeWeight(1)
    scene.strokeWeight(2)
    scene.stroke(neonOrange)
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = -3
    ctx.shadowBlur = 10
    ctx.shadowColor = neonOrange
    if (debug) scene.noFill()
    scene.circle(sun.x, sun.y, sun.r)
  }

  function generateRidge(scene, params) {
    // Draws a mountain ridge with pure 45 degree angles.
    // Given a bottom line and two points L left, R right,
    // fits a mountain ridge in a right angle triangle with
    // top at x=(R+L)/2 Enable debug to see the bounding triangle.
    // When the tracing reaches a point out of the bounding, pull it
    // to the edge and finish.
    scene.strokeWeight(15)
    scene.stroke(white)

    scene.stroke("red")
    let ridge = [
      [params.left, params.bottom]
    ]
    let peaks = Math.floor(s.random(1, 3)) * 2 + 1
    let peakSpan = (params.right - params.left) / peaks

    let up = true
    const sqr2 = Math.sqrt(2) / 2
    if (debug) scene.point(params.left, params.bottom)
    let rise = params.bottom // The next peak or valley
    let ridgeLeft = params.left // and where it starts from
    if (debug) {
      let w = scene.strokeWeight()
      scene.strokeWeight(6)
      scene.noFill()
      scene.triangle(params.left, params.bottom, params.right, params.bottom, params.left + (params.right - params.left) / 2, params.bottom - (params.right - params.left) / 2)
      scene.strokeWeight(w)
    }
    let finished = false
    while (ridgeLeft < params.right) {
      if (finished) break
      if (debug) scene.strokeWeight(15)
      if (ridgeLeft > params.right) {
        ridgeLeft = params.right
      }
      let next
      if (up) {
        next = s.random(0.5 * peakSpan, 0.9 * peakSpan)
      } else {
        next = s.random(0.3 * peakSpan, 0.5 * peakSpan)
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
    if (debug) scene.strokeWeight(6)
    return ridge
  }

  function scenery() {
    let scene = s.createGraphics(s.width, s.height)
    let ctx = scene.drawingContext



    scene.background(0)

    const top = 0.25 * scene.height
    const left = 0.25 * scene.width
    const right = 0.75 * scene.width
    const bottom = 0.6 * scene.height



    // Sky
    let params = {
      left: left,
      top: top,
      bottom: bottom,
      right: right,
    }

    //sky(scene, params)

    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.shadowBlur = 10
    ctx.shadowColor = white

    const ridge = generateRidge(scene, params)
    params.ridge = ridge

    drawTerrain(scene, params)
    drawStarfield(scene, params)
    drawSun(scene)
    drawMountain(scene, params)
    //clouds(scene, params)
    //waves(scene, params)


    let maskCircle = s.createGraphics(scene.width, scene.height)
    maskCircle.clear()
    maskCircle.stroke(white)
    maskCircle.fill(white)
    maskCircle.circle(scene.width / 2, 0.4 * scene.height, 0.75 * scene.height)
    if (debug) {
      scene.strokeWeight(5)
      scene.stroke(black)
      scene.noFill()
      scene.circle(scene.width / 2, 0.4 * scene.height, 0.75 * scene.height)
    }
    ctxGranulateChannels(scene, [30, 30, 30, 0], false)
    let c = scene.get()
    if (!debug) c.mask(maskCircle)
    if (bBlack) {
      s.background(0, 255)
    } else {
      s.background(255, 0)
    }
    s.image(c, 0, 0)
    s.loadPixels()
  }

  function bezierer(scene, anchor1, control1, control2, anchor2) {
    scene.beginShape()
    scene.vertex(anchor1[0], anchor1[1])
    scene.bezierVertex(control1[0], control1[1], control2[0], control2[1], anchor2[0], anchor2[1])
    scene.endShape()
    if (debug) {
      scene.push()
      scene.strokeWeight(15)
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

  function sky(scene, params) {
    const bandColors = [s.color("#3e9cbf"), s.color("#a7ecf2"), s.color("#f2c43d"), s.color("#f17c37"), sunColor]
    const bands = bandColors.length

    const skyBandHeight = s.random(30, 80)
    const skyHeight = s.random(0.9 * params.top, 0.5 * params.top)
    const spanV = params.bottom - params.top
    const spanH = params.right - params.left
    for (let i = 0; i < bands; i++) {
      const currentColor = bandColors[i]
      scene.fill(currentColor)
      scene.stroke(currentColor)
      scene.strokeWeight(skyBandHeight)
      const start = scene.width * (1.1 - Math.cos(0.5 * Math.PI / (i + 3)))
      const end = scene.width * (Math.cos(0.5 * Math.PI / (i + 3)) - 0.1)
      scene.line(start, skyHeight + i * spanV / bands, end, skyHeight + i * spanV / bands + 2)
    }
  }


  function wave(scene, params) {
    scene.beginShape()
    const ut = scene.random(1.1, 1.3)
    const us = scene.random(1.5, 1.7)
    const tt = scene.random(2.2, 2.3)
    const fh = 500
    const eh = 800
    scene.vertex(params.left, ut * params.bottom)
    scene.bezierVertex(ut * params.left, fh, us * params.left, ut * fh, s.width / 2, tt * params.top)
    scene.bezierVertex(us * params.left, eh, ut * params.left, eh * ut, params.left, ut * params.bottom)
    scene.endShape()
  }

  function waves(scene, params) {
    let ctx = scene.drawingContext
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.shadowBlur = 0
    scene.stroke("#BBDDFF")
    scene.fill(sea)
    if (s.random(0, 2) < 1) {
      //scene.push()
      wave(scene, params)
      scene.translate(100, 30)
      wave(scene, params)
      scene.translate(100, 30)
      wave(scene, params)
      scene.translate(100, 30)
      wave(scene, params)
      scene.translate(100, 30)
      wave(scene, params)
      //scene.pop()
    }
  }


  function cloud(scene, left, mid, seed) {
    // Kid style cloud drawing. Quite fixed.
    s.randomSeed(seed)
    const cloudy = s.color(245, 235, 235)
    scene.fill(cloudy)
    if (debug) scene.noFill()
    if (debug) scene.strokeWeight(3)
    scene.stroke(cloudy)
    scene.ellipseMode(s.CORNERS)
    scene.rectMode(s.CORNERS)
    const leftR = s.random(12, 22)
    const rightR = s.random(13, 25)
    const bottom = mid + rightR
    const gap = 75
    scene.ellipse(left, mid - leftR, left + 2 * leftR, bottom)
    scene.ellipse(left + gap - rightR, mid - rightR, left + gap + rightR, bottom)
    scene.rect(left + leftR, mid, left + gap, mid + rightR)
    let r = 22
    let hShift = (left, r, factor) => left + factor * leftR
    let vShift = (center) => center - 5 //0.5*s.random(rightR-leftR, leftR-rightR)
    const one = hShift(left, r, 0.4)
    scene.ellipse(one, vShift(mid) - r, one + 2 * r, vShift(mid) + r)
    r = 31
    let two = hShift(one + 5, r, 0.6)
    scene.ellipse(two, vShift(vShift(mid)) - r, two + 2 * r - 5, vShift(vShift(mid)) + r - 5)
    r = 20
    let three = hShift(two + 5, r, 1.4)
    scene.ellipse(three, vShift(vShift(vShift(mid))) - r, three + 2 * r, vShift(vShift(vShift(mid))) + r)
  }

  function cloudShadow(scene, left, mid, seed) {
    // Adjust glow direction depending on sun position
    let ctx = scene.drawingContext
    const sun = sunParams(scene)
    const dx = left - sun.x
    const dy = mid - sun.y
    const norm = Math.sqrt(dx * dx + dy * dy)
    if (!debug) {
      ctx.shadowOffsetX = 2 * dx / norm
      ctx.shadowOffsetY = 2 * dy / norm
      ctx.shadowBlur = 20
    }
    if (debug) {
      scene.strokeWeight(5)
      scene.point(left + 30 * dx / norm, mid + 30 * dy / norm)
      scene.strokeWeight(3)
      scene.stroke("black")
      scene.line(left, mid, left + 30 * dx / norm, mid + 30 * dy / norm)
    }
    const cloudy = s.color(155, 135, 135, 100)
    sunColorWithAlpha.setAlpha(150)
    ctx.shadowColor = s.color(sunColorWithAlpha)
    // Draw a shadowed, horrible cloud we will cover with a clean cloud
    cloud(scene, left, mid, seed)
    // Reset shadows in context
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.shadowBlur = 0
  }

  function clouds(scene, params) {
    for (let c = 0; c < s.random(1, 5); c++) {
      const seed = s.random(-100, 100)
      const left = scene.width * s.random(0.3, 0.8)
      const mid = scene.height * s.random(0.2, 0.5)
      cloudShadow(scene, params.left, params.mid, seed)
      cloud(scene, params.left, params.mid, seed)
      s.randomSeed(window.performance.now())
    }

  }

  function createGUI() {
    let info =
      "Inspired by the <i><a href=\"https://www.reddit.com/r/generative/comments/p0tvfu/generated_panorama_drawings_p5js/\">Panoramas</a></i> by <a href=\"https://twitter.com/estienne_ca?s=21&t=8Ko3mXJTcDWYao4IgQoBBg\">estienne_ca</a>"
    let subinfo = "Only works in portrait due to how I use proportions"
    let S = new Key("s", () => {
      s.save("img.png")
    })
    let saveCmd = new Command(S, "save the canvas")
    let R = new Key("r", () => {
      gui.spin(() => {
        s.clear();
        s.randomSeed(window.performance.now())
        scenery();
        gui.spin();
      });
    });
    let resetCanvas = new Command(R, "reset")

    let D = new Key("d", () => {
      debug = !debug;
      R.action()
    })

    let B = new Key("b", () => {
      bBlack = !bBlack;
      R.action()
    })
    let debugBool = new Boolean(() => debug)
    let debugBoolControl = new Control([D], "toggle debug drawing",
      debugBool)
    let blackBool = new Boolean(() => bBlack)
    let blackBoolControl = new Control([B], "toggle black background",
      blackBool)
    let gui = new GUI("80s t-shirt, RB 2023/03", info, subinfo, [saveCmd,
        resetCanvas
      ],
      [debugBoolControl, blackBoolControl])

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

p5.disableFriendlyErrors = false
let p5sketch = new p5(sketch)