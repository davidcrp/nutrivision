import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";

export interface MealItem {
  id: string;
  food_name: string;
  weight_grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface LoggedMeal {
  id: string;
  mealType: "breakfast" | "lunch" | "snack" | "dinner";
  items: MealItem[];
  imageUrl?: string;
  loggedAt: Date;
}

export interface MockRecipe {
  id: string;
  name: string;
  calories: number;
  emoji: string;
}

const recipeDatabase: MockRecipe[] = [
  { id: "r1", name: "Salada de Frango", calories: 350, emoji: "🥗" },
  { id: "r2", name: "Panqueca Proteica", calories: 500, emoji: "🥞" },
  { id: "r3", name: "Pizza Fit", calories: 800, emoji: "🍕" },
  { id: "r4", name: "Bowl de Açaí", calories: 420, emoji: "🍇" },
  { id: "r5", name: "Wrap Integral", calories: 380, emoji: "🌯" },
  { id: "r6", name: "Omelete de Claras", calories: 180, emoji: "🍳" },
  { id: "r7", name: "Sopa de Legumes", calories: 150, emoji: "🍲" },
  { id: "r8", name: "Frango com Batata Doce", calories: 550, emoji: "🍗" },
  { id: "r9", name: "Tapioca Recheada", calories: 320, emoji: "🫓" },
  { id: "r10", name: "Smoothie Verde", calories: 200, emoji: "🥤" },
  { id: "r11", name: "Poke Bowl", calories: 480, emoji: "🐟" },
  { id: "r12", name: "Sanduíche Natural", calories: 290, emoji: "🥪" },
  { id: "r13", name: "Risoto de Cogumelos", calories: 620, emoji: "🍄" },
  { id: "r14", name: "Cuscuz com Ovo", calories: 340, emoji: "🥚" },
  { id: "r15", name: "Strogonoff Light", calories: 450, emoji: "🥘" },
  { id: "r16", name: "Açaí com Granola", calories: 520, emoji: "🫐" },
  { id: "r17", name: "Salada Caesar", calories: 380, emoji: "🥬" },
  { id: "r18", name: "Macarrão Integral", calories: 560, emoji: "🍝" },
  { id: "r19", name: "Iogurte com Frutas", calories: 220, emoji: "🍨" },
  { id: "r20", name: "Crepioca Fit", calories: 250, emoji: "🧇" },
  { id: "r21", name: "Bowl de Quinoa", calories: 400, emoji: "🥣" },
  { id: "r22", name: "Hambúrguer de Grão", calories: 680, emoji: "🍔" },
  { id: "r23", name: "Torta de Frango Light", calories: 750, emoji: "🥧" },
  { id: "r24", name: "Banana com Pasta de Amendoim", calories: 270, emoji: "🍌" },
  { id: "r25", name: "Salmão Grelhado", calories: 900, emoji: "🐠" },
];

function shuffleAndPick<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

interface MealState {
  dailyGoal: number;
  setDailyGoal: (goal: number) => void;
  onboardingComplete: boolean;
  completeOnboarding: (goal: number) => void;
  consumedCalories: number;
  consumedMacros: { protein: number; carbs: number; fat: number };
  loggedMeals: LoggedMeal[];
  filteredRecipes: MockRecipe[];
  remainingCalories: number;
  addMeal: (meal: Omit<LoggedMeal, "id" | "loggedAt">) => void;
  removeItemFromMeal: (mealId: string, itemId: string) => void;
}

const MealContext = createContext<MealState | null>(null);

export const MealProvider = ({ children }: { children: ReactNode }) => {
  const [dailyGoal, setDailyGoal] = useState(() => {
    const saved = localStorage.getItem("daily_goal");
    return saved ? Number(saved) : 2000;
  });
  const [onboardingComplete, setOnboardingComplete] = useState(() => {
    return localStorage.getItem("onboarding_complete") === "true";
  });
  const [loggedMeals, setLoggedMeals] = useState<LoggedMeal[]>([]);

  // STRICT MATH: all totals derived from loggedMeals items
  const { consumedCalories, consumedMacros } = useMemo(() => {
    let cal = 0, protein = 0, carbs = 0, fat = 0;
    for (const meal of loggedMeals) {
      for (const item of meal.items) {
        cal += item.calories;
        protein += item.protein;
        carbs += item.carbs;
        fat += item.fat;
      }
    }
    return {
      consumedCalories: Math.round(cal * 10) / 10,
      consumedMacros: {
        protein: Math.round(protein * 10) / 10,
        carbs: Math.round(carbs * 10) / 10,
        fat: Math.round(fat * 10) / 10,
      },
    };
  }, [loggedMeals]);

  const remainingCalories = dailyGoal - consumedCalories;

  // Filtered & randomized recipes
  const filteredRecipes = useMemo(() => {
    const eligible = recipeDatabase.filter((r) => r.calories <= remainingCalories);
    return shuffleAndPick(eligible, 10);
  }, [remainingCalories]);

  const completeOnboarding = useCallback((goal: number) => {
    setDailyGoal(goal);
    setOnboardingComplete(true);
    localStorage.setItem("onboarding_complete", "true");
    localStorage.setItem("daily_goal", String(goal));
  }, []);

  const addMeal = useCallback((meal: Omit<LoggedMeal, "id" | "loggedAt">) => {
    const newMeal: LoggedMeal = {
      ...meal,
      id: crypto.randomUUID(),
      loggedAt: new Date(),
    };
    setLoggedMeals((prev) => [...prev, newMeal]);
  }, []);

  const removeItemFromMeal = useCallback((mealId: string, itemId: string) => {
    setLoggedMeals((prev) =>
      prev
        .map((meal) => {
          if (meal.id !== mealId) return meal;
          return { ...meal, items: meal.items.filter((i) => i.id !== itemId) };
        })
        .filter((meal) => meal.items.length > 0) // remove empty meals
    );
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
        filteredRecipes,
        remainingCalories,
        addMeal,
        removeItemFromMeal,
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
