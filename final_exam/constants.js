/**
 * 게임 밸런스·경로·판정 창 등 고정 설정.
 * @author 정제훈
 */
const GAME_CONFIG = {
  songsPath: "assets/songs.json",
  fontPath: "assets/fonts/Dalmoori.ttf",
  mellowAssetsPath: "assets/mellow",
  cameraWidth: 360,
  cameraHeight: 640,
  stageRatio: 9 / 16,
  approachTime: 1800,
  missAfter: 240,
  hitLineY: 0.72,
  noseRadius: 26,
  noteSize: 38,
  rodWidth: 14,
  rodTipRadius: 22,
  fireHeight: 92,
  defaultNoteDuration: 0.33,
  audioVolumes: {
    piano: -5,
    drums: -10,
  },
  judgeWindows: [
    { label: "MELLOW!", window: 45, score: 1000 },
    { label: "TOASTY", window: 90, score: 700 },
    { label: "WARM", window: 140, score: 450 },
    { label: "UNDER", window: 210, score: 120 },
  ],
};
