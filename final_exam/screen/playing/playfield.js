/**
 * 플레이 중 판정선·낙하 노트·코 커서를 캔버스에 그린다.
 */
function drawPlayfield() {
  const stage = getStageRect();
  const lineY = stage.y + stage.h * GAME_CONFIG.hitLineY;
  const activeEffects = getActiveHitEffects();

  drawFire(stage);
  drawRoastGuide(stage, lineY);
  drawHitLineEffects(stage, lineY, activeEffects);

  for (const note of Play.notes) {
    if (note.hit || note.missed) continue;
    const pos = getNotePosition(note);
    if (!pos.visible) continue;
    drawMarshmallow(note, pos.x, pos.y, getMarshmallowCookState(note), 0);
  }

  drawEjectedMarshmallows();
  drawHitEffects(activeEffects);
  for (const nose of Face.noses) {
    drawRod(stage, nose);
  }
  if (Face.noses.length > 0) {
    drawSkeweredMarshmallows(Face.noses[0]);
  }
  drawStackBursts();
}

/**
 * 스테이지 아래쪽의 불 이미지를 그린다.
 */
function drawFire(stage) {
  const fireH = GAME_CONFIG.fireHeight;
  const y = stage.y + stage.h - fireH;
  imageMode(CORNER);
  image(App.assets.fire, stage.x, y, stage.w, fireH);

  noStroke();
  fill(255, 86, 36, 26 + sin(millis() * 0.008) * 8);
  rect(stage.x, y - 18, stage.w, 24);
}

/**
 * 노트를 찔러야 하는 타이밍 기준선을 그린다.
 */
function drawRoastGuide(stage, lineY) {
  stroke(255, 210, 142, 165);
  strokeWeight(8);
  line(stage.x + 18, lineY, stage.x + stage.w - 18, lineY);
  stroke(255, 248, 218, 220);
  strokeWeight(1);
  line(stage.x + 18, lineY, stage.x + stage.w - 18, lineY);

  drawText("ROAST", stage.x + stage.w - 24, lineY - 20, {
    size: 12,
    alignH: RIGHT,
    alignV: CENTER,
    style: BOLD,
    fill: [255, 226, 168],
  });
}

/**
 * 얼굴 코 위치에 맞춰 꼬치 이미지를 그린다.
 */
function drawRod(stage, nose) {
  const rodW = GAME_CONFIG.rodWidth;

  imageMode(CORNER);
  image(App.assets.rod, nose.x - rodW / 2, nose.y, rodW, App.assets.rod.height);
}

/**
 * 노트 정보를 마시멜로 이미지 하나로 그린다.
 */
function drawMarshmallow(note, x, y, state, rotation) {
  const colorName = getMarshmallowColorForNote(note);
  const img = App.assets.marshmallows[colorName][state];
  const size = GAME_CONFIG.noteSize * (state === "burnt" ? 1.06 : 1);

  push();
  translate(x, y);
  rotate(rotation);
  imageMode(CENTER);
  image(img, 0, 0, size, size);
  pop();
}

/**
 * 실패해서 튕겨 나간 마시멜로들을 그린다.
 */
function drawEjectedMarshmallows() {
  for (const item of Play.ejections) {
    const noteLike = buildNoteForMarshmallowColor(item.color);
    drawMarshmallow(noteLike, item.x, item.y, item.state, item.rotation);
  }
}

/**
 * 성공해서 꼬치에 쌓인 마시멜로들을 코 아래에 그린다.
 */
function drawSkeweredMarshmallows(nose) {
  for (let i = 0; i < Play.skewered.length; i += 1) {
    const item = Play.skewered[i];
    const y = nose.y + GAME_CONFIG.noteSize * (0.5 + i * 0.62);
    drawMarshmallow(buildNoteForMarshmallowColor(item.color), nose.x, y, "roasted", 0);
  }
}

/**
 * 꼬치 스택 보너스가 터질 때 생기는 원형 이펙트를 그린다.
 */
function drawStackBursts() {
  for (const burst of Play.stackBursts) {
    const age = millis() - burst.at;
    const t = constrain(age / burst.duration, 0, 1);
    const alpha = 220 * (1 - t);
    const radius = GAME_CONFIG.noteSize * (0.6 + t * 2.2);

    noFill();
    stroke(255, 226, 120, alpha);
    strokeWeight(4 * (1 - t) + 1);
    circle(burst.x, burst.y, radius);

    const sparkCount = 10;
    stroke(255, 245, 190, alpha);
    strokeWeight(2);
    for (let i = 0; i < sparkCount; i += 1) {
      const angle = (TWO_PI / sparkCount) * i;
      const inner = radius * 0.25;
      const outer = radius * 0.58;
      line(
        burst.x + cos(angle) * inner,
        burst.y + sin(angle) * inner,
        burst.x + cos(angle) * outer,
        burst.y + sin(angle) * outer,
      );
    }
  }
}

/**
 * 색만 가진 마시멜로를 그리기 위해 최소 note 모양을 만든다.
 */
function buildNoteForMarshmallowColor(colorName) {
  return {
    drum: colorName === "blue" ? "hihat" : colorName === "red" ? "kick" : null,
  };
}

/**
 * 히트 순간 판정선에 짧은 빛 번짐을 그린다.
 * @param {{ x: number, y: number, w: number, h: number }} stage - 스테이지 영역
 * @param {number} lineY - 판정선 y좌표
 * @param {object[]} effects - 활성 히트 이펙트
 */
function drawHitLineEffects(stage, lineY, effects) {
  for (const effect of effects) {
    const age = millis() - effect.at;
    if (effect.label === "BURNT" || effect.label === "UNDER" || age > 180) continue;
    const t = constrain(age / 180, 0, 1);
    const alpha = 155 * (1 - t) * effect.power;
    const span = stage.w * constrain(0.14 + effect.power * 0.11, 0.14, 0.28);

    stroke(effect.color[0], effect.color[1], effect.color[2], alpha);
    strokeWeight(8 * (1 - t) + 2);
    line(effect.x - span, lineY, effect.x + span, lineY);
  }
}

/**
 * 히트 위치에 판정별 링·스파크·미스 표시를 그린다.
 * @param {object[]} effects - 활성 히트 이펙트
 */
function drawHitEffects(effects) {
  for (const effect of effects) {
    const age = millis() - effect.at;
    const t = constrain(age / effect.duration, 0, 1);
    const fade = 1 - t;
    const alpha = 210 * fade;
    const base = GAME_CONFIG.noteSize * effect.power;
    const ring = base * (1.1 + t * 2.15);

    noFill();
    stroke(effect.color[0], effect.color[1], effect.color[2], alpha);
    strokeWeight(2 + 5 * fade * effect.power);
    circle(effect.x, effect.y, ring);

    if (effect.label === "BURNT" || effect.label === "UNDER") {
      const mark = effect.label === "BURNT" ? [64, 52, 44] : [255, 72, 96];
      stroke(mark[0], mark[1], mark[2], alpha);
      strokeWeight(4 * fade + 1);
      const size = base * (0.58 + t * 0.5);
      line(effect.x - size, effect.y - size, effect.x + size, effect.y + size);
      line(effect.x + size, effect.y - size, effect.x - size, effect.y + size);
      continue;
    }

    stroke(255, 255, 255, alpha * 0.72);
    strokeWeight(1.5 + 2 * fade);
    circle(effect.x, effect.y, ring * 0.54);

    const sparkCount = effect.label === "MELLOW!" ? 8 : 5;
    for (let i = 0; i < sparkCount; i += 1) {
      const angle = (TWO_PI / sparkCount) * i + t * 0.45;
      const inner = ring * 0.28;
      const outer = ring * (0.42 + 0.18 * fade);
      line(
        effect.x + cos(angle) * inner,
        effect.y + sin(angle) * inner,
        effect.x + cos(angle) * outer,
        effect.y + sin(angle) * outer,
      );
    }
  }
}
