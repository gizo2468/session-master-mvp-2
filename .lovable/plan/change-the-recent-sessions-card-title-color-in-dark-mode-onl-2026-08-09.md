Change the Recent Sessions card title color in dark mode only.

In `src/components/SessionCard.tsx`, the session title currently renders as `dark:text-primary` with a gold drop shadow. Update the dark-mode styling of the `<h3>` title to a soft, bright off-white while keeping the light-mode `text-gray-600` unchanged. Leave font size, weight, spacing, layout, and all other card styling untouched.

Recommended class replacement: replace `dark:text-primary dark:drop-shadow-[0_0_6px_rgba(212,175,55,0.35)]` with `dark:text-[#F5F5F0]`.