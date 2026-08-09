# Center + slightly enlarge card placeholders in Add New Hand

## Goal
In the Add New Hand modal, make the two yellow card-back placeholder icons slightly larger and center them horizontally above the card-selection keyboard. Keep all other design, behavior, and spacing intact.

## Files to change
- `src/components/poker/CardSelector.tsx`

## Changes
1. **Slightly enlarge the placeholder card slots**
   - Change the card slot button dimensions from `w-10 h-14 sm:w-12 sm:h-16` to `w-12 h-16 sm:w-14 sm:h-18`.
   - The inner yellow card-back artwork, borders, and colors remain exactly the same.

2. **Center the placeholders above the keyboard**
   - Change the card slots container from left-aligned to center-aligned (`justify-center`) so the two placeholders sit horizontally centered above the keyboard.
   - The card-selection keyboard, labels, modal, and other controls are not modified.

## Out of scope
- Card-back design, colors, borders, selection logic, keyboard styling, modal layout, typography, buttons, and other spacing are unchanged.
