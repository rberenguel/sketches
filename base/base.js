import {
    Command,
    GUI,
    Integer,
    Key,
    Control
} from '../libraries/gui/gui.js'

import {
    getLargeCanvas
} from '../libraries/misc.js'


// Base to avoid writing always the same

const sketch = (s) => {

    let gui

    s.setup = () => {
        let {
            w,
            h
        } = getLargeCanvas(s, 1600)
        let canvas = s.createCanvas(w, h)
        canvas.mousePressed(() => {})
        s.frameRate(20)
        gui = createGUI()
        gui.toggle()
    }

    s.draw = () => {

    }

    function createGUI() {
        let info =
            "Info"
        let subinfo = "Subinfo"
        let S = new Key("s", () => {
            s.save("img.png")
        })
        let saveCmd = new Command(S, "save the canvas")        
        let R = new Key("r", () => {
            gui.spin(() => {
            s.clear();
            s.draw()
            gui.spin();
            });});
    
        let resetCanvas = new Command(R, "reset")

        let incR = new Key(")", () => {})
        let decR = new Key("(", () => {})
        let rInt = new Integer(() => {})
        let rControl = new Control([decR, incR],
            "+/- something", rInt)

        let gui = new GUI("Something, RB 2020/", info, subinfo, [saveCmd,
                resetCanvas],
            [rControl])

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