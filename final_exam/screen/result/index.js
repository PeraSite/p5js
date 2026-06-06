/**
 * 결과 화면의 배경, 랭크, 통계, 리더보드, 버튼을 배치한다.
 */
function drawResultScreen() {
  const stage = getStageRect();
  const sheet = getResultSheetRect(stage);
  const accuracy = calculatePlayAccuracy();
  const rank = getPlayRank();
  const theme = getResultTheme(rank);
  const song = App.songs[App.selectedSong];

  drawResultBackdrop(stage, sheet, theme);

  drawText(getFittedText(song.title, sheet.w - 48, 23, BOLD), sheet.x + sheet.w / 2, sheet.y + 18, {
    size: 23,
    alignH: CENTER,
    alignV: TOP,
    style: BOLD,
    fill: CAMP.ink,
    outline: [255, 244, 216],
    outlineWeight: 2,
  });
  drawText(getResultBadgeText(accuracy), sheet.x + sheet.w / 2, sheet.y + 48, {
    size: 17,
    alignH: CENTER,
    alignV: TOP,
    style: BOLD,
    fill: theme.accent,
    outline: CAMP.coal,
    outlineWeight: 3,
  });

  drawResultRank(stage, rank, theme);
  drawResultStats(stage, accuracy);
  drawResultLeaderboard(stage);
  drawResultActions(stage, theme);
}

/**
 * 결과 화면의 모든 UI가 들어가는 노란 시트 영역을 계산한다.
 */
function getResultSheetRect(stage) {
  return {
    x: stage.x + 14,
    y: stage.y + 24,
    w: stage.w - 28,
    h: stage.h - 44,
  };
}

/**
 * 결과 화면 뒤 배경과 큰 패널을 그린다.
 */
function drawResultBackdrop(stage, sheet, theme) {
  drawUiBackground(stage, { dim: 62 });
  drawCreamAssetPanel(sheet.x, sheet.y, sheet.w, sheet.h, {
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
  const sheet = getResultSheetRect(stage);
  const x = sheet.x + 28;
  const y = sheet.y + 76;
  const rankW = min(112, sheet.w * 0.31);
  const rankH = 128;
  const scoreX = x + rankW + 12;
  const scoreW = sheet.x + sheet.w - 28 - scoreX;

  drawBox(x, y, rankW, rankH, {
    fill: [255, 237, 197, 186],
    stroke: theme.accent,
    strokeWeight: 3,
    radius: 8,
  });
  noFill();
  stroke(theme.accent[0], theme.accent[1], theme.accent[2], 90);
  strokeWeight(3);
  rect(x + 10, y + 10, rankW - 20, rankH - 20, 8);

  drawText(rank, x + rankW / 2, y + 2, {
    size: 90,
    alignH: CENTER,
    alignV: TOP,
    style: BOLD,
    fill: theme.dim,
  });
  drawText(theme.title, x + rankW / 2, y + 102, {
    size: 14,
    alignH: CENTER,
    alignV: TOP,
    style: BOLD,
    fill: CAMP.ink,
  });

  drawBox(scoreX, y, scoreW, rankH, {
    fill: [45, 28, 23, 224],
    stroke: [255, 218, 156, 84],
    strokeWeight: 2,
    radius: 8,
  });
  drawText("SCORE", scoreX + 16, y + 18, {
    size: 14,
    alignH: LEFT,
    alignV: TOP,
    style: BOLD,
    fill: CAMP.creamDim,
  });
  drawText(getFittedText(Play.score, scoreW - 32, 31, BOLD), scoreX + 16, y + 40, {
    size: 31,
    alignH: LEFT,
    alignV: TOP,
    style: BOLD,
    fill: CAMP.cream,
    outline: CAMP.coal,
    outlineWeight: 3,
  });
  drawText(`BEST ${Play.maxCombo}`, scoreX + 16, y + 98, {
    size: 18,
    alignH: LEFT,
    alignV: TOP,
    style: BOLD,
    fill: theme.accent,
  });
}

/**
 * 점수, 정확도, 콤보, hit/miss 통계를 2x2 카드로 그린다.
 */
function drawResultStats(stage, accuracy) {
  const sheet = getResultSheetRect(stage);
  const stats = buildResultStats(accuracy);
  const x = sheet.x + 28;
  const y = sheet.y + 224;
  const gap = 9;
  const cellW = (sheet.w - 56 - gap) / 2;
  const cellH = 58;

  for (let i = 0; i < stats.length; i += 1) {
    const col = i % 2;
    const row = floor(i / 2);
    const cellX = x + col * (cellW + gap);
    const cellY = y + row * (cellH + gap);

    drawWoodPanel(cellX, cellY, cellW, cellH, { fillColor: [99, 57, 37], radius: 6 });
    drawText(stats[i][0], cellX + 12, cellY + 9, {
      size: 14,
      alignH: LEFT,
      alignV: TOP,
      fill: CAMP.creamDim,
    });
    drawText(getFittedText(stats[i][1], cellW - 24, 21, BOLD), cellX + 12, cellY + 28, {
      size: 21,
      alignH: LEFT,
      alignV: TOP,
      style: BOLD,
      fill: CAMP.cream,
      outline: CAMP.coal,
      outlineWeight: 2,
    });
  }
}
