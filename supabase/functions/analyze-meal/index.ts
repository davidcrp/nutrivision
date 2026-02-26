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
              content: `Você é um nutricionista clínico e especialista em visão computacional hiper-precisa.
Sua tarefa é analisar a imagem e retornar os dados nutricionais com máxima precisão.

REGRAS DE VERIFICAÇÃO (CRÍTICO):
1. Analise se a imagem contém comida real ou bebida real em um recipiente. Se for um objeto vazio (ex: xícara vazia) ou não comestível, use a função "return_no_food" e PARE.
2. Diferencie com precisão bebidas de sólidos (ex: não confunda café escuro com sopa).
3. NÃO invente alimentos que não estão claramente visíveis na foto.

REGRAS DE MEDIDAS E PORÇÕES (CRÍTICO):
1. NÃO use porções padrão genéricas (ex: '1 porção'). Você DEVE estimar o peso em gramas (g) ou volume em mililitros (ml) com base nas proporções visuais da foto (tamanho do prato, copo, talheres ao redor).
2. Seja realista com as porções:
   - Um prato raso padrão (~22cm) cheio de arroz: 200-250g
   - Um prato fundo cheio de sopa: 300-400ml
   - Um copo americano: ~200ml
   - Uma xícara de café: ~50-80ml
   - Uma colher de sopa cheia: ~15g (sólidos) ou ~15ml (líquidos)
   - Um bife médio: 120-180g
   - Uma porção de feijão (concha média): 80-120g
3. Calcule as calorias e macros EXATAMENTE proporcionais ao peso/volume estimado.
4. Use a Tabela TACO (Tabela Brasileira de Composição de Alimentos) como referência nutricional.
5. Os totais DEVEM ser a soma EXATA dos itens individuais. Verifique a matemática antes de responder.

REGRAS DE NOMENCLATURA:
1. Nomes dos alimentos DEVEM ser em português brasileiro (pt-BR).
2. Use nomes específicos (ex: "Arroz Branco Cozido", não apenas "Arroz").
3. Valores de macronutrientes em gramas, calorias em kcal.`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Primeiro, verifique se esta imagem contém comida ou bebida real. Se não contiver, informe que não há alimento. Se contiver, identifique CADA alimento visível, estime o peso/volume com base nas proporções visuais do recipiente, e calcule os valores nutricionais proporcionalmente usando a Tabela TACO. Confira a soma dos totais.",
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
                description: "Retorna a análise nutricional completa da refeição identificada na imagem.",
                parameters: {
                  type: "object",
                  properties: {
                    is_food: { type: "boolean", description: "true se há comida/bebida real na imagem, false caso contrário" },
                    message: { type: "string", description: "Mensagem quando não há comida (ex: 'Nenhum alimento ou bebida detectado.')" },
                    total_calories: { type: "number", description: "Soma EXATA das calorias de todos os itens (kcal). 0 se is_food=false" },
                    total_protein: { type: "number", description: "Soma EXATA das proteínas de todos os itens (g). 0 se is_food=false" },
                    total_carbs: { type: "number", description: "Soma EXATA dos carboidratos de todos os itens (g). 0 se is_food=false" },
                    total_fat: { type: "number", description: "Soma EXATA das gorduras de todos os itens (g). 0 se is_food=false" },
                    items: {
                      type: "array",
                      description: "Lista dos alimentos/bebidas visíveis na foto com pesos estimados visualmente. Array vazio se is_food=false",
                      items: {
                        type: "object",
                        properties: {
                          food_name: { type: "string", description: "Nome específico do alimento em pt-BR (ex: 'Arroz Branco Cozido')" },
                          weight_grams: { type: "number", description: "Peso estimado em gramas baseado nas proporções visuais do recipiente" },
                          calories: { type: "number", description: "Calorias proporcionais ao peso estimado (kcal)" },
                          protein: { type: "number", description: "Proteínas proporcionais ao peso estimado (g)" },
                          carbs: { type: "number", description: "Carboidratos proporcionais ao peso estimado (g)" },
                          fat: { type: "number", description: "Gorduras proporcionais ao peso estimado (g)" },
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
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados." }),
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
