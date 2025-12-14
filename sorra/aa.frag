#version 300 es
precision highp float;

in vec2 vTexCoord;

uniform sampler2D u_canvas;
uniform bool u_use_smoothing;
uniform float dx;
uniform float dy;

out vec4 frag_color;

// A standard 3x3 Gaussian blur function to smooth the pixels.
vec4 smoo() {
    vec4 result = vec4(0.0);
    // Gaussian kernel weights:
    // 1 2 1
    // 2 4 2
    // 1 2 1
    // Divided by the sum (16)
    result += texture(u_canvas, vTexCoord + vec2(-dx, -dy)) * 1.0;
    result += texture(u_canvas, vTexCoord + vec2(0.0, -dy)) * 2.0;
    result += texture(u_canvas, vTexCoord + vec2( dx, -dy)) * 1.0;
    result += texture(u_canvas, vTexCoord + vec2(-dx, 0.0)) * 2.0;
    result += texture(u_canvas, vTexCoord + vec2(0.0, 0.0)) * 4.0;
    result += texture(u_canvas, vTexCoord + vec2( dx, 0.0)) * 2.0;
    result += texture(u_canvas, vTexCoord + vec2(-dx,  dy)) * 1.0;
    result += texture(u_canvas, vTexCoord + vec2(0.0,  dy)) * 2.0;
    result += texture(u_canvas, vTexCoord + vec2( dx,  dy)) * 1.0;
    
    return result / 16.0;
}

void main() {
    // If smoothing is enabled, apply the blur.
    if (u_use_smoothing) {
        frag_color = smoo();
    } 
    // Otherwise, just pass the original pixel color through,
    // resulting in no anti-aliasing.
    else {
        frag_color = texture(u_canvas, vTexCoord);
    }
}
