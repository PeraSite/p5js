/**
 * 결과 화면의 배경, 랭크, 통계, 리더보드, 버튼을 배치한다.
 */
function drawResultScreen() {
  const stage = getStageRect();
  const accuracy = calculatePlayAccuracy();
  const rank = getPlayRank();
  const theme = getResultTheme(rank);
  const song = App.songs[App.selectedSong];

  drawResultBackdrop(stage, theme);

  drawText(song.title, stage.x + stage.w / 2, stage.y + 30, {
    size: 18,
    alignH: CENTER,
    alignV: TOP,
    style: BOLD,
    fill: [245, 245, 245],
  });
  drawText(getResultBadgeText(accuracy), stage.x + stage.w / 2, stage.y + 58, {
    size: 12,
    alignH: CENTER,
    alignV: TOP,
    fill: theme.accent,
  });

  drawResultRank(stage, rank, theme);
  drawResultStats(stage, accuracy);
  drawResultLeaderboard(stage);
  drawResultActions(stage, theme);
}
/**
 * 결과 화면 뒤 배경과 큰 패널을 그린다.
 */
function drawResultBackdrop(stage, theme) {
  drawUiBackground(stage, { dim: 62 });
  drawCreamAssetPanel(stage.x + 24, stage.y + 76, stage.w - 48, stage.h - 166, {
    alpha: 244,
  });
  fill(theme.accent[0], theme.accent[1], theme.accent[2], 22);
  circle(stage.x + stage.w / 2, stage.y + stage.h * 0.25, stage.w * 0.86);
  drawResultMarks(stage, theme);
}

/**
 * 결과 화면 배경에 작은 별 장식을 그린다.
 */
function drawResultMarks(stage, theme) {
  const marks = [
    ["*", 0.18, 0.18, 18, 38],
    ["*", 0.82, 0.2, 14, 34],
    ["*", 0.72, 0.37, 16, 24],
    ["*", 0.24, 0.46, 12, 25],
    ["*", 0.16, 0.71, 15, 22],
    ["*", 0.86, 0.66, 12, 24],
  ];

  for (const [mark, px, py, size, alpha] of marks) {
    drawText(mark, stage.x + stage.w * px, stage.y + stage.h * py, {
      size,
      alignH: CENTER,
      alignV: CENTER,
      style: BOLD,
      fill: [theme.accent[0], theme.accent[1], theme.accent[2], alpha],
    });
  }
}

/**
 * 중앙의 큰 랭크 카드와 랭크 제목을 그린다.
 */
function drawResultRank(stage, rank, theme) {
  const cx = stage.x + stage.w / 2;
  const cy = stage.y + 160;

  drawBox(cx - 82, cy - 46, 164, 154, {
    fill: [255, 237, 197, 164],
    stroke: theme.accent,
    strokeWeight: 3,
    radius: 8,
  });
  noFill();
  stroke(theme.accent[0], theme.accent[1], theme.accent[2], 90);
  strokeWeight(3);
  rect(cx - 70, cy - 34, 140, 130, 8);

  drawText(rank, cx, cy - 48, {
    size: 112,
    alignH: CENTER,
    alignV: TOP,
    style: BOLD,
    fill: theme.dim,
  });
  drawText(theme.title, cx, cy + 78, {
    size: 16,
    alignH: CENTER,
    alignV: TOP,
    style: BOLD,
    fill: CAMP.ink,
  });
}

/**
 * 점수, 정확도, 콤보, hit/miss 통계를 2x2 카드로 그린다.
 */
function drawResultStats(stage, accuracy) {
  const stats = buildResultStats(accuracy);
  const x = stage.x + 42;
  const y = stage.y + 276;
  const gap = 10;
  const cellW = (stage.w - 84 - gap) / 2;
  const cellH = 56;

  for (let i = 0; i < stats.length; i += 1) {
    const col = i % 2;
    const row = floor(i / 2);
    const cellX = x + col * (cellW + gap);
    const cellY = y + row * (cellH + gap);

    drawWoodPanel(cellX, cellY, cellW, cellH, { fillColor: [99, 57, 37], radius: 6 });
    drawText(stats[i][0], cellX + 12, cellY + 9, {
      size: 10,
      alignH: LEFT,
      alignV: TOP,
      fill: CAMP.creamDim,
    });
    drawText(stats[i][1], cellX + 12, cellY + 28, {
      size: 18,
      alignH: LEFT,
      alignV: TOP,
      style: BOLD,
      fill: CAMP.cream,
    });
  }
}
