import { useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { useMeals, type LoggedMeal } from "@/contexts/MealContext";
import MealDetailSheet from "@/components/MealDetailSheet";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Utensils, Trash2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  const { loggedMeals, removeItemFromMeal } = useMeals();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<LoggedMeal["mealType"] | null>(null);
  const [diaryOpen, setDiaryOpen] = useState(false);

  const getMealsForType = (type: LoggedMeal["mealType"]) =>
    loggedMeals.filter((m) => m.mealType === type);

  const getCaloriesForType = (type: LoggedMeal["mealType"]) =>
    getMealsForType(type).reduce((sum, m) => sum + m.items.reduce((s, i) => s + i.calories, 0), 0);

  const selectedMeals = selectedType ? getMealsForType(selectedType) : [];
  const selectedLabel = selectedType ? mealTypeLabels[selectedType] : "";

  const allItems = loggedMeals.flatMap((meal) =>
    meal.items.map((item) => ({ ...item, mealId: meal.id, mealType: meal.mealType }))
  );
  const totalCalories = allItems.reduce((sum, i) => sum + i.calories, 0);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-foreground">Refeições</h2>
        <button onClick={() => setDiaryOpen(true)} className="text-sm font-medium text-primary hover:underline">Ver Diário</button>
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

      <Drawer open={diaryOpen} onOpenChange={(o) => !o && setDiaryOpen(false)}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="flex items-center gap-2">
              <Utensils size={18} className="text-primary" />
              Diário do Dia
            </DrawerTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Total: <span className="font-semibold text-foreground">{Math.round(totalCalories)} kcal</span>
              {" · "}{allItems.length} {allItems.length === 1 ? "item" : "itens"}
            </p>
          </DrawerHeader>

          <div className="px-4 pb-4 overflow-y-auto space-y-3">
            {allItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma refeição registrada hoje</p>
            ) : (
              mealSlots.map((slot) => {
                const items = loggedMeals
                  .filter((m) => m.mealType === slot.type)
                  .flatMap((meal) => meal.items.map((item) => ({ ...item, mealId: meal.id })));
                if (items.length === 0) return null;
                return (
                  <div key={slot.type}>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">{slot.emoji} {slot.name}</p>
                    <div className="space-y-1.5">
                      {items.map((item) => (
                        <div key={item.id} className="rounded-2xl bg-card border border-border p-3 flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-foreground">{item.food_name}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-xs text-muted-foreground">{item.weight_grams}g</span>
                              <span className="text-xs text-accent font-semibold">{Math.round(item.calories)} kcal</span>
                            </div>
                            <div className="flex gap-2 mt-0.5">
                              <span className="text-[10px] text-muted-foreground">P:{item.protein.toFixed(1)}g</span>
                              <span className="text-[10px] text-muted-foreground">C:{item.carbs.toFixed(1)}g</span>
                              <span className="text-[10px] text-muted-foreground">G:{item.fat.toFixed(1)}g</span>
                            </div>
                          </div>
                          <button
                            onClick={() => removeItemFromMeal(item.mealId, item.id)}
                            className="p-2 rounded-xl hover:bg-destructive/10 transition-colors group"
                          >
                            <Trash2 size={16} className="text-muted-foreground group-hover:text-destructive transition-colors" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <DrawerFooter className="pt-2">
            <button
              onClick={() => { setDiaryOpen(false); navigate("/camera"); }}
              className="w-full rounded-2xl bg-primary py-3.5 text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Adicionar refeição
            </button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default MealsGrid;
