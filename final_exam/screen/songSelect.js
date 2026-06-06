/**
 * 곡 목록과 선택·재생 버튼이 있는 곡 선택 화면을 그린다.
 * @author 한채아
 */
function drawSongSelectScreen() {
  const stage = stageRect();
  drawUiBackground(stage, { dim: 78 });

  drawCreamAssetPanel(stage.x + 16, stage.y + 76, stage.w - 32, stage.h - 172, {
    alpha: 242,
  });

  drawText("PICK A CAMP SONG", stage.x + stage.w / 2, stage.y + 54, {
    size: 22,
    alignH: CENTER,
    alignV: CENTER,
    style: BOLD,
    fill: CAMP.cream,
  });

  const gap = 10;
  const top = stage.y + 128;
  const bottomReserve = 104;
  const availableH = stage.h - (top - stage.y) - bottomReserve;
  const cardH = constrain(
    (availableH - gap * (App.songs.length - 1)) / App.songs.length,
    58,
    76,
  );
  for (let i = 0; i < App.songs.length; i += 1) {
    const song = App.songs[i];
    const x = stage.x + 42;
    const y = top + i * (cardH + gap);
    const index = i;

    drawSelectableCard(
      x,
      y,
      stage.w - 84,
      cardH,
      i === App.selectedSong,
      song.title,
      `${song.artist}  /  ${song.difficulty}  /  ${song.length}s`,
      song.thumbnailImage,
      () => selectSong(index),
    );
  }

  drawButton(
    "ROAST!",
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
