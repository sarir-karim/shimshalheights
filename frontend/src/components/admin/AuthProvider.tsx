"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/adminApi";
import type { AdminUser } from "@/types/admin";

interface AuthState { user: AdminUser | null; loading: boolean; setUser: (u: AdminUser | null) => void; logout: () => Promise<void> }
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const toLogin = useCallback(() => {
    setUser(null);
    if (pathname !== "/admin/login") router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
  }, [pathname, router]);

  useEffect(() => {
    api<{ user: AdminUser }>("GET", "/auth/me")
      .then((r) => setUser(r.data.user))
      .catch(() => { /* not signed in: guard below decides */ })
      .finally(() => setLoading(false));
  }, []);

  // Any 401 from any admin call (expired session) sends the user back to sign in.
  useEffect(() => {
    window.addEventListener("admin:unauthorized", toLogin);
    return () => window.removeEventListener("admin:unauthorized", toLogin);
  }, [toLogin]);

  const logout = useCallback(async () => {
    await api("POST", "/auth/logout").catch(() => undefined);
    setUser(null);
    router.replace("/admin/login");
  }, [router]);

  return <AuthContext.Provider value={{ user, loading, setUser, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
