import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  clearStoredToken,
  getStoredToken,
  setUnauthorizedHandler,
  storeToken,
} from "@/lib/session";

export type User = {
  id?: number;
  email: string;
  name: string;
  role: "admin" | "company" | "evaluador" | "auditor";
  company_id?: number;
  company_name?: string;
  company_email?: string;
  company_nit?: string;
  company_sector?: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
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
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  refreshSession: () => Promise<void>;
  completeOAuthLogin: (accessToken: string, expiresIn: number) => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);
const USER_KEY = "cavaltec.auth.user";
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

function persistUser(u: User) {
  window.localStorage.setItem(USER_KEY, JSON.stringify(u));
}

async function fetchAuth(path: string, body: unknown): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(typeof data.detail === "string" ? data.detail : "Error de autenticación");
  }
  return res.json();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = (data: AuthResponse) => {
    storeToken(data.access_token, data.expires_in);
    persistUser(data.user);
    setUserState(data.user);
  };

  const logout = () => {
    clearStoredToken();
    window.localStorage.removeItem(USER_KEY);
    setUserState(null);
  };

  const refreshSession = async () => {
    const token = getStoredToken();
    if (!token) {
      logout();
      return;
    }
    const res = await fetch(`${API_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      logout();
      return;
    }
    const u: User = await res.json();
    persistUser(u);
    setUserState(u);
  };

  const completeOAuthLogin = async (accessToken: string, expiresIn: number) => {
    storeToken(accessToken, expiresIn);
    const res = await fetch(`${API_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      clearStoredToken();
      const data = await res.json().catch(() => ({}));
      throw new Error(typeof data.detail === "string" ? data.detail : "No se pudo validar la sesión");
    }
    const u: User = await res.json();
    persistUser(u);
    setUserState(u);
  };

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearStoredToken();
      window.localStorage.removeItem(USER_KEY);
      setUserState(null);
    });
    return () => setUnauthorizedHandler(() => {});
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const raw = window.localStorage.getItem(USER_KEY);
        const token = getStoredToken();
        if (raw && token) {
          setUserState(JSON.parse(raw));
          await refreshSession().catch(() => logout());
        } else {
          logout();
        }
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, []);

  const setUser = (u: User) => {
    persistUser(u);
    setUserState(u);
  };

  const login = async (email: string, password: string) => {
    const data = await fetchAuth("/api/v1/auth/login", { email, password });
    applySession(data);
  };

  const register = async (payload: RegisterPayload) => {
    const data = await fetchAuth("/api/v1/auth/register", payload);
    applySession(data);
  };

  const isAuthenticated = !!user && !!getStoredToken();

  return (
    <Ctx.Provider
      value={{ user, loading, isAuthenticated, login, register, logout, setUser, refreshSession, completeOAuthLogin }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
