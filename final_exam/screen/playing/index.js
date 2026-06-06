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

  drawPlayingLeaderboard(stage);

  if (Play.judge && millis() - Play.judgeAt < 520) {
    const hitY = stage.y + stage.h * GAME_CONFIG.hitLineY;
    const judgeAge = millis() - Play.judgeAt;
    const judgePop = 1 + 0.24 * (1 - constrain(judgeAge / 180, 0, 1));
    drawText(Play.judge, stage.x + stage.w / 2, hitY + 34, {
      size: 32 * judgePop,
      alignH: CENTER,
      alignV: CENTER,
      style: BOLD,
      fill: getJudgeColor(Play.judge),
      outline: CAMP.coal,
      outlineWeight: 4,
    });
    drawText(`COMBO ${Play.combo}`, stage.x + stage.w / 2, hitY + 66, {
      size: 24 * judgePop,
      alignH: CENTER,
      alignV: CENTER,
      style: BOLD,
      fill: [245, 245, 245],
      outline: CAMP.coal,
      outlineWeight: 4,
    });
  }

  if (Face.noses.length === 0) {
    drawCreamPanel(stage.x + 28, stage.y + stage.h / 2 - 34, stage.w - 56, 68, {
      selected: true,
    });
    drawText("WHERE'S THE SKEWER?", stage.x + stage.w / 2, stage.y + stage.h / 2, {
      size: 28,
      alignH: CENTER,
      alignV: CENTER,
      style: BOLD,
      fill: CAMP.ink,
    });
  }
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
