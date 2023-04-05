export {
  glassTexture
}

import {
  darken,
  shuffle
} from '../libraries/misc.js'


function glassTexture(s, scene, seed, hd) {
  arcBasedTexture(s, scene, seed, 0.008, 12 * hd, scene.SCREEN, "arc", false, hd) // bright
  arcBasedTexture(s, scene, seed, 0.009, 11 * hd, scene.HARD_LIGHT, "arc_filled", true, hd)
  arcBasedTexture(s, scene, seed, 0.008, 12 * hd, scene.SOFT_LIGHT, "arc", false, hd)
  arcBasedTexture(s, scene, seed, 0.02, 8 * hd, s.MULTIPLY, "arc", false, hd)
  backlight(s, scene, scene.DODGE, 1.0, "#AAA", "#333")
}


function arcBasedTexture(s, scene, seed, density, size, mode, style, light, hd) {
  scene.randomSeed(seed)
  scene.push()
  const PI = scene.PI
  let texture = s.createGraphics(scene.width, scene.height)
  texture.strokeWeight(1.0 / hd)
  let coords = []
  let drawer, fill
  if (style.startsWith("arc")) {
    drawer = (i, j, factor, r, start, end) => texture.arc(i, j, factor * r, r, start, end)
  }
  if (style.startsWith("circle")) {
    drawer = (i, j, factor, r, start, end) => texture.circle(i, j, r)
  }
  if (style.endsWith("filled")) {
    fill = true
  } else {
    fill = false
  }
  for (let i = 0; i < texture.width; i++) {
    for (let j = 0; j < texture.height; j++) {
      if (scene.random() < density) {
        coords.push([i, j])
      }
    }
  }
  const shuffledCoords = shuffle(coords) // might need seeding
  for (let coord of shuffledCoords) {
    let [i, j] = coord
    const grain = 50 + 100 * scene.noise(i, j)
    const color = scene.color(30 + grain, 30 + grain, 30 + grain, grain)
    if (fill) {
      texture.fill(color)
    } else {
      texture.noFill()
    }
    texture.stroke(color)
    const r = size * scene.random()
    const factor = scene.random(1.2, 4)
    const start = scene.random(0, 2 * PI)
    const end = scene.random(start + PI - PI / 15, start - PI - PI / 15)
    drawer(i, j, factor, r, start, end)
  }
  // This backlight is what gives the final nice touch,
  // for some reason
  if (light) backlight(s, texture, scene.LIGHTEST, 0.9, "#222", "#222")
  let c = texture.get()
  c.resize(scene.width, 0)
  c.filter(scene.BLUR, 1)
  scene.blendMode(mode)
  scene.image(c, 0, 0)
  scene.pop()
}

function backlight(s, scene, mode, intensity, start, stop) {
  // Add a textured light layer. For some reason set in black
  // gives a terrific glass feel (this is overlaid on texture)
  scene.push()
  let blendMode = scene.HARD_LIGHT
  if (mode !== undefined) {
    blendMode = mode
  }
  let layer = s.createGraphics(scene.width, scene.height)
  let ctx = layer.drawingContext
  const gradient = ctx.createLinearGradient(0, 0, scene.width, scene.height)
  const bright = scene.color(start)
  const dark = scene.color(stop)
  const adjustedBright = darken(scene, bright, intensity)
  const adjustedDark = darken(scene, dark, intensity)
  gradient.addColorStop(0, adjustedBright);
  gradient.addColorStop(1, adjustedDark);
  ctx.fillStyle = gradient;
  layer.rectMode(scene.CORNERS)
  layer.rect(0, 0, scene.width, scene.height)
  let c = layer.get()
  c.resize(scene.width, 0)
  scene.blendMode(blendMode)
  scene.image(c, 0, 0)
  scene.pop()
}