import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface FavoriteToggleProps {
  name: string;
  emoji?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  weightGrams: number;
  mealType: string;
  size?: number;
  className?: string;
}

const FavoriteToggle = ({
  name,
  emoji = "🍽️",
  calories,
  protein,
  carbs,
  fat,
  weightGrams,
  mealType,
  size = 18,
  className = "",
}: FavoriteToggleProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if already favorited
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const check = async () => {
      const { data } = await supabase
        .from("favorite_meals")
        .select("id")
        .eq("user_id", user.id)
        .eq("name", name)
        .limit(1);

      if (!cancelled && data && data.length > 0) {
        setIsFavorite(true);
      }
    };

    check();
    return () => { cancelled = true; };
  }, [user, name]);

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || loading) return;

    setLoading(true);
    try {
      if (isFavorite) {
        // Remove
        const { error } = await supabase
          .from("favorite_meals")
          .delete()
          .eq("user_id", user.id)
          .eq("name", name);

        if (error) throw error;
        setIsFavorite(false);
        toast({ title: "Removido dos favoritos" });
      } else {
        // Add
        const { error } = await supabase
          .from("favorite_meals")
          .insert({
            user_id: user.id,
            name,
            emoji,
            calories,
            protein,
            carbs,
            fat,
            weight_grams: weightGrams,
            meal_type: mealType,
          });

        if (error) throw error;
        setIsFavorite(true);
        toast({ title: "❤️ Adicionado aos Favoritos!" });
      }
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Não foi possível atualizar favorito.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`p-1.5 rounded-full transition-all hover:scale-110 active:scale-95 disabled:opacity-50 ${className}`}
      aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
    >
      <Heart
        size={size}
        className={`transition-colors ${
          isFavorite
            ? "text-destructive fill-destructive"
            : "text-muted-foreground hover:text-destructive"
        }`}
      />
    </button>
  );
};

export default FavoriteToggle;
