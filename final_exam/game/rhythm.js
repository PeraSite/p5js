/**
 * 채보 기준으로 Play.notes와 점수·콤보 상태를 초기화한다.
 * @author 정제훈
 */
function resetGame() {
  Play.notes = (Play.chart?.notes || []).map((note, index) => ({
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
}

/**
 * howTo 화면에서 플레이를 시작한다. 얼굴·사운드 검사 후 playing 상태로 전환.
 * @author 정제훈
 */
async function startGame() {
  if (App.state !== "howTo") return;
  if (!Face.nose) {
    showJudge("FACE REQUIRED");
    App.state = "cameraSetup";
    return;
  }
  if (!Audio.pianoReady) {
    showJudge("LOADING SOUND");
    return;
  }
  await Tone.start();
  resetGame();
  Play.startedAt = millis();
  App.state = "playing";
}

/**
 * playing 상태일 때 경과 시간을 갱신하고 노트 판정을 처리한다.
 * @author 정제훈
 */
function tickPlaying() {
  Play.gameTime = millis() - Play.startedAt;
  updateNotes();
}

/**
 * 모든 활성 노트에 대해 충돌·미스 판정을 수행하고 곡 종료를 검사한다.
 * @author 정제훈
 * 마지막 노트 후 1.8초 지나면 App.state를 result로 변경
 */
function updateNotes() {
  for (const note of Play.notes) {
    if (note.hit || note.missed) continue;

    const pos = notePosition(note);
    const delta = Play.gameTime - note.time;
    const touching =
      Face.nose &&
      dist(Face.nose.x, Face.nose.y, pos.x, pos.y) <
        GAME_CONFIG.noseRadius + GAME_CONFIG.noteSize * 0.35;

    if (touching && abs(delta) <= GAME_CONFIG.judgeWindows.at(-1).window) {
      hitNote(note, delta);
    } else if (delta > GAME_CONFIG.missAfter) {
      missNote(note);
    }
  }

  const last = Play.notes[Play.notes.length - 1];
  if (last && Play.gameTime > last.time + 1800) App.state = "result";
}

/**
 * 타이밍에 맞춘 노트를 처리하고 점수·콤보·판정·피아노 소리를 반영한다.
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
  showJudge(result.label);
  playPianoNote(note);
}

/**
 * 노트를 미스 처리하고 콤보를 초기화한다.
 * @author 정제훈
 * @param {object} note - Play.notes 항목
 */
function missNote(note) {
  note.missed = true;
  Play.misses += 1;
  Play.combo = 0;
  showJudge("MISS");
}

/**
 * 현재 시각 기준 노트의 화면 좌표와 표시 여부를 계산한다.
 * @author 정제훈
 * @param {object} note - time, x 등 채보 노트
 * @returns {{ x: number, y: number, visible: boolean }} 그리기·충돌 판정용 좌표
 */
function notePosition(note) {
  const stage = stageRect();
  const hitY = hitLineY();
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

/**
 * 화면에 잠깐 보여줄 판정 라벨을 Play에 기록한다.
 * @author 정제훈
 * @param {string} label - EXCELLENT, MISS 등
 */
function showJudge(label) {
  Play.judge = label;
  Play.judgeAt = millis();
}
