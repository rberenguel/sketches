export {
  getLargeCanvas,
  mod,
  argMax,
  releaseCanvas,
  gaussColor,
  copyColor,
  darken,
  shuffle,
  bezierB,
  arrow,
  shimmeringColor,
  shimmeringColorHex
}

function getLargeCanvas(s, maxSide) {
  let w = s.windowWidth,
    h = s.windowHeight
  if (Math.max(w, h) <= maxSide) return {
    w: w,
    h: h
  }
  if (w >= h) {
    // Landscape
    return {
      w: maxSide,
      h: Math.floor(maxSide * h / (1.0 * w))
    }
  }
  if (h > w) {
    // Portrait
    return {
      w: Math.floor(maxSide * w / (1.0 * h)),
      h: maxSide
    }
  }
}

function mod(m, n) {
  // Javascript's modulo ain't no modulo
  return ((m % n) + n) % n
}

function argMax(arr) {
  let max = 0
  let ind = -1
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > max) {
      ind = i
      max = arr[i]
    }
  }
  return ind
}

function releaseCanvas(canvas) {
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.drawingContext;
  ctx && ctx.clearRect(0, 0, 1, 1);
}

function copyColor(s, color) {
  const r = s.red(color)
  const g = s.green(color)
  const b = s.blue(color)
  const a = s.alpha(color)
  return s.color(r, g, b, a)
}

function darken(s, color, amount) {
  const r = amount * s.red(color)
  const g = amount * s.green(color)
  const b = amount * s.blue(color)
  const a = s.alpha(color)
  return s.color(r, g, b, a)
}

function gaussColor(s, colour, sigma) {
  let r = s.randomGaussian(s.red(colour), sigma)
  let g = s.randomGaussian(s.green(colour), sigma)
  let b = s.randomGaussian(s.blue(colour), sigma)
  return s.color(r, g, b)
}

function shuffle(array) {
  // From https://stackoverflow.com/a/2450976
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]
    ];
  }

  return array;
  }
  
    function bezierB(scene, x, y, c1x, c1y, c2x, c2y, ex, ey) {
    scene.line(x, y, c1x, c1y)
    scene.line(c1x, c1y, c2x, c2y)
    scene.line(c2x, c2y, ex, ey)
  }
  
  function arrow(scene, sx, sy, ex, ey) {
    let dx = sx - ex,
      dy = sy - ey
    const nrm = Math.sqrt(dx * dx + dy * dy)
    dx = dx / nrm, dy = dy / nrm
    const nx = dy,
      ny = -dx
    scene.push()
    scene.line(sx, sy, ex, ey)
    const lx = ex + 0.1 * nrm * dx - 0.02 * nrm * nx
    const ly = ey + 0.1 * nrm * dy - 0.02 * nrm * ny
    const rx = ex + 0.1 * nrm * dx + 0.02 * nrm * nx
    const ry = ey + 0.1 * nrm * dy + 0.02 * nrm * ny
    scene.triangle(lx, ly, ex, ey, rx, ry)
    scene.pop()
  }
  
  // Colors sampled from Jackson Pollock's Shimmering,
  // used in Jared Tarbell's Substrate and fixed by
  // @dribnet (https://github.com/dribnet) for his 
  // port to p5js
  
  const goodColor = ["#fff0d0","#ffc828","#ffe898","#f0c898","#ffffd0","#a07800","#e8c898","#f8e070","#fff0c8","#d0b080","#fff8d0","#f8e8e0","#ffd8b0","#d0b078","#f0d8c0","#f0d8d0","#ffffd8","#c8c098","#d0c058","#e0c8a8","#d8d0b0","#f8f8d0","#b0a098","#fff0c0","#f0e8b8","#986870","#fff8d8","#ffe8c8","#f0e8c0","#f0e8d8","#e0d8b8","#e0d0a0","#e0d0b0","#d0c8a0","#e8e8d8","#f0d898","#f8f0d8","#fff0a0","#f8e878","#ffe878","#e8c848","#e8b878","#f8e050","#585048","#ffffc8","#a8a078","#e8e098","#f8f0c8","#e8d8a8","#fff8c8","#f0f8a8","#f0f0c0","#ffe078","#f0e8c8","#e8e080","#ffe868","#d0c0a0","#f0e080","#ffe890","#e0c858","#f8e0b8","#f0e0b8","#d8c898","#fff0b8","#c8b078","#f8e8b8","#e8d8c8","#f0c868","#a09078","#fff8c0","#f0f0c8","#ffe8b0","#e8e0b0","#ffd028","#b09030","#f0f0d0","#c0c090","#f8e0c0","#d0b890","#c0b078","#b0b098","#a8a880","#f0e0c0","#e0e0b8","#585838","#d0d0c0","#382810","#383828","#b8b8b0","#c0b090","#98a0b8","#e0b080","#c8c8b8","#f8e0b0","#d8c070","#f8e8c0","#e0d098","#e0d8b0","#586868","#e8f0c0","#906848","#b08868","#e8b828","#ffe8c0","#b0b078","#e0e0b0","#686870","#e0d8a0","#a0a0a8","#e0a060","#685858","#ff9828","#c0a060","#905818","#f8f0b8","#a89868","#a89070","#b0a870","#f0f0e0","#a89848","#586858","#e0b850","#c8b060","#b09020","#e0e0c0","#906070","#a07078","#b88868","#f8e0d8","#c09888","#ffe8d0","#d8c0a0","#c0c0b0","#e8c880","#c8b8a0","#d0c8b0","#fff0e8","#e8f0e0","#f8b828","#384030","#302008","#505860","#d8c0b0","#f0e0b0","#ffd0b8","#a05810","#501000","#e8c078","#f8b888","#e8d050","#fff0d8","#f0d870","#984008","#805800","#e8e0c8","#b8b8a8","#f0e8a0","#102028","#708080","#d8c8a0","#b0b8b0","#ffd8a0","#582800","#d8c8b0","#fff098","#d0c8a8","#fff8b0","#687078","#f0d098","#607070","#484858","#787880","#983010","#fff8e0","#905048","#a82818","#603810","#f8f8f8","#fff0f8"];

function shimmeringColorHex(s) {
  return s.random(goodColor);
}  
  
function shimmeringColor(s) {
  return s.color(shimmeringColorHex(s));
}