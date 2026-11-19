import { useTableStore } from '@/stores/useTableStore';

let ctx: AudioContext | null = null;
const audio = () => {
  if (ctx) return ctx;
  const C = (window as any).AudioContext || (window as any).webkitAudioContext;
  ctx = C ? new C() : null;
  return ctx;
};

type Kind = 'deal' | 'check' | 'chips' | 'turn';
const SPEC: Record<Kind, { f: number[]; d: number; type: OscillatorType; g: number }> = {
  deal: { f: [1400], d: 0.05, type: 'triangle', g: 0.08 },
  check: { f: [220, 180], d: 0.06, type: 'square', g: 0.06 },
  chips: { f: [2400, 3000, 2600], d: 0.04, type: 'triangle', g: 0.07 },
  turn: { f: [660, 880], d: 0.16, type: 'sine', g: 0.14 },
};

/** Tiny synthesized table sounds — no files to download. Respects the mute toggle. */
export const playSound = (kind: Kind) => {
  if (useTableStore.getState().muted) return;
  try {
    const a = audio(); if (!a) return;
    if (a.state === 'suspended') a.resume();
    const s = SPEC[kind];
    s.f.forEach((freq, i) => {
      const t0 = a.currentTime + i * (s.d * 0.9);
      const o = a.createOscillator(); const g = a.createGain();
      o.type = s.type; o.frequency.value = freq;
      g.gain.setValueAtTime(s.g, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + s.d);
      o.connect(g); g.connect(a.destination); o.start(t0); o.stop(t0 + s.d + 0.02);
    });
  } catch { /* audio blocked */ }
  if (kind === 'turn') { try { navigator.vibrate?.([120, 60, 120]); } catch { /* unsupported */ } }
};
