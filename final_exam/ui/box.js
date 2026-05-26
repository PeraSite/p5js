/**
 * 채우기·테두리 옵션으로 사각형을 그린다.
 * @author 한채아
 * @param {number} x - 좌상단 x
 * @param {number} y - 좌상단 y
 * @param {number} w - 너비
 * @param {number} h - 높이
 * @param {object} [opts] - fill, stroke, strokeWeight, radius
 */
function drawBox(x, y, w, h, opts = {}) {
  const {
    fill: fillColor = 255,
    stroke: strokeColor,
    strokeWeight: weight = 1.5,
    radius = 0,
  } = opts;

  push();
  if (fillColor === false) noFill();
  else fill(fillColor);
  if (strokeColor === undefined) noStroke();
  else {
    stroke(strokeColor);
    strokeWeight(weight);
  }
  rect(x, y, w, h, radius);
  pop();
}
