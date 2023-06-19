#version 300 es

#ifdef GL_ES
precision highp float;
#endif

in vec2 vTexCoord;
out vec4 ocol;
uniform vec2 u_resolution;
uniform vec4 u_params;
uniform float u_p[32];
uniform float u_shifts[8];
uniform float u_kind;
uniform bool u_quat;
uniform sampler2D u_dirt;
uniform sampler2D u_concrete;
#define PI 3.14159265359

vec3 rgb2hsb( in vec3 c ){
  // From The Book of Shaders
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz),
      vec4(c.gb, K.xy),
      step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r),
      vec4(c.r, p.yzx),
      step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)),
      d / (q.x + e),
      q.x);
}

vec3 hsb2rgb(vec3 c)
{
  vec3 rgb = clamp(abs(mod(c.x * 6. + vec3(0. , 4., 2.), 6.) - 3.) - 1., 0., 1. );
  rgb = rgb * rgb * (3. - 2. * rgb);
  return c.z * mix(vec3(1.), rgb, c.y);
}

// 0=asin(πnx)sin(πmy)+bsin(πmx)sin(πny)
float chladni( in vec2 p, in float m, in float n, in float a, in float b, float k){
  float fa1 = a*sin(PI*n*p.x)*sin(PI*m*p.y);
  float fb1 = b*sin(PI*m*p.x)*sin(PI*n*p.y);
  float chl1 =fa1+fb1;
  float fa2 = a*cos(PI*n*p.x)*cos(PI*m*p.y);
  float fb2 = b*cos(PI*m*p.x)*cos(PI*n*p.y);
  float chl2 =fa2+fb2;
  if(k<=1.0){
    return (1.0-k)*(fa1+fb1)+k*(fa2+fb2);
  }
  float fa3 = a*sin(PI*n*p.x)*sin(PI*(atan(p.y/p.x)))*sin(PI*m*p.y);
  float fb3 = b*sin(PI*m*p.x)*sin(PI*(atan(p.y/p.x)))*sin(PI*n*p.y);
  float chl3 =fa3+fb3;
  if(k<=2.0){
    return (2.0-k)*(fa2+fb2)+(k-1.0)*(fa3+fb3);
  }
  float fa4 = a*sin(PI*n*p.x)*cos(PI*(atan(p.y/p.x)))*sin(PI*m*p.y);
  float fb4 = b*sin(PI*m*p.x)*cos(PI*(atan(p.y/p.x)))*sin(PI*n*p.y);
  float chl4 =fa4+fb4;
  if(k<=3.0){
    return (3.0-k)*(fa3+fb3)+(k-2.0)*(fa4+fb4);
  }
  if(k<=4.0){
    return (4.0-k)*(fa4+fb4)+(k-3.0)*(fa1+fb1);
  }
}

mat2 rot(float a){
  return mat2(cos(a),-sin(a),
      sin(a),cos(a));
}

void main() {
  vec2 uv = vTexCoord; // Equivalent to gl_FragCoord.xy/u_resolution.xy;
  uv -= 0.5;
  uv.x *= u_resolution.x/u_resolution.y;
  const float rad = 0.45;
  const float delta = 0.02;
  float ax = abs(uv.x);
  float ay = abs(uv.y);
  float f = texture(u_concrete, vTexCoord).x;
  vec3 beige1 = hsb2rgb(vec3(0.111, 0.6*f, 0.8*(0.7+0.3*f)));
  vec3 beige2 = hsb2rgb(vec3(0.111, 0.6*f, 0.8*(0.4+0.6*f)));
  if(ax<rad+delta && ay<rad+delta){
    float sx = smoothstep(rad, rad+delta, ax);
    float sy = smoothstep(rad, rad+delta, ay);
    if(length(uv)>(rad+delta*0.8)*sqrt(2.0)){
      return;
    }
    if((ax>rad || ay>rad) && f>0.5+0.5*(1.0-sx)*(1.0-sy)){//
      return;
    }
    ocol = vec4(beige1, 1.);
  }
  if(ax>rad){
    return;
  }
  if(ay>rad){
    return;
  }
  const float ri = 0.002;
  const float rid = 0.001;
  if(u_quat && (ax< ri || ay < ri)){
    float sx = smoothstep(ri-rid, ri, ax);
    float sy = smoothstep(ri-rid, ri, ay);
    if((ax>ri-rid || ay>ri-rid) && f>0.1+0.5*(1.0-sx)*(1.0-sy)){//
      ocol = vec4(beige2, 1.0);
      return;
    }
    ocol = vec4(beige1, 1.);   
    return;
  }
  float m = u_params.z;
  float n = u_params.w;
  float a = u_params.x;
  float b = u_params.y;
  // Shift upper-right quadrant, if quarted
  if(u_quat && uv.x > 0.0 && uv.y > 0.0){
    uv.x+=15.0*u_shifts[0];
    uv.y+=15.0*u_shifts[1];
  }
  // Shift upper-left quadrant, if quarted
  if(u_quat && uv.x < 0.0 && uv.y > 0.0){
    uv.x+=15.0*u_shifts[2];
    uv.y+=15.0*u_shifts[3];
  }
  // Shift lower-right quadrant, if quarted
  if(u_quat && uv.x > 0.0 && uv.y < 0.0){
    uv.x+=15.0*u_shifts[4];
    uv.y+=15.0*u_shifts[5];
  }
  // Shift lower-left quadrant, if quarted
  if(u_quat && uv.x < 0.0 && uv.y < 0.0){
    uv.x+=15.0*u_shifts[6];
    uv.y+=15.0*u_shifts[7];
  }
  float c = chladni(uv, m, n, a, b, 0.1*float(u_kind));
  float g = abs(c);
  float r[4] = float[4](-0.0, 1.2, 0.7, 0.2);
  vec3 col = vec3(u_p[0], u_p[1], u_p[2]);
  for(int i=1;i<4;i++){
    if(g>r[i]){
      if(g>1.03*r[i]){
        col = vec3(u_p[3*i+0], u_p[3*i+1], u_p[3*i+2]);
      } else {
        if(texture(u_concrete, vTexCoord).x > 0.5){
          col = vec3(u_p[3*i+0], u_p[3*i+1], u_p[3*i+2]);
        } else {
          col = vec3(u_p[3*(i+1)+0], u_p[3*(i+1)+1], u_p[3*(i+1)+2]);
        }
      }
      break;
    }
  }
  vec3 chsb = rgb2hsb(col);
  chsb.b *= (0.85+0.15*texture(u_dirt, vTexCoord).x)*(0.7+0.3*texture(u_concrete, vTexCoord).x);
  ocol = vec4(hsb2rgb(chsb), 1.0);
  return;
}
