let handPose;
let video;
let hands = [];
let easyChart;
let hardChart;
let song;
let backgroundImage;
let songs = [];
let selectedSongIndex = 0;
let activeMap = null;

let fruits = [];
let splashes = [];
let gameState = "loading";
let countdownStartedAt = 0;
let gameStartedAt = 0;
let score = 0;
let combo = 0;
let maxCombo = 0;
let caught = 0;
let missed = 0;
let lastJudge = null;
let lastJudgeAt = 0;
let fallbackCenterX = 0;
let smoothedBasketXs = null;

const EASY_CHART_PATH = "assets/mania/pretender-easy.json";
const HARD_CHART_PATH = "assets/mania/chart.json";
const AUDIO_PATH = "assets/mania/audio.mp3";
const BACKGROUND_PATH = "assets/mania/background.jpg";
const DEFAULT_APPROACH_TIME = 1700;
const DEFAULT_CATCH_WINDOW = 95;
const CATCHER_Y_RATIO = 0.86;
const FINGER_Y_OFFSET = 52;
const DEFAULT_BASKET_WIDTH = 86;
const FALLBACK_BASKET_GAP = 172;
const FINGER_SMOOTHING = 0.34;
const FALLBACK_SPEED = 8;
const FRUIT_PALETTE = [
  { kind: "pear", body: [145, 233, 86], accent: [224, 255, 154], stem: [113, 78, 31] },
  { kind: "apple", body: [255, 79, 91], accent: [255, 171, 151], stem: [101, 68, 32] },
  { kind: "orange", body: [255, 163, 58], accent: [255, 221, 113], stem: [91, 137, 61] },
  { kind: "grape", body: [157, 105, 247], accent: [211, 180, 255], stem: [90, 147, 84] },
  { kind: "berry", body: [75, 168, 255], accent: [173, 226, 255], stem: [80, 145, 89] },
];

function preload() {
  easyChart = loadJSON(EASY_CHART_PATH);
  hardChart = loadJSON(HARD_CHART_PATH);
  song = loadSound(AUDIO_PATH);
  backgroundImage = loadImage(BACKGROUND_PATH);
  if (shouldLoadHandPose()) {
    handPose = ml5.handPose({ maxHands: 2 });
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("Arial");
  fallbackCenterX = width / 2;

  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
  startHandTracking();
  buildSongList();
  activeMap = selectedSong();

  gameState = "select";
}

function draw() {
  drawBackground();
  const catcher = readCatcher();

  if (gameState === "select") {
    drawCatcher(catcher);
    drawSongSelect();
    return;
  }

  if (gameState === "countdown" && millis() - countdownStartedAt >= 3000) {
    startPlaying();
  }

  if (gameState === "playing") {
    updateGame(getGameTime(), catcher);
  }

  drawFruits(getGameTime());
  drawSplashes();
  drawCatcher(catcher);
  drawHud();

  if (gameState === "countdown") drawCountdown();
  if (gameState === "finished") drawFinished();
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
    if (key === " " || keyCode === ENTER) beginGame();
    return false;
  }

  if (key === " " || keyCode === ENTER) {
    if (gameState === "finished") beginGame();
    return false;
  }

  if (key === "r" || key === "R") {
    beginGame();
    return false;
  }

  if (key === "Escape") {
    stopSong();
    gameState = "select";
    return false;
  }
}

function mousePressed() {
  if (gameState === "select") {
    const index = songIndexAt(mouseX, mouseY);
    if (index !== -1) {
      selectedSongIndex = index;
      activeMap = selectedSong();
      return;
    }

    if (pointInRect(mouseX, mouseY, startPromptRect())) beginGame();
    return;
  }

  if (gameState === "finished") {
    beginGame();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  fallbackCenterX = constrain(fallbackCenterX, 0, width);
}

function beginGame() {
  userStartAudio();
  activeMap = selectedSong();
  resetGame();
  stopSong();
  countdownStartedAt = millis();
  gameState = "countdown";
}

function buildSongList() {
  songs = [
    {
      id: "pretender-fruit-hard",
      title: easyChart?.title || "Pretender",
      artist: easyChart?.artist || "Official HIGE DANdism",
      version: "Fruit Hard",
      modeLabel: "2 baskets / dense jumps",
      noteCount: easyChart?.noteCount || (easyChart?.notes || []).length,
      chartData: easyChart,
      approachTime: 1650,
      catchWindow: 96,
      basketWidth: 86,
      density: 0.82,
      chaos: 0.45,
    },
    {
      id: "pretender-fruit-insane",
      title: hardChart?.title || "Pretender",
      artist: hardChart?.artist || "Official HIGE DANdism",
      version: "Fruit Insane",
      modeLabel: "2 baskets / very fast streams",
      noteCount: hardChart?.noteCount || (hardChart?.notes || []).length,
      chartData: hardChart,
      approachTime: 1280,
      catchWindow: 72,
      basketWidth: 72,
      density: 1,
      chaos: 0.78,
    },
  ];
}

function selectedSong() {
  return songs[selectedSongIndex] || songs[0] || null;
}

function selectSongOffset(offset) {
  if (songs.length === 0) return;
  selectedSongIndex = (selectedSongIndex + offset + songs.length) % songs.length;
  activeMap = selectedSong();
}

function resetGame() {
  fruits = buildFruitChart();
  splashes = [];
  score = 0;
  combo = 0;
  maxCombo = 0;
  caught = 0;
  missed = 0;
  lastJudge = null;
  lastJudgeAt = 0;
}

function buildFruitChart() {
  const mapInfo = activeMap || selectedSong();
  const sourceNotes = Array.isArray(mapInfo?.chartData?.notes) ? mapInfo.chartData.notes : [];
  const safeLeft = 74;
  const safeRight = max(safeLeft + 1, width - 74);
  const playableWidth = safeRight - safeLeft;

  if (sourceNotes.length === 0) {
    return Array.from({ length: 64 }, (_, index) => makeFruit(index * 520 + 1000, index, safeLeft, playableWidth));
  }

  let lastTime = -9999;
  const minSpacing = mapInfo?.density >= 1 ? 28 : 58;
  const built = sourceNotes
    .filter((note) => {
      const tooClose = note.time - lastTime < minSpacing;
      if (!tooClose) lastTime = note.time;
      return !tooClose;
    })
    .map((note, index) => {
      const lane = Number.isFinite(note.lane) ? note.lane : index % 8;
      const mirroredLane = index % 5 === 0 ? 7 - lane : lane;
      const laneProgress = (mirroredLane + 0.5) / 8;
      const chaos = mapInfo?.chaos || 0.5;
      const wobble = sin(index * 2.47) * 0.055 + cos(index * 0.91) * chaos * 0.065;
      const snap = index % 11 === 0 ? (index % 22 === 0 ? 0.03 : 0.97) : laneProgress + wobble;
      return {
        ...fruitSkin(index),
        id: index,
        time: note.time,
        x: safeLeft + constrain(snap, 0.025, 0.975) * playableWidth,
        lane: mirroredLane,
        radius: randomFruitRadius(index),
        spin: random(-0.45, 0.45),
        judged: false,
        hit: false,
      };
    });

  return addDifficultyFruit(built, safeLeft, playableWidth, mapInfo);
}

function addDifficultyFruit(baseFruits, safeLeft, playableWidth, mapInfo) {
  const extras = [];
  const chaos = mapInfo?.chaos || 0.5;

  baseFruits.forEach((fruit, index) => {
    if (index % 7 === 3) {
      const sideProgress = fruit.x < width / 2 ? 0.88 : 0.12;
      extras.push(makeExtraFruit(fruit.time + 96, index, safeLeft + sideProgress * playableWidth));
    }

    if (chaos > 0.7 && index % 9 === 4) {
      const jumpProgress = index % 18 === 4 ? 0.06 : 0.94;
      extras.push(makeExtraFruit(fruit.time + 48, index + 5000, safeLeft + jumpProgress * playableWidth));
    }
  });

  return [...baseFruits, ...extras].sort((a, b) => a.time - b.time);
}

function makeExtraFruit(time, index, x) {
  return {
    ...fruitSkin(index + 2),
    id: `extra-${index}`,
    time,
    x,
    lane: index % 8,
    radius: max(15, randomFruitRadius(index) - 3),
    spin: random(-0.65, 0.65),
    judged: false,
    hit: false,
  };
}

function makeFruit(time, index, safeLeft, playableWidth) {
  const progress = (sin(index * 2.2) + 1) * 0.5;
  return {
    ...fruitSkin(index),
    id: index,
    time,
    x: safeLeft + progress * playableWidth,
    lane: index % 8,
    radius: randomFruitRadius(index),
    spin: random(-0.45, 0.45),
    judged: false,
    hit: false,
  };
}

function fruitSkin(index) {
  return FRUIT_PALETTE[index % FRUIT_PALETTE.length];
}

function randomFruitRadius(index) {
  return 18 + (index % 4) * 2.5;
}

function startPlaying() {
  gameState = "playing";
  gameStartedAt = millis();
  stopSong();
  if (song) {
    song.playMode("restart");
    song.play();
  }
}

function stopSong() {
  if (song && song.isPlaying()) song.stop();
}

function getGameTime() {
  if (gameState !== "playing") return 0;
  return song ? song.currentTime() * 1000 : millis() - gameStartedAt;
}

function updateGame(gameTime, catcher) {
  const windowMs = catchWindow();
  for (const fruit of fruits) {
    if (fruit.judged) continue;
    if (abs(gameTime - fruit.time) <= windowMs && catcherCoversFruit(catcher, fruit)) {
      catchFruit(fruit, catcher);
    } else if (gameTime > fruit.time + windowMs) {
      missFruit(fruit);
    }
  }

  const lastFruit = fruits[fruits.length - 1];
  if (lastFruit && gameTime > lastFruit.time + 1800 && gameState === "playing") {
    stopSong();
    gameState = "finished";
  }
}

function catcherCoversFruit(catcher, fruit) {
  const padding = 18;
  return catcher.baskets.some(
    (basket) => fruit.x >= basket.left - padding && fruit.x <= basket.right + padding
  );
}

function catchFruit(fruit, catcher) {
  fruit.judged = true;
  fruit.hit = true;
  caught += 1;
  combo += 1;
  maxCombo = max(maxCombo, combo);
  score += 300 + combo * 8;
  showJudge("CATCH", color(118, 245, 255));
  addSplash(fruit.x, catcher.y - 18, fruit.body, true);
}

function missFruit(fruit) {
  fruit.judged = true;
  missed += 1;
  combo = 0;
  showJudge("MISS", color(255, 96, 100));
  addSplash(fruit.x, catchLineY() + 12, fruit.body, false);
}

function addSplash(x, y, rgb, success) {
  const particles = Array.from({ length: success ? 14 : 8 }, (_, index) => ({
    angle: map(index, 0, success ? 13 : 7, -PI, 0) + random(-0.28, 0.28),
    speed: random(success ? 3.2 : 1.4, success ? 8.4 : 4.2),
    size: random(success ? 4 : 3, success ? 9 : 6),
  }));
  splashes.push({ x, y, rgb, success, particles, createdAt: millis() });
}

function readCatcher() {
  updateFallbackInput();

  const points = hands
    .map((hand) => keypoint(hand, 8, "index_finger_tip"))
    .filter(Boolean)
    .map(mirroredPoint)
    .map((point) => point.x)
    .sort((a, b) => a - b);

  let rawLeftX;
  let rawRightX;
  let detectedLeft = false;
  let detectedRight = false;

  if (points.length >= 2) {
    rawLeftX = points[0];
    rawRightX = points[points.length - 1];
    detectedLeft = true;
    detectedRight = true;
  } else if (points.length === 1) {
    const side = points[0] < width / 2 ? "left" : "right";
    rawLeftX = side === "left" ? points[0] : fallbackCenterX - FALLBACK_BASKET_GAP * 0.5;
    rawRightX = side === "right" ? points[0] : fallbackCenterX + FALLBACK_BASKET_GAP * 0.5;
    detectedLeft = side === "left";
    detectedRight = side === "right";
  } else {
    rawLeftX = fallbackCenterX - FALLBACK_BASKET_GAP * 0.5;
    rawRightX = fallbackCenterX + FALLBACK_BASKET_GAP * 0.5;
  }

  const target = keepBasketCentersApart({
    left: constrain(rawLeftX, basketWidth() * 0.5 + 12, width - basketWidth() * 0.5 - 12),
    right: constrain(rawRightX, basketWidth() * 0.5 + 12, width - basketWidth() * 0.5 - 12),
  });

  if (!smoothedBasketXs) {
    smoothedBasketXs = target;
  } else {
    smoothedBasketXs = {
      left: lerp(smoothedBasketXs.left, target.left, FINGER_SMOOTHING),
      right: lerp(smoothedBasketXs.right, target.right, FINGER_SMOOTHING),
    };
  }

  smoothedBasketXs = keepBasketCentersApart(smoothedBasketXs);

  const y = catchLineY();
  const baskets = [
    makeBasket("left", smoothedBasketXs.left, y, detectedLeft),
    makeBasket("right", smoothedBasketXs.right, y, detectedRight),
  ];

  return {
    baskets,
    x: (baskets[0].x + baskets[1].x) * 0.5,
    y,
    usingHands: detectedLeft || detectedRight,
    detectedFingers: points.length,
  };
}

function keepBasketCentersApart(centers) {
  let left = min(centers.left, centers.right);
  let right = max(centers.left, centers.right);
  const widthNow = basketWidth();
  const minGap = widthNow * 0.82;

  if (right - left < minGap) {
    const center = (left + right) * 0.5;
    left = center - minGap * 0.5;
    right = center + minGap * 0.5;
  }

  return {
    left: constrain(left, widthNow * 0.5 + 12, width - widthNow * 0.5 - 12),
    right: constrain(right, widthNow * 0.5 + 12, width - widthNow * 0.5 - 12),
  };
}

function makeBasket(hand, x, y, detected) {
  const widthNow = basketWidth();
  return {
    hand,
    x,
    y,
    width: widthNow,
    left: x - widthNow * 0.5,
    right: x + widthNow * 0.5,
    detected,
  };
}

function approachTime() {
  return activeMap?.approachTime || DEFAULT_APPROACH_TIME;
}

function catchWindow() {
  return activeMap?.catchWindow || DEFAULT_CATCH_WINDOW;
}

function basketWidth() {
  return activeMap?.basketWidth || DEFAULT_BASKET_WIDTH;
}

function updateFallbackInput() {
  if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) fallbackCenterX -= FALLBACK_SPEED;
  if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) fallbackCenterX += FALLBACK_SPEED;
  if (mouseIsPressed || movedX !== 0) fallbackCenterX = mouseX;
  fallbackCenterX = constrain(fallbackCenterX, 50, width - 50);
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

function catchLineY() {
  return height * CATCHER_Y_RATIO;
}

function fruitY(fruit, gameTime) {
  const approach = approachTime();
  const progress = (gameTime - (fruit.time - approach)) / approach;
  return lerp(-80, catchLineY(), constrain(progress, 0, 1.18));
}

function drawBackground() {
  background(3, 5, 8);
  if (backgroundImage) {
    drawCoverImage(backgroundImage, 0, 0, width, height);
  } else if (video && video.loadedmetadata) {
    const rect = videoRect();
    push();
    translate(rect.x + rect.w, rect.y);
    scale(-1, 1);
    image(video, 0, 0, rect.w, rect.h);
    pop();
  }

  if (video && video.loadedmetadata) {
    const rect = videoRect();
    push();
    translate(rect.x + rect.w, rect.y);
    scale(-1, 1);
    tint(255, 34);
    image(video, 0, 0, rect.w, rect.h);
    noTint();
    pop();
  }

  noStroke();
  fill(0, 0, 0, 178);
  rect(0, 0, width, height);

  drawStageLines();
}

function drawStageLines() {
  const catchY = catchLineY();
  stroke(255, 255, 255, 22);
  strokeWeight(1);
  for (let i = 0; i < 8; i += 1) {
    const x = map(i + 0.5, 0, 8, 74, width - 74);
    line(x, 86, x, catchY + 22);
  }

  stroke(255, 255, 255, 80);
  strokeWeight(2);
  line(34, catchY, width - 34, catchY);

  noStroke();
  fill(255, 255, 255, 34);
  rect(34, catchY - 2, width - 68, 4, 4);
}

function drawFruits(gameTime) {
  const approach = approachTime();
  for (const fruit of fruits) {
    if (fruit.judged && fruit.hit) continue;
    if (gameTime < fruit.time - approach || gameTime > fruit.time + 650) continue;

    const y = fruit.judged ? catchLineY() + 24 : fruitY(fruit, gameTime);
    const alpha = fruit.judged ? 90 : 255;
    drawFruit(fruit, fruit.x, y, alpha);
  }
}

function drawFruit(fruit, x, y, alpha) {
  push();
  translate(x, y);
  rotate(sin(frameCount * 0.03 + fruit.id) * 0.18 + fruit.spin);
  drawingContext.shadowBlur = 18;
  drawingContext.shadowColor = `rgba(${fruit.body[0]},${fruit.body[1]},${fruit.body[2]},0.45)`;

  if (fruit.kind === "grape") {
    drawGrapes(fruit, alpha);
  } else {
    drawRoundFruit(fruit, alpha);
  }

  drawingContext.shadowBlur = 0;
  pop();
}

function drawRoundFruit(fruit, alpha) {
  const r = fruit.radius;
  noStroke();
  fill(fruit.body[0], fruit.body[1], fruit.body[2], alpha);
  ellipse(0, 2, r * 1.55, r * 1.78);
  fill(fruit.accent[0], fruit.accent[1], fruit.accent[2], alpha * 0.84);
  ellipse(-r * 0.28, -r * 0.27, r * 0.54, r * 0.42);

  stroke(fruit.stem[0], fruit.stem[1], fruit.stem[2], alpha);
  strokeWeight(4);
  line(0, -r * 0.72, r * 0.18, -r * 1.08);

  noStroke();
  fill(88, 215, 105, alpha);
  ellipse(r * 0.34, -r * 0.9, r * 0.62, r * 0.28);
}

function drawGrapes(fruit, alpha) {
  const r = fruit.radius * 0.38;
  noStroke();
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3 - row; col += 1) {
      const x = (col - (2 - row) * 0.5) * r * 1.8;
      const y = row * r * 1.45;
      fill(fruit.body[0], fruit.body[1], fruit.body[2], alpha);
      circle(x, y, r * 1.75);
      fill(fruit.accent[0], fruit.accent[1], fruit.accent[2], alpha * 0.76);
      circle(x - r * 0.25, y - r * 0.22, r * 0.52);
    }
  }

  stroke(fruit.stem[0], fruit.stem[1], fruit.stem[2], alpha);
  strokeWeight(3);
  line(0, -r * 0.7, r * 0.6, -r * 1.8);
}

function drawSplashes() {
  const now = millis();
  splashes = splashes.filter((splash) => now - splash.createdAt < 520);

  for (const splash of splashes) {
    const p = constrain((now - splash.createdAt) / 520, 0, 1);
    const alpha = map(p, 0, 1, 220, 0);
    for (const particle of splash.particles) {
      const d = particle.speed * p * 18;
      const x = splash.x + cos(particle.angle) * d;
      const y = splash.y + sin(particle.angle) * d + p * p * 34;
      noStroke();
      fill(splash.rgb[0], splash.rgb[1], splash.rgb[2], alpha);
      circle(x, y, particle.size * (1 - p * 0.35));
    }
  }
}

function drawCatcher(catcher) {
  for (const basket of catcher.baskets) {
    drawBasket(basket);
    drawFinger(basket.x, basket.y + FINGER_Y_OFFSET, basket.hand, basket.detected);
    drawCharacter(basket.x, basket.y + 70, basket.hand);
  }
}

function drawBasket(basket) {
  const y = basket.y + 6;
  const left = basket.left - 12;
  const right = basket.right + 12;
  const w = right - left;

  push();
  drawingContext.shadowBlur = 24;
  drawingContext.shadowColor =
    basket.hand === "left" ? "rgba(118,245,255,0.32)" : "rgba(255,209,102,0.32)";
  noStroke();
  fill(0, 0, 0, 188);
  ellipse(basket.x, y + 20, w + 18, 32);
  fill(221, 250, 255, 246);
  ellipse(basket.x, y, w, 26);
  fill(basket.hand === "left" ? color(97, 206, 255, 232) : color(255, 197, 76, 232));
  ellipse(basket.x, y - 3, w * 0.9, 13);
  fill(5, 12, 20, 235);
  ellipse(basket.x, y - 4, max(42, w * 0.78), 8);

  stroke(255, 255, 255, 210);
  strokeWeight(3);
  line(left + 16, y - 10, right - 16, y - 10);
  pop();
}

function drawFinger(x, y, side, usingHands) {
  const flip = side === "left" ? -1 : 1;
  push();
  translate(x, y);
  scale(flip, 1);
  noStroke();
  fill(usingHands ? color(255, 226, 190) : color(125, 158, 178));
  rect(-12, -36, 24, 64, 13);
  circle(0, -38, 24);
  fill(255, 245, 230, usingHands ? 230 : 105);
  ellipse(-4, -44, 8, 5);
  fill(0, 0, 0, 120);
  rect(-16, 20, 32, 16, 8);
  pop();
}

function drawCharacter(x, y, hand) {
  push();
  translate(x, y);
  noStroke();
  fill(0, 0, 0, 150);
  ellipse(0, 48, 88, 22);

  fill(23, 35, 54);
  rect(-29, -6, 58, 64, 21);
  fill(255, 224, 194);
  ellipse(0, -4, 54, 58);
  fill(24, 36, 58);
  arc(0, -15, 66, 58, PI, TWO_PI);
  triangle(-32, -16, -18, 22, -2, -16);
  triangle(32, -16, 18, 22, 2, -16);
  fill(hand === "left" ? color(88, 202, 255) : color(255, 202, 88));
  circle(-12, -2, 7);
  circle(12, -2, 7);
  fill(255, 145, 170, 170);
  ellipse(0, 15, 20, 7);
  pop();
}

function drawHud() {
  const total = caught + missed;
  const accuracy = total === 0 ? 100 : (caught / total) * 100;

  noStroke();
  fill(0, 0, 0, 156);
  rect(0, 0, width, 76);

  textAlign(LEFT, CENTER);
  textStyle(BOLD);
  fill(255);
  textSize(18);
  text("Catch the Fruit", 24, 23);
  textStyle(NORMAL);
  fill(255, 255, 255, 170);
  textSize(13);
  text("Index-finger x only. Keep the basket under falling fruit.", 24, 49);

  textAlign(RIGHT, CENTER);
  textStyle(BOLD);
  fill(255);
  textSize(28);
  text(nf(score, 6, 0), width - 24, 24);
  textStyle(NORMAL);
  fill(255, 255, 255, 180);
  textSize(14);
  text(`Combo ${combo}   Catch ${caught}/${total}   ${nf(accuracy, 2, 1)}%`, width - 24, 52);

  if (lastJudge && millis() - lastJudgeAt < 620) {
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(34);
    fill(lastJudge.color);
    text(lastJudge.label, width / 2, 106);
  }
}

function drawSongSelect() {
  const selected = selectedSong();
  if (!selected) return;

  drawScrim(104);

  const panelX = width * 0.07;
  const panelY = height * 0.14;
  const panelW = min(width * 0.48, 680);

  textAlign(LEFT, TOP);
  noStroke();
  fill(255);
  textStyle(BOLD);
  textSize(clamp(width * 0.052, 38, 74));
  text("Catch the Fruit", panelX, panelY, panelW, 86);
  textStyle(NORMAL);
  fill(255, 255, 255, 206);
  textSize(18);
  text("Two independent baskets. Only each index finger's x position matters.", panelX, panelY + 96, panelW, 48);

  fill(255, 255, 255, 155);
  textSize(13);
  text(`Selected: ${selected.version} / ${selected.modeLabel} / ${selected.noteCount} source notes`, panelX, panelY + 154, panelW, 24);

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

  noStroke();
  fill(selected ? color(7, 20, 28, 218) : color(0, 0, 0, hover ? 176 : 136));
  rect(x, y, w, h, 8);

  if (selected) {
    stroke(118, 245, 255, 235);
    strokeWeight(3);
    noFill();
    rect(x + 1.5, y + 1.5, w - 3, h - 3, 8);
  }

  noStroke();
  fill(selected ? color(118, 245, 255) : color(255));
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(18);
  text(item.version, x + 18, y + 16, w - 36, 24);

  fill(255, 255, 255, 184);
  textStyle(NORMAL);
  textSize(13);
  text(`${item.title} - ${item.artist}`, x + 18, y + 43, w - 36, 18);

  fill(255, 255, 255, 138);
  text(`${item.modeLabel} / basket ${item.basketWidth}px / window ${item.catchWindow}ms`, x + 18, y + h - 29, w - 36, 18);
}

function drawStartPrompt() {
  const prompt = startPromptRect();
  noStroke();
  fill(0, 0, 0, 162);
  rect(prompt.x, prompt.y, prompt.w, prompt.h, 8);

  fill(118, 245, 255);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(18);
  text("Space / Enter to start", prompt.x + 22, prompt.y + 16);

  fill(255, 255, 255, 158);
  textStyle(NORMAL);
  textSize(13);
  text("Arrow keys choose map. Mouse or A/D can test fallback baskets.", prompt.x + 22, prompt.y + 44);
}

function songRailLayout() {
  const w = min(460, width * 0.36);
  const h = 92;
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
    y: height - 120,
    w: min(560, width * 0.7),
    h: 76,
  };
}

function pointInRect(x, y, rectInfo) {
  return x >= rectInfo.x && x <= rectInfo.x + rectInfo.w && y >= rectInfo.y && y <= rectInfo.y + rectInfo.h;
}

function drawCountdown() {
  const left = max(1, 3 - floor((millis() - countdownStartedAt) / 1000));
  drawScrim(112);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(min(width, height) * 0.16);
  fill(255);
  text(left, width / 2, height / 2);
}

function drawFinished() {
  const total = caught + missed;
  const accuracy = total === 0 ? 100 : (caught / total) * 100;
  drawScrim(154);
  textAlign(CENTER, CENTER);
  noStroke();
  fill(255);
  textStyle(BOLD);
  textSize(56);
  text("FINISH", width / 2, height * 0.35);
  textStyle(NORMAL);
  textSize(24);
  text(`Score ${nf(score, 1, 0)}`, width / 2, height * 0.45);
  text(`Caught ${caught}/${total}   ${nf(accuracy, 2, 1)}%`, width / 2, height * 0.51);
  text(`Max Combo ${maxCombo}`, width / 2, height * 0.57);
  textSize(16);
  fill(255, 255, 255, 175);
  text("Press R to replay", width / 2, height * 0.65);
}

function drawScrim(alpha) {
  noStroke();
  fill(0, 0, 0, alpha);
  rect(0, 0, width, height);
}

function showJudge(label, judgeColor) {
  lastJudge = { label, color: judgeColor };
  lastJudgeAt = millis();
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

function clamp(value, minValue, maxValue) {
  return Math.max(minValue, Math.min(maxValue, value));
}
