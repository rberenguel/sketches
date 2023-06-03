#version 300 es

#ifdef GL_ES
precision highp float;
#endif


in vec2 vTexCoord;
uniform sampler2D u_canvas;
uniform float dx;
uniform float dy;
uniform sampler2D u_this;
uniform bool blend;

out vec4 color;

vec4 smoo(vec2 around[9]) {
  vec2 coord = 0.27*around[0];
  vec4 col = texture(u_canvas, vec2(coord.x, 1.0-coord.y));
  for(int i = 1; i<9;i++){
    vec2 coord = around[i];
    col += 0.07 * texture(u_canvas, vec2(coord.x, 1.0-coord.y));
  }
  return clamp(col/9.0, 0.0, 1.0);
}


void main() {
  vec2 coord = vTexCoord; // Equivalent to gl_FragCoord.xy/u_resolution.xy;

  vec2 around[9] =
    vec2[9](coord, coord+vec2(-dx, -dy),
        coord+vec2(-dx,  0.),
        coord+vec2(-dx,  dy),
        coord+vec2(0.,  -dy),
        coord+vec2(0.,  dy),
        coord+vec2(dx,  -dy),
        coord+vec2(dx,  0.),
        coord+vec2(dx,  dy));
  if(blend){
    vec4 previous = texture(u_this, vec2(coord.x, 1.0-coord.y));
    color = mix(previous, smoo(around), 0.3);
  } else {
    color = smoo(around);
  }
}
