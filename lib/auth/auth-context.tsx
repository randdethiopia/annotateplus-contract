"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/backend/client";
import type { LoginResponseData, StaffUserDto } from "@/types/backend";

const STORAGE_KEY = "staff_auth";

interface StoredAuth {
  token: string;
  user: StaffUserDto;
}

interface AuthContextValue {
  user: StaffUserDto | null;
  token: string | null;
  status: "loading" | "authed" | "anon";
  login: (email: string, password: string) => Promise<StaffUserDto>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStorage(): StoredAuth | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAuth) : null;
  } catch {
    return null;
  }
}

function writeStorage(value: StoredAuth | null) {
  if (typeof window === "undefined") return;
  if (value) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  else sessionStorage.removeItem(STORAGE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StaffUserDto | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "authed" | "anon">(() =>
    readStorage() ? "loading" : "anon"
  );

  useEffect(() => {
    const stored = readStorage();
    if (!stored) return;
    api<{ user: StaffUserDto }>("/auth/me", { token: stored.token })
      .then(({ user: freshUser }) => {
        setToken(stored.token);
        setUser(freshUser);
        writeStorage({ token: stored.token, user: freshUser });
        setStatus("authed");
      })
      .catch(() => {
        writeStorage(null);
        setStatus("anon");
      });
  }, []);

  async function login(email: string, password: string) {
    const data = await api<LoginResponseData>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setToken(data.token);
    setUser(data.user);
    writeStorage({ token: data.token, user: data.user });
    setStatus("authed");
    return data.user;
  }

  function logout() {
    setToken(null);
    setUser(null);
    writeStorage(null);
    setStatus("anon");
  }

  return (
    <AuthContext.Provider value={{ user, token, status, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
