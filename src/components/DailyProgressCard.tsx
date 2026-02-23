import { useMeals } from "@/contexts/MealContext";

const CircularProgress = ({ progress }: { progress: number }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(progress, 100);
  const offset = circumference - (clampedProgress / 100) * circumference;

  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={radius} fill="none" stroke="hsl(var(--cream-dark))" strokeWidth="8" />
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 50 50)"
        className="transition-all duration-700 ease-out"
      />
      <text x="50" y="48" textAnchor="middle" className="fill-foreground text-xs font-bold">
        {Math.round(clampedProgress)}%
      </text>
      <text x="50" y="60" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 7 }}>
        completo
      </text>
    </svg>
  );
};

const MacroBar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => (
  <div className="flex items-center gap-2">
    <span className="text-[10px] font-medium text-muted-foreground w-5">{label}</span>
    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
        style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
      />
    </div>
    <span className="text-[10px] font-semibold text-foreground w-8 text-right">{value.toFixed(0)}g</span>
  </div>
);

const DailyProgressCard = () => {
  const { dailyGoal, consumedCalories, consumedMacros } = useMeals();
  const progress = (consumedCalories / dailyGoal) * 100;

  return (
    <div className="mt-5 rounded-2xl bg-cream p-5 flex items-center justify-between overflow-hidden">
      <div className="flex-1">
        <h2 className="text-base font-semibold text-foreground">Progresso Diário</h2>
        <p className="text-2xl font-bold text-foreground mt-1 transition-all duration-500">
          {consumedCalories.toLocaleString("pt-BR")}{" "}
          <span className="text-sm font-normal text-muted-foreground">/ {dailyGoal.toLocaleString("pt-BR")} kcal</span>
        </p>
        <div className="mt-3 space-y-1.5">
          <MacroBar label="P" value={consumedMacros.protein} max={150} color="bg-primary" />
          <MacroBar label="C" value={consumedMacros.carbs} max={250} color="bg-accent" />
          <MacroBar label="G" value={consumedMacros.fat} max={80} color="bg-[hsl(var(--lilac))]" />
        </div>
      </div>
      <div className="flex-shrink-0 ml-3">
        <CircularProgress progress={progress} />
      </div>
    </div>
  );
};

export default DailyProgressCard;
