import { useCallback, useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import { tl } from '@/hooks/useTrainingLessons';
import PlayingCard from './PlayingCard';
import { useTL } from '../i18n';
import { useAuth } from '@/context/AuthContext';
import { useLessonReview } from '@/hooks/useLessonReview';
import HandReplayer from '../replay/HandReplayer';

/** Loads the lesson for the replayer on demand; read-only, so the live game keeps running. */
function LiveReplay({ lessonId, handId, isCoach, onClose }: { lessonId: string; handId: string; isCoach: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const { data } = useLessonReview(lessonId);
  if (!data) return null;
  return <HandReplayer review={data} handId={handId} viewerId={user?.id} isCoach={isCoach} onClose={onClose} />;
}

const POS: Record<number, string[]> = {
  2: ['BTN/SB', 'BB'], 3: ['BTN', 'SB', 'BB'], 4: ['BTN', 'SB', 'BB', 'UTG'], 5: ['BTN', 'SB', 'BB', 'UTG', 'CO'],
  6: ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO'], 7: ['BTN', 'SB', 'BB', 'UTG', 'MP', 'HJ', 'CO'],
  8: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'HJ', 'CO'], 9: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'MP', 'HJ', 'CO'],
};
const split = (c?: string | null) => (c || '').match(/../g) || [];

interface Hand { id: string; hand_number: number; dealer_seat: number | null; board_cards: string | null; pot_total: number; winners: { seat: number; amount: number; desc: string }[] | null }
interface Act { hand_id: string; seat_number: number; street: string; action: string; amount: number; sequence: number; revealed_cards: string | null }

interface Props { lessonId: string; mySeat?: number; seatNames: Record<number, string>; isCoach: boolean; refreshKey: number }

/** In-game hand history for everyone at the table. Access rules in the database limit what each person sees. */
export default function HandHistoryDrawer({ lessonId, mySeat, seatNames, isCoach, refreshKey }: Props) {
  const { t } = useTL();
  const [open, setOpen] = useState(false);
  const [hands, setHands] = useState<Hand[]>([]);
  const [acts, setActs] = useState<Act[]>([]);
  const [holes, setHoles] = useState<Record<string, Record<number, string[]>>>({});
  const [sel, setSel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [replay, setReplay] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: h } = await tl.from('training_hands').select('id, hand_number, dealer_seat, board_cards, pot_total, winners')
        .eq('lesson_id', lessonId).eq('status', 'ended').order('hand_number', { ascending: false }).limit(200);
      const list: Hand[] = h || [];
      setHands(list);
      const ids = list.map((x) => x.id);
      if (!ids.length) { setActs([]); setHoles({}); return; }
      const [{ data: a }, { data: c }] = await Promise.all([
        tl.from('training_hand_actions').select('hand_id, seat_number, street, action, amount, sequence, revealed_cards').in('hand_id', ids).order('sequence'),
        tl.from('training_hand_private_cards').select('hand_id, seat_number, hole_cards').in('hand_id', ids),
      ]);
      setActs(a || []);
      const m: Record<string, Record<number, string[]>> = {};
      for (const r of c || []) (m[r.hand_id] ||= {})[r.seat_number] = split(r.hole_cards);
      for (const r of a || []) if (r.action === 'show' && r.revealed_cards) (m[r.hand_id] ||= {})[r.seat_number] ||= split(r.revealed_cards);
      setHoles(m);
    } catch { setHands([]); } finally { setLoading(false); }
  }, [lessonId]);

  useEffect(() => { if (open) load(); }, [open, load, refreshKey]);

  const positions = (h: Hand) => {
    const seats = [...new Set(acts.filter((a) => a.hand_id === h.id).map((a) => a.seat_number))].sort((a, b) => a - b);
    const out: Record<number, string> = {};
    if (!h.dealer_seat || !seats.includes(h.dealer_seat)) return out;
    const i = seats.indexOf(h.dealer_seat);
    const order = [...seats.slice(i), ...seats.slice(0, i)];
    (POS[order.length] || []).forEach((l, k) => { out[order[k]] = l; });
    return out;
  };
  const myResult = (h: Hand) => {
    if (!mySeat) return null;
    const put = acts.filter((a) => a.hand_id === h.id && a.seat_number === mySeat && a.action !== 'show')
      .reduce((m, a) => ({ ...m, [a.street]: Math.max(m[a.street] || 0, a.amount) }), {} as Record<string, number>);
    const invested = Object.values(put).reduce((x, y) => x + y, 0);
    const won = (h.winners || []).filter((w) => w.seat === mySeat).reduce((x, w) => x + w.amount, 0);
    return Math.round((won - invested) * 100) / 100;
  };
  const selHand = hands.find((h) => h.id === sel);
  const streets = ['preflop', 'flop', 'turn', 'river', 'showdown'];

  return (
    <>
      <button type="button" aria-label={t('hand_history')} className="tl-icon-btn" onClick={() => setOpen(true)}><Icon name="History" size={20} /></button>
      <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSel(null); }}>
        <SheetContent side={'right'} className="w-[92vw] max-w-md overflow-y-auto p-4">
          <SheetHeader><SheetTitle className="text-primary">{selHand ? `${t('hand')} #${selHand.hand_number}` : t('hand_history')}</SheetTitle></SheetHeader>
          {selHand ? (
            <div className="mt-3 space-y-3">
              <div className="flex gap-2"><Button variant="ghost" className="min-h-[44px]" onClick={() => setSel(null)}><Icon name="ArrowLeft" size={16} />{t('back')}</Button>
              <Button className="min-h-[44px] flex-1" onClick={() => setReplay(selHand.id)}><Icon name="Play" size={16} />{t('replay')}</Button></div>
              <div className="flex gap-1" dir="ltr">{split(selHand.board_cards).map((c) => <PlayingCard key={c} card={c} size="sm" />)}</div>
              {streets.map((st) => {
                const list = acts.filter((a) => a.hand_id === selHand.id && a.street === st);
                if (!list.length) return null;
                const pos = positions(selHand);
                return (
                  <div key={st}>
                    <p className="text-xs font-bold uppercase text-primary">{t(`street_${st}` as any)}</p>
                    <ul className="text-sm">
                      {list.map((a) => (
                        <li key={a.sequence} className={a.seat_number === mySeat ? 'font-semibold' : ''}>
                          {seatNames[a.seat_number] || `#${a.seat_number}`}{pos[a.seat_number] ? ` (${pos[a.seat_number]})` : ''} · {t(`log_${a.action}` as any) || a.action}
                          {a.amount > 0 && a.action !== 'show' ? ` ${a.amount}` : ''}{a.revealed_cards ? ` ${split(a.revealed_cards).join(' ')}` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
              {(selHand.winners || []).map((w, i) => (
                <p key={i} className="text-sm font-semibold text-primary">{seatNames[w.seat] || `#${w.seat}`} {t('wins')} {w.amount}{w.desc ? ` · ${w.desc}` : ''}</p>
              ))}
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {!loading && !hands.length && <p className="text-sm text-muted-foreground">{t('no_hands_yet')}</p>}
              {hands.map((h) => {
                const pos = positions(h);
                const mine = mySeat ? holes[h.id]?.[mySeat] : undefined;
                const res = myResult(h);
                return (
                  <button key={h.id} onClick={() => setSel(h.id)} className="flex min-h-[56px] w-full items-center gap-2 rounded-lg border border-border bg-card p-2 text-left">
                    <span className="w-10 text-sm font-bold">#{h.hand_number}</span>
                    <span className="flex-1 space-y-1">
                      <span className="flex items-center gap-1" dir="ltr">
                        {mySeat && <span className="me-1 rounded bg-muted px-1 text-[10px] font-bold">{pos[mySeat] || '—'}</span>}
                        {(mine || []).map((c) => <PlayingCard key={c} card={c} size="xs" />)}
                        <span className="mx-1 text-muted-foreground">|</span>
                        {split(h.board_cards).map((c) => <PlayingCard key={c} card={c} size="xs" />)}
                      </span>
                      <span className="block text-xs text-muted-foreground">{t('pot')}: {h.pot_total}{isCoach && !mySeat ? ` · ${(h.winners || []).map((w) => seatNames[w.seat]).join(', ')}` : ''}</span>
                    </span>
                    {res != null && <span className={`text-sm font-bold ${res >= 0 ? 'text-primary' : 'text-destructive'}`}>{res > 0 ? '+' : ''}{res}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </SheetContent>
      </Sheet>
    {replay && <LiveReplay lessonId={lessonId} handId={replay} isCoach={isCoach} onClose={() => setReplay(null)} />}
    </>
  );
}
