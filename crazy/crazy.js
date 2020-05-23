// Going crazy

// Based on the [Sand Splines](https://inconvergent.net/generative/sand-spline/)
// and [Grains of Sand](https://inconvergent.net/2017/grains-of-sand/) write-ups
// by [Anders Hoff](https://inconvergent.net/#about). It is not exactly the same,
// since I'm drawing the whole segments (curveVertices), not just picking points 
// along a b-spline. The end result, though, is pretty similar.

import {
    Command,
    GUI,
    String,
    Key,
    Control
} from '../libraries/gui.js'


const sketch = (s) => {
    // Parameters

    // Interpolating points in lines. Higher is noisier
    const nPoints = 50
    // When to stop. Used as a stoppers for for the lerp color interpolation as well.
    // Higher is "more dense"
    const MAXITER = 1000
    // Resolution. Full resolution can be saved with S
    const RES = 1000
    // Rows of lines. I think 15 looks best
    const rows = 15
    // Alpha of the line. Anything lower won't show. NOTE: Any background you'd like
    // needs to be added in postprocessing. I suspect this is due to rounding errors,
    // mentioned in the post by Hoff above):  blending on top of anything visible is 
    // going to result in sub-par images. See the keypressed method below to see how
    // to render the image with a background

    const alpha = 0.5
    const FRAMERATE = 50

    let gap, separation, cnt = 0
    let palette, palettes, paletteNames, chosenPalette, paletteReddish, paletteBluish
    let pts
    let gui

    s.setup = () => {
        // The image is drawn on a separate framebuffer and then plotted against the
        // canvas. To disable the additional buffer, remove references.

        s.createCanvas(RES, RES)
        s.colorMode(s.HSB, 360, 100, 100, 100)
        s.blendMode(s.BLEND)
        s.strokeWeight(1)
        // Format: [0] -> [1] (MAXITER/2) [2] -> [3] (MAXITER/2), [4] background
        let paletteBluish = [
            s.color(260, 100, 90, alpha),
            s.color(0, 150, 10, alpha),
            s.color(0, 150, 0, alpha),
            s.color(250, 150, 90, alpha),
            s.color(30, 70, 20, 100),
        ]

        let paletteReddish = [
            s.color(20, 100, 95, alpha),
            s.color(10, 150, 90, alpha),
            s.color(10, 90, 50, alpha),
            s.color(20, 90, 90, alpha),
            s.color(30, 10, 15, 100),
        ]

        let paletteGreenish = [
            s.color(150, 40, 30, alpha),
            s.color(120, 90, 80, alpha),
            s.color(150, 40, 10, alpha),
            s.color(140, 90, 80, alpha),
            s.color(50, 10, 35, 100),
        ]
        // You can switch palettes by pressing P. You can add palettes, they need to
        // have the format above (or you need to tweak the colouring in _draw_)

        palettes = [paletteBluish, paletteReddish, paletteGreenish]
        paletteNames = ["ice", "fire", "lush"]
        chosenPalette = 0
        setPalette()
        s.frameRate(FRAMERATE)

        // Leave some separation between top and left before drawing
        gap = RES / (1.0 * rows)
        separation = (RES - gap) / rows
        gui = createGUI()
        gui.toggle()
        generateLines()

    }

    function generateLines() {
        // Generate the initial lines. These start randomly, as this code was lifted
        // from my [Schotter](https://collections.vam.ac.uk/item/O221321/schotter-print-nees-georg/) implementation

        pts = []
        for (let j = 0; j <= rows; j++) {
            let noiseFactor = 1.1 * j;
            let noiseY = noiseFactor * s.random()
            // No noise at the x component
            pts[j] = pointsInLine(gap / 2, gap / 2 + j * separation, gap /
                2 + rows * separation, gap / 2 + j *
                separation, nPoints)
        }
    }

    function pointsInLine(x1, y1, x2, y2, n) {
        // Returns n points between p1, p2, sorted, including endpoints

        let points = Array(n)
        let vx = x2 - x1
        let vy = y2 - y1
        let rnd = Array(n)
        rnd[0] = 0.0
        for (let i = 1; i < n - 1; i++) rnd[i] = Math.random()
        rnd[n - 1] = 1.0
        rnd = rnd.sort()

        for (let i = 0; i < n; i++) {
            let r = rnd[i]
            let nx = x1 + r * vx
            let ny = y1 + r * vy
            points[i] = [nx, ny]
        }
        return points
    }

    function mod(m, n) {
        // Javascript's modulo ain't no modulo
        return ((m % n) + n) % n
    }

    s.draw = () => {
        cnt++
        if (cnt < MAXITER) {
            for (let j = 0; j <= rows; j++) {
                s.beginShape()
                s.noFill()
                let lerped
                // Coloring starts at a certain shade from the palette and then goes
                // back. In the case of the "bluish", it starts bluish, then darkens
                // and then goes to a turquoise shade on top to balance dark/light.

                if (cnt < MAXITER * 0.5) {
                    lerped = s.lerpColor(palette[0], palette[1], cnt * 1.0 /
                        (0.5 * MAXITER))
                } else {
                    lerped = s.lerpColor(palette[2], palette[3], (cnt -
                        0.5 * MAXITER) * 1.0 / (0.5 * MAXITER))
                }
                s.stroke(lerped)
                for (var i = 0; i < pts[j].length; i++) {
                    let pt = pts[j][i];
                    let [x, y] = pt
                    s.curveVertex(x, y)

                    // After each iteration, we wiggle the points of each line. Each
                    // point is more wiggled the further along the line horizontally
                    // and the further bottom it is on the canvas. Tweaking the wavy
                    // variable can alter the final result, as would a change in the
                    // dampening by a square root, or modifying range to be a cube.

                    let wavy = (i + 1) * (j + 1) / Math.sqrt(nPoints)
                    let range = wavy * 0.01;
                    let offsetX = s.map(s.random([-1, 1]), -1, 1, -range,
                        range);
                    let offsetY = s.map(s.random([-1, 1]), -1, 1, -range,
                        range);
                    pt[0] += offsetX
                    pt[1] += offsetY
                }
                s.endShape()
            }
        } else {
            console.log("Finished")
            s.noLoop()
        }
    }

    function setPalette() {
        palette = palettes[chosenPalette]
    }

    function createGUI() {
        let title =
            `Going Crazy, RB 2020/05`
        let info = undefined
        let subinfo = undefined
        let S = new Key("s", () =>
            s.saveCanvas("img", "png")
        )
        let saveCanvas = new Command(S, "save with alpha")

        let B = new Key("b", () => {
            let cv = s.get()
            let pg = s.createGraphics(RES, RES)
            pg.colorMode(s.HSB)
            pg.background(palette[4])
            pg.image(cv, 0, 0)
            pg.save("img.png")
        })
        let saveCanvasB = new Command(B, "save with dark background")

        let redraw = () => {
            cnt = 0
            generateLines()
            s.clear()
        }

        let incP = new Key(")", () => {
            redraw()
            chosenPalette = mod(chosenPalette + 1, palettes.length)
            setPalette()
        })
        let decP = new Key("(", () => {
            chosenPalette = mod(chosenPalette - 1, palettes.length)
            setPalette()
        })

        let paletteString = new String(() => paletteNames[chosenPalette])

        let paletteControl = new Control([decP, incP],
            "+/- switch palette", paletteString)

        let gui = new GUI(title, info, subinfo, [saveCanvas, saveCanvasB],
            [paletteControl])
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
