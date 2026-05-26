/**
 * 조작 방법 안내와 플레이 시작 버튼 화면을 그린다.
 * @author 한채아
 */
function drawHowToScreen() {
  background(0);
  const stage = stageRect();

  fill(255);
  noStroke();
  textAlign(CENTER, TOP);
  textStyle(BOLD);
  textSize(28);
  text("HOW TO PLAY", stage.x + stage.w / 2, stage.y + 50);

  textStyle(NORMAL);
  textSize(17);
  textAlign(LEFT, TOP);
  const x = stage.x + 42;
  const y = stage.y + 150;
  text("1. 노트가 아래로 떨어집니다", x, y);
  text("2. 코를 움직여 노트에 맞추세요", x, y + 54);
  text("3. 정확한 타이밍에 맞추면 점수를 얻습니다", x, y + 108);

  drawButton(
    "PLAY",
    stage.x + 54,
    stage.y + stage.h - 96,
    stage.w - 108,
    54,
    true,
    startGame,
  );
}
