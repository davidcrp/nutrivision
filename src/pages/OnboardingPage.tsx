import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMeals } from "@/contexts/MealContext";
import { Sparkles, ChevronRight, ChevronLeft, Dumbbell, Briefcase, Bike, Flame, Target, TrendingDown, TrendingUp, Minus } from "lucide-react";

type Gender = "male" | "female";
type Activity = "sedentary" | "light" | "moderate" | "very_active";
type Goal = "lose" | "maintain" | "gain";

const ACTIVITY_MULTIPLIERS: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
};

const GOAL_ADJUSTMENTS: Record<Goal, number> = {
  lose: -500,
  maintain: 0,
  gain: 500,
};

const TOTAL_STEPS = 7; // gender, age, weight, height, activity, goal, result

const OnboardingPage = () => {
  const [step, setStep] = useState(0);
  const [gender, setGender] = useState<Gender | null>(null);
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [activity, setActivity] = useState<Activity | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [calculatedGoal, setCalculatedGoal] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const navigate = useNavigate();
  const { completeOnboarding } = useMeals();

  const canAdvance = useCallback(() => {
    switch (step) {
      case 0: return gender !== null;
      case 1: return age !== "" && Number(age) > 0;
      case 2: return weight !== "" && Number(weight) > 0;
      case 3: return height !== "" && Number(height) > 0;
      case 4: return activity !== null;
      case 5: return goal !== null;
      default: return false;
    }
  }, [step, gender, age, weight, height, activity, goal]);

  const calculateDailyGoal = useCallback(() => {
    const w = Number(weight);
    const h = Number(height);
    const a = Number(age);

    let tmb: number;
    if (gender === "male") {
      tmb = 10 * w + 6.25 * h - 5 * a + 5;
    } else {
      tmb = 10 * w + 6.25 * h - 5 * a - 161;
    }

    const get = tmb * ACTIVITY_MULTIPLIERS[activity!];
    const final = Math.round(get + GOAL_ADJUSTMENTS[goal!]);
    return final;
  }, [gender, age, weight, height, activity, goal]);

  const handleNext = () => {
    if (step < 5) {
      setStep((s) => s + 1);
    } else if (step === 5) {
      const result = calculateDailyGoal();
      setCalculatedGoal(result);
      setStep(6);
      setTimeout(() => setShowResult(true), 300);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleFinish = () => {
    completeOnboarding(calculatedGoal);
    navigate("/");
  };

  const progressPercent = ((step + 1) / TOTAL_STEPS) * 100;

  const activityOptions: { value: Activity; label: string; desc: string; icon: typeof Briefcase }[] = [
    { value: "sedentary", label: "Sedentário", desc: "Trabalho de escritório, sem exercícios", icon: Briefcase },
    { value: "light", label: "Levemente Ativo", desc: "Exercício leve 1-3 dias/semana", icon: Bike },
    { value: "moderate", label: "Moderadamente Ativo", desc: "Exercício moderado 3-5 dias/semana", icon: Dumbbell },
    { value: "very_active", label: "Muito Ativo", desc: "Exercício pesado 6-7 dias/semana", icon: Flame },
  ];

  const goalOptions: { value: Goal; label: string; desc: string; icon: typeof Target }[] = [
    { value: "lose", label: "Perder Peso", desc: "Cutting — déficit de 500 kcal", icon: TrendingDown },
    { value: "maintain", label: "Manter Peso", desc: "Manutenção — sem ajuste calórico", icon: Minus },
    { value: "gain", label: "Ganhar Massa", desc: "Bulking — superávit de 500 kcal", icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      {step < 6 && (
        <div className="px-5 pt-4">
          <div className="flex items-center justify-between mb-2">
            {step > 0 && (
              <button onClick={handleBack} className="p-1 rounded-full hover:bg-muted transition-colors">
                <ChevronLeft size={20} className="text-muted-foreground" />
              </button>
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              {step + 1} de {TOTAL_STEPS - 1}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Steps */}
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full px-5 pt-8 pb-28">
        {/* Step 0: Gender */}
        <div className={`flex-1 flex flex-col transition-all duration-400 ${step === 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 absolute pointer-events-none"}`}>
          <h2 className="text-2xl font-bold text-foreground">Qual é o seu sexo?</h2>
          <p className="text-sm text-muted-foreground mt-1">Isso ajuda a calcular sua taxa metabólica</p>
          <div className="grid grid-cols-2 gap-4 mt-8">
            {(["male", "female"] as Gender[]).map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                className={`rounded-2xl p-6 flex flex-col items-center gap-3 transition-all duration-200 border-2 ${
                  gender === g
                    ? "border-primary bg-primary/10 shadow-md scale-[1.02]"
                    : "border-border bg-cream hover:border-primary/30"
                }`}
              >
                <span className="text-4xl">{g === "male" ? "👨" : "👩"}</span>
                <span className="text-sm font-semibold text-foreground">
                  {g === "male" ? "Masculino" : "Feminino"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 1: Age */}
        <div className={`flex-1 flex flex-col transition-all duration-400 ${step === 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 absolute pointer-events-none"}`}>
          <h2 className="text-2xl font-bold text-foreground">Quantos anos você tem?</h2>
          <p className="text-sm text-muted-foreground mt-1">A idade influencia seu metabolismo</p>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="25"
                className="w-32 text-5xl font-bold text-center bg-transparent border-b-3 border-primary text-foreground outline-none placeholder:text-muted/40"
                min={1}
                max={120}
              />
              <p className="text-sm text-muted-foreground mt-3">anos</p>
            </div>
          </div>
        </div>

        {/* Step 2: Weight */}
        <div className={`flex-1 flex flex-col transition-all duration-400 ${step === 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 absolute pointer-events-none"}`}>
          <h2 className="text-2xl font-bold text-foreground">Qual é o seu peso?</h2>
          <p className="text-sm text-muted-foreground mt-1">Usado para calcular suas necessidades calóricas</p>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="70"
                className="w-32 text-5xl font-bold text-center bg-transparent border-b-3 border-primary text-foreground outline-none placeholder:text-muted/40"
                min={1}
              />
              <p className="text-sm text-muted-foreground mt-3">kg</p>
            </div>
          </div>
        </div>

        {/* Step 3: Height */}
        <div className={`flex-1 flex flex-col transition-all duration-400 ${step === 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 absolute pointer-events-none"}`}>
          <h2 className="text-2xl font-bold text-foreground">Qual é a sua altura?</h2>
          <p className="text-sm text-muted-foreground mt-1">A altura é fundamental para o cálculo da TMB</p>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="175"
                className="w-32 text-5xl font-bold text-center bg-transparent border-b-3 border-primary text-foreground outline-none placeholder:text-muted/40"
                min={1}
              />
              <p className="text-sm text-muted-foreground mt-3">cm</p>
            </div>
          </div>
        </div>

        {/* Step 4: Activity */}
        <div className={`flex-1 flex flex-col transition-all duration-400 ${step === 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 absolute pointer-events-none"}`}>
          <h2 className="text-2xl font-bold text-foreground">Nível de atividade</h2>
          <p className="text-sm text-muted-foreground mt-1">Selecione o que mais combina com sua rotina</p>
          <div className="space-y-3 mt-6">
            {activityOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => setActivity(opt.value)}
                  className={`w-full rounded-2xl p-4 flex items-center gap-4 text-left transition-all duration-200 border-2 ${
                    activity === opt.value
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-border bg-cream hover:border-primary/30"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activity === opt.value ? "bg-primary" : "bg-muted"}`}>
                    <Icon size={20} className={activity === opt.value ? "text-primary-foreground" : "text-muted-foreground"} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 5: Goal */}
        <div className={`flex-1 flex flex-col transition-all duration-400 ${step === 5 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 absolute pointer-events-none"}`}>
          <h2 className="text-2xl font-bold text-foreground">Qual é o seu objetivo?</h2>
          <p className="text-sm text-muted-foreground mt-1">Vamos ajustar suas calorias de acordo</p>
          <div className="space-y-3 mt-6">
            {goalOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => setGoal(opt.value)}
                  className={`w-full rounded-2xl p-4 flex items-center gap-4 text-left transition-all duration-200 border-2 ${
                    goal === opt.value
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-border bg-cream hover:border-primary/30"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${goal === opt.value ? "bg-primary" : "bg-muted"}`}>
                    <Icon size={20} className={goal === opt.value ? "text-primary-foreground" : "text-muted-foreground"} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 6: Result */}
        <div className={`flex-1 flex flex-col items-center justify-center transition-all duration-700 ${step === 6 ? "opacity-100 scale-100" : "opacity-0 scale-90 absolute pointer-events-none"}`}>
          <div className={`text-center transition-all duration-700 delay-200 ${showResult ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <button
              onClick={() => { setShowResult(false); setStep(5); }}
              className="mb-4 p-2 rounded-full hover:bg-muted transition-colors self-start mx-auto flex items-center gap-1 text-sm text-muted-foreground"
            >
              <ChevronLeft size={18} />
              Voltar
            </button>
            <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-6">
              <Sparkles size={36} className="text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Seu plano está pronto!</h2>
            <p className="text-sm text-muted-foreground mt-2">Baseado nos seus dados, sua meta diária é</p>

            <div className="mt-8 rounded-3xl bg-cream p-8">
              <p className="text-6xl font-bold text-primary">{calculatedGoal.toLocaleString("pt-BR")}</p>
              <p className="text-sm text-muted-foreground mt-2">kcal / dia</p>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-primary/10 p-3">
                <p className="text-xs text-muted-foreground">TMB</p>
                <p className="text-sm font-bold text-foreground">
                  {(() => {
                    const w = Number(weight), h = Number(height), a = Number(age);
                    return Math.round(gender === "male" ? 10*w + 6.25*h - 5*a + 5 : 10*w + 6.25*h - 5*a - 161);
                  })()}
                </p>
              </div>
              <div className="rounded-2xl bg-accent/10 p-3">
                <p className="text-xs text-muted-foreground">GET</p>
                <p className="text-sm font-bold text-foreground">
                  {(() => {
                    const w = Number(weight), h = Number(height), a = Number(age);
                    const tmb = gender === "male" ? 10*w + 6.25*h - 5*a + 5 : 10*w + 6.25*h - 5*a - 161;
                    return Math.round(tmb * ACTIVITY_MULTIPLIERS[activity!]);
                  })()}
                </p>
              </div>
              <div className="rounded-2xl bg-[hsl(var(--lilac))]/10 p-3">
                <p className="text-xs text-muted-foreground">Ajuste</p>
                <p className="text-sm font-bold text-foreground">
                  {GOAL_ADJUSTMENTS[goal!] > 0 ? "+" : ""}{GOAL_ADJUSTMENTS[goal!]}
                </p>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="w-full mt-8 rounded-2xl bg-primary py-4 text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Target size={18} />
              Ir para o meu Diário
            </button>
          </div>
        </div>
      </div>

      {/* Bottom advance button */}
      {step < 6 && (
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-background/80 backdrop-blur-md">
          <div className="max-w-md mx-auto">
            <button
              onClick={handleNext}
              disabled={!canAdvance()}
              className="w-full rounded-2xl bg-primary py-4 text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
            >
              Avançar
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingPage;
