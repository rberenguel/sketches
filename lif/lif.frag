#version 300 es

#ifdef GL_ES
precision highp float;
#endif


in vec2 vTexCoord;
uniform sampler2D u_canvas;
uniform vec4 u_lcol;
uniform vec4 u_dcol;
uniform float dx;
uniform float dy;

out vec4 life;

bool close(float a, float b){
  return abs(a - b) < 1e-5;
}

bool close(vec4 a, vec4 b){
  return close(a.r, b.r) && close(a.g, b.g) && close(a.b, b.b) && close(a.a, b.a);
}


int alive(vec2 coord) {
  // Textures in GLSL and canvases in p5js are reversed
  vec4 c = texture(u_canvas, vec2(coord.x, 1.0-coord.y));
  return close(c, u_lcol) ? 1 : 0;
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
  vec4 gol = nowAlive ? u_lcol : u_dcol ;
  life = gol;
}
