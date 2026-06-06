/**
 * Firebase 앱 초기화와 공통 Firebase 객체 접근만 담당한다.
 * 게임 상태, 화면 상태, 리더보드 규칙을 알지 않는다.
 */
const FirebaseClient = (() => {
  const config = {
    apiKey: "AIzaSyBPGbVEZBOAfUG2dsuZYIuXW_Ah86st6NI",
    authDomain: "adhz-piano.firebaseapp.com",
    databaseURL: "https://adhz-piano-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "adhz-piano",
    storageBucket: "adhz-piano.firebasestorage.app",
    messagingSenderId: "99253375152",
    appId: "1:99253375152:web:30ec254d9b81077d00ab75",
  };

  firebase.initializeApp(config);
  const db = firebase.database();

  return {
    db,

    /**
     * Firebase 서버 시간을 기록할 때 쓰는 timestamp 값을 돌려준다.
     */
    serverTimestamp() {
      return firebase.database.ServerValue.TIMESTAMP;
    },
  };
})();
