import {
    Command,
    GUI,
    Float,
    Key,
    Control
} from '../libraries/gui.js'


// Vaguely based on polygon deformation: https://tylerxhobbs.com/essays/2017/a-generative-approach-to-simulating-watercolor-paints
const sketch = (s) => {

    let poly, background, dots;
    let cnt = 0;
    let dotSize = 150
    let alphaMax = 6, alphaMin=0.5
    let gui

    s.preload = () => {
        background = s.loadImage('../resources/wc.jpg');
    }

    s.setup = () => {
        s.createCanvas(s.windowWidth, s.windowHeight)
        s.frameRate(30)
        gui = createGUI()
        gui.toggle()
        resetCanvas()
    }

    function resetCanvas() {
        cnt = 0
        s.clear()
        background.resize(s.windowWidth, 0)
        s.image(background, 0, 0)
        let midX = background.width / 2
        let midY = background.height / 2
        dots = [{
                colour1: s.color(50, 50, s.random(100, 255), s.random(alphaMin,
                    alphaMax)),
                colour2: s.color(50, 50, s.random(100, 255), alphaMin),
                poly: polygon(0, 0, dotSize, 17),
                pos: [midX - dotSize, midY],
                scale: 1
            },
            {
                colour1: s.color(50, s.random(100, 200), 50, s.random(alphaMin,
                    alphaMin)),
                colour2: s.color(20, s.random(100, 150), 20, alphaMax),
                poly: polygon(0, 0, dotSize, 17),
                pos: [midX, midY],
                scale: 1
            },
            {
                colour1: s.color(s.random(100, 255), 50, 50, s.random(alphaMin,
                    alphaMax)),
                colour2: s.color(s.random(100, 255), 50, 50, alphaMin),
                poly: polygon(0, 0, dotSize, 17),
                pos: [midX + dotSize, midY],
                scale: 1
            },
            {
                colour1: s.color(s.random(0, 10), s.random(0, 10), s
                    .random(0, 10), s.random(alphaMin, alphaMax)),
                colour2: s.color(s.random(0, 10), s.random(0, 10), s
                    .random(0, 10), alphaMin),
                poly: polygon(150, 150, 50, 17),
                pos: [50, 50],
                scale: 1
            }
        ]
        s.loop()
    }



    s.draw = () => {
        cnt++
        if (cnt > 200) s.noLoop()
        drawDots()
    }


    function drawDots() {
        for (let d=0; d< dots.length; d++) {
            let dot = dots[d]
            s.push()
            let {
                colour1,
                colour2,
                poly,
                pos,
                scale
            } = dot
            let [x, y] = pos
            s.translate(x, y)
            for (let i = 0; i < 7; i++) {
                poly = subdivide(poly, 10)
            }
            let lerped = s.lerpColor(colour1, colour2, s.random(cnt /
                200.0))
            s.fill(lerped)
            drawPolygon(poly)
            s.pop()
        }
    }

    function drawPolygon(pts) {
        s.beginShape();
        s.noStroke();
        for (let pt of pts) {
            let [i, j] = pt
            s.curveVertex(s.int(i), s.int(j));
        }
        s.endShape();
    }

    function polygon(x, y, radius, npoints) {
        var pts = [];
        let angle = s.TWO_PI / npoints;
        for (let a = 0; a < s.TWO_PI; a += angle) {
            let sx = x + s.cos(s.random(a)) * s.random(radius / 4, radius);
            let sy = s.random(y / 2, y) + s.sin(s.random(a)) * s.random(
                radius / 2, radius);
            pts.push([sx, sy])
        }
        return pts;
    }

    function randMid(p, q, rnd) {
        let midx = p[0] + 0.5 * (q[0] - p[0]);
        let midy = p[1] + 0.5 * (q[1] - p[1]);
        return [s.randomGaussian(midx, rnd), s.randomGaussian(midy, rnd)]
    }

    function subdivide(points, noise) {
        let nextPoints = []
        for (let i = 0; i < points.length - 1; i++) {
            let p = points[i];
            let q = points[i + 1];
            let mid = randMid(p, q, noise)
            nextPoints.push(p);
            nextPoints.push(mid);
        }
        let q = points[0];
        let p = points[points.length - 1];
        let mid = randMid(p, q);
        nextPoints.push(p);
        nextPoints.push(mid);
        nextPoints.push(q);
        return nextPoints;
    }
    
        function createGUI(){
            let info =
                "Experiment based on polygon subdivision (see code/README for details)"
            let subinfo = "Adjusting alpha levels will redraw the canvas"
            let R = new Key("r", () => {
            resetCanvas()
            })
        let resetCanvasCmd = new Command(R, "reset the canvas and repaint")
        let S = new Key("s", () => {
            s.save("img.png")
        })
        let saveCmd = new Command(S, "save the canvas")

        let incAM = new Key(")", () => {
            alphaMax += 0.5
            resetCanvas()
        })
        let decAM = new Key("(", () => {
            if (alphaMax >= 0) {
                alphaMax -= 0.5
            }
            resetCanvas()
        })
        let alphaMaxFloat = new Float(() => alphaMax)
        let alphaMaxControl = new Control([decAM, incAM],
                                          "+/- max alpha", alphaMaxFloat)
        let incAm = new Key(".", () => {
            alphaMin += 0.1
            resetCanvas()
        })
        let decAm = new Key(",", () => {
            if (alphaMin >= 0) {
                alphaMin -= 0.1
            }
            resetCanvas()
        })
        let alphaMinFloat = new Float(() => alphaMin)
        let alphaMinControl = new Control([decAm, incAm],
                                          "+/- min alpha", alphaMinFloat)

        let gui = new GUI("Watercolour, RB 2020/05", info, subinfo, [resetCanvasCmd, saveCmd],
                          [alphaMinControl, alphaMaxControl])
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