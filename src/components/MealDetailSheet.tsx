import { Trash2, Plus, Utensils } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { useMeals, type LoggedMeal } from "@/contexts/MealContext";
import { useNavigate } from "react-router-dom";

interface MealDetailSheetProps {
  open: boolean;
  onClose: () => void;
  meals: LoggedMeal[];
  title: string;
}

const MealDetailSheet = ({ open, onClose, meals, title }: MealDetailSheetProps) => {
  const { removeItemFromMeal } = useMeals();
  const navigate = useNavigate();

  const allItems = meals.flatMap((meal) =>
    meal.items.map((item) => ({ ...item, mealId: meal.id }))
  );

  const totalCalories = allItems.reduce((sum, i) => sum + i.calories, 0);

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="flex items-center gap-2">
            <Utensils size={18} className="text-primary" />
            {title}
          </DrawerTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Total: <span className="font-semibold text-foreground">{Math.round(totalCalories)} kcal</span>
          </p>
        </DrawerHeader>

        <div className="px-4 pb-4 overflow-y-auto space-y-2">
          {allItems.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum item registrado</p>
          )}
          {allItems.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-card border border-border p-3 flex items-center justify-between animate-fade-in"
            >
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

        <DrawerFooter className="pt-2">
          <button
            onClick={() => { onClose(); navigate("/camera"); }}
            className="w-full rounded-2xl bg-primary py-3.5 text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Adicionar mais itens
          </button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default MealDetailSheet;
