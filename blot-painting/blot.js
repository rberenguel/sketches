import {
    createBlots,
    drawCloud,
    drawBlot,
    canvasUpdate,
    blotPtsInMesh,
    paintPalette
} from '../libraries/blotLibraries.js'

import {
    Command,
    GUI,
    Boolean,
    Integer,
    String,
    Float,
    Key,
    Control
} from '../libraries/gui.js'

import {
    getLargeCanvas,
    mod
} from '../libraries/misc.js'

const sketch = (s) => {

    let randomColor = false
    let palette = []
    let touched = 0
    let gui
    let blotCount = 20
    let blotSpread = 100
    let blotStrength = 1000
    let vectors = false
    let paint = 0
    let drawPotential = false
    let blotPoints, blotPointsArray
    let background, canvas
    let mesh400


    s.setup = () => {
        let {
            w,
            h
        } = getLargeCanvas(s, 1600)
        let p5canvas = s.createCanvas(w, h)
        background = s.createGraphics(p5canvas.width, p5canvas.height)
        canvas = s.createGraphics(p5canvas.width, p5canvas.height)
        mesh400 = baseEvenMesh(400)
        let palette = paintPalette(s)
        p5canvas.mousePressed(() => {
            gui.update()
            if (touched >= 0) {
                let ink = s.color(s.random(20))
                if (randomColor)
                    ink = palette[mod(touched - 1, palette
                        .length)]
                background.clear()
                drawBlot({
                    s: s,
                    canvas: canvas,
                    background: background,
                    paint: paint,
                    drawPotential: drawPotential,
                }, s.mouseX, s.mouseY, ink, {
                    mesh: mesh400,
                    blotPointsArray: blotPointsArray
                }, {
                    blotCount: blotCount,
                    blotStrength: blotStrength,
                    blotSpread: blotSpread,
                    vectors: vectors,
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
            `Tap/click on the canvas to trigger an ink blot. It will take a bit (it's expensive to compute)`
        let subinfo =
            `If on mobile, make sure the canvas <br/>is focused first`
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
        let R = new Key("r", () => randomColor = !randomColor)
        let randomColorBool = new Boolean(() => randomColor)
        let rndColorControl = new Control([R], "toggle random colors",
            randomColorBool)
        let T = new Key("t", () => {
            paint = mod(paint + 1, 3)

            canvasUpdate({
                s: s,
                canvas: canvas,
                background: background,
                paint: paint,

            })
        })

        let backgroundStates = ["solid/blank", "solid/solid", "alpha/solid"]
        let paintString = new String(() => backgroundStates[paint])
        let paintControl = new Control([T],
            "paint", paintString)

        let V = new Key("v", () => vectors = !vectors)
        let vectorsBool = new Boolean(() => vectors)
        let vectorControl = new Control([V], "show vectors", vectorsBool)
        let F = new Key("F", () => drawPotential = !drawPotential)
        let potentialBool = new Boolean(() => drawPotential)
        let potentialControl = new Control([F], "generate field strength",
            potentialBool)

        let focusedBool = new Boolean(() => s.focused)
        let focusedStatus = new Control(undefined, "canvas focused?",
            focusedBool)
        let controls = [focusedStatus, paintControl, potentialControl,
            rndColorControl, blotCountControl, blotSpreadControl,
            blotStrengthControl, vectorControl
        ]
        let gui = new GUI(
            "<b>Blot</b>/<a href=\"painting.html\">Painting</a>, RB 2020/05",
            info, subinfo, cmds,
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