import {
    Command,
    GUI,
    Integer,
    Float,
    Key,
    Control
} from '../libraries/gui/gui.js'

import {
    getLargeCanvas,
    releaseCanvas
} from '../libraries/misc.js'

import {
    textile
} from '../libraries/textile.js'

import {
    canvasRGBA
} from '../libraries/3rdparty/stackblur.js'

const sketch = (s) => {

    let gui
    let largeCanvas
    let hd = 1.
    const PI = s.PI
	
	let cachedRedCloth = []
	let cachedBlueCloth, cachedGreenCloth
	
    s.setup = () => {
        let {
            w,
            h
        } = getLargeCanvas(s, 1600)
        let canvas = s.createCanvas(w, h)
        s.pixelDensity(1)
        canvas.mousePressed(() => {})
        s.frameRate(1)
        s.noLoop()
        gui = createGUI()
        gui.toggle()
    }

	//let canvas, mask, shadow
	
    function applique(s, scene, cloth, drawer, w, h, transf, x, y) {
        // Generates a canvas texture running cloth(canvas, w, h) translated to the center
        // Generates a clipping mask running drawer(mask, 1) translated to the center
        // Drawer can't set up any coloring or stroke
        // Will sew the cloth to scene.
        // transf.canvas[] will contain transformations to canvas
        // transf.mask[] will contain transformations to mask
        let d, f
		//console.log("Creating cloth canvas")
		let canvas = s.createGraphics(w, h)
		//console.log("Creating mask canvas")
		let mask = s.createGraphics(w, h)
		//console.log("Creating shadow canvas")
		let shadow = s.createGraphics(w, h)
        let ctx
        const mx = scene.width / 2
        const my = scene.height / 2
        scene.push()
        scene.translate(-w/2, -h/2)
		/*if(transf && transf.scene){
			transf.scene(scene)
		}*/
        scene.translate(x, y)
        canvas.translate(w/2, h/2)
        mask.translate(w/2, h/2)
        if (transf && transf.canvas) {
            transf.canvas(canvas)
        }
        if (transf && transf.mask) {
            //transf.mask(mask)
        }

        // Resolution independent shadow
        shadow.translate(w/2, h/2)
        shadow.fill("#10101090")
        shadow.stroke("#10101090")
        drawer(shadow, 1.04)
        //d = shadow.get()
        ctx = shadow.drawingContext
        // Trick because Safari has no ctx.filter(blur)
        canvasRGBA(shadow.canvas, 0, 0, w, h, 5 * hd)
        scene.image(shadow, 0, 0)

        // Cut applique out of canvas
        cloth(canvas, w, h)
        mask.fill("white")
		mask.translate(0, 0)
        drawer(mask, 1)
        //d = canvas.get()
        //d.mask(mask)
        //scene.image(d, 0, 0)
		ctx = mask.drawingContext
		ctx.globalCompositeOperation = 'source-in'
		mask.image(canvas, -w/2, -h/2)
		//ctx.globalCompositeOperation = 'source-over'
		//ctx = scene.drawingContext
		//ctx.globalCompositeOperation = 'source-over'
		scene.image(mask, 0, 0)
		
        // Stitch shadow and stitches
        scene.push()
        f = hd
        if (transf && transf.stitchScaleCorrection) {
            f *= 1.0 / transf.stitchScaleCorrection
        }
        scene.translate(w/2, h/2)
        ctx = scene.drawingContext
        ctx.setLineDash([3 * f, 5 * f, 3 * f, 5 * f])
        scene.stroke("#10101030")
        scene.noFill()
        scene.strokeWeight(4 * f)
        drawer(scene, 0.97)
        scene.stroke("#10101090")
        scene.strokeWeight(1 * f)
        drawer(scene, 0.97)
        scene.pop()
        scene.pop()
				
		releaseCanvas(shadow)
		releaseCanvas(mask)
		releaseCanvas(canvas)

		shadow.remove()
		mask.remove()
		canvas.remove()
    }

	const sleep = ms => new Promise(r => setTimeout(r, ms));
	
    function petal(scene, angle, scale) {
        scene.push()
        if (scale !== undefined) {
            scene.scale(scale)
        }
        scene.rotate(angle)
        const anch1 = [10, -10]
        const anch2 = [-10, -10]
        const ctrl1 = [100, -110]
        const ctrl2 = [-100, -110]
        const ctrl3 = [0, -15]
        const ctrl4 = [0, -15]
        scene.beginShape()
        scene.vertex(...anch1) // anchor
        scene.bezierVertex(...ctrl1, ...ctrl2, ...anch2)
        scene.bezierVertex(...ctrl3, ...ctrl4, ...anch1)
        scene.endShape()
        scene.pop()
    }

	function fakeFlower(scene, x, y, scale, a){
        scene.push()
        //scene.rotate(a)
        scene.scale(scale)
		scene.strokeWeight(3)
		scene.noFill()
		scene.circle(x, y, 150)
		scene.pop()		
	}
	
    function flower(scene, x, y, scale, shift) {
        let transf = {}
        scene.push()
        scene.scale(scale)
        //scene.rotate(angle)
        // No cloth caching: 3.2 seconds, caching: 0.6 sec
		if(!cachedRedCloth | cachedRedCloth.length < 5){
			//console.log("Generating red cloth")
        	cachedRedCloth.push(s.createGraphics(600*hd, 600*hd))
			const l = cachedRedCloth.length
        textile(cachedRedCloth[l-1], 0, 0, 600*hd, 600*hd, 1, 8, ["#AA3333", "#991525", "#9A1258"])			
		}
        transf.stitchScaleCorrection = scale
		//transf.scene = (e) => e.rotate(a)
        for (let i = 0; i < 6; i++) {
            const a = i * PI / 3 + shift
            let angle = scene.random(a - PI / 37, a + PI / 37)
            transf.canvas = (e) => {
                e.rotate(angle) & e.translate(-300*hd, -300*hd)
            }
            const c = (e, w, h) => {
                //let d = cachedRedCloth.get() // This is memory-worse
				const l = cachedRedCloth.length
                e.image(cachedRedCloth[e.random(l-1) << 0], 0, 0)
            }
            const d = (e, scale) => petal(e, angle+shift, scale)
            applique(s, scene, c, d, 600*hd, 600*hd, transf, x, y)
        }
		if(!cachedBlueCloth){
						//console.log("Generating blue cloth")
        cachedBlueCloth = s.createGraphics(300*hd, 300*hd)
        textile(cachedBlueCloth, 0, 0, 300*hd, 300*hd, 1, 8, ["#3333AA", "#152599", "#12589A"])		
		}
        transf.stitchScaleCorrection = scale * 0.5
        for (let i = 0; i < 5; i++) {
            const a = i * 0.4 * PI + shift
            let angle = scene.random(a - PI / 37, a + PI / 37)
            transf.canvas = (e) => {
                e.rotate(angle) & e.translate(-150*hd, -150*hd)
            }
            const c = (e, w, h) => {
                //let d = cachedBlueCloth.get()
                e.image(cachedBlueCloth, 0, 0)
            }
            const d = (e, scale) => petal(e, angle, 0.5 * scale)
            applique(s, scene, c, d, 300*hd, 300*hd, transf, x, y)
        }
        transf.canvas = (e) => {
            e.translate(-50*hd, -50*hd)
        }
        transf.stitchScaleCorrection = scale
		if(!cachedGreenCloth){
						//console.log("Generating green cloth")
	        cachedGreenCloth = s.createGraphics(scene.width, scene.height)
    	    textile(cachedGreenCloth, 0, 0, 100*hd, 100*hd, 1, 8, ["#075239", "#13541d", "#127A58"])
		}
		
        const greenClother = (e, w, h) => {
                //let d = cachedGreenCloth.get()
                e.image(cachedGreenCloth, 0, 0)
            }
			//(e, w, h) => textile(e, 0, 0, w, h, 1, 8, ["#075239", "#13541d", "#127A58"])
        const drawer = (e, scale) => {
            e.push()
            e.scale(scale)
            e.circle(0, 0, 25*Math.sqrt(hd))
            e.pop()
        }
        applique(s, scene, greenClother, drawer, 100, 100, transf, x, y)
        scene.pop()
    }

    s.draw = () => {
        const numPixels = hd * s.width * hd * s.height
        let scene = s.createGraphics(hd * s.width, hd * s.height)
		//let sceneswap = s.createGraphics(hd * s.width, hd * s.height)
        let redCloth
        let petalMask

        textile(scene, 0, 0, scene.width, scene.height, 1, 8)
//FOO Up to 60 or so
        for (let i = 0; i < 150; i++) {
            const x = scene.random(0.2 * scene.width, 0.8 * scene.width)
            const y = scene.random(0.2 * scene.height, 0.8 * scene.height)
            const scale = scene.random(0.5, 1.8)
            const shift = scene.random(0, PI)
			console.log(i)//x, y, scale)
            flower(scene, x, y, scale, shift)
			/*if(i%2 == 0){
				console.log(i)
				sceneswap.remove()
				sceneswap = s.createGraphics(hd * s.width, hd * s.height)
				let c = scene.get()
				sceneswap.image(c, 0, 0)
				scene.remove()
				scene = s.createGraphics(hd * s.width, hd * s.height)
				c = sceneswap.get()
				scene.image(c, 0, 0)
			}*/
			//fakeFlower(scene, x, y, scale, shift)
        }


        largeCanvas = scene
        let c = scene.get()
        c.resize(s.width, 0)
        s.image(c, 0, 0)
    }

    function createGUI() {
        let info =
            "Info"
        let subinfo = "Subinfo<br/>Very high resolutions can fail depending on the browser"
        let S = new Key("s", () => {
            largeCanvas.save("img.png")
        })
        let saveCmd = new Command(S, "save the canvas")
        let R = new Key("r", () => {
            gui.spin(() => {
                s.clear();
                s.draw()
                gui.spin();
            });
        });

        let resetCanvas = new Command(R, "reset")

        let decH = new Key("(", () => {
            if (hd > 0) {
                hd -= 0.1
            }
        })
        let incH = new Key(")", () => {
            if (hd < 10) {
                hd += 0.1
            }
        })
        let hdInfo = new Float(() => hd)
        let hdControl = new Control([decH, incH],
            "+/- resolution export factor", hdInfo)


        let gui = new GUI("Something, RB 2020/", info, subinfo, [saveCmd,
                resetCanvas
            ],
            [hdControl])

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