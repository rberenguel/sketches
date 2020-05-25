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


// Naive k-means to find dominant colours. It will adjust number of clusters in case of problems (i.e. empty clusters). 

const sketch = (s) => {

    let baseImage
    let gui
    let numClusters = 6
    let colors = [],
        centroids, closeColors, withText = false,
        kmeans = false
    let cutout, imageW, imageH, canvas

    s.preload = () => {
        baseImage = s.loadImage('../resources/gw.jpg')
    }

    function prepareImageAndDisplay(image) {
        let {
            w,
            h
        } = getLargeCanvas(s, 1600)
        if (canvas) canvas.remove()
        cutout = s.int(w / 4.0)
        image.resize(w - cutout, 0)
        w = Math.min(w, image.width)
        h = Math.min(h, image.height)
        imageW = w
        imageH = h
        canvas = s.createCanvas(w + cutout, h)
            .id("canvas")
        s.image(image, 0, 0)
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

    function drawRectangle(col, x, y, ht) {
        s.fill(col)
        s.rect(x, y, cutout, ht)
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
            s.text(text, x + cutout / 2.0, y + ht / 2.0)
            console.log(text)
        }
    }

    function drawRectangles() {
        let c
        let ht = s.int(imageH / (1.0 * centroids.length))
        centroids.sort((a, b) => a[3] - b[3])
        for (c = 0; c < centroids.length - 1; c++) {
            let [r, g, b, k] = kmeans ? centroids[c] : closeColors[c]
            drawRectangle(s.color(r, g, b), imageW, ht * c, ht)
        }
        let [r, g, b, k] = kmeans ? centroids[c] : closeColors[c]

        let leftover = imageH - ht * c
        drawRectangle(s.color(r, g, b), imageW, ht * c, leftover)
    }

    function drawCentroids() {
        let c[centroids, closeColors] = colorKmeans(colors, numClusters)
        drawRectangles()
    }

    function createGUI() {
        let info =
            `Naive k-means`
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
        let gui = new GUI("K-means on colors, RB 2020/05", info, subinfo, [
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