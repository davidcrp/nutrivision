import { useState, useRef } from "react";
import { Camera, Image, Zap, X, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";

interface FoodItem {
  food_name: string;
  weight_grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const mockAnalyze = (): FoodItem[] => [
  { food_name: "Arroz branco", weight_grams: 160, calories: 206, protein: 4.3, carbs: 44.5, fat: 0.4 },
  { food_name: "Feijão preto", weight_grams: 86, calories: 114, protein: 7.6, carbs: 20.4, fat: 0.5 },
  { food_name: "Frango grelhado", weight_grams: 100, calories: 165, protein: 31, carbs: 0, fat: 3.6 },
];

const CameraPage = () => {
  const [mode, setMode] = useState<"idle" | "preview" | "analyzing" | "results">("idle");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [results, setResults] = useState<FoodItem[]>([]);
  const [mealType, setMealType] = useState<string>("lunch");
  const [saving, setSaving] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setMode("preview");
  };

  const handleAnalyze = () => {
    setMode("analyzing");
    setTimeout(() => {
      setResults(mockAnalyze());
      setMode("results");
    }, 2000);
  };

  const totalCalories = results.reduce((s, i) => s + i.calories, 0);
  const totalProtein = results.reduce((s, i) => s + i.protein, 0);
  const totalCarbs = results.reduce((s, i) => s + i.carbs, 0);
  const totalFat = results.reduce((s, i) => s + i.fat, 0);

  const handleSave = async () => {
    if (!user) {
      toast({ title: "Faça login para salvar refeições", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let imageUrl: string | null = null;

      // Upload image
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("meal-photos").upload(path, imageFile);
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("meal-photos").getPublicUrl(path);
          imageUrl = urlData.publicUrl;
        }
      }

      // Insert meal
      const { data: meal, error: mealError } = await supabase.from("meals").insert({
        user_id: user.id,
        meal_type: mealType as "breakfast" | "lunch" | "snack" | "dinner",
        image_url: imageUrl,
        total_calories: totalCalories,
        total_protein: totalProtein,
        total_carbs: totalCarbs,
        total_fat: totalFat,
        ai_confidence_score: 85,
        is_verified: true,
      }).select("id").single();

      if (mealError) throw mealError;

      // Insert items
      const items = results.map((item) => ({ meal_id: meal.id, ...item }));
      const { error: itemsError } = await supabase.from("meal_items").insert(items);
      if (itemsError) throw itemsError;

      toast({ title: "Refeição salva com sucesso! ✅" });
      resetState();
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const resetState = () => {
    setMode("idle");
    setImageFile(null);
    setImagePreview(null);
    setResults([]);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const mealTypes = [
    { value: "breakfast", label: "Café" },
    { value: "lunch", label: "Almoço" },
    { value: "snack", label: "Lanche" },
    { value: "dinner", label: "Jantar" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-5 pt-6 pb-24">
        <h1 className="text-xl font-bold text-foreground mb-4">Escanear Refeição</h1>

        {/* Hidden native file inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileSelected}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelected}
        />

        {mode === "idle" && (
          <>
            <div className="rounded-3xl bg-foreground/5 border-2 border-dashed border-border aspect-[4/3] flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Camera size={36} className="text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">Tire uma foto da sua refeição</p>
                <p className="text-xs text-muted-foreground mt-1">Nossa IA vai identificar e contar as calorias</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                <Camera size={18} />
                Tirar Foto
              </button>
              <button
                onClick={() => galleryInputRef.current?.click()}
                className="flex items-center justify-center gap-2 rounded-2xl bg-cream py-4 text-foreground font-semibold text-sm hover:bg-cream-dark transition-colors"
              >
                <Image size={18} />
                Galeria
              </button>
            </div>

            <div className="mt-6 rounded-2xl bg-cream p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={14} className="text-accent" />
                <h3 className="text-sm font-semibold text-foreground">Dicas para melhor resultado</h3>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1.5 ml-5 list-disc">
                <li>Use boa iluminação natural</li>
                <li>Centralize a refeição na foto</li>
                <li>Inclua todos os itens do prato</li>
                <li>Evite fotos desfocadas</li>
              </ul>
            </div>
          </>
        )}

        {mode === "preview" && imagePreview && (
          <>
            <div className="rounded-3xl overflow-hidden aspect-[4/3] bg-muted">
              <img src={imagePreview} alt="Foto da refeição" className="w-full h-full object-cover" />
            </div>

            {/* Meal type selector */}
            <div className="flex gap-2 mt-4">
              {mealTypes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setMealType(t.value)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    mealType === t.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-cream text-foreground hover:bg-cream-dark"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={handleAnalyze}
                className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                <Zap size={18} />
                Analisar
              </button>
              <button
                onClick={resetState}
                className="flex items-center justify-center gap-2 rounded-2xl bg-cream py-4 text-foreground font-semibold text-sm hover:bg-cream-dark transition-colors"
              >
                <X size={18} />
                Cancelar
              </button>
            </div>
          </>
        )}

        {mode === "analyzing" && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 size={36} className="text-primary animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-foreground">Analisando refeição...</p>
              <p className="text-xs text-muted-foreground mt-1">Identificando alimentos e calculando calorias</p>
            </div>
          </div>
        )}

        {mode === "results" && (
          <>
            {imagePreview && (
              <div className="rounded-3xl overflow-hidden aspect-[4/3] mb-4 bg-muted">
                <img src={imagePreview} alt="Foto da refeição" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground">Alimentos detectados</h2>
              <button onClick={resetState} className="p-1 rounded-full hover:bg-muted transition-colors">
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>

            <div className="rounded-2xl bg-primary/10 p-4 mb-4 text-center">
              <p className="text-xs text-muted-foreground">Total estimado</p>
              <p className="text-3xl font-bold text-primary mt-1">{totalCalories} kcal</p>
              <div className="flex justify-center gap-4 mt-2">
                <span className="text-xs text-muted-foreground">P: {totalProtein.toFixed(1)}g</span>
                <span className="text-xs text-muted-foreground">C: {totalCarbs.toFixed(1)}g</span>
                <span className="text-xs text-muted-foreground">G: {totalFat.toFixed(1)}g</span>
              </div>
            </div>

            <div className="space-y-2">
              {results.map((item) => (
                <div key={item.food_name} className="rounded-2xl bg-cream p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.food_name}</p>
                      <p className="text-xs text-muted-foreground">{item.weight_grams}g</p>
                    </div>
                    <p className="text-sm font-bold text-accent">{item.calories} kcal</p>
                  </div>
                  <div className="flex gap-4 mt-2">
                    <span className="text-[10px] text-muted-foreground">P: {item.protein}g</span>
                    <span className="text-[10px] text-muted-foreground">C: {item.carbs}g</span>
                    <span className="text-[10px] text-muted-foreground">G: {item.fat}g</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full mt-5 rounded-2xl bg-primary py-4 text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              {saving ? "Salvando..." : "Adicionar ao diário"}
            </button>
            <button onClick={resetState} className="w-full mt-2 rounded-2xl bg-cream py-4 text-foreground font-semibold text-sm hover:bg-cream-dark transition-colors">
              Escanear novamente
            </button>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default CameraPage;
