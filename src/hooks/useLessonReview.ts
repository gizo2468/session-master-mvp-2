import { useQuery, useQueryClient } from '@tanstack/react-query';
import { tl } from '@/hooks/useTrainingLessons';
import { splitCards, type RAction, type RHand, type RNote, type RSeatInfo } from '@/components/trainingLab/replay/types';

export interface RReply { id: string; note_id: string; author_id: string; body: string; created_at: string }
export interface RSummary { id: string; lesson_id: string; student_id: string; summary_text: string | null; stats: any; published: boolean; published_at: string | null; key_hand_ids: string[]; updated_at: string }
export interface LessonReview {
  lesson: any; hands: RHand[]; actions: RAction[]; holes: Record<string, Record<number, string[]>>;
  notes: RNote[]; replies: RReply[]; summaries: RSummary[]; names: Record<string, string>;
  students: { id: string; name: string }[];
}

/** Everything needed to review a lesson. Database access rules decide what each viewer gets (a student only receives their own hole cards and notes). */
export const useLessonReview = (lessonId?: string) =>
  useQuery({
    queryKey: ['lesson-review', lessonId],
    enabled: !!lessonId,
    queryFn: async (): Promise<LessonReview | null> => {
      const { data: lesson } = await tl.from('training_lessons').select('*').eq('id', lessonId).maybeSingle();
      if (!lesson) return null;
      const [{ data: parts }, { data: h }, { data: notes }, { data: summaries }, { data: replies }] = await Promise.all([
        tl.from('training_lesson_participants').select('seat_number, seat_type, student_id, bot_name').eq('lesson_id', lessonId),
        tl.from('training_hands').select('id, lesson_id, hand_number, dealer_seat, board_cards, pot_total, winners').eq('lesson_id', lessonId).eq('status', 'ended').order('hand_number'),
        tl.from('training_notes').select('id, hand_id, action_id, student_id, note, flag, created_at').eq('lesson_id', lessonId).order('created_at'),
        tl.from('training_lesson_summaries').select('*').eq('lesson_id', lessonId),
        tl.from('training_note_replies').select('id, note_id, author_id, body, created_at').eq('lesson_id', lessonId).order('created_at'),
      ]);
      const hands: RHand[] = h || [];
      const ids = hands.map((x) => x.id);
      let actions: RAction[] = []; const holes: LessonReview['holes'] = {};
      for (let i = 0; i < ids.length; i += 100) {
        const chunk = ids.slice(i, i + 100);
        const [{ data: a }, { data: c }] = await Promise.all([
          tl.from('training_hand_actions').select('id, hand_id, seat_number, player_id, street, action, amount, pot_after, sequence, revealed_cards').in('hand_id', chunk).order('sequence'),
          tl.from('training_hand_private_cards').select('hand_id, seat_number, hole_cards').in('hand_id', chunk),
        ]);
        actions = actions.concat(a || []);
        for (const r of c || []) (holes[r.hand_id] ||= {})[r.seat_number] = splitCards(r.hole_cards);
      }
      const pids = [...new Set([...(parts || []).map((p: any) => p.student_id), ...actions.map((a) => a.player_id), lesson.coach_id].filter(Boolean))] as string[];
      const names: Record<string, string> = {};
      await Promise.all(pids.map(async (pid) => {
        try {
          const { data } = await tl.rpc('get_safe_profile_data', { profile_user_id: pid });
          const r = Array.isArray(data) ? data[0] : data;
          if (r) names[pid] = r.online_nickname || r.username || '';
        } catch { /* name stays blank */ }
      }));
      for (const p of parts || []) if (p.seat_type === 'bot' && p.bot_name) names[`bot-${p.seat_number}`] = p.bot_name;
      const studentIds = [...new Set([...(parts || []).filter((p: any) => p.student_id).map((p: any) => p.student_id), ...(summaries || []).map((s: any) => s.student_id)])] as string[];
      return {
        lesson, hands, actions, holes, notes: notes || [], replies: replies || [], summaries: summaries || [], names,
        students: studentIds.map((id) => ({ id, name: names[id] || 'Student' })),
      };
    },
  });

export const useRefreshLessonReview = (lessonId?: string) => {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['lesson-review', lessonId] });
};

/** Seat info for one hand, built from who acted in it. */
export function handSeats(review: LessonReview, handId: string): RSeatInfo[] {
  const bySeat = new Map<number, string | null>();
  for (const a of review.actions) if (a.hand_id === handId && !bySeat.has(a.seat_number)) bySeat.set(a.seat_number, a.player_id);
  return [...bySeat.entries()].map(([seat, pid]) => {
    const isCoach = !!pid && pid === review.lesson.coach_id;
    return {
      seat, player_id: pid, type: !pid ? 'bot' : isCoach ? 'coach' : 'student',
      name: !pid ? review.names[`bot-${seat}`] || `Bot ${seat}` : isCoach ? review.names[pid] || 'Coach' : review.names[pid] || `Seat ${seat}`,
    } as RSeatInfo;
  });
}
