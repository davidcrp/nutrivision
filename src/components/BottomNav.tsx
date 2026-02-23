import { Home, Search, Heart, User, Camera } from "lucide-react";

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border/50 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] z-50">
      <div className="max-w-md mx-auto flex items-center justify-around py-2 px-4">
        <button className="flex flex-col items-center gap-0.5 p-2 text-primary">
          <Home size={22} />
          <span className="text-[10px] font-medium">Início</span>
        </button>

        <button className="flex flex-col items-center gap-0.5 p-2 text-muted-foreground relative">
          <Search size={22} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" />
          <span className="text-[10px] font-medium">Pesquisa</span>
        </button>

        <button className="flex items-center justify-center -mt-5">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <Camera size={24} className="text-primary-foreground" />
          </div>
        </button>

        <button className="flex flex-col items-center gap-0.5 p-2 text-muted-foreground">
          <Heart size={22} />
          <span className="text-[10px] font-medium">Favoritos</span>
        </button>

        <button className="flex flex-col items-center gap-0.5 p-2 text-muted-foreground">
          <User size={22} />
          <span className="text-[10px] font-medium">Perfil</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
