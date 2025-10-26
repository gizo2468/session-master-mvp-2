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
  cardColors?: string[];  // For color-filled decks: ['blue', 'blue', 'red', 'green', 'black', ...]
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
  
  const prompt = `You are a poker client interface analyzer. Your ONLY task is to identify the deck style used in this poker screenshot.

TASK: Analyze 2-3 visible cards and determine the deck type.

DECK TYPE A - STANDARD SYMBOL DECK:
- Cards have WHITE, CREAM, or LIGHT GRAY backgrounds
- Suits are shown as traditional symbols (♥♦♠♣)
- Example: White card with "A" and red ♥ symbol in corner

DECK TYPE B - COLOR-FILLED DECK (GGPoker-style):
- Cards have SOLID COLOR BACKGROUNDS filling the entire card rectangle
- Suits are indicated by BACKGROUND COLOR (not symbols)
- Color mapping:
  * RED background = Hearts
  * BLUE background = Diamonds
  * GREEN background = Clubs
  * BLACK background = Spades
- Card rank displayed in WHITE text over colored background
- Example: White "9" on blue background = 9♦

INSTRUCTIONS:
1. Look at 2-3 clearly visible cards (hero cards or board cards)
2. Check if cards have solid color backgrounds:
   - YES → Color-filled deck
   - NO (white/light backgrounds) → Standard deck
3. For color-filled decks, identify the DOMINANT BACKGROUND COLOR for each visible card:
   - Focus on the card's background fill color (ignore white rank text)
   - Sample the center 60% of each card rectangle
   - Classify as: "red", "blue", "green", or "black"
   - Return colors in ORDER from left to right or top to bottom

OUTPUT FORMAT (JSON only):
{
  "deckType": "standard" | "color-filled" | "unknown",
  "confidence": 0.0-1.0,
  "cardColors": ["blue", "blue", "red", "green", "black"],
  "detectedCards": 5,
  "notes": "Additional observations if needed"
}

EXAMPLES:

Example 1 - Standard Deck:
{
  "deckType": "standard",
  "confidence": 0.95,
  "detectedCards": 2,
  "notes": "White cards with red/black suit symbols visible"
}

Example 2 - Color-Filled Deck:
{
  "deckType": "color-filled",
  "confidence": 0.9,
  "cardColors": ["blue", "blue", "red", "green", "black"],
  "detectedCards": 5,
  "notes": "GGPoker-style four-color deck with solid backgrounds"
}

CRITICAL: Keep this analysis FAST and SIMPLE. Only identify deck type and colors, nothing else.`;

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
    
    console.info('Deck type detected:', {
      type: result.deckType,
      confidence: result.confidence,
      colors: result.cardColors?.length || 0,
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
