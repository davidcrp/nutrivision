import { useState, useEffect } from "react";
import { User, Mail, Lock, Eye, EyeOff, Check, Crown, Palette, ChevronRight, LogOut, Camera, Loader2, Star, Shield, CreditCard } from "lucide-react";
import AvatarSelector, { AVATAR_MAP } from "@/components/AvatarSelector";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type ThemeKey = "default" | "ocean" | "sunset" | "forest";

const themes: Record<ThemeKey, { name: string; primary: string; accent: string; preview: [string, string, string] }> = {
  default: { name: "Padrão", primary: "145 45% 52%", accent: "15 75% 65%", preview: ["#5dba6b", "#e8845a", "#a98ed6"] },
  ocean: { name: "Oceano", primary: "200 65% 50%", accent: "30 85% 60%", preview: ["#2d9fce", "#e89040", "#6bb5d6"] },
  sunset: { name: "Pôr do Sol", primary: "20 80% 55%", accent: "340 70% 60%", preview: ["#d96a3a", "#c9508a", "#e8a050"] },
  forest: { name: "Floresta", primary: "160 50% 40%", accent: "35 70% 55%", preview: ["#339977", "#c99540", "#5dba90"] },
};

const ProfilePage = () => {
  const { user, profile, isLoggedIn, loading, signUp, signIn, signOut } = useAuth();
  const { subscriptionTier, openPaywall } = useSubscription();
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>("default");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [cpf, setCpf] = useState("");
  const [cpfSaving, setCpfSaving] = useState(false);
  const [avatarKey, setAvatarKey] = useState<string | null>(null);
  const [avatarSaving, setAvatarSaving] = useState(false);

  // Load avatar and CPF from profile
  useEffect(() => {
    if (profile && user) {
      supabase
        .from("profiles")
        .select("cpf, avatar_url")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.cpf) setCpf(data.cpf);
          if (data?.avatar_url) setAvatarKey(data.avatar_url);
        });
    }
  }, [profile, user]);

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const validateCpf = (raw: string): boolean => {
    const digits = raw.replace(/\D/g, "");
    if (digits.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(digits)) return false; // all same digits
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
    let rest = (sum * 10) % 11;
    if (rest === 10) rest = 0;
    if (rest !== parseInt(digits[9])) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
    rest = (sum * 10) % 11;
    if (rest === 10) rest = 0;
    return rest === parseInt(digits[10]);
  };

  const handleCpfSave = async () => {
    const cleanCpf = cpf.replace(/\D/g, "");
    if (!validateCpf(cleanCpf)) {
      toast({ title: "CPF inválido", description: "Digite um CPF válido com 11 dígitos.", variant: "destructive" });
      return;
    }
    setCpfSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ cpf: cleanCpf } as any)
      .eq("user_id", user?.id ?? "");
    setCpfSaving(false);
    if (error) {
      toast({ title: "Erro", description: "Não foi possível salvar o CPF.", variant: "destructive" });
    } else {
      toast({ title: "CPF salvo!", description: "Seu CPF foi atualizado com sucesso." });
    }
  };

  const handleAvatarSelect = async (key: string) => {
    setAvatarKey(key);
    setAvatarSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: key })
      .eq("user_id", user?.id ?? "");
    setAvatarSaving(false);
    if (error) {
      toast({ title: "Erro", description: "Não foi possível salvar o avatar.", variant: "destructive" });
    }
  };

  const handleUpgrade = async () => {
    setUpgradeLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { plan: "monthly" },
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
      setUpgradeLoading(false);
    }
  };

  const handleManageSubscription = () => {
    toast({
      title: "Gerenciar Assinatura",
      description: "Para alterar seus dados de pagamento ou cancelar, entre em contato com o suporte ou acesse o portal web.",
    });
  };

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
              <div className="w-20 h-20 rounded-full bg-cream flex items-center justify-center overflow-hidden">
                {avatarKey && AVATAR_MAP[avatarKey] ? (
                  <img src={AVATAR_MAP[avatarKey]} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={32} className="text-muted-foreground" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{profile?.name || "Usuário"}</h2>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                {subscriptionTier === "premium" ? (
                  <span className="inline-flex items-center gap-1 mt-1 rounded-full bg-amber-500/15 px-3 py-0.5 text-[10px] font-semibold text-amber-500">
                    <Crown size={10} /> PRO
                  </span>
                ) : (
                  <span className="inline-block mt-1 rounded-full bg-muted px-3 py-0.5 text-[10px] font-semibold text-muted-foreground">Plano Grátis</span>
                )}
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

            {/* Avatar Selector */}
            <div className="mb-6">
              <AvatarSelector selected={avatarKey} onSelect={handleAvatarSelect} saving={avatarSaving} />
            </div>

            {/* CPF Card */}
            <div className="mb-6 rounded-2xl bg-cream p-4">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard size={16} className="text-primary" />
                <h3 className="text-sm font-semibold text-foreground">CPF</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Necessário para emissão de cobranças e assinatura PRO.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(formatCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="flex-1 rounded-xl bg-muted py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  onClick={handleCpfSave}
                  disabled={cpfSaving}
                  className="rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {cpfSaving ? <Loader2 size={14} className="animate-spin" /> : "Salvar"}
                </button>
              </div>
            </div>

            {/* Plan Status Card */}
            <div className={`mb-6 rounded-2xl p-5 transition-all ${
              subscriptionTier === "premium"
                ? "bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-transparent ring-1 ring-amber-500/20"
                : "bg-cream"
            }`}>
              <div className="flex items-center gap-3 mb-3">
                {subscriptionTier === "premium" ? (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-md shadow-amber-500/20">
                    <Crown size={20} className="text-white" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Shield size={20} className="text-muted-foreground" />
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {subscriptionTier === "premium" ? "Plano PRO Ativo" : "Plano Básico (Gratuito)"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {subscriptionTier === "premium"
                      ? "Você tem acesso total a todos os recursos de IA."
                      : "Recursos limitados. Faça upgrade para desbloquear a IA."}
                  </p>
                </div>
              </div>

              {subscriptionTier === "premium" ? (
                <button
                  onClick={handleManageSubscription}
                  className="w-full rounded-xl py-2.5 text-xs font-semibold bg-muted text-foreground hover:bg-muted/80 transition-colors"
                >
                  Gerenciar Assinatura
                </button>
              ) : (
                <button
                  onClick={handleUpgrade}
                  disabled={upgradeLoading}
                  className="w-full rounded-xl py-2.5 text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {upgradeLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Redirecionando...
                    </>
                  ) : (
                    <>
                      <Star size={14} />
                      Fazer Upgrade para PRO
                    </>
                  )}
                </button>
              )}
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
