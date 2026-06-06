/**
 * 플레이 결과 점수·등급과 재시도·곡 선택 버튼 화면을 그린다.
 * @author 한채아
 */
function drawResultScreen() {
  const stage = stageRect();
  const accuracy = playAccuracy();
  const rank = playRank();
  const theme = resultTheme(rank);
  const song = App.songs[App.selectedSong];
  prepareLeaderboardForResult();

  drawResultBackdrop(stage, theme);

  drawText(song.title, stage.x + stage.w / 2, stage.y + 30, {
    size: 18,
    alignH: CENTER,
    alignV: TOP,
    style: BOLD,
    fill: [245, 245, 245],
  });
  drawText(resultBadgeText(accuracy), stage.x + stage.w / 2, stage.y + 58, {
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
 * 랭크별 색상과 문구를 반환한다.
 * @author 정제훈
 * @param {string} rank - 결과 랭크
 * @returns {{ accent: number[], dim: number[], title: string }}
 */
function resultTheme(rank) {
  const themes = {
    S: {
      accent: [255, 232, 130],
      dim: [74, 58, 18],
      title: "GOLDEN ROAST",
    },
    A: {
      accent: [255, 188, 118],
      dim: [80, 42, 18],
      title: "TOASTY RUN",
    },
    B: {
      accent: [168, 242, 185],
      dim: [24, 68, 42],
      title: "WARM BATCH",
    },
    C: {
      accent: [255, 132, 146],
      dim: [86, 26, 36],
      title: "BURNT EDGE",
    },
  };
  return themes[rank] ?? themes.C;
}

/**
 * 결과 성과에 맞는 짧은 배지 문구를 만든다.
 * @author 정제훈
 * @param {number} accuracy - 정확도
 * @returns {string} 배지 문구
 */
function resultBadgeText(accuracy) {
  if (Play.misses === 0 && Play.hits > 0) return "NO BURNS";
  if (accuracy >= 98) return "MELLOW MASTER";
  if (Play.maxCombo >= 30) return "SKEWER STREAK";
  if (accuracy >= 85) return "CAMPFIRE CLEAR";
  return "MORE ROASTING";
}

/**
 * 결과 화면의 절제된 랭크 컬러 배경을 그린다.
 * @author 정제훈
 * @param {{ x: number, y: number, w: number, h: number }} stage - 스테이지 영역
 * @param {object} theme - 랭크 테마
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
 * 배경에 작은 불꽃과 별 마크를 배치한다. 정적 장식이라 산만하지 않다.
 * @author 정제훈
 * @param {{ x: number, y: number, w: number, h: number }} stage - 스테이지 영역
 * @param {object} theme - 랭크 테마
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
 * 큰 랭크와 클리어 문구를 중심 비주얼로 그린다.
 * @author 정제훈
 * @param {{ x: number, y: number, w: number, h: number }} stage - 스테이지 영역
 * @param {string} rank - 결과 랭크
 * @param {object} theme - 랭크 테마
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
 * 점수·정확도·콤보·히트 정보를 2x2 스탯으로 정리한다.
 * @author 정제훈
 * @param {{ x: number, y: number, w: number, h: number }} stage - 스테이지 영역
 * @param {number} accuracy - 정확도
 */
function drawResultStats(stage, accuracy) {
  const stats = [
    ["SCORE", String(Play.score)],
    ["ACCURACY", `${accuracy.toFixed(1)}%`],
    ["BEST STREAK", String(Play.maxCombo)],
    ["ROAST / BURN", `${Play.hits} / ${Play.misses}`],
  ];
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

/**
 * 이름 입력과 TOP 5 리더보드를 아래 영역에 간결하게 그린다.
 * @author 정제훈
 * @param {{ x: number, y: number, w: number, h: number }} stage - 스테이지 영역
 */
function drawResultLeaderboard(stage) {
  const x = stage.x + 44;
  const y = stage.y + 430;

  drawText("LEADERBOARD", x, y, {
    size: 13,
    alignH: LEFT,
    alignV: TOP,
    style: BOLD,
    fill: CAMP.cream,
  });

  drawText("NAME", x, y + 28, {
    size: 10,
    alignH: LEFT,
    alignV: TOP,
    fill: CAMP.creamDim,
  });
  drawText(leaderboardNameDisplay(Leaderboard.name), x + 52, y + 24, {
    size: 16,
    alignH: LEFT,
    alignV: TOP,
    style: BOLD,
    fill: CAMP.cream,
  });

  drawResultSmallButton(
    Leaderboard.submitted ? "SAVED" : "SUBMIT",
    stage.x + stage.w - 132,
    y + 16,
    90,
    34,
    canSubmitLeaderboardScore(),
    () => submitCurrentLeaderboardScore(),
  );

  const listY = y + 62;

  if (Leaderboard.loading && Leaderboard.entries.length === 0) {
    drawText("LOADING", x, listY, { size: 12, alignH: LEFT, alignV: TOP });
  } else if (Leaderboard.entries.length === 0) {
    drawText("NO RECORDS", x, listY, { size: 12, alignH: LEFT, alignV: TOP });
  } else {
    for (let i = 0; i < min(Leaderboard.entries.length, 4); i += 1) {
      const entry = Leaderboard.entries[i];
      const rowY = listY + i * 21;
      drawText(`${i + 1}. ${entry.nickname}`, x, rowY, {
        size: 12,
        alignH: LEFT,
        alignV: TOP,
        fill: CAMP.creamDim,
      });
      drawText(
        `${entry.score}  ${Number(entry.accuracy).toFixed(1)}%`,
        stage.x + stage.w - 44,
        rowY,
        { size: 12, alignH: RIGHT, alignV: TOP, fill: CAMP.creamDim },
      );
    }
  }
}

/**
 * 결과 화면 하단 액션 버튼을 그린다.
 * @author 정제훈
 * @param {{ x: number, y: number, w: number, h: number }} stage - 스테이지 영역
 * @param {object} theme - 랭크 테마
 */
function drawResultActions(stage, theme) {
  const buttonW = (stage.w - 76) / 2;
  drawResultActionButton(
    "RETRY",
    stage.x + 28,
    stage.y + stage.h - 96,
    buttonW,
    54,
    theme,
    true,
    true,
    () => {
      resetGame();
      App.state = "howTo";
    },
  );
  drawResultActionButton(
    "SONG",
    stage.x + 48 + buttonW,
    stage.y + stage.h - 96,
    buttonW,
    54,
    theme,
    false,
    true,
    () => {
      resetGame();
      App.state = "songSelect";
    },
  );
}

/**
 * 주 액션 버튼과 보조 액션 버튼을 랭크 테마에 맞춰 그린다.
 * @author 정제훈
 * @param {string} label - 버튼 문구
 * @param {number} x - 좌상단 x
 * @param {number} y - 좌상단 y
 * @param {number} w - 너비
 * @param {number} h - 높이
 * @param {object} theme - 랭크 테마
 * @param {boolean} primary - 주 버튼 여부
 * @param {boolean} enabled - 활성 여부
 * @param {() => void} onClick - 클릭 시 실행 함수
 */
function drawResultActionButton(label, x, y, w, h, theme, primary, enabled, onClick) {
  drawWoodPanel(x, y, w, h, {
    selected: primary && enabled,
    fillColor: primary ? CAMP.woodLight : [92, 56, 38],
    radius: 7,
  });
  drawText(label, x + w / 2, y + h / 2, {
    size: 18,
    alignH: CENTER,
    alignV: CENTER,
    style: BOLD,
    fill: enabled ? CAMP.cream : [130, 110, 92],
  });
  registerButton(x, y, w, h, enabled, onClick);
}

/**
 * 리더보드 제출용 소형 버튼을 그린다.
 * @author 정제훈
 * @param {string} label - 버튼 문구
 * @param {number} x - 좌상단 x
 * @param {number} y - 좌상단 y
 * @param {number} w - 너비
 * @param {number} h - 높이
 * @param {boolean} enabled - 활성 여부
 * @param {() => void} onClick - 클릭 시 실행 함수
 */
function drawResultSmallButton(label, x, y, w, h, enabled, onClick) {
  drawCreamPanel(x, y, w, h, { selected: enabled, radius: 6 });
  drawText(label, x + w / 2, y + h / 2, {
    size: 12,
    alignH: CENTER,
    alignV: CENTER,
    style: BOLD,
    fill: enabled ? CAMP.ink : [130, 110, 92],
  });
  registerButton(x, y, w, h, enabled, onClick);
}
