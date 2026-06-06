/**
 * 카메라 위에 얼굴 맞추기 안내와 OK 버튼 오버레이를 그린다.
 * @author 한채아
 */
function drawCameraSetupScreen() {
  drawCamera();

  const stage = stageRect();
  drawBox(stage.x, stage.y, stage.w, stage.h, { fill: [16, 10, 14, 86] });
  drawCreamAssetPanel(stage.x + 34, stage.y + stage.h * 0.46, stage.w - 68, 154);

  drawText("READY YOUR SKEWER", stage.x + stage.w / 2, stage.y + stage.h * 0.46 + 42, {
    size: 18,
    alignH: CENTER,
    alignV: CENTER,
    style: BOLD,
    fill: CAMP.ink,
  });

  drawText(
    Face.noses.length > 0
      ? `얼굴 ${Face.noses.length}명 인식 완료`
      : "화면 중앙에 얼굴을 맞춰주세요",
    stage.x + stage.w / 2,
    stage.y + stage.h * 0.46 + 96,
    { size: 17, alignH: CENTER, alignV: CENTER, fill: CAMP.ink },
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
