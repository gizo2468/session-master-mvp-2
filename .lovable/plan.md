

## Add Green Boundary Contour Around the App Frame

### What will change
A thin, elegant green border will be added around the entire app's outer container on every page, giving the interface a visually contained, framed appearance. The green will match the poker felt green (`#35654D`) used throughout the app.

### Approach
The most reliable and non-invasive way is to add the border at the root level in `index.css`, targeting the `#root` element. This ensures every page gets the contour without modifying individual page files.

### Technical Details

**File: `src/index.css`** - Update the `#root` selector (currently in `App.css` but we'll use `index.css` for the base styles):

Actually, since `App.css` already has a `#root` rule, we will update **`src/App.css`** to add:
- `border: 2px solid #35654D` (poker felt green, matching the START SESSION chip green)
- `min-height: 100vh` to ensure the border spans the full viewport
- Remove the existing `max-width`, `margin`, `padding`, and `text-align` rules on `#root` since those are leftover Vite boilerplate that conflict with the app's Tailwind-based layout

**File: `src/App.css`** changes:
- Replace the current `#root` block with a clean border-only rule:
  - `border: 2px solid #35654D`
  - `min-height: 100vh`
  - `box-sizing: border-box`
- Keep all other CSS in the file unchanged (keyframes, etc. are harmless)

### What stays the same
- No layout, spacing, typography, or functionality changes
- No changes to any page component files
- No changes to internal UI elements
- Responsive behavior is preserved (the border simply wraps the viewport edge)
- All clickable areas, scrolling, and padding remain unaffected

