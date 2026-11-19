# Training Lab – Phase 1 (foundation, no table engine)

## Step 1 – Remove "Key Focus Points"

"Key Focus Points" is the `PlayerGoalsTasks` component, and it saves its data in the `player_goals` table. Here is everywhere it is used (please confirm before anything gets deleted from the database):

- **Screens:** Coach Profile (what students see), Player Dashboard (student), Player Profile (coach view of a student). Removing it from all three takes the feature out of the app completely.
- **Code:** `PlayerGoalsTasks.tsx`, `GoalImageLink.tsx`, the goal-image helpers in `storageUtils.ts`, the goal notification handling in `notificationService.ts` and `Notifications.tsx`, and the translations.
- **Database:** the `player_goals` table and its 9 access rules; the `notifications.player_goal_id` column; the triggers `notify_student_on_goal_created`, `enforce_player_goals_student_update` and `update_player_goals_updated_at`; any hourly reminder job that mentions goals; and the storage folder for goal images.

The work happens in two passes:
1. First, remove all the code and screens, and put the new Training Lab card where the section used to be on the Coach Profile.
2. Then, **only after you confirm**, run a separate database change. It drops the goal triggers, the functions, the `player_goal_id` column, any related reminder job and the `player_goals` table. It also deletes existing goal notifications. This cannot be undone, so all saved goals will be lost.

## Step 2 – Database
Seven new tables, as listed in your brief: `training_lessons`, `training_lesson_participants`, `training_hands`, `training_hand_actions`, `training_hand_private_cards`, `training_notes`, `training_lesson_summaries`. Each one gets access permissions, row-level security, `updated_at` triggers where they apply, and `ON DELETE CASCADE` from the lesson down.

Helper functions (security definer, fixed search_path):
- `is_lesson_coach(lesson_id)`
- `is_lesson_participant(lesson_id)`
- `hand_lesson_id(hand_id)`

Access rules:
- **Coach:** full access to rows for their own lessons.
- **Student:** can read only lessons they are seated in.
- **Participants list:** a student can read the whole list for their own lessons.
- **Private cards:** a student sees only rows where `player_id = auth.uid()`, plus the lesson coach. Showdown cards become public through `training_hand_actions` (a showdown row with the revealed cards) and are never exposed from the private-cards table.
- **Actions and hands:** students can read them for their own lessons. Writing them is limited to the coach for now. When the table engine is built, students will act through a validated server function, so they can never act for another seat.
- **Notes:** students can read notes where `student_id = me` or `student_id` is empty.
- **Summaries:** students can read only their own, and only when `published = true`.
- **Adding a student to a seat:** a validation trigger checks `is_coach_for_student` and the seat limits: seats 1 to max_seats, max_seats between 2 and 9, and a student seat must have a `student_id`.
- **Student limit:** a trigger counts the student seats in a lesson against the coach's plan limit.
- No access for anonymous visitors.

## Step 3 – Plan access
- Add `'Training Lab'` to the starter, pro and elite features in `coachTiers.ts`.
- Free coaches see a preview of the lessons list behind `FeatureLockOverlay` with an Upgrade button.
- The number of students per lesson is capped at `maxStudents` (checked in the wizard and in the database).

## Step 4 – Skeleton pages

**Coach**
- "Training Lab" entry on the Coach Dashboard, opening `/coach/training-lab`.
- My Lessons list with tabs (Draft / Live / Ended) and a Create Lesson button.
- 5-step Create Lesson wizard at `/coach/training-lab/new` (also used for editing, `/coach/training-lab/:id/edit`):
  1. Title and goal
  2. Game settings
  3. Seats: an approved student, a bot (style and name), coach-controlled, or closed
  4. Optional scenario presets (hole cards per seat, board, stacks, dealer position), reusing the existing card selector
  5. Review and save
- Seat settings can be edited only while the lesson is a draft or paused.

**Student**
- Training Lab card on the Coach Profile: a "Live lesson – Join table" banner when a lesson they're in is live (the button goes to a placeholder for now), plus a My Lesson Summaries list.
- Placeholder summary page at `/training-lab/summary/:id`.

## Look, languages and devices
- Gold and felt-green accents, using the existing app colors.
- English and Hebrew text through `LanguageContext`, with right-to-left layout in Hebrew. Card and seat pictures are always shown left to right.
- Laid out for phone first (44px tap targets, safe areas) and still works on desktop.

## Technical notes
- New files go in `src/components/trainingLab/*`, `src/hooks/useTrainingLessons.ts` and the new pages; routes are added in `App.tsx`.
- The decision is recorded in AGENTS.md. The player goals memory entries are removed after the table is dropped.
