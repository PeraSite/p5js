/**
 * 결과 화면 하단의 재시도/곡 선택 버튼을 그린다.
 */
function drawResultActions(stage, theme) {
  const buttonW = (stage.w - 76) / 2;
  drawResultActionButton(
    "RETRY",
    stage.x + 28,
    stage.y + stage.h - 96,
    buttonW,
    54,
    theme,
    true,
    true,
    retrySelectedSong,
  );
  drawResultActionButton(
    "SONG",
    stage.x + 48 + buttonW,
    stage.y + stage.h - 96,
    buttonW,
    54,
    theme,
    false,
    true,
    returnToSongSelectFromResult,
  );
}

/**
 * 결과 화면의 큰 액션 버튼 하나를 그리고 클릭 영역을 등록한다.
 */
function drawResultActionButton(label, x, y, w, h, theme, primary, enabled, onClick) {
  drawWoodPanel(x, y, w, h, {
    selected: primary && enabled,
    fillColor: primary ? CAMP.woodLight : [92, 56, 38],
    radius: 7,
  });
  drawText(label, x + w / 2, y + h / 2, {
    size: 18,
    alignH: CENTER,
    alignV: CENTER,
    style: BOLD,
    fill: enabled ? CAMP.cream : [130, 110, 92],
  });
  registerButton(x, y, w, h, enabled, onClick);
}

/**
 * 리더보드 제출용 작은 버튼을 그리고 클릭 영역을 등록한다.
 */
function drawResultSmallButton(label, x, y, w, h, enabled, onClick) {
  drawCreamPanel(x, y, w, h, { selected: enabled, radius: 6 });
  drawText(label, x + w / 2, y + h / 2, {
    size: 12,
    alignH: CENTER,
    alignV: CENTER,
    style: BOLD,
    fill: enabled ? CAMP.ink : [130, 110, 92],
  });
  registerButton(x, y, w, h, enabled, onClick);
}
