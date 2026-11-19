import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import Icon from '@/components/ui/Lucide';
import type { TState } from '@/hooks/useTrainingTable';
import { useTL } from '../i18n';

interface Props {
  dealLabel?: string;
  state: TState; lessonStatus: string; busy: boolean; godView: boolean; setGodView: (v: boolean) => void;
  send: (cmd: string, payload?: Record<string, unknown>) => Promise<unknown>; students: { id: string; name: string }[];
}

export default function CoachControls({ state, lessonStatus, busy, godView, setGodView, send, students, dealLabel }: Props) {
  const { t } = useTL();
  const [dialog, setDialog] = useState<null | 'discuss' | 'note' | 'preset'>(null);
  const [msg, setMsg] = useState('');
  const [attach, setAttach] = useState<'hand' | 'action' | 'lesson'>('hand');
  const [noteFor, setNoteFor] = useState('all');
  const [preset, setPreset] = useState<{ board: string; dealer_seat: string; seats: Record<string, { cards?: string; stack?: string }> }>({ board: '', dealer_seat: '', seats: {} });
  const between = state.status !== 'in_hand';
  const ended = lessonStatus === 'ended';
  const seats = Object.values(state.seats).filter((s) => s.type !== 'closed').sort((a, b) => a.seat - b.seat);

  const submitPreset = async () => {
    const seatsOut: Record<string, { cards?: string; stack?: number }> = {};
    for (const [k, v] of Object.entries(preset.seats)) {
      if (v.cards || v.stack) seatsOut[k] = { ...(v.cards ? { cards: v.cards } : {}), ...(v.stack ? { stack: Number(v.stack) } : {}) };
    }
    await send('set_preset', { preset: { board: preset.board || undefined, dealer_seat: preset.dealer_seat ? Number(preset.dealer_seat) : null, seats: seatsOut } });
    setDialog(null);
  };

  if (ended) return null;
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-3">
      <p className="text-center text-sm font-semibold text-primary">{t('controls')}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {lessonStatus !== 'live'
          ? <Button className="min-h-[44px]" disabled={busy} onClick={() => send(lessonStatus === 'draft' ? 'start' : 'resume')}><Icon name="Play" size={16} />{lessonStatus === 'draft' ? t('start_lesson') : t('resume')}</Button>
          : <Button variant="outline" className="min-h-[44px]" disabled={busy} onClick={() => send('pause')}><Icon name="Pause" size={16} />{t('pause')}</Button>}
        <Button className="min-h-[44px]" disabled={busy || !between || lessonStatus !== 'live'} onClick={() => send('deal')}><Icon name="Layers" size={16} />{dealLabel || t('deal_next')}</Button>
        <Button variant="outline" className="min-h-[44px]" disabled={busy} onClick={() => setDialog('discuss')}><Icon name="MessageSquare" size={16} />{t('discuss')}</Button>
        <Button variant="outline" className="min-h-[44px]" onClick={() => setDialog('note')}><Icon name="StickyNote" size={16} />{t('quick_note')}</Button>
        <Button variant="outline" className="min-h-[44px]" onClick={() => setDialog('preset')}><Icon name="Wand2" size={16} />{t('presets_next')}{state.preset ? ' •' : ''}</Button>
        <Button variant="outline" className="min-h-[44px] text-destructive" disabled={busy} onClick={() => { if (confirm(t('confirm_end'))) send('end'); }}><Icon name="Square" size={16} />{t('end_lesson')}</Button>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
        <label className="flex min-h-[44px] items-center gap-2"><Switch checked={state.settings.auto_deal} onCheckedChange={(v) => send('set_settings', { settings: { auto_deal: v } })} />{t('auto_deal')}</label>
        <label className="flex min-h-[44px] items-center gap-2"><Switch checked={godView} onCheckedChange={setGodView} />{t('god_view')}</label>
        <div className="flex items-center gap-2">
          <span>{t('timer')}</span>
          <Select value={String(state.settings.timer)} onValueChange={(v) => send('set_settings', { settings: { timer: Number(v) } })}>
            <SelectTrigger className="h-11 w-24"><SelectValue /></SelectTrigger>
            <SelectContent>{[0, 15, 30, 60].map((n) => <SelectItem key={n} value={String(n)}>{n ? `${n}s` : t('timer_off')}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <Dialog open={dialog === 'discuss'} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent><DialogHeader><DialogTitle className="text-primary">{t('discuss')}</DialogTitle></DialogHeader>
          <Textarea autoComplete="off" maxLength={500} placeholder={t('discuss_placeholder')} value={msg} onChange={(e) => setMsg(e.target.value)} />
          <DialogFooter><Button className="min-h-[44px]" onClick={async () => { await send('discuss', { message: msg }); setMsg(''); setDialog(null); }}>{t('send')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === 'note'} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent><DialogHeader><DialogTitle className="text-primary">{t('quick_note')}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            <Select value={attach} onValueChange={(v) => setAttach(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hand" disabled={!state.hand_id}>{t('note_hand')}</SelectItem>
                <SelectItem value="action" disabled={!state.hand_id}>{t('note_action')}</SelectItem>
                <SelectItem value="lesson">{t('note_lesson')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={noteFor} onValueChange={setNoteFor}>
              <SelectTrigger aria-label={t('note_for')}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('everyone')}</SelectItem>
                {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Textarea autoComplete="off" maxLength={2000} value={msg} onChange={(e) => setMsg(e.target.value)} />
          <DialogFooter><Button className="min-h-[44px]" disabled={!msg.trim()} onClick={async () => {
            await send('note', { note: msg.trim(), attach: state.hand_id ? attach : 'lesson', student_id: noteFor === 'all' ? null : noteFor });
            setMsg(''); setDialog(null);
          }}>{t('save')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === 'preset'} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle className="text-primary">{t('presets_next')}</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">{t('presets_optional')}</p>
          <div className="space-y-2" dir="ltr">
            <div className="grid grid-cols-2 gap-2">
              <div><Label>{t('board')}</Label><Input autoComplete="off" placeholder="Qd7c2s" value={preset.board} onChange={(e) => setPreset({ ...preset, board: e.target.value.trim() })} /></div>
              <div><Label>{t('dealer_seat')}</Label>
                <Select value={preset.dealer_seat} onValueChange={(v) => setPreset({ ...preset, dealer_seat: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{seats.map((s) => <SelectItem key={s.seat} value={String(s.seat)}>{s.seat} · {s.name}</SelectItem>)}</SelectContent>
                </Select></div>
            </div>
            {seats.map((s) => (
              <div key={s.seat} className="grid grid-cols-[1fr_1fr_5rem] items-center gap-2">
                <span className="truncate text-sm">{s.seat} · {s.name}</span>
                <Input autoComplete="off" placeholder="AhKs" value={preset.seats[s.seat]?.cards || ''} onChange={(e) => setPreset({ ...preset, seats: { ...preset.seats, [s.seat]: { ...preset.seats[s.seat], cards: e.target.value.trim() } } })} />
                <Input type="number" placeholder="BB" value={preset.seats[s.seat]?.stack || ''} onChange={(e) => setPreset({ ...preset, seats: { ...preset.seats, [s.seat]: { ...preset.seats[s.seat], stack: e.target.value } } })} />
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="min-h-[44px]" onClick={async () => { await send('set_preset', { preset: null }); setPreset({ board: '', dealer_seat: '', seats: {} }); setDialog(null); }}>{t('clear')}</Button>
            <Button className="min-h-[44px]" onClick={submitPreset}>{t('apply')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
