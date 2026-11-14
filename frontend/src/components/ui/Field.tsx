import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}

export function Field({ id, label, error, hint, className, children }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-semibold text-forest-dark">{label}</label>
      <div className="mt-1.5">{children}</div>
      {hint && !error && <p className="mt-1 text-sm text-slate-muted">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className={cn("mt-1 text-sm text-red-700")}>{error}</p>}
    </div>
  );
}
