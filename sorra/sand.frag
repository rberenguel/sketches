#version 300 es
precision highp float;

in vec2 vTexCoord;

uniform sampler2D u_canvas;
uniform vec4 u_sand_col;
uniform vec4 u_empty_col;
uniform float dx;
uniform float dy;
uniform float u_time;

out vec4 frag_color;

// Helper functions
bool is_close(vec4 a, vec4 b) { return all(lessThan(abs(a - b), vec4(1e-4))); }
bool is_sand(vec4 c) { return is_close(c, u_sand_col); }
float random(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123); }

// *** CRITICAL FIX ***
// Reads a pixel from the canvas, flipping the Y-coordinate to match p5.js's system.
vec4 read_pixel(vec2 coord) {
    return texture(u_canvas, vec2(coord.x, 1.0 - coord.y));
}

void main() {
    vec2 me_coord = vTexCoord;
    vec4 me = read_pixel(me_coord);
    vec4 new_color = me;

    // --- Main Logic ---
    // With the Y-coordinate flipped, the visual directions are now intuitive:
    // - "Up" (towards top of screen) is -dy
    // - "Down" (towards bottom of screen) is +dy

    // Rule 1: If I am currently empty, check if sand should fall into me.
    if (!is_sand(me)) {
        // a) From directly ABOVE? (Visually above is -dy)
        vec4 above = read_pixel(me_coord + vec2(0.0, -dy));
        if (is_sand(above)) {
            new_color = u_sand_col;
        }
        // b) From a diagonal? (Only if the sand was blocked from falling straight down)
        else {
            vec4 above_left = read_pixel(me_coord + vec2(-dx, -dy));
            bool slide_from_left = is_sand(above_left) && is_sand(read_pixel(me_coord + vec2(-dx, 0.0)));
            
            vec4 above_right = read_pixel(me_coord + vec2(dx, -dy));
            bool slide_from_right = is_sand(above_right) && is_sand(read_pixel(me_coord + vec2(dx, 0.0)));

            float r = random(vTexCoord + u_time);
            if (r < 0.5) {
                if (slide_from_left) new_color = u_sand_col;
                else if (slide_from_right) new_color = u_sand_col;
            } else {
                if (slide_from_right) new_color = u_sand_col;
                else if (slide_from_left) new_color = u_sand_col;
            }
        }
    }
    // Rule 2: If I am sand, check if I should fall and make myself empty.
    else { // is_sand(me)
        // a) Can I fall straight DOWN? (Visually down is +dy)
        // Boundary check: In our flipped system, the bottom is at y=1.0.
        if (me_coord.y < 1.0 - dy) {
             vec4 below = read_pixel(me_coord + vec2(0.0, dy));
            if (!is_sand(below)) {
                new_color = u_empty_col;
            }
            // b) If not, can I slide to a diagonal?
            else {
                vec4 below_left = read_pixel(me_coord + vec2(-dx, dy));
                bool can_slide_left = !is_sand(below_left);

                vec4 below_right = read_pixel(me_coord + vec2(dx, dy));
                bool can_slide_right = !is_sand(below_right);

                float r = random(vTexCoord + u_time);
                if (r < 0.5) {
                    if (can_slide_left) new_color = u_empty_col;
                    else if (can_slide_right) new_color = u_empty_col;
                } else {
                    if (can_slide_right) new_color = u_empty_col;
                    else if (can_slide_left) new_color = u_empty_col;
                }
            }
        }
    }

    frag_color = new_color;
}
