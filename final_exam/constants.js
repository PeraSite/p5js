/**
 * 게임 밸런스·경로·판정 창 등 고정 설정.
 * @author 정제훈
 */
const GAME_CONFIG = {
  songsPath: "assets/songs.json",
  cameraWidth: 360,
  cameraHeight: 640,
  stageRatio: 9 / 16,
  approachTime: 1800,
  missAfter: 240,
  hitLineY: 0.72,
  noseRadius: 26,
  noteSize: 38,
  defaultNoteDuration: 0.33,
  noteColors: {
    piano: [180, 225, 255],
    kick: [255, 138, 76],
    snare: [255, 112, 174],
    hihat: [255, 221, 86],
  },
  audioVolumes: {
    piano: -5,
    drums: -10,
  },
  judgeWindows: [
    { label: "EXCELLENT", window: 45, score: 1000 },
    { label: "GREAT", window: 90, score: 700 },
    { label: "GOOD", window: 140, score: 450 },
    { label: "BAD", window: 210, score: 120 },
  ],
};
