import {
  Command,
  GUI,
  Float,
  Boolean,
  Key,
  Control
} from '../libraries/gui/gui.js'

import {
  getLargeCanvas,
  releaseCanvas
} from '../libraries/misc.js'


// TODO: Incorporate seeding with seeder.js

const sketch = (s) => {

  let gui, canvas, pcanvas, hd = 1
  let black = false

  // Scourged the internet finding colours that are suitable for irises. I kept 
  // out the occasional shiny yellows that can appear, since it would make 
  // randomness too hard

  function irisColors() {
    let black = s.color(0, 0, 0)
    let browns = [s.color(69, 24, 0), s.color(96, 49, 1), s.color(99, 57, 15), s.color(84, 42, 14), s.color(94, 72, 30)]
    let blues = [s.color(74, 108, 110), s.color(71, 98, 105), s.color(65, 97, 86), s.color(67, 101, 128), s.color(44, 76, 99)]
    let greens = [s.color(75, 114, 72), s.color(51, 122, 44), s.color(28, 120, 71)]
    let darkBrown = s.color(60, 49, 13)
    let darkBlue = s.color(10, 47, 75)
    let darkOlive = s.color(32, 74, 0)
    let lightGreen = s.color(73, 118, 101)
    let baseColors = browns.concat(blues).concat(greens)
    let otherColors = [darkBrown, darkBlue, darkOlive, lightGreen]
    return [baseColors, otherColors]
  }

  s.setup = () => {
    let {
      w,
      h
    } = getLargeCanvas(s, 500)

    // A square, 500x500 canvas is what works best for this sketch I think
    s.pixelDensity(1)
    pcanvas = s.createCanvas(w, h)
    pcanvas.mousePressed(() => {})
    s.frameRate(20)
    gui = createGUI()
    gui.toggle()
    centeredIris(200 / 500.0 * w * hd, 100 / 500 * w * hd, 50 / 500 * w * hd)
  }

  function centeredIris(irisRadius, irisBlur, pupilRadius) {
    canvas = s.createGraphics(pcanvas.width * hd, pcanvas.height * hd)
    if(black){
      canvas.background("black")
    } else {
      canvas.background("white")      
    }  
    let centerX = canvas.width / 2
    let centerY = canvas.height / 2
    let [baseColors, otherColors] = irisColors()
    let baseColor = baseColors[s.int(s.random(baseColors.length))]
    let colours = [baseColor]
    for (let k = 0; k < s.random(5, 12); k++) {
      let randomColour = otherColors[s.int(s.random(otherColors.length))]
      colours.push(randomColour)
    }
    iris(centerX, centerY, irisRadius, irisBlur, pupilRadius, colours)
    let c = canvas.get()
    c.resize(pcanvas.width, 0)
    s.image(c, 0, 0)
    releaseCanvas(canvas)
  }

  // I will move this as a helper sooner or later
  function gaussColor(colour, sigma) {
    let r = s.randomGaussian(s.red(colour), sigma)
    let g = s.randomGaussian(s.green(colour), sigma)
    let b = s.randomGaussian(s.blue(colour), sigma)
    return s.color(r, g, b)
  }


  // So, here the sausage is made. I based my computational construction on
  // this Procreate tutorial: https://www.youtube.com/watch?v=yqRhbjUQ7Qg&app=desktop
  // 1. Draw filled circles with many alpha layers to add some spherical blur.
  // 2. Then, add an outer layer of increasing darkness to simulate the halo around
  // a real iris.
  // 3. Add some random ellipses radiating from the pupil, to add randomness
  // 4. Then I draw the colouring inside, where most of the detail is. It is formed by:
  //    1. Contoured polygonal (curvedVertex) rings distributed as well as I could
  //    2. Lines radiating from the pupil
  // 5. Add the pupil "perturbation" (a curveVertex n-gon) and the pupil proper.
  // 6. Draw the shine arcs. Real pupils have no shine (check yourself!) but it looks way better. Also, real pupils are "below". Drawing it above makes the iris pop much better

  function iris(centerX, centerY, irisRadius, irisBlur, pupilRadius, irisColors) {
    blurredCircle(centerX, centerY, irisRadius, irisBlur, gaussColor(irisColors[0]))
    darkenHalo(centerX, centerY, irisRadius + irisBlur, irisBlur * 0.3, s.color(0))
    darkenHalo(centerX, centerY, irisRadius + irisBlur, irisBlur * 0.2, s.color(0))
    darkenHalo(centerX, centerY, irisRadius + irisBlur, irisBlur * 0.2, s.color(0))
    let params = [{
      center: 0.5,
      span: 1
    }, {
      center: 0.3,
      span: 1
    }, {
      center: 0.8,
      span: 1
    }, {
      center: 0.3,
      span: 0.5
    }, {
      center: 0.5,
      span: 0.5
    }]
    for (let i = 0; i < 25; i++) {
      randomEllipse(centerX, centerY, s.randomGaussian(3, 5), s.random(pupilRadius, irisRadius + irisBlur * 0.9), irisColors[s.int(s.random(irisColors.length))])
    }
    for (let i = 0; i < irisColors.length - 1; i++) {
      let color1 = gaussColor(irisColors[i])
      let color2 = gaussColor(irisColors[i + 1])
      let param = params[s.int(s.random(params.length))]
      alternativeIrisPerturbation(centerX, centerY, pupilRadius, irisRadius + irisBlur * 0.9, color1, color2, s.randomGaussian(85, 15), param.center, param.span, 30 + Math.abs(s.randomGaussian(irisRadius, irisBlur)))
      irisPerturbation(centerX, centerY, pupilRadius, irisRadius + irisBlur * 0.9, color1, color2, s.randomGaussian(5, 15), param.center, param.span, 30 + Math.abs(s.randomGaussian(irisRadius, irisRadius)))

    }
    alternativePupilPerturbation(centerX, centerY, pupilRadius)
    blurredCircle(centerX, centerY, pupilRadius, pupilRadius, s.color(10, 10, 10))
    shineArc(centerX, centerY, irisRadius * 0.6, irisRadius * 0.9, 1, irisRadius)
    let factor = 0.5
    for (let i = 5; i >= 0; i--) {
      factor = Math.sqrt(factor)
      let smallFactor = 0.6 + 0.02 * i
      let largeFactor = 0.8 + 0.01 * i
      shineArc(centerX, centerY, irisRadius * smallFactor, irisRadius * largeFactor, 1, irisRadius, 1, factor)
    }
    shineArc(centerX, centerY, irisRadius * 0.6, irisRadius * 0.8, 1, irisRadius, -1)
    factor = 0.5
    for (let i = 5; i >= 0; i--) {
      factor = Math.sqrt(factor)
      let smallFactor = 0.6 + 0.02 * i
      let largeFactor = 0.7 + 0.01 * i
      shineArc(centerX, centerY, irisRadius * smallFactor, irisRadius * largeFactor, 1, irisRadius, -1, factor)
    }
    shineArc(centerX, centerY, pupilRadius * 1.2, pupilRadius * 1.4, 20, irisRadius, 1, 0.3)
    factor = 0.5
    for (let i = 5; i >= 0; i--) {
      factor = Math.sqrt(factor)
      let smallFactor = 1.2 + 0.02 * i
      let largeFactor = 1.4 + 0.01 * i
      shineArc(centerX, centerY, pupilRadius * smallFactor, pupilRadius * largeFactor, 1, irisRadius, 1, 0.3 * factor)
    }
  }

  function randomEllipse(x, y, size, r, c) {
    let colour = gaussColor(c)
    colour.setAlpha(s.random(50, 75))
    canvas.push()
    canvas.ellipseMode(s.CENTER)
    canvas.translate(x, y)
    canvas.rotate(s.random(s.TWO_PI))
    canvas.translate(0, -r / 2)
    canvas.beginShape()
    canvas.fill(colour)
    canvas.ellipse(0, 0, size / 4, size / 2)
    canvas.endShape()
    canvas.pop()
  }

  function alternativePupilPerturbation(x, y, r) {
    let total = 300
    let start = s.random(1, 100)
    canvas.push()
    canvas.translate(x, y)
    canvas.beginShape()
    for (let i = 0; i < total; i++) {
      let angle = i * s.TWO_PI / total
      let l = r * (0.7 + 0.45 * s.noise(i + start))
      canvas.noStroke()
      canvas.fill(s.color(10, 10, 10, 150))
      canvas.curveVertex(l * Math.cos(angle), l * Math.sin(angle))
    }
    canvas.endShape(s.CLOSE)
    canvas.pop()
  }


  function shineArc(x, y, r1, r2, alpha, total, reverse = 1, size = 1, startAngle = s.PI / 6) {
    canvas.push()
    canvas.translate(x, y)
    let s1 = r1 / 2
    let s2 = r2 / 2
    for (let i = 0; i < total; i++) {
      let angle = startAngle + size * (i - total / 2) / 2 * s.PI / total
      canvas.beginShape()
      let colour = s.color(230, 230, 230, alpha)
      canvas.stroke(colour)
      canvas.line(reverse * s1 * Math.cos(angle), -reverse * s1 * Math.sin(angle), reverse * s2 * Math.cos(angle), -reverse * s2 * Math.sin(angle))
      canvas.endShape()
    }
    canvas.pop()
  }


  // Lines radiating from the pupil. This was my first implementation,
  // 	works well at low res
  function irisPerturbation(x, y, r1, r2, c1, c2, alpha, start, sizeFactor, steps) {
    canvas.push()
    canvas.translate(x, y)
    let maxLength = (r2 - r1) / 2
    let adj = 0.5 - Math.abs(0.5 - start)
    let adjustedLength = (adj * maxLength) * sizeFactor
    let startLength = start * maxLength
    for (let i = 0; i < steps; i++) {
      let angle = i * s.TWO_PI / steps
      canvas.beginShape()
      let colour = s.lerpColor(c1, c2, s.noise(i))
      colour.setAlpha(alpha * s.noise(i))
      canvas.stroke(colour)
      canvas.strokeWeight(1)
      let s1 = r1 / 2 + startLength - adjustedLength * s.noise(i)
      let s2 = r1 / 2 + startLength + adjustedLength * s.noise(i)
      canvas.line(s1 * Math.cos(angle), s1 * Math.sin(angle), s2 * Math.cos(angle), s2 * Math.sin(angle))
      canvas.endShape()
    }
    canvas.pop()
  }

  // Using polygons and contours. Works way better. A happy accident of not closing
  // them properly adds a very nice randomness. The code is a bit messy. Basically 
  // we want to control size relative to middle of the pupil-end-of-iris available
  // space.
  function alternativeIrisPerturbation(x, y, r1, r2, c1, c2, alpha, start, sizeFactor, steps) {
    let maxLength = (r2 - r1) / 2
    let adj = 0.5 - Math.abs(0.5 - start)
    let adjustedLength = (adj * maxLength) * sizeFactor
    let startLength = start * maxLength
    let startAngle = s.random(s.TWO_PI)
    let seed = s.random(1, 100)
    canvas.beginShape()
    for (let i = 0; i < steps; i++) {
      let angle = startAngle + i * s.TWO_PI / steps
      let colour = s.lerpColor(c1, c2, s.noise(seed + i))
      colour.setAlpha(alpha * s.noise(seed + i))
      canvas.fill(colour)
      let s2 = r1 / 2 + startLength + adjustedLength * s.noise(seed + i)
      canvas.curveVertex(x + s2 * Math.cos(angle), y + s2 * Math.sin(angle))
    }
    canvas.beginContour()
    for (let i = steps; i >= 0; i--) {
      let angle = i * s.TWO_PI / steps
      let colour = s.lerpColor(c1, c2, s.noise(seed + i))
      colour.setAlpha(alpha * s.noise(seed + i))
      let s1 = r1 / 2 + startLength - adjustedLength * s.noise(seed + i)
      let x1 = x + s1 * Math.cos(angle)
      let y1 = y + s1 * Math.sin(angle)
      canvas.curveVertex(x1, y1)
    }
    canvas.endContour()
    canvas.endShape(s.CLOSE)
  }

  // Circle with blurry outside, a bit like the moon in Crazy Nights
  function blurredCircle(x, y, r, layering, c) {
    let transp = s.color(s.red(c), s.green(c), s.blue(c), 1)
    for (let i = layering; i >= 0; i--) {
      let colour = s.lerpColor(c, transp, i / layering)
      canvas.noStroke()
      canvas.fill(colour)
      canvas.circle(x, y, r + i)
    }
    canvas.fill(c)
    canvas.circle(x, y, r)
  }

  // Similar to the above, to add a darkening effect to the outside
  function darkenHalo(x, y, r, layering, c) {
    let transp = s.color(s.red(c), s.green(c), s.blue(c), 15)
    for (let i = 0; i < layering; i++) {
      canvas.noFill()
      canvas.stroke(transp)
      canvas.strokeWeight(2)
      canvas.circle(x, y, r - i)
    }
  }


  s.draw = () => {}

  function createGUI() {
    let info = "Randomly generated irises"
    let subinfo = "And I don't want the world to see me<br/>'Cause I don't think that they'd understand<br/>When everything's made to be broken<br/>I just want you to know who I am"
    let S = new Key("s", () => {
      canvas.save("img.png")
    })
    let saveCmd = new Command(S, "save the canvas")
    let R = new Key("r", () => {
      canvas.clear()
      pcanvas.clear()
      centeredIris(200 / 500.0 * pcanvas.width*hd, 100 / 500 * pcanvas.width*hd, 50 / 500 * pcanvas.width*hd)
    })
    let resetCanvas = new Command(R, "reset")

    let B = new Key("b", () => {
      black = !black
    })
    let blackInfo = new Boolean(() => black)
    let blackControl = new Control([B], "black background", blackInfo)
    
    let decH = new Key(",", () => {
      if (hd > 0) {
        hd -= 0.5
      }
    })
    let incH = new Key(".", () => {
      if (hd < 10) {
        hd += 0.5
      }
    })
    let hdInfo = new Float(() => hd)
    let hdControl = new Control([decH, incH],
      "+/- resolution export factor", hdInfo)


    let gui = new GUI("Iris, RB 2020/06", info, subinfo, [saveCmd,
      resetCanvas
    ], [hdControl, blackControl])

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