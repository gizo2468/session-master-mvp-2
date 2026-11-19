import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/Lucide';
import PageContainer from '@/components/ui/PageContainer';
import FeatureLockOverlay from '@/components/coaching/FeatureLockOverlay';
import { useAuth } from '@/context/AuthContext';
import { hasTrainingLabAccess } from '@/utils/coachTiers';
import { useCoachLessons, useInvalidateLessons, tl, LessonStatus } from '@/hooks/useTrainingLessons';
import { useTL } from '@/components/trainingLab/i18n';

const PREVIEW = [
  { id: 'p1', title: '3-bet pots in position', status: 'draft', game_type: 'NLH', format: 'cash', max_seats: 6 },
  { id: 'p2', title: 'Short-stack shove spots', status: 'ended', game_type: 'NLH', format: 'tournament', max_seats: 9 },
] as any[];

export default function TrainingLab() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, dir } = useTL();
  const tier = user?.coachTier || 'free';
  const unlocked = hasTrainingLabAccess(user?.role, tier);
  const { data: lessons = [] } = useCoachLessons(unlocked ? user?.id : undefined);
  const invalidate = useInvalidateLessons();
  const [tab, setTab] = useState<'draft' | 'live' | 'ended'>('draft');

  const list = (unlocked ? lessons : PREVIEW).filter((l) =>
    tab === 'live' ? l.status === 'live' || l.status === 'paused' : l.status === tab);

  const remove = async (id: string) => {
    await tl.from('training_lessons').delete().eq('id', id);
    invalidate();
  };

  return (
    <PageContainer>
      <div dir={dir} className="mx-auto max-w-2xl p-4 content-safe">
        <div className="mb-4 flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => navigate('/coach-dashboard', { replace: true })}>
            <Icon name={dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft'} size={20} />
          </Button>
          <div className="flex-1">
            <h1 className="flex items-center gap-2 text-2xl font-bold text-poker-gold"><Icon name="FlaskConical" size={22} />{t('training_lab')}</h1>
            <p className="text-sm text-muted-foreground">{t('training_lab_sub')}</p>
          </div>
        </div>

        <div className="relative min-h-[320px]">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">{t('my_lessons')}</h2>
            <Button className="min-h-[44px] bg-poker-gold hover:bg-poker-darkGold text-poker-black" disabled={!unlocked}
              onClick={() => navigate('/coach/training-lab/new')}>
              <Icon name="Plus" size={16} /> {t('create_lesson')}
            </Button>
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="mb-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="draft">{t('draft')}</TabsTrigger>
              <TabsTrigger value="live">{t('live')}</TabsTrigger>
              <TabsTrigger value="ended">{t('ended')}</TabsTrigger>
            </TabsList>
          </Tabs>
          {list.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">{t('no_lessons')}</p>
          ) : (
            <div className="space-y-3">
              {list.map((l) => (
                <Card key={l.id} className="border-l-4 border-l-[#35654D]">
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{l.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {l.game_type} · {t(l.format)} · {l.max_seats} {t('seats')} · {t(l.status as LessonStatus)}
                      </p>
                    </div>
                    {unlocked && (
                      <div className="flex shrink-0 gap-1">
                        {l.status !== 'live' && l.status !== 'ended' && (
                          <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => navigate(`/coach/training-lab/${l.id}/edit`)}>
                            <Icon name="Pencil" size={18} />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-11 w-11 text-destructive" aria-label={t('delete')} onClick={() => remove(l.id)}>
                          <Icon name="Trash2" size={18} />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {!unlocked && <FeatureLockOverlay featureName={t('training_lab')} />}
        </div>
      </div>
    </PageContainer>
  );
}
