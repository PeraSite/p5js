/**
 * 리더보드 순수 규칙: 닉네임, 기록 생성, 정렬.
 * Firebase와 p5 화면 상태를 알지 않는다.
 * @author 정제훈
 */
const LEADERBOARD_LIMIT = 5;

function isCompleteLeaderboardName(name) {
  return /^[A-Z]{5}$/.test(name);
}

function appendLeaderboardNameLetter(name, letter) {
  const next = String(letter || "").toUpperCase();
  if (!/^[A-Z]$/.test(next) || name.length >= 5) return name;
  return name + next;
}

function removeLeaderboardNameLetter(name) {
  return name.slice(0, -1);
}

function leaderboardNameDisplay(name) {
  return name.padEnd(5, "_").split("").join(" ");
}

function compareLeaderboardEntries(a, b) {
  const scoreDiff = Number(b.score || 0) - Number(a.score || 0);
  if (scoreDiff !== 0) return scoreDiff;

  const accuracyDiff = Number(b.accuracy || 0) - Number(a.accuracy || 0);
  if (accuracyDiff !== 0) return accuracyDiff;

  return Number(a.createdAt || 0) - Number(b.createdAt || 0);
}

function topLeaderboardEntries(entries) {
  return entries.slice().sort(compareLeaderboardEntries).slice(0, LEADERBOARD_LIMIT);
}

function createLeaderboardRecord(input) {
  return {
    nickname: input.nickname,
    createdAt: input.createdAt,
    songId: input.song.id,
    songTitle: input.song.title,
    score: input.score,
    accuracy: Number(input.accuracy.toFixed(1)),
    rank: input.rank,
    maxCombo: input.maxCombo,
    hits: input.hits,
    misses: input.misses,
  };
}
