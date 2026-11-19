import { describe, expect, it } from 'vitest';
import { buildTimeline, carryStacks, streetStarts, visibleCards } from './replayTimeline';
import { computeStats } from './lessonStats';
import type { RAction, RHand } from './types';

// 4 seats, BB = 2. Seat 1 (student A, 40 chips) shoves, seat 2 (student B, 200) calls, seat 3 (bot, 200) calls, seat 4 (coach) folds.
// B re-raises to 80, bot calls. Main pot 120 (A, B, bot), side pot 80 (B, bot). A wins main, bot wins side.
const hand: RHand = { id: 'h1', hand_number: 1, dealer_seat: 4, board_cards: 'AhKd7s2c9h', pot_total: 200,
  winners: [{ seat: 1, amount: 120, desc: 'Pair' }, { seat: 3, amount: 80, desc: 'Pair' }] };
let seq = 0;
const A = (seat: number, pid: string | null, street: string, action: string, pot: number, revealed: string | null = null): RAction =>
  ({ id: `a${++seq}`, hand_id: 'h1', seat_number: seat, player_id: pid, street, action, amount: 0, pot_after: pot, sequence: seq, revealed_cards: revealed });
const actions: RAction[] = [
  A(1, 'stuA', 'preflop', 'post_blind', 1), A(2, 'stuB', 'preflop', 'post_blind', 3),
  A(3, null, 'preflop', 'call', 5), A(4, 'coach', 'preflop', 'fold', 5),
  A(1, 'stuA', 'preflop', 'all-in', 44), A(2, 'stuB', 'preflop', 'raise', 122), A(3, null, 'preflop', 'call', 200),
  A(2, 'stuB', 'flop', 'check', 200), A(3, null, 'flop', 'check', 200),
  A(2, 'stuB', 'showdown', 'show', 200, 'QcQd'), A(3, null, 'showdown', 'show', 200, 'Kc9c'), A(1, 'stuA', 'showdown', 'show', 200, 'Ac5d'),
];
const seats = [1, 2, 3, 4].map((s) => ({ seat: s, name: `S${s}`, type: (s === 3 ? 'bot' : s === 4 ? 'coach' : 'student') as any, player_id: null }));

describe('hand replay timeline', () => {
  const frames = buildTimeline(hand, actions, seats, { 1: 40, 2: 200, 3: 200, 4: 200 });
  it('has a deal frame, one frame per action and a result frame', () => expect(frames.length).toBe(actions.length + 2));
  it('reveals the flop only on the flop and the full board at showdown', () => {
    const starts = streetStarts(frames);
    expect(frames[starts.flop].state.board).toEqual(['Ah', 'Kd', '7s']);
    expect(frames[frames.length - 1].state.board.length).toBe(5);
  });
  it('tracks the all-in player stack and the side pot payout', () => {
    const last = frames[frames.length - 1].state;
    expect(last.seats[1].stack).toBe(120);
    expect(last.seats[2].stack).toBe(120);
    expect(last.seats[3].stack).toBe(200);
    expect(last.pot_total).toBe(200);
  });
  it('carries stacks into the next hand', () => {
    const next: RHand = { ...hand, id: 'h2', hand_number: 2, winners: [] };
    const c = carryStacks([hand, next], [...actions, { ...actions[0], id: 'x', hand_id: 'h2', pot_after: 1 }], 40);
    expect(c.h2[1]).toBe(120);
  });
});

describe('card visibility in replays', () => {
  const holes = { 1: ['Ac', '5d'], 2: ['Qc', 'Qd'] };
  it('student sees own cards but not another player before showdown', () => {
    expect(visibleCards(1, {}, holes, { isCoach: false, mySeat: 1 })).toEqual(['Ac', '5d']);
    expect(visibleCards(2, {}, holes, { isCoach: false, mySeat: 1 })).toBeUndefined();
  });
  it('student sees cards shown at showdown', () => expect(visibleCards(2, { 2: ['Qc', 'Qd'] }, holes, { isCoach: false, mySeat: 1 })).toEqual(['Qc', 'Qd']));
  it('coach sees every hand', () => expect(visibleCards(2, {}, holes, { isCoach: true })).toEqual(['Qc', 'Qd']));
});

describe('lesson stats', () => {
  it('counts VPIP, PFR and net BB for the all-in student', () => {
    const s = computeStats('stuA', [hand], actions, 2);
    expect(s).toMatchObject({ hands: 1, vpip: 100, pfr: 100, net_bb: 40, biggest_won_bb: 100 });
  });
  it('counts a 3-bet facing one raise and the losing side pot', () => {
    const s = computeStats('stuB', [hand], actions, 2);
    expect(s.three_bet).toBe(100);
    expect(s.net_bb).toBe(-40);
    expect(s.biggest_lost_bb).toBe(100);
  });
  it('ignores players who were not dealt in', () => expect(computeStats('nobody', [hand], actions, 2).hands).toBe(0));
});
