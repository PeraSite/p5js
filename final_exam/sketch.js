let handPose;
let video;
let hands = [];
let handInputs = [];
let previousPinches = [];

const MANIFEST_PATH = "assets/songs/index.json";
const NOTE_RADIUS = 76;
const APPROACH_TIME = 1380;
const APPROACH_RADIUS = 240;
const SLIDER_TRACK_WIDTH = 132;
const SLIDER_TRACK_BORDER = 6;
const SLIDER_TOLERANCE = 146;
const PERFECT_WINDOW = 170;
const GOOD_WINDOW = 320;
const BAD_WINDOW = 520;
const PINCH_MEMORY = 680;
const PINCH_START_RATIO = 0.46;
const PINCH_RELEASE_RATIO = 0.64;
const PINCH_MAX_START_DISTANCE = 50;
const TAP_HIT_MULTIPLIER = 1.95;
const DUAL_HIT_MULTIPLIER = 2.0;
const SLIDER_START_MULTIPLIER = 1.95;
const PINCH_IMPACT_DURATION = 240;
const CALIBRATION_STEP_TIME = 1200;
const CALIBRATION_PINCH_RATIO = 0.72;
const LANES = {
  left: { x0: 0.08, x1: 0.42, label: "LEFT" },
  right: { x0: 0.58, x1: 0.92, label: "RIGHT" },
};

let songs = [];
let selectedSongIndex = 0;
let loadingMessage = "Loading songs";
let loadingError = null;
let pendingPinchStart = false;
let activeSong = null;
let activeSound = null;
let activeBackground = null;
let notes = [];
let gameState = "loading";
let countdownStartedAt = 0;
let gameStartedAt = 0;
let score = 0;
let combo = 0;
let maxCombo = 0;
let earnedAccuracyScore = 0;
let judgedAccuracyMax = 0;
let lastJudge = null;
let lastJudgeAt = 0;
let calibrationPhaseStartedAt = 0;
let openCalibrationRatios = [];
let pinchCalibrationRatios = [];
let calibratedPinchStartRatio = PINCH_START_RATIO;
let calibratedPinchReleaseRatio = PINCH_RELEASE_RATIO;
let hitEffects = [];
let pinchEffects = [];

function preload() {
  handPose = ml5.handPose({ maxHands: 2 });
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("Arial");
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
  handPose.detectStart(video, gotHands);
  loadSongManifest();
}

function draw() {
  drawSceneBackground();
  handInputs = readHandInputs();

  if (gameState === "loading") {
    drawLoading();
  } else if (gameState === "select") {
    updateSongSelect();
    drawSongSelect();
  } else {
    if (gameState === "calibrateOpen" || gameState === "calibratePinch") {
      updateCalibration();
    }

    if (gameState === "countdown" && millis() - countdownStartedAt >= 3000) {
      startPlaying();
    }

    const gameTime = getGameTime();
    if (gameState === "playing") {
      updateGame(gameTime);
    }

    drawGame(gameTime);
  }

  drawCursors();
  drawPinchImpactEffects();
  drawPinchDebug();
  previousPinches = handInputs.map((hand) => hand.pinching);
}

async function loadSongManifest() {
  try {
    const response = await fetch(MANIFEST_PATH);
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const manifest = await response.json();
    songs = (manifest.songs || []).map((song) => ({
      ...song,
      backgroundImage: null,
      chartData: null,
      sound: null,
      loading: false,
      loadingPromise: null,
    }));

    if (songs.length === 0) throw new Error("No songs in manifest");
    gameState = "select";
    loadSongAssets(songs[0], { sound: false, chart: false });
    for (const song of songs.slice(1)) {
      loadSongAssets(song, { sound: false, chart: false });
    }
  } catch (error) {
    loadingError = error.message;
  }
}

async function loadSongAssets(song, options = {}) {
  const loadSoundFile = options.sound !== false;
  const loadChart = options.chart !== false;

  if (!song) return;
  if (song.loadingPromise) await song.loadingPromise;

  const needsBackground = !song.backgroundImage && song.cover;
  const needsChart = loadChart && !song.chartData;
  const needsSound = loadSoundFile && !song.sound;
  if (!needsBackground && !needsChart && !needsSound) return;

  song.loading = true;
  song.loadingPromise = (async () => {
    if (!song.backgroundImage && song.cover) {
      song.backgroundImage = await loadImageAsync(song.cover);
    }
    if (loadChart && !song.chartData) {
      const response = await fetch(song.chart);
      if (!response.ok) throw new Error(`${song.id} chart ${response.status}`);
      song.chartData = await response.json();
    }
    if (loadSoundFile && !song.sound) {
      song.sound = await loadSoundAsync(song.audio);
    }
  })();

  try {
    await song.loadingPromise;
  } catch (error) {
    song.error = error.message;
    loadingError = error.message;
  } finally {
    song.loading = false;
    song.loadingPromise = null;
  }
}

function loadImageAsync(src) {
  return new Promise((resolve, reject) => {
    loadImage(src, resolve, () => reject(new Error(`Could not load ${src}`)));
  });
}

function loadSoundAsync(src) {
  return new Promise((resolve, reject) => {
    loadSound(src, resolve, () => reject(new Error(`Could not load ${src}`)));
  });
}

function updateSongSelect() {
  if (songs.length === 0) return;

  const pinchStart = handInputs.some((hand) => hand.justPinched);
  if (pinchStart && !pendingPinchStart) {
    beginSelectedSong();
  }
}

async function beginSelectedSong() {
  const song = selectedSong();
  if (!song) return;

  pendingPinchStart = true;
  loadingMessage = `Preparing ${song.title}`;
  await loadSongAssets(song, { sound: true, chart: true });
  pendingPinchStart = false;

  if (song.error || !song.chartData || !song.sound) {
    loadingError = song.error || "Song failed to load";
    gameState = "select";
    return;
  }

  activeSong = song;
  activeSound = song.sound;
  activeBackground = song.backgroundImage;
  startCalibration();
}

function selectedSong() {
  return songs[selectedSongIndex] || null;
}

function mousePressed() {
  if (gameState !== "select") return;

  const index = songIndexAt(mouseX, mouseY);
  if (index !== -1) {
    selectedSongIndex = index;
  }
}

function keyPressed() {
  if (gameState === "select") {
    if (keyCode === LEFT_ARROW || keyCode === UP_ARROW) selectSongOffset(-1);
    if (keyCode === RIGHT_ARROW || keyCode === DOWN_ARROW) selectSongOffset(1);
    if (key === " ") beginSelectedSong();
    return;
  }

  if (key === "Escape") {
    stopActiveSound();
    gameState = "select";
    return;
  }

  if (key === "r" || key === "R") {
    resetGame();
    startCalibration();
  }
}

function selectSongOffset(offset) {
  if (songs.length === 0) return;
  selectedSongIndex = (selectedSongIndex + offset + songs.length) % songs.length;
  loadSongAssets(selectedSong(), { sound: false, chart: false });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function gotHands(results) {
  hands = results;
}

function startCountdown() {
  resetGame();
  gameState = "countdown";
  countdownStartedAt = millis();
}

function startCalibration() {
  resetGame();
  gameState = "calibrateOpen";
  calibrationPhaseStartedAt = millis();
  openCalibrationRatios = [];
  pinchCalibrationRatios = [];
}

function startPlaying() {
  gameState = "playing";
  gameStartedAt = millis();
  stopActiveSound();
  resumeAudioContext();
  if (activeSound) {
    activeSound.playMode("restart");
    activeSound.play();
  }
}

function resetGame() {
  buildChart();
  score = 0;
  combo = 0;
  maxCombo = 0;
  earnedAccuracyScore = 0;
  judgedAccuracyMax = 0;
  lastJudge = null;
  lastJudgeAt = 0;
  hitEffects = [];
  pinchEffects = [];
  previousPinches = [];
}

function buildChart() {
  const sourceNotes = activeSong?.chartData?.notes || [];
  notes = sourceNotes.map((note, index) => normalizeRuntimeNote(note, index));
}

function normalizeRuntimeNote(note, index) {
  const base = {
    id: note.id || `${note.type}-${note.time}-${index}`,
    type: note.type,
    time: note.time,
    hit: false,
    missed: false,
  };

  if (note.type === "slider") {
    return {
      ...base,
      duration: note.duration,
      points: note.points,
      started: false,
      completed: false,
      coverage: 0,
      frames: 0,
      maxScore: 500,
      accuracyMax: 500,
    };
  }

  const targetCount = note.targets.length;
  return {
    ...base,
    targets: note.targets,
    maxScore: targetCount > 1 ? 600 : 300,
    accuracyMax: targetCount > 1 ? 600 : 300,
  };
}

function updateCalibration() {
  const primaryHand = handInputs[0];
  if (!primaryHand) {
    calibrationPhaseStartedAt = millis();
    return;
  }

  if (gameState === "calibrateOpen") {
    openCalibrationRatios.push(primaryHand.pinchRatio);
    if (millis() - calibrationPhaseStartedAt >= CALIBRATION_STEP_TIME) {
      gameState = "calibratePinch";
      calibrationPhaseStartedAt = millis();
      previousPinches = [];
    }
    return;
  }

  const openRatio = median(openCalibrationRatios);
  const isRealCalibrationPinch = primaryHand.pinchRatio < openRatio * CALIBRATION_PINCH_RATIO;
  if (!isRealCalibrationPinch) {
    calibrationPhaseStartedAt = millis();
    pinchCalibrationRatios = [];
    return;
  }

  pinchCalibrationRatios.push(primaryHand.pinchRatio);
  if (millis() - calibrationPhaseStartedAt >= CALIBRATION_STEP_TIME) {
    applyPinchCalibration();
    startCountdown();
  }
}

function applyPinchCalibration() {
  const openRatio = median(openCalibrationRatios);
  const pinchedRatio = percentile(pinchCalibrationRatios, 0.2);
  const hasUsefulSamples = openCalibrationRatios.length > 8 && pinchCalibrationRatios.length > 8;
  const looksLikePinch = pinchedRatio > 0 && pinchedRatio < openRatio * 0.78;

  if (!hasUsefulSamples || !looksLikePinch) {
    calibratedPinchStartRatio = PINCH_START_RATIO;
    calibratedPinchReleaseRatio = PINCH_RELEASE_RATIO;
    return;
  }

  calibratedPinchStartRatio = constrain(pinchedRatio + (openRatio - pinchedRatio) * 0.25, 0.24, 0.46);
  calibratedPinchReleaseRatio = constrain(calibratedPinchStartRatio + 0.14, calibratedPinchStartRatio + 0.08, 0.62);
}

function getGameTime() {
  if (gameState !== "playing") return 0;
  if (activeSound?.isLoaded()) return activeSound.currentTime() * 1000;
  return millis() - gameStartedAt;
}

function updateGame(gameTime) {
  for (const note of notes) {
    if (note.type === "slider") {
      updateSlider(note, gameTime);
    } else {
      updateTapLike(note, gameTime);
    }
  }

  const lastNote = notes[notes.length - 1];
  const chartFinishAt = lastNote ? lastNote.time + (lastNote.duration || 0) + 1400 : 0;
  const audioFinishAt = activeSound?.isLoaded() ? activeSound.duration() * 1000 + 300 : 0;
  if (gameTime > max(chartFinishAt, audioFinishAt)) {
    gameState = "finished";
    stopActiveSound();
  }
}

function updateTapLike(note, gameTime) {
  if (note.hit || note.missed) return;

  if (abs(gameTime - note.time) <= BAD_WINDOW) {
    if (note.type === "tap") {
      const pinchedHand = handInputs.find((hand) => {
        return isRecentPinchForNote(hand, note, gameTime) && handMatchesTarget(hand, note.targets[0]) && isInsideTarget(hand.cursor, note.targets[0], TAP_HIT_MULTIPLIER);
      });
      if (pinchedHand) {
        judgeNote(note, abs(gameTime - note.time));
      }
    }

    if (note.type === "dual") {
      const matched = matchDualTargets(note, gameTime);
      if (matched) {
        judgeNote(note, abs(gameTime - note.time));
      }
    }
  }

  if (gameTime > note.time + BAD_WINDOW) {
    missNote(note);
  }
}

function updateSlider(note, gameTime) {
  if (note.completed || note.missed) return;

  const startPoint = note.points[0];
  const endTime = note.time + note.duration;

  if (!note.started && abs(gameTime - note.time) <= BAD_WINDOW) {
    const starter = handInputs.find((hand) => {
      return isRecentPinchForNote(hand, note, gameTime) && handMatchesTarget(hand, startPoint) && isInsideTarget(hand.cursor, startPoint, SLIDER_START_MULTIPLIER);
    });
    if (starter) {
      note.started = true;
      showJudge("SLIDE", color(120, 230, 255));
    }
  }

  if (!note.started && gameTime > note.time + BAD_WINDOW) {
    missNote(note);
    return;
  }

  if (note.started && gameTime >= note.time && gameTime <= endTime) {
    const progress = constrain((gameTime - note.time) / note.duration, 0, 1);
    const pathPoint = pointOnSlider(note, progress);
    const tracking = handInputs.some((hand) => {
      return handMatchesTarget(hand, startPoint) && dist(hand.cursor.x, hand.cursor.y, pathPoint.x, pathPoint.y) <= SLIDER_TOLERANCE;
    });
    note.frames += 1;
    if (tracking) {
      note.coverage += 1;
    }
  }

  if (note.started && gameTime > endTime) {
    completeSlider(note);
  }
}

function matchDualTargets(note, gameTime) {
  const candidates = handInputs
    .map((hand, index) => ({ hand, index }))
    .filter(({ hand }) => {
      return hand.lastPinchAt !== null && abs(hand.lastPinchAt - note.time) <= BAD_WINDOW && gameTime - hand.lastPinchAt <= PINCH_MEMORY;
    });

  if (candidates.length < 2) return false;

  for (let i = 0; i < candidates.length; i++) {
    for (let j = 0; j < candidates.length; j++) {
      if (i === j) continue;
      const first = candidates[i].hand.cursor;
      const second = candidates[j].hand.cursor;
      const firstFits =
        handMatchesTarget(candidates[i].hand, note.targets[0]) &&
        handMatchesTarget(candidates[j].hand, note.targets[1]) &&
        isInsideTarget(first, note.targets[0], DUAL_HIT_MULTIPLIER) &&
        isInsideTarget(second, note.targets[1], DUAL_HIT_MULTIPLIER);
      const swappedFits =
        handMatchesTarget(candidates[i].hand, note.targets[1]) &&
        handMatchesTarget(candidates[j].hand, note.targets[0]) &&
        isInsideTarget(first, note.targets[1], DUAL_HIT_MULTIPLIER) &&
        isInsideTarget(second, note.targets[0], DUAL_HIT_MULTIPLIER);
      if (firstFits || swappedFits) return true;
    }
  }
  return false;
}

function isRecentPinchForNote(hand, note, gameTime) {
  if (hand.lastPinchAt === null) return false;
  const activePinch = hand.justPinched || (hand.pinching && gameTime - hand.lastPinchAt <= PINCH_MEMORY);
  return activePinch && abs(hand.lastPinchAt - note.time) <= BAD_WINDOW;
}

function judgeNote(note, delta) {
  note.hit = true;
  let label = "BAD";
  let addScore = note.type === "dual" ? 120 : 60;
  let accuracy = note.type === "dual" ? 120 : 60;
  let judgeColor = color(255, 185, 90);

  if (delta <= PERFECT_WINDOW) {
    label = "PERFECT";
    addScore = note.maxScore;
    accuracy = note.accuracyMax;
    judgeColor = color(110, 245, 255);
  } else if (delta <= GOOD_WINDOW) {
    label = "GOOD";
    addScore = note.type === "dual" ? 360 : 180;
    accuracy = note.type === "dual" ? 360 : 180;
    judgeColor = color(145, 255, 160);
  }

  score += addScore + combo * 4;
  earnedAccuracyScore += accuracy;
  judgedAccuracyMax += note.accuracyMax;
  combo += 1;
  maxCombo = max(maxCombo, combo);
  showJudge(label, judgeColor);
  addNoteEffect(note, "hit", judgeColor);
}

function missNote(note) {
  note.missed = true;
  judgedAccuracyMax += note.accuracyMax;
  combo = 0;
  showJudge("MISS", color(255, 95, 95));
  addNoteEffect(note, "miss", color(255, 95, 95));
}

function completeSlider(note) {
  note.completed = true;
  const ratio = note.frames === 0 ? 0 : note.coverage / note.frames;
  judgedAccuracyMax += note.accuracyMax;

  if (ratio >= 0.78) {
    score += note.maxScore + combo * 6;
    earnedAccuracyScore += note.accuracyMax;
    combo += 1;
    showJudge("PERFECT", color(110, 245, 255));
    addSliderEndEffect(note, "hit", color(110, 245, 255));
  } else if (ratio >= 0.55) {
    score += 300 + combo * 4;
    earnedAccuracyScore += 300;
    combo += 1;
    showJudge("GOOD", color(145, 255, 160));
    addSliderEndEffect(note, "hit", color(145, 255, 160));
  } else if (ratio >= 0.32) {
    score += 120;
    earnedAccuracyScore += 120;
    combo = 0;
    showJudge("BAD", color(255, 185, 90));
    addSliderEndEffect(note, "miss", color(255, 185, 90));
  } else {
    combo = 0;
    showJudge("MISS", color(255, 95, 95));
    addSliderEndEffect(note, "miss", color(255, 95, 95));
  }

  maxCombo = max(maxCombo, combo);
}

function showJudge(label, judgeColor) {
  lastJudge = { label, judgeColor };
  lastJudgeAt = millis();
}

function addNoteEffect(note, type, effectColor) {
  if (note.type === "slider") {
    addSliderEndEffect(note, type, effectColor);
    return;
  }

  for (const target of note.targets) {
    addEffect(screenPoint(target), type, effectColor);
  }
}

function addSliderEndEffect(note, type, effectColor) {
  const point = note.started || note.completed ? pointOnSlider(note, 1) : screenPoint(note.points[0]);
  addEffect(point, type, effectColor);
}

function addEffect(point, type, effectColor) {
  hitEffects.push({
    x: point.x,
    y: point.y,
    type,
    effectColor,
    createdAt: millis(),
  });
}

function drawSceneBackground() {
  const bg = gameState === "select" ? selectedSong()?.backgroundImage : activeBackground;
  if (gameState === "select") {
    drawMirroredCamera({ overlayAlpha: 70 });
    if (bg) {
      tint(255, 138);
      drawCoverImage(bg, 0, 0, width, height);
      noTint();
      noStroke();
      fill(3, 5, 10, 82);
      rect(0, 0, width, height);
    }
    return;
  }

  if (bg) {
    drawCoverImage(bg, 0, 0, width, height);
    noStroke();
    fill(3, 5, 10, 178);
    rect(0, 0, width, height);
  } else {
    drawMirroredCamera();
  }

  if (gameState !== "select" && gameState !== "loading") {
    const cameraFrame = videoRect();
    push();
    translate(cameraFrame.x + cameraFrame.w, cameraFrame.y);
    scale(-1, 1);
    tint(255, 42);
    image(video, 0, 0, cameraFrame.w, cameraFrame.h);
    noTint();
    pop();
    fill(0, 0, 0, 168);
    noStroke();
    rect(0, 0, width, height);
  }
}

function drawLoading() {
  drawCenterText(loadingError ? "LOAD ERROR" : "LOADING", loadingError || loadingMessage);
}

function drawSongSelect() {
  const song = selectedSong();
  if (!song) return;

  noStroke();
  fill(0, 0, 0, 72);
  rect(0, 0, width, height);

  const panelX = width * 0.07;
  const panelY = height * 0.1;
  const panelW = min(width * 0.52, 720);

  textAlign(LEFT, TOP);
  textStyle(BOLD);
  fill(255);
  textSize(clamp(width * 0.052, 42, 76));
  text(song.title, panelX, panelY, panelW, 92);

  textStyle(NORMAL);
  fill(255, 255, 255, 218);
  textSize(22);
  text(song.artist, panelX, panelY + 98);

  textSize(14);
  fill(255, 255, 255, 165);
  text(`${song.version} / ${song.modeLabel} / mapped by ${song.mapper}`, panelX, panelY + 132);

  const rail = songRailLayout();
  for (let i = 0; i < songs.length; i++) {
    drawSongTile(i, rail.x, rail.y + i * rail.step, rail.w, rail.h);
  }

  drawPinchStartPrompt(song);
}

function drawSongTile(index, x, y, w, h) {
  const song = songs[index];
  const selected = index === selectedSongIndex;
  const hover = mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h;

  if (song.backgroundImage) drawCoverImage(song.backgroundImage, x, y, w, h);
  noStroke();
  fill(selected ? color(8, 18, 26, 80) : color(0, 0, 0, hover ? 110 : 152));
  rect(x, y, w, h, 8);

  if (selected) {
    stroke(110, 245, 255, 230);
    strokeWeight(3);
    noFill();
    rect(x + 1.5, y + 1.5, w - 3, h - 3, 8);
  }

  noStroke();
  fill(selected ? color(110, 245, 255) : color(255));
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(18);
  text(song.title, x + 18, y + 17, w - 36, 24);

  textStyle(NORMAL);
  textSize(13);
  fill(255, 255, 255, 178);
  text(`${song.artist}  ${song.version}`, x + 18, y + 45, w - 36, 18);

  fill(255, 255, 255, 132);
  text(song.modeLabel, x + 18, y + h - 28);
}

function drawPinchStartPrompt(song) {
  const x = width * 0.07;
  const y = height - 118;
  const isLoading = pendingPinchStart || song.loading;

  fill(0, 0, 0, 118);
  noStroke();
  rect(x, y, min(520, width * 0.7), 74, 8);

  fill(isLoading ? color(255, 235, 120) : color(110, 245, 255));
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(18);
  text(isLoading ? loadingMessage : "Pinch to start", x + 22, y + 17);

  fill(255, 255, 255, 165);
  textStyle(NORMAL);
  textSize(13);
  text(`${songs.length} tracks loaded`, x + 22, y + 44);
}

function songRailLayout() {
  const w = min(420, width * 0.34);
  const h = 90;
  return {
    x: width - w - width * 0.07,
    y: height * 0.16,
    w,
    h,
    step: h + 14,
  };
}

function songIndexAt(x, y) {
  const rail = songRailLayout();
  for (let i = 0; i < songs.length; i++) {
    const tileY = rail.y + i * rail.step;
    if (x >= rail.x && x <= rail.x + rail.w && y >= tileY && y <= tileY + rail.h) return i;
  }
  return -1;
}

function drawGame(gameTime) {
  drawLaneGuides();
  drawTopHud(gameTime);

  if (gameState === "calibrateOpen") {
    drawCalibration("OPEN HAND", "Keep thumb and index apart");
    return;
  }

  if (gameState === "calibratePinch") {
    drawCalibration("PINCH", "Touch thumb and index together");
    return;
  }

  if (gameState === "countdown") {
    const left = 3 - floor((millis() - countdownStartedAt) / 1000);
    drawCenterText(str(max(left, 1)), "Get both hands in camera");
    return;
  }

  drawNotes(gameTime);
  drawHitEffects();
  drawJudgeText();

  if (gameState === "finished") {
    drawFinished();
  }
}

function drawLaneGuides() {
  const centerLeft = LANES.left.x1 * width;
  const centerRight = LANES.right.x0 * width;
  const top = 62;

  noStroke();
  fill(0, 0, 0, 22);
  rect(0, top, centerLeft, height - top);
  rect(centerRight, top, width - centerRight, height - top);

  fill(0, 0, 0, 88);
  rect(centerLeft, top, centerRight - centerLeft, height - top);

  stroke(255, 255, 255, 18);
  strokeWeight(1);
  line(centerLeft, top, centerLeft, height);
  line(centerRight, top, centerRight, height);

  noStroke();
  textAlign(CENTER, CENTER);
  textSize(13);
  fill(255, 255, 255, 48);
  text(LANES.left.label, (LANES.left.x0 + LANES.left.x1) * 0.5 * width, top + 24);
  text(LANES.right.label, (LANES.right.x0 + LANES.right.x1) * 0.5 * width, top + 24);
}

function drawTopHud(gameTime) {
  const acc = judgedAccuracyMax === 0 ? 100 : (earnedAccuracyScore / judgedAccuracyMax) * 100;
  noStroke();
  fill(0, 0, 0, 140);
  rect(0, 0, width, 62);

  fill(255);
  textAlign(LEFT, CENTER);
  textSize(18);
  text(`Score ${floor(score)}`, 24, 22);
  text(`Combo ${combo}`, 24, 46);

  if (activeSong) {
    textAlign(CENTER, CENTER);
    textSize(15);
    fill(255, 255, 255, 190);
    text(`${activeSong.title}  ${formatTime(gameTime)}`, width / 2, 32);
  }

  fill(255);
  textAlign(RIGHT, CENTER);
  textSize(18);
  text(`Acc ${nf(constrain(acc, 0, 100), 2, 1)}%`, width - 24, 22);
  text(`Max ${maxCombo}`, width - 24, 46);
}

function drawNotes(gameTime) {
  for (const note of notes) {
    if (note.hit || note.missed || note.completed) continue;

    if (note.type === "slider") {
      drawSlider(note, gameTime);
    } else {
      drawTapLike(note, gameTime);
    }
  }
}

function drawTapLike(note, gameTime) {
  const visible = gameTime >= note.time - APPROACH_TIME && gameTime <= note.time + BAD_WINDOW;
  if (!visible) return;

  const targetColor = note.type === "dual" ? color(255, 210, 110) : color(255);
  const approach = approachSize(note.time, gameTime);
  const progress = approachProgress(note.time, gameTime);
  const noteAlpha = noteOpacity(note.time, gameTime);

  if (note.type === "dual") {
    const a = screenPoint(note.targets[0]);
    const b = screenPoint(note.targets[1]);
    stroke(255, 255, 255, 64 * noteAlpha);
    strokeWeight(2);
    line(a.x, a.y, b.x, b.y);
  }

  for (const target of note.targets) {
    const point = screenPoint(target);
    drawTarget(point.x, point.y, NOTE_RADIUS, approach, targetColor, noteAlpha, progress);
  }
}

function drawSlider(note, gameTime) {
  const visible = gameTime >= note.time - APPROACH_TIME && gameTime <= note.time + note.duration + 250;
  if (!visible) return;

  const sliderColor = color(255);
  const start = screenPoint(note.points[0]);
  const approach = approachSize(note.time, gameTime);
  const progress = approachProgress(note.time, gameTime);
  const noteAlpha = noteOpacity(note.time, gameTime);

  drawSliderTrack(note, noteAlpha);

  drawTarget(start.x, start.y, NOTE_RADIUS, approach, sliderColor, noteAlpha, progress);

  if (note.started) {
    const progress = constrain((gameTime - note.time) / note.duration, 0, 1);
    const follow = pointOnSlider(note, progress);
    const tracking = handInputs.some((hand) => {
      return handMatchesTarget(hand, note.points[0]) && dist(hand.cursor.x, hand.cursor.y, follow.x, follow.y) <= SLIDER_TOLERANCE;
    });

    const followColor = tracking ? color(255) : color(255, 95, 95);
    drawSliderFollowCircle(follow.x, follow.y, followColor, tracking);
  }
}

function drawSliderTrack(note, alphaScale) {
  const points = [];
  for (let i = 0; i <= 36; i++) {
    points.push(pointOnSlider(note, i / 36));
  }

  push();
  drawingContext.shadowBlur = 16;
  drawingContext.shadowColor = "rgba(255,255,255,0.16)";
  strokeCap(ROUND);
  strokeJoin(ROUND);
  noFill();

  stroke(255, 255, 255, 52 * alphaScale);
  strokeWeight(SLIDER_TRACK_WIDTH + SLIDER_TRACK_BORDER * 2);
  drawPolyline(points);

  drawingContext.shadowBlur = 0;
  stroke(255, 255, 255, 220 * alphaScale);
  strokeWeight(SLIDER_TRACK_WIDTH + SLIDER_TRACK_BORDER);
  drawPolyline(points);

  stroke(12, 12, 12, 185 * alphaScale);
  strokeWeight(SLIDER_TRACK_WIDTH);
  drawPolyline(points);

  stroke(255, 255, 255, 34 * alphaScale);
  strokeWeight(SLIDER_TRACK_WIDTH * 0.72);
  drawPolyline(points);
  pop();
}

function drawPolyline(points) {
  beginShape();
  for (const point of points) {
    vertex(point.x, point.y);
  }
  endShape();
}

function drawSliderFollowCircle(x, y, followColor, tracking) {
  const ringAlpha = tracking ? 235 : 210;
  push();
  drawingContext.shadowBlur = tracking ? 18 : 10;
  drawingContext.shadowColor = tracking ? "rgba(255,255,255,0.35)" : "rgba(255,95,95,0.35)";

  noStroke();
  fill(255, 255, 255, tracking ? 38 : 18);
  circle(x, y, NOTE_RADIUS * 2.12);

  noFill();
  stroke(red(followColor), green(followColor), blue(followColor), ringAlpha);
  strokeWeight(7);
  circle(x, y, NOTE_RADIUS * 1.82);

  stroke(255, 255, 255, tracking ? 130 : 70);
  strokeWeight(2);
  circle(x, y, NOTE_RADIUS * 2.22);
  pop();
}

function drawTarget(x, y, radius, approach, targetColor, alphaScale = 1, progress = 1) {
  push();
  drawingContext.shadowBlur = 18;
  drawingContext.shadowColor = "rgba(255,255,255,0.22)";

  noStroke();
  fill(255, 255, 255, 22 * alphaScale);
  circle(x, y, radius * 2.34);

  fill(10, 10, 10, 112 * alphaScale);
  circle(x, y, radius * 1.62);

  noFill();
  stroke(red(targetColor), green(targetColor), blue(targetColor), 230 * alphaScale);
  strokeWeight(7);
  circle(x, y, radius * 1.72);

  stroke(255, 255, 255, 118 * alphaScale);
  strokeWeight(2);
  circle(x, y, radius * 2.12);

  drawingContext.shadowBlur = 0;
  drawApproachRings(x, y, radius, approach, alphaScale, progress);
  pop();
}

function drawApproachRings(x, y, radius, approach, alphaScale, progress) {
  noFill();
  const outerAlpha = map(progress, 0, 1, 70, 210) * alphaScale;

  stroke(255, 255, 255, outerAlpha);
  strokeWeight(3);
  circle(x, y, approach * 2);
}

function drawJudgeText() {
  if (!lastJudge) return;
  const age = millis() - lastJudgeAt;
  if (age > 650) return;

  const alpha = map(age, 0, 650, 255, 0);
  fill(red(lastJudge.judgeColor), green(lastJudge.judgeColor), blue(lastJudge.judgeColor), alpha);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(40);
  textStyle(BOLD);
  text(lastJudge.label, width / 2, height * 0.22);
  textStyle(NORMAL);
}

function drawHitEffects() {
  const now = millis();
  hitEffects = hitEffects.filter((effect) => now - effect.createdAt <= 620);

  for (const effect of hitEffects) {
    const age = now - effect.createdAt;
    const progress = constrain(age / 620, 0, 1);
    const alpha = map(progress, 0, 1, 230, 0);
    const baseSize = effect.type === "hit" ? NOTE_RADIUS * 1.1 : NOTE_RADIUS * 0.9;
    const ringSize = effect.type === "hit" ? baseSize + progress * 115 : baseSize + progress * 42;

    noFill();
    stroke(red(effect.effectColor), green(effect.effectColor), blue(effect.effectColor), alpha);
    strokeWeight(effect.type === "hit" ? 7 - progress * 5 : 5);
    circle(effect.x, effect.y, ringSize * 2);

    if (effect.type === "hit") {
      noStroke();
      fill(red(effect.effectColor), green(effect.effectColor), blue(effect.effectColor), alpha * 0.32);
      circle(effect.x, effect.y, (NOTE_RADIUS * 1.6 + progress * 65) * 2);

      stroke(255, 255, 255, alpha * 0.75);
      strokeWeight(3);
      for (let i = 0; i < 8; i++) {
        const angle = (TWO_PI / 8) * i + progress * 0.5;
        const inner = NOTE_RADIUS * 0.65 + progress * 45;
        const outer = inner + 16 + progress * 22;
        line(effect.x + cos(angle) * inner, effect.y + sin(angle) * inner, effect.x + cos(angle) * outer, effect.y + sin(angle) * outer);
      }
    } else {
      stroke(255, 95, 95, alpha);
      strokeWeight(5);
      const crossSize = NOTE_RADIUS * 0.45 + progress * 18;
      line(effect.x - crossSize, effect.y - crossSize, effect.x + crossSize, effect.y + crossSize);
      line(effect.x + crossSize, effect.y - crossSize, effect.x - crossSize, effect.y + crossSize);
    }
  }
}

function drawCenterText(title, subtitle) {
  fill(0, 0, 0, 138);
  noStroke();
  rect(0, 0, width, height);
  textAlign(CENTER, CENTER);
  fill(255);
  textStyle(BOLD);
  textSize(min(width, height) * 0.12);
  text(title, width / 2, height / 2 - 20);
  textStyle(NORMAL);
  textSize(18);
  fill(255, 255, 255, 210);
  text(subtitle, width / 2, height / 2 + 58);
}

function drawCalibration(title, subtitle) {
  const progress = constrain((millis() - calibrationPhaseStartedAt) / CALIBRATION_STEP_TIME, 0, 1);
  drawCenterText(title, subtitle);

  const barWidth = min(width * 0.42, 320);
  const barHeight = 8;
  const x = width / 2 - barWidth / 2;
  const y = height / 2 + 88;
  noStroke();
  fill(255, 255, 255, 70);
  rect(x, y, barWidth, barHeight, 8);
  fill(255, 255, 255, 225);
  rect(x, y, barWidth * progress, barHeight, 8);

  if (handInputs.length === 0) {
    fill(255, 120, 120);
    textAlign(CENTER, CENTER);
    textSize(16);
    text("No hand detected", width / 2, y + 34);
  }
}

function drawFinished() {
  const acc = judgedAccuracyMax === 0 ? 100 : (earnedAccuracyScore / judgedAccuracyMax) * 100;
  fill(0, 0, 0, 175);
  rect(0, 0, width, height);
  textAlign(CENTER, CENTER);
  noStroke();
  fill(255);
  textStyle(BOLD);
  textSize(54);
  text("FINISH", width / 2, height / 2 - 82);
  textStyle(NORMAL);
  textSize(24);
  text(`Score ${floor(score)}`, width / 2, height / 2 - 20);
  text(`Accuracy ${nf(constrain(acc, 0, 100), 2, 1)}%`, width / 2, height / 2 + 18);
  text(`Max Combo ${maxCombo}`, width / 2, height / 2 + 56);
}

function drawCursors() {
  for (const hand of handInputs) {
    const cursor = hand.cursor;
    stroke(255, 255, 255, hand.pinching ? 88 : 52);
    strokeWeight(1.5);
    line(cursor.x, cursor.y, hand.thumb.x, hand.thumb.y);

    noStroke();
    fill(255, 255, 255, hand.pinching ? 82 : 48);
    circle(cursor.x, cursor.y, hand.pinching ? 28 : 22);

    if (hand.justPinched) {
      fill(255, 255, 255, 135);
      circle(cursor.x, cursor.y, 12);
    }

    fill(0, 0, 0, 130);
    circle(cursor.x, cursor.y, 6);
  }
}

function drawPinchImpactEffects() {
  const now = millis();
  pinchEffects = pinchEffects.filter((effect) => now - effect.createdAt <= PINCH_IMPACT_DURATION);

  for (const effect of pinchEffects) {
    const age = now - effect.createdAt;
    const progress = constrain(age / PINCH_IMPACT_DURATION, 0, 1);
    const eased = easeOutCubic(progress);
    const alpha = map(progress, 0, 1, 110, 0);
    const ringSize = lerp(18, 52, eased);

    push();
    drawingContext.shadowBlur = 8 * (1 - progress);
    drawingContext.shadowColor = "rgba(255,255,255,0.18)";

    noFill();
    stroke(255, 255, 255, alpha);
    strokeWeight(2 - progress);
    circle(effect.x, effect.y, ringSize);

    noStroke();
    fill(255, 255, 255, alpha * 0.16);
    circle(effect.x, effect.y, lerp(16, 28, eased));
    pop();
  }
}

function drawPinchDebug() {
  if (gameState === "select" || gameState === "playing") return;
  const panelWidth = 230;
  const panelHeight = 38 + max(1, min(handInputs.length, 2)) * 48;
  const x = 16;
  const y = 78;

  noStroke();
  fill(0, 0, 0, 130);
  rect(x, y, panelWidth, panelHeight, 8);

  fill(255, 255, 255, 220);
  textAlign(LEFT, CENTER);
  textSize(13);
  text("Pinch meter", x + 12, y + 18);

  if (handInputs.length === 0) {
    fill(255, 255, 255, 150);
    text("Hand: none", x + 12, y + 54);
    return;
  }

  const handCount = min(handInputs.length, 2);
  for (let i = 0; i < handCount; i++) {
    const hand = handInputs[i];
    const rowY = y + 46 + i * 48;
    const meterX = x + 12;
    const meterY = rowY + 14;
    const meterWidth = panelWidth - 24;
    const meterHeight = 8;
    const threshold = hand.pinching ? hand.releaseThreshold : hand.startThreshold;
    const distanceRatio = constrain(hand.pinchDistance / max(hand.releaseThreshold * 1.7, 1), 0, 1);
    const thresholdRatio = constrain(threshold / max(hand.releaseThreshold * 1.7, 1), 0, 1);

    fill(hand.pinching ? color(255, 235, 120) : color(255, 255, 255, 190));
    text(`Hand ${i + 1}: ${hand.pinching ? "PINCH" : "open"}`, meterX, rowY);

    fill(255, 255, 255, 55);
    rect(meterX, meterY, meterWidth, meterHeight, 6);
    fill(hand.pinching ? color(255, 235, 120) : color(110, 245, 255));
    rect(meterX, meterY, meterWidth * (1 - distanceRatio), meterHeight, 6);

    stroke(255, 120, 120, 220);
    strokeWeight(2);
    const thresholdX = meterX + meterWidth * (1 - thresholdRatio);
    line(thresholdX, meterY - 4, thresholdX, meterY + meterHeight + 4);

    noStroke();
    fill(255, 255, 255, 130);
    textSize(11);
    text(`${floor(hand.pinchDistance)}px / ${floor(threshold)}px`, meterX, rowY + 34);
    textSize(13);
  }
}

function drawMirroredCamera(options = {}) {
  const overlayAlpha = options.overlayAlpha ?? 105;
  background(10);
  const cameraFrame = videoRect();

  push();
  translate(cameraFrame.x + cameraFrame.w, cameraFrame.y);
  scale(-1, 1);
  image(video, 0, 0, cameraFrame.w, cameraFrame.h);
  pop();

  fill(0, 0, 0, overlayAlpha);
  noStroke();
  rect(0, 0, width, height);
}

function drawCoverImage(img, x, y, w, h) {
  const imageRatio = img.width / img.height;
  const targetRatio = w / h;
  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;

  if (targetRatio > imageRatio) {
    sh = img.width / targetRatio;
    sy = (img.height - sh) / 2;
  } else {
    sw = img.height * targetRatio;
    sx = (img.width - sw) / 2;
  }

  image(img, x, y, w, h, sx, sy, sw, sh);
}

function readHandInputs() {
  const inputs = [];
  for (let i = 0; i < hands.length; i++) {
    const hand = hands[i];
    const wrist = keypoint(hand, 0, "wrist");
    const thumb = keypoint(hand, 4, "thumb_tip");
    const index = keypoint(hand, 8, "index_finger_tip");
    const indexBase = keypoint(hand, 5, "index_finger_mcp");

    if (!wrist || !thumb || !index || !indexBase) continue;

    const cursor = mirroredPoint(index);
    const thumbPoint = mirroredPoint(thumb);
    const wristPoint = mirroredPoint(wrist);
    const basePoint = mirroredPoint(indexBase);
    const handScale = max(45, dist(wristPoint.x, wristPoint.y, basePoint.x, basePoint.y));
    const pinchDistance = dist(cursor.x, cursor.y, thumbPoint.x, thumbPoint.y);
    const wasPinching = previousPinches[i] || false;
    const startThreshold = min(handScale * calibratedPinchStartRatio, PINCH_MAX_START_DISTANCE);
    const releaseThreshold = min(handScale * calibratedPinchReleaseRatio, PINCH_MAX_START_DISTANCE * 1.35);
    const pinching = wasPinching ? pinchDistance < releaseThreshold : pinchDistance < startThreshold;
    const justPinched = pinching && !wasPinching;
    const lastPinchAt = justPinched ? getGameTime() : getPreviousPinchTime(i, pinching);
    if (justPinched) {
      addPinchImpactEffect(cursor, cursor.x < width / 2 ? "left" : "right");
    }

    inputs.push({
      cursor,
      thumb: thumbPoint,
      side: cursor.x < width / 2 ? "left" : "right",
      pinching,
      justPinched,
      lastPinchAt,
      pinchDistance,
      handScale,
      pinchRatio: pinchDistance / handScale,
      startThreshold,
      releaseThreshold,
      rawIndex: i,
    });
  }
  return inputs;
}

function addPinchImpactEffect(point, side) {
  pinchEffects.push({
    x: point.x,
    y: point.y,
    side,
    createdAt: millis(),
  });
}

function getPreviousPinchTime(index, pinching) {
  const previousInput = handInputs.find((hand) => hand.rawIndex === index);
  if (pinching && previousInput) return previousInput.lastPinchAt;
  return null;
}

function keypoint(hand, fallbackIndex, name) {
  if (!hand || !hand.keypoints) return null;
  return hand.keypoints.find((point) => point.name === name) || hand.keypoints[fallbackIndex];
}

function mirroredPoint(point) {
  const rect = videoRect();
  return {
    x: rect.x + (1 - point.x / video.width) * rect.w,
    y: rect.y + (point.y / video.height) * rect.h,
  };
}

function screenPoint(point) {
  if (point.side && LANES[point.side]) {
    const lane = LANES[point.side];
    return {
      x: lerp(lane.x0 * width, lane.x1 * width, point.x),
      y: point.y * height,
    };
  }

  return {
    x: point.x * width,
    y: point.y * height,
  };
}

function handMatchesTarget(hand, target) {
  return !target.side || hand.side === target.side;
}

function videoRect() {
  const videoRatio = video.width / video.height;
  const canvasRatio = width / height;
  let w;
  let h;
  if (canvasRatio > videoRatio) {
    w = width;
    h = width / videoRatio;
  } else {
    h = height;
    w = height * videoRatio;
  }
  return {
    x: (width - w) / 2,
    y: (height - h) / 2,
    w,
    h,
  };
}

function approachSize(noteTime, gameTime) {
  const progress = approachProgress(noteTime, gameTime);
  return lerp(APPROACH_RADIUS, NOTE_RADIUS, progress);
}

function approachProgress(noteTime, gameTime) {
  return constrain(1 - (noteTime - gameTime) / APPROACH_TIME, 0, 1);
}

function noteOpacity(noteTime, gameTime) {
  const untilHit = noteTime - gameTime;
  if (untilHit >= 0) {
    return map(approachProgress(noteTime, gameTime), 0, 1, 0.32, 1);
  }
  return constrain(map(abs(untilHit), 0, BAD_WINDOW, 1, 0.36), 0.36, 1);
}

function easeOutCubic(amount) {
  const t = constrain(amount, 0, 1);
  return 1 - pow(1 - t, 3);
}

function isInsideTarget(cursor, target, multiplier) {
  const point = screenPoint(target);
  return dist(cursor.x, cursor.y, point.x, point.y) <= NOTE_RADIUS * multiplier;
}

function pointOnSlider(note, progress) {
  const a = screenPoint(note.points[0]);
  const b = screenPoint(note.points[1]);
  const c = screenPoint(note.points[2]);
  const ab = lerpPoint(a, b, progress);
  const bc = lerpPoint(b, c, progress);
  return lerpPoint(ab, bc, progress);
}

function lerpPoint(a, b, amount) {
  return {
    x: lerp(a.x, b.x, amount),
    y: lerp(a.y, b.y, amount),
  };
}

function median(values) {
  return percentile(values, 0.5);
}

function percentile(values, amount) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = floor(constrain(amount, 0, 1) * (sorted.length - 1));
  return sorted[index];
}

function formatTime(ms) {
  const seconds = floor(ms / 1000);
  return `${floor(seconds / 60)}:${nf(seconds % 60, 2)}`;
}

function clamp(value, minValue, maxValue) {
  return Math.max(minValue, Math.min(maxValue, value));
}

function stopActiveSound() {
  if (activeSound?.isPlaying()) {
    activeSound.stop();
  }
}

function resumeAudioContext() {
  if (typeof getAudioContext !== "function") return;
  const context = getAudioContext();
  if (context?.state === "suspended") {
    context.resume();
  }
}
