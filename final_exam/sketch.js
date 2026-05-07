let handPose;
let video;
let hands = [];
let chart;
let easyChart;
let song;
let backgroundImage;
let songs = [];
let selectedSongIndex = 0;
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
let judged = 0;
let hitScore = 0;
let lastJudge = null;
let lastJudgeAt = 0;
let hitBursts = [];

const CHART_PATH = "assets/mania/chart.json";
const EASY_CHART_PATH = "assets/mania/pretender-easy.json";
const APPROACH_TIME = 2400;
const PERFECT_WINDOW = 110;
const GOOD_WINDOW = 220;
const MISS_WINDOW = 330;
const HOLD_PASS_RATIO = 0.42;
const CURSOR_SMOOTHING = 0.36;
const NOTE_HEIGHT = 26;
const NOTE_RADIUS = 7;
const WAIT_ZONE_MIN_HEIGHT = 132;
const WAIT_ZONE_RATIO = 0.2;
const LIFT_TRIGGER_MARGIN = 14;
const LIFT_MIN_SPEED = 5.5;
const LANE_MAP = [
  { hand: "left", sector: 0, label: "1" },
  { hand: "left", sector: 1, label: "2" },
  { hand: "left", sector: 2, label: "3" },
  { hand: "left", sector: 3, label: "4" },
  { hand: "right", sector: 0, label: "5" },
  { hand: "right", sector: 1, label: "6" },
  { hand: "right", sector: 2, label: "7" },
  { hand: "right", sector: 3, label: "8" },
];
const HAND_RGB = {
  left: [85, 245, 255],
  right: [255, 226, 68],
};

let smoothedHands = {
  left: null,
  right: null,
};

function preload() {
  chart = loadJSON(CHART_PATH);
  easyChart = loadJSON(EASY_CHART_PATH);
  song = loadSound("assets/mania/audio.mp3");
  backgroundImage = loadImage("assets/mania/background.jpg");
  if (shouldLoadHandPose()) {
    handPose = ml5.handPose({ maxHands: 2 });
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("Arial");
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
  startHandTracking();
  buildSongList();
  activeSong = selectedSong();
  activeSound = song;
  activeBackground = backgroundImage;
  gameState = "select";
}

function draw() {
  drawCameraBackground();
  const playfield = getPlayfield();
  const inputs = readHandInputs(playfield);

  if (gameState === "loading") {
    drawLoading();
    return;
  }

  if (gameState === "select") {
    drawSongSelect();
    drawCursors(inputs);
    return;
  }

  if (gameState === "countdown" && millis() - countdownStartedAt >= 3000) {
    startPlaying();
  }

  if (gameState === "playing") {
    updateGame(getGameTime(), inputs);
  }

  drawGame(playfield, inputs, getGameTime());
}

function gotHands(results) {
  hands = results;
}

function startHandTracking() {
  if (!handPose) return;
  handPose.detectStart(video, gotHands);
}

function shouldLoadHandPose() {
  if (navigator.webdriver) {
    console.warn("Hand tracking skipped in automated browser verification");
    return false;
  }

  if (!hasWebGlSupport()) {
    console.warn("Hand tracking skipped because WebGL is unavailable");
    return false;
  }

  return true;
}

function hasWebGlSupport() {
  const canvas = document.createElement("canvas");
  return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
}

function keyPressed() {
  if (gameState === "select") {
    if (keyCode === LEFT_ARROW || keyCode === UP_ARROW) selectSongOffset(-1);
    if (keyCode === RIGHT_ARROW || keyCode === DOWN_ARROW) selectSongOffset(1);
    if (key === " " || keyCode === ENTER) beginSelectedSong();
    return false;
  }

  if (key === "r" || key === "R") {
    beginSelectedSong();
    return false;
  }

  if ((key === " " || keyCode === ENTER) && gameState === "finished") {
    beginSelectedSong();
    return false;
  }

  if (key === "Escape") {
    stopSong();
    gameState = "select";
    return false;
  }
}

function mousePressed() {
  if (gameState !== "select") return;

  const index = songIndexAt(mouseX, mouseY);
  if (index !== -1) {
    selectedSongIndex = index;
    activeSong = selectedSong();
    return;
  }

  if (pointInRect(mouseX, mouseY, startPromptRect())) {
    beginSelectedSong();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function buildSongList() {
  songs = [
    {
      id: "pretender-easy",
      title: "Pretender",
      artist: easyChart.artist || "Official髭男dism",
      version: easyChart.version || "pretender-easy",
      modeLabel: "8K easy hand chart",
      mapper: "Codex easy edit",
      noteCount: easyChart.noteCount || (easyChart.notes || []).length,
      chartData: easyChart,
      sound: song,
      backgroundImage,
    },
    {
      id: "pretender-original",
      title: "Pretender",
      artist: chart.artist || "Official髭男dism",
      version: chart.version || "Goodbye,",
      modeLabel: "Original import",
      mapper: chart.creator || "osu!mania import",
      noteCount: chart.noteCount || (chart.notes || []).length,
      chartData: chart,
      sound: song,
      backgroundImage,
    },
  ];
}

function selectedSong() {
  return songs[selectedSongIndex] || null;
}

function selectSongOffset(offset) {
  if (songs.length === 0) return;
  selectedSongIndex = (selectedSongIndex + offset + songs.length) % songs.length;
  activeSong = selectedSong();
}

function beginSelectedSong() {
  const selected = selectedSong();
  if (!selected) return;
  activeSong = selected;
  activeSound = selected.sound;
  activeBackground = selected.backgroundImage;
  chart = selected.chartData;
  userStartAudio();
  stopSong();
  if (activeSound) {
    activeSound.playMode("restart");
    activeSound.play();
    activeSound.pause();
  }
  startCountdown();
}

function startCountdown() {
  resetGame();
  stopSong();
  countdownStartedAt = millis();
  gameState = "countdown";
}

function startPlaying() {
  gameState = "playing";
  gameStartedAt = millis();
  stopSong();
  if (activeSound) {
    activeSound.playMode("restart");
    activeSound.play();
  }
}

function stopSong() {
  if (activeSound && activeSound.isPlaying()) activeSound.stop();
  if (song && song !== activeSound && song.isPlaying()) song.stop();
}

function resetGame() {
  notes = (chart.notes || []).map((note) => ({
    ...note,
    hit: false,
    missed: false,
    holding: false,
    completed: false,
    holdFrames: 0,
    heldFrames: 0,
  }));
  score = 0;
  combo = 0;
  maxCombo = 0;
  judged = 0;
  hitScore = 0;
  lastJudge = null;
  lastJudgeAt = 0;
  hitBursts = [];
}

function getGameTime() {
  if (gameState !== "playing") return 0;
  if (activeSound && !activeSound.isPlaying()) activeSound.play();
  return activeSound ? activeSound.currentTime() * 1000 : millis() - gameStartedAt;
}

function updateGame(gameTime, inputs) {
  for (const note of notes) {
    if (note.completed || note.missed) continue;

    const isHold = note.endTime > note.time + 80;
    if (isHold) {
      updateHold(note, gameTime, inputs);
    } else {
      updateTap(note, gameTime, inputs);
    }
  }

  const lastNote = notes[notes.length - 1];
  const finishTime = lastNote ? max(lastNote.endTime, lastNote.time) + 1800 : 0;
  if (gameTime > finishTime && gameState === "playing") {
    stopSong();
    gameState = "finished";
  }
}

function updateTap(note, gameTime, inputs) {
  if (abs(gameTime - note.time) <= MISS_WINDOW && fingerMatches(note, inputs, true)) {
    judgeNote(note, abs(gameTime - note.time), false);
    return;
  }

  if (gameTime > note.time + MISS_WINDOW) missNote(note);
}

function updateHold(note, gameTime, inputs) {
  if (!note.holding) {
    if (abs(gameTime - note.time) <= MISS_WINDOW && fingerMatches(note, inputs, true)) {
      note.holding = true;
      judgeNote(note, abs(gameTime - note.time), true);
    } else if (gameTime > note.time + MISS_WINDOW) {
      missNote(note);
    }
    return;
  }

  if (gameTime >= note.time && gameTime <= note.endTime) {
    note.holdFrames += 1;
    if (fingerMatches(note, inputs, false)) note.heldFrames += 1;
  }

  if (gameTime > note.endTime) {
    const ratio = note.holdFrames === 0 ? 1 : note.heldFrames / note.holdFrames;
    if (ratio >= HOLD_PASS_RATIO) {
      note.completed = true;
      score += 120;
      showJudge("HOLD", color(130, 230, 255));
    } else {
      missNote(note, "DROP");
    }
  }
}

function judgeNote(note, delta, isHold) {
  note.hit = true;
  if (!isHold) note.completed = true;

  let label = "GOOD";
  let accuracy = 0.72;
  let addScore = isHold ? 180 : 240;
  let judgeColor = color(255, 210, 120);

  if (delta <= PERFECT_WINDOW) {
    label = "PERFECT";
    accuracy = 1;
    addScore = isHold ? 280 : 360;
    judgeColor = color(105, 245, 255);
  } else if (delta > GOOD_WINDOW) {
    label = "OK";
    accuracy = 0.45;
    addScore = isHold ? 90 : 140;
    judgeColor = color(255, 165, 100);
  }

  judged += 1;
  hitScore += accuracy;
  score += addScore + combo * 4;
  combo += 1;
  maxCombo = max(maxCombo, combo);
  addHitBurst(note);
  showJudge(label, judgeColor);
}

function missNote(note, label = "MISS") {
  note.missed = true;
  note.completed = true;
  judged += 1;
  combo = 0;
  showJudge(label, color(255, 95, 95));
}

function fingerMatches(note, inputs, requireLift) {
  const lane = noteLane(note);
  const input = inputs[lane.hand];
  return input && input.zone === lane.sector && (!requireLift || input.lifted);
}

function readHandInputs(playfield) {
  const points = hands
    .map((hand) => keypoint(hand, 8, "index_finger_tip"))
    .filter(Boolean)
    .map(mirroredPoint)
    .sort((a, b) => a.x - b.x);

  const assigned = { left: null, right: null };
  if (points.length === 1) {
    assigned[points[0].x < width / 2 ? "left" : "right"] = points[0];
  } else if (points.length >= 2) {
    assigned.left = points[0];
    assigned.right = points[points.length - 1];
  }

  return {
    left: makeHandInput("left", assigned.left, playfield.left),
    right: makeHandInput("right", assigned.right, playfield.right),
  };
}

function makeHandInput(hand, point, field) {
  if (!point) {
    smoothedHands[hand] = null;
    return null;
  }

  const previous = smoothedHands[hand];
  const cursor = previous
    ? {
        x: lerp(previous.x, point.x, CURSOR_SMOOTHING),
        y: lerp(previous.y, point.y, CURSOR_SMOOTHING),
      }
    : point;

  const laneProgress = constrain((cursor.x - field.x) / field.w, 0, 0.999);
  const zone = floor(laneProgress * 4);
  const waiting = cursor.y >= field.waitTop;
  const lifted =
    previous &&
    previous.waiting &&
    cursor.y < field.waitTop - LIFT_TRIGGER_MARGIN &&
    previous.y - cursor.y >= LIFT_MIN_SPEED;
  const state = waiting ? "waiting" : lifted ? "lift" : "active";

  const input = { x: cursor.x, y: cursor.y, cursor, zone, state, waiting, lifted };
  smoothedHands[hand] = input;
  return input;
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

function getPlayfield() {
  const top = 86;
  const bottom = height - 28;
  const marginX = max(18, width * 0.045);
  const gap = max(18, width * 0.022);
  const usableWidth = width - marginX * 2 - gap;
  const handWidth = usableWidth * 0.5;
  const waitHeight = max(WAIT_ZONE_MIN_HEIGHT, height * WAIT_ZONE_RATIO);
  const waitTop = max(top + 230, bottom - waitHeight);
  const base = {
    y: top,
    h: bottom - top,
    hitY: waitTop,
    waitTop,
    bottom,
    laneCount: 4,
    laneW: handWidth / 4,
  };

  return {
    left: {
      ...base,
      x: marginX,
      w: handWidth,
      label: "LEFT",
    },
    right: {
      ...base,
      x: marginX + handWidth + gap,
      w: handWidth,
      label: "RIGHT",
    },
    gap,
  };
}

function drawGame(playfield, inputs, gameTime) {
  drawHud(gameTime);
  drawPlayfield(playfield, inputs);
  if (gameState === "playing") {
    drawActiveNotes(playfield, gameTime);
    drawHitBursts(playfield);
  }
  drawCursors(inputs);

  if (gameState === "countdown") drawCountdown();
  if (gameState === "finished") drawFinished();
}

function drawCameraBackground() {
  background(5, 6, 8);

  const selectedBackground = gameState === "select" ? selectedSong()?.backgroundImage : activeBackground;
  if (selectedBackground) {
    drawCoverImage(selectedBackground, 0, 0, width, height);
  } else if (video && video.loadedmetadata) {
    const rect = videoRect();
    push();
    translate(rect.x + rect.w, rect.y);
    scale(-1, 1);
    image(video, 0, 0, rect.w, rect.h);
    pop();
  }

  if (gameState !== "select" && video && video.loadedmetadata) {
    const rect = videoRect();
    push();
    translate(rect.x + rect.w, rect.y);
    scale(-1, 1);
    tint(255, 56);
    image(video, 0, 0, rect.w, rect.h);
    noTint();
    pop();
  }

  noStroke();
  fill(0, 0, 0, gameState === "select" ? 118 : 96);
  rect(0, 0, width, height);
}

function drawHud(gameTime) {
  const accuracy = judged === 0 ? 100 : (hitScore / judged) * 100;
  noStroke();
  fill(0, 0, 0, 120);
  rect(0, 0, width, 70);

  fill(255);
  textAlign(LEFT, CENTER);
  textStyle(BOLD);
  textSize(18);
  const hudSong = activeSong || selectedSong();
  text(`${hudSong?.title || chart.title} - ${hudSong?.artist || chart.artist}`, 24, 23);
  textStyle(NORMAL);
  textSize(13);
  fill(255, 255, 255, 160);
  text(`${hudSong?.version || chart.version} / ${hudSong?.noteCount || chart.noteCount} playable notes`, 24, 48);

  textAlign(RIGHT, CENTER);
  textStyle(BOLD);
  textSize(22);
  fill(105, 245, 255);
  text(nf(score, 1, 0), width - 24, 22);
  textStyle(NORMAL);
  textSize(14);
  fill(255, 255, 255, 180);
  text(`Combo ${combo}   Acc ${nf(constrain(accuracy, 0, 100), 2, 1)}%`, width - 24, 49);

  if (lastJudge && millis() - lastJudgeAt < 650) {
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(32);
    fill(lastJudge.color);
    text(lastJudge.label, width / 2, 98);
  }
}

function drawPlayfield(playfield, inputs) {
  drawHandField("left", playfield.left, inputs.left);
  drawHandField("right", playfield.right, inputs.right);

  stroke(255, 255, 255, 36);
  strokeWeight(2);
  line(width / 2, 86, width / 2, height - 28);
}

function drawHandField(hand, field, input) {
  noStroke();
  fill(4, 7, 10, 112);
  rect(field.x, field.y, field.w, field.h, 8);

  const activeZone = input ? input.zone : null;
  for (let sector = 0; sector < field.laneCount; sector += 1) {
    const x = laneX(field, sector);
    const pressure = upcomingPressure(hand, sector);
    const active = activeZone === sector;
    const laneAlpha = active ? 82 : 28 + pressure * 62;

    noStroke();
    fill(handColor(hand, laneAlpha));
    rect(x + 2, field.y, field.laneW - 4, field.hitY - field.y, 6);

    stroke(255, 255, 255, 32);
    strokeWeight(1);
    line(x, field.y, x, field.bottom);

    noStroke();
    fill(handColor(hand, active ? 245 : 195));
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(16);
    text(laneFor(hand, sector), x + field.laneW * 0.5, field.bottom - 31);
  }

  stroke(255, 255, 255, 48);
  strokeWeight(1);
  line(field.x + field.w, field.y, field.x + field.w, field.bottom);

  noStroke();
  fill(0, 0, 0, 156);
  rect(field.x, field.waitTop, field.w, field.bottom - field.waitTop, 0, 0, 8, 8);

  const ready = input && input.waiting;
  fill(handColor(hand, ready ? 78 : 38));
  rect(field.x + 2, field.waitTop + 2, field.w - 4, field.bottom - field.waitTop - 4, 0, 0, 7, 7);

  stroke(ready ? handColor(hand, 250) : color(255, 255, 255, 190));
  strokeWeight(ready ? 4 : 3);
  line(field.x, field.hitY, field.x + field.w, field.hitY);

  for (let sector = 0; sector < field.laneCount; sector += 1) {
    const x = laneX(field, sector);
    const active = activeZone === sector;
    noStroke();
    fill(handColor(hand, active ? 245 : 195));
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(16);
    text(laneFor(hand, sector), x + field.laneW * 0.5, field.bottom - 31);
  }

  noStroke();
  fill(handColor(hand, 205));
  textAlign(LEFT, CENTER);
  textStyle(BOLD);
  textSize(12);
  text(field.label, field.x + 10, field.y + 18);
}

function drawActiveNotes(playfield, gameTime) {
  for (const note of notes) {
    if (note.completed || note.missed) continue;
    if (gameTime < note.time - APPROACH_TIME || gameTime > note.endTime + MISS_WINDOW) continue;

    const lane = noteLane(note);
    const field = playfield[lane.hand];
    const progress = constrain((gameTime - (note.time - APPROACH_TIME)) / APPROACH_TIME, 0, 1.18);
    const y = noteY(field, progress);
    const alpha = gameTime > note.time ? map(gameTime - note.time, 0, MISS_WINDOW, 255, 80, true) : 255;

    if (note.endTime > note.time + 80) drawHoldTail(field, lane.sector, note, gameTime, lane.hand, y);
    drawFallingNote(field, lane.sector, y, lane.hand, alpha, note.hit);
  }
}

function drawHoldTail(field, sector, note, gameTime, hand, headY) {
  const distance = field.hitY - field.y;
  const durationRatio = (note.endTime - note.time) / APPROACH_TIME;
  const tailY = headY - distance * durationRatio;
  const x = laneCenterX(field, sector);
  const w = field.laneW * 0.42;
  const topY = constrain(tailY, field.y - 80, field.hitY);
  const bottomY = constrain(headY, field.y, field.hitY);

  noStroke();
  fill(0, 0, 0, note.holding ? 128 : 88);
  rect(x - w * 0.5 - 4, topY, w + 8, max(8, bottomY - topY), 6);
  fill(handColor(hand, note.holding ? 108 : 62));
  rect(x - w * 0.5, topY, w, max(8, bottomY - topY), 5);
}

function drawFallingNote(field, sector, y, hand, alpha, hit) {
  const x = laneX(field, sector) + field.laneW * 0.12;
  const w = field.laneW * 0.76;
  const h = NOTE_HEIGHT;

  push();
  drawingContext.shadowBlur = 13;
  drawingContext.shadowColor = handShadow(hand, 0.32);
  noStroke();
  fill(0, 0, 0, alpha * 0.76);
  rect(x - 4, y - h * 0.5 - 4, w + 8, h + 8, NOTE_RADIUS + 4);
  drawingContext.shadowBlur = 0;
  fill(handColor(hand, hit ? alpha * 0.42 : alpha));
  rect(x, y - h * 0.5, w, h, NOTE_RADIUS);
  fill(255, 255, 255, alpha * 0.78);
  rect(x + w * 0.17, y - 2, w * 0.66, 4, 3);
  pop();
}

function drawCursors(inputs) {
  for (const hand of ["left", "right"]) {
    const input = inputs[hand];
    if (!input) continue;
    const active = input.state === "lift" || input.state === "active";
    const cursorColor = input.state === "lift" ? color(255) : active ? handColor(hand) : handColor(hand, 190);
    push();
    noFill();
    stroke(cursorColor);
    strokeWeight(3);
    circle(input.cursor.x, input.cursor.y, input.state === "lift" ? 42 : active ? 36 : 30);
    stroke(0, 0, 0, 170);
    strokeWeight(5);
    point(input.cursor.x, input.cursor.y);
    stroke(255, 255, 255, 220);
    strokeWeight(2);
    line(input.cursor.x - 18, input.cursor.y, input.cursor.x + 18, input.cursor.y);
    line(input.cursor.x, input.cursor.y - 18, input.cursor.x, input.cursor.y + 18);
    noStroke();
    fill(0, 0, 0, 160);
    rectMode(CENTER);
    rect(input.cursor.x, input.cursor.y - 30, 92, 22, 6);
    fill(cursorColor);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(11);
    text(`${hand.toUpperCase()} ${laneFor(hand, input.zone)}`, input.cursor.x, input.cursor.y - 31);
    pop();
  }
}

function drawHitBursts(playfield) {
  const now = millis();
  hitBursts = hitBursts.filter((burst) => now - burst.createdAt < 300);
  for (const burst of hitBursts) {
    const age = now - burst.createdAt;
    const p = constrain(age / 300, 0, 1);
    const lane = noteLane(burst);
    const field = playfield[lane.hand];
    const pos = { x: laneCenterX(field, lane.sector), y: field.hitY };
    noFill();
    stroke(handColor(lane.hand, map(p, 0, 1, 160, 0)));
    strokeWeight(3);
    rect(pos.x - lerp(18, field.laneW * 0.42, p), pos.y - lerp(12, 34, p), lerp(36, field.laneW * 0.84, p), lerp(24, 68, p), 8);
  }
}

function drawLoading() {
  drawScrim();
  textAlign(CENTER, CENTER);
  noStroke();
  fill(255);
  textStyle(BOLD);
  textSize(min(width * 0.06, 62));
  text("LOADING", width / 2, height * 0.42);
  textStyle(NORMAL);
  textSize(18);
  fill(255, 255, 255, 205);
  text("Preparing maps", width / 2, height * 0.5);
}

function drawSongSelect() {
  const selected = selectedSong();
  if (!selected) return;

  noStroke();
  fill(0, 0, 0, 72);
  rect(0, 0, width, height);

  const panelX = width * 0.07;
  const panelY = height * 0.12;
  const panelW = min(width * 0.52, 720);

  textAlign(LEFT, TOP);
  textStyle(BOLD);
  fill(255);
  textSize(clamp(width * 0.052, 42, 76));
  text(selected.title, panelX, panelY, panelW, 92);

  textStyle(NORMAL);
  fill(255, 255, 255, 218);
  textSize(22);
  text(selected.artist, panelX, panelY + 98);

  textSize(14);
  fill(255, 255, 255, 165);
  text(`${selected.version} / ${selected.modeLabel} / ${selected.noteCount} notes`, panelX, panelY + 132);

  const rail = songRailLayout();
  for (let i = 0; i < songs.length; i += 1) {
    drawSongTile(i, rail.x, rail.y + i * rail.step, rail.w, rail.h);
  }

  drawStartPrompt();
}

function drawSongTile(index, x, y, w, h) {
  const item = songs[index];
  const selected = index === selectedSongIndex;
  const hover = mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h;

  if (item.backgroundImage) drawCoverImage(item.backgroundImage, x, y, w, h);
  noStroke();
  fill(selected ? color(8, 18, 26, 90) : color(0, 0, 0, hover ? 112 : 156));
  rect(x, y, w, h, 8);

  if (selected) {
    stroke(105, 245, 255, 235);
    strokeWeight(3);
    noFill();
    rect(x + 1.5, y + 1.5, w - 3, h - 3, 8);
  }

  noStroke();
  fill(selected ? color(105, 245, 255) : color(255));
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(18);
  text(item.title, x + 18, y + 17, w - 36, 24);

  textStyle(NORMAL);
  textSize(13);
  fill(255, 255, 255, 178);
  text(`${item.artist}  ${item.version}`, x + 18, y + 45, w - 36, 18);

  fill(255, 255, 255, 132);
  text(item.modeLabel, x + 18, y + h - 28);
}

function drawStartPrompt() {
  const prompt = startPromptRect();
  fill(0, 0, 0, 128);
  noStroke();
  rect(prompt.x, prompt.y, prompt.w, prompt.h, 8);

  fill(105, 245, 255);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(18);
  text("Space / Enter to select", prompt.x + 22, prompt.y + 17);

  fill(255, 255, 255, 165);
  textStyle(NORMAL);
  textSize(13);
  text("Starts after 3 2 1 countdown", prompt.x + 22, prompt.y + 44);
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
  for (let i = 0; i < songs.length; i += 1) {
    const tileY = rail.y + i * rail.step;
    if (x >= rail.x && x <= rail.x + rail.w && y >= tileY && y <= tileY + rail.h) return i;
  }
  return -1;
}

function startPromptRect() {
  return {
    x: width * 0.07,
    y: height - 118,
    w: min(520, width * 0.7),
    h: 74,
  };
}

function pointInRect(x, y, rectInfo) {
  return x >= rectInfo.x && x <= rectInfo.x + rectInfo.w && y >= rectInfo.y && y <= rectInfo.y + rectInfo.h;
}

function drawCountdown() {
  const left = max(1, 3 - floor((millis() - countdownStartedAt) / 1000));
  drawScrim();
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(min(width, height) * 0.16);
  fill(255);
  text(left, width / 2, height / 2);
}

function drawFinished() {
  const accuracy = judged === 0 ? 100 : (hitScore / judged) * 100;
  drawScrim();
  textAlign(CENTER, CENTER);
  noStroke();
  fill(255);
  textStyle(BOLD);
  textSize(56);
  text("FINISH", width / 2, height * 0.36);
  textStyle(NORMAL);
  textSize(24);
  text(`Score ${nf(score, 1, 0)}`, width / 2, height * 0.45);
  text(`Accuracy ${nf(constrain(accuracy, 0, 100), 2, 1)}%`, width / 2, height * 0.5);
  text(`Max Combo ${maxCombo}`, width / 2, height * 0.55);
  textSize(16);
  fill(255, 255, 255, 175);
  text("Press R to replay", width / 2, height * 0.63);
}

function drawScrim() {
  noStroke();
  fill(0, 0, 0, 142);
  rect(0, 0, width, height);
}

function addHitBurst(note) {
  hitBursts.push({
    lane: note.lane,
    hand: note.hand,
    sector: note.sector,
    createdAt: millis(),
  });
}

function showJudge(label, judgeColor) {
  lastJudge = { label, color: judgeColor };
  lastJudgeAt = millis();
}

function upcomingPressure(hand, sector) {
  if (gameState !== "playing") return 0;
  const gameTime = getGameTime();
  let pressure = 0;
  for (const note of notes) {
    if (note.completed || note.missed) continue;
    const lane = noteLane(note);
    if (lane.hand !== hand || lane.sector !== sector) continue;
    const until = note.time - gameTime;
    if (until < 0 || until > APPROACH_TIME) continue;
    pressure = max(pressure, 1 - until / APPROACH_TIME);
  }
  return pressure;
}

function laneFor(hand, sector) {
  const index = LANE_MAP.findIndex((lane) => lane.hand === hand && lane.sector === sector);
  return index === -1 ? "" : LANE_MAP[index].label;
}

function noteLane(note) {
  if (note && note.hand && Number.isFinite(note.sector)) {
    return { hand: note.hand, sector: note.sector };
  }
  return LANE_MAP[note?.lane] || LANE_MAP[0];
}

function laneX(field, sector) {
  return field.x + sector * field.laneW;
}

function laneCenterX(field, sector) {
  return laneX(field, sector) + field.laneW * 0.5;
}

function noteY(field, progress) {
  return lerp(field.y - NOTE_HEIGHT, field.hitY, constrain(progress, 0, 1.18));
}

function handColor(hand, alpha = 255) {
  const rgb = HAND_RGB[hand];
  return color(rgb[0], rgb[1], rgb[2], alpha);
}

function handShadow(hand, alpha) {
  const rgb = HAND_RGB[hand];
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
}

function clamp(value, minValue, maxValue) {
  return Math.max(minValue, Math.min(maxValue, value));
}

function videoRect() {
  const videoRatio = video.width / video.height;
  const canvasRatio = width / height;
  let w = width;
  let h = height;

  if (canvasRatio > videoRatio) {
    h = width / videoRatio;
  } else {
    w = height * videoRatio;
  }

  return {
    x: (width - w) / 2,
    y: (height - h) / 2,
    w,
    h,
  };
}

function drawCoverImage(img, x, y, w, h) {
  const imageRatio = img.width / img.height;
  const targetRatio = w / h;
  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;

  if (imageRatio > targetRatio) {
    sw = img.height * targetRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / targetRatio;
    sy = (img.height - sh) / 2;
  }

  image(img, sx, sy, sw, sh, x, y, w, h);
}
