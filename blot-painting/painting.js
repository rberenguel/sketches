import {
    Command,
    GUI,
    Boolean,
    Integer,
    String,
    Float,
    Key,
    Control
} from '../libraries/gui/gui.js'

import {
    createBlots,
    drawCloud,
    drawBlot,
    canvasUpdate,
    blotPtsInMesh
} from '../libraries/blotLibraries.js'

import { mod } from '../libraries/misc.js'

const sketch = (s) => {

    let touched = 0
    let gui
    let blotCount = 20
    let blotSpread = 100
    let blotStrength = 1000
    let vectors = false
    let paint = 0
    let blotPoints, blotPointsArray
    let background, canvas
    let mesh400

    s.preload = () => {
        background = s.loadImage("../resources/gw.jpg");
    }

    s.setup = () => {
        background.resize(s.windowWidth, 0)
        let p5canvas = s.createCanvas(background.width, background.height)
        canvas = s.createGraphics(p5canvas.width, p5canvas.height)
        background.loadPixels()
        mesh400 = baseEvenMesh(400)

        p5canvas.mousePressed(() => {
            gui.update()
            if (touched >= 0) {
                let i = (s.mouseY * background.width + s.mouseX) * 4
                let ink = s.color(background.pixels[i], background.pixels[i +
                    1], background.pixels[i + 2], background.pixels[
                    i + 3])

                drawBlot({
                    s: s,
                    canvas: canvas,
                    background: background,
                    paint: paint
                }, s.mouseX, s.mouseY, ink, {
                    mesh: mesh400,
                    blotPointsArray: blotPointsArray
                }, {
                    blotCount: blotCount,
                    blotStrength: blotStrength,
                    blotSpread: blotSpread,
                    vectors: vectors
                })
            }
            touched++
        })

        gui = createGUI()
        gui.toggle()
        blotPointsArray = new Array(5000)
        blotPoints = 0
    }


    function baseEvenMesh(spread) {
        let pxs = []
        for (let j = 0; j < spread; j++) {
            for (let i = 0; i < spread; i++) {
                let cx = spread / 2.0 - i
                let cy = spread / 2.0 - j
                if (Math.sqrt(cx * cx + cy * cy) > 200) continue
                pxs.push([i, j])
            }
        }
        return pxs
    }


    function createGUI() {
        let info =
            `Tap/click on the canvas to trigger an ink blot with the colour of the (not shown) background image. It will take a bit (it's expensive to compute)`
        let subinfo = `If on mobile, make sure the canvas <br/>is focused first`
        let C = new Key("c", () => {
            canvas.clear()
            s.clear()
        })
        let resetCanvas = new Command(C, "clear the canvas")
        let S = new Key("s", () => {
            canvas.save("img.png")
        })
        let save = new Command(S, "save the canvas")
        let P = new Key("p", () => console.log(performance.getEntriesByType(
            "measure")))
        let perfLog = new Command(P, "log performance to console")

        let cmds = [resetCanvas, save, perfLog]
        let incB = new Key(">", () => blotCount++)
        let decB = new Key("<", () => blotCount--)
        let blotCountInt = new Integer(() => blotCount)
        let blotCountControl = new Control([decB, incB],
            "+/- blot count", blotCountInt)
        let incS = new Key(".", () => {
            blotSpread += 5
        })
        let decS = new Key(",", () => {
            blotSpread -= 5
        })
        let blotSpreadInt = new Integer(() => blotSpread)
        let blotSpreadControl = new Control([decS, incS],
            "+/- blot spread", blotSpreadInt)
        let incI = new Key(")", () => {
            blotStrength *= 2
        })
        let decI = new Key("(", () => {
            blotStrength /= 2
        })
        let blotStrengthFlt = new Float(() => blotStrength)
        let blotStrengthControl = new Control([decI, incI],
            "+/- blot strength", blotStrengthFlt)
        let T = new Key("t", () => {
            paint = mod(paint + 1, 3)

            canvasUpdate({
                s: s,
                canvas: canvas,
                background: background,
                paint: paint
            })
        })

        let backgroundStates = ["solid/blank", "solid/solid", "alpha/solid"]
        let paintString = new String(() => backgroundStates[paint])
        let paintControl = new Control([T],
            "paint/background", paintString)
        let V = new Key("v", () => vectors = !vectors)
        let vectorsBool = new Boolean(() => vectors)
        let vectorControl = new Control([V], "show vectors", vectorsBool)
        let focusedBool = new Boolean(() => s.focused)
        let focusedStatus = new Control(undefined, "canvas focused?",
            focusedBool)
        let controls = [focusedStatus, paintControl,
            blotCountControl, blotSpreadControl,
            blotStrengthControl, vectorControl
        ]
        let gui = new GUI("<a href=\"blot.html\">Blot</a>/<b>Painting</b>, RB 2020/05", info, subinfo, cmds,
            controls)
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
