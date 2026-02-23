import { useState } from "react";
import { Heart, Trash2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const initialFavorites = [
  { id: 1, name: "Salada Caesar", cal: 210, emoji: "🥗", category: "Almoço" },
  { id: 2, name: "Smoothie de banana", cal: 180, emoji: "🍌", category: "Lanche" },
  { id: 3, name: "Peito de frango", cal: 165, emoji: "🍗", category: "Jantar" },
  { id: 4, name: "Aveia com frutas", cal: 220, emoji: "🥣", category: "Café da Manhã" },
  { id: 5, name: "Wrap integral", cal: 290, emoji: "🌯", category: "Almoço" },
  { id: 6, name: "Iogurte com mel", cal: 130, emoji: "🍯", category: "Lanche" },
];

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState(initialFavorites);
  const [filter, setFilter] = useState("Todos");
  const filters = ["Todos", "Café da Manhã", "Almoço", "Lanche", "Jantar"];

  const filtered = filter === "Todos" ? favorites : favorites.filter((f) => f.category === filter);

  const removeFav = (id: number) => setFavorites((prev) => prev.filter((f) => f.id !== id));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-5 pt-6 pb-24">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-foreground">Favoritos</h1>
          <Heart size={20} className="text-accent fill-accent" />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="mt-4 space-y-2">
          {filtered.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-cream p-4">
              <span className="text-2xl">{item.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.cal} kcal · {item.category}</p>
              </div>
              <button onClick={() => removeFav(item.id)} className="p-2 rounded-full hover:bg-destructive/10 transition-colors">
                <Trash2 size={16} className="text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Heart size={40} className="text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum favorito nesta categoria</p>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default FavoritesPage;
