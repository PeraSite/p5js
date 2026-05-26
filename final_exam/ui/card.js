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
 * @param {() => void} onClick - 클릭 시 실행 함수
 */
function drawSelectableCard(x, y, w, h, selected, title, subtitle, onClick) {
  const textFill = selected ? 0 : 255;
  drawBox(x, y, w, h, {
    fill: selected ? 255 : 0,
    stroke: 255,
    strokeWeight: 1.5,
    radius: 6,
  });
  drawText(title, x + 18, y + 14, {
    alignH: LEFT,
    alignV: TOP,
    style: BOLD,
    size: 20,
    fill: textFill,
  });
  drawText(subtitle, x + 18, y + 46, {
    alignH: LEFT,
    alignV: TOP,
    size: 12,
    fill: textFill,
  });
  registerButton(x, y, w, h, true, onClick);
}
