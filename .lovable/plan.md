## Restyle Onboarding Tooltip (Step 1)

Update the typography and formatting of the onboarding tour tooltip to match the requested look: centered text, an explicit line break after "you here!", and a modern sans-serif (Poppins).

### 1. Load Poppins font
File: `index.html`
- Extend the existing Google Fonts `<link>` to also include Poppins weights (400, 600, 700), reusing the already-present `preconnect` so no new network setup is needed.
  - Update href to: `family=Bungee&family=Nunito:wght@400;600;700;800&family=Poppins:wght@400;500;600;700&display=swap`

### 2. Update tooltip in `src/components/onboarding/OnboardingTour.tsx`
- Wrap the tooltip card content with an inline `style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}` so the font change is scoped only to the onboarding tooltip (no global font impact).
- Title `<h3>`:
  - Add `text-center` class.
  - Keep gold (`text-primary`) and bold styling.
- Body `<p>`:
  - Add `text-center` class.
  - Keep dark gray look by switching to `text-foreground/80` (already close; remains dark gray on the white card).
  - Render the body with an explicit line break after the first sentence so Step 1 reads:
    - Line 1: "We're glad to have you here!"
    - Line 2 (after a break): "Before you jump into the action, let's take a quick 30-second tour to show you where everything is and how to track your first winning session."
  - Implementation: split `step.body` on the first `! ` and render the two parts separated by `<br />` (or `<><span>{first}</span><br/><span>{second}</span></>`). This keeps other steps unaffected — they have no `! ` early in the body so they render unchanged.
- Footer row (dots / Skip / Previous / Next): leave as-is so the Next button stays clearly visible and aligned exactly like in the reference image.

### 3. No copy changes
The text content in `src/pages/Index.tsx` already matches the requested wording — only formatting changes inside the tooltip component are needed.

### Notes
- Scoping Poppins via inline `fontFamily` on the tooltip avoids touching `tailwind.config.ts` or the global app typography.
- The line-break logic is keyed off the `! ` pattern, which only appears in Step 1's body, so other steps keep their current single-paragraph layout.