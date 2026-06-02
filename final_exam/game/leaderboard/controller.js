/**
 * 게임 결과 상태와 리더보드 API를 연결하는 컨트롤러.
 * Firebase 세부 구현과 화면 그리기 코드를 직접 갖지 않는다.
 * @author 정제훈
 */
function currentLeaderboardSong() {
  return App.songs[App.selectedSong];
}

function currentLeaderboardResultKey() {
  const song = currentLeaderboardSong();
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

function resetLeaderboardState(resultKey) {
  const song = currentLeaderboardSong();
  Leaderboard.name = "";
  Leaderboard.submitted = false;
  Leaderboard.submitting = false;
  Leaderboard.loading = false;
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
  const song = currentLeaderboardSong();
  if (!song) return;
  if (Leaderboard.loading && !force) return;
  if (Leaderboard.loadedSongId === song.id && !force) return;
  if (Leaderboard.loadFailedSongId === song.id && !force) return;

  Leaderboard.loading = true;
  try {
    const entries = await FirebaseScores.fetchBySong(song.id);
    Leaderboard.allEntries = entries;
    Leaderboard.entries = topLeaderboardEntries(entries);
    Leaderboard.loadedSongId = song.id;
    Leaderboard.loadFailedSongId = "";
  } catch (error) {
    Leaderboard.loadFailedSongId = song.id;
    console.warn("Leaderboard load failed", error);
  } finally {
    Leaderboard.loading = false;
  }
}

function prepareLeaderboardForResult() {
  const resultKey = currentLeaderboardResultKey();
  if (!resultKey) return;

  if (Leaderboard.preparedResultKey !== resultKey) {
    resetLeaderboardState(resultKey);
    loadCurrentLeaderboard(true);
  }
}

function prepareLeaderboardForPlaying() {
  const song = currentLeaderboardSong();
  if (!song) return;
  loadCurrentLeaderboard();
}

function currentLeaderboardLiveRank() {
  const song = currentLeaderboardSong();
  if (!song || Leaderboard.loadedSongId !== song.id) return null;

  const currentEntry = currentPlayLeaderboardEntry(Play.score, playAccuracy());
  const rank = leaderboardEntryRank(Leaderboard.allEntries, currentEntry);
  updateLeaderboardLiveRank(rank);
  return rank;
}

function currentLiveLeaderboardRows() {
  const song = currentLeaderboardSong();
  if (!song || Leaderboard.loadedSongId !== song.id) return [];

  const currentEntry = currentPlayLeaderboardEntry(Play.score, playAccuracy());
  const rank = leaderboardEntryRank(Leaderboard.allEntries, currentEntry);
  updateLeaderboardLiveRank(rank);
  return liveLeaderboardRows(Leaderboard.allEntries, currentEntry, 3);
}

function updateLeaderboardLiveRank(rank) {
  if (Leaderboard.liveRank !== null && rank < Leaderboard.liveRank) {
    Leaderboard.liveRankFrom = Leaderboard.liveRank;
    Leaderboard.liveRankChangedAt = millis();
  }
  Leaderboard.liveRank = rank;
}

function buildCurrentLeaderboardRecord() {
  return createLeaderboardRecord({
    nickname: Leaderboard.name,
    createdAt: FirebaseClient.serverTimestamp(),
    song: currentLeaderboardSong(),
    score: Play.score,
    accuracy: playAccuracy(),
    rank: playRank(),
    maxCombo: Play.maxCombo,
    hits: Play.hits,
    misses: Play.misses,
  });
}

async function submitCurrentLeaderboardScore() {
  const song = currentLeaderboardSong();
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

function handleLeaderboardKey() {
  if (App.state !== "result" || Leaderboard.submitted) return false;

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

function canSubmitLeaderboardScore() {
  return (
    isCompleteLeaderboardName(Leaderboard.name) &&
    !Leaderboard.submitted &&
    !Leaderboard.submitting
  );
}
