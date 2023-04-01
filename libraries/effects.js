export { granulateChannels, granulateChannelsHD, ctxGranulateChannels }

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

function granulateChannelsHD(s, scene, density, hd, mode) {
  let texture = s.createGraphics(s.width, s.height)
  //texture.noStroke()
  texture.noStroke()
  for(let i=0;i<texture.width;i++){
    for(let j=0;j<texture.height;j++){
      if(s.random()<density){
        const fill = s.color(150+100*s.noise(i, j), 100*s.noise(i, j)+10*hd)
        texture.fill(fill)
        texture.circle(i, j, 3*hd*hd)
      }
    }
  }
  let c = texture.get()
  c.resize(scene.width, 0)
  scene.blendMode(mode)
  scene.image(c, 0, 0)
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
