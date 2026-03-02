import { useState } from "react";
import { ChevronDown, Clock, Users, ChevronRight } from "lucide-react";
import FavoriteToggle from "@/components/FavoriteToggle";
import { useMeals, type MockRecipe } from "@/contexts/MealContext";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

const RecipeBanner = () => {
  const { remainingCalories, filteredRecipes } = useMeals();
  const [expanded, setExpanded] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<MockRecipe | null>(null);

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
              <button
                key={recipe.id}
                onClick={() => setSelectedRecipe(recipe)}
                className="flex-shrink-0 rounded-2xl bg-cream px-4 py-3 flex items-center gap-2 hover:bg-cream-dark transition-colors text-left group"
              >
                <span className="text-lg">{recipe.emoji}</span>
                <div>
                  <p className="text-xs font-semibold text-foreground whitespace-nowrap">{recipe.name}</p>
                  <p className="text-[10px] text-muted-foreground">{recipe.calories} kcal</p>
                </div>
                <FavoriteToggle
                  name={recipe.name}
                  emoji={recipe.emoji}
                  calories={recipe.calories}
                  protein={0}
                  carbs={0}
                  fat={0}
                  weightGrams={0}
                  mealType="snack"
                  size={14}
                />
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-2">
            🎉 Você atingiu sua meta diária!
          </p>
        )}
      </div>

      {/* Recipe Detail Drawer */}
      <Drawer open={selectedRecipe !== null} onOpenChange={(o) => !o && setSelectedRecipe(null)}>
        <DrawerContent className="max-h-[85vh]">
          {selectedRecipe && (
            <>
              <DrawerHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{selectedRecipe.emoji}</span>
                  <div>
                    <DrawerTitle className="text-lg">{selectedRecipe.name}</DrawerTitle>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs font-semibold text-primary">{selectedRecipe.calories} kcal</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock size={12} /> {selectedRecipe.prepTime}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users size={12} /> {selectedRecipe.servings} {selectedRecipe.servings === 1 ? "porção" : "porções"}
                      </span>
                    </div>
                  </div>
                </div>
              </DrawerHeader>

              <div className="px-4 pb-6 overflow-y-auto space-y-5">
                {/* Ingredients */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">🧾 Ingredientes</h3>
                  <ul className="space-y-1.5">
                    {selectedRecipe.ingredients.map((ing, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Steps */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">👩‍🍳 Modo de Preparo</h3>
                  <ol className="space-y-3">
                    {selectedRecipe.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <p className="text-sm text-muted-foreground pt-0.5">{step}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default RecipeBanner;
