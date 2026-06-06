/**
 * 플레이 화면 전체를 그린다. 상태 갱신은 game/loop.js가 맡는다.
 */
function drawPlayingScreen() {
  const stage = getStageRect();
  const shake = getPlayingShakeOffset();

  push();
  translate(shake.x, shake.y);
  drawCamera();
  drawPlayfield();
  pop();

  const hitY = stage.y + stage.h * GAME_CONFIG.hitLineY;

  drawPlayingLeaderboard(stage);
  drawPlayingTopHud(stage);

  if (Play.judge && millis() - Play.judgeAt < 520) {
    const judgeAge = millis() - Play.judgeAt;
    const judgePop = 1 + 0.24 * (1 - constrain(judgeAge / 180, 0, 1));
    drawText(Play.judge, stage.x + stage.w / 2, hitY - 64, {
      size: 28 * judgePop,
      alignH: CENTER,
      alignV: CENTER,
      style: BOLD,
      fill: getJudgeColor(Play.judge),
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
    drawCreamPanel(stage.x + 44, stage.y + stage.h / 2 - 26, stage.w - 88, 52, {
      selected: true,
    });
    drawText("WHERE'S THE SKEWER?", stage.x + stage.w / 2, stage.y + stage.h / 2, {
      size: 22,
      alignH: CENTER,
      alignV: CENTER,
      style: BOLD,
      fill: CAMP.ink,
    });
  }
}

/**
 * 플레이 중 상단 점수 바를 그린다.
 */
function drawPlayingTopHud(stage) {
  const hudH = 54;
  const hudY = stage.y;
  drawBox(stage.x, hudY, stage.w, hudH, { fill: [47, 28, 22, 178] });
  drawBox(stage.x, hudY + hudH - 4, stage.w, 4, { fill: [255, 151, 66, 92] });

  drawText(`SCORE ${Play.score}`, stage.x + stage.w / 2, hudY + hudH / 2, {
    size: 19,
    alignH: CENTER,
    alignV: CENTER,
    style: BOLD,
    fill: CAMP.cream,
  });
}
/**
 * hit 직후 화면이 얼마나 흔들릴지 계산한다.
 */
function getPlayingShakeOffset() {
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
 * 판정 문구 종류에 맞는 글자색을 고른다.
 */
function getJudgeColor(judge) {
  if (judge.startsWith("POP")) return [255, 226, 120];
  if (judge === "BURNT") return [72, 58, 48];
  if (judge === "UNDER") return [255, 132, 146];
  if (judge === "MELLOW!") return [255, 245, 176];
  if (judge === "TOASTY") return [255, 188, 118];
  if (judge === "WARM") return [214, 255, 205];
  return [255, 255, 255];
}
