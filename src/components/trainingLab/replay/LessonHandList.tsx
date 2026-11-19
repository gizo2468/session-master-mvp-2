import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/Lucide';
import { useToast } from '@/hooks/use-toast';
import { tl } from '@/hooks/useTrainingLessons';
import { useAuth } from '@/context/AuthContext';
import PlayingCard from '../table/PlayingCard';
import { useTL } from '../i18n';
import { handSeats, type LessonReview } from '@/hooks/useLessonReview';
import { r2, splitCards, type RAction, type RHand, type RNote } from './types';

interface Props {
  review: LessonReview; studentId?: string; isCoach: boolean; keyHands?: string[];
  onToggleStar?: (handId: string) => void; onReplay: (handId: string) => void; onChanged: () => void;
}

const fmt = (n: number) => `${n > 0 ? '+' : ''}${r2(n)} BB`;

/** A student's hands from one lesson (or every hand, for the coach), with notes, flags and replies. */
export default function LessonHandList({ review, studentId, isCoach, keyHands = [], onToggleStar, onReplay, onChanged }: Props) {
  const { t } = useTL();
  const bb = Number(review.lesson.big_blind) || 1;
  const list = review.hands.filter((h) => !studentId || review.actions.some((a) => a.hand_id === h.id && a.player_id === studentId));
  const sorted = [...list].sort((a, b) => Number(keyHands.includes(b.id)) - Number(keyHands.includes(a.id)) || a.hand_number - b.hand_number);
  if (!sorted.length) return <p className="py-4 text-center text-sm text-muted-foreground">{t('no_hands_student')}</p>;
  return (
    <div className="space-y-3">
      {sorted.map((h) => <HandRow key={h.id} hand={h} {...{ review, studentId, isCoach, bb, onReplay, onChanged }} starred={keyHands.includes(h.id)} onToggleStar={onToggleStar} />)}
    </div>
  );
}

function HandRow({ hand, review, studentId, isCoach, bb, starred, onToggleStar, onReplay, onChanged }:
  { hand: RHand; review: LessonReview; studentId?: string; isCoach: boolean; bb: number; starred: boolean; onToggleStar?: (id: string) => void; onReplay: (id: string) => void; onChanged: () => void }) {
  const { t } = useTL();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null); // action id or 'hand'
  const acts = review.actions.filter((a) => a.hand_id === hand.id).sort((a, b) => a.sequence - b.sequence);
  const seats = handSeats(review, hand.id);
  const name = (seat: number) => seats.find((s) => s.seat === seat)?.name || `Seat ${seat}`;
  const mySeat = studentId ? acts.find((a) => a.player_id === studentId)?.seat_number : undefined;
  const myCards = mySeat ? review.holes[hand.id]?.[mySeat] || splitCards(acts.find((a) => a.seat_number === mySeat && a.action === 'show')?.revealed_cards) : [];
  let pot = 0; const putBy: Record<number, number> = {};
  for (const a of acts) { const p = a.pot_after ?? pot; putBy[a.seat_number] = r2((putBy[a.seat_number] || 0) + Math.max(0, p - pot)); pot = p; }
  const won = mySeat ? (hand.winners || []).filter((w) => w.seat === mySeat).reduce((s, w) => s + w.amount, 0) : 0;
  const result = mySeat ? (won - (putBy[mySeat] || 0)) / bb : null;
  const notes = review.notes.filter((n) => n.hand_id === hand.id && (!studentId || !n.student_id || n.student_id === studentId));
  const flagged = notes.some((n) => n.flag);

  return (
    <div className={`rounded-xl border p-3 ${starred ? 'border-poker-gold bg-poker-gold/5' : 'border-border'}`}>
      <div className="flex items-center gap-2">
        {isCoach && onToggleStar ? (
          <button type="button" aria-label={t('star')} onClick={() => onToggleStar(hand.id)} className="flex h-11 w-11 items-center justify-center bg-transparent">
            <Icon name="Star" size={20} className={starred ? 'fill-poker-gold text-poker-gold' : 'text-muted-foreground'} />
          </button>
        ) : starred ? <Icon name="Star" size={18} className="fill-poker-gold text-poker-gold" /> : null}
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{t('hand')} #{hand.hand_number}{notes.length ? <span className="ml-2 text-xs text-poker-gold">· {notes.length} {t('notes').toLowerCase()}</span> : null}{flagged ? <Icon name="Flag" size={12} className="ml-1 inline text-poker-gold" /> : null}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="flex gap-0.5">{myCards.map((c) => <PlayingCard key={c} card={c} size="sm" />)}</span>
            <span className="flex gap-0.5 opacity-80">{splitCards(hand.board_cards).map((c) => <PlayingCard key={c} card={c} size="sm" />)}</span>
          </div>
        </div>
        {result !== null && <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-bold ${result >= 0 ? 'bg-emerald-600 text-white' : 'bg-destructive text-destructive-foreground'}`}>{fmt(result)}</span>}
      </div>
      <div className="mt-2 flex gap-2">
        <Button size="sm" className="min-h-[44px] flex-1" onClick={() => onReplay(hand.id)}><Icon name="Play" size={16} />{t('replay')}</Button>
        <Button size="sm" variant="outline" className="min-h-[44px] flex-1" onClick={() => setOpen((o) => !o)}>
          <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={16} />{isCoach ? t('actions') : t('notes')}
        </Button>
      </div>
      {open && (
        <div className="mt-3 space-y-2">
          {isCoach && acts.filter((a) => a.action !== 'show').map((a) => {
            const actNotes = notes.filter((n) => n.action_id === a.id);
            const mine = a.player_id && a.player_id === studentId;
            return (
              <div key={a.id}>
                <button type="button" onClick={() => setEditing(editing === a.id ? null : a.id)}
                  className={`flex min-h-[40px] w-full items-center gap-2 rounded-md px-2 text-start text-sm ${mine ? 'bg-muted font-semibold' : ''}`}>
                  <span className="w-14 shrink-0 text-[10px] uppercase text-muted-foreground">{t(`street_${a.street}` as any)}</span>
                  <span className="min-w-0 flex-1 truncate">{name(a.seat_number)} {t(`log_${a.action}` as any)}{a.amount ? ` ${r2(a.amount / bb)}BB` : ''}</span>
                  {actNotes.map((n) => <FlagDot key={n.id} n={n} />)}
                  <Icon name="MessageSquarePlus" size={14} className="text-muted-foreground" />
                </button>
                {editing === a.id && <NoteEditor lessonId={hand.lesson_id || review.lesson.id} handId={hand.id} actionId={a.id} studentId={studentId} existing={actNotes} onDone={() => { setEditing(null); onChanged(); }} />}
              </div>
            );
          })}
          {isCoach && (
            editing === 'hand'
              ? <NoteEditor lessonId={review.lesson.id} handId={hand.id} actionId={null} studentId={studentId} existing={notes.filter((n) => !n.action_id)} onDone={() => { setEditing(null); onChanged(); }} />
              : <Button variant="ghost" size="sm" className="min-h-[44px] w-full" onClick={() => setEditing('hand')}><Icon name="StickyNote" size={16} />{t('add_note')}</Button>
          )}
          {notes.filter((n) => n.note).map((n) => <NoteThread key={n.id} note={n} review={review} acts={acts} name={name} onChanged={onChanged} />)}
        </div>
      )}
    </div>
  );
}

const FlagDot = ({ n }: { n: RNote }) => n.flag
  ? <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${n.flag === 'mistake' ? 'bg-destructive' : 'bg-emerald-500'}`} />
  : <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-poker-gold" />;

function NoteEditor({ lessonId, handId, actionId, studentId, existing, onDone }:
  { lessonId: string; handId: string; actionId: string | null; studentId?: string; existing: RNote[]; onDone: () => void }) {
  const { t } = useTL();
  const { user } = useAuth();
  const { toast } = useToast();
  const cur = existing.find((n) => !studentId || n.student_id === studentId) || existing[0];
  const [text, setText] = useState(cur?.note || '');
  const [flag, setFlag] = useState<RNote['flag']>(cur?.flag ?? null);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!text.trim() && !flag) return;
    setBusy(true);
    const row = { note: text.trim(), flag, student_id: studentId ?? null, hand_id: handId, action_id: actionId };
    const { error } = cur
      ? await tl.from('training_notes').update(row).eq('id', cur.id)
      : await tl.from('training_notes').insert({ ...row, lesson_id: lessonId, coach_id: user?.id });
    setBusy(false);
    if (error) return toast({ title: t('save_failed'), variant: 'destructive' });
    onDone();
  };
  const remove = async () => { if (!cur) return; setBusy(true); await tl.from('training_notes').delete().eq('id', cur.id); setBusy(false); onDone(); };
  return (
    <div className="mt-1 space-y-2 rounded-lg border border-poker-gold/40 p-2">
      <div className="flex gap-1">
        {([null, 'mistake', 'good_play'] as const).map((f) => (
          <button key={f || 'none'} type="button" onClick={() => setFlag(f)}
            className={`min-h-[40px] flex-1 rounded-md text-xs font-bold ${flag === f ? (f === 'mistake' ? 'bg-destructive text-destructive-foreground' : f === 'good_play' ? 'bg-emerald-600 text-white' : 'bg-primary text-primary-foreground') : 'bg-muted'}`}>
            {f ? t(f) : t('no_flag')}
          </button>
        ))}
      </div>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t('note')} maxLength={2000} data-form-type="other" autoComplete="off" />
      <div className="flex gap-2">
        {cur && <Button variant="outline" className="min-h-[44px]" disabled={busy} onClick={remove}><Icon name="Trash2" size={16} /></Button>}
        <Button className="min-h-[44px] flex-1" disabled={busy || (!text.trim() && !flag)} onClick={save}>{t('save')}</Button>
      </div>
    </div>
  );
}

function NoteThread({ note, review, acts, name, onChanged }: { note: RNote; review: LessonReview; acts: RAction[]; name: (s: number) => string; onChanged: () => void }) {
  const { t } = useTL();
  const { user } = useAuth();
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const replies = review.replies.filter((r) => r.note_id === note.id);
  const act = acts.find((a) => a.id === note.action_id);
  const isCoach = user?.id === review.lesson.coach_id;
  const canReply = isCoach ? !!note.student_id : note.student_id === user?.id;
  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    const { error } = await tl.from('training_note_replies').insert({ note_id: note.id, lesson_id: review.lesson.id, author_id: user?.id, body: text.trim() });
    setBusy(false);
    if (error) return toast({ title: t('save_failed'), variant: 'destructive' });
    setText(''); onChanged();
  };
  return (
    <div className={`rounded-lg border-l-4 bg-muted/40 p-2 ${note.flag === 'mistake' ? 'border-destructive' : note.flag === 'good_play' ? 'border-emerald-500' : 'border-poker-gold'}`}>
      <p className="text-[11px] font-bold uppercase text-poker-gold">
        {t('coach_note')}{act ? ` · ${t(`street_${act.street}` as any)} · ${name(act.seat_number)} ${t(`log_${act.action}` as any)}` : ''}
        {note.flag ? ` · ${t(note.flag)}` : ''}
      </p>
      <p className="whitespace-pre-wrap text-sm">{note.note}</p>
      {replies.map((r) => (
        <p key={r.id} className={`mt-1 rounded-md px-2 py-1 text-sm ${r.author_id === review.lesson.coach_id ? 'bg-poker-gold/10' : 'bg-background'}`}>
          <span className="text-xs font-semibold text-muted-foreground">{r.author_id === review.lesson.coach_id ? t('coach') : review.names[r.author_id] || t('student')}: </span>{r.body}
        </p>
      ))}
      {canReply && (
        <div className="mt-2 flex gap-2">
          <Textarea rows={1} value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} data-form-type="other" autoComplete="off"
            placeholder={isCoach ? t('reply_placeholder') : t('ask_question')} className="min-h-[44px]" />
          <Button className="min-h-[44px]" disabled={busy || !text.trim()} onClick={send} aria-label={t('reply')}><Icon name="Send" size={16} /></Button>
        </div>
      )}
    </div>
  );
}
