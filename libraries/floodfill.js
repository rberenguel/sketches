export {
  sweepFloodfill, get, set, sameColor
}


function offset(scene, x, y) {
  // Assumes pixels are loaded
  return (Math.floor(y) * scene.width + Math.floor(x)) * 4
}

function get(scene, x, y) {
  const off = offset(scene, x, y)
  const R = scene.pixels[off + 0]
  const G = scene.pixels[off + 1]
  const B = scene.pixels[off + 2]
  const A = scene.pixels[off + 3]
  //console.log("get ", off, R, G, B, A)    
  return [R, G, B, A]
}

function set(scene, x, y, c) {
  const off = offset(scene, x, y)
  //console.log("Setting ", x, y, c)
  scene.stroke(c[0], c[1], c[2], c[3])
  scene.point(x, y)
  scene.pixels[off + 0] = c[0]
  scene.pixels[off + 1] = c[1]
  scene.pixels[off + 2] = c[2]
  scene.pixels[off + 3] = c[3]
}

function sameColor(c1, c2) {
  return (c1[0] == c2[0] &&
    c1[1] == c2[1] &&
    c1[2] == c2[2] &&
    c1[3] == c2[3])
}

function expandColor(s, c) {
  const R = s.red(c)
  const G = s.green(c)
  const B = s.blue(c)
  const A = s.alpha(c)
  return [R, G, B, A]
}

function inside(scene, x, y, c1) {
  // Assumes pixels are loaded
  //console.log("inside", x, y, c1)
  if (x < 0 || x > scene.width) {
    return false
  }
  if (y < 0 || y >= scene.height) {
    return false
  }
  return sameColor(get(scene, x, y), c1)
}

function sweepFloodfill(scene, x, y, c1p, c2p) {
  // For now converts from c1 to c2, with Wikipedia's algorithm.
  // Once I can find the boundaries, I'll refine.
  const c1 = expandColor(scene, c1p)
  const c2 = expandColor(scene, c2p)
  scene.loadPixels()
  if (!inside(scene, x, y, c1)) {
    scene.updatePixels()
    return
  }
  let stack = [
    [x, y]
  ]
  while (stack.length > 0) {
    let [nx, ny] = stack.pop()
    let lx = nx
    while (inside(scene, lx - 1, ny, c1)) {
      set(scene, lx - 1, ny, c2)
      lx = lx - 1
    }
    while (inside(scene, nx, ny, c1)) {
      set(scene, nx, ny, c2)
      nx = nx + 1
    }
    scan(scene, lx, nx - 1, ny + 1, stack, c1)
    scan(scene, lx, nx - 1, ny - 1, stack, c1)
  }
  scene.updatePixels()
}

function scan(scene, lx, rx, y, stack, c1) {
  let span = false
  for (let x = lx; x <= rx; x++) {
    if (!inside(scene, x, y, c1)) {
      span = false
    } else if (!span) {
      stack.push([x, y])
      span = true
    }
  }
}