/**
 * 결과 화면의 이름 입력과 리더보드 목록을 그린다.
 */
function drawResultLeaderboard(stage) {
  const layout = getResultLeaderboardLayout(stage);

  drawText("LEADERBOARD", layout.x, layout.y, {
    size: 13,
    alignH: LEFT,
    alignV: TOP,
    style: BOLD,
    fill: CAMP.cream,
  });

  drawResultNameInput(layout.x, layout.y + 24);
  drawResultSmallButton(
    Leaderboard.submitted ? "SAVED" : "SUBMIT",
    stage.x + stage.w - 132,
    layout.y + 16,
    90,
    34,
    canSubmitLeaderboardScore(),
    () => submitCurrentLeaderboardScore(),
  );
  drawResultLeaderboardRows(stage, layout.listY);
}

/**
 * 결과 리더보드 영역의 기준 좌표를 정한다.
 */
function getResultLeaderboardLayout(stage) {
  const x = stage.x + 44;
  const y = stage.y + 430;
  return { x, y, listY: y + 62 };
}

/**
 * 이름 입력 상태를 NAME 라벨과 함께 그린다.
 */
function drawResultNameInput(x, y) {
  drawText("NAME", x, y + 4, {
    size: 10,
    alignH: LEFT,
    alignV: TOP,
    fill: CAMP.creamDim,
  });
  drawText(formatLeaderboardNameInput(Leaderboard.name), x + 52, y, {
    size: 16,
    alignH: LEFT,
    alignV: TOP,
    style: BOLD,
    fill: CAMP.cream,
  });
}

/**
 * 로딩, 빈 기록, 실제 기록 목록 중 알맞은 내용을 그린다.
 */
function drawResultLeaderboardRows(stage, y) {
  const x = stage.x + 44;
  if (Leaderboard.loading && Leaderboard.entries.length === 0) {
    drawResultLeaderboardStatus("LOADING", x, y);
    return;
  }
  if (Leaderboard.entries.length === 0) {
    drawResultLeaderboardStatus("NO RECORDS", x, y);
    return;
  }

  for (let i = 0; i < min(Leaderboard.entries.length, 4); i += 1) {
    drawResultLeaderboardRow(Leaderboard.entries[i], i + 1, x, y + i * 21, stage);
  }
}

/**
 * LOADING이나 NO RECORDS 같은 짧은 상태 문구를 그린다.
 */
function drawResultLeaderboardStatus(label, x, y) {
  drawText(label, x, y, { size: 12, alignH: LEFT, alignV: TOP });
}

/**
 * 결과 리더보드의 기록 한 줄을 그린다.
 */
function drawResultLeaderboardRow(entry, rank, x, y, stage) {
  drawText(`${rank}. ${entry.nickname}`, x, y, {
    size: 12,
    alignH: LEFT,
    alignV: TOP,
    fill: CAMP.creamDim,
  });
  drawText(
    `${entry.score}  ${Number(entry.accuracy).toFixed(1)}%`,
    stage.x + stage.w - 44,
    y,
    { size: 12, alignH: RIGHT, alignV: TOP, fill: CAMP.creamDim },
  );
}
