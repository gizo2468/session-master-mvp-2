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
    queryFn: async () => {
      const { data: lessons } = await tl.from('training_lessons').select('id,title,status,coach_id').eq('coach_id', coachId);
      const { data: summaries } = await tl.from('training_lesson_summaries')
        .select('id,lesson_id,created_at,training_lessons(title,coach_id)')
        .eq('student_id', studentId).eq('published', true).order('created_at', { ascending: false });
      return {
        liveLessons: ((lessons || []) as TrainingLesson[]).filter((l) => l.status === 'live'),
        summaries: ((summaries || []) as any[]).filter((s) => s.training_lessons?.coach_id === coachId),
      };
    },
  });

export const useInvalidateLessons = () => {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['training-lessons'] });
};

export const CARD_RE = /^([2-9TJQKA][shdc])+$/i;
