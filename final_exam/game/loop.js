/**
 * playing 화면에서 매 프레임 갱신할 게임 상태를 모은다.
 */
/**
 * p5 draw의 playing 분기에서 호출한다.
 */
function updatePlayingState() {
  Play.gameTime = millis() - Play.startedAt;
  updateNotes();
  updateCurrentLeaderboardLiveRank();
}
