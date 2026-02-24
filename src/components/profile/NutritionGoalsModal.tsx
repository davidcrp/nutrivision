import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMeals } from "@/contexts/MealContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Flame, Beef, Wheat, Droplets, Loader2, Calculator, SlidersHorizontal,
  AlertTriangle,
} from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* ── Mifflin-St Jeor ── */
function mifflinStJeor(gender: string, weight: number, height: number, age: number) {
  if (gender === "male") return 10 * weight + 6.25 * height - 5 * age + 5;
  return 10 * weight + 6.25 * height - 5 * age - 161;
}

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_OFFSETS: Record<string, number> = {
  lose: -500,
  maintain: 0,
  gain: 300,
};

/* ── Manual fields config ── */
const manualFields = [
  { key: "calories" as const, label: "Calorias (kcal)", icon: Flame, color: "text-primary" },
  { key: "protein" as const, label: "Proteínas (g)", icon: Beef, color: "text-primary" },
  { key: "carbs" as const, label: "Carboidratos (g)", icon: Wheat, color: "text-accent" },
  { key: "fat" as const, label: "Gorduras (g)", icon: Droplets, color: "text-lilac" },
];

const NutritionGoalsModal = ({ open, onOpenChange }: Props) => {
  const { dailyGoal, macroTargets, setDailyGoal, setMacroTargets } = useMeals();
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  /* ── Manual tab state ── */
  const [manual, setManual] = useState({
    calories: dailyGoal,
    protein: macroTargets.protein,
    carbs: macroTargets.carbs,
    fat: macroTargets.fat,
  });

  /* ── Calculator tab state ── */
  const [calc, setCalc] = useState({
    gender: "male",
    age: 30,
    weight: 75,
    height: 175,
    activity: "moderate",
    goal: "maintain",
  });

  const [calcResult, setCalcResult] = useState<{
    calories: number; protein: number; carbs: number; fat: number;
  } | null>(null);

  /* ── Sync state when modal opens ── */
  const handleOpen = (o: boolean) => {
    if (o) {
      setManual({
        calories: dailyGoal,
        protein: macroTargets.protein,
        carbs: macroTargets.carbs,
        fat: macroTargets.fat,
      });
      setCalcResult(null);
    }
    onOpenChange(o);
  };

  /* ── Math check for manual tab ── */
  const macroCalorieSum = manual.protein * 4 + manual.carbs * 4 + manual.fat * 9;
  const mathMismatch = Math.abs(macroCalorieSum - manual.calories) > 50;

  /* ── Calculator logic ── */
  const handleCalculate = () => {
    const tmb = mifflinStJeor(calc.gender, calc.weight, calc.height, calc.age);
    const tdee = tmb * ACTIVITY_MULTIPLIERS[calc.activity];
    const finalCal = Math.round(tdee + GOAL_OFFSETS[calc.goal]);

    const protein = Math.round(2.0 * calc.weight);
    const fat = Math.round(1.0 * calc.weight);
    const proteinCal = protein * 4;
    const fatCal = fat * 9;
    const carbsCal = Math.max(0, finalCal - proteinCal - fatCal);
    const carbs = Math.round(carbsCal / 4);

    setCalcResult({ calories: finalCal, protein, carbs, fat });
  };

  /* ── Save to DB + context ── */
  const persistGoals = async (values: { calories: number; protein: number; carbs: number; fat: number }) => {
    setSaving(true);
    try {
      setDailyGoal(values.calories);
      setMacroTargets({ protein: values.protein, carbs: values.carbs, fat: values.fat });

      if (user) {
        const { error } = await supabase
          .from("profiles")
          .update({
            daily_calorie_target: values.calories,
            daily_protein_target: values.protein,
            daily_carbs_target: values.carbs,
            daily_fat_target: values.fat,
          })
          .eq("user_id", user.id);
        if (error) throw error;
      }

      toast({ title: "✅ Metas atualizadas!", description: "Suas metas nutricionais foram salvas com sucesso." });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Não foi possível salvar.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  /* ── Select component helper ── */
  const SelectField = ({
    label,
    value,
    onChange,
    options,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
  }) => (
    <div className="space-y-1">
      <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-muted border-0 py-2.5 px-3 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );

  /* ── Number input helper ── */
  const NumField = ({
    label,
    value,
    onChange,
    unit,
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    unit?: string;
  }) => (
    <div className="space-y-1">
      <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-full rounded-xl bg-muted border-0 py-2.5 px-3 pr-10 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/30"
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-medium">
            {unit}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="rounded-2xl max-w-sm mx-auto p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-lg font-bold text-foreground">Metas Nutricionais</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="calculator" className="w-full">
          <TabsList className="w-full grid grid-cols-2 bg-secondary rounded-none h-11 px-5">
            <TabsTrigger
              value="calculator"
              className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs font-semibold flex items-center gap-1.5"
            >
              <Calculator size={14} />
              Calculadora
            </TabsTrigger>
            <TabsTrigger
              value="manual"
              className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs font-semibold flex items-center gap-1.5"
            >
              <SlidersHorizontal size={14} />
              Ajuste Manual
            </TabsTrigger>
          </TabsList>

          {/* ── Calculator Tab ── */}
          <TabsContent value="calculator" className="px-5 pb-5 pt-4 space-y-4 mt-0">
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Género"
                value={calc.gender}
                onChange={(v) => setCalc((c) => ({ ...c, gender: v }))}
                options={[
                  { value: "male", label: "Masculino" },
                  { value: "female", label: "Feminino" },
                ]}
              />
              <NumField
                label="Idade"
                value={calc.age}
                onChange={(v) => setCalc((c) => ({ ...c, age: v }))}
                unit="anos"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NumField
                label="Peso"
                value={calc.weight}
                onChange={(v) => setCalc((c) => ({ ...c, weight: v }))}
                unit="kg"
              />
              <NumField
                label="Altura"
                value={calc.height}
                onChange={(v) => setCalc((c) => ({ ...c, height: v }))}
                unit="cm"
              />
            </div>
            <SelectField
              label="Nível de Atividade"
              value={calc.activity}
              onChange={(v) => setCalc((c) => ({ ...c, activity: v }))}
              options={[
                { value: "sedentary", label: "Sedentário" },
                { value: "light", label: "Levemente ativo" },
                { value: "moderate", label: "Moderadamente ativo" },
                { value: "active", label: "Muito ativo" },
                { value: "very_active", label: "Extremamente ativo" },
              ]}
            />
            <SelectField
              label="Objetivo"
              value={calc.goal}
              onChange={(v) => setCalc((c) => ({ ...c, goal: v }))}
              options={[
                { value: "lose", label: "Perder peso" },
                { value: "maintain", label: "Manter peso" },
                { value: "gain", label: "Ganhar massa" },
              ]}
            />

            {/* Calculate button */}
            {!calcResult ? (
              <button
                onClick={handleCalculate}
                className="w-full rounded-xl bg-secondary py-3 text-sm font-semibold text-foreground hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
              >
                <Calculator size={16} />
                Calcular Metas
              </button>
            ) : (
              /* ── Result Card ── */
              <div className="rounded-2xl bg-muted p-4 space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Resultado</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Calorias", value: `${calcResult.calories} kcal`, icon: Flame, color: "text-primary" },
                    { label: "Proteínas", value: `${calcResult.protein}g`, icon: Beef, color: "text-primary" },
                    { label: "Carboidratos", value: `${calcResult.carbs}g`, icon: Wheat, color: "text-accent" },
                    { label: "Gorduras", value: `${calcResult.fat}g`, icon: Droplets, color: "text-lilac" },
                  ].map((r) => (
                    <div key={r.label} className="flex items-center gap-2 rounded-xl bg-card p-2.5">
                      <r.icon size={14} className={r.color} />
                      <div>
                        <p className="text-[10px] text-muted-foreground">{r.label}</p>
                        <p className="text-sm font-bold text-foreground">{r.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => persistGoals(calcResult)}
                  disabled={saving}
                  className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  Aplicar Metas
                </button>
                <button
                  onClick={() => setCalcResult(null)}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Recalcular
                </button>
              </div>
            )}
          </TabsContent>

          {/* ── Manual Tab ── */}
          <TabsContent value="manual" className="px-5 pb-5 pt-4 space-y-3 mt-0">
            {manualFields.map((f) => (
              <div key={f.key} className="flex items-center gap-3 rounded-xl bg-muted p-3">
                <f.icon size={18} className={f.color} />
                <label className="flex-1 text-sm font-medium text-foreground">{f.label}</label>
                <input
                  type="number"
                  min={0}
                  value={manual[f.key]}
                  onChange={(e) => setManual((v) => ({ ...v, [f.key]: Number(e.target.value) || 0 }))}
                  className="w-20 rounded-lg bg-background border border-input py-1.5 px-2 text-sm text-right font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            ))}

            {/* Math check */}
            <div className={`rounded-xl px-3 py-2 text-xs transition-colors ${mathMismatch ? "bg-amber-50 dark:bg-amber-950/30" : "bg-muted"}`}>
              <div className="flex items-center gap-2">
                {mathMismatch && <AlertTriangle size={14} className="text-amber-500 shrink-0" />}
                <span className={mathMismatch ? "text-amber-600 dark:text-amber-400 font-medium" : "text-muted-foreground"}>
                  Soma dos macros: <strong>{Math.round(macroCalorieSum)} kcal</strong>
                  {mathMismatch && " — difere da meta total"}
                </span>
              </div>
            </div>

            <button
              onClick={() => persistGoals(manual)}
              disabled={saving}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              Salvar Alterações
            </button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default NutritionGoalsModal;
