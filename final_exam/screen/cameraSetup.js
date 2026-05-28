/**
 * 카메라 위에 얼굴 맞추기 안내와 OK 버튼 오버레이를 그린다.
 * @author 한채아
 */
function drawCameraSetupScreen() {
  drawCamera();

  const stage = stageRect();
  drawBox(stage.x, stage.y, stage.w, stage.h, { fill: [0, 0, 0, 170] });

  drawText("CAMERA SETUP", stage.x + stage.w / 2, stage.y + 42, {
    size: 26,
    alignH: CENTER,
    alignV: TOP,
    style: BOLD,
  });

  const guideW = stage.w * 0.54;
  const guideH = stage.h * 0.32;
  drawBox(stage.x + (stage.w - guideW) / 2, stage.y + stage.h * 0.22, guideW, guideH, {
    fill: false,
    stroke: 255,
    strokeWeight: 2,
    radius: 10,
  });

  drawText(
    Face.noses.length > 0
      ? `얼굴 ${Face.noses.length}명 인식 완료`
      : "화면 중앙에 얼굴을 맞춰주세요",
    stage.x + stage.w / 2,
    stage.y + stage.h * 0.62,
    { size: 18, alignH: CENTER, alignV: TOP },
  );

  drawButton(
    "OK",
    stage.x + 54,
    stage.y + stage.h - 96,
    stage.w - 108,
    54,
    Face.noses.length > 0,
    () => {
      App.state = "howTo";
    },
  );
}
