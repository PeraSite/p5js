/**
 * 스타일 옵션을 적용해 텍스트를 그린다.
 * @param {string} content - 표시할 문자열
 * @param {number} x - x 좌표
 * @param {number} y - y 좌표
 * @param {object} [opts] - textSize, alignH, alignV, style, fill, outline, outlineWeight
 */
function drawText(content, x, y, opts = {}) {
  const {
    size = 16,
    alignH = CENTER,
    alignV = TOP,
    style = NORMAL,
    fill: fillColor = 255,
    outline = null,
    outlineWeight = 0,
  } = opts;

  push();
  textAlign(alignH, alignV);
  textStyle(style);
  textSize(size);
  if (outline && outlineWeight > 0) {
    stroke(outline);
    strokeWeight(outlineWeight);
    fill(fillColor);
    text(content, x, y);
  }
  noStroke();
  fill(fillColor);
  text(content, x, y);
  pop();
}

/**
 * 주어진 폭 안에 들어오도록 픽셀 폰트 문자열을 말줄임한다.
 */
function getFittedText(content, maxWidth, size = 16, style = NORMAL) {
  const label = String(content ?? "");
  if (maxWidth <= 0) return "";

  push();
  textStyle(style);
  textSize(size);
  if (textWidth(label) <= maxWidth) {
    pop();
    return label;
  }

  const ellipsis = "...";
  let fitted = label;
  while (fitted.length > 0 && textWidth(fitted + ellipsis) > maxWidth) {
    fitted = fitted.slice(0, -1);
  }
  pop();

  return fitted.length > 0 ? fitted + ellipsis : ellipsis;
}
