import { useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { useMeals, type LoggedMeal } from "@/contexts/MealContext";
import MealDetailSheet from "@/components/MealDetailSheet";

const mealSlots: { type: LoggedMeal["mealType"]; name: string; emoji: string }[] = [
  { type: "breakfast", name: "Café da Manhã", emoji: "☕" },
  { type: "lunch", name: "Almoço", emoji: "🍛" },
  { type: "snack", name: "Lanche", emoji: "🍎" },
  { type: "dinner", name: "Jantar", emoji: "🍽️" },
];

const mealTypeLabels: Record<LoggedMeal["mealType"], string> = {
  breakfast: "Café da Manhã",
  lunch: "Almoço",
  snack: "Lanche",
  dinner: "Jantar",
};

const MealsGrid = () => {
  const { loggedMeals } = useMeals();
  const [selectedType, setSelectedType] = useState<LoggedMeal["mealType"] | null>(null);

  const getMealsForType = (type: LoggedMeal["mealType"]) =>
    loggedMeals.filter((m) => m.mealType === type);

  const getCaloriesForType = (type: LoggedMeal["mealType"]) =>
    getMealsForType(type).reduce((sum, m) => sum + m.items.reduce((s, i) => s + i.calories, 0), 0);

  const selectedMeals = selectedType ? getMealsForType(selectedType) : [];
  const selectedLabel = selectedType ? mealTypeLabels[selectedType] : "";

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-foreground">Refeições</h2>
        <button className="text-sm font-medium text-primary hover:underline">Ver Diário</button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {mealSlots.map((slot) => {
          const cal = Math.round(getCaloriesForType(slot.type));
          const filled = cal > 0;
          return (
            <button
              key={slot.type}
              onClick={() => filled && setSelectedType(slot.type)}
              className={`flex items-center gap-3 rounded-2xl p-4 transition-all duration-300 text-left ${
                filled
                  ? "bg-primary/10 border border-primary/20 cursor-pointer"
                  : "bg-cream hover:bg-cream-dark cursor-default"
              }`}
            >
              <span className="text-2xl">{slot.emoji}</span>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground block">{slot.name}</span>
                {filled && (
                  <span className="text-xs font-semibold text-primary animate-fade-in">
                    {cal} kcal
                  </span>
                )}
              </div>
              {filled ? (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center animate-scale-in">
                  <Check size={12} className="text-primary-foreground" />
                </div>
              ) : (
                <ChevronRight size={16} className="text-muted-foreground" />
              )}
            </button>
          );
        })}
      </div>

      <MealDetailSheet
        open={selectedType !== null}
        onClose={() => setSelectedType(null)}
        meals={selectedMeals}
        title={`Detalhes do ${selectedLabel}`}
      />
    </div>
  );
};

export default MealsGrid;
