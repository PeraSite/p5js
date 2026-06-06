/**
 * 게임 밸런스·경로·판정 창 등 고정 설정.
 */
const GAME_CONFIG = {
  songsPath: "assets/songs.json",
  fontPath: "assets/fonts/Dalmoori.ttf",
  mellowAssetsPath: "assets/mellow",
  uiAssetsPath: "assets/ui",
  cameraWidth: 360,
  cameraHeight: 640,
  stageRatio: 9 / 16,
  approachTime: 1800,
  fallAwayTime: 800,
  missAfter: 240,
  resultDelay: 1800,
  hitLineY: 0.755,
  noseRadius: 26,
  noteSize: 38,
  rodWidth: 14,
  rodTipRadius: 22,
  fireHeight: 92,
  skewerStackLimit: 5,
  skewerStackBonus: 3000,
  comboScoreStep: 12,
  maxHitEffects: 24,
  maxEjections: 18,
  maxStackBursts: 6,
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

const APP_STATES = {
  MAIN: "main",
  SONG_SELECT: "songSelect",
  CAMERA_SETUP: "cameraSetup",
  HOW_TO: "howTo",
  PLAYING: "playing",
  RESULT: "result",
};
