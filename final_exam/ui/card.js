/**
 * 선택 가능한 곡 카드를 그리고 클릭 영역을 등록한다.
 * @author 한채아
 * @param {number} x - 좌상단 x
 * @param {number} y - 좌상단 y
 * @param {number} w - 너비
 * @param {number} h - 높이
 * @param {boolean} selected - 선택 여부
 * @param {string} title - 곡 제목
 * @param {string} subtitle - 난이도·길이
 * @param {p5.Image?} thumbnail - 곡 썸네일 이미지
 * @param {() => void} onClick - 클릭 시 실행 함수
 */
function drawSelectableCard(x, y, w, h, selected, title, subtitle, thumbnail, onClick) {
  const textFill = selected ? CAMP.ink : CAMP.cream;
  if (selected) drawCreamPanel(x, y, w, h, { selected: true });
  else drawWoodPanel(x, y, w, h, { fillColor: [104, 62, 39], radius: 7 });

  const thumbSize = max(42, h - 14);
  const thumbX = x + 8;
  const thumbY = y + (h - thumbSize) / 2;
  drawThumbnail(thumbnail, thumbX, thumbY, thumbSize, selected);

  const textX = thumbX + thumbSize + 12;
  drawText(title, textX, y + h * 0.21, {
    alignH: LEFT,
    alignV: TOP,
    style: BOLD,
    size: h < 66 ? 17 : 20,
    fill: textFill,
  });
  drawText(subtitle, textX, y + h * 0.62, {
    alignH: LEFT,
    alignV: TOP,
    size: h < 66 ? 10 : 12,
    fill: selected ? [112, 67, 38] : CAMP.creamDim,
  });
  registerButton(x, y, w, h, true, onClick);
}

function drawThumbnail(thumbnail, x, y, size, selected) {
  push();
  rectMode(CORNER);
  if (thumbnail) {
    const sourceRatio = thumbnail.width / thumbnail.height;
    let sx = 0;
    let sy = 0;
    let sw = thumbnail.width;
    let sh = thumbnail.height;
    if (sourceRatio > 1) {
      sw = thumbnail.height;
      sx = (thumbnail.width - sw) / 2;
    } else if (sourceRatio < 1) {
      sh = thumbnail.width;
      sy = (thumbnail.height - sh) / 2;
    }
    image(thumbnail, x, y, size, size, sx, sy, sw, sh);
  } else {
    drawBox(x, y, size, size, {
      fill: selected ? CAMP.toast : CAMP.cream,
      stroke: CAMP.woodDark,
      strokeWeight: 1,
      radius: 4,
    });
  }
  noFill();
  stroke(selected ? CAMP.woodDark : CAMP.creamDim);
  strokeWeight(2);
  rect(x, y, size, size, 4);
  pop();
}
