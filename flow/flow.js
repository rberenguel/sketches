import {
    Command,
    GUI,
    Integer,
    Float,
    String,
    Key,
    Control
} from '../libraries/gui/gui.js'

import {
    getLargeCanvas
} from '../libraries/misc.js'

import {
    solarizedDark,
    solarizedDarkPalette,
    wernerBase,
    wernerBasePalette,
	shimmeringColorArray
} from '../libraries/palettes.js'

const sketch = (s) => {

    let PI = s.PI
    let gui
    let largeCanvas
    let hd = 1
    let freq = 8
    let squiggly //1 / 800.0
    let lineStroke = 0.8 * hd
    let dist = 1.2 * lineStroke
    let layers = 10
    let R
    let palette = {}

    const werner = () => {
        palette.colors = wernerBasePalette,
        palette.name = "Werner",
        palette.background = wernerBase.lightBrown
    }

    const solarized = () => {
        palette.colors = solarizedDarkPalette,
        palette.name = "SolarizedDark",
        palette.background = solarizedDark.base01
    }

    const shimmering = () => {
        palette.colors = shimmeringColorArray,
        palette.name = "Shimmering",
        palette.background = shimmeringColorArray[0]
    }

	
	// Mostly the implementation in here: 
	// https://www.schmidtynotes.com/blog/p5/2022-03-05-random-vectors/
	// with added stop conditions
	
    class Particle {
        constructor(rand, x, y, size, color, alpha, _dist) {
            this.x = x;
            this.y = y;
            this.size = size;
            this.color = color;

            this.alpha = alpha ? _alpha : 10;
            this.dist = _dist ? _dist : dist;
            this.stopped = false
            this.rand = rand
        }
        move(scene) {
            let theta = scene.noise(this.x * squiggly + this.rand, this.y * squiggly + this.rand) * PI * 2;
            let v = p5.Vector.fromAngle(theta, this.dist)
            this.x += v.x;
            this.y += v.y;
        }
        draw(scene) {
            const na = scene.random(0.5 * this.alpha, this.alpha)
            this.color.setAlpha(na)
            scene.fill(this.color)
            const ns = scene.random(0.4 * this.size, 2 * this.size)
            scene.ellipse(this.x, this.y, ns)
        }
        stop(scene) {
            if (this.x > scene.width || this.x < 0) {
                this.dist = 0;
                this.stopped = true
            }
            if (this.y > scene.height || this.y < 0) {
                this.dist = 0;
                this.stopped = true
            }
        }
    }


    s.setup = () => {
        let {
            w,
            h
        } = getLargeCanvas(s, 1600)
        let canvas = s.createCanvas(w, h)
        squiggly = 1 / (Math.max(s.width, s.height) * 0.7)
        s.pixelDensity(1)
        canvas.mousePressed(() => {})
        s.frameRate(1)
        solarized()
        gui = createGUI()
        gui.toggle()
        s.noStroke()
        s.noLoop()
        R.action()
    }

    function allStop(particles) {
        let cond = true
        for (let p of particles) {
            cond = cond && p.stopped
            if (!cond) {
                return false
            }
        }
        return true
    }

    function createParticles(scene, whatever) {
        let particles = [];
        const seed = scene.noise(whatever)
        const base = scene.random(freq)
        for (let x = base; x < scene.width; x += freq) {
            let _x = x;
            let stroke = lineStroke;
            let c = (scene.noise(_x * squiggly) * palette.colors.length) << 0
            let color = scene.color(palette.colors[c])
            particles.push(new Particle(seed, _x, 0, stroke, color));
            particles.push(new Particle(seed, _x, scene.height, stroke, color));
        }
        for (let y = base; y < scene.height; y += freq) {
            let _y = y;
            let stroke = lineStroke;
            //let c = scene.random(palette.length) << 0
            let c = (scene.noise(_y * squiggly) * palette.colors.length) << 0
            let color = scene.color(palette.colors[c])
            particles.push(new Particle(seed, 0, _y, stroke, color));
            particles.push(new Particle(seed, scene.width, _y, stroke, color));
        }
        return particles
    }

    function stepThrough(scene, particles) {
        while (!allStop(particles)) {
            for (let p of particles) {
                if (p.stopped) {
                    continue
                }
                p.draw(scene);
                p.move(scene);
                p.stop(scene);
            }
        }
    }

    function plot() {
        let scene = s.createGraphics(hd * s.width, hd * s.height)
        scene.background(palette.background)
        scene.noStroke()
        let particles
        for (let i = 0; i < layers; i++) {
            particles = createParticles(scene, (0.4 * i) / layers)
            stepThrough(scene, particles)
        }
        largeCanvas = scene
        let c = scene.get()
        c.resize(s.width, 0)
        s.image(c, 0, 0)

    }

    function createGUI() {
        let info =
            "Particle flow in noise field"
        let subinfo = "It's slightly slow, but the result pays.<br/>Very high resolutions can fail depending on the browser"
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

        let sol = new Key("1", solarized)
        let solCmd = new Command(sol, "Solarized Dark palette")
        let wer = new Key("2", werner)
        let werCmd = new Command(wer, "Werner nomenclature palette")
        let shi = new Key("3", shimmering)
        let shiCmd = new Command(shi, "Pollock's shimmering palette")
        let paletteShow = new String(() => palette.name)
        let paletteControl = new Control([],
            "Current palette", paletteShow)
        let resetCanvas = new Command(R, "reset")

        let incR = new Key(")", () => {
            layers += 10
        })
        let decR = new Key("(", () => {
            if (layers > 10) {
                layers -= 10
            }
        })
        let rInt = new Integer(() => layers)
        let rControl = new Control([decR, incR],
            "+/- layering", rInt)

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


        let gui = new GUI("Flowing, RB 2023/04", info, subinfo, [saveCmd,
                resetCanvas, solCmd, werCmd, shiCmd
            ],
            [paletteControl, rControl, hdControl])

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