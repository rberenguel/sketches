import {
  Command,
  GUI,
  Integer,
  Float,
  Key,
  Control
} from './gui/gui.js'

import {
  getLargeCanvas
} from './misc.js'

import {
  sweepFloodfill
} from './floodfill.js'

const sketch = (s) => {

  let gui, debug = true
  let largeCanvas
  let hd = 1
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

  s.draw = () => {
    const numPixels = hd * s.width * hd * s.height
    let scene = s.createGraphics(hd * s.width, hd * s.height)
    scene.background(100)
    scene.noFill()
    testCurve(scene, 1)
    let x = scene.width / 2
    let y = scene.height / 2
    scene.loadPixels()
    sweepFloodfill(scene, x, y, [100, 100, 100, 255], [200, 100, 100, 255])
    scene.updatePixels()
    testCurve(scene, 2)    
    largeCanvas = scene
    let c = scene.get()
    c.resize(s.width, 0)
    s.image(c, 0, 0)
  }
  
  
  function testCurve(scene, w) {
    let x = scene.width / 5
    let y = scene.height / 5
    scene.stroke(s.color("black"))
    scene.strokeWeight(w)
    scene.beginShape()
    scene.curveVertex(x+scene.width / 4, y+scene.height / 4)
    scene.curveVertex(x+scene.width / 3, y+scene.height / 4 - 100)
    scene.curveVertex(x+scene.width / 3 + 150, y+scene.height / 3)
    scene.curveVertex(x+scene.width / 3, y+scene.height / 3)
    scene.curveVertex(x+scene.width / 4, y+scene.height / 2)
    scene.endShape(s.CLOSE)
  }

  function splineFloodFill(scene, x, y) {
    // Flood fill generating a spline stemming from x, y
    const rays = 10
    scene.push()
    //scene.translate(x, y) Won't work with pixels
    if (debug) {
      scene.stroke("red")
      scene.strokeWeight(3)
      scene.point(x, y, 0)
    }
    scene.loadPixels()
    let items = []
    for (let a = 0; a < 2; a++) {
      const th = a * 2 * Math.PI / rays
      let [p, q] = rayIntersect(scene, x, y, th)
      scene.strokeWeight(3)
      scene.stroke("blue")
      scene.line(x, y, p, q)
      items.push([p, q])      
      if (a == 1) {
        let forward = true
        for (let j = 0; j < 1; j++) {
          // Let's try one
          let index = 1
          let [p, q] = items[index]
          let [np, nq] = nextPoint(scene, items, index, true)
          scene.strokeWeight(2)
          scene.stroke("purple")
          scene.line(p, q, np, nq)
          const [op, oq] = items[index-1]
          scene.stroke("yellow")
          scene.line(op, oq, np, nq)          
          scene.strokeWeight(4)    
          scene.stroke("red")
          scene.point(p, q)
          scene.strokeWeight(4)          
          scene.stroke("green")
          scene.point(np, nq)          
          items.splice(index, 0, [np, nq])
        }
      }

    }
    scene.pop()
    console.log(items)
  }

  function nextPoint(scene, arr, index, forward){
    console.log(arr)
    let [op, oq] = arr[index-1]
    let [p, q] = arr[index]
    let dx, dy
    dx = op - p    
    dy = oq - q
    let angle = s.atan2(dy, dx)
    let [np, nq] = rayIntersect(scene, p, q, angle, 15)
    return [np, nq]
  }
  
  function rayIntersect(scene, x, y, angle, skip) {
    console.log("rI", x, y, angle)
    let xx = Math.floor(x)
    let yy = Math.floor(y)
    let off = (p, q) => (q * scene.width + p) * 4 // Density = 1
    let r = 1
    if (skip !== undefined) {
      r = skip
    }
    let R, G, B, A
    let count = 0
    while (true) {
      let p = Math.floor(xx + r * Math.cos(angle))
      let q = Math.floor(yy + r * Math.sin(angle))
      if (p > scene.width || p < 0) {
        return [-1, -1]
      }
      if (q > scene.height || q < 0) {
        return [-1, -1]
      }
      R = scene.pixels[off(p, q)]
      G = scene.pixels[off(p, q) + 1]
      B = scene.pixels[off(p, q) + 2]
      A = scene.pixels[off(p, q) + 3]
      /*scene.pixels[off(p, q)+0] = 0
      scene.pixels[off(p, q)+1] = 255
      scene.pixels[off(p, q)+2] = 255      
      scene.pixels[off(p, q)+3] = 255      
      scene.updatePixels()*/
      if ((R + G + B) == 0) {
        count++
      }
      if(count==2){
        return [p, q]
      }
      r += 1
    }
    return [-1, -1]
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