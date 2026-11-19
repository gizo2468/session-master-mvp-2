import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import PageContainer from '@/components/ui/PageContainer';
import { tl } from '@/hooks/useTrainingLessons';
import { useTL } from '@/components/trainingLab/i18n';

export default function TrainingLessonSummary() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, dir } = useTL();
  const { data } = useQuery({
    queryKey: ['training-summary', id],
    queryFn: async () => {
      const { data } = await tl.from('training_lesson_summaries').select('*, training_lessons(title, coach_id)').eq('id', id).maybeSingle();
      return data;
    },
  });
  const back = () => data?.training_lessons?.coach_id
    ? navigate(`/coach/${data.training_lessons.coach_id}`, { replace: true })
    : navigate('/', { replace: true });

  return (
    <PageContainer>
      <div dir={dir} className="mx-auto max-w-2xl p-4 content-safe">
        <Button variant="ghost" className="mb-4 min-h-[44px]" onClick={back}>
          <Icon name={dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft'} size={18} /> {t('back')}
        </Button>
        <Card>
          <CardHeader><CardTitle className="text-center text-poker-gold">{t('lesson_summary')}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-center">
            <p className="text-lg font-semibold">{data?.training_lessons?.title}</p>
            {data?.summary_text && <p className="whitespace-pre-wrap text-start">{data.summary_text}</p>}
            <p className="text-sm text-muted-foreground">{t('summary_placeholder')}</p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
