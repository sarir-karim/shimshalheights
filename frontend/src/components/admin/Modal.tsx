"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps { open: boolean; title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }

/** Accessible dialog: Esc closes, focus moves in and is restored, Tab stays inside, page scroll locked. */
export function Modal({ open, title, onClose, children, wide }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const last = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    last.current = document.activeElement as HTMLElement;
    document.body.style.overflow = "hidden";
    const focusables = () => ref.current?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? [];
    (focusables()[0] ?? ref.current)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
      if (e.key === "Tab") {
        const f = Array.from(focusables());
        if (f.length === 0) return;
        const first = f[0]; const lastEl = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
        else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; last.current?.focus(); };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate/60 p-0 sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className={cn("max-h-[92dvh] w-full overflow-y-auto rounded-t-xl2 bg-white p-6 shadow-lift sm:rounded-xl2", wide ? "sm:max-w-2xl" : "sm:max-w-md")}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-2xl">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-slate-muted hover:bg-stone-deep"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
