import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Sparkles, Plus, Download, RefreshCw, Trash2, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMeals } from "@/contexts/MealContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";

// ── Strict typing matching backend response ──

export interface PlanRefeicao {
  tipo: string;
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

interface StoredPlan {
  plan: PlanDia[];
  planStartDate: string;
  dailyGoal: number;
}

const STORAGE_KEY = "nutri_ai_plan";
const PLAN_VALIDITY_DAYS = 7;

const DAY_NAMES = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

const MEAL_EMOJIS: Record<string, string> = {
  "Café da Manhã": "☕",
  "Almoço": "🍛",
  "Lanche": "🍌",
  "Jantar": "🍲",
  "Ceia": "🌙",
  "Pré-treino": "💪",
  "Pós-treino": "🥤",
};

function loadStoredPlan(): StoredPlan | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const stored: StoredPlan = JSON.parse(raw);
    const start = new Date(stored.planStartDate);
    const now = new Date();
    const diffDays = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays >= PLAN_VALIDITY_DAYS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return stored;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function savePlan(plan: PlanDia[], dailyGoal: number) {
  const stored: StoredPlan = {
    plan,
    planStartDate: new Date().toISOString(),
    dailyGoal,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

// ── Component ──

const AIPlanTab = () => {
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [plan, setPlan] = useState<PlanDia[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [addMealDayIndex, setAddMealDayIndex] = useState<number | null>(null);
  const [newMealForm, setNewMealForm] = useState({ tipo: "", nome_prato: "", calorias: "" });
  const { toast } = useToast();
  const { dailyGoal } = useMeals();
  const { subscriptionTier, handlePremiumAction } = useSubscription();

  // ── Load from localStorage on mount ──
  useEffect(() => {
    const stored = loadStoredPlan();
    if (stored && stored.plan.length > 0) {
      setPlan(stored.plan);
      setState("ready");
    }
  }, []);

  // ── Persist plan changes to localStorage ──
  const persistPlan = useCallback(
    (updatedPlan: PlanDia[]) => {
      setPlan(updatedPlan);
      savePlan(updatedPlan, dailyGoal);
    },
    [dailyGoal]
  );

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

      persistPlan(response.plano_semanal);
      setState("ready");
    } catch (e: any) {
      console.error("generate plan error:", e);
      setErrorMsg(e.message || "Erro desconhecido");
      setState("error");
    }
  };

  const handleRegenerate = () => {
    localStorage.removeItem(STORAGE_KEY);
    setPlan([]);
    setState("idle");
  };

  const handleRemoveMeal = (dayIndex: number, mealIndex: number) => {
    const updated = plan.map((day, di) => {
      if (di !== dayIndex) return day;
      return {
        ...day,
        refeicoes: day.refeicoes.filter((_, mi) => mi !== mealIndex),
      };
    });
    persistPlan(updated);
  };

  const handleAddMealSubmit = () => {
    if (addMealDayIndex === null) return;
    const cal = parseInt(newMealForm.calorias) || 0;
    if (!newMealForm.tipo.trim() || !newMealForm.nome_prato.trim() || cal <= 0) {
      toast({ title: "Preencha todos os campos", description: "Nome, prato e calorias são obrigatórios.", variant: "destructive" });
      return;
    }

    const newMeal: PlanRefeicao = {
      tipo: newMealForm.tipo.trim(),
      nome_prato: newMealForm.nome_prato.trim(),
      ingredientes_e_quantidades: "",
      calorias: cal,
      proteinas: 0,
      carboidratos: 0,
      gorduras: 0,
    };

    const updated = plan.map((day, di) => {
      if (di !== addMealDayIndex) return day;
      return { ...day, refeicoes: [...day.refeicoes, newMeal] };
    });

    persistPlan(updated);
    setAddMealDayIndex(null);
    setNewMealForm({ tipo: "", nome_prato: "", calorias: "" });
    toast({ title: "Refeição adicionada!", description: `${newMeal.nome_prato} — ${newMeal.calorias} kcal` });
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
            onClick={() => handlePremiumAction(handleGenerate)}
            className="w-full h-12 rounded-2xl text-base font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
          >
            <Sparkles size={18} />
            {state === "error" ? "Tentar Novamente" : "Gerar Plano com IA"}
            {subscriptionTier === "free" && (
              <span className="ml-2 inline-flex items-center gap-1 bg-amber-400/20 text-amber-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                <Crown size={10} /> PRO
              </span>
            )}
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
      {/* Header with regenerate */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Plano para <span className="font-semibold text-foreground">{dailyGoal} kcal/dia</span> · 7 dias
        </p>
        <button
          onClick={handleRegenerate}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw size={14} />
          <span>Regenerar</span>
        </button>
      </div>

      <Accordion type="multiple" defaultValue={["day-0"]} className="space-y-3">
        {plan.map((day, dayIndex) => (
          <DayAccordion
            key={dayIndex}
            day={day}
            dayIndex={dayIndex}
            onRemoveMeal={handleRemoveMeal}
            onAddToDiary={handleAddToDiary}
            onOpenAddMeal={() => {
              setAddMealDayIndex(dayIndex);
              setNewMealForm({ tipo: "", nome_prato: "", calorias: "" });
            }}
          />
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

      {/* Add Meal Modal */}
      <Dialog open={addMealDayIndex !== null} onOpenChange={(open) => !open && setAddMealDayIndex(null)}>
        <DialogContent className="rounded-2xl max-w-[340px]">
          <DialogHeader>
            <DialogTitle className="text-base">
              Adicionar Refeição — Dia {addMealDayIndex !== null ? plan[addMealDayIndex]?.dia : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs text-muted-foreground">Tipo (ex: Ceia, Pré-treino)</Label>
              <Input
                value={newMealForm.tipo}
                onChange={(e) => setNewMealForm((f) => ({ ...f, tipo: e.target.value }))}
                placeholder="Ceia"
                className="rounded-xl mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Prato</Label>
              <Input
                value={newMealForm.nome_prato}
                onChange={(e) => setNewMealForm((f) => ({ ...f, nome_prato: e.target.value }))}
                placeholder="Iogurte com granola"
                className="rounded-xl mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Calorias (kcal)</Label>
              <Input
                type="number"
                value={newMealForm.calorias}
                onChange={(e) => setNewMealForm((f) => ({ ...f, calorias: e.target.value }))}
                placeholder="200"
                className="rounded-xl mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddMealSubmit} className="w-full rounded-xl bg-primary hover:bg-primary/90">
              <Plus size={16} />
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ── Day Accordion with live-computed totals ──

interface DayAccordionProps {
  day: PlanDia;
  dayIndex: number;
  onRemoveMeal: (dayIndex: number, mealIndex: number) => void;
  onAddToDiary: (meal: PlanRefeicao) => void;
  onOpenAddMeal: () => void;
}

const DayAccordion = ({ day, dayIndex, onRemoveMeal, onAddToDiary, onOpenAddMeal }: DayAccordionProps) => {
  const totalCalories = useMemo(
    () => day.refeicoes.reduce((s, r) => s + r.calorias, 0),
    [day.refeicoes]
  );

  return (
    <AccordionItem
      value={`day-${dayIndex}`}
      className="border-0 rounded-2xl bg-card shadow-sm overflow-hidden"
    >
      <AccordionTrigger className="px-4 py-3 hover:no-underline text-sm font-semibold text-foreground">
        <div className="flex items-center gap-2">
          <span>Dia {day.dia} — {DAY_NAMES[dayIndex] || `Dia ${day.dia}`}</span>
          <span className="text-[10px] font-normal text-muted-foreground">
            ({totalCalories} kcal)
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <div className="space-y-3">
          {day.refeicoes.map((meal, mealIndex) => (
            <div
              key={mealIndex}
              className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50 group"
            >
              <span className="text-2xl mt-0.5">{MEAL_EMOJIS[meal.tipo] || "🍽️"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{meal.tipo}</p>
                <p className="text-sm font-semibold text-foreground">{meal.nome_prato}</p>
                {meal.ingredientes_e_quantidades && (
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{meal.ingredientes_e_quantidades}</p>
                )}
                <div className="flex gap-2 mt-1 text-[10px] text-muted-foreground">
                  <span>{meal.calorias} kcal</span>
                  {(meal.proteinas > 0 || meal.carboidratos > 0 || meal.gorduras > 0) && (
                    <>
                      <span>•</span>
                      <span>P {meal.proteinas}g</span>
                      <span>C {meal.carboidratos}g</span>
                      <span>G {meal.gorduras}g</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0 mt-1">
                <button
                  onClick={() => onAddToDiary(meal)}
                  className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
                >
                  <Plus size={16} />
                </button>
                <button
                  onClick={() => onRemoveMeal(dayIndex, mealIndex)}
                  className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {/* Add extra meal dashed button */}
          <button
            onClick={onOpenAddMeal}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-primary/30 text-primary/70 hover:border-primary/60 hover:text-primary hover:bg-primary/5 transition-all text-sm font-medium"
          >
            <Plus size={16} />
            Adicionar Refeição Extra
          </button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default AIPlanTab;
