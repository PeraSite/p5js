/**
 * 플레이 중 판정선·낙하 노트·코 커서를 캔버스에 그린다.
 * @author 한채아
 */
function drawPlayfield() {
  const stage = stageRect();
  const lineY = stage.y + stage.h * GAME_CONFIG.hitLineY;
  const activeEffects = activeHitEffects();

  stroke(180, 180, 180, 125);
  strokeWeight(10);
  line(stage.x, lineY, stage.x + stage.w, lineY);
  stroke(255, 255, 255, 170);
  strokeWeight(1);
  line(stage.x, lineY, stage.x + stage.w, lineY);
  drawHitLineEffects(stage, lineY, activeEffects);

  for (const note of Play.notes) {
    if (note.hit || note.missed) continue;
    const pos = notePosition(note);
    if (!pos.visible) continue;
    drawText("♪", pos.x, pos.y, {
      size: GAME_CONFIG.noteSize,
      alignH: CENTER,
      alignV: CENTER,
      style: BOLD,
      fill: noteColor(note),
    });
  }

  drawHitEffects(activeEffects);

  for (const nose of Face.noses) {
    noFill();
    stroke(255);
    strokeWeight(3);
    circle(nose.x, nose.y, GAME_CONFIG.noseRadius * 2);
    noStroke();
    fill(255);
    circle(nose.x, nose.y, 7);
  }
}

/**
 * 아직 화면에 남아야 하는 짧은 히트 이펙트만 유지한다.
 * @author 정제훈
 * @returns {object[]} 활성 이펙트 목록
 */
function activeHitEffects() {
  const now = millis();
  Play.hitEffects = Play.hitEffects.filter(
    (effect) => now - effect.at < effect.duration,
  );
  return Play.hitEffects;
}

/**
 * 히트 순간 판정선에 짧은 빛 번짐을 그린다.
 * @author 정제훈
 * @param {{ x: number, y: number, w: number, h: number }} stage - 스테이지 영역
 * @param {number} lineY - 판정선 y좌표
 * @param {object[]} effects - 활성 히트 이펙트
 */
function drawHitLineEffects(stage, lineY, effects) {
  for (const effect of effects) {
    const age = millis() - effect.at;
    if (effect.label === "MISS" || age > 180) continue;
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
 * @author 정제훈
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

    if (effect.label === "MISS") {
      stroke(255, 72, 86, alpha);
      strokeWeight(4 * fade + 1);
      const size = base * (0.58 + t * 0.5);
      line(effect.x - size, effect.y - size, effect.x + size, effect.y + size);
      line(effect.x + size, effect.y - size, effect.x - size, effect.y + size);
      continue;
    }

    stroke(255, 255, 255, alpha * 0.72);
    strokeWeight(1.5 + 2 * fade);
    circle(effect.x, effect.y, ring * 0.54);

    const sparkCount = effect.label === "EXCELLENT" ? 8 : 5;
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

/**
 * 드럼이 있으면 드럼 색을 우선하고, 아니면 피아노 색을 반환한다.
 * @author 정제훈
 * @param {object} note - Play.notes 항목
 * @returns {number[]} p5 fill 색상
 */
function noteColor(note) {
  if (note.drum && GAME_CONFIG.noteColors[note.drum]) {
    return GAME_CONFIG.noteColors[note.drum];
  }
  return GAME_CONFIG.noteColors.piano;
}
