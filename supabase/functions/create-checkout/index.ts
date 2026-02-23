import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
    if (!ASAAS_API_KEY) {
      throw new Error("ASAAS_API_KEY is not configured");
    }

    const { plan } = await req.json();
    const value = plan === "annual" ? 199.90 : 29.90;
    const description =
      plan === "annual"
        ? "Assinatura PRO Anual - Acesso Ilimitado à IA"
        : "Assinatura PRO Mensal - Acesso Ilimitado à IA";

    const dueDate = new Date(Date.now() + 86400000).toISOString().split("T")[0];

    // First, create/find a customer (Asaas requires a customer for payments)
    // Using a generic customer for now - in production, use the authenticated user's data
    const authHeader = req.headers.get("Authorization");
    let customerName = "Usuário NutriScan";
    let customerCpf = "00000000000";

    // Create payment
    const asaasResponse = await fetch("https://api.asaas.com/v3/payments", {
      method: "POST",
      headers: {
        access_token: ASAAS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        billingType: "UNDEFINED",
        value,
        dueDate,
        description,
        externalReference: plan,
      }),
    });

    if (!asaasResponse.ok) {
      const errorBody = await asaasResponse.text();
      console.error("Asaas API error:", asaasResponse.status, errorBody);
      return new Response(
        JSON.stringify({ error: `Asaas returned ${asaasResponse.status}: ${errorBody}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const asaasData = await asaasResponse.json();
    console.log("Asaas payment created:", asaasData.id);

    if (!asaasData.invoiceUrl) {
      return new Response(
        JSON.stringify({ error: "Asaas did not return an invoiceUrl" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ paymentUrl: asaasData.invoiceUrl }),
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
