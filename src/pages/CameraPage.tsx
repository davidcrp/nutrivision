import { useState, useRef } from "react";
import { Camera, Image, Zap, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMeals } from "@/contexts/MealContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import ScannerModal from "@/components/ScannerModal";
import ResultsBottomSheet, {
  type FoodItem,
  type AnalysisResult,
  type MealType,
} from "@/components/ResultsBottomSheet";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

// Compress image before upload to avoid timeout on large camera photos
const compressImage = (file: File, quality = 0.7, maxWidth = 1080): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round(height * (maxWidth / width));
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(file); return; }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }));
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

const CameraPage = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [aiRawResponse, setAiRawResponse] = useState<any>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [saving, setSaving] = useState(false);

  // No-food alert state
  const [noFoodAlert, setNoFoodAlert] = useState<{ open: boolean; message: string }>({ open: false, message: "" });

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const { addMeal } = useMeals();
  const { subscriptionTier, openPaywall } = useSubscription();
  const { toast } = useToast();

  const FREE_DAILY_SCAN_LIMIT = 3;

  const getTodayScans = (): number => {
    const today = new Date().toISOString().split("T")[0];
    const stored = localStorage.getItem("scan_count");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.date === today) return parsed.count;
    }
    return 0;
  };

  const incrementScanCount = () => {
    const today = new Date().toISOString().split("T")[0];
    const current = getTodayScans();
    localStorage.setItem("scan_count", JSON.stringify({ date: today, count: current + 1 }));
  };

  const canScan = (): boolean => {
    if (subscriptionTier === "premium") return true;
    return getTodayScans() < FREE_DAILY_SCAN_LIMIT;
  };

  const handleScanAttempt = (inputRef: React.RefObject<HTMLInputElement | null>) => {
    if (!canScan()) {
      openPaywall();
      return;
    }
    inputRef.current?.click();
  };

  const analyzeFoodImage = async (rawFile: File): Promise<{ result: AnalysisResult; rawResponse: any; imageUrl: string } | null> => {
    // 0. Require authentication for upload (RLS requires it)
    if (!user) {
      toast({ title: "Faça login para analisar refeições", variant: "destructive" });
      return null;
    }

    // 1. Compress image to avoid timeout on large camera photos
    console.log("[Upload] Original file size:", (rawFile.size / 1024 / 1024).toFixed(2), "MB");
    const file = await compressImage(rawFile);
    console.log("[Upload] Compressed file size:", (file.size / 1024 / 1024).toFixed(2), "MB");

    // 2. Upload to meal-photos bucket
    const path = `${user.id}/${Date.now()}.jpg`;
    console.log("[Upload] Starting upload to meal-photos bucket:", path);

    try {
      const { error: uploadError } = await supabase.storage
        .from("meal-photos")
        .upload(path, file, { contentType: file.type });

      if (uploadError) {
        console.error("[Upload] Failed to upload image:", JSON.stringify(uploadError));
        toast({
          title: "Falha ao enviar a imagem",
          description: `Verifique sua conexão e tente novamente. (${uploadError.message})`,
          variant: "destructive",
        });
        return null;
      }

      console.log("[Upload] Image uploaded successfully");
    } catch (uploadErr: any) {
      console.error("[Upload] Upload threw an exception:", uploadErr);
      toast({
        title: "Falha ao enviar a imagem",
        description: "Verifique sua conexão e tente novamente.",
        variant: "destructive",
      });
      return null;
    }

    // 2. Get public URL
    const { data: urlData } = supabase.storage.from("meal-photos").getPublicUrl(path);
    const imageUrl = urlData?.publicUrl;

    if (!imageUrl) {
      console.error("[Upload] Failed to generate public URL");
      toast({ title: "Erro ao gerar URL da imagem", variant: "destructive" });
      return null;
    }

    console.log("[Upload] Public URL generated:", imageUrl);

    // 3. Call AI analysis — always real, no mocks
    console.log("[AI] Calling analyze-meal Edge Function...");
    const { data, error } = await supabase.functions.invoke("analyze-meal", {
      body: { imageUrl },
    });

    if (error) {
      console.error("[AI] Edge Function invocation error:", error);
      toast({ title: "Erro na análise da IA", description: "Tente novamente.", variant: "destructive" });
      return null;
    }

    if (data?.error) {
      console.error("[AI] Edge Function returned error:", data.error);
      toast({ title: "Erro na análise", description: data.error, variant: "destructive" });
      return null;
    }

    // 4. Handle is_food: false — no crash, show friendly alert
    if (data?.is_food === false) {
      console.log("[AI] No food detected:", data.message);
      return { result: null as any, rawResponse: data, imageUrl: "__no_food__" };
    }

    console.log("[AI] Analysis complete:", { items: data?.items?.length, calories: data?.total_calories });

    return {
      result: data as AnalysisResult,
      rawResponse: data,
      imageUrl,
    };
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    incrementScanCount();

    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setScanning(true);

    const analysisData = await analyzeFoodImage(file);
    setScanning(false);

    if (analysisData === null) {
      // Upload or AI error — already toasted
      resetState();
      return;
    }

    // Handle is_food: false with elegant alert
    if (analysisData.imageUrl === "__no_food__") {
      const msg = analysisData.rawResponse?.message || "Nenhum alimento ou bebida detectado na imagem.";
      setNoFoodAlert({ open: true, message: msg });
      resetState();
      return;
    }

    setAnalysisResult(analysisData.result);
    setAiRawResponse(analysisData.rawResponse);
    setUploadedImageUrl(analysisData.imageUrl);
    setShowResults(true);
  };

  const handleConfirm = async (editedItems: FoodItem[], mealType: MealType) => {
    setSaving(true);
    try {
      const totals = editedItems.reduce(
        (acc, item) => ({
          calories: acc.calories + item.calories,
          protein: acc.protein + item.protein,
          carbs: acc.carbs + item.carbs,
          fat: acc.fat + item.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      addMeal({
        mealType,
        items: editedItems.map((i) => ({
          id: crypto.randomUUID(),
          food_name: i.food_name,
          weight_grams: i.weight_grams,
          calories: i.calories,
          protein: i.protein,
          carbs: i.carbs,
          fat: i.fat,
        })),
        imageUrl: imagePreview || undefined,
      });

      if (user) {
        const mealTypeMap: Record<MealType, string> = {
          breakfast: "breakfast",
          lunch: "lunch",
          snack: "snack",
          dinner: "dinner",
        };

        const { data: meal, error: mealError } = await supabase
          .from("meals")
          .insert({
            user_id: user.id,
            meal_type: mealTypeMap[mealType],
            image_url: uploadedImageUrl,
            total_calories: Math.round(totals.calories),
            total_protein: Math.round(totals.protein * 10) / 10,
            total_carbs: Math.round(totals.carbs * 10) / 10,
            total_fat: Math.round(totals.fat * 10) / 10,
            ai_confidence_score: 85,
            is_verified: true,
            ai_raw_response: aiRawResponse,
          } as any)
          .select("id")
          .single();

        if (mealError) throw mealError;

        const items = editedItems.map((item) => ({
          meal_id: meal.id,
          food_name: item.food_name,
          weight_grams: Math.round(item.weight_grams),
          calories: Math.round(item.calories),
          protein: Math.round(item.protein * 10) / 10,
          carbs: Math.round(item.carbs * 10) / 10,
          fat: Math.round(item.fat * 10) / 10,
        }));
        const { error: itemsError } = await supabase.from("meal_items").insert(items);
        if (itemsError) throw itemsError;
      }

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
    setAiRawResponse(null);
    setUploadedImageUrl(null);
    setShowResults(false);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-5 pt-6 pb-24">
        <h1 className="text-xl font-bold text-foreground mb-4">Escanear Refeição</h1>

        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelected} />
        <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelected} />

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
          <button onClick={() => handleScanAttempt(cameraInputRef)} className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
            <Camera size={18} />
            Tirar Foto
          </button>
          <button onClick={() => handleScanAttempt(galleryInputRef)} className="flex items-center justify-center gap-2 rounded-2xl bg-cream py-4 text-foreground font-semibold text-sm hover:bg-cream-dark transition-colors">
            <Image size={18} />
            Galeria
          </button>
        </div>

        {subscriptionTier === "free" && (
          <p className="text-center text-xs text-muted-foreground mt-3">
            {getTodayScans()}/{FREE_DAILY_SCAN_LIMIT} scans gratuitos usados hoje
          </p>
        )}

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
      </div>

      {scanning && imagePreview && <ScannerModal imageUrl={imagePreview} onClose={resetState} />}

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

      {/* Elegant no-food alert */}
      <AlertDialog open={noFoodAlert.open} onOpenChange={(o) => !o && setNoFoodAlert({ open: false, message: "" })}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <div className="flex justify-center mb-2">
              <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle size={28} className="text-destructive" />
              </div>
            </div>
            <AlertDialogTitle className="text-center">Nenhum alimento detectado</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              {noFoodAlert.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction
              onClick={() => setNoFoodAlert({ open: false, message: "" })}
              className="rounded-2xl bg-primary text-primary-foreground px-8"
            >
              <Camera size={16} className="mr-2" />
              Tirar nova foto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
};

export default CameraPage;
