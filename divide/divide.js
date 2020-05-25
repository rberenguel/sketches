/*jshint esversion: 6 */
/*jshint asi*/
import {
    Command,
    GUI,
    Integer,
    String,
    Boolean,
    Key,
    Control,
    Input
} from '../libraries/gui/gui.js'

import {
    getLargeCanvas
} from '../libraries/misc.js'

import {
    colorKmeans
} from '../libraries/colorKmeans.js'


// Rectangular treemap representing colours in each colour cluster for a naive k-means to find dominant colours in an image. It adjustes the number of clusters in case of problems (i.e. empty clusters). Press R to rerun from start

const sketch = (s) => {

    let baseImage
    let gui
    let numClusters = 8
    let colors = [],
        centroids, closeColors, withText = false,
        kmeans = false
    let imageW, imageH, canvas

    s.preload = () => {
        baseImage = s.loadImage('../resources/gw.jpg')
    }

    function prepareImageAndDisplay(image) {
        let {
            w,
            h
        } = getLargeCanvas(s, 1600)
        if (canvas) canvas.remove()
        image.resize(w, 0)
        w = Math.min(w, image.width)
        h = Math.min(h, image.height)
        imageW = w
        imageH = h
        canvas = s.createCanvas(w, h)
            .id("canvas")
        //s.image(image, 0, 0)
        image.loadPixels()
        colors = []
        for (let j = 0; j < image.pixels.length; j += 4) {
            let r = image.pixels[j];
            let g = image.pixels[j + 1]
            let b = image.pixels[j + 2]
            colors.push([r, g, b]);
        }
        drawCentroids()
    }

    function loadImageFromInput(callback) {

        return (inputEvent) => {
            let filename = inputEvent.target.files[0]
            let fr = new FileReader()
            fr.onload = (fileEvent) => {
                let rawImage = new Image()
                rawImage.src = fileEvent.target.result
                rawImage.onload = () => {
                    let image = s.createImage(rawImage.width,
                        rawImage
                        .height)
                    image.drawingContext.drawImage(rawImage, 0,
                        0)
                    callback(image)
                }
            }
            fr.readAsDataURL(filename)
        }
    }
    s.setup = () => {
        prepareImageAndDisplay(baseImage)
        gui = createGUI()
        gui.toggle()
    }

    function colorSum(col) {
        return s.red(col) + s.green(col) + s.blue(col)
    }

    function balancedOppositeColor(col) {
        let r = 255 - s.red(col)
        let g = 255 - s.green(col)
        let b = 255 - s.blue(col)
        let rev = s.color(r, g, b)
        if (Math.abs(colorSum(rev) - colorSum(col)) < 150) {
            r -= 40
            g -= 40
            b -= 40
        }
        return s.color(r, g, b)
    }

    function drawRectangle(col, x, y, wi, he) {
        s.fill(col)
        s.rect(x, y, wi, he)
        if (withText) {
            s.textAlign(s.CENTER, s.CENTER)
            s.fill(balancedOppositeColor(col))
            let rs = s.red(col)
                .toString()
                .padStart(2, "0")
            let gs = s.green(col)
                .toString()
                .padStart(2, "0")
            let bs = s.blue(col)
                .toString()
                .padStart(2, "0")
            let text = `RGB(${rs}, ${gs}, ${bs})`
            s.text(text, x + wi / 2.0, y + he / 2.0)
            console.log(text)
        }
    }

    function drawRectangles() {
        s.clear()
        let c
        let vertical = true
        let width = imageW
        let height = imageH
        let x = 0
        let y = 0
        centroids.sort((a, b) => -a[3] + b[3])
        for (let c = 0; c < centroids.length; c++) {
            let [r, g, b, k] = centroids[c]
            let rest = centroids.slice(c)
                .map((a) => a[3])
                .reduce((c1, c2) => c1 + c2, 0)
            if (vertical) {
                let rectW = s.int(width * k / rest)
                rectW = Math.min(rectW, imageW - x)
                drawRectangle(s.color(r, g, b), x, y, rectW, height)
                width -= rectW
                x += rectW
            } else {
                let rectH = s.int(height * k / rest)
                rectH = Math.min(rectH, imageH - y)
                drawRectangle(s.color(r, g, b), x, y, width, rectH)
                height -= rectH
                y += rectH
            }
            vertical = !vertical

        }
    }

    function drawCentroids() {
        let c;
        [centroids, closeColors] = colorKmeans(colors, numClusters, 15)
        drawRectangles()
    }

    function createGUI() {
        let info =
            `Color frequency treemap based on k-means clustering`
        let subinfo = ""
        let S = new Key("s", () => {
            s.save("img.png")
        })
        let saveCmd = new Command(S, "save the canvas")
        let R = new Key("r", () => {
            drawCentroids()
        })
        let resetCmd = new Command(R, "recompute")

        let C = new Key("c", () => {
            withText = !withText
            drawRectangles()
        })
        let rgbCmd = new Command(C, "show RGB values")

        let A = new Key("a", () => {
            kmeans = !kmeans
            drawRectangles()
        })

        let kmeansStates = ["centroids", "close color"]
        let kmeansString = new String(() => kmeansStates[kmeans + 0])
        let kmeansControl = new Control([A],
            "cluster centroid?", kmeansString)


        let incC = new Key(")", () => {
            numClusters += 1
            drawCentroids()
        })
        let decC = new Key("(", () => {
            if (numClusters >= 1) {
                numClusters -= 1
            }
            drawCentroids()
        })
        let numClustersInt = new Integer(() => numClusters)
        let numClustersControl = new Control([decC, incC],
            "+/- num clusters", numClustersInt)
        let fileInput = new Input("Choose your own image", "file",
            "image/*",
            loadImageFromInput((img) => {
                s.clear()
                prepareImageAndDisplay(img)
            }))
        let gui = new GUI("Divide et impera, RB 2020/05", info, subinfo, [
                resetCmd, saveCmd, rgbCmd
            ],
            [kmeansControl, numClustersControl, fileInput])
        let QM = new Key("?", () => {
            gui.toggle()
        })
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