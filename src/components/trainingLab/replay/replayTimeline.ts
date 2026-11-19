import type { TSeat, TState } from '@/hooks/useTrainingTable';
import { r2, splitCards, type RAction, type RHand, type RSeatInfo } from './types';

export const STREETS = ['preflop', 'flop', 'turn', 'river', 'showdown'] as const;
const BOARD_COUNT: Record<string, number> = { preflop: 0, flop: 3, turn: 4, river: 5, showdown: 5 };

export interface Frame { state: TState; street: string; actionId: string | null }

/**
 * Turns a saved hand into a list of table snapshots (one per action, plus the deal and the result),
 * so the replayer can step, jump and play without ever touching the live game.
 * Chip amounts come from the pot growth of each action, which is exact for calls, raises and all-ins alike.
 */
export function buildTimeline(hand: RHand, actions: RAction[], seats: RSeatInfo[], startStacks: Record<number, number>): Frame[] {
  const acts = [...actions].filter((a) => a.hand_id === hand.id).sort((a, b) => a.sequence - b.sequence);
  const board = splitCards(hand.board_cards);
  const inHand = new Set(acts.map((a) => a.seat_number));
  const seatMap: Record<string, TSeat> = {};
  for (const s of seats) {
    seatMap[s.seat] = {
      seat: s.seat, type: s.type, player_id: s.player_id, name: s.name, style: null,
      stack: startStacks[s.seat] ?? 0, bet: 0, committed: 0, folded: false, all_in: false, acted: false,
      in_hand: inHand.has(s.seat), ready: true,
    };
  }
  for (const n of inHand) if (!seatMap[n]) seatMap[n] = { seat: n, type: 'student', player_id: null, name: `Seat ${n}`, style: null, stack: startStacks[n] ?? 0, bet: 0, committed: 0, folded: false, all_in: false, acted: false, in_hand: true, ready: true };

  const blinds = acts.filter((a) => a.action === 'post_blind').map((a) => a.seat_number);
  let st: TState = {
    status: 'in_hand', hand_id: hand.id, hand_number: hand.hand_number, dealer_seat: hand.dealer_seat,
    sb_seat: blinds[blinds.length - 2] ?? null, bb_seat: blinds[blinds.length - 1] ?? null, street: 'preflop', board: [],
    seats: seatMap, to_act: null, current_bet: 0, min_raise: 0, pot_total: 0, deadline: null, seq: 0, last_action: null,
    results: null, shown: {}, paused: false, discuss: null, settings: { auto_deal: false, timer: 0 }, preset: null,
  };
  const clone = (s: TState): TState => ({ ...s, board: [...s.board], shown: { ...s.shown }, seats: Object.fromEntries(Object.entries(s.seats).map(([k, v]) => [k, { ...v }])) });
  const frames: Frame[] = [{ state: clone(st), street: 'preflop', actionId: null }];
  let pot = 0;
  for (const a of acts) {
    st = clone(st);
    const street = a.street;
    if (street !== st.street) {
      for (const p of Object.values(st.seats)) p.bet = 0;
      st.current_bet = 0;
      st.street = street;
      st.board = board.slice(0, BOARD_COUNT[street] ?? board.length);
    }
    const p = st.seats[a.seat_number];
    const potAfter = a.pot_after ?? pot;
    const put = Math.max(0, r2(potAfter - pot));
    pot = potAfter;
    if (a.action === 'show') {
      st.shown[a.seat_number] = splitCards(a.revealed_cards);
    } else if (p) {
      if (a.action === 'fold') p.folded = true;
      p.stack = r2(p.stack - put); p.bet = r2(p.bet + put); p.committed = r2(p.committed + put);
      if (a.action === 'all-in') p.all_in = true;
      if (p.bet > st.current_bet) st.current_bet = p.bet;
      st.last_action = { seat: a.seat_number, action: a.action, amount: a.action === 'call' ? put : p.bet };
    }
    st.pot_total = pot; st.seq += 1;
    frames.push({ state: st, street, actionId: a.id });
  }
  // Result: full board, pot to the winners.
  st = clone(st);
  st.street = st.street === 'showdown' ? 'showdown' : (Object.keys(st.shown).length ? 'showdown' : st.street);
  if (st.street === 'showdown') st.board = board;
  else if (board.length > st.board.length) { st.board = board; st.street = 'showdown'; }
  for (const w of hand.winners || []) if (st.seats[w.seat]) st.seats[w.seat].stack = r2(st.seats[w.seat].stack + w.amount);
  st.status = 'hand_over'; st.results = hand.winners || []; st.last_action = null; st.seq += 1;
  frames.push({ state: st, street: st.street, actionId: null });
  return frames;
}

/** First frame index of each street present in the timeline. */
export function streetStarts(frames: Frame[]): Record<string, number> {
  const out: Record<string, number> = {};
  frames.forEach((f, i) => { if (out[f.street] === undefined) out[f.street] = i; });
  return out;
}

/** Stack each seat starts each hand with, carried over hand by hand from the lesson's starting stack. */
export function carryStacks(hands: RHand[], actions: RAction[], start: number): Record<string, Record<number, number>> {
  const out: Record<string, Record<number, number>> = {};
  const stacks: Record<number, number> = {};
  for (const h of [...hands].sort((a, b) => a.hand_number - b.hand_number)) {
    const acts = actions.filter((a) => a.hand_id === h.id).sort((a, b) => a.sequence - b.sequence);
    const seatsIn = [...new Set(acts.map((a) => a.seat_number))];
    for (const s of seatsIn) if (!(s in stacks) || stacks[s] <= 0) stacks[s] = start;
    out[h.id] = { ...stacks };
    let pot = 0;
    for (const a of acts) { const p = a.pot_after ?? pot; stacks[a.seat_number] = r2(stacks[a.seat_number] - Math.max(0, p - pot)); pot = p; }
    for (const w of h.winners || []) stacks[w.seat] = r2((stacks[w.seat] ?? 0) + w.amount);
  }
  return out;
}

/** Which hole cards a viewer may see in a replay: the coach sees all; a student sees their own seat plus showdown cards. */
export function visibleCards(seat: number, frameShown: Record<string, string[]>, holes: Record<number, string[]>, viewer: { isCoach: boolean; mySeat?: number }) {
  if (frameShown[seat]) return frameShown[seat];
  if (viewer.isCoach || seat === viewer.mySeat) return holes[seat];
  return undefined;
}
