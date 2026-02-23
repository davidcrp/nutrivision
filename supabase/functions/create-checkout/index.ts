import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ASAAS_BASE = "https://api.asaas.com/v3";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
    if (!ASAAS_API_KEY) throw new Error("ASAAS_API_KEY is not configured");

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const userEmail = claimsData.claims.email as string;

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("name, asaas_customer_id")
      .eq("user_id", userId)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      return new Response(JSON.stringify({ error: "Could not fetch user profile" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const asaasHeaders = {
      access_token: ASAAS_API_KEY,
      "Content-Type": "application/json",
    };

    // Get or create Asaas customer
    let customerId = profile.asaas_customer_id;

    if (!customerId) {
      const customerRes = await fetch(`${ASAAS_BASE}/customers`, {
        method: "POST",
        headers: asaasHeaders,
        body: JSON.stringify({
          name: profile.name || "Usuário NutriScan",
          email: userEmail,
          externalReference: userId,
        }),
      });

      const customerBody = await customerRes.json();

      if (!customerRes.ok) {
        console.error("Asaas customer error:", customerRes.status, customerBody);
        return new Response(
          JSON.stringify({ error: "Failed to create customer in payment provider" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      customerId = customerBody.id;

      // Persist customer ID in profile
      await supabase
        .from("profiles")
        .update({ asaas_customer_id: customerId })
        .eq("user_id", userId);
    }

    // Parse plan
    const { plan } = await req.json();
    const value = plan === "annual" ? 199.90 : 29.90;
    const description =
      plan === "annual"
        ? "Assinatura PRO Anual - Acesso Ilimitado à IA"
        : "Assinatura PRO Mensal - Acesso Ilimitado à IA";

    const dueDate = new Date(Date.now() + 86400000).toISOString().split("T")[0];

    // Create payment
    const paymentRes = await fetch(`${ASAAS_BASE}/payments`, {
      method: "POST",
      headers: asaasHeaders,
      body: JSON.stringify({
        customer: customerId,
        billingType: "UNDEFINED",
        value,
        dueDate,
        description,
        externalReference: `${userId}_${plan}`,
      }),
    });

    const paymentBody = await paymentRes.json();

    if (!paymentRes.ok) {
      console.error("Asaas payment error:", paymentRes.status, paymentBody);
      return new Response(
        JSON.stringify({ error: "Failed to create payment" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!paymentBody.invoiceUrl) {
      return new Response(
        JSON.stringify({ error: "Payment provider did not return a payment URL" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ paymentUrl: paymentBody.invoiceUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("create-checkout error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
