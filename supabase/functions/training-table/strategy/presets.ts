// Baseline 6-max 100bb preflop charts (GTO-based approximation) + Tight/Loose variants.
// Identical copy in src/components/trainingLab/ranges/presets.ts – keep in sync.
import { ALL_HANDS, MATRIX_RANKS, combos, parseRange, situationKey, type Range, type RangeSet } from './rangeCore.ts';

/** Rough preflop strength ordering score for a hand key (higher = stronger). */
export const handScore = (k: string): number => {
  const a = 14 - MATRIX_RANKS.indexOf(k[0]), b = 14 - MATRIX_RANKS.indexOf(k[1]);
  if (a === b) return 20 + a * 2.2;
  const base: Record<number, number> = { 14: 10, 13: 8, 12: 7, 11: 6 };
  let s = base[a] ?? a / 2;
  if (k[2] === 's') s += 2;
  const gap = a - b - 1;
  s -= gap <= 0 ? 0 : gap === 1 ? 1 : gap === 2 ? 2 : gap === 3 ? 4 : 5;
  if (gap <= 1 && a < 12) s += 1;
  return s + b * 0.15;
};
export const HANDS_BY_STRENGTH = [...ALL_HANDS].sort((x, y) => handScore(y) - handScore(x));

/** Top `pct` % of combos as a set of hand keys. */
export const topHands = (pct: number): Set<string> => {
  const out = new Set<string>();
  let w = 0;
  for (const k of HANDS_BY_STRENGTH) { if (w / 1326 * 100 >= pct) break; out.add(k); w += combos(k); }
  return out;
};

const merge = (...rs: Range[]): Range => {
  const out: Range = {};
  for (const r of rs) for (const [k, f] of Object.entries(r)) out[k] = { ...(out[k] || {}), ...f };
  return out;
};

const R = (t: string) => parseRange(t, 'r');
const C = (t: string) => parseRange(t, 'c');

export const STANDARD_6MAX: RangeSet = {
  [situationKey('RFI', 'UTG')]: R('66+, A2s+, KTs+, QTs+, JTs, T9s, 98s, AJo+, KQo, A5s, A4s'),
  [situationKey('RFI', 'HJ')]: R('55+, A2s+, K9s+, Q9s+, J9s+, T9s, 98s, 87s, ATo+, KJo+, QJo'),
  [situationKey('RFI', 'CO')]: R('33+, A2s+, K7s+, Q8s+, J8s+, T8s+, 97s+, 87s, 76s, 65s, A9o+, KTo+, QTo+, JTo'),
  [situationKey('RFI', 'BTN')]: R('22+, A2s+, K2s+, Q5s+, J7s+, T7s+, 96s+, 86s+, 75s+, 64s+, 54s, A2o+, K8o+, Q9o+, J9o+, T9o, 98o'),
  [situationKey('RFI', 'SB')]: R('22+, A2s+, K4s+, Q7s+, J7s+, T7s+, 97s+, 86s+, 76s, 65s, 54s, A5o+, K9o+, QTo+, JTo'),
  ...Object.fromEntries((['UTG', 'HJ', 'CO', 'BTN', 'SB'] as const).map((p) => {
    const tight = p === 'UTG' || p === 'HJ';
    return [situationKey('VSOPEN', p), merge(
      C(tight ? '99-77, AQs-ATs, KQs, KJs, QJs, JTs, T9s, AQo' : '99-55, AJs-A9s, KJs-KTs, QJs, QTs, JTs, T9s, 98s, 87s, AQo-AJo, KQo'),
      R(tight ? 'QQ+, AKs, AKo, A5s:50' : 'TT+, AQs+, AKo, A5s, A4s, K9s:30, 76s:30'),
    )];
  })),
  [situationKey('VSOPEN', 'BB')]: merge(C('22+, A2s+, K2s+, Q6s+, J7s+, T7s+, 96s+, 85s+, 75s+, 64s+, 53s+, A7o+, K9o+, Q9o+, J9o+, T9o, 98o'), R('QQ+, AKs, AKo, A5s:60, A4s:60, K9s:30')),
  [situationKey('BBDEF', 'BB')]: merge(C('22+, A2s+, K2s+, Q4s+, J6s+, T6s+, 95s+, 85s+, 74s+, 63s+, 53s+, 43s, A2o+, K7o+, Q8o+, J8o+, T8o+, 97o+, 87o'), R('TT+, AQs+, AKo, A5s, A4s, KJs:40, 76s:30, 65s:30')),
  ...Object.fromEntries((['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'] as const).map((p) => [situationKey('VS3B', p),
    merge(C('QQ-99, AQs-AJs, KQs, AQo, JTs:50'), R('KK+, AKs, AKo:70, A5s:40'))])),
};

/** Keep only the strongest `factor` share of each range (tighter), or widen with next-best hands (factor > 1). */
export const scaleRangeSet = (set: RangeSet, factor: number): RangeSet => {
  const out: RangeSet = {};
  for (const [key, range] of Object.entries(set)) {
    let w = 0;
    for (const [k, f] of Object.entries(range)) w += combos(k) * (Math.min(100, (f.r || 0) + (f.c || 0)) / 100);
    const target = Math.min(1326, w * factor);
    const next: Range = {};
    let acc = 0;
    for (const k of HANDS_BY_STRENGTH) {
      if (acc >= target) break;
      const f = range[k];
      if (f && ((f.r || 0) + (f.c || 0)) > 0) { next[k] = f; acc += combos(k) * (((f.r || 0) + (f.c || 0)) / 100); }
      else if (factor > 1) { next[k] = key.startsWith('RFI') ? { r: 100 } : { c: 100 }; acc += combos(k); }
    }
    out[key] = next;
  }
  return out;
};

export const RANGE_PRESETS: Record<string, RangeSet> = {
  standard: STANDARD_6MAX,
  tight: scaleRangeSet(STANDARD_6MAX, 0.7),
  loose: scaleRangeSet(STANDARD_6MAX, 1.35),
};
