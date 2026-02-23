import { useState } from "react";
import { Camera, Image, Zap, X, Loader2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const mockResults = [
  { name: "Arroz branco", portion: "1 xícara", cal: 206, protein: 4.3, carbs: 44.5, fat: 0.4 },
  { name: "Feijão preto", portion: "1/2 xícara", cal: 114, protein: 7.6, carbs: 20.4, fat: 0.5 },
  { name: "Frango grelhado", portion: "100g", cal: 165, protein: 31, carbs: 0, fat: 3.6 },
];

const CameraPage = () => {
  const [mode, setMode] = useState<"idle" | "analyzing" | "results">("idle");

  const handleCapture = () => {
    setMode("analyzing");
    setTimeout(() => setMode("results"), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-5 pt-6 pb-24">
        <h1 className="text-xl font-bold text-foreground mb-4">Escanear Refeição</h1>

        {mode === "idle" && (
          <>
            {/* Camera area */}
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
                onClick={handleCapture}
                className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                <Camera size={18} />
                Tirar Foto
              </button>
              <button
                onClick={handleCapture}
                className="flex items-center justify-center gap-2 rounded-2xl bg-cream py-4 text-foreground font-semibold text-sm hover:bg-cream-dark transition-colors"
              >
                <Image size={18} />
                Galeria
              </button>
            </div>

            {/* Tips */}
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground">Alimentos detectados</h2>
              <button onClick={() => setMode("idle")} className="p-1 rounded-full hover:bg-muted transition-colors">
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>

            {/* Total */}
            <div className="rounded-2xl bg-primary/10 p-4 mb-4 text-center">
              <p className="text-xs text-muted-foreground">Total estimado</p>
              <p className="text-3xl font-bold text-primary mt-1">485 kcal</p>
            </div>

            {/* Items */}
            <div className="space-y-2">
              {mockResults.map((item) => (
                <div key={item.name} className="rounded-2xl bg-cream p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.portion}</p>
                    </div>
                    <p className="text-sm font-bold text-accent">{item.cal} kcal</p>
                  </div>
                  <div className="flex gap-4 mt-2">
                    <span className="text-[10px] text-muted-foreground">P: {item.protein}g</span>
                    <span className="text-[10px] text-muted-foreground">C: {item.carbs}g</span>
                    <span className="text-[10px] text-muted-foreground">G: {item.fat}g</span>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-5 rounded-2xl bg-primary py-4 text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
              Adicionar ao diário
            </button>
            <button onClick={() => setMode("idle")} className="w-full mt-2 rounded-2xl bg-cream py-4 text-foreground font-semibold text-sm hover:bg-cream-dark transition-colors">
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
