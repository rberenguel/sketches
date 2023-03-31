import {
    Command,
    GUI,
    String,
    Key,
    Control
} from '../libraries/gui/gui.js'

import {
    getLargeCanvas
} from '../libraries/misc.js'

import {
    granulateChannels
} from '../libraries/effects.js'

// Base to avoid writing always the same

const sketch = (s) => {

    let gui, canvas, inner = 15,
        outer = 25

    s.setup = () => {
        let {
            w,
            h
        } = getLargeCanvas(s, 1600)
        canvas = s.createCanvas(w, h)
        canvas.mousePressed(() => {})
        s.frameRate(20)
        gui = createGUI()
        gui.toggle(() => {
            gui.spin(() => {
                plot();
                gui.spin();
            });
        });
    }

    function pencil(x, y, inner, outer, leadColor) {
		// Draws a pencil bottom with these parameters. Leadcolor is used
		// for the outer color, lead proper uses a darker shade via color
		// lerping.
        let center = {
            x: x,
            y: y
        }
        const [r, g, b] = [s.noise(x, y), s.noise(y, x), s.noise(x + y, y * x)]
        let lightBrown = s.color(224 + 30 * r, 158 + 30 * g, 64 + 30 * b, 100)
        const darkBrown = s.color(151, 95, 49)
		// Outer shell, filled in noised brown-ish
		// Possible improvement: very subtle (1-2 px) curve
        s.beginShape()
        s.stroke(leadColor)
        s.strokeWeight(3)
        s.fill(darkBrown)
        for (let i = 0; i < 6; i++) {
            let hex = center.x + outer * s.cos(i * 2.0 * s.PI / 6)
            let hey = center.y + outer * s.sin(i * 2.0 * s.PI / 6)
            s.vertex(hex, hey)
        }
        s.endShape(s.CLOSE)
        // Color veins from outside to simulate color bleed from the 
		// outer shell.
        let density = 10
        let factor = 10
        s.stroke(leadColor)
        for (let i = 0; i <= 5; i++) {
            let x1 = center.x + outer * s.cos(i * 2.0 * s.PI / 6)
            let y1 = center.y + outer * s.sin(i * 2.0 * s.PI / 6)
            let x2 = center.x + outer * s.cos((i + 1) * 2.0 * s.PI / 6)
            let y2 = center.y + outer * s.sin((i + 1) * 2.0 * s.PI / 6)
            s.strokeWeight(2 * s.noise(x1, y1))
            for (let j = 0; j < density; j++) {
                let startx = x1 + j * (x2 - x1) / density
                let starty = y1 + j * (y2 - y1) / density
                let dx = center.x - startx
                let dy = center.y - starty
                let norm = Math.sqrt(dx * dx + dy * dy)
                let length = s.noise(startx, starty)
                let endx = startx + dx * length * factor / norm
                let endy = starty + dy * length * factor / norm
                s.line(startx, starty, endx, endy)
            }
        }
        // Simulating wood grain using a similar trick to what I did
		// in Iris. Lines from out to in, lighter brown with transparency
        density = 30
        factor = 35
        let shift = 3
        for (let i = 0; i <= 5; i++) {
            let x1 = center.x + outer * s.cos(i * 2.0 * s.PI / 6)
            let y1 = center.y + outer * s.sin(i * 2.0 * s.PI / 6)
            let x2 = center.x + outer * s.cos((i + 1) * 2.0 * s.PI / 6)
            let y2 = center.y + outer * s.sin((i + 1) * 2.0 * s.PI / 6)
            s.strokeWeight(2 * s.noise(x1, y1))
            for (let j = 0; j < density; j++) {
                lightBrown.setAlpha(50 + 10 * s.noise(i, j))
                s.stroke(lightBrown)
                let squish = s.noise(i, j)
                let startx = x1 + (j + squish) * (x2 - x1) / density
                let starty = y1 + (j + squish) * (y2 - y1) / density
                let dx = center.x - startx
                let dy = center.y - starty
                let norm = Math.sqrt(dx * dx + dy * dy)
                let length = s.noise(startx, starty)
                let endx = startx + dx * length * factor / norm
                let endy = starty + dy * length * factor / norm
                s.line(startx + dx * shift / norm, starty + dy * shift / norm, endx, endy)
            }
        }
        // Same but coming from inside
        density = 150
        factor = outer
        shift = 0
        for (let i = 0; i <= 5; i++) {
            const x1 = center.x + outer * s.cos(i * 2.0 * s.PI / 6)
            const y1 = center.y + outer * s.sin(i * 2.0 * s.PI / 6)
            const x2 = center.x + outer * s.cos((i + 1) * 2.0 * s.PI / 6)
            const y2 = center.y + outer * s.sin((i + 1) * 2.0 * s.PI / 6)
            s.strokeWeight(s.noise(y1, x1))
            for (let j = 0; j < density; j++) {
                lightBrown.setAlpha(30 + 10 * s.noise(i * x, j))
                s.stroke(lightBrown)
                const endx = x1 + j * (x2 - x1) / density
                const endy = y1 + j * (y2 - y1) / density
                const dx = endx - center.x
                const dy = endy - center.y
                const norm = Math.sqrt(dx * dx + dy * dy)
                const length = s.noise(i, j)
                s.line(center.x + dx * shift / norm, center.y + dy * shift / norm, center.x + dx * length / norm * factor, center.y + dy * length / norm * factor)
            }
        }
        // Wiggly inner lead, similar to the main color in iris, using
		// a poorly closed curve
        const black = s.color(0)
        const darkLead = s.lerpColor(leadColor, black, 0.2)
        const evenDarkerLead = s.color(leadColor, black, 0.4)
        const adjustedLength = inner / 10
        s.beginShape()
        for (let i = 0; i < 50; i++) {
            const angle = i * s.TWO_PI / 50
            const colour = s.lerpColor(darkLead, evenDarkerLead, s.random())
            s.fill(darkLead)
            s.stroke(evenDarkerLead)
            const r = inner / 2 + adjustedLength * s.noise(x * y * i)
            s.curveVertex(x + r * Math.cos(angle), y + r * Math.sin(angle))
        }
        s.endShape(s.CLOSE)
    }

    function plot() {
        s.background(s.color(0))
        let arch = outer - outer * Math.sqrt(3) / 2;
        const hgap = outer + 2 * outer + 6
        const vgap = outer - arch + 2
		// Set up for an hexagonal grid with a very mild gap between
		// each pencil
        for (let i = 0; i <= s.width / hgap + hgap; i++) {
            for (let j = 0; j <= s.height / vgap + vgap; j++) {
                const hshift = j % 2 == 0 ? -2 : outer / 2 + outer + 1
                const vshift = j % 2 != 0 ? 0 : 0
                pencil(i * hgap + hshift, j * vgap + vshift, inner, outer, s.color(200 * s.noise(i * j), 200 * s.noise(i, j), 200 * s.noise(j, i)))
            }

        }
		// This granulate is based on a blog post, link in the source.
		// Granulating improves the wooden feeling by a lot.
        granulateChannels(s, [inner / 3, inner / 3, inner / 3, inner / 2])
    }

    s.draw = () => {
        s.noLoop()
    }

    function createGUI() {
        let info =
            "Inspired by <a href=\"https://twitter.com/meezwhite/status/1611791711969181697?s=12&t=ym-awO5tGUYR8G03Ua4bww\">this</a> Genuary entry by <a href=\"https://twitter.com/meezwhite\">meezwhite</a>"
        let subinfo = "Tap the canvas to enable the controls below"
        let S = new Key("s", () => {
            s.save("img.png")
        })
        let saveCmd = new Command(S, "save the canvas")
        let R = new Key("r", () => {
            gui.spin(() => {
                canvas.clear();
                s.noiseSeed(s.random(-100, 100))
                plot();
                gui.spin();
            });
        });
        let resetCanvas = new Command(R, "redraw")

        let incR = new Key(")", () => {
            inner += 5
            outer += 7
        })
        let decR = new Key("(", () => {
            if (inner > 5) {
                inner -= 5
                outer -= 7
            }
        })
        let rInner = new String(() => inner + "/" + outer)
        let rInnerControl = new Control([decR, incR],
            "+/- inner/outer radius", rInner)

        let gui = new GUI("Pencils, RB 2023/03", info, subinfo, [saveCmd,
                resetCanvas
            ],
            [rInnerControl])

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