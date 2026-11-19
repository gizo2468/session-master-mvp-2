import { useTL } from '../i18n';
import type { StudentStats } from './lessonStats';

export default function StatsGrid({ stats }: { stats?: Partial<StudentStats> | null }) {
  const { t } = useTL();
  if (!stats) return null;
  const net = stats.net_bb ?? 0;
  const items: [string, string, string?][] = [
    [t('hands_played'), String(stats.hands ?? 0)],
    [t('vpip'), `${stats.vpip ?? 0}%`], [t('pfr'), `${stats.pfr ?? 0}%`], [t('three_bet'), `${stats.three_bet ?? 0}%`],
    [t('net_bb'), `${net > 0 ? '+' : ''}${net} BB`, net >= 0 ? 'text-emerald-500' : 'text-destructive'],
    [t('biggest_won'), `${stats.biggest_won_bb ?? 0} BB`], [t('biggest_lost'), `${stats.biggest_lost_bb ?? 0} BB`],
  ];
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map(([k, v, cls]) => (
        <div key={k} className="rounded-lg bg-muted/50 p-2 text-center">
          <p className="text-[11px] text-muted-foreground">{k}</p>
          <p className={`text-lg font-black ${cls || ''}`}>{v}</p>
        </div>
      ))}
    </div>
  );
}
