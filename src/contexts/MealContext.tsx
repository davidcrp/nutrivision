import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface LoggedMeal {
  id: string;
  mealType: "breakfast" | "lunch" | "snack" | "dinner";
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  items: string[];
  imageUrl?: string;
  loggedAt: Date;
}

export interface MockRecipe {
  id: string;
  name: string;
  calories: number;
  emoji: string;
}

interface MealState {
  dailyGoal: number;
  setDailyGoal: (goal: number) => void;
  onboardingComplete: boolean;
  completeOnboarding: (goal: number) => void;
  consumedCalories: number;
  consumedMacros: { protein: number; carbs: number; fat: number };
  loggedMeals: LoggedMeal[];
  mockRecipes: MockRecipe[];
  remainingCalories: number;
  addMeal: (meal: Omit<LoggedMeal, "id" | "loggedAt">) => void;
}

const mockRecipes: MockRecipe[] = [
  { id: "1", name: "Salada de Frango", calories: 350, emoji: "🥗" },
  { id: "2", name: "Panqueca Proteica", calories: 500, emoji: "🥞" },
  { id: "3", name: "Pizza Fit", calories: 800, emoji: "🍕" },
  { id: "4", name: "Bowl de Açaí", calories: 420, emoji: "🍇" },
  { id: "5", name: "Wrap Integral", calories: 380, emoji: "🌯" },
];

const MealContext = createContext<MealState | null>(null);

export const MealProvider = ({ children }: { children: ReactNode }) => {
  const [dailyGoal, setDailyGoal] = useState(2000);
  const [onboardingComplete, setOnboardingComplete] = useState(() => {
    return localStorage.getItem("onboarding_complete") === "true";
  });
  const [consumedCalories, setConsumedCalories] = useState(0);
  const [consumedMacros, setConsumedMacros] = useState({ protein: 0, carbs: 0, fat: 0 });
  const [loggedMeals, setLoggedMeals] = useState<LoggedMeal[]>([]);

  const remainingCalories = dailyGoal - consumedCalories;

  const completeOnboarding = useCallback((goal: number) => {
    setDailyGoal(goal);
    setOnboardingComplete(true);
    localStorage.setItem("onboarding_complete", "true");
    localStorage.setItem("daily_goal", String(goal));
  }, []);

  // Restore goal from localStorage on mount
  useState(() => {
    const saved = localStorage.getItem("daily_goal");
    if (saved) setDailyGoal(Number(saved));
  });

  const addMeal = useCallback((meal: Omit<LoggedMeal, "id" | "loggedAt">) => {
    const newMeal: LoggedMeal = {
      ...meal,
      id: crypto.randomUUID(),
      loggedAt: new Date(),
    };
    setLoggedMeals((prev) => [...prev, newMeal]);
    setConsumedCalories((prev) => prev + meal.calories);
    setConsumedMacros((prev) => ({
      protein: prev.protein + meal.protein,
      carbs: prev.carbs + meal.carbs,
      fat: prev.fat + meal.fat,
    }));
  }, []);

  return (
    <MealContext.Provider
      value={{
        dailyGoal,
        setDailyGoal,
        onboardingComplete,
        completeOnboarding,
        consumedCalories,
        consumedMacros,
        loggedMeals,
        mockRecipes,
        remainingCalories,
        addMeal,
      }}
    >
      {children}
    </MealContext.Provider>
  );
};

export const useMeals = () => {
  const ctx = useContext(MealContext);
  if (!ctx) throw new Error("useMeals must be used within MealProvider");
  return ctx;
};

export const useMealsContext = useMeals;
