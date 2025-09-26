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
    // Get authenticated user
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

    // Use service role for database operations
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get user's active subscriptions
    const { data: subscriptions, error: fetchError } = await supabaseService
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Failed to fetch subscriptions:', fetchError);
      throw new Error('Failed to fetch subscription data');
    }

    const now = new Date();
    let hasActivePremium = false;
    let currentSubscription = null;

    // Check each subscription
    for (const subscription of subscriptions || []) {
      const isActive = subscription.status === 'active' && 
        (subscription.end_date === null || new Date(subscription.end_date) > now);
      
      if (isActive) {
        hasActivePremium = true;
        currentSubscription = subscription;
        break;
      } else if (subscription.end_date && new Date(subscription.end_date) <= now) {
        // Mark expired subscription as inactive
        await supabaseService
          .from('user_subscriptions')
          .update({ 
            is_active: false, 
            status: 'expired',
            updated_at: now.toISOString()
          })
          .eq('id', subscription.id);
      }
    }

    // Update user's premium status if needed
    const { data: profile } = await supabaseService
      .from('profiles')
      .select('is_premium')
      .eq('id', user.id)
      .single();

    if (profile && profile.is_premium !== hasActivePremium) {
      await supabaseService
        .from('profiles')
        .update({ is_premium: hasActivePremium })
        .eq('id', user.id);
    }

    return new Response(JSON.stringify({ 
      isPremium: hasActivePremium,
      subscription: currentSubscription
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Verify subscription status error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});