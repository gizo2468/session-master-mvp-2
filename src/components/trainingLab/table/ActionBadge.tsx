import { memo } from 'react';
import { useTL } from '../i18n';

const TONE: Record<string, string> = {
  fold: 'bg-muted text-muted-foreground', check: 'bg-secondary text-secondary-foreground',
  call: 'bg-primary/90 text-primary-foreground', bet: 'bg-destructive text-destructive-foreground',
  raise: 'bg-destructive text-destructive-foreground', 'all-in': 'bg-destructive text-destructive-foreground',
};

/** Appears instantly next to a seat after an action, then fades (CSS only). */
function ActionBadge({ action, amount, bb }: { action: string; amount: number; bb: number }) {
  const { t } = useTL();
  if (action === 'post_blind' || action === 'show') return null;
  const key = action === 'all-in' ? 'allin' : action;
  const amt = amount > 0 && action !== 'fold' && action !== 'check' ? ` ${+(amount / bb).toFixed(1)}BB` : '';
  return (
    <span className={`tl-badge pointer-events-none whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-black shadow ${TONE[action] || TONE.check}`}>
      {t(key as any)}{amt}
    </span>
  );
}
export default memo(ActionBadge);
