import { useState } from "react";
import { Heart, HeartCrack, Plus, MoreVertical, Trash2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useMeals } from "@/contexts/MealContext";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FavoriteItem {
  id: number;
  name: string;
  cal: number;
  emoji: string;
  category: string;
  protein: number;
  carbs: number;
  fat: number;
}

const initialFavorites: FavoriteItem[] = [
  { id: 1, name: "Salada Caesar", cal: 210, emoji: "🥗", category: "Almoço", protein: 25, carbs: 12, fat: 8 },
  { id: 2, name: "Smoothie de banana", cal: 180, emoji: "🍌", category: "Lanche", protein: 6, carbs: 35, fat: 3 },
  { id: 3, name: "Peito de frango", cal: 165, emoji: "🍗", category: "Jantar", protein: 31, carbs: 0, fat: 4 },
  { id: 4, name: "Aveia com frutas", cal: 220, emoji: "🥣", category: "Café da Manhã", protein: 8, carbs: 40, fat: 5 },
  { id: 5, name: "Wrap integral", cal: 290, emoji: "🌯", category: "Almoço", protein: 18, carbs: 32, fat: 9 },
  { id: 6, name: "Iogurte com mel", cal: 130, emoji: "🍯", category: "Lanche", protein: 10, carbs: 18, fat: 2 },
];

const categoryToMealType: Record<string, "breakfast" | "lunch" | "snack" | "dinner"> = {
  "Café da Manhã": "breakfast",
  "Almoço": "lunch",
  "Lanche": "snack",
  "Jantar": "dinner",
};

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState(initialFavorites);
  const [filter, setFilter] = useState("Todos");
  const { addMeal } = useMeals();
  const { toast } = useToast();
  const filters = ["Todos", "Café da Manhã", "Almoço", "Lanche", "Jantar"];

  const filtered = filter === "Todos" ? favorites : favorites.filter((f) => f.category === filter);

  const removeFav = (id: number) => setFavorites((prev) => prev.filter((f) => f.id !== id));

  const quickLog = (item: FavoriteItem) => {
    const mealType = categoryToMealType[item.category] || "snack";
    addMeal({
      mealType,
      items: [
        {
          id: crypto.randomUUID(),
          food_name: item.name,
          weight_grams: 100,
          calories: item.cal,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
        },
      ],
    });
    toast({
      title: "✅ Adicionado!",
      description: `${item.name} adicionado ao diário de hoje.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-5 pt-6 pb-24">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-foreground">Favoritos</h1>
          <Heart size={20} className="text-accent fill-accent" />
        </div>

        {/* Category Pills — no visible scrollbar */}
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

        {/* Cards */}
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
                <p className="text-xs text-muted-foreground mt-0.5">{item.cal} kcal · {item.category}</p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                  P: {item.protein}g • C: {item.carbs}g • G: {item.fat}g
                </p>
              </div>

              {/* Quick-log button */}
              <button
                onClick={() => quickLog(item)}
                className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0 hover:bg-primary/25 transition-colors"
              >
                <Plus size={20} className="text-primary" />
              </button>

              {/* More menu (delete) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors">
                    <MoreVertical size={14} className="text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[140px]">
                  <DropdownMenuItem
                    onClick={() => removeFav(item.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 size={14} className="mr-2" />
                    Remover
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
                As refeições que você mais gosta aparecerão aqui para um registro super rápido.
              </p>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default FavoritesPage;
