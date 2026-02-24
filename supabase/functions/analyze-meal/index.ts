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
          model: "google/gemini-2.5-pro",
          max_tokens: 4096,
          messages: [
            {
              role: "system",
              content: `Você é um nutricionista especialista em visão computacional.

PRIMEIRO PASSO OBRIGATÓRIO: Verifique se a imagem contém comida, bebida ou ingredientes alimentícios reais.

Se NÃO houver comida na imagem (ex: é uma foto de um notebook, um carro, uma pessoa sem comida, um objeto qualquer), você DEVE usar a função "return_no_food" para indicar que não há alimento.

Se HOUVER comida real na imagem, use a função "return_meal_analysis" com a análise nutricional completa.

INSTRUÇÕES PARA ANÁLISE (somente se houver comida):
1. OLHE com atenção para a foto. Identifique APENAS os alimentos que você REALMENTE consegue ver.
2. NÃO invente alimentos que não estão na foto.
3. Estime porções REALISTAS baseadas no tamanho visual do prato. Um prato comum tem ~22cm de diâmetro.
4. Use a Tabela TACO (Tabela Brasileira de Composição de Alimentos) como referência nutricional.
5. Nomes dos alimentos DEVEM ser em português brasileiro (pt-BR).
6. Valores de macronutrientes em gramas, calorias em kcal.
7. Os totais DEVEM ser a soma exata dos itens individuais.

IMPORTANTE: Seja rigoroso. Se a imagem não contém comida, NÃO tente analisar nutricionalmente.`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Primeiro, verifique se esta imagem contém comida real. Se não contiver, informe que não há alimento. Se contiver, analise cada alimento visível, estime o peso e calcule os valores nutricionais.",
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
                description: "Retorna a análise da imagem. Se não houver comida, retorne is_food=false com message. Se houver comida, retorne is_food=true com a análise nutricional.",
                parameters: {
                  type: "object",
                  properties: {
                    is_food: { type: "boolean", description: "true se há comida na imagem, false se não há" },
                    message: { type: "string", description: "Mensagem quando não há comida (ex: 'Nenhum alimento detectado na imagem.')" },
                    total_calories: { type: "number", description: "Soma total de calorias (kcal). 0 se is_food=false" },
                    total_protein: { type: "number", description: "Soma total de proteínas (g). 0 se is_food=false" },
                    total_carbs: { type: "number", description: "Soma total de carboidratos (g). 0 se is_food=false" },
                    total_fat: { type: "number", description: "Soma total de gorduras (g). 0 se is_food=false" },
                    items: {
                      type: "array",
                      description: "Lista dos alimentos visíveis na foto. Array vazio se is_food=false",
                      items: {
                        type: "object",
                        properties: {
                          food_name: { type: "string", description: "Nome do alimento em pt-BR" },
                          weight_grams: { type: "number", description: "Peso estimado em gramas" },
                          calories: { type: "number", description: "Calorias em kcal" },
                          protein: { type: "number", description: "Proteínas em gramas" },
                          carbs: { type: "number", description: "Carboidratos em gramas" },
                          fat: { type: "number", description: "Gorduras em gramas" },
                        },
                        required: ["food_name", "weight_grams", "calories", "protein", "carbs", "fat"],
                      },
                    },
                  },
                  required: ["is_food", "total_calories", "total_protein", "total_carbs", "total_fat", "items"],
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
