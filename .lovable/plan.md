## Onboarding tooltip footer — layout refactor

Restructure the footer of the onboarding tooltip card (`src/components/onboarding/OnboardingTour.tsx`) so the actions and the step indicator live on separate rows. Applies globally to all 5 tour steps (Home + Start New Session screen) since the tooltip component is shared.

### New footer layout

```text
┌──────────────────────────────────────────────┐
│  Skip              Previous   Next           │  ← buttons row
│                                              │  ← vertical padding
│                ●  ●  ●  ●  ●                 │  ← step indicator (centered)
└──────────────────────────────────────────────┘
```

- **Buttons row**: flex row, `justify-between`. `Skip` (ghost) left-aligned. `Previous` (when not first step) + `Next`/`Done` grouped right-aligned via a nested flex container with `gap-2`.
- **Indicator row**: full-width flex, `justify-center`, holding the existing animated dot/roller spans unchanged.
- **Spacing**: wrap both rows in a vertical flex container with `gap-3` (12px) between them; keep current card padding `p-4`.

### Technical changes

Single edit in `src/components/onboarding/OnboardingTour.tsx`, replacing the existing footer block (lines ~401–427):

```tsx
<div className="flex flex-col gap-3">
  {/* Buttons row */}
  <div className="flex items-center justify-between gap-2">
    <Button variant="ghost" size="sm" onClick={handleSkip}>
      Skip
    </Button>
    <div className="flex items-center gap-2">
      {!isFirst && (
        <Button variant="outline" size="sm" onClick={handlePrev}>
          Previous
        </Button>
      )}
      <Button size="sm" onClick={handleNext}>
        {isLast ? 'Done' : 'Next'}
      </Button>
    </div>
  </div>

  {/* Step indicator row */}
  <div className="flex items-center justify-center gap-1.5">
    {steps.map((_, i) => (
      <span
        key={i}
        className={`h-1.5 rounded-full transition-all duration-300 ${
          i === currentStep ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/40'
        }`}
      />
    ))}
  </div>
</div>
```

No other files need changes — `tourSteps.ts`, `useOnboardingTour.ts`, `Index.tsx`, and `SessionForm.tsx` are unaffected. The new layout automatically applies to every step in the tour, including the multi-page Start New Session flow.