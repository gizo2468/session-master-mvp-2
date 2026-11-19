import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import type { TState } from '@/hooks/useTrainingTable';
import { useTL } from '../i18n';

interface Props { state: TState; seat: number; bigBlind: number; plo: boolean; disabled: boolean; onAct: (action: string, amount?: number) => void }

const r2 = (n: number) => Math.round(n * 100) / 100;

export default function ActionBar({ state, seat, bigBlind, plo, disabled, onAct }: Props) {
  const { t } = useTL();
  const me = state.seats[seat];
  const toCall = r2(Math.max(0, state.current_bet - me.bet));
  const allInTo = r2(me.bet + me.stack);
  const potMax = r2(state.current_bet + state.pot_total + toCall);
  const maxTo = plo ? Math.min(allInTo, potMax) : allInTo;
  const minTo = r2(Math.min(allInTo, state.current_bet === 0 ? bigBlind : state.current_bet + state.min_raise));
  const canRaise = !me.acted && me.stack > toCall;
  const [to, setTo] = useState(minTo);
  useEffect(() => setTo(minTo), [minTo, state.seq]);

  const quick = useMemo(() => {
    const clamp = (v: number) => r2(Math.min(maxTo, Math.max(minTo, v)));
    if (state.street === 'preflop') return [2.2, 2.5, 3].map((m) => ({ label: `${m}x`, v: clamp(m * Math.max(bigBlind, state.current_bet)) }));
    const potAfterCall = state.pot_total + toCall;
    return [[1 / 3, '1/3'], [1 / 2, '1/2'], [2 / 3, '2/3'], [1, t('pot')]].map(([f, label]) => ({ label: String(label), v: clamp(state.current_bet + potAfterCall * Number(f)) }));
  }, [state.street, state.pot_total, state.current_bet, toCall, bigBlind, minTo, maxTo, t]);

  const verb = state.current_bet === 0 ? 'bet' : 'raise';
  return (
    <div className="space-y-2 rounded-xl border border-primary/50 bg-card p-3" dir="ltr">
      <p className="text-center text-sm font-semibold text-primary">{t('your_turn')}</p>
      {canRaise && maxTo > minTo && (
        <>
          <div className="flex flex-wrap justify-center gap-1">
            {quick.map((q) => (
              <Button key={q.label} size="sm" variant="outline" className="min-h-[44px] min-w-[52px]" onClick={() => setTo(q.v)}>{q.label}</Button>
            ))}
            <Button size="sm" variant="outline" className="min-h-[44px]" onClick={() => setTo(maxTo)}>{t('allin')}</Button>
          </div>
          <div className="flex items-center gap-3 px-1">
            <Slider min={minTo} max={maxTo} step={Math.min(bigBlind, 1) / 2} value={[to]} onValueChange={([v]) => setTo(r2(v))} className="flex-1" />
            <span className="w-16 text-right font-mono text-sm">{to}</span>
          </div>
        </>
      )}
      <div className="grid grid-cols-3 gap-2">
        <Button variant="outline" className="min-h-[48px]" disabled={disabled} onClick={() => onAct('fold')}>{t('fold')}</Button>
        {toCall === 0
          ? <Button variant="outline" className="min-h-[48px]" disabled={disabled} onClick={() => onAct('check')}>{t('check')}</Button>
          : <Button variant="outline" className="min-h-[48px]" disabled={disabled} onClick={() => onAct('call')}>{t('call')} {Math.min(toCall, me.stack)}</Button>}
        {canRaise
          ? (to >= allInTo
            ? <Button className="min-h-[48px]" disabled={disabled} onClick={() => onAct('all-in')}>{t('allin')} {allInTo}</Button>
            : <Button className="min-h-[48px]" disabled={disabled} onClick={() => onAct(verb, to)}>{t(verb)} {to}</Button>)
          : <Button className="min-h-[48px]" disabled={disabled || toCall < me.stack} onClick={() => onAct('all-in')}>{t('allin')}</Button>}
      </div>
    </div>
  );
}
