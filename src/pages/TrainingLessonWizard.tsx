import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/Lucide';
import PageContainer from '@/components/ui/PageContainer';
import { useAuth } from '@/context/AuthContext';
import { useCoachStudent } from '@/context/CoachStudentContext';
import { toast } from '@/hooks/use-toast';
import { getMaxStudents, hasFeatureAccess } from '@/utils/coachTiers';
import { tl, SeatDraft, SeatType, BotStyle, CARD_RE, useInvalidateLessons } from '@/hooks/useTrainingLessons';
import { useTL } from '@/components/trainingLab/i18n';

const STYLES: BotStyle[] = ['tight_passive', 'tight_aggressive', 'loose_passive', 'loose_aggressive'];
const BOT_NAMES = ['Ace Bot', 'River Rat', 'Nit Nick', 'LAG Larry', 'Calling Carl', 'Shark Sam', 'Fish Finn', 'Tilt Tom', 'Rock Ron'];

interface Preset { dealer_seat: number | null; board: string; seats: Record<number, { cards?: string; stack?: number }> }

export default function TrainingLessonWizard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { students } = useCoachStudent();
  const { t, dir } = useTL();
  const invalidate = useInvalidateLessons();
  const tier = user?.coachTier || 'free';
  const maxStudents = getMaxStudents(tier);
  const steps = ['step_basics', 'step_game', 'step_seats', 'step_presets', 'step_review'] as const;
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>('draft');
  const [f, setF] = useState({ title: '', description: '', game_type: 'NLH', format: 'cash', max_seats: 6, small_blind: 1, big_blind: 2, ante: 0, default_stack_bb: 100 });
  const [seats, setSeats] = useState<SeatDraft[]>([]);
  const [preset, setPreset] = useState<Preset>({ dealer_seat: null, board: '', seats: {} });
  const seatsEditable = status === 'draft' || status === 'paused';

  useEffect(() => {
    if (user && !hasFeatureAccess(user.role, tier, 'Training Lab')) navigate('/coach/training-lab', { replace: true });
  }, [user, tier, navigate]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: l } = await tl.from('training_lessons').select('*').eq('id', id).maybeSingle();
      if (!l) return;
      setStatus(l.status);
      setF({ title: l.title, description: l.description || '', game_type: l.game_type, format: l.format, max_seats: l.max_seats, small_blind: +l.small_blind, big_blind: +l.big_blind, ante: +l.ante, default_stack_bb: +l.default_stack_bb });
      if (l.scenario_preset) setPreset({ dealer_seat: null, board: '', seats: {}, ...l.scenario_preset });
      const { data: p } = await tl.from('training_lesson_participants').select('*').eq('lesson_id', id).order('seat_number');
      setSeats((p || []).map((s: any) => ({ seat_number: s.seat_number, seat_type: s.seat_type, student_id: s.student_id, bot_name: s.bot_name, bot_style: s.bot_style })));
    })();
  }, [id]);

  // Keep seat list in sync with the seat count
  useEffect(() => {
    setSeats((prev) => Array.from({ length: f.max_seats }, (_, i) =>
      prev.find((s) => s.seat_number === i + 1) ||
      { seat_number: i + 1, seat_type: 'bot' as SeatType, student_id: null, bot_name: BOT_NAMES[i], bot_style: STYLES[i % 4] }));
  }, [f.max_seats]);

  const studentCount = seats.filter((s) => s.seat_type === 'student').length;
  const studentName = (uid: string | null) => students.find((s) => s.userId === uid)?.displayName || '—';
  const updateSeat = (n: number, patch: Partial<SeatDraft>) => setSeats((p) => p.map((s) => (s.seat_number === n ? { ...s, ...patch } : s)));

  const changeType = (n: number, type: SeatType) => {
    if (type === 'student' && studentCount >= maxStudents) {
      toast({ title: t('student_limit', { n: maxStudents }), variant: 'destructive' });
      return;
    }
    updateSeat(n, { seat_type: type, student_id: null, bot_name: type === 'bot' ? BOT_NAMES[n - 1] : null, bot_style: type === 'bot' ? STYLES[(n - 1) % 4] : null });
  };

  const presetValid = useMemo(() => {
    if (preset.board && !CARD_RE.test(preset.board)) return false;
    return Object.values(preset.seats).every((s) => !s.cards || CARD_RE.test(s.cards));
  }, [preset]);

  const canNext = () => {
    if (step === 0) return f.title.trim().length > 0;
    if (step === 2) return seats.every((s) => s.seat_type !== 'student' || s.student_id);
    if (step === 3) return presetValid;
    return true;
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const hasPreset = preset.board || preset.dealer_seat || Object.keys(preset.seats).length;
      const row = { ...f, title: f.title.trim(), coach_id: user.id, scenario_preset: hasPreset ? preset : null };
      let lessonId = id;
      if (id) {
        const { error } = await tl.from('training_lessons').update(row).eq('id', id);
        if (error) throw error;
      } else {
        const { data, error } = await tl.from('training_lessons').insert(row).select('id').single();
        if (error) throw error;
        lessonId = data.id;
      }
      if (seatsEditable) {
        await tl.from('training_lesson_participants').delete().eq('lesson_id', lessonId);
        const stack = f.default_stack_bb * f.big_blind;
        const rows = seats.map((s) => ({ ...s, lesson_id: lessonId, starting_stack: stack, current_stack: stack }));
        const { error } = await tl.from('training_lesson_participants').insert(rows);
        if (error) throw error;
      }
      invalidate();
      navigate('/coach/training-lab', { replace: true });
    } catch (e: any) {
      toast({ title: e?.message || 'Error', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const num = (k: keyof typeof f, v: string) => setF({ ...f, [k]: v === '' ? 0 : Number(v) });

  return (
    <PageContainer>
      <div dir={dir} className="mx-auto max-w-2xl p-4 content-safe">
        <div className="mb-4 flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => navigate('/coach/training-lab', { replace: true })}>
            <Icon name={dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft'} size={20} />
          </Button>
          <h1 className="text-xl font-bold text-poker-gold">{id ? t('edit_lesson') : t('create_lesson')}</h1>
        </div>

        <div className="mb-4 flex gap-1">
          {steps.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-poker-gold' : 'bg-muted'}`} />
          ))}
        </div>
        <p className="mb-3 text-sm font-medium text-muted-foreground">{step + 1}/5 · {t(steps[step])}</p>

        <Card><CardContent className="space-y-4 p-4" data-form-type="other">
          {step === 0 && (<>
            <div><Label>{t('title')}</Label><Input autoComplete="off" value={f.title} maxLength={100} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
            <div><Label>{t('goal')}</Label><Textarea autoComplete="off" value={f.description} maxLength={1000} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
          </>)}

          {step === 1 && (<div className="grid grid-cols-2 gap-3">
            <div><Label>{t('game_type')}</Label>
              <Select value={f.game_type} onValueChange={(v) => setF({ ...f, game_type: v })}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="NLH">NLH</SelectItem><SelectItem value="PLO">PLO</SelectItem></SelectContent></Select></div>
            <div><Label>{t('format')}</Label>
              <Select value={f.format} onValueChange={(v) => setF({ ...f, format: v })}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="cash">{t('cash')}</SelectItem><SelectItem value="tournament">{t('tournament')}</SelectItem></SelectContent></Select></div>
            <div><Label>{t('seats')}</Label>
              <Select value={String(f.max_seats)} disabled={!seatsEditable} onValueChange={(v) => setF({ ...f, max_seats: Number(v) })}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{[2, 3, 4, 5, 6, 7, 8, 9].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>{t('stack_bb')}</Label><Input type="number" min={1} value={f.default_stack_bb} onChange={(e) => num('default_stack_bb', e.target.value)} /></div>
            <div><Label>{t('small_blind')}</Label><Input type="number" min={0} step="0.5" value={f.small_blind} onChange={(e) => num('small_blind', e.target.value)} /></div>
            <div><Label>{t('big_blind')}</Label><Input type="number" min={0} step="0.5" value={f.big_blind} onChange={(e) => num('big_blind', e.target.value)} /></div>
            <div><Label>{t('ante')}</Label><Input type="number" min={0} step="0.5" value={f.ante} onChange={(e) => num('ante', e.target.value)} /></div>
          </div>)}

          {step === 2 && (<>
            <p className="text-xs text-muted-foreground">{t('student_limit', { n: maxStudents })} ({studentCount}/{maxStudents})</p>
            {!seatsEditable && <p className="text-sm text-destructive">{t('seats_locked')}</p>}
            {students.length === 0 && <p className="text-sm text-muted-foreground">{t('no_students')}</p>}
            {seats.map((s) => (
              <div key={s.seat_number} className="space-y-2 rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#35654D] text-sm font-bold text-poker-gold" dir="ltr">{s.seat_number}</span>
                  <Select value={s.seat_type} disabled={!seatsEditable} onValueChange={(v) => changeType(s.seat_number, v as SeatType)}>
                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student" disabled={students.length === 0}>{t('student')}</SelectItem>
                      <SelectItem value="bot">{t('bot')}</SelectItem>
                      <SelectItem value="coach">{t('coach_seat')}</SelectItem>
                      <SelectItem value="closed">{t('closed')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {s.seat_type === 'student' && (
                  <Select value={s.student_id || ''} disabled={!seatsEditable} onValueChange={(v) => updateSeat(s.seat_number, { student_id: v })}>
                    <SelectTrigger><SelectValue placeholder={t('choose_student')} /></SelectTrigger>
                    <SelectContent>
                      {students.filter((st) => st.userId === s.student_id || !seats.some((x) => x.student_id === st.userId)).map((st) => (
                        <SelectItem key={st.userId} value={st.userId}>{st.displayName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {s.seat_type === 'bot' && (
                  <div className="grid grid-cols-2 gap-2">
                    <Input autoComplete="off" disabled={!seatsEditable} aria-label={t('bot_name')} value={s.bot_name || ''} maxLength={30} onChange={(e) => updateSeat(s.seat_number, { bot_name: e.target.value })} />
                    <Select value={s.bot_style || 'tight_aggressive'} disabled={!seatsEditable} onValueChange={(v) => updateSeat(s.seat_number, { bot_style: v as BotStyle })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{STYLES.map((st) => <SelectItem key={st} value={st}>{t(st)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            ))}
          </>)}

          {step === 3 && (<>
            <p className="text-sm text-muted-foreground">{t('presets_optional')}</p>
            <div className="grid grid-cols-2 gap-3" dir="ltr">
              <div><Label>{t('board')}</Label><Input autoComplete="off" placeholder="Qd7c2s" value={preset.board} onChange={(e) => setPreset({ ...preset, board: e.target.value.trim() })} /></div>
              <div><Label>{t('dealer_seat')}</Label>
                <Select value={preset.dealer_seat ? String(preset.dealer_seat) : ''} onValueChange={(v) => setPreset({ ...preset, dealer_seat: Number(v) })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{seats.filter((s) => s.seat_type !== 'closed').map((s) => <SelectItem key={s.seat_number} value={String(s.seat_number)}>{s.seat_number}</SelectItem>)}</SelectContent>
                </Select></div>
            </div>
            {seats.filter((s) => s.seat_type !== 'closed').map((s) => (
              <div key={s.seat_number} className="grid grid-cols-[2rem_1fr_6rem] items-center gap-2" dir="ltr">
                <span className="text-sm font-bold text-poker-gold">{s.seat_number}</span>
                <Input autoComplete="off" placeholder={`${t('hole_cards')} (AhKs)`} value={preset.seats[s.seat_number]?.cards || ''}
                  onChange={(e) => setPreset({ ...preset, seats: { ...preset.seats, [s.seat_number]: { ...preset.seats[s.seat_number], cards: e.target.value.trim() } } })} />
                <Input type="number" min={1} placeholder="BB" aria-label={t('stack_override')} value={preset.seats[s.seat_number]?.stack ?? ''}
                  onChange={(e) => setPreset({ ...preset, seats: { ...preset.seats, [s.seat_number]: { ...preset.seats[s.seat_number], stack: e.target.value ? Number(e.target.value) : undefined } } })} />
              </div>
            ))}
            {!presetValid && <p className="text-sm text-destructive">{t('invalid_cards')}</p>}
          </>)}

          {step === 4 && (<div className="space-y-2 text-sm">
            <p className="text-lg font-semibold">{f.title}</p>
            {f.description && <p className="text-muted-foreground">{f.description}</p>}
            <p dir="ltr" className={dir === 'rtl' ? 'text-right' : ''}>{f.game_type} · {f.small_blind}/{f.big_blind}{f.ante ? ` (${f.ante})` : ''} · {f.default_stack_bb}BB</p>
            <p>{t(f.format as 'cash')} · {f.max_seats} {t('seats')}</p>
            <div className="space-y-1 pt-2">
              {seats.map((s) => (
                <div key={s.seat_number} className="flex justify-between border-b border-border py-1">
                  <span>{t('seat')} {s.seat_number}</span>
                  <span className="text-muted-foreground">
                    {s.seat_type === 'student' ? studentName(s.student_id) : s.seat_type === 'bot' ? `${s.bot_name} · ${t(s.bot_style || 'tight_aggressive')}` : t(s.seat_type === 'coach' ? 'coach_seat' : 'closed')}
                  </span>
                </div>
              ))}
            </div>
          </div>)}
        </CardContent></Card>

        <div className="mt-4 flex justify-between gap-2">
          <Button variant="outline" className="min-h-[44px]" disabled={step === 0} onClick={() => setStep(step - 1)}>{t('previous')}</Button>
          {step < 4 ? (
            <Button className="min-h-[44px] bg-poker-gold hover:bg-poker-darkGold text-poker-black" disabled={!canNext()} onClick={() => setStep(step + 1)}>{t('next')}</Button>
          ) : (
            <Button className="min-h-[44px] bg-poker-gold hover:bg-poker-darkGold text-poker-black" disabled={saving} onClick={save}>{saving ? t('saving') : t('save')}</Button>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
