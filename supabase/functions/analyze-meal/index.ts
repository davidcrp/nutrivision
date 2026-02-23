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
    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "imageUrl is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are a nutritionist AI that analyzes food photos. You MUST respond with ONLY a valid JSON object, no markdown, no explanation, no extra text.

The JSON must follow this exact schema:
{
  "total_calories": number,
  "total_protein": number,
  "total_carbs": number,
  "total_fat": number,
  "items": [
    {
      "food_name": string,
      "weight_grams": number,
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number
    }
  ]
}

Rules:
- Identify every visible food item on the plate/photo.
- Estimate realistic portion sizes in grams.
- Use standard nutritional data (TACO table for Brazilian foods when applicable).
- All macro values are in grams, calories in kcal.
- food_name should be in Portuguese (pt-BR).
- totals must be the sum of all items.
- Respond with ONLY the JSON, nothing else.`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analyze this meal photo and return the nutritional breakdown as JSON.",
                },
                {
                  type: "image_url",
                  image_url: { url: imageUrl },
                },
              ],
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_meal_analysis",
                description:
                  "Return the structured nutritional analysis of a meal photo.",
                parameters: {
                  type: "object",
                  properties: {
                    total_calories: { type: "number" },
                    total_protein: { type: "number" },
                    total_carbs: { type: "number" },
                    total_fat: { type: "number" },
                    items: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          food_name: { type: "string" },
                          weight_grams: { type: "number" },
                          calories: { type: "number" },
                          protein: { type: "number" },
                          carbs: { type: "number" },
                          fat: { type: "number" },
                        },
                        required: [
                          "food_name",
                          "weight_grams",
                          "calories",
                          "protein",
                          "carbs",
                          "fat",
                        ],
                      },
                    },
                  },
                  required: [
                    "total_calories",
                    "total_protein",
                    "total_carbs",
                    "total_fat",
                    "items",
                  ],
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "return_meal_analysis" },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI gateway returned ${response.status}`);
    }

    const data = await response.json();

    // Extract from tool call response
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const analysis =
        typeof toolCall.function.arguments === "string"
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function.arguments;

      return new Response(JSON.stringify(analysis), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: try parsing content directly
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      const cleaned = content.replace(/```json\n?|```/g, "").trim();
      const analysis = JSON.parse(cleaned);
      return new Response(JSON.stringify(analysis), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("No valid response from AI");
  } catch (e) {
    console.error("analyze-meal error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
