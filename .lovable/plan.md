

## Plan: Change Game Type + Format selectors to bubble chips

### What changes

**File: `src/components/poker/AddTableForm.tsx`**

**1. Game Type (lines 205-221)** — Replace `RadioGroup` + `RadioGroupItem` with two `<button>` chips styled identically to the Tournament Type chips:

```tsx
<div className="space-y-2">
  <Label>Game Type <span className="text-red-500">*</span></Label>
  <div className="flex flex-wrap gap-2">
    {(['NLH', 'PLO'] as const).map((type) => (
      <button
        key={type}
        type="button"
        onClick={() => setGameType(type)}
        className={`px-3 py-1 rounded-full text-sm cursor-pointer transition-colors ${
          gameType === type
            ? 'bg-poker-gold text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        {type}
      </button>
    ))}
  </div>
</div>
```

**2. Format (lines 224-242)** — Same treatment, replace radio buttons with chip buttons:

```tsx
{!fixedFormat && (
  <div className="space-y-2">
    <Label>Format <span className="text-red-500">*</span></Label>
    <div className="flex flex-wrap gap-2">
      {(['Cash', 'Tournament'] as const).map((f) => (
        <button
          key={f}
          type="button"
          onClick={() => setFormat(f)}
          className={`px-3 py-1 rounded-full text-sm cursor-pointer transition-colors ${
            format === f
              ? 'bg-poker-gold text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {f}
        </button>
      ))}
    </div>
  </div>
)}
```

**3. Tournament Type animation fix (line 253)** — Remove the custom accordion animation classes from `CollapsibleContent` to use native smooth expand:

```tsx
// Before
<CollapsibleContent className="pt-2 overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">

// After
<CollapsibleContent className="pt-2">
```

Same fix on line 387 for Advanced Options collapsible.

### What stays unchanged
- All state, validation, values, labels, submit logic, and layout remain identical.
- Tournament Type chips are untouched.
- The `RadioGroup` import can be removed if no longer used elsewhere in this file (it's still used for Tournament Type, so it stays).

