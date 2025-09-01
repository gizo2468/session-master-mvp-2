import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestId = crypto.randomUUID();
    console.log(`[${requestId}] PayPal health check started`);

    // Check if secrets are configured
    const clientId = Deno.env.get('PAYPAL_CLIENT_ID');
    const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET');
    const paypalEnv = Deno.env.get('PAYPAL_ENV') || 'sandbox';
    
    if (!clientId) {
      throw new Error('PAYPAL_CLIENT_ID not configured');
    }
    
    if (!clientSecret) {
      throw new Error('PAYPAL_CLIENT_SECRET not configured');
    }

    console.log(`[${requestId}] Environment: ${paypalEnv}`);
    console.log(`[${requestId}] Client ID configured: ${clientId.substring(0, 10)}...`);

    // Test PayPal OAuth token generation
    const auth = btoa(`${clientId}:${clientSecret}`);
    const baseUrl = paypalEnv === 'sandbox' 
      ? 'https://api-m.sandbox.paypal.com' 
      : 'https://api-m.paypal.com';
    
    const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error(`[${requestId}] PayPal token request failed:`, errorText);
      throw new Error(`PayPal OAuth failed: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    console.log(`[${requestId}] Successfully obtained PayPal access token`);

    return new Response(JSON.stringify({ 
      status: 'healthy',
      requestId,
      environment: paypalEnv,
      baseUrl,
      tokenScope: tokenData.scope,
      tokenExpiresIn: tokenData.expires_in,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const requestId = crypto.randomUUID();
    console.error(`[${requestId}] PayPal health check failed:`, error);
    return new Response(JSON.stringify({ 
      status: 'unhealthy',
      error: error.message,
      requestId,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});