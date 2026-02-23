import { User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AVATAR_MAP } from "@/components/AvatarSelector";

const GreetingHeader = () => {
  const { profile, isLoggedIn } = useAuth();
  const displayName = isLoggedIn && profile?.name ? profile.name : "Visitante";
  const avatarKey = profile?.avatar_url;

  return (
    <div className="mt-5 flex items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-cream flex items-center justify-center overflow-hidden flex-shrink-0">
        {avatarKey && AVATAR_MAP[avatarKey] ? (
          <img src={AVATAR_MAP[avatarKey]} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <User size={22} className="text-muted-foreground" />
        )}
      </div>
      <div>
        <h1 className="text-2xl font-bold text-primary">Olá, {displayName},</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {isLoggedIn ? "Aqui está o seu resumo diário" : "Faça login para salvar seus dados"}
        </p>
      </div>
    </div>
  );
};

export default GreetingHeader;
