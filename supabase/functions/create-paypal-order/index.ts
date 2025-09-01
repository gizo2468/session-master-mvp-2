import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
    console.log(`[${requestId}] Processing PayPal order creation request`);
    
    const body = await req.json();
    const { planType } = body;
    console.log(`[${requestId}] Request body:`, JSON.stringify(body, null, 2));
    
    if (!planType || !['monthly', 'lifetime'].includes(planType)) {
      throw new Error('Invalid plan type');
    }

    // Get PayPal access token
    const clientId = Deno.env.get('PAYPAL_CLIENT_ID');
    const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET');
    
    if (!clientId) {
      throw new Error('PayPal client ID not configured');
    }
    
    if (!clientSecret) {
      throw new Error('PayPal client secret not configured');
    }

    const auth = btoa(`${clientId}:${clientSecret}`);
    
    const tokenResponse = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
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

    // Set up order details based on plan type
    let orderData;
    if (planType === 'monthly') {
      orderData = {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: '14.99'
          },
          description: 'Monthly Subscription - $14.99/month'
        }],
        application_context: {
          return_url: `${req.headers.get('origin')}/subscription/success`,
          cancel_url: `${req.headers.get('origin')}/subscription/cancel`,
          brand_name: 'Your App Name',
          user_action: 'PAY_NOW'
        }
      };
    } else {
      orderData = {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: '199.00'
          },
          description: 'Lifetime Deal - One-time payment'
        }],
        application_context: {
          return_url: `${req.headers.get('origin')}/subscription/success`,
          cancel_url: `${req.headers.get('origin')}/subscription/cancel`,
          brand_name: 'Your App Name',
          user_action: 'PAY_NOW'
        }
      };
    }

    // Create PayPal order
    const orderResponse = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error('PayPal order creation failed:', errorText);
      throw new Error(`PayPal order creation failed: ${errorText}`);
    }

    const order = await orderResponse.json();

    // Store pending payment in database using service role for admin operations
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Also create regular client for user authentication
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('User not authenticated');
    }

    const amount = planType === 'monthly' ? 14.99 : 199.00;

    const { error: insertError } = await supabaseService
      .from('user_payments')
      .insert({
        user_id: user.id,
        plan_type: planType,
        amount: amount,
        currency: 'USD',
        status: 'pending',
        paypal_order_id: order.id
      });

    if (insertError) {
      console.error(`[${requestId}] Database insert error:`, insertError);
      throw new Error(`Failed to store payment record: ${insertError.message}`);
    }

    console.log(`[${requestId}] Successfully created payment record for user ${user.id}, plan: ${planType}`);

    console.log(`[${requestId}] Successfully created PayPal order: ${order.id}`);

    return new Response(JSON.stringify({ 
      orderId: order.id,
      requestId,
      approval_url: order.links.find((link: any) => link.rel === 'approve')?.href 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const requestId = crypto.randomUUID();
    console.error(`[${requestId}] Create PayPal order error:`, error);
    console.error(`[${requestId}] Error stack:`, error.stack);
    return new Response(JSON.stringify({ 
      error: error.message,
      requestId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});