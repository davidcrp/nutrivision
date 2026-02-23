import { Check, ChevronRight } from "lucide-react";
import { useMeals, type LoggedMeal } from "@/contexts/MealContext";

const mealSlots: { type: LoggedMeal["mealType"]; name: string; emoji: string }[] = [
  { type: "breakfast", name: "Café da Manhã", emoji: "☕" },
  { type: "lunch", name: "Almoço", emoji: "🍛" },
  { type: "snack", name: "Lanche", emoji: "🍎" },
  { type: "dinner", name: "Jantar", emoji: "🍽️" },
];

const MealsGrid = () => {
  const { loggedMeals } = useMeals();

  const getMealCalories = (type: LoggedMeal["mealType"]) => {
    return loggedMeals
      .filter((m) => m.mealType === type)
      .reduce((sum, m) => sum + m.calories, 0);
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-foreground">Refeições</h2>
        <button className="text-sm font-medium text-primary hover:underline">Ver Diário</button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {mealSlots.map((slot) => {
          const cal = getMealCalories(slot.type);
          const filled = cal > 0;
          return (
            <button
              key={slot.type}
              className={`flex items-center gap-3 rounded-2xl p-4 transition-all duration-300 text-left ${
                filled
                  ? "bg-primary/10 border border-primary/20"
                  : "bg-cream hover:bg-cream-dark"
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
    </div>
  );
};

export default MealsGrid;
