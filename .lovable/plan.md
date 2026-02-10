

# Add Third Chip Button (Coach Connection)

## Overview
Add a "Coach/Network" poker chip button alongside the existing Player Card and My Notes chips, with conditional navigation based on whether the user has a connected coach.

## Changes

### 1. Copy the uploaded chip image to project assets
- Copy `user-uploads://image-389.png` to `src/assets/chip-coach.png`

### 2. Update `src/pages/Index.tsx`

**Imports to add:**
- `import chipCoach from '@/assets/chip-coach.png';`
- `import { useCoachStudent } from '@/context/CoachStudentContext';`

**Logic to add:**
- Destructure `connectedCoaches` from `useCoachStudent()`
- Create a `handleCoachChipClick` handler:
  - If `connectedCoaches.length > 0`: navigate to `/coach-dashboard`
  - If no connected coaches: navigate to `/player-dashboard?openConnect=true` (or similar query param to auto-open the connect popup)

**Template change (line 147):**
Add a third button in the existing chip row, identical styling to the other two:

```tsx
<div className="flex justify-center gap-6 -mt-28 w-full">
  {/* Player Card chip */}
  <button ...>
    <img src={chipPlayerCard} ... className="w-32 h-auto object-contain" />
  </button>
  {/* Coach/Network chip (NEW) */}
  <button
    onClick={handleCoachChipClick}
    className="transform transition-all hover:scale-105 active:scale-95 focus:outline-none"
    aria-label="Coach Network"
  >
    <img src={chipCoach} alt="Coach Network" className="w-32 h-auto object-contain" draggable={false} />
  </button>
  {/* My Notes chip */}
  <button ...>
    <img src={chipMyNotes} ... className="w-32 h-auto object-contain" />
  </button>
</div>
```

### 3. Handle auto-open on PlayerDashboard (if needed)
- In the PlayerDashboard page, read the `openConnect` query param
- If present, auto-open the "Connect with Coach" section/modal on mount
- This ensures the "no coach" flow lands the user directly at the connection prompt

## What stays the same
- All existing chip sizes, styles, layout spacing, and functionality
- No changes to coaching context, dashboard pages, or other components beyond the navigation target

