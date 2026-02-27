

## Plan: Green-tinted card shadows

### Approach
Add a CSS rule in `src/index.css` targeting the Card component's shadow class to apply a subtle green-tinted box-shadow globally. This affects all cards consistently without touching any component files.

### Change: `src/index.css`
Add a single CSS layer rule:
```css
@layer base {
  .shadow-sm {
    box-shadow: 0 1px 3px 0 rgba(53, 101, 77, 0.12), 0 1px 2px -1px rgba(53, 101, 77, 0.08);
  }
}
```
The color `rgb(53, 101, 77)` is the app's `poker-feltGreen` (#35654D). Low opacity keeps it subtle and professional.

### Files changed
- `src/index.css` (add ~4 lines)

