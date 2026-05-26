/**
 * 플레이 결과 점수·등급과 재시도·곡 선택 버튼 화면을 그린다.
 * @author 한채아
 */
function drawResultScreen() {
  const stage = stageRect();
  const total = Play.hits + Play.misses;
  const accuracy = total ? (Play.hits / total) * 100 : 0;
  const rank =
    accuracy >= 95
      ? "S"
      : accuracy >= 85
        ? "A"
        : accuracy >= 70
          ? "B"
          : "C";

  fill(255);
  noStroke();
  textAlign(CENTER, TOP);
  textStyle(BOLD);
  textSize(28);
  text("RESULT", stage.x + stage.w / 2, stage.y + 36);

  textSize(72);
  text(rank, stage.x + stage.w / 2, stage.y + 92);

  textStyle(NORMAL);
  textSize(17);
  textAlign(LEFT, TOP);
  const x = stage.x + 52;
  const y = stage.y + 218;
  text(`SCORE       ${Play.score}`, x, y);
  text(`ACCURACY    ${accuracy.toFixed(1)}%`, x, y + 38);
  text(`MAX COMBO   ${Play.maxCombo}`, x, y + 76);
  text(`HIT / MISS  ${Play.hits} / ${Play.misses}`, x, y + 114);

  textAlign(CENTER, TOP);
  textSize(14);
  text("2조 정제훈 한채아", stage.x + stage.w / 2, stage.y + stage.h - 164);

  const buttonW = (stage.w - 76) / 2;
  drawButton(
    "RETRY",
    stage.x + 28,
    stage.y + stage.h - 96,
    buttonW,
    54,
    true,
    () => {
      resetGame();
      App.state = "howTo";
    },
  );
  drawButton(
    "SONG",
    stage.x + 48 + buttonW,
    stage.y + stage.h - 96,
    buttonW,
    54,
    true,
    () => {
      resetGame();
      App.state = "songSelect";
    },
  );
}
