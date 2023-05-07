import {
  Command,
  GUI,
  Integer,
  Float,
  String,
  Key,
  Control
} from '../libraries/gui/gui.js'

import {
  getLargeCanvas
} from '../libraries/misc.js'

import {
  solarizedDark,
  solarizedDarkPalette,
  wernerBase,
  wernerBasePalette,
  shimmeringColorArray,
  c82GeoPrimesPalette
} from '../libraries/palettes.js'

import {
  $
} from '../libraries/gui/dom.js'

const sketch = (s) => {

  let PI = s.PI
  let gui
  let largeCanvas
  let hd = 1
  let freq = 8
  let squiggly
  let lineStroke = 0.8 * hd
  let dist
  let layers = 10
  let R
  let palette = {}
  let mode = "rough"
  let drawer
  let seed = 42
  let monoid

  function setMode() {
    if (mode == "fine") {
      dist = 1.2 * lineStroke
      drawer = (c, x, y, ns) => c.ellipse(x, y, ns)
    } else {
      dist = 16 * lineStroke
      drawer = (c, x, y, ns) => c.rect(x, y, 14 * ns, 6 * ns, 2 * ns)
    }
  }

  const werner = () => {
    palette.colors = wernerBasePalette,
      palette.name = "Werner",
      palette.short = "we",
      palette.background = wernerBase.lightBrown
  }

  const solarized = () => {
    palette.colors = solarizedDarkPalette,
      palette.name = "SolarizedDark",
      palette.short = "sd",
      palette.background = solarizedDark.base01
  }

  const shimmering = () => {
    palette.colors = shimmeringColorArray,
      palette.name = "Shimmering",
      palette.short = "sh",
      palette.background = shimmeringColorArray[0]
  }

  const geometricPrimes = () => {
    palette.colors = c82GeoPrimesPalette.slice(0, c82GeoPrimesPalette.length - 2),
      palette.name = "±C82GeoPrimes",
      palette.short = "gp",
      palette.background = c82GeoPrimesPalette[c82GeoPrimesPalette.length - 1]
  }

  const palettes = [solarized, werner, shimmering, geometricPrimes]
  let palettesIndex = 0

  function cyclePalettes() {
    palettesIndex = (palettesIndex + 1) % palettes.length
    palettes[palettesIndex]()
  }

  const particleDistributions = [{
    fun: createParticles,
    name: "edges",
    short: "e"
  }, {
    fun: createParticlesCircle,
    name: "circles",
    short: "c"
  }]
  let particleDistribution = particleDistributions[0]
  let particleDistributionsIndex = 0

  function cycleParticleDistributions() {
    particleDistributionsIndex = (particleDistributionsIndex + 1) % particleDistributions.length
    particleDistribution = particleDistributions[particleDistributionsIndex]
  }

  // Mostly the implementation in here: 
  // https://www.schmidtynotes.com/blog/p5/2022-03-05-random-vectors/
  // with added stop conditions

  class Particle {
    constructor(rand, x, y, size, color, alpha, _dist) {
      this.x = x
      this.y = y
      this.size = size
      this.color = color

      this.alpha = alpha ? _alpha : 10
      this.dist = _dist ? _dist : dist
      this.stopped = false
      this.rand = rand
    }
    move(scene) {
      let theta = scene.noise(this.x * squiggly + this.rand, this.y * squiggly + this.rand) * PI * 2
      let v = p5.Vector.fromAngle(theta, this.dist)
      this.x += v.x
      this.y += v.y
    }
    draw(scene) {
      const na = scene.random(0.5 * this.alpha, this.alpha)
      this.color.setAlpha(na)
      scene.fill(this.color)
      const ns = scene.random(0.4 * this.size, 2 * this.size)
      drawer(scene, this.x, this.y, ns)
    }
    stop(scene) {
      if (this.x > scene.width || this.x < 0) {
        this.dist = 0
        this.stopped = true
      }
      if (this.y > scene.height || this.y < 0) {
        this.dist = 0
        this.stopped = true
      }
    }
  }

  s.preload = () => {
    monoid = s.loadFont("../libraries/fonts/Monoid-Retina.ttf")
  }

  s.setup = () => {
    let {
      w,
      h
    } = getLargeCanvas(s, 1600)
    let canvas = s.createCanvas(w, h)
    squiggly = 1 / (Math.max(s.width, s.height) * 0.8)
    s.pixelDensity(1)
    canvas.mousePressed(() => {})
    s.frameRate(1)
    solarized()
    seed = (window.performance.now() << 0) % 1000000
    gui = createGUI()
    gui.toggle()
    let lab = $.cel("label")
    lab.for = "seedInput"
    lab.innerHTML = "Enter a custom seed (integer)<br/>"
    let inp = $.cel("input")
    inp.type = "string"
    inp.id = "seedInput"
    inp.onkeydown = inputSeed
    let span = $.cel("span")
    span.innerHTML = "<br/>Dismiss by pressing <code>enter</code>"
    span.id = "seedInfo"
    $.byId("seed").append(lab, inp, span)
    s.noStroke()
    s.noLoop()
    setMode()
    R.action()
  }

  function allStop(particles) {
    let cond = true
    for (let p of particles) {
      cond = cond && p.stopped
      if (!cond) {
        return false
      }
    }
    return true
  }

  function createParticles(scene, whatever) {
    let particles = []
    const particleSeed = scene.noise(whatever)
    const base = scene.random(freq)
    for (let x = base; x < scene.width; x += freq) {
      let stroke = lineStroke
      let c = (scene.noise(x * squiggly) * palette.colors.length) << 0
      let color = scene.color(palette.colors[c])
      particles.push(new Particle(particleSeed, x, 0, stroke, color))
      particles.push(new Particle(particleSeed, x, scene.height, stroke, color))
    }
    for (let y = base; y < scene.height; y += freq) {
      let stroke = lineStroke
      let c = (scene.noise(y * squiggly) * palette.colors.length) << 0
      let color = scene.color(palette.colors[c])
      particles.push(new Particle(particleSeed, 0, y, stroke, color))
      particles.push(new Particle(particleSeed, scene.width, y, stroke, color))
    }
    return particles
  }

  function createParticlesCircle(scene, whatever) {
    let particles = []
    const particleSeed = scene.noise(whatever)
    const base = scene.random(freq)
    for (let i = 0; i < 5; i++) {
      let r = scene.random(0.1 * scene.width, 0.3 * scene.width)
      let cx = scene.random(0.2 * scene.width, 0.8 * scene.width)
      let cy = scene.random(0.2 * scene.height, 0.8 * scene.height)
      for (let j = 0; j < freq; j++) {
        for (let th = base; th < 2 * PI; th += 2 * PI / (800 / freq)) {
          let x = cx + r * Math.cos(th)
          let y = cy + r * Math.sin(th)
          let stroke = lineStroke
          let c = (scene.noise(x * squiggly, y * squiggly) * palette.colors.length) << 0
          let color = scene.color(palette.colors[c])
          particles.push(new Particle(particleSeed, x, y, stroke, color))
        }
      }
    }
    return particles
  }  

  function stepThrough(scene, particles) {
    while (!allStop(particles)) {
      for (let p of particles) {
        if (p.stopped) {
          continue
        }
        p.draw(scene)
        p.move(scene)
        p.stop(scene)
      }
    }
  }

  function inputSeed(t) {
    
    if (t.key.toLowerCase() === 'enter') {
      let num = $.byId("seedInput").value
      if(num.startsWith("#")){
        num = num.slice(1, num.length)
      }
      const hexed = parseInt(num, 16)
      if (!isNaN(hexed)) {
        seed = hexed
        gui.mark()
      }
      $.byId("seed").style.visibility = "hidden"
      gui.update()
      $.byId("seedInput").value = ""
    }
  }

  function plot() {
    let scene = s.createGraphics(hd * 1800, hd * 1200) // fixed 3:2 aspect ratio
    scene.background(palette.background)
    scene.noStroke()
    scene.randomSeed(seed)
    scene.noiseSeed(seed)
    let particles
    for (let i = 0; i < layers; i++) {
      particles = particleDistribution.fun(scene, (0.4 * i) / layers)
      stepThrough(scene, particles)
    }
    const identifier = `${particleDistribution.short}.${palette.short}.${seed.toString(16).toUpperCase()}.${layers}@${hd.toPrecision(2)}`
    addText(scene, scene.width - 10 * hd, scene.height - 15 * hd, identifier)
    addText(scene, scene.width - 10 * hd, scene.height - 7 * hd, "rb'23")
    largeCanvas = scene
    let c = scene.get()
    c.resize(s.width, 0)
    s.image(c, 0, 0)

  }

  function addText(scene, x, y, content) {
    scene.push()
    scene.noStroke()
    scene.fill("black")
    scene.textAlign(s.RIGHT)
    scene.textFont(monoid, hd * 7)
    let ctx = scene.drawingContext
    ctx.shadowOffsetX = 1
    ctx.shadowOffsetY = 1
    ctx.shadowBlur = hd * 1
    ctx.shadowColor = "darkgray"
    scene.text(content, x, y)
    scene.pop()
  }

  function createGUI() {
    let info =
      "Layered particle flow in noise field. Saving uses at least 1600&times;1200 resolution on export.<ul><li>Use the e<b>X</b>plore function</li><li>while in rough <b>M</b>ode to figure out what shape you like,</li><li>then switch to fine <b>M</b>ode</li><li>and set layering to 100 with <b>)</b>.</li></ul>Optionally increase export resolution with <b>.</b>, but this needs to be done <i>first</i>, before exploration."
    let subinfo = "<hr/>Very high resolutions can fail depending on the browser"
    let S = new Key("s", () => {
      largeCanvas.save("img-" + seed + ".png")
    })
    let saveCmd = new Command(S, "save the canvas (3:2)")
    R = new Key("r", () => {
      gui.spin(() => {
        s.clear()
        plot()
        gui.spin()
        gui.unmark()
      })
    })

    let pals = new Key("q", cyclePalettes)
    let paletteShow = new String(() => palette.name)
    let paletteControl = new Control([pals],
      "Cycle palettes", paletteShow)

    let pDists = new Key("w", cycleParticleDistributions)
    let pDistsCmd = new Command(pDists, "cycle through palette distributions")
    let pDistsShow = new String(() => particleDistribution.name)
    let pDistsControl = new Control([pDists],
      "Cycle distributions", pDistsShow)
    let M = new Key("m", () => {
      if (mode == "fine") {
        mode = "rough"
        gui.mark()
      } else {
        mode = "fine"
        gui.mark()
      }
      setMode()
    })
    let modeShow = new String(() => mode)
    let modeControl = new Control([M],
      "Current mode", modeShow)
    let resetCanvas = new Command(R, "reset")
    let X = new Key("x", () => {
      seed = (window.performance.now() << 0) % 1000000
      gui.mark()
      gui.update()
    })
    let seedShow = new String(() => seed.toString(16).toUpperCase())
    let seedControl = new Control([X],
      "Random seed", seedShow)
    let incR = new Key(")", () => {
      layers += 10
    })
    let Z = new Key("z", () => {
      $.byId("seedInput").value = ""
      $.byId("seed").style.visibility = "visible"
      $.byId("seedInput").focus()
    })
    let enterSeedCommand = new Command(Z,
      "manually enter seed")

    let decR = new Key("(", () => {
      if (layers > 10) {
        layers -= 10
      }
    })
    let rInt = new Integer(() => layers)
    let rControl = new Control([decR, incR],
      "+/- layering", rInt)

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


    let gui = new GUI("Flows, RB 2023/04 \u{1F1E8}\u{1F1ED}", info, subinfo, [saveCmd,
        resetCanvas, enterSeedCommand
      ],
      [modeControl, seedControl, paletteControl, pDistsControl, rControl, hdControl])

    let QM = new Key("?", () => gui.toggle())
    let hide = new Command(QM, "hide this")

    gui.addCmd(hide)
    gui.update()
    return gui
  }

  s.keyReleased = () => {
    if (s.key.toLowerCase() === "tab") {
      $.byId("seed").style.visibility = "hidden"
      $.byId("container").focus()
    } else {
      gui.dispatch(s.key)
    }
  }
}

p5.disableFriendlyErrors = true
let p5sketch = new p5(sketch)