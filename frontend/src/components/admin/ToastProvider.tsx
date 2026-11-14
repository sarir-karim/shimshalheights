"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";

type Kind = "success" | "error";
interface Toast { id: number; kind: Kind; message: string }
const ToastContext = createContext<{ success: (m: string) => void; error: (m: string) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback((kind: Kind, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-3), { id, kind, message }]);
    setTimeout(() => dismiss(id), kind === "error" ? 7000 : 4000);
  }, [dismiss]);
  const value = useMemo(() => ({ success: (m: string) => push("success", m), error: (m: string) => push("error", m) }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" role="region" aria-label="Notifications">
        {toasts.map((t) => (
          <div key={t.id} role={t.kind === "error" ? "alert" : "status"} className={`pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-4 shadow-lift ${t.kind === "error" ? "border-red-200" : "border-forest/20"}`}>
            {t.kind === "success" ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-forest" aria-hidden /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" aria-hidden />}
            <p className="flex-1 text-sm text-slate">{t.message}</p>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-slate-muted hover:text-slate"><X className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
