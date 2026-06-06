/**
 * 타이틀 메인 화면을 그린다.
 * @author 한채아
 */
function drawMainScreen() {
  background(0);
  const stage = stageRect();

  drawText("mellow\nbeat", stage.x + stage.w / 2, stage.y + stage.h * 0.32, {
    size: 48,
    alignH: CENTER,
    alignV: CENTER,
  });
  drawText("2조 정제훈 한채아", stage.x + stage.w / 2, stage.y + stage.h * 0.6, {
    size: 16,
    alignH: CENTER,
    alignV: CENTER,
    fill: [255, 226, 168],
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
