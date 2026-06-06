/**
 * 스타일 옵션을 적용해 텍스트를 그린다.
 * @param {string} content - 표시할 문자열
 * @param {number} x - x 좌표
 * @param {number} y - y 좌표
 * @param {object} [opts] - textSize, alignH, alignV, style, fill
 */
function drawText(content, x, y, opts = {}) {
  const {
    size = 16,
    alignH = CENTER,
    alignV = TOP,
    style = NORMAL,
    fill: fillColor = 255,
  } = opts;

  push();
  noStroke();
  fill(fillColor);
  textAlign(alignH, alignV);
  textStyle(style);
  textSize(size);
  text(content, x, y);
  pop();
}
