"use client";

import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/components/admin/AuthProvider";

/** Hides admin-only screens from staff accounts (the API enforces the same rule; this is the friendly version). */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== "admin") {
    return (
      <div role="alert" className="mx-auto max-w-lg rounded-xl2 border border-stone-line bg-white p-10 text-center shadow-soft">
        <ShieldAlert className="mx-auto h-10 w-10 text-slate-muted" aria-hidden />
        <h1 className="mt-3 text-3xl">Admin access only</h1>
        <p className="mt-2 text-slate-soft">Your staff account can manage bookings and messages. Ask an administrator if you need access to this section.</p>
      </div>
    );
  }
  return <>{children}</>;
}
