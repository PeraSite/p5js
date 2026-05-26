/**
 * 곡 인덱스를 순환 선택해 App.selectedSong을 갱신한다.
 * @author 정제훈
 * @param {number} index - 선택할 곡 인덱스
 */
function selectSong(index) {
  App.selectedSong = (index + App.songs.length) % App.songs.length;
}

/**
 * 선택 곡의 preload된 채보를 Play.chart에 넣고 화면을 전환한다.
 * @author 정제훈
 * @param {string} [nextState="cameraSetup"] - 전환할 App.state
 */
function loadSelectedSong(nextState = "cameraSetup") {
  Play.chart = App.songs[App.selectedSong].chartData;
  resetGame();
  App.state = nextState;
}
