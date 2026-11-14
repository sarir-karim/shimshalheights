"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAuth } from "@/components/admin/AuthProvider";
import { Loading } from "@/components/admin/ui";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading && !user) router.replace("/admin/login"); }, [loading, user, router]);
  if (loading || !user) return <div className="container-page pt-24"><Loading label="Checking your session…" /></div>;
  return <AdminShell>{children}</AdminShell>;
}
