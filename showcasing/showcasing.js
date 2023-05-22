import {
  createBaseGUI,
  Command,
  GUI,
  Integer,
  String,
  Key,
  Control,
  Seeder
} from '../libraries/gui/gui.js'

import {
  getLargeCanvas,
  signature,
  mod
} from '../libraries/misc.js'

const sketch = (s) => {

  let gui
  let debug = false

  let cfg = {
    hd: 1,
    seeder: undefined,
    largeCanvas: undefined,
    backgrounds: [],
    samples: []
  }

  let backgroundIndex = 1
  let imageIndex = 0

  const PI = s.PI

  s.preload = () => {
    cfg.font = s.loadFont("../libraries/fonts/Monoid-Retina.ttf")
    let bg = {
      img: s.loadImage("living_room_3.jpg"),
      src: "living_room_3.jpg",
      ul: [720, 278],
      ur: [1091, 279],
      bl: [720, 525],
      br: [1092, 525],
      w: 500,
      h: 300,
      ratio: -1,
      attr: "N.Hébert(Unsphash)"
    }
    cfg.backgrounds.push(bg)
    bg = {
      img: s.loadImage("living_room_1.jpg"),
      src: "living_room_1.jpg",
      ul: [616, 106],
      ur: [1168, 107],
      bl: [619, 488],
      br: [1168, 490],
      w: 428,
      h: 296,
      ratio: 1.4459,
      attr: "R.Claire(Pexels)"
    }
    cfg.backgrounds.push(bg)
    bg = {
      img: s.loadImage("living_room_2.jpg"),
      src: "living_room_2.jpg",
      ul: [421, 274],
      ur: [882, 274],
      bl: [427, 566],
      br: [882, 567],
      w: 358,
      h: 224,
      ratio: 1.5982,
      attr: "R.Claire(Pexels)"
    }
    cfg.backgrounds.push(bg)
    bg = {
      img: s.loadImage("living_room_4.jpg"),
      src: "living_room_4.jpg",
      ul: [173, 129],
      ur: [621, 269],
      bl: [170, 545],
      br: [621, 584],
      w: 500,
      h: 300,
      ratio: -1,
      attr: "M.Rahubovskiy(Pexels)"
    }

    cfg.backgrounds.push(bg)

    const images = [{
        src: "creation-s.png",
        color: "#55555530",
        blendMode: "multiply",
        name: "Creation"
      },{
        src: "temple-s.png",
        color: "#55555530",
        blendMode: "multiply",
        name: "Temple"
      },{
        src: "through2-s.png",
        color: "#55555530",
        blendMode: "multiply",
        name: "(Through)² the trees"
      },{
        src: "bubbles-s.png",
        color: "#55555530",
        blendMode: "multiply",
        name: "Bubbles"
      },{
        src: "out-of-fabric-s.png",
        color: "#55555530",
        blendMode: "multiply",
        name: "Out of Fabric"
      },{
        src: "underwater-s.png",
        color: "#55555530",
        blendMode: "multiply",
        name: "Underwater"
      }, {
        src: "flows-s.png",
        name: "Flows"
      }, {
        src: "modern-art-s.png",
        name: "Modern Art"
      }, {
        src: "la-truche-s.png",
        name: "La Truche"
      }, {
        src: "synthwave-s.png",
        name: "Synthwave"
      }, {
        src: "70s-patch-s.png",
        color: "#55555510",
        blendMode: "multiply",
        name: "70s Patch"
      }, {
        src: "pencils-s.png"
      }, {
        src: "iris-s.png",
        color: "#55555510",
        blendMode: "multiply",
        name: "Iris"
      },
      /*{
        src: "palette-s.png", // Palette doesn't look good due to aspect ratio
        name: "Palette"
      },*/
      {
        src: "painting-s.jpg",
        name: "Painting"
      },
    ]
    for (let imageData of images) {
      let img = new Image(500, 500)
      img.src = imageData.src
      cfg.samples.push({
        img: img,
        blendMode: imageData.blendMode,
        color: imageData.color,
        src: imageData.src,
        name: imageData.name
      })
    }
  }

  s.setup = () => {
    let {
      w,
      h
    } = getLargeCanvas(s, 1600)
    let canvas = s.createCanvas(w, h)
    s.pixelDensity(1)
    canvas.mousePressed(() => {})
    s.frameRate(20)
    s.noLoop()
    cfg.seeder = new Seeder()
    gui = createGUI()
    gui.toggle()

    const queryString = window.location.search
    const urlParams = new URLSearchParams(queryString)
    const imgReq = urlParams.get('img')
    const bgReq = urlParams.get('bg')
    let idx = cfg.samples.findIndex(
      img => img.src.startsWith(imgReq)
    )
    imageIndex = idx >= 0 ? idx : imageIndex
    idx = cfg.backgrounds.findIndex(
      img => img.src.endsWith(bgReq + ".jpg")
    )
    backgroundIndex = idx >= 0 ? idx : backgroundIndex
    gui.update()

  }

  s.draw = () => {
    let scene = s.createGraphics(1800, 1200)

    scene.randomSeed(cfg.seeder.get())
    scene.noiseSeed(cfg.seeder.get())

    let bg = cfg.backgrounds[backgroundIndex]
    bg.img.resize(scene.width, 0)
    scene.image(bg.img, 0, 0)
    scene.noStroke()
    scene.rectMode(s.CORNERS)


    if (debug) {
      // This is how I figure out where to place the image and
      // perspective correction
      const ul = [616, 106]
      const ur = [1168, 107]
      const bl = [619, 488]
      const br = [1168, 490]

      scene.strokeWeight(5)
      scene.stroke("red")
      scene.point(...ul)
      scene.point(...ur)
      scene.point(...bl)
      scene.point(...br)

    } else {



      let ctx = scene.drawingContext
      let img = cfg.samples[imageIndex]
      let p = new Perspective(ctx, img.img, img.blendMode, img.color)

      p.draw([
        bg.ul,
        bg.ur,
        bg.br,
        bg.bl
      ])

      scene.strokeWeight(2)
      scene.stroke("#10101099")
      scene.line(...bg.ul, ...bg.bl)
      scene.line(...bg.bl, ...bg.br)
      scene.line(...bg.br, ...bg.ur)
      scene.line(...bg.ur, ...bg.ul)
    }
    const name = cfg.samples[imageIndex].name

    const sigCfg = {
      s: s,
      scene: scene,
      color: "#101010",
      shadow: "#909090",
      fontsize: 12,
      right: scene.width,
      bottom: scene.height,
      identifier: `${name} by Ruben Berenguel  `,
      sig: `Background: ${bg.attr}  `,
      hd: cfg.hd,
      font: cfg.font
    }
    signature(sigCfg)

    cfg.largeCanvas = scene
    let c = scene.get()

    c.resize(0, s.height)
    if (c.width > s.width) {
      c.resize(s.width, 0)
    }
    const gap = s.width - c.width
    s.push()
    if (gap > 0) {
      s.translate(gap / 2, 0)
    }
    s.image(c, 0, 0)
    s.pop()
  }


  function createGUI() {
    let info =
      "See in place. Not all pieces will look good due to wrong size of the wall canvas"
    let subinfo = "Using a tweaked version of <a style='color: inherit;' href='https://github.com/wanadev/perspective.js'>perspective.js</a><br/>Doesn't have all my pieces (yet)"
    let S = new Key("s", () => {
      cfg.largeCanvas.save("img.png")
    })
    let saveCmd = new Command(S, "save the canvas")


    let decB = new Key(",", () => {
      backgroundIndex = mod(backgroundIndex - 1, cfg.backgrounds.length)
      gui.update()
      s.clear()
      s.draw()
    })
    let incB = new Key(".", () => {
      backgroundIndex = mod(backgroundIndex + 1, cfg.backgrounds.length)
      gui.update()
      s.clear()
      s.draw()
    })
    let backInfo = new Integer(() => backgroundIndex)
    let backControl = new Control([decB, incB],
      "Cycle backgrounds", backInfo)

    let decI = new Key("(", () => {
      imageIndex = mod(imageIndex - 1, cfg.samples.length)
      gui.update()
      s.clear()
      s.draw()
    })
    let incI = new Key(")", () => {
      imageIndex = mod(imageIndex + 1, cfg.samples.length)
      gui.update()
      s.clear()
      s.draw()
    })
    let imgInfo = new String(() => cfg.samples[imageIndex].name)
    let imgControl = new Control([decI, incI],
      "Cycle pieces", imgInfo)

    let attrInfo = new String(() => cfg.backgrounds[backgroundIndex].attr)
    let attrControl = new Control([],
      "Background", attrInfo)

    let gui = new GUI("Showcase, RB 2023/5", info, subinfo, [saveCmd],
      [backControl, imgControl, attrControl])

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
