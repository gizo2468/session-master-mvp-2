// Server-side bot decisions by style. Uses hand strength, draws, pot odds and randomness.
// deno-lint-ignore-file no-explicit-any
import { bestHand, legalActions, positionLabels, r2, type ActionType, type Config, type TableState } from './engine.ts';
import { RANKS } from './deck.ts';

const rv = (c: string) => RANKS.indexOf(c[0]) + 2;

/** Preflop strength 0..1 (rough Chen-style score, normalised). */
export const preflopScore = (hole: string[]): number => {
  if (hole.length > 2) {
    // PLO: reward pairs, suitedness, connectedness, high cards
    const vals = hole.map(rv).sort((a, b) => b - a);
    const suits = hole.map((c) => c[1]);
    let sc = vals.reduce((s, v) => s + v, 0) / 56;
    if (new Set(vals).size < 4) sc += 0.15;
    if (new Set(suits).size <= 2) sc += 0.12;
    if (vals[0] - vals[3] <= 4) sc += 0.12;
    return Math.min(1, sc);
  }
  const [a, b] = hole.map(rv).sort((x, y) => y - x);
  const base: Record<number, number> = { 14: 10, 13: 8, 12: 7, 11: 6 };
  let s = base[a] ?? a / 2;
  if (a === b) s = Math.max(5, s * 2);
  if (hole[0][1] === hole[1][1]) s += 2;
  const gap = a - b - 1;
  if (a !== b) s -= gap <= 0 ? 0 : gap === 1 ? 1 : gap === 2 ? 2 : gap === 3 ? 4 : 5;
  if (a !== b && gap <= 1 && a < 12) s += 1;
  return Math.max(0, Math.min(1, s / 20));
};

const STYLE: Record<string, { open: number; aggr: number; bluff: number }> = {
  tight_passive: { open: 0.5, aggr: 0.25, bluff: 0.03 },
  tight_aggressive: { open: 0.48, aggr: 0.7, bluff: 0.1 },
  loose_passive: { open: 0.3, aggr: 0.2, bluff: 0.05 },
  loose_aggressive: { open: 0.32, aggr: 0.75, bluff: 0.2 },
};

const LATE = new Set(['BTN', 'CO', 'BTN/SB', 'SB']);

const draws = (hole: string[], board: string[]) => {
  const all = [...hole, ...board];
  const suits: Record<string, number> = {};
  all.forEach((c) => (suits[c[1]] = (suits[c[1]] || 0) + 1));
  const flush = Object.values(suits).some((n) => n === 4);
  const vals = [...new Set(all.map(rv))];
  if (vals.includes(14)) vals.push(1);
  let straight = false;
  for (let lo = 1; lo <= 10; lo++) {
    const hit = [0, 1, 2, 3, 4].filter((d) => vals.includes(lo + d)).length;
    if (hit === 4) straight = true;
  }
  return { flush, straight };
};

export interface BotDecision { action: ActionType; amount: number }

export const decideBot = (s: TableState, seat: number, hole: string[], cfg: Config, rnd: () => number = Math.random): BotDecision => {
  const st = STYLE[s.seats[seat].style || 'tight_aggressive'] || STYLE.tight_aggressive;
  const L = legalActions(s, seat, cfg);
  const pos = positionLabels(s)[seat] || '';
  const noise = (rnd() - 0.5) * 0.12;
  const potOdds = L.toCall > 0 ? L.toCall / (s.pot_total + L.toCall) : 0;
  const raiseTo = (mult: number) => {
    const base = s.current_bet === 0 ? s.pot_total * mult : s.current_bet + Math.max(s.min_raise, (s.pot_total + L.toCall) * mult);
    return r2(Math.min(L.maxTo, Math.max(L.minTo, base)));
  };
  const passive = (): BotDecision => (L.canCheck ? { action: 'check', amount: 0 } : { action: 'fold', amount: 0 });

  let strength: number;
  if (s.street === 'preflop') {
    strength = preflopScore(hole) + (LATE.has(pos) ? 0.06 : 0) + noise;
    const threshold = st.open + (L.toCall > cfg.big_blind ? 0.12 : 0);
    if (strength < threshold) {
      if (L.canCheck) return { action: 'check', amount: 0 };
      if (rnd() < st.bluff && L.canBetOrRaise) return { action: 'raise', amount: raiseTo(1) };
      return { action: 'fold', amount: 0 };
    }
    if (L.canBetOrRaise && (strength > threshold + 0.15 || rnd() < st.aggr * 0.6)) {
      const to = s.current_bet <= cfg.big_blind ? r2(cfg.big_blind * (2.2 + rnd() * 0.8)) : r2(s.current_bet * 3);
      return { action: s.current_bet === 0 ? 'bet' : 'raise', amount: Math.min(L.maxTo, Math.max(L.minTo, to)) };
    }
    return L.canCheck ? { action: 'check', amount: 0 } : { action: 'call', amount: L.toCall };
  }

  const hand = bestHand(hole, s.board, cfg.game_type);
  // pokersolver rank: 1 high card ... 9 straight flush
  strength = Math.min(1, (hand.rank - 1) / 5 + noise + (hand.rank === 2 ? 0.08 : 0));
  const d = draws(hole, s.board);
  const drawEquity = s.street === 'river' ? 0 : (d.flush ? 0.19 : 0) + (d.straight ? 0.16 : 0);

  if (strength >= 0.45) {
    if (L.canBetOrRaise && rnd() < st.aggr + 0.15) return { action: s.current_bet === 0 ? 'bet' : 'raise', amount: raiseTo(0.5 + rnd() * 0.5) };
    return L.canCheck ? { action: 'check', amount: 0 } : { action: 'call', amount: L.toCall };
  }
  if (strength >= 0.2 || drawEquity > potOdds) {
    if (L.canCheck) {
      if (L.canBetOrRaise && rnd() < st.aggr * 0.5) return { action: 'bet', amount: raiseTo(0.33 + rnd() * 0.33) };
      return { action: 'check', amount: 0 };
    }
    if (potOdds < Math.max(strength, drawEquity) + 0.1) return { action: 'call', amount: L.toCall };
    return { action: 'fold', amount: 0 };
  }
  if (L.canCheck && L.canBetOrRaise && rnd() < st.bluff) return { action: 'bet', amount: raiseTo(0.5) };
  return passive();
};
