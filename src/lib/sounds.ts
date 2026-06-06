// CyberShield Sound Effects Engine
// Uses Web Audio API for subtle, professional sounds

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioCtx;
}

export type SoundType = 'notification' | 'alert' | 'success' | 'boot' | 'click' | 'error';

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.08) {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Silently fail — audio is optional
  }
}

export const soundEffects = {
  // Soft notification ping — two-tone ascending
  notification() {
    playTone(880, 0.12, 'sine', 0.06);
    setTimeout(() => playTone(1320, 0.15, 'sine', 0.05), 100);
  },

  // Alert warning — sharper two-tone
  alert() {
    playTone(440, 0.15, 'triangle', 0.07);
    setTimeout(() => playTone(660, 0.2, 'triangle', 0.06), 130);
  },

  // Success confirmation — pleasant ascending chord
  success() {
    playTone(523, 0.12, 'sine', 0.05);
    setTimeout(() => playTone(659, 0.12, 'sine', 0.05), 80);
    setTimeout(() => playTone(784, 0.2, 'sine', 0.04), 160);
  },

  // Boot initialization — subtle rising tone
  boot() {
    playTone(220, 0.4, 'sine', 0.04);
    setTimeout(() => playTone(440, 0.3, 'sine', 0.03), 200);
    setTimeout(() => playTone(660, 0.25, 'sine', 0.03), 400);
  },

  // UI click — very subtle tick
  click() {
    playTone(1200, 0.04, 'square', 0.02);
  },

  // Error — low descending tone
  error() {
    playTone(330, 0.2, 'sawtooth', 0.04);
    setTimeout(() => playTone(220, 0.3, 'sawtooth', 0.03), 150);
  },
};

// Global sound setting
let soundEnabled = true;

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

// Wrapper that respects the enabled flag
export function playSound(type: SoundType) {
  if (soundEnabled) {
    soundEffects[type]();
  }
}
