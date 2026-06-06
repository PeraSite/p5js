/**
 * 노트의 화면 위치와 꼬치 충돌 계산을 담당한다.
 */
function getNoteDelta(note) {
  return Play.gameTime - note.time;
}

/**
 * 현재 게임 시간 기준으로 노트의 x/y 위치와 표시 여부를 계산한다.
 */
function getNotePosition(note) {
  const stage = getStageRect();
  const hitY = stage.y + stage.h * GAME_CONFIG.hitLineY;
  const startY = stage.y - GAME_CONFIG.noteSize;
  const endY = stage.y + stage.h + GAME_CONFIG.noteSize;
  const delta = getNoteDelta(note);
  const before = getNoteApproachProgress(note);
  const after = delta / GAME_CONFIG.fallAwayTime;

  return {
    x: stage.x + stage.w * getNoteLaneX(note),
    y: delta <= 0 ? lerp(startY, hitY, before) : lerp(hitY, endY, after),
    visible: before >= 0 && after <= 1,
  };
}

/**
 * 채보의 0~1 lane 값을 실제 스테이지 안 x 비율로 바꾼다.
 */
function getNoteLaneX(note) {
  return lerp(0.2, 0.8, constrain(note.x, 0, 1));
}

/**
 * 노트가 시작 위치에서 판정선까지 얼마나 내려왔는지 계산한다.
 */
function getNoteApproachProgress(note) {
  return (
    (Play.gameTime - (note.time - GAME_CONFIG.approachTime)) /
    GAME_CONFIG.approachTime
  );
}

/**
 * 꼬치 끝이 노트를 정확히 찌른 상황인지 확인한다.
 */
function rodTipTouchesNote(nose, pos) {
  const xOk = abs(pos.x - nose.x) <= GAME_CONFIG.noteSize * 0.38;
  const yOk =
    pos.y >= nose.y - 2 &&
    pos.y <= nose.y + GAME_CONFIG.noteSize * 0.46;
  return xOk && yOk;
}

/**
 * 꼬치 옆면에 닿은 실패 상황인지 확인한다.
 */
function rodBodyTouchesNote(nose, pos) {
  const stage = getStageRect();
  const fireTop = stage.y + stage.h - GAME_CONFIG.fireHeight;
  const nearRodX = abs(pos.x - nose.x) <
    GAME_CONFIG.rodWidth * 0.5 + GAME_CONFIG.noteSize * 0.36;
  const belowTip = pos.y > nose.y + GAME_CONFIG.rodTipRadius;
  const aboveFire = pos.y < fireTop + GAME_CONFIG.noteSize * 0.25;
  return nearRodX && belowTip && aboveFire;
}

/**
 * 노트에 연결된 악기 종류로 마시멜로 색을 정한다.
 */
function getMarshmallowColorForNote(note) {
  if (note.drum === "hihat") return "blue";
  if (note.drum === "kick" || note.drum === "snare") return "red";
  return "white";
}

/**
 * 현재 타이밍에 따라 raw, roasted, burnt 중 하나를 정한다.
 */
function getMarshmallowCookState(note) {
  const delta = getNoteDelta(note);
  if (delta > 0) return "burnt";
  if (abs(delta) <= getLargestJudgeWindow()) return "roasted";
  return "raw";
}
