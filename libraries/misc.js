export {
  getLargeCanvas,
  mod,
  argMax,
  releaseCanvas,
  gaussColor,
  copyColor,
  copyColorHSB,
  darken,
  shuffle,
  sceneShuffle,
  bezierB,
  arrow,
  cl,
  signature,
  addText,
  smoothStep,
};

function getLargeCanvas(s, maxSide) {
  let w = s.windowWidth,
    h = s.windowHeight;
  if (Math.max(w, h) <= maxSide)
    return {
      w: w,
      h: h,
    };
  if (w >= h) {
    // Landscape
    return {
      w: maxSide,
      h: Math.floor((maxSide * h) / (1.0 * w)),
    };
  }
  if (h > w) {
    // Portrait
    return {
      w: Math.floor((maxSide * w) / (1.0 * h)),
      h: maxSide,
    };
  }
}

// A very compact smoothStep function by Piter Pasma (https://piterpasma.nl)

const smoothStep = (a, b, x) => (
  (x -= a), (x /= b - a), x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x)
);

function adjustedTextFont(cfg) {
  if (cfg.hd < 1) {
    return { size: cfg.fontsize, gap: cfg.fontsize };
  } else {
    return { size: cfg.fontsize * cfg.hd, gap: cfg.fontsize * cfg.hd };
  }
}

// All this seems unnecessary?

function signature(cfg) {
  let gap;
  if (cfg.adjustFont) {
    gap = adjustedTextFont(cfg).gap;
  } else {
    gap = cfg.fontsize * cfg.hd;
  }
  addText(
    cfg,
    cfg.right - ((gap / 2) << 0),
    cfg.bottom - 2 * gap,
    cfg.identifier,
  );
  addText(
    cfg,
    cfg.right - ((gap / 2) << 0),
    cfg.bottom - gap + cfg.hd,
    cfg.sig,
  );
}

function addText(cfg, x, y, content) {
  let size;
  if (cfg.adjustFont) {
    size = adjustedTextFont(cfg).size;
  } else {
    size = cfg.fontsize * cfg.hd;
  }

  cfg.scene.push();
  cfg.scene.noStroke();
  cfg.scene.fill(cfg.color);
  cfg.scene.textAlign(cfg.s.RIGHT);
  cfg.scene.textFont(cfg.font, size);
  let ctx = cfg.scene.drawingContext;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.shadowBlur = 1;
  ctx.shadowColor = cfg.shadow;
  cfg.scene.text(content, x, y);
  cfg.scene.pop();
}

function cl(args) {
  console.log(...args);
}

function mod(m, n) {
  // Javascript's modulo ain't no modulo
  return ((m % n) + n) % n;
}

function argMax(arr) {
  let max = 0;
  let ind = -1;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > max) {
      ind = i;
      max = arr[i];
    }
  }
  return ind;
}

function releaseCanvas(canvas) {
  canvas.width = 1;
  canvas.height = 1;
  canvas.elt.setAttribute("style", "width: 1px; height: 1px"); // THIS!
  canvas.drawingContext.clearRect(0, 0, 1, 1);
}

function copyColor(s, color) {
  const r = s.red(color);
  const g = s.green(color);
  const b = s.blue(color);
  const a = s.alpha(color);
  return s.color(r, g, b, a);
}

function copyColorHSB(sc, color) {
  const hue = sc.hue(color);
  const sat = sc.saturation(color);
  const bri = sc.brightness(color);
  const alp = sc.alpha(color);
  return sc.color(hue, sat, bri, alp);
}

function darken(s, color, amount) {
  const r = amount * s.red(color);
  const g = amount * s.green(color);
  const b = amount * s.blue(color);
  const a = s.alpha(color);
  return s.color(r, g, b, a);
}

function gaussColor(s, colour, sigma) {
  let r = s.randomGaussian(s.red(colour), sigma);
  let g = s.randomGaussian(s.green(colour), sigma);
  let b = s.randomGaussian(s.blue(colour), sigma);
  return s.color(r, g, b);
}
function sceneShuffle(sc, array) {
  // From https://stackoverflow.com/a/2450976
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(sc.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
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
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

function bezierB(
  scene,
  x,
  y,
  c1x,
  c1y,
  c2x,
  c2y,
  ex,
  ey,
  lineStrok,
  pointStrok,
) {
  let lineStroke = 4,
    pointStroke = 6;
  if (lineStrok) {
    lineStroke = lineStrok;
  }
  if (pointStrok) {
    pointStroke = pointStrok;
  }
  scene.strokeWeight(lineStroke);
  scene.line(x, y, c1x, c1y);
  scene.strokeWeight(pointStroke);
  scene.point(x, y);
  scene.point(c1x, c1y);
  scene.strokeWeight(lineStroke);
  scene.line(c1x, c1y, c2x, c2y);
  scene.strokeWeight(2 * pointStroke);
  scene.point(c1x, c1y);
  scene.point(c2x, c2y);
  scene.strokeWeight(lineStroke);
  scene.line(c2x, c2y, ex, ey);
  scene.strokeWeight(pointStroke);
  scene.point(c2x, c2y);
  scene.point(ex, ey);
}

function arrow(scene, sx, sy, ex, ey) {
  let dx = sx - ex,
    dy = sy - ey;
  const nrm = Math.sqrt(dx * dx + dy * dy);
  (dx = dx / nrm), (dy = dy / nrm);
  const nx = dy,
    ny = -dx;
  scene.push();
  scene.line(sx, sy, ex, ey);
  const lx = ex + 0.1 * nrm * dx - 0.02 * nrm * nx;
  const ly = ey + 0.1 * nrm * dy - 0.02 * nrm * ny;
  const rx = ex + 0.1 * nrm * dx + 0.02 * nrm * nx;
  const ry = ey + 0.1 * nrm * dy + 0.02 * nrm * ny;
  scene.triangle(lx, ly, ex, ey, rx, ry);
  scene.pop();
}
