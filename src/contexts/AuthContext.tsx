import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: number;
  email: string;
  role: "admin" | "viewer";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const LS_USER_KEY = "dashboard_user";
const LS_TOKEN_KEY = "dashboard_token";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedUser = window.localStorage.getItem(LS_USER_KEY);
    const storedToken = window.localStorage.getItem(LS_TOKEN_KEY);

    setUser(storedUser ? JSON.parse(storedUser) : null);
    setToken(storedToken ?? null);
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) return data?.error || "Login failed";

      setUser(data.user);
      setToken(data.token);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(LS_USER_KEY, JSON.stringify(data.user));
        window.localStorage.setItem(LS_TOKEN_KEY, data.token);
      }

      return null;
    } catch {
      return "Login failed";
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(LS_USER_KEY);
      window.localStorage.removeItem(LS_TOKEN_KEY);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin: user?.role === "admin" }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
