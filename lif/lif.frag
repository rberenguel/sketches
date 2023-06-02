#ifdef GL_ES
precision highp float;
#endif


varying vec2 vTexCoord;
uniform sampler2D u_canvas;
uniform float dx;
uniform float dy;


int alive(vec2 coord) {
  vec4 c = texture2D(u_canvas, vec2(coord.x, 1.0-coord.y));
  return (c.r < 0.3 && c.a > 0.5) ? 1 : 0;
}


void main() {
  vec2 coord = vTexCoord; // Equivalent to gl_FragCoord.xy/u_resolution.xy;

  int nbd =
    alive(coord+vec2(-dx, -dy)) +
    alive(coord+vec2(-dx,  0.)) +
    alive(coord+vec2(-dx,  dy)) +
    alive(coord+vec2(0.,  -dy)) +
    alive(coord+vec2(0.,  dy)) +
    alive(coord+vec2(dx,  -dy)) +
    alive(coord+vec2(dx,  0.)) +
    alive(coord+vec2(dx,  dy));
  bool nowAlive = false;
  if(alive(coord) == 1){
    if(nbd == 3 || nbd == 2){
      nowAlive = true;

    }
  } else {
    if(nbd==3){
      nowAlive = true;
    }
  }
  vec4 col = texture2D(u_canvas, vec2(coord.x, 1.0 - coord.y));
  vec4 gol = nowAlive ?  vec4(.2, 0., 0., 1.) : vec4(0.9, .9, 0.9, 1.);
  gl_FragColor = gol;
}
