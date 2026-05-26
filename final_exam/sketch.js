let video;
let faceMesh;
let faces = [];
let piano;
let pianoReady = false;
let songCatalog;
let songs = [];
let chart;
let selectedSong = 0;
let notes = [];
let state = "main";
let chartRequested = false;
let startedAt = 0;
let gameTime = 0;
let nose = null;
let smoothNose = null;
let score = 0;
let combo = 0;
let maxCombo = 0;
let hits = 0;
let misses = 0;
let judge = "";
let judgeAt = 0;
let loadingMessage = "로딩 중";
let uiButtons = [];

const SONG_META = {
  "small-star": { difficulty: "EASY", length: "28s" },
  butterfly: { difficulty: "NORMAL", length: "17s" },
  "infernal-galop": { difficulty: "HARD", length: "17s" },
  "flea-waltz": { difficulty: "HARD", length: "14s" },
};

function preload() {
  songCatalog = loadJSON(GAME_CONFIG.songsPath);
  faceMesh = ml5.faceMesh({
    maxFaces: 1,
    refineLandmarks: false,
    flipHorizontal: false,
  });
}

function setup() {
  pixelDensity(1);
  createCanvas(windowWidth, windowHeight);
  textFont("Arial");
  setupPiano();
  setupCamera();
  songs = songCatalog.songs;
  selectedSong = 0;
  state = "main";
}

function setupPiano() {
  Tone.getContext().lookAhead = 0;
  piano = new Tone.Sampler({
    urls: {
      A0: "A0.mp3",
      C1: "C1.mp3",
      "D#1": "Ds1.mp3",
      "F#1": "Fs1.mp3",
      A1: "A1.mp3",
      C2: "C2.mp3",
      "D#2": "Ds2.mp3",
      "F#2": "Fs2.mp3",
      A2: "A2.mp3",
      C3: "C3.mp3",
      "D#3": "Ds3.mp3",
      "F#3": "Fs3.mp3",
      A3: "A3.mp3",
      C4: "C4.mp3",
      "D#4": "Ds4.mp3",
      "F#4": "Fs4.mp3",
      A4: "A4.mp3",
      C5: "C5.mp3",
      "D#5": "Ds5.mp3",
      "F#5": "Fs5.mp3",
      A5: "A5.mp3",
      C6: "C6.mp3",
      "D#6": "Ds6.mp3",
      "F#6": "Fs6.mp3",
      A6: "A6.mp3",
      C7: "C7.mp3",
      "D#7": "Ds7.mp3",
      "F#7": "Fs7.mp3",
      A7: "A7.mp3",
      C8: "C8.mp3",
    },
    baseUrl: "assets/piano_sample/",
    release: 0.9,
    onload: () => {
      pianoReady = true;
    },
  }).toDestination();
  piano.volume.value = -5;
}

function draw() {
  updateNose();

  if (state === "playing") {
    gameTime = millis() - startedAt;
    updateNotes();
  }

  if (state === "playing") {
    drawCamera();
    drawGame();
    drawPlayingUi();
    if (!nose) drawCenterText(stageRect(), "FACE LOST");
    return;
  }

  if (state === "cameraSetup") {
    drawCamera();
    drawCameraSetupScreen();
    return;
  }

  background(0);
  if (state === "main") drawMainScreen();
  else if (state === "songSelect") drawSongSelectScreen();
  else if (state === "loading") drawLoadingScreen();
  else if (state === "howTo") drawHowToScreen();
  else if (state === "result") drawResultScreen();
  else drawLoadingScreen();
}

function setupCamera() {
  video = createCapture(
    {
      video: {
        width: { ideal: GAME_CONFIG.cameraWidth },
        height: { ideal: GAME_CONFIG.cameraHeight },
        aspectRatio: { ideal: GAME_CONFIG.stageRatio },
        facingMode: "user",
      },
      audio: false,
    },
    () => faceMesh.detectStart(video, gotFaces),
  );
  video.size(GAME_CONFIG.cameraWidth, GAME_CONFIG.cameraHeight);
  video.elt.muted = true;
  video.hide();
}

function gotFaces(results) {
  faces = results || [];
}

function selectSong(index) {
  if (!Array.isArray(songs) || songs.length === 0) {
    state = "error";
    loadingMessage = "곡 목록 로딩 실패\nsongs 배열이 없음";
    return;
  }

  selectedSong = (index + songs.length) % songs.length;
}

function loadSelectedSong(nextState = "cameraSetup") {
  if (!Array.isArray(songs) || songs.length === 0) {
    state = "error";
    loadingMessage = "곡 목록 로딩 실패\nsongs 배열이 없음";
    return;
  }
  if (chartRequested) return;

  state = "loading";
  chartRequested = true;
  loadingMessage = "채보 로딩 중";

  loadJSON(
    songs[selectedSong].chart,
    (loaded) => {
      if (!Array.isArray(loaded.notes) || loaded.notes.length === 0) {
        state = "error";
        loadingMessage = "채보 로딩 실패\nnotes 배열이 비어있음";
        chartRequested = false;
        return;
      }
      chart = loaded;
      resetGame();
      state = nextState;
      chartRequested = false;
    },
    (error) => {
      state = "error";
      loadingMessage = `채보 로딩 실패\n${songs[selectedSong].chart}`;
      console.error(error);
      chartRequested = false;
    },
  );
}

function resetGame() {
  notes = (chart?.notes || []).map((note, index) => ({
    ...note,
    id: index,
    hit: false,
    missed: false,
  }));
  gameTime = 0;
  startedAt = 0;
  score = 0;
  combo = 0;
  maxCombo = 0;
  hits = 0;
  misses = 0;
  judge = "";
}

async function startGame() {
  if (state !== "howTo") return;
  if (!nose) {
    showJudge("FACE REQUIRED");
    state = "cameraSetup";
    return;
  }
  if (!pianoReady) {
    showJudge("LOADING SOUND");
    return;
  }
  await Tone.start();
  resetGame();
  startedAt = millis();
  state = "playing";
}

function updateNotes() {
  for (const note of notes) {
    if (note.hit || note.missed) continue;

    const pos = notePosition(note);
    const delta = gameTime - note.time;
    const touching =
      nose &&
      dist(nose.x, nose.y, pos.x, pos.y) <
        GAME_CONFIG.noseRadius + GAME_CONFIG.noteSize * 0.35;

    if (touching && abs(delta) <= GAME_CONFIG.judgeWindows.at(-1).window) {
      hitNote(note, delta);
    } else if (delta > GAME_CONFIG.missAfter) {
      missNote(note);
    }
  }

  const last = notes[notes.length - 1];
  if (last && gameTime > last.time + 1800) state = "result";
}

function hitNote(note, delta) {
  const result = GAME_CONFIG.judgeWindows.find(
    (item) => abs(delta) <= item.window,
  );
  note.hit = true;
  hits += 1;
  combo += 1;
  maxCombo = max(maxCombo, combo);
  score += result.score + combo * 12;
  showJudge(result.label);
  piano.triggerAttackRelease(note.note, note.duration || 0.28, Tone.immediate(), 0.9);
}

function missNote(note) {
  note.missed = true;
  misses += 1;
  combo = 0;
  showJudge("MISS");
}

function updateNose() {
  const point = faces[0]?.keypoints?.[1] || faces[0]?.keypoints?.[4] || null;
  if (!point) {
    nose = null;
    smoothNose = null;
    return;
  }

  const stage = stageRect();
  const crop = cameraCrop();
  const x = stage.x + stage.w * (1 - (point.x - crop.x) / crop.w);
  const y = stage.y + stage.h * ((point.y - crop.y) / crop.h);

  if (!smoothNose) smoothNose = createVector(x, y);
  smoothNose.x = lerp(smoothNose.x, x, GAME_CONFIG.smoothing);
  smoothNose.y = lerp(smoothNose.y, y, GAME_CONFIG.smoothing);
  nose = { x: smoothNose.x, y: smoothNose.y };
}

function notePosition(note) {
  const stage = stageRect();
  const hitY = hitLineY();
  const startY = stage.y - GAME_CONFIG.noteSize;
  const endY = stage.y + stage.h + GAME_CONFIG.noteSize;
  const delta = gameTime - note.time;
  const before =
    (gameTime - (note.time - GAME_CONFIG.approachTime)) /
    GAME_CONFIG.approachTime;
  const after = delta / 800;
  const x = lerp(0.2, 0.8, constrain(note.x, 0, 1));
  return {
    x: stage.x + stage.w * x,
    y: delta <= 0 ? lerp(startY, hitY, before) : lerp(hitY, endY, after),
    visible: before >= 0 && after <= 1,
  };
}

function drawCamera() {
  background(0);
  const stage = stageRect();
  if (!video || !video.elt.videoWidth) return;
  const crop = cameraCrop();

  push();
  drawingContext.save();
  drawingContext.translate(stage.x + stage.w, stage.y);
  drawingContext.scale(-1, 1);
  drawingContext.drawImage(
    video.elt,
    crop.x,
    crop.y,
    crop.w,
    crop.h,
    0,
    0,
    stage.w,
    stage.h,
  );
  drawingContext.restore();
  pop();

  noStroke();
  fill(0, 0, 0, 112);
  rect(stage.x, stage.y, stage.w, stage.h);
}

function cameraCrop() {
  const videoWidth = video.elt.videoWidth;
  const videoHeight = video.elt.videoHeight;
  const videoRatio = videoWidth / videoHeight;

  if (videoRatio > GAME_CONFIG.stageRatio) {
    const w = videoHeight * GAME_CONFIG.stageRatio;
    return { x: (videoWidth - w) / 2, y: 0, w, h: videoHeight };
  }

  const h = videoWidth / GAME_CONFIG.stageRatio;
  return { x: 0, y: (videoHeight - h) / 2, w: videoWidth, h };
}

function drawGame() {
  const stage = stageRect();
  const lineY = hitLineY();

  stroke(180, 180, 180, 125);
  strokeWeight(10);
  line(stage.x, lineY, stage.x + stage.w, lineY);
  stroke(255, 255, 255, 170);
  strokeWeight(1);
  line(stage.x, lineY, stage.x + stage.w, lineY);

  noStroke();
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(GAME_CONFIG.noteSize);
  for (const note of notes) {
    if (note.hit || note.missed) continue;
    const pos = notePosition(note);
    if (!pos.visible) continue;
    fill(255);
    text("♪", pos.x, pos.y);
  }

  if (nose) {
    noFill();
    stroke(255);
    strokeWeight(3);
    circle(nose.x, nose.y, GAME_CONFIG.noseRadius * 2);
    noStroke();
    fill(255);
    circle(nose.x, nose.y, 7);
  }
}

function drawPlayingUi() {
  const stage = stageRect();
  const song = songs[selectedSong] || {};

  noStroke();
  fill(0, 0, 0, 168);
  rect(stage.x, stage.y, stage.w, 76);

  fill(255);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(18);
  text(song.title || "로딩 중", stage.x + 18, stage.y + 16);
  textStyle(NORMAL);
  textSize(12);
  fill(230);
  text(`SCORE ${score}`, stage.x + 18, stage.y + 45);
  textAlign(RIGHT, TOP);
  text(`COMBO ${combo}`, stage.x + stage.w - 18, stage.y + 45);

  if (judge && millis() - judgeAt < 520) {
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(28);
    fill(255);
    text(judge, stage.x + stage.w / 2, hitLineY() - 64);
  }
}

function drawMainScreen() {
  clearButtons();
  const stage = stageRect();

  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(42);
  text("NOSE\nPIANO\nRUSH", stage.x + stage.w / 2, stage.y + stage.h * 0.34);

  textStyle(NORMAL);
  textSize(16);
  text("2조 정제훈 한채아", stage.x + stage.w / 2, stage.y + stage.h * 0.62);

  drawButton("start", "START", stage.x + 54, stage.y + stage.h - 116, stage.w - 108, 54, true);
}

function drawSongSelectScreen() {
  clearButtons();
  const stage = stageRect();
  fill(255);
  noStroke();
  textAlign(CENTER, TOP);
  textStyle(BOLD);
  textSize(28);
  text("SONG SELECT", stage.x + stage.w / 2, stage.y + 38);

  const cardH = 76;
  const gap = 14;
  const top = stage.y + 104;
  for (let i = 0; i < songs.length; i += 1) {
    const song = songs[i];
    const meta = SONG_META[song.id] || { difficulty: "NORMAL", length: "--s" };
    const x = stage.x + 28;
    const y = top + i * (cardH + gap);
    const selected = i === selectedSong;

    stroke(255);
    strokeWeight(1.5);
    fill(selected ? 255 : 0);
    rect(x, y, stage.w - 56, cardH, 6);
    noStroke();
    fill(selected ? 0 : 255);
    textAlign(LEFT, TOP);
    textStyle(BOLD);
    textSize(20);
    text(song.title, x + 18, y + 14);
    textStyle(NORMAL);
    textSize(12);
    text(`${meta.difficulty}  /  ${meta.length}`, x + 18, y + 46);
    uiButtons.push({ id: `song:${i}`, x, y, w: stage.w - 56, h: cardH, enabled: true });
  }

  drawButton("playSong", "PLAY", stage.x + 54, stage.y + stage.h - 96, stage.w - 108, 54, true);
}

function drawLoadingScreen() {
  clearButtons();
  drawCenterText(stageRect(), loadingMessage);
}

function drawCameraSetupScreen() {
  clearButtons();
  const stage = stageRect();
  fill(0, 0, 0, 170);
  rect(stage.x, stage.y, stage.w, stage.h);

  fill(255);
  noStroke();
  textAlign(CENTER, TOP);
  textStyle(BOLD);
  textSize(26);
  text("CAMERA SETUP", stage.x + stage.w / 2, stage.y + 42);

  noFill();
  stroke(255);
  strokeWeight(2);
  const guideW = stage.w * 0.54;
  const guideH = stage.h * 0.32;
  rect(stage.x + (stage.w - guideW) / 2, stage.y + stage.h * 0.22, guideW, guideH, 10);

  noStroke();
  fill(255);
  textStyle(NORMAL);
  textSize(18);
  text(
    nose ? "얼굴 인식 완료" : "화면 중앙에 얼굴을 맞춰주세요",
    stage.x + stage.w / 2,
    stage.y + stage.h * 0.62,
  );

  drawButton("cameraOk", "OK", stage.x + 54, stage.y + stage.h - 96, stage.w - 108, 54, !!nose);
}

function drawHowToScreen() {
  clearButtons();
  const stage = stageRect();

  fill(255);
  noStroke();
  textAlign(CENTER, TOP);
  textStyle(BOLD);
  textSize(28);
  text("HOW TO PLAY", stage.x + stage.w / 2, stage.y + 50);

  textStyle(NORMAL);
  textSize(17);
  textAlign(LEFT, TOP);
  const x = stage.x + 42;
  const y = stage.y + 150;
  text("1. 노트가 아래로 떨어집니다", x, y);
  text("2. 코를 움직여 노트에 맞추세요", x, y + 54);
  text("3. 정확한 타이밍에 맞추면 점수를 얻습니다", x, y + 108);

  drawButton("startGame", "PLAY", stage.x + 54, stage.y + stage.h - 96, stage.w - 108, 54, true);
}

function drawResultScreen() {
  clearButtons();
  const stage = stageRect();
  const accuracy = resultAccuracy();

  fill(255);
  noStroke();
  textAlign(CENTER, TOP);
  textStyle(BOLD);
  textSize(28);
  text("RESULT", stage.x + stage.w / 2, stage.y + 36);

  textSize(72);
  text(resultRank(accuracy), stage.x + stage.w / 2, stage.y + 92);

  textStyle(NORMAL);
  textSize(17);
  textAlign(LEFT, TOP);
  const x = stage.x + 52;
  const y = stage.y + 218;
  text(`SCORE       ${score}`, x, y);
  text(`ACCURACY    ${accuracy.toFixed(1)}%`, x, y + 38);
  text(`MAX COMBO   ${maxCombo}`, x, y + 76);
  text(`HIT / MISS  ${hits} / ${misses}`, x, y + 114);

  textAlign(CENTER, TOP);
  textSize(14);
  text("2조 정제훈 한채아", stage.x + stage.w / 2, stage.y + stage.h - 164);

  const buttonW = (stage.w - 76) / 2;
  drawButton("retry", "RETRY", stage.x + 28, stage.y + stage.h - 96, buttonW, 54, true);
  drawButton("song", "SONG", stage.x + 48 + buttonW, stage.y + stage.h - 96, buttonW, 54, true);
}

function drawCenterText(stage, message) {
  noStroke();
  fill(255);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(22);
  text(message, stage.x + stage.w / 2, stage.y + stage.h / 2);
}

function drawButton(id, label, x, y, w, h, enabled) {
  stroke(enabled ? 255 : 110);
  strokeWeight(1.5);
  fill(enabled ? 255 : 0);
  rect(x, y, w, h, 6);
  noStroke();
  fill(enabled ? 0 : 130);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(20);
  text(label, x + w / 2, y + h / 2);
  uiButtons.push({ id, x, y, w, h, enabled });
}

function clearButtons() {
  uiButtons = [];
}

function showJudge(label) {
  judge = label;
  judgeAt = millis();
}

function touchStarted() {
  handlePress(mouseX, mouseY);
  return false;
}

function mousePressed() {
  handlePress(mouseX, mouseY);
  return false;
}

function handlePress(x, y) {
  const button = uiButtons.find(
    (item) =>
      item.enabled &&
      x >= item.x &&
      x <= item.x + item.w &&
      y >= item.y &&
      y <= item.y + item.h,
  );
  if (!button) return;

  if (button.id === "start") {
    state = "songSelect";
  } else if (button.id.startsWith("song:")) {
    selectSong(Number(button.id.split(":")[1]));
  } else if (button.id === "playSong") {
    loadSelectedSong("cameraSetup");
  } else if (button.id === "cameraOk") {
    state = "howTo";
  } else if (button.id === "startGame") {
    startGame();
  } else if (button.id === "retry") {
    resetGame();
    state = "howTo";
  } else if (button.id === "song") {
    resetGame();
    state = "songSelect";
  }
}

function keyPressed() {
  if (key === " " && state === "howTo") startGame();
  if (keyCode === ENTER && state === "main") state = "songSelect";
  if (keyCode === ENTER && state === "songSelect") loadSelectedSong("cameraSetup");
  if (keyCode === ENTER && state === "cameraSetup" && nose) state = "howTo";
  if (keyCode === RIGHT_ARROW && state === "songSelect")
    selectSong(selectedSong + 1);
  if (keyCode === LEFT_ARROW && state === "songSelect")
    selectSong(selectedSong - 1);
  return false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function stageRect() {
  const ratio = width / height;
  let w = width;
  let h = height;
  if (ratio > GAME_CONFIG.stageRatio) w = h * GAME_CONFIG.stageRatio;
  else h = w / GAME_CONFIG.stageRatio;
  return { x: (width - w) / 2, y: (height - h) / 2, w, h };
}

function hitLineY() {
  const stage = stageRect();
  return stage.y + stage.h * GAME_CONFIG.hitLineY;
}

function resultAccuracy() {
  const total = hits + misses;
  if (total === 0) return 0;
  return (hits / total) * 100;
}

function resultRank(accuracy) {
  if (accuracy >= 95) return "S";
  if (accuracy >= 85) return "A";
  if (accuracy >= 70) return "B";
  return "C";
}
