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
  bezierB,
  darken,
  gaussColor
} from '../libraries/misc.js'


// Base to avoid writing always the same

const sketch = (s) => {

  let gui
  let dly
  let debug = false
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
    gui = createGUI()
    gui.toggle()
    s.noLoop()
  }

  s.draw = () => {
    const numPixels = hd * s.width * hd * s.height
    let scene = s.createGraphics(hd * s.width, hd * s.height)
    dly = s.createGraphics(scene.width, scene.height)
    const width = 8
    const height = 64
    scene.translate(0, -1.5*height)    
    const rc = () => {
      const nR = scene.random(1)
      const nG = scene.random(1)      
      const nB = scene.random(1)            
      const color = s.color(120*nR, 120*nG, 120*nB)
      return color
    }
    const c1 = rc()
    const c2 = gaussColor(s, c1, 80)
    let cs = []
    const steps = 5
    for(let i=0;i<steps;i++){
      cs.push(s.lerpColor(c1, c2, i/steps))
    }
    for(let x = 0; x < scene.width; x+=width+2){
      const y = s.random(0.5*height)
      //const color = s.lerpColor(c1, c2, x/scene.width*8)
      thread(scene, x, y, width, height, cs[s.random()*(cs.length-1)<<0], scene.height+3*height)
    }
    if(debug){
      let c = dly.get()
      scene.image(c, 0, 0)
    }
    largeCanvas = scene
    let c = scene.get()
    c.resize(s.width, 0)
    s.image(c, 0, 0)
  }
  
  function braid(scene, st, en, shift, color, shade, shine){
    dly.stroke("blue")
    dly.strokeWeight(2)
    dly.line(...st, ...en)    
    let t = 0.3
    const pt = (t) => [st[0] + t*(en[0] - st[0])+shift, st[1] + t*(en[1] - st[1])]
    const pt1 = pt(0.3)
    const pt2 = pt(0.6)
    dly.strokeWeight(5)
    dly.stroke("red") & dly.point(...pt1)
    dly.stroke("green") &  dly.point(...pt2)
    let bez
    if(shift >= 0){
      bez = [...st, ...pt1, ...pt2, ...en]
    } else {
      bez = [...en, ...pt2, ...pt1, ...st]      
    }
    dly.stroke("purple") & dly.strokeWeight(2)    
    bezierB(dly, ...bez)

    const stroke = Math.abs(1)
    if(!debug){
      scene.fill(color) & scene.stroke(shade) & scene.strokeWeight(stroke)
      scene.bezier(...bez)
      scene.strokeWeight(stroke)
      scene.stroke(shine)
      const wiggled = (pt) => [pt[0]+scene.random(2) << 0, pt[1]-scene.random(2) << 0]
      scene.line(...wiggled(st), ...wiggled(en))
    }
    return [pt1, pt2]
  }
  
  function thread(scene, x, y, width, height, color, length){
    const shade = darken(s, color, 0.8)
    const shine = darken(s, color, 1.6)    
    let st = [x, y]
    let en = [x+width, height]
    dly.stroke("cyan")
    dly.line(x-width, y, x-width, y+length)
    dly.line(x+width, y, x+width, y+length)    
    
    scene.beginShape()
    while(en[1]-height<length){ // Need an extra one
      const [pt1, pt2] = braid(scene, st, en, 0.8*width, color, shade, shine) // Right side
      const [pt3, pt4] = braid(scene, st, en, -0.8*width, color, shade, shine) // Left side
      st[1] = pt4[1]
      en[1] = pt4[1]+height
    }
    scene.endShape()
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