import {
  Command,
  GUI,
  Integer,
  Float,
  Key,
  Control
} from '../libraries/gui/gui.js'

import {
  getLargeCanvas
} from '../libraries/misc.js'

import {
  textile
} from '../libraries/textile.js'

const sketch = (s) => {

  let gui
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
    s.noLoop()
    gui = createGUI()
    gui.toggle()
  }

  function petal(scene, x, y, a, scale){
    console.log("Drawing petal")
    scene.push()
    //scene.strokeWeight(10)
    scene.strokeWeight(2)
    if(scale !== undefined){
      scene.scale(scale)
    }
    scene.rotate(a)
    //scene.point(0, 0)
    const anch1 = [10, -10]
    const anch2 = [-10, -10]
    const ctrl1 = [100, -110]
    const ctrl2 = [-100, -110]
    const ctrl3 = [0, -15]
    const ctrl4 = [0, -15]
    scene.beginShape()
    scene.vertex(...anch1) // anchor
    scene.bezierVertex(...ctrl1, ...ctrl2, ...anch2)
    scene.bezierVertex(...ctrl3, ...ctrl4, ...anch1)
    scene.endShape()
    scene.pop()
  }
  
  s.draw = () => {
    const numPixels = hd * s.width * hd * s.height
    console.log("Num Pixels: " + numPixels)
    let scene = s.createGraphics(hd * s.width, hd * s.height)
    let redCloth
    let petalMask
    
    textile(scene, 0, 0, scene.width, scene.height, 1, 8)
    
    
    const mx = scene.width/2
    const my = scene.height/2
    for(let i = 0; i < 6; i++){
      const a = i*PI/3
      let angle = scene.random(a-PI/37, a+PI/37)
      redCloth = s.createGraphics(scene.width, scene.height)
      redCloth.translate(mx, my)
      redCloth.rotate(angle)
      redCloth.translate(-300, -300)
      textile(redCloth, 0, 0, 600, 600, 1, 8, ["#AA3333", "#991525", "#9A1258"])
      petalMask = s.createGraphics(scene.width, scene.height)
      petalMask.translate(mx, my)
      petalMask.fill("white")
      petal(petalMask, 0, 0, angle)
      redCloth.rotate(angle)
      let d = redCloth.get()
      d.mask(petalMask)
      scene.image(d, 0, 0)
      let ctx = scene.drawingContext
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
      ctx.shadowBlur = 8
      ctx.shadowColor = "#10101099"
      scene.stroke("#00000099")
      ctx.setLineDash([3, 5, 3, 5])
      scene.noFill()
      scene.push()
      scene.translate(mx, my)
      petal(scene, 0, 0, angle, 0.97)
      scene.pop()
    }
    /*redCloth = s.createGraphics(scene.width, scene.height)
    redCloth.translate(mx, my)
    redCloth.strokeWeight(15)
    redCloth.point(300, 300)
    redCloth.rotate(PI/4)
    redCloth.translate(-300, -300)
    redCloth.stroke("red")
    redCloth.strokeWeight(8)
    redCloth.point(300, 300)    
    textile(redCloth, 0, 0, 600, 600, 1, 8, ["#AA3333", "#991525"])
    scene.image(redCloth.get(), 0, 0)
    */
    largeCanvas = scene
    let c = scene.get()
    c.resize(s.width, 0)
    s.image(c, 0, 0)
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


    let gui = new GUI("Something, RB 2020/", info, subinfo, [saveCmd,
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