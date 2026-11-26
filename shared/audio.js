/* Matikkapelit — Offline Web Audio Engine (Tavupeli pentatonic marimba family) */
window.MatikkaAudio = (() => {
  const MUTE_KEY = 'matikkapelit_muted';
  let ctx = null;
  let muted = false;

  try {
    muted = window.localStorage.getItem(MUTE_KEY) === '1';
  } catch (_) {
    muted = false;
  }

  // Warm C-major pentatonic scale matching Tavupeli
  const MARIMBA_NOTES = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];

  function ensureContext() {
    if (muted) return null;
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function setMuted(flag) {
    muted = Boolean(flag);
    try {
      window.localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    } catch (_) {}
  }

  function isMuted() {
    return muted;
  }

  function playMarimbaNote(ac, freq, startTime, volume = 0.2, duration = 0.34) {
    const osc1 = ac.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, startTime);

    const osc2 = ac.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 4, startTime);

    const g1 = ac.createGain();
    g1.gain.setValueAtTime(0.0001, startTime);
    g1.gain.linearRampToValueAtTime(volume, startTime + 0.008);
    g1.gain.exponentialRampToValueAtTime(0.0008, startTime + duration);

    const g2 = ac.createGain();
    g2.gain.setValueAtTime(0.0001, startTime);
    g2.gain.linearRampToValueAtTime(volume * 0.16, startTime + 0.004);
    g2.gain.exponentialRampToValueAtTime(0.0005, startTime + Math.min(0.075, duration * 0.3));

    osc1.connect(g1);
    osc2.connect(g2);
    g1.connect(ac.destination);
    g2.connect(ac.destination);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + duration + 0.04);
    osc2.stop(startTime + 0.1);
  }

  function playTap() {
    const ac = ensureContext();
    if (!ac) return;
    playMarimbaNote(ac, 440, ac.currentTime, 0.1, 0.11);
  }

  function playFlash() {
    const ac = ensureContext();
    if (!ac) return;
    const now = ac.currentTime;
    playMarimbaNote(ac, MARIMBA_NOTES[0], now, 0.13, 0.22);
    playMarimbaNote(ac, MARIMBA_NOTES[2], now + 0.055, 0.11, 0.24);
  }

  function playCorrect(stepIndex = 0) {
    const ac = ensureContext();
    if (!ac) return;
    const now = ac.currentTime;
    const idx = Math.max(0, Math.min(stepIndex % 4, 3));
    playMarimbaNote(ac, MARIMBA_NOTES[idx], now, 0.19, 0.28);
    playMarimbaNote(ac, MARIMBA_NOTES[idx + 2], now + 0.08, 0.21, 0.38);
  }

  function playMiss() {
    const ac = ensureContext();
    if (!ac) return;
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(196, now);
    osc.frequency.exponentialRampToValueAtTime(164.8, now + 0.24);

    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(360, now);

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.28);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);

    osc.start(now);
    osc.stop(now + 0.32);
  }

  function playWin() {
    const ac = ensureContext();
    if (!ac) return;
    const now = ac.currentTime;
    const melody = [MARIMBA_NOTES[0], MARIMBA_NOTES[2], MARIMBA_NOTES[3], MARIMBA_NOTES[5]];
    melody.forEach((freq, i) => {
      playMarimbaNote(ac, freq, now + i * 0.11, 0.2, i === melody.length - 1 ? 0.55 : 0.3);
    });
  }

  function unlock() {
    ensureContext();
  }

  return { setMuted, isMuted, unlock, playTap, playFlash, playCorrect, playMiss, playWin };
})();
