#version 300 es

#ifdef GL_ES
precision highp float;
#endif

in vec2 vTexCoord;
in vec4 vVertexColor;
out vec4 ocol;
uniform vec2 u_resolution;
uniform bool u_skip;

void main() {
  vec2 uv = vTexCoord; // Equivalent to gl_FragCoord.xy/u_resolution.xy;
  //uv -= 0.5;
  //uv.x *= u_resolution.x/u_resolution.y;
  vec4 recolor = vVertexColor;
  recolor = vec4(0.1, 0.1, 0.1, 1.);
  recolor.a = 1.0;
  if(u_skip){
    ocol = recolor;
    return;
  }
  float g = 0.7+0.5*sin(5.*uv.y);
  float b = 0.7+0.5*sin(3.*uv.y);
  vec3 grad = vec3(0.5, g, b);
  float f = smoothstep(0., 4., abs(8.-uv.y));
  ocol = vec4(grad*f, 1.0);
  /*float f1 = 0.5-0.1*abs(sin(16.*abs(uv.x))) ;
  float f2 = 0.5+0.1*abs(sin(16.*abs(uv.x))) ;
  if(uv.x > 0.3 && uv.x < 0.6 && abs(uv.y) > f1 && abs(uv.y) < f2 && abs(fract(17.*sin(uv.x))) > 0.9){
    ocol = vec4(.001, .001, .001, .9);
  }*/
}
