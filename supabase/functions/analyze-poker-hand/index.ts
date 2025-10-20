import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
      quality: 0.85 
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

    const systemPrompt = `You are an expert poker hand analyzer with advanced computer vision capabilities, specializing in No-Limit Hold'em (NLH).

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
   
    Example detections:
    - Queen of Clubs = { rank: "Q", suit: "c", confidence: 0.9 }
    - Ace of Hearts = { rank: "A", suit: "h", confidence: 0.95 }
    - Ten of Spades = { rank: "T", suit: "s", confidence: 0.85 }

CRITICAL POSITION DETECTION INSTRUCTIONS:

1. DEALER BUTTON IDENTIFICATION:
   - Visual Characteristics:
     * BRIGHT YELLOW circular badge with black "D" letter (see reference image provided)
     * Small circular icon (typically 20-40px diameter)
     * High contrast: bright yellow/gold fill (#FFD700 or similar) with black text
     * Usually positioned DIRECTLY NEXT TO or OVERLAPPING a player's avatar/name plate
     * Most common locations: slightly above avatar, beside avatar, or on the avatar border
     * The "D" glyph is bold, centered, and clearly visible against the yellow background
   
   - Detection Strategy:
      1. FIRST: Compare the screenshot to the reference dealer button image I'm providing
      2. Scan ALL visible player avatars/names for the bright yellow circular badge with "D"
      3. CRITICAL: If the dealer button is on the HERO (bottom-center player), ALWAYS return position="BTN" with hero.confidence=0.95
      4. If the dealer button is on another player, return the EXACT spatial location (e.g., "BOTTOM_RIGHT", "TOP_LEFT", "RIGHT")
      5. For spatial location, use these terms: "BOTTOM_CENTER" (hero), "BOTTOM_RIGHT", "BOTTOM_LEFT", "RIGHT", "LEFT", "TOP_RIGHT", "TOP_CENTER", "TOP_LEFT"
      6. Mark confidence as high (>0.85) if the button is clearly visible and matches the reference image
      7. Mark confidence as medium (0.5-0.85) if button is partially obscured but detectable
      8. Mark confidence as low (<0.5) if button is severely obscured or uncertain

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
                warnings: { type: "array", items: { type: "string" } }
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
            
            if (boardCardCount === 0 && analysisResult.metadata.playerCount > 2) {
              analysisResult.metadata.warnings.push(
                'No board cards detected, but multiple players are visible. Hand may have gone to showdown.'
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

          // POST-PROCESSING: Apply deterministic position correction
          const dealerRaw = analysisResult.dealerButton?.position ?? null;
          const dealerConf = analysisResult.dealerButton?.confidence ?? 0;
          const playerCount = analysisResult.metadata?.playerCount ?? 6;
          const normalizedSeat = normalizeDealerSeat(dealerRaw);
          const mapped = normalizedSeat ? mapDealerSeatToHeroPos(normalizedSeat, playerCount) : null;

          console.log('Position override check:', {
            dealerRaw,
            normalizedSeat,
            mapped,
            dealerConf,
            currentHeroPos: analysisResult.hero?.position,
            heroConf: analysisResult.hero?.confidence,
            playerCount
          });

          // FORCE BTN if dealer button is on hero
          if (normalizedSeat === 'BOTTOM_CENTER') {
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
          // Apply mapped position if dealer confidence is high
          else if (mapped && dealerConf >= 0.7) {
            if (analysisResult.hero.position !== mapped) {
              console.log(`CORRECTING: Dealer mapping suggests ${mapped}, overriding from ${analysisResult.hero.position}`);
              analysisResult.metadata.warnings.push(`Position corrected to ${mapped} based on dealer button location.`);
            }
            analysisResult.hero.position = mapped;
            analysisResult.hero.confidence = Math.max(analysisResult.hero.confidence ?? 0, dealerConf);
          } 
          // Set UNKNOWN if mapping exists but confidence is medium and there's disagreement
          else if (mapped && dealerConf >= 0.4 && dealerConf < 0.7) {
            if (analysisResult.hero.position && analysisResult.hero.position !== mapped && (analysisResult.hero.confidence ?? 0) < 0.7) {
              console.log('DOWNGRADING: Position disagreement with medium confidence, setting to UNKNOWN');
              analysisResult.hero.position = 'UNKNOWN';
              analysisResult.metadata.warnings.push('Position set to UNKNOWN due to low confidence (disagreement between sources).');
            }
          } 
          // Fallback: use villain SB/BB positions if available
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
