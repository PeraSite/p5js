/**
 * 플레이 중 상단 HUD(곡명·점수·콤보·판정)를 그린다.
 * @author 한채아
 */
function drawPlayingScreen() {
  const stage = stageRect();
  const song = App.songs[App.selectedSong] || {};

  noStroke();
  fill(0, 0, 0, 168);
  rect(stage.x, stage.y, stage.w, 76);

  fill(255);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(18);
  text(song.title || "로딩 중", stage.x + 18, stage.y + 16);
  textStyle(NORMAL);
  textSize(12);
  fill(230);
  text(`SCORE ${Play.score}`, stage.x + 18, stage.y + 45);
  textAlign(RIGHT, TOP);
  text(`COMBO ${Play.combo}`, stage.x + stage.w - 18, stage.y + 45);

  if (Play.judge && millis() - Play.judgeAt < 520) {
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(28);
    fill(255);
    text(Play.judge, stage.x + stage.w / 2, hitLineY() - 64);
  }
}

/**
 * 플레이 중 얼굴 미감지 시 경고 문구를 그린다.
 * @author 한채아
 */
function drawFaceLostHint() {
  if (!Face.nose) drawCenterText(stageRect(), "FACE LOST");
}
