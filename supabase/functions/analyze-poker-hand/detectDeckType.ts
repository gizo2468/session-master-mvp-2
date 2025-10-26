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
}

/**
 * Detect poker deck type and extract color information
 * This runs as a pre-processing step before main hand analysis
 */
export async function detectDeckType(
  imageBase64: string,
  apiKey: string
): Promise<DeckTypeResult> {
  
  const prompt = `You are a poker card color detector. Analyze this screenshot and identify card background colors.

TASK: Detect deck type and identify card colors SEPARATELY for hero cards and board cards.

DECK TYPE A - STANDARD SYMBOL DECK:
- Cards have WHITE, CREAM, or LIGHT GRAY backgrounds
- Suits shown as traditional symbols (♥♦♠♣)

DECK TYPE B - COLOR-FILLED DECK (GGPoker-style):
- Cards have SOLID COLOR BACKGROUNDS filling the entire card rectangle
- Suits indicated by BACKGROUND COLOR:
  * RED background = Hearts (♥)
  * BLUE background = Diamonds (♦)
  * GREEN background = Clubs (♣)
  * BLACK/DARK GRAY background = Spades (♠)

CRITICAL COLOR DETECTION GUIDE (ignore white rank text and borders):

🔴 RED (Hearts):
- Bright red, crimson, cherry red background
- RGB roughly (200-255, 0-100, 0-100)
- NOT orange, NOT pink

🔵 BLUE (Diamonds):
- Sky blue, ocean blue, royal blue background
- RGB roughly (0-100, 100-200, 200-255)
- NOT purple, NOT teal, NOT gray

🟢 GREEN (Clubs):
- Forest green, emerald green, grass green background
- RGB roughly (0-100, 150-255, 0-100)
- NOT yellow-green, NOT teal

⚫ BLACK/DARK GRAY (Spades):
- Very dark gray, charcoal, pure black background
- RGB roughly (0-80, 0-80, 0-80)
- NOT light gray, NOT blue-gray

DETECTION PROCESS:
1. Identify HERO CARDS (bottom-center of screen, 2 cards directly below player avatar)
2. Identify BOARD CARDS (center of table, 3-5 cards in horizontal line)
3. For each card, sample CENTER 50% of card background (ignore white text)
4. Classify color using guide above
5. Return colors LEFT TO RIGHT for each group

OUTPUT FORMAT (JSON only):
{
  "deckType": "color-filled" | "standard" | "unknown",
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

Color-Filled Deck:
{
  "deckType": "color-filled",
  "confidence": 0.9,
  "heroCardColors": ["blue", "blue"],
  "boardCardColors": ["red", "black", "red"],
  "cardColors": ["blue", "blue", "red", "black", "red"],
  "detectedCards": 5,
  "notes": "GGPoker four-color deck"
}

CRITICAL: Return ONLY "red", "blue", "green", or "black" (lowercase). Group hero and board separately.`;

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
    
    // Validation: Check grouped arrays for color-filled decks
    if (result.deckType === 'color-filled') {
      // Validate hero colors
      if (result.heroCardColors) {
        if (result.heroCardColors.length !== 2) {
          result.notes = (result.notes || '') + ` | WARNING: Expected 2 hero colors, got ${result.heroCardColors.length}`;
          result.confidence = Math.min(result.confidence, 0.6);
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
        
        // Warning if all cards same color
        if (Object.keys(colorCounts).length === 1) {
          result.notes = (result.notes || '') + ' | WARNING: All cards same color - may be misdetection';
          result.confidence = Math.min(result.confidence, 0.5);
        }
        
        console.info('Color distribution:', colorCounts);
      }
    }
    
    console.info('Deck type detected:', {
      type: result.deckType,
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
 */
export function mapColorToSuit(color: string): string {
  const mapping: Record<string, string> = {
    'red': 'h',     // hearts
    'blue': 'd',    // diamonds
    'green': 'c',   // clubs
    'black': 's'    // spades
  };
  return mapping[color.toLowerCase()] || '?';
}
