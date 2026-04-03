

## Update Active Sessions Cards for Dark Mode

### What
Replace the hardcoded green-on-white styling of Active Sessions cards with dark-mode-aware classes that use a subtle green-tinted dark background, proper text colors, and a green-accented glow — while keeping light mode unchanged.

### Single file: `src/components/ActiveSessionsList.tsx`

**Card container (line 43)**
- Current: `bg-green-50 border border-green-200`
- New: `bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800/50 dark:shadow-[0_0px_12px_0_rgba(34,197,94,0.08)]`

**Title (line 48)**
- Current: `text-green-800`
- New: `text-green-800 dark:text-green-300`

**Info text (lines 50, 60-63)**
- Current: `text-gray-600 dark:text-gray-400 dark:text-gray-500`
- New: `text-gray-600 dark:text-gray-400` (remove duplicate dark class)

**Pipe separator (line 62)**
- Current: `text-gray-400 dark:text-gray-500`
- New: `text-gray-400 dark:text-gray-600`

**Delete button (lines 79-80)**
- Current: `hover:bg-red-50`
- New: `hover:bg-red-50 dark:hover:bg-red-950/40`

**Section heading (line ~97 in the parent)**
- Current: `text-green-800`
- New: `text-green-800 dark:text-green-400`

### No other changes
Layout, structure, functionality, and light mode stay identical. Only dark-mode classes are added/updated.

