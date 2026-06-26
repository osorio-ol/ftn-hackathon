import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type User = {
  email: string;
  name: string;
  role: "admin" | "company" | "evaluador" | "auditor";
  company_id?: number;
  company_name?: string;
};

export type RegisterPayload = {
  company_name: string;
  nit: string;
  sector: string;
  size: "pequena" | "mediana" | "grande";
  contact_name: string;
  email: string;
  password: string;
};

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
};

const Ctx = createContext<AuthCtx | null>(null);
const KEY = "cavaltec.auth.user";
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function persistUser(u: User) {
  window.localStorage.setItem(KEY, JSON.stringify(u));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(KEY) : null;
      if (raw) setUserState(JSON.parse(raw));
    } catch {}
    setLoading(false);
  }, []);

  const setUser = (u: User) => {
    persistUser(u);
    setUserState(u);
  };

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail ?? "Credenciales inválidas");
    }
    const u: User = await res.json();
    setUser(u);
  };

  const register = async (payload: RegisterPayload) => {
    const res = await fetch(`${API_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail ?? "No se pudo completar el registro");
    }
    const u: User = await res.json();
    setUser(u);
  };

  const logout = () => {
    window.localStorage.removeItem(KEY);
    setUserState(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
