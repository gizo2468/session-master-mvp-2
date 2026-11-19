import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type LessonStatus = 'draft' | 'live' | 'paused' | 'ended';
export type SeatType = 'student' | 'bot' | 'coach' | 'closed';
export type BotStyle = 'tight_passive' | 'tight_aggressive' | 'loose_passive' | 'loose_aggressive';

export interface TrainingLesson {
  id: string; coach_id: string; title: string; description: string | null;
  game_type: 'NLH' | 'PLO'; format: 'cash' | 'tournament'; max_seats: number;
  small_blind: number; big_blind: number; ante: number; default_stack_bb: number;
  status: LessonStatus; scenario_preset: any; created_at: string;
}
export interface SeatDraft {
  seat_number: number; seat_type: SeatType; student_id: string | null;
  bot_name: string | null; bot_style: BotStyle | null;
}

// Tables are newer than the generated types; use an untyped handle.
export const tl = supabase as any;

export const useCoachLessons = (coachId?: string) =>
  useQuery({
    queryKey: ['training-lessons', coachId],
    enabled: !!coachId,
    queryFn: async () => {
      const { data, error } = await tl.from('training_lessons').select('*').eq('coach_id', coachId).order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as TrainingLesson[];
    },
  });

export const useStudentTrainingData = (studentId?: string, coachId?: string) =>
  useQuery({
    queryKey: ['training-student', studentId, coachId],
    enabled: !!studentId && !!coachId,
    refetchInterval: 30000,
    retry: 1,
    queryFn: async () => {
      try {
      const { data: lessons } = await tl.from('training_lessons').select('id,title,status,coach_id').eq('coach_id', coachId);
      const { data: summaries } = await tl.from('training_lesson_summaries')
        .select('id,lesson_id,created_at,training_lessons(title,coach_id)')
        .eq('student_id', studentId).eq('published', true).order('created_at', { ascending: false });
      return {
        liveLessons: ((lessons || []) as TrainingLesson[]).filter((l) => l.status === 'live'),
        summaries: ((summaries || []) as any[]).filter((s) => s.training_lessons?.coach_id === coachId),
      };
      } catch {
        return { liveLessons: [] as TrainingLesson[], summaries: [] as any[] };
      }
    },
  });

export const useInvalidateLessons = () => {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['training-lessons'] });
};

export const CARD_RE = /^([2-9TJQKA][shdc])+$/i;

export interface StudentLessonRow extends TrainingLesson { hand_count: number; summary_id: string | null }

export const useCoachStudentLessons = (coachId?: string, studentId?: string) =>
  useQuery({
    queryKey: ['training-coach-student', coachId, studentId],
    enabled: !!coachId && !!studentId,
    retry: 1,
    queryFn: async (): Promise<StudentLessonRow[]> => {
      try {
        const { data: seats } = await tl.from('training_lesson_participants').select('lesson_id').eq('student_id', studentId);
        const ids = [...new Set(((seats || []) as any[]).map((s) => s.lesson_id))];
        if (!ids.length) return [];
        const [{ data: lessons }, { data: hands }, { data: sums }] = await Promise.all([
          tl.from('training_lessons').select('*').in('id', ids).eq('coach_id', coachId).order('created_at', { ascending: false }),
          tl.from('training_hands').select('lesson_id').in('lesson_id', ids),
          tl.from('training_lesson_summaries').select('id,lesson_id').in('lesson_id', ids).eq('student_id', studentId),
        ]);
        return ((lessons || []) as TrainingLesson[]).map((l) => ({
          ...l,
          hand_count: ((hands || []) as any[]).filter((h) => h.lesson_id === l.id).length,
          summary_id: ((sums || []) as any[]).find((s) => s.lesson_id === l.id)?.id ?? null,
        }));
      } catch {
        return [];
      }
    },
  });

export const useStudentAllTrainingData = (studentId?: string) =>
  useQuery({
    queryKey: ['training-student-all', studentId],
    enabled: !!studentId,
    refetchInterval: 30000,
    retry: 1,
    queryFn: async () => {
      try {
        const { data: lessons } = await tl.from('training_lessons').select('id,title,status,coach_id').eq('status', 'live');
        const { data: summaries } = await tl.from('training_lesson_summaries')
          .select('id,lesson_id,created_at,training_lessons(title,coach_id)')
          .eq('student_id', studentId).eq('published', true).order('created_at', { ascending: false });
        return { liveLessons: (lessons || []) as TrainingLesson[], summaries: (summaries || []) as any[] };
      } catch {
        return { liveLessons: [] as TrainingLesson[], summaries: [] as any[] };
      }
    },
  });
