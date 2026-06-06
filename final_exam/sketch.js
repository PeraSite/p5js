/**
 * p5 preload: 곡·채보 JSON과 faceMesh 모델을 로드한다.
 * @author 한채아
 */
function preload() {
  App.font = loadFont(GAME_CONFIG.fontPath);
  loadMellowAssets();
  loadUiAssets();
  loadJSON(GAME_CONFIG.songsPath, (catalog) => {
    App.songs = catalog.songs;
    for (const song of App.songs) {
      song.chartData = loadJSON(song.chart);
      if (song.thumbnail) song.thumbnailImage = loadImage(song.thumbnail);
    }
  });
  Face.faceMesh = ml5.faceMesh({
    maxFaces: 2,
    refineLandmarks: false,
    flipHorizontal: false,
  });
}

function loadMellowAssets() {
  const base = GAME_CONFIG.mellowAssetsPath;
  App.assets.rod = loadImage(`${base}/rod.png`);
  App.assets.fire = loadImage(`${base}/fire.png`);
  App.assets.marshmallows = {
    white: {
      raw: loadImage(`${base}/marshmallow-white-raw.png`),
      roasted: loadImage(`${base}/marshmallow-white-roasted.png`),
      burnt: loadImage(`${base}/marshmallow-burnt.png`),
    },
    red: {
      raw: loadImage(`${base}/marshmallow-red-raw.png`),
      roasted: loadImage(`${base}/marshmallow-red-roasted.png`),
      burnt: loadImage(`${base}/marshmallow-burnt.png`),
    },
    blue: {
      raw: loadImage(`${base}/marshmallow-blue-raw.png`),
      roasted: loadImage(`${base}/marshmallow-blue-roasted.png`),
      burnt: loadImage(`${base}/marshmallow-burnt.png`),
    },
  };
}

function loadUiAssets() {
  const base = GAME_CONFIG.uiAssetsPath;
  App.assets.ui.background = loadImage(`${base}/bg-camp.png`);
  App.assets.ui.panelCream = loadImage(`${base}/panel-cream.png`);
  App.assets.ui.logo = loadImage(`${base}/logo-title.png`);
}

/**
 * p5 setup: 캔버스·오디오·카메라를 초기화하고 메인 상태로 진입한다.
 * @author 한채아
 */
function setup() {
  pixelDensity(1);
  createCanvas(windowWidth, windowHeight);
  noSmooth();
  textFont(App.font);
  setupPiano();
  setupDrums();
  setupCamera();
  App.selectedSong = 0;
  App.state = "main";
}

/**
 * p5 draw: 얼굴 추적 후 App.state에 맞는 화면·게임 로직을 실행한다.
 * @author 한채아
 */
function draw() {
  updateNoses();
  App.uiButtons = [];

  switch (App.state) {
    case "playing":
      Play.gameTime = millis() - Play.startedAt;
      drawPlayingScreen();
      break;
    case "cameraSetup":
      drawCameraSetupScreen();
      break;
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
  if (handleLeaderboardKey()) return false;
  if (key === " " && App.state === "howTo") startGame();
  if (keyCode === ENTER && App.state === "main") App.state = "songSelect";
  if (keyCode === ENTER && App.state === "songSelect") {
    resetGame();
    App.state = "cameraSetup";
  }
  if (keyCode === ENTER && App.state === "cameraSetup" && Face.noses.length > 0)
    App.state = "howTo";
  if (keyCode === RIGHT_ARROW && App.state === "songSelect")
    selectSong(App.selectedSong + 1);
  if (keyCode === LEFT_ARROW && App.state === "songSelect")
    selectSong(App.selectedSong - 1);
  return false;
}
