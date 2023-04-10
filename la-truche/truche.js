import {
  Command,
  GUI,
  Integer,
  Float,
  Key,
  Control
} from '../libraries/gui/gui.js'

import {
  getLargeCanvas, copyColor
} from '../libraries/misc.js'

import {
  olderHD, oldieHD
} from '../libraries/effects.js'


const sketch = (s) => {

  let gui, debug=true, seed
  let R
  let largeCanvas
  const PI = s.PI
  let hd = 1
  let essays1743
  const river = s.color("#385991")
  const ground = s.color("#f9edcd")
  const text = s.color("#5b5b4b")
  const mountain = s.color("#b3641f")

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
    gui = createGUI()
    gui.toggle()
    R.action()
  }

  s.preload = () => {
    essays1743 = s.loadFont("../libraries/fonts/Essays1743-Italic.ttf")
  }
  
  function loc(scene, avoid){
    let avoidMountain
    if(avoid !== undefined){
      avoidMountain = avoid.split("\n")[0]
    }
    const syllableStart = [
      "tru",
      "pe",
      "fra",
      "bou",
      "que",
    ]
    const syllableEnd = [
      "che",
      "sce",
      "ise",
      "tins",
      "que",
    ]
    let first = syllableStart[(scene.random()*syllableStart.length)<<0]
    first = first[0].toUpperCase() + first.slice(1)
    const second = syllableEnd[(scene.random()*syllableEnd.length)<<0]
    let article
    if(second.endsWith("s")){
      article = "les"
    } else {
      article = ["le", "la"][scene.random(0, 2)<<0]
    }
    const h1 = scene.random(16, 23) << 0
    const h2 = scene.random(11, 100) << 0
    const newMountain = `${article} ${first}${second}`
    if(newMountain == avoidMountain){
      return loc(scene, avoid)
    } else {
      return `${newMountain}\n ${h1}${h2}`
    }

  }
  
  s.draw = () => {
    
  }
  
  function plot() {
    const numPixels = hd * s.width * hd * s.height
    let scene = s.createGraphics(hd * s.width, hd * s.height)
    let background = s.createGraphics(scene.width, scene.height)
    debug = false
    const std = false
    background.background(ground)
    seed = window.performance.now()
    let w = 290
    let wSpans = scene.width/w
    let hSpans = scene.height/w

    // Add texture to the "paper"
    olderHD(s, background, 0.9, 10*hd, s.SOFT_LIGHT, 120, true)    
    olderHD(s, background, 0.8, 30*hd, s.BURN, 120, true)

    let lightRiver = copyColor(s, river)
    lightRiver.setAlpha(50)
    scene.stroke(lightRiver)
    scene.strokeWeight(6)
    scene.randomSeed(seed)
    scene.fill(river)    
    for(let i = 0; i<wSpans;i++){
      for(let j=0; j<hSpans;j++){
        const flip = scene.random(-1, 1) >= 0
        const x = i*w
        const y = j*w
        tile(scene, x, y, w, flip, std, true)
      }
    }
    
    scene.strokeWeight(3)
    scene.randomSeed(seed)    
    scene.stroke(river)
    scene.fill(river)
    for(let i = 0; i<wSpans;i++){
      for(let j=0; j<hSpans;j++){
        const flip = scene.random(-1, 1) >= 0
        const x = i*w
        const y = j*w
        tile(scene, x, y, w, flip, std, true)
      }
    }
    scene.noFill()
    w = 100
    wSpans = scene.width/w
    hSpans = scene.height/w
    scene.strokeWeight(13*hd)
    scene.randomSeed(seed)
    let lightMountain = copyColor(s, mountain)
    lightMountain.setAlpha(50)
    scene.stroke(lightMountain)
    for(let i = 0; i<wSpans;i++){
      for(let j=0; j<hSpans;j++){
        const flip = scene.random(-1, 1) >= 0
        const x = i*w
        const y = j*w
        tile(scene, x, y, w, flip, std)
      }
    }
    scene.randomSeed(seed)
    scene.strokeWeight(7*hd)    
    scene.stroke(mountain)
    for(let i = 0; i<wSpans;i++){
      for(let j=0; j<hSpans;j++){
        const flip = scene.random(-1, 1) >= 0
        const x = i*w
        const y = j*w
        tile(scene, x, y, w, flip, std)
      }
    }
    // Add filter on the terrain
    oldieHD(s, scene, 0.3, 5*hd, s.HARD_LIGHT)
    
    // Let's play "Fun with textured text"
    // Create two scenes with the text: one has the text, the other is the mask.
    // Apply the texturing filter to that with text, then apply the mask.
    // NOTE: This could be made faster if the texture was applied only where 
    //       there is text, most of that layer is empty.

    let x = scene.random(scene.width/10, scene.width/4), y = scene.random(scene.height/10, scene.height/4)    
    const first = loc(scene)
    let textMask = s.createGraphics(scene.width, scene.height)
    let textLayer = s.createGraphics(scene.width, scene.height)
    
    addText(textMask, x, y, first)
    addText(textLayer, x, y, first)

    x = scene.random(scene.width/2, 3*scene.width/4), y = scene.random(scene.height/3, 3*scene.height/4)
    
    const second = loc(scene, first)    
    addText(textMask, x, y, second)
    addText(textLayer, x, y, second)

    oldieHD(s, textLayer, 0.3, 5*hd, s.HARD_LIGHT)    
    olderHD(s, textLayer, 0.1, hd, s.DARKEST, 100, true)    
    
    // Text on top of mountain/river
    let c = textLayer.get()
    c.mask(textMask)
    scene.image(c, 0, 0)
    
    // Text+mountain/river on top of background
    c = scene.get()
    background.image(c, 0, 0)
    
    // Now present
    largeCanvas = background
    c = background.get()
    c.resize(s.width, 0)
    s.image(c, 0, 0)
  }

  function addText(scene, x, y, content){
    scene.push()
    scene.noStroke()
    scene.fill("black")
    scene.textFont(essays1743, 60)
    scene.text(content, x, y)
    scene.pop()
  }
  
  function tile(scene, x, y, r, type, std, fill){
    if(debug){
      scene.push()
      scene.noFill()
      scene.stroke(2)
      scene.stroke("purple")
      scene.square(x, y, r)
      if(type){
        scene.strokeWeight(2)      
      } else {
        scene.strokeWeight(1)        
      }
      scene.circle(x, y, r)
      scene.circle(x+r, y+r, r)
      if(type){
        scene.strokeWeight(1)      
      } else {
        scene.strokeWeight(2)        
      }      
      scene.stroke("green")
      scene.circle(x+r, y, r)
      scene.circle(x, y+r, r)
      scene.pop()
    }
    if(!fill)scene.noFill()
    scene.strokeCap(scene.SQUARE)    
    if(std){
      stdTile(scene, type, x, y, r)
    } else {
      altTile(scene, type, x, y, r, fill)
    }
  }
  
  function stdTile(scene, type, x, y, r){
    if(type){
      scene.arc(x, y, r, r, 0, PI/2)
      scene.arc(x+r, y+r, r, r, PI, PI+PI/2)
    } else {
      scene.arc(x+r, y, r, r, PI/2, PI)
      scene.arc(x, y+r, r, r, PI+PI/2, 2*PI)      
    }    
  }

  function altTile(scene, type, x, y, r, fill){
    if(type){
      wavyArc(scene, x, y, r/2, 0, PI/2, fill)
      wavyArc(scene, x+r, y+r, r/2, PI, PI+PI/2, fill)
    } else {
      wavyArc(scene, x+r, y, r/2, PI/2, PI, fill)
      wavyArc(scene, x, y+r, r/2, PI+PI/2, 2*PI, fill)
    }    
  }
  
  function wavyArc(scene, x, y, r, start, end, fill){
      const incs = scene.random(10, 30)
      const inc = (end - start)/incs
      let fac = 1
      scene.beginShape()
      let p = x + r*Math.cos(start)
      let q = y + r*Math.sin(start)
        
      scene.vertex(p, q)
      scene.curveVertex(p, q)      
      for(let i = 1; i < incs; i++){
        let rr = r + (-fac+2*fac*scene.noise((i*x/20) << 0, (i*y/20) << 0)) // Needs hd
        const angle = start + i*inc
        const p = x + rr*Math.cos(angle)
        const q = y + rr*Math.sin(angle)
        scene.curveVertex(p << 0, q << 0)
      }
      p = x + r*Math.cos(end)
      q = y + r*Math.sin(end)
      if(!fill){
        scene.curveVertex(p, q)
        scene.vertex(p, q)      
      }
      if(fill){
        fac = scene.random(6, 12)
        for(let i = incs; i >= 0; i--){
          let rr = r - (-fac+2*fac*scene.noise((i*x/20) << 0, (i*y/20) << 0)) // Needs hd
          const angle = start + i*inc
          const p = x + rr*Math.cos(angle)
          const q = y + rr*Math.sin(angle)
          scene.curveVertex(p << 0, q << 0)
        }
        p = x + r*Math.cos(start)
        q = y + r*Math.sin(start)
        scene.curveVertex(p, q)
        scene.vertex(p, q)
        scene.endShape(scene.CLOSE)    
        return
      }
      scene.endShape()
  }
  
  
  function createGUI() {
    let info =
      "While thinking about hiking up to <a href='https://maps.app.goo.gl/i4XqRKm9TkGFzD9T8?g_st=ic'>La Truche</a>, I thought about <a href='https://en.m.wikipedia.org/wiki/Truchet_tiles'>Truchet</a> tiles. To make them local, I used the color palette of <a href='https://map.geo.admin.ch/?topic=swisstopo&lang=en&bgLayer=voidLayer&layers=ch.swisstopo.zeitreihen&layers_timestamp=18811231&zoom=10&time=1881&E=2575089.75&N=1131965.38'>an old Swiss map</a> and some fake syllabic generated names."
    let subinfo = "Very high resolutions can fail depending on the browser"
    let S = new Key("s", () => {
      largeCanvas.save("img.png")
    })
    let saveCmd = new Command(S, "save the canvas")
    R = new Key("r", () => {
      gui.spin(() => {
        s.clear();
        plot()
        gui.spin();
      });
    });

    let resetCanvas = new Command(R, "reset")

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


    let gui = new GUI("La Truche, RB 2023/04 \u{1F1E8}\u{1F1ED}", info, subinfo, [saveCmd,
        resetCanvas
      ],
      [hdControl])

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