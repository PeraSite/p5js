/**
 * 노트 판정, 점수, 콤보 같은 리듬 게임 규칙을 처리한다.
 */
/**
 * playing 중 매 프레임 활성 노트를 판정한다.
 */
function updateNotes() {
  updatePlayEffects();
  for (const note of Play.notes) {
    processActiveNote(note);
  }
  finishGameIfSongEnded();
}

/**
 * 아직 판정되지 않은 노트 하나를 hit/miss 중 하나로 처리한다.
 */
function processActiveNote(note) {
  if (note.hit || note.missed) return;

  const pos = getNotePosition(note);
  const delta = getNoteDelta(note);
  const contact = findBestNoteContact(pos, delta);

  if (contact) {
    applyNoteContact(note, delta, contact);
    return;
  }

  if (isExpiredMiss(delta)) {
    missNote(note, "BURNT", false);
  }
}

/**
 * 꼬치 끝 hit를 우선으로 보고, 없으면 첫 miss 접촉을 반환한다.
 */
function findBestNoteContact(pos, delta) {
  let firstMiss = null;
  for (const nose of Face.noses) {
    const contact = getNoteContactForNose(nose, pos, delta);
    if (!contact) continue;
    if (contact.kind === "hit") return contact;
    if (!firstMiss) firstMiss = contact;
  }
  return firstMiss;
}

/**
 * 코 위치 하나가 노트를 어떻게 건드렸는지 판정한다.
 */
function getNoteContactForNose(nose, pos, delta) {
  if (rodTipTouchesNote(nose, pos)) {
    return isHitTiming(delta)
      ? { kind: "hit", nose }
      : { kind: "miss", label: getMissLabelForDelta(delta), eject: true };
  }
  if (rodBodyTouchesNote(nose, pos)) {
    return { kind: "miss", label: getMissLabelForDelta(delta), eject: true };
  }
  return null;
}

/**
 * 접촉 판정 결과에 따라 hitNote 또는 missNote로 보낸다.
 */
function applyNoteContact(note, delta, contact) {
  if (contact.kind === "hit") {
    hitNote(note, delta, contact);
    return;
  }
  missNote(note, contact.label, contact.eject);
}

/**
 * 노트가 아직 타이밍 라인을 지나기 전이고 판정 창 안이면 true다.
 */
function isHitTiming(delta) {
  return delta <= 0 && abs(delta) <= getLargestJudgeWindow();
}

/**
 * 노트가 너무 늦게 지나가 자동 miss가 되어야 하는지 확인한다.
 */
function isExpiredMiss(delta) {
  return delta > GAME_CONFIG.missAfter;
}

/**
 * 너무 이르면 UNDER, 너무 늦으면 BURNT 판정명을 만든다.
 */
function getMissLabelForDelta(delta) {
  return delta > 0 ? "BURNT" : "UNDER";
}

/**
 * 가장 넓은 판정 창을 가져와 roasted 상태 판단에 사용한다.
 */
function getLargestJudgeWindow() {
  return GAME_CONFIG.judgeWindows.at(-1).window;
}

/**
 * 노트가 정확히 맞았을 때 점수, 콤보, 소리, 꼬치 스택을 반영한다.
 */
function hitNote(note, delta, contact) {
  const result = getJudgeResultForDelta(delta);
  note.hit = true;
  addHitScore(result);
  showJudge(result.label);
  addSkeweredMarshmallow(note, contact);
  addHitEffect(note, result.label);
  playNoteSound(note);
}

/**
 * 타이밍 차이에 맞는 점수와 판정명을 찾는다.
 */
function getJudgeResultForDelta(delta) {
  return GAME_CONFIG.judgeWindows.find((item) => abs(delta) <= item.window);
}

/**
 * 성공 판정의 기본 점수와 콤보 보너스를 더한다.
 */
function addHitScore(result) {
  Play.hits += 1;
  Play.combo += 1;
  Play.maxCombo = max(Play.maxCombo, Play.combo);
  Play.score += result.score + Play.combo * GAME_CONFIG.comboScoreStep;
}

/**
 * 화면 중앙에 잠깐 표시할 판정 문구를 저장한다.
 */
function showJudge(label) {
  Play.judge = label;
  Play.judgeAt = millis();
}

/**
 * 성공한 마시멜로를 꼬치 스택에 올리고 꽉 차면 보너스를 준다.
 */
function addSkeweredMarshmallow(note, contact) {
  Play.skewered.unshift({
    color: getMarshmallowColorForNote(note),
    at: millis(),
  });

  if (Play.skewered.length >= GAME_CONFIG.skewerStackLimit) {
    clearFullSkewerStack(contact.nose);
  }
}

/**
 * 꼬치 스택이 가득 찼을 때 점수 보너스와 터지는 이펙트를 만든다.
 */
function clearFullSkewerStack(nose) {
  addStackBurst(nose);
  Play.score += GAME_CONFIG.skewerStackBonus;
  showJudge(`POP +${GAME_CONFIG.skewerStackBonus}`);
  Play.skewered = [];
}

/**
 * 성공한 노트에 연결된 피아노나 드럼 샘플을 재생한다.
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
 * 노트가 빗나갔을 때 콤보를 끊고 실패 이펙트를 만든다.
 */
function missNote(note, label = "BURNT", eject = false) {
  note.missed = true;
  Play.misses += 1;
  Play.combo = 0;
  showJudge(label);
  if (eject) addMarshmallowEjection(note);
  addHitEffect(note, label);
}
