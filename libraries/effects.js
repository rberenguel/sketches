export { granulateChannels, oldieHD, ctxGranulateChannels }

function granulateChannels(s, amount, skipWhite) {
	// Based on a post by GorillaSun and meezwhite on grain
	// https://www.fxhash.xyz/article/all-about-that-grain
    s.loadPixels();
	let [r, g, b, a] = amount
    const d = s.pixelDensity();
    const pixelsCount = 4 * (s.width * d) * (s.height * d);
    for (let i = 0; i < pixelsCount; i += 4) {
		//if(skipWhite && s.pixels[i] > 250 && s.pixels[i+1] > 250 && s.pixels[i+2] > 250){
			//continue
		//}
    s.pixels[i] = s.pixels[i] + s.random(-r, r);
    s.pixels[i+1] = s.pixels[i+1] + s.random(-g, g);
    s.pixels[i+2] = s.pixels[i+2] + s.random(-b, b);
    s.pixels[i+3] = s.pixels[i+3] + s.random(-a, a);			
    }
    s.updatePixels();
}

function shuffle(array) {
  // From https://stackoverflow.com/a/2450976
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

function oldieHD(s, scene, density, hd, mode) {
  scene.push()
  let texture = s.createGraphics(scene.width, scene.height)
  texture.strokeWeight(1.0/hd)
  let coords = []
  for(let i=0;i<texture.width;i++){
    for(let j=0;j<texture.height;j++){
      if(s.random()<density){
        coords.push([i, j])
      }
    }
  }
  const shuffledCoords = shuffle(coords)
  for(let coord of shuffledCoords){
    let [i, j] = coord
    const grain = 50+100*s.noise(i, j)
    const fill = s.color(100+grain, 100+grain, grain, grain/3)
    texture.fill(fill)
    texture.stroke(fill)
    texture.circle(i, j, hd*s.random())//s.random()*Math.sqrt(hd)/2)
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
    let imageData = ctx.getImageData(0, 0, s.width*d, s.height*d)
	const pixels = imageData.data;
	let [r, g, b, a] = amount
    for (let i = 0; i < pixels.length; i += 4) {
		//if(skipWhite && s.pixels[i] > 250 && s.pixels[i+1] > 250 && s.pixels[i+2] > 250){
			//continue
		//}
    pixels[i] = pixels[i] + s.random(-r, r);
    pixels[i+1] = pixels[i+1] + s.random(-g, g);
    pixels[i+2] = pixels[i+2] + s.random(-b, b);
    pixels[i+3] = pixels[i+3] + s.random(-a, a);			
    }
    ctx.putImageData(imageData, 0, 0);
}