import { assert, assertEquals, assertThrows } from 'jsr:@std/assert@1';
import { applyAction, buildPots, dueAction, dueTimeout, emptyState, scheduleNext, isDealable, startHand, type Config, type TableState } from './engine.ts';

const cfg: Config = { game_type: 'NLH', small_blind: 1, big_blind: 2, ante: 0 };
const seat = (n: number, stack = 200) => ({ seat: n, type: 'student' as const, player_id: `p${n}`, name: `P${n}`, style: null, stack, bet: 0, committed: 0, folded: false, all_in: false, acted: false, in_hand: false, ready: true, last_seen: 9e15 });
const table = (stacks: number[], preset?: TableState['preset']): TableState => {
  const s = emptyState();
  stacks.forEach((st, i) => { s.seats[i + 1] = seat(i + 1, st); });
  s.preset = preset ?? null;
  return s;
};
const total = (s: TableState) => Object.values(s.seats).reduce((a, p) => a + p.stack, 0);

Deno.test('heads-up: dealer posts small blind and acts first preflop', () => {
  const { state } = startHand(table([100, 100], { dealer_seat: 1 }), cfg);
  assertEquals(state.sb_seat, 1);
  assertEquals(state.bb_seat, 2);
  assertEquals(state.to_act, 1);
});

Deno.test('presets are applied with no duplicate cards', () => {
  const { holes, deck, state } = startHand(table([100, 100, 100], { board: 'AsKsQs', seats: { 1: { cards: 'AhAd' } } }), cfg);
  assertEquals(holes[1], ['Ah', 'Ad']);
  assertEquals(deck.slice(0, 3), ['As', 'Ks', 'Qs']);
  const all = [...Object.values(holes).flat(), ...deck];
  assertEquals(new Set(all).size, all.length);
  assertEquals(all.length, 52);
  assertEquals(state.board.length, 0);
});

Deno.test('min-raise is enforced', () => {
  const d = startHand(table([200, 200, 200], { dealer_seat: 1 }), cfg);
  // dealer 1, SB 2, BB 3, UTG = 1
  assertThrows(() => applyAction(d.state, 1, 'raise', 3, cfg, d.deck, d.holes));
  const r = applyAction(d.state, 1, 'raise', 6, cfg, d.deck, d.holes);
  assertEquals(r.state.current_bet, 6);
  assertEquals(r.state.min_raise, 4);
  assertThrows(() => applyAction(r.state, 2, 'raise', 9, cfg, d.deck, d.holes));
});

Deno.test('short all-in does not reopen betting for a player who already acted', () => {
  // dealer 1, SB 2 (stack 7), BB 3. UTG(1) raises to 6, SB shoves to 7 (short), BB calls, UTG may only call/fold.
  const d = startHand(table([200, 7, 200], { dealer_seat: 1 }), cfg);
  let s = applyAction(d.state, 1, 'raise', 6, cfg, d.deck, d.holes).state;
  s = applyAction(s, 2, 'all-in', 0, cfg, d.deck, d.holes).state;
  s = applyAction(s, 3, 'call', 0, cfg, d.deck, d.holes).state;
  assertEquals(s.to_act, 1);
  assertThrows(() => applyAction(s, 1, 'raise', 20, cfg, d.deck, d.holes));
  s = applyAction(s, 1, 'call', 0, cfg, d.deck, d.holes).state;
  assertEquals(s.street, 'flop');
});

Deno.test('three all-ins create side pots and chips are conserved', () => {
  const start = table([50, 100, 200, 200], { dealer_seat: 4 });
  const d = startHand(start, cfg);
  // dealer 4, SB 1, BB 2, UTG 3
  let s = applyAction(d.state, 3, 'all-in', 0, cfg, d.deck, d.holes).state;
  s = applyAction(s, 4, 'fold', 0, cfg, d.deck, d.holes).state;
  s = applyAction(s, 1, 'all-in', 0, cfg, d.deck, d.holes).state;
  s = applyAction(s, 2, 'all-in', 0, cfg, d.deck, d.holes).state;
  assertEquals(s.status, 'hand_over');
  assertEquals(s.board.length, 5);
  assertEquals(total(s), 550);
});

Deno.test('side pot levels', () => {
  const s = table([0, 0, 0]);
  Object.assign(s.seats[1], { committed: 50, in_hand: true });
  Object.assign(s.seats[2], { committed: 100, in_hand: true });
  Object.assign(s.seats[3], { committed: 200, in_hand: true });
  const pots = buildPots(s);
  assertEquals(pots.map((p) => p.amount), [150, 100, 100]);
  assertEquals(pots[0].eligible, [1, 2, 3]);
  assertEquals(pots[2].eligible, [3]);
});

Deno.test('split pot when both play the board', () => {
  const d = startHand(table([100, 100], { dealer_seat: 1, board: 'AsKsQsJsTs', seats: { 1: { cards: '2c3d' }, 2: { cards: '4c5d' } } }), cfg);
  let s = applyAction(d.state, 1, 'call', 0, cfg, d.deck, d.holes).state;
  s = applyAction(s, 2, 'check', 0, cfg, d.deck, d.holes).state;
  for (const st of ['flop', 'turn', 'river']) {
    assertEquals(s.street, st);
    s = applyAction(s, 2, 'check', 0, cfg, d.deck, d.holes).state;
    s = applyAction(s, 1, 'check', 0, cfg, d.deck, d.holes).state;
  }
  assertEquals(s.status, 'hand_over');
  assertEquals(s.seats[1].stack, 100);
  assertEquals(s.seats[2].stack, 100);
});

Deno.test('everyone folds to the big blind', () => {
  const d = startHand(table([100, 100, 100], { dealer_seat: 1 }), cfg);
  let s = applyAction(d.state, 1, 'fold', 0, cfg, d.deck, d.holes).state;
  s = applyAction(s, 2, 'fold', 0, cfg, d.deck, d.holes).state;
  assertEquals(s.status, 'hand_over');
  assertEquals(s.seats[3].stack, 101);
  assert(s.results?.[0].seat === 3);
});

Deno.test('acting out of turn is rejected', () => {
  const d = startHand(table([100, 100, 100], { dealer_seat: 1 }), cfg);
  assertThrows(() => applyAction(d.state, 2, 'call', 0, cfg, d.deck, d.holes), Error, 'Not your turn');
});

import { decideBot } from './bots.ts';

const botsPlay = (game: 'NLH' | 'PLO') => {
  const c: Config = { ...cfg, game_type: game, ante: 0.5 };
  let s = table([200, 200, 200, 200, 200, 200]);
  Object.values(s.seats).forEach((p, i) => { p.type = 'bot'; p.style = ['tight_passive', 'tight_aggressive', 'loose_passive', 'loose_aggressive'][i % 4]; });
  const start = total(s);
  for (let h = 0; h < 150; h++) {
    if (Object.values(s.seats).filter((p) => p.stack > 0).length < 2) break;
    const d = startHand(s, c);
    s = d.state;
    let guard = 0;
    while (s.status === 'in_hand' && guard++ < 200) {
      const seat = s.to_act!;
      const dec = decideBot(s, seat, d.holes[seat], c);
      s = applyAction(s, seat, dec.action, dec.amount, c, d.deck, d.holes).state;
    }
    assertEquals(s.status, 'hand_over');
    assertEquals(Math.round(total(s) * 100), Math.round(start * 100));
  }
};

Deno.test('bots only make legal moves and chips are conserved (NLH, 150 hands)', () => botsPlay('NLH'));
Deno.test('bots only make legal moves and chips are conserved (PLO, 150 hands)', () => botsPlay('PLO'));

Deno.test('seats not ready, sitting out or disconnected are not dealt and post no blinds', () => {
  const s = table([100, 100, 100, 100], { dealer_seat: 1 });
  s.seats[2].ready = false;               // never pressed Sit in
  s.seats[3].sitting_out = true;          // sitting out
  s.seats[4].last_seen = 1;               // disconnected long ago
  assertThrows(() => startHand(s, cfg, undefined, 1e15));
  s.seats[4].last_seen = 1e15 - 1000;     // connected again
  const { state, holes } = startHand(s, cfg, undefined, 1e15);
  assertEquals(Object.keys(holes).sort(), ['1', '4']);
  assertEquals(state.seats[2].committed + state.seats[3].committed, 0);
  assertEquals(state.seats[2].in_hand || state.seats[3].in_hand, false);
});

Deno.test('bots are always dealable; closed seats never', () => {
  const b = { ...seat(1), type: 'bot' as const, ready: false, last_seen: undefined };
  assert(isDealable(b));
  assert(!isDealable({ ...seat(2), type: 'closed' as const }));
});

Deno.test('recent actions keep the last 5 with names', () => {
  const d = startHand(table([200, 200, 200], { dealer_seat: 1 }), cfg);
  let st = d.state;
  st = applyAction(st, 1, 'call', 0, cfg, d.deck, d.holes).state;
  st = applyAction(st, 2, 'call', 0, cfg, d.deck, d.holes).state;
  st = applyAction(st, 3, 'check', 0, cfg, d.deck, d.holes).state;
  assert((st.recent_actions || []).length <= 5);
  assertEquals(st.recent_actions!.at(-1)!.name, 'P3');
});

Deno.test('timeouts: only human seats, disconnected players folded after grace, never bots', () => {
  const now = 1e15;
  const s = table([100, 100], { dealer_seat: 1 });
  s.seats[1].last_seen = now; s.seats[2].last_seen = now;
  const d = startHand(s, cfg, undefined, now);
  const st = structuredClone(d.state);
  st.turn_started = now; st.settings.timer = 0;
  assertEquals(dueTimeout(st, now + 60_000 - 1), { seat: 1, sitOut: true }); // last_seen 60s old => disconnected
  st.seats[1].last_seen = now + 50_000;
  assertEquals(dueTimeout(st, now + 60_000), null);                         // connected, no timer: never auto-acts
  st.seats[1].last_seen = now; st.turn_started = now + 50_000;
  assertEquals(dueTimeout(st, now + 60_000), null);                         // disconnected but grace not over
  assertEquals(dueTimeout(st, now + 80_001), { seat: 1, sitOut: true });
  st.seats[1].type = 'bot';
  assertEquals(dueTimeout(st, now + 80_001), null);                         // bots are never timed out
  st.seats[1].type = 'student'; st.settings.timer = 15; st.deadline = now + 100_000; st.seats[1].last_seen = now + 99_000;
  assertEquals(dueTimeout(st, now + 99_000), null);
  assertEquals(dueTimeout(st, now + 100_000), { seat: 1, sitOut: false });  // connected: normal timer check/fold
});

Deno.test('auto-deal is scheduled 3s after a hand ends and not due early', () => {
  const s = table([100, 100]); s.status = 'hand_over'; s.settings.auto_deal = true;
  scheduleNext(s, 1000);
  assertEquals(s.next_deal_at, 4000);
  assertEquals(dueAction(s, 3999), null);
  assertEquals(dueAction(s, 4000), { kind: 'deal' });
});

Deno.test('a heartbeat-style save keeps the schedule', () => {
  const s = table([100, 100]); s.status = 'hand_over'; s.settings.auto_deal = true;
  scheduleNext(s, 1000);
  s.seats[1].last_seen = 5000; scheduleNext(s, 2500);
  assertEquals(s.next_deal_at, 4000);
});

Deno.test('bot move is scheduled 0.6-1.5s ahead, only for the bot to act', () => {
  const s = table([100, 100]); s.status = 'in_hand'; s.seats[2].type = 'bot' as any; s.to_act = 2;
  scheduleNext(s, 0, () => 0.5);
  assertEquals(s.bot_act_at, 1050);
  assertEquals(dueAction(s, 1049), null);
  assertEquals(dueAction(s, 1050), { kind: 'bot', seat: 2 });
  s.to_act = 1; scheduleNext(s, 1100);
  assertEquals(s.bot_act_at, null);
  assertEquals(dueAction(s, 9999), null);
});

Deno.test('auto-deal off or paused schedules nothing', () => {
  const s = table([100, 100]); s.status = 'hand_over';
  scheduleNext(s, 0); assertEquals(s.next_deal_at, null);
  s.settings.auto_deal = true; s.paused = true; scheduleNext(s, 0);
  assertEquals(dueAction(s, 1e9), null);
});
