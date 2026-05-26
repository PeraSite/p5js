/**
 * 스테이지 중앙에 메시지를 그린다.
 * @author 한채아
 * @param {object} stage - stageRect() 결과 (x, y, w, h)
 * @param {string} message - 표시할 문자열
 */
function drawCenterText(stage, message) {
  noStroke();
  fill(255);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(22);
  text(message, stage.x + stage.w / 2, stage.y + stage.h / 2);
}
