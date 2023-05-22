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

import {
  solarizedDark
} from '../libraries/palettes.js'

const sketch = (s) => {

    let gui, R
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
        R.action()
    }

    function plot() {
        let scene = s.createGraphics(cfg.hd * s.width << 0, cfg.hd * s.height << 0)
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

        const Ra = H/4
        const cx = W/2
        const cy = H/2
        scene.background(solarizedDark.base01)
        scene.colorMode(s.HSB)
        scene.noStroke()
        //scene.strokeWeight(cfg.hd)
        scene.noFill()
        const steps = 15000*Math.sqrt(Math.sqrt(cfg.hd))
        const shift = 360*scene.random()
        for(let i = 0; i < steps; i++){
            const th1 = i/steps*2*PI
            const _h = shift + 90*i/steps
            const h = _h > 360 ? _h - 360 : _h
            const s = scene.random(50, 100)
            const b = scene.random(50, 100)
            const alpha = 0.05+0.3*scene.noise(th1)
            let color = scene.color(h, s, b, alpha)
            scene.fill(color)
            const th2 = scene.random(0, 2*PI)
            const th3 = scene.random(0, 2*PI)
            const th4 = th1+PI//scene.random(0, 2*PI)
            const f1 = scene.random(0.4, 1.6)
            const f = scene.random(0.2, 1.8)
            const f2 = scene.random(0.4, 1.6)
            const rs = [f1*Ra, f*Ra, f*Ra, f2*Ra]
            const ths = [th1, th2, th3, th4]
            let curvex = []
            let curvey = []
            for(let j = 0; j < rs.length; j++){
                const th = ths[j]
                const r = rs[j]
                const x = cx+r*Math.cos(th)
                const y = cy+r*Math.sin(th)
                curvex.push(x)
                curvey.push(y)
            }
            const dots = 100*Math.sqrt(Math.sqrt(cfg.hd))
            const size = 5 * cfg.hd * scene.noise(i) << 0 
            for(let k = 0; k < dots; k++){
                const dt = k/dots
                const ns = (1-smoothStep(0, dots, k))*size << 0
                color.setAlpha(0.05+(1-smoothStep(0, dots, k))*alpha)
                scene.fill(color)
                const x = scene.curvePoint(...curvex, dt)
                const y = scene.curvePoint(...curvey, dt)
                scene.circle(x, y, 1+ns)
            }
        }

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
        cfg.title = "Creation, RB 2023/05 \u{1F1E8}\u{1F1ED}"
        cfg.info = "A quick 'what if'"
        cfg.subinfo = "Just many dots over curves trapped in random circles. It is very slightly not resolution independent, but it almost is.<br/>Very high resolutions can fail depending on the browser"
        cfg.s = s
        R = new Key("r", () => {
            gui.spin(() => {
                cfg.s.clear()
                gui.spin()
                plot()
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
