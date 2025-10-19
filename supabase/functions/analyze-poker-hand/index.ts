import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ANALYSIS_TIMEOUT = 30000; // 30 seconds

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
     * Look for a white or yellow circular icon with "D" or "DEALER" text
     * Usually positioned near a player's avatar (above, beside, or below the name)
     * May be a small button icon, badge, or marker
     * Sometimes appears as a chip with "D" marking
   
   - Detection Strategy:
     1. First, scan all visible player positions for the dealer button icon
     2. If the dealer button is on the HERO (bottom-center player), hero position = "BTN"
     3. If the dealer button is on another player, use clockwise table geometry to calculate hero position
     4. Mark confidence as high (>0.8) if the button is clearly visible
     5. Mark confidence as low (<0.5) if button is obscured or unclear

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
                      { type: "array" }
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
                flop: { type: "array", nullable: true },
                turn: { type: "object", nullable: true },
                river: { type: "object", nullable: true },
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

    let attempt = 0;
    let lastError = null;

    while (attempt < 2) {
      attempt++;
      
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
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: systemPrompt },
              {
                role: 'user',
                content: [
                  { 
                    type: 'text', 
                    text: `CRITICAL: Detect cards with PRECISE spatial positioning.

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

STEP 4 - POSITION DETECTION (Critical for hand analysis):
- FIRST: Look for the dealer button icon (white/yellow circle with "D") near any player's avatar
- If dealer button is on the HERO (bottom-center player): position = "BTN"
- If dealer button is on another player: Count clockwise seats to determine hero position
- FALLBACK: If button not visible, check the preflop action for SB/BB blind posts
- LAST RESORT: If no button and no blind info, set position = "UNKNOWN" with low confidence
- DO NOT GUESS: If uncertain, use "UNKNOWN" instead of a wrong position

Table position mapping (clockwise from dealer):
- Standard positions (clockwise): BTN → SB → BB → UTG → MP → CO → BTN
- For 5-handed: Skip MP (BTN → SB → BB → UTG → CO)

${heroOverride ? `Hero position override: ${heroOverride}.` : ''} ${dealerOverride ? `OVERRIDE APPLIED: Dealer button is at ${dealerOverride}. Calculate hero position accordingly.` : ''}

Remember: The hero is ALWAYS the bottom-center player. All other players are villains.`
                  },
                  { type: 'image_url', image_url: { url: cleanImage } }
                ]
              }
            ],
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
          console.error('AI gateway error:', response.status);
          lastError = new Error(`AI gateway error: ${response.status}`);
          continue;
        }

        const data = await response.json();
        const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
        
        if (!toolCall) {
          lastError = new Error('No tool call in AI response');
          continue;
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
          attempt
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
          return new Response(
            JSON.stringify({ 
              error: 'Analysis timed out after 30 seconds. Please try with a clearer image.',
              code: 'TIMEOUT'
            }),
            { status: 408, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        if (attempt < 2) {
          console.log(`Retry attempt ${attempt + 1}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    throw lastError || new Error('Analysis failed after retries');

  } catch (error) {
    console.error('analyze-poker-hand error:', error instanceof Error ? error.message : 'Unknown error');
    const origin = req.headers.get('origin');
    const headers = corsHeaders(origin);

    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Analysis failed. Please try again.',
        code: 'ANALYSIS_ERROR'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
