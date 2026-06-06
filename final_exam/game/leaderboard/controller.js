/**
 * 게임 결과 상태와 리더보드 API를 연결하는 컨트롤러.
 * Firebase 세부 구현과 화면 그리기 코드를 직접 갖지 않는다.
 */
function getCurrentLeaderboardSong() {
  return App.songs[App.selectedSong];
}

/**
 * 같은 결과 화면을 여러 번 준비하지 않기 위한 식별값을 만든다.
 */
function buildCurrentLeaderboardResultKey() {
  const song = getCurrentLeaderboardSong();
  if (!song) return "";
  return [
    song.id,
    Play.startedAt,
    Play.score,
    Play.hits,
    Play.misses,
    Play.maxCombo,
  ].join(":");
}

/**
 * 새 결과를 입력받기 전 리더보드 표시와 제출 상태를 초기화한다.
 */
function resetLeaderboardState(resultKey) {
  const song = getCurrentLeaderboardSong();
  Leaderboard.name = "";
  Leaderboard.submitted = false;
  Leaderboard.submitting = false;
  Leaderboard.loading = false;
  Leaderboard.loadingSongId = "";
  Leaderboard.preparedResultKey = resultKey;
  Leaderboard.liveRank = null;
  Leaderboard.liveRankFrom = null;
  Leaderboard.liveRankChangedAt = 0;
  if (!song || Leaderboard.loadedSongId !== song.id) {
    Leaderboard.loadedSongId = "";
    Leaderboard.loadFailedSongId = "";
    Leaderboard.allEntries = [];
    Leaderboard.entries = [];
  }
}

async function loadCurrentLeaderboard(force) {
  const song = getCurrentLeaderboardSong();
  if (!song) return;
  if (Leaderboard.loadedSongId === song.id && !force) return;
  if (Leaderboard.loadFailedSongId === song.id && !force) return;

  Leaderboard.loading = true;
  try {
    const entries = await FirebaseScores.fetchBySong(song.id);
    Leaderboard.allEntries = entries;
    Leaderboard.entries = getTopLeaderboardEntries(entries);
    Leaderboard.loadedSongId = song.id;
    Leaderboard.loadFailedSongId = "";
  } catch (error) {
    Leaderboard.loadFailedSongId = song.id;
    console.warn("Leaderboard load failed", error);
  } finally {
    Leaderboard.loading = false;
  }
}

/**
 * 결과 화면에 처음 들어갈 때 이름 입력과 TOP 기록을 준비한다.
 */
function prepareLeaderboardForResult() {
  const resultKey = buildCurrentLeaderboardResultKey();
  if (!resultKey) return;

  if (Leaderboard.preparedResultKey !== resultKey) {
    resetLeaderboardState(resultKey);
    loadCurrentLeaderboard(true);
  }
}

/**
 * 플레이 시작 시 해당 곡의 기존 순위를 미리 불러온다.
 */
function prepareLeaderboardForPlaying() {
  const song = getCurrentLeaderboardSong();
  if (!song) return;
  loadCurrentLeaderboard();
}

/**
 * 현재 플레이 점수의 실시간 순위를 반환한다.
 */
function getCurrentLeaderboardLiveRank() {
  return getCurrentLeaderboardRankForCurrentPlay();
}

/**
 * 순위가 올라갔는지 감지해 애니메이션 기준값을 저장한다.
 */
function updateCurrentLeaderboardLiveRank() {
  const rank = getCurrentLeaderboardRankForCurrentPlay();
  if (rank !== null) updateLeaderboardLiveRank(rank);
}

/**
 * 현재 점수와 불러온 기록을 비교해 현재 순위를 계산한다.
 */
function getCurrentLeaderboardRankForCurrentPlay() {
  const song = getCurrentLeaderboardSong();
  if (!song || Leaderboard.loadedSongId !== song.id) return null;

  const currentEntry = buildCurrentPlayLeaderboardEntry(Play.score, calculatePlayAccuracy());
  return getLeaderboardEntryRank(Leaderboard.allEntries, currentEntry);
}

/**
 * 플레이 화면에 그릴 현재 플레이어 주변 순위 행을 만든다.
 */
function getCurrentLiveLeaderboardRows() {
  const song = getCurrentLeaderboardSong();
  if (!song || Leaderboard.loadedSongId !== song.id) return [];

  const currentEntry = buildCurrentPlayLeaderboardEntry(Play.score, calculatePlayAccuracy());
  return getLiveLeaderboardRows(Leaderboard.allEntries, currentEntry, 3);
}

/**
 * 순위가 좋아졌을 때 이전 순위를 저장해 상승 애니메이션에 쓴다.
 */
function updateLeaderboardLiveRank(rank) {
  if (Leaderboard.liveRank !== null && rank < Leaderboard.liveRank) {
    Leaderboard.liveRankFrom = Leaderboard.liveRank;
    Leaderboard.liveRankChangedAt = millis();
  }
  Leaderboard.liveRank = rank;
}

/**
 * 현재 플레이 결과를 저장 가능한 리더보드 기록으로 만든다.
 */
function buildCurrentLeaderboardRecord() {
  return createLeaderboardRecord({
    nickname: Leaderboard.name,
    createdAt: FirebaseClient.serverTimestamp(),
    song: getCurrentLeaderboardSong(),
    score: Play.score,
    accuracy: calculatePlayAccuracy(),
    rank: getPlayRank(),
    maxCombo: Play.maxCombo,
    hits: Play.hits,
    misses: Play.misses,
  });
}

async function submitCurrentLeaderboardScore() {
  const song = getCurrentLeaderboardSong();
  if (!song) return;
  if (Leaderboard.submitted || Leaderboard.submitting) return;
  if (!isCompleteLeaderboardName(Leaderboard.name)) return;

  Leaderboard.submitting = true;
  try {
    await FirebaseScores.createForSong(song.id, buildCurrentLeaderboardRecord());
    Leaderboard.submitted = true;
    await loadCurrentLeaderboard(true);
  } catch (error) {
    console.warn("Leaderboard submit failed", error);
  } finally {
    Leaderboard.submitting = false;
  }
}

/**
 * 결과 화면에서 이름 입력, 삭제, 제출 키를 처리한다.
 */
function handleLeaderboardKey() {
  if (App.state !== APP_STATES.RESULT || Leaderboard.submitted) return false;

  if (keyCode === BACKSPACE) {
    Leaderboard.name = removeLeaderboardNameLetter(Leaderboard.name);
    return true;
  }

  if (keyCode === ENTER) {
    submitCurrentLeaderboardScore();
    return true;
  }

  const nextName = appendLeaderboardNameLetter(Leaderboard.name, key);
  if (nextName !== Leaderboard.name) {
    Leaderboard.name = nextName;
    return true;
  }

  return false;
}

/**
 * 이름이 완성됐고 아직 제출 중이 아닐 때만 true를 반환한다.
 */
function canSubmitLeaderboardScore() {
  return (
    isCompleteLeaderboardName(Leaderboard.name) &&
    !Leaderboard.submitted &&
    !Leaderboard.submitting
  );
}
