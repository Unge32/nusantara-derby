// Nusantara Derby — audio.js
// All sound is synthesized with WebAudio: no audio files, no network.
// The context is created lazily on the first user gesture.
let ctx = null;
let muted = false;

function ac() {
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function unlockAudio() {
  ac();
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function tone(freq, dur, type, gain, when = 0, slideTo = 0) {
  const c = ac();
  if (!c || muted) return;
  try {
    const t0 = c.currentTime + when;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  } catch {
    // Audio is decoration; a failure must never break the game.
  }
}

function noise(dur, gain, freq, when = 0) {
  const c = ac();
  if (!c || muted) return;
  try {
    const t0 = c.currentTime + when;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(c.destination);
    src.start(t0);
  } catch {
    // Decoration only.
  }
}

export const sfx = {
  click() { tone(660, 0.07, 'triangle', 0.12); },
  bell() {
    // Starting bell: a bright strike that rings twice.
    tone(1175, 0.5, 'sine', 0.22);
    tone(1760, 0.4, 'sine', 0.1);
    tone(1175, 0.5, 'sine', 0.18, 0.28);
  },
  hoof() { noise(0.09, 0.16, 500); },
  spur() { noise(0.18, 0.2, 2400); tone(520, 0.16, 'square', 0.05, 0, 900); },
  coin() {
    tone(988, 0.09, 'sine', 0.16);
    tone(1319, 0.16, 'sine', 0.16, 0.08);
  },
  win() {
    // Short fanfare arpeggio.
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.16, i * 0.11));
    tone(1319, 0.4, 'triangle', 0.14, 0.48);
  },
  lose() {
    [392, 330, 262].forEach((f, i) => tone(f, 0.25, 'triangle', 0.12, i * 0.16));
  },
  cheer() {
    // Crowd swell: layered noise that rises and falls.
    noise(0.9, 0.12, 1200);
    noise(0.9, 0.08, 2400, 0.08);
    noise(0.7, 0.06, 800, 0.2);
  },
  level() { tone(784, 0.1, 'sine', 0.14); tone(1047, 0.18, 'sine', 0.14, 0.09); },
};
