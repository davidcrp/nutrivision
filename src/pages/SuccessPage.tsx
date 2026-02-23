import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const SuccessPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-sm space-y-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
          <CheckCircle size={40} className="text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Pagamento recebido!</h1>
          <p className="text-muted-foreground text-sm">
            Os recursos premium serão liberados em alguns instantes.
          </p>
        </div>

        <Button
          onClick={() => navigate("/")}
          className="w-full h-12 rounded-xl text-base font-semibold"
        >
          Voltar ao Diário
        </Button>
      </div>
    </div>
  );
};

export default SuccessPage;
