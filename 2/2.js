import {
  Command,
  GUI,
  Integer,
  Float,
  Key,
  Control
} from '../libraries/gui/gui.js'

import {
  getLargeCanvas, copyColor, darken
} from '../libraries/misc.js'


// Base to avoid writing always the same

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
  // From Piter Pasma
  const smoothStep = (a,b,x)=>(x-=a,x/=b-a,x<0?0:x>1?1:x*x*(3-2*x));

  function wobble(scene, cx, cy, r){
    scene.beginShape()
    const wx = cx + (2*r-scene.random(r)) << 0
    const wy = cy + (2*r-scene.random(r)) << 0    
    for(let i=0;i<=15;i++){
      const w = 0.2*r+0.8*r*scene.noise(cx, cy, i)
      const x = wx + w*Math.cos(i*2*PI/15)
      const y = wy + 2*w*Math.sin(i*2*PI/15)      
      scene.vertex(x, y)
    }
    scene.endShape(s.CLOSE)
  }
  
  
  function updown(scene, x, y, width, length, color){
    let load = []
    let previousLoad = []    
    let maxCap = 0
    for(let i=0;i<width;i+=2){
      load[i] = 1.5*length*scene.noise(i/8)
      if(load[i]>maxCap){
        maxCap = load[i]
      }
      previousLoad[i] = 1
    }
    console.log(length, maxCap)
    let c = copyColor(s, color)
    let d = darken(s, c, 0.95)
    for(let i=0; i< length; i+=1){
      for(let j=0;j<width;j+=2){
        if(i<length/8.0){
          if(scene.noise(j/8) > smoothStep(0, length/8, i)){
            continue
          }
        }
        const pigment = load[j]
        const op = smoothStep(0, maxCap, maxCap-pigment)        
        const previous = previousLoad[j]
        const drop = previous*scene.noise(i/50)+2*scene.random()
        if(pigment > drop){
          load[j]-=drop
          previousLoad[j] = drop          
        } else {
          continue
        }
        if(drop<1){
          //c.setAlpha(255*drop*drop)
        } else {
          //c.setAlpha(255)
        }
        if(scene.random()<0.2){continue}//{c.setAlpha(255-op*255)}
        scene.fill(c)
        scene.strokeWeight(0.5)
        scene.stroke(d)
        //scene.circle(x+j, y+i, 5)
        let ctx = scene.drawingContext
        
        wobble(scene, x+j, y+i, drop/2)
        scene.stroke(c)
        wobble(scene, x+j, y+i, drop/2)
      }
    }
  }
  
  
  // This generates an interesting "at sea" effect, unexpectedly
  function interestingWave(scene, x, y, width, length){
    scene.fill("black")
    scene.stroke("black")
    scene.strokeWeight(1)
    let c = s.color(0, 0, 50, 255)
    for(let i=0; i< length; i+=4){
      const op = smoothStep(0, length, i)
      //console.log(op)
      c.setAlpha(255-200*op)
      scene.fill(c)
      scene.stroke(c)
      //scene.line(x, y+i, x+width, y+i)
      for(let j=0;j<width;j+=3){
        const di = 4-(scene.noise(i/(100*op), j/(100*op))*2*8)
        scene.circle(x+j, y+i+di, 8*scene.noise(i/(100*op), j/(100*op)))
      }
    }
  }
  
  
  s.draw = () => {
    const numPixels = hd * s.width * hd * s.height
    let scene = s.createGraphics(hd * s.width, hd * s.height)
    // Here your code against scene
    scene.background("#999960")
    const w1 = scene.random(0.05*scene.width, 0.1*scene.width)
    const x1 = 0.4*scene.width//scene.random(0.1*scene.width, 0.3*scene.width)
    const y1 = 0.1*scene.height//scene.random(0.2*scene.height, 0.4*scene.height)
    const l1 = scene.random(0.6*scene.height, 0.6*scene.height)
    const black = s.color(10, 10, 10, 240)
    const white = s.color(240, 240, 240, 240)
    const red = s.color(200, 10, 10, 240)
    updown(scene,  x1, y1, w1, 1.5*l1, red)
    scene.noiseSeed(window.performance.now())
    updown(scene,  x1+50, y1, w1, 1.5*l1, white)    
    scene.noiseSeed(window.performance.now())
    updown(scene,  x1+100, y1, w1, 1.5*l1, black)    
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


    let gui = new GUI("Something, RB 2020/", info, subinfo, [saveCmd,
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