let handPose;
let video;
let hands = [];
let handInputs = [];
let previousPinches = [];

const NOTE_RADIUS = 60;
const APPROACH_TIME = 1200;
const APPROACH_RADIUS = 175;
const SLIDER_TOLERANCE = 96;
const PERFECT_WINDOW = 120;
const GOOD_WINDOW = 240;
const BAD_WINDOW = 380;
const PINCH_MEMORY = 460;
const PINCH_START_RATIO = 0.38;
const PINCH_RELEASE_RATIO = 0.52;
const PINCH_MAX_START_DISTANCE = 34;
const CALIBRATION_STEP_TIME = 1200;
const CALIBRATION_PINCH_RATIO = 0.72;
const LANES = {
  left: { x0: 0.08, x1: 0.42, label: "LEFT" },
  right: { x0: 0.58, x1: 0.92, label: "RIGHT" },
};

let notes = [];
let gameState = "ready";
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
  buildChart();
}

function draw() {
  drawMirroredCamera();
  handInputs = readHandInputs();

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
  drawCursors();
  drawPinchDebug();
  previousPinches = handInputs.map((hand) => hand.pinching);
}

function mousePressed() {
  if (gameState === "ready" || gameState === "finished") {
    startCalibration();
  }
}

function keyPressed() {
  if (key === " " && (gameState === "ready" || gameState === "finished")) {
    startCalibration();
  }
  if (key === "r" || key === "R") {
    resetGame();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function gotHands(results) {
  hands = results;
}

function buildChart() {
  notes = [
    tap(1000, "left", 0.28, 0.38),
    tap(1800, "left", 0.62, 0.58),
    tap(2600, "right", 0.36, 0.36),
    tap(3400, "left", 0.46, 0.72),
    tap(4300, "right", 0.58, 0.64),
    dual(5400, 0.32, 0.42, 0.68, 0.42),
    tap(6500, "right", 0.50, 0.30),
    slider(7600, 1700, "left", [
      { x: 0.22, y: 0.70 },
      { x: 0.76, y: 0.28 },
      { x: 0.38, y: 0.66 },
    ]),
    tap(10100, "left", 0.34, 0.34),
    tap(10800, "right", 0.66, 0.34),
    dual(11600, 0.34, 0.68, 0.66, 0.68),
    slider(12900, 1600, "right", [
      { x: 0.78, y: 0.32 },
      { x: 0.30, y: 0.64 },
      { x: 0.66, y: 0.36 },
    ]),
    tap(15200, "left", 0.58, 0.50),
    dual(16000, 0.28, 0.50, 0.72, 0.50),
    tap(17000, "left", 0.38, 0.32),
    tap(17700, "right", 0.62, 0.70),
    slider(18800, 1900, "left", [
      { x: 0.18, y: 0.54 },
      { x: 0.72, y: 0.76 },
      { x: 0.46, y: 0.38 },
    ]),
    dual(21400, 0.34, 0.38, 0.66, 0.62),
    tap(22600, "right", 0.48, 0.46),
  ];
}

function tap(time, side, x, y) {
  return {
    id: `tap-${time}`,
    type: "tap",
    time,
    targets: [target(side, x, y)],
    hit: false,
    missed: false,
    maxScore: 300,
    accuracyMax: 300,
  };
}

function dual(time, x1, y1, x2, y2) {
  return {
    id: `dual-${time}`,
    type: "dual",
    time,
    targets: [
      target("left", x1, y1),
      target("right", x2, y2),
    ],
    hit: false,
    missed: false,
    maxScore: 600,
    accuracyMax: 600,
  };
}

function slider(time, duration, side, points) {
  return {
    id: `slider-${time}`,
    type: "slider",
    time,
    duration,
    points: points.map((point) => target(side, point.x, point.y)),
    started: false,
    completed: false,
    missed: false,
    coverage: 0,
    frames: 0,
    maxScore: 500,
    accuracyMax: 500,
  };
}

function target(side, x, y) {
  return { side, x, y };
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
  previousPinches = [];
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
  const finishAt = lastNote.time + (lastNote.duration || 0) + 1400;
  if (gameTime > finishAt) {
    gameState = "finished";
  }
}

function updateTapLike(note, gameTime) {
  if (note.hit || note.missed) return;

  if (abs(gameTime - note.time) <= BAD_WINDOW) {
    if (note.type === "tap") {
      const pinchedHand = handInputs.find((hand) => {
        return hand.justPinched && handMatchesTarget(hand, note.targets[0]) && isInsideTarget(hand.cursor, note.targets[0], 1.45);
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
      return hand.justPinched && handMatchesTarget(hand, startPoint) && isInsideTarget(hand.cursor, startPoint, 1.45);
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
        isInsideTarget(first, note.targets[0], 1.48) &&
        isInsideTarget(second, note.targets[1], 1.48);
      const swappedFits =
        handMatchesTarget(candidates[i].hand, note.targets[1]) &&
        handMatchesTarget(candidates[j].hand, note.targets[0]) &&
        isInsideTarget(first, note.targets[1], 1.48) &&
        isInsideTarget(second, note.targets[0], 1.48);
      if (firstFits || swappedFits) return true;
    }
  }
  return false;
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

function drawGame(gameTime) {
  drawLaneGuides();
  drawTopHud();

  if (gameState === "ready") {
    drawCenterText("START", "Click or press Space");
    return;
  }

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
  fill(0, 0, 0, 60);
  rect(0, top, centerLeft, height - top);
  rect(centerRight, top, width - centerRight, height - top);

  fill(0, 0, 0, 145);
  rect(centerLeft, top, centerRight - centerLeft, height - top);

  stroke(255, 255, 255, 44);
  strokeWeight(2);
  line(centerLeft, top, centerLeft, height);
  line(centerRight, top, centerRight, height);

  noStroke();
  textAlign(CENTER, CENTER);
  textSize(13);
  fill(255, 255, 255, 95);
  text(LANES.left.label, (LANES.left.x0 + LANES.left.x1) * 0.5 * width, top + 24);
  text(LANES.right.label, (LANES.right.x0 + LANES.right.x1) * 0.5 * width, top + 24);
}

function drawTopHud() {
  const acc = judgedAccuracyMax === 0 ? 100 : (earnedAccuracyScore / judgedAccuracyMax) * 100;
  noStroke();
  fill(0, 0, 0, 115);
  rect(0, 0, width, 62);

  fill(255);
  textAlign(LEFT, CENTER);
  textSize(18);
  text(`Score ${floor(score)}`, 24, 24);
  text(`Combo ${combo}`, 24, 46);

  textAlign(RIGHT, CENTER);
  text(`Acc ${nf(constrain(acc, 0, 100), 2, 1)}%`, width - 24, 24);
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

  const targetColor = note.type === "dual" ? color(255, 210, 110) : color(110, 245, 255);
  const approach = approachSize(note.time, gameTime);

  if (note.type === "dual") {
    const a = screenPoint(note.targets[0]);
    const b = screenPoint(note.targets[1]);
    stroke(255, 210, 110, 90);
    strokeWeight(3);
    line(a.x, a.y, b.x, b.y);
  }

  for (const target of note.targets) {
    const point = screenPoint(target);
    drawTarget(point.x, point.y, NOTE_RADIUS, approach, targetColor);
  }
}

function drawSlider(note, gameTime) {
  const visible = gameTime >= note.time - APPROACH_TIME && gameTime <= note.time + note.duration + 250;
  if (!visible) return;

  const sliderColor = color(190, 145, 255);
  const start = screenPoint(note.points[0]);
  const approach = approachSize(note.time, gameTime);

  noFill();
  stroke(sliderColor.levels[0], sliderColor.levels[1], sliderColor.levels[2], 130);
  strokeWeight(22);
  beginShape();
  for (let i = 0; i <= 32; i++) {
    const point = pointOnSlider(note, i / 32);
    vertex(point.x, point.y);
  }
  endShape();

  stroke(255, 255, 255, 170);
  strokeWeight(3);
  beginShape();
  for (let i = 0; i <= 32; i++) {
    const point = pointOnSlider(note, i / 32);
    vertex(point.x, point.y);
  }
  endShape();

  drawTarget(start.x, start.y, NOTE_RADIUS, approach, sliderColor);

  if (note.started) {
    const progress = constrain((gameTime - note.time) / note.duration, 0, 1);
    const follow = pointOnSlider(note, progress);
    const tracking = handInputs.some((hand) => {
      return handMatchesTarget(hand, note.points[0]) && dist(hand.cursor.x, hand.cursor.y, follow.x, follow.y) <= SLIDER_TOLERANCE;
    });

    noFill();
    stroke(tracking ? color(145, 255, 160, 210) : color(255, 95, 95, 190));
    strokeWeight(4);
    circle(follow.x, follow.y, SLIDER_TOLERANCE * 2);

    fill(tracking ? color(145, 255, 160, 60) : color(255, 95, 95, 45));
    noStroke();
    circle(follow.x, follow.y, SLIDER_TOLERANCE * 2);

    fill(255);
    noStroke();
    circle(follow.x, follow.y, 24);
  }
}

function drawTarget(x, y, radius, approach, targetColor) {
  noStroke();
  fill(red(targetColor), green(targetColor), blue(targetColor), 72);
  circle(x, y, radius * 2.15);

  stroke(255);
  strokeWeight(4);
  fill(red(targetColor), green(targetColor), blue(targetColor), 210);
  circle(x, y, radius * 2);

  noFill();
  stroke(red(targetColor), green(targetColor), blue(targetColor), 210);
  strokeWeight(4);
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
  fill(0, 0, 0, 120);
  rect(0, 0, width, height);
  textAlign(CENTER, CENTER);
  noStroke();
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
  fill(0, 0, 0, 165);
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
  textSize(16);
  fill(255, 255, 255, 190);
  text("Click to retry", width / 2, height / 2 + 108);
}

function drawCursors() {
  for (const hand of handInputs) {
    const cursor = hand.cursor;
    const cursorColor = hand.side === "left" ? color(110, 245, 255) : color(255, 210, 110);
    stroke(hand.pinching ? color(255, 235, 120) : cursorColor);
    strokeWeight(3);
    line(cursor.x, cursor.y, hand.thumb.x, hand.thumb.y);

    noStroke();
    fill(hand.pinching ? color(255, 235, 120) : cursorColor);
    circle(cursor.x, cursor.y, hand.pinching ? 44 : 34);

    fill(0, 0, 0, 180);
    circle(cursor.x, cursor.y, 10);
  }
}

function drawPinchDebug() {
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

function drawMirroredCamera() {
  background(10);
  const cameraFrame = videoRect();

  push();
  translate(cameraFrame.x + cameraFrame.w, cameraFrame.y);
  scale(-1, 1);
  image(video, 0, 0, cameraFrame.w, cameraFrame.h);
  pop();

  fill(0, 0, 0, 105);
  noStroke();
  rect(0, 0, width, height);
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
  const left = constrain((noteTime - gameTime) / APPROACH_TIME, 0, 1);
  return NOTE_RADIUS + left * (APPROACH_RADIUS - NOTE_RADIUS);
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
