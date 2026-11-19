import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import PageContainer from '@/components/ui/PageContainer';
import { useAuth } from '@/context/AuthContext';
import { tl } from '@/hooks/useTrainingLessons';
import { useLessonReview, useRefreshLessonReview } from '@/hooks/useLessonReview';
import { useTL } from '@/components/trainingLab/i18n';
import TrainingLabBoundary from '@/components/trainingLab/TrainingLabBoundary';
import HandReplayer from '@/components/trainingLab/replay/HandReplayer';
import LessonHandList from '@/components/trainingLab/replay/LessonHandList';
import StatsGrid from '@/components/trainingLab/replay/StatsGrid';

/** Student: one published lesson summary with takeaways, stats, key hands and replays. Coaches are sent to the wrap-up. */
function Summary() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const lessonParam = search.get('lesson');
  const backTo = search.get('back');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTL();
  const [replay, setReplay] = useState<string | null>(null);

  const { data: summary, isLoading } = useQuery({
    queryKey: ['training-summary', id, lessonParam, user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      let q = tl.from('training_lesson_summaries').select('*, training_lessons(id, title, coach_id, started_at, created_at)');
      q = id && id !== 'none' ? q.eq('id', id) : q.eq('lesson_id', lessonParam).eq('student_id', user!.id);
      const { data } = await q.maybeSingle();
      if (data) return data;
      if (lessonParam) {
        const { data: l } = await tl.from('training_lessons').select('id, title, coach_id, started_at, created_at').eq('id', lessonParam).maybeSingle();
        return l ? { lesson_id: l.id, training_lessons: l, published: false } : null;
      }
      return null;
    },
  });
  const lesson = summary?.training_lessons;
  const isCoach = !!lesson && lesson.coach_id === user?.id;
  useEffect(() => { if (isCoach) navigate(`/coach/training-lab/${lesson.id}/wrap-up`, { replace: true }); }, [isCoach, lesson?.id, navigate]);
  const published = !!summary?.published;
  const { data: review } = useLessonReview(published ? summary?.lesson_id : undefined);
  const refresh = useRefreshLessonReview(summary?.lesson_id);

  const back = () => backTo && backTo.startsWith('/') ? navigate(backTo, { replace: true }) : navigate('/training-lab/summaries', { replace: true });

  return (
    <div className="mx-auto max-w-2xl p-4 content-safe">
      <Button variant="ghost" className="mb-2 min-h-[44px]" onClick={back}><Icon name="ArrowLeft" size={18} /> {t('back')}</Button>
      <h1 className="text-center text-2xl font-bold text-poker-gold">{t('lesson_summary')}</h1>
      {lesson && <p className="mb-4 text-center text-sm text-muted-foreground">{lesson.title} · {new Date(lesson.started_at || lesson.created_at).toLocaleDateString()}{review ? ` · ${review.names[lesson.coach_id] || ''}` : ''}</p>}
      {isLoading ? <p className="text-center text-muted-foreground">…</p> : !published ? (
        <p className="py-8 text-center text-muted-foreground">{t('summary_not_published')}</p>
      ) : (
        <div className="space-y-4">
          <Card className="border-poker-gold/50">
            <CardHeader className="pb-2"><CardTitle className="text-base text-poker-gold">{t('key_takeaways')}</CardTitle></CardHeader>
            <CardContent><p className="whitespace-pre-wrap text-sm">{summary.summary_text || '—'}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">{t('stats')}</CardTitle></CardHeader>
            <CardContent><StatsGrid stats={summary.stats} /></CardContent>
          </Card>
          <h3 className="font-semibold">{(summary.key_hand_ids || []).length ? `${t('key_hands')} · ${t('all_hands')}` : t('all_hands')}</h3>
          {review && <LessonHandList review={review} studentId={user?.id} isCoach={false} keyHands={summary.key_hand_ids || []} onReplay={setReplay} onChanged={refresh} />}
        </div>
      )}
      {replay && review && <HandReplayer review={review} handId={replay} viewerId={user?.id} isCoach={false} studentId={user?.id} onClose={() => setReplay(null)} />}
    </div>
  );
}

export default function TrainingLessonSummary() {
  return <PageContainer><TrainingLabBoundary emptyText="This summary could not be loaded."><Summary /></TrainingLabBoundary></PageContainer>;
}
