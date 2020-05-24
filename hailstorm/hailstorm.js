import {
    Command,
    GUI,
    Integer,
    Key,
    Control
} from '../libraries/gui.js'

import { getLargeCanvas } from '../libraries/misc.js'

const sketch = (s) => {
let squareSize = 30
let gui

s.setup=() => {
        let {w, h} = getLargeCanvas(s, 1600)
        s.createCanvas(w, h)
   gui = createGUI()
   gui.toggle()
   draw()
}

function draw(){
    s.clear()
    let rows = s.floor((s.windowHeight-30)/squareSize);
    let columns = s.floor((s.windowWidth-30)/squareSize);
    let gapX = s.windowWidth-squareSize*columns;
    let gapY = s.windowHeight - squareSize*rows;
    s.rectMode(s.CENTER);
    s.strokeWeight(2);
    for(let j=0;j<=rows;j++){
      for(let i=0;i<=columns;i++){
        let noiseFactor = 1.1*j;
        let noiseX = noiseFactor*s.random();
        let noiseY = noiseFactor*s.random();
        let noiseAng = s.random(-noiseFactor/2, noiseFactor/2);
        s.push();
        s.translate(gapX/2+i*squareSize+noiseX, gapY/2+j*squareSize+noiseY);
        s.rotate(s.radians(noiseAng));
        s.beginShape();
        s.noFill();
        s.stroke(50, s.random(10*i, 10*j), s.random(10*i, 10*j))
        s.rect(0, 0, squareSize, squareSize)
        s.endShape();
        s.pop()
      }
   }


}

    function createGUI(){
            let info =
                "Coloured interpretation of Georg Nees' <a href=\"https://collections.vam.ac.uk/item/O221321/schotter-print-nees-georg/\">Schotter</a>"
            let subinfo = ""
        let S = new Key("s", () => {
            s.save("img.png")
        })
        let saveCmd = new Command(S, "save the canvas")

        let incR = new Key(")", () => {
            squareSize+=3
            draw()
        })
        let decR = new Key("(", () => {
            if (squareSize > 2) {
                squareSize-=3
            }
            draw()
        })
        let squareSizeInt = new Integer(() => squareSize)
        let rectSizeControl = new Control([decR, incR],
                                          "+/- square size", squareSizeInt)

        let gui = new GUI("Hailstorm, RB 2020/05", info, subinfo, [saveCmd],
                          [rectSizeControl])
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
