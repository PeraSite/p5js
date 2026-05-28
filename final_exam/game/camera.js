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
    () =>
      Face.faceMesh.detectStart(Face.video, (results) => {
        Face.faces = results;
      }),
  );
  Face.video.size(GAME_CONFIG.cameraWidth, GAME_CONFIG.cameraHeight);
  Face.video.elt.muted = true;
  Face.video.hide();
}

/**
 * 얼굴 랜드마크를 스테이지 좌표의 코 위치들(Face.noses)로 변환한다.
 * @author 정제훈
 * Face.noses에 {x,y} 배열 저장, 미감지 시 빈 배열
 */
function updateNoses() {
  if (Face.faces.length === 0) {
    Face.noses = [];
    return;
  }

  const stage = stageRect();
  const crop = cameraCrop();
  Face.noses = Face.faces.map((face) => {
    const point = face.keypoints[1];
    return {
      x: stage.x + stage.w * (1 - (point.x - crop.x) / crop.w),
      y: stage.y + stage.h * ((point.y - crop.y) / crop.h),
    };
  });
}
