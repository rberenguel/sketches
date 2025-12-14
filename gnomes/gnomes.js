import {
  createBaseGUI,
  Command,
  GUI,
  Integer,
  Float,
  Boolean,
  Key,
  Control,
  Seeder,
} from "../libraries/gui/gui.js";

import { getLargeCanvas, addText } from "../libraries/misc.js";

const sketch = (s) => {
  let gui;
  let cfg = {
    hd: 1,
    seeder: undefined,
    largeCanvas: undefined,
  };
  let monoid;

  s.preload = () => {
    monoid = s.loadFont("../libraries/fonts/Monoid-Retina.ttf");
  };

  s.setup = () => {
    let { w, h } = getLargeCanvas(s, 1600);
    // Determine canvas size to fit window while maintaining aspect ratio if desired, 
    // or just fill window. The logic in synthwave fills window but maintains a 'largeCanvas' logic.
    // Here we want a portrait sketch. original was 1600x2400 (2:3).
    // Let's maximize within window while keeping 2:3 ratio, similar to synthwave logic but simplified.
    // Actually synthwave's logic: if w>h (landscape) ... else (portrait) ...
    // Let's just use getLargeCanvas logic for the display canvas (which might fit the window),
    // but we will draw to a fixed aspect ratio offscreen buffer.
    
    // Let's force a 2:3 ratio for the display canvas to match the offscreen buffer ratio
    let canvasW, canvasH;
    if (w / h > 2 / 3) {
        canvasH = h;
        canvasW = h * (2 / 3);
    } else {
        canvasW = w;
        canvasH = w * (3 / 2);
    }
    
    let canvas = s.createCanvas(canvasW, canvasH);
    s.pixelDensity(1);
    s.noLoop();
    // Colors are set on the 'scene' graphics, not 's' (mostly).
    
    cfg.seeder = new Seeder();
    gui = createGUI();
    gui.toggle();
    gui.fetch();
  };

  s.draw = () => {
    drawScene();
  };

  function drawScene() {
    // 1. Create Offscreen Buffer
    // Base resolution 1600x2400
    const w = 1600;
    const h = 2400;
    let scene = s.createGraphics(w * cfg.hd, h * cfg.hd);
    
    // Setup scene defaults
    scene.colorMode(s.HSB, 360, 100, 100);
    scene.rectMode(s.CENTER);
    scene.scale(cfg.hd); // Scale everything up

    scene.randomSeed(cfg.seeder.get());
    
    // --- Background: Red and White Stripes ---
    scene.background(0, 0, 100); // White base
    scene.stroke(0);             // Add black stroke
    scene.strokeWeight(1);       // Thin outline
    scene.fill(350, 80, 90);     // Red

    let stripeHeight = 8; 

    // Loop down the canvas height (using logic size)
    for (let y = 0; y < h; y += stripeHeight * 2) {
      scene.rect(w / 2, y + stripeHeight / 2, w, stripeHeight);
    }

    // --- Grid Parameters ---
    let cols = 6;
    let rows = 32; 
    let cellW = w / cols;
    let cellH = cellW * 0.6;

    // --- Draw Gnomes ---
    for (let j = -1; j < rows; j++) {
      for (let i = -1; i < cols; i++) {
        let x = i * cellW;
        let y = j * cellH;
        
        // Stagger odd rows
        if (j % 2 !== 0) {
          x += cellW / 2;
        }
        
        drawGnome(scene, x + cellW/2, y + cellH/2, cellW * 0.95);
      }
    }
    
    // --- Signature ---
    const textCfg = {
      s: s,
      scene: scene,
      hd: cfg.hd,
      fontsize: 9,
      font: monoid,
      shadowColor: "darkgray",
      color: "black", // Changed to black for visibility on white/red background
    };
    const identifier = `#${cfg.seeder.hex()}@${cfg.hd.toPrecision(2)}`;
    addText(
      textCfg,
      w - 10,
      h - 10, // Bottom right corner
      identifier + " | rb'25", // Updated year
    );

    // 2. Expose to GUI for saving
    cfg.largeCanvas = scene;

    // 3. Draw to Display Canvas
    // Fit 'scene' into 's' canvas
    s.background(50); // Letterbox color if any (shouldn't be if we calculated right)
    s.image(scene, 0, 0, s.width, s.height);
  }

  function drawGnome(scene, x, y, size) {
    scene.push();
    scene.translate(x, y);
    scene.scale(size / 130); 

    // Random genes
    let beardLen = scene.random(100, 140);
    let beardWidth = scene.random(60, 85);
    let hatHeight = scene.random(130, 170);
    let hatBend = scene.random(-50, 50);
    let hatPalette = [
      scene.color(350, 80, 90), 
      scene.color(140, 80, 70),
      scene.color(210, 80, 80), 
      scene.color(50, 90, 95)
    ];
    let hatColor = scene.random(hatPalette);
    
    let noseW = scene.random(34, 42);
    let noseH = scene.random(24, 30);
    let noseHue = scene.random(15, 25);   // Skin tone range
    let noseSat = scene.random(45, 65);   // Saturation range

    // Eye Variations
    let eyeW = scene.random(8, 10.5);
    let eyeH = scene.random(8, 10.5);
    
    
    // Global Outline
    scene.stroke(scene.color("#555"));
    scene.strokeWeight(1);

    // 1. BEARD 
    // slightly darker grey/white
    scene.fill(0, 0, 92); 
    scene.beginShape();
    scene.vertex(-beardWidth / 2, -10); 
    scene.vertex(beardWidth / 2, -10);  
    // Control points pulled inward for a pointier look
    scene.bezierVertex(beardWidth/2, 40, 10, beardLen - 20, 0, beardLen); 
    scene.bezierVertex(-10, beardLen - 20, -beardWidth/2, 40, -beardWidth / 2, -10);
    scene.endShape(scene.CLOSE);

    // Beard Strands (Texture)
    scene.push();
    scene.noFill();
    scene.stroke(0, 0, 80); // Light grey lines
    scene.strokeWeight(1);
    // Draw a few curves
    scene.bezier(-10, 0, -10, 20, -5, beardLen/2, 0, beardLen - 10);
    scene.bezier(10, 0, 10, 20, 5, beardLen/2, 0, beardLen - 10);
    scene.bezier(0, 5, 0, 25, 0, beardLen/2, 0, beardLen - 15);
    scene.pop();

    // 2. FACE 
    scene.fill(25, 40, 95); 
    scene.ellipse(0, -15, 85, 60); 

    // 3. EYES
    scene.fill(0);
    let eyeSep = 14;
    // Use ellipse to allow slight irregularities
    scene.ellipse(-eyeSep, -18, eyeW, eyeH);
    scene.ellipse(eyeSep, -18, eyeW, eyeH);
    
    // Highlights
    scene.push();
    scene.noStroke();
    scene.fill(255);
    scene.circle(-eyeSep + 2, -20, 3);
    scene.circle(eyeSep + 2, -20, 3);
    scene.pop();
    
    // Highlights (no stroke for these usually looks better, but prompt asked for stroke on shapes)
    // We'll turn off stroke just, for the tiny white dot to keep it crisp
    scene.push();
    scene.noStroke();
    scene.fill(255);
    scene.circle(-eyeSep + 2, -20, 3);
    scene.circle(eyeSep + 2, -20, 3);
    scene.pop();

    // 4. NOSE
    // Varying skin tone slightly per gnome
    scene.fill(noseHue, noseSat, 95);
    scene.ellipse(0, 5, noseW, noseH);

    // 5. HAT
    scene.fill(hatColor);
    scene.beginShape();
    // START: Base of the hat (Narrowed from -55 to -40)
    scene.vertex(-40, -25); 
    
    // BRIM: Curve across the forehead (Narrowed target to 40)
    scene.bezierVertex(-15, -35, 15, -35, 40, -25); 
    
    // RIGHT SIDE UP: 
    // The first two numbers (28, -90) control the "bulge" near the bottom.
    // Reducing 45 -> 28 makes the cone skinnier immediately.
    scene.bezierVertex(28, -90, hatBend, -hatHeight + 20, hatBend, -hatHeight); 
    
    // LEFT SIDE DOWN:
    // Same logic here, reduced -45 -> -28 to mirror the slimming.
    scene.bezierVertex(hatBend, -hatHeight + 20, -28, -90, -40, -25);
    scene.endShape(scene.CLOSE);

    // 6. POM-POM 
    scene.fill(0, 0, 100);
    scene.circle(hatBend, -hatHeight, 22);

    scene.pop();
  }

  const createGUI = () => {
    cfg.title = "Gnomes";
    cfg.info = "A grid of procedurally generated gnomes";
    cfg.subinfo = "Based on the original sketch, refactored to instance mode.";
    cfg.s = s;
    
    let R = new Key("r", () => {
      gui.spin(() => {
        drawScene();
        gui.spin();
        gui.unmark();
        gui.update();
      });
    });

    let resetCanvas = new Command(R, "reset");

    cfg.commands = [resetCanvas, cfg.seeder.command];
    cfg.controls = [cfg.seeder.control];

    gui = createBaseGUI(cfg);
    return gui;
  };

  s.keyReleased = () => {
    gui.dispatch(s.key);
  };
};

p5.disableFriendlyErrors = true;
let p5sketch = new p5(sketch);
