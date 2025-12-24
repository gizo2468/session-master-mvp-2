import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Secure CORS configuration - only allow specific domains
const getAllowedOrigins = () => {
  const allowedOrigins = [
    'https://session-master-mvp.lovable.app', // Production domain
    'http://localhost:3000',                   // Local development
    'http://localhost:5173',                   // Vite dev server
    'https://localhost:3000',                  // Local HTTPS
  ];
  return allowedOrigins;
};

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigins = getAllowedOrigins();
  const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestId = crypto.randomUUID();
    console.log(`[${requestId}] Processing request: ${req.method}`);
    
    const body = await req.json();
    console.log(`[${requestId}] Request body:`, JSON.stringify(body, null, 2));
    
    let orderId = null;
    let isWebhook = false;
    
    // Check if this is a PayPal webhook event
    if (body.event_type && body.resource) {
      isWebhook = true;
      console.log(`[${requestId}] Processing PayPal webhook event: ${body.event_type}`);
      
      // Handle different webhook event types
      switch (body.event_type) {
        case 'CHECKOUT.ORDER.APPROVED':
        case 'PAYMENT.CAPTURE.COMPLETED':
          if (body.resource && body.resource.id) {
            orderId = body.resource.id;
          } else if (body.resource && body.resource.supplementary_data && body.resource.supplementary_data.related_ids && body.resource.supplementary_data.related_ids.order_id) {
            orderId = body.resource.supplementary_data.related_ids.order_id;
          }
          break;
        default:
          console.log(`[${requestId}] Ignoring webhook event type: ${body.event_type}`);
          return new Response(JSON.stringify({ message: 'Event type not handled' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
      }
    } else {
      // Manual capture request (backward compatibility)
      orderId = body.orderId;
    }
    
    if (!orderId) {
      throw new Error(`Order ID not found in ${isWebhook ? 'webhook event' : 'request'}`);
    }
    
    console.log(`[${requestId}] Processing order: ${orderId}`);

    // Get PayPal credentials and environment
    const clientId = Deno.env.get('PAYPAL_CLIENT_ID');
    const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET');
    const paypalEnv = Deno.env.get('PAYPAL_ENV') || 'sandbox';
    
    if (!clientId) {
      throw new Error('PayPal client ID not configured');
    }
    
    if (!clientSecret) {
      throw new Error('PayPal client secret not configured');
    }

    console.log(`[${requestId}] Environment: ${paypalEnv}`);
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
      throw new Error(`Failed to get PayPal access token: ${errorText}`);
    }

    console.log(`[${requestId}] Successfully obtained PayPal access token`);

    const { access_token } = await tokenResponse.json();

    // Capture the payment
    const captureResponse = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!captureResponse.ok) {
      const errorText = await captureResponse.text();
      console.error(`[${requestId}] PayPal capture failed:`, errorText);
      throw new Error(`Failed to capture PayPal payment: ${errorText}`);
    }

    console.log(`[${requestId}] Successfully captured PayPal payment`);

    const captureData = await captureResponse.json();

    // Use service role key for database operations
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get the payment record
    const { data: payment, error: fetchError } = await supabaseService
      .from('user_payments')
      .select('*')
      .eq('paypal_order_id', orderId)
      .single();

    if (fetchError || !payment) {
      console.error('Payment not found:', fetchError);
      throw new Error('Payment record not found');
    }

    // Update payment status
    const { error: updateError } = await supabaseService
      .from('user_payments')
      .update({
        status: 'completed',
        paypal_payment_id: captureData.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id);

    if (updateError) {
      console.error('Failed to update payment:', updateError);
      throw new Error('Failed to update payment status');
    }

    // Create subscription record
    const now = new Date();
    let endDate = null;
    
    if (payment.plan_type === 'monthly') {
      endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1);
    }
    // For lifetime, endDate remains null

    const { error: subscriptionError } = await supabaseService
      .from('user_subscriptions')
      .insert({
        user_id: payment.user_id,
        plan_type: payment.plan_type,
        status: 'active',
        start_date: now.toISOString(),
        end_date: endDate?.toISOString() || null,
        is_active: true
      });

    if (subscriptionError) {
      console.error('Failed to create subscription:', subscriptionError);
      throw new Error('Failed to create subscription');
    }

    // Update user's premium status
    const { error: profileUpdateError } = await supabaseService
      .from('profiles')
      .update({ is_premium: true })
      .eq('id', payment.user_id);

    if (profileUpdateError) {
      console.error('Failed to update profile:', profileUpdateError);
    }

    console.log(`[${requestId}] Successfully processed payment for user ${payment.user_id}, plan: ${payment.plan_type}`);

    return new Response(JSON.stringify({ 
      success: true,
      requestId,
      planType: payment.plan_type,
      amount: payment.amount,
      isWebhook
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const requestId = crypto.randomUUID();
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Log error with request ID for debugging (server-side only)
    console.error(`[${requestId}] Capture PayPal payment error:`, errorMessage);
    
    // Return generic error message to client
    return new Response(JSON.stringify({ 
      error: 'Payment capture failed. Please try again.',
      requestId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});