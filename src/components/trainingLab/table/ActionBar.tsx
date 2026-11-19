import { useEffect, useMemo, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import type { TState } from '@/hooks/useTrainingTable';
import { fmtAmount, useTableStore } from '@/stores/useTableStore';
import { useTL } from '../i18n';

interface Props { state: TState; seat: number; bigBlind: number; plo: boolean; disabled: boolean; onAct: (action: string, amount?: number) => void }

const r2 = (n: number) => Math.round(n * 100) / 100;
const ROW = 'h-[clamp(48px,7.2cqh,66px)]';

/** My-turn controls pinned to the bottom of the table: Fold / Call row, four raise presets, slider and keypad. */
export default function ActionBar({ state, seat, bigBlind, plo, disabled, onAct }: Props) {
  const { t, dir } = useTL();
  const showBB = useTableStore((s) => s.showBB);
  const fmt = (v: number) => fmtAmount(v, bigBlind, showBB);
  const me = state.seats[seat];
  const toCall = r2(Math.max(0, state.current_bet - me.bet));
  const allInTo = r2(me.bet + me.stack);
  const potMax = r2(state.current_bet + state.pot_total + toCall);
  const maxTo = plo ? Math.min(allInTo, potMax) : allInTo;
  const minTo = r2(Math.min(allInTo, state.current_bet === 0 ? bigBlind : state.current_bet + state.min_raise));
  const canRaise = !me.acted && me.stack > toCall;
  const verb = state.current_bet === 0 ? 'bet' : 'raise';
  const [sheet, setSheet] = useState<'slider' | 'keypad' | null>(null);
  const [to, setTo] = useState(minTo);
  const [typed, setTyped] = useState('');
  useEffect(() => setTo(minTo), [minTo, state.seq]);
  const clamp = (v: number) => r2(Math.min(maxTo, Math.max(minTo, v)));

  const presets = useMemo(() => {
    if (state.street === 'preflop') {
      const base = Math.max(bigBlind, state.current_bet);
      return [
        { tag: t('allin'), v: maxTo },
        ...[3, 2.5, 2.2].map((m) => ({ tag: `${m}x`, v: clamp(m * base) })),
      ];
    }
    const potAfterCall = state.pot_total + toCall;
    return [1, 0.75, 0.5, 0.33].map((f) => ({ tag: `${Math.round(f * 100)}%`, v: clamp(state.current_bet + potAfterCall * f) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.street, state.pot_total, state.current_bet, toCall, bigBlind, minTo, maxTo, t]);

  const raise = (v: number) => {
    const amt = clamp(v);
    if (amt >= allInTo) onAct('all-in'); else onAct(verb, amt);
    setSheet(null);
  };
  const raiseOk = canRaise && maxTo > toCall + me.bet;

  return (
    <>
      <div dir="ltr" className="tl-slide-up pointer-events-none absolute inset-x-[2.5cqw] bottom-[max(2cqw,env(safe-area-inset-bottom))] z-40 grid grid-cols-3 gap-x-[2cqw] gap-y-[1.4cqw]">
        {/* Raise presets: right column, rows 1–4 */}
        {raiseOk && presets.map((p, i) => (
          <button key={p.tag} type="button" disabled={disabled} onClick={() => raise(p.v)}
            className={`tl-act-btn pointer-events-auto col-start-3 flex flex-col justify-center px-[2cqw] ${ROW}`} style={{ gridRowStart: i + 1 }}>
            <span className="flex w-full justify-between text-[2.9cqw] font-semibold leading-none text-white/80">
              <span>{p.tag}</span><span>{p.v >= allInTo ? t('allin') : verb === 'bet' ? t('bet_to') : t('raise_to')}</span>
            </span>
            <span className="mt-[0.6cqw] text-[5cqw] font-black leading-none text-poker-gold">{fmt(p.v)}</span>
          </button>
        ))}
        {/* Slider + keypad above Call */}
        {raiseOk && (
          <div className={`pointer-events-auto col-start-2 row-start-3 flex gap-[1.6cqw] ${ROW}`}>
            <button type="button" aria-label={t('custom_amount')} className="tl-act-btn flex flex-1 items-center justify-center" onClick={() => { setTyped(''); setSheet('keypad'); }}>
              <Icon name="Grid3x3" size={22} />
            </button>
            <button type="button" aria-label={t(verb)} className="tl-act-btn flex flex-1 items-center justify-center" onClick={() => setSheet('slider')}>
              <Icon name="ChevronUp" size={26} />
            </button>
          </div>
        )}
        <button type="button" disabled={disabled} onClick={() => onAct('fold')}
          className={`tl-act-btn pointer-events-auto col-start-1 row-start-4 text-[5.2cqw] font-black ${ROW}`}>{t('fold')}</button>
        {toCall === 0
          ? <button type="button" disabled={disabled} onClick={() => onAct('check')}
              className={`tl-act-btn pointer-events-auto col-start-2 row-start-4 text-[5.2cqw] font-black ${ROW}`}>{t('check')}</button>
          : <button type="button" disabled={disabled} onClick={() => onAct('call')}
              className={`tl-act-btn pointer-events-auto col-start-2 row-start-4 flex flex-col items-center justify-center leading-none ${ROW}`}>
              <span className="text-[4.4cqw] font-black">{t('call')}</span>
              <span className="mt-[0.6cqw] text-[4.6cqw] font-black text-poker-gold">{fmt(Math.min(toCall, me.stack))}</span>
            </button>}
      </div>

      <Drawer open={sheet != null} onOpenChange={(o) => !o && setSheet(null)}>
        <DrawerContent dir={dir}>
          <DrawerHeader><DrawerTitle className="text-primary">{sheet === 'keypad' ? t('custom_amount') : t(verb)}</DrawerTitle></DrawerHeader>
          <div className="space-y-4 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]" dir="ltr">
            {sheet === 'slider' ? (
              <>
                <p className="text-center text-3xl font-black text-poker-gold">{fmt(to)}</p>
                <Slider min={minTo} max={maxTo} step={Math.min(bigBlind, 1) / 2} value={[to]} onValueChange={([v]) => setTo(r2(v))} />
                <div className="flex justify-between text-xs text-muted-foreground"><span>{fmt(minTo)}</span><span>{fmt(maxTo)}</span></div>
                <Button className="min-h-[52px] w-full text-lg" disabled={disabled} onClick={() => raise(to)}>{t('confirm')} · {fmt(to)}</Button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Input autoFocus type="number" inputMode="decimal" data-form-type="other" autoComplete="off" name={`amt-${state.seq}`}
                    className="h-14 text-center text-2xl font-black" value={typed} onChange={(e) => setTyped(e.target.value)}
                    placeholder={showBB ? String(+(minTo / bigBlind).toFixed(1)) : String(minTo)} />
                  <span className="text-lg font-bold text-muted-foreground">{showBB ? 'BB' : ''}</span>
                </div>
                <p className="text-center text-xs text-muted-foreground">{fmt(minTo)} – {fmt(maxTo)}</p>
                <Button className="min-h-[52px] w-full text-lg" disabled={disabled || !typed}
                  onClick={() => raise(Number(typed) * (showBB ? bigBlind : 1))}>{t('confirm')}</Button>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
