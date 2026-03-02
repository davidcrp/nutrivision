import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Search, Clock, TrendingUp, ChevronRight, X, Loader2, Minus, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMeals } from "@/contexts/MealContext";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import BottomNav from "@/components/BottomNav";

/* ─── Types ─── */
interface FoodItem {
  name: string;
  emoji: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
  weightGrams: number;
}

type MealType = "breakfast" | "lunch" | "snack" | "dinner";

/* ─── Mock fallback ─── */
const mockFoodDB: FoodItem[] = [
  { name: "Arroz Branco", emoji: "🍚", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, portion: "1 concha (100g)", weightGrams: 100 },
  { name: "Feijão Carioca", emoji: "🫘", calories: 77, protein: 4.8, carbs: 14, fat: 0.5, portion: "1 concha (80g)", weightGrams: 80 },
  { name: "Peito de Frango", emoji: "🍗", calories: 165, protein: 31, carbs: 0, fat: 3.6, portion: "1 filé (100g)", weightGrams: 100 },
  { name: "Banana", emoji: "🍌", calories: 89, protein: 1.1, carbs: 23, fat: 0.3, portion: "1 unidade (100g)", weightGrams: 100 },
  { name: "Pão Francês", emoji: "🥖", calories: 150, protein: 4.5, carbs: 30, fat: 1.5, portion: "1 unidade (50g)", weightGrams: 50 },
  { name: "Ovo Cozido", emoji: "🥚", calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3, portion: "1 unidade (50g)", weightGrams: 50 },
  { name: "Batata Doce", emoji: "🍠", calories: 86, protein: 1.6, carbs: 20, fat: 0.1, portion: "1 unidade (100g)", weightGrams: 100 },
  { name: "Maçã", emoji: "🍎", calories: 52, protein: 0.3, carbs: 14, fat: 0.2, portion: "1 unidade (100g)", weightGrams: 100 },
  { name: "Iogurte Natural", emoji: "🥣", calories: 100, protein: 7, carbs: 8, fat: 4.5, portion: "1 pote (170g)", weightGrams: 170 },
  { name: "Leite Integral", emoji: "🥛", calories: 120, protein: 6, carbs: 9, fat: 6.5, portion: "1 copo (200ml)", weightGrams: 200 },
  { name: "Café Preto", emoji: "☕", calories: 2, protein: 0.1, carbs: 0, fat: 0, portion: "1 xícara (100ml)", weightGrams: 100 },
  { name: "Queijo Minas", emoji: "🧀", calories: 80, protein: 6, carbs: 1, fat: 5.5, portion: "1 fatia (30g)", weightGrams: 30 },
  { name: "Açaí", emoji: "🫐", calories: 220, protein: 3, carbs: 36, fat: 8, portion: "1 tigela (200g)", weightGrams: 200 },
  { name: "Carne Moída", emoji: "🥩", calories: 212, protein: 26, carbs: 0, fat: 11, portion: "1 porção (100g)", weightGrams: 100 },
  { name: "Tapioca", emoji: "🫓", calories: 68, protein: 0.1, carbs: 17, fat: 0, portion: "1 porção (30g)", weightGrams: 30 },
];

const categories = [
  { name: "Frutas", emoji: "🍎" },
  { name: "Proteínas", emoji: "🥩" },
  { name: "Grãos", emoji: "🌾" },
  { name: "Laticínios", emoji: "🥛" },
  { name: "Vegetais", emoji: "🥦" },
  { name: "Bebidas", emoji: "🥤" },
];

const mealOptions: { value: MealType; label: string; emoji: string }[] = [
  { value: "breakfast", label: "Café", emoji: "☕" },
  { value: "lunch", label: "Almoço", emoji: "🍽️" },
  { value: "snack", label: "Lanche", emoji: "🍎" },
  { value: "dinner", label: "Jantar", emoji: "🌙" },
];

const emojiForFood = (name: string): string => {
  const found = mockFoodDB.find((f) => f.name.toLowerCase() === name.toLowerCase());
  return found?.emoji ?? "🍽️";
};

/* ─── Component ─── */
const SearchPage = () => {
  const { user } = useAuth();
  const { addMeal } = useMeals();
  const { toast } = useToast();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("recent_searches") ?? "[]");
    } catch {
      return [];
    }
  });

  // Modal state
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType>("lunch");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  /* ─── Debounce ─── */
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 500);
    return () => clearTimeout(timer);
  }, [query]);

  /* ─── Search logic ─── */
  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults([]);
      return;
    }

    let cancelled = false;

    const search = async () => {
      setIsLoading(true);
      try {
        let dbResults: FoodItem[] = [];

        if (user) {
          const { data, error } = await supabase
            .from("meal_items")
            .select("food_name, calories, protein, carbs, fat, weight_grams")
            .ilike("food_name", `%${debouncedQuery}%`)
            .limit(20);

          if (!error && data && data.length > 0) {
            // Deduplicate by food_name (take first occurrence)
            const seen = new Set<string>();
            for (const item of data) {
              const key = item.food_name.toLowerCase();
              if (!seen.has(key)) {
                seen.add(key);
                dbResults.push({
                  name: item.food_name,
                  emoji: emojiForFood(item.food_name),
                  calories: item.calories,
                  protein: Number(item.protein),
                  carbs: Number(item.carbs),
                  fat: Number(item.fat),
                  portion: `${item.weight_grams}g`,
                  weightGrams: item.weight_grams,
                });
              }
            }
          }
        }

        // Fallback to mock if no DB results
        if (dbResults.length === 0) {
          dbResults = mockFoodDB.filter((f) =>
            f.name.toLowerCase().includes(debouncedQuery.toLowerCase())
          );
        }

        if (!cancelled) setSearchResults(dbResults);
      } catch (err) {
        console.error("Search error:", err);
        // Fallback to mock
        const fallback = mockFoodDB.filter((f) =>
          f.name.toLowerCase().includes(debouncedQuery.toLowerCase())
        );
        if (!cancelled) setSearchResults(fallback);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    search();
    return () => { cancelled = true; };
  }, [debouncedQuery, user]);

  /* ─── Popular foods (shown when no query) ─── */
  const popularFoods = useMemo(() => mockFoodDB.slice(0, 6), []);

  /* ─── Reactive macros ─── */
  const adjusted = useMemo(() => {
    if (!selectedFood) return { cal: 0, protein: 0, carbs: 0, fat: 0, weight: 0 };
    return {
      cal: Math.round(selectedFood.calories * quantity),
      protein: Math.round(selectedFood.protein * quantity * 10) / 10,
      carbs: Math.round(selectedFood.carbs * quantity * 10) / 10,
      fat: Math.round(selectedFood.fat * quantity * 10) / 10,
      weight: Math.round(selectedFood.weightGrams * quantity),
    };
  }, [selectedFood, quantity]);

  /* ─── Save to recent ─── */
  const addToRecent = useCallback((term: string) => {
    setRecentSearches((prev) => {
      const updated = [term, ...prev.filter((s) => s !== term)].slice(0, 5);
      localStorage.setItem("recent_searches", JSON.stringify(updated));
      return updated;
    });
  }, []);

  /* ─── Select food → open modal ─── */
  const handleSelect = (food: FoodItem) => {
    setSelectedFood(food);
    setQuantity(1);
    setSelectedMealType("lunch");
    addToRecent(food.name);
  };

  /* ─── Add to diary ─── */
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
            calories: adjusted.cal,
            protein: adjusted.protein,
            carbs: adjusted.carbs,
            fat: adjusted.fat,
            weight_grams: adjusted.weight,
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
      setDebouncedQuery("");
      setSearchResults([]);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Não foi possível adicionar.", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const displayResults = debouncedQuery ? searchResults : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-5 pt-6 pb-24">
        <h1 className="text-xl font-bold text-foreground mb-4">Pesquisar</h1>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar alimentos, receitas..."
            className="w-full rounded-full bg-muted py-3 pl-11 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setDebouncedQuery(""); setSearchResults([]); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Categories */}
        {!debouncedQuery && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-foreground mb-3">Categorias</h2>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setQuery(cat.name)}
                  className="flex flex-col items-center gap-1.5 rounded-2xl bg-cream p-3 hover:bg-cream-dark transition-colors"
                >
                  <span className="text-2xl">{cat.emoji}</span>
                  <span className="text-xs font-medium text-foreground">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent searches */}
        {!debouncedQuery && recentSearches.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-1.5 mb-3">
              <Clock size={14} className="text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Buscas recentes</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((s) => (
                <button key={s} onClick={() => setQuery(s)} className="rounded-full bg-muted px-4 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="mt-6 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl bg-cream p-4">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {!isLoading && debouncedQuery && (
          <div className="mt-6">
            <div className="flex items-center gap-1.5 mb-3">
              <TrendingUp size={14} className="text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Resultados</h2>
            </div>
            <div className="space-y-2">
              {displayResults.map((food) => (
                <button
                  key={food.name}
                  onClick={() => handleSelect(food)}
                  className="flex items-center w-full gap-3 rounded-2xl bg-cream p-4 hover:bg-cream-dark transition-colors text-left"
                >
                  <span className="text-2xl">{food.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{food.name}</p>
                    <p className="text-xs text-muted-foreground">{food.calories} kcal · {food.portion}</p>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </button>
              ))}
              {displayResults.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum alimento encontrado</p>
              )}
            </div>
          </div>
        )}

        {/* Popular (no query) */}
        {!debouncedQuery && !isLoading && (
          <div className="mt-6">
            <div className="flex items-center gap-1.5 mb-3">
              <TrendingUp size={14} className="text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Populares</h2>
            </div>
            <div className="space-y-2">
              {popularFoods.map((food) => (
                <button
                  key={food.name}
                  onClick={() => handleSelect(food)}
                  className="flex items-center w-full gap-3 rounded-2xl bg-cream p-4 hover:bg-cream-dark transition-colors text-left"
                >
                  <span className="text-2xl">{food.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{food.name}</p>
                    <p className="text-xs text-muted-foreground">{food.calories} kcal · {food.portion}</p>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── Portion Modal ─── */}
      {selectedFood && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSelectedFood(null)}>
          <div
            className="bg-popover rounded-t-3xl sm:rounded-2xl shadow-xl w-full max-w-md p-6 animate-in slide-in-from-bottom-4 sm:fade-in sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar (mobile) */}
            <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4 sm:hidden" />

            <div className="text-center mb-4">
              <span className="text-4xl">{selectedFood.emoji}</span>
              <h3 className="text-lg font-bold text-foreground mt-2">{selectedFood.name}</h3>
              <p className="text-xs text-muted-foreground">{selectedFood.portion}</p>
            </div>

            {/* Quantity */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Quantidade:</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(0.5, quantity - 0.5))}
                  className="w-9 h-9 rounded-full bg-muted text-foreground font-bold text-lg flex items-center justify-center hover:bg-muted/80 transition-colors"
                >
                  <Minus size={16} />
                </button>
                <span className="text-lg font-bold text-foreground w-12 text-center">{quantity}x</span>
                <button
                  onClick={() => setQuantity(Math.min(10, quantity + 0.5))}
                  className="w-9 h-9 rounded-full bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center hover:opacity-90 transition-opacity"
                >
                  <Plus size={16} />
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-1">{adjusted.weight}g total</p>
            </div>

            {/* Macros */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              {[
                { label: "Kcal", value: adjusted.cal, color: "text-primary" },
                { label: "Prot", value: `${adjusted.protein}g`, color: "text-foreground" },
                { label: "Carb", value: `${adjusted.carbs}g`, color: "text-foreground" },
                { label: "Gord", value: `${adjusted.fat}g`, color: "text-foreground" },
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
              {adding ? "Salvando..." : "Confirmar e Adicionar"}
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

      <BottomNav />
    </div>
  );
};

export default SearchPage;
