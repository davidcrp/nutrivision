import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Mail } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const faqItems = [
  {
    q: "Como a IA conta as calorias?",
    a: "Nossa IA analisa a foto da sua refeição usando modelos de visão computacional para identificar os alimentos, estimar as porções e calcular as calorias e macronutrientes com base em tabelas nutricionais atualizadas.",
  },
  {
    q: "Como cancelar minha assinatura PRO?",
    a: "Você pode cancelar sua assinatura a qualquer momento na seção 'Gerenciar Assinatura' da página de Perfil. Após o cancelamento, você manterá o acesso até o fim do período já pago.",
  },
  {
    q: "A IA errou um alimento, o que fazer?",
    a: "Você pode editar ou remover qualquer item registrado diretamente no diário. Isso ajuda a IA a melhorar com o tempo. Se o erro persistir, entre em contato com nosso suporte.",
  },
];

const HelpModal = ({ open, onOpenChange }: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Central de Ajuda</DialogTitle>
        </DialogHeader>
        <Accordion type="single" collapsible className="mt-2">
          {faqItems.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border-b border-border/50">
              <AccordionTrigger className="text-sm font-medium text-foreground py-3 hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-3">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-4 pt-3 border-t border-border/50 space-y-3">
          <a
            href="mailto:suporte@seuapp.com"
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Mail size={16} />
            Falar com o Suporte
          </a>
          <p className="text-center text-[11px] text-muted-foreground">Versão 1.0.3</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HelpModal;
