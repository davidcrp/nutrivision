import { useState } from "react";
import { Check, RotateCcw, Pencil, Utensils } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";

export interface FoodItem {
  food_name: string;
  weight_grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface AnalysisResult {
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  items: FoodItem[];
}

export type MealType = "breakfast" | "lunch" | "snack" | "dinner";

interface ResultsBottomSheetProps {
  open: boolean;
  imageUrl: string;
  result: AnalysisResult;
  saving: boolean;
  onConfirm: (editedItems: FoodItem[], mealType: MealType) => void;
  onRetry: () => void;
  onClose: () => void;
}

const mealTypeOptions: { value: MealType; label: string; emoji: string }[] = [
  { value: "breakfast", label: "Café", emoji: "☕" },
  { value: "lunch", label: "Almoço", emoji: "🍛" },
  { value: "snack", label: "Lanche", emoji: "🍎" },
  { value: "dinner", label: "Jantar", emoji: "🍽️" },
];

const ResultsBottomSheet = ({
  open,
  imageUrl,
  result,
  saving,
  onConfirm,
  onRetry,
  onClose,
}: ResultsBottomSheetProps) => {
  const [items, setItems] = useState<FoodItem[]>(result.items);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);

  const totals = items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const handleWeightChange = (index: number, newWeight: string) => {
    const weight = parseInt(newWeight) || 0;
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const ratio = weight / (item.weight_grams || 1);
        return {
          ...item,
          weight_grams: weight,
          calories: Math.round(item.calories * ratio),
          protein: parseFloat((item.protein * ratio).toFixed(1)),
          carbs: parseFloat((item.carbs * ratio).toFixed(1)),
          fat: parseFloat((item.fat * ratio).toFixed(1)),
        };
      })
    );
  };

  const maxMacro = 200;

  const macros = [
    { label: "Proteína", value: totals.protein, max: maxMacro, color: "bg-primary" },
    { label: "Carboidrato", value: totals.carbs, max: maxMacro, color: "bg-accent" },
    { label: "Gordura", value: totals.fat, max: maxMacro, color: "bg-[hsl(var(--lilac))]" },
  ];

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 border border-border">
              <img src={imageUrl} alt="Refeição" className="w-full h-full object-cover" />
            </div>
            <div>
              <DrawerTitle className="text-left text-lg">É isso mesmo?</DrawerTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Confira os alimentos detectados pela IA
              </p>
            </div>
          </div>
        </DrawerHeader>

        <div className="px-4 pb-4 overflow-y-auto space-y-4">
          {/* Summary card */}
          <div className="rounded-2xl bg-primary/10 p-4 text-center">
            <p className="text-xs text-muted-foreground">Total estimado</p>
            <p className="text-4xl font-bold text-primary mt-1">{totals.calories}</p>
            <p className="text-xs text-muted-foreground">kcal</p>
          </div>

          {/* Macro bars */}
          <div className="space-y-3">
            {macros.map((macro) => (
              <div key={macro.label} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-foreground">{macro.label}</span>
                  <span className="text-xs font-semibold text-foreground">
                    {macro.value.toFixed(1)}g
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${macro.color} transition-all duration-500`}
                    style={{ width: `${Math.min((macro.value / macro.max) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Items list */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <Utensils size={14} className="text-primary" />
              Alimentos detectados
            </h3>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="rounded-2xl bg-card border border-border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{item.food_name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {editingIndex === index ? (
                          <input
                            type="number"
                            value={item.weight_grams}
                            onChange={(e) => handleWeightChange(index, e.target.value)}
                            onBlur={() => setEditingIndex(null)}
                            autoFocus
                            className="w-16 text-xs bg-muted rounded-lg px-2 py-1 text-foreground border border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">{item.weight_grams}g</span>
                        )}
                        <button
                          onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                          className="p-0.5 rounded hover:bg-muted transition-colors"
                        >
                          <Pencil size={12} className="text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-accent">{item.calories} kcal</p>
                      <div className="flex gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">P:{item.protein}g</span>
                        <span className="text-[10px] text-muted-foreground">C:{item.carbs}g</span>
                        <span className="text-[10px] text-muted-foreground">G:{item.fat}g</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Meal type selector */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Qual foi a refeição?</h3>
            <div className="grid grid-cols-4 gap-2">
              {mealTypeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedMealType(opt.value)}
                  className={`flex flex-col items-center gap-1 rounded-2xl py-3 px-2 text-xs font-medium transition-all duration-200 ${
                    selectedMealType === opt.value
                      ? "bg-primary text-primary-foreground shadow-md scale-105"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <span className="text-base">{opt.emoji}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DrawerFooter className="pt-2">
          <button
            onClick={() => selectedMealType && onConfirm(items, selectedMealType)}
            disabled={saving || !selectedMealType}
            className="w-full rounded-2xl bg-primary py-4 text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <Check size={18} />
            )}
            {saving ? "Salvando..." : "Confirmar e Salvar no Diário"}
          </button>
          <button
            onClick={onRetry}
            disabled={saving}
            className="w-full py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCcw size={14} />
            Tentar Novamente
          </button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default ResultsBottomSheet;
