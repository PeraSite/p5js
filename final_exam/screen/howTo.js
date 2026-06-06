/**
 * 조작 방법 안내와 플레이 시작 버튼 화면을 그린다.
 * @author 한채아
 */
function drawHowToScreen() {
  drawCamera();
  const stage = stageRect();
  drawBox(stage.x, stage.y, stage.w, stage.h, { fill: [16, 10, 14, 120] });

  const panelX = stage.x + 28;
  const panelY = stage.y + 84;
  const panelW = stage.w - 56;
  drawCreamAssetPanel(panelX, panelY, panelW, 342);
  drawText("HOW TO ROAST", stage.x + stage.w / 2, panelY + 44, {
    size: 23,
    alignH: CENTER,
    alignV: CENTER,
    style: BOLD,
    fill: CAMP.ink,
  });
  const x = panelX + 24;
  const y = panelY + 92;
  drawText("1. 마시멜로가 아래로 떨어집니다", x, y, {
    size: 16,
    alignH: LEFT,
    alignV: TOP,
    fill: CAMP.ink,
  });
  drawText("2. 코로 꼬치 끝을 움직이세요", x, y + 54, {
    size: 16,
    alignH: LEFT,
    alignV: TOP,
    fill: CAMP.ink,
  });
  drawText("3. 노릇해진 순간 끝으로 찌르세요", x, y + 108, {
    size: 17,
    alignH: LEFT,
    alignV: TOP,
    fill: CAMP.ink,
  });
  drawText("4. 옆면, 안익음, 탄 뒤는 실패입니다", x, y + 162, {
    size: 16,
    alignH: LEFT,
    alignV: TOP,
    fill: CAMP.ink,
  });

  drawButton(
    "ROAST!",
    stage.x + 54,
    stage.y + stage.h - 96,
    stage.w - 108,
    54,
    true,
    startGame,
  );
}
