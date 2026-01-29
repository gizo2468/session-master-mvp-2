

## Replace "Start / New Session" Main Button Icon

This plan replaces the current circular stopwatch button on the home screen with the new premium shield icon you provided.

### What Changes

The current button is built with CSS gradients and shapes to create a stopwatch appearance. It will be replaced with your new premium shield image while keeping all navigation functionality intact.

### Implementation Steps

1. **Copy the new icon to the project**
   - Save the uploaded image to `src/assets/new-session-button.png`
   - This follows the existing pattern used for other assets (championship trophies, etc.)

2. **Update the NewSessionButton component**
   - Import the new image asset
   - Replace the complex CSS-based stopwatch design with a simple image
   - Keep the same button wrapper with:
     - Same click handler (navigates to `/new-session`)
     - Same accessibility attributes
     - Same hover/active transitions
     - Same touch area and responsiveness

### Technical Details

The updated component will:
- Use an `<img>` tag with the new shield icon
- Maintain the centered layout with the same container width
- Keep hover effects (scale/translate transitions)
- Preserve focus ring styling for accessibility
- Remove all the CSS shapes (stopwatch ring, crown, tick marks) since they're no longer needed

### Files to Modify

| File | Change |
|------|--------|
| `src/assets/new-session-button.png` | New file - the uploaded shield icon |
| `src/components/NewSessionButton.tsx` | Replace CSS stopwatch with image-based button |

### What Stays the Same

- Click behavior (navigates to `/new-session`)
- Button position on home screen
- Touch/click area
- Hover and focus interactions
- Error handling fallback navigation

