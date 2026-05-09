## Consolidate Advanced Options Tour Steps

Merge the three separate tour steps (Online Game, Multi-Day Tournament, Late Registration) into one consolidated step that highlights all advanced checkboxes together.

### Changes

**1. `src/pages/SessionForm.tsx`**
- Wrap the three checkbox `FormItem`s (Online Game, Multi-Day Tournament, Late Registration) in a single container `<div data-tour="advanced-checkboxes" className="space-y-4">` inside the `CollapsibleContent`.
- Remove the existing `data-tour="advanced-online"`, `data-tour="advanced-multiday"`, and `data-tour="advanced-late-reg"` attributes from the individual `FormItem`s (they no longer need their own selectors).
- The Physical Location input (which appears conditionally when Online is checked) stays outside the wrapper so it doesn't get highlighted.

**2. `src/components/onboarding/tourSteps.ts`**
- Remove the three steps: `advanced-online`, `advanced-multiday`, `advanced-late-reg`.
- Insert a single step in their place:
  - `selector: '[data-tour="advanced-checkboxes"]'`
  - `title: 'Advanced Session Settings'`
  - `body: 'If any of these conditions apply to your session, select them here to ensure accurate tracking and specialized features for your game.'`
  - `interactive: true`, `route: '/new-session'`, `prepare: openAdvanced`
- Order in the `start-session` array becomes: start → game-setup → stakes → optional-details → **advanced-checkboxes** → submit-session → live steps.

### Visual / styling
No changes to the tour box, gold spotlight, or button styling — the existing OnboardingTour component renders all steps with the same styling, so the consolidated step inherits the look automatically.

### Out of scope
- No changes to checkbox layout, labels, or form behavior.
- No changes to localStorage step persistence (existing users mid-tour will simply skip past the removed indices on next render).