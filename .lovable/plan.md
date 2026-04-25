## Fix: Tooltip Footer Controls (Hard Update)

The previous turn's edit didn't land — the live `src/components/onboarding/OnboardingTour.tsx` still contains the floating top-right Skip button and has no Previous button. This plan rewrites the relevant sections explicitly.

### Changes to `src/components/onboarding/OnboardingTour.tsx`

**1. Add a `handlePrev` handler** near `handleNext`:
```tsx
const handlePrev = () => {
  if (currentStep > 0) setCurrentStep((s) => s - 1);
};
const isFirst = currentStep === 0;
```

**2. Delete the floating top-right Skip button entirely** — the entire block:
```tsx
<button onClick={handleSkip} className="absolute top-4 right-4 ...">Skip</button>
```
is removed. Nothing replaces it.

**3. Replace the tooltip footer button row** so it renders `[Skip] [Previous] [Next/Done]` horizontally on the right, with Previous hidden on step 1:
```tsx
<div className="flex items-center gap-2">
  <Button variant="ghost" size="sm" onClick={handleSkip}>
    Skip
  </Button>
  {!isFirst && (
    <Button variant="outline" size="sm" onClick={handlePrev}>
      Previous
    </Button>
  )}
  <Button size="sm" onClick={handleNext}>
    {isLast ? 'Done' : 'Next'}
  </Button>
</div>
```

The step indicator dots remain on the left of the footer row (unchanged).

### Resulting footer layout
```text
┌─────────────────────────────────────────────┐
│ • • • •                  [Skip] [Next]      │   ← Step 1 (no Previous)
│ • • • •        [Skip] [Previous] [Next]     │   ← Steps 2–3
│ • • • •        [Skip] [Previous] [Done]     │   ← Last step
└─────────────────────────────────────────────┘
```

### Verification step
After editing, re-read `OnboardingTour.tsx` to confirm:
- No `absolute top-4 right-4` Skip button exists anywhere in the file
- `handlePrev` is defined
- The footer JSX contains a conditional `{!isFirst && <Button … >Previous</Button>}`

### Unchanged
- SVG spotlight mask, gold stroke, fade-in animation
- Tooltip positioning (above/below/centered fallback)
- `useOnboardingTour` hook and Settings reset wiring
- All `data-tour` targets on the Home page

### Files
- `src/components/onboarding/OnboardingTour.tsx` (only file edited)
