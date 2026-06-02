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
      fill: noteColor(note),
    });
  }

  for (const nose of Face.noses) {
    noFill();
    stroke(255);
    strokeWeight(3);
    circle(nose.x, nose.y, GAME_CONFIG.noseRadius * 2);
    noStroke();
    fill(255);
    circle(nose.x, nose.y, 7);
  }
}

/**
 * 드럼이 있으면 드럼 색을 우선하고, 아니면 피아노 색을 반환한다.
 * @author 정제훈
 * @param {object} note - Play.notes 항목
 * @returns {number[]} p5 fill 색상
 */
function noteColor(note) {
  if (note.drum && GAME_CONFIG.noteColors[note.drum]) {
    return GAME_CONFIG.noteColors[note.drum];
  }
  return GAME_CONFIG.noteColors.piano;
}
