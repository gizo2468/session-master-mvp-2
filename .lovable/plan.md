## Goal
Make the onboarding tour fully locked and stable: no background scrolling, no drifting spotlight, no animated detachment, and correct pre-expansion of Advanced Options before measurement.

## What will change

### 1. Lock the real scrolling surface, not just `body`
The current tour already sets `overflow: hidden` on `html`/`body`, but the app’s main scrollable container is `AppLayout` (`fixed inset-0 overflow-y-auto`). That is why the background can still move and the spotlight drifts.

I will update the tour to lock all relevant scroll roots while it is mounted:
- `document.documentElement`
- `document.body`
- the app scroll container in `AppLayout`

Lock behavior while a tour step is active:
- apply `overflow: hidden`
- apply `height: 100vh`
- apply `touch-action: none`
- apply `overscroll-behavior: none`
- preserve and restore previous inline styles on cleanup
- prevent wheel / touchmove / scroll-key input as a fallback so iOS and nested-scroll cases cannot bypass the lock

To make this reliable, `AppLayout` will expose its scroll root in a stable way (for example via a data attribute), and `OnboardingTour` will target that exact node.

Result: zero page swiping, zero scrollbar movement, zero background drift until the tour closes.

### 2. Remove movement-causing tour behavior and snap to `getBoundingClientRect()`
The tour currently still performs `scrollIntoView({ behavior: 'smooth' })` when a target is off-center, and the tooltip/overlay use animated top/left transitions. Both of those create visible motion and make the tour feel detached.

I will change the tour to:
- stop using smooth `scrollIntoView` during active steps
- measure the target directly from `getBoundingClientRect()`
- render spotlight and tooltip with fixed positioning from that rect
- recalculate instantly on resize, orientation change, and target size changes
- keep `ResizeObserver` on the target
- use rAF scheduling only to batch reads, not to animate movement
- remove top/left transitions from spotlight bands, outline, and tooltip so position updates snap immediately

Result: spotlight and tooltip stay glued to the target with no visible slide or lag.

### 3. Keep tooltip responsive and edge-aware on all devices
The tooltip will remain centered on the target horizontally, but constrained to the viewport.

Placement rules:
- width capped to available screen space, e.g. `max-width: 90vw` / viewport minus side padding
- choose above or below based on available vertical space
- flip to the bottom automatically when there is not enough room above on smaller screens
- clamp left/right so it never runs off-screen
- maintain a fixed gap from the spotlight
- if neither side has enough room, choose the larger side and clamp safely without overlapping the spotlight

Result: tooltip stays readable and fully visible on phone, tablet, and desktop.

### 4. Prepare UI state before measuring `Optional Details`
The `optional-details` tour step already has a `prepare` hook, but I will keep this path explicit and tied to measurement order:
- trigger `onboarding:open-advanced`
- wait for the accordion open state / animation settle
- only then measure the target and render the spotlight/tooltip

If needed, I will harden the settle logic so measurement does not occur until the expanded layout is actually visible.

Result: the spotlight calculates against the final expanded DOM, not the collapsed layout.

## Files to update
- `src/components/onboarding/OnboardingTour.tsx`
  - strict multi-root scroll lock
  - event-level scroll prevention fallback
  - fixed snap-to-target positioning
  - instant recalculation behavior
  - responsive tooltip clamping / flip logic
  - remove motion that causes drift
- `src/components/AppLayout.tsx`
  - expose the real app scroll container so the tour can lock it reliably
- `src/components/onboarding/tourSteps.ts`
  - verify `optional-details` keeps `prepare: openAdvanced`
- `src/pages/SessionForm.tsx`
  - keep / harden the accordion-open listener if measurement timing needs tightening

## Technical notes
- No copy changes
- No button label changes
- No step order changes
- The update stays isolated to onboarding behavior and the app scroll root
- Cleanup will fully restore normal scrolling when the tour closes or is dismissed