import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// APNS JWT generation using Web Crypto API
async function generateAPNSToken(keyId: string, teamId: string, keyP8: string): Promise<string> {
  // Parse the P8 key (remove headers and decode base64)
  const pemContents = keyP8
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  
  const keyData = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  // Import the key for ES256 signing
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
  
  // Create JWT header and payload
  const header = { alg: 'ES256', kid: keyId };
  const now = Math.floor(Date.now() / 1000);
  const payload = { iss: teamId, iat: now };
  
  const encodedHeader = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  
  const dataToSign = `${encodedHeader}.${encodedPayload}`;
  const encoder = new TextEncoder();
  
  // Sign the data
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    encoder.encode(dataToSign)
  );
  
  // Convert signature from DER to raw format expected by APNS
  const signatureArray = new Uint8Array(signature);
  const encodedSignature = btoa(String.fromCharCode(...signatureArray))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  return `${dataToSign}.${encodedSignature}`;
}

async function sendAPNSPush(
  token: string,
  title: string,
  body: string,
  data: Record<string, unknown>,
  apnsToken: string,
  bundleId: string,
  isProduction: boolean
): Promise<{ success: boolean; error?: string }> {
  const host = isProduction 
    ? 'api.push.apple.com' 
    : 'api.sandbox.push.apple.com';
  
  const payload = {
    aps: {
      alert: { title, body },
      sound: 'default',
      badge: 1,
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
      console.log(`[APNS] Push sent successfully to token: ${token.substring(0, 10)}...`);
      return { success: true };
    }
    
    const errorText = await response.text();
    console.error(`[APNS] Push failed for token ${token.substring(0, 10)}...: ${response.status} - ${errorText}`);
    return { success: false, error: `${response.status}: ${errorText}` };
  } catch (error) {
    console.error(`[APNS] Network error for token ${token.substring(0, 10)}...:`, error);
    return { success: false, error: String(error) };
  }
}

Deno.serve(async (req) => {
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
    
    // Get push tokens for the user
    const { data: tokens, error: tokensError } = await supabase
      .from('push_tokens')
      .select('token, platform')
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
    
    // Generate APNS JWT token
    let apnsToken: string;
    try {
      apnsToken = await generateAPNSToken(keyId, teamId, keyP8);
      console.log('[send-push-notification] APNS JWT generated successfully');
    } catch (jwtError) {
      console.error('[send-push-notification] Failed to generate APNS JWT:', jwtError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate APNS token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Determine if production (default to production for real usage)
    const isProduction = Deno.env.get('APNS_ENVIRONMENT') !== 'sandbox';
    console.log(`[send-push-notification] Using APNS ${isProduction ? 'production' : 'sandbox'} environment`);
    
    // Send push to all iOS tokens
    const results = await Promise.all(
      tokens
        .filter(t => t.platform === 'ios')
        .map(t => sendAPNSPush(t.token, title, body, data || {}, apnsToken, bundleId, isProduction))
    );
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    console.log(`[send-push-notification] Push results: ${successCount} sent, ${failCount} failed`);
    
    return new Response(
      JSON.stringify({ 
        message: 'Push notifications processed',
        sent: successCount,
        failed: failCount
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[send-push-notification] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
