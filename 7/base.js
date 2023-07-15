import {
    createBaseGUI,
    Command,
    GUI,
    Integer,
    Float,
    Key,
    Control,
    Seeder
} from '../libraries/gui/gui.js'

import {
    getLargeCanvas,
    signature
} from '../libraries/misc.js'


const sketch = (s) => {

    let gui
    let debug = true
    let dly // Base debug layer, if used

    // Globals needed in controls, commands or deep arguments
    let cfg = {
        hd: 1,
        seeder: undefined,
        largeCanvas: undefined
    }

    let W, H // Helpful globals to avoid typing scene.width so much
    let sh // Shader placeholder
    const PI = s.PI

    s.preload = () => {
        cfg.font = s.loadFont("../libraries/fonts/Monoid-Retina.ttf")
      sh = s.loadShader("sh.vert", "sh.frag")
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
        gui.fetch()
        gui.toggle()
    }

    s.draw = () => {
        let scene = s.createGraphics(cfg.hd * s.width << 0, cfg.hd * s.height << 0, s.WEBGL)
        W = scene.width, H = scene.height
        scene.translate(-W/2,-H/2)
        scene.shader(sh)
        let dly = s.createGraphics(W, H)
        scene.randomSeed(cfg.seeder.get())
        scene.noiseSeed(cfg.seeder.get())
        dly.randomSeed(cfg.seeder.get())
        dly.noiseSeed(cfg.seeder.get())

        sh.setUniform("u_resolution",[1.0*W,1.0*H])
        // Here your code against scene and possibly dly
        if (debug && dly) {
            let c = dly.get()
            scene.image(dly, 0, 0)
        }
      const fsh = ([dx, dy], r) => {
        const d = r ? r : 1
        const pt = [(0.5-dx)*W, (0.5-d*dy)*H]
        //console.log(pt)
        return pt
      }
      const a1 = scene.random(0.1, 0.4)
      const a2 = scene.random(0.1, 0.4)
      const c1x = scene.random(0.1*a1, 0.5*a1)
      const c2x = scene.random(0.1*a2, 0.5*a2)
      const c1y = scene.random(0.01, 0.35)
      const c2y = scene.random(0.6*c1y, 1.5*c1y)
      //const a1d = [0.2, -0.15]
      const _a1d = [a1, 0.0]
      const a2d = [-a2, 0.0]
      const c1d = [c1x, c1y]
      const c2d = [-c2x, c2y]
      scene.fill("blue")
      scene.background("white")
      scene.strokeWeight(3)
      scene.stroke("black")
      const upper = [...fsh(_a1d), ...fsh(c1d), ...fsh(c2d), ...fsh(a2d)]
      const lower = [...fsh(_a1d), ...fsh(c1d, -1), ...fsh(c2d, -1), ...fsh(a2d, -1)]
      scene.push()
      scene.strokeWeight(0)
      scene.beginShape(s.TRIANGLE_FAN)
      //scene.bezier(...upper)
      const upxs = upper.filter((v, i) => i%2 == 0 )
      const upys = upper.filter((v, i) => i%2 == 1)
      const loxs = lower.filter((v, i) => i%2 == 0 )
      const loys = lower.filter((v, i) => i%2 == 1)
        scene.vertex(s.bezierPoint(...upxs, 1), s.bezierPoint(...upys, 1)
, 0, 0, 0)//s.map(y, 0, H, 0, 1))
        for(let i=99;i>=0;i--){
        const t = i/100.;
        const x = s.bezierPoint(...upxs, t)
        const y = s.bezierPoint(...upys, t)
        scene.vertex(x, y, 0, s.map(x, 0, W, 0, 1), 8)//s.map(0.5*H-y, 0, 0.5*H, 0, 8))
      }
        scene.vertex(s.bezierPoint(...loxs, 1), s.bezierPoint(...loys, 1)
, 0, 0, 0)//s.map(y, 0, H, 0, 1))
       for(let i=1;i<=100;i++){
        const t = i/100.;
        const x = s.bezierPoint(...loxs, 1-t)
        const y = s.bezierPoint(...loys, 1-t)
        scene.vertex(x, y, 0, s.map(x, 0, W, 0, 1), 8)//s.map(y-0.5*H, 0, 0.5*H, 0, 8))
      }


      //scene.bezier(...lower)
      scene.endShape()
      scene.pop()
      let v1 = [fsh(c1d)[0]-fsh(_a1d)[0], fsh(c1d)[1]-fsh(_a1d)[1]]
      let v2 = [fsh(c1d, -1)[0]-fsh(_a1d)[0], fsh(c1d, -1)[1]-fsh(_a1d)[1]]
      const nrm = ([x, y]) => Math.sqrt(x*x+y*y)
      const nv1 = nrm(v1)
      const nv2 = nrm(v2)
      v1[0] /= nv1
      v1[1] /= nv1
      v2[0] /= nv2
      v2[1] /= nv2
      const tail = 0.8*scene.random(0.8*c1y, 1.2*c1y)
      const end1 = fsh([_a1d[0]+tail*v1[0], _a1d[1]+tail*v1[1]])
      const end2 = fsh([_a1d[0]+tail*v2[0], _a1d[1]+tail*v2[1]])

      let x, y
      scene.strokeWeight(0)
      scene.beginShape()
      ;[x, y] = fsh(_a1d)
      scene.vertex(x, y, 0, s.map(x, 0, W, 0, 1), s.map(y, 0, H, 0, 1))
      ;[x, y] = end1
      scene.vertex(x, y, 0, s.map(x, 0, W, 0, 1), s.map(y, 0, H, 0, 1))
      ;[x, y] = end2
      scene.vertex(x, y, 0, s.map(x, 0, W, 0, 1), s.map(y, 0, H, 0, 1))
      scene.endShape(s.CLOSE)
      scene.fill("red")
      scene.strokeWeight(0)
      sh.setUniform("u_skip", true)
      // Find a placement for the eye, along the segment c1 a2 close to a2 should always be inside
      let ev = [fsh(a2d)[0]-fsh(c1d)[0], fsh(a2d)[1]-fsh(c1d)[1]]
      const nev = nrm(ev)
      ev[0] /= nev
      ev[1] /= nev
      const ex = fsh([a2d[0]+0.1*ev[0], 0])[0]
      const ey = fsh([0, 0.2*c2y])[1]
       scene.circle(ex, ey, 10)
      //scene.bezier(...anc1, ...ctl1, ...ctl2, ...anc2)
        const identifier = `${cfg.seeder.hex()}@${cfg.hd.toPrecision(2)}`
        const sigCfg = {
            s: s,
            scene: scene,
            color: "#101020",
            shadow: "darkgrey",
            fontsize: 9,
            right: scene.width,
            bottom: scene.height,
            identifier: identifier,
            sig: "rb'23",
            hd: cfg.hd,
            font: cfg.font
        }
        //signature(sigCfg)

        cfg.largeCanvas = scene
        let c = scene.get()
        c.resize(s.width, 0)
        s.image(c, 0, 0)
    }


    const createGUI = (gui) => {
        cfg.title = "Something, RB 2023/ \u{1F1E8}\u{1F1ED}"
        cfg.info = "Info"
        cfg.subinfo = "Subinfo<br/>Very high resolutions can fail depending on the browser"
        cfg.s = s
        let R = new Key("r", () => {
          gui.spin(() => {
            cfg.s.clear()
            cfg.s.draw()
            gui.spin()
            gui.unmark()
            gui.update()
          })
        })

        let resetCanvas = new Command(R, "reset")        
        
        cfg.commands = [resetCanvas, cfg.seeder.command]
        cfg.controls = [cfg.seeder.control]

        gui = createBaseGUI(cfg)
        return gui
    }



    s.keyReleased = () => {
        gui.dispatch(s.key)
    }
}
// Hack while WEBGL2 is not released (should be in the next p5js release)
p5.RendererGL.prototype._initContext = function() {
  try {
    this.drawingContext =
      this.canvas.getContext('webgl2', this._pInst._glAttributes) ||
      this.canvas.getContext('experimental-webgl', this._pInst._glAttributes);
    if (this.drawingContext === null) {
      throw new Error('Error creating webgl context');
    } else {
      const gl = this.drawingContext;
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      this._viewport = this.drawingContext.getParameter(
        this.drawingContext.VIEWPORT
      );
    }
  } catch (er) {
    throw er;
  }
};


p5.disableFriendlyErrors = true
let p5sketch = new p5(sketch)
