// GTO-approximation postflop play: equity vs a likely range, board texture, position, SPR,
// standard sizes, value:bluff ratio by size, MDF defence, blocker-based bluffs, real randomisation.
import { bestHand, legalActions, positionLabels, r2, type Config, type TableState } from '../engine.ts';
import { fullDeck } from '../deck.ts';
import pokersolver from 'https://esm.sh/pokersolver@2.1.4';
// deno-lint-ignore no-explicit-any
const { Hand } = pokersolver as any;
import { holeToKey } from './rangeCore.ts';
import { topHands } from './presets.ts';
import type { StrategyContext, StrategyDecision } from './types.ts';

const RV = '23456789TJQKA';
const rv = (c: string) => RV.indexOf(c[0]) + 2;

export interface Texture { wet: number; paired: boolean; monotone: boolean; label: string }
export const boardTexture = (board: string[]): Texture => {
  const suits: Record<string, number> = {};
  board.forEach((c) => (suits[c[1]] = (suits[c[1]] || 0) + 1));
  const maxSuit = Math.max(0, ...Object.values(suits));
  const vals = [...new Set(board.map(rv))].sort((a, b) => a - b);
  const paired = vals.length < board.length;
  let conn = 0;
  for (let i = 1; i < vals.length; i++) if (vals[i] - vals[i - 1] <= 2) conn++;
  const monotone = maxSuit >= 3;
  const wet = Math.min(1, (maxSuit >= 2 ? 0.35 : 0) + (monotone ? 0.3 : 0) + conn * 0.2 - (paired ? 0.15 : 0));
  return { wet: Math.max(0, wet), paired, monotone, label: monotone ? 'monotone' : paired ? 'paired' : wet >= 0.5 ? 'wet' : 'dry' };
};

/** Minimum defence frequency vs a bet of `bet` into `pot` (pot before the bet). */
export const mdf = (pot: number, bet: number) => (pot + bet > 0 ? pot / (pot + bet) : 1);
/** Share of bluffs in a balanced river betting range for a bet of `bet` into `pot`. */
export const bluffShare = (pot: number, bet: number) => (pot + 2 * bet > 0 ? bet / (pot + 2 * bet) : 0);

/** Monte-Carlo equity of `hole` vs `opps` opponents holding hands from their likely range. */
export const estimateEquity = (hole: string[], board: string[], game: 'NLH' | 'PLO', opps: number, rangePct: number, rnd: () => number, iters = 160): number => {
  const known = new Set([...hole, ...board]);
  const deck = fullDeck().filter((c) => !known.has(c));
  const range = game === 'NLH' ? topHands(rangePct) : null;
  const holeN = game === 'PLO' ? 4 : 2;
  let won = 0, n = 0;
  for (let it = 0; it < iters; it++) {
    const d = [...deck];
    const draw = () => d.splice(Math.floor(rnd() * d.length), 1)[0];
    const oppHands: string[][] = [];
    let ok = true;
    for (let o = 0; o < opps && ok; o++) {
      let h: string[] = [];
      for (let tries = 0; tries < 12; tries++) {
        h = Array.from({ length: holeN }, draw);
        if (!range || range.has(holeToKey(h))) break;
        d.push(...h); h = [];
      }
      if (!h.length) h = Array.from({ length: holeN }, draw);
      oppHands.push(h);
    }
    const full = [...board];
    while (full.length < 5) full.push(draw());
    const mine = bestHand(hole, full, game);
    const theirs = oppHands.map((h) => bestHand(h, full, game));
    const all = [mine, ...theirs];
    const winners = Hand.winners(all);
    if (winners.includes(mine)) won += 1 / winners.length;
    n++;
  }
  return n ? won / n : 0;
};

/** Do we hold a card that blocks the nuts on this board (ace of the flush suit, or an ace/king overcard)? */
export const hasBlocker = (hole: string[], board: string[]) => {
  const suits: Record<string, number> = {};
  board.forEach((c) => (suits[c[1]] = (suits[c[1]] || 0) + 1));
  const flushSuit = Object.entries(suits).find(([, n]) => n >= 2)?.[0];
  return hole.some((c) => (c[0] === 'A' && (!flushSuit || c[1] === flushSuit)) || (c[0] === 'K' && c[1] === flushSuit));
};

const inPositionPostflop = (s: TableState, seat: number) => {
  const order = ['SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'MP', 'HJ', 'CO', 'BTN', 'BTN/SB'];
  const labels = positionLabels(s);
  const active = Object.values(s.seats).filter((p) => p.in_hand && !p.folded);
  const rank = (n: number) => order.indexOf(labels[n] === 'BTN/SB' ? 'BTN' : labels[n] || 'BB');
  return active.every((p) => p.seat === seat || rank(seat) > rank(p.seat));
};

export function decidePostflop(ctx: StrategyContext): StrategyDecision {
  const { s, seat, hole, cfg, rnd } = ctx;
  const L = legalActions(s, seat, cfg);
  const me = s.seats[seat];
  const opps = Object.values(s.seats).filter((p) => p.in_hand && !p.folded && p.seat !== seat).length;
  const tex = boardTexture(s.board);
  const ip = inPositionPostflop(s, seat);
  const potBefore = r2(s.pot_total - (s.current_bet - me.bet > 0 ? s.current_bet - me.bet : 0)); // approx pot before facing bet
  const spr = s.pot_total > 0 ? me.stack / s.pot_total : 99;
  // Opponent range: aggressor's range is narrower.
  const oppRange = s.current_bet > 0 ? 22 : 45;
  const eq = estimateEquity(hole, s.board, cfg.game_type, Math.max(1, opps), oppRange, rnd, opps > 2 ? 100 : 160);
  const meta: any = { mode: ctx.bot.mode, street: s.street, situation: `${ip ? 'IP' : 'OOP'} · ${tex.label} · SPR ${spr.toFixed(1)}`, equity: Math.round(eq * 100) };
  const betTo = (frac: number) => {
    const target = s.current_bet === 0 ? s.pot_total * frac : s.current_bet + (s.pot_total + L.toCall) * frac;
    return r2(Math.min(L.maxTo, Math.max(L.minTo, target)));
  };
  const out = (action: StrategyDecision['action'], amount: number, note: string): StrategyDecision => ({ action, amount, meta: { ...meta, note } });
  const passive = (note: string) => (L.canCheck ? out('check', 0, note) : out('fold', 0, note));

  const river = s.street === 'river';
  // Size: small on dry boards, big on wet; overbet the river with the nuts when deep.
  let size = tex.wet >= 0.5 ? 0.75 : 0.33;
  if (river && eq > 0.88 && spr > 1.5) size = 1.25;
  if (spr < 1) size = 2; // just get it in
  // Equity adjusted for multiway and position.
  const adj = eq - (opps - 1) * 0.04 + (ip ? 0.03 : -0.02);

  if (L.toCall === 0) {
    if (!L.canBetOrRaise) return out('check', 0, 'check');
    const valueLine = river ? 0.7 : 0.62;
    if (adj >= valueLine) return rnd() < (ip ? 0.85 : 0.7) ? out('bet', betTo(size), `value ${Math.round(size * 100)}%`) : out('check', 0, 'trap/check');
    // Bluffs: choose with blockers or draws, at the frequency balanced for this size.
    const drawy = !river && adj >= 0.3 && adj < valueLine;
    const share = bluffShare(1, size);
    const bluffFreq = (river ? share / (1 - share) : share) * (opps > 1 ? 0.4 : 1) * (ip ? 1.1 : 0.8);
    if ((drawy || hasBlocker(hole, s.board)) && rnd() < bluffFreq * (drawy ? 1.5 : 1)) return out('bet', betTo(size), drawy ? 'semi-bluff' : 'blocker bluff');
    return out('check', 0, 'check');
  }

  // Facing a bet.
  const potOdds = L.toCall / (s.pot_total + L.toCall);
  const defend = mdf(potBefore, L.toCall);
  if (adj >= 0.8 && L.canBetOrRaise && rnd() < 0.6) return out('raise', betTo(river ? 1 : 0.75), 'value raise');
  if (!river && adj >= potOdds && adj < 0.55 && L.canBetOrRaise && hasBlocker(hole, s.board) && rnd() < 0.12) return out('raise', betTo(0.75), 'bluff raise');
  if (adj >= potOdds + 0.03) return out('call', L.toCall, `call (odds ${Math.round(potOdds * 100)}%)`);
  // Marginal: defend just enough to meet MDF so we can't be auto-bluffed.
  if (adj >= potOdds - 0.12 && rnd() < defend * 0.6) return out('call', L.toCall, `MDF defend ${Math.round(defend * 100)}%`);
  return passive('fold');
}
