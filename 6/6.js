import {
  createBaseGUI,
  Command,
  GUI,
  Integer,
  Float,
  Key,
  Control,
  Seeder
} from '../libraries/gui/gui.js'

import {
  getLargeCanvas,
  copyColor,
  signature
} from '../libraries/misc.js'


const sketch = (s) => {

  let gui
  let debug = true
  let dly // Base debug layer, if used

  // Globals needed in controls, commands or deep arguments
  let cfg = {
    hd: 1,
    seeder: undefined,
    largeCanvas: undefined
  }

  let W, H // Helpful globals to avoid typing scene.width so much

  const PI = s.PI

  s.preload = () => {
    cfg.font = s.loadFont("../libraries/fonts/Monoid-Retina.ttf")
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
    cfg.seeder = new Seeder()
    gui = createGUI()
    gui.fetch()
    gui.toggle()
  }

  function column(scene, x, y, w, h, wall){
    // center, size, wall size
    scene.push()
    scene.translate(x, y)
    scene.rectMode(s.CORNERS)
    scene.rect(-wall/2, h/2, wall/2, -h/2)
    scene.rect(-w/2, -wall/2, +w/2, +wall/2)
    scene.pop()
  }

  function wall(scene, x, y, length, wall, angle, dashed){
    scene.push()
    if(dashed){
      scene.drawingContext.setLineDash([5, 15]);
    }
    scene.translate(x, y)
    scene.rotate(angle)
    sketchedLine(scene, 0, -wall/2, length, -wall/2, scene.color("black"))
    sketchedLine(scene, 0, wall/2, length, wall/2, scene.color("black"))
    //scene.line(0, -wall/2, length, -wall/2)
    //scene.line(0, wall/2, length, wall/2)
    scene.pop()
  }

  function support(scene, x, y, length, wall, angle){
    scene.push()
    scene.translate(x, y)
    scene.rotate(angle)
    scene.beginShape()
    scene.vertex(-wall, 0)
    scene.vertex(0, +wall)
    scene.vertex(+wall, 0)
    scene.vertex(0.5*wall, -0.5*wall)
    scene.vertex(-0.5*wall, -0.5*wall)
    scene.endShape(s.CLOSE)
    scene.rectMode(s.CORNERS)
    scene.rect(-wall/2, -length, wall/2, 0)
    scene.pop()
  }

  const nrm = (v) => Math.sqrt(v[0] * v[0] + v[1] * v[1])

  /*function sketchedLine(scene, x1, y1, x2, y2, _color){
    scene.stroke(_color)
    scene.line(x1, y1, x2, y2)
  }*/
  function sketchedLine(scene, x1, y1, x2, y2, _color) {
    let color = copyColor(scene, _color)
    for (let i = 0; i < 20; i++) {
      const p1 = [x1 + cfg.hd * (1 - 2 * scene.random()) << 0, y1 + cfg.hd * (1 - 2 * scene.random()) << 0]
      const p2 = [x2 + cfg.hd * (1 - 2 * scene.random()) << 0, y2 + cfg.hd * (1 - 2 * scene.random()) << 0]
      const v = [p2[0] - p1[0], p2[1] - p1[1]]
      const n = nrm(v)
      const nv = [v[0] / n, v[1] / n]
      const nn = scene.randomGaussian(n, n / 2.0)
      const thirdDiff = (nn - n) / 3
      const np1 = [p1[0] + thirdDiff * nv[0], p1[1] + thirdDiff * nv[1]]
      const np2 = [p2[0] - thirdDiff * nv[0], p2[1] - thirdDiff * nv[1]]
      scene.strokeWeight(scene.random(cfg.hd * 3, cfg.hd * 4) << 0)
      color.setAlpha(scene.random(5, 10))
      scene.stroke(color)
      scene.line(...np1, ...np2)
    }
  }


  function nave(scene, config){//x, y, w, h, wsize){
    /*scene.push()
    scene.translate(x, y)
    scene.stroke("red")
    scene.rectMode(s.CORNERS)
    scene.noFill()
    scene.rect(-0.5*w, -0.5*h, 0.5*w, 0.5*h)
    scene.pop()*/
    const [x, y] = config.naveCenter
    const [w, h] = config.naveSize
    const wsize = config.wallSize
    const lengthColumns = scene.random(4, 8) << 0
    console.log(lengthColumns)
    const gap = w/lengthColumns
    const startx = x - 0.5*w
    const csize = 4*wsize

    //support(scene, startx+gap, y-0.5*h, 0.5*csize, 1.5*wsize, 0)

    wall(scene, startx+gap, y-0.25*h, gap, wsize, PI, true)
    wall(scene, startx+gap, y+0.25*h, gap, wsize, PI, true)
    
    support(scene, startx, y-0.25*h, 0.5*csize, 1.5*wsize, -PI/2) // Left top pillar
    support(scene, startx, y+0.25*h, 0.5*csize, 1.5*wsize, -PI/2) // Left down pillar
    support(scene, startx, y-0.5*h, 0.5*csize, 1.5*wsize, 0) // Left top edge pillars
    support(scene, startx, y-0.5*h, 0.5*csize, 1.5*wsize, -PI/2) // Left top edge pillars
    support(scene, startx, y+0.5*h, 0.5*csize, 1.5*wsize, 0) // Left bottom edge pillars
    support(scene, startx, y+0.5*h, 0.5*csize, 1.5*wsize, -PI/2) // Left bottom edge pillars

    scene.push()
    scene.drawingContext.setLineDash([scene.random(4, 6) << 0, scene.random(13, 16) << 0]);

    //sketchedLine(scene, 0, wall/2, length, wall/2, scene.color("black"))
    sketchedLine(scene, startx, y-0.25*h, startx+gap, y+0.25*h, scene.color("black")) // Middle ceiling left
    sketchedLine(scene, startx, y+0.25*h, startx+gap, y-0.25*h, scene.color("black"))
    sketchedLine(scene, startx, y-0.5*h, startx+gap, y-0.25*h, scene.color("black")) // Top ceiling left
    sketchedLine(scene, startx, y-0.25*h, startx+gap, y-0.5*h, scene.color("black"))
    sketchedLine(scene, startx, y+0.5*h, startx+gap, y+0.25*h, scene.color("black")) // Bottom ceiling left
    sketchedLine(scene, startx, y+0.25*h, startx+gap, y+0.5*h, scene.color("black"))
    scene.pop()

    scene.push()
    scene.strokeWeight(6)
    sketchedLine(scene, startx-wsize, y-0.5*h, startx-wsize, y+0.5*h, scene.color("black"))
    scene.pop()

    wall(scene, startx, y-0.5*h, gap, wsize, 0)
    wall(scene, startx, y+0.5*h, gap, wsize, 0)


    for(let i=1; i <= lengthColumns; i++){
      // Topside
      const x = startx + i*gap
      
      if(i<lengthColumns){
        support(scene, x, y-0.5*h, 0.5*csize, 1.5*wsize, 0)
        wall(scene, x, y-0.5*h, gap, wsize, 0)
      }
      wall(scene, x, y-0.25*h, 0.25*h, wsize, -PI/2, true)
      column(scene, x, y-0.25*h, csize, csize, wsize)
      
      if(i<lengthColumns){
      scene.push()
      scene.drawingContext.setLineDash([5, 15]);
      sketchedLine(scene, x, y-0.25*h, x+gap, y+0.25*h, scene.color("black"))
      sketchedLine(scene, x, y+0.25*h, x+gap, y-0.25*h, scene.color("black"))
      sketchedLine(scene, x, y-0.5*h, x+gap, y-0.25*h, scene.color("black"))
      sketchedLine(scene, x, y-0.25*h, x+gap, y-0.5*h, scene.color("black"))
      sketchedLine(scene, x, y+0.5*h, x+gap, y+0.25*h, scene.color("black"))
      sketchedLine(scene, x, y+0.25*h, x+gap, y+0.5*h, scene.color("black"))
      scene.pop()
      }
      if(i<lengthColumns){
        wall(scene, x, y-0.25*h, gap, wsize, 0, true)
      }

      wall(scene, x, y-0.25*h, 0.5*h, wsize, PI/2, true)
 
      // Downside
      column(scene, x, y+0.25*h, csize, csize, wsize)
      if(i<lengthColumns){
        wall(scene, x, y+0.25*h, gap, wsize, 0, true)
      }
      wall(scene, x, y+0.25*h, 0.25*h, wsize, PI/2, true)
      if(i<lengthColumns){
        support(scene, x, y+0.5*h, 0.5*csize, 1.5*wsize, 0)
        wall(scene, x, y+0.5*h, gap, wsize, 0)
      }
      }
  }

  function transept(scene, config){//}, x, y, w, h, wsize){
    const [x, y] = config.transeptCenter
    const [w, h] = config.transeptSize
    const [wn, hn] = config.naveSize
    const wsize = config.wallSize
    const csize = 4*wsize
    scene.push()
    scene.stroke("red")
    scene.rectMode(s.CORNERS)
    scene.noFill()
    scene.rect(x-0.5*w, y-0.5*h, x+0.5*w, y+0.5*h)
    scene.rect(x-0.5*w, y-0.5*hn, x+0.5*w, y+0.5*hn)
    const outDivisions = scene.random(2, 4) << 0 // Could be more if longer
    const gap = (0.5*h-0.5*hn)/outDivisions
    const starty = y-0.5*h+gap
    for(let i = 0; i < outDivisions; i++){
      const y = starty + i*gap
      column(scene, x-0.25*w, y, csize, csize, wsize)
      column(scene, x+0.25*w, y, csize, csize, wsize)
    }
    scene.pop()
  }

  s.draw = () => {
    let scene = s.createGraphics(cfg.hd * 1800 << 0, cfg.hd * 1200 << 0)
    W = scene.width, H = scene.height
    let dly = s.createGraphics(W, H)
    scene.randomSeed(cfg.seeder.get())
    scene.noiseSeed(cfg.seeder.get())
    dly.randomSeed(cfg.seeder.get())
    dly.noiseSeed(cfg.seeder.get())

    // Here your code against scene and possibly dly
    if (debug && dly) {
      let c = dly.get()
      scene.image(dly, 0, 0)
    }
    scene.colorMode(s.HSB)
    scene.fill("black")
    scene.stroke("black")
    scene.strokeWeight(3)
    const csize = 0.03*H
    const wsize = 0.25*csize
    //column(scene, W/2, H/2, csize, csize, wsize)
    //wall(scene, W/2, H/2, 0.3*H, wsize, 0)

    let cath = {
      naveCenter: [0.2*W, 0.6*H],
      naveSize: [0.3*W, 0.4*H],
      wallSize: wsize,
    }

    cath.transeptCenter = [0.5*W, 0.6*H]
    cath.transeptSize = [0.3*W, 0.7*H]

    nave(scene, cath)//0.2*W, 0.6*H, 0.3*W, 0.4*H, wsize)
    transept(scene, cath)//0.5*W, 0.6*H, 0.3*W, 0.7*H, wsize)
    

    const identifier = `${cfg.seeder.hex()}@${cfg.hd.toPrecision(2)}`
    const sigCfg = {
      s: s,
      scene: scene,
      color: "#101020",
      shadow: "darkgrey",
      fontsize: 9,
      right: scene.width,
      bottom: scene.height,
      identifier: identifier,
      sig: "rb'23",
      hd: cfg.hd,
      font: cfg.font
    }
    signature(sigCfg)

    cfg.largeCanvas = scene
    let c = scene.get()
    c.resize(s.width, 0)
    s.image(c, 0, 0)
  }


  const createGUI = (gui) => {
    cfg.title = "Something, RB 2023/ \u{1F1E8}\u{1F1ED}"
    cfg.info = "Info"
    cfg.subinfo = "Subinfo<br/>Very high resolutions can fail depending on the browser"
    cfg.s = s
    let R = new Key("r", () => {
      gui.spin(() => {
        cfg.s.clear()
        cfg.s.draw()
        gui.spin()
        gui.unmark()
        gui.update()
      })
    })

    let resetCanvas = new Command(R, "reset")        

    cfg.commands = [resetCanvas, cfg.seeder.command]
    cfg.controls = [cfg.seeder.control]

    gui = createBaseGUI(cfg)
    return gui
  }



  s.keyReleased = () => {
    gui.dispatch(s.key)
  }
}

p5.disableFriendlyErrors = true
let p5sketch = new p5(sketch)
