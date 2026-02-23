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
import { supabase } from "@/integrations/supabase/client";

// ── Strict typing matching backend response ──

export interface PlanRefeicao {
  tipo: "Café da Manhã" | "Almoço" | "Lanche" | "Jantar";
  nome_prato: string;
  ingredientes_e_quantidades: string;
  calorias: number;
  proteinas: number;
  carboidratos: number;
  gorduras: number;
}

export interface PlanDia {
  dia: number;
  total_calorias_dia: number;
  refeicoes: PlanRefeicao[];
}

export interface PlanSemanalResponse {
  plano_semanal: PlanDia[];
}

const DAY_NAMES = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

const MEAL_EMOJIS: Record<string, string> = {
  "Café da Manhã": "☕",
  "Almoço": "🍛",
  "Lanche": "🍌",
  "Jantar": "🍲",
};

// ── Component ──

const AIPlanTab = () => {
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [plan, setPlan] = useState<PlanDia[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const { toast } = useToast();
  const { dailyGoal } = useMeals();

  const handleGenerate = async () => {
    setState("loading");
    setErrorMsg("");

    try {
      const { data, error } = await supabase.functions.invoke("generate-meal-plan", {
        body: { dailyCalories: dailyGoal },
      });

      if (error) throw new Error(error.message || "Erro ao gerar plano");

      const response = data as PlanSemanalResponse;
      if (!response?.plano_semanal?.length) {
        throw new Error("Resposta inválida da IA");
      }

      setPlan(response.plano_semanal);
      setState("ready");
    } catch (e: any) {
      console.error("generate plan error:", e);
      setErrorMsg(e.message || "Erro desconhecido");
      setState("error");
    }
  };

  const handleAddToDiary = (meal: PlanRefeicao) => {
    toast({
      title: "Adicionado ao diário!",
      description: `${MEAL_EMOJIS[meal.tipo] || "🍽️"} ${meal.nome_prato} — ${meal.calorias} kcal`,
    });
  };

  const handleExportPDF = () => {
    toast({
      title: "Funcionalidade Premium",
      description: "O download de PDF estará disponível na versão Premium.",
    });
  };

  // Idle — CTA
  if (state === "idle" || state === "error") {
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
          {state === "error" && (
            <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-xs">
              {errorMsg}
            </div>
          )}
          <Button
            onClick={handleGenerate}
            className="w-full h-12 rounded-2xl text-base font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
          >
            <Sparkles size={18} />
            {state === "error" ? "Tentar Novamente" : "Gerar Plano com IA"}
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
            A gerar receitas brasileiras para {dailyGoal} kcal/dia...
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
        {plan.map((day, dayIndex) => (
          <AccordionItem
            key={dayIndex}
            value={`day-${dayIndex}`}
            className="border-0 rounded-2xl bg-card shadow-sm overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline text-sm font-semibold text-foreground">
              <div className="flex items-center gap-2">
                <span>Dia {day.dia} — {DAY_NAMES[dayIndex] || `Dia ${day.dia}`}</span>
                <span className="text-[10px] font-normal text-muted-foreground">
                  ({day.total_calorias_dia || day.refeicoes.reduce((s, r) => s + r.calorias, 0)} kcal)
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-3">
                {day.refeicoes.map((meal, mealIndex) => (
                  <div
                    key={mealIndex}
                    className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50"
                  >
                    <span className="text-2xl mt-0.5">{MEAL_EMOJIS[meal.tipo] || "🍽️"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{meal.tipo}</p>
                      <p className="text-sm font-semibold text-foreground">{meal.nome_prato}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{meal.ingredientes_e_quantidades}</p>
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
        ))}
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
