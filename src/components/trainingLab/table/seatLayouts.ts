export interface Pt { x: number; y: number } // percent of the table stage

/**
 * Hand-tuned seat spots for 2–9 players. Index 0 is always the viewer (hero, bottom-left);
 * the rest run clockwise: up the left rail, across the top, down the right rail.
 * Right-side seats stay above ~52% so they never meet the raise buttons.
 */
const RAW: Record<number, [number, number][]> = {
  2: [[22, 75], [50, 11]],
  3: [[22, 75], [16, 30], [84, 30]],
  4: [[22, 75], [12, 42], [50, 11], [88, 42]],
  5: [[22, 75], [12, 47], [30, 12], [70, 12], [88, 44]],
  6: [[22, 75], [11, 51], [17, 23], [50, 10], [83, 23], [89, 48]],
  7: [[22, 75], [11, 54], [12, 31], [34, 10], [66, 10], [88, 28], [89, 50]],
  8: [[22, 75], [11, 56], [11, 36], [26, 13], [50, 9], [74, 13], [89, 31], [89, 50]],
  9: [[22, 75], [11, 58], [11, 40], [17, 21], [38, 9], [62, 9], [83, 21], [89, 36], [89, 52]],
};

export const CENTER: Pt = { x: 50, y: 44 };

/** Seat number → stage position, with `anchor` (my seat, or seat 1 for watchers) at the hero spot. */
export const seatPositions = (total: number, anchor: number): Record<number, Pt> => {
  const n = Math.min(9, Math.max(2, total));
  const spots = RAW[n];
  const out: Record<number, Pt> = {};
  for (let seat = 1; seat <= n; seat++) {
    const [x, y] = spots[(seat - anchor + n) % n];
    out[seat] = { x, y };
  }
  return out;
};

/** Bet chips sit between a seat and the centre. */
export const betSpot = (p: Pt): Pt => {
  if (p.y > 70) return { x: p.x + 14, y: p.y - 12 }; // hero: up and to the right of the cards
  const f = 0.42;
  return { x: p.x + (CENTER.x - p.x) * f, y: p.y + (CENTER.y - p.y) * f + 4 };
};
