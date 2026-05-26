/**
 * 플레이 결과 점수·등급과 재시도·곡 선택 버튼 화면을 그린다.
 * @author 한채아
 */
function drawResultScreen() {
  background(0);
  const stage = stageRect();
  const accuracy = playAccuracy();
  const rank = playRank();

  drawText("RESULT", stage.x + stage.w / 2, stage.y + 36, {
    size: 28,
    alignH: CENTER,
    alignV: TOP,
    style: BOLD,
  });
  drawText(rank, stage.x + stage.w / 2, stage.y + 92, {
    size: 72,
    alignH: CENTER,
    alignV: TOP,
    style: BOLD,
  });

  const x = stage.x + 52;
  const y = stage.y + 218;
  drawText(`SCORE       ${Play.score}`, x, y, { size: 17, alignH: LEFT, alignV: TOP });
  drawText(`ACCURACY    ${accuracy.toFixed(1)}%`, x, y + 38, { size: 17, alignH: LEFT, alignV: TOP });
  drawText(`MAX COMBO   ${Play.maxCombo}`, x, y + 76, { size: 17, alignH: LEFT, alignV: TOP });
  drawText(`HIT / MISS  ${Play.hits} / ${Play.misses}`, x, y + 114, {
    size: 17,
    alignH: LEFT,
    alignV: TOP,
  });
  drawText("2조 정제훈 한채아", stage.x + stage.w / 2, stage.y + stage.h - 164, {
    size: 14,
    alignH: CENTER,
    alignV: TOP,
  });

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
