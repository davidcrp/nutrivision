import { ChevronRight } from "lucide-react";

const meals = [
  { name: "Café da Manhã", emoji: "☕" },
  { name: "Almoço", emoji: "🍛" },
  { name: "Lanche", emoji: "🍎" },
  { name: "Jantar", emoji: "🍽️" },
];

const MealsGrid = () => {
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-foreground">Refeições</h2>
        <button className="text-sm font-medium text-primary hover:underline">Ver Diário</button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {meals.map((meal) => (
          <button
            key={meal.name}
            className="flex items-center gap-3 rounded-2xl bg-cream p-4 hover:bg-cream-dark transition-colors text-left"
          >
            <span className="text-2xl">{meal.emoji}</span>
            <span className="flex-1 text-sm font-medium text-foreground">{meal.name}</span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default MealsGrid;
