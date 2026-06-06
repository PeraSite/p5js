/**
 * 한 번의 플레이 세션 시작, 재시도, 종료 조건을 담당한다.
 */
/**
 * 선택된 곡으로 새 게임 상태를 만든다.
 */
function resetGame() {
  Play.chart = App.songs[App.selectedSong].chartData;
  Play.notes = Play.chart.notes.map(createPlayableNote);
  resetPlayStats();
  resetPlayFeedback();
}

/**
 * 결과 화면에서 같은 곡을 다시 시작 준비 상태로 돌린다.
 */
function retrySelectedSong() {
  resetGame();
  setAppState(APP_STATES.HOW_TO);
}

/**
 * 결과 화면에서 곡 선택 화면으로 돌아갈 때 플레이 상태를 비운다.
 */
function returnToSongSelectFromResult() {
  resetGame();
  setAppState(APP_STATES.SONG_SELECT);
}

/**
 * 채보 노트에 hit/missed 상태와 고유 id를 붙인다.
 */
function createPlayableNote(note, index) {
  return {
    ...note,
    id: index,
    hit: false,
    missed: false,
  };
}

/**
 * 점수, 콤보, 정확도 계산에 쓰는 숫자 상태를 초기화한다.
 */
function resetPlayStats() {
  Play.gameTime = 0;
  Play.startedAt = 0;
  Play.score = 0;
  Play.combo = 0;
  Play.maxCombo = 0;
  Play.hits = 0;
  Play.misses = 0;
}

/**
 * 판정 문구와 화면 이펙트처럼 보이는 피드백 상태를 초기화한다.
 */
function resetPlayFeedback() {
  Play.judge = "";
  Play.judgeAt = 0;
  Play.hitEffects = [];
  Play.shakeAt = 0;
  Play.shakePower = 0;
  Play.ejections = [];
  Play.skewered = [];
  Play.stackBursts = [];
}

/**
 * HOW TO 화면에서 실제 플레이 화면으로 넘어갈 때 호출한다.
 */
async function startGame() {
  if (App.state !== APP_STATES.HOW_TO) return;
  if (!canStartWithFace()) {
    showStartBlocked("SKEWER REQUIRED", APP_STATES.CAMERA_SETUP);
    return;
  }
  if (!canStartWithAudio()) {
    showStartBlocked("LOADING SOUND");
    return;
  }

  await Tone.start();
  resetGame();
  Play.startedAt = millis();
  setAppState(APP_STATES.PLAYING);
}

/**
 * 얼굴이 잡혀 있어 플레이를 시작할 수 있는지 확인한다.
 */
function canStartWithFace() {
  return Face.noses.length > 0;
}

/**
 * 피아노와 드럼 샘플이 모두 준비됐는지 확인한다.
 */
function canStartWithAudio() {
  return Audio.pianoReady && Audio.drumsReady;
}

/**
 * 시작할 수 없을 때 이유를 보여주고 필요한 화면으로 보낸다.
 */
function showStartBlocked(message, nextState = App.state) {
  Play.judge = message;
  Play.judgeAt = millis();
  setAppState(nextState);
}

/**
 * 마지막 노트 이후 충분히 시간이 지나면 결과 화면으로 넘긴다.
 */
function finishGameIfSongEnded() {
  const last = Play.notes[Play.notes.length - 1];
  if (last && Play.gameTime > last.time + GAME_CONFIG.resultDelay) {
    setAppState(APP_STATES.RESULT);
  }
}
