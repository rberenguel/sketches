// GPU Splat Painter — CPU Analysis Pipeline
// Di Zenzo color structure tensor + multi-scale detail map

export { analyzeImage };

function analyzeImage(imageData) {
  const w = imageData.width;
  const h = imageData.height;
  const data = imageData.pixels;
  const n = w * h;

  // 1. Luminance
  const lum = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const p = i * 4;
    lum[i] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
  }

  // 2. Sobel per channel
  const gxR = new Float32Array(n), gyR = new Float32Array(n);
  const gxG = new Float32Array(n), gyG = new Float32Array(n);
  const gxB = new Float32Array(n), gyB = new Float32Array(n);
  sobelChannel(data, 0, gxR, gyR, w, h);
  sobelChannel(data, 1, gxG, gyG, w, h);
  sobelChannel(data, 2, gxB, gyB, w, h);

  // 3. Color structure tensor (Di Zenzo)
  const t11 = new Float32Array(n);
  const t12 = new Float32Array(n);
  const t22 = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    t11[i] = gxR[i]*gxR[i] + gxG[i]*gxG[i] + gxB[i]*gxB[i];
    t12[i] = gxR[i]*gyR[i] + gxG[i]*gyG[i] + gxB[i]*gyB[i];
    t22[i] = gyR[i]*gyR[i] + gyG[i]*gyG[i] + gyB[i]*gyB[i];
  }

  // 4. Blur tensor for coherent neighborhoods
  blurBox(t11, w, h, 2);
  blurBox(t12, w, h, 2);
  blurBox(t22, w, h, 2);

  // 5. Eigen-decomposition
  const angle = new Float32Array(n);
  const coherence = new Float32Array(n);
  const strength = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    const a = t11[i], b = t12[i], c = t22[i];
    const trace = a + c;
    const diff = a - c;
    const temp = Math.sqrt(diff * diff + 4 * b * b);
    const l1 = (trace + temp) * 0.5;
    const l2 = (trace - temp) * 0.5;

    strength[i] = trace;
    coherence[i] = trace > 0.001 ? (l1 - l2) / trace : 0;

    let vx = l2 - c;
    let vy = b;
    if (Math.abs(vx) + Math.abs(vy) < 1e-6) { vx = 1; vy = 0; }
    angle[i] = Math.atan2(vy, vx);
  }

  // 6. Multi-scale detail map (absolute deviation from local mean)
  const detail = new Float32Array(n);
  for (let scale = 1; scale <= 4; scale++) {
    const mean = blurBoxCopy(lum, w, h, scale);
    for (let i = 0; i < n; i++) {
      detail[i] += Math.abs(lum[i] - mean[i]);
    }
  }

  // 7. Normalize detail by local mean + fraction of global mean
  const localMean = blurBoxCopy(lum, w, h, 4);
  const globalMean = mean(lum);
  const detailScale = 0.1 * globalMean;
  let maxDetail = 0;
  for (let i = 0; i < n; i++) {
    detail[i] = detail[i] / (localMean[i] + detailScale);
    if (detail[i] > maxDetail) maxDetail = detail[i];
  }
  if (maxDetail > 0) {
    for (let i = 0; i < n; i++) detail[i] /= maxDetail;
  }

  // 8. Fuse with edge strength
  let maxStrength = 0;
  for (let i = 0; i < n; i++) {
    if (strength[i] > maxStrength) maxStrength = strength[i];
  }
  if (maxStrength > 0) {
    for (let i = 0; i < n; i++) {
      const edgeNorm = strength[i] / maxStrength;
      detail[i] = detail[i] * 0.6 + edgeNorm * 0.4;
    }
  }

  return { angle, coherence, strength, detail, w, h };
}

function sobelChannel(data, offset, gx, gy, w, h) {
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const p00 = ((y - 1) * w + (x - 1)) * 4 + offset;
      const p01 = ((y - 1) * w + x) * 4 + offset;
      const p02 = ((y - 1) * w + (x + 1)) * 4 + offset;
      const p10 = (y * w + (x - 1)) * 4 + offset;
      const p12 = (y * w + (x + 1)) * 4 + offset;
      const p20 = ((y + 1) * w + (x - 1)) * 4 + offset;
      const p21 = ((y + 1) * w + x) * 4 + offset;
      const p22 = ((y + 1) * w + (x + 1)) * 4 + offset;

      gx[i] = (-1 * data[p00] + 1 * data[p02]
             + -2 * data[p10] + 2 * data[p12]
             + -1 * data[p20] + 1 * data[p22]) / 255;

      gy[i] = (-1 * data[p00] + -1 * data[p02]
             +  0 * data[p10] +  0 * data[p12]
             +  1 * data[p20] +  1 * data[p22]) / 255;
    }
  }
}

function blurBox(data, w, h, r) {
  const temp = new Float32Array(w * h);
  const size = 2 * r + 1;
  const area = size * size;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      for (let dy = -r; dy <= r; dy++) {
        const yy = Math.min(Math.max(y + dy, 0), h - 1);
        for (let dx = -r; dx <= r; dx++) {
          const xx = Math.min(Math.max(x + dx, 0), w - 1);
          sum += data[yy * w + xx];
        }
      }
      temp[y * w + x] = sum / area;
    }
  }
  data.set(temp);
}

function blurBoxCopy(data, w, h, r) {
  const out = new Float32Array(w * h);
  const size = 2 * r + 1;
  const area = size * size;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      for (let dy = -r; dy <= r; dy++) {
        const yy = Math.min(Math.max(y + dy, 0), h - 1);
        for (let dx = -r; dx <= r; dx++) {
          const xx = Math.min(Math.max(x + dx, 0), w - 1);
          sum += data[yy * w + xx];
        }
      }
      out[y * w + x] = sum / area;
    }
  }
  return out;
}

function mean(arr) {
  let s = 0;
  for (let i = 0; i < arr.length; i++) s += arr[i];
  return s / arr.length;
}
