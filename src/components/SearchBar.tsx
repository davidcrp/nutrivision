import { Search } from "lucide-react";

const SearchBar = () => {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
      <input
        type="text"
        placeholder="Buscar alimentos..."
        className="w-full rounded-full bg-muted py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
      />
    </div>
  );
};

export default SearchBar;
