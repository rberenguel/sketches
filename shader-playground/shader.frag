precision highp float;

varying vec2 vTexCoord;
uniform vec2 u_resolution;

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
    return length(trf()*p)-r;
}

float sdfRoundedBox( in vec2 pp, in vec2 bb, in vec4 r )
{
  vec2 p = trf()*pp;
  vec2 b = trf()*bb;
    r.xy = (p.x>0.0)?r.xy : r.zw;
    r.x  = (p.y>0.0)?r.x  : r.y;
    vec2 q = abs(p)-b+r.x;
    return min(max(q.x,q.y),0.0) + length(max(q,0.0)) - r.x;
  }

float sdf(vec2 uv){
  vec2 p = vec2(0.5, 0.5);
  float c = sdfCircle(uv - p, 0.1);
  float r = sdfRoundedBox(uv - p, vec2(0.2,0.1), vec4(0.0,1.0,2.0,3.0));
  return r;
}

void main() {
  vec2 uv = gl_FragCoord.xy/u_resolution;
  float s = sdf(uv);
  vec3 c1 = hsb2rgb(vec3(0, 0.1, 0.1));
  vec3 c2 = hsb2rgb(vec3(0.9, 0.7, 0.5));
  vec3 col = (s>0.0) ? c1 : c2;
  gl_FragColor = vec4(mix( col, vec3(1.0), 1.0-smoothstep(0.0,0.001,abs(s)) ), 1.0);
}

/*void foo( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 p = (2.0*fragCoord-u_resolution.xy)/u_resolution.y;
    //vec2 m = (2.0*iMouse.xy-u_resolution.xy)/u_resolution.y;

	float d = sdCircle(p,0.5);
    
	// coloring
    vec3 col = (d>0.0) ? vec3(0.9,0.6,0.3) : vec3(0.65,0.85,1.0);
    col *= 1.0 - exp(-6.0*abs(d));
	col *= 0.8 + 0.2*cos(150.0*d);
	col = mix( col, vec3(1.0), 1.0-smoothstep(0.0,0.01,abs(d)) );

    if( iMouse.z>0.001 )
    {
    d = sdCircle(m,0.5);
    col = mix(col, vec3(1.0,1.0,0.0), 1.0-smoothstep(0.0, 0.005, abs(length(p-m)-abs(d))-0.0025));
    col = mix(col, vec3(1.0,1.0,0.0), 1.0-smoothstep(0.0, 0.005, length(p-m)-0.015));
    }

	fragColor = vec4(col,1.0);
}
*/