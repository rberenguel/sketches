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
  get, set, sameColor
} from '../libraries/floodfill.js'

// Base to avoid writing always the same

const sketch = (s) => {

  let gui, R, debug=true
  let seed = 42
  const PI = s.PI
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
    R.action()
  }
  s.draw = () => {}
  function plot() {
    const numPixels = hd * s.width * hd * s.height
    let scene = s.createGraphics(hd * s.width, hd * s.height)
    // Here your code against scene
    scene.background("white")
    rose(scene)
    largeCanvas = scene
    let c = scene.get()
    c.resize(s.width, 0)
    s.image(c, 0, 0)
  }

  function rose(scene){
    seed = window.performance.now()
    scene.push()

    let cx = 0
    let cy = 0
    let firstQuarter = [], thirdQuarter = []
    const r1 = 200
    const r2 = 250
    const s1 = scene.random(20,50)
    const s2 = scene.random(20,50)
    const N = 30    
    const foo = scene.random(0.1, 0.7)
    let transform = (scene, apply) => {
      let tx = scene.width/2
      let ty = scene.height/2
      scene.randomSeed(seed)
      if(apply){scene.translate(tx, ty)}
      const angle = scene.random(0, 2*PI)
      if(apply){scene.rotate(angle)}
      let reverser = (x, y) => {
        const nx = (Math.cos(-angle)*x - Math.sin(-angle)*y) << 0
        const ny = (Math.sin(-angle)*x + Math.cos(-angle)*y) << 0
        const mx = nx - tx
        const my = ny - ty
        return [mx, my]
      }
      let transformer = (x, y) => {
        const nx = (Math.cos(angle)*x - Math.sin(angle)*y) << 0
        const ny = (Math.sin(angle)*x + Math.cos(angle)*y) << 0
        const mx = nx + tx
        const my = ny + ty
        return [mx, my]
      }      
      return [reverser, transformer]
    }

    let [reverser, transformer] = transform(scene, true)
    //let [nx, ny] = transformer(0, 0)
    //console.log(nx, ny)
    if(debug){
      scene.strokeWeight(6)
      scene.stroke("green")
      scene.point(0, 0)    
    }

    scene.noFill()
    scene.stroke("black")
    scene.strokeWeight(3)
    
    scene.beginShape()
    let rx = (i) => r1+s1*Math.cos(foo*i*PI/N)*Math.sin(2*i*PI/N)
    let ry = (i) => r2+s2*Math.sin(foo*i*PI/N)*Math.sin(2*i*PI/N)
    let x = cx + rx(N-1)*Math.cos(0)
    let y = cy + ry(N-1)*Math.sin(0)
    scene.vertex(x, y)
    for(let i=0;i<=N;i++){
      const th = i*2*PI/N
      const x = cx + rx(i)*Math.cos(th)
      const y = cy + ry(i)*Math.sin(th)
      if(th < scene.PI/4){
        firstQuarter.push([x, y])
      }
      if(th > scene.PI && th < 3*PI/2){
        thirdQuarter.push([x, y])
      }
      scene.curveVertex(x, y)
      if(debug){
        scene.push()
        scene.stroke("green")
        scene.strokeWeight(6)
        scene.point(x, y)
        scene.pop()
      }
      scene.strokeWeight(3)
    }
    x = cx + rx(1)*Math.cos(0)
    y = cy + ry(1)*Math.sin(0)
    scene.vertex(x, y)
    scene.endShape()    
    let cs = firstQuarter[Math.floor(scene.random() * firstQuarter.length)]
    if(debug){
      scene.push()
      scene.stroke("blue")
      scene.strokeWeight(6)
      scene.point(cs[0], cs[1])    
      scene.pop()
    }
    scene.pop()
    let ts = transformer(cs[0], cs[1])
    let or = transformer(0, 0)
    let dx = or[0]-ts[0], dy = or[1]-ts[1]
    let angle = scene.atan2(dy, dx)+scene.random(0.05*PI, 0.1*PI)
    dx = Math.cos(angle), dy = Math.sin(angle)
    let direction = [dx, dy] //reverser(dx, dy)
    //curveUntilCollision(scene, transform, ts, direction, or)
    
    
    cs = thirdQuarter[Math.floor(scene.random() * thirdQuarter.length)]
    if(debug){
      scene.push()
      scene.stroke("blue")
      scene.strokeWeight(6)
      scene.point(cs[0], cs[1])    
      scene.pop()
    }
    ts = transformer(cs[0], cs[1])
    or = transformer(0, 0)
    dx = or[0]-ts[0], dy = or[1]-ts[1]
    angle = scene.atan2(dy, dx)+scene.random(0.05*PI, 0.1*PI)
    dx = Math.cos(angle), dy = Math.sin(angle)
    direction = [dx, dy] //reverser(dx, dy)
    curveUntilCollision(scene, transform, ts, direction, or)
  }

  function arrow(scene, sx, sy, ex, ey){
    let dx = sx - ex, dy = sy - ey
    const nrm = Math.sqrt(dx*dx+dy*dy)
    dx = dx/nrm, dy = dy/nrm
    const nx = dy, ny = -dx
    scene.push()
    scene.line(sx, sy, ex, ey)
    const lx = ex+0.1*nrm*dx-0.02*nrm*nx
    const ly = ey+0.1*nrm*dy-0.02*nrm*ny
    const rx = ex+0.1*nrm*dx+0.02*nrm*nx
    const ry = ey+0.1*nrm*dy+0.02*nrm*ny    
    scene.triangle(lx, ly, ex, ey, rx, ry)
    scene.pop()
  }
  
  function curveUntilCollision(scene, transform, start, direction, origin){
    let [x, y] = start
    let [dx, dy] = direction
    let [ox, oy] = origin
    scene.loadPixels()
    if(debug){
      scene.push()
      scene.stroke("red")
      scene.strokeWeight(8)
      scene.point(x, y)
      scene.strokeWeight(5)
      const ex = x+150*dx, ey = y+150*dy
      arrow(scene, x, y, ex, ey)
      scene.pop()
    }
    // Will tilt rightwards
    // Find endpoint

    let i = 0, count = 0
    let cex, cey
    while(true){
      let nx = x+15*dx+2*i*dx, ny = y+15*dy+2*i*dy
      const color = get(scene, nx<<0, ny<<0)
      if(sameColor(color, [0, 0, 0, 255])){
        if(debug){
          scene.push()
          scene.strokeWeight(10)
          scene.stroke("orange")
          scene.point(nx, ny)
          scene.pop()
        }
        cex = nx, cey = ny
        break
      }
      if(debug){
        scene.push()
        scene.strokeWeight(3)        
        scene.stroke("blue")
        scene.point(nx<<0, ny<<0)
        scene.pop()
      }      
      i++
      count++
    }
    let ddx = cex - x, ddy = cey -y    
    let nnx = -ddy, nny = ddx
    let nrm = Math.sqrt(nnx+nnx+nny*nny)
    nnx = nnx/nrm, nny = nny/nrm
    let mx = x + ddx/2, my = y + ddy/2
    let distm = Math.sqrt((ox-mx)*(ox-mx) + (oy-my)*(oy-my))
    let c1x = x+(cex-x)/3, c1y = y+(cey-y)/4
    c1x = c1x + distm*nnx, c1y = c1y + distm*nny
    let c2x = x+3*(cex-x)/4, c2y = y+3*(cey-y)/4
    c2x = c2x + distm*nnx, c2y = c2y + distm*nny

    if(debug){
      scene.push()
      scene.stroke("purple")
      scene.strokeWeight(10)
      scene.point(cex, cey)
      scene.point(mx, my)
      scene.point(x, y)
      scene.stroke("red")
      scene.point(c1x, c1y)
      scene.point(c2x, c2y)
      scene.strokeWeight(2)
      scene.stroke("purple")
      scene.line(x, y, c1x, c1y)
      scene.line(c1x, c1y, c2x, c2y)      
      scene.line(c2x, c2y, cex, cey)
      scene.line(mx, my, mx+distm*nnx, my+distm*nny)
      scene.pop()
    }
    scene.strokeWeight(3)
    scene.stroke("black")
    scene.noFill()
    scene.beginShape()
    scene.vertex(x, y) // Anchor 1
    scene.bezierVertex(c1x, c1y, c2x, c2y, cex, cey) // C1, C2, Anchor 2
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
    R = new Key("r", () => {
      gui.spin(() => {
        s.clear();
        plot()
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