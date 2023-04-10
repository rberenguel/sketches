export {
  granulateChannels,
  granulateChannelsBW,
  oldieHD,
  olderHD,
  ctxGranulateChannels
}

import {
  shuffle
} from './misc.js'

function granulateChannels(s, amount, skipWhite) {
  // Based on a post by GorillaSun and meezwhite on grain
  // https://www.fxhash.xyz/article/all-about-that-grain
  s.loadPixels();
  let [r, g, b, a] = amount
  const d = s.pixelDensity();
  const pixelsCount = 4 * (s.width * d) * (s.height * d);
  for (let i = 0; i < pixelsCount; i += 4) {
    s.pixels[i] = s.pixels[i] + s.random(-r, r);
    s.pixels[i + 1] = s.pixels[i + 1] + s.random(-g, g);
    s.pixels[i + 2] = s.pixels[i + 2] + s.random(-b, b);
    s.pixels[i + 3] = s.pixels[i + 3] + s.random(-a, a);
  }
  s.updatePixels();
}

function granulateChannelsBW(s, amount, skipAlpha) {
  s.loadPixels();
  let [g, a] = amount
  const d = s.pixelDensity();
  const pixelsCount = 4 * (s.width * d) * (s.height * d);
  for (let i = 0; i < pixelsCount; i += 4) {
    if (skipAlpha && s.pixels[i + 3] == 0) {
      continue
    }

    const wiggleG = s.random(-g, g)
    const wiggleA = s.random(-a, a)
    s.pixels[i] = s.pixels[i] + wiggleG
    s.pixels[i + 1] = s.pixels[i + 1] + wiggleG
    s.pixels[i + 2] = s.pixels[i + 2] + wiggleG
    s.pixels[i + 3] = s.pixels[i + 3] + wiggleA
  }
  s.updatePixels();
}

function oldieHD(s, scene, density, hd, mode) {
  scene.push()
  let texture = s.createGraphics(scene.width, scene.height)
  texture.strokeWeight(1.0 / hd)
  let coords = []
  for (let i = 0; i < texture.width; i++) {
    for (let j = 0; j < texture.height; j++) {
      if (s.random() < density) {
        coords.push([i, j])
      }
    }
  }
  const shuffledCoords = shuffle(coords)
  for (let coord of shuffledCoords) {
    let [i, j] = coord
    const grain = 50 + 100 * s.noise(i, j)
    const fill = s.color(100 + grain, 100 + grain, grain, grain / 3)
    texture.fill(fill)
    texture.stroke(fill)
    texture.circle(i, j, hd * s.random())
  }
  let c = texture.get()
  c.filter(s.BLUR, 1)
  c.resize(scene.width, 0)
  scene.blendMode(mode)
  scene.image(c, 0, 0)
  scene.pop()
}

function wobblyCircle(scene, x, y, r){
  const n = scene.random(5, 8)
  scene.beginShape()
  scene.vertex(x+r, y)
  for(let i=0;i<n;i++){
    const rr = r + scene.random(-r/3, r/3)
    const p = x + rr*Math.cos(i*2*scene.PI/n)
    const q = y + rr*Math.sin(i*2*scene.PI/n)    
    scene.curveVertex(p, q)
  }
  scene.vertex(x+r, y)
  scene.endShape(scene.CLOSE)
}

function olderHD(s, scene, density, hd, mode, alpha, dark) {
  scene.push()
  let texture = s.createGraphics(scene.width, scene.height)
  texture.strokeWeight(1.0 / hd)
  let coords = []
  for (let i = 0; i < texture.width; i++) {
    for (let j = 0; j < texture.height; j++) {
      if (s.random() < density) {
        coords.push([i, j])
      }
    }
  }
  const shuffledCoords = shuffle(coords)
  for (let coord of shuffledCoords) {
    let [i, j] = coord
    const grain = 50 + 100 * s.noise(i, j)
    const alphaR = alpha/2+s.noise(i, j)*alpha/2
    let fill
    if(dark){
      fill = s.color(grain, grain, grain, alphaR)
    } else {
      fill = s.color(100 + grain, 100 + grain, grain, alphaR)
    }
    texture.fill(fill)
    texture.stroke(fill)
    //texture.circle(i, j, hd * s.random())
    wobblyCircle(texture, i, j, hd*s.random())
  }
  let c = texture.get()
  c.filter(s.BLUR, 1)
  c.resize(scene.width, 0)
  scene.blendMode(mode)
  scene.image(c, 0, 0)
  scene.pop()
}

function ctxGranulateChannels(s, amount, skipWhite) {
  // Based on a post by GorillaSun and meezwhite on grain
  // https://www.fxhash.xyz/article/all-about-that-grain
  let ctx = s.drawingContext
  const d = s.pixelDensity()
  let imageData = ctx.getImageData(0, 0, s.width * d, s.height * d)
  const pixels = imageData.data;
  let [r, g, b, a] = amount
  for (let i = 0; i < pixels.length; i += 4) {
    //if(skipWhite && s.pixels[i] > 250 && s.pixels[i+1] > 250 && s.pixels[i+2] > 250){
    //continue
    //}
    pixels[i] = pixels[i] + s.random(-r, r);
    pixels[i + 1] = pixels[i + 1] + s.random(-g, g);
    pixels[i + 2] = pixels[i + 2] + s.random(-b, b);
    pixels[i + 3] = pixels[i + 3] + s.random(-a, a);
  }
  ctx.putImageData(imageData, 0, 0);
}