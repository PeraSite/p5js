/**
 * 타이틀 메인 화면을 그린다.
 */
function drawMainScreen() {
  const stage = getStageRect();
  drawUiBackground(stage, { dim: 30 });

  drawImageContain(
    App.assets.ui.logo,
    stage.x + stage.w * 0.14,
    stage.y + stage.h * 0.04,
    stage.w * 0.72,
    stage.h * 0.5,
  );

  drawText("2조 정제훈 한채아", stage.x + stage.w / 2, stage.y + stage.h * 0.58, {
    size: 16,
    alignH: CENTER,
    alignV: CENTER,
    fill: CAMP.creamDim,
  });

  drawButton(
    "ROAST!",
    stage.x + 54,
    stage.y + stage.h - 124,
    stage.w - 108,
    54,
    true,
    goToSongSelect,
  );
}
