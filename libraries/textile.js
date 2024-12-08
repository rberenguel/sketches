export { textile };

import { bezierB, darken, gaussColor, arrow } from "../libraries/misc.js";

import { shimmeringColorHex, shimmeringColor } from "../libraries/palettes.js";

import "../libraries/3rdparty/spectral.js";

function textile(scene, x, y, w, h, width, height, colors, lerp_steps, dly) {
  // Best width/height is a ratio 1/8, literal 1-8 is fine thread
  let cs, c1, c2;
  const steps = lerp_steps === undefined ? 5 : lerp_steps;
  if (colors === undefined || colors.length < 2) {
    if (colors === undefined) {
      c1 = shimmeringColorHex(scene);
      c2 = shimmeringColorHex(scene);
    } else {
      if (colors.length == 1) {
        c1 = colors[0];
      }
    }
    cs = [];
    for (let i = 0; i < steps; i++) {
      const mixed = spectral.mix(c1, c2, i / steps, spectral.HEX);
      cs.push(scene.color(mixed));
    }
  } else {
    cs = colors;
  }
  for (let p = x; p < x + w; p += width + 0.5) {
    let yy = y;
    let xx = p;
    straightThread(
      scene,
      xx,
      yy,
      width,
      height,
      cs[(scene.random() * (cs.length - 1)) << 0],
      h,
      dly,
    );
  }
}

function straightThread(scene, x, y, width, height, color, length, dly) {
  // Vertical chain of braids. Does not use the braid function for _reasons_
  const shade = darken(scene, color, 0.8);
  const shine = darken(scene, color, 1.6);
  let st = [x, y];
  let en = [x + width, y + height];

  scene.beginShape();
  while (en[1] - height < y + length) {
    // Need an extra one
    const [pt1, pt2] = halfBraid(
      scene,
      st,
      en,
      0.8 * width,
      color,
      shade,
      shine,
      dly,
    ); // Right side
    const [pt3, pt4] = halfBraid(
      scene,
      st,
      en,
      -0.8 * width,
      color,
      shade,
      shine,
      dly,
    ); // Left side
    st[1] = pt4[1];
    en[1] = pt4[1] + height;
  }
  scene.endShape();
}

function braid(scene, st, en, width, color, shade, shine, angle, dly) {
  scene.beginShape();
  const [pt1, pt2] = halfBraid(
    scene,
    st,
    en,
    0.8 * width,
    color,
    shade,
    shine,
    dly,
  ); // Right side
  const [pt3, pt4] = halfBraid(
    scene,
    st,
    en,
    -0.8 * width,
    color,
    shade,
    shine,
    dly,
  ); // Left side
  scene.endShape();
  return pt4;
}

function halfBraid(scene, st, en, shift, color, shade, shine, dly) {
  // Left or right brad in a downward thread. In debug mode will also compute tangents
  // to find exact width. Will be slow, only use debug with large sizes.
  if (dly !== undefined) {
    dly.stroke("blue");
    dly.strokeWeight(2);
    dly.line(...st, ...en);
  }
  let t = 0.3;
  const pt = (t) => [
    st[0] + t * (en[0] - st[0]) + shift,
    st[1] + t * (en[1] - st[1]),
  ];
  const pt1 = pt(0.3);
  const pt2 = pt(0.6);
  if (dly !== undefined) {
    dly.strokeWeight(5);
    dly.stroke("red") & dly.point(...pt1);
    dly.stroke("green") & dly.point(...pt2);
  }
  let bez;
  if (shift >= 0) {
    bez = [...st, ...pt1, ...pt2, ...en];
  } else {
    bez = [...en, ...pt2, ...pt1, ...st];
  }
  if (dly !== undefined) {
    dly.stroke("purple") & dly.strokeWeight(2);
    bezierB(dly, ...bez);
    let [mins, mpx, mpy] = findTangent(bez);
    dly.strokeWeight(15) & dly.stroke("red");
    dly.point(mpx, mpy);
    dly.strokeWeight(1) & dly.stroke("cyan");
    dly.line(mpx, 0, mpx, dly.height);
    dly.stroke("black") & dly.strokeWeight(1);
    dly.bezier(...bez);
  }
  const stroke = Math.abs(1);
  if (dly === undefined) {
    scene.fill(color) & scene.stroke(shade) & scene.strokeWeight(stroke);
    scene.bezier(...bez);
    scene.strokeWeight(stroke);
    scene.stroke(shine);
    const wiggled = (pt) => [
      (pt[0] + scene.random(2)) << 0,
      (pt[1] - scene.random(2)) << 0,
    ];
    scene.line(...wiggled(st), ...wiggled(en));
  }
  return [pt1, pt2];
}

function findTangent(scene, bezier, dly) {
  // I was too lazy to worry about this and just looked for a minimum to
  // find the zero.
  let [x, y, pt1x, pt1y, pt2x, pt2y, enx, eny] = bezier;
  let start = 0,
    end = 1;
  let t = 0;
  let skip = 0;
  let mins = 1000;
  let mpx, mpy;
  while (t < 1) {
    let tx = dly.bezierTangent(x, pt1x, pt2x, enx, t);
    let ty = dly.bezierTangent(y, pt1y, pt2y, eny, t);
    let px = dly.bezierPoint(x, pt1x, pt2x, enx, t);
    let py = dly.bezierPoint(y, pt1y, pt2y, eny, t);
    let a = scene.atan2(ty, tx);
    const cond = Math.abs(tx / ty);
    if (cond < mins) {
      mins = cond;
      mpx = px;
      mpy = py;
    }
    a += PI;
    let c = scene.color("orange");
    if (cond < 0.01) {
      c = s.color("blue");
      arrow(dly, px, py, Math.cos(a) * 150 + px, Math.sin(a) * 150 + py);
    }
    dly.stroke(c) & dly.strokeWeight(2);
    if (skip % 10 == 0) {
      arrow(dly, px, py, Math.cos(a) * 150 + px, Math.sin(a) * 150 + py);
    }
    t += 0.01; // lazy zero finding
    skip++;
  }
  return [mins, mpx, mpy];
}
