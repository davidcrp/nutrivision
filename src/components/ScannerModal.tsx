import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface ScannerModalProps {
  imageUrl: string;
  onClose: () => void;
}

const ScannerModal = ({ imageUrl, onClose }: ScannerModalProps) => {
  const [scanPosition, setScanPosition] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanPosition((prev) => (prev >= 100 ? 0 : prev + 1.5));
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-md" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6">
        <button
          onClick={onClose}
          className="absolute -top-2 right-0 p-2 rounded-full bg-background/20 text-primary-foreground hover:bg-background/30 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Image with scanner */}
        <div className="relative w-56 h-56 rounded-3xl overflow-hidden shadow-2xl border-2 border-primary/30">
          <img
            src={imageUrl}
            alt="Refeição sendo analisada"
            className="w-full h-full object-cover"
          />
          {/* Scanner line */}
          <div
            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_hsl(var(--primary))]"
            style={{ top: `${scanPosition}%`, transition: "top 30ms linear" }}
          />
          {/* Corner markers */}
          <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-primary rounded-tl-lg" />
          <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-primary rounded-tr-lg" />
          <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-primary rounded-bl-lg" />
          <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-primary rounded-br-lg" />
        </div>

        {/* Text */}
        <div className="text-center space-y-2">
          <p className="text-lg font-bold text-primary-foreground">
            Analisando nutrientes com IA...
          </p>
          <p className="text-sm text-primary-foreground/70">
            Identificando alimentos e calculando valores
          </p>
        </div>

        {/* Pulsing dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScannerModal;
