import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface UserData {
  name: string;
  email: string;
}

interface AuthContextType {
  user: UserData | null;
  isLoggedIn: boolean;
  login: (data: UserData) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(() => {
    const saved = localStorage.getItem("calorieapp_user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback((data: UserData) => {
    setUser(data);
    localStorage.setItem("calorieapp_user", JSON.stringify(data));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("calorieapp_user");
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
