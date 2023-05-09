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
    copyColor,
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
    const nrm = (v) => Math.sqrt(v[0]*v[0]+v[1]*v[1])
    
    function sketchedLine(scene, x1, y1, x2, y2, _color){
      let color = copyColor(scene, _color)
        for(let i=0; i < 20; i++){
          const p1 = [x1+cfg.hd*(1-2*scene.random()) << 0, y1+cfg.hd*(1-2*scene.random()) << 0]
          const p2 = [x2+cfg.hd*(1-2*scene.random()) << 0, y2+cfg.hd*(1-2*scene.random()) << 0]          
          const v = [p2[0]-p1[0], p2[1]-p1[1]]
          const n = nrm(v)
          const nv = [v[0]/n, v[1]/n]
          const nn = scene.randomGaussian(n, n/2.0)
          const halfDiff = (nn - n)/2
          const np1 = [p1[0]+halfDiff*nv[0], p1[1]+halfDiff*nv[1]]
          const np2 = [p2[0]-halfDiff*nv[0], p2[1]-halfDiff*nv[1]]
          scene.strokeWeight(scene.random(cfg.hd*3, cfg.hd*4) << 0)
          color.setAlpha(scene.random(0.05, 0.1))
          scene.stroke(color)
          scene.line(...np1, ...np2)
        }      
    }
    
    function sketchedCircle(scene, cx, cy, r, _color){
      scene.noFill()
      let color = copyColor(scene, _color)
      scene.push()
      scene.translate(cx, cy)
      const STEPS = 100
      const sqrtr = Math.sqrt(r/3)
      for(let i=0; i<20;i++){
        scene.rotate(scene.random(0, 2*PI))
        scene.push()
        scene.translate(cfg.hd*(2-4*scene.random()) << 0, cfg.hd*(2-4*scene.random()) << 0)
        const nh = scene.randomGaussian(r, sqrtr)
        const nw = scene.randomGaussian(r, sqrtr)        
        scene.strokeWeight(scene.random(3, 4) << 0)
        color.setAlpha(scene.random(0.05, 0.1))
        scene.stroke(color)
        //scene.ellipse(0, 0, nw, nh)        
        scene.beginShape()
        const innerSteps = scene.randomGaussian(STEPS, STEPS/2)
        for(let j=0; j <= innerSteps; j++){
          const sm = smoothStep(0, STEPS, j)
          const a = j*2*PI/STEPS
          const x = (r+sm*(nh-r))*Math.cos(a)
          const y = (r+sm*(nw-r))*Math.sin(a)
          scene.vertex(x, y)
        }
        scene.endShape()
        scene.pop()
      }
      scene.pop()
    }

    s.draw = () => {
        let scene = s.createGraphics(cfg.hd * s.width, cfg.hd * s.height)
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

        let x1 = scene.random(0.3*scene.width, 0.4*scene.width)
        let x2 = scene.random(0.4*scene.width, 0.6*scene.width)
        let y1 = scene.random(0.2*scene.height, 0.3*scene.height)
        let y2 = scene.random(0.2*scene.height, 0.3*scene.height)        
        
        scene.strokeWeight(1)
        scene.stroke("red")
        scene.colorMode(s.HSB)
        scene.background("white")
        let color = scene.color(0, 0, 0)
        sketchedLine(scene, x1, y1, x2, y2, color)
        const dx = scene.random(0.1*scene.width, 0.2*scene.width)
        const dy = scene.random(0.1*scene.height, 0.2*scene.height)        
        sketchedLine(scene, x2, y2, x2+dx, y2+dy, color)
        sketchedLine(scene, x1, y1, x1+dx, y1+dy, color)        
        sketchedLine(scene, x1+dx, y1+dy, x2+dx, y2+dy, color)
        
        sketchedCircle(scene, 0.2*scene.width, 0.7*scene.height, 0.1*scene.height, color)

        const reddish = s.color(0, 100, 70, 1)
        sketchedCircle(scene, 0.7*scene.width, 0.6*scene.height, 0.3*scene.height, reddish)
        
        const identifier = `${cfg.seeder.get()}@${cfg.hd.toPrecision(2)}`
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
        cfg.title = "Something, RB 2020/"
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