/**
 * 플레이 중 상단 HUD(곡명·점수·콤보·판정)를 그린다.
 * @author 한채아
 */
function drawPlayingScreen() {
  updateNotes();
  const shake = playingShakeOffset();
  push();
  translate(shake.x, shake.y);
  drawCamera();
  drawPlayfield();
  pop();

  const stage = stageRect();
  const song = App.songs[App.selectedSong];
  const hitY = stage.y + stage.h * GAME_CONFIG.hitLineY;

  drawBox(stage.x, stage.y, stage.w, 76, { fill: [0, 0, 0, 168] });

  drawText(song.title, stage.x + 18, stage.y + 16, {
    size: 18,
    alignH: LEFT,
    alignV: TOP,
    style: BOLD,
  });
  drawText(`SCORE ${Play.score}`, stage.x + 18, stage.y + 45, {
    size: 12,
    alignH: LEFT,
    alignV: TOP,
    fill: 230,
  });
  drawText(`COMBO ${Play.combo}`, stage.x + stage.w - 18, stage.y + 45, {
    size: 12,
    alignH: RIGHT,
    alignV: TOP,
    fill: 230,
  });

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
