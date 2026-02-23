import { useState } from "react";
import { Search, Clock, TrendingUp, ChevronRight } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const recentSearches = ["Arroz integral", "Frango grelhado", "Banana", "Iogurte natural"];

const popularFoods = [
  { name: "Açaí com granola", cal: 320, emoji: "🍇" },
  { name: "Pão com queijo", cal: 180, emoji: "🧀" },
  { name: "Salada Caesar", cal: 210, emoji: "🥗" },
  { name: "Suco de laranja", cal: 90, emoji: "🍊" },
  { name: "Ovo mexido", cal: 150, emoji: "🍳" },
  { name: "Batata doce", cal: 115, emoji: "🍠" },
];

const categories = [
  { name: "Frutas", emoji: "🍎" },
  { name: "Proteínas", emoji: "🥩" },
  { name: "Grãos", emoji: "🌾" },
  { name: "Laticínios", emoji: "🥛" },
  { name: "Vegetais", emoji: "🥦" },
  { name: "Bebidas", emoji: "🥤" },
];

const SearchPage = () => {
  const [query, setQuery] = useState("");

  const filteredFoods = query
    ? popularFoods.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()))
    : popularFoods;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-5 pt-6 pb-24">
        <h1 className="text-xl font-bold text-foreground mb-4">Pesquisar</h1>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar alimentos, receitas..."
            className="w-full rounded-full bg-muted py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>

        {/* Categories */}
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">Categorias</h2>
          <div className="grid grid-cols-3 gap-2">
            {categories.map((cat) => (
              <button key={cat.name} className="flex flex-col items-center gap-1.5 rounded-2xl bg-cream p-3 hover:bg-cream-dark transition-colors">
                <span className="text-2xl">{cat.emoji}</span>
                <span className="text-xs font-medium text-foreground">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent */}
        {!query && (
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

        {/* Popular / Results */}
        <div className="mt-6">
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingUp size={14} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">{query ? "Resultados" : "Populares"}</h2>
          </div>
          <div className="space-y-2">
            {filteredFoods.map((food) => (
              <button key={food.name} className="flex items-center w-full gap-3 rounded-2xl bg-cream p-4 hover:bg-cream-dark transition-colors text-left">
                <span className="text-2xl">{food.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{food.name}</p>
                  <p className="text-xs text-muted-foreground">{food.cal} kcal</p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </button>
            ))}
            {query && filteredFoods.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum alimento encontrado</p>
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default SearchPage;
