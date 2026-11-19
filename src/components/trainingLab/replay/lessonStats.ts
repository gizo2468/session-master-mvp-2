import { r2, type RAction, type RHand } from './types';

export interface StudentStats {
  hands: number; vpip: number; pfr: number; three_bet: number; net_bb: number;
  biggest_won_bb: number; biggest_lost_bb: number;
}
const VOLUNTARY = new Set(['call', 'bet', 'raise', 'all-in']);

/** Per-student lesson stats, worked out from the saved actions of every hand the player was dealt into. */
export function computeStats(playerId: string, hands: RHand[], actions: RAction[], bigBlind: number): StudentStats {
  let dealt = 0, vpip = 0, pfr = 0, threeOpp = 0, threeMade = 0, net = 0, bigWon = 0, bigLost = 0;
  for (const h of hands) {
    const acts = actions.filter((a) => a.hand_id === h.id).sort((a, b) => a.sequence - b.sequence);
    const mine = acts.filter((a) => a.player_id === playerId);
    if (!mine.length) continue;
    const seat = mine[0].seat_number;
    dealt += 1;
    let pot = 0, invested = 0, currentBet = 0, raises = 0, didVpip = false, didPfr = false, faced3 = false, made3 = false;
    const bets: Record<number, number> = {};
    let street = 'preflop';
    for (const a of acts) {
      if (a.street !== street) { street = a.street; for (const k in bets) bets[k] = 0; currentBet = 0; }
      const p = a.pot_after ?? pot; const put = Math.max(0, r2(p - pot)); pot = p;
      if (a.action === 'show') continue;
      bets[a.seat_number] = r2((bets[a.seat_number] || 0) + put);
      const isRaise = (a.action === 'bet' || a.action === 'raise' || a.action === 'all-in') && bets[a.seat_number] > currentBet;
      if (a.seat_number === seat) {
        invested = r2(invested + put);
        if (street === 'preflop' && a.action !== 'post_blind') {
          if (VOLUNTARY.has(a.action)) didVpip = true;
          if (isRaise) didPfr = true;
          if (raises === 1) { faced3 = true; if (isRaise) made3 = true; }
        }
      }
      if (street === 'preflop' && isRaise) raises += 1;
      if (bets[a.seat_number] > currentBet) currentBet = bets[a.seat_number];
    }
    const won = (h.winners || []).filter((w) => w.seat === seat).reduce((s, w) => s + w.amount, 0);
    const res = r2(won - invested);
    net = r2(net + res);
    const potBB = r2(Number(h.pot_total) / bigBlind);
    if (res > 0) bigWon = Math.max(bigWon, potBB);
    if (res < 0) bigLost = Math.max(bigLost, potBB);
    if (didVpip) vpip += 1; if (didPfr) pfr += 1; if (faced3) threeOpp += 1; if (made3) threeMade += 1;
  }
  const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
  return {
    hands: dealt, vpip: pct(vpip, dealt), pfr: pct(pfr, dealt), three_bet: pct(threeMade, threeOpp),
    net_bb: r2(net / bigBlind), biggest_won_bb: bigWon, biggest_lost_bb: bigLost,
  };
}
