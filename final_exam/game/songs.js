/**
 * 곡 인덱스를 순환 선택해 App.selectedSong을 갱신한다.
 * @author 정제훈
 * @param {number} index - 선택할 곡 인덱스
 */
function selectSong(index) {
  if (!Array.isArray(App.songs) || App.songs.length === 0) {
    App.state = "error";
    App.loadingMessage = "곡 목록 로딩 실패\nsongs 배열이 없음";
    return;
  }

  App.selectedSong = (index + App.songs.length) % App.songs.length;
}

/**
 * 선택 곡의 채보 JSON을 로드하고 Play.chart를 채운 뒤 nextState로 전환한다.
 * @author 정제훈
 * @param {string} [nextState="cameraSetup"] - 로드 성공 후 App.state
 */
function loadSelectedSong(nextState = "cameraSetup") {
  if (!Array.isArray(App.songs) || App.songs.length === 0) {
    App.state = "error";
    App.loadingMessage = "곡 목록 로딩 실패\nsongs 배열이 없음";
    return;
  }
  if (App.chartRequested) return;

  App.state = "loading";
  App.chartRequested = true;
  App.loadingMessage = "채보 로딩 중";

  loadJSON(
    App.songs[App.selectedSong].chart,
    (loaded) => {
      if (!Array.isArray(loaded.notes) || loaded.notes.length === 0) {
        App.state = "error";
        App.loadingMessage = "채보 로딩 실패\nnotes 배열이 비어있음";
        App.chartRequested = false;
        return;
      }
      Play.chart = loaded;
      resetGame();
      App.state = nextState;
      App.chartRequested = false;
    },
    (error) => {
      App.state = "error";
      App.loadingMessage = `채보 로딩 실패\n${App.songs[App.selectedSong].chart}`;
      console.error(error);
      App.chartRequested = false;
    },
  );
}
