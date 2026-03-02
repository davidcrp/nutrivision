import { useState, useEffect, useCallback } from "react";
import { Heart, HeartCrack, Plus, MoreVertical, Trash2, Loader2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useMeals } from "@/contexts/MealContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FavoriteItem {
  id: string;
  name: string;
  emoji: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  weight_grams: number;
  meal_type: string;
}

type MealType = "breakfast" | "lunch" | "snack" | "dinner";

const mealTypeLabels: Record<string, string> = {
  breakfast: "Café da Manhã",
  lunch: "Almoço",
  snack: "Lanche",
  dinner: "Jantar",
};

const filterToMealType: Record<string, string> = {
  "Café da Manhã": "breakfast",
  "Almoço": "lunch",
  "Lanche": "snack",
  "Jantar": "dinner",
};

const FavoritesPage = () => {
  const { user } = useAuth();
  const { addMeal } = useMeals();
  const { toast } = useToast();

  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Todos");
  const [addingId, setAddingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filters = ["Todos", "Café da Manhã", "Almoço", "Lanche", "Jantar"];

  /* ─── Fetch favorites ─── */
  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("favorite_meals")
        .select("id, name, emoji, calories, protein, carbs, fat, weight_grams, meal_type")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setFavorites(
        (data ?? []).map((d) => ({
          id: d.id,
          name: d.name,
          emoji: d.emoji,
          calories: d.calories,
          protein: Number(d.protein),
          carbs: Number(d.carbs),
          fat: Number(d.fat),
          weight_grams: d.weight_grams,
          meal_type: d.meal_type,
        }))
      );
    } catch (err) {
      console.error("Error fetching favorites:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  /* ─── Filter ─── */
  const filtered =
    filter === "Todos"
      ? favorites
      : favorites.filter((f) => f.meal_type === filterToMealType[filter]);

  /* ─── Quick Add to diary ─── */
  const quickLog = async (item: FavoriteItem) => {
    if (addingId) return;
    setAddingId(item.id);
    try {
      await addMeal({
        mealType: item.meal_type as MealType,
        items: [
          {
            id: crypto.randomUUID(),
            food_name: item.name,
            weight_grams: item.weight_grams,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
          },
        ],
      });
      const label = mealTypeLabels[item.meal_type] ?? item.meal_type;
      toast({
        title: "✅ Adicionado!",
        description: `${item.name} adicionado ao ${label} de hoje.`,
      });
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Não foi possível adicionar.",
        variant: "destructive",
      });
    } finally {
      setAddingId(null);
    }
  };

  /* ─── Remove favorite ─── */
  const removeFav = async (id: string) => {
    setDeletingId(id);
    // Optimistic removal
    setFavorites((prev) => prev.filter((f) => f.id !== id));

    try {
      const { error } = await supabase
        .from("favorite_meals")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Removido",
        description: "Removido dos favoritos.",
      });
    } catch (err: any) {
      // Revert on error
      fetchFavorites();
      toast({
        title: "Erro",
        description: err.message || "Não foi possível remover.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-5 pt-6 pb-24">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-foreground">Favoritos</h1>
          <Heart size={20} className="text-accent fill-accent" />
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-cream text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl bg-card p-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cards */}
        {!loading && (
          <div className="mt-4 space-y-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="relative flex items-center gap-3 rounded-2xl bg-card p-4 shadow-sm transition-shadow hover:shadow-md active:shadow-md"
              >
                {/* Emoji */}
                <div className="w-12 h-12 rounded-xl bg-cream flex items-center justify-center text-2xl shrink-0">
                  {item.emoji}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.calories} kcal · {mealTypeLabels[item.meal_type] ?? item.meal_type}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                    P: {item.protein}g • C: {item.carbs}g • G: {item.fat}g
                  </p>
                </div>

                {/* Quick-log button */}
                <button
                  onClick={() => quickLog(item)}
                  disabled={addingId === item.id}
                  className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0 hover:bg-primary/25 transition-colors disabled:opacity-50"
                >
                  {addingId === item.id ? (
                    <Loader2 size={18} className="text-primary animate-spin" />
                  ) : (
                    <Plus size={20} className="text-primary" />
                  )}
                </button>

                {/* More menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors">
                      <MoreVertical size={14} className="text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[160px]">
                    <DropdownMenuItem
                      onClick={() => removeFav(item.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 size={14} className="mr-2" />
                      Remover dos Favoritos
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}

            {/* Empty state */}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center py-16 px-4">
                <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <HeartCrack size={36} className="text-accent/50" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">Nenhum favorito por aqui</h3>
                <p className="text-xs text-muted-foreground text-center max-w-[240px]">
                  {filter === "Todos"
                    ? "Você ainda não tem favoritos. Adicione refeições aos favoritos para acesso rápido."
                    : `Você ainda não tem favoritos na categoria "${filter}".`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default FavoritesPage;
