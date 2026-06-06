/**
 * 플레이 결과의 정확도와 랭크를 계산한다.
 */
function calculatePlayAccuracy() {
  const total = Play.hits + Play.misses;
  return total ? (Play.hits / total) * 100 : 0;
}

/**
 * 정확도 기준으로 결과 랭크 S/A/B/C를 정한다.
 */
function getPlayRank() {
  const accuracy = calculatePlayAccuracy();
  if (accuracy >= 95) return "S";
  if (accuracy >= 85) return "A";
  if (accuracy >= 70) return "B";
  return "C";
}
