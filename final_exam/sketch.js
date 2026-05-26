/**
 * p5 preload: 곡·채보 JSON과 faceMesh 모델을 로드한다.
 * @author 한채아
 */
function preload() {
  loadJSON(GAME_CONFIG.songsPath, (catalog) => {
    App.songCatalog = catalog;
    for (const song of catalog.songs) {
      song.chartData = loadJSON(song.chart);
    }
  });
  Face.faceMesh = ml5.faceMesh({
    maxFaces: 1,
    refineLandmarks: false,
    flipHorizontal: false,
  });
}

/**
 * p5 setup: 캔버스·오디오·카메라를 초기화하고 메인 상태로 진입한다.
 * @author 한채아
 */
function setup() {
  pixelDensity(1);
  createCanvas(windowWidth, windowHeight);
  textFont("Arial");
  setupPiano();
  setupCamera();
  App.songs = App.songCatalog.songs;
  App.selectedSong = 0;
  App.state = "main";
}

/**
 * p5 draw: 얼굴 추적 후 App.state에 맞는 화면·게임 로직을 실행한다.
 * @author 한채아
 */
function draw() {
  updateNose();

  if (App.state === "playing") {
    tickPlaying();
    drawCamera();
    drawPlayfield();
    drawPlayingScreen();
    drawFaceLostHint();
    return;
  }

  if (App.state === "cameraSetup") {
    drawCamera();
    drawCameraSetupScreen();
    return;
  }

  background(0);
  switch (App.state) {
    case "main":
      drawMainScreen();
      break;
    case "songSelect":
      drawSongSelectScreen();
      break;
    case "howTo":
      drawHowToScreen();
      break;
    case "result":
      drawResultScreen();
      break;
    default:
      drawLoadingScreen();
      break;
  }
}

/**
 * 창 크기 변경 시 캔버스를 리사이즈한다.
 * @author 한채아
 */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

/**
 * 키보드 단축키로 화면 전환·곡 선택·플레이 시작을 처리한다.
 * @author 한채아
 * @returns {false} p5 기본 키 동작 방지
 */
function keyPressed() {
  if (key === " " && App.state === "howTo") startGame();
  if (keyCode === ENTER && App.state === "main") App.state = "songSelect";
  if (keyCode === ENTER && App.state === "songSelect")
    loadSelectedSong("cameraSetup");
  if (keyCode === ENTER && App.state === "cameraSetup" && Face.nose)
    App.state = "howTo";
  if (keyCode === RIGHT_ARROW && App.state === "songSelect")
    selectSong(App.selectedSong + 1);
  if (keyCode === LEFT_ARROW && App.state === "songSelect")
    selectSong(App.selectedSong - 1);
  return false;
}
