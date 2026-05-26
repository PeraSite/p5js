const SONG_META = {
  "small-star": { difficulty: "EASY", length: "28s" },
  butterfly: { difficulty: "NORMAL", length: "17s" },
  "infernal-galop": { difficulty: "HARD", length: "17s" },
  "flea-waltz": { difficulty: "HARD", length: "14s" },
};

/**
 * 곡 목록과 선택·재생 버튼이 있는 곡 선택 화면을 그린다.
 * @author 한채아
 */
function drawSongSelectScreen() {
  clearButtons();
  const stage = stageRect();
  fill(255);
  noStroke();
  textAlign(CENTER, TOP);
  textStyle(BOLD);
  textSize(28);
  text("SONG SELECT", stage.x + stage.w / 2, stage.y + 38);

  const cardH = 76;
  const gap = 14;
  const top = stage.y + 104;
  for (let i = 0; i < App.songs.length; i += 1) {
    const song = App.songs[i];
    const meta = SONG_META[song.id] || { difficulty: "NORMAL", length: "--s" };
    const x = stage.x + 28;
    const y = top + i * (cardH + gap);
    const selected = i === App.selectedSong;

    stroke(255);
    strokeWeight(1.5);
    fill(selected ? 255 : 0);
    rect(x, y, stage.w - 56, cardH, 6);
    noStroke();
    fill(selected ? 0 : 255);
    textAlign(LEFT, TOP);
    textStyle(BOLD);
    textSize(20);
    text(song.title, x + 18, y + 14);
    textStyle(NORMAL);
    textSize(12);
    text(`${meta.difficulty}  /  ${meta.length}`, x + 18, y + 46);

    const index = i;
    registerButton(x, y, stage.w - 56, cardH, true, () => selectSong(index));
  }

  drawButton(
    "PLAY",
    stage.x + 54,
    stage.y + stage.h - 96,
    stage.w - 108,
    54,
    true,
    () => loadSelectedSong("cameraSetup"),
  );
}
