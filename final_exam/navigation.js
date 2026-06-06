/**
 * 화면 전환만 담당하는 작은 라우터 모듈.
 */
function setAppState(nextState) {
  if (App.state === nextState) return;

  App.state = nextState;
  enterAppState(nextState);
}

/**
 * 새 화면에 들어갈 때 한 번만 필요한 준비 작업을 실행한다.
 */
function enterAppState(state) {
  if (state === APP_STATES.PLAYING) prepareLeaderboardForPlaying();
  if (state === APP_STATES.RESULT) prepareLeaderboardForResult();
}

/**
 * 메인이나 결과 화면에서 곡 선택 화면으로 이동한다.
 */
function goToSongSelect() {
  setAppState(APP_STATES.SONG_SELECT);
}

/**
 * 선택한 곡을 시작하기 전 카메라 확인 화면으로 이동한다.
 */
function goToCameraSetupForSelectedSong() {
  setAppState(APP_STATES.CAMERA_SETUP);
}

/**
 * 카메라 확인 후 조작 방법 화면으로 이동한다.
 */
function goToHowTo() {
  setAppState(APP_STATES.HOW_TO);
}
