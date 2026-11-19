import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/Lucide';
import PageContainer from '@/components/ui/PageContainer';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { tl } from '@/hooks/useTrainingLessons';
import { useLessonReview, useRefreshLessonReview } from '@/hooks/useLessonReview';
import { useTL } from '@/components/trainingLab/i18n';
import TrainingLabBoundary from '@/components/trainingLab/TrainingLabBoundary';
import HandReplayer from '@/components/trainingLab/replay/HandReplayer';
import LessonHandList from '@/components/trainingLab/replay/LessonHandList';
import StatsGrid from '@/components/trainingLab/replay/StatsGrid';
import { computeStats } from '@/components/trainingLab/replay/lessonStats';

interface Draft { text: string; keys: string[] }

/** Coach: review an ended lesson per student, flag actions, write takeaways and publish summaries. Reopenable any time. */
function WrapUp() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTL();
  const { data: review, isLoading } = useLessonReview(id);
  const refresh = useRefreshLessonReview(id);
  const [tab, setTab] = useState<string>('');
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [replay, setReplay] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!review) return;
    setTab((cur) => cur || review.students[0]?.id || 'all');
    setDrafts((cur) => {
      const next = { ...cur };
      for (const s of review.students) if (!next[s.id]) {
        const sum = review.summaries.find((x) => x.student_id === s.id);
        next[s.id] = { text: sum?.summary_text || '', keys: sum?.key_hand_ids || [] };
      }
      return next;
    });
  }, [review]);

  const bb = Number(review?.lesson.big_blind) || 1;
  const stats = useMemo(() => review && tab && tab !== 'all' ? computeStats(tab, review.hands, review.actions, bb) : null, [review, tab, bb]);
  if (isLoading) return <p className="p-8 text-center text-muted-foreground">…</p>;
  if (!review || review.lesson.coach_id !== user?.id) return <p className="p-8 text-center text-muted-foreground">{t('table_coming')}</p>;

  const publish = async (studentIds: string[]) => {
    setBusy(true);
    const now = new Date().toISOString();
    const rows = studentIds.map((sid) => ({
      lesson_id: review.lesson.id, student_id: sid, summary_text: drafts[sid]?.text || null, key_hand_ids: drafts[sid]?.keys || [],
      stats: computeStats(sid, review.hands, review.actions, bb), published: true, published_at: now,
    }));
    const { error } = await tl.from('training_lesson_summaries').upsert(rows, { onConflict: 'lesson_id,student_id' });
    setBusy(false);
    if (error) return toast({ title: t('save_failed'), variant: 'destructive' });
    refresh();
  };
  const saveDraft = async (sid: string) => {
    setBusy(true);
    const existing = review.summaries.find((x) => x.student_id === sid);
    const row = { lesson_id: review.lesson.id, student_id: sid, summary_text: drafts[sid]?.text || null, key_hand_ids: drafts[sid]?.keys || [], stats: computeStats(sid, review.hands, review.actions, bb), published: existing?.published ?? false };
    const { error } = await tl.from('training_lesson_summaries').upsert(row, { onConflict: 'lesson_id,student_id' });
    setBusy(false);
    if (error) return toast({ title: t('save_failed'), variant: 'destructive' });
    refresh();
  };
  const toggleStar = (handId: string) => setDrafts((d) => {
    const cur = d[tab] || { text: '', keys: [] };
    return { ...d, [tab]: { ...cur, keys: cur.keys.includes(handId) ? cur.keys.filter((x) => x !== handId) : [...cur.keys, handId] } };
  });
  const summary = review.summaries.find((x) => x.student_id === tab);
  const draft = drafts[tab] || { text: '', keys: [] };

  return (
    <div className="mx-auto max-w-2xl p-4 content-safe">
      <Button variant="ghost" className="mb-2 min-h-[44px]" onClick={() => navigate('/coach/training-lab', { replace: true })}><Icon name="ArrowLeft" size={18} />{t('back')}</Button>
      <h1 className="text-center text-2xl font-bold text-poker-gold">{t('wrap_up')}</h1>
      <p className="mb-4 text-center text-sm text-muted-foreground">{review.lesson.title} · {new Date(review.lesson.started_at || review.lesson.created_at).toLocaleDateString()} · {review.hands.length} {t('hands')}</p>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {review.students.map((s) => {
          const pub = review.summaries.find((x) => x.student_id === s.id)?.published;
          return (
            <button key={s.id} type="button" onClick={() => setTab(s.id)}
              className={`flex min-h-[44px] shrink-0 items-center gap-1 rounded-full px-4 text-sm font-semibold ${tab === s.id ? 'bg-poker-gold text-poker-black' : 'bg-muted'}`}>
              {pub && <Icon name="CheckCircle2" size={14} />}{s.name}
            </button>
          );
        })}
        <button type="button" onClick={() => setTab('all')} className={`min-h-[44px] shrink-0 rounded-full px-4 text-sm font-semibold ${tab === 'all' ? 'bg-poker-gold text-poker-black' : 'bg-muted'}`}>{t('all_hands')}</button>
      </div>

      {tab === 'all' ? (
        <LessonHandList review={review} isCoach onReplay={setReplay} onChanged={refresh} />
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">{t('stats')}</CardTitle></CardHeader>
            <CardContent><StatsGrid stats={stats} /></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">{t('key_takeaways')}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea rows={5} value={draft.text} placeholder={t('takeaways_placeholder')} maxLength={5000} data-form-type="other" autoComplete="off"
                onChange={(e) => setDrafts((d) => ({ ...d, [tab]: { ...draft, text: e.target.value } }))} />
              {summary?.published && <p className="text-xs text-emerald-500">{t('published')} · {new Date(summary.published_at || summary.updated_at).toLocaleString()}</p>}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="min-h-[44px]" disabled={busy} onClick={() => saveDraft(tab)}>{t('save_draft')}</Button>
                <Button className="min-h-[44px] bg-poker-gold text-poker-black hover:bg-poker-darkGold" disabled={busy} onClick={() => publish([tab])}>
                  <Icon name="Send" size={16} />{summary?.published ? t('republish') : t('publish')}
                </Button>
              </div>
              {review.students.length > 1 && (
                <Button variant="secondary" className="min-h-[44px] w-full" disabled={busy} onClick={() => publish(review.students.map((s) => s.id))}>{t('publish_all')}</Button>
              )}
            </CardContent>
          </Card>
          <h3 className="font-semibold">{t('all_hands')}</h3>
          <LessonHandList review={review} studentId={tab} isCoach keyHands={draft.keys} onToggleStar={toggleStar} onReplay={setReplay} onChanged={refresh} />
        </div>
      )}
      {!review.students.length && <p className="mt-4 text-center text-sm text-muted-foreground">{t('no_students_lesson')}</p>}
      {replay && <HandReplayer review={review} handId={replay} viewerId={user?.id} isCoach studentId={tab !== 'all' ? tab : undefined} onClose={() => setReplay(null)} />}
    </div>
  );
}

export default function TrainingLessonWrapUp() {
  return <PageContainer><TrainingLabBoundary emptyText="The wrap-up could not be loaded."><WrapUp /></TrainingLabBoundary></PageContainer>;
}
