import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@/types";
import * as authApi from "@/api/auth";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    companyName: string;
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "siteops_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .fetchMe()
      .then(setUser)
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const { token, user } = await authApi.login(email, password);
    localStorage.setItem(TOKEN_KEY, token);
    setUser(user);
  }

  async function register(payload: {
    companyName: string;
    name: string;
    email: string;
    password: string;
  }) {
    const { token, user } = await authApi.register(payload);
    localStorage.setItem(TOKEN_KEY, token);
    setUser(user);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
