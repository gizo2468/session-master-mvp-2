# Training Lab: English only, hand replayer, lesson summaries, notifications

## 1. English only (Training Lab only)
- Remove the Hebrew dictionary from the Training Lab text file; the helper always returns English and `dir="ltr"`.
- Remove `dir={dir}` / RTL-side logic from Training Lab pages, cards, drawers and the table. The rest of the app is untouched.

## 2. Hand replayer (shared)
- One full-screen replayer that reuses the live table look (felt, seats, cards, chips, same fast animations), driven by a local timeline built from a hand's saved actions. It never sends commands to the live game, so opening it mid-lesson doesn't affect play.
- Controls: play/pause, step back/forward by action, jump to Preflop / Flop / Turn / River / Showdown, speed 0.5x / 1x / 2x.
- Coach notes appear as a highlighted bubble at the exact action they belong to, and playback pauses there. Mistake / good-play flags show on the action.
- Cards: students see their own cards (folded ones faded) plus cards shown at showdown; the coach sees all cards. A secure server step enforces this, not the screen.
- Opened from: live table Hand History, the coach wrap-up, the student summary, and coach lesson history.

## 3. Coach: Lesson Wrap-up
- Ending a lesson opens a wrap-up screen with one tab per student:
  - Auto stats: hands played, VPIP, PFR, 3-bet %, net result in BB, biggest pot won/lost (calculated on the server from saved actions).
  - List of the student's hands with notes; star "key hands"; flag "mistake" / "good play" on single actions; add or edit notes.
  - "Key Takeaways" text field; "Publish summary" per student and "Publish to all".
- Ended lessons can be reopened from the Training Lab page: view all hands of all players in the replayer, edit notes/flags, republish.

## 4. Student: lesson summaries
- New "My lesson summaries" page: all lessons with date, coach, title and hand count. Linked from the Training Lab cards on the Player Dashboard and the Coach Profile page.
- Summary page: Key Takeaways on top, my stats, starred key hands first, then all my hands; each opens the replayer with notes and flags.
- Students can reply to a coach note with a question; the coach sees replies in the wrap-up / history view and can answer.
- The coach's Training Lab card on a student's profile links to that student's summaries.

## 5. Notifications (existing pattern)
- Student: "A new lesson summary is available" when a summary is published (first publish and republish), opens the summary.
- Coach: "Student replied to a note", opens that hand in the lesson.

## 6. Testing
- Automated game-rule tests for the stats calculation and the card-visibility filter, plus a scripted full-flow test against the game engine: 2 students, 1 bot, 1 coach seat, 3 hands including an all-in with a side pot, notes, end and publish. It checks each student only gets their own summary and never sees another player's hole cards before showdown.
- I can't sign in to your Supabase project from here, so the real multi-device flow in the app still needs a run-through from you.

## Technical details
- Database (one migration, with grants + RLS):
  - `training_notes`: add `flag` ('mistake' | 'good_play' | null), allow updates by the lesson coach.
  - `training_lesson_summaries`: add `key_hand_ids uuid[]`, `published_at`; unique (lesson_id, student_id); student reads own row only when published.
  - New `training_note_replies` (note_id, author_id, body, created_at): student of that note and lesson coach can read/insert. `player_to_coach_reviews` doesn't exist in this project, so this follows the `hand_feedback` style instead.
  - Triggers create the two notifications server-side (notification inserts stay server-only); add `training_summary_id`/reuse `training_lesson_id` for deep links.
- Edge function `training-table`: new commands `replay_hand` (returns actions + cards filtered by viewer role) and `lesson_stats` (computes per-student stats from `training_hand_actions`); stats logic in a pure `stats.ts` with tests.
- Frontend: `HandReplayer.tsx` + `replayTimeline.ts` (pure state reducer over actions, reused for step/jump), `LessonWrapUp.tsx` page, `TrainingLessonSummary.tsx` rebuilt, `TrainingSummaries.tsx` list page, routes in `App.tsx`, Notifications routing for the two new types.
- AGENTS.md: replace the EN/HE rule with "Training Lab is English only"; add a rule that replays are client-local timelines fed by a server-filtered `replay_hand` command.
