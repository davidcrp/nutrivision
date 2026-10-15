# NutriVision — análise de refeições por foto com IA

App web de nutrição: o usuário fotografa a refeição e recebe a estimativa de
calorias e macronutrientes, além de um plano alimentar gerado por IA.

**App no ar:** https://nutri-vision-seven.vercel.app

## Funcionalidades

- Câmera e upload de foto da refeição, com análise nutricional por IA
- Plano alimentar personalizado a partir do perfil do usuário
- Onboarding, perfil, favoritos e busca de alimentos
- Login, recuperação de senha e assinatura paga via Asaas

## Stack

- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui (Radix)
- Supabase: Postgres, autenticação e Edge Functions
- Asaas (pagamentos)
- Deploy na Vercel

## Estrutura

| Caminho | O que é |
|---|---|
| `src/pages/` | Telas: câmera, análise, busca, favoritos, perfil, onboarding |
| `supabase/functions/analyze-meal` | Análise da foto da refeição |
| `supabase/functions/generate-meal-plan` | Geração do plano alimentar |
| `supabase/functions/create-checkout`, `asaas-webhook` | Pagamento |
| `supabase/migrations` | Esquema do banco |

## Rodar localmente

```bash
npm install
npm run dev
```

As variáveis `VITE_SUPABASE_*` ficam no `.env` (chave pública do Supabase).
