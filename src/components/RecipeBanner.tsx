const RecipeBanner = () => {
  return (
    <div className="mt-5 rounded-2xl bg-lilac px-5 py-4 flex items-center justify-between">
      <p className="text-sm font-semibold text-lilac-foreground max-w-[60%] leading-snug">
        Receitas dentro da sua meta de hoje
      </p>
      <button className="rounded-full bg-white/90 px-5 py-2 text-xs font-semibold text-foreground hover:bg-white transition-colors">
        Ver
      </button>
    </div>
  );
};

export default RecipeBanner;
