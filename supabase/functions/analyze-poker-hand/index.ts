import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGINS = [
  'https://session-master-mvp.lovable.app',
  'https://fa19e82d-191f-494f-933f-bcc0a4a9f418.lovableproject.com',
  'http://localhost:3000'
];

const corsHeaders = (origin: string | null) => {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
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
  const headers = corsHeaders(origin);
  
  // Log request arrival for debugging
  console.log('Request received', {
    method: req.method,
    hasAuth: req.headers.get('authorization') ? 'yes' : 'no',
    origin: origin,
    contentType: req.headers.get('content-type')
  });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  const startTime = Date.now();

  try {
    const origin = req.headers.get('origin');
    const headers = corsHeaders(origin);
    
    const { image, heroOverride, dealerOverride } = await req.json();
    
    // Validate image size
    const imageSizeBytes = (image.length * 3) / 4;
    if (imageSizeBytes > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ 
          code: 'FILE_TOO_LARGE',
          error: `Image size (${Math.round(imageSizeBytes / 1024)}KB) exceeds 10MB limit` 
        }),
        { status: 413, headers: { ...headers, 'Content-Type': 'application/json' } }
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
          headers: { ...headers, 'Content-Type': 'application/json' } 
        }
      );
    }

    const systemPrompt = `You are an expert poker hand analyzer specializing in No-Limit Hold'em (NLH).

CRITICAL SPATIAL DETECTION RULES:
1. Hero Cards Location: The hero's two hole cards are ALWAYS at the BOTTOM-CENTER of the table image. They are typically the largest, most clearly visible cards. Look at the bottom-center position FIRST before analyzing anything else. If you see cards there, mark them as hero's cards with high confidence (>0.8).
   - Card Format: Return each card with rank (A,K,Q,J,T,9,8,7,6,5,4,3,2) and suit (h=hearts, d=diamonds, s=spades, c=clubs)
   - Example: Ace of Spades = { rank: "A", suit: "s", confidence: 0.95 }
   - If a card is partially visible but readable, include it with lower confidence
   - Only mark as "hidden" if absolutely no cards are visible at bottom-center

2. Board Cards Location: Community cards (flop, turn, river) are ALWAYS displayed in the CENTER/MIDDLE of the table in a horizontal line. Look for:
   - 3 cards in a row = flop only (hand ended on flop)
   - 4 cards in a row = flop + turn
   - 5 cards in a row = flop + turn + river (hand went to showdown)
   - No cards in center = hand ended preflop
   - Card Format: Same as hero cards - use rank and suit notation
   - Always detect ALL visible board cards, even if image quality is poor

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
                          suit: { type: "string" },
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
                    text: `Analyze this poker hand. ${heroOverride ? `Hero override: ${heroOverride}.` : ''} ${dealerOverride ? `Dealer override: ${dealerOverride}.` : ''}` 
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
            { status: 429, headers: { ...headers, 'Content-Type': 'application/json' } }
          );
        }

        if (response.status === 402) {
          return new Response(
            JSON.stringify({ 
              error: 'AI credits depleted. Please add credits to continue using AI analysis.',
              code: 'CREDITS_DEPLETED'
            }),
            { status: 402, headers: { ...headers, 'Content-Type': 'application/json' } }
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
            headers: { ...headers, 'Content-Type': 'application/json' } 
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
            { status: 408, headers: { ...headers, 'Content-Type': 'application/json' } }
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
      { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
    );
  }
});
