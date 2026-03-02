import { useState, useEffect, useCallback } from "react";
import { Heart, HeartCrack, Plus, MoreVertical, Trash2, Loader2, Sparkles } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useMeals } from "@/contexts/MealContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import FavoriteCard from "@/components/favorites/FavoriteCard";
import SuggestionsTab from "@/components/favorites/SuggestionsTab";

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

        {/* Tabs */}
        <Tabs defaultValue="favorites" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="favorites" className="text-xs gap-1.5">
              <Heart size={14} />
              Meus Favoritos
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="text-xs gap-1.5">
              <Sparkles size={14} />
              Sugestões
            </TabsTrigger>
          </TabsList>

          {/* ─── Meus Favoritos Tab ─── */}
          <TabsContent value="favorites">
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
                  <FavoriteCard
                    key={item.id}
                    item={item}
                    addingId={addingId}
                    onQuickLog={quickLog}
                    onRemove={removeFav}
                    mealTypeLabels={mealTypeLabels}
                  />
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
          </TabsContent>

          {/* ─── Sugestões Tab ─── */}
          <TabsContent value="suggestions">
            <SuggestionsTab onSaved={fetchFavorites} />
          </TabsContent>
        </Tabs>
      </div>
      <BottomNav />
    </div>
  );
};

export default FavoritesPage;
