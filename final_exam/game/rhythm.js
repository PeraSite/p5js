/**
 * 채보 기준으로 Play.notes와 점수·콤보 상태를 초기화한다.
 * @author 정제훈
 */
function resetGame() {
  Play.chart = App.songs[App.selectedSong].chartData;
  Play.notes = Play.chart.notes.map((note, index) => ({
    ...note,
    id: index,
    hit: false,
    missed: false,
  }));
  Play.gameTime = 0;
  Play.startedAt = 0;
  Play.score = 0;
  Play.combo = 0;
  Play.maxCombo = 0;
  Play.hits = 0;
  Play.misses = 0;
  Play.judge = "";
  Play.hitEffects = [];
  Play.shakeAt = 0;
  Play.shakePower = 0;
  Play.ejections = [];
}

/**
 * howTo 화면에서 플레이를 시작한다. 얼굴·사운드 검사 후 playing 상태로 전환.
 * @author 정제훈
 */
async function startGame() {
  if (App.state !== "howTo") return;
  if (Face.noses.length === 0) {
    Play.judge = "SKEWER REQUIRED";
    Play.judgeAt = millis();
    App.state = "cameraSetup";
    return;
  }
  if (!Audio.pianoReady || !Audio.drumsReady) {
    Play.judge = "LOADING SOUND";
    Play.judgeAt = millis();
    return;
  }
  await Tone.start();
  resetGame();
  Play.startedAt = millis();
  App.state = "playing";
}

/**
 * 모든 활성 노트에 대해 충돌·미스 판정을 수행하고 곡 종료를 검사한다.
 * @author 정제훈
 * 마지막 노트 후 1.8초 지나면 App.state를 result로 변경
 */
function updateNotes() {
  updateEjections();
  for (const note of Play.notes) {
    if (note.hit || note.missed) continue;

    const pos = notePosition(note);
    const delta = Play.gameTime - note.time;

    let touched = false;
    for (const nose of Face.noses) {
      if (rodTipTouchesNote(nose, pos)) {
        touched = true;
        if (delta <= 0 && abs(delta) <= GAME_CONFIG.judgeWindows.at(-1).window) {
          hitNote(note, delta);
        } else {
          missNote(note, delta > 0 ? "BURNT" : "UNDER", true);
        }
        break;
      }

      if (rodBodyTouchesNote(nose, pos)) {
        touched = true;
        missNote(note, delta > 0 ? "BURNT" : "UNDER", true);
        break;
      }
    }

    if (!touched && delta > GAME_CONFIG.missAfter) {
      missNote(note, "BURNT", false);
    }
  }

  const last = Play.notes[Play.notes.length - 1];
  if (last && Play.gameTime > last.time + 1800) App.state = "result";
}

function rodTipTouchesNote(nose, pos) {
  return dist(nose.x, nose.y, pos.x, pos.y) <
    GAME_CONFIG.rodTipRadius + GAME_CONFIG.noteSize * 0.36;
}

function rodBodyTouchesNote(nose, pos) {
  const stage = stageRect();
  const fireTop = stage.y + stage.h - GAME_CONFIG.fireHeight;
  const nearRodX = abs(pos.x - nose.x) <
    GAME_CONFIG.rodWidth * 0.5 + GAME_CONFIG.noteSize * 0.36;
  const belowTip = pos.y > nose.y + GAME_CONFIG.rodTipRadius;
  const aboveFire = pos.y < fireTop + GAME_CONFIG.noteSize * 0.25;
  return nearRodX && belowTip && aboveFire;
}

/**
 * 타이밍에 맞춘 노트를 처리하고 점수·콤보·판정·소리를 반영한다.
 * @author 정제훈
 * @param {object} note - Play.notes 항목
 * @param {number} delta - gameTime - note.time (ms)
 */
function hitNote(note, delta) {
  const result = GAME_CONFIG.judgeWindows.find(
    (item) => abs(delta) <= item.window,
  );
  note.hit = true;
  Play.hits += 1;
  Play.combo += 1;
  Play.maxCombo = max(Play.maxCombo, Play.combo);
  Play.score += result.score + Play.combo * 12;
  Play.judge = result.label;
  Play.judgeAt = millis();
  addHitEffect(note, result.label);
  playNoteSound(note);
}

/**
 * 히트·미스 순간의 좌표와 강도를 저장해 짧은 타격 이펙트로 사용한다.
 * @author 정제훈
 * @param {object} note - Play.notes 항목
 * @param {string} label - 판정 라벨
 */
function addHitEffect(note, label) {
  const pos = notePosition(note);
  const comboBoost = Play.combo >= 10 ? constrain(Play.combo / 50, 0.12, 0.35) : 0;
  const levels = {
    "MELLOW!": { power: 1.25, shake: 4, duration: 360 },
    TOASTY: { power: 1, shake: 3, duration: 320 },
    WARM: { power: 0.72, shake: 1.8, duration: 280 },
    UNDER: { power: 0.48, shake: 0, duration: 240 },
    BURNT: { power: 0.38, shake: 0, duration: 220 },
  };
  const level = levels[label] ?? levels.WARM;
  const color = judgeEffectColor(label, note);

  Play.hitEffects.push({
    x: pos.x,
    y: pos.y,
    at: millis(),
    label,
    color,
    power: level.power + comboBoost,
    duration: level.duration,
  });
  if (Play.hitEffects.length > 24) Play.hitEffects.shift();

  if (level.shake > 0) {
    Play.shakeAt = millis();
    Play.shakePower = level.shake + comboBoost * 3;
  }
}

function judgeEffectColor(label, note) {
  if (label === "BURNT") return [54, 44, 40];
  if (label === "UNDER") return [255, 150, 170];
  const colors = {
    white: [255, 239, 205],
    red: [255, 138, 138],
    blue: [135, 207, 255],
  };
  return colors[marshmallowColorForNote(note)] ?? colors.white;
}

/**
 * 채보 노트에 지정된 피아노·드럼 소리를 한 번 재생한다.
 * @author 정제훈
 * @param {object} note - Play.notes 항목
 */
function playNoteSound(note) {
  if (note.note) {
    Audio.piano.triggerAttackRelease(
      note.note,
      note.duration ?? GAME_CONFIG.defaultNoteDuration,
      Tone.immediate(),
      0.9,
    );
  }
  if (["kick", "snare", "hihat"].includes(note.drum)) {
    Audio.drums.player(note.drum).start(Tone.immediate());
  }
}

/**
 * 노트를 미스 처리하고 콤보를 초기화한다.
 * @author 정제훈
 * @param {object} note - Play.notes 항목
 */
function missNote(note, label = "BURNT", eject = false) {
  note.missed = true;
  Play.misses += 1;
  Play.combo = 0;
  Play.judge = label;
  Play.judgeAt = millis();
  if (eject) addMarshmallowEjection(note);
  addHitEffect(note, label);
}

function addMarshmallowEjection(note) {
  const pos = notePosition(note);
  const dir = random() < 0.5 ? -1 : 1;
  Play.ejections.push({
    x: pos.x,
    y: pos.y,
    vx: dir * random(6.2, 8.6),
    vy: random(-8.4, -5.8),
    gravity: 0.55,
    rotation: random(-0.25, 0.25),
    spin: dir * random(0.12, 0.2),
    color: marshmallowColorForNote(note),
    state: marshmallowCookState(note),
  });
  if (Play.ejections.length > 18) Play.ejections.shift();
}

function updateEjections() {
  const stage = stageRect();
  Play.ejections = Play.ejections.filter((item) => {
    item.x += item.vx;
    item.y += item.vy;
    item.vy += item.gravity;
    item.rotation += item.spin;
    return (
      item.x > stage.x - GAME_CONFIG.noteSize * 3 &&
      item.x < stage.x + stage.w + GAME_CONFIG.noteSize * 3 &&
      item.y < stage.y + stage.h + GAME_CONFIG.noteSize * 3
    );
  });
}

/**
 * 현재 시각 기준 노트의 화면 좌표와 표시 여부를 계산한다.
 * @author 정제훈
 * @param {object} note - time, x 등 채보 노트
 * @returns {{ x: number, y: number, visible: boolean }} 그리기·충돌 판정용 좌표
 */
/**
 * hits·misses 기준 정확도(%)를 계산한다.
 * @author 정제훈
 * @returns {number} 0~100
 */
function playAccuracy() {
  const total = Play.hits + Play.misses;
  return total ? (Play.hits / total) * 100 : 0;
}

/**
 * 정확도 기준 등급(S/A/B/C)을 반환한다.
 * @author 정제훈
 * @returns {string}
 */
function playRank() {
  const accuracy = playAccuracy();
  if (accuracy >= 95) return "S";
  if (accuracy >= 85) return "A";
  if (accuracy >= 70) return "B";
  return "C";
}

function notePosition(note) {
  const stage = stageRect();
  const hitY = stage.y + stage.h * GAME_CONFIG.hitLineY;
  const startY = stage.y - GAME_CONFIG.noteSize;
  const endY = stage.y + stage.h + GAME_CONFIG.noteSize;
  const delta = Play.gameTime - note.time;
  const before =
    (Play.gameTime - (note.time - GAME_CONFIG.approachTime)) /
    GAME_CONFIG.approachTime;
  const after = delta / 800;
  const x = lerp(0.2, 0.8, constrain(note.x, 0, 1));
  return {
    x: stage.x + stage.w * x,
    y: delta <= 0 ? lerp(startY, hitY, before) : lerp(hitY, endY, after),
    visible: before >= 0 && after <= 1,
  };
}

function marshmallowColorForNote(note) {
  if (note.drum === "hihat") return "blue";
  if (note.drum === "kick" || note.drum === "snare") return "red";
  return "white";
}

function marshmallowCookState(note) {
  const delta = Play.gameTime - note.time;
  if (delta > 0) return "burnt";
  if (abs(delta) <= GAME_CONFIG.judgeWindows.at(-1).window) return "roasted";
  return "raw";
}
