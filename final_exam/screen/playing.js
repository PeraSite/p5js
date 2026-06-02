/**
 * 플레이 중 상단 HUD(곡명·점수·콤보·판정)를 그린다.
 * @author 한채아
 */
function drawPlayingScreen() {
  updateNotes();
  prepareLeaderboardForPlaying();
  const shake = playingShakeOffset();
  push();
  translate(shake.x, shake.y);
  drawCamera();
  drawPlayfield();
  pop();

  const stage = stageRect();
  const hitY = stage.y + stage.h * GAME_CONFIG.hitLineY;

  drawPlayingLeaderboard(stage);
  drawPlayingBottomHud(stage);

  if (Play.judge && millis() - Play.judgeAt < 520) {
    const judgeAge = millis() - Play.judgeAt;
    const judgePop = 1 + 0.24 * (1 - constrain(judgeAge / 180, 0, 1));
    drawText(Play.judge, stage.x + stage.w / 2, hitY - 64, {
      size: 28 * judgePop,
      alignH: CENTER,
      alignV: CENTER,
      style: BOLD,
      fill: judgeColor(Play.judge),
    });
    drawText(`COMBO ${Play.combo}`, stage.x + stage.w / 2, hitY - 30, {
      size: 16 * judgePop,
      alignH: CENTER,
      alignV: CENTER,
      style: BOLD,
      fill: [245, 245, 245],
    });
  }

  if (Face.noses.length === 0) {
    drawText("FACE LOST", stage.x + stage.w / 2, stage.y + stage.h / 2, {
      size: 22,
      alignH: CENTER,
      alignV: CENTER,
      style: BOLD,
    });
  }
}

function drawPlayingBottomHud(stage) {
  const hudH = 64;
  const hudY = stage.y + stage.h - hudH;
  drawBox(stage.x, hudY, stage.w, hudH, { fill: [0, 0, 0, 154] });

  drawText(`SCORE ${Play.score}`, stage.x + stage.w / 2, hudY + hudH / 2, {
    size: 24,
    alignH: CENTER,
    alignV: CENTER,
    style: BOLD,
    fill: [245, 245, 245],
  });
}

function drawPlayingLeaderboard(stage) {
  const rows = currentLiveLeaderboardRows();
  const song = App.songs[App.selectedSong];
  const cardW = min(stage.w * 0.72, 268);
  const cardH = 34;
  const rowGap = cardH + 4;
  const x = stage.x + 12;
  const y = stage.y + 12;

  if (rows.length === 0) {
    const failed = song && Leaderboard.loadFailedSongId === song.id;
    drawPlayingLeaderboardStatus(
      failed ? "RANKS OFFLINE" : "LOADING RANKS",
      x,
      y,
      cardW,
      cardH,
    );
    return;
  }

  for (let i = 0; i < rows.length; i += 1) {
    const entry = rows[i];
    const cardY = y + i * rowGap + playingLeaderboardCardOffset(entry, rowGap);
    drawPlayingLeaderboardCard(entry, x, cardY, cardW, cardH);
  }
}

function playingLeaderboardCardOffset(entry, rowGap) {
  if (!entry.current || Leaderboard.liveRankFrom === null) return 0;

  const age = millis() - Leaderboard.liveRankChangedAt;
  if (age < 0 || age > 620) return 0;

  const riseRows = constrain(Leaderboard.liveRankFrom - Leaderboard.liveRank, 0, 4);
  const t = constrain(age / 620, 0, 1);
  const eased = 1 - pow(1 - t, 3);
  return (1 - eased) * riseRows * rowGap;
}

function drawPlayingLeaderboardCard(entry, x, y, w, h) {
  const current = Boolean(entry.current);
  const age = millis() - Leaderboard.liveRankChangedAt;
  const active = current && age >= 0 && age < 620;
  const pulse = active ? 1 + 0.025 * (1 - constrain(age / 620, 0, 1)) : 1;
  const rankW = 42;
  const dotSize = 7;
  const scoreX = x + w - 11;
  const nameX = x + rankW + 20;

  push();
  translate(x + w / 2, y + h / 2);
  scale(pulse);
  translate(-(x + w / 2), -(y + h / 2));

  if (active) {
    drawingContext.shadowColor = "rgba(255, 245, 176, 0.24)";
    drawingContext.shadowBlur = 10;
  }

  drawBox(x, y, w, h, {
    fill: current ? [0, 0, 0, 184] : [0, 0, 0, 116],
    stroke: current ? [255, 245, 176, active ? 230 : 150] : [255, 255, 255, 32],
    strokeWeight: current ? 1.3 : 1,
    radius: 6,
  });

  drawText(`#${entry.displayRank}`, x + rankW / 2, y + h / 2, {
    size: 12,
    alignH: CENTER,
    alignV: CENTER,
    style: BOLD,
    fill: current ? [255, 245, 176] : [218, 222, 228],
  });

  push();
  noStroke();
  fill(current ? [255, 245, 176] : [150, 158, 168]);
  circle(x + rankW + 9, y + h / 2, dotSize);
  pop();

  drawText(playingLeaderboardName(entry, w - 144), nameX, y + h / 2, {
    size: 12,
    alignH: LEFT,
    alignV: CENTER,
    style: BOLD,
    fill: current ? [255, 255, 255] : [224, 228, 234],
  });
  drawText(formatLeaderboardScore(entry.score), scoreX, y + h / 2, {
    size: 12,
    alignH: RIGHT,
    alignV: CENTER,
    style: BOLD,
    fill: current ? [255, 245, 176] : [238, 240, 244],
  });
  pop();
}

function drawPlayingLeaderboardStatus(label, x, y, w, h) {
  drawBox(x, y, w, h, {
    fill: [0, 0, 0, 132],
    stroke: [255, 255, 255, 30],
    strokeWeight: 1,
    radius: 6,
  });
  drawText(label, x + 14, y + h / 2, {
    size: 12,
    alignH: LEFT,
    alignV: CENTER,
    style: BOLD,
    fill: [210, 214, 220],
  });
}

function playingLeaderboardName(entry, maxW) {
  const name = entry.current ? "YOU" : String(entry.nickname || "PLAYER");
  return truncatePlayingLeaderboardText(name, maxW);
}

function truncatePlayingLeaderboardText(value, maxW) {
  let output = String(value || "");
  push();
  textSize(12);
  while (output.length > 1 && textWidth(output) > maxW) {
    output = output.slice(0, -2) + ".";
  }
  pop();
  return output;
}

function formatLeaderboardScore(score) {
  return String(Math.floor(Number(score || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * 히트 직후 짧은 화면 펀치 흔들림을 계산한다.
 * @author 정제훈
 * @returns {{ x: number, y: number }} 이번 프레임 흔들림 거리
 */
function playingShakeOffset() {
  const age = millis() - Play.shakeAt;
  if (age > 120 || Play.shakePower <= 0) return { x: 0, y: 0 };
  const fade = 1 - age / 120;
  const amount = Play.shakePower * fade;
  return {
    x: random(-amount, amount),
    y: random(-amount, amount),
  };
}

/**
 * 판정 텍스트 색을 판정 종류에 맞춘다.
 * @author 정제훈
 * @param {string} judge - 판정 라벨
 * @returns {number[]} p5 fill 색상
 */
function judgeColor(judge) {
  if (judge === "MISS") return [255, 96, 110];
  if (judge === "EXCELLENT") return [255, 245, 176];
  if (judge === "GREAT") return [180, 225, 255];
  if (judge === "GOOD") return [214, 255, 205];
  if (judge === "BAD") return [210, 210, 210];
  return [255, 255, 255];
}
