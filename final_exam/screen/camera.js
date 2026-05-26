/**
 * 웹캠 영상을 9:16 스테이지에 거울 반전으로 그린다.
 * @author 한채아
 */
function drawCamera() {
  background(0);
  const stage = stageRect();
  if (!Face.video || !Face.video.elt.videoWidth) return;
  const crop = cameraCrop();

  push();
  drawingContext.save();
  drawingContext.translate(stage.x + stage.w, stage.y);
  drawingContext.scale(-1, 1);
  drawingContext.drawImage(
    Face.video.elt,
    crop.x,
    crop.y,
    crop.w,
    crop.h,
    0,
    0,
    stage.w,
    stage.h,
  );
  drawingContext.restore();
  pop();

  drawBox(stage.x, stage.y, stage.w, stage.h, { fill: [0, 0, 0, 112] });
}
