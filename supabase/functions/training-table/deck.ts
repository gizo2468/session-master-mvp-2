export const RANKS = '23456789TJQKA';
export const SUITS = 'shdc';

export const fullDeck = (): string[] => {
  const d: string[] = [];
  for (const r of RANKS) for (const s of SUITS) d.push(r + s);
  return d;
};

export const parseCards = (s?: string | null): string[] => {
  if (!s) return [];
  const m = s.replace(/\s|,/g, '').match(/[2-9TJQKA][shdc]/gi) || [];
  return m.map((c) => c[0].toUpperCase() + c[1].toLowerCase());
};

/** Crypto-secure random int in [0, n) using rejection sampling. */
export const secureInt = (n: number): number => {
  const max = Math.floor(0x100000000 / n) * n;
  const buf = new Uint32Array(1);
  while (true) {
    crypto.getRandomValues(buf);
    if (buf[0] < max) return buf[0] % n;
  }
};

export const shuffle = (cards: string[], rand: (n: number) => number = secureInt): string[] => {
  const a = [...cards];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
