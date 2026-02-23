import { useMeals } from "@/contexts/MealContext";

const RecipeBanner = () => {
  const { remainingCalories, mockRecipes } = useMeals();
  const availableRecipes = mockRecipes.filter((r) => r.calories <= remainingCalories);

  return (
    <div className="mt-5">
      <div className="rounded-2xl bg-lilac px-5 py-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-lilac-foreground max-w-[60%] leading-snug">
          Receitas dentro da sua meta de hoje
        </p>
        <button className="rounded-full bg-white/90 px-5 py-2 text-xs font-semibold text-foreground hover:bg-white transition-colors">
          Ver
        </button>
      </div>

      {availableRecipes.length > 0 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {availableRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className="flex-shrink-0 rounded-2xl bg-cream px-4 py-3 flex items-center gap-2 animate-fade-in"
            >
              <span className="text-lg">{recipe.emoji}</span>
              <div>
                <p className="text-xs font-semibold text-foreground whitespace-nowrap">{recipe.name}</p>
                <p className="text-[10px] text-muted-foreground">{recipe.calories} kcal</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {availableRecipes.length === 0 && remainingCalories <= 0 && (
        <p className="text-xs text-muted-foreground mt-2 text-center animate-fade-in">
          🎉 Você atingiu sua meta diária!
        </p>
      )}
    </div>
  );
};

export default RecipeBanner;
