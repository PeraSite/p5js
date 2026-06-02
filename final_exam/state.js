/**
 * 앱 전역: 화면 상태, 곡 목록, UI 버튼 큐.
 * @author 정제훈
 */
const App = {
  state: "main",
  selectedSong: 0,
  uiButtons: [],
  songs: [],
};

/**
 * 플레이 세션: 채보, 노트, 점수, 판정 표시용 데이터.
 * @author 정제훈
 */
const Play = {
  chart: null,
  notes: [],
  gameTime: 0,
  startedAt: 0,
  score: 0,
  combo: 0,
  maxCombo: 0,
  hits: 0,
  misses: 0,
  judge: "",
  judgeAt: 0,
  hitEffects: [],
  shakeAt: 0,
  shakePower: 0,
};

/**
 * 얼굴 추적: 웹캠, faceMesh, 코 좌표들.
 * @author 정제훈
 */
const Face = {
  video: null,
  faceMesh: null,
  faces: [],
  noses: [],
};

/**
 * 오디오: Tone 피아노 샘플러와 드럼 샘플러.
 * @author 정제훈
 */
const Audio = {
  piano: null,
  pianoReady: false,
  drums: null,
  drumsReady: false,
};

/**
 * 온라인 리더보드: 결과 화면 입력·제출·표시 상태.
 * @author 정제훈
 */
const Leaderboard = {
  name: "",
  submitted: false,
  submitting: false,
  loading: false,
  preparedResultKey: "",
  loadedSongId: "",
  entries: [],
};
