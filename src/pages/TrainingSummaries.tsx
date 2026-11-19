import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import PageContainer from '@/components/ui/PageContainer';
import { useAuth } from '@/context/AuthContext';
import { tl } from '@/hooks/useTrainingLessons';
import { useTL } from '@/components/trainingLab/i18n';
import TrainingLabBoundary from '@/components/trainingLab/TrainingLabBoundary';

/** All lesson summaries for a student: the student's own (published only), or a coach's view of one student. */
function List() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTL();
  const studentId = search.get('student') || user?.id;
  const asCoach = !!studentId && studentId !== user?.id;
  const { data = [], isLoading } = useQuery({
    queryKey: ['training-summaries', studentId, asCoach],
    enabled: !!studentId,
    queryFn: async () => {
      let q = tl.from('training_lesson_summaries').select('id, lesson_id, published, published_at, stats, created_at, training_lessons(title, coach_id, started_at, created_at)').eq('student_id', studentId);
      if (!asCoach) q = q.eq('published', true);
      const { data } = await q.order('created_at', { ascending: false });
      const rows = data || [];
      const coaches = [...new Set(rows.map((r: any) => r.training_lessons?.coach_id).filter(Boolean))] as string[];
      const names: Record<string, string> = {};
      await Promise.all(coaches.map(async (c) => {
        try { const { data: p } = await tl.rpc('get_safe_profile_data', { profile_user_id: c }); const r = Array.isArray(p) ? p[0] : p; if (r) names[c] = r.online_nickname || r.username || ''; } catch { /* blank */ }
      }));
      return rows.map((r: any) => ({ ...r, coachName: names[r.training_lessons?.coach_id] || '' }));
    },
  });
  const back = () => navigate(asCoach ? `/player/${studentId}` : '/player-dashboard', { replace: true });
  const open = (r: any) => navigate(asCoach ? `/coach/training-lab/${r.lesson_id}/wrap-up` : `/training-lab/summary/${r.id}`);

  return (
    <div className="mx-auto max-w-2xl p-4 content-safe">
      <Button variant="ghost" className="mb-2 min-h-[44px]" onClick={back}><Icon name="ArrowLeft" size={18} />{t('back')}</Button>
      <h1 className="mb-4 text-center text-2xl font-bold text-poker-gold">{asCoach ? t('summaries_for') : t('my_summaries')}</h1>
      {isLoading ? <p className="text-center text-muted-foreground">…</p> : !data.length ? (
        <p className="py-8 text-center text-muted-foreground">{t('no_summaries')}</p>
      ) : (
        <div className="space-y-2">
          {data.map((r: any) => (
            <button key={r.id} type="button" onClick={() => open(r)}
              className="flex min-h-[60px] w-full items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-start hover:bg-muted/50">
              <span className="min-w-0">
                <span className="block truncate font-semibold">{r.training_lessons?.title}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {new Date(r.training_lessons?.started_at || r.training_lessons?.created_at || r.created_at).toLocaleDateString()}
                  {r.coachName ? ` · ${r.coachName}` : ''} · {r.stats?.hands ?? 0} {t('hands')}
                </span>
              </span>
              {asCoach && <span className={`shrink-0 text-xs ${r.published ? 'text-emerald-500' : 'text-muted-foreground'}`}>{r.published ? t('published') : t('draft')}</span>}
              <Icon name="ChevronRight" size={18} className="shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TrainingSummaries() {
  return <PageContainer><TrainingLabBoundary emptyText="Summaries could not be loaded."><List /></TrainingLabBoundary></PageContainer>;
}
