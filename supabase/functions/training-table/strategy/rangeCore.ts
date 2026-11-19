// Shared range format (identical copy in src/components/trainingLab/ranges/rangeCore.ts – keep in sync).
// A range = { [handKey]: { r?: raise %, c?: call % } }, rest = fold. Ranges object = { [`${situation}:${position}`]: Range }.

export const MATRIX_RANKS = 'AKQJT98765432';
export const POSITIONS = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'] as const;
export type Position = typeof POSITIONS[number];
export const SITUATIONS = ['RFI', 'VSOPEN', 'VS3B', 'BBDEF'] as const;
export type Situation = typeof SITUATIONS[number];

export interface Freq { r?: number; c?: number }
export type Range = Record<string, Freq>;
export type RangeSet = Record<string, Range>;

export const situationKey = (sit: Situation, pos: Position) => `${sit}:${pos}`;

/** Valid positions for a situation (BB defense only in BB, BB never opens). */
export const positionsFor = (sit: Situation): Position[] =>
  sit === 'BBDEF' ? ['BB'] : sit === 'RFI' ? ['UTG', 'HJ', 'CO', 'BTN', 'SB'] : [...POSITIONS];

/** Matrix cell key: row i / col j. Pairs on the diagonal, suited above, offsuit below. */
export const handKey = (i: number, j: number) => {
  const a = MATRIX_RANKS[Math.min(i, j)], b = MATRIX_RANKS[Math.max(i, j)];
  return i === j ? a + b : a + b + (i < j ? 's' : 'o');
};

export const ALL_HANDS: string[] = (() => {
  const out: string[] = [];
  for (let i = 0; i < 13; i++) for (let j = 0; j < 13; j++) out.push(handKey(i, j));
  return out;
})();

export const combos = (k: string) => (k.length === 2 ? 6 : k[2] === 's' ? 4 : 12);

/** Two hole cards like ["Ah","Kd"] -> "AKo". */
export const holeToKey = (hole: string[]) => {
  const [x, y] = hole;
  const ix = MATRIX_RANKS.indexOf(x[0]), iy = MATRIX_RANKS.indexOf(y[0]);
  const [hi, lo] = ix <= iy ? [x, y] : [y, x];
  if (hi[0] === lo[0]) return hi[0] + lo[0];
  return hi[0] + lo[0] + (hi[1] === lo[1] ? 's' : 'o');
};

const clampPct = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** % of all 1326 combos played (raise + call weighted). */
export const rangePct = (r: Range | undefined) => {
  if (!r) return 0;
  let w = 0;
  for (const [k, f] of Object.entries(r)) w += combos(k) * (clampPct((f.r || 0) + (f.c || 0)) / 100);
  return Math.round((w / 1326) * 1000) / 10;
};

const ri = (c: string) => MATRIX_RANKS.indexOf(c.toUpperCase());

/** Expand one token ("22+", "A2s+", "KTs-K8s", "AK", "77-55") to hand keys. */
export const expandToken = (tokRaw: string): string[] => {
  const tok = tokRaw.trim();
  if (!tok) return [];
  const m = tok.match(/^([AKQJT2-9])([AKQJT2-9])([so]?)(\+?)(?:-([AKQJT2-9])([AKQJT2-9])([so]?))?$/i);
  if (!m) return [];
  const [, a, b, suf, plus, a2, b2] = m;
  const A = ri(a), B = ri(b);
  if (A < 0 || B < 0) return [];
  const out: string[] = [];
  const sufs = suf ? [suf.toLowerCase()] : ['s', 'o'];
  if (A === B) {
    const end = plus ? 0 : a2 ? ri(a2) : A;
    const [from, to] = [Math.min(A, end), Math.max(A, end)];
    for (let i = from; i <= to; i++) out.push(MATRIX_RANKS[i] + MATRIX_RANKS[i]);
    return out;
  }
  const hi = Math.min(A, B), lo = Math.max(A, B);
  let kickers: number[] = [lo];
  if (plus) { kickers = []; for (let k = hi + 1; k <= lo; k++) kickers.push(k); }
  else if (b2) { const e = ri(b2); kickers = []; for (let k = Math.min(lo, e); k <= Math.max(lo, e); k++) kickers.push(k); }
  for (const k of kickers) for (const s of sufs) out.push(MATRIX_RANKS[hi] + MATRIX_RANKS[k] + s);
  return out;
};

/** Parse text like "22+, A2s+, KTs+, AJo+:60" into a range. `:N` = frequency, default 100. Action = raise unless `as` = 'c'. */
export const parseRange = (text: string, as: 'r' | 'c' = 'r'): Range => {
  const out: Range = {};
  for (const part of text.split(/[,\s]+/)) {
    if (!part) continue;
    const [tok, f] = part.split(':');
    const pct = f != null && f !== '' ? clampPct(Number(f)) : 100;
    if (Number.isNaN(pct)) continue;
    for (const k of expandToken(tok)) out[k] = { ...(out[k] || {}), [as]: pct };
  }
  return out;
};

/** Range -> text of hands for one action (raise or call), with :N for mixed frequencies. */
export const rangeToText = (r: Range, as: 'r' | 'c' = 'r') =>
  ALL_HANDS.filter((k) => (r[k]?.[as] || 0) > 0).map((k) => (r[k][as]! >= 100 ? k : `${k}:${r[k][as]}`)).join(', ');

/** Pick an action from a frequency entry with a random number 0..1. */
export const sampleFreq = (f: Freq | undefined, u: number): 'raise' | 'call' | 'fold' => {
  const r = clampPct(f?.r || 0), c = clampPct(f?.c || 0);
  const x = u * 100;
  if (x < r) return 'raise';
  if (x < r + Math.min(c, 100 - r)) return 'call';
  return 'fold';
};
