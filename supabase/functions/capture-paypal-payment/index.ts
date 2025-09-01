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
    const { orderId } = await req.json();
    
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    // Get PayPal access token
    const clientId = 'YOUR_PAYPAL_CLIENT_ID'; // This should be set as a public config
    const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET');
    
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
      throw new Error('Failed to get PayPal access token');
    }

    const { access_token } = await tokenResponse.json();

    // Capture the payment
    const captureResponse = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!captureResponse.ok) {
      const errorText = await captureResponse.text();
      console.error('PayPal capture failed:', errorText);
      throw new Error('Failed to capture PayPal payment');
    }

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

    console.log(`Successfully processed payment for user ${payment.user_id}, plan: ${payment.plan_type}`);

    return new Response(JSON.stringify({ 
      success: true,
      planType: payment.plan_type,
      amount: payment.amount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Capture PayPal payment error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});