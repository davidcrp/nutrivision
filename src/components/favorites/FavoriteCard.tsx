import { Plus, MoreVertical, Trash2, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FavoriteItem {
  id: string;
  name: string;
  emoji: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  weight_grams: number;
  meal_type: string;
}

interface FavoriteCardProps {
  item: FavoriteItem;
  addingId: string | null;
  onQuickLog: (item: FavoriteItem) => void;
  onRemove: (id: string) => void;
  mealTypeLabels: Record<string, string>;
}

const FavoriteCard = ({ item, addingId, onQuickLog, onRemove, mealTypeLabels }: FavoriteCardProps) => {
  return (
    <div className="relative flex items-center gap-3 rounded-2xl bg-card p-4 shadow-sm transition-shadow hover:shadow-md active:shadow-md">
      {/* Emoji */}
      <div className="w-12 h-12 rounded-xl bg-cream flex items-center justify-center text-2xl shrink-0">
        {item.emoji}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {item.calories} kcal · {mealTypeLabels[item.meal_type] ?? item.meal_type}
        </p>
        <p className="text-[10px] text-muted-foreground/70 mt-0.5">
          P: {item.protein}g • C: {item.carbs}g • G: {item.fat}g
        </p>
      </div>

      {/* Quick-log button */}
      <button
        onClick={() => onQuickLog(item)}
        disabled={addingId === item.id}
        className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0 hover:bg-primary/25 transition-colors disabled:opacity-50"
      >
        {addingId === item.id ? (
          <Loader2 size={18} className="text-primary animate-spin" />
        ) : (
          <Plus size={20} className="text-primary" />
        )}
      </button>

      {/* More menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors">
            <MoreVertical size={14} className="text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[160px]">
          <DropdownMenuItem
            onClick={() => onRemove(item.id)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 size={14} className="mr-2" />
            Remover dos Favoritos
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default FavoriteCard;
