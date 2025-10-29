/**
 * Deck type detection module
 * Pre-analyzes poker screenshots to identify deck style and extract color data
 */

/**
 * Deck type detection result
 */
export interface DeckTypeResult {
  deckType: 'standard' | 'color-filled' | 'unknown';
  confidence: number;
  heroCardColors?: string[];  // Exactly 2 colors for hero cards (left to right)
  boardCardColors?: string[];  // 0-5 colors for board cards (flop L→R, turn, river)
  cardColors?: string[];  // Legacy: all colors in scan order (for backward compatibility)
  detectedCards?: number;  // Number of cards analyzed
  notes?: string;  // Any observations
  appName?: string;  // Detected poker app name
  colorScheme?: 'ggpoker' | 'pokerstars' | 'standard';  // Color mapping scheme
}

/**
 * Detect poker deck type and extract color information
 * This runs as a pre-processing step before main hand analysis
 */
export async function detectDeckType(
  imageBase64: string,
  apiKey: string,
  appName?: string,
  appProfile?: any
): Promise<DeckTypeResult> {
  
  const appHint = appName && appName !== 'unknown' 
    ? `\nDETECTED APP: ${appName.toUpperCase()} - Use app-specific knowledge for deck identification.` 
    : '';

  // Add app-specific hero identification hints
  const heroIdentificationHint = appProfile && appName !== 'unknown' ? `

HERO CARD IDENTIFICATION FOR ${appName.toUpperCase()}:
- App: ${appName}
- Hero highlight color: ${appProfile.heroHighlightColor}
- Hero position: ${appProfile.heroPosition}
- Action panel position: ${appProfile.actionPanelPosition}

CRITICAL SPATIAL RULES FOR HERO DETECTION:
- Look for ${appProfile.heroHighlightColor} highlight/glow/border around the bottom-center player's avatar
- Hero avatar is at ${appProfile.heroPosition} with EXACTLY 2 cards directly below it
- Action panel on ${appProfile.actionPanelPosition} side helps confirm hero orientation
- DO NOT confuse hero cards with villain cards at bottom-left or bottom-right positions
- Hero is ALWAYS the player at the horizontal center of the bottom edge

MUST DETECT EXACTLY 2 HERO CARDS - This is critical for suit mapping accuracy.
` : '';

  const prompt = `You are a poker card color detector. Analyze this screenshot and identify card background colors.${appHint}${heroIdentificationHint}

CRITICAL INSTRUCTION: ALWAYS extract card background colors, EVEN FOR STANDARD DECKS.
This color data is essential for suit validation and error correction.

TASK: Detect deck type AND ALWAYS identify card colors SEPARATELY for hero cards and board cards.

DECK TYPE A - STANDARD SYMBOL DECK:
- Cards have WHITE, CREAM, or LIGHT GRAY backgrounds
- Suits shown as traditional symbols (♥♦♠♣)
- STILL extract color data (may show as "white" or "cream" for standard decks)

DECK TYPE B - COLOR-FILLED DECK (GGPoker/ClubGG style):
- Cards have SOLID COLOR BACKGROUNDS filling the entire card rectangle
- Suits indicated by BACKGROUND COLOR:
  * RED background = Hearts (♥)
  * BLUE background = Diamonds (♦)
  * GREEN background = Clubs (♣)
  * BLACK/DARK GRAY background = Spades (♠)

DECK TYPE C - FOUR-COLOR ALT (PokerStars style):
- Cards have SOLID COLOR BACKGROUNDS with alternative scheme:
  * RED background = Hearts (♥)
  * BLUE background = Diamonds (♦)
  * GREEN background = Clubs (♣)
  * ORANGE/YELLOW background = Spades (♠)

CRITICAL COLOR DETECTION GUIDE:

COLOR SAMPLING STRATEGY (DO NOT CONFUSE WITH RANK TEXT):
- Sample the OUTER 70% of card area (avoid center where rank/suit are printed)
- Look at the BACKGROUND behind the white rank text, NOT the text itself
- For GGPoker/ClubGG: The entire card rectangle has a solid colored background
- White rank numbers (A, K, 8, etc.) should be IGNORED - sample the color BEHIND them

🔴 RED (Hearts):
- Bright red, crimson, cherry red background filling entire card
- RGB roughly (200-255, 0-100, 0-100)
- NOT orange, NOT pink
- Aliases: red, crimson, cherry

🔵 BLUE (Diamonds):
- Sky blue, ocean blue, royal blue background
- RGB roughly (0-100, 100-200, 200-255)
- NOT purple, NOT teal, NOT gray
- Aliases: blue, sky, ocean, azure

🟢 GREEN (Clubs):
- Forest green, emerald green, grass green background
- RGB roughly (0-100, 150-255, 0-100)
- NOT yellow-green, NOT teal
- Aliases: green, emerald, forest

⚫ BLACK/DARK GRAY (Spades):
- Very dark gray, charcoal, pure black background
- RGB roughly (0-80, 0-80, 0-80)
- NOT light gray, NOT blue-gray
- Aliases: black, charcoal, dark

🟠 ORANGE/YELLOW (PokerStars Spades):
- Bright orange or yellow background
- Only for PokerStars four-color decks
- Aliases: orange, yellow, gold

DECK TYPE CLASSIFICATION RULE (LOWERED THRESHOLD):
- If ANY card has a distinctly colored background (red/blue/green/black/orange) → "color-filled" or "four-color-alt"
- Only classify as "standard" if ALL cards have white/cream/light backgrounds
- When in doubt, favor "color-filled" over "standard"

DETECTION PROCESS:
1. Identify HERO CARDS (bottom-center of screen, EXACTLY 2 cards directly below player avatar)
   - Hero is at the horizontal center of the bottom edge (NOT bottom-left or bottom-right)
   - Look for distinctive highlight/glow around this player's avatar
   - Count the cards: must be exactly 2 side-by-side cards
2. Identify BOARD CARDS (center of table, 3-5 cards in horizontal line)
3. For each card, sample MULTIPLE POINTS for accuracy:
   - Sample OUTER 70% of card (edges, corners, top/bottom margins)
   - Avoid center where rank text is printed
   - For hero cards: sample top-left, top-right, bottom-left, bottom-right corners
   - Take the most dominant/consistent color across sample points
   - Ignore white rank text, suit symbols, borders, and overlay elements (WIN badges)
   - Focus on the BACKGROUND FILL COLOR behind all text
4. Classify color using guide above
5. Return colors LEFT TO RIGHT for each group
6. CRITICAL: ALWAYS populate heroCardColors and boardCardColors arrays, even for "standard" decks
7. CRITICAL: Verify hero card count is EXACTLY 2 before returning results

OUTPUT FORMAT (JSON only):
{
  "deckType": "color-filled" | "four-color-alt" | "standard" | "unknown",
  "colorScheme": "ggpoker" | "pokerstars" | "standard",
  "confidence": 0.0-1.0,
  "heroCardColors": ["blue", "blue"],
  "boardCardColors": ["red", "black", "black", "black", "red"],
  "cardColors": ["blue", "blue", "red", "black", "black", "black", "red"],
  "detectedCards": 7,
  "notes": "Hero: 2 cards | Board: 5 cards (flop + turn + river)"
}

EXAMPLES:

Standard Deck:
{
  "deckType": "standard",
  "confidence": 0.95,
  "detectedCards": 5,
  "notes": "White cards with suit symbols"
}

Color-Filled Deck (GGPoker):
{
  "deckType": "color-filled",
  "colorScheme": "ggpoker",
  "confidence": 0.9,
  "heroCardColors": ["blue", "blue"],
  "boardCardColors": ["red", "black", "red"],
  "cardColors": ["blue", "blue", "red", "black", "red"],
  "detectedCards": 5,
  "notes": "GGPoker four-color deck"
}

Four-Color Alt (PokerStars):
{
  "deckType": "four-color-alt",
  "colorScheme": "pokerstars",
  "confidence": 0.9,
  "heroCardColors": ["red", "orange"],
  "boardCardColors": ["blue", "green", "orange"],
  "cardColors": ["red", "orange", "blue", "green", "orange"],
  "detectedCards": 5,
  "notes": "PokerStars four-color deck with orange spades"
}

CRITICAL: Return "red", "blue", "green", "black", or "orange" (lowercase). Group hero and board separately.`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',  // Fast model for quick pre-analysis
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: { url: imageBase64 }
              }
            ]
          }
        ],
        response_format: { type: 'json_object' },  // Force JSON response
        max_tokens: 500  // Keep it short - we only need deck type info
      })
    });

    if (!response.ok) {
      console.warn('Deck type detection failed, will use main analyzer fallback');
      return {
        deckType: 'unknown',
        confidence: 0,
        notes: 'Pre-analysis failed, main analyzer will detect suits normally'
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      return {
        deckType: 'unknown',
        confidence: 0,
        notes: 'No response from deck type detector'
      };
    }

    const result: DeckTypeResult = JSON.parse(content);
    
    // Set appName if provided
    if (appName) {
      result.appName = appName;
    }

    // Default color scheme if not set
    if (!result.colorScheme) {
      if (result.deckType === 'color-filled') {
        result.colorScheme = 'ggpoker';
      } else if (result.deckType === 'four-color-alt') {
        result.colorScheme = 'pokerstars';
      } else {
        result.colorScheme = 'standard';
      }
    }
    
    // Enhanced validation for all deck types
    // Validate hero colors (CRITICAL - must be exactly 2)
    if (result.heroCardColors) {
      if (result.heroCardColors.length !== 2) {
        console.warn(`⚠️ Hero card detection uncertain: Expected 2 hero colors, got ${result.heroCardColors.length}`);
        result.notes = (result.notes || '') + ` | WARNING: Expected 2 hero colors, got ${result.heroCardColors.length}`;
        result.confidence = Math.min(result.confidence, 0.5);
      } else {
        console.info('✅ Hero card count validation passed: 2 cards detected');
      }
    } else {
      console.warn('⚠️ No hero card colors detected in pre-analysis');
      // Don't reduce confidence for standard decks, but log the warning
      if (result.deckType === 'color-filled' || result.deckType === 'four-color-alt') {
        result.confidence = Math.min(result.confidence, 0.5);
      }
    }
    
    // Validate board colors
    if (result.boardCardColors) {
      if (result.boardCardColors.length < 3 || result.boardCardColors.length > 5) {
        result.notes = (result.notes || '') + ` | WARNING: Expected 3-5 board colors, got ${result.boardCardColors.length}`;
        result.confidence = Math.min(result.confidence, 0.6);
      }
    }
    
    // Check for suspicious patterns in legacy cardColors
    if (result.cardColors) {
      const colorCounts = result.cardColors.reduce((acc, color) => {
        acc[color] = (acc[color] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Warning if all cards same color (only for color-filled decks)
      if (Object.keys(colorCounts).length === 1 && (result.deckType === 'color-filled' || result.deckType === 'four-color-alt')) {
        result.notes = (result.notes || '') + ' | WARNING: All cards same color - may be misdetection';
        result.confidence = Math.min(result.confidence, 0.5);
      }
      
      console.info('Color distribution:', colorCounts);
    }
    
    // Special validation: If app is known color-filled but classified as standard, add warning
    if (result.deckType === 'standard' && appName && ['ggpoker', 'clubgg'].includes(appName.toLowerCase())) {
      console.warn(`⚠️ Detected ${appName} but classified as standard deck - may need re-classification`);
      result.confidence = Math.min(result.confidence, 0.7);
      result.notes = (result.notes || '') + ` | App uses color-filled decks but detected as standard`;
    }
    
    console.info('Deck type detected:', {
      type: result.deckType,
      colorScheme: result.colorScheme,
      confidence: result.confidence,
      heroColors: result.heroCardColors?.length || 0,
      boardColors: result.boardCardColors?.length || 0,
      totalColors: result.cardColors?.length || 0,
      cards: result.detectedCards
    });

    return result;

  } catch (error) {
    console.error('Deck type detection error:', error);
    // Return unknown - main analyzer will work normally
    return {
      deckType: 'unknown',
      confidence: 0,
      notes: 'Detection error, using main analyzer fallback'
    };
  }
}

/**
 * Map card colors to suits for color-filled decks
 * Supports multiple color schemes
 */
export function mapColorToSuit(
  color: string, 
  scheme: 'ggpoker' | 'pokerstars' | 'standard' = 'ggpoker'
): string {
  // Validate input
  const normalized = color.toLowerCase().trim();
  if (!normalized || normalized === 'unknown' || normalized === 'white' || normalized === 'cream') {
    console.warn(`⚠️ Invalid/neutral color for suit mapping: "${color}"`);
    return '?'; // Return unknown for white/invalid colors
  }
  
  // Enhanced color aliases for better matching
  const colorAliases: Record<string, string> = {
    // Red aliases
    'red': 'red',
    'crimson': 'red',
    'cherry': 'red',
    'scarlet': 'red',
    // Blue aliases
    'blue': 'blue',
    'sky': 'blue',
    'ocean': 'blue',
    'azure': 'blue',
    'royal': 'blue',
    // Green aliases
    'green': 'green',
    'emerald': 'green',
    'forest': 'green',
    'grass': 'green',
    // Black aliases
    'black': 'black',
    'charcoal': 'black',
    'dark': 'black',
    'gray': 'black',
    'grey': 'black',
    // Orange/Yellow aliases (PokerStars)
    'orange': 'orange',
    'yellow': 'yellow',
    'gold': 'yellow'
  };
  
  const baseColor = colorAliases[normalized] || normalized;
  
  const schemes = {
    ggpoker: {
      red: 'h',
      blue: 'd',
      green: 'c',
      black: 's'
    },
    pokerstars: {
      red: 'h',
      blue: 'd',
      green: 'c',
      orange: 's',
      yellow: 's'
    },
    standard: {}
  };
  
  const mapping = schemes[scheme];
  const result = mapping[baseColor as keyof typeof mapping];
  
  if (!result) {
    console.warn(`⚠️ Unmapped color "${color}" (normalized: "${baseColor}") for scheme "${scheme}"`);
    return '?';
  }
  
  return result;
}
