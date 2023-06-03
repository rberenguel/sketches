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
  signature,
  smoothStep
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
    gui.toggle()
  }

  function flower(cfg, level){
    const scene = cfg.flowerScene
    let hh = 0
    let ss = 70
    let bb = 90
    let a = 0.05
    scene.noStroke()
    for(let i=0;i<50;i++){
      const h = (scene.random(-60, 0) + 360) % 360
      const s = ss*scene.random(0.5, 1.1)
      const b = ss*scene.random(0.5, 1.1)
      const x = -15+30*scene.random()
      const y = -15+30*scene.random()
      const r = 12+scene.random(5*level)
      const color = scene.color(h, s, b, a)
      scene.fill(color)
      scene.circle(x, y, r)
    }
  }

  function branch(depth, cfg, side){
    const scene = cfg.branchScene
    const flowerScene = cfg.flowerScene
    const maxDepth = cfg.maxDepth
    const f = 1-smoothStep(0, maxDepth, depth)
    const color = scene.color(cfg.col.h, cfg.col.s*f, cfg.col.b*f)
    cfg.col.s*=0.95
    cfg.col.b*=0.99
    scene.stroke(color)
    if (depth < maxDepth) { 
      const f = H/10
      //scene.line(0,0,0,-f); // draw a line going up
      const corr = side !== undefined ? side : 1
      const ctlMove = corr*(0.1*scene.random()*f)
      const anc1 = [0, 0]
      const ctl1 = [ctlMove, -f*0.3]
      const ctl2 = [ctlMove, -f*0.6]
      const anc2 = [0, -f]
      scene.bezier(...anc1, ...ctl1, ...ctl2, ...anc2)
      flower(cfg, depth)
      { 
        scene.translate(0,-f); // move the space upwards
        flowerScene.translate(0, -f)
        const wiggle = scene.random(-0.05,0.05)
        scene.rotate(wiggle);  // random wiggle
        flowerScene.rotate(wiggle)
        if (scene.random() < cfg.branching*smoothStep(0, depth, maxDepth) || depth < depth/2){ // branching   
          scene.rotate(0.3); // rotate to the right
          flowerScene.rotate(0.3); // rotate to the right
          //scene.scale(0.8); // scale down
          if(scene.random() < cfg.branchingRight*(1-smoothStep(0, maxDepth, depth))){
            scene.push(); // now save the transform state
            flowerScene.push()
            branch(depth + 1, cfg, -corr); // start a new branch!
            flowerScene.pop()
            scene.pop(); // go back to saved state
          }
          scene.rotate(-0.6); // rotate back to the left 
          flowerScene.rotate(-0.6); // rotate back to the left 
          if(scene.random() < cfg.branchingLeft*(1-smoothStep(0, maxDepth, depth))){
            scene.push(); // save state
            flowerScene.push()
            branch(depth + 1, cfg, -corr);   // start a second new branch 
            flowerScene.pop()
            scene.pop(); // back to saved state        
          }
        } 
        else { // no branch - continue at the same depth  
          branch(depth, cfg, corr);
        } 
      } 
    }
  } 


  s.draw = () => {
    let scene = s.createGraphics(cfg.hd * s.width << 0, cfg.hd * s.height << 0)
    W = scene.width, H = scene.height
    let flowerScene = s.createGraphics(W, H)
    let branchScene = s.createGraphics(W, H)
    let dly = s.createGraphics(W, H)
    scene.randomSeed(cfg.seeder.get())
    scene.randomSeed(cfg.seeder.get())
    flowerScene.noiseSeed(cfg.seeder.get())
    flowerScene.noiseSeed(cfg.seeder.get())
    branchScene.noiseSeed(cfg.seeder.get())
    branchScene.noiseSeed(cfg.seeder.get())
    dly.randomSeed(cfg.seeder.get())
    dly.noiseSeed(cfg.seeder.get())

    // Here your code against scene and possibly dly
    if (debug && dly) {
      let c = dly.get()
      scene.image(dly, 0, 0)
    }

    branchScene.noFill()
    branchScene.strokeWeight(5); 
    branchScene.colorMode(s.HSB)
    scene.colorMode(s.HSB)
    scene.background(scene.color(70, 20, 60))
    flowerScene.colorMode(s.HSB)
    const branchConfig = {
      branchScene: branchScene,
      flowerScene: flowerScene,
      maxDepth: 15,
      branching: 0.5,
      branchingRight: 1.0,
      branchingLeft: 0.7,
      col: {h: 0, s: 50, b: 30}
    }
    branchScene.push()
    flowerScene.push()
    branchScene.translate(W,H-20); 
    flowerScene.translate(W,H-20); 
 
    branchScene.rotate(-PI/4)
    flowerScene.rotate(-PI/4)
    branch(0, branchConfig) 
    flowerScene.pop()
    branchScene.pop()
    let f = flowerScene.get()
    let b = branchScene.get()
    scene.image(branchScene, 0, 0)
    scene.image(flowerScene, 0, 0)
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
    //signature(sigCfg)

    cfg.largeCanvas = scene
    let c = scene.get()
    c.resize(s.width, 0)
    s.image(c, 0, 0)
  }


  const createGUI = (gui) => {
    cfg.title = "Something, RB 2023/05 \u{1F1E8}\u{1F1ED}"
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
