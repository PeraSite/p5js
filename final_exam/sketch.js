let video;
let faceMesh;
let faces = [];
let synth;
let songCatalog;
let songs = [];
let chart;
let selectedSong = 0;
let notes = [];
let state = "loading";
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

function preload() {
  songCatalog = loadJSON(GAME_CONFIG.songsPath);
  faceMesh = ml5.faceMesh({ maxFaces: 1, refineLandmarks: false, flipHorizontal: false });
}

function setup() {
  pixelDensity(1);
  createCanvas(windowWidth, windowHeight);
  textFont("Arial");
  synth = new p5.PolySynth();
  setupCamera();
  songs = songCatalog.songs;
  selectSong(0);
}

function draw() {
  drawCamera();
  updateNose();

  if (state === "playing") {
    gameTime = millis() - startedAt;
    updateNotes();
  }

  drawGame();
  drawUi();
}

function setupCamera() {
  video = createCapture({
    video: {
      width: { ideal: GAME_CONFIG.cameraWidth },
      height: { ideal: GAME_CONFIG.cameraHeight },
      aspectRatio: { ideal: GAME_CONFIG.stageRatio },
      facingMode: "user"
    },
    audio: false
  }, () => faceMesh.detectStart(video, gotFaces));
  video.size(GAME_CONFIG.cameraWidth, GAME_CONFIG.cameraHeight);
  video.elt.setAttribute("playsinline", "");
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
  if (chartRequested) return;

  selectedSong = (index + songs.length) % songs.length;
  state = "loading";
  chartRequested = true;
  loadingMessage = "채보 로딩 중";

  loadJSON(songs[selectedSong].chart, (loaded) => {
    if (!Array.isArray(loaded.notes) || loaded.notes.length === 0) {
      state = "error";
      loadingMessage = "채보 로딩 실패\nnotes 배열이 비어있음";
      chartRequested = false;
      return;
    }
    chart = loaded;
    resetGame();
    state = "ready";
    chartRequested = false;
  }, (error) => {
    state = "error";
    loadingMessage = `채보 로딩 실패\n${songs[selectedSong].chart}`;
    console.error(error);
    chartRequested = false;
  });
}

function resetGame() {
  notes = (chart?.notes || []).map((note, index) => ({ ...note, id: index, hit: false, missed: false }));
  gameTime = 0;
  startedAt = 0;
  score = 0;
  combo = 0;
  maxCombo = 0;
  hits = 0;
  misses = 0;
  judge = "";
}

function startGame() {
  if (state !== "ready" && state !== "finished") return;
  if (!nose) {
    showJudge("FACE REQUIRED");
    return;
  }
  userStartAudio();
  resetGame();
  startedAt = millis();
  state = "playing";
}

function updateNotes() {
  for (const note of notes) {
    if (note.hit || note.missed) continue;

    const pos = notePosition(note);
    const delta = gameTime - note.time;
    const touching = nose && dist(nose.x, nose.y, pos.x, pos.y) < GAME_CONFIG.noseRadius + GAME_CONFIG.noteSize * 0.35;

    if (touching && abs(delta) <= GAME_CONFIG.judgeWindows.at(-1).window) {
      hitNote(note, delta);
    } else if (delta > GAME_CONFIG.missAfter) {
      missNote(note);
    }
  }

  const last = notes[notes.length - 1];
  if (last && gameTime > last.time + 1800) state = "finished";
}

function hitNote(note, delta) {
  const result = GAME_CONFIG.judgeWindows.find((item) => abs(delta) <= item.window);
  note.hit = true;
  hits += 1;
  combo += 1;
  maxCombo = max(maxCombo, combo);
  score += result.score + combo * 12;
  showJudge(result.label);
  synth.play(note.note, 0.85, 0, note.duration || 0.28);
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
  const x = stage.x + stage.w * (1 - point.x / GAME_CONFIG.cameraWidth);
  const y = stage.y + stage.h * (point.y / GAME_CONFIG.cameraHeight);

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
  const before = (gameTime - (note.time - GAME_CONFIG.approachTime)) / GAME_CONFIG.approachTime;
  const after = delta / 800;
  return {
    x: stage.x + stage.w * note.x,
    y: delta <= 0 ? lerp(startY, hitY, before) : lerp(hitY, endY, after),
    visible: before >= 0 && after <= 1
  };
}

function drawCamera() {
  background(0);
  const stage = stageRect();
  if (!video || !video.elt.videoWidth) return;

  push();
  drawingContext.save();
  drawingContext.translate(stage.x + stage.w, stage.y);
  drawingContext.scale(-1, 1);
  drawingContext.drawImage(video.elt, 0, 0, video.elt.videoWidth, video.elt.videoHeight, 0, 0, stage.w, stage.h);
  drawingContext.restore();
  pop();

  noStroke();
  fill(0, 0, 0, 112);
  rect(stage.x, stage.y, stage.w, stage.h);
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

function drawUi() {
  const stage = stageRect();
  const song = songs[selectedSong] || {};

  noStroke();
  fill(0, 0, 0, 176);
  rect(stage.x, stage.y, stage.w, 92);

  fill(255);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(18);
  text(song.title || "로딩 중", stage.x + 18, stage.y + 16);
  textStyle(NORMAL);
  textSize(12);
  fill(230);
  text(`${score}  ${combo} combo  ${hits}/${hits + misses}`, stage.x + 18, stage.y + 45);

  drawSongTabs(stage);

  if (judge && millis() - judgeAt < 520) {
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(28);
    fill(255);
    text(judge, stage.x + stage.w / 2, hitLineY() - 64);
  }

  if (state !== "playing") drawOverlay(stage);
  if (state === "playing" && !nose) drawCenterText(stage, "FACE LOST");
}

function drawSongTabs(stage) {
  const y = stage.y + 64;
  let x = stage.x + 18;
  textAlign(LEFT, CENTER);
  textSize(11);
  textStyle(BOLD);
  for (let i = 0; i < songs.length; i += 1) {
    const label = songs[i].title;
    const w = textWidth(label) + 20;
    fill(i === selectedSong ? 255 : 0, i === selectedSong ? 255 : 0, i === selectedSong ? 255 : 0, i === selectedSong ? 245 : 0);
    stroke(255, 255, 255, 170);
    strokeWeight(1);
    rect(x, y, w, 24, 4);
    noStroke();
    fill(i === selectedSong ? 0 : 255);
    text(label, x + 10, y + 12);
    songs[i].tab = { x, y, w, h: 24 };
    x += w + 8;
  }
}

function drawOverlay(stage) {
  fill(0, 0, 0, 170);
  rect(stage.x, stage.y, stage.w, stage.h);

  if (state === "finished") {
    drawCenterText(stage, `FINISH\n${score} / ${maxCombo} combo\n터치해서 다시 시작`);
  } else if (state === "ready" && nose) {
    drawCenterText(stage, "터치하면 시작");
  } else if (state === "ready") {
    drawCenterText(stage, "얼굴을 카메라에 보여주세요");
  } else {
    drawCenterText(stage, loadingMessage);
  }
}

function drawCenterText(stage, message) {
  noStroke();
  fill(255);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(22);
  text(message, stage.x + stage.w / 2, stage.y + stage.h / 2);
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
  if (state !== "playing") {
    for (let i = 0; i < songs.length; i += 1) {
      const tab = songs[i].tab;
      if (tab && x >= tab.x && x <= tab.x + tab.w && y >= tab.y && y <= tab.y + tab.h) {
        selectSong(i);
        return;
      }
    }
  }
  startGame();
}

function keyPressed() {
  if (key === " ") startGame();
  if (keyCode === RIGHT_ARROW && state !== "playing") selectSong(selectedSong + 1);
  if (keyCode === LEFT_ARROW && state !== "playing") selectSong(selectedSong - 1);
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
