/**
 * 리더보드 순수 규칙: 닉네임, 기록 생성, 정렬.
 * Firebase와 p5 화면 상태를 알지 않는다.
 */
const LEADERBOARD_LIMIT = 5;

/**
 * 제출 가능한 5글자 영문 이름인지 확인한다.
 */
function isCompleteLeaderboardName(name) {
  return /^[A-Z]{5}$/.test(name);
}

/**
 * 결과 화면에서 입력한 글자를 이름 뒤에 붙인다.
 */
function appendLeaderboardNameLetter(name, letter) {
  const next = String(letter || "").toUpperCase();
  if (!/^[A-Z]$/.test(next) || name.length >= 5) return name;
  return name + next;
}

/**
 * 백스페이스 입력 때 이름 마지막 글자를 지운다.
 */
function removeLeaderboardNameLetter(name) {
  return name.slice(0, -1);
}

/**
 * 입력 중인 이름을 A B _ _ _ 형태로 보여준다.
 */
function formatLeaderboardNameInput(name) {
  return name.padEnd(5, "_").split("").join(" ");
}

/**
 * 점수, 정확도, 제출 시간 순서로 기록을 정렬한다.
 */
function compareLeaderboardEntries(a, b) {
  const scoreDiff = Number(b.score || 0) - Number(a.score || 0);
  if (scoreDiff !== 0) return scoreDiff;

  const accuracyDiff = Number(b.accuracy || 0) - Number(a.accuracy || 0);
  if (accuracyDiff !== 0) return accuracyDiff;

  return Number(a.createdAt || 0) - Number(b.createdAt || 0);
}

/**
 * 전체 기록 중 화면에 보여줄 상위 기록만 가져온다.
 */
function getTopLeaderboardEntries(entries) {
  return entries.slice().sort(compareLeaderboardEntries).slice(0, LEADERBOARD_LIMIT);
}

/**
 * 플레이 중인 현재 점수를 리더보드 행처럼 비교할 수 있게 만든다.
 */
function buildCurrentPlayLeaderboardEntry(score, accuracy) {
  return {
    id: "__current",
    nickname: "",
    score,
    accuracy: Number(accuracy.toFixed(1)),
    createdAt: Number.MAX_SAFE_INTEGER,
    current: true,
  };
}

/**
 * 현재 플레이 기록이 전체 기록 사이에서 몇 등인지 계산한다.
 */
function getLeaderboardEntryRank(entries, currentEntry) {
  const ranked = getRankedLeaderboardEntries(entries, currentEntry);
  return ranked.findIndex((entry) => entry.current) + 1;
}

/**
 * 기존 기록과 현재 플레이 기록을 합쳐 순위순으로 정렬한다.
 */
function getRankedLeaderboardEntries(entries, currentEntry) {
  return entries.concat(currentEntry).sort(compareLeaderboardEntries);
}

/**
 * 현재 플레이어 주변 순위만 잘라서 플레이 화면에 보여준다.
 */
function getLiveLeaderboardRows(entries, currentEntry, limit = LEADERBOARD_LIMIT) {
  const ranked = getRankedLeaderboardEntries(entries, currentEntry).map((entry, index) => ({
    ...entry,
    displayRank: index + 1,
  }));
  const currentIndex = ranked.findIndex((entry) => entry.current);
  if (currentIndex < 0) return [];

  const half = Math.floor(limit / 2);
  const maxStart = Math.max(0, ranked.length - limit);
  const start = Math.min(Math.max(currentIndex - half, 0), maxStart);
  return ranked.slice(start, start + limit);
}

/**
 * Firebase에 저장할 점수 기록 모양을 만든다.
 */
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
