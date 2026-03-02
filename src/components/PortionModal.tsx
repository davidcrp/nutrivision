import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useMeals } from "@/contexts/MealContext";
import { useToast } from "@/hooks/use-toast";

type MealType = "breakfast" | "lunch" | "snack" | "dinner";

const mealOptions: { value: MealType; label: string; emoji: string }[] = [
  { value: "breakfast", label: "Café", emoji: "☕" },
  { value: "lunch", label: "Almoço", emoji: "🍽️" },
  { value: "snack", label: "Lanche", emoji: "🍎" },
  { value: "dinner", label: "Jantar", emoji: "🌙" },
];

export interface PortionModalFood {
  name: string;
  emoji: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  weight_grams: number;
  meal_type: string;
}

interface PortionModalProps {
  food: PortionModalFood;
  onClose: () => void;
  onAdded?: () => void;
}

const PortionModal = ({ food, onClose, onAdded }: PortionModalProps) => {
  const { addMeal } = useMeals();
  const { toast } = useToast();

  const baseWeight = food.weight_grams || 100;
  const [quantity, setQuantity] = useState(1);
  const [selectedMealType, setSelectedMealType] = useState<MealType>(
    (food.meal_type as MealType) || "lunch"
  );
  const [adding, setAdding] = useState(false);

  const factor = quantity;
  const adjustedCalories = Math.round(food.calories * factor);
  const adjustedProtein = Math.round(food.protein * factor * 10) / 10;
  const adjustedCarbs = Math.round(food.carbs * factor * 10) / 10;
  const adjustedFat = Math.round(food.fat * factor * 10) / 10;
  const adjustedWeight = Math.round(baseWeight * factor);

  const handleAdd = async () => {
    if (adding) return;
    setAdding(true);
    try {
      await addMeal({
        mealType: selectedMealType,
        items: [
          {
            id: crypto.randomUUID(),
            food_name: food.name,
            calories: adjustedCalories,
            protein: adjustedProtein,
            carbs: adjustedCarbs,
            fat: adjustedFat,
            weight_grams: adjustedWeight,
          },
        ],
      });
      const label = mealOptions.find((m) => m.value === selectedMealType)?.label ?? "";
      toast({
        title: "✅ Adicionado!",
        description: `${food.name} adicionado ao ${label} de hoje.`,
      });
      onAdded?.();
      onClose();
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Não foi possível adicionar.",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-6"
      onClick={onClose}
    >
      <div
        className="bg-popover rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <span className="text-4xl">{food.emoji}</span>
          <h3 className="text-lg font-bold text-foreground mt-2">{food.name}</h3>
          <p className="text-xs text-muted-foreground">{baseWeight}g por porção</p>
        </div>

        {/* Quantity selector */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Quantidade:</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setQuantity(Math.max(0.5, quantity - 0.5))}
              className="w-9 h-9 rounded-full bg-muted text-foreground font-bold text-lg flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              −
            </button>
            <span className="text-lg font-bold text-foreground w-12 text-center">{quantity}x</span>
            <button
              onClick={() => setQuantity(Math.min(10, quantity + 0.5))}
              className="w-9 h-9 rounded-full bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              +
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-1">{adjustedWeight}g total</p>
        </div>

        {/* Macros */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {[
            { label: "Kcal", value: adjustedCalories, color: "text-primary" },
            { label: "Prot", value: `${adjustedProtein}g`, color: "text-foreground" },
            { label: "Carb", value: `${adjustedCarbs}g`, color: "text-foreground" },
            { label: "Gord", value: `${adjustedFat}g`, color: "text-foreground" },
          ].map((m) => (
            <div key={m.label} className="text-center rounded-xl bg-muted p-2">
              <p className={`text-sm font-bold ${m.color}`}>{m.value}</p>
              <p className="text-[10px] text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Meal type pills */}
        <p className="text-xs font-semibold text-muted-foreground mb-2">Adicionar em:</p>
        <div className="flex gap-2 mb-5">
          {mealOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelectedMealType(opt.value)}
              className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-all ${
                selectedMealType === opt.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <span className="block text-sm">{opt.emoji}</span>
              {opt.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleAdd}
          disabled={adding}
          className="w-full rounded-xl bg-primary py-3 text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {adding && <Loader2 size={16} className="animate-spin" />}
          {adding ? "Salvando..." : "Confirmar e Adicionar ao Diário"}
        </button>
        <button
          onClick={onClose}
          className="w-full mt-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default PortionModal;
