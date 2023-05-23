precision highp float;

varying vec2 vTexCoord;
uniform vec2 u_resolution;

#define PI 3.14159265359

vec3 hsb2rgb(vec3 c)
{
    vec3 rgb = clamp(abs(mod(c.x * 6. + vec3(0. , 4., 2.), 6.) - 3.) - 1., 0., 1. );
    rgb = rgb * rgb * (3. - 2. * rgb);
    return c.z * mix(vec3(1.), rgb, c.y);
}

vec2 trf(){
  float factor = u_resolution.x/u_resolution.y;
  vec2 trans = vec2(factor, 1.0);
  return trans;
}


float sdfCircle( in vec2 p, in float r ) 
{
    return length(p)-r;
}

float sdfBox( in vec2 p, in vec2 b )
{
    vec2 d = abs(p)-b;
    return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
}

mat2 rot(float a){
    return mat2(cos(a),-sin(a),
                sin(a),cos(a));
				}

float sdf(vec2 uv){
  uv -= 0.05; // offset origin to corner of square
  float c = sdfCircle(uv, 0.1);
  float r = sdfBox(uv-vec2(0.05,0.05), vec2(0.1,0.1));
  float r2 = sdfBox(uv-vec2(0.07,0.07), vec2(0.05,0.05));
  return min(max(c, r), r2);
}

float frame(vec2 uv) {
  float outer = sdfBox(uv, vec2(0.23,0.23));
  float inner = sdfBox(uv, vec2(0.21,0.21));
  return max(-inner, outer);  
}

void main() {
  vec2 uv = gl_FragCoord.xy/u_resolution.xy;
  uv -= 0.5;
  uv.x *= u_resolution.x/u_resolution.y;
  float d = 0.02;
  float s1 = sdf(uv-d);
  float s2 = sdf(rot(PI/2.0) * uv + rot(-PI/2.0)*vec2(-d, d));
  float s3 = sdf(rot(PI) * uv + rot(-PI) * vec2(d, d));  
  float s4 = sdf(rot(3.0*PI/2.0) * uv + rot(-3.0*PI/2.0)*vec2(d, -d));  
  float c0 = sdfCircle(uv, 0.01);
  float frm = frame(uv);
  float s = min(s1, min(s2, min(s3, s4)));  
  vec3 c1 = hsb2rgb(vec3(0, 0.1, 0.1));
  vec3 c2 = hsb2rgb(vec3(0.9, 0.7, 0.5));
  vec3 c3 = hsb2rgb(vec3(0.0, 0.7, 0.5));  
  vec3 col = frm < 0.0 ? c3 : ((s>0.0) ? c1 : c2);
  gl_FragColor = vec4(mix( col, vec3(1.0), 1.0-smoothstep(0.0,0.001,abs(1.0)) ), 1.0);
}
