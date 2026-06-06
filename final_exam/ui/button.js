/**
 * 라벨이 있는 버튼을 그리고 클릭 영역을 App.uiButtons에 등록한다.
 * @author 한채아
 * @param {string} label - 버튼 텍스트
 * @param {number} x - 좌상단 x
 * @param {number} y - 좌상단 y
 * @param {number} w - 너비
 * @param {number} h - 높이
 * @param {boolean} enabled - 활성 여부
 * @param {() => void} onClick - 클릭 시 실행 함수
 */
function drawButton(label, x, y, w, h, enabled, onClick) {
  drawWoodPanel(x, y, w, h, {
    selected: enabled,
    fillColor: enabled ? CAMP.woodLight : [82, 63, 52],
    radius: 7,
  });
  if (enabled) {
    noStroke();
    fill(255, 198, 98, 46 + sin(millis() * 0.006) * 10);
    rect(x + 8, y + 8, w - 16, h - 16, 5);
  }
  drawText(label, x + w / 2, y + h / 2, {
    size: 20,
    alignH: CENTER,
    alignV: CENTER,
    style: BOLD,
    fill: enabled ? CAMP.cream : [158, 132, 104],
  });
  App.uiButtons.push({ x, y, w, h, enabled, onClick: enabled ? onClick : null });
}

/**
 * 이미 그려진 영역(카드 등)에 투명 클릭 hitbox만 등록한다.
 * @author 한채아
 * @param {number} x - 좌상단 x
 * @param {number} y - 좌상단 y
 * @param {number} w - 너비
 * @param {number} h - 높이
 * @param {boolean} enabled - 활성 여부
 * @param {() => void} onClick - 클릭 시 실행 함수
 */
function registerButton(x, y, w, h, enabled, onClick) {
  App.uiButtons.push({ x, y, w, h, enabled, onClick: enabled ? onClick : null });
}

/**
 * (x,y)가 등록된 버튼 안이면 해당 onClick을 호출한다.
 * @author 한채아
 * @param {number} x - 포인터 x
 * @param {number} y - 포인터 y
 */
function handlePress(x, y) {
  const button = App.uiButtons.find(
    (item) =>
      item.enabled &&
      x >= item.x &&
      x <= item.x + item.w &&
      y >= item.y &&
      y <= item.y + item.h,
  );
  if (button && button.onClick) button.onClick();
}

/**
 * p5 터치 시작 시 버튼 클릭을 처리한다.
 * @author 한채아
 * @returns {false} 기본 터치 동작 방지
 */
function touchStarted() {
  handlePress(mouseX, mouseY);
  return false;
}

/**
 * p5 마우스 클릭 시 버튼 클릭을 처리한다.
 * @author 한채아
 * @returns {false} 기본 클릭 동작 방지
 */
function mousePressed() {
  handlePress(mouseX, mouseY);
  return false;
}
