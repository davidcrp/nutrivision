import { useAuth } from "@/contexts/AuthContext";

const GreetingHeader = () => {
  const { profile, isLoggedIn } = useAuth();
  const displayName = isLoggedIn && profile?.name ? profile.name : "Visitante";

  return (
    <div className="mt-5">
      <h1 className="text-2xl font-bold text-primary">Olá, {displayName},</h1>
      <p className="text-sm text-muted-foreground mt-0.5">
        {isLoggedIn ? "Aqui está o seu resumo diário" : "Faça login para salvar seus dados"}
      </p>
    </div>
  );
};

export default GreetingHeader;
