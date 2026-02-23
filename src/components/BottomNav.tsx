import { Home, Search, Heart, User, Camera } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { path: "/", icon: Home, label: "Início" },
  { path: "/search", icon: Search, label: "Pesquisa", badge: true },
  { path: "/camera", icon: Camera, label: "Camera", center: true },
  { path: "/favorites", icon: Heart, label: "Favoritos" },
  { path: "/profile", icon: User, label: "Perfil" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-popover border-t border-border/50 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] z-50">
      <div className="max-w-md mx-auto flex items-center justify-around py-2 px-4">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          const Icon = item.icon;

          if (item.center) {
            return (
              <button key={item.path} onClick={() => navigate(item.path)} className="flex items-center justify-center -mt-5">
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                  <Icon size={24} className="text-primary-foreground" />
                </div>
              </button>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 p-2 transition-colors relative ${active ? "text-primary" : "text-muted-foreground"}`}
            >
              <Icon size={22} />
              {item.badge && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" />}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
