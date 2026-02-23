import { useState, useRef } from "react";
import { Camera, Image, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import ScannerModal from "@/components/ScannerModal";
import ResultsBottomSheet, {
  type FoodItem,
  type AnalysisResult,
} from "@/components/ResultsBottomSheet";

const mockAnalysisResult: AnalysisResult = {
  total_calories: 485,
  total_protein: 42.9,
  total_carbs: 64.9,
  total_fat: 4.5,
  items: [
    { food_name: "Arroz branco", weight_grams: 160, calories: 206, protein: 4.3, carbs: 44.5, fat: 0.4 },
    { food_name: "Feijão preto", weight_grams: 86, calories: 114, protein: 7.6, carbs: 20.4, fat: 0.5 },
    { food_name: "Frango grelhado", weight_grams: 100, calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  ],
};

const CameraPage = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [saving, setSaving] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const { toast } = useToast();

  const analyzeFoodImage = async (file: File): Promise<AnalysisResult> => {
    try {
      let imageUrl: string | null = null;

      if (user) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("meal-photos")
          .upload(path, file);
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("meal-photos")
            .getPublicUrl(path);
          imageUrl = urlData.publicUrl;
        }
      }

      // Try calling edge function (will fallback to mock)
      try {
        if (imageUrl) {
          const { data, error } = await supabase.functions.invoke("analyze-meal", {
            body: { imageUrl },
          });
          if (!error && data) return data as AnalysisResult;
        }
      } catch {
        // Edge function not available yet, use mock
      }

      // Simulate AI analysis delay
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return mockAnalysisResult;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return mockAnalysisResult;
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setScanning(true);

    const result = await analyzeFoodImage(file);
    setAnalysisResult(result);
    setScanning(false);
    setShowResults(true);
  };

  const handleConfirm = async (editedItems: FoodItem[]) => {
    if (!user) {
      toast({ title: "Faça login para salvar refeições", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("meal-photos")
          .upload(path, imageFile);
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("meal-photos")
            .getPublicUrl(path);
          imageUrl = urlData.publicUrl;
        }
      }

      const totals = editedItems.reduce(
        (acc, item) => ({
          calories: acc.calories + item.calories,
          protein: acc.protein + item.protein,
          carbs: acc.carbs + item.carbs,
          fat: acc.fat + item.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      const { data: meal, error: mealError } = await supabase
        .from("meals")
        .insert({
          user_id: user.id,
          meal_type: "lunch",
          image_url: imageUrl,
          total_calories: totals.calories,
          total_protein: totals.protein,
          total_carbs: totals.carbs,
          total_fat: totals.fat,
          ai_confidence_score: 85,
          is_verified: true,
        })
        .select("id")
        .single();

      if (mealError) throw mealError;

      const items = editedItems.map((item) => ({ meal_id: meal.id, ...item }));
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
    setImageFile(null);
    setImagePreview(null);
    setScanning(false);
    setAnalysisResult(null);
    setShowResults(false);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

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

        {/* Idle state */}
        <div className="rounded-3xl bg-foreground/5 border-2 border-dashed border-border aspect-[4/3] flex flex-col items-center justify-center gap-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Camera size={36} className="text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">Tire uma foto da sua refeição</p>
            <p className="text-xs text-muted-foreground mt-1">
              Nossa IA vai identificar e contar as calorias
            </p>
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
            <h3 className="text-sm font-semibold text-foreground">
              Dicas para melhor resultado
            </h3>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1.5 ml-5 list-disc">
            <li>Use boa iluminação natural</li>
            <li>Centralize a refeição na foto</li>
            <li>Inclua todos os itens do prato</li>
            <li>Evite fotos desfocadas</li>
          </ul>
        </div>
      </div>

      {/* Scanner modal */}
      {scanning && imagePreview && (
        <ScannerModal imageUrl={imagePreview} onClose={resetState} />
      )}

      {/* Results bottom sheet */}
      {analysisResult && imagePreview && (
        <ResultsBottomSheet
          open={showResults}
          imageUrl={imagePreview}
          result={analysisResult}
          saving={saving}
          onConfirm={handleConfirm}
          onRetry={resetState}
          onClose={resetState}
        />
      )}

      <BottomNav />
    </div>
  );
};

export default CameraPage;
