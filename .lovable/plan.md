

## Add "Auto-Renewable Subscription · Cancel Anytime" Below Legal Links

### Problem
The text exists only inside the mobile purchase button section (line 220). It is missing from below the Privacy Policy / Terms of Use links at the bottom of the page (line 345), where it needs to appear for App Store compliance.

### Fix
In `src/pages/Subscription.tsx`, add the following line after the legal links div (after line 345):

```tsx
<p className="text-center text-xs text-muted-foreground mt-2 pb-2">
  Auto-Renewable Subscription · Cancel Anytime
</p>
```

This places it directly below the "Privacy Policy • Terms of Use" links, visible on all platforms.

Single file, one line addition.

