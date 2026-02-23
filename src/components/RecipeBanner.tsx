import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useMeals } from "@/contexts/MealContext";

const RecipeBanner = () => {
  const { remainingCalories, filteredRecipes } = useMeals();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full rounded-2xl bg-lilac px-5 py-4 flex items-center justify-between transition-all hover:opacity-95"
      >
        <p className="text-sm font-semibold text-lilac-foreground max-w-[60%] leading-snug text-left">
          Receitas dentro da sua meta de hoje
        </p>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white/90 px-4 py-1.5 text-[10px] font-semibold text-foreground">
            {filteredRecipes.length} opções
          </span>
          <ChevronDown
            size={16}
            className={`text-lilac-foreground transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      <div
        className={`overflow-hidden transition-all duration-400 ease-out ${
          expanded ? "max-h-[500px] opacity-100 mt-3" : "max-h-0 opacity-0"
        }`}
      >
        {filteredRecipes.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {filteredRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className="flex-shrink-0 rounded-2xl bg-cream px-4 py-3 flex items-center gap-2"
              >
                <span className="text-lg">{recipe.emoji}</span>
                <div>
                  <p className="text-xs font-semibold text-foreground whitespace-nowrap">{recipe.name}</p>
                  <p className="text-[10px] text-muted-foreground">{recipe.calories} kcal</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-2">
            🎉 Você atingiu sua meta diária!
          </p>
        )}
      </div>
    </div>
  );
};

export default RecipeBanner;
