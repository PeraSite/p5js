/**
 * p5 preload: 곡·채보 JSON과 faceMesh 모델을 로드한다.
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
    maxFaces: 1,
    refineLandmarks: false,
    flipHorizontal: false,
  });
}

/**
 * 게임 플레이에 쓰는 꼬치, 불, 마시멜로 이미지를 불러온다.
 */
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

/**
 * 배경, 패널, 로고처럼 화면 공통 UI 이미지를 불러온다.
 */
function loadUiAssets() {
  const base = GAME_CONFIG.uiAssetsPath;
  App.assets.ui.background = loadImage(`${base}/bg-camp.png`);
  App.assets.ui.panelCream = loadImage(`${base}/panel-cream.png`);
  App.assets.ui.logo = loadImage(`${base}/logo-title.png`);
}

/**
 * p5 setup: 캔버스·오디오·카메라를 초기화하고 메인 상태로 진입한다.
 */
function setup() {
  pixelDensity(1);
  createCanvas(windowWidth, windowHeight);
  noSmooth();
  textFont(App.font);
  setupPiano();
  setupDrums();
  setupBurnSfx();
  setupCamera();
  App.selectedSong = 0;
  setAppState(APP_STATES.MAIN);
}

/**
 * p5 draw: 얼굴 추적 후 App.state에 맞는 화면·게임 로직을 실행한다.
 */
function draw() {
  updateNoses();
  App.uiButtons = [];

  switch (App.state) {
    case APP_STATES.PLAYING:
      updatePlayingState();
      drawPlayingScreen();
      break;
    case APP_STATES.CAMERA_SETUP:
      drawCameraSetupScreen();
      break;
    case APP_STATES.MAIN:
      drawMainScreen();
      break;
    case APP_STATES.SONG_SELECT:
      drawSongSelectScreen();
      break;
    case APP_STATES.HOW_TO:
      drawHowToScreen();
      break;
    case APP_STATES.RESULT:
      drawResultScreen();
      break;
  }
}

/**
 * 창 크기 변경 시 캔버스를 리사이즈한다.
 */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

/**
 * 키보드 단축키로 화면 전환·곡 선택·플레이 시작을 처리한다.
 * @returns {false} p5 기본 키 동작 방지
 */
function keyPressed() {
  if (handleLeaderboardKey()) return false;
  if (key === " " && App.state === APP_STATES.HOW_TO) startGame();
  if (keyCode === ENTER && App.state === APP_STATES.MAIN) goToSongSelect();
  if (keyCode === ENTER && App.state === APP_STATES.SONG_SELECT) {
    goToCameraSetupForSelectedSong();
  }
  if (
    keyCode === ENTER &&
    App.state === APP_STATES.CAMERA_SETUP &&
    Face.noses.length > 0
  )
    goToHowTo();
  if (keyCode === RIGHT_ARROW && App.state === APP_STATES.SONG_SELECT)
    selectSong(App.selectedSong + 1);
  if (keyCode === LEFT_ARROW && App.state === APP_STATES.SONG_SELECT)
    selectSong(App.selectedSong - 1);
  return false;
}
