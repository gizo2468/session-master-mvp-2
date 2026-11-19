// Preflop decisions from a range set: finds position + situation, samples the mixed frequency.
import { legalActions, positionLabels, r2, type TableState, type Config } from '../engine.ts';
import { holeToKey, rangePct, sampleFreq, situationKey, type Position, type RangeSet, type Situation } from './rangeCore.ts';
import { topHands } from './presets.ts';
import type { StrategyContext, StrategyDecision } from './types.ts';

/** Map any table position label onto the six chart positions; extra early seats are tightened. */
export const chartPosition = (label: string): { pos: Position; tighten: number } => {
  switch (label) {
    case 'UTG': case 'UTG+1': case 'UTG+2': return { pos: 'UTG', tighten: label === 'UTG' ? 1 : 0.85 };
    case 'MP': return { pos: 'UTG', tighten: 1 };
    case 'HJ': return { pos: 'HJ', tighten: 1 };
    case 'CO': return { pos: 'CO', tighten: 1 };
    case 'BTN': case 'BTN/SB': return { pos: 'BTN', tighten: 1 };
    case 'SB': return { pos: 'SB', tighten: 1 };
    default: return { pos: 'BB', tighten: 1 };
  }
};

/** Which preflop spot the bot faces, from bet sizes. */
export const preflopSituation = (s: TableState, seat: number, cfg: Config, pos: Position): Situation | 'LIMPED' => {
  const me = s.seats[seat];
  const level = s.current_bet / cfg.big_blind;
  if (level <= 1.001) return pos === 'BB' ? 'LIMPED' : 'RFI';
  if (me.bet > cfg.big_blind + 0.001) return 'VS3B'; // we raised and got re-raised
  if (level >= 6.5) return 'VS3B';
  return pos === 'BB' ? 'BBDEF' : 'VSOPEN';
};

export const isHeadsUpPreflop = (s: TableState) => Object.values(s.seats).filter((p) => p.in_hand).length;

export function decidePreflop(ctx: StrategyContext, ranges: RangeSet): StrategyDecision {
  const { s, seat, hole, cfg, rnd } = ctx;
  const L = legalActions(s, seat, cfg);
  const label = positionLabels(s)[seat] || 'BB';
  const { pos, tighten } = chartPosition(label);
  const sit = preflopSituation(s, seat, cfg, pos);
  const me = s.seats[seat];
  const stackBB = (me.stack + me.bet) / cfg.big_blind;
  const players = isHeadsUpPreflop(s);
  const key = hole.length === 2 ? holeToKey(hole) : '';
  const mode = ctx.bot.mode;
  const passive = (): StrategyDecision => (L.canCheck ? { action: 'check', amount: 0, meta } : { action: 'fold', amount: 0, meta });
  const meta: any = { mode, street: 'preflop', situation: `${label} ${sit === 'LIMPED' ? 'option' : sit}`, hand: key };

  if (sit === 'LIMPED') {
    // BB option after limps: raise the top ~15%, otherwise check.
    const raise = topHands(15).has(key) && rnd() < 0.7 && L.canBetOrRaise;
    meta.freq = { r: raise ? 70 : 0, c: 0, f: 0 };
    if (raise) return { action: 'raise', amount: r2(Math.min(L.maxTo, Math.max(L.minTo, cfg.big_blind * 4))), meta };
    return passive();
  }

  const chart = ranges[situationKey(sit, pos)];
  let freq = chart?.[key];
  // More players / short stacks / extra early seats: keep only the strongest part of the chart.
  const tightenBy = tighten * (players > 6 && mode === 'gto' ? 0.85 : 1) * (stackBB < 40 && mode === 'gto' ? 0.85 : 1);
  if (tightenBy < 1 && freq && !topHands(rangePct(chart) * tightenBy).has(key)) freq = undefined;
  const r = freq?.r || 0, c = freq?.c || 0;
  meta.freq = { r, c, f: Math.max(0, 100 - r - c) };

  // Push/fold when short (GTO mode): anything in the raise range shoves.
  if (mode === 'gto' && stackBB <= 15) {
    const playable = r + c > 0;
    meta.note = 'push/fold';
    if (playable && rnd() * 100 < r + c) return { action: s.current_bet === 0 ? 'bet' : 'raise', amount: L.maxTo, meta };
    return passive();
  }

  const pick = sampleFreq(freq, rnd());
  if (pick === 'raise' && L.canBetOrRaise) {
    const size = sit === 'RFI' ? (pos === 'SB' ? 3 : 2.5) * cfg.big_blind
      : sit === 'VS3B' ? s.current_bet * 2.3
      : s.current_bet * (pos === 'BB' || pos === 'SB' ? 4 : 3);
    const to = r2(Math.min(L.maxTo, Math.max(L.minTo, size)));
    return { action: s.current_bet === 0 ? 'bet' : 'raise', amount: to, meta };
  }
  if ((pick === 'call' || pick === 'raise') && !L.canCheck) return { action: 'call', amount: L.toCall, meta };
  if (pick === 'call' && L.canCheck) return { action: 'check', amount: 0, meta };
  return passive();
}
