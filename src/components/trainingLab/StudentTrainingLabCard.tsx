import { Component, ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import { useStudentTrainingData } from '@/hooks/useTrainingLessons';
import { useTL } from './i18n';

function StudentTrainingLabCardInner({ studentId, coachId }: { studentId: string; coachId: string }) {
  const { t, dir } = useTL();
  const navigate = useNavigate();
  const { data } = useStudentTrainingData(studentId, coachId);
  const [comingSoon, setComingSoon] = useState(false);

  return (
    <Card dir={dir} className="mb-6 border-poker-gold/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-center gap-2 text-poker-gold">
          <Icon name="FlaskConical" size={20} /> {t('training_lab')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data?.liveLessons.map((l) => (
          <div key={l.id} className="rounded-lg bg-[#35654D] p-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-poker-gold">
                <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" /> {t('live_lesson')}
              </div>
              <p className="truncate font-medium text-[#F5F5F0]">{l.title}</p>
            </div>
            <Button className="min-h-[44px] bg-poker-gold hover:bg-poker-darkGold text-poker-black shrink-0" onClick={() => setComingSoon(true)}>
              {t('join_table')}
            </Button>
          </div>
        ))}
        {comingSoon && <p className="text-center text-sm text-muted-foreground">{t('table_coming')}</p>}
        <div>
          <h4 className="mb-2 font-semibold">{t('my_summaries')}</h4>
          {!data?.summaries.length ? (
            <p className="text-sm text-muted-foreground">{t('no_summaries')}</p>
          ) : (
            <div className="space-y-2">
              {data.summaries.map((s) => (
                <button key={s.id} onClick={() => navigate(`/training-lab/summary/${s.id}`)}
                  className="flex w-full min-h-[44px] items-center justify-between rounded-md border border-border px-3 py-2 text-start hover:bg-muted/50">
                  <span className="truncate">{s.training_lessons?.title}</span>
                  <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

class CardBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(e: unknown) { console.error('Training Lab card failed', e); }
  render() {
    if (this.state.failed) {
      return (
        <Card className="mb-6 border-poker-gold/40">
          <CardHeader className="pb-3"><CardTitle className="text-center text-poker-gold">Training Lab</CardTitle></CardHeader>
          <CardContent><p className="text-center text-sm text-muted-foreground">No lesson summaries yet.</p></CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}

export default function StudentTrainingLabCard(props: { studentId: string; coachId: string }) {
  return <CardBoundary><StudentTrainingLabCardInner {...props} /></CardBoundary>;
}
