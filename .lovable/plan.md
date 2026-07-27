Plan: Subtle Poker-Themed Background Texture on Live Session Page

Goal
Add a low-contrast, repeating, poker-themed texture behind the white content cards on the Live Session page, using only the existing soft mustard/gold and light gray palette. No other UI changes.

What will change
- `src/pages/LiveSession.tsx` — apply a new CSS background class to the light-mode page wrapper only.
- `src/index.css` — add a new utility class that defines an inline, repeating SVG pattern.

What will not change
- Card colors, button colors, icons, text, spacing, or functionality.
- Dark mode background (remains unchanged).
- Any other page.

Implementation details

1. Create an inline SVG background pattern
- Define a small square tile (e.g. 120 × 120 px) as a CSS `background-image` using a data-URI SVG.
- The tile will contain tiny, cartoon-style, stroke-only poker elements: a chip, a playing card, a suit symbol, and a dealer button “D”.
- Use only the existing color tokens: `poker-gold` / `#D4AF37` and a very light gray (`gray-200` / `#E5E7EB` tone).
- Set opacity to ~8–12% so it reads as a texture, not an illustration.
- Keep all shapes simple and geometric; no realistic shading, no dark fills, no bright colors.
- The tile will repeat seamlessly across the background area.

2. Add a CSS utility class
- Add a class such as `.bg-poker-texture` to `src/index.css` (or a Tailwind `@layer utilities` entry).
- Class: `background-image: url("data:image/svg+xml,..."); background-repeat: repeat; background-size: 120px 120px;`
- Apply only on light backgrounds. To avoid hardcoding white/dark, use a light variant class and apply it only to the light mode wrapper.

3. Apply to Live Session page
- In `src/pages/LiveSession.tsx`, wrap the main page content in a container with the new texture class.
- Apply only when the light theme is active (e.g. use `className="... bg-gray-50 ... bg-poker-texture"` and leave the existing `dark:bg-background` untouched).
- Ensure the pattern sits behind the white cards (`bg-white` cards will cover it naturally).
- Confirm the loading, error, and no-session states do not gain the texture, or if they do, that they remain clean and readable.

Verification
- Build and typecheck the project.
- Visually inspect the Live Session page in light mode at mobile and desktop widths to confirm the texture is subtle, evenly repeating, and does not distract from the cards.
- Confirm dark mode still shows the original dark background.
- Confirm no text contrast or readability issues.
