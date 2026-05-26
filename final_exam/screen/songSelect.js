/**
 * 곡 목록과 선택·재생 버튼이 있는 곡 선택 화면을 그린다.
 * @author 한채아
 */
function drawSongSelectScreen() {
  background(0);
  const stage = stageRect();

  drawText("SONG SELECT", stage.x + stage.w / 2, stage.y + 38, {
    size: 28,
    alignH: CENTER,
    alignV: TOP,
    style: BOLD,
  });

  const cardH = 76;
  const gap = 14;
  const top = stage.y + 104;
  for (let i = 0; i < App.songs.length; i += 1) {
    const song = App.songs[i];
    const x = stage.x + 28;
    const y = top + i * (cardH + gap);
    const index = i;

    drawSelectableCard(
      x,
      y,
      stage.w - 56,
      cardH,
      i === App.selectedSong,
      song.title,
      `${song.difficulty}  /  ${song.length}s`,
      () => selectSong(index),
    );
  }

  drawButton(
    "PLAY",
    stage.x + 54,
    stage.y + stage.h - 96,
    stage.w - 108,
    54,
    true,
    () => {
      resetGame();
      App.state = "cameraSetup";
    },
  );
}
