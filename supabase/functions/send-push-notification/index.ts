import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SignJWT, importPKCS8 } from "https://esm.sh/jose@5.2.0";

const getAllowedOrigins = () => [
  'https://session-master-mvp.lovable.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'https://localhost:3000',
  'capacitor://localhost',
  'ionic://localhost',
];

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigins = getAllowedOrigins();
  const allowedOrigin = origin && allowedOrigins.includes(origin) 
    ? origin 
    : allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
};

// Generate APNS JWT using jose library for reliable ES256 signing
async function generateAPNSToken(keyId: string, teamId: string, keyP8: string): Promise<string> {
  // Clean up the P8 key format
  const cleanedKey = keyP8.includes('-----BEGIN PRIVATE KEY-----') 
    ? keyP8 
    : `-----BEGIN PRIVATE KEY-----\n${keyP8}\n-----END PRIVATE KEY-----`;
  
  const privateKey = await importPKCS8(cleanedKey, 'ES256');
  
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: keyId })
    .setIssuedAt()
    .setIssuer(teamId)
    .sign(privateKey);
  
  return jwt;
}

async function sendAPNSPush(
  token: string,
  title: string,
  body: string,
  data: Record<string, unknown>,
  apnsToken: string,
  bundleId: string,
  isProduction: boolean,
  badgeCount: number
): Promise<{ success: boolean; error?: string; shouldDelete?: boolean }> {
  const host = isProduction 
    ? 'api.push.apple.com' 
    : 'api.sandbox.push.apple.com';
  
  const payload = {
    aps: {
      alert: { title, body },
      sound: 'default',
      badge: badgeCount,
    },
    ...data,
  };
  
  try {
    const response = await fetch(`https://${host}/3/device/${token}`, {
      method: 'POST',
      headers: {
        'authorization': `bearer ${apnsToken}`,
        'apns-topic': bundleId,
        'apns-push-type': 'alert',
        'apns-priority': '10',
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (response.ok) {
      console.log(`[APNS] Push sent successfully to token: ${token.substring(0, 10)}... via ${host}`);
      return { success: true };
    }
    
    const errorText = await response.text();
    let errorReason = '';
    try {
      const errorJson = JSON.parse(errorText);
      errorReason = errorJson.reason || '';
    } catch {
      errorReason = errorText;
    }
    
    console.error(`[APNS] Push failed for token ${token.substring(0, 10)}...: ${response.status} - ${errorReason} (${host})`);
    
    // Mark token for deletion if it's invalid/unregistered
    const shouldDelete = ['BadDeviceToken', 'Unregistered', 'ExpiredToken'].includes(errorReason);
    
    return { success: false, error: `${response.status}: ${errorReason}`, shouldDelete };
  } catch (error) {
    console.error(`[APNS] Network error for token ${token.substring(0, 10)}...:`, error);
    return { success: false, error: String(error) };
  }
}

// Try sending to a token with fallback between prod and sandbox
async function sendWithFallback(
  token: string,
  title: string,
  body: string,
  data: Record<string, unknown>,
  apnsToken: string,
  bundleId: string,
  preferProduction: boolean,
  badgeCount: number
): Promise<{ success: boolean; error?: string; shouldDelete?: boolean }> {
  // Try preferred environment first
  const firstResult = await sendAPNSPush(token, title, body, data, apnsToken, bundleId, preferProduction, badgeCount);
  
  if (firstResult.success) {
    return firstResult;
  }
  
  // If BadDeviceToken, try the other environment
  if (firstResult.error?.includes('BadDeviceToken')) {
    console.log(`[APNS] Token failed on ${preferProduction ? 'production' : 'sandbox'}, trying ${preferProduction ? 'sandbox' : 'production'}...`);
    const fallbackResult = await sendAPNSPush(token, title, body, data, apnsToken, bundleId, !preferProduction, badgeCount);
    return fallbackResult;
  }
  
  return firstResult;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  console.log('[send-push-notification] Function invoked');
  
  try {
    // Parse request body
    const { recipient_user_id, title, body, data } = await req.json();
    
    if (!recipient_user_id || !title || !body) {
      console.error('[send-push-notification] Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: recipient_user_id, title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[send-push-notification] Sending push to user: ${recipient_user_id}`);
    console.log(`[send-push-notification] Title: ${title}, Body: ${body}`);
    
    // Get APNS credentials from environment
    const keyId = Deno.env.get('APNS_KEY_ID');
    const teamId = Deno.env.get('APNS_TEAM_ID');
    const keyP8 = Deno.env.get('APNS_KEY_P8');
    const bundleId = Deno.env.get('APNS_BUNDLE_ID');
    
    if (!keyId || !teamId || !keyP8 || !bundleId) {
      console.error('[send-push-notification] Missing APNS credentials');
      return new Response(
        JSON.stringify({ error: 'APNS credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Query unread notifications count for the badge
    const { count: unreadCount, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_user_id', recipient_user_id)
      .eq('is_read', false);
    
    const badgeCount = countError ? 1 : (unreadCount || 1);
    console.log(`[send-push-notification] Unread count for badge: ${badgeCount}`);
    
    // Get push tokens for the user
    const { data: tokens, error: tokensError } = await supabase
      .from('push_tokens')
      .select('id, push_token, platform')
      .eq('user_id', recipient_user_id);
    
    if (tokensError) {
      console.error('[send-push-notification] Error fetching tokens:', tokensError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch push tokens' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!tokens || tokens.length === 0) {
      console.log(`[send-push-notification] No push tokens found for user: ${recipient_user_id}`);
      return new Response(
        JSON.stringify({ message: 'No push tokens found for user', sent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[send-push-notification] Found ${tokens.length} token(s) for user`);
    
    // Generate APNS JWT token using jose library
    let apnsToken: string;
    try {
      apnsToken = await generateAPNSToken(keyId, teamId, keyP8);
      console.log('[send-push-notification] APNS JWT generated successfully');
    } catch (jwtError) {
      console.error('[send-push-notification] Failed to generate APNS JWT:', jwtError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate APNS token', details: String(jwtError) }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Prefer production but fallback to sandbox if needed
    const preferProduction = Deno.env.get('APNS_ENVIRONMENT') !== 'sandbox';
    console.log(`[send-push-notification] Preferred APNS environment: ${preferProduction ? 'production' : 'sandbox'}`);
    
    // Filter iOS tokens
    const iosTokens = tokens.filter(t => t.platform === 'ios');
    console.log(`[send-push-notification] iOS tokens to process: ${iosTokens.length}`);
    
    // Send push to all iOS tokens with fallback
    const results = await Promise.all(
      iosTokens.map(async (t) => {
        const result = await sendWithFallback(
          t.push_token, 
          title, 
          body, 
          data || {}, 
          apnsToken, 
          bundleId, 
          preferProduction,
          badgeCount
        );
        return { ...result, tokenId: t.id, token: t.push_token };
      })
    );
    
    // Clean up invalid tokens
    const tokensToDelete = results.filter(r => r.shouldDelete).map(r => r.tokenId);
    if (tokensToDelete.length > 0) {
      console.log(`[send-push-notification] Deleting ${tokensToDelete.length} invalid token(s)`);
      const { error: deleteError } = await supabase
        .from('push_tokens')
        .delete()
        .in('id', tokensToDelete);
      
      if (deleteError) {
        console.error('[send-push-notification] Failed to delete invalid tokens:', deleteError);
      } else {
        console.log('[send-push-notification] Invalid tokens deleted successfully');
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    console.log(`[send-push-notification] Push results: ${successCount} sent, ${failCount} failed, ${tokensToDelete.length} cleaned up`);
    
    return new Response(
      JSON.stringify({ 
        message: 'Push notifications processed',
        sent: successCount,
        failed: failCount,
        cleaned: tokensToDelete.length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[send-push-notification] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
