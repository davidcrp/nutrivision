import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Asaas webhook event:", body.event, body.payment?.id);

    // Only process payment confirmation events
    const confirmedEvents = [
      "PAYMENT_CONFIRMED",
      "PAYMENT_RECEIVED",
    ];

    if (!confirmedEvents.includes(body.event)) {
      console.log("Ignoring event:", body.event);
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payment = body.payment;
    if (!payment) {
      return new Response(JSON.stringify({ error: "No payment data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // externalReference contains "userId_plan"
    const externalRef = payment.externalReference as string | undefined;
    let userId: string | null = null;
    let plan: string | null = null;

    if (externalRef?.includes("_")) {
      const parts = externalRef.split("_");
      userId = parts[0];
      plan = parts[1];
    }

    // If no externalReference, try to find user by asaas_customer_id
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (!userId && payment.customer) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("asaas_customer_id", payment.customer)
        .single();

      if (profile) {
        userId = profile.user_id;
      }
    }

    if (!userId) {
      console.error("Could not identify user for payment:", payment.id);
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update subscription status
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        subscription_status: "premium",
        subscription_id: payment.id,
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update profile" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("User upgraded to premium:", userId);

    return new Response(JSON.stringify({ received: true, upgraded: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
