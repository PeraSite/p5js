/**
 * 카메라 위에 얼굴 맞추기 안내와 OK 버튼 오버레이를 그린다.
 * @author 한채아
 * drawCamera()는 sketch에서 먼저 호출됨
 */
function drawCameraSetupScreen() {
  clearButtons();
  const stage = stageRect();
  fill(0, 0, 0, 170);
  rect(stage.x, stage.y, stage.w, stage.h);

  fill(255);
  noStroke();
  textAlign(CENTER, TOP);
  textStyle(BOLD);
  textSize(26);
  text("CAMERA SETUP", stage.x + stage.w / 2, stage.y + 42);

  noFill();
  stroke(255);
  strokeWeight(2);
  const guideW = stage.w * 0.54;
  const guideH = stage.h * 0.32;
  rect(stage.x + (stage.w - guideW) / 2, stage.y + stage.h * 0.22, guideW, guideH, 10);

  noStroke();
  fill(255);
  textStyle(NORMAL);
  textSize(18);
  text(
    Face.nose ? "얼굴 인식 완료" : "화면 중앙에 얼굴을 맞춰주세요",
    stage.x + stage.w / 2,
    stage.y + stage.h * 0.62,
  );

  drawButton(
    "OK",
    stage.x + 54,
    stage.y + stage.h - 96,
    stage.w - 108,
    54,
    !!Face.nose,
    () => {
      App.state = "howTo";
    },
  );
}
