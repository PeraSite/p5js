/**
 * 곡 인덱스를 순환 선택해 App.selectedSong을 갱신한다.
 * @param {number} index - 선택할 곡 인덱스
 */
function selectSong(index) {
  App.selectedSong = (index + App.songs.length) % App.songs.length;
}
