import { useState } from "react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Check, Crown, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const BENEFITS = [
  "Contagem de calorias por foto (Ilimitado)",
  "Plano Alimentar Inteligente gerado por IA",
  "Relatórios avançados e insights semanais",
  "Adicionar refeições personalizadas",
  "Exportar plano em PDF",
  "Suporte prioritário",
];

const PaywallModal = () => {
  const { isPaywallOpen, closePaywall, upgradeToPremium } = useSubscription();
  const [isAnnual, setIsAnnual] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  if (!isPaywallOpen) return null;
  const plan = isAnnual ? "annual" : "monthly";
  const price = isAnnual ? "199,90" : "29,90";
  const period = isAnnual ? "/ano" : "/mês";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closePaywall} />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-auto bg-gradient-to-br from-[hsl(160,30%,12%)] via-[hsl(220,25%,14%)] to-[hsl(270,25%,16%)] rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        {/* Close */}
        <button
          onClick={closePaywall}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors z-10"
        >
          <X size={18} />
        </button>

        <div className="p-6 pt-8 pb-10">
          {/* Crown */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Crown size={32} className="text-white" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-white text-center mb-1">
            Desbloqueie seu Potencial
          </h2>
          <p className="text-sm text-white/50 text-center mb-6">
            com o NutriScan <span className="text-amber-400 font-semibold">PRO</span> 👑
          </p>

          {/* Benefits */}
          <div className="space-y-3 mb-6">
            {BENEFITS.map((b) => (
              <div key={b} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={12} className="text-primary" />
                </div>
                <span className="text-sm text-white/80">{b}</span>
              </div>
            ))}
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                !isAnnual
                  ? "bg-white/15 text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all relative ${
                isAnnual
                  ? "bg-white/15 text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              Anual
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                -40%
              </span>
            </button>
          </div>

          {/* Price */}
          <div className="text-center mb-6">
            <span className="text-4xl font-bold text-white">R$ {price}</span>
            <span className="text-white/40 text-sm">{period}</span>
            {isAnnual && (
              <p className="text-xs text-primary mt-1">Economize R$ 158,90 por ano</p>
            )}
          </div>

          {/* CTA */}
          <Button
            onClick={async () => {
              setIsLoading(true);
              try {
                const { data, error } = await supabase.functions.invoke('create-checkout', {
                  body: { plan },
                });
                if (error || !data?.paymentUrl) {
                  throw new Error(error?.message || "Erro ao gerar pagamento");
                }
                window.location.href = data.paymentUrl;
              } catch (err: any) {
                toast({
                  title: "Erro",
                  description: err.message || "Não foi possível iniciar o pagamento.",
                  variant: "destructive",
                });
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
            className="w-full h-14 rounded-2xl text-lg font-bold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black shadow-lg shadow-amber-500/30 animate-pulse hover:animate-none disabled:opacity-70 disabled:animate-none"
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Gerando pagamento...
              </>
            ) : (
              <>
                <Crown size={20} />
                Assinar Agora
              </>
            )}
          </Button>

          <p className="text-[10px] text-white/30 text-center mt-3">
            Cancele a qualquer momento. Sem compromisso.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaywallModal;
