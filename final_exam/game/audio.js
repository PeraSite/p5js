/**
 * Tone.js 피아노 샘플러를 생성하고 Audio.piano에 연결한다.
 * 로드 완료 시 Audio.pianoReady = true
 */
function setupPiano() {
  Tone.getContext().lookAhead = 0;
  Audio.piano = new Tone.Sampler({
    urls: {
      A0: "A0.mp3",
      C1: "C1.mp3",
      "D#1": "Ds1.mp3",
      "F#1": "Fs1.mp3",
      A1: "A1.mp3",
      C2: "C2.mp3",
      "D#2": "Ds2.mp3",
      "F#2": "Fs2.mp3",
      A2: "A2.mp3",
      C3: "C3.mp3",
      "D#3": "Ds3.mp3",
      "F#3": "Fs3.mp3",
      A3: "A3.mp3",
      C4: "C4.mp3",
      "D#4": "Ds4.mp3",
      "F#4": "Fs4.mp3",
      A4: "A4.mp3",
      C5: "C5.mp3",
      "D#5": "Ds5.mp3",
      "F#5": "Fs5.mp3",
      A5: "A5.mp3",
      C6: "C6.mp3",
      "D#6": "Ds6.mp3",
      "F#6": "Fs6.mp3",
      A6: "A6.mp3",
      C7: "C7.mp3",
      "D#7": "Ds7.mp3",
      "F#7": "Fs7.mp3",
      A7: "A7.mp3",
      C8: "C8.mp3",
    },
    baseUrl: "assets/piano_sample/",
    release: 0.9,
    onload: () => {
      Audio.pianoReady = true;
    },
  }).toDestination();
  Audio.piano.volume.value = GAME_CONFIG.audioVolumes.piano;
}

/**
 * Tone.js 드럼 샘플러를 생성하고 Audio.drums에 연결한다.
 * 로드 완료 시 Audio.drumsReady = true
 */
function setupDrums() {
  Audio.drums = new Tone.Players(
    {
      kick: "assets/drum_sample/kick.mp3",
      snare: "assets/drum_sample/snare.mp3",
      hihat: "assets/drum_sample/hihat.mp3",
    },
    () => {
      Audio.drumsReady = true;
    },
  ).toDestination();
  Audio.drums.volume.value = GAME_CONFIG.audioVolumes.drums;
}

/**
 * 미스 판정 때 쓰는 짧은 탄 소리 효과음을 만든다.
 */
function setupBurnSfx() {
  Audio.burn = new Tone.NoiseSynth({
    noise: { type: "pink" },
    envelope: { attack: 0.04, decay: 0.32, sustain: 0.08, release: 0.16 },
  }).toDestination();
  Audio.burn.volume.value = -4;
}

/**
 * 푸쉬쉭 하고 타는 느낌의 미스 효과음을 재생한다.
 */
function playBurnMissSound() {
  if (Audio.burn) Audio.burn.triggerAttackRelease(0.38, Tone.immediate(), 1);
}
