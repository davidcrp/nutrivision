import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { FileText, Shield, Download, Trash2, ExternalLink } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PrivacyModal = ({ open, onOpenChange }: Props) => {
  const { toast } = useToast();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const handleExport = () => {
    toast({ title: "📦 Exportação iniciada", description: "Seus dados serão enviados para o seu email em breve." });
  };

  const handleDelete = () => {
    toast({ title: "Conta excluída", description: "Sua conta foi marcada para exclusão.", variant: "destructive" });
    setShowDeleteAlert(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="rounded-2xl max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Privacidade e Dados</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="flex items-center gap-3 rounded-xl bg-muted p-3.5 hover:bg-muted/80 transition-colors"
            >
              <FileText size={18} className="text-primary" />
              <span className="flex-1 text-sm font-medium text-foreground">Termos de Uso</span>
              <ExternalLink size={14} className="text-muted-foreground" />
            </a>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="flex items-center gap-3 rounded-xl bg-muted p-3.5 hover:bg-muted/80 transition-colors"
            >
              <Shield size={18} className="text-primary" />
              <span className="flex-1 text-sm font-medium text-foreground">Política de Privacidade</span>
              <ExternalLink size={14} className="text-muted-foreground" />
            </a>
            <button
              onClick={handleExport}
              className="flex items-center gap-3 rounded-xl bg-muted p-3.5 w-full hover:bg-muted/80 transition-colors"
            >
              <Download size={18} className="text-primary" />
              <span className="flex-1 text-sm font-medium text-foreground text-left">Exportar meus dados</span>
            </button>
          </div>

          <Separator className="my-3 bg-destructive/30" />

          <div>
            <p className="text-xs font-semibold text-destructive mb-2">Zona de Perigo</p>
            <button
              onClick={() => setShowDeleteAlert(true)}
              className="flex items-center gap-2 w-full rounded-xl border border-destructive/30 p-3.5 text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 size={16} />
              <span className="text-sm font-semibold">Excluir minha conta</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent className="rounded-2xl max-w-sm mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. Todos os seus dados, refeições e configurações serão permanentemente excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sim, excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PrivacyModal;
