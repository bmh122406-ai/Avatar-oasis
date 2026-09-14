"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import type { PublicUser } from "@/lib/user";

interface AuthContextValue {
  user: PublicUser | null;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  initialUser,
  children,
}: {
  initialUser: PublicUser | null;
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<PublicUser | null>(initialUser);
  const router = useRouter();

  const refresh = useCallback(async () => {
    const res = await fetch("/api/auth/me");
    const data = await res.json();
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
