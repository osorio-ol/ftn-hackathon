import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type User = { email: string; name: string; role: "admin" | "evaluador" | "auditor" };

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);
const KEY = "cavaltec.auth.user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(KEY) : null;
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    await new Promise((r) => setTimeout(r, 600));
    if (!email || password.length < 4) throw new Error("Credenciales inválidas");
    const u: User = {
      email,
      name: email.split("@")[0],
      role: email.startsWith("admin") ? "admin" : email.startsWith("auditor") ? "auditor" : "evaluador",
    };
    window.localStorage.setItem(KEY, JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    window.localStorage.removeItem(KEY);
    setUser(null);
  };

  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}