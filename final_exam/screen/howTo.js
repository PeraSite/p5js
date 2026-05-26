/**
 * 조작 방법 안내와 플레이 시작 버튼 화면을 그린다.
 * @author 한채아
 */
function drawHowToScreen() {
  background(0);
  const stage = stageRect();

  drawText("HOW TO PLAY", stage.x + stage.w / 2, stage.y + 50, {
    size: 28,
    alignH: CENTER,
    alignV: TOP,
    style: BOLD,
  });

  const x = stage.x + 42;
  const y = stage.y + 150;
  drawText("1. 노트가 아래로 떨어집니다", x, y, { size: 17, alignH: LEFT, alignV: TOP });
  drawText("2. 코를 움직여 노트에 맞추세요", x, y + 54, { size: 17, alignH: LEFT, alignV: TOP });
  drawText("3. 정확한 타이밍에 맞추면 점수를 얻습니다", x, y + 108, {
    size: 17,
    alignH: LEFT,
    alignV: TOP,
  });

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
