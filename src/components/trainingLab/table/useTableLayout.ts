import { useEffect, useState } from 'react';

export interface Pt { x: number; y: number } // percentages of the table box

/** Portrait phones get a tall oval, everything else a wide one. */
export const usePortrait = () => {
  const get = () => typeof window !== 'undefined' && window.innerHeight > window.innerWidth;
  const [p, setP] = useState(get);
  useEffect(() => {
    const on = () => setP(get());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return p;
};

/** Felt inset (percent of box) and seat ellipse radii, tuned so seats sit outside the rail. */
export const geometry = (portrait: boolean) => portrait
  ? { feltX: 22, feltY: 16, rx: 39.5, ry: 43 }
  : { feltX: 19, feltY: 22, rx: 43.5, ry: 41 };

/** Seat positions on an ellipse outside the felt; `anchor` (my seat) sits bottom-centre. */
export const seatPositions = (total: number, anchor: number, portrait: boolean): Record<number, Pt> => {
  const g = geometry(portrait);
  const out: Record<number, Pt> = {};
  for (let seat = 1; seat <= total; seat++) {
    const idx = (seat - anchor + total) % total;
    const a = Math.PI / 2 + (idx / total) * 2 * Math.PI;
    out[seat] = { x: 50 + g.rx * Math.cos(a), y: 50 + g.ry * Math.sin(a) };
  }
  return out;
};

/** Point between a seat and the centre (bets sit ~55% of the way out). */
export const toward = (p: Pt, f = 0.55): Pt => ({ x: 50 + (p.x - 50) * f, y: 50 + (p.y - 50) * f });
