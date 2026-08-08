// WebGL anisotropic Gaussian splat renderer — triangle quads
// Each splat is a 2-triangle billboard; fragment shader computes
// the rotated Gaussian in world space. No point-size limits.

export { SplatRenderer };

const VERT = `
attribute vec2 a_position;
attribute vec4 a_color;
attribute vec3 a_params;
attribute vec2 a_corner;

varying vec4 v_color;
varying vec2 v_worldPos;
varying vec2 v_center;
varying float v_angle;
varying vec2 v_scale;

uniform vec2 u_resolution;
uniform float u_coverage;

void main() {
  v_center = a_position;
  v_color = a_color;
  v_angle = a_params.x;
  v_scale = a_params.yz;

  float maxS = max(v_scale.x, v_scale.y);
  vec2 world = a_position + a_corner * maxS * u_coverage;

  v_worldPos = world;
  vec2 clip = (world / u_resolution) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}
`;

const FRAG = `
precision mediump float;

varying vec4 v_color;
varying vec2 v_worldPos;
varying vec2 v_center;
varying float v_angle;
varying vec2 v_scale;

uniform float u_hardness;

void main() {
  vec2 p = v_worldPos - v_center;
  float c = cos(v_angle);
  float s = sin(v_angle);

  // rotate into splat local frame
  vec2 local;
  local.x = c * p.x + s * p.y;
  local.y = -s * p.x + c * p.y;

  float d = (local.x * local.x) / (v_scale.x * v_scale.x)
          + (local.y * local.y) / (v_scale.y * v_scale.y);

  float alpha = exp(-u_hardness * d);
  if (alpha < 0.003) discard;

  gl_FragColor = vec4(v_color.rgb, v_color.a * alpha);
}
`;

// Two triangles covering a unit square [-1,1]²
const CORNERS = new Float32Array([
  -1, -1,   1, -1,   -1,  1,   // tri 1
   1, -1,  -1,  1,    1,  1,   // tri 2
]);

class SplatRenderer {
  constructor(canvas) {
    this.gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
      antialias: false,
    });
    const gl = this.gl;
    if (!gl) throw new Error('WebGL not available');

    const vs = this._compile(gl.VERTEX_SHADER, VERT);
    const fs = this._compile(gl.FRAGMENT_SHADER, FRAG);
    this.prog = gl.createProgram();
    gl.attachShader(this.prog, vs);
    gl.attachShader(this.prog, fs);
    gl.linkProgram(this.prog);
    if (!gl.getProgramParameter(this.prog, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(this.prog));
    }

    this.loc = {
      aPos: gl.getAttribLocation(this.prog, 'a_position'),
      aCol: gl.getAttribLocation(this.prog, 'a_color'),
      aPar: gl.getAttribLocation(this.prog, 'a_params'),
      aCor: gl.getAttribLocation(this.prog, 'a_corner'),
      uRes: gl.getUniformLocation(this.prog, 'u_resolution'),
      uHard: gl.getUniformLocation(this.prog, 'u_hardness'),
      uCov: gl.getUniformLocation(this.prog, 'u_coverage'),
    };

    // Per-splat buffers
    this.buf = {
      pos: gl.createBuffer(),
      col: gl.createBuffer(),
      par: gl.createBuffer(),
    };
    this.cornerBuf = gl.createBuffer();

    gl.enable(gl.BLEND);
    // Standard over-operator: premultiplied-like accumulation.
    // RGB blends by alpha; Alpha accumulates as A_src + A_dst*(1-A_src).
    gl.blendFuncSeparate(
      gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA,
      gl.ONE,       gl.ONE_MINUS_SRC_ALPHA
    );
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
  }

  _compile(type, src) {
    const gl = this.gl;
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(sh));
    }
    return sh;
  }

  setSplats(splats) {
    const gl = this.gl;
    const n = splats.length;
    const verts = n * 6; // 6 vertices per splat (2 triangles)

    const pos = new Float32Array(verts * 2);
    const col = new Float32Array(verts * 4);
    const par = new Float32Array(verts * 3);
    const cor = new Float32Array(verts * 2);

    for (let i = 0; i < n; i++) {
      const sp = splats[i];
      const base = i * 6;
      for (let v = 0; v < 6; v++) {
        const k = base + v;
        pos[k * 2] = sp.x;
        pos[k * 2 + 1] = sp.y;
        col[k * 4] = sp.r;
        col[k * 4 + 1] = sp.g;
        col[k * 4 + 2] = sp.b;
        col[k * 4 + 3] = sp.a;
        par[k * 3] = sp.angle;
        par[k * 3 + 1] = sp.sx;
        par[k * 3 + 2] = sp.sy;
        cor[k * 2] = CORNERS[v * 2];
        cor[k * 2 + 1] = CORNERS[v * 2 + 1];
      }
    }

    this._upload(this.buf.pos, this.loc.aPos, pos, 2);
    this._upload(this.buf.col, this.loc.aCol, col, 4);
    this._upload(this.buf.par, this.loc.aPar, par, 3);
    this._upload(this.cornerBuf, this.loc.aCor, cor, 2);

    this.count = verts;
  }

  _upload(buf, loc, data, comps) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, comps, gl.FLOAT, false, 0, 0);
  }

  render(width, height, hardness = 0.5, coverage = 3.0) {
    const gl = this.gl;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.prog);
    gl.uniform2f(this.loc.uRes, width, height);
    gl.uniform1f(this.loc.uHard, hardness);
    gl.uniform1f(this.loc.uCov, coverage);

    gl.drawArrays(gl.TRIANGLES, 0, this.count);
  }
}
