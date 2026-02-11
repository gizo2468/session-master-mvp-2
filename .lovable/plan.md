

## Fix: Constrain START SESSION Chip Hit Area to Visible Circle

### Problem
The button wrapping the START SESSION image is as large as the full image (28rem / 32rem wide). Even with `rounded-full overflow-hidden`, the circular clip is inscribed in that large rectangle -- so the clickable circle extends well beyond the visible chip artwork (which is smaller and centered within the image's transparent padding).

### Solution
Separate the visual layer (image) from the interactive layer (click target):

1. Make the outer wrapper a non-interactive container that holds the image at its current visual size
2. Overlay an absolutely-positioned circular button on top, sized to match only the visible chip artwork
3. The image stays exactly where it is visually -- zero layout/design changes

### Changes in `src/components/NewSessionButton.tsx`

Replace the current single `<button>` wrapping the `<img>` with:

```
<div className="relative flex justify-center w-full">
  {/* Visual layer - not clickable */}
  <div className="pointer-events-none">
    <img 
      src={newSessionIcon} 
      alt="Start Session" 
      className="w-[28rem] sm:w-[32rem] h-auto object-contain"
      draggable={false}
    />
  </div>
  {/* Hit area - circular, sized to match the visible chip only */}
  <button
    onClick={handleClick}
    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
               w-[55%] aspect-square rounded-full 
               bg-transparent cursor-pointer 
               transition-transform hover:scale-105 
               focus:outline-none focus-visible:outline-none"
    style={{ WebkitTapHighlightColor: 'transparent' }}
    aria-label="New session"
  />
</div>
```

Key details:
- The image container has `pointer-events-none` so clicks pass through transparent areas
- The button overlay is `w-[55%]` of the image width (roughly matching the chip circle), centered with absolute positioning
- `aspect-square rounded-full` makes it a perfect circle
- The exact percentage (55%) may need minor tuning -- the visible chip is roughly 55-60% of the total image width
- Hover scale effect stays on the button (invisible, so no visual change)

### Files to Modify
- **`src/components/NewSessionButton.tsx`** only -- restructure to separate visual and interactive layers

### What stays the same
- Image size, position, design -- completely unchanged
- Three small chip buttons -- unchanged
- All navigation and functionality -- unchanged
