/**
 * 히트·미스 비율로 정확도(%)를 계산한다.
 * @author 정제훈
 * @returns {number} 0~100 정확도
 */
function resultAccuracy() {
  const total = Play.hits + Play.misses;
  if (total === 0) return 0;
  return (Play.hits / total) * 100;
}

/**
 * 정확도에 따른 결과 등급 문자를 반환한다.
 * @author 정제훈
 * @param {number} accuracy - resultAccuracy() 결과 (0~100)
 * @returns {string} S, A, B, C 중 하나
 */
function resultRank(accuracy) {
  if (accuracy >= 95) return "S";
  if (accuracy >= 85) return "A";
  if (accuracy >= 70) return "B";
  return "C";
}
