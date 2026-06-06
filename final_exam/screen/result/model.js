/**
 * 결과 화면에 필요한 문구, 색상, 통계 데이터를 만든다.
 */
function getResultTheme(rank) {
  const themes = {
    S: {
      accent: [255, 232, 130],
      dim: [74, 58, 18],
      title: "GOLDEN ROAST",
    },
    A: {
      accent: [255, 188, 118],
      dim: [80, 42, 18],
      title: "TOASTY RUN",
    },
    B: {
      accent: [168, 242, 185],
      dim: [24, 68, 42],
      title: "WARM BATCH",
    },
    C: {
      accent: [255, 132, 146],
      dim: [86, 26, 36],
      title: "BURNT EDGE",
    },
  };
  return themes[rank] ?? themes.C;
}

/**
 * 결과 화면 상단에 보여줄 짧은 칭찬 문구를 고른다.
 */
function getResultBadgeText(accuracy) {
  if (Play.misses === 0 && Play.hits > 0) return "NO BURNS";
  if (accuracy >= 98) return "MELLOW MASTER";
  if (Play.maxCombo >= 30) return "SKEWER STREAK";
  if (accuracy >= 85) return "CAMPFIRE CLEAR";
  return "MORE ROASTING";
}

/**
 * 결과 화면 2x2 통계 카드에 넣을 라벨과 값을 만든다.
 */
function buildResultStats(accuracy) {
  return [
    ["SCORE", String(Play.score)],
    ["ACCURACY", `${accuracy.toFixed(1)}%`],
    ["BEST STREAK", String(Play.maxCombo)],
    ["ROAST / BURN", `${Play.hits} / ${Play.misses}`],
  ];
}
