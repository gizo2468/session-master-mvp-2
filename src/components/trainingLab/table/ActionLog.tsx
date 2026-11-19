import { useTL } from '../i18n';
import type { TState } from '@/hooks/useTrainingTable';

/** Last few actions at the table, so everyone sees what just happened. */
export default function ActionLog({ state }: { state: TState }) {
  const { t } = useTL();
  const items = state.recent_actions || [];
  if (!items.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card/60 p-2">
      <p className="mb-1 text-xs font-semibold text-muted-foreground">{t('last_actions')}</p>
      <ul className="space-y-0.5 text-sm">
        {items.slice().reverse().map((a, i) => (
          <li key={`${state.seq}-${i}`} className={i === 0 ? 'font-semibold' : 'text-muted-foreground'}>
            {a.name} {t(`log_${a.action}` as any) || a.action}{a.amount > 0 && a.action !== 'fold' && a.action !== 'check' ? ` ${a.amount}` : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}
