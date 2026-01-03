function initStorm({ rain: enableRain = false } = {}) {
  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d", { alpha: false });

  let w, h, dpr;
  let bolts = [];
  let rain = [];
  let skyFlash = 0;
  let windTime = 0;

  const CFG = {
    baseSegments: 6,
    sway: 80,
    fractalIter: 6,
    roughness: 0.45,
    width: 2.5,
    glow: 20,
    fade: 0.03,
    branchProb: 0.7,
  };

  const RAIN = {
    count: 4000,
    baseSpeed: 25,
    baseWind: -2,
    color: "rgba(160, 180, 220, 0.15)",
  };

  function fractalize(path, iterations) {
    let currentPath = path;
    for (let k = 0; k < iterations; k++) {
      const nextPath = [currentPath[0]];
      for (let i = 0; i < currentPath.length - 1; i++) {
        const p1 = currentPath[i],
          p2 = currentPath[i + 1];
        const dx = p2.x - p1.x,
          dy = p2.y - p1.y;
        const noise = (Math.random() - 0.5) * CFG.roughness;
        nextPath.push({
          x: (p1.x + p2.x) / 2 - dy * noise,
          y: (p1.y + p2.y) / 2 + dx * noise,
        });
        nextPath.push(p2);
      }
      currentPath = nextPath;
    }
    return currentPath;
  }

  function createSkeleton(x, y, targetY) {
    const path = [{ x, y }];
    const segs = CFG.baseSegments;
    const dy = (targetY - y) / segs;
    let cx = x;

    for (let i = 1; i <= segs; i++) {
      const cy = y + dy * i;
      const progress = i / segs;

      // Gentle pull towards center to keep it on screen
      const center = x < w * 0.25 ? w * 0.5 : x > w * 0.75 ? w * 0.5 : x;
      const pull = (center - cx) * (progress * 0.15);

      // Large low-frequency sway
      const sway = (Math.random() * 2 - 1) * CFG.sway;

      cx += pull + sway;
      path.push({ x: cx, y: cy });
    }
    return path;
  }

  function createBolt(x) {
    // 1. Create the low-res "Skeleton" (Big Zig-Zags)
    const skeleton = createSkeleton(x, 0, h);

    // 2. Add Branches (attached to skeleton nodes)
    const branches = [];
    if (Math.random() < CFG.branchProb) {
      const num = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < num; i++) {
        // Pick a random spot on the skeleton
        const idx = Math.floor(skeleton.length * (0.2 + Math.random() * 0.6));
        const start = skeleton[idx];

        // Simple 3-point skeleton for branches [Start, Mid, End]
        const len = (h - start.y) * (0.3 + Math.random() * 0.4);
        const endY = start.y + len;
        const side = Math.random() < 0.5 ? -1 : 1;
        const drift = side * (w * 0.1 + Math.random() * w * 0.2);

        const branchSkel = [
          { x: start.x, y: start.y },
          {
            x: start.x + drift * 0.5 + (Math.random() * 2 - 1) * 40,
            y: start.y + len * 0.5,
          },
          { x: start.x + drift, y: endY },
        ];

        branches.push(fractalize(branchSkel, CFG.fractalIter));
      }
    }

    // 3. Fractalize the skeleton to add the "Electric" look
    const finalPath = fractalize(skeleton, CFG.fractalIter);

    return { life: 1.0, path: finalPath, branches };
  }

  function drawPath(pts, widthMul) {
    if (pts.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.lineWidth = CFG.width * dpr * widthMul;
    ctx.stroke();
  }

  function initRain() {
    if (!enableRain) {
      rain = [];
      return;
    }
    rain = [];
    for (let i = 0; i < RAIN.count; i++) {
      rain.push({
        x: Math.random() * w,
        y: Math.random() * h,
        l: Math.random() * 20 + 20,
        z: Math.random() * 0.5 + 0.5,
      });
    }
  }

  function loop() {
    if (!ctx || !w) return;

    if (enableRain) {
      // --- COMPLEX STORM BEHAVIOR (b.html logic) ---
      windTime += 0.01;
      const currentWind = RAIN.baseWind + Math.sin(windTime) * 3;

      // Sky Flash Logic
      skyFlash *= 0.955; // Decay
      if (skyFlash < 0.02) skyFlash = 0;

      if (skyFlash > 0.15 && Math.random() < 0.2)
        skyFlash += Math.random() * 0.15;
      if (skyFlash > 1) skyFlash = 1;

      // Distant sheet lightning
      if (Math.random() < 0.003) {
        if (skyFlash < 0.1) skyFlash = Math.random() * 0.4 + 0.1;
      }

      // Render Background
      const bgLum = 5 + Math.floor(skyFlash * 50);
      ctx.globalAlpha = 1;
      ctx.fillStyle = `rgb(${bgLum},${bgLum},${bgLum + 6})`;
      ctx.fillRect(0, 0, w, h);

      // Render Rain
      ctx.strokeStyle = RAIN.color;
      ctx.lineWidth = 1 * dpr;
      if (skyFlash > 0.05)
        ctx.strokeStyle = `rgba(200, 220, 255, ${0.2 + skyFlash * 0.4})`;

      ctx.beginPath();
      for (let r of rain) {
        r.x += currentWind * r.z;
        r.y += RAIN.baseSpeed * r.z;
        if (r.y > h) {
          r.y = -r.l;
          r.x = Math.random() * w;
        }
        if (r.x > w) r.x = 0;
        else if (r.x < 0) r.x = w;

        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x + currentWind * 0.5, r.y + r.l);
      }
      ctx.stroke();

      // Spawn Bolts
      if (Math.random() < 0.01) {
        bolts.push(createBolt(Math.random() * w));
        skyFlash = 1.0;
      }
    } else {
      // --- SIMPLE LIGHTNING BEHAVIOR (a.html logic) ---
      // Background
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, w, h);

      // Spawn
      if (Math.random() < 0.015) {
        bolts.push(createBolt(Math.random() * w));
        // Flash (Instant)
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(0, 0, w, h);
      }
    }

    // --- SHARED BOLT RENDERING ---
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (let i = bolts.length - 1; i >= 0; i--) {
      const b = bolts[i];
      b.life -= CFG.fade;
      if (b.life <= 0) {
        bolts.splice(i, 1);
        continue;
      }

      const flicker = Math.random() > 0.1 ? b.life : b.life * 0.6;

      ctx.globalAlpha = flicker * 0.4;
      ctx.strokeStyle = "#2299FF";
      ctx.shadowBlur = CFG.glow * dpr;
      ctx.shadowColor = "#2299FF";
      drawPath(b.path, 3.0);
      b.branches.forEach((br) => drawPath(br, 1.5));

      ctx.globalAlpha = flicker;
      ctx.strokeStyle = "#FFFFFF";
      ctx.shadowBlur = 0;
      drawPath(b.path, 1.0);
      b.branches.forEach((br) => drawPath(br, 0.5));
    }
    requestAnimationFrame(loop);
  }

  function resize() {
    dpr = window.devicePixelRatio || 1;
    w = Math.ceil(window.innerWidth * dpr);
    h = Math.ceil(window.innerHeight * dpr);
    canvas.width = w;
    canvas.height = h;
    initRain();
  }

  function handleInput(e) {
    let cx = e.clientX;
    if (cx === undefined && e.touches && e.touches.length > 0)
      cx = e.touches[0].clientX;
    if (cx !== undefined) {
      bolts.push(createBolt(cx * dpr));
      if (enableRain) skyFlash = 1.0; // Only affect skyFlash if rain/storm mode is on
    }
  }

  function handleKey(e) {
    if (e.key === "s") {
      const name = document.title
        ? document.title.toLowerCase().replace(/ /g, "_")
        : "capture";
      const link = document.createElement("a");
      link.download = `${name}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  }

  window.addEventListener("resize", resize);
  window.addEventListener("mousedown", handleInput);
  window.addEventListener("touchstart", handleInput, { passive: false });
  window.addEventListener("keydown", handleKey);

  resize();
  requestAnimationFrame(loop);
}
