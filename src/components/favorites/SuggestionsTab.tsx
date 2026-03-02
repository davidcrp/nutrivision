import { useState } from "react";
import { Heart, Loader2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { type PortionModalFood } from "@/components/PortionModal";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface BrazilianFood {
  name: string;
  emoji: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  weightGrams: number;
  mealType: string;
  description: string;
}

const brazilianClassics: BrazilianFood[] = [
  {
    name: "Pão na Chapa com Pingado",
    emoji: "☕",
    calories: 320,
    protein: 10,
    carbs: 42,
    fat: 12,
    weightGrams: 250,
    mealType: "breakfast",
    description: "Café da manhã clássico de padaria",
  },
  {
    name: "Tapioca de Queijo Coalho",
    emoji: "🫓",
    calories: 280,
    protein: 12,
    carbs: 35,
    fat: 10,
    weightGrams: 150,
    mealType: "breakfast",
    description: "Café da manhã ou lanche nordestino",
  },
  {
    name: "Cuscuz com Ovo Mexido",
    emoji: "🥚",
    calories: 310,
    protein: 14,
    carbs: 40,
    fat: 11,
    weightGrams: 200,
    mealType: "breakfast",
    description: "Clássico do café da manhã nordestino",
  },
  {
    name: "Prato Feito: Arroz, Feijão, Frango e Salada",
    emoji: "🍛",
    calories: 550,
    protein: 35,
    carbs: 65,
    fat: 14,
    weightGrams: 400,
    mealType: "lunch",
    description: "O tradicional PF brasileiro",
  },
  {
    name: "Feijoada Completa",
    emoji: "🫘",
    calories: 650,
    protein: 38,
    carbs: 55,
    fat: 28,
    weightGrams: 450,
    mealType: "lunch",
    description: "Prato típico com arroz, couve e farofa",
  },
  {
    name: "Crepioca de Frango",
    emoji: "🥞",
    calories: 250,
    protein: 22,
    carbs: 18,
    fat: 9,
    weightGrams: 150,
    mealType: "snack",
    description: "Lanche proteico fit",
  },
  {
    name: "Pão de Queijo (3 unidades)",
    emoji: "🧀",
    calories: 270,
    protein: 8,
    carbs: 33,
    fat: 12,
    weightGrams: 90,
    mealType: "snack",
    description: "Lanche mineiro clássico",
  },
  {
    name: "Açaí com Granola e Banana",
    emoji: "🫐",
    calories: 380,
    protein: 5,
    carbs: 62,
    fat: 14,
    weightGrams: 300,
    mealType: "snack",
    description: "Energia do norte do Brasil",
  },
  {
    name: "Misto Quente",
    emoji: "🥪",
    calories: 230,
    protein: 12,
    carbs: 26,
    fat: 9,
    weightGrams: 120,
    mealType: "snack",
    description: "Lanche rápido de padaria",
  },
  {
    name: "Sopa de Legumes com Frango",
    emoji: "🍲",
    calories: 280,
    protein: 22,
    carbs: 30,
    fat: 7,
    weightGrams: 350,
    mealType: "dinner",
    description: "Jantar leve e nutritivo",
  },
];

const mealTypeLabels: Record<string, string> = {
  breakfast: "Café da Manhã",
  lunch: "Almoço",
  snack: "Lanche",
  dinner: "Jantar",
};

interface SuggestionsTabProps {
  onSaved: () => void;
  onQuickLog: (food: PortionModalFood) => void;
}

const SuggestionsTab = ({ onSaved, onQuickLog }: SuggestionsTabProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [savingName, setSavingName] = useState<string | null>(null);
  const [savedNames, setSavedNames] = useState<Set<string>>(new Set());

  const saveToFavorites = async (food: BrazilianFood) => {
    if (!user || savingName) return;
    setSavingName(food.name);

    try {
      const { error } = await supabase
        .from("favorite_meals")
        .insert({
          user_id: user.id,
          name: food.name,
          emoji: food.emoji,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
          weight_grams: food.weightGrams,
          meal_type: food.mealType,
        });

      if (error) {
        if (error.code === "23505") {
          toast({ title: "Já está nos favoritos!", description: `${food.name} já foi salvo anteriormente.` });
        } else {
          throw error;
        }
      } else {
        setSavedNames((prev) => new Set(prev).add(food.name));
        toast({ title: "❤️ Salvo nos Favoritos!", description: `${food.name} adicionado à sua lista.` });
        onSaved();
      }
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Não foi possível salvar.",
        variant: "destructive",
      });
    } finally {
      setSavingName(null);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🇧🇷</span>
        <div>
          <h2 className="text-sm font-bold text-foreground">Clássicos do Brasil</h2>
          <p className="text-xs text-muted-foreground">Refeições brasileiras com macros calculados</p>
        </div>
      </div>

      <div className="space-y-3">
        {brazilianClassics.map((food) => {
          const isSaved = savedNames.has(food.name);
          const isSaving = savingName === food.name;

          return (
            <div
              key={food.name}
              className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-cream flex items-center justify-center text-2xl shrink-0">
                {food.emoji}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{food.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {food.calories} kcal · {mealTypeLabels[food.mealType]}
                </p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                  P: {food.protein}g • C: {food.carbs}g • G: {food.fat}g
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Quick-log via portion modal */}
                <button
                  onClick={() => onQuickLog({
                    name: food.name,
                    emoji: food.emoji,
                    calories: food.calories,
                    protein: food.protein,
                    carbs: food.carbs,
                    fat: food.fat,
                    weight_grams: food.weightGrams,
                    meal_type: food.mealType,
                  })}
                  className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center hover:bg-primary/25 transition-colors"
                >
                  <Plus size={18} className="text-primary" />
                </button>

                {/* Save to favorites */}
                <button
                  onClick={() => saveToFavorites(food)}
                  disabled={isSaving || isSaved}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-all ${
                    isSaved
                      ? "bg-destructive/10 text-destructive"
                      : "bg-primary/15 text-primary hover:bg-primary/25"
                  } disabled:opacity-60`}
                >
                  {isSaving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Heart size={14} className={isSaved ? "fill-destructive" : ""} />
                  )}
                  {isSaved ? "Salvo" : "Salvar"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SuggestionsTab;
