import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { detectDeckType, mapColorToSuit, DeckTypeResult } from './detectDeckType.ts';
import { detectApp } from './detectApp.ts';
import { getAppProfile } from './appProfiles.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ANALYSIS_TIMEOUT = 60000; // 60 seconds

// Dealer button reference image (yellow circle with "D") - PNG format for AI compatibility
const DEALER_BUTTON_REFERENCE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAACXBIWXMAAAsTAAALEwEAmpwYAAADcElEQVRYhe2YS0hUYRiGn3POzJiZOo6XvOQtb5iZqZlpamVZC8tF0SKICBdBixYtW7VoU0ERBEFQC4OgRYsWUYtAKCPT0jS1zEveMi+Z45w5c2bO6R9HZ5xxRktn0aKF38LDfPO9z/f9/3m/jwkhBH+RLP4j8L8F/1rwb5b1egP6dAfhiVQSyQwqlYLQYB+T05MMuuRYXVa8Pj++gJ9gKEREdIxsthGtVvvL+FUikUjIsgzA9Mwss7OzzM3Ps7i4iN/vJxKJ4PP5CAaDBINBpqenvyn8bh1aVxejk5MolUrsdjtarZaC/ALy8vPJzc0lOzubzMxM0tPTSUtLIyUlheTkZJKSkkhMTCQhIQGdTkd8fDzT09O/FJRlGbPJxMjYGJFIhFAoRENjIxkZGdjsdhx2O0qlEqVSiV6vR6PRoFarUalUqFQqlP/rX61Wo1AoiI2NxW63Y7fbWVxc/KmgLMto1GpiYmKQZRm3282b1lYqKis5XFKCRhN95TMzMwQCASKRCOFwGFmWkWUZSZJYW1sjFAohSRKhUIjl5WUmJycJh8M7jl8JPTnCocJCBgYGGB4extHRgbOzk4qyMipOnSI+Pv4rPUmSCIfDK4Jer3clsCzLBAIBlpaWGB8f5+nTp7S3tRGJRHYcvxJ60t+H0+nkytWr3HG5uH3rFg3HjtFQX09eXh7r3yLLMpIk7dpgJBJhfn6ezq4uhoeHf5kLVhvUarVUHTnCk/v3CQQCzMzOojeamHA4eNPaSrm9HJ9PxOPx7CiYkZHBwMAAgiB8k/dVvz1ar6cjPZ2Opibay8u54XTS3t5OS0sL+QUFVFdVLr+zAwWDwePxoFQu/0h+fn65S2RZ3rUrPG4309PTu3Tj7vpcXx+9PV3cczqXnTqPz6W91O8WDAaDuN1uMjMz1++4XC76+vr2JQiQV1BA6ak8Xvt9WM0mBoaG2L+vEIP+xza1m6AoioiiuP56FySKIgqF4ptFvk4rW+TC0hKCIJCbk8OYOErm/v1Y0jPe+319Cj6/Xss+swW3x4NBr+dJaysHDqZicFjQSAv4lqxIIZnQ4gIRSSYcDBJ0e4n4fQT8QbT6GPJMJoymJO601JKd9fndtfUdFEWRtvZ22trasFgs5OTksG/vXoxGI0ajUW2327fYC4CL65/tSy/7+/vp7+/fa/zvl/2/oI+2fABzDzqTiGd+tAAAAABJRU5ErkJggg==';

// Normalize dealer button position strings to canonical seat names
function normalizeDealerSeat(pos?: string | null): string | null {
  if (!pos) return null;
  const s = pos.toLowerCase().replace(/[\s_-]+/g, '');
  if (s.includes('hero') || s.includes('bottomcenter') || s.includes('centerbottom') || s.includes('bottommiddle') || s.includes('middlebottom')) return 'BOTTOM_CENTER';
  if (s.includes('bottomright')) return 'BOTTOM_RIGHT';
  if (s === 'right' || s.includes('middleright')) return 'RIGHT';
  if (s.includes('topright')) return 'TOP_RIGHT';
  if (s.includes('topcenter') || s.includes('centertop') || s.includes('topmiddle') || s.includes('middletop')) return 'TOP_CENTER';
  if (s.includes('topleft')) return 'TOP_LEFT';
  if (s === 'left' || s.includes('middleleft')) return 'LEFT';
  if (s.includes('bottomleft')) return 'BOTTOM_LEFT';
  return null;
}

// Map dealer seat to hero position (clockwise calculation)
function mapDealerSeatToHeroPos(seat: string, playerCount = 6): string | null {
  const sixPlus = playerCount >= 6;
  switch (seat) {
    case 'BOTTOM_CENTER': return 'BTN';
    case 'BOTTOM_RIGHT':  return 'SB';
    case 'RIGHT':         return 'BB';
    case 'TOP_RIGHT':     return 'UTG';
    case 'TOP_CENTER':    return sixPlus ? 'MP' : 'UTG';
    case 'TOP_LEFT':      return sixPlus ? 'MP' : 'CO';
    case 'LEFT':          return 'CO';
    case 'BOTTOM_LEFT':   return 'CO';
    default:              return null;
  }
}

// Server-side EXIF stripping by re-encoding
async function stripEXIF(base64Image: string): Promise<string> {
  try {
    const base64Data = base64Image.split(',')[1] || base64Image;
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const blob = new Blob([bytes], { type: 'image/jpeg' });
    const img = await createImageBitmap(blob);
    
    const canvas = new OffscreenCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context unavailable');
    
    ctx.drawImage(img, 0, 0);
    
    const cleanBlob = await canvas.convertToBlob({ 
      type: 'image/jpeg', 
      quality: 0.85  // Quality 0.85 maintains yellow color fidelity while reducing file size
                     // Higher quality preserved for blurred input images to aid color detection
    });
    
    const buffer = await cleanBlob.arrayBuffer();
    const cleanBase64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    
    return `data:image/jpeg;base64,${cleanBase64}`;
  } catch (error) {
    console.error('EXIF stripping failed, using original image');
    return base64Image;
  }
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  
  // Log request arrival for debugging
  console.log('Request received', {
    method: req.method,
    hasAuth: req.headers.get('authorization') ? 'yes' : 'no',
    origin: origin,
    contentType: req.headers.get('content-type')
  });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { image, heroOverride, dealerOverride } = await req.json();
    
    // Validate image size
    const imageSizeBytes = (image.length * 3) / 4;
    if (imageSizeBytes > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ 
          code: 'FILE_TOO_LARGE',
          error: `Image size (${Math.round(imageSizeBytes / 1024)}KB) exceeds 10MB limit` 
        }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Minimal logging - no images, no PII
    console.log('Processing hand analysis request', { 
      imageSize: Math.round(imageSizeBytes / 1024) + 'KB',
      hasOverrides: !!(heroOverride || dealerOverride)
    });

    // Strip EXIF metadata
    const cleanImage = await stripEXIF(image);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('analyze-poker-hand error: LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          code: 'CONFIG_ERROR',
          error: 'AI service not configured. Please contact support.' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // PHASE 0: Detect poker app (fast pre-scan)
    console.log('Phase 0: Detecting poker app...');
    const appResult = await detectApp(cleanImage, LOVABLE_API_KEY);
    const appProfile = getAppProfile(appResult.appName);
    
    console.log('App detection complete:', {
      app: appResult.appName,
      confidence: appResult.confidence,
      profile: appProfile.description
    });

    // PHASE 1: Pre-analyze deck type and colors (with app context)
    console.log('Phase 1: Detecting deck type...');
    const deckTypeResult = await detectDeckType(cleanImage, LOVABLE_API_KEY, appResult.appName);

    console.log('Deck type result:', {
      type: deckTypeResult.deckType,
      colorScheme: deckTypeResult.colorScheme,
      confidence: deckTypeResult.confidence,
      hasColors: !!deckTypeResult.cardColors
    });


    const systemPrompt = `You are an expert poker hand analyzer with advanced computer vision capabilities, specializing in No-Limit Hold'em (NLH).

DETECTED APP: ${appResult.appName.toUpperCase()} (confidence: ${appResult.confidence.toFixed(2)})
APP PROFILE: ${appProfile.description}

DETECTED DECK TYPE: ${deckTypeResult.deckType}
COLOR SCHEME: ${deckTypeResult.colorScheme || 'standard'}
${(deckTypeResult.deckType === 'color-filled' || deckTypeResult.deckType === 'four-color-alt') ? 'This is a FOUR-COLOR DECK where card background colors indicate suits.' : 'This is a STANDARD DECK with traditional suit symbols.'}

CRITICAL OUTPUT FORMAT RULES - EXTREMELY IMPORTANT:

1. **Hero Cards Format** (MUST be valid JSON array):
   ✅ CORRECT: [{"rank": "5", "suit": "s"}, {"rank": "5", "suit": "c"}]
   ❌ WRONG: "[{'rank': '5', 'suit': 's'}, {'rank': '5', 'suit': 'c'}]"
   ❌ WRONG: "5s5c"
   ❌ WRONG: ["5s", "5c"]
   
   - Use double quotes for property names and values
   - Each card MUST be an object with "rank" and "suit" properties
   - Return as a JavaScript array of objects, NOT a string

2. **Rank Format**: Single character uppercase
   - Face cards: A, K, Q, J, T (ten)
   - Number cards: 9, 8, 7, 6, 5, 4, 3, 2

3. **Suit Format**: Single lowercase letter ONLY
   - h = hearts (♥)
   - d = diamonds (♦)
   - s = spades (♠)
   - c = clubs (♣)

4. **Board Cards**:
   - Flop: Array of 3 card objects: [{"rank": "K", "suit": "h"}, {"rank": "9", "suit": "d"}, {"rank": "2", "suit": "c"}]
   - Turn: Single card object: {"rank": "A", "suit": "s"}
   - River: Single card object: {"rank": "Q", "suit": "h"}

CRITICAL CARD DETECTION INSTRUCTIONS:

1. HERO CARDS (HIGHEST PRIORITY):
   - Location: ALWAYS directly underneath the player avatar/name at the ABSOLUTE BOTTOM-CENTER of the screen
   - Spatial Rule: The hero player is positioned at the vertical center of the bottom edge (horizontally centered)
   - Key Identifiers:
     * Player avatar/name is directly centered on the bottom edge of the table
     * Cards appear DIRECTLY BELOW this centered player position
     * These cards may have a "WIN" highlight, dealer button, or position badge nearby
     * Ignore cards that are bottom-left, bottom-right, or at the sides - these belong to villains
   - Hero Name/Nickname Extraction (CRITICAL):
     * Look for the username/nickname text displayed ABOVE or ON the hero's avatar at the bottom-center position
     * This text is typically displayed prominently near the hero's cards and chip stack
     * Extract the EXACT visible username (examples: "IsheepIT", "Player123", "PokerPro", etc.)
     * If the name is partially obscured or not visible, return null for hero.name
     * This name may be displayed in various fonts/colors depending on the poker client
   - Visual Characteristics:
     * Usually 2 cards side-by-side
     * May be partially obscured by "WIN" text overlay, yellow highlights, or dealer buttons
     * Look THROUGH overlays - the actual card rank/suit is still visible underneath
   - Detection Priority:
     1. First, identify the bottom-center player position (horizontally centered on bottom edge)
     2. Then locate the 2 cards directly beneath that player's avatar
     3. Read the card ranks/suits even if partially obscured by overlays
   - Format: MUST return as array: [{"rank": "9", "suit": "d", "confidence": 0.95}, {"rank": "7", "suit": "h", "confidence": 0.95}]
   - Suit notation: Use ONLY single lowercase letters: h, d, s, c
   - Only use "hidden" if absolutely no cards exist at the bottom-center position

2. BOARD CARDS (SECOND PRIORITY):
   - Location: ALWAYS in the horizontal CENTER of the table (middle of the felt/green area)
   - Count: 0 (preflop), 3 (flop), 4 (flop+turn), or 5 (all streets)
   - Key Challenge: Board cards are FREQUENTLY obscured by:
     * Pot size displays (e.g., "43.6 BB")
     * Chip stack graphics
     * "WIN" labels
     * Tournament information banners
   - Detection Strategy:
     * Scan the CENTER horizontal band of the image (middle 30% of vertical space)
     * Look for 3-5 card-shaped rectangles arranged in a horizontal line
     * Read card ranks/suits THROUGH overlays - the cards are still visible underneath
     * If you see partial cards (only top or bottom visible), still identify them
     * Common pattern: White/light rectangular cards with rank in corner and suit symbol
   - Format:
     * flop: [{"rank": "8", "suit": "h"}, {"rank": "2", "suit": "c"}, {"rank": "A", "suit": "s"}]
     * turn: {"rank": "9", "suit": "h"}
     * river: {"rank": "6", "suit": "s"}
   - Critical: ALWAYS detect board cards if present, even if partially hidden

3. VILLAIN CARDS:
   - All other visible hole cards belong to villains (not the hero)
   - Typically located at: top-left, top-center, top-right, bottom-left, bottom-right
   - May be face-down (hidden) or revealed at showdown
   - Examples from screenshot:
     * Bottom-left player: 5♠5♣ (clearly visible - this is NOT the hero)
     * Top-left player: Face-down (hidden)
     * Other positions: Face-down or revealed

4. HANDLING WIN OVERLAYS:
   - When you see a "WIN" label or yellow highlight on cards:
     * This indicates the winning hand at showdown
     * The actual card ranks/suits are STILL VISIBLE underneath the overlay
     * Read the cards normally - don't be confused by the highlight
     * The win overlay does NOT change which player is the hero

5. CARD NOTATION REFERENCE:
   Ranks: A (Ace), K (King), Q (Queen), J (Jack), T (Ten), 9-2 (pip cards)
   Suits: h (hearts ♥), d (diamonds ♦), s (spades ♠), c (clubs ♣)
   
${(deckTypeResult.deckType === 'color-filled' || deckTypeResult.deckType === 'four-color-alt') ? `
   CRITICAL: FOUR-COLOR DECK DETECTED (Two-Phase Detection)
   Color scheme: ${deckTypeResult.colorScheme}
   This image uses a four-color deck where suits are indicated by CARD BACKGROUND COLOR.
   
   PRE-ANALYSIS PHASE COMPLETE:
   Card colors have already been detected in order: ${deckTypeResult.cardColors?.join(', ') || 'none'}
   The suits will be AUTOMATICALLY ASSIGNED based on these pre-detected colors.
   
   YOUR TASK (PHASE 2): Detect ONLY the card RANKS
   - Focus on detecting: A, K, Q, J, T, 9, 8, 7, 6, 5, 4, 3, 2
   - For suits, you can return any value (h/d/c/s) - it will be corrected automatically
   - The backend will map colors to suits based on detected scheme
   
   WHY THIS APPROACH:
   - Pre-analysis color detection is 100% accurate (already verified)
   - Rank detection (A, K, Q, etc.) is straightforward and reliable
   - Separating color and rank detection eliminates ambiguity
   - No risk of red→clubs or other color misclassification
   
   JUST DETECT RANKS - we'll handle the suits programmatically!
` : `
   DETECTION METHOD: Standard symbol detection
   - Look for traditional suit symbols (♥♦♠♣) on card corners/centers
   - Cards typically have white/light backgrounds
`}

   Example detections:
   - Standard deck: Queen of Clubs = { rank: "Q", suit: "c", confidence: 0.9 }
   - Standard deck: Ace of Hearts = { rank: "A", suit: "h", confidence: 0.95 }
   - Color-filled deck: White "A" on blue background = { rank: "A", suit: "d", confidence: 0.85 }
   - Color-filled deck: White "9" on green background = { rank: "9", suit: "c", confidence: 0.8 }

CRITICAL POSITION DETECTION INSTRUCTIONS:

1. DEALER BUTTON IDENTIFICATION (HIGHEST PRIORITY):
   App-specific dealer button style for ${appResult.appName.toUpperCase()}:
   - Color: ${appProfile.dealerButton.color}
   - Shape: ${appProfile.dealerButton.shape}
   - Text: "${appProfile.dealerButton.text}"
   - Look for this specific style at any seat position
   - If button is unclear, use player actions as hints (BB/SB post blinds)
   
   - CRITICAL: What is NOT a dealer button:
     * "WIN" badges (green/gold text, not circular button)
     * Yellow chip stacks or bet amounts (not circular, not near avatars)
     * Player balance displays or HUD elements (rectangular, not circular)
     * Tournament badges or position indicators (different shapes/colors)
     * Card suit symbols (hearts, diamonds - these are NOT dealer buttons)
   
   - Detection Strategy (FOLLOW THIS EXACT ORDER):
      1. FIRST: Locate the HERO player at BOTTOM-CENTER (the player whose cards are directly below the centered avatar at the bottom edge)
      2. SECOND: Look for the bright yellow circular "D" button near the HERO's avatar/name
      3. CRITICAL RULE: If you see the dealer button ON or NEXT TO the HERO's avatar → ALWAYS return dealerButton.position="BOTTOM_CENTER" and hero.position="BTN" with confidence=0.95
      4. If dealer button is NOT on hero, scan ALL OTHER visible player avatars clockwise starting from hero's right
      5. For each player, check for the yellow circular "D" badge near their avatar
      6. When found, return the EXACT spatial location using these terms ONLY:
         * "BOTTOM_CENTER" = hero position (bottom edge, horizontally centered)
         * "BOTTOM_RIGHT" = one seat clockwise from hero (bottom-right area)
         * "RIGHT" = right side of table (middle-right vertically)
         * "TOP_RIGHT" = top-right area
         * "TOP_CENTER" = top edge center
         * "TOP_LEFT" = top-left area
         * "LEFT" = left side of table (middle-left vertically)
         * "BOTTOM_LEFT" = bottom-left area (one seat counter-clockwise from hero)
      7. Confidence scoring:
         * confidence = 0.9-1.0: Button clearly visible, matches all visual characteristics, no obstruction
         * confidence = 0.7-0.9: Button visible but partially obscured by HUD/overlays
         * confidence = 0.5-0.7: Button detected but visual quality poor or uncertainty about exact position
         * confidence < 0.5: No clear button detected or severe obstruction
      8. If confidence < 0.5, set dealerButton.requiresManualSelection = true

2. POSITION CALCULATION FROM DEALER BUTTON:
   - Use CLOCKWISE movement from dealer button:
     * Dealer Button position = BTN
     * Next clockwise = SB (Small Blind)
     * Next clockwise = BB (Big Blind)
     * For 6+ handed: Next = UTG, then MP, then CO (cutoff, one seat before dealer)
     * For 5-handed: Skip MP, go directly BTN → SB → BB → UTG → CO
   
   - Spatial Mapping (assuming hero is always bottom-center):
     * If dealer button on hero (bottom-center) → hero.position = "BTN"
     * If dealer button on bottom-right → hero.position = "SB"
     * If dealer button on right-side → hero.position = "BB"
     * If dealer button on top-right → hero.position = "UTG" (or "MP" for 6+ handed)
     * If dealer button on top-left → hero.position = "CO" or "MP"
     * If dealer button on bottom-left → hero.position = "CO"

3. FALLBACK DETECTION (if dealer button not visible):
   - Look at the PREFLOP ACTION panel or bet history:
     * Identify which players posted SB and BB (usually shown as "posts SB", "posts BB")
     * The player TWO seats clockwise from the hero posted BB
     * Calculate hero position based on blind positions
   
   - Use TABLE GEOMETRY as last resort:
     * Count total visible players (playerCount)
     * Identify seat positions relative to hero (bottom-center)
     * Use typical seating arrangements to infer position
   
   - Confidence levels:
     * Dealer button clearly visible: confidence = 0.9-1.0
     * Inferred from action sequence: confidence = 0.6-0.8
     * Inferred from geometry: confidence = 0.4-0.6
     * Completely uncertain: position = "UNKNOWN", confidence < 0.4

4. POSITION OUTPUT RULES:
   - Always use standard abbreviations: "BTN", "SB", "BB", "UTG", "MP", "CO"
   - If confidence < 0.5, set position = "UNKNOWN" instead of guessing
   - Add warning to metadata if position detection confidence is low
   - Record dealer button position separately in dealerButton.position field

5. COMMON SCENARIOS:
   - Scenario A: Dealer button visible on hero's avatar → position = "BTN", confidence = 0.95
   - Scenario B: Dealer button on player to hero's right → position = "SB", confidence = 0.9
   - Scenario C: Dealer button obscured by HUD, but SB/BB posts visible in action → use blind positions, confidence = 0.7
   - Scenario D: No dealer button, no blind info, HUD overlay → position = "UNKNOWN", confidence = 0.3

3. Dealer Button: Detect the dealer button position. Return confidence score. If confidence < 0.7 or button not visible, set requiresManualSelection=true.

4. Confidence Scoring: Return confidence (0-1) for every detected entity. Use "hidden" for cards you cannot see (e.g., villain cards face-down). NEVER hallucinate - if you're unsure, mark confidence as low and add to warnings.

5. Game Type Detection: Only process NLH hands. If PLO or other variants detected, return gameType with high confidence.

6. Units: Return all amounts in chips. Only convert to BB if blind level is clearly visible and confident.

7. Format Detection: Mark as "tournament" only if clear indicators (prize pool, tournament name). Otherwise "cash" or "unknown".

8. Position Detection: Use dealer button to determine positions clockwise: BTN → SB → BB → UTG → MP → CO. Mark as "UNKNOWN" if uncertain.

9. Player Count: COUNT ALL VISIBLE PLAYERS at the table (hero + villains). This is critical information.

10. Action Sequences: For each street (preflop, flop, turn, river), extract ALL player actions in CHRONOLOGICAL order. Include:
    - Player position or seat
    - Action type: fold, check, call, bet, raise, all-in
    - Bet/raise amounts when visible
    - Mark unclear amounts as null but still record the action type

11. HERO ACTION DETECTION - YELLOW BACKGROUND IN ACTION PANEL (CRITICAL):
    
    SPATIAL CONSTRAINT - WHERE TO LOOK:
    - ONLY scan the ACTION HISTORY PANEL for yellow backgrounds
    - This panel is typically located:
      * LEFT side of screen (most common - vertical list of actions)
      * BOTTOM of screen (horizontal action log)
      * Sometimes in a semi-transparent overlay on the left or bottom edge
    - The panel shows text like: "Player folds", "Raise 2 BB", "Call", etc.
    - DO NOT look for yellow in these areas (these are NOT action panels):
      * Center of table (cards, pot, board)
      * Player avatars/names at seats (top, sides, bottom)
      * WIN badges or overlays on cards
      * Chip stacks or bet amounts in the center
      * Tournament info headers
    
    VISUAL CHARACTERISTICS OF HERO ACTIONS (ENHANCED FOR BLURRED IMAGES):
    - Background color: Bright yellow/gold (#FFD700, #FFC107, #FFEB3B, or similar)
    - The yellow highlight covers the ENTIRE ROW/LINE of the action text
    - Text on yellow background is typically black or dark gray
    - These yellow rows appear ONLY in the action history panel
    - Non-hero actions have NO background (transparent/default) or gray background
    
    BLURRED IMAGE HANDLING (CRITICAL):
    When the image is slightly blurred or low quality:
    - Yellow backgrounds may appear faded, washed out, or orangish
    - Accept color ranges: #FFD700 to #FFA500 (pure yellow to orange-yellow)
    - Look for RELATIVE brightness: Hero action rows should be NOTICEABLY BRIGHTER than non-hero rows
    - Even if the yellow is unclear, the row will have a LIGHTER background compared to surrounding rows
    - Texture/pattern: Yellow rows often have a subtle glow or highlight effect even when blurred
    - If you see ANY warm-toned highlighting (yellow/gold/orange/cream) in the action panel, treat it as a Hero action
    
    DETECTION STRATEGY (OPTIMIZED FOR BLURRED SCREENSHOTS):
    1. First, LOCATE the action history panel:
       - Look for a vertical or horizontal list showing sequential poker actions
       - Common identifiers: "Preflop:", "Flop:", "Turn:", "River:" headers
       - Or a continuous list like: "Player A folds", "Player B raises", etc.
    
    2. Once you've identified the action panel, scan ONLY within that panel area
    
    3. For each line/row in the action panel, check MULTIPLE signals:
       PRIMARY SIGNAL - Yellow Background:
       - If the row has a CLEAR YELLOW BACKGROUND → attribute to "Hero" (confidence: 0.9-1.0)
       
       SECONDARY SIGNAL - Relative Brightness (for blurred images):
       - If the row is NOTICEABLY BRIGHTER than neighboring rows → likely Hero action (confidence: 0.7-0.8)
       - Compare background luminance: Hero rows should "pop out" even if color is unclear
       
       TERTIARY SIGNAL - Pattern Recognition:
       - If alternating pattern exists (yellow row, gray row, yellow row) → yellow rows are Hero
       - If player names match bottom-center player → those are Hero actions
       
       NON-HERO SIGNAL:
       - If the row has NO background or GRAY/DARK background → villain action
    
    4. Preserve chronological order (top-to-bottom or left-to-right)
    
    5. FOR BLURRED IMAGES: Prioritize detecting ALL highlighted rows, even with lower confidence
       - Better to mark a Hero action with 0.6 confidence than miss it entirely
       - The UI will display confidence warnings for low-confidence detections
    
    CRITICAL RULES:
    - Yellow WIN badges near cards are NOT hero actions
    - Yellow player name highlights at seats are NOT hero actions
    - Yellow chip amounts in the pot are NOT hero actions
    - ONLY yellow backgrounds IN THE ACTION PANEL indicate hero actions
    
    OUTPUT FORMAT:
    For each street's action sequence, return:
    [
      {
        "player": "Hero",
        "action": "raise",
        "amount": 2,
        "confidence": 0.95
      },
      {
        "player": "ZnowutenR",
        "action": "fold",
        "confidence": 0.9
      },
      {
        "player": "Hero",
        "action": "fold",
        "confidence": 0.95
      }
    ]
    
    CONFIDENCE SCORING (ADJUSTED FOR BLURRED IMAGES):
    - 0.9-1.0: Yellow background CLEARLY visible in action panel, text readable, sharp image
    - 0.7-0.9: Yellow visible but image is slightly blurred OR text partially obscured
    - 0.6-0.7: Image blurred but row is NOTICEABLY BRIGHTER than surrounding rows (relative detection)
    - 0.5-0.6: Very blurred but warm-toned highlighting visible (yellow/gold/orange glow detected)
    - 0.4-0.5: Uncertain - row may have slight brightness difference but cannot confirm
    - <0.4: Cannot identify any highlighting pattern
    
    CRITICAL FOR BLURRED IMAGES:
    - DO NOT require perfect yellow color detection
    - Focus on RELATIVE BRIGHTNESS and CONTRAST between rows
    - Even faded or washed-out yellow should be detected with 0.6+ confidence
    - If you detect ANY pattern of alternating bright/dark rows in action panel, mark bright rows as Hero
    
    FALLBACK DETECTION FOR VERY BLURRED IMAGES:
    If yellow backgrounds are too degraded to detect reliably, use these fallback strategies:
    1. Player Name Matching: If action text includes the hero's username (from bottom-center), mark as Hero
    2. Action Pattern: If you see clear "fold/call/raise" actions but cannot determine colors:
       - Look for the hero's username in the action text
       - Match bet amounts with hero's chip stack changes
       - Identify which seat position matches the bottom-center player
    3. Minimum Detection: ALWAYS attempt to detect at least ONE Hero action per street where actions exist
       - If you see 5+ actions on a street and detect zero Hero actions, re-scan with lower threshold
       - Better to include uncertain Hero actions (confidence 0.5+) than miss them entirely
    
    EXAMPLE FROM SCREENSHOT:
    In the action history panel on the left side:
    - Line 1: "Raise 2 BB" with YELLOW BACKGROUND → player: "Hero", action: "raise", amount: 2
    - Line 2: "ZnowutenR folds" with NO BACKGROUND → player: "ZnowutenR", action: "fold"
    - Line 3: "Fold" with YELLOW BACKGROUND → player: "Hero", action: "fold"

IMPORTANT: Always prioritize detecting hero cards (bottom-center) and board cards (center) as these are the most critical for hand analysis.

Return structured data with confidence scores for every field.`;

    const toolDefinition = {
      type: "function",
      function: {
        name: "extract_poker_hand",
        description: "Extract structured poker hand data from screenshot",
        parameters: {
          type: "object",
          properties: {
            gameContext: {
              type: "object",
              properties: {
                gameType: { type: "string", enum: ["NLH", "PLO", "PLO5", "UNKNOWN"] },
                format: { type: "string", enum: ["cash", "tournament", "unknown"] },
                blindLevel: {
                  type: "object",
                  properties: {
                    sb: { type: "number" },
                    bb: { type: "number" }
                  },
                  nullable: true
                },
                confidence: { type: "number", minimum: 0, maximum: 1 }
              },
              required: ["gameType", "format", "confidence"]
            },
            hero: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  nullable: true,
                  description: "Hero's username/nickname visible on screen at bottom-center player position"
                },
                position: { 
                  type: "string",
                  enum: ["BTN", "SB", "BB", "UTG", "MP", "CO", "UNKNOWN"],
                  description: "Hero's table position. Use UNKNOWN if confidence < 0.5"
                },
                cards: {
                  oneOf: [
                    { type: "string", enum: ["hidden"] },
                    {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          rank: { type: "string" },
                          suit: { 
                            type: "string",
                            enum: ["h", "d", "s", "c"],
                            description: "Suit as single letter: h=hearts, d=diamonds, s=spades, c=clubs"
                          },
                          confidence: { type: "number" }
                        }
                      }
                    }
                  ]
                },
                stack: { type: "number" },
                stackUnit: { type: "string", enum: ["chips", "BB"] },
                confidence: { type: "number" }
              }
            },
            dealerButton: {
              type: "object",
              properties: {
                position: { type: "string", nullable: true },
                confidence: { type: "number" },
                requiresManualSelection: { type: "boolean" }
              }
            },
            villains: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  position: { type: "string" },
              cards: {
                oneOf: [
                  { type: "string", enum: ["hidden"] },
                  {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        rank: { type: "string" },
                        suit: { 
                          type: "string",
                          enum: ["h", "d", "s", "c"],
                          description: "Suit as single letter: h=hearts, d=diamonds, s=spades, c=clubs"
                        },
                        confidence: { type: "number" }
                      }
                    }
                  }
                ]
              },
                  stack: { type: "number" },
                  stackUnit: { type: "string" },
                  confidence: { type: "number" }
                }
              }
            },
            board: {
              type: "object",
              properties: {
                flop: { 
                  type: "array", 
                  nullable: true,
                  items: {
                    type: "object",
                    properties: {
                      rank: { type: "string" },
                      suit: { 
                        type: "string",
                        enum: ["h", "d", "s", "c"],
                        description: "Suit as single letter: h=hearts, d=diamonds, s=spades, c=clubs"
                      },
                      confidence: { type: "number" }
                    },
                    required: ["rank", "suit"]
                  }
                },
                turn: { 
                  type: "object", 
                  nullable: true,
                  properties: {
                    rank: { type: "string" },
                    suit: { 
                      type: "string",
                      enum: ["h", "d", "s", "c"],
                      description: "Suit as single letter: h=hearts, d=diamonds, s=spades, c=clubs"
                    },
                    confidence: { type: "number" }
                  },
                  required: ["rank", "suit"]
                },
                river: { 
                  type: "object", 
                  nullable: true,
                  properties: {
                    rank: { type: "string" },
                    suit: { 
                      type: "string",
                      enum: ["h", "d", "s", "c"],
                      description: "Suit as single letter: h=hearts, d=diamonds, s=spades, c=clubs"
                    },
                    confidence: { type: "number" }
                  },
                  required: ["rank", "suit"]
                },
                confidence: { type: "number" }
              }
            },
            actions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  street: { type: "string", enum: ["preflop", "flop", "turn", "river"] },
                  description: { type: "string" },
                  sequence: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        player: { type: "string" },
                        action: { type: "string", enum: ["fold", "check", "call", "bet", "raise", "all-in"] },
                        amount: { type: "number", nullable: true },
                        confidence: { type: "number" }
                      },
                      required: ["player", "action", "confidence"]
                    }
                  }
                },
                required: ["street", "description", "sequence"]
              }
            },
            pot: {
              type: "object",
              properties: {
                size: { type: "number" },
                unit: { type: "string", enum: ["chips", "BB"] },
                confidence: { type: "number" }
              }
            },
            result: {
              type: "object",
              properties: {
                outcome: { type: "string", enum: ["win", "loss", "split", "unknown"] },
                amount: { type: "number" },
                unit: { type: "string" },
                summary: { type: "string" },
                confidence: { type: "number" }
              }
            },
            metadata: {
              type: "object",
              properties: {
                playerCount: { type: "number", minimum: 2, maximum: 10 },
                heroOverrideAvailable: { type: "boolean" },
                warnings: { type: "array", items: { type: "string" } },
                deckType: { 
                  type: "string", 
                  enum: ["standard", "color-filled", "unknown"],
                  description: "Type of poker deck detected in the image"
                },
                deckTypeConfidence: { 
                  type: "number",
                  description: "Confidence score for deck type detection (0-1)"
                },
                detectedColors: {
                  type: "array",
                  items: { type: "string" },
                  description: "For color-filled decks, the dominant colors detected on each card"
                }
              },
              required: ["playerCount", "warnings"]
            }
          },
          required: ["gameContext", "hero", "dealerButton", "board", "actions", "result", "metadata"]
        }
      }
    };

    // Helper to build messages with or without reference image
    const buildMessages = (includeReference: boolean) => {
      const userContent = [];
      
      if (includeReference) {
        userContent.push({
          type: 'image_url',
          image_url: { 
            url: DEALER_BUTTON_REFERENCE,
            detail: 'low'
          }
        });
      }
      
      userContent.push({ 
        type: 'text', 
        text: includeReference 
          ? `DEALER BUTTON REFERENCE: The first image shows what the dealer button looks like (bright yellow circle with "D"). Find THIS EXACT icon in the poker table screenshot (second image).

CRITICAL: Detect cards with PRECISE spatial positioning.

STEP 1 - HERO CARDS (Bottom-Center Position):
- Find the player avatar that is horizontally CENTERED on the bottom edge of the table
- The hero is the middle player at the bottom row, NOT left or right players
- Look for the 2 hole cards DIRECTLY BENEATH this centered player's avatar
- These cards may have a "WIN" overlay - read the ranks/suits underneath the overlay
- Example: If you see players at bottom-left, bottom-center, and bottom-right, ONLY the bottom-center player is the hero

STEP 2 - BOARD CARDS (Table Center):
- Scan the CENTER of the green felt area for 3-5 cards in a horizontal line
- These cards are often partially covered by pot displays, chip graphics, or text
- Read the card ranks/suits even if obscured by overlays
- Look for white/light rectangular shapes with suit symbols (♥♦♠♣) in the table center

STEP 3 - VILLAIN CARDS:
- All OTHER visible hole cards belong to villains (not the hero)
- Villain positions: top-left, top-center, top-right, bottom-left, bottom-right
- If a villain's cards are face-up, record them; if face-down, mark as "hidden"

SPATIAL REFERENCE:
- Bottom-center = horizontally centered on the bottom edge
- Bottom-left = left side of the bottom edge (NOT hero)
- Bottom-right = right side of the bottom edge (NOT hero)

STEP 4 - POSITION DETECTION (CRITICAL - Use reference image):
- FIRST: Compare the reference dealer button (first image) to the poker table screenshot (second image)
- Look for the BRIGHT YELLOW circular badge with black "D" near any player avatar
- If dealer button is on the HERO (bottom-center player): ALWAYS return hero.position="BTN" and dealerButton.position="BOTTOM_CENTER" or "hero"
- If dealer button is on another player: Return the EXACT spatial location using these terms:
  * "BOTTOM_RIGHT" = player to hero's right
  * "RIGHT" = player on right side of table
  * "TOP_RIGHT" = player at top-right
  * "TOP_CENTER" = player at top-center
  * "TOP_LEFT" = player at top-left
  * "LEFT" = player on left side of table
  * "BOTTOM_LEFT" = player to hero's left
- FALLBACK: If button not clearly visible, check the preflop action panel on the left for "SB" and "BB" blind posts
- LAST RESORT: If no button and no blind info, set hero.position="UNKNOWN" with dealerButton.confidence < 0.5
- DO NOT GUESS: If uncertain, use "UNKNOWN" instead of a wrong position

Clockwise seat mapping (for reference only - you should return spatial location, not calculated position):
- BTN → SB (next clockwise) → BB (next) → UTG → MP → CO → back to BTN
- For 5-handed tables: Skip MP position

${heroOverride ? `Hero position override: ${heroOverride}.` : ''} ${dealerOverride ? `OVERRIDE APPLIED: Dealer button is at ${dealerOverride}. Calculate hero position accordingly.` : ''}

Remember: The hero is ALWAYS the bottom-center player. All other players are villains.`
          : `CRITICAL: Detect cards with PRECISE spatial positioning.

STEP 1 - HERO CARDS (Bottom-Center Position):
- Find the player avatar that is horizontally CENTERED on the bottom edge of the table
- The hero is the middle player at the bottom row, NOT left or right players
- Look for the 2 hole cards DIRECTLY BENEATH this centered player's avatar
- These cards may have a "WIN" overlay - read the ranks/suits underneath the overlay

STEP 2 - BOARD CARDS (Table Center):
- Scan the CENTER of the green felt area for 3-5 cards in a horizontal line
- These cards are often partially covered by pot displays, chip graphics, or text
- Read the card ranks/suits even if obscured by overlays

STEP 3 - VILLAIN CARDS:
- All OTHER visible hole cards belong to villains (not the hero)
- If a villain's cards are face-up, record them; if face-down, mark as "hidden"

STEP 4 - POSITION DETECTION:
- Look for the dealer button (bright yellow circle with "D") near any player avatar
- If dealer button is on the HERO (bottom-center player): return hero.position="BTN"
- If dealer button is on another player: Return the EXACT spatial location
- FALLBACK: Check the action panel for "SB" and "BB" blind posts
- LAST RESORT: If uncertain, use "UNKNOWN"

${heroOverride ? `Hero position override: ${heroOverride}.` : ''} ${dealerOverride ? `OVERRIDE APPLIED: Dealer button is at ${dealerOverride}. Calculate hero position accordingly.` : ''}

Remember: The hero is ALWAYS the bottom-center player. All other players are villains.`
      });
      
      userContent.push({ type: 'image_url', image_url: { url: cleanImage } });
      
      return [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ];
    };

    const MODEL_ORDER = ['google/gemini-2.5-flash', 'google/gemini-2.5-pro', 'openai/gpt-5-mini'] as const;
    let attempt = 0;
    let lastError: Error | null = null;
    let lastStatus: number | null = null;
    let lastSnippet: string | null = null;

    while (attempt < MODEL_ORDER.length) {
      const currentModel = MODEL_ORDER[attempt];
      console.log('AI analyze attempt', { attempt: attempt + 1, currentModel });
      
      // Two-phase retry: first with reference, then without if 400 error
      for (const includeRef of [true, false]) {
        if (!includeRef) {
          console.log('Retrying same model without reference image');
        }
        
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT);

          const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: currentModel,
              messages: buildMessages(includeRef),
              tools: [toolDefinition],
              tool_choice: { type: "function", function: { name: "extract_poker_hand" } }
            }),
            signal: controller.signal
          });

          clearTimeout(timeout);

          if (response.status === 429) {
            return new Response(
              JSON.stringify({ 
                error: 'AI analysis rate limit exceeded. Please wait a moment and try again.',
                code: 'RATE_LIMIT'
              }),
              { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          if (response.status === 402) {
            return new Response(
              JSON.stringify({ 
                error: 'AI credits depleted. Please add credits to continue using AI analysis.',
                code: 'CREDITS_DEPLETED'
              }),
              { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          if (!response.ok) {
            const errorText = await response.text();
            const errorSnippet = errorText.substring(0, 200);
            console.error('AI gateway error:', {
              status: response.status,
              model: currentModel,
              attempt: attempt + 1,
              includeReference: includeRef,
              errorSnippet
            });
            
            lastStatus = response.status;
            lastSnippet = errorSnippet;
            lastError = new Error(`AI gateway error: ${response.status}`);
            
            // If 400 with image error and we included reference, retry without it
            if (response.status === 400 && includeRef && 
                (errorSnippet.includes('Failed to extract') || 
                 errorSnippet.includes('unsupported image') ||
                 errorSnippet.includes('formats') ||
                 errorSnippet.includes('Unable to process input image') ||
                 errorSnippet.includes('image_parse_error') ||
                 errorSnippet.includes('invalid_request_error'))) {
              console.log('Image format error detected, will retry without reference');
              continue; // Continue to next phase (includeRef = false)
            }
            
            // Otherwise break the phase loop and move to next model
            break;
          }

          const data = await response.json();
          const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
          
          if (!toolCall) {
            lastError = new Error('No tool call in AI response');
            break; // Move to next model
          }

          const analysisResult = JSON.parse(toolCall.function.arguments);
          analysisResult.metadata.processingTimeMs = Date.now() - startTime;
          
          // Add deck type metadata
          analysisResult.metadata.deckType = deckTypeResult.deckType;
          analysisResult.metadata.deckTypeConfidence = deckTypeResult.confidence;
          if (deckTypeResult.cardColors) {
            analysisResult.metadata.detectedColors = deckTypeResult.cardColors;
          }

          // Validate and fix card format if needed
          const validateAndFixCards = (cards: any): any => {
            // If it's a string that looks like an array, try to parse it
            if (typeof cards === 'string') {
              try {
                // Replace single quotes with double quotes for valid JSON
                const fixed = cards.replace(/'/g, '"');
                const parsed = JSON.parse(fixed);
                return parsed;
              } catch (e) {
                console.error('Failed to parse card string:', cards);
                return 'hidden';
              }
            }
            return cards;
          };

          // Apply validation to hero cards
          if (analysisResult.hero?.cards) {
            analysisResult.hero.cards = validateAndFixCards(analysisResult.hero.cards);
          }

          // Apply to villains
          if (analysisResult.villains && Array.isArray(analysisResult.villains)) {
            analysisResult.villains = analysisResult.villains.map(v => ({
              ...v,
              cards: v.cards ? validateAndFixCards(v.cards) : 'hidden'
            }));
          }

          // Apply to board flop
          if (analysisResult.board?.flop) {
            analysisResult.board.flop = validateAndFixCards(analysisResult.board.flop);
          }

          // Validate hero card detection with spatial reasoning
          if (analysisResult.hero?.cards && Array.isArray(analysisResult.hero.cards)) {
            console.log('Hero cards detected:', {
              cards: analysisResult.hero.cards,
              position: analysisResult.hero.position,
              confidence: analysisResult.hero.confidence
            });
            
            // Per-card debug for color-filled decks
            if (deckTypeResult.deckType === 'color-filled' && deckTypeResult.cardColors) {
              console.info('🎴 Hero card color mapping (debug):', {
                deckType: deckTypeResult.deckType,
                card1: {
                  detected: analysisResult.hero.cards[0],
                  expectedColorIndex: 0,
                  preAnalysisColor: deckTypeResult.cardColors[0],
                  expectedSuit: deckTypeResult.cardColors[0] ? 
                    { red: 'h', blue: 'd', green: 'c', black: 's' }[deckTypeResult.cardColors[0]] : 'unknown',
                  actualSuit: analysisResult.hero.cards[0]?.suit,
                  match: deckTypeResult.cardColors[0] && analysisResult.hero.cards[0] ?
                    ({ red: 'h', blue: 'd', green: 'c', black: 's' }[deckTypeResult.cardColors[0]] === analysisResult.hero.cards[0].suit) : null
                },
                card2: analysisResult.hero.cards[1] ? {
                  detected: analysisResult.hero.cards[1],
                  expectedColorIndex: 1,
                  preAnalysisColor: deckTypeResult.cardColors[1],
                  expectedSuit: deckTypeResult.cardColors[1] ? 
                    { red: 'h', blue: 'd', green: 'c', black: 's' }[deckTypeResult.cardColors[1]] : 'unknown',
                  actualSuit: analysisResult.hero.cards[1]?.suit,
                  match: deckTypeResult.cardColors[1] && analysisResult.hero.cards[1] ?
                    ({ red: 'h', blue: 'd', green: 'c', black: 's' }[deckTypeResult.cardColors[1]] === analysisResult.hero.cards[1].suit) : null
                } : null
              });
            }
            
            // Add warning if confidence is low
            if (analysisResult.hero.confidence < 0.7) {
              analysisResult.metadata.warnings.push(
                'Low confidence in hero card detection. Please verify the bottom-center player cards.'
              );
            }
          }

          // Validate board card detection
          if (analysisResult.board) {
            const boardCardCount = 
              (Array.isArray(analysisResult.board.flop) ? analysisResult.board.flop.length : 0) +
              (analysisResult.board.turn ? 1 : 0) +
              (analysisResult.board.river ? 1 : 0);
            
            console.log('Board cards detected:', {
              flop: analysisResult.board.flop,
              turn: analysisResult.board.turn,
              river: analysisResult.board.river,
              totalCards: boardCardCount,
              confidence: analysisResult.board.confidence
            });
            
            // Per-card debug for board cards (color-filled decks)
            if (deckTypeResult.deckType === 'color-filled' && deckTypeResult.cardColors) {
              const heroCardCount = Array.isArray(analysisResult.hero.cards) ? analysisResult.hero.cards.length : 0;
              console.info('🎴 Board card color mapping (debug):', {
                deckType: deckTypeResult.deckType,
                flop: analysisResult.board.flop?.map((card: any, idx: number) => ({
                  card,
                  colorIndex: heroCardCount + idx,
                  preAnalysisColor: deckTypeResult.cardColors[heroCardCount + idx],
                  expectedSuit: deckTypeResult.cardColors[heroCardCount + idx] ? 
                    { red: 'h', blue: 'd', green: 'c', black: 's' }[deckTypeResult.cardColors[heroCardCount + idx]] : 'unknown',
                  actualSuit: card?.suit,
                  match: deckTypeResult.cardColors[heroCardCount + idx] && card ?
                    ({ red: 'h', blue: 'd', green: 'c', black: 's' }[deckTypeResult.cardColors[heroCardCount + idx]] === card.suit) : null
                })),
                turn: analysisResult.board.turn ? {
                  card: analysisResult.board.turn,
                  colorIndex: heroCardCount + 3,
                  preAnalysisColor: deckTypeResult.cardColors[heroCardCount + 3],
                  expectedSuit: deckTypeResult.cardColors[heroCardCount + 3] ? 
                    { red: 'h', blue: 'd', green: 'c', black: 's' }[deckTypeResult.cardColors[heroCardCount + 3]] : 'unknown',
                  actualSuit: analysisResult.board.turn?.suit,
                  match: deckTypeResult.cardColors[heroCardCount + 3] && analysisResult.board.turn ?
                    ({ red: 'h', blue: 'd', green: 'c', black: 's' }[deckTypeResult.cardColors[heroCardCount + 3]] === analysisResult.board.turn.suit) : null
                } : null,
                river: analysisResult.board.river ? {
                  card: analysisResult.board.river,
                  colorIndex: heroCardCount + 4,
                  preAnalysisColor: deckTypeResult.cardColors[heroCardCount + 4],
                  expectedSuit: deckTypeResult.cardColors[heroCardCount + 4] ? 
                    { red: 'h', blue: 'd', green: 'c', black: 's' }[deckTypeResult.cardColors[heroCardCount + 4]] : 'unknown',
                  actualSuit: analysisResult.board.river?.suit,
                  match: deckTypeResult.cardColors[heroCardCount + 4] && analysisResult.board.river ?
                    ({ red: 'h', blue: 'd', green: 'c', black: 's' }[deckTypeResult.cardColors[heroCardCount + 4]] === analysisResult.board.river.suit) : null
                } : null
              });
            }
            
            if (boardCardCount === 0 && analysisResult.metadata.playerCount > 2) {
              analysisResult.metadata.warnings.push(
                'No board cards detected, but multiple players are visible. Hand may have gone to showdown.'
              );
            }
          }

    // Enhanced color-to-suit mapping with app-aware color schemes
    const isColorFilledDeck = deckTypeResult.deckType === 'color-filled' || deckTypeResult.deckType === 'four-color-alt';
    if (isColorFilledDeck && (deckTypeResult.heroCardColors || deckTypeResult.boardCardColors || deckTypeResult.cardColors)) {
      console.info('🎴 Applying color-to-suit mapping (color-filled deck enforcement)');
      console.info('Using color scheme:', deckTypeResult.colorScheme);
      
      const colorScheme = deckTypeResult.colorScheme || 'ggpoker';
    
    // Capture original suits for scoring (before mapping)
    const originalHeroSuits = analysisResult.hero.cards && Array.isArray(analysisResult.hero.cards) 
      ? analysisResult.hero.cards.map(c => c.suit) : [];
    const originalBoardSuits = [
      ...(analysisResult.board.flop && Array.isArray(analysisResult.board.flop) ? analysisResult.board.flop.map(c => c.suit) : []),
      ...(analysisResult.board.turn ? [analysisResult.board.turn.suit] : []),
      ...(analysisResult.board.river ? [analysisResult.board.river.suit] : [])
    ];
    
    let mappingMethod = 'unknown';
    let heroColors: string[] = [];
    let boardColors: string[] = [];
    
    // PREFERRED: Use grouped arrays if available
    if (deckTypeResult.heroCardColors && deckTypeResult.boardCardColors) {
      mappingMethod = 'grouped';
      heroColors = deckTypeResult.heroCardColors;
      boardColors = deckTypeResult.boardCardColors;
      
      console.info('Using grouped color arrays:', { heroColors, boardColors });
    }
    // FALLBACK: Use legacy cardColors with scoring to determine order
    else if (deckTypeResult.cardColors && deckTypeResult.cardColors.length > 0) {
      const colors = deckTypeResult.cardColors;
      const heroCount = originalHeroSuits.length;
      const boardCount = originalBoardSuits.length;
      
      // Build two candidate mappings
      const heroFirstColors = colors.slice(0, heroCount);
      const heroFirstBoard = colors.slice(heroCount, heroCount + boardCount);
      
      const boardFirstBoard = colors.slice(0, boardCount);
      const boardFirstHero = colors.slice(boardCount, boardCount + heroCount);
      
      // Score each candidate by comparing mapped suits to original suits
      const scoreMapping = (heroColors: string[], boardColors: string[]) => {
        let score = 0;
        
        // Score hero cards
        heroColors.forEach((color, i) => {
          if (i < originalHeroSuits.length) {
            const mappedSuit = mapColorToSuit(color, colorScheme);
            if (mappedSuit === originalHeroSuits[i]) score++;
          }
        });
        
        // Score board cards
        boardColors.forEach((color, i) => {
          if (i < originalBoardSuits.length) {
            const mappedSuit = mapColorToSuit(color, colorScheme);
            if (mappedSuit === originalBoardSuits[i]) score++;
          }
        });
        
        return score;
      };
      
      const heroFirstScore = scoreMapping(heroFirstColors, heroFirstBoard);
      const boardFirstScore = scoreMapping(boardFirstBoard, boardFirstHero);
      
      console.info('Color array ordering scores:', {
        heroFirst: heroFirstScore,
        boardFirst: boardFirstScore,
        totalCards: heroCount + boardCount
      });
      
      // Choose best scoring candidate (prefer board-first in tie)
      if (boardFirstScore >= heroFirstScore) {
        mappingMethod = 'legacy-board-first';
        heroColors = boardFirstHero;
        boardColors = boardFirstBoard;
      } else {
        mappingMethod = 'legacy-hero-first';
        heroColors = heroFirstColors;
        boardColors = heroFirstBoard;
      }
      
      console.info('Selected color mapping:', { method: mappingMethod, heroColors, boardColors });
    }
    
    console.info('Color mapping strategy:', { method: mappingMethod, heroColors, boardColors });
    
    // Apply hero card mapping
    if (analysisResult.hero.cards && Array.isArray(analysisResult.hero.cards) && heroColors.length > 0) {
      for (let i = 0; i < analysisResult.hero.cards.length && i < heroColors.length; i++) {
        const originalSuit = analysisResult.hero.cards[i].suit;
        const mappedSuit = mapColorToSuit(heroColors[i], colorScheme);
        analysisResult.hero.cards[i].suit = mappedSuit;
        console.info(`Hero card ${i+1}: Rank ${analysisResult.hero.cards[i].rank} - Color ${heroColors[i]} → Suit ${mappedSuit} (was: ${originalSuit})`);
      }
    }
    
    // Apply board card mapping
    let boardColorIndex = 0;
    
    // Flop
    if (analysisResult.board.flop && Array.isArray(analysisResult.board.flop)) {
      for (let i = 0; i < analysisResult.board.flop.length && boardColorIndex < boardColors.length; i++) {
        const originalSuit = analysisResult.board.flop[i].suit;
        const mappedSuit = mapColorToSuit(boardColors[boardColorIndex], colorScheme);
        analysisResult.board.flop[i].suit = mappedSuit;
        console.info(`Board flop ${i+1}: Rank ${analysisResult.board.flop[i].rank} - Color ${boardColors[boardColorIndex]} → Suit ${mappedSuit} (was: ${originalSuit})`);
        boardColorIndex++;
      }
    }
    
    // Turn
    if (analysisResult.board.turn && boardColorIndex < boardColors.length) {
      const originalSuit = analysisResult.board.turn.suit;
      const mappedSuit = mapColorToSuit(boardColors[boardColorIndex], colorScheme);
      analysisResult.board.turn.suit = mappedSuit;
      console.info(`Board turn: Rank ${analysisResult.board.turn.rank} - Color ${boardColors[boardColorIndex]} → Suit ${mappedSuit} (was: ${originalSuit})`);
      boardColorIndex++;
    }
    
    // River
    if (analysisResult.board.river && boardColorIndex < boardColors.length) {
      const originalSuit = analysisResult.board.river.suit;
      const mappedSuit = mapColorToSuit(boardColors[boardColorIndex], colorScheme);
      analysisResult.board.river.suit = mappedSuit;
      console.info(`Board river: Rank ${analysisResult.board.river.rank} - Color ${boardColors[boardColorIndex]} → Suit ${mappedSuit} (was: ${originalSuit})`);
      boardColorIndex++;
    }
    
    console.info('✅ Suit correction complete - all cards now match pre-detected colors');
    
    // Post-correction validation
    const allCards = [
      ...(analysisResult.hero.cards && Array.isArray(analysisResult.hero.cards) ? analysisResult.hero.cards : []),
      ...(analysisResult.board.flop && Array.isArray(analysisResult.board.flop) ? analysisResult.board.flop : []),
      ...(analysisResult.board.turn ? [analysisResult.board.turn] : []),
      ...(analysisResult.board.river ? [analysisResult.board.river] : [])
    ].filter(c => c && typeof c === 'object' && 'suit' in c);
    
    const heartCount = allCards.filter(c => c.suit === 'h').length;
    const diamondCount = allCards.filter(c => c.suit === 'd').length;
    const clubCount = allCards.filter(c => c.suit === 'c').length;
    const spadeCount = allCards.filter(c => c.suit === 's').length;
    
    const finalColors = [...heroColors, ...boardColors];
    const redColorCount = finalColors.filter(c => c === 'red').length;
    const blueColorCount = finalColors.filter(c => c === 'blue').length;
    const greenColorCount = finalColors.filter(c => c === 'green').length;
    const blackColorCount = finalColors.filter(c => c === 'black').length;
    
    console.info('Color-filled deck post-correction validation:', {
      totalCards: allCards.length,
      correctedSuits: allCards.map(c => c.suit).join(','),
      detectedColors: finalColors.join(','),
      suitCounts: { hearts: heartCount, diamonds: diamondCount, clubs: clubCount, spades: spadeCount },
      colorCounts: { red: redColorCount, blue: blueColorCount, green: greenColorCount, black: blackColorCount },
      mapping: `red:${redColorCount}→h:${heartCount}, blue:${blueColorCount}→d:${diamondCount}, green:${greenColorCount}→c:${clubCount}, black:${blackColorCount}→s:${spadeCount}`
    });
    
    // Final sanity check - add metadata warning if mismatch
    if (redColorCount !== heartCount || blueColorCount !== diamondCount) {
      console.warn('⚠️ Color-to-suit mismatch detected - may indicate pre-analysis color detection error');
      analysisResult.metadata.warnings.push(
        'Color detection may be inaccurate for this image. Verify card suits manually.'
      );
    }
  }

          // Validate hero position detection
          if (analysisResult.hero?.position) {
            console.log('Hero position detected:', {
              position: analysisResult.hero.position,
              dealerButton: analysisResult.dealerButton?.position,
              dealerConfidence: analysisResult.dealerButton?.confidence,
              heroConfidence: analysisResult.hero.confidence
            });
            
            // Add warning if position confidence is questionable
            if (analysisResult.dealerButton?.confidence < 0.5 || 
                analysisResult.hero.confidence < 0.5) {
              analysisResult.metadata.warnings.push(
                'Position detection has low confidence. Verify dealer button location or use manual override.'
              );
            }
            
            // Cross-validate position with dealer button
            if (analysisResult.dealerButton?.position === 'hero' && 
                analysisResult.hero.position !== 'BTN') {
              console.warn('Position inconsistency: Dealer on hero but position is not BTN');
              analysisResult.metadata.warnings.push(
                'Position inconsistency detected. Dealer button on hero should indicate BTN position.'
              );
            }
          }

          // POST-PROCESSING: Apply deterministic position correction with spatial validation
          const dealerRaw = analysisResult.dealerButton?.position ?? null;
          const dealerConf = analysisResult.dealerButton?.confidence ?? 0;
          const playerCount = analysisResult.metadata?.playerCount ?? 6;
          const normalizedSeat = normalizeDealerSeat(dealerRaw);
          const mapped = normalizedSeat ? mapDealerSeatToHeroPos(normalizedSeat, playerCount) : null;
          
          // SPATIAL VALIDATION: Cross-check dealer position with hero card location
          const heroCardsDetected = analysisResult.hero?.cards !== 'hidden' && 
                                    Array.isArray(analysisResult.hero?.cards) && 
                                    analysisResult.hero.cards.length === 2;
          const heroCardsConf = analysisResult.hero?.confidence ?? 0;
          
          // If hero cards are confidently detected at bottom-center AND dealer is not on hero, 
          // there's likely a spatial conflict that needs resolution
          let spatialConflict = false;
          if (heroCardsDetected && heroCardsConf > 0.75) {
            // Hero cards are clearly at bottom-center, so hero IS the bottom-center player
            if (normalizedSeat && normalizedSeat !== 'BOTTOM_CENTER' && dealerConf < 0.8) {
              console.log('SPATIAL CONFLICT DETECTED: Hero cards clearly at bottom-center but dealer detected elsewhere', {
                dealerDetected: normalizedSeat,
                dealerConf,
                heroCardsConf
              });
              spatialConflict = true;
              
              // If dealer confidence is weak, trust the hero card location more
              // This handles cases where the AI misidentifies the dealer button position
              if (dealerConf < 0.6) {
                console.log('LOW DEALER CONFIDENCE: Cannot reliably determine position from visual cues');
                analysisResult.metadata.warnings.push(
                  'Dealer button detection uncertain. Position may require manual verification.'
                );
              }
            }
          }

          // Validate Hero action attribution
          if (analysisResult.actions && Array.isArray(analysisResult.actions)) {
            analysisResult.actions.forEach(streetAction => {
              if (streetAction.sequence && Array.isArray(streetAction.sequence)) {
                const heroActions = streetAction.sequence.filter(a => a.player === "Hero");
                const totalActions = streetAction.sequence.length;
                
                // Warning: No Hero actions on a multi-action street (likely missed yellow detection)
                if (totalActions > 2 && heroActions.length === 0) {
                  analysisResult.metadata.warnings.push(
                    `No Hero actions detected on ${streetAction.street}. This may indicate: (1) image is too blurred to detect yellow backgrounds, (2) yellow highlighting not present in screenshot, or (3) Hero folded preflop. Please verify the action sequence.`
                  );
                }
                
                // Warning: ALL actions attributed to Hero (likely wrong spatial area scanned)
                if (heroActions.length === totalActions && totalActions > 1) {
                  analysisResult.metadata.warnings.push(
                    `All actions on ${streetAction.street} attributed to Hero - may have scanned wrong area for yellow highlights. Please verify.`
                  );
                }
                
                // Warning: Very low confidence on Hero actions - adjusted threshold for blurred images
                const lowConfidenceHeroActions = heroActions.filter(a => a.confidence < 0.4); // Reduced from 0.5
                if (lowConfidenceHeroActions.length > 0) {
                  analysisResult.metadata.warnings.push(
                    `Low confidence on ${lowConfidenceHeroActions.length} Hero action(s) on ${streetAction.street}. Image may be blurred or action panel partially obscured. Please verify these actions.`
                  );
                }
              }
            });
          }

          console.log('Position override check:', {
            dealerRaw,
            normalizedSeat,
            mapped,
            dealerConf,
            currentHeroPos: analysisResult.hero?.position,
            heroConf: analysisResult.hero?.confidence,
            playerCount
          });

          // RULE 1: FORCE BTN if dealer button is confidently on hero
          if (normalizedSeat === 'BOTTOM_CENTER' && dealerConf >= 0.7) {
            if (analysisResult.hero.position !== 'BTN') {
              console.log('CORRECTING: Dealer on hero, forcing position to BTN');
              analysisResult.metadata.warnings = analysisResult.metadata.warnings.filter(
                w => !w.includes('Position inconsistency')
              );
              analysisResult.metadata.warnings.push('Position corrected to BTN (dealer button on hero).');
            }
            analysisResult.hero.position = 'BTN';
            analysisResult.hero.confidence = Math.max(analysisResult.hero.confidence ?? 0, dealerConf, 0.9);
          }
          // RULE 2: If spatial conflict exists (hero cards visible but dealer elsewhere with low confidence)
          // Trust hero card location and mark position as uncertain
          else if (spatialConflict && dealerConf < 0.6) {
            console.log('SPATIAL CONFLICT RESOLUTION: Setting position to UNKNOWN due to conflicting visual cues');
            analysisResult.hero.position = 'UNKNOWN';
            analysisResult.hero.confidence = Math.max(heroCardsConf * 0.5, 0.4);
            analysisResult.metadata.warnings.push(
              'Position uncertain due to conflicting dealer button detection. Please verify dealer button location manually.'
            );
          }
          // RULE 3: Apply mapped position if dealer confidence is high and no spatial conflict
          else if (mapped && dealerConf >= 0.7 && !spatialConflict) {
            if (analysisResult.hero.position !== mapped) {
              console.log(`CORRECTING: Dealer mapping suggests ${mapped}, overriding from ${analysisResult.hero.position}`);
              analysisResult.metadata.warnings.push(`Position corrected to ${mapped} based on dealer button location.`);
            }
            analysisResult.hero.position = mapped;
            analysisResult.hero.confidence = Math.max(analysisResult.hero.confidence ?? 0, dealerConf);
          } 
          // RULE 4: Medium confidence dealer detection - apply mapping but warn user
          else if (mapped && dealerConf >= 0.5 && dealerConf < 0.7 && !spatialConflict) {
            if (analysisResult.hero.position !== mapped) {
              console.log(`TENTATIVE CORRECTION: Medium confidence dealer suggests ${mapped}`);
              analysisResult.metadata.warnings.push(
                `Position tentatively set to ${mapped} based on dealer button (medium confidence - verify if needed).`
              );
            }
            analysisResult.hero.position = mapped;
            analysisResult.hero.confidence = Math.max(analysisResult.hero.confidence ?? 0, dealerConf);
          }
          // RULE 5: Low confidence dealer but we have mapping - set to UNKNOWN with warning
          else if (mapped && dealerConf < 0.5 && (analysisResult.hero.confidence ?? 0) < 0.7) {
            console.log('LOW CONFIDENCE: Position disagreement, setting to UNKNOWN');
            analysisResult.hero.position = 'UNKNOWN';
            analysisResult.metadata.warnings.push(
              'Position set to UNKNOWN due to low dealer button detection confidence. Manual verification recommended.'
            );
          } 
          // RULE 6: Fallback - use villain SB/BB positions if dealer button not detected
          else if (dealerConf < 0.4) {
            const hasSB = (analysisResult.villains || []).some(v => (v.position || '').toUpperCase() === 'SB');
            const hasBB = (analysisResult.villains || []).some(v => (v.position || '').toUpperCase() === 'BB');
            
            if (hasSB && hasBB) {
              if (analysisResult.hero.position !== 'BTN') {
                console.log('FALLBACK: Inferring BTN from villain SB/BB postings');
                analysisResult.hero.position = 'BTN';
                analysisResult.metadata.warnings.push('Position inferred as BTN from blind postings (dealer button not clearly visible).');
                analysisResult.hero.confidence = Math.max(analysisResult.hero.confidence ?? 0, 0.75);
              }
            } else if ((analysisResult.hero.confidence ?? 0) < 0.5) {
              console.log('FALLBACK: Low confidence and no reliable position data, setting to UNKNOWN');
              analysisResult.hero.position = 'UNKNOWN';
              analysisResult.metadata.warnings.push(
                'Position could not be reliably determined. Please verify dealer button location manually.'
              );
            }
          }


          // Log card detection results for debugging
          console.log('Card detection results:', {
            heroCards: analysisResult.hero.cards,
            heroCardsType: typeof analysisResult.hero.cards,
            boardFlop: analysisResult.board.flop,
            boardTurn: analysisResult.board.turn,
            boardRiver: analysisResult.board.river
          });

          // Minimal analytics - no PII
          console.log('Hand analysis completed', {
            gameType: analysisResult.gameContext.gameType,
            format: analysisResult.gameContext.format,
            processingTimeMs: analysisResult.metadata.processingTimeMs,
            attempt: attempt + 1
          });

          return new Response(
            JSON.stringify(analysisResult),
            { 
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );

        } catch (err: any) {
          lastError = err;
          if (err.name === 'AbortError') {
            console.error('Analysis timeout:', { model: currentModel, attempt: attempt + 1 });
            return new Response(
              JSON.stringify({ 
                error: 'Analysis request timed out. Please try with a clearer or smaller image.',
                code: 'TIMEOUT'
              }),
              { status: 408, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          // If error in phase 2 (without ref), break to next model
          if (!includeRef) {
            break;
          }
          // Otherwise continue to phase 2
        }
      }
      
      // After both phases, move to next model
      attempt++;
      if (attempt < MODEL_ORDER.length) {
        console.log(`Moving to next model`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // All models exhausted
    const finalStatus = lastStatus === 400 ? 400 : (lastStatus && lastStatus >= 500 ? 502 : 500);
    const finalMessage = lastStatus === 400 && lastSnippet?.includes('unsupported')
      ? 'Unsupported image format. Please upload a PNG, JPEG, GIF, or WEBP image.'
      : 'AI gateway error. All models failed to analyze the hand.';
    
    return new Response(
      JSON.stringify({ 
        code: lastStatus === 400 ? 'UNSUPPORTED_IMAGE' : 'AI_GATEWAY_ERROR', 
        error: finalMessage, 
        details: { status: lastStatus, snippet: lastSnippet }
      }),
      { status: finalStatus, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('analyze-poker-hand error:', error instanceof Error ? error.message : 'Unknown error');
    const headers = corsHeaders;

    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Analysis failed. Please try again.',
        code: 'ANALYSIS_ERROR'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
