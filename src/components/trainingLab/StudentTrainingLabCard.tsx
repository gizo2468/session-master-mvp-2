import { useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/Lucide';
import { useStudentTrainingData, useStudentAllTrainingData } from '@/hooks/useTrainingLessons';
import { useCoachStudent } from '@/context/CoachStudentContext';
import TrainingLabBoundary from './TrainingLabBoundary';
import { useTL } from './i18n';

interface Props { studentId: string; coachId?: string }

function Inner({ studentId, coachId }: Props) {
  const { t, dir } = useTL();
  const navigate = useNavigate();
  const single = useStudentTrainingData(studentId, coachId);
  const all = useStudentAllTrainingData(coachId ? undefined : studentId);
  const data = coachId ? single.data : all.data;
  const { connectedCoaches = [] } = useCoachStudent();
  const [filter, setFilter] = useState('all');

  const coachName = (id?: string) => {
    const c = connectedCoaches.find((c) => c.userId === id || c.id === id);
    return c?.displayName || '';
  };
  const showCoach = !coachId;
  const keep = (cid?: string) => filter === 'all' || cid === filter;
  const live = (data?.liveLessons || []).filter((l) => keep(l.coach_id));
  const summaries = (data?.summaries || []).filter((s) => keep(s.training_lessons?.coach_id));

  return (
    <Card dir={dir} className="mb-6 border-poker-gold/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-center gap-2 text-poker-gold">
          <Icon name="FlaskConical" size={20} /> {t('training_lab')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showCoach && connectedCoaches.length > 1 && (
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="min-h-[44px]" aria-label={t('coach')}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all_coaches')}</SelectItem>
              {connectedCoaches.map((c) => <SelectItem key={c.userId} value={c.userId}>{c.displayName}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {live.map((l) => (
          <div key={l.id} className="rounded-lg bg-[#35654D] p-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-poker-gold">
                <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" /> {t('live_lesson')}
              </div>
              <p className="truncate font-medium text-[#F5F5F0]">{l.title}</p>
              {showCoach && coachName(l.coach_id) && <p className="truncate text-xs text-[#F5F5F0]/70">{coachName(l.coach_id)}</p>}
            </div>
            <Button className="min-h-[44px] bg-poker-gold hover:bg-poker-darkGold text-poker-black shrink-0" onClick={() => navigate(`/training-lab/table/${l.id}`)}>
              {t('join_table')}
            </Button>
          </div>
        ))}
        <div>
          <h4 className="mb-2 font-semibold">{t('my_summaries')}</h4>
          {!summaries.length ? (
            <p className="text-sm text-muted-foreground">{t('no_summaries')}</p>
          ) : (
            <div className="space-y-2">
              {summaries.map((s) => (
                <button key={s.id} onClick={() => navigate(`/training-lab/summary/${s.id}`)}
                  className="flex w-full min-h-[44px] items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-start hover:bg-muted/50">
                  <span className="min-w-0">
                    <span className="block truncate">{s.training_lessons?.title}</span>
                    {showCoach && coachName(s.training_lessons?.coach_id) && (
                      <span className="block truncate text-xs text-muted-foreground">{coachName(s.training_lessons?.coach_id)}</span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function StudentTrainingLabCard(props: Props) {
  return <TrainingLabBoundary><Inner {...props} /></TrainingLabBoundary>;
}
