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
    signature
} from '../libraries/misc.js'


const sketch = (s) => {

    let gui
    let seed = 42
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