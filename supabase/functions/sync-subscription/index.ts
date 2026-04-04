import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Authenticate user via JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;

    // Validate input
    const body = await req.json();
    const { isPremium, expiryDate, productId } = body;

    if (typeof isPremium !== "boolean") {
      return new Response(
        JSON.stringify({ error: "isPremium must be a boolean" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service_role client for writes (bypasses RLS)
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Update profiles.is_premium
    const { error: profileError } = await serviceClient
      .from("profiles")
      .update({
        is_premium: isPremium,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (profileError) {
      console.error("[sync-subscription] Profile update failed:", profileError);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (isPremium) {
      // Activating — upsert subscription record
      const planType = typeof productId === "string" && productId.includes("yearly")
        ? "ios_yearly"
        : "ios_monthly";

      const { error: subError } = await serviceClient
        .from("user_subscriptions")
        .upsert(
          {
            user_id: userId,
            plan_type: planType,
            status: "active",
            is_active: true,
            start_date: new Date().toISOString(),
            end_date: expiryDate || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id", ignoreDuplicates: false }
        );

      if (subError) {
        console.warn("[sync-subscription] Subscription upsert warning:", subError);
        // Non-fatal — profile update is more important
      }
    } else {
      // Deactivating — expire active subscriptions
      const { error: subError } = await serviceClient
        .from("user_subscriptions")
        .update({
          status: "expired",
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("is_active", true);

      if (subError) {
        console.warn("[sync-subscription] Subscription deactivation warning:", subError);
      }
    }

    console.log("[sync-subscription] Synced for user:", userId, "isPremium:", isPremium);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[sync-subscription] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
