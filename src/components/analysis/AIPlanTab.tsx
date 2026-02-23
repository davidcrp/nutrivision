import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Sparkles, Plus, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMeals } from "@/contexts/MealContext";

// ── Strict typing for AI-generated plan ──

export interface PlanRefeicao {
  tipo: "Café da Manhã" | "Almoço" | "Lanche" | "Jantar";
  nome_prato: string;
  descricao_brasileira: string;
  emoji: string;
  calorias: number;
  proteinas: number;
  carboidratos: number;
  gorduras: number;
}

export interface PlanDia {
  dia: number;
  label: string;
  refeicoes: PlanRefeicao[];
}

export type PlanSemanal = PlanDia[];

// ── Mock 7-day plan generator (simulates backend response) ──

const DAY_NAMES = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

function generateMockPlan(dailyGoal: number): PlanSemanal {
  const target = dailyGoal;
  const breakfastPct = 0.2, lunchPct = 0.35, snackPct = 0.1, dinnerPct = 0.35;

  const meals: Record<string, { nome: string; desc: string; emoji: string }[]> = {
    "Café da Manhã": [
      { nome: "Omelete de Espinafres", desc: "Omelete leve com espinafre refogado e queijo branco", emoji: "🍳" },
      { nome: "Panqueca Proteica de Banana", desc: "Panqueca feita com aveia, banana e whey protein", emoji: "🥞" },
      { nome: "Açaí com Granola e Mel", desc: "Tigela de açaí batido com granola crocante e mel", emoji: "🫐" },
      { nome: "Tapioca com Queijo Cottage", desc: "Tapioca recheada com cottage e orégano", emoji: "🫓" },
      { nome: "Iogurte Natural com Frutas", desc: "Iogurte natural com morango, blueberry e chia", emoji: "🍨" },
      { nome: "Crepioca Fit", desc: "Crepioca com ovo e goma de tapioca, recheio de queijo", emoji: "🧇" },
      { nome: "Pão Integral com Abacate", desc: "Torrada integral com abacate amassado e ovo pochê", emoji: "🥑" },
    ],
    "Almoço": [
      { nome: "Frango Grelhado com Quinoa", desc: "Peito de frango grelhado com quinoa e legumes salteados", emoji: "🍗" },
      { nome: "Poke Bowl de Salmão", desc: "Bowl com arroz japonês, salmão fresco, pepino e abacate", emoji: "🐟" },
      { nome: "Wrap de Frango Caesar", desc: "Wrap integral com frango grelhado e molho caesar light", emoji: "🌯" },
      { nome: "Feijoada Light", desc: "Feijoada com cortes magros, arroz integral e couve", emoji: "🍲" },
      { nome: "Macarrão Integral à Bolonhesa", desc: "Massa integral com molho bolonhesa de carne magra", emoji: "🍝" },
      { nome: "Bowl de Quinoa e Grão-de-bico", desc: "Quinoa com grão-de-bico, tomate seco e hortelã", emoji: "🥣" },
      { nome: "Escondidinho de Frango", desc: "Purê de mandioquinha com frango desfiado gratinado", emoji: "🥘" },
    ],
    "Lanche": [
      { nome: "Iogurte com Frutas Vermelhas", desc: "Iogurte grego com mix de frutas vermelhas", emoji: "🍓" },
      { nome: "Mix de Castanhas", desc: "Porção de castanhas, nozes e amêndoas", emoji: "🥜" },
      { nome: "Smoothie Verde Detox", desc: "Smoothie de espinafre, banana e leite vegetal", emoji: "🥤" },
      { nome: "Banana com Pasta de Amendoim", desc: "Banana fatiada com pasta de amendoim integral", emoji: "🍌" },
      { nome: "Barra de Proteína Caseira", desc: "Barra feita com aveia, whey e cacau", emoji: "🍫" },
      { nome: "Sanduíche Natural de Atum", desc: "Pão integral com pasta de atum light e cenoura", emoji: "🥪" },
      { nome: "Bolinhas de Coco e Tâmara", desc: "Energy balls de coco ralado, tâmara e cacau", emoji: "🥥" },
    ],
    "Jantar": [
      { nome: "Salmão com Legumes Assados", desc: "Filé de salmão grelhado com mix de legumes no forno", emoji: "🐠" },
      { nome: "Risoto de Cogumelos Light", desc: "Risoto cremoso com cogumelos paris e parmesão", emoji: "🍄" },
      { nome: "Strogonoff de Frango Light", desc: "Strogonoff com creme de leite light e champignon", emoji: "🥘" },
      { nome: "Sopa de Legumes com Frango", desc: "Sopa cremosa de legumes com frango desfiado", emoji: "🍲" },
      { nome: "Omelete de Forno", desc: "Omelete assada com brócolis, tomate e queijo", emoji: "🍳" },
      { nome: "Frango ao Curry com Arroz", desc: "Peito de frango em molho curry leve com arroz basmati", emoji: "🍛" },
      { nome: "Salada Caesar Completa", desc: "Alface romana, frango, croutons e parmesão", emoji: "🥬" },
    ],
  };

  function pick(arr: { nome: string; desc: string; emoji: string }[], dayIdx: number) {
    return arr[dayIdx % arr.length];
  }

  function macros(cal: number) {
    const protein = Math.round(cal * 0.3 / 4);
    const carbs = Math.round(cal * 0.45 / 4);
    const fat = Math.round(cal * 0.25 / 9);
    return { proteinas: protein, carboidratos: carbs, gorduras: fat };
  }

  return Array.from({ length: 7 }, (_, i) => {
    const bCal = Math.round(target * breakfastPct);
    const lCal = Math.round(target * lunchPct);
    const sCal = Math.round(target * snackPct);
    const dCal = Math.round(target * dinnerPct);

    const b = pick(meals["Café da Manhã"], i);
    const l = pick(meals["Almoço"], i);
    const s = pick(meals["Lanche"], i);
    const d = pick(meals["Jantar"], i);

    return {
      dia: i + 1,
      label: `Dia ${i + 1} — ${DAY_NAMES[i]}`,
      refeicoes: [
        { tipo: "Café da Manhã" as const, nome_prato: b.nome, descricao_brasileira: b.desc, emoji: b.emoji, calorias: bCal, ...macros(bCal) },
        { tipo: "Almoço" as const, nome_prato: l.nome, descricao_brasileira: l.desc, emoji: l.emoji, calorias: lCal, ...macros(lCal) },
        { tipo: "Lanche" as const, nome_prato: s.nome, descricao_brasileira: s.desc, emoji: s.emoji, calorias: sCal, ...macros(sCal) },
        { tipo: "Jantar" as const, nome_prato: d.nome, descricao_brasileira: d.desc, emoji: d.emoji, calorias: dCal, ...macros(dCal) },
      ],
    };
  });
}

// ── Simulates async backend call ──

async function fetchGeneratedPlan(dailyGoal: number): Promise<PlanSemanal> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(generateMockPlan(dailyGoal)), 3000);
  });
}

// ── Component ──

const AIPlanTab = () => {
  const [state, setState] = useState<"idle" | "loading" | "ready">("idle");
  const [plan, setPlan] = useState<PlanSemanal>([]);
  const { toast } = useToast();
  const { dailyGoal } = useMeals();

  const handleGenerate = async () => {
    setState("loading");
    const result = await fetchGeneratedPlan(dailyGoal);
    setPlan(result);
    setState("ready");
  };

  const handleAddToDiary = (meal: PlanRefeicao) => {
    toast({
      title: "Adicionado ao diário!",
      description: `${meal.emoji} ${meal.nome_prato} — ${meal.calorias} kcal`,
    });
  };

  const handleExportPDF = () => {
    toast({
      title: "Funcionalidade Premium",
      description: "O download de PDF estará disponível na versão Premium.",
    });
  };

  // Idle — CTA
  if (state === "idle") {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl p-6 text-center bg-gradient-to-br from-primary/15 via-lilac/15 to-accent/15">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Sparkles size={28} className="text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            Plano Alimentar com IA
          </h3>
          <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
            Deixe a IA criar o seu menu da semana com base nos seus gostos e metabolismo.
          </p>
          <p className="text-xs text-muted-foreground/70 mb-5">
            Meta atual: <span className="font-semibold text-foreground">{dailyGoal} kcal/dia</span>
          </p>
          <Button
            onClick={handleGenerate}
            className="w-full h-12 rounded-2xl text-base font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
          >
            <Sparkles size={18} />
            Gerar Plano com IA (Premium)
          </Button>
        </div>
      </div>
    );
  }

  // Loading
  if (state === "loading") {
    return (
      <div className="space-y-4">
        <div className="text-center py-6">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 animate-pulse">
            <Sparkles size={24} className="text-primary" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">
            A cruzar os seus dados metabólicos...
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1 animate-pulse">
            A gerar receitas para {dailyGoal} kcal/dia...
          </p>
        </div>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="rounded-2xl border-0 bg-card shadow-sm">
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-5 w-36 rounded-lg" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Ready — 7-day Plan
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Plano para <span className="font-semibold text-foreground">{dailyGoal} kcal/dia</span> · 7 dias
        </p>
      </div>

      <Accordion type="multiple" defaultValue={["day-0"]} className="space-y-3">
        {plan.map((day, dayIndex) => {
          const dayCal = day.refeicoes.reduce((s, r) => s + r.calorias, 0);
          return (
            <AccordionItem
              key={dayIndex}
              value={`day-${dayIndex}`}
              className="border-0 rounded-2xl bg-card shadow-sm overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline text-sm font-semibold text-foreground">
                <div className="flex items-center gap-2">
                  <span>{day.label}</span>
                  <span className="text-[10px] font-normal text-muted-foreground">({dayCal} kcal)</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3">
                  {day.refeicoes.map((meal, mealIndex) => (
                    <div
                      key={mealIndex}
                      className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50"
                    >
                      <span className="text-2xl mt-0.5">{meal.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{meal.tipo}</p>
                        <p className="text-sm font-semibold text-foreground truncate">{meal.nome_prato}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{meal.descricao_brasileira}</p>
                        <div className="flex gap-2 mt-1 text-[10px] text-muted-foreground">
                          <span>{meal.calorias} kcal</span>
                          <span>•</span>
                          <span>P {meal.proteinas}g</span>
                          <span>C {meal.carboidratos}g</span>
                          <span>G {meal.gorduras}g</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddToDiary(meal)}
                        className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors mt-1"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <Button
        onClick={handleExportPDF}
        variant="outline"
        className="w-full h-11 rounded-2xl border-border text-muted-foreground"
      >
        <Download size={16} />
        Baixar Plano em PDF
      </Button>

      <Button
        onClick={() => { setState("idle"); setPlan([]); }}
        variant="ghost"
        className="w-full text-sm text-muted-foreground"
      >
        Gerar novo plano
      </Button>
    </div>
  );
};

export default AIPlanTab;
