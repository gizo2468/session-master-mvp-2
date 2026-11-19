# Training Lab cards: Player Profile (coach) and Player Dashboard (student)

## 1. Coach view of a student (Player Profile page)
A new **Training Lab** card goes below Performance Summary, where Key Focus Points used to be. It shows:
- **Live banner:** when this student is seated in one of my live lessons, a green "Live lesson" banner with the lesson title.
- **Lessons list:** every lesson of mine this student has a seat in, newest first. Each row shows the title, date, status (Draft / Live / Paused / Ended) and number of hands played.
  - Tapping an ended lesson opens its summary for this student. If no summary exists yet, it opens the lesson's summary page with a "summary coming soon" note.
  - Tapping a draft or paused lesson opens it in the wizard for editing.
  - Tapping a live lesson shows "The live table is coming soon" until the table engine exists.
- **"Create lesson with this student" button:** opens the Create Lesson wizard with this student already in seat 1.
- **Free plan coaches:** the card shows a sample list behind the existing lock screen with the Upgrade button, like the Training Lab page does.

## 2. Student's Player Dashboard
The student's Training Lab card goes where Key Focus Points used to be, with the same live banner and My Lesson Summaries as on the Coach Profile page, but covering **all** their coaches:
- Each live banner and each summary shows the coach's name.
- When the student has more than one coach, a "Coach" filter (All coaches / each coach by name) sits at the top of the card.

## Safety and languages
- Both cards keep their own error safety net and catch failed data loads. A failure only ever shows the empty state ("No lessons yet" / "No lesson summaries yet") and never crashes the page.
- All new text comes in English and Hebrew and follows the user's language, with right-to-left layout in Hebrew.

## Technical notes
- Add two data helpers in `useTrainingLessons.ts`:
  - `useCoachStudentLessons(coachId, studentId)`: lessons joined through the seats table on `student_id`, plus a hand count per lesson from `training_hands`.
  - `useStudentAllTrainingData(studentId)`: lessons and published summaries across all coaches; coach names come from `connectedCoaches` in the coach-student context.
  - Both catch errors and return empty arrays.
- Existing access rules already allow this (coach reads own lessons, seats and hands; student reads lessons they're seated in and their published summaries), so no database change is needed.
- The wizard reads `?student=<id>` and pre-assigns seat 1 when the student is an approved student.
- Pull the safety net out of `StudentTrainingLabCard` into a shared `TrainingLabBoundary` component. `StudentTrainingLabCard` gets an optional all-coaches mode used by the Player Dashboard.
- The summary page also works when the coach opens it.
