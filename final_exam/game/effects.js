/**
 * 히트 이펙트, 화면 흔들림, 날아가는 마시멜로 상태를 관리한다.
 */
const HIT_EFFECT_LEVELS = {
  "MELLOW!": { power: 1.25, shake: 4, duration: 360 },
  TOASTY: { power: 1, shake: 3, duration: 320 },
  WARM: { power: 0.72, shake: 1.8, duration: 280 },
  UNDER: { power: 0.48, shake: 0, duration: 240 },
  BURNT: { power: 0.38, shake: 0, duration: 220 },
};

/**
 * 매 프레임 오래된 이펙트를 지우고 움직이는 이펙트를 갱신한다.
 */
function updatePlayEffects() {
  updateHitEffects();
  updateEjections();
  updateStackBursts();
}

/**
 * 표시 시간이 지난 hit 링 이펙트를 제거한다.
 */
function updateHitEffects() {
  const now = millis();
  Play.hitEffects = Play.hitEffects.filter(
    (effect) => now - effect.at < effect.duration,
  );
}

/**
 * 화면이 그릴 수 있는 현재 hit 이펙트 목록을 돌려준다.
 */
function getActiveHitEffects() {
  return Play.hitEffects;
}

/**
 * hit/miss 순간에 보이는 링, 색, 흔들림 정보를 저장한다.
 */
function addHitEffect(note, label) {
  const pos = getNotePosition(note);
  const comboBoost = Play.combo >= 10 ? constrain(Play.combo / 50, 0.12, 0.35) : 0;
  const level = HIT_EFFECT_LEVELS[label] ?? HIT_EFFECT_LEVELS.WARM;

  Play.hitEffects.push({
    x: pos.x,
    y: pos.y,
    at: millis(),
    label,
    color: getJudgeEffectColor(label, note),
    power: level.power + comboBoost,
    duration: level.duration,
  });
  trimQueue(Play.hitEffects, GAME_CONFIG.maxHitEffects);
  addScreenShake(level, comboBoost);
}

/**
 * 좋은 판정일 때 짧은 화면 흔들림 값을 설정한다.
 */
function addScreenShake(level, comboBoost) {
  if (level.shake <= 0) return;

  Play.shakeAt = millis();
  Play.shakePower = level.shake + comboBoost * 3;
}

/**
 * 판정명과 마시멜로 색에 맞는 이펙트 색을 고른다.
 */
function getJudgeEffectColor(label, note) {
  if (label === "BURNT") return [54, 44, 40];
  if (label === "UNDER") return [255, 150, 170];

  const colors = {
    white: [255, 239, 205],
    red: [255, 138, 138],
    blue: [135, 207, 255],
  };
  return colors[getMarshmallowColorForNote(note)] ?? colors.white;
}

/**
 * 꼬치 스택 보너스가 터질 때 원형 burst 이펙트를 추가한다.
 */
function addStackBurst(nose) {
  Play.stackBursts.push({
    x: nose.x,
    y: nose.y + GAME_CONFIG.noteSize * 1.6,
    at: millis(),
    duration: 460,
  });
  trimQueue(Play.stackBursts, GAME_CONFIG.maxStackBursts);
}

/**
 * 시간이 지난 stack burst 이펙트를 제거한다.
 */
function updateStackBursts() {
  const now = millis();
  Play.stackBursts = Play.stackBursts.filter(
    (burst) => now - burst.at < burst.duration,
  );
}

/**
 * 실패한 마시멜로가 옆으로 튕겨 나가는 상태를 만든다.
 */
function addMarshmallowEjection(note) {
  const pos = getNotePosition(note);
  const dir = random() < 0.5 ? -1 : 1;

  Play.ejections.push({
    x: pos.x,
    y: pos.y,
    vx: dir * random(6.2, 8.6),
    vy: random(-8.4, -5.8),
    gravity: 0.55,
    rotation: random(-0.25, 0.25),
    spin: dir * random(0.12, 0.2),
    color: getMarshmallowColorForNote(note),
    state: getMarshmallowCookState(note),
  });
  trimQueue(Play.ejections, GAME_CONFIG.maxEjections);
}

/**
 * 튕겨 나간 마시멜로의 위치와 회전을 매 프레임 이동시킨다.
 */
function updateEjections() {
  const stage = getStageRect();
  Play.ejections = Play.ejections.filter((item) => {
    item.x += item.vx;
    item.y += item.vy;
    item.vy += item.gravity;
    item.rotation += item.spin;
    return isMarshmallowStillOnScreen(item, stage);
  });
}

/**
 * 튕겨 나간 마시멜로가 아직 화면 근처에 남아 있는지 확인한다.
 */
function isMarshmallowStillOnScreen(item, stage) {
  const margin = GAME_CONFIG.noteSize * 3;
  return (
    item.x > stage.x - margin &&
    item.x < stage.x + stage.w + margin &&
    item.y < stage.y + stage.h + margin
  );
}

/**
 * 이펙트 배열이 너무 길어지지 않도록 오래된 항목을 앞에서 지운다.
 */
function trimQueue(items, limit) {
  while (items.length > limit) items.shift();
}
