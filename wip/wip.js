// This still needs a severe cleanup and quality-of-play
// improvements, but it is usable

import { set, get } from "./idb-keyval.js";
import {setJazz, jazzing, nextPianoNote } from "./jazz/jazz.js"
import { bindGamepadHandlers, bindKeyHandlers, handleControls, touchZoneHandler, getDeviceInput } from "./controlHandling.js"

const logDiv = document.getElementById("logdiv");

let keyMap = await get("keyMap")

if(keyMap === undefined){
  keyMap = {
    "ArrowUp": "moveUp",
    "ArrowDown": "moveDown",
    "ArrowLeft": "moveLeft",
    "ArrowRight": "moveRight",
    "Space": "shoot",
    "KeyX": "reload",
    "KeyZ": "saveCanvas",
  }
}

let buttonMap = await get("buttonMap")

if(buttonMap === undefined){
  buttonMap = {
    "b15": "moveRight",
    "b14": "moveLeft",
    "b13": "moveDown",
    "b12": "moveUp",
    "b1": "shoot",
    "b2": "reload",
    "b4": "saveCanvas"
  }
}

let jazz = await get("jazz")

if(jazz === undefined){
  jazz = true
}

const mus = document.getElementById("music");
if(!jazz){
  mus.classList.add("no-music")
}

if(jazz){
  setJazz()
}

let state = "splash"

const sketch = (s) => {
  const arena = {
    gap: 50,
    w: 600,
    h: 600,
    cw: 40,
  };

  const wiw = window.innerWidth
  const wih = window.innerHeight - arena.gap
  if(wih < wiw){
    // landscape
    arena.w = wih
    arena.h = wih
    arena.cw = arena.w / 15
  } else {
    // portrait, or square. I want to make mobile nice here
    arena.w = wiw
    arena.cw = arena.w / 15
    arena.h = Math.floor(wih / arena.cw) * arena.cw
  }

  const scoreElt = document.getElementById("score")
  const settingsElt = document.getElementById("settings")
  const sp = document.getElementById("splash");

  const now = () => Date.now();

  const cw = arena.cw;


  let prevHit = Date.now(); // Debouncing step movements

  // A lot of these need to be in some "init"
  let addedEnemiesAt = -1;
  let availableBullets = 2;
  let turnCount = 0;
  let score = 0;

  let bullets = [];
  let splats = [];

  let enemies = [];
  let walls = [];
  let wallsMap = {};

  let shouldTurn = false;

  let bubblePoints = []

  const bubbleAt = (ix, iy) => {
    const random = (a) => Math.random() * a //s.random;
    const ITER = cw*cw;
    if(bubblePoints.length == 0){

      for (let i = 0; i < ITER; i++) {
        const a = random(s.PI * 2);
        const r = cw/2.5 * (1.0 - random(random(random(random(random(1))))));
        bubblePoints.push({r: r, a: a})
      }
    }
    s.push()
    s.translate(ix*cw+cw/2, iy*cw+cw/2)
    s.colorMode(s.HSB);
    for (let i = 0; i < ITER; i++) {
      const a = bubblePoints[i].a
      const r = bubblePoints[i].r
      const foo = a / (2 * s.PI);
      let col = s.color(360 * foo, 90, 90);
      col.setAlpha(0.05);
      s.stroke(col);
      s.fill(col)
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      s.circle(x, y, 1);
    }
    s.pop()
  }

  const colors = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
    [1, 0, 0],
    [1, 1, 0],
    [1, 0, 1],
    [1, 0.5, 0],
    [0.5, 1, 0],
    [0.5, 1, 0.5],
    [0.5, 0, 1],
    [0.5, 0.25, 0.1],
    [Math.random(), Math.random(), Math.random()],
    [Math.random(), Math.random(), Math.random()],
    [Math.random(), Math.random(), Math.random()],
    [Math.random(), Math.random(), Math.random()],
    [Math.random(), Math.random(), Math.random()],
    [Math.random(), Math.random(), Math.random()],
    [Math.random(), Math.random(), Math.random()],
    [Math.random(), Math.random(), Math.random()],
  ];

  const wallAt = (ix, iy, ori) => {
    if (!wallsMap[ix]) {
      wallsMap[ix] = {};
    }
    if (!wallsMap[ix][iy]) {
      wallsMap[ix][iy] = [];
    }
    wallsMap[ix][iy].push(ori);
    walls.push({
      ix: ix,
      iy: iy,
      ori: ori,
    });
  };

  const addWalls = (n) => {
    const wd = ["N", "S", "W", "E"];
    for (let j = 0; j < n; j++) {
      const ix = Math.floor((Math.random() * arena.w) / cw),
        iy = Math.floor((Math.random() * arena.h) / cw);
      const d = wd[Math.floor(Math.random() * wd.length)];
      wallAt(ix, iy, d);
    }
  };

  addWalls(Math.max(arena.h / arena.cw, arena.w / arena.cw));

  console.log(wallsMap);

  const drawWalls = () => {
    s.push();
    s.strokeWeight(4);
    s.stroke("black");
    for (let w of walls) {
      const ix = w.ix,
        iy = w.iy;
      if (w.ori == "N") {
        s.line(ix * cw, iy * cw, ix * cw + cw, iy * cw);
      }
      if (w.ori == "E") {
        s.line(ix * cw + cw, iy * cw, ix * cw + cw, iy * cw + cw);
      }
      if (w.ori == "S") {
        s.line(ix * cw, iy * cw + cw, ix * cw + cw, iy * cw + cw);
      }
      if (w.ori == "W") {
        s.line(ix * cw, iy * cw, ix * cw, iy * cw + cw);
      }
    }
    s.pop();
  };

  const around = (t) => {
    let a = {};
    const ix = t.ix,
      iy = t.iy;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        a[`${ix + i},${iy + j}`] = true;
      }
    }
    return a;
  };

  let thingy = {
    ix: Math.floor((Math.random() * arena.w) / cw),
    iy: Math.floor((Math.random() * arena.h) / cw),
    d: 0,
    a: Math.PI / 2,
    aiming: false,
    aimingAnimation: 0.2
  };

  let assigned = around(thingy);

  const addEnemies = (n) => {
    for(let i=0; i < Math.min(5, n); i++){
      const drum = Math.floor(Math.random()*3)
      try{
        if(jazz)
          window.drumNoteSampler.triggerAttackRelease([`a${drum}`], 1.2);
      }catch(err){
        console.log(err)
      }
    }
    for (let j = 0; j < n; j++) {
      const ix = Math.floor((Math.random() * arena.w) / cw),
        iy = Math.floor((Math.random() * arena.h) / cw);
      const key = `${ix},${iy}`;
      if (assigned[key]) {
        continue;
      }
      let enemy = {
        ix: ix,
        iy: iy,
        jx: cw / 20 - (Math.random() * cw) / 10,
        jy: cw / 20 - (Math.random() * cw) / 10,

        d: 0,
        k: "circle",
        c: colors[Math.floor(Math.random() * colors.length)], // A normalized color
        s: cw * 0.6,
        _s: cw * 0.6,
        th: 0,
      };
      enemies.push(enemy);
      assigned[key] = true;
    }
    addedEnemiesAt = turnCount;
  };

  addEnemies(Math.floor(Math.sqrt((arena.w * arena.h) / (cw * cw))));

  const shoot = (x, y, a, r, n) => {
    // x, y: starting position
    // a: angle, essentially looking-at, potentially with some shuffle
    // r: range, this will inform the decay speed. Note that decay needs to be a function of the grid size, which is still a non-defined constant
    // n: number of pellets
    for (let i = 0; i < n; i++) {
      let jiggledAngle = a - Math.random() * 0.1 + Math.random() * 0.2; // TBD
      let pellet = {
        x: x,
        y: y,
        a: jiggledAngle,
        vx: (-cw / 4) * Math.cos(jiggledAngle), // TBD, initial velocity
        vy: (-cw / 4) * Math.sin(jiggledAngle),
        d: 0.95, // TBD, decay in function of grid size and framerate… and initial velocity
      };
      bullets.push(pellet);
    }
  };

  const drawBullet = (b) => {
    s.push();
    s.stroke("black");
    s.line(b.x, b.y, b.x + 0.9 * b.vx, b.y + 0.9 * b.vy);
    s.pop();
  };

  const collisionDetection = (b) => {
    for (let e of enemies.filter((e) => !e.hit)) {
      const dx = e.ix * cw + cw / 2 - b.x;
      const dy = e.iy * cw + cw / 2 - b.y;
      const check = dx * dx + dy * dy < e.s * e.s;
      if (check) {
        const vn = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        if (vn < 0.5) {
          continue;
        }
        e.hit = true;
        score += 10;
        const drum = Math.floor(Math.random()*3)
        try{
          if(jazz)
            window.drumNoteSampler.triggerAttackRelease([`f${drum}`], 1.2);
        }catch(err){
          console.log(err)
        }
        for (let i = 0; i < 18 + Math.random() * 20; i++) {

          const j =
            b.a + 0.5 * s.PI * (0.25 * Math.random() - 0.5 * Math.random());
          let splat = {
            x: b.x,
            y: b.y,
            vx: -vn * Math.cos(j),
            vy: -vn * Math.sin(j),
            d: 0.9 - Math.random() * 0.2,
            c: e.c,
            a: j, //b.a,
            s: vn / 3 + Math.random() * 8, // TODO factor size of grid
            age: 0,
          };
          splats.push(splat);
        }
        b.vx = 0;
        b.vy = 0;
      }
    }
  };

  const drawSplats = () => {
    for (let sp of splats) {
      const c = [sp.c[0] * 255, sp.c[1] * 255, sp.c[2] * 255, 255 - sp.age];
      s.push();
      s.fill(...c);
      s.stroke(...c); // TODO Stroke of the hit thing!
      s.translate(sp.x, sp.y);
      s.rotate(sp.a);
      s.ellipse(0, 0, 3 * sp.s, sp.s);
      s.pop();
    }
  };

  const animateSplats = () => {
    // TODO: same as bullet after all
    for (let s of splats.filter((s) => !s.stopped)) {
      const nx = s.x + s.vx,
        ny = s.y + s.vy;
      if (crossedWall(s.x, s.y, nx, ny)) {
        // TODO Will need to set x and y to the wall
        s.vx = 0;
        s.vy = 0;
        s.stopped = true;
        return;
      }
      s.x = nx;
      s.y = ny;
      s.vx *= s.d;
      s.vy *= s.d;
      if (s.vx * s.vx + s.vy * s.vy < 4) {
        s.stopped = true;
      }
    }
  };

  const processSplats = () => {
    drawSplats();
    animateSplats();
  };

  function crossedWall(ox, oy, nx, ny) {
    const pix = Math.floor(ox / cw);
    const piy = Math.floor(oy / cw);
    const nix = Math.floor(nx / cw);
    const niy = Math.floor(ny / cw);
    if (pix < nix) {
      // Moves eastward. Assume it's not jumping more than one grid for now (TODO)
      const wat = wallsMap[pix]?.[piy];
      const nwat = wallsMap[nix]?.[niy];
      if (wat?.includes("E") || nwat?.includes("W")) {
        return true;
      }
    }
    if (nix < pix) {
      // Moves westward.
      const wat = wallsMap[pix]?.[piy];
      const nwat = wallsMap[nix]?.[niy];
      if (wat?.includes("W") || nwat?.includes("E")) {
        return true;
      }
    }
    if (piy < niy) {
      // Moves southward.
      const wat = wallsMap[pix]?.[piy];
      const nwat = wallsMap[nix]?.[niy];
      if (wat?.includes("S") || nwat?.includes("N")) {
        return true;
      }
    }
    if (niy < piy) {
      // Moves northward.
      const wat = wallsMap[pix]?.[piy];
      const nwat = wallsMap[nix]?.[niy];
      if (wat?.includes("N") || nwat?.includes("S")) {
        return true;
      }
    }
    return false;
    //return ox !== nx || oy !== ny;
  }

  const processBullets = () => {
    for (let bullet of bullets) {
      animateBullet(bullet);
      drawBullet(bullet);
      collisionDetection(bullet);
    }
    bullets = bullets.filter((b) => b.vx * b.vx + b.vy * b.vy > 3);
  };

  const animateBullet = (s) => {
    const nx = s.x + s.vx,
      ny = s.y + s.vy;
    if (crossedWall(s.x, s.y, nx, ny)) {
      s.vx = 0;
      s.vy = 0;
      return;
    }
    s.x = nx;
    s.y = ny;
    s.vx *= s.d;
    s.vy *= s.d;
  };

  const drawThingy = () => {
    s.push();
    // TODO this 50 needs to be a constant somewhere
    s.translate(cw / 2, cw / 2); // Would center at 0,0 grid
    s.translate(cw * thingy.ix, cw * thingy.iy);
    s.rotate(thingy.a);
    s.stroke(50, 50, 50);
    s.fill(50, 50, 50);
    //s.rect(0, -cw / 10, cw / 5, cw / 3);
    s.push();
    s.strokeWeight(cw / 10);
    s.circle(cw / 10, cw / 10, 3);
    s.noFill();
    s.arc(cw / 10, cw / 10, cw / 5, cw / 2.5, (3 * s.PI) / 2, s.PI / 2);
    s.pop();
    // Gun
    //if(thingy.aiming ){
    s.stroke(100, 100, 100);
    s.strokeWeight(4);
    s.line(0, -cw / 10, -cw / 4 * thingy.aimingAnimation, -cw / 10);
    //}
    if(thingy.aiming  && thingy.aimingAnimation < 1){
      thingy.aimingAnimation += thingy.aimingAnimation 
    }
    const transpRed = s.color(200, 50, 50, 50);
    //line(-150, 0, -150, 10)
    //s.noFill();
    //s.drawingContext.setLineDash([5, 15]);
    s.pop();
    s.push();
    s.stroke(transpRed);
    s.fill(transpRed);

    if(thingy.aiming){
      const x =
        thingy.ix * cw +
        cw / 2 +
        5 * Math.cos(thingy.a - s.PI / 2) +
        -12 * Math.cos(thingy.a);
      const y =
        thingy.iy * cw +
        cw / 2 +
        5 * Math.sin(thingy.a - s.PI / 2) +
        -12 * Math.sin(thingy.a);

      s.translate(x, y);
      s.rotate(thingy.a);
      s.arc(
        0,
        0,
        7 * cw,
        7 * cw,
        s.PI - 0.1,
        s.PI + 0.1
        //s.PI / 16 + s.PI - s.PI / 32,
        //s.PI / 16 + s.PI + s.PI / 32
      );
      s.pop();
    }
  };

  const drawEnemies = () => {
    s.push();
    for (let e of enemies.filter((e) => !e.hit)) {
      if (e.k == "circle") {
        const f = (v, w) => Math.max(v, w);
        const c1 = [
          f(e.c[0], 0.1) * 255,
          f(e.c[1], 0.1) * 255,
          f(e.c[2], 0.1) * 255,
        ];
        const c2 = [
          f(e.c[0], 0.9) * 255,
          f(e.c[1], 0.9) * 255,
          f(e.c[2], 0.9) * 255,
        ];
        s.stroke(...c1);
        s.fill(...c2);
        s.circle(e.ix * cw + cw / 2 + e.jx, e.iy * cw + cw / 2 + e.jy, e.s);
      }
    }
    s.pop();
  };

  const pulseEnemies = () => {
    for (let e of enemies) {
      e.s = e._s + 0.2 * e._s * Math.cos(e.th);
      e.th += 0.08; // Would be nice if this was faster the closer they are to you
      if (e.th > 2 * s.PI) {
        e.th = 0;
      }
    }
  };

  const processEnemies = () => {
    pulseEnemies();
    drawEnemies();
    enemies = enemies.filter((e) => !e.dead);
  };
  const validMove = (pix, piy, d) => {
    if (d == "N") {
      if (piy == 0) {
        return false;
      }
      const wat = wallsMap[pix]?.[piy];
      const nwat = wallsMap[pix]?.[piy - 1];
      if (wat?.includes("N")) {
        return false;
      }
      if (nwat?.includes("S")) {
        return false;
      }
    }
    if (d == "S") {
      if (piy == arena.h - 1) {
        return false;
      }
      const wat = wallsMap[pix]?.[piy];
      const nwat = wallsMap[pix]?.[piy + 1];
      if (wat?.includes("S")) {
        return false;
      }
      if (nwat?.includes("N")) {
        return false;
      }
    }
    if (d == "E") {
      if (pix == arena.w - 1) {
        return false;
      }
      const wat = wallsMap[pix]?.[piy];
      const nwat = wallsMap[pix + 1]?.[piy];
      if (wat?.includes("E")) {
        return false;
      }
      if (nwat?.includes("W")) {
        return false;
      }
    }
    if (d == "W") {
      if (pix == 0) {
        return false;
      }
      const wat = wallsMap[pix]?.[piy];
      const nwat = wallsMap[pix - 1]?.[piy];
      if (wat?.includes("W")) {
        return false;
      }
      if (nwat?.includes("E")) {
        return false;
      }
    }
    return true;
  };

  const lookingAtGrid = (t) => {
    // p5js angles go clockwise
    if (Math.abs(t.a - s.PI / 2) < s.PI / 4) {
      return "D";
    }
    if (Math.abs(t.a - s.PI) <= s.PI / 4) {
      return "R";
    }
    if (Math.abs(t.a - (3 * s.PI) / 2) <= s.PI / 4) {
      return "U";
    }
    return "L";
  };

  const highlightSquare = (ix, iy, color) => {
    s.push();
    s.stroke(color);
    s.strokeWeight(2);
    s.noFill();
    s.rectMode(s.CORNERS);
    s.rect(ix * cw, iy * cw, ix * cw + cw, iy * cw + cw);
    s.pop();
  };

  const highlightLookingAt = (thingy, col) => {
    s.push();
    const at = lookingAtGrid(thingy);
    if (at == "U") {
      highlightSquare(thingy.ix, thingy.iy + 1, col);
    }
    if (at == "D") {
      highlightSquare(thingy.ix, thingy.iy - 1, col);
    }
    if (at == "R") {
      highlightSquare(thingy.ix + 1, thingy.iy, col);
    }
    if (at == "L") {
      highlightSquare(thingy.ix - 1, thingy.iy, col);
    }

    s.pop();
  };

  const gameActions = {

    "moveUp": () => {
      if (now() - prevHit < 100) {
        return;
      }
      nextPianoNote()
      prevHit = now();
      const ix = thingy.ix,
        iy = thingy.iy;
      const at = lookingAtGrid(thingy);
      if (at == "U") {
        if (!validMove(ix, iy, "S")) {
          return;
        }
        thingy.iy += 1;
      }
      if (at == "D") {
        if (!validMove(ix, iy, "N")) {
          return;
        }
        thingy.iy -= 1;
      }
      if (at == "R") {
        if (!validMove(ix, iy, "E")) {
          return;
        }
        thingy.ix += 1;
      }
      if (at == "L") {
        if (!validMove(ix, iy, "W")) {
          return;
        }
        thingy.ix -= 1;
      }
      turn();
    },
    "moveRight": () => {
      thingy.a += 0.08;
      if (thingy.a > 2 * s.PI) {
        thingy.a = 0;
      }
    },
    "moveLeft": () => {
      thingy.a -= 0.08;
      if (thingy.a < 0) {
        thingy.a = 2 * s.PI;
      }
    },
    "moveDown": () => {
      nextPianoNote()
      if (now() - prevHit < 100) {
        return;
      }
      prevHit = now();
      const ix = thingy.ix,
        iy = thingy.iy;
      const at = lookingAtGrid(thingy);
      if (at == "U") {
        if (!validMove(ix, iy, "N")) {
          return;
        }
        thingy.iy -= 1;
      }
      if (at == "D") {
        if (!validMove(ix, iy, "S")) {
          return;
        }
        thingy.iy += 1;
      }
      if (at == "R") {
        if (!validMove(ix, iy, "W")) {
          return;
        }
        thingy.ix -= 1;
      }
      if (at == "L") {
        if (!validMove(ix, iy, "E")) {
          return;
        }
        thingy.ix += 1;
      }
      turn();
    },    "shoot": () => {
      if (availableBullets == 0) {
        return;
      }
      if (now() - prevHit < 200) {
        return;
      }
      const drum = Math.floor(Math.random()*3)
      try{
        if(jazz)
          window.drumNoteSampler.triggerAttackRelease([`c${drum}`], 1.0);}catch(err){console.log(err)}
      prevHit = now();
      if(!thingy.aiming){
        thingy.aiming = true;
        return;
      }

      const x =
        thingy.ix * cw +
        cw / 2 +
        5 * Math.cos(thingy.a - s.PI / 2) +
        -12 * Math.cos(thingy.a);
      const y =
        thingy.iy * cw +
        cw / 2 +
        5 * Math.sin(thingy.a - s.PI / 2) +
        -12 * Math.sin(thingy.a);
      availableBullets -= 1;
      shoot(x, y, thingy.a, 3, 3);
      thingy.aiming = false;
      // TODO: smooth this
      thingy.aimingAnimation = 0.2
      turn();
    },
    "reload": () => {
      if (now() - prevHit < 500) {
        return;
      }
      prevHit = now();
      if (availableBullets == 2) {
        return;
      }
      const drum = Math.floor(Math.random()*3)
      try{

        if(jazz)
          window.drumNoteSampler.triggerAttackRelease([`b${drum}`], 1.0);
      }catch(err){
        console.log(err)}
      availableBullets = 2;
      turn();
    },
    "saveCanvas": () => {
      s.saveCanvas();
    }
  };

  const setupTouchZones = () => {
    const up = document.getElementById("up-button")
    const right = document.getElementById("right-button")
    const left = document.getElementById("left-button")
    const down = document.getElementById("down-button")
    const button1 = document.getElementById("button-1")
    const button4 = document.getElementById("button-4")
    touchZoneHandler(up, "ArrowUp")
    touchZoneHandler(down, "ArrowDown")
    touchZoneHandler(left, "ArrowLeft")
    touchZoneHandler(right, "ArrowRight")
    touchZoneHandler(button1, "Space")
    touchZoneHandler(button4, "KeyX")
  }

  const rmap = (m) => {
    let reversed = {}
    for(let k in m){
      reversed[m[k]] = k
    }
    return reversed
  }

  const presentKeyMap = (d) => {
    const rkeymap = rmap(keyMap)
    const rbuttonmap = rmap(buttonMap)
    const e = t => document.createElement(t)
    const wrapper = e("DIV")
    const desc = e("P")
    desc.innerText = "Tap on the keys or buttons to customise them. The settings will persist."
    wrapper.appendChild(desc)
    wrapper.classList.add("control-list-wrapper")
    const table = e("TABLE")
    wrapper.appendChild(table)
    const headerRow = e("tr");
    table.appendChild(headerRow);
    const headerAction = e("th");
    const headerButton = e("th");
    const headerKey = e("th");
    headerAction.innerText = "Action";
    headerButton.innerText = "Button";
    headerKey.innerText = "Key";
    headerRow.append(headerAction, headerKey, headerButton);

    for(let action in gameActions){
      const row = e("tr")
      table.appendChild(row)
      const tda = e("td")
      const tdb = e("td")
      const tdk = e("td")
      tdb.classList.add("gamepad-button")

      const oldkey = rkeymap[action]
      const oldbutton = rbuttonmap[action]
      tdk.addEventListener("click", async ev => {
        tdk.innerText = "???"
        const nk =  await getDeviceInput("keyboard")
        tdk.innerText = nk
        keyMap[nk] = action
        delete keyMap[oldkey]
        await set("keyMap", keyMap)
      })
      tdb.addEventListener("click", async ev => {
        tdb.innerText = "???"
        const nb = await getDeviceInput("gamepad")
        tdb.innerText = `b${nb}`    
        buttonMap[`b${nb}`] = action
        delete buttonMap[oldbutton]
        await set("buttonMap", buttonMap)
      })
      tda.innerText = action
      tdb.innerText = oldbutton
      tdk.innerText = oldkey
      row.append(tda, tdk, tdb)
    }
    d.appendChild(wrapper)
    const back = e("DIV")
    back.innerText = "Go back"
    back.classList.add("control-list-go-back")
    wrapper.appendChild(back)
  }

  const showGameElements = () => {
    const mc = document.getElementById("mobile-controls");
    mc.style.display = "block";
    mc.style.zIndex = 1000;
    s.loop()
    state = "play"
    settingsElt.style.display = "block"
    scoreElt.style.display = "block"
    settingsElt.addEventListener("click", (ev) => {
      hideGameElements()
      splash();
    })
  }

  const hideGameElements = () => {
    settingsElt.style.display = "none"
    scoreElt.style.display = "none"

  }

  const setupSplashMenu = () => {
    sp.querySelector("h1").addEventListener("click", () => {
      sp.style.display = "none"
      sp.style.zIndex = -1;
      showGameElements();
    })

    const ctls = document.getElementById("help-wrapper") 
    sp.querySelector("#help-button").addEventListener("click", () => {
      ctls.style.zIndex = 1000;
      ctls.style.display = "block";
    })
    ctls.addEventListener("click", () => {
      ctls.style.zIndex = -1;
      ctls.style.display = "none";
    })
    mus.addEventListener("click", async () => {
      mus.classList.toggle("no-music");
      jazz = !jazz
      await set("jazz", jazz)
    })
    const scw = document.getElementById("setup-controls-wrapper") 
    const setup = document.getElementById("setup-controls");
    setup.addEventListener("click", () => {
      scw.style.zIndex = 1000;
      scw.style.display = "block";     
    })

    presentKeyMap(scw)

    const back = document.querySelector(".control-list-go-back")
    back.addEventListener("click", () => {
      scw.style.zIndex = -1;
      scw.style.display = "none";     
    })  
  }

  const splash = () => {

    sp.style.zIndex = 1000;
    sp.style.display = "block"
    const shuffledColors = [...colors].sort(() => Math. random() - 0.5);
    const letters = ["p_", "o1_", "l1_", "l2_", "o2_", "c_", "k_"]
    for(let i=0; i< letters.length;i++){
      const [r, g, b] = shuffledColors[i]
      const l = document.getElementById(letters[i])
      l.style.color = `rgb(${r*255}, ${g*255}, ${b*255})`
    }
  }


  s.setup = () => {
    bindGamepadHandlers()
    bindKeyHandlers()
    s.frameRate(30);
    s.noLoop();
    const wrapper = document.getElementById("gamewrapper")
    document.body.style.width = arena.w + "px"
    document.body.style.height = arena.h + "px"
    wrapper.style.width = arena.w + "px"
    wrapper.style.height = arena.h + arena.gap + "px"
    // Force reflow
    document.body.offsetWidth; 
    wrapper.offsetWidth
    setupSplashMenu()
    setupTouchZones()
    s.createCanvas(arena.w, arena.h + arena.gap).parent(wrapper);
    s.background(200, 200, 200);
    splash()
  };

  const turn = () => {
    shouldTurn = true;
  };

  const _turn = () => {
    for (let e of enemies.filter((e) => !e.hit)) {
      toPlayer(e);
    }
    turnCount++;
    shouldTurn = false;
    for (let sp of splats) {
      sp.age += 5;
      sp.age = Math.min(200, sp.age);
    }
    //splats = splats.filter((s) => s.age < 255);
    enemies = enemies.filter((e) => !e.hit);
  };

  const available = () => {
    let frees = around(thingy);
    for (let e of enemies.filter((e) => !e.hit)) {
      frees[`${e.ix},${e.iy}`] = true;
    }
    return frees;
  };

  const mht = (p, q, r, s) => {
    return Math.abs(p - r) + Math.abs(q - s);
  };

  const toPlayer = (e) => {
    // TODO: in two passes, planned and done, to avoid collisions
    const px = thingy.ix,
      py = thingy.iy;
    const ex = e.ix,
      ey = e.iy;
    if (mht(px, py, ex, ey) == 1) {
      if (Math.abs(px - ex) == 1) {
        if (!validMove(px, py, "W") || !validMove(px, py, "E")) {
          return;
        }
      }
      if (Math.abs(py - ey) == 1) {
        if (!validMove(px, py, "N") || !validMove(px, py, "S")) {
          return;
        }
      }
      try{
        if(jazz){
          window.drumNoteSampler.triggerAttackRelease([`e0`], 1.1);
          const now = window.drumNoteSampler.now();
          window.drumNoteSampler.triggerAttackRelease([`f0`], 1.5, now + 0.4);
        }
      }catch(err){
        console.log(err)
      }
      logDiv.innerText = "Game over";
      s.push()
      const cx = thingy.ix*cw+cw/2
      const cy = thingy.iy*cw+cw/2
      s.translate(cx, cy)
      s.stroke(250, 30, 30, 200)
      s.fill(250, 30, 30, 200)
      const d = cw/5
      for(let i=0; i< 30; i++){
        s.push()
        s.rotate(s.PI*Math.random())
        const ccx =  d*Math.random()  - 2*d*Math.random()
        const ccy =  d*Math.random() - 2*d*Math.random()
        s.translate(ccx, ccy)
        const r = 4*d*Math.random()
        s.ellipse(0, 0, r, r/2)
        s.pop()
      }
      s.pop()
      s.push()
      s.fill(150, 150, 150, 100)
      s.stroke("gold")
      s.strokeWeight(3)
      s.circle(e.ix*cw + cw/2, e.iy*cw+cw/2, e.s)
      s.pop()
      state = "gameover"
      return;
    }
    const dx = Math.abs(px - ex);
    const dy = Math.abs(py - ey);
    if (dx > 0)  { // Prioritise E/W movement. Make it easy
      const d = px - ex > 0 ? 1 : -1;
      const dd = d == 1 ? "E" : "W";
      if (!validMove(ex, ey, dd)) {
        return;
      }
      e.ix += d;
    } else {
      const d = py - ey > 0 ? 1 : -1;
      const dd = d == 1 ? "S" : "N";
      if (!validMove(ex, ey, dd)) {
        return;
      }
      e.iy += d;
    }    
    /*if (dx > dy) {
      const d = px - ex > 0 ? 1 : -1;
      const dd = d == 1 ? "E" : "W";
      if (!validMove(ex, ey, dd)) {
        return;
      }
      e.ix += d;
    } else {
      const d = py - ey > 0 ? 1 : -1;
      const dd = d == 1 ? "S" : "N";
      if (!validMove(ex, ey, dd)) {
        return;
      }
      e.iy += d;
    }*/
    const samepos = enemies.filter((e) => !e.hit && e.ix == ex && e.iy == ey);
    if (samepos.length > 0) {
      e.ix = ex;
      e.iy = ey;
    }
  };

  const grid = () => {
    const x = arena.w,
      y = arena.h;
    s.push();
    s.strokeWeight(1)
    s.stroke(50, 50, 50);
    for (let i = 0; i < x; i++) {
      s.line(i * cw, 0, i * cw, y);
    }
    for (let j = 0; j < y; j++) {
      s.line(0, j * cw, x, j * cw);
    }
    s.pop();
  };

  let framecounter = 0

  const playingLoop = () => {
    s.push()
    s.translate(0, arena.gap)
    framecounter++
    s.background(200, 200, 200);

    highlightLookingAt(thingy, s.color(50, 50, 50));
    processSplats();
    grid();    
    drawWalls();    
    processEnemies();
    drawThingy();
    s.push();
    s.stroke("black");
    s.fill("black");
    for (let i = 0; i < availableBullets; i++) {
      s.rectMode(s.CORNERS);
      s.rect(20 + i * 15, 20, 30 + i * 15, 40, 5);
    }
    s.pop();
    processBullets();
    if (bullets.length == 0 && shouldTurn) {
      _turn();
    }
    if (addedEnemiesAt != turnCount && turnCount % 10 == 0) {
      assigned = available();
      const toAdd = Math.floor(turnCount / 10)
      addEnemies(Math.min(toAdd, Math.floor(arena.cw)));
      console.log("Adding enemies");
    }
    handleControls(gameActions, keyMap, buttonMap);
    framecounter = framecounter % 25
    if(framecounter == 0 && jazz){
      scoreElt.innerText = score
      if(jazz){
        try{
          jazzing()
        } catch(err) {
          console.log(err)
        }
      }
    }
    s.pop()
  };


  s.draw = () => {
    if(state == "play"){
      playingLoop()
    }
    if(state == "splash"){

    }
    if(state == "gameover"){
      handleControls();
    }
  };
}

p5.disableFriendlyErrors = true;
let p5sketch = new p5(sketch);
