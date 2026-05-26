let gameState = "ready";
let score = 0;
let lives = START_LIVES;
let resets = 0;

let ballX;
let ballY;
let ballVelX;
let ballVelY;
let ballSpeed = INITIAL_BALL_SPEED;

let paddleX;
let paddleY;

let bricks = [];
let particles = [];
let scorePopups = [];
let shakeFrames = 0;
let audioReady = false;

function setup() {
  createCanvas(CANVAS_SIZE, CANVAS_SIZE);
  rectMode(CENTER);
  textFont("Arial");
  startNewGame();
}

function draw() {
  drawBackground();

  let shake = getScreenShakeOffset();
  push();
  translate(shake.x, shake.y);

  if (gameState === "playing") {
    handlePaddleInput();
    moveBall();
    handleWallCollision();
    handlePaddleCollision();
    handleBrickCollision();
    handleMissedBall();
    handleGridReset();
    updateParticles();
    updateScorePopups();
  } else {
    keepBallOnPaddle();
    updateParticles();
    updateScorePopups();
  }

  drawBricks();
  drawPaddle();
  drawBall();
  drawParticles();
  drawScorePopups();

  pop();

  drawUI();
  drawMessage();
}

function keyPressed() {
  ensureAudio();

  if (key === " " && gameState === "ready") {
    launchBall();
  }

  if ((key === "r" || key === "R") && gameState === "gameOver") {
    startNewGame();
  }
}

function ensureAudio() {
  if (!audioReady) {
    userStartAudio();
    audioReady = true;
  }
}

function startNewGame() {
  score = 0;
  lives = START_LIVES;
  resets = 0;
  ballSpeed = INITIAL_BALL_SPEED;
  paddleX = width / 2;
  paddleY = height - PADDLE_BOTTOM_MARGIN;
  particles = [];
  scorePopups = [];
  shakeFrames = 0;
  createBricks();
  resetBall();
}

function resetBall() {
  gameState = "ready";
  ballVelX = 0;
  ballVelY = 0;
  keepBallOnPaddle();
}

function launchBall() {
  gameState = "playing";
  ballVelX = random([-1, 1]) * ballSpeed * INITIAL_LAUNCH_X_RATIO;
  ballVelY = -ballSpeed;
}

function keepBallOnPaddle() {
  ballX = paddleX;
  ballY = paddleY - PADDLE_HEIGHT / 2 - BALL_RADIUS;
}

function createBricks() {
  bricks = [];

  for (let row = 0; row < BRICK_ROWS; row++) {
    bricks[row] = [];

    for (let col = 0; col < BRICK_COLS; col++) {
      let health = floor(random(BRICK_HEALTH_MIN, BRICK_HEALTH_MAX + 1));
      bricks[row][col] = {
        health: health,
        maxHealth: health,
      };
    }
  }
}

function drawBackground() {
  background(18, 22, 36);
}

function drawUI() {
  fill(240);
  textSize(18);
  textAlign(LEFT, CENTER);
  text("SCORE " + score, 32, 32);
  text("WAVE " + (resets + 1), 32, 58);
  textAlign(RIGHT, CENTER);
  text("LIVES " + lives, width - 32, 32);
}

function drawMessage() {
  textAlign(CENTER, CENTER);

  if (gameState === "ready") {
    fill(255);
    textSize(28);
    text("SPACE TO LAUNCH", width / 2, height / 2 + 70);
    textSize(15);
    fill(170, 178, 196);
    text("LEFT / RIGHT ARROW", width / 2, height / 2 + 100);
  }

  if (gameState === "gameOver") {
    fill(255);
    textSize(34);
    text("GAME OVER", width / 2, height / 2 + PADDLE_BOTTOM_MARGIN);
    textSize(16);
    fill(170, 178, 196);
    text("PRESS R TO RESTART", width / 2, height / 2 + 92);
  }
}

function drawPaddle() {
  stroke(200, 255, 245);
  strokeWeight(2);
  fill(85, 225, 210);
  rect(paddleX, paddleY, PADDLE_WIDTH, PADDLE_HEIGHT, 4);
}

function drawBall() {
  noStroke();
  fill(255, 245, 130);
  circle(ballX, ballY, BALL_RADIUS * 2);
}

function drawBricks() {
  let startX = getBrickStartX();

  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < BRICK_COLS; col++) {
      let brick = bricks[row][col];

      if (brick.health > 0) {
        let x = startX + col * (BRICK_WIDTH + BRICK_GAP) + BRICK_WIDTH / 2;
        let y = BRICK_TOP + row * (BRICK_HEIGHT + BRICK_GAP) + BRICK_HEIGHT / 2;
        let baseColor = BRICK_COLORS[brick.maxHealth - 1];
        let alpha = BRICK_MAX_ALPHA;

        if (brick.maxHealth > 1) {
          alpha = map(brick.health, BRICK_HEALTH_MIN, brick.maxHealth, BRICK_MIN_ALPHA, BRICK_MAX_ALPHA);
        }

        stroke(baseColor[0] * 0.55, baseColor[1] * 0.55, baseColor[2] * 0.55, alpha);
        strokeWeight(2);
        fill(baseColor[0], baseColor[1], baseColor[2], alpha);
        rect(x, y, BRICK_WIDTH, BRICK_HEIGHT, 4);

        noStroke();
        fill(255, alpha);
        textSize(14);
        textAlign(CENTER, CENTER);
        text(brick.health, x, y);
      }
    }
  }
}

function handlePaddleInput() {
  if (keyIsDown(LEFT_ARROW) || keyIsDown(RIGHT_ARROW)) {
    ensureAudio();
  }

  if (keyIsDown(LEFT_ARROW)) {
    paddleX -= PADDLE_SPEED;
  }

  if (keyIsDown(RIGHT_ARROW)) {
    paddleX += PADDLE_SPEED;
  }

  paddleX = constrain(
    paddleX,
    PADDLE_WIDTH / 2 + PLAY_AREA_SIDE_MARGIN,
    width - PADDLE_WIDTH / 2 - PLAY_AREA_SIDE_MARGIN
  );
}

function moveBall() {
  ballX += ballVelX;
  ballY += ballVelY;
}

function handleWallCollision() {
  if (ballX - BALL_RADIUS < PLAY_AREA_SIDE_MARGIN) {
    ballX = PLAY_AREA_SIDE_MARGIN + BALL_RADIUS;
    ballVelX *= -1;
    playArcadeTone(SOUND_FREQ_WALL, 0.08);
  }

  if (ballX + BALL_RADIUS > width - PLAY_AREA_SIDE_MARGIN) {
    ballX = width - PLAY_AREA_SIDE_MARGIN - BALL_RADIUS;
    ballVelX *= -1;
    playArcadeTone(SOUND_FREQ_WALL, 0.08);
  }

  if (ballY - BALL_RADIUS < PLAY_AREA_TOP) {
    ballY = PLAY_AREA_TOP + BALL_RADIUS;
    ballVelY *= -1;
    playArcadeTone(SOUND_FREQ_WALL, 0.08);
  }
}

function handlePaddleCollision() {
  if (ballVelY <= 0) {
    return;
  }

  if (checkCircleRectCollision(ballX, ballY, BALL_RADIUS, paddleX, paddleY, PADDLE_WIDTH, PADDLE_HEIGHT)) {
    let hitPosition = constrain((ballX - paddleX) / (PADDLE_WIDTH / 2), -1, 1);

    ballVelX = hitPosition * ballSpeed;
    ballVelY = -sqrt(ballSpeed * ballSpeed - ballVelX * ballVelX * PADDLE_BOUNCE_X_WEIGHT);
    ballY = paddleY - PADDLE_HEIGHT / 2 - BALL_RADIUS;
    playArcadeTone(SOUND_FREQ_PADDLE, 0.1);
  }
}

function handleBrickCollision() {
  let startX = getBrickStartX();

  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < BRICK_COLS; col++) {
      let brick = bricks[row][col];

      if (brick.health > 0) {
        let x = startX + col * (BRICK_WIDTH + BRICK_GAP) + BRICK_WIDTH / 2;
        let y = BRICK_TOP + row * (BRICK_HEIGHT + BRICK_GAP) + BRICK_HEIGHT / 2;

        if (checkCircleRectCollision(ballX, ballY, BALL_RADIUS, x, y, BRICK_WIDTH, BRICK_HEIGHT)) {
          brick.health--;
          bounceBallFromBrick(x, y);

          if (brick.health === 0) {
            let points = brick.maxHealth * BRICK_SCORE_MULTIPLIER;
            score += points;
            let color = BRICK_COLORS[brick.maxHealth - 1];
            spawnParticles(x, y, color, PARTICLE_COUNT);
            spawnScorePopup(x, y, points);
            triggerScreenShake();
            playArcadeTone(SOUND_FREQ_BRICK_BREAK[brick.maxHealth - 1], 0.14);
          } else {
            playArcadeTone(SOUND_FREQ_BRICK_HIT, 0.06);
          }

          return;
        }
      }
    }
  }
}

function bounceBallFromBrick(brickX, brickY) {
  let collisionSide = getCircleRectCollisionSide(
    ballX,
    ballY,
    BALL_RADIUS,
    brickX,
    brickY,
    BRICK_WIDTH,
    BRICK_HEIGHT
  );

  if (collisionSide === "horizontal") {
    ballVelX *= -1;
  } else {
    ballVelY *= -1;
  }
}

function handleMissedBall() {
  if (ballY - BALL_RADIUS > height) {
    lives--;

    if (lives <= 0) {
      gameState = "gameOver";
    } else {
      resetBall();
    }
  }
}

function handleGridReset() {
  if (countRemainingBricks() === 0) {
    resets++;
    ballSpeed = min(MAX_BALL_SPEED, ballSpeed * SPEED_UP_RATE);
    createBricks();
    resetBall();
  }
}

function countRemainingBricks() {
  let count = 0;

  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < BRICK_COLS; col++) {
      if (bricks[row][col].health > 0) {
        count++;
      }
    }
  }

  return count;
}

function getBrickStartX() {
  let gridWidth = BRICK_COLS * BRICK_WIDTH + (BRICK_COLS - 1) * BRICK_GAP;
  return (width - gridWidth) / 2;
}
