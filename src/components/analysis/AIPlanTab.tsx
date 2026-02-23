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
import { Sparkles, Plus, Download, Utensils } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PlanMeal {
  type: string;
  name: string;
  emoji: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface PlanDay {
  label: string;
  meals: PlanMeal[];
}

const mockPlan: PlanDay[] = [
  {
    label: "Dia 1 — Segunda",
    meals: [
      { type: "Pequeno-almoço", name: "Omelete de Espinafres", emoji: "🍳", calories: 280, protein: 22, carbs: 8, fat: 18 },
      { type: "Almoço", name: "Frango Grelhado com Quinoa", emoji: "🍗", calories: 520, protein: 42, carbs: 45, fat: 14 },
      { type: "Lanche", name: "Iogurte com Frutas Vermelhas", emoji: "🍨", calories: 180, protein: 10, carbs: 24, fat: 5 },
      { type: "Jantar", name: "Salmão com Legumes Assados", emoji: "🐟", calories: 480, protein: 38, carbs: 20, fat: 26 },
    ],
  },
  {
    label: "Dia 2 — Terça",
    meals: [
      { type: "Pequeno-almoço", name: "Panqueca Proteica de Banana", emoji: "🥞", calories: 320, protein: 28, carbs: 30, fat: 10 },
      { type: "Almoço", name: "Bowl de Atum e Abacate", emoji: "🥑", calories: 550, protein: 35, carbs: 40, fat: 22 },
      { type: "Lanche", name: "Mix de Castanhas e Frutas Secas", emoji: "🥜", calories: 200, protein: 6, carbs: 18, fat: 14 },
      { type: "Jantar", name: "Risoto de Cogumelos Light", emoji: "🍄", calories: 440, protein: 16, carbs: 55, fat: 12 },
    ],
  },
  {
    label: "Dia 3 — Quarta",
    meals: [
      { type: "Pequeno-almoço", name: "Açaí com Granola e Mel", emoji: "🫐", calories: 380, protein: 8, carbs: 52, fat: 14 },
      { type: "Almoço", name: "Wrap de Frango Caesar", emoji: "🌯", calories: 480, protein: 34, carbs: 38, fat: 18 },
      { type: "Lanche", name: "Smoothie Verde Detox", emoji: "🥤", calories: 160, protein: 6, carbs: 28, fat: 3 },
      { type: "Jantar", name: "Strogonoff de Frango Light", emoji: "🥘", calories: 450, protein: 36, carbs: 30, fat: 16 },
    ],
  },
];

const AIPlanTab = () => {
  const [state, setState] = useState<"idle" | "loading" | "ready">("idle");
  const { toast } = useToast();

  const handleGenerate = () => {
    setState("loading");
    setTimeout(() => setState("ready"), 3000);
  };

  const handleAddToDiary = (meal: PlanMeal) => {
    toast({
      title: "Adicionado ao diário!",
      description: `${meal.emoji} ${meal.name} — ${meal.calories} kcal`,
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
          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
            Deixe a IA criar o seu menu da semana com base nos seus gostos e metabolismo.
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
            A gerar receitas personalizadas...
          </p>
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="rounded-2xl border-0 bg-card shadow-sm">
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-5 w-32 rounded-lg" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Ready — Plan
  return (
    <div className="space-y-4">
      <Accordion type="multiple" className="space-y-3">
        {mockPlan.map((day, dayIndex) => (
          <AccordionItem
            key={dayIndex}
            value={`day-${dayIndex}`}
            className="border-0 rounded-2xl bg-card shadow-sm overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline text-sm font-semibold text-foreground">
              {day.label}
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-3">
                {day.meals.map((meal, mealIndex) => (
                  <div
                    key={mealIndex}
                    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50"
                  >
                    <span className="text-2xl">{meal.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">{meal.type}</p>
                      <p className="text-sm font-semibold text-foreground truncate">{meal.name}</p>
                      <div className="flex gap-2 mt-0.5 text-[10px] text-muted-foreground">
                        <span>{meal.calories} kcal</span>
                        <span>•</span>
                        <span>P {meal.protein}g</span>
                        <span>C {meal.carbs}g</span>
                        <span>G {meal.fat}g</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddToDiary(meal)}
                      className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
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
        onClick={() => setState("idle")}
        variant="ghost"
        className="w-full text-sm text-muted-foreground"
      >
        Gerar novo plano
      </Button>
    </div>
  );
};

export default AIPlanTab;
