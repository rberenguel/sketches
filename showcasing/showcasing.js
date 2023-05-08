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

//import { Perspective } from '../libraries/3rdparty/perspective.js'

import {
    getLargeCanvas,
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
        largeCanvas: undefined,
        backgrounds: []
    }

    let W, H // Helpful globals to avoid typing scene.width so much

    const PI = s.PI

    s.preload = () => {
        cfg.font = s.loadFont("../libraries/fonts/Monoid-Retina.ttf")
        cfg.backgrounds.push(s.loadImage("living_room_1.jpg"))
        //cfg.flows = s.loadImage("../samples/flows.png") // ../samples/flows.png
        //cfg.flows.src = cfg.flows_.canvas.toDataURL()
        const img = new Image(903-475, 378-82)
        img.src = "./synthwave-s.png"
        cfg.flows = img
        //document.body.appendChild(cfg.flows);
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
        const ul = [475, 82]
        const ur = [903, 82]
        const bl = [475, 378]
        const br = [903, 378]
        
        /*cfg.flows.resize(903-475,0)
        let foo = s.createGraphics(cfg.flows.width, cfg.flows.height)                
        foo.image(cfg.flows, 0, 0)
        const durl = foo.canvas.toDataURL("image/png")
        //console.log(durl)
        let img = s.createImg(durl).hide()
        img.elt.width = cfg.flows.width
        img.elt.height = cfg.flows.height*/
        
        cfg.backgrounds[0].resize(scene.width, 0)
        scene.image(cfg.backgrounds[0], 0, 0)
        //cfg.flows_.resize(50, 0)
        //console.log(scene.canvas.toDataURL())
        //scene.translate(ul)
        scene.noStroke()
        scene.rectMode(s.CORNERS)
        //scene.shearY(0.5)        
        //scene.rect(...ul, ...br)
        
        let ctx = scene.drawingContext
        let p = new Perspective(ctx, cfg.flows)
        const cul = [476, 82]
        const cur = [902, 82]
        const cbl = [479, 378]
        const cbr = [899, 378]
        p.draw([
          cul,                               // Top-left [x, y]
          cur,                 // Top-right [x, y]
          cbr,  // bottom-right [x, y]
          cbl                   // bottom-left [x, y]
        ])
        
        scene.strokeWeight(2)
        scene.stroke("#10101099")
        scene.line(...cul, ...cbl)
        scene.line(...cbl, ...cbr)
        scene.line(...cbr, ...cur)
        scene.line(...cur, ...cul)
        /*const identifier = `${cfg.seeder.get()}@${cfg.hd.toPrecision(2)}`
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
        signature(sigCfg)*/

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