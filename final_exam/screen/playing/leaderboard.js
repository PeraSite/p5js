/**
 * 플레이 중 왼쪽에 보이는 실시간 리더보드 UI를 그린다.
 */
function drawPlayingLeaderboard(stage) {
  const rows = getCurrentLiveLeaderboardRows();
  const song = App.songs[App.selectedSong];
  const layout = getPlayingLeaderboardLayout(stage);

  if (rows.length === 0) {
    const failed = song && Leaderboard.loadFailedSongId === song.id;
    drawPlayingLeaderboardStatus(
      failed ? "RANKS OFFLINE" : "LOADING RANKS",
      layout.x,
      layout.y,
      layout.cardW,
      layout.cardH,
    );
    return;
  }

  for (let i = 0; i < rows.length; i += 1) {
    const entry = rows[i];
    const cardY = layout.y + i * layout.rowGap +
      getPlayingLeaderboardCardOffset(entry, layout.rowGap);
    drawPlayingLeaderboardCard(entry, layout.x, cardY, layout.cardW, layout.cardH);
  }
}

/**
 * 플레이 리더보드 카드들의 위치와 크기를 정한다.
 */
function getPlayingLeaderboardLayout(stage) {
  const cardH = 54;
  return {
    x: stage.x + 12,
    y: stage.y + 14,
    cardW: min(stage.w * 0.78, 292),
    cardH,
    rowGap: cardH + 7,
  };
}

/**
 * 순위가 오른 현재 플레이어 카드를 잠깐 위에서 내려오게 만든다.
 */
function getPlayingLeaderboardCardOffset(entry, rowGap) {
  if (!entry.current || Leaderboard.liveRankFrom === null) return 0;

  const age = millis() - Leaderboard.liveRankChangedAt;
  if (age < 0 || age > 620) return 0;

  const riseRows = constrain(Leaderboard.liveRankFrom - Leaderboard.liveRank, 0, 4);
  const t = constrain(age / 620, 0, 1);
  const eased = 1 - pow(1 - t, 3);
  return (1 - eased) * riseRows * rowGap;
}

/**
 * 리더보드 한 줄 카드에 순위, 이름, 점수를 그린다.
 */
function drawPlayingLeaderboardCard(entry, x, y, w, h) {
  const state = getPlayingLeaderboardCardState(entry);
  const rankW = 56;
  const dotSize = 11;
  const scoreX = x + w - 15;
  const nameX = x + rankW + 24;

  push();
  translate(x + w / 2, y + h / 2);
  scale(state.pulse);
  translate(-(x + w / 2), -(y + h / 2));
  applyPlayingLeaderboardShadow(state.active);

  drawBox(x, y, w, h, {
    fill: state.current ? [82, 45, 29, 244] : [25, 19, 19, 210],
    stroke: state.current ? [255, 190, 93, state.active ? 255 : 206] : [255, 218, 156, 74],
    strokeWeight: state.current ? 2 : 1.5,
    radius: 6,
  });

  drawText(`#${entry.displayRank}`, x + rankW / 2, y + h / 2, {
    size: 20,
    alignH: CENTER,
    alignV: CENTER,
    style: BOLD,
    fill: state.current ? CAMP.toast : CAMP.cream,
    outline: CAMP.coal,
    outlineWeight: 3,
  });

  drawPlayingLeaderboardDot(x + rankW + 9, y + h / 2, dotSize, state.current);
  drawText(getPlayingLeaderboardName(entry, w - 184), nameX, y + h / 2, {
    size: 19,
    alignH: LEFT,
    alignV: CENTER,
    style: BOLD,
    fill: CAMP.cream,
    outline: CAMP.coal,
    outlineWeight: 3,
  });
  drawText(formatLeaderboardScore(entry.score), scoreX, y + h / 2, {
    size: 19,
    alignH: RIGHT,
    alignV: CENTER,
    style: BOLD,
    fill: state.current ? CAMP.toast : CAMP.cream,
    outline: CAMP.coal,
    outlineWeight: 3,
  });
  pop();
}

/**
 * 현재 플레이어 카드의 강조 여부와 pulse 크기를 계산한다.
 */
function getPlayingLeaderboardCardState(entry) {
  const current = Boolean(entry.current);
  const age = millis() - Leaderboard.liveRankChangedAt;
  const active = current && age >= 0 && age < 620;
  return {
    current,
    active,
    pulse: active ? 1 + 0.025 * (1 - constrain(age / 620, 0, 1)) : 1,
  };
}

/**
 * 순위 상승 중인 카드에만 은은한 그림자를 적용한다.
 */
function applyPlayingLeaderboardShadow(active) {
  if (!active) return;

  drawingContext.shadowColor = "rgba(255, 210, 112, 0.32)";
  drawingContext.shadowBlur = 14;
}

/**
 * 리더보드 카드 안에서 플레이어 구분용 작은 점을 그린다.
 */
function drawPlayingLeaderboardDot(x, y, size, current) {
  push();
  noStroke();
  fill(current ? CAMP.toast : [172, 133, 88]);
  circle(x, y, size);
  pop();
}

/**
 * 순위를 불러오는 중이거나 실패했을 때 상태 카드를 그린다.
 */
function drawPlayingLeaderboardStatus(label, x, y, w, h) {
  drawBox(x, y, w, h, {
    fill: [25, 19, 19, 194],
    stroke: [255, 218, 156, 58],
    strokeWeight: 1.5,
    radius: 6,
  });
  drawText(label, x + 14, y + h / 2, {
    size: 20,
    alignH: LEFT,
    alignV: CENTER,
    style: BOLD,
    fill: CAMP.cream,
    outline: CAMP.coal,
    outlineWeight: 3,
  });
}

/**
 * 현재 플레이어는 YOU로, 다른 기록은 닉네임으로 표시한다.
 */
function getPlayingLeaderboardName(entry, maxW) {
  const name = entry.current ? "YOU" : String(entry.nickname || "PLAYER");
  return truncatePlayingLeaderboardText(name, maxW);
}

/**
 * 카드 너비를 넘는 이름은 끝을 줄여서 표시한다.
 */
function truncatePlayingLeaderboardText(value, maxW) {
  let output = String(value || "");
  push();
  textSize(19);
  while (output.length > 1 && textWidth(output) > maxW) {
    output = output.slice(0, -2) + ".";
  }
  pop();
  return output;
}

/**
 * 큰 점수를 1,000처럼 쉼표가 있는 문자열로 바꾼다.
 */
function formatLeaderboardScore(score) {
  return String(Math.floor(Number(score || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
