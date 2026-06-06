const CAMP = {
  nightTop: [16, 22, 42],
  nightBottom: [42, 26, 23],
  skyGlow: [255, 139, 68],
  wood: [132, 76, 42],
  woodDark: [77, 43, 29],
  woodLight: [185, 111, 58],
  cream: [255, 237, 197],
  creamDim: [231, 199, 146],
  toast: [255, 176, 83],
  ember: [255, 103, 55],
  coal: [36, 23, 22],
  leaf: [83, 119, 76],
  strawberry: [255, 155, 170],
  blueberry: [123, 174, 224],
  ink: [59, 35, 25],
};

function campColor(name, alpha) {
  const base = CAMP[name] || CAMP.cream;
  if (alpha === undefined) return base;
  return [base[0], base[1], base[2], alpha];
}

function drawImageCover(img, x, y, w, h) {
  if (!img || !img.width || !img.height) return false;
  const sourceRatio = img.width / img.height;
  const targetRatio = w / h;
  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;

  if (sourceRatio > targetRatio) {
    sw = img.height * targetRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / targetRatio;
    sy = (img.height - sh) / 2;
  }

  imageMode(CORNER);
  image(img, x, y, w, h, sx, sy, sw, sh);
  return true;
}

function drawImageContain(img, x, y, w, h) {
  if (!img || !img.width || !img.height) return false;
  const scale = min(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  imageMode(CORNER);
  image(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  return true;
}

function drawImageCropContain(img, x, y, w, h, sx, sy, sw, sh) {
  if (!img || !img.width || !img.height) return false;
  const scale = min(w / sw, h / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  imageMode(CORNER);
  image(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh, sx, sy, sw, sh);
  return true;
}

function drawUiBackground(stage, opts = {}) {
  background(16, 22, 42);
  if (!drawImageCover(App.assets.ui.background, stage.x, stage.y, stage.w, stage.h)) {
    drawBox(stage.x, stage.y, stage.w, stage.h, { fill: [16, 22, 42] });
    return;
  }

  const { dim = 0, warm = 0 } = opts;
  if (dim > 0) drawBox(stage.x, stage.y, stage.w, stage.h, { fill: [5, 7, 14, dim] });
  if (warm > 0) {
    noStroke();
    fill(255, 120, 48, warm);
    circle(stage.x + stage.w / 2, stage.y + stage.h * 0.82, stage.w * 1.1);
  }
}

function drawCreamAssetPanel(x, y, w, h, opts = {}) {
  const { alpha = 255, selected = true } = opts;
  if (!App.assets.ui.panelCream) {
    drawCreamPanel(x, y, w, h, { selected });
    return;
  }

  push();
  tint(255, alpha);
  imageMode(CORNER);
  image(App.assets.ui.panelCream, x, y, w, h);
  pop();
}

function drawCampBackdrop(stage, opts = {}) {
  const { footerFire = true, trees = true } = opts;

  background(CAMP.nightTop);
  noStroke();
  for (let i = 0; i < 36; i += 1) {
    const t = i / 35;
    const y = stage.y + stage.h * t;
    const shade = lerpColor(color(CAMP.nightTop), color(CAMP.nightBottom), t);
    fill(red(shade), green(shade), blue(shade));
    rect(stage.x, y, stage.w, stage.h / 35 + 1);
  }

  drawPixelStars(stage);
  if (trees) drawForestSilhouette(stage);
  drawWarmGlow(stage, stage.y + stage.h * 0.84, stage.w * 1.2, 0.72);
  if (footerFire) drawCampFooter(stage);
}

function drawPixelStars(stage) {
  const stars = [
    [0.13, 0.1, 2],
    [0.29, 0.18, 3],
    [0.73, 0.12, 2],
    [0.84, 0.24, 3],
    [0.18, 0.32, 2],
    [0.66, 0.31, 2],
    [0.48, 0.08, 2],
    [0.9, 0.42, 2],
  ];
  noStroke();
  for (const [px, py, size] of stars) {
    fill(255, 237, 184, 190 + sin(millis() * 0.002 + px * 12) * 35);
    rect(round(stage.x + stage.w * px), round(stage.y + stage.h * py), size, size);
  }
}

function drawForestSilhouette(stage) {
  const baseY = stage.y + stage.h * 0.78;
  noStroke();
  fill(22, 39, 34, 172);
  for (let i = 0; i < 9; i += 1) {
    const x = stage.x + (stage.w / 8) * i;
    const h = stage.h * (0.13 + (i % 3) * 0.025);
    triangle(x - 34, baseY + 4, x, baseY - h, x + 34, baseY + 4);
    rect(x - 7, baseY - h * 0.2, 14, h * 0.32);
  }
  fill(18, 29, 29, 220);
  rect(stage.x, baseY, stage.w, stage.h - (baseY - stage.y));
}

function drawWarmGlow(stage, cy, diameter, strength = 1) {
  noStroke();
  for (let i = 8; i >= 1; i -= 1) {
    const t = i / 8;
    fill(255, 126, 56, 12 * t * strength);
    circle(stage.x + stage.w / 2, cy, diameter * t);
  }
}

function drawCampFooter(stage) {
  const y = stage.y + stage.h - 96;
  drawWarmGlow(stage, y + 36, stage.w * 0.9, 0.78);
  fill(50, 30, 24, 235);
  rect(stage.x, y + 44, stage.w, 52);
  fill(88, 51, 34, 230);
  rect(stage.x, y + 32, stage.w, 18);

  const cx = stage.x + stage.w / 2;
  fill(CAMP.woodDark);
  rect(cx - 58, y + 64, 116, 10, 3);
  fill(CAMP.wood);
  rect(cx - 48, y + 55, 96, 10, 3);
  fill(255, 128, 54, 210 + sin(millis() * 0.006) * 24);
  triangle(cx - 22, y + 60, cx, y + 10, cx + 20, y + 60);
  fill(255, 198, 88, 225);
  triangle(cx - 12, y + 60, cx + 5, y + 26, cx + 17, y + 60);
}

function drawWoodPanel(x, y, w, h, opts = {}) {
  const {
    selected = false,
    radius = 7,
    fillColor = selected ? CAMP.woodLight : CAMP.wood,
  } = opts;

  drawBox(x + 3, y + 4, w, h, {
    fill: [37, 22, 20, 94],
    radius,
  });
  drawBox(x, y, w, h, {
    fill: fillColor,
    stroke: CAMP.woodDark,
    strokeWeight: 3,
    radius,
  });

  noStroke();
  fill(255, 219, 142, selected ? 58 : 34);
  rect(x + 8, y + 8, w - 16, 3, 2);
  fill(74, 39, 27, 60);
  rect(x + 10, y + h - 12, w - 20, 3, 2);

  stroke(87, 45, 27, selected ? 86 : 58);
  strokeWeight(1);
  const lineCount = max(2, floor(h / 18));
  for (let i = 1; i < lineCount; i += 1) {
    const gy = y + (h / lineCount) * i;
    line(x + 12, gy, x + w - 12, gy + sin(i * 2.1) * 2);
  }
  noStroke();
}

function drawCreamPanel(x, y, w, h, opts = {}) {
  const { selected = false, radius = 8 } = opts;
  drawBox(x + 2, y + 3, w, h, { fill: [53, 31, 22, 72], radius });
  drawBox(x, y, w, h, {
    fill: selected ? CAMP.cream : [244, 213, 161],
    stroke: selected ? CAMP.toast : CAMP.woodDark,
    strokeWeight: selected ? 3 : 2,
    radius,
  });
  noStroke();
  fill(255, 255, 255, selected ? 48 : 28);
  rect(x + 7, y + 7, w - 14, 3, 2);
}

function drawHangingSign(label, x, y, w, h, opts = {}) {
  const { size = 24 } = opts;
  stroke(CAMP.woodDark);
  strokeWeight(3);
  line(x + 36, y - 16, x + 50, y + 2);
  line(x + w - 36, y - 16, x + w - 50, y + 2);
  drawWoodPanel(x, y, w, h, { selected: true, radius: 6 });
  drawText(label, x + w / 2, y + h / 2, {
    size,
    alignH: CENTER,
    alignV: CENTER,
    style: BOLD,
    fill: CAMP.cream,
  });
}

function drawTinyMarshmallow(x, y, size, tintColor = CAMP.cream) {
  drawBox(x, y, size, size * 0.78, {
    fill: tintColor,
    stroke: CAMP.woodDark,
    strokeWeight: 2,
    radius: 5,
  });
  noStroke();
  fill(255, 255, 255, 82);
  rect(x + size * 0.18, y + size * 0.16, size * 0.45, 3, 2);
}
