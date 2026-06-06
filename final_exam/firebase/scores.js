/**
 * Firebase Realtime Database의 점수 기록 저장소.
 * 저장 경로와 read/write만 담당하고, 정렬·검증·화면 상태를 알지 않는다.
 */
const FirebaseScores = (() => {
  function scoresRef(songId) {
    return FirebaseClient.db.ref(`leaderboards/${songId}`);
  }

  function snapshotToEntries(snapshot) {
    const value = snapshot.val() || {};
    return Object.keys(value).map((id) => ({ id, ...value[id] }));
  }

  return {
    /**
     * 곡 id에 해당하는 점수 기록 전체를 읽어온다.
     */
    async fetchBySong(songId) {
      const snapshot = await scoresRef(songId).once("value");
      return snapshotToEntries(snapshot);
    },

    /**
     * 곡 id 아래에 새 점수 기록 하나를 저장한다.
     */
    async createForSong(songId, record) {
      return scoresRef(songId).push(record);
    },
  };
})();
