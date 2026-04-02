

## Add Info/Help Icon with Terminology Popup to Charts Library

### What
Add a small circular info icon (ⓘ) in the top-right of the Charts Library header. Tapping it opens a dialog/sheet with short, beginner-friendly explanations of the main poker terms used on this page.

### Changes

**Single file: `src/pages/ChartsLibrary.tsx`**

1. Add state: `showHelp` (boolean)
2. In the header row (line 81-89), add an info button on the right side:
   - Small `Button variant="ghost" size="icon"` with `Info` lucide icon
   - Styled with a subtle circular border (`rounded-full`)
3. Add a `Dialog` (or `Sheet`) that opens when tapped, containing a clean list of term explanations:

   | Term | Explanation |
   |---|---|
   | RFI | Raise First In — opening the pot with a raise when no one has entered yet |
   | UTG, MP, LJ, HJ, CO, BU, SB, BB | Table positions from earliest to latest |
   | vs UTG / vs MP etc. | How you respond when that position raised before you |
   | 3Bet vs … | Re-raising against an opener from that position |
   | Percentages | The portion of all possible hands included in that range |

4. Dialog uses existing `Dialog` / `DialogContent` components — lightweight, easy to close

### Scope
- No layout or logic changes to the existing matrix or collections
- One file, ~60 lines added

