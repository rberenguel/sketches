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
    let i = 0

    let R

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
        cfg.frag = s.loadStrings('lif.frag')
        cfg.vert = s.loadStrings('lif.vert')
    }

    s.setup = () => {
        let {
            w,
            h
        } = getLargeCanvas(s, 1600)
        let canvas = s.createCanvas(w, h)
        s.pixelDensity(1)
        canvas.mousePressed(() => {})
        s.frameRate(60)

        cfg.seeder = new Seeder() // fails silently 🤔
        gui = createGUI()
        gui.toggle()
        R.action()
        s.noLoop()
    }


    function initialize() {
        cfg.s1 = s.createGraphics(cfg.hd * 1800 << 0, cfg.hd * 1200 << 0, s.WEBGL)
        W = cfg.s1.width
        H = cfg.s1.height

        cfg.s2 = s.createGraphics(W, H, s.WEBGL)
        cfg.sh1 = cfg.s1.createShader(cfg.vert.join("\n"), cfg.frag.join("\n"))
        cfg.sh2 = cfg.s2.createShader(cfg.vert.join("\n"), cfg.frag.join("\n"))

        cfg.s1.shader(cfg.sh1)
        cfg.s2.shader(cfg.sh2)
        cfg.sh1.setUniform("u_canvas", cfg.s2)
        cfg.sh2.setUniform("u_canvas", cfg.s1)
        cfg.sh1.setUniform("dx", 1.0 / W)
        cfg.sh1.setUniform("dy", 1.0 / H)
        cfg.sh2.setUniform("dx", 1.0 / W)
        cfg.sh2.setUniform("dy", 1.0 / H)

        s.clear()
        cfg.s1.clear()
        cfg.s2.clear()
        cfg.s2.fill(3)
        cfg.s2.stroke(3)
        cfg.s2.strokeWeight(1)
        cfg.s1.randomSeed(cfg.seeder.get())
        cfg.s1.noiseSeed(cfg.seeder.get())
        cfg.s2.randomSeed(cfg.seeder.get())
        cfg.s2.noiseSeed(cfg.seeder.get())
        for (let i = 0; i < 50000 * cfg.hd << 0; i++) {
            cfg.s2.point(cfg.s2.random(-W, W), cfg.s2.random(-H, H))
        }
        s.loop()
    }


    s.draw = () => {
        let c
        cfg.sh1.setUniform("u_canvas", cfg.s2)
        cfg.sh2.setUniform("u_canvas", cfg.s1)
        if (i % 2 == 0) {
            cfg.s1.rect(-W / 2, -H / 2, W, H)
            cfg.largeCanvas = cfg.s1
            c = cfg.s1.get()
        } else {
            cfg.s2.rect(-W / 2, -H / 2, W, H)
            cfg.largeCanvas = cfg.s2
            c = cfg.s2.get()
        }
        i++
        c.resize(0, s.height)
        if (c.width > s.width) {
            c.resize(s.width, 0)
        }
        const gap = s.width - c.width
        s.push()
        if (gap > 0) {
            s.translate(gap / 2, 0)
        }
        s.image(c, 0, 0)
        s.pop()

    }


    const createGUI = (gui) => {
        cfg.title = "Lif, RB 2023/6 \u{1F1E8}\u{1F1ED}"
        cfg.info = "Game of Life implemented in a shader (so fast it loses an E)"
        cfg.subinfo = "It was very hard to get this to work, even if it's basic. Uses a couple canvases I keep swapping as images, as far as I understand shaders and GLSL at the moment using framebuffers could be better. 3 years ago I had a lot of fun with Life variations… and I have several simulations I want to run pixel by pixel, this was a good first step."
        cfg.s = s
        R = new Key("r", () => {
            gui.spin(() => {
                i = 0
                initialize()
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


    /*
	
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
	
	*/


    s.keyReleased = () => {
        gui.dispatch(s.key)
    }
}

p5.disableFriendlyErrors = true
let p5sketch = new p5(sketch)