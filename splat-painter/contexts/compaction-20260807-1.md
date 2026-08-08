# Session Compaction Summary

## User Intent
- Build a GPU-based Gaussian splat painter in p5.js/WebGL, adapted from yogthos' blog post "Painting with Gaussians"
- Create a tool that turns photographs into digital paintings via edge-aware anisotropic Gaussian strokes
- Reuse existing generative-art machinery from the `sketches` codebase (GUI library, palette/effects systems)

## Contextual Work Summary

### Image Analysis Pipeline
- Implemented CPU-side Di Zenzo colour structure tensor (Sobel per RGB channel, outer product sum, eigen-decomposition)
- Built multi-scale detail energy map (absolute deviation from local mean luminance, luma-normalised, fused with edge strength)
- Outputs per-pixel: stroke angle (minor eigenvector), coherence (anisotropy ratio), detail density, edge strength

### Splat Generation — Four Paint Layers
- **Base**: Large opaque washes (Wang avalanche hash placement, alpha 1.0) to fully tile the canvas
- **Broad**: Detail-density-driven adaptive strokes with rejection sampling; Perlin noise bend with per-seed phase offsets
- **Glaze**: Translucent mid-tier strokes for tonal shape-building
- **Fine**: Tapered edge chains along strong contours with colour boundary stops (brush-lift simulation)

### WebGL Renderer
- Triangle-quad billboards (6 vertices per splat, no point-sprite size limits)
- Fragment shader computes rotated anisotropic Gaussian in world space
- **Critical fix**: `blendFuncSeparate` with `ONE` for alpha source factor — standard over-operator prevents white halo from accumulated transparency erosion

### UI / Integration
- p5.js + custom GUI library (keybindings, sliders, file input)
- Fit-image-to-canvas with aspect-ratio preservation
- Layer toggles (`b`, `d`, `z`, `f`) for isolated debugging
- Source image display on load; painting triggered via `r` key

### Documentation
- Wrote `algorithms.md`: technical reference covering tensor math, hash functions, layer logic, WebGL rasterisation
- Applied prose-orchestrator editing pass (Zinsser clarity, STE procedural constraints, Clark rhythm)

## Files Touched

### Core Implementation
- **`splat-painter.js`**: Main p5 sketch. Orchestrates analysis → splat generation → WebGL render → grain. Contains all layer logic, GUI, and debug toggles
- **`analysis.js`**: CPU image analysis. Di Zenzo tensor + multi-scale detail map with box-blur and eigen-decomposition
- **`splat-renderer.js`**: Raw WebGL renderer. Triangle-quad billboards, anisotropic Gaussian fragment shader, proper alpha accumulation via `blendFuncSeparate`
- **`index.html`**: Standard sketch page wiring to p5.js and GUI library

### Documentation
- **`algorithms.md`**: Complete technical reference. Edited through prose-orchestrator (Zinsser + STE + Clark frameworks)
- **`contexts/compaction-20260807-1.md`**: This summary

## Key Decisions & Notes
- Moved from `misc-pwas/paint` to `sketches/splat-painter` to reuse existing GUI/effects infrastructure
- White halo bug traced to incorrect WebGL alpha blending, not coverage or stroke count — the standard `SRC_ALPHA, ONE_MINUS_SRC_ALPHA` erodes accumulated alpha over semi-transparent strokes
- Wang avalanche hash (`hash2D`) replaced earlier linear hash to eliminate Marsaglia hyperplane streaks
- Per-seed Perlin phase offsets prevent shared-phase "fabric weave" artifact in stroke orientation
