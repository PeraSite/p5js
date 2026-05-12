let video;
let bodyPose;
let poses = [];
let easyChart;
let piano;
let reverb;
let delayFx;

let notes = [];
let hitBursts = [];
let gameState = "loading";
let countdownStartedAt = 0;
let gameStartedAt = 0;
let lastGameTime = 0;
let score = 0;
let combo = 0;
let maxCombo = 0;
let hits = 0;
let misses = 0;
let lastJudge = null;
let lastJudgeAt = 0;
let smoothedPlayer = null;
let fallbackPlayer = null;
let audioReady = false;

const CHART_PATH = "assets/mania/pretender-easy.json";
const VIDEO_W = 320;
const VIDEO_H = 480;
const APPROACH_TIME = 1850;
const HIT_WINDOW = 150;
const PLAYER_RADIUS_RATIO = 0.068;
const NOTE_RADIUS_RATIO = 0.045;
const TOP_UI_H = 86;
const PLAY_TOP_RATIO = 0.14;
const PLAY_BOTTOM_RATIO = 0.74;
const MAX_NOTES = 220;
const SMOOTHING = 0.42;
const NOSE_CONFIDENCE = 0.18;
const MISS_SOUND_MIN_GAP = 90;
const NOTE_COLORS = [
  [255, 105, 180],
  [255, 202, 87],
  [80, 214, 255],
  [147, 232, 99],
  [188, 136, 255],
  [255, 139, 102],
  [124, 243, 202],
  [255, 255, 255],
];
const MELODY = [
  "D4",
  "F#4",
  "A4",
  "B4",
  "A4",
  "F#4",
  "E4",
  "D4",
  "A3",
  "D4",
  "E4",
  "F#4",
  "A4",
  "B4",
  "C#5",
  "A4",
];

function preload() {
  easyChart = loadJSON(CHART_PATH);
  if (shouldLoadBodyPose()) {
    bodyPose = ml5.bodyPose();
  }
}

function setup() {
  pixelDensity(1);
  createCanvas(windowWidth, windowHeight);
  textFont("Arial");
  fallbackPlayer = createVector(width / 2, height * 0.72);
  setupCamera();
  setupSynth();
  buildNotes();
  gameState = "ready";
}

function draw() {
  drawScene();
  const player = readPlayer();

  if (gameState === "countdown") {
    const elapsed = millis() - countdownStartedAt;
    if (elapsed >= 2400) startPlaying();
  }

  const gameTime = currentGameTime();
  if (gameState === "playing") {
    updateNotes(gameTime, player);
  }

  drawTrack(gameTime);
  drawHitBursts();
  drawPlayer(player);
  drawHud();

  if (gameState === "ready") drawStartScreen(player);
  if (gameState === "countdown") drawCountdown();
  if (gameState === "finished") drawFinishScreen();
}

function setupCamera() {
  video = createCapture({
    video: {
      width: { ideal: VIDEO_W },
      height: { ideal: VIDEO_H },
      frameRate: { ideal: 30, max: 30 },
      facingMode: "user",
    },
    audio: false,
  });
  video.size(VIDEO_W, VIDEO_H);
  video.elt.setAttribute("playsinline", "");
  video.hide();

  if (bodyPose) {
    bodyPose.detectStart(video, gotPoses);
  }
}

function setupSynth() {
  piano = new p5.PolySynth();
  reverb = new p5.Reverb();
  delayFx = new p5.Delay();
  reverb.process(piano, 2.3, 1.8);
  delayFx.process(piano, 0.18, 0.18, 1300);
}

function shouldLoadBodyPose() {
  if (navigator.webdriver) return false;
  const canvas = document.createElement("canvas");
  return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
}

function gotPoses(results) {
  poses = results || [];
}

function buildNotes() {
  const source = Array.isArray(easyChart?.notes) ? easyChart.notes : [];
  const filtered = source
    .filter((note) => Number.isFinite(note.time))
    .filter((note, index) => index % 2 === 0)
    .slice(0, MAX_NOTES);

  if (filtered.length === 0) {
    notes = Array.from({ length: 80 }, (_, index) => noteFromData({ time: 1000 + index * 520, lane: index % 8 }, index));
    return;
  }

  const firstTime = filtered[0].time;
  notes = filtered.map((note, index) => noteFromData({ ...note, time: note.time - firstTime + 1000 }, index));
}

function noteFromData(note, index) {
  const lane = constrain(Number.isFinite(note.lane) ? note.lane : index % 8, 0, 7);
  const phrase = floor(index / 8);
  const pitchIndex = (lane + index + phrase * 3) % MELODY.length;
  return {
    id: `${note.id || "note"}-${index}`,
    time: note.time,
    lane,
    pitch: MELODY[pitchIndex],
    xProgress: (lane + 0.5) / 8,
    judged: false,
    hit: false,
    color: NOTE_COLORS[lane % NOTE_COLORS.length],
  };
}

function beginGame() {
  userStartAudio();
  audioReady = true;
  resetGame();
  countdownStartedAt = millis();
  gameState = "countdown";
}

function startPlaying() {
  gameStartedAt = millis();
  lastGameTime = 0;
  gameState = "playing";
}

function resetGame() {
  buildNotes();
  hitBursts = [];
  score = 0;
  combo = 0;
  maxCombo = 0;
  hits = 0;
  misses = 0;
  lastJudge = null;
  lastJudgeAt = 0;
}

function currentGameTime() {
  if (gameState !== "playing") return lastGameTime;
  lastGameTime = millis() - gameStartedAt;
  return lastGameTime;
}

function updateNotes(gameTime, player) {
  const playerRadius = playerRadiusPx();
  const noteRadius = noteRadiusPx();

  for (const note of notes) {
    if (note.judged) continue;
    const pos = notePosition(note, gameTime);
    const signedTimingDelta = gameTime - note.time;
    const timingDelta = abs(signedTimingDelta);
    const distanceNow = dist(player.x, player.y, pos.x, pos.y);

    if (pos.progress >= 0 && distanceNow <= playerRadius + noteRadius) {
      hitNote(note, pos, signedTimingDelta);
    } else if (gameTime > note.time + HIT_WINDOW) {
      missNote(note, pos);
    }
  }

  const last = notes[notes.length - 1];
  if (last && gameTime > last.time + 2200) {
    gameState = "finished";
  }
}

function hitNote(note, pos, signedTimingDelta) {
  note.judged = true;
  note.hit = true;
  const timingDelta = abs(signedTimingDelta);

  if (timingDelta <= HIT_WINDOW) {
    hits += 1;
    combo += 1;
    maxCombo = max(maxCombo, combo);
    const timingScore = timingDelta < 55 ? 320 : timingDelta < 105 ? 220 : 120;
    score += timingScore + combo * 10;
    showJudge(timingDelta < 55 ? "PERFECT" : "HIT", color(255, 255, 255));
  } else {
    misses += 1;
    combo = 0;
    score += 25;
    showJudge(signedTimingDelta < 0 ? "EARLY" : "LATE", color(255, 202, 87));
  }

  playPiano(note.pitch, 0.72, 0.42);
  addBurst(pos.x, pos.y, note.color, true, note.pitch);
}

function missNote(note, pos) {
  note.judged = true;
  misses += 1;
  combo = 0;
  showJudge("MISS", color(255, 95, 120));
  playMissSound();
  addBurst(pos.x, pos.y, note.color, false, "x");
}

function playPiano(pitch, velocity, duration) {
  if (!audioReady || !piano) return;
  piano.play(pitch, velocity, 0, duration);
}

function playMissSound() {
  if (!audioReady || !piano) return;
  const now = millis();
  if (now - (playMissSound.lastAt || 0) < MISS_SOUND_MIN_GAP) return;
  playMissSound.lastAt = now;
  piano.play("C3", 0.18, 0, 0.08);
  piano.play("C#3", 0.12, 0.015, 0.07);
}

function readPlayer() {
  updateFallbackInput();
  const facePoint = trackedFacePoint();

  let target;
  let tracked = false;
  if (facePoint) {
    target = facePoint;
    tracked = true;
  } else {
    target = { x: fallbackPlayer.x, y: fallbackPlayer.y };
  }

  target = keepInPlayArea(target);

  if (!smoothedPlayer) {
    smoothedPlayer = createVector(target.x, target.y);
  } else {
    smoothedPlayer.x = lerp(smoothedPlayer.x, target.x, SMOOTHING);
    smoothedPlayer.y = lerp(smoothedPlayer.y, target.y, SMOOTHING);
  }

  const safe = keepInPlayArea(smoothedPlayer);
  smoothedPlayer.set(safe.x, safe.y);
  return { x: smoothedPlayer.x, y: smoothedPlayer.y, tracked };
}

function trackedFacePoint() {
  const pose = poses[0];
  if (!pose || !pose.keypoints) return null;

  const nose = namedKeypoint(pose, "nose", 0);
  if (isConfident(nose, NOSE_CONFIDENCE)) return mirrorVideoPoint(nose);

  const candidates = ["left_eye", "right_eye", "left_ear", "right_ear"]
    .map((name) => namedKeypoint(pose, name))
    .filter((point) => isConfident(point, 0.12))
    .map(mirrorVideoPoint);

  if (candidates.length === 0) return null;
  const average = candidates.reduce(
    (sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }),
    { x: 0, y: 0 }
  );
  return { x: average.x / candidates.length, y: average.y / candidates.length };
}

function namedKeypoint(pose, name, fallbackIndex = -1) {
  const found = pose.keypoints.find((point) => point.name === name || point.part === name);
  return found || (fallbackIndex >= 0 ? pose.keypoints[fallbackIndex] : null);
}

function isConfident(point, threshold) {
  if (!point) return false;
  const confidence = point.confidence ?? point.score ?? 0;
  return confidence >= threshold;
}

function mirrorVideoPoint(point) {
  const rect = videoRect();
  return {
    x: rect.x + rect.w - (point.x / video.width) * rect.w,
    y: rect.y + (point.y / video.height) * rect.h,
  };
}

function updateFallbackInput() {
  const speed = max(5, width * 0.018);
  if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) fallbackPlayer.x -= speed;
  if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) fallbackPlayer.x += speed;
  if (keyIsDown(UP_ARROW) || keyIsDown(87)) fallbackPlayer.y -= speed;
  if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) fallbackPlayer.y += speed;
  if (touches.length > 0) {
    fallbackPlayer.x = touches[0].x;
    fallbackPlayer.y = touches[0].y;
  } else if (mouseIsPressed) {
    fallbackPlayer.x = mouseX;
    fallbackPlayer.y = mouseY;
  }
  const safe = keepInPlayArea(fallbackPlayer);
  fallbackPlayer.set(safe.x, safe.y);
}

function keepInPlayArea(point) {
  const r = playerRadiusPx();
  return {
    x: constrain(point.x, r + 14, width - r - 14),
    y: constrain(point.y, playTopY() + r, playBottomY() - r),
  };
}

function notePosition(note, gameTime) {
  const progress = (gameTime - (note.time - APPROACH_TIME)) / APPROACH_TIME;
  const y = lerp(playTopY() - 80, playBottomY() + 32, constrain(progress, 0, 1.18));
  return {
    x: lerp(width * 0.12, width * 0.88, note.xProgress),
    y,
    progress,
  };
}

function drawScene() {
  background(7, 8, 13);
  if (video && video.loadedmetadata) {
    const rect = videoRect();
    push();
    translate(rect.x + rect.w, rect.y);
    scale(-1, 1);
    tint(255, 120);
    image(video, 0, 0, rect.w, rect.h);
    noTint();
    pop();
  }

  noStroke();
  fill(5, 5, 10, 118);
  rect(0, 0, width, height);

  const glowY = height * 0.24 + sin(frameCount * 0.018) * 18;
  for (let i = 0; i < 7; i += 1) {
    fill(255, 105, 180, 18 - i * 2);
    ellipse(width * 0.52, glowY, width * (0.42 + i * 0.14), width * (0.22 + i * 0.08));
  }
}

function drawTrack(gameTime) {
  const top = playTopY();
  const bottom = playBottomY();

  stroke(255, 255, 255, 28);
  strokeWeight(1);
  for (let lane = 0; lane < 8; lane += 1) {
    const x = lerp(width * 0.12, width * 0.88, (lane + 0.5) / 8);
    line(x, top, x, bottom);
  }

  stroke(255, 255, 255, 108);
  strokeWeight(2);
  line(width * 0.08, bottom, width * 0.92, bottom);
  noStroke();
  fill(255, 105, 180, 54);
  rect(width * 0.08, bottom - 3, width * 0.84, 6, 8);

  for (const note of notes) {
    if (note.judged && note.hit) continue;
    if (gameTime < note.time - APPROACH_TIME || gameTime > note.time + 500) continue;
    const pos = notePosition(note, gameTime);
    const alpha = note.judged ? 90 : map(pos.progress, 0, 0.2, 0, 255, true);
    drawNote(note, pos.x, pos.y, alpha);
  }
}

function drawNote(note, x, y, alpha) {
  const r = noteRadiusPx();
  push();
  translate(x, y);
  rotate(sin(frameCount * 0.045 + note.lane) * 0.16);
  drawingContext.shadowBlur = 18;
  drawingContext.shadowColor = `rgba(${note.color[0]},${note.color[1]},${note.color[2]},0.55)`;
  noStroke();
  fill(note.color[0], note.color[1], note.color[2], alpha);
  ellipse(0, 0, r * 2.25, r * 1.72);
  fill(255, 255, 255, alpha * 0.82);
  ellipse(-r * 0.32, -r * 0.28, r * 0.62, r * 0.36);
  stroke(255, 255, 255, alpha);
  strokeWeight(max(2, r * 0.1));
  noFill();
  arc(0, 0, r * 2.48, r * 1.95, PI * 0.12, PI * 0.88);
  drawingContext.shadowBlur = 0;
  pop();
}

function drawPlayer(player) {
  const r = playerRadiusPx();
  push();
  translate(player.x, player.y);
  const bob = sin(frameCount * 0.12) * 3;
  drawingContext.shadowBlur = 26;
  drawingContext.shadowColor = player.tracked ? "rgba(255,105,180,0.52)" : "rgba(80,214,255,0.36)";

  noStroke();
  fill(0, 0, 0, 132);
  ellipse(0, r * 0.96, r * 1.88, r * 0.42);

  translate(0, bob);
  fill(255, 190, 77);
  ellipse(0, 0, r * 1.78, r * 1.42);
  triangle(-r * 0.72, -r * 0.34, -r * 0.45, -r * 1.0, -r * 0.18, -r * 0.36);
  triangle(r * 0.72, -r * 0.34, r * 0.45, -r * 1.0, r * 0.18, -r * 0.36);
  fill(255, 219, 112);
  triangle(-r * 0.54, -r * 0.42, -r * 0.42, -r * 0.78, -r * 0.26, -r * 0.42);
  triangle(r * 0.54, -r * 0.42, r * 0.42, -r * 0.78, r * 0.26, -r * 0.42);

  fill(84, 54, 38);
  circle(-r * 0.28, -r * 0.08, r * 0.12);
  circle(r * 0.28, -r * 0.08, r * 0.12);
  ellipse(0, r * 0.12, r * 0.14, r * 0.1);
  stroke(84, 54, 38);
  strokeWeight(max(1.5, r * 0.035));
  line(-r * 0.08, r * 0.17, -r * 0.2, r * 0.25);
  line(r * 0.08, r * 0.17, r * 0.2, r * 0.25);

  stroke(255, 238, 180, 230);
  strokeWeight(max(1.5, r * 0.035));
  line(-r * 0.5, r * 0.04, -r * 0.88, -r * 0.06);
  line(-r * 0.5, r * 0.18, -r * 0.88, r * 0.18);
  line(r * 0.5, r * 0.04, r * 0.88, -r * 0.06);
  line(r * 0.5, r * 0.18, r * 0.88, r * 0.18);

  noFill();
  stroke(player.tracked ? color(255, 105, 180, 185) : color(80, 214, 255, 155));
  strokeWeight(3);
  circle(0, 0, r * 2.15);
  drawingContext.shadowBlur = 0;
  pop();
}

function addBurst(x, y, rgb, success, label) {
  const count = success ? 18 : 8;
  const particles = Array.from({ length: count }, (_, index) => ({
    angle: map(index, 0, count, 0, TWO_PI) + random(-0.22, 0.22),
    speed: random(success ? 2.8 : 1.3, success ? 7.8 : 3.8),
    size: random(success ? 4 : 3, success ? 10 : 6),
  }));
  hitBursts.push({ x, y, rgb, success, label, particles, createdAt: millis() });
}

function drawHitBursts() {
  const now = millis();
  hitBursts = hitBursts.filter((burst) => now - burst.createdAt < 620);

  for (const burst of hitBursts) {
    const p = constrain((now - burst.createdAt) / 620, 0, 1);
    const alpha = map(p, 0, 1, 240, 0);
    for (const particle of burst.particles) {
      const d = particle.speed * p * 20;
      noStroke();
      fill(burst.rgb[0], burst.rgb[1], burst.rgb[2], alpha);
      circle(burst.x + cos(particle.angle) * d, burst.y + sin(particle.angle) * d, particle.size * (1 - p * 0.45));
    }

    if (burst.success) {
      textAlign(CENTER, CENTER);
      textStyle(BOLD);
      textSize(14);
      fill(255, alpha);
      text(burst.label, burst.x, burst.y - 34 - p * 18);
    }
  }
}

function drawHud() {
  const total = hits + misses;
  const accuracy = total === 0 ? 100 : (hits / total) * 100;

  noStroke();
  fill(0, 0, 0, 142);
  rect(0, 0, width, TOP_UI_H);

  textAlign(LEFT, CENTER);
  textStyle(BOLD);
  fill(255);
  textSize(18);
  text("Nose Piano", 18, 24);
  textStyle(NORMAL);
  fill(255, 255, 255, 170);
  textSize(12);
  text("Move your nose into falling notes", 18, 49);

  textAlign(RIGHT, CENTER);
  textStyle(BOLD);
  fill(255);
  textSize(24);
  text(nf(score, 6, 0), width - 18, 24);
  textStyle(NORMAL);
  textSize(12);
  fill(255, 255, 255, 175);
  text(`${combo} combo  ${hits}/${total}  ${nf(accuracy, 2, 1)}%`, width - 18, 50);

  if (lastJudge && millis() - lastJudgeAt < 560) {
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(28);
    fill(lastJudge.color);
    text(lastJudge.label, width / 2, TOP_UI_H + 28);
  }
}

function drawStartScreen(player) {
  drawScrim(138);
  drawPlayer(player);

  textAlign(CENTER, CENTER);
  noStroke();
  fill(255);
  textStyle(BOLD);
  textSize(min(width * 0.12, 50));
  text("Nose Piano", width / 2, height * 0.24);

  textStyle(NORMAL);
  fill(255, 255, 255, 205);
  textSize(15);
  text("코 위치에 있는 캐릭터로 노트를 받아요.\n맞으면 피아노 음이 나고, 놓치면 음악이 무너집니다.", width * 0.12, height * 0.32, width * 0.76, 70);

  const btn = startButtonRect();
  fill(255, 105, 180);
  rect(btn.x, btn.y, btn.w, btn.h, 16);
  fill(255);
  textStyle(BOLD);
  textSize(18);
  text("START", btn.x + btn.w / 2, btn.y + btn.h / 2);

  textStyle(NORMAL);
  fill(255, 255, 255, 150);
  textSize(12);
  text("카메라 허용 후 세로 화면으로 플레이", width / 2, btn.y + btn.h + 32);
}

function drawCountdown() {
  drawScrim(112);
  const number = max(1, 3 - floor((millis() - countdownStartedAt) / 800));
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(min(width, height) * 0.22);
  fill(255);
  text(number, width / 2, height / 2);
}

function drawFinishScreen() {
  drawScrim(162);
  const total = hits + misses;
  const accuracy = total === 0 ? 100 : (hits / total) * 100;

  textAlign(CENTER, CENTER);
  noStroke();
  fill(255);
  textStyle(BOLD);
  textSize(min(width * 0.12, 52));
  text("FINISH", width / 2, height * 0.28);

  textStyle(NORMAL);
  textSize(20);
  fill(255, 255, 255, 220);
  text(`Score ${nf(score, 1, 0)}`, width / 2, height * 0.39);
  text(`Hit ${hits}/${total}   ${nf(accuracy, 2, 1)}%`, width / 2, height * 0.45);
  text(`Max Combo ${maxCombo}`, width / 2, height * 0.51);

  const btn = startButtonRect();
  fill(255, 105, 180);
  rect(btn.x, height * 0.62, btn.w, btn.h, 16);
  fill(255);
  textStyle(BOLD);
  textSize(17);
  text("REPLAY", btn.x + btn.w / 2, height * 0.62 + btn.h / 2);
}

function showJudge(label, judgeColor) {
  lastJudge = { label, color: judgeColor };
  lastJudgeAt = millis();
}

function keyPressed() {
  if (key === " " || keyCode === ENTER) {
    if (gameState === "ready" || gameState === "finished") beginGame();
    return false;
  }
  if (key === "r" || key === "R") {
    beginGame();
    return false;
  }
  return false;
}

function mousePressed() {
  if (gameState === "ready" && pointInRect(mouseX, mouseY, startButtonRect())) {
    beginGame();
  } else if (gameState === "finished") {
    beginGame();
  }
  return false;
}

function touchStarted() {
  if (gameState === "ready" || gameState === "finished") beginGame();
  return false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  fallbackPlayer = createVector(width / 2, height * 0.72);
  smoothedPlayer = null;
  buildNotes();
}

function startButtonRect() {
  const w = min(width * 0.72, 320);
  const h = 58;
  return {
    x: (width - w) / 2,
    y: height * 0.58,
    w,
    h,
  };
}

function pointInRect(x, y, rectInfo) {
  return x >= rectInfo.x && x <= rectInfo.x + rectInfo.w && y >= rectInfo.y && y <= rectInfo.y + rectInfo.h;
}

function drawScrim(alpha) {
  noStroke();
  fill(0, 0, 0, alpha);
  rect(0, 0, width, height);
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

function playTopY() {
  return max(TOP_UI_H + 28, height * PLAY_TOP_RATIO);
}

function playBottomY() {
  return height * PLAY_BOTTOM_RATIO;
}

function playerRadiusPx() {
  return constrain(width * PLAYER_RADIUS_RATIO, 24, 42);
}

function noteRadiusPx() {
  return constrain(width * NOTE_RADIUS_RATIO, 17, 30);
}
