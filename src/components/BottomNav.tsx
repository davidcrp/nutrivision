import { useRef } from "react";
import { Home, Search, Heart, User, Camera, BarChart3 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleCameraClick = () => {
    // If already on camera page, trigger file input there
    if (location.pathname === "/camera") {
      // Dispatch custom event so CameraPage can handle it
      window.dispatchEvent(new CustomEvent("trigger-camera"));
    } else {
      navigate("/camera");
    }
  };

  const navItems = [
    { path: "/", icon: Home, label: "Início" },
    { path: "/search", icon: Search, label: "Pesquisa" },
    { path: "/analysis", icon: BarChart3, label: "Análise" },
    { path: "/favorites", icon: Heart, label: "Favoritos" },
    { path: "/profile", icon: User, label: "Perfil" },
  ];

  const leftItems = navItems.slice(0, 2);
  const rightItems = navItems.slice(2);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-popover border-t border-border/50 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] z-50">
      <div className="max-w-md mx-auto flex items-center justify-around py-2 px-4">
        {leftItems.map((item) => {
          const active = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 p-1.5 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
            >
              <Icon size={20} />
              <span className="text-[9px] font-medium">{item.label}</span>
            </button>
          );
        })}

        {/* Center camera button */}
        <button onClick={handleCameraClick} className="flex items-center justify-center -mt-5">
          <div className={`w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 ${location.pathname === "/camera" ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-popover" : ""}`}>
            <Camera size={24} className="text-primary-foreground" />
          </div>
        </button>

        {rightItems.map((item) => {
          const active = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 p-1.5 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
            >
              <Icon size={20} />
              <span className="text-[9px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
