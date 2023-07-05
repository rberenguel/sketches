#version 300 es

// position information that is used with gl_Position
in vec3 aPosition;

// texture coordinates
in vec2 aTexCoord;
in vec4 aVertexColor;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

// the varying variable will pass the texture coordinate to our fragment shader
out vec2 vTexCoord;
out vec4 vVertexColor;


void main() {
    // Apply the camera transform
    vec4 viewModelPosition =
      uModelViewMatrix *
      vec4(aPosition, 1.0);

    // Tell WebGL where the vertex goes
    gl_Position =
      uProjectionMatrix *
      viewModelPosition;  

    // Pass along data to the fragment shader
    vTexCoord = aTexCoord;
    vVertexColor = aVertexColor;
}

