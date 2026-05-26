/**
 * 플레이 중 상단 HUD(곡명·점수·콤보·판정)를 그린다.
 * @author 한채아
 */
function drawPlayingScreen() {
  updateNotes();
  drawCamera();
  drawPlayfield();

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
    drawText(Play.judge, stage.x + stage.w / 2, hitY - 64, {
      size: 28,
      alignH: CENTER,
      alignV: CENTER,
      style: BOLD,
    });
  }

  if (!Face.nose) {
    drawText("FACE LOST", stage.x + stage.w / 2, stage.y + stage.h / 2, {
      size: 22,
      alignH: CENTER,
      alignV: CENTER,
      style: BOLD,
    });
  }
}
