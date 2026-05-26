function checkCircleRectCollision(circleX, circleY, circleRadius, rectX, rectY, rectWidth, rectHeight) {
  let closestX = constrain(circleX, rectX - rectWidth / 2, rectX + rectWidth / 2);
  let closestY = constrain(circleY, rectY - rectHeight / 2, rectY + rectHeight / 2);

  return dist(circleX, circleY, closestX, closestY) <= circleRadius;
}

function getCircleRectCollisionSide(circleX, circleY, circleRadius, rectX, rectY, rectWidth, rectHeight) {
  let overlapX = rectWidth / 2 + circleRadius - abs(circleX - rectX);
  let overlapY = rectHeight / 2 + circleRadius - abs(circleY - rectY);

  if (overlapX < overlapY) {
    return "horizontal";
  }

  return "vertical";
}

function spawnParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x,
      y: y,
      vx: random(-4.5, 4.5),
      vy: random(-6, -1),
      life: 1,
      size: random(4, 8),
      color: color,
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let particle = particles[i];

    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += PARTICLE_GRAVITY;
    particle.life -= PARTICLE_LIFE_DECAY;

    if (particle.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function drawParticles() {
  for (let particle of particles) {
    noStroke();
    fill(particle.color[0], particle.color[1], particle.color[2], particle.life * 255);
    rect(particle.x, particle.y, particle.size, particle.size, 2);
  }
}

function spawnScorePopup(x, y, points) {
  scorePopups.push({
    x: x,
    y: y,
    text: "+" + points,
    life: 1,
  });
}

function updateScorePopups() {
  for (let i = scorePopups.length - 1; i >= 0; i--) {
    let popup = scorePopups[i];

    popup.y -= SCORE_POPUP_RISE;
    popup.life -= SCORE_POPUP_LIFE_DECAY;

    if (popup.life <= 0) {
      scorePopups.splice(i, 1);
    }
  }
}

function drawScorePopups() {
  for (let popup of scorePopups) {
    fill(255, 245, 130, popup.life * 255);
    textSize(16);
    textAlign(CENTER, CENTER);
    text(popup.text, popup.x, popup.y);
  }
}

function triggerScreenShake() {
  shakeFrames = SHAKE_FRAMES;
}

function getScreenShakeOffset() {
  if (shakeFrames <= 0) {
    return { x: 0, y: 0 };
  }

  shakeFrames--;

  return {
    x: random(-SHAKE_INTENSITY, SHAKE_INTENSITY),
    y: random(-SHAKE_INTENSITY, SHAKE_INTENSITY),
  };
}

function playArcadeTone(frequency, duration) {
  if (!audioReady) {
    return;
  }

  let oscillator = new p5.Oscillator("square");
  let envelope = new p5.Envelope();

  oscillator.amp(envelope);
  envelope.setADSR(0.01, 0.04, 0.2, 0.08);
  envelope.setRange(0.22, 0);
  oscillator.freq(frequency);
  oscillator.start();
  envelope.play(oscillator, 0, duration);

  setTimeout(function () {
    oscillator.stop();
    oscillator.dispose();
  }, (duration + 0.25) * 1000);
}
