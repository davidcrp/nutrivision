import { useState } from "react";
import { Check } from "lucide-react";

import male1 from "@/assets/avatars/male-1.png";
import male2 from "@/assets/avatars/male-2.png";
import male3 from "@/assets/avatars/male-3.png";
import male4 from "@/assets/avatars/male-4.png";
import female1 from "@/assets/avatars/female-1.png";
import female2 from "@/assets/avatars/female-2.png";
import female3 from "@/assets/avatars/female-3.png";
import female4 from "@/assets/avatars/female-4.png";

export const AVATAR_MAP: Record<string, string> = {
  "male-1": male1,
  "male-2": male2,
  "male-3": male3,
  "male-4": male4,
  "female-1": female1,
  "female-2": female2,
  "female-3": female3,
  "female-4": female4,
};

const maleAvatars = ["male-1", "male-2", "male-3", "male-4"];
const femaleAvatars = ["female-1", "female-2", "female-3", "female-4"];

interface AvatarSelectorProps {
  selected: string | null;
  onSelect: (avatarKey: string) => void;
  saving?: boolean;
}

const AvatarSelector = ({ selected, onSelect, saving }: AvatarSelectorProps) => {
  const [tab, setTab] = useState<"male" | "female">("male");
  const avatars = tab === "male" ? maleAvatars : femaleAvatars;

  return (
    <div className="rounded-2xl bg-cream p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">Escolha seu avatar</h3>

      <div className="flex gap-2 mb-4">
        {(["male", "female"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-colors ${
              tab === t
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {t === "male" ? "Masculino" : "Feminino"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {avatars.map((key) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            disabled={saving}
            className={`relative rounded-full overflow-hidden aspect-square ring-2 transition-all ${
              selected === key
                ? "ring-primary scale-105 shadow-md"
                : "ring-transparent hover:ring-primary/30"
            }`}
          >
            <img
              src={AVATAR_MAP[key]}
              alt={key}
              className="w-full h-full object-cover"
            />
            {selected === key && (
              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                <Check size={20} className="text-primary-foreground drop-shadow" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AvatarSelector;
