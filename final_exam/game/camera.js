/**
 * 웹캠 프레임에서 9:16 비율로 잘라낼 소스 영역을 계산한다.
 * @author 정제훈
 * @returns {{ x: number, y: number, w: number, h: number }} 비디오 크롭 영역
 */
function cameraCrop() {
  const videoWidth = Face.video.elt.videoWidth;
  const videoHeight = Face.video.elt.videoHeight;
  const videoRatio = videoWidth / videoHeight;

  if (videoRatio > GAME_CONFIG.stageRatio) {
    const w = videoHeight * GAME_CONFIG.stageRatio;
    return { x: (videoWidth - w) / 2, y: 0, w, h: videoHeight };
  }

  const h = videoWidth / GAME_CONFIG.stageRatio;
  return { x: 0, y: (videoHeight - h) / 2, w: videoWidth, h };
}

/**
 * 웹캠 캡처와 faceMesh 감지를 초기화한다.
 * @author 정제훈
 */
function setupCamera() {
  Face.video = createCapture(
    {
      video: {
        width: { ideal: GAME_CONFIG.cameraWidth },
        height: { ideal: GAME_CONFIG.cameraHeight },
        aspectRatio: { ideal: GAME_CONFIG.stageRatio },
        facingMode: "user",
      },
      audio: false,
    },
    () => Face.faceMesh.detectStart(Face.video, gotFaces),
  );
  Face.video.size(GAME_CONFIG.cameraWidth, GAME_CONFIG.cameraHeight);
  Face.video.elt.muted = true;
  Face.video.hide();
}

/**
 * faceMesh 감지 결과를 Face.faces에 저장한다.
 * @author 정제훈
 * @param {object[]} results - ml5 faceMesh 결과 배열
 */
function gotFaces(results) {
  Face.faces = results || [];
}

/**
 * 얼굴 랜드마크를 스테이지 좌표의 코 위치(Face.nose)로 변환·스무딩한다.
 * @author 정제훈
 * Face.nose에 {x,y} 저장, 미감지 시 null
 */
function updateNose() {
  const point =
    Face.faces[0]?.keypoints?.[1] || Face.faces[0]?.keypoints?.[4] || null;
  if (!point) {
    Face.nose = null;
    Face.smoothNose = null;
    return;
  }

  const stage = stageRect();
  const crop = cameraCrop();
  const x = stage.x + stage.w * (1 - (point.x - crop.x) / crop.w);
  const y = stage.y + stage.h * ((point.y - crop.y) / crop.h);

  if (!Face.smoothNose) Face.smoothNose = createVector(x, y);
  Face.smoothNose.x = lerp(Face.smoothNose.x, x, GAME_CONFIG.smoothing);
  Face.smoothNose.y = lerp(Face.smoothNose.y, y, GAME_CONFIG.smoothing);
  Face.nose = { x: Face.smoothNose.x, y: Face.smoothNose.y };
}
