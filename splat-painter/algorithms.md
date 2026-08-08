# Splat Painter — Algorithm Reference

This document explains every computational step that turns a photograph into a digital painting built from 2-D anisotropic Gaussian splats.

---

## 1. Pipeline

1. Ingest the image. Resize to fit the canvas. Preserve aspect ratio. Maximum dimension: 1600 px.
2. Run structure-tensor analysis. Compute per-channel Sobel gradients. Build the Di Zenzo colour tensor. Eigen-decompose. Output: edge angle, coherence, edge strength.
3. Build a detail map. Measure multi-scale local deviation from mean luminance. Normalise by luma. Fuse with edge strength.
4. Generate splats in four layers:
   - Base: large, opaque, round underpainting
   - Broad: detail-density-driven, edge-oriented strokes
   - Glaze: translucent shape-building washes
   - Fine: tapered impasto liner strokes along strong contours
5. Rasterise in WebGL. Use triangle-quad billboards. Compute a rotated Gaussian per fragment. Accumulate alpha correctly.
6. Add paper grain. Overlay per-pixel monochrome noise.

---

## 2. Colour Structure Tensor (Di Zenzo)

Classical structure tensors use luminance gradients. They miss isoluminant colour edges — red lips on pale skin, a blue sign on a grey wall. The Di Zenzo generalisation fixes this by computing gradient outer products per channel and summing them.

### 2.1 Sobel operator per channel

For each channel C ∈ {R, G, B} and pixel (x, y):

```
gx_C(x,y) = (C(x+1,y-1) + 2·C(x+1,y) + C(x+1,y+1))
          - (C(x-1,y-1) + 2·C(x-1,y) + C(x-1,y+1))

gy_C(x,y) = (C(x-1,y+1) + 2·C(x,y+1) + C(x+1,y+1))
          - (C(x-1,y-1) + 2·C(x,y-1) + C(x+1,y-1))
```

Normalise pixel values to [0, 1] by dividing by 255.

### 2.2 Outer-product summation

Form the 2×2 outer product per channel. Sum across channels:

```
T₁₁ = gx_R² + gx_G² + gx_B²
T₁₂ = gx_R·gy_R + gx_G·gy_G + gx_B·gy_B
T₂₂ = gy_R² + gy_G² + gy_B²
```

The result is the colour structure tensor T = [[T₁₁, T₁₂], [T₁₂, T₂₂]].

### 2.3 Box-blur for coherent neighbourhoods

Raw gradients are noisy. Blur each tensor component with a box filter of radius r = 2:

```
T_blur(x,y) = (1/(2r+1)²) · Σ_{dx=-r}^{r} Σ_{dy=-r}^{r} T(x+dx, y+dy)
```

Clamp boundary pixels (replicate edge).

### 2.4 Eigen-decomposition (2×2 analytic formula)

For a symmetric 2×2 matrix [[a, b], [b, c]]:

```
trace = a + c
diff  = a - c
temp  = √(diff² + 4·b²)
λ₁    = (trace + temp) / 2    // major eigenvalue
λ₂    = (trace - temp) / 2    // minor eigenvalue
```

**Coherence** (anisotropy):

```
coh = (λ₁ - λ₂) / trace    if trace > 0.001
    = 0                       otherwise
```

coh ∈ [0, 1]. 0 = isotropic mush (flat region). 1 = crisp straight edge.

**Edge angle** (minor eigenvector = direction along the edge = stroke direction):

The eigenvector for λ₂ is:
```
vx = λ₂ - c
vy = b
```

Normalise: if |vx| + |vy| < 1e-6, set (1, 0). The stroke angle is atan2(vy, vx).

The major eigenvector points across the edge (gradient direction). The minor eigenvector points along the edge. We stroke along the edge. Hence we use the minor eigenvector.

### 2.5 Edge strength

```
strength = trace = λ₁ + λ₂
```

Later fused with the detail map.

---

## 3. Multi-Scale Detail Energy Map

Edge strength alone misses texture. Gravel has high-frequency detail but weak coherent edges. We need a measure of local "busyness" independent of edge orientation.

### 3.1 Luminance

```
L(x,y) = 0.299·R + 0.587·G + 0.114·B
```

### 3.2 Multi-scale absolute deviation

For scales s ∈ {1, 2, 3, 4}:

1. Box-blur L with radius s to get M_s.
2. Compute absolute deviation: |L - M_s|.
3. Accumulate:

```
detail(x,y) = Σ_s |L(x,y) - M_s(x,y)|
```

This avoids separable filter bookkeeping. It captures high-frequency variation at multiple scales.

### 3.3 Luma-normalisation

Dark textured regions produce less absolute energy than bright flat regions. Normalise by local mean luminance plus a fraction of global mean:

```
globalMean = mean(L)
detail(x,y) = detail(x,y) / (localMean(x,y) + 0.1 · globalMean)
```

Then globally normalise to [0, 1] by dividing by max(detail).

### 3.4 Fusion with edge strength

```
edgeNorm = strength / max(strength)
detail   = 0.6 · detail + 0.4 · edgeNorm
```

The final detail map drives stroke density: high where there is texture or strong edges, low in flat regions.

---

## 4. Wang Avalanche Hash

Grid placement creates lattice artifacts — the "JPEG block" problem. Even jittered grids have faint periodicity. The original post recommends a hash that gives true white-noise coordinates.

A simple linear hash like hash(i) + hash(j) produces Marsaglia hyperplanes. Points fall on a small number of parallel planes in 2-D space, creating visible diagonal stripes.

Our hash uses full avalanche mixing: every input bit affects every output bit.

```
hash2D(i, j):
    x = uint32(i) × 374761393
    y = uint32(j) × 668265263
    s = (x XOR y) + 0x9e3779b9
    s = (s XOR (s >> 13)) × 1274126177
    s = (s XOR (s >> 16)) × 0x85ebca6b
    s = s XOR (s >> 13)
    return uint32(s) / 2³²
```

Result is in [0, 1], uniformly distributed, with no spatial correlation between sequential seeds.

---

## 5. Perlin Noise Bend

Pure edge-following produces unnaturally perfect strokes. Real brushwork has organic variation. We use 2-D Perlin noise as a flow field.

For each stroke:

```
noiseAngle = noise(x·scale + phaseX, y·scale + phaseY) · 2π
blend      = (1 - coherence) · noiseBend
finalAngle = edgeAngle + blend · (noiseAngle - edgeAngle)
```

- scale = 0.006 (low-frequency, smooth variation)
- phaseX, phaseY = per-seed offsets (prevents shared-phase "fabric weave")
- Strong edges (coh ≈ 1): strokes follow the contour faithfully.
- Flat regions (coh ≈ 0): strokes follow the noise flow field.

---

## 6. Layered Splat Generation

### 6.1 Layer 1 — Base Underpainting

Goal: tile the canvas with large, roundish, fully opaque colour regions. No background must show through.

Parameters:
- baseCount ≈ 1500
- maxSize ≈ 95 px
- alpha = 1.0
- Placement: Wang hash (hash2D), not grid
- Size variation: sz = maxSize · (0.85 + hash · 0.3)
- Aspect: sy = sx · 0.7 (slightly elliptical, no directional bias)

With 1500 strokes of mean radius ~75 px on a 1400×1000 canvas, expected coverage is ~8×. Every pixel is occluded by multiple overlapping base strokes.

### 6.2 Layer 2 — Broad Adaptive Strokes

Goal: add directional strokes that follow edges and vary in density with image detail.

Parameters:
- broadCount ≈ 80,000 candidates (kept ≈ 20,000–40,000)
- maxSize ≈ 95, minSize ≈ 2
- alpha ≈ 0.82

Rejection sampling against the detail map:

```
h3 = hash2D(i, seed + 10002)
if h3 > detail(x,y) · detailScale: continue // reject
```

With detailScale = 1.0, acceptance probability equals the detail value. Flat regions (detail ≈ 0.1) accept 10% of candidates. Detailed regions (detail ≈ 0.9) accept 90%.

Size adaptation:
```
size = minSize + (maxSize - minSize) · (1 - detail)
```
High detail → small strokes. Low detail → large strokes.

Elongation:
```
sx = size · (1 + coherence · elongation)
sy = size
```
Strong edges → long thin strokes. Flat regions → round blobs.

Perlin bend: each stroke gets independent phase offsets to avoid the shared-phase wave artifact.

### 6.3 Layer 3 — Mid-Tier Glazes

Goal: translucent washes that build tonal shape between the opaque base and the detailed broad strokes.

Parameters:
- glazeCount ≈ 12,000
- alpha ≈ 0.45
- Size ≈ maxSize · 0.25, detail-adaptive
- Uniform placement with 30% rejection (random thinning)
- Lower elongation than broad layer
- Same Perlin bend logic

These are the "mid-tones" — visible enough to shape forms, translucent enough to let base and broad layers breathe through.

### 6.4 Layer 4 — Fine Edge Chains

Goal: crisp impasto liner strokes along strong contours. These are the actual "brush strokes" the eye reads.

Parameters:
- fineCount ≈ broadCount · 0.15 ≈ 12,000 candidates
- Coherence threshold: coh > 0.45 (only very strong edges)
- Step length: 2.0 px
- Chain length: 8 + floor(coh · 16 + hash · 10) = 8–34 segments

Chain tracing:
For each segment step from 0 to chainLen - 1:
```
taper     = (1 - step/chainLen)^0.8
bend      = noise(step · 0.12 + phase, seed · 0.001) · 0.3
segAngle  = edgeAngle + bend
cx        = x + cos(segAngle) · step · stepLen
cy        = y + sin(segAngle) · step · stepLen
```

Color boundary stop:
At each step, compare the pixel colour under the chain to the starting colour:
```
dist = |R_here - R_start| + |G_here - G_start| + |B_here - B_start|
if dist > 35: break // lift the brush
```

This prevents a green chain from bleeding across a boundary into a white region.

Tapering:
- Size: minSize · 2.2 · taper
- Alpha: min(0.92, broadAlpha · 1.3 · taper)
- Segments near the tail are small and faint, simulating brush lift.

---

## 7. WebGL Rasterisation

### 7.1 Triangle-quad billboards

Each splat is 6 vertices (2 triangles) forming a square billboard centred on the stroke position. The quad extends coverage · max(sx, sy) in each direction.

Why not point sprites? WebGL point sprites have a maximum size (implementation-dependent, often 64–256 px). Large base strokes would clip to hard-edged circles. Triangle quads have no size limit.

Vertex attributes per vertex:
- a_position — stroke centre (x, y)
- a_color — (r, g, b, a) in [0, 1]
- a_params — (angle, sx, sy)
- a_corner — local quad offset in [-1, 1]²

### 7.2 Fragment shader

```glsl
vec2 p   = pixel_pos - centre;
float c  = cos(angle);
float s  = sin(angle);
vec2 local;
local.x  =  c*p.x + s*p.y;   // rotate into stroke frame
local.y  = -s*p.x + c*p.y;

float d  = local.x² / sx² + local.y² / sy²;
float alpha = exp(-hardness · d);
if (alpha < 0.003) discard;

gl_FragColor = vec4(color.rgb, color.a * alpha);
```

This is a true anisotropic 2-D Gaussian: elongated along sx, narrow across sy, rotated by angle.

### 7.3 Alpha blending — The Critical Fix

Standard gl.blendFunc(SRC_ALPHA, ONE_MINUS_SRC_ALPHA) applies the same blend factors to both RGB and Alpha channels.

For RGB this is correct:
```
resultRGB = srcRGB·srcA + dstRGB·(1-srcA)
```

For Alpha it is wrong:
```
resultA = srcA·srcA + dstA·(1-srcA)
```

An opaque base stroke (A=1.0) stays opaque. But a semi-transparent broad stroke (A=0.82) becomes:
```
resultA = 0.82·0.82 + 1.0·0.18 = 0.85
```

After 3–4 such strokes the accumulated alpha drops to ~0.5. The framebuffer becomes half-transparent, and the white clear colour bleeds through everywhere — the "white halo" bug.

The correct blend for the alpha channel uses ONE as the source factor:
```
resultA = srcA·1.0 + dstA·(1-srcA)
```

This is the standard over-operator from Porter-Duff compositing. In WebGL:

```js
gl.blendFuncSeparate(
    gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA,  // RGB
    gl.ONE,       gl.ONE_MINUS_SRC_ALPHA     // Alpha
);
```

With this fix, semi-transparent strokes add their alpha to the destination rather than multiplying it down. The framebuffer stays opaque; no white background shows through.

### 7.4 Coordinate system

The vertex shader maps world-space (x, y) to clip space:
```
clip.x = (x / width)  · 2.0 - 1.0
clip.y = (y / height) · 2.0 - 1.0   // then Y-flipped for top-left origin
```

The canvas coordinate system has (0, 0) at top-left, matching the analysis image and all splat positions.

---

## 8. Paper Grain Post-Process

After blitting the WebGL canvas to the 2D display canvas, add monochrome noise:

```js
for each pixel (i += 4):
    g = (random() - 0.5) · grainAmount
    pixels[i]   = clamp(pixels[i]   + g, 0, 255)
    pixels[i+1] = clamp(pixels[i+1] + g, 0, 255)
    pixels[i+2] = clamp(pixels[i+2] + g, 0, 255)
```

grainAmount ≈ 6. This emulates paper or canvas texture, preventing an overly smooth "digital" look.

---

## 9. Summary of Parameters

| Parameter | Typical | Effect |
|---|---|---|
| baseCount | 1500 | Number of large underpainting washes |
| broadCount | 80,000 | Candidate broad strokes (kept ≈ 20–40K) |
| glazeCount | 12,000 | Translucent shape-building strokes |
| maxSize | 95 px | Largest stroke radius |
| minSize | 2 px | Smallest stroke radius |
| elongation | 4 | sx = size · (1 + coh · elongation) |
| noiseBend | 0.5 | How much Perlin flow affects flat regions |
| detailScale | 1.0 | Multiplier on detail map for acceptance probability |
| broadAlpha | 0.82 | Opacity of broad adaptive strokes |
| glazeAlpha | 0.45 | Opacity of glaze strokes |
| hardness | 1.5 | Gaussian exponent; higher = crisper edges |
| grainAmount | 6 | Post-process noise intensity |

---

## 10. References

- Di Zenzo, S. (1986). A note on the gradient of a multi-image. Computer Vision, Graphics, and Image Processing, 33(1), 116–125.
- Litwinowicz, P. (1997). Processing images and video for an impressionist effect. SIGGRAPH.
- Hertzmann, A. (1998). Painterly rendering with curved brush strokes of multiple sizes. SIGGRAPH.
- Porter, T., & Duff, T. (1984). Compositing digital images. SIGGRAPH.
- Sotnikov, D. (2026). Painting with Gaussians. https://yogthos.net/posts/2026-08-03-splat-painter.html
