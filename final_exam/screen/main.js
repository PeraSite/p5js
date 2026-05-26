/**
 * 타이틀 메인 화면을 그린다.
 * @author 한채아
 */
function drawMainScreen() {
  const stage = stageRect();

  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(42);
  text("NOSE\nPIANO\nRUSH", stage.x + stage.w / 2, stage.y + stage.h * 0.34);

  textStyle(NORMAL);
  textSize(16);
  text("2조 정제훈 한채아", stage.x + stage.w / 2, stage.y + stage.h * 0.62);

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
