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
    const { dailyCalories } = await req.json();
    if (!dailyCalories || typeof dailyCalories !== "number") {
      return new Response(JSON.stringify({ error: "dailyCalories (number) is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um nutricionista esportivo e clínico especialista na cultura alimentar brasileira.

Sua tarefa é criar um cardápio semanal completo (7 dias) estritamente baseado na meta diária de calorias do usuário.

META DIÁRIA DO USUÁRIO: ${dailyCalories} kcal.

REGRAS OBRIGATÓRIAS DE CARDÁPIO (CULTURA BRASILEIRA):

1. Use ingredientes reais, acessíveis e comuns no dia a dia do brasileiro.
2. O Almoço DEVE conter a base de Arroz e Feijão na maioria dos dias, acompanhado de uma proteína (frango, carne moída, ovo, peixe, pernil) e vegetais/salada.
3. Para o Café da Manhã e Lanche, priorize opções como: pão francês, cuscuz, tapioca, ovo mexido, queijo minas, mamão, banana com aveia, café com leite.
4. O Jantar pode ser uma refeição semelhante ao almoço (comida de panela) ou lanches nutritivos e sopas, dependendo do volume calórico.
5. Evite ingredientes importados, caros ou incomuns (ex: não sugira "framboesas frescas com xarope de bordo" ou "salmão defumado" em todos os dias).

IMPORTANTE: A soma das calorias das 4 refeições de cada dia deve ser exatamente igual (com margem de erro de 50 kcal) à META DIÁRIA do usuário de ${dailyCalories} kcal.`;

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
          max_tokens: 8192,
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Crie o cardápio semanal completo de 7 dias para ${dailyCalories} kcal/dia. Use a função fornecida para retornar os dados estruturados.`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_meal_plan",
                description: "Retorna o plano alimentar semanal estruturado em JSON.",
                parameters: {
                  type: "object",
                  properties: {
                    plano_semanal: {
                      type: "array",
                      description: "Array de 7 dias com refeições",
                      items: {
                        type: "object",
                        properties: {
                          dia: { type: "number", description: "Número do dia (1 a 7)" },
                          total_calorias_dia: { type: "number", description: "Soma total de calorias do dia" },
                          refeicoes: {
                            type: "array",
                            description: "4 refeições do dia",
                            items: {
                              type: "object",
                              properties: {
                                tipo: {
                                  type: "string",
                                  enum: ["Café da Manhã", "Almoço", "Lanche", "Jantar"],
                                  description: "Tipo da refeição",
                                },
                                nome_prato: { type: "string", description: "Nome do prato brasileiro" },
                                ingredientes_e_quantidades: { type: "string", description: "Lista de ingredientes com quantidades" },
                                calorias: { type: "number", description: "Calorias em kcal" },
                                proteinas: { type: "number", description: "Proteínas em gramas" },
                                carboidratos: { type: "number", description: "Carboidratos em gramas" },
                                gorduras: { type: "number", description: "Gorduras em gramas" },
                              },
                              required: ["tipo", "nome_prato", "ingredientes_e_quantidades", "calorias", "proteinas", "carboidratos", "gorduras"],
                            },
                          },
                        },
                        required: ["dia", "total_calorias_dia", "refeicoes"],
                      },
                    },
                  },
                  required: ["plano_semanal"],
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "return_meal_plan" },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Adicione fundos para continuar." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI gateway returned ${response.status}`);
    }

    const data = await response.json();

    // Extract from tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const plan =
        typeof toolCall.function.arguments === "string"
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function.arguments;

      return new Response(JSON.stringify(plan), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: parse content
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      const cleaned = content.replace(/```json\n?|```/g, "").trim();
      const plan = JSON.parse(cleaned);
      return new Response(JSON.stringify(plan), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("No valid response from AI");
  } catch (e) {
    console.error("generate-meal-plan error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
