#version 300 es

// position information that is used with gl_Position
in vec3 aPosition;

// texture coordinates
in vec2 aTexCoord;

// the varying variable will pass the texture coordinate to our fragment shader
out vec2 vTexCoord;

void main() {
  // assign attribute to varying, so it can be used in the fragment
  vTexCoord = aTexCoord;

  vec4 positionVec4 = vec4(aPosition, 1.0);
  positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
  gl_Position = positionVec4;

}
