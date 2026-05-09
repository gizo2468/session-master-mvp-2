## Update "Set the Stakes" tooltip text + highlights

In `src/components/onboarding/tourSteps.ts`, update the `body` for the `[data-tour="stakes"]` step to:

```
Enter the **buy-in** of your first table in your session. This is the only field you **must** fill.
```

The existing `**word**` markdown rendering (added in the previous step) will color `buy-in` and `must` in brand gold automatically. No changes to the renderer needed.

**File:** `src/components/onboarding/tourSteps.ts` — single-line body change.