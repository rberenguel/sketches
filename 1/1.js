import {
  Command,
  GUI,
  Integer,
  Float,
  Key,
  Control
} from '../libraries/gui/gui.js'

import {
  getLargeCanvas, darken, gaussColor
} from '../libraries/misc.js'

import {
  wernerBasePalette, solarizedDark
} from '../libraries/palettes.js'

import {
  $
} from '../libraries/gui/dom.js'

const sketch = (s) => {

  let gui
  let largeCanvas
  let hd = 1
  const PI = s.PI
  const background = solarizedDark.base01
  let seed = 42
  let monoid
  let marginOuter
  let gapOuter

  s.preload = () => {
    monoid = s.loadFont("../libraries/fonts/Monoid-Retina.ttf")
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
    seed = (window.performance.now() << 0) % 1000000    
    gui = createGUI()
    gui.toggle()
    let lab = $.cel("label")
    lab.for = "seedInput"
    lab.innerHTML = "Enter a custom seed (integer)<br/>"
    let inp = $.cel("input")
    inp.type = "number"
    inp.id = "seedInput"
    inp.onkeydown = inputSeed
    let span = $.cel("span")
    span.innerHTML = "<br/>Dismiss by pressing <code>enter</code>"
    span.id = "seedInfo"
    $.byId("seed").append(lab, inp, span)    
  }

  function monoTone(scene){
    let mask = s.createGraphics(scene.width, scene.height)
    mask.noStroke()
    for(let i = 0; i < scene.width; i+=8*hd){
      for(let j = 0; j < scene.height; j+=8*hd){
        mask.fill(s.color(255, 255, 255, scene.random(50, 200)))
        const dx = scene.random(-3*hd, 3*hd) << 0
        const dy = scene.random(-3*hd, 3*hd) << 0
        mask.circle(i+dx, j+dy, (1+scene.random()*16*hd) << 0)
      }
    }
    let c = scene.get()
    c.mask(mask)
    scene.clear()
    const wiggledColor = darken(s, background, 1.5)
    scene.background(wiggledColor)
    scene.image(c, 0, 0)
  }
  
  function diagonal(scene, mask, draw, seed){
    s.randomSeed(seed)
    mask.push()
    if(!draw){
      mask.rect(0, 0, scene.width, scene.height)      
    }
    mask.rotate(0.5*s.random())
    if(!draw){
      mask.erase()      
    }
    mask.rectMode(s.CORNERS)
    mask.translate(0, -s.random(0.5, 1)*scene.height/5)
    mask.rect(-scene.width, 0.45*scene.height, 2.0*scene.width, 0.48*scene.height)
    mask.pop()    
  }
  
  function slice(scene){
    let barsMask = s.createGraphics(scene.width, scene.height)
    let diagonalMask = s.createGraphics(scene.width, scene.height)
    const margin = scene.width/50.0 << 0
    marginOuter = margin
    const gap = 0.7*margin  << 0
    gapOuter = gap    
    const width = (scene.width-2*margin-9*gap)/10.0 << 0
    barsMask.push()
    barsMask.translate(margin, 0)
    for(let i = 0; i < 10;i++){
      barsMask.rect(0, margin, width, scene.height-2*margin, gap/2 << 0)
      barsMask.translate(width+gap, 0)
    }
    barsMask.pop()
    const seed = window.performance.now()
    diagonal(scene, diagonalMask, false, seed)
    scene.strokeWeight(2*4*hd)
    scene.stroke("black")
    diagonal(scene, scene, 1, seed)
    
    let c = barsMask.get()
    c.mask(diagonalMask)
    barsMask.clear()
    barsMask.image(c, 0, 0)
    c = scene.get()
    c.mask(barsMask)
    scene.clear()
    scene.background("white")
    scene.image(c, 0, 0)    
    scene.push()
    scene.stroke("black")
    scene.strokeWeight(4*hd)
    scene.translate(margin, 0)
    scene.noFill()
    for(let i = 0; i < 10;i++){
      scene.rect(0, margin, width, scene.height-2*margin, gap/2 << 0)
      scene.translate(width+gap, 0)
    }
    scene.pop()
    scene.strokeWeight(hd)
    scene.stroke("white")
    scene.fill("white")
    diagonal(scene, scene, 1, seed)
  }
  
  function thingy(scene, level, x, y){
    scene.push()
    scene.scale(hd)
    scene.translate(x, y)
    scene.rotate(scene.random(2*PI))
    scene.scale(scene.random(0.5, 1.0))
    const t = [105, 300, 450, 200, 300, 400]
    let wiggled = t.map(z => z + scene.random(-50, 50))
    const c0 = wernerBasePalette[scene.random(wernerBasePalette.length) << 0]
    const c1 = darken(s, darken(s, gaussColor(s, c0, 50), level), 0.8)
    //const c2 = darken(s, c1, level)
    const c2 = s.color(level)
    c2.setAlpha(50)
    scene.fill(c2)
    scene.stroke(c2)
    scene.strokeWeight(3*hd)
    scene.strokeJoin(s.ROUND)
    scene.triangle(...wiggled)
    scene.scale(0.9)
    scene.translate(0, 0)
    scene.fill(c1)
    scene.stroke("black")    
    scene.triangle(...wiggled)    
    scene.pop()
  }
  
  s.draw = () => {
    const numPixels = hd * s.width * hd * s.height
    let scene = s.createGraphics(hd * 1800, hd * 1200) // fixed 3:2 aspect ratio
    // Here your code against scene
    scene.background(background)
    const MAX = 100*hd*hd
    for(let i=0; i< MAX; i++){
      const x = scene.random(0.1*scene.width, 0.9*scene.width)
      const y = scene.random(0.1*scene.height, 0.9*scene.height)
      //console.log(x, y)
      thingy(scene, (i+1)/MAX, x, y)      
    }
    monoTone(scene)
    slice(scene)
    
    const identifier = `${seed}@${hd.toPrecision(2)}`
    addText(scene, scene.width - marginOuter - gapOuter/2, scene.height - marginOuter - 18 * hd, identifier)
    addText(scene, scene.width - marginOuter - gapOuter/2, scene.height - marginOuter - 9 * hd, "rb'23")    
    
    largeCanvas = scene
    let c = scene.get()
    c.resize(s.width, 0)
    s.image(c, 0, 0)    
  }

  function addText(scene, x, y, content) {
    scene.push()
    scene.noStroke()
    scene.fill("#d0be47")
    scene.textAlign(s.RIGHT)
    scene.textFont(monoid, hd * 9)
    let ctx = scene.drawingContext
    ctx.shadowOffsetX = 1
    ctx.shadowOffsetY = 1
    ctx.shadowBlur = hd * 1
    ctx.shadowColor = "lightgray"
    scene.text(content, x, y)
    scene.pop()
  }  

  function inputSeed(t) {
    if (t.key.toLowerCase() === 'enter') {
      let num = $.byId("seedInput").valueAsNumber
      if (!isNaN(num)) {
        seed = num
      }
      $.byId("seed").style.visibility = "hidden"
      gui.update()
      $.byId("seedInput").value = ""
    }
  }
  
  function createGUI() {
    let info =
      "Info"
    let subinfo = "Subinfo<br/>Very high resolutions can fail depending on the browser"
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

    let E = new Key("e", () => {
      $.byId("seedInput").value = ""
      $.byId("seed").style.visibility = "visible"
      $.byId("seedInput").focus()
    })
    let enterSeedCommand = new Command(E,
    "manually enter seed")
    let seedShow = new Integer(() => seed)
    let X = new Key("x", () => {
      seed = (window.performance.now() << 0) % 1000000
    })    
    let seedControl = new Control([X],
    "Random seed", seedShow)      
    let gui = new GUI("Something, RB 2020/", info, subinfo, [saveCmd,
        resetCanvas, enterSeedCommand
      ],
      [seedControl, hdControl])

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