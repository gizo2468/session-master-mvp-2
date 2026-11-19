import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import FeatureLockOverlay from '@/components/coaching/FeatureLockOverlay';
import { useAuth } from '@/context/AuthContext';
import { hasFeatureAccess } from '@/utils/coachTiers';
import { useCoachStudentLessons, StudentLessonRow, LessonStatus } from '@/hooks/useTrainingLessons';
import TrainingLabBoundary from './TrainingLabBoundary';
import { useTL } from './i18n';

const PREVIEW = [
  { id: 'p1', title: '3-bet pots in position', status: 'ended', created_at: new Date().toISOString(), hand_count: 24 },
  { id: 'p2', title: 'River bluff-catching', status: 'draft', created_at: new Date().toISOString(), hand_count: 0 },
] as unknown as StudentLessonRow[];

function Inner({ studentId }: { studentId: string }) {
  const { user } = useAuth();
  const { t, dir } = useTL();
  const navigate = useNavigate();
  const unlocked = hasFeatureAccess(user?.role, user?.coachTier || 'free', 'Training Lab');
  const { data = [] } = useCoachStudentLessons(unlocked ? user?.id : undefined, studentId);
  const [comingSoon, setComingSoon] = useState(false);
  const lessons = unlocked ? data : PREVIEW;
  const live = lessons.filter((l) => l.status === 'live');
  const back = encodeURIComponent(`/player/${studentId}`);

  const open = (l: StudentLessonRow) => {
    if (!unlocked) return;
    if (l.status === 'live') return setComingSoon(true);
    if (l.status === 'ended') return navigate(`/training-lab/summary/${l.summary_id || 'none'}?lesson=${l.id}&back=${back}`);
    navigate(`/coach/training-lab/${l.id}/edit`);
  };

  return (
    <Card dir={dir} className="mb-6 border-poker-gold/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-center gap-2 text-poker-gold">
          <Icon name="FlaskConical" size={20} /> {t('training_lab')}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative min-h-[220px] space-y-3">
        {live.map((l) => (
          <div key={l.id} className="rounded-lg bg-[#35654D] p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-poker-gold">
              <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" /> {t('live_lesson')}
            </div>
            <p className="truncate font-medium text-[#F5F5F0]">{l.title}</p>
          </div>
        ))}
        {comingSoon && <p className="text-center text-sm text-muted-foreground">{t('table_coming')}</p>}
        {!lessons.length ? (
          <p className="py-4 text-center text-sm text-muted-foreground">{t('no_lessons')}</p>
        ) : (
          <div className="space-y-2">
            {lessons.map((l) => (
              <button key={l.id} onClick={() => open(l)}
                className="flex w-full min-h-[44px] items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-start hover:bg-muted/50">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{l.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {new Date(l.created_at).toLocaleDateString()} · {l.hand_count} {t('hands')}
                  </span>
                </span>
                <span className="shrink-0 rounded-full border border-poker-gold/40 px-2 py-0.5 text-xs text-poker-gold">{t(l.status as LessonStatus)}</span>
              </button>
            ))}
          </div>
        )}
        <Button className="w-full min-h-[44px] bg-poker-gold hover:bg-poker-darkGold text-poker-black" disabled={!unlocked}
          onClick={() => navigate(`/coach/training-lab/new?student=${studentId}`)}>
          <Icon name="Plus" size={16} /> {t('create_with_student')}
        </Button>
        {!unlocked && <FeatureLockOverlay featureName={t('training_lab')} />}
      </CardContent>
    </Card>
  );
}

export default function CoachStudentTrainingLabCard({ studentId }: { studentId: string }) {
  return <TrainingLabBoundary emptyText="No lessons yet."><Inner studentId={studentId} /></TrainingLabBoundary>;
}
