import healthyFood from "@/assets/healthy-food.png";

const CircularProgress = () => {
  const progress = 60; // 1200/2000
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={radius} fill="none" stroke="hsl(var(--cream-dark))" strokeWidth="8" />
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 50 50)"
        className="transition-all duration-700"
      />
      <text x="50" y="48" textAnchor="middle" className="fill-foreground text-xs font-bold">60%</text>
      <text x="50" y="60" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 7 }}>completo</text>
    </svg>
  );
};

const DailyProgressCard = () => {
  return (
    <div className="mt-5 rounded-2xl bg-cream p-5 flex items-center justify-between overflow-hidden">
      <div className="flex-1">
        <h2 className="text-base font-semibold text-foreground">Progresso Diário</h2>
        <p className="text-2xl font-bold text-foreground mt-1">
          1.200 <span className="text-sm font-normal text-muted-foreground">/ 2.000 kcal</span>
        </p>
        <button className="mt-3 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90 transition-opacity">
          Ver Macros
        </button>
      </div>
      <div className="flex-shrink-0 relative">
        <CircularProgress />
        <img
          src={healthyFood}
          alt="Comida saudável"
          className="absolute -bottom-2 -right-2 w-16 h-16 object-contain"
        />
      </div>
    </div>
  );
};

export default DailyProgressCard;
