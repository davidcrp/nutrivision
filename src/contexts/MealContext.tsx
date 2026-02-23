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
  prepTime: string;
  servings: number;
  ingredients: string[];
  steps: string[];
}

const recipeDatabase: MockRecipe[] = [
  { id: "r1", name: "Salada de Frango", calories: 350, emoji: "🥗", prepTime: "20 min", servings: 1, ingredients: ["200g peito de frango grelhado", "Mix de folhas verdes", "Tomate cereja", "Pepino", "Azeite e limão"], steps: ["Grelhe o frango temperado.", "Pique os vegetais.", "Monte a salada e tempere."] },
  { id: "r2", name: "Panqueca Proteica", calories: 500, emoji: "🥞", prepTime: "15 min", servings: 2, ingredients: ["2 ovos", "1 banana", "30g whey protein", "2 col. aveia"], steps: ["Bata tudo no liquidificador.", "Aqueça a frigideira antiaderente.", "Despeje e doure dos dois lados."] },
  { id: "r3", name: "Pizza Fit", calories: 800, emoji: "🍕", prepTime: "40 min", servings: 2, ingredients: ["Massa integral", "Molho de tomate caseiro", "Mussarela light", "Frango desfiado", "Rúcula"], steps: ["Abra a massa e espalhe o molho.", "Adicione os recheios.", "Asse a 220°C por 15 min.", "Finalize com rúcula."] },
  { id: "r4", name: "Bowl de Açaí", calories: 420, emoji: "🍇", prepTime: "10 min", servings: 1, ingredients: ["200g polpa de açaí", "1 banana", "Granola", "Mel"], steps: ["Bata o açaí com banana.", "Despeje na tigela.", "Cubra com granola e mel."] },
  { id: "r5", name: "Wrap Integral", calories: 380, emoji: "🌯", prepTime: "15 min", servings: 1, ingredients: ["1 tortilha integral", "Frango desfiado", "Alface", "Tomate", "Requeijão light"], steps: ["Espalhe o requeijão na tortilha.", "Adicione o frango e vegetais.", "Enrole e sirva."] },
  { id: "r6", name: "Omelete de Claras", calories: 180, emoji: "🍳", prepTime: "10 min", servings: 1, ingredients: ["4 claras", "Espinafre", "Tomate", "Sal e pimenta"], steps: ["Bata as claras.", "Refogue os vegetais.", "Despeje as claras e cozinhe."] },
  { id: "r7", name: "Sopa de Legumes", calories: 150, emoji: "🍲", prepTime: "30 min", servings: 2, ingredients: ["Cenoura", "Abobrinha", "Batata", "Cebola", "Temperos"], steps: ["Pique todos os legumes.", "Cozinhe em água temperada.", "Bata no liquidificador se desejar."] },
  { id: "r8", name: "Frango com Batata Doce", calories: 550, emoji: "🍗", prepTime: "35 min", servings: 1, ingredients: ["200g peito de frango", "1 batata doce média", "Brócolis", "Azeite"], steps: ["Tempere e asse o frango.", "Cozinhe a batata doce.", "Refogue o brócolis e monte o prato."] },
  { id: "r9", name: "Tapioca Recheada", calories: 320, emoji: "🫓", prepTime: "10 min", servings: 1, ingredients: ["3 col. goma de tapioca", "Queijo cottage", "Peito de peru"], steps: ["Espalhe a goma na frigideira.", "Aguarde hidratar e virar.", "Recheie e dobre."] },
  { id: "r10", name: "Smoothie Verde", calories: 200, emoji: "🥤", prepTime: "5 min", servings: 1, ingredients: ["1 banana", "Espinafre", "200ml leite vegetal", "1 col. chia"], steps: ["Coloque tudo no liquidificador.", "Bata até ficar homogêneo.", "Sirva gelado."] },
  { id: "r11", name: "Poke Bowl", calories: 480, emoji: "🐟", prepTime: "20 min", servings: 1, ingredients: ["150g salmão fresco", "Arroz japonês", "Pepino", "Abacate", "Shoyu"], steps: ["Cozinhe o arroz e deixe esfriar.", "Corte o salmão em cubos.", "Monte a bowl com os toppings."] },
  { id: "r12", name: "Sanduíche Natural", calories: 290, emoji: "🥪", prepTime: "10 min", servings: 1, ingredients: ["Pão integral", "Atum light", "Cenoura ralada", "Milho", "Maionese light"], steps: ["Misture o atum com os ingredientes.", "Recheie o pão.", "Sirva frio."] },
  { id: "r13", name: "Risoto de Cogumelos", calories: 620, emoji: "🍄", prepTime: "40 min", servings: 2, ingredients: ["Arroz arbóreo", "Cogumelos paris", "Cebola", "Caldo de legumes", "Parmesão"], steps: ["Refogue a cebola e os cogumelos.", "Adicione o arroz e o caldo aos poucos.", "Finalize com parmesão."] },
  { id: "r14", name: "Cuscuz com Ovo", calories: 340, emoji: "🥚", prepTime: "15 min", servings: 1, ingredients: ["Flocos de milho", "2 ovos", "Manteiga", "Sal"], steps: ["Hidrate o cuscuz e cozinhe no vapor.", "Frite ou cozinhe os ovos.", "Sirva juntos."] },
  { id: "r15", name: "Strogonoff Light", calories: 450, emoji: "🥘", prepTime: "30 min", servings: 2, ingredients: ["300g frango em cubos", "Creme de leite light", "Champignon", "Mostarda", "Ketchup"], steps: ["Refogue o frango.", "Adicione mostarda e ketchup.", "Junte o creme e o champignon."] },
  { id: "r16", name: "Açaí com Granola", calories: 520, emoji: "🫐", prepTime: "5 min", servings: 1, ingredients: ["300g açaí", "Granola", "Banana fatiada", "Mel"], steps: ["Despeje o açaí na tigela.", "Adicione a granola e banana.", "Finalize com mel."] },
  { id: "r17", name: "Salada Caesar", calories: 380, emoji: "🥬", prepTime: "15 min", servings: 1, ingredients: ["Alface romana", "Croutons integrais", "Parmesão", "Frango grelhado", "Molho caesar light"], steps: ["Grelhe e fatie o frango.", "Monte a salada com os croutons.", "Regue com o molho."] },
  { id: "r18", name: "Macarrão Integral", calories: 560, emoji: "🍝", prepTime: "25 min", servings: 2, ingredients: ["200g macarrão integral", "Molho de tomate", "Carne moída magra", "Cebola", "Alho"], steps: ["Cozinhe o macarrão al dente.", "Prepare o molho com a carne.", "Misture e sirva."] },
  { id: "r19", name: "Iogurte com Frutas", calories: 220, emoji: "🍨", prepTime: "5 min", servings: 1, ingredients: ["Iogurte natural", "Morango", "Blueberry", "1 col. mel", "Granola"], steps: ["Coloque o iogurte na tigela.", "Adicione as frutas.", "Finalize com mel e granola."] },
  { id: "r20", name: "Crepioca Fit", calories: 250, emoji: "🧇", prepTime: "10 min", servings: 1, ingredients: ["1 ovo", "2 col. goma de tapioca", "Queijo branco", "Orégano"], steps: ["Misture ovo e goma.", "Despeje na frigideira.", "Recheie com queijo e dobre."] },
  { id: "r21", name: "Bowl de Quinoa", calories: 400, emoji: "🥣", prepTime: "25 min", servings: 1, ingredients: ["Quinoa", "Grão-de-bico", "Pepino", "Tomate seco", "Hortelã"], steps: ["Cozinhe a quinoa.", "Misture com grão-de-bico e vegetais.", "Tempere e sirva."] },
  { id: "r22", name: "Hambúrguer de Grão", calories: 680, emoji: "🍔", prepTime: "30 min", servings: 2, ingredients: ["Grão-de-bico cozido", "Aveia", "Cebola", "Pão integral", "Alface e tomate"], steps: ["Processe o grão-de-bico com aveia.", "Modele os hambúrgueres.", "Grelhe e monte o sanduíche."] },
  { id: "r23", name: "Torta de Frango Light", calories: 750, emoji: "🥧", prepTime: "45 min", servings: 4, ingredients: ["Frango desfiado", "Massa de iogurte", "Milho", "Requeijão light", "Orégano"], steps: ["Prepare o recheio.", "Faça a massa com iogurte e ovos.", "Monte e asse por 30 min."] },
  { id: "r24", name: "Banana com Pasta de Amendoim", calories: 270, emoji: "🍌", prepTime: "3 min", servings: 1, ingredients: ["1 banana", "1 col. pasta de amendoim", "Canela"], steps: ["Fatie a banana.", "Espalhe a pasta de amendoim.", "Polvilhe canela."] },
  { id: "r25", name: "Salmão Grelhado", calories: 900, emoji: "🐠", prepTime: "25 min", servings: 2, ingredients: ["2 filés de salmão", "Limão", "Aspargos", "Azeite", "Alho"], steps: ["Tempere o salmão com limão e alho.", "Grelhe por 5 min de cada lado.", "Sirva com aspargos grelhados."] },
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
