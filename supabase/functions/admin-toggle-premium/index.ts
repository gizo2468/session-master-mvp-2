import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's auth token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // User client for authentication check
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get the current user
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      console.error('Failed to get user:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated:', user.id);

    // Service client for admin operations
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check if the user is an admin using the has_role function
    const { data: isAdmin, error: roleError } = await serviceClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError) {
      console.error('Error checking admin role:', roleError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify admin status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isAdmin) {
      console.error('User is not an admin:', user.id);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin verified:', user.id);

    // Parse request body
    const { target_user_id, set_premium } = await req.json();

    if (!target_user_id || typeof set_premium !== 'boolean') {
      return new Response(
        JSON.stringify({ error: 'Invalid request: target_user_id and set_premium (boolean) required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Toggling premium for user ${target_user_id} to ${set_premium}`);

    if (set_premium) {
      // Check if user already has an active subscription
      const { data: existingSub, error: checkError } = await serviceClient
        .from('user_subscriptions')
        .select('id, is_active, status')
        .eq('user_id', target_user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is fine
        console.error('Error checking existing subscription:', checkError);
        throw checkError;
      }

      if (existingSub) {
        // Update existing subscription to active
        const { error: updateError } = await serviceClient
          .from('user_subscriptions')
          .update({
            is_active: true,
            status: 'active',
            end_date: null, // Remove end date (lifetime admin-granted)
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSub.id);

        if (updateError) {
          console.error('Error updating subscription:', updateError);
          throw updateError;
        }
        console.log('Updated existing subscription to active');
      } else {
        // Create new subscription
        const { error: insertError } = await serviceClient
          .from('user_subscriptions')
          .insert({
            user_id: target_user_id,
            plan_type: 'admin_granted',
            status: 'active',
            is_active: true,
            start_date: new Date().toISOString(),
            end_date: null // Lifetime admin-granted
          });

        if (insertError) {
          console.error('Error creating subscription:', insertError);
          throw insertError;
        }
        console.log('Created new subscription');
      }

      // Update profiles.is_premium
      const { error: profileError } = await serviceClient
        .from('profiles')
        .update({ is_premium: true })
        .eq('id', target_user_id);

      if (profileError) {
        console.error('Error updating profile premium status:', profileError);
        // Don't throw - subscription is already updated
      }

    } else {
      // Deactivate subscription (don't delete)
      const { error: deactivateError } = await serviceClient
        .from('user_subscriptions')
        .update({
          is_active: false,
          status: 'cancelled',
          end_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', target_user_id)
        .eq('is_active', true);

      if (deactivateError) {
        console.error('Error deactivating subscription:', deactivateError);
        throw deactivateError;
      }
      console.log('Deactivated subscription');

      // Update profiles.is_premium
      const { error: profileError } = await serviceClient
        .from('profiles')
        .update({ is_premium: false })
        .eq('id', target_user_id);

      if (profileError) {
        console.error('Error updating profile premium status:', profileError);
        // Don't throw - subscription is already updated
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Premium ${set_premium ? 'activated' : 'deactivated'} for user ${target_user_id}` 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in admin-toggle-premium:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
