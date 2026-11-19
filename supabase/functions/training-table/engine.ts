// Pure, deterministic-given-deck poker engine for Training Lab (NLH / PLO).
// deno-lint-ignore-file no-explicit-any
import pokersolver from 'https://esm.sh/pokersolver@2.1.4';
import { fullDeck, parseCards, shuffle } from './deck.ts';

const { Hand } = pokersolver as any;

export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
export type ActionType = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in';

export interface SeatState {
  seat: number;
  type: 'student' | 'bot' | 'coach' | 'closed';
  player_id: string | null;
  name: string;
  style: string | null;
  stack: number;
  bet: number;        // this street
  committed: number;  // whole hand
  folded: boolean;
  all_in: boolean;
  acted: boolean;
  in_hand: boolean;
  ready?: boolean;       // human pressed "Sit in / I'm ready"
  sitting_out?: boolean; // human is out until they sit in again
  last_seen?: number;    // last heartbeat (ms epoch) from this seat's owner
  auto_out?: boolean;    // sat out automatically after a disconnect
}

/** A human seat is connected if its owner sent a heartbeat recently. */
export const CONNECTED_MS = 25_000;
export const isHuman = (p: SeatState) => p.type === 'student' || p.type === 'coach';
export const isConnected = (p: SeatState, now = Date.now()) => !!p.last_seen && now - p.last_seen < CONNECTED_MS;
/** Who gets dealt into the next hand: bots, and humans that are connected, ready and not sitting out. */
export const isDealable = (p: SeatState, now = Date.now()) =>
  p.type !== 'closed' && p.stack > 0 && (p.type === 'bot' || (isHuman(p) && !!p.ready && !p.sitting_out && isConnected(p, now)));

export interface Config { game_type: 'NLH' | 'PLO'; small_blind: number; big_blind: number; ante: number }

export interface TableState {
  status: 'waiting' | 'in_hand' | 'hand_over' | 'ended';
  hand_id: string | null;
  hand_number: number;
  dealer_seat: number | null;
  sb_seat: number | null;
  bb_seat: number | null;
  street: Street;
  board: string[];
  seats: Record<string, SeatState>;
  to_act: number | null;
  current_bet: number;
  min_raise: number;
  pot_total: number;
  deadline: number | null;
  seq: number;
  last_action: { seat: number; action: string; amount: number } | null;
  results: { seat: number; amount: number; desc: string }[] | null;
  shown: Record<string, string[]>;
  paused: boolean;
  discuss: string | null;
  settings: { auto_deal: boolean; timer: number };
  preset: Preset | null;
  turn_started?: number | null;
  recent_actions?: { seat: number; name: string; action: string; amount: number }[];
}

export interface Preset { dealer_seat?: number | null; board?: string; seats?: Record<string, { cards?: string; stack?: number }> }

export interface LoggedAction { seat: number; street: Street; action: string; amount: number; pot_after: number; sequence: number; revealed_cards?: string }

export const r2 = (n: number) => Math.round(n * 100) / 100;

export const emptyState = (): TableState => ({
  status: 'waiting', hand_id: null, hand_number: 0, dealer_seat: null, sb_seat: null, bb_seat: null,
  street: 'preflop', board: [], seats: {}, to_act: null, current_bet: 0, min_raise: 0, pot_total: 0,
  deadline: null, seq: 0, last_action: null, results: null, shown: {}, paused: false, discuss: null,
  settings: { auto_deal: false, timer: 0 }, preset: null, turn_started: null, recent_actions: [],
});

const seatList = (s: TableState) => Object.values(s.seats).sort((a, b) => a.seat - b.seat);
const live = (s: TableState) => seatList(s).filter((p) => p.in_hand && !p.folded);
const canAct = (p: SeatState) => p.in_hand && !p.folded && !p.all_in;

/** Next seat after `from` (cyclic) matching predicate. */
export const nextSeat = (s: TableState, from: number, pred: (p: SeatState) => boolean): number | null => {
  const list = seatList(s);
  if (!list.length) return null;
  const sorted = [...list.filter((p) => p.seat > from), ...list.filter((p) => p.seat <= from)];
  return sorted.find(pred)?.seat ?? null;
};

const put = (s: TableState, p: SeatState, amt: number) => {
  const a = r2(Math.min(amt, p.stack));
  p.stack = r2(p.stack - a);
  p.bet = r2(p.bet + a);
  p.committed = r2(p.committed + a);
  s.pot_total = r2(s.pot_total + a);
  if (p.stack <= 0) p.all_in = true;
  return a;
};

const log = (s: TableState, out: LoggedAction[], seat: number, action: string, amount: number, extra: Partial<LoggedAction> = {}) => {
  s.seq += 1;
  out.push({ seat, street: s.street, action, amount: r2(amount), pot_after: s.pot_total, sequence: s.seq, ...extra });
  if (action !== 'show') s.recent_actions = [...(s.recent_actions || []), { seat, name: s.seats[seat]?.name || '', action, amount: r2(amount) }].slice(-5);
};

/** Position labels by seat for the current hand. */
export const positionLabels = (s: TableState): Record<string, string> => {
  const out: Record<string, string> = {};
  if (s.dealer_seat == null) return out;
  const order: number[] = [];
  let cur: number | null = s.dealer_seat;
  const inHand = seatList(s).filter((p) => p.in_hand).length;
  for (let i = 0; i < inHand && cur != null; i++) {
    order.push(cur);
    cur = nextSeat(s, cur, (p) => p.in_hand);
  }
  const n = order.length;
  if (n === 2) { out[order[0]] = 'BTN/SB'; out[order[1]] = 'BB'; return out; }
  const tail: Record<number, string[]> = {
    3: ['BTN', 'SB', 'BB'], 4: ['BTN', 'SB', 'BB', 'UTG'], 5: ['BTN', 'SB', 'BB', 'UTG', 'CO'],
    6: ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO'], 7: ['BTN', 'SB', 'BB', 'UTG', 'MP', 'HJ', 'CO'],
    8: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'HJ', 'CO'], 9: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'MP', 'HJ', 'CO'],
  };
  (tail[n] || []).forEach((lab, i) => { out[order[i]] = lab; });
  return out;
};

export interface DealResult { state: TableState; holes: Record<string, string[]>; deck: string[]; actions: LoggedAction[] }

/** Start a new hand. Applies preset (cards/board/stacks/dealer) then fills from a secure shuffle. */
export const startHand = (prev: TableState, cfg: Config, rand?: (n: number) => number, now = Date.now()): DealResult => {
  const s: TableState = structuredClone(prev);
  const preset = s.preset || {};
  for (const p of seatList(s)) {
    const ps = preset.seats?.[p.seat];
    if (ps?.stack && ps.stack > 0) p.stack = r2(ps.stack * cfg.big_blind);
    Object.assign(p, { bet: 0, committed: 0, folded: false, all_in: false, acted: false, in_hand: isDealable(p, now) });
  }
  const players = seatList(s).filter((p) => p.in_hand);
  if (players.length < 2) throw new Error('Need at least 2 players ready to play');

  const holeCount = cfg.game_type === 'PLO' ? 4 : 2;
  const used = new Set<string>();
  const holes: Record<string, string[]> = {};
  const presetBoard = parseCards(preset.board).slice(0, 5);
  for (const p of players) {
    const c = parseCards(preset.seats?.[p.seat]?.cards).slice(0, holeCount);
    holes[p.seat] = c;
  }
  for (const c of [...presetBoard, ...Object.values(holes).flat()]) {
    if (used.has(c)) throw new Error(`Duplicate card in preset: ${c}`);
    used.add(c);
  }
  let deck = shuffle(fullDeck().filter((c) => !used.has(c)), rand);
  for (const p of players) while (holes[p.seat].length < holeCount) holes[p.seat].push(deck.shift()!);
  // Board order: preset cards first, then random cards reserved at the top of the deck.
  const boardRest = deck.splice(0, 5 - presetBoard.length);
  deck = [...presetBoard, ...boardRest, ...deck];

  // Dealer button
  const presetDealer = preset.dealer_seat && s.seats[preset.dealer_seat]?.in_hand ? preset.dealer_seat : null;
  s.dealer_seat = presetDealer ?? nextSeat(s, s.dealer_seat ?? 0, (p) => p.in_hand);
  const heads = players.length === 2;
  s.sb_seat = heads ? s.dealer_seat : nextSeat(s, s.dealer_seat!, (p) => p.in_hand);
  s.bb_seat = nextSeat(s, s.sb_seat!, (p) => p.in_hand);

  Object.assign(s, {
    status: 'in_hand', hand_number: s.hand_number + 1, street: 'preflop', board: [], pot_total: 0,
    current_bet: 0, min_raise: cfg.big_blind, results: null, shown: {}, last_action: null, preset: null, seq: 0, recent_actions: [],
  });
  const actions: LoggedAction[] = [];
  if (cfg.ante > 0) {
    for (const p of players) {
      const a = put(s, p, cfg.ante);
      p.bet = 0; // antes are dead money, not part of the street bet
      log(s, actions, p.seat, 'post_blind', a);
    }
  }
  const sb = s.seats[s.sb_seat!], bb = s.seats[s.bb_seat!];
  log(s, actions, sb.seat, 'post_blind', put(s, sb, cfg.small_blind));
  log(s, actions, bb.seat, 'post_blind', put(s, bb, cfg.big_blind));
  s.current_bet = Math.max(sb.bet, bb.bet, cfg.big_blind);
  s.to_act = nextSeat(s, s.bb_seat!, canAct);
  const st = settle(s, cfg, deck, holes, actions);
  return { state: st, holes, deck, actions };
};

export interface Legal { canFold: boolean; canCheck: boolean; toCall: number; canBetOrRaise: boolean; minTo: number; maxTo: number }

const potLimitMax = (s: TableState, p: SeatState) => {
  const toCall = s.current_bet - p.bet;
  return r2(s.current_bet + (s.pot_total + toCall));
};

export const legalActions = (s: TableState, seat: number, cfg: Config): Legal => {
  const p = s.seats[seat];
  const toCall = r2(Math.max(0, s.current_bet - p.bet));
  const allInTo = r2(p.bet + p.stack);
  let maxTo = allInTo;
  if (cfg.game_type === 'PLO') maxTo = Math.min(maxTo, potLimitMax(s, p));
  const minTo = r2(Math.min(allInTo, s.current_bet === 0 ? cfg.big_blind : s.current_bet + s.min_raise));
  // Raising is only allowed if the player hasn't acted since the last full raise, and has chips beyond a call.
  const canBetOrRaise = !p.acted && p.stack > toCall;
  return { canFold: true, canCheck: toCall === 0, toCall: Math.min(toCall, p.stack), canBetOrRaise, minTo, maxTo: Math.max(minTo, maxTo) };
};

export interface ActResult { state: TableState; actions: LoggedAction[]; handEnded: boolean }

/** Apply an action. `amount` for bet/raise is the TOTAL street bet ("raise to"). Throws on illegal action. */
export const applyAction = (prev: TableState, seat: number, type: ActionType, amount: number, cfg: Config, deck: string[], holes: Record<string, string[]>): ActResult => {
  const s: TableState = structuredClone(prev);
  if (s.status !== 'in_hand') throw new Error('No hand in progress');
  if (s.paused) throw new Error('Table is paused');
  if (s.to_act !== seat) throw new Error('Not your turn');
  const p = s.seats[seat];
  const L = legalActions(s, seat, cfg);
  const actions: LoggedAction[] = [];

  if (type === 'all-in') {
    const to = r2(p.bet + p.stack);
    if (cfg.game_type === 'PLO' && to > L.maxTo) { type = s.current_bet === 0 ? 'bet' : 'raise'; amount = L.maxTo; }
    else if (to <= s.current_bet) { type = 'call'; }
    else { if (!L.canBetOrRaise) throw new Error('Raising is not allowed'); type = s.current_bet === 0 ? 'bet' : 'raise'; amount = to; }
  }

  switch (type) {
    case 'fold':
      p.folded = true; p.acted = true;
      log(s, actions, seat, 'fold', 0);
      break;
    case 'check':
      if (!L.canCheck) throw new Error('Cannot check');
      p.acted = true;
      log(s, actions, seat, 'check', 0);
      break;
    case 'call': {
      if (L.toCall <= 0) throw new Error('Nothing to call');
      const a = put(s, p, L.toCall);
      p.acted = true;
      log(s, actions, seat, p.all_in ? 'all-in' : 'call', a);
      break;
    }
    case 'bet':
    case 'raise': {
      if (type === 'bet' && s.current_bet > 0) throw new Error('Cannot bet, use raise');
      if (type === 'raise' && s.current_bet === 0) throw new Error('Cannot raise, use bet');
      if (!L.canBetOrRaise) throw new Error('Raising is not allowed');
      const to = r2(amount);
      const allInTo = r2(p.bet + p.stack);
      if (!(to > s.current_bet)) throw new Error('Amount too small');
      if (to > L.maxTo) throw new Error('Amount too large');
      if (to < L.minTo && to !== allInTo) throw new Error(`Minimum is ${L.minTo}`);
      const raiseSize = r2(to - s.current_bet);
      const full = raiseSize >= s.min_raise;
      put(s, p, to - p.bet);
      if (full) {
        s.min_raise = raiseSize;
        for (const o of seatList(s)) if (o.seat !== seat && canAct(o)) o.acted = false;
      }
      s.current_bet = to;
      p.acted = true;
      log(s, actions, seat, p.all_in ? 'all-in' : type, p.bet);
      break;
    }
    default:
      throw new Error('Unknown action');
  }
  s.last_action = { seat, action: actions[0].action, amount: actions[0].amount };
  s.to_act = nextSeat(s, seat, (o) => canAct(o) && (!o.acted || o.bet < s.current_bet));
  const st = settle(s, cfg, deck, holes, actions);
  return { state: st, actions, handEnded: st.status === 'hand_over' };
};

const roundComplete = (s: TableState) => {
  const actors = seatList(s).filter(canAct);
  if (actors.length === 0) return true;
  // A lone player who has matched the bet has nobody left to act against.
  if (actors.length === 1) return actors[0].bet >= s.current_bet;
  return actors.every((p) => p.acted && p.bet === s.current_bet);
};

/** After an action: end hand on folds, advance streets, run out all-ins, showdown. */
const settle = (s: TableState, cfg: Config, deck: string[], holes: Record<string, string[]>, actions: LoggedAction[]): TableState => {
  if (live(s).length === 1) return finish(s, cfg, holes, actions, false);
  while (roundComplete(s)) {
    if (s.street === 'river') return finish(s, cfg, holes, actions, true);
    for (const p of seatList(s)) { p.bet = 0; p.acted = false; }
    s.current_bet = 0; s.min_raise = cfg.big_blind;
    const n = s.street === 'preflop' ? 3 : 1;
    s.street = s.street === 'preflop' ? 'flop' : s.street === 'flop' ? 'turn' : 'river';
    s.board.push(...deck.splice(0, n));
    if (seatList(s).filter(canAct).length <= 1) { s.to_act = null; continue; }
    s.to_act = nextSeat(s, s.dealer_seat!, canAct);
    break;
  }
  if (s.status === 'in_hand' && s.to_act == null && !roundComplete(s)) {
    s.to_act = nextSeat(s, s.dealer_seat!, (o) => canAct(o) && (!o.acted || o.bet < s.current_bet));
  }
  return s;
};

export const bestHand = (hole: string[], board: string[], game: 'NLH' | 'PLO') => {
  if (game !== 'PLO') return Hand.solve([...hole, ...board]);
  let best: any = null;
  for (let i = 0; i < hole.length; i++) for (let j = i + 1; j < hole.length; j++)
    for (let a = 0; a < board.length; a++) for (let b = a + 1; b < board.length; b++) for (let c = b + 1; c < board.length; c++) {
      const h = Hand.solve([hole[i], hole[j], board[a], board[b], board[c]]);
      if (!best) { best = h; continue; }
      const w = Hand.winners([best, h]);
      if (w.length === 1 && w[0] === h) best = h;
    }
  return best;
};

/** Build main/side pots from total contributions. */
export const buildPots = (s: TableState) => {
  const all = seatList(s).filter((p) => p.committed > 0);
  const contenders = live(s);
  const levels = [...new Set(contenders.map((p) => p.committed))].sort((a, b) => a - b);
  const pots: { amount: number; eligible: number[] }[] = [];
  let prev = 0;
  levels.forEach((lvl, i) => {
    const top = i === levels.length - 1 ? Infinity : lvl;
    const amount = r2(all.reduce((sum, p) => sum + Math.max(0, Math.min(p.committed, top) - prev), 0));
    const eligible = contenders.filter((p) => p.committed >= lvl).map((p) => p.seat);
    if (amount > 0) pots.push({ amount, eligible });
    prev = lvl;
  });
  return pots;
};

const finish = (s: TableState, cfg: Config, holes: Record<string, string[]>, actions: LoggedAction[], showdown: boolean): TableState => {
  const won: Record<number, number> = {};
  const desc: Record<number, string> = {};
  if (!showdown) {
    const w = live(s)[0];
    won[w.seat] = s.pot_total;
    desc[w.seat] = 'Uncontested';
  } else {
    s.street = 'showdown';
    const solved: Record<number, any> = {};
    for (const p of live(s)) {
      solved[p.seat] = bestHand(holes[p.seat], s.board, cfg.game_type);
      desc[p.seat] = solved[p.seat].descr;
      s.shown[p.seat] = holes[p.seat];
      log(s, actions, p.seat, 'show', 0, { revealed_cards: holes[p.seat].join('') });
    }
    for (const pot of buildPots(s)) {
      const hands = pot.eligible.map((seat) => solved[seat]);
      const winners = Hand.winners(hands) as any[];
      const seats = pot.eligible.filter((seat) => winners.includes(solved[seat]));
      // Odd chip goes to the first winner left of the dealer
      const ordered = [...seats].sort((a, b) => ((a - s.dealer_seat! + 100) % 100) - ((b - s.dealer_seat! + 100) % 100));
      const share = Math.floor((pot.amount / seats.length) * 100) / 100;
      let rest = r2(pot.amount - share * seats.length);
      for (const seat of ordered) {
        won[seat] = r2((won[seat] || 0) + share + rest);
        rest = 0;
      }
    }
  }
  for (const [seat, amt] of Object.entries(won)) s.seats[seat].stack = r2(s.seats[seat].stack + amt);
  s.results = Object.entries(won).map(([seat, amount]) => ({ seat: Number(seat), amount, desc: desc[Number(seat)] || '' }));
  s.status = 'hand_over';
  s.to_act = null;
  s.deadline = null;
  return s;
};

/** Grace period before a disconnected player is folded when the action timer is off. */
export const DISCONNECT_GRACE_MS = 30_000;

/** Is the player to act overdue? Only ever for human seats; bots are driven by runAuto. */
export function dueTimeout(s: TableState, now = Date.now()): { seat: number; sitOut: boolean } | null {
  if (s.status !== 'in_hand' || s.paused || s.to_act == null) return null;
  const p = s.seats[s.to_act];
  if (!p || !isHuman(p)) return null;
  if (p.sitting_out) return { seat: p.seat, sitOut: true };
  const connected = isConnected(p, now);
  if (s.settings.timer > 0) {
    if (s.deadline && now >= s.deadline - 500) return { seat: p.seat, sitOut: !connected };
    return null;
  }
  if (connected) return null;
  const since = Math.max(s.turn_started || 0, p.last_seen || 0);
  return now - since >= DISCONNECT_GRACE_MS ? { seat: p.seat, sitOut: true } : null;
}

