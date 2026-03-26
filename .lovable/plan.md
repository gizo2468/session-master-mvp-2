

## Add Legal Links to Subscription Screen

### Change

In `src/pages/Subscription.tsx`, add two text links below the trust section (line 331), before the closing `</div>`:

```tsx
<div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
  <a href="https://sessionmaster.site/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline">
    Privacy Policy
  </a>
  <span>•</span>
  <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" target="_blank" rel="noopener noreferrer" className="underline">
    Terms of Use
  </a>
</div>
```

Place this **outside** the `isMobile` conditional so the links appear on all platforms (App Store compliance requires them regardless). Insert after line 331, before the final `</div>` tags.

Single file, one addition. No changes to pricing, purchase flow, or styling.

