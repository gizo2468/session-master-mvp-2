import { useLanguage } from '@/context/LanguageContext';

const en = {
  training_lab: 'Training Lab',
  training_lab_sub: 'Run live practice tables with your students',
  my_lessons: 'My Lessons',
  create_lesson: 'Create Lesson',
  edit_lesson: 'Edit Lesson',
  draft: 'Draft', live: 'Live', paused: 'Paused', ended: 'Ended',
  no_lessons: 'No lessons here yet.',
  step_basics: 'Title & Goal', step_game: 'Game Settings', step_seats: 'Seats', step_presets: 'Scenario', step_review: 'Review',
  title: 'Title', goal: 'Lesson goal', game_type: 'Game type', format: 'Format', cash: 'Cash', tournament: 'Tournament',
  seats: 'Seats', small_blind: 'Small blind', big_blind: 'Big blind', ante: 'Ante', stack_bb: 'Starting stack (BB)',
  seat: 'Seat', student: 'Student', bot: 'Auto player (bot)', coach_seat: 'Coach-controlled', closed: 'Closed (no player)',
  choose_student: 'Choose student', bot_name: 'Bot name', bot_style: 'Bot style',
  tight_passive: 'Tight passive', tight_aggressive: 'Tight aggressive', loose_passive: 'Loose passive', loose_aggressive: 'Loose aggressive',
  presets_optional: 'Optional: preset cards and stacks for the first hand. Cards like AhKs, board like Qd7c2s.',
  hole_cards: 'Hole cards', board: 'Board', dealer_seat: 'Dealer seat', stack_override: 'Stack (BB)',
  next: 'Next', previous: 'Previous', save: 'Save Lesson', saving: 'Saving...',
  student_limit: 'Your plan allows up to {n} students per lesson.',
  seats_locked: 'Seats can only be changed while the lesson is a draft or paused.',
  title_required: 'Please enter a title.',
  live_lesson: 'Live lesson', join_table: 'Join table', table_coming: 'The live table is coming soon.',
  my_summaries: 'My Lesson Summaries', no_summaries: 'No lesson summaries yet.',
  lesson_summary: 'Lesson Summary', summary_placeholder: 'Detailed lesson summaries are coming soon.',
  delete: 'Delete', back: 'Back', no_students: 'No connected students yet.', invalid_cards: 'Check the card format.',
};
type Key = keyof typeof en;
const he: Record<Key, string> = {
  training_lab: 'מעבדת אימון',
  training_lab_sub: 'נהלו שולחנות תרגול חיים עם התלמידים שלכם',
  my_lessons: 'השיעורים שלי',
  create_lesson: 'צור שיעור',
  edit_lesson: 'ערוך שיעור',
  draft: 'טיוטה', live: 'חי', paused: 'מושהה', ended: 'הסתיים',
  no_lessons: 'אין עדיין שיעורים כאן.',
  step_basics: 'כותרת ומטרה', step_game: 'הגדרות משחק', step_seats: 'מושבים', step_presets: 'תרחיש', step_review: 'סיכום',
  title: 'כותרת', goal: 'מטרת השיעור', game_type: 'סוג משחק', format: 'פורמט', cash: 'קאש', tournament: 'טורניר',
  seats: 'מושבים', small_blind: 'סמול בליינד', big_blind: 'ביג בליינד', ante: 'אנטה', stack_bb: 'ערימה התחלתית (BB)',
  seat: 'מושב', student: 'תלמיד', bot: 'שחקן אוטומטי (בוט)', coach_seat: 'בשליטת המאמן', closed: 'סגור (ללא שחקן)',
  choose_student: 'בחר תלמיד', bot_name: 'שם הבוט', bot_style: 'סגנון הבוט',
  tight_passive: 'טייט פסיבי', tight_aggressive: 'טייט אגרסיבי', loose_passive: 'לוס פסיבי', loose_aggressive: 'לוס אגרסיבי',
  presets_optional: 'אופציונלי: קלפים וערימות מוגדרים מראש ליד הראשונה. קלפים כמו AhKs, בורד כמו Qd7c2s.',
  hole_cards: 'קלפים ביד', board: 'בורד', dealer_seat: 'מושב דילר', stack_override: 'ערימה (BB)',
  next: 'הבא', previous: 'הקודם', save: 'שמור שיעור', saving: 'שומר...',
  student_limit: 'התכנית שלך מאפשרת עד {n} תלמידים בשיעור.',
  seats_locked: 'ניתן לשנות מושבים רק כשהשיעור בטיוטה או מושהה.',
  title_required: 'אנא הזן כותרת.',
  live_lesson: 'שיעור חי', join_table: 'הצטרף לשולחן', table_coming: 'השולחן החי יגיע בקרוב.',
  my_summaries: 'סיכומי השיעורים שלי', no_summaries: 'אין עדיין סיכומי שיעורים.',
  lesson_summary: 'סיכום שיעור', summary_placeholder: 'סיכומי שיעור מפורטים יגיעו בקרוב.',
  delete: 'מחק', back: 'חזור', no_students: 'אין עדיין תלמידים מחוברים.', invalid_cards: 'בדוק את פורמט הקלפים.',
};

export const useTL = () => {
  const { language } = useLanguage();
  const dict = language === 'he' ? he : en;
  return {
    t: (k: Key, vars?: Record<string, string | number>) =>
      Object.entries(vars || {}).reduce((s, [v, val]) => s.replace(`{${v}}`, String(val)), dict[k]),
    dir: (language === 'he' ? 'rtl' : 'ltr') as 'rtl' | 'ltr',
  };
};
