/**
 * 결과 화면 하단의 재시도/곡 선택 버튼을 그린다.
 */
function drawResultActions(stage, theme) {
  const sheet = getResultSheetRect(stage);
  const buttonW = (sheet.w - 70) / 2;
  const buttonH = 54;
  const buttonY = sheet.y + sheet.h - 64;
  drawResultActionButton(
    "RETRY",
    sheet.x + 26,
    buttonY,
    buttonW,
    buttonH,
    theme,
    true,
    true,
    retrySelectedSong,
  );
  drawResultActionButton(
    "SONG",
    sheet.x + 44 + buttonW,
    buttonY,
    buttonW,
    buttonH,
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
    size: 21,
    alignH: CENTER,
    alignV: CENTER,
    style: BOLD,
    fill: enabled ? CAMP.cream : [130, 110, 92],
    outline: enabled ? CAMP.coal : null,
    outlineWeight: enabled ? 2 : 0,
  });
  registerButton(x, y, w, h, enabled, onClick);
}

/**
 * 리더보드 제출용 작은 버튼을 그리고 클릭 영역을 등록한다.
 */
function drawResultSmallButton(label, x, y, w, h, enabled, onClick) {
  drawCreamPanel(x, y, w, h, { selected: enabled, radius: 6 });
  drawText(label, x + w / 2, y + h / 2, {
    size: 16,
    alignH: CENTER,
    alignV: CENTER,
    style: BOLD,
    fill: enabled ? CAMP.ink : [130, 110, 92],
  });
  registerButton(x, y, w, h, enabled, onClick);
}
