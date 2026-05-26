/**
 * 캔버스 안 9:16 플레이 스테이지의 위치와 크기를 계산한다.
 * @author 정제훈
 * @returns {{ x: number, y: number, w: number, h: number }} 스테이지 영역
 */
function stageRect() {
  const ratio = width / height;
  let w = width;
  let h = height;
  if (ratio > GAME_CONFIG.stageRatio) w = h * GAME_CONFIG.stageRatio;
  else h = w / GAME_CONFIG.stageRatio;
  return { x: (width - w) / 2, y: (height - h) / 2, w, h };
}

/**
 * 노트 판정선의 캔버스 Y 좌표를 계산한다.
 * @author 정제훈
 * @returns {number} 판정선 y (픽셀)
 */
function hitLineY() {
  const stage = stageRect();
  return stage.y + stage.h * GAME_CONFIG.hitLineY;
}
