import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMeals } from "@/contexts/MealContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Beef, Wheat, Droplets, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const fields = [
  { key: "calories" as const, label: "Calorias (kcal)", icon: Flame, color: "text-primary" },
  { key: "protein" as const, label: "Proteínas (g)", icon: Beef, color: "text-primary" },
  { key: "carbs" as const, label: "Carboidratos (g)", icon: Wheat, color: "text-accent" },
  { key: "fat" as const, label: "Gorduras (g)", icon: Droplets, color: "text-[hsl(var(--lilac))]" },
];

const NutritionGoalsModal = ({ open, onOpenChange }: Props) => {
  const { dailyGoal, macroTargets, setDailyGoal, setMacroTargets } = useMeals();
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [values, setValues] = useState({
    calories: dailyGoal,
    protein: macroTargets.protein,
    carbs: macroTargets.carbs,
    fat: macroTargets.fat,
  });

  const handleOpen = (o: boolean) => {
    if (o) {
      setValues({
        calories: dailyGoal,
        protein: macroTargets.protein,
        carbs: macroTargets.carbs,
        fat: macroTargets.fat,
      });
    }
    onOpenChange(o);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update local state
      setDailyGoal(values.calories);
      setMacroTargets({ protein: values.protein, carbs: values.carbs, fat: values.fat });

      // Persist to DB if logged in
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

      toast({ title: "✅ Metas atualizadas!", description: "Suas metas nutricionais foram salvas." });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Não foi possível salvar.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="rounded-2xl max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Ajustar Metas</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          {fields.map((f) => (
            <div key={f.key} className="flex items-center gap-3 rounded-xl bg-muted p-3">
              <f.icon size={18} className={f.color} />
              <label className="flex-1 text-sm font-medium text-foreground">{f.label}</label>
              <input
                type="number"
                min={0}
                value={values[f.key]}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: Number(e.target.value) || 0 }))}
                className="w-20 rounded-lg bg-background border border-input py-1.5 px-2 text-sm text-right font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          ))}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-4 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          Salvar Alterações
        </button>
      </DialogContent>
    </Dialog>
  );
};

export default NutritionGoalsModal;
