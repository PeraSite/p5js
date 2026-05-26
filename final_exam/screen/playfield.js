/**
 * 플레이 중 판정선·낙하 노트·코 커서를 캔버스에 그린다.
 * @author 한채아
 */
function drawPlayfield() {
  const stage = stageRect();
  const lineY = stage.y + stage.h * GAME_CONFIG.hitLineY;

  stroke(180, 180, 180, 125);
  strokeWeight(10);
  line(stage.x, lineY, stage.x + stage.w, lineY);
  stroke(255, 255, 255, 170);
  strokeWeight(1);
  line(stage.x, lineY, stage.x + stage.w, lineY);

  for (const note of Play.notes) {
    if (note.hit || note.missed) continue;
    const pos = notePosition(note);
    if (!pos.visible) continue;
    drawText("♪", pos.x, pos.y, {
      size: GAME_CONFIG.noteSize,
      alignH: CENTER,
      alignV: CENTER,
      style: BOLD,
    });
  }

  if (Face.nose) {
    noFill();
    stroke(255);
    strokeWeight(3);
    circle(Face.nose.x, Face.nose.y, GAME_CONFIG.noseRadius * 2);
    noStroke();
    fill(255);
    circle(Face.nose.x, Face.nose.y, 7);
  }
}
