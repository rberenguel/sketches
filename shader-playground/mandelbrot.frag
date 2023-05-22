precision highp float;

varying vec2 vTexCoord;

vec2 view = vec2(-0.75, 0.0);

vec2 squareImaginary(vec2 number){
	return vec2(
		number.x*number.x-number.y*number.y,
		2.0*number.x*number.y
	);
}

vec2 cMul(vec2 a, vec2 b){
  return vec2(a.x*b.x-a.y*b.y, a.x*b.y+a.y*b.x);
}

float tanh(float x){
  return (exp(2.0*x)-1.0)/(exp(2.0*x)+1.0);
}

vec3 mandelbrot(vec2 coord){
	vec2 z = vec2(0.0,0.0);
  vec2 dz = vec2(0.0,0.0);
  float de = 0.0;
  int iterates = 0;
	for(int i=0;i<10000;i++){
    dz = 2.0*cMul(z, dz) + vec2(1.0, 0);    
		z = squareImaginary(z) + coord;
    de = 2.0 * length(z) * log(length(z))/length(dz);
		if(length(z)>1000.0) {
      iterates = i;
      break;
    }
	}
  float me = clamp( pow(90.0*de,0.15), 0.0, 1.0 );
  float ee = clamp(25.0*float(iterates)*de, 0.0, 1.0 );
	return vec3(ee, ee, ee);
}

float centersMandelbrot(vec2 c){
	vec2 z = vec2(0.0,0.0);
  vec2 dz = vec2(0.0,0.0);
  float de = 0.0;
	for(int i=0;i<50;i++){
    dz = 2.0*cMul(z, dz) + vec2(1.0, 0);        
		z = squareImaginary(z) + c;    
    if(length(z) > 4.0) return 255.0;
		if(length(z/dz)<0.001) return 0.0;//tanh(de);
	}
	return 255.0;  
}

void main() {
  vec2 UV = vTexCoord;
  vec2 uv = ((UV - vec2(0.5)) * vec2(1.0, 1.0)) / exp(- 1.1) + view;
  vec3 s = mandelbrot(uv);
  gl_FragColor = vec4(s, 1.0);
}