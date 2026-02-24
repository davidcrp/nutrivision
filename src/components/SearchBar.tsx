import { useState, useRef, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { useMeals } from "@/contexts/MealContext";
import { useToast } from "@/hooks/use-toast";

interface FoodItem {
  name: string;
  emoji: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
}

const mockFoodDB: FoodItem[] = [
  { name: "Banana", emoji: "🍌", calories: 89, protein: 1.1, carbs: 23, fat: 0.3, portion: "1 unidade (100g)" },
  { name: "Ovo Cozido", emoji: "🥚", calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3, portion: "1 unidade (50g)" },
  { name: "Pão Francês", emoji: "🥖", calories: 150, protein: 4.5, carbs: 30, fat: 1.5, portion: "1 unidade (50g)" },
  { name: "Tapioca", emoji: "🫓", calories: 68, protein: 0.1, carbs: 17, fat: 0, portion: "1 porção (30g)" },
  { name: "Maçã", emoji: "🍎", calories: 52, protein: 0.3, carbs: 14, fat: 0.2, portion: "1 unidade (100g)" },
  { name: "Leite Integral", emoji: "🥛", calories: 120, protein: 6, carbs: 9, fat: 6.5, portion: "1 copo (200ml)" },
  { name: "Arroz Branco", emoji: "🍚", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, portion: "1 concha (100g)" },
  { name: "Feijão Carioca", emoji: "🫘", calories: 77, protein: 4.8, carbs: 14, fat: 0.5, portion: "1 concha (80g)" },
  { name: "Peito de Frango", emoji: "🍗", calories: 165, protein: 31, carbs: 0, fat: 3.6, portion: "1 filé (100g)" },
  { name: "Batata Doce", emoji: "🍠", calories: 86, protein: 1.6, carbs: 20, fat: 0.1, portion: "1 unidade (100g)" },
  { name: "Iogurte Natural", emoji: "🥣", calories: 100, protein: 7, carbs: 8, fat: 4.5, portion: "1 pote (170g)" },
  { name: "Queijo Minas", emoji: "🧀", calories: 80, protein: 6, carbs: 1, fat: 5.5, portion: "1 fatia (30g)" },
  { name: "Café com Leite", emoji: "☕", calories: 72, protein: 3.2, carbs: 5.5, fat: 3.8, portion: "1 xícara (200ml)" },
  { name: "Café Preto", emoji: "☕", calories: 2, protein: 0.1, carbs: 0, fat: 0, portion: "1 xícara (100ml)" },
  { name: "Carne Moída", emoji: "🥩", calories: 212, protein: 26, carbs: 0, fat: 11, portion: "1 porção (100g)" },
  { name: "Picanha", emoji: "🥩", calories: 289, protein: 22, carbs: 0, fat: 22, portion: "1 fatia (100g)" },
  { name: "Arroz Integral", emoji: "🍚", calories: 124, protein: 2.6, carbs: 26, fat: 1, portion: "1 concha (100g)" },
  { name: "Mandioca Cozida", emoji: "🥔", calories: 125, protein: 0.6, carbs: 30, fat: 0.2, portion: "1 pedaço (100g)" },
  { name: "Açaí", emoji: "🫐", calories: 220, protein: 3, carbs: 36, fat: 8, portion: "1 tigela (200g)" },
  { name: "Coxinha", emoji: "🍗", calories: 280, protein: 10, carbs: 25, fat: 15, portion: "1 unidade (100g)" },
  { name: "Pão de Queijo", emoji: "🧀", calories: 75, protein: 2.5, carbs: 8, fat: 3.5, portion: "1 unidade (25g)" },
  { name: "Farofa", emoji: "🌾", calories: 150, protein: 1.5, carbs: 22, fat: 6, portion: "2 colheres (40g)" },
  { name: "Laranja", emoji: "🍊", calories: 47, protein: 0.9, carbs: 12, fat: 0.1, portion: "1 unidade (100g)" },
  { name: "Mamão", emoji: "🍈", calories: 40, protein: 0.5, carbs: 10, fat: 0.1, portion: "1 fatia (100g)" },
  { name: "Abacate", emoji: "🥑", calories: 160, protein: 2, carbs: 9, fat: 15, portion: "½ unidade (100g)" },
  { name: "Granola", emoji: "🥣", calories: 200, protein: 5, carbs: 30, fat: 7, portion: "½ xícara (50g)" },
  { name: "Frango Desfiado", emoji: "🍗", calories: 140, protein: 25, carbs: 0, fat: 4, portion: "1 porção (100g)" },
  { name: "Suco de Laranja", emoji: "🧃", calories: 94, protein: 1.2, carbs: 22, fat: 0.2, portion: "1 copo (200ml)" },
  { name: "Whey Protein", emoji: "🥤", calories: 120, protein: 24, carbs: 3, fat: 1.5, portion: "1 scoop (30g)" },
  { name: "Castanha do Pará", emoji: "🌰", calories: 186, protein: 4, carbs: 3.5, fat: 18, portion: "3 unidades (15g)" },
];

type MealType = "breakfast" | "lunch" | "snack" | "dinner";

const mealOptions: { value: MealType; label: string; emoji: string }[] = [
  { value: "breakfast", label: "Café", emoji: "☕" },
  { value: "lunch", label: "Almoço", emoji: "🍽️" },
  { value: "snack", label: "Lanche", emoji: "🍎" },
  { value: "dinner", label: "Jantar", emoji: "🌙" },
];

const SearchBar = () => {
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType>("lunch");
  const [quantity, setQuantity] = useState(1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { addMeal } = useMeals();
  const { toast } = useToast();

  const filtered = query.length >= 1
    ? mockFoodDB.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()))
    : [];

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (food: FoodItem) => {
    setSelectedFood(food);
    setQuantity(1);
    setIsDropdownOpen(false);
  };

  const handleAdd = async () => {
    if (!selectedFood || adding) return;
    setAdding(true);
    try {
      await addMeal({
        mealType: selectedMealType,
        items: [
          {
            id: crypto.randomUUID(),
            food_name: selectedFood.name,
            calories: Math.round(selectedFood.calories * quantity),
            protein: Math.round(selectedFood.protein * quantity * 10) / 10,
            carbs: Math.round(selectedFood.carbs * quantity * 10) / 10,
            fat: Math.round(selectedFood.fat * quantity * 10) / 10,
            weight_grams: Math.round(100 * quantity),
          },
        ],
      });
      const mealLabel = mealOptions.find((m) => m.value === selectedMealType)?.label ?? "";
      toast({
        title: "✅ Adicionado!",
        description: `${quantity > 1 ? quantity + "x " : ""}${selectedFood.name} adicionado ao ${mealLabel} de hoje.`,
      });
      setSelectedFood(null);
      setQuery("");
      setQuantity(1);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Não foi possível adicionar.", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const adjustedCalories = selectedFood ? Math.round(selectedFood.calories * quantity) : 0;
  const adjustedProtein = selectedFood ? Math.round(selectedFood.protein * quantity * 10) / 10 : 0;
  const adjustedCarbs = selectedFood ? Math.round(selectedFood.carbs * quantity * 10) / 10 : 0;
  const adjustedFat = selectedFood ? Math.round(selectedFood.fat * quantity * 10) / 10 : 0;

  return (
    <>
      <div ref={wrapperRef} className="relative z-40">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsDropdownOpen(e.target.value.length >= 1);
          }}
          onFocus={() => query.length >= 1 && setIsDropdownOpen(true)}
          placeholder="Buscar alimentos..."
          className="w-full rounded-full bg-muted py-3 pl-11 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setIsDropdownOpen(false); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        )}

        {/* Dropdown */}
        {isDropdownOpen && filtered.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-50 max-h-64 overflow-y-auto">
            {filtered.map((food) => (
              <button
                key={food.name}
                onClick={() => handleSelect(food)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/60 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{food.emoji}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{food.name}</p>
                    <p className="text-[10px] text-muted-foreground">{food.portion}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">{food.calories} kcal</span>
              </button>
            ))}
          </div>
        )}

        {isDropdownOpen && query.length >= 1 && filtered.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-lg z-50 p-4 text-center">
            <p className="text-sm text-muted-foreground">Nenhum alimento encontrado</p>
          </div>
        )}
      </div>

      {/* Quick Add Modal */}
      {selectedFood && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-6" onClick={() => setSelectedFood(null)}>
          <div
            className="bg-popover rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <span className="text-4xl">{selectedFood.emoji}</span>
              <h3 className="text-lg font-bold text-foreground mt-2">{selectedFood.name}</h3>
              <p className="text-xs text-muted-foreground">{selectedFood.portion}</p>
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
              {adding ? "Salvando..." : "Adicionar ao Diário"}
            </button>
            <button
              onClick={() => setSelectedFood(null)}
              className="w-full mt-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SearchBar;
