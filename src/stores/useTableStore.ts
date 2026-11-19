import { create } from 'zustand';
import type { TState } from '@/hooks/useTrainingTable';

const PREFS_KEY = 'tl-table-prefs';
const loadPrefs = () => {
  try { return { muted: false, fourColor: false, showBB: true, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') }; }
  catch { return { muted: false, fourColor: false, showBB: true }; }
};

interface TableStore {
  state: TState | null;
  /** Snapshot taken before an optimistic action, restored if the server rejects it. */
  rollback: TState | null;
  muted: boolean;
  fourColor: boolean;
  /** Show amounts in big blinds (default) or chips. */
  showBB: boolean;
  setState: (s: TState | null) => void;
  setPref: (k: 'muted' | 'fourColor' | 'showBB', v: boolean) => void;
}

/** Lightweight live-table store: seats subscribe to their own slice so one move re-renders only what changed. */
export const useTableStore = create<TableStore>((set, get) => ({
  state: null,
  rollback: null,
  ...loadPrefs(),
  setState: (state) => set({ state }),
  setPref: (k, v) => {
    set({ [k]: v } as any);
    const { muted, fourColor, showBB } = get();
    try { localStorage.setItem(PREFS_KEY, JSON.stringify({ muted, fourColor, showBB })); } catch { /* private mode */ }
  },
}));

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Local projection of an action so feedback is instant; the server state replaces it moments later. */
export const projectAction = (s: TState, seat: number, action: string, amount = 0): TState => {
  const n: TState = structuredClone(s);
  const p = n.seats[seat];
  if (!p) return s;
  let put = 0;
  if (action === 'fold') p.folded = true;
  else if (action === 'call') put = Math.min(p.stack, n.current_bet - p.bet);
  else if (action === 'bet' || action === 'raise') put = Math.min(p.stack, amount - p.bet);
  else if (action === 'all-in') put = p.stack;
  put = Math.max(0, r2(put));
  p.stack = r2(p.stack - put); p.bet = r2(p.bet + put); p.acted = true;
  if (p.stack <= 0) p.all_in = true;
  n.pot_total = r2(n.pot_total + put);
  n.current_bet = Math.max(n.current_bet, p.bet);
  n.to_act = null;
  n.seq += 1;
  n.last_action = { seat, action: p.all_in ? 'all-in' : action, amount: p.bet };
  n.recent_actions = [...(n.recent_actions || []), { seat, name: p.name, action, amount: action === 'fold' || action === 'check' ? 0 : p.bet }].slice(-5);
  return n;
};

/** Format a chip amount in BB ("2.5BB") or chips, per the player's preference. */
export const fmtAmount = (chips: number, bb: number, showBB: boolean) => {
  if (!showBB || !bb) return String(Math.round(chips * 100) / 100);
  return `${+(chips / bb).toFixed(1)}BB`;
};
