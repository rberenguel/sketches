export {
  getLargeCanvas,
  mod,
  argMax,
  releaseCanvas,
  gaussColor,
  copyColor,
  darken,
  shuffle
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