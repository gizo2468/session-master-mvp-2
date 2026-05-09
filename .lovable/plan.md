## Compact Advanced Settings Tour Step

### Changes

**1. `src/components/onboarding/tourSteps.ts`** — update the consolidated step:
- `title`: `'Session Settings'` (was `'Advanced Session Settings'`)
- `body`: `'Select any that apply to your session for accurate tracking and specialized features.'`
- Add new optional flag `compact?: boolean` to the `TourStep` interface, set `compact: true` on this step.

**2. `src/components/onboarding/OnboardingTour.tsx`** — apply compact styling when `step.compact` is true:
- Tooltip container (line 982): swap `p-4 sm:p-5` → `p-3 sm:p-4` when compact, plus tighten the inner `flex flex-col gap-3` (line 1026) → `gap-2`.
- Increase `TOOLTIP_GAP` for this step from 16 → 24 px (computed locally as `step.compact ? 24 : TOOLTIP_GAP`) so the tooltip sits higher above the highlighted checkboxes and clears the First Table Name input below.
- Re-export `TourStep` already exists; just propagate the new field.

### Out of scope
- No changes to the spotlight/highlight grouping (still wraps all three checkboxes via `data-tour="advanced-checkboxes"`).
- No changes to step ordering or flow — remains a single replacement step.
- No changes to other steps' padding or gap.