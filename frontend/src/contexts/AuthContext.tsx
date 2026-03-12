import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import * as api from "../api/client";
import type { User } from "../types";

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isRD: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  logout: () => {},
  isRD: false,
  isAdmin: false,
});

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}

const hasToken = () => !!localStorage.getItem("token");

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [resolved, setResolved] = useState(() => !hasToken());

  useEffect(() => {
    if (resolved) return;
    api.fetchMe()
      .then(setUser)
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setResolved(true));
  }, [resolved]);

  const login = useCallback(async (username: string, password: string) => {
    const { access_token } = await api.login({ username, password });
    localStorage.setItem("token", access_token);
    const me = await api.fetchMe();
    setUser(me);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  if (!resolved) return null;

  return (
    <AuthContext.Provider value={{ user, login, logout, isRD: !!user, isAdmin: user?.is_admin ?? false }}>
      {children}
    </AuthContext.Provider>
  );
}
