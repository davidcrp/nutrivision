import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Bell, Droplets, BarChart3, Megaphone } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const notifOptions = [
  { id: "meals", label: "Lembrete de Refeições", desc: "Ative para lembrar de registrar", icon: Bell },
  { id: "water", label: "Lembrete de Água", desc: "Beber água a cada 2h", icon: Droplets },
  { id: "weekly", label: "Resumo Semanal", desc: "Receber relatório no domingo", icon: BarChart3 },
  { id: "promo", label: "Novidades e Promoções", desc: "Ofertas e novos recursos", icon: Megaphone },
];

const NotificationsModal = ({ open, onOpenChange }: Props) => {
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    meals: true,
    water: false,
    weekly: true,
    promo: false,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Preferências de Alerta</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 mt-2">
          {notifOptions.map((opt) => (
            <div key={opt.id} className="flex items-center gap-3 rounded-xl bg-muted p-3.5">
              <opt.icon size={18} className="text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{opt.label}</p>
                <p className="text-[11px] text-muted-foreground">{opt.desc}</p>
              </div>
              <Switch
                checked={toggles[opt.id]}
                onCheckedChange={(checked) => setToggles((t) => ({ ...t, [opt.id]: checked }))}
              />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationsModal;
