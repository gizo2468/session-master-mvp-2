/**
 * Poker App Detection Module
 * Identifies which poker application the screenshot is from
 */

export interface AppDetectionResult {
  appName: 'ggpoker' | 'clubgg' | 'pokerstars' | '888poker' | 'partypoker' | 'unknown';
  confidence: number;
  visualMarkers: {
    hasLogo?: boolean;
    logoPosition?: string;
    dealerButtonStyle?: string;
    cardStyle?: string;
    tableColor?: string;
  };
  notes?: string;
}

const APP_DETECTION_TIMEOUT = 8000;

/**
 * Detect which poker app the screenshot is from
 */
export async function detectApp(
  imageBase64: string,
  apiKey: string
): Promise<AppDetectionResult> {
  console.info('Starting app detection...');

  const prompt = `You are a poker application identifier. Analyze this poker table screenshot and identify which poker application it's from.

Look for these distinctive features:

**GGPoker/ClubGG:**
- Yellow circular dealer button with "D"
- Four-color deck (red/blue/green/black card backgrounds)
- Action panel on the left side
- Yellow highlight around hero player
- Dark green felt table
- Modern, flat UI design

**PokerStars:**
- White or blue dealer button with "D"
- Traditional deck OR four-color option (red/blue/green/orange)
- Action panel at bottom
- Blue highlight around hero player
- Red or blue table felt
- Classic poker table appearance
- May have PokerStars logo in corners

**888poker:**
- Gold/orange dealer button with "BTN" text
- Traditional deck with thicker card borders
- Action panel at bottom
- Orange/gold UI elements
- Green felt table
- More prominent chip animations
- May have 888 branding

**PartyPoker:**
- White rounded dealer button with "D"
- Traditional deck
- Action panel on left
- Green highlight around hero
- Green felt table
- May have PartyPoker logo

**Analysis Instructions:**
1. Look at the dealer button style (color, shape, text)
2. Examine card design (traditional suits vs. colored backgrounds)
3. Check for app logos in corners or top center
4. Analyze table felt color and texture
5. Look at UI styling (modern/flat vs. classic)
6. Check action panel position and style

Return ONLY valid JSON:
{
  "appName": "ggpoker" | "clubgg" | "pokerstars" | "888poker" | "partypoker" | "unknown",
  "confidence": 0.0-1.0,
  "visualMarkers": {
    "hasLogo": true/false,
    "logoPosition": "top-left" | "top-center" | "top-right" | "none",
    "dealerButtonStyle": "yellow-circle-D" | "white-circle-D" | "gold-btn" | "none",
    "cardStyle": "four-color" | "traditional" | "unclear",
    "tableColor": "dark-green" | "red" | "blue" | "green" | "unclear"
  },
  "notes": "Brief explanation of key identifying features"
}

Use confidence scores:
- 0.95+ = Clear distinctive features visible
- 0.80-0.94 = Strong indicators present
- 0.60-0.79 = Some features match but uncertain
- 0.40-0.59 = Weak indicators or contradictory features
- <0.40 = Cannot identify confidently

If unclear, return "unknown" with confidence < 0.60 and explain why in notes.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), APP_DETECTION_TIMEOUT);

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageBase64 } }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('App detection API error:', {
        status: response.status,
        error: errorText.substring(0, 200)
      });
      
      // Return unknown on error
      return {
        appName: 'unknown',
        confidence: 0,
        visualMarkers: {},
        notes: `API error: ${response.status}`
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in app detection response');
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in app detection response:', content);
      return {
        appName: 'unknown',
        confidence: 0,
        visualMarkers: {},
        notes: 'Failed to parse response'
      };
    }

    const result = JSON.parse(jsonMatch[0]) as AppDetectionResult;

    console.info('App detected:', {
      app: result.appName,
      confidence: result.confidence,
      markers: result.visualMarkers
    });

    return result;

  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      console.error('App detection timeout');
      return {
        appName: 'unknown',
        confidence: 0,
        visualMarkers: {},
        notes: 'Detection timeout'
      };
    }

    console.error('App detection error:', error);
    return {
      appName: 'unknown',
      confidence: 0,
      visualMarkers: {},
      notes: error.message || 'Unknown error'
    };
  }
}
