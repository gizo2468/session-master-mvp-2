import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import type { TSeat } from '@/hooks/useTrainingTable';
import { useTL } from '../i18n';

const STYLES = ['tight_passive', 'tight_aggressive', 'loose_passive', 'loose_aggressive'] as const;

interface Props {
  seatNo: number | null; seat?: TSeat; bigBlind: number; students: { id: string; name: string }[];
  onClose: () => void; send: (cmd: string, payload?: Record<string, unknown>) => Promise<unknown>;
}

export default function SeatMenu({ seatNo, seat, bigBlind, students, onClose, send }: Props) {
  const { t } = useTL();
  const [stackBB, setStackBB] = useState('');
  const [type, setType] = useState<string>('bot');
  const [studentId, setStudentId] = useState('');
  const [botName, setBotName] = useState('');
  const [style, setStyle] = useState<string>('tight_aggressive');
  useEffect(() => {
    setStackBB(seat ? String(Math.round((seat.stack / bigBlind) * 10) / 10) : '');
    setType(seat?.type || 'bot');
    setStudentId(seat?.type === 'student' ? seat.player_id || '' : '');
    setBotName(seat?.type === 'bot' ? seat.name : 'Bot');
    setStyle(seat?.style || 'tight_aggressive');
  }, [seat, seatNo, bigBlind]);

  return (
    <Drawer open={seatNo != null} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[85dvh]"><div className="space-y-3 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <DrawerHeader><DrawerTitle className="text-primary">{t('seat')} {seatNo}</DrawerTitle></DrawerHeader>
        <p className="text-xs text-muted-foreground">{t('seat_menu_between')}</p>
        {seat && seat.type !== 'closed' && (
          <div className="flex items-end gap-2">
            <div className="flex-1"><Label>{t('adjust_stack')} (BB)</Label><Input type="number" min={0} value={stackBB} onChange={(e) => setStackBB(e.target.value)} /></div>
            <Button className="min-h-[44px]" onClick={async () => { await send('adjust_stack', { seat: seatNo, stack_bb: Number(stackBB) }); onClose(); }}>{t('apply')}</Button>
          </div>
        )}
        <div className="space-y-2 border-t border-border pt-3">
          <Label>{t('change_seat')}</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="student" disabled={!students.length}>{t('student')}</SelectItem>
              <SelectItem value="bot">{t('bot')}</SelectItem>
              <SelectItem value="coach">{t('coach_seat')}</SelectItem>
              <SelectItem value="closed">{t('closed')}</SelectItem>
            </SelectContent>
          </Select>
          {type === 'student' && (
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger><SelectValue placeholder={t('choose_student')} /></SelectTrigger>
              <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          )}
          {type === 'bot' && (
            <div className="grid grid-cols-2 gap-2">
              <Input autoComplete="off" maxLength={30} value={botName} onChange={(e) => setBotName(e.target.value)} aria-label={t('bot_name')} />
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STYLES.map((s) => <SelectItem key={s} value={s}>{t(s)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <Button className="w-full min-h-[44px]" disabled={type === 'student' && !studentId} onClick={async () => {
            await send('seat_change', { seat: seatNo, seat_type: type, student_id: type === 'student' ? studentId : null, bot_name: botName, bot_style: style });
            onClose();
          }}>{t('apply')}</Button>
        </div>
      </div></DrawerContent>
    </Drawer>
  );
}
