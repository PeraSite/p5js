/**
 * 결과 화면의 이름 입력과 리더보드 목록을 그린다.
 */
function drawResultLeaderboard(stage) {
  const layout = getResultLeaderboardLayout(stage);

  drawBox(layout.x, layout.y, layout.w, layout.h, {
    fill: [43, 27, 24, 224],
    stroke: [255, 218, 156, 78],
    strokeWeight: 2,
    radius: 8,
  });
  drawText("LEADERBOARD", layout.x + 14, layout.y + 12, {
    size: 19,
    alignH: LEFT,
    alignV: TOP,
    style: BOLD,
    fill: CAMP.cream,
    outline: CAMP.coal,
    outlineWeight: 2,
  });

  drawResultNameInput(layout.x + 14, layout.y + 38, layout.w - 142);
  drawResultSmallButton(
    Leaderboard.submitted ? "SAVED" : "SUBMIT",
    layout.x + layout.w - 116,
    layout.y + 36,
    100,
    44,
    canSubmitLeaderboardScore(),
    () => submitCurrentLeaderboardScore(),
  );
  drawResultLeaderboardRows(stage, layout);
}

/**
 * 결과 리더보드 영역의 기준 좌표를 정한다.
 */
function getResultLeaderboardLayout(stage) {
  const sheet = getResultSheetRect(stage);
  const actionTop = sheet.y + sheet.h - 76;
  const x = sheet.x + 26;
  const y = sheet.y + 364;
  return {
    x,
    y,
    w: sheet.w - 52,
    h: actionTop - y - 12,
    listY: y + 76,
    rowH: 35,
    rowGap: 5,
  };
}

/**
 * 이름 입력 상태를 NAME 라벨과 함께 그린다.
 */
function drawResultNameInput(x, y, w) {
  drawBox(x, y, w, 42, {
    fill: [28, 21, 19, 218],
    stroke: [255, 218, 156, 42],
    strokeWeight: 1.5,
    radius: 6,
  });
  drawText("NAME", x + 10, y + 14, {
    size: 12,
    alignH: LEFT,
    alignV: TOP,
    fill: CAMP.creamDim,
  });
  drawText(formatLeaderboardNameInput(Leaderboard.name), x + 66, y + 9, {
    size: 20,
    alignH: LEFT,
    alignV: TOP,
    style: BOLD,
    fill: CAMP.cream,
    outline: CAMP.coal,
    outlineWeight: 2,
  });
}

/**
 * 로딩, 빈 기록, 실제 기록 목록 중 알맞은 내용을 그린다.
 */
function drawResultLeaderboardRows(stage, layout) {
  const x = layout.x + 14;
  const y = layout.listY;
  if (Leaderboard.loading && Leaderboard.entries.length === 0) {
    drawResultLeaderboardStatus("LOADING", x, y, layout.w - 28, layout.rowH);
    return;
  }
  if (Leaderboard.entries.length === 0) {
    drawResultLeaderboardStatus("NO RECORDS", x, y, layout.w - 28, layout.rowH);
    return;
  }

  for (let i = 0; i < min(Leaderboard.entries.length, 3); i += 1) {
    const rowY = y + i * (layout.rowH + layout.rowGap);
    drawResultLeaderboardRow(Leaderboard.entries[i], i + 1, x, rowY, layout);
  }
}

/**
 * LOADING이나 NO RECORDS 같은 짧은 상태 문구를 그린다.
 */
function drawResultLeaderboardStatus(label, x, y, w, h) {
  drawBox(x, y, w, h, {
    fill: [28, 21, 19, 180],
    stroke: [255, 218, 156, 34],
    strokeWeight: 1,
    radius: 6,
  });
  drawText(label, x + 12, y + h / 2, {
    size: 17,
    alignH: LEFT,
    alignV: CENTER,
    style: BOLD,
    fill: CAMP.cream,
    outline: CAMP.coal,
    outlineWeight: 2,
  });
}

/**
 * 결과 리더보드의 기록 한 줄을 그린다.
 */
function drawResultLeaderboardRow(entry, rank, x, y, layout) {
  const w = layout.w - 28;
  const medal = rank <= 3;
  const scoreLabel = `${entry.score}  ${Number(entry.accuracy).toFixed(1)}%`;
  const scoreW = min(126, w * 0.34);
  const rankW = 48;
  const nameX = x + rankW + 16;
  const nameW = w - rankW - scoreW - 34;
  drawBox(x, y, w, layout.rowH, {
    fill: medal ? [80, 45, 28, 218] : [28, 21, 19, 190],
    stroke: medal ? [255, 190, 93, 92] : [255, 218, 156, 32],
    strokeWeight: 1.5,
    radius: 6,
  });
  drawText(`#${rank}`, x + 12, y + layout.rowH / 2, {
    size: 18,
    alignH: LEFT,
    alignV: CENTER,
    style: BOLD,
    fill: medal ? CAMP.toast : CAMP.creamDim,
    outline: CAMP.coal,
    outlineWeight: 2,
  });
  drawText(getFittedText(entry.nickname || "PLAYER", nameW, 16, BOLD), nameX, y + layout.rowH / 2, {
    size: 16,
    alignH: LEFT,
    alignV: CENTER,
    style: BOLD,
    fill: CAMP.cream,
    outline: CAMP.coal,
    outlineWeight: 2,
  });
  drawText(getFittedText(scoreLabel, scoreW, 14, BOLD), x + w - 12, y + layout.rowH / 2, {
    size: 14,
    alignH: RIGHT,
    alignV: CENTER,
    style: BOLD,
    fill: CAMP.toast,
    outline: CAMP.coal,
    outlineWeight: 2,
  });
}
