## Add "Additional Details" tutorial step

### 1. `src/pages/SessionForm.tsx`
Wrap the First Table Name + Festival Name FormFields (lines 818–859) in a single grouping div with `data-tour="additional-details"` so the spotlight highlights both fields together.

```tsx
<div data-tour="additional-details" className="space-y-6">
  {/* First Table Name FormField */}
  {/* Festival Name FormField */}
</div>
```

No other markup or logic changes.

### 2. `src/components/onboarding/tourSteps.ts`
Insert a new step in the `start-session` array between the existing `advanced-checkboxes` step and the `submit-session` step:

```ts
{
  selector: '[data-tour="additional-details"]',
  title: 'Additional Details (Optional)',
  body: 'Specify a starting table name or group this session under a major poker festival.',
  interactive: true,
  route: '/new-session',
  prepare: openAdvanced,
  compact: true,
},
```

Uses `compact: true` to match the tighter padding of the prior consolidated step, reuses `openAdvanced` so the Advanced Options panel stays open when the step renders, and sits naturally in the Next/Previous flow (Advanced Options → Additional Details → Start Session) since `OnboardingTour` advances through the array sequentially.
