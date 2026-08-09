Fix Set Blinds button placement

Move the "Set Blinds" button onto the same horizontal row as the "Hero Stack" BB input in the Add New Hand modal.

Final layout inside the Cards section:
```text
Hero Stack: [input] BB [Set Blinds button]
```

Keep the Set Blinds dialog state and save logic unchanged.

Approach:
1. In `src/components/poker/HandFormSections/SetBlindsSection.tsx`, add the Hero Stack BB input from `CardSelectionSection` and render the label, input, "BB" suffix, and the existing "Set Blinds" button in a single `flex items-center` row.
2. Remove the Hero Stack BB input block from `src/components/poker/HandFormSections/CardSelectionSection.tsx` so it is only rendered once.
3. In `src/components/poker/HandForm.tsx`, remove the separate `SetBlindsSection` call below the `CardSelectionSection` since the button now lives inside the Hero Stack row.
4. Preserve all existing colors, sizes, styling, button variant, and the Set Blinds dialog behavior.

Verification: Build the project and confirm the button is aligned side-by-side with the Hero Stack input in the mobile preview.