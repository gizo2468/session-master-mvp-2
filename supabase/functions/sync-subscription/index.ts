import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const APPLE_VERIFY_PROD = "https://buy.itunes.apple.com/verifyReceipt";
const APPLE_VERIFY_SANDBOX = "https://sandbox.itunes.apple.com/verifyReceipt";

interface AppleReceiptResult {
  status: number;
  latest_receipt_info?: Array<{
    product_id: string;
    expires_date_ms?: string;
    original_transaction_id: string;
  }>;
  pending_renewal_info?: Array<{ auto_renew_status?: string }>;
}

async function verifyAppleReceipt(receiptData: string): Promise<AppleReceiptResult | null> {
  const sharedSecret = Deno.env.get("APPLE_SHARED_SECRET") ?? "";
  const body = JSON.stringify({
    "receipt-data": receiptData,
    password: sharedSecret,
    "exclude-old-transactions": true,
  });

  // Try production first
  let res = await fetch(APPLE_VERIFY_PROD, { method: "POST", body });
  let json = (await res.json()) as AppleReceiptResult;

  // Status 21007 → sandbox receipt sent to production, retry sandbox
  if (json.status === 21007) {
    res = await fetch(APPLE_VERIFY_SANDBOX, { method: "POST", body });
    json = (await res.json()) as AppleReceiptResult;
  }
  return json ?? null;
}

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

    const body = await req.json();
    const { receiptData, isPremium: rawIsPremium } = body;

    // Deactivation path: client can only request deactivation (never self-grant premium)
    if (rawIsPremium === false) {
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await serviceClient
        .from("profiles")
        .update({ is_premium: false, updated_at: new Date().toISOString() })
        .eq("id", userId);
      await serviceClient
        .from("user_subscriptions")
        .update({
          status: "expired",
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("is_active", true);
      return new Response(
        JSON.stringify({ success: true, isPremium: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Activation path: MUST provide a valid Apple receipt — never trust a client boolean.
    if (typeof receiptData !== "string" || receiptData.length < 20) {
      return new Response(
        JSON.stringify({ error: "receiptData (Apple transaction receipt) is required to activate premium." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const verification = await verifyAppleReceipt(receiptData);
    if (!verification || verification.status !== 0) {
      console.warn("[sync-subscription] Receipt verification failed:", verification?.status);
      return new Response(
        JSON.stringify({ error: "Receipt could not be verified with Apple." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the latest still-active transaction
    const now = Date.now();
    const active = (verification.latest_receipt_info ?? [])
      .filter((t) => t.expires_date_ms && Number(t.expires_date_ms) > now)
      .sort((a, b) => Number(b.expires_date_ms) - Number(a.expires_date_ms))[0];

    if (!active) {
      return new Response(
        JSON.stringify({ error: "No active subscription found on receipt." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const verifiedProductId = active.product_id;
    const verifiedExpiryIso = new Date(Number(active.expires_date_ms)).toISOString();
    const planType = verifiedProductId.includes("yearly") ? "ios_yearly" : "ios_monthly";

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: profileError } = await serviceClient
      .from("profiles")
      .update({ is_premium: true, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (profileError) {
      console.error("[sync-subscription] Profile update failed:", profileError);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: subError } = await serviceClient
      .from("user_subscriptions")
      .upsert(
        {
          user_id: userId,
          plan_type: planType,
          status: "active",
          is_active: true,
          start_date: new Date().toISOString(),
          end_date: verifiedExpiryIso,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id", ignoreDuplicates: false }
      );

    if (subError) {
      console.warn("[sync-subscription] Subscription upsert warning:", subError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        isPremium: true,
        productId: verifiedProductId,
        expiryDate: verifiedExpiryIso,
      }),
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
