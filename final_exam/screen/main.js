/**
 * 타이틀 메인 화면을 그린다.
 * @author 한채아
 */
function drawMainScreen() {
  background(0);
  const stage = stageRect();

  drawText("NOSE\nPIANO\nRUSH", stage.x + stage.w / 2, stage.y + stage.h * 0.34, {
    size: 42,
    alignH: CENTER,
    alignV: CENTER,
    style: BOLD,
  });
  drawText("2조 정제훈 한채아", stage.x + stage.w / 2, stage.y + stage.h * 0.62, {
    size: 16,
    alignH: CENTER,
    alignV: CENTER,
  });

  drawButton(
    "START",
    stage.x + 54,
    stage.y + stage.h - 116,
    stage.w - 108,
    54,
    true,
    () => {
      App.state = "songSelect";
    },
  );
}
