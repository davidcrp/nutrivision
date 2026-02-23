import { useState } from "react";
import { User, Mail, Lock, Eye, EyeOff, Check, Crown, Palette, ChevronRight, LogOut, Camera, Loader2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

type ThemeKey = "default" | "ocean" | "sunset" | "forest";

const themes: Record<ThemeKey, { name: string; primary: string; accent: string; preview: [string, string, string] }> = {
  default: { name: "Padrão", primary: "145 45% 52%", accent: "15 75% 65%", preview: ["#5dba6b", "#e8845a", "#a98ed6"] },
  ocean: { name: "Oceano", primary: "200 65% 50%", accent: "30 85% 60%", preview: ["#2d9fce", "#e89040", "#6bb5d6"] },
  sunset: { name: "Pôr do Sol", primary: "20 80% 55%", accent: "340 70% 60%", preview: ["#d96a3a", "#c9508a", "#e8a050"] },
  forest: { name: "Floresta", primary: "160 50% 40%", accent: "35 70% 55%", preview: ["#339977", "#c99540", "#5dba90"] },
};

const plans = [
  {
    id: "free",
    name: "Grátis",
    price: "R$ 0",
    period: "/mês",
    features: ["Contagem manual de calorias", "Até 3 refeições/dia", "Histórico de 7 dias"],
    highlighted: false,
    cta: "Plano Atual",
  },
  {
    id: "pro",
    name: "Pro",
    price: "R$ 19,90",
    period: "/mês",
    features: ["Escaneamento por IA ilimitado", "Refeições ilimitadas", "Histórico completo", "Receitas personalizadas"],
    highlighted: true,
    cta: "Assinar Pro",
  },
  {
    id: "premium",
    name: "Premium",
    price: "R$ 39,90",
    period: "/mês",
    features: ["Tudo do Pro", "Plano alimentar com IA", "Suporte nutricional", "Sem anúncios", "Relatórios avançados"],
    highlighted: false,
    cta: "Assinar Premium",
  },
];

const ProfilePage = () => {
  const { user, profile, isLoggedIn, loading, signUp, signIn, signOut } = useAuth();
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>("default");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (isSignUp) {
      const { error } = await signUp(email, password, name);
      if (error) {
        toast({ title: "Erro no cadastro", description: error, variant: "destructive" });
      } else {
        toast({
          title: "Cadastro realizado!",
          description: "Verifique seu email para confirmar a conta antes de fazer login.",
        });
        setIsSignUp(false);
        setName("");
        setPassword("");
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Erro no login", description: error, variant: "destructive" });
      }
    }

    setSubmitting(false);
  };

  const handleLogout = async () => {
    await signOut();
    applyTheme("default");
    toast({ title: "Até logo!", description: "Você saiu da sua conta." });
  };

  const applyTheme = (key: ThemeKey) => {
    setSelectedTheme(key);
    const t = themes[key];
    document.documentElement.style.setProperty("--primary", t.primary);
    document.documentElement.style.setProperty("--accent", t.accent);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-5 pt-6 pb-24">
        <h1 className="text-xl font-bold text-foreground mb-5">Perfil</h1>

        {!isLoggedIn ? (
          <div>
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                <User size={40} className="text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                {isSignUp ? "Crie sua conta" : "Faça login"}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-3">
              {isSignUp && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    required
                    className="w-full rounded-2xl bg-muted py-3.5 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  className="w-full rounded-2xl bg-muted py-3.5 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha (mínimo 6 caracteres)"
                  required
                  minLength={6}
                  className="w-full rounded-2xl bg-muted py-3.5 pl-11 pr-11 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2">
                  {showPassword ? <EyeOff size={16} className="text-muted-foreground" /> : <Eye size={16} className="text-muted-foreground" />}
                </button>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-primary py-3.5 text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {isSignUp ? "Criar conta" : "Entrar"}
              </button>
            </form>

            <p className="text-center text-xs text-muted-foreground mt-4">
              {isSignUp ? "Já tem conta?" : "Não tem conta?"}{" "}
              <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary font-semibold">
                {isSignUp ? "Faça login" : "Cadastre-se"}
              </button>
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-cream flex items-center justify-center overflow-hidden">
                  <User size={32} className="text-muted-foreground" />
                </div>
                <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-md">
                  <Camera size={14} className="text-primary-foreground" />
                </button>
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{profile?.name || "Usuário"}</h2>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <span className="inline-block mt-1 rounded-full bg-primary/10 px-3 py-0.5 text-[10px] font-semibold text-primary">Plano Grátis</span>
              </div>
            </div>

            {/* Theme Selector */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Palette size={16} className="text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Personalizar cores</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(themes) as ThemeKey[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => applyTheme(key)}
                    className={`rounded-2xl p-3 text-left transition-all ${
                      selectedTheme === key ? "ring-2 ring-primary bg-cream" : "bg-muted hover:bg-cream"
                    }`}
                  >
                    <div className="flex gap-1.5 mb-2">
                      {themes[key].preview.map((color, i) => (
                        <div key={i} className="w-5 h-5 rounded-full" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">{themes[key].name}</span>
                      {selectedTheme === key && <Check size={14} className="text-primary" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Plans */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Crown size={16} className="text-accent" />
                <h3 className="text-sm font-semibold text-foreground">Planos</h3>
              </div>
              <div className="space-y-3">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`rounded-2xl p-4 transition-all ${
                      plan.highlighted ? "bg-primary/10 ring-2 ring-primary" : "bg-cream"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-bold text-foreground">{plan.name}</h4>
                        <p className="text-lg font-bold text-foreground">
                          {plan.price}
                          <span className="text-xs font-normal text-muted-foreground">{plan.period}</span>
                        </p>
                      </div>
                      {plan.highlighted && (
                        <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold text-primary-foreground">Popular</span>
                      )}
                    </div>
                    <ul className="space-y-1 mb-3">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Check size={12} className="text-primary flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      className={`w-full rounded-xl py-2.5 text-xs font-semibold transition-opacity ${
                        plan.highlighted
                          ? "bg-primary text-primary-foreground hover:opacity-90"
                          : "bg-muted text-foreground hover:bg-cream-dark"
                      }`}
                    >
                      {plan.cta}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {["Metas nutricionais", "Notificações", "Privacidade", "Ajuda"].map((item) => (
                <button key={item} className="flex items-center justify-between w-full rounded-2xl bg-cream p-4 hover:bg-cream-dark transition-colors">
                  <span className="text-sm font-medium text-foreground">{item}</span>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </button>
              ))}
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full mt-5 rounded-2xl bg-destructive/10 py-3.5 text-destructive font-semibold text-sm hover:bg-destructive/20 transition-colors"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default ProfilePage;
