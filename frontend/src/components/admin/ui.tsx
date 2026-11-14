"use client";

import { AlertTriangle, ChevronLeft, ChevronRight, Inbox, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { ApiMeta, BookingStatus, PaymentStatus } from "@/types/admin";

const badge = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize";
const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900", confirmed: "bg-forest-mist text-forest-dark", completed: "bg-sky-100 text-sky-900",
  rejected: "bg-red-100 text-red-900", cancelled: "bg-stone-deep text-slate-soft",
  unpaid: "bg-stone-deep text-slate-soft", paid: "bg-forest-mist text-forest-dark", refunded: "bg-violet-100 text-violet-900",
  new: "bg-amber-100 text-amber-900", replied: "bg-forest-mist text-forest-dark", archived: "bg-stone-deep text-slate-soft",
  active: "bg-forest-mist text-forest-dark", inactive: "bg-stone-deep text-slate-soft", published: "bg-forest-mist text-forest-dark", draft: "bg-stone-deep text-slate-soft",
};
export function StatusBadge({ status }: { status: BookingStatus | PaymentStatus | string }) {
  return <span className={cn(badge, statusStyles[status] ?? "bg-stone-deep text-slate-soft")}>{status}</span>;
}

export function PageHeading({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl sm:text-4xl">{title}</h1>
        {description && <p className="mt-1 text-slate-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

export const Card = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn("rounded-xl2 border border-stone-line bg-white p-5 shadow-soft", className)}>{children}</div>
);

export function Loading({ label = "Loading…" }: { label?: string }) {
  return <p role="status" className="flex items-center gap-2 py-10 text-slate-muted"><Loader2 className="h-5 w-5 animate-spin" aria-hidden />{label}</p>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-4 rounded-xl2 border border-red-200 bg-red-50 p-5 text-red-900">
      <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
      <p className="flex-1">{message}</p>
      {onRetry && <Button variant="secondary" onClick={onRetry} className="!px-4 !py-2">Try again</Button>}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl2 border border-dashed border-stone-line bg-white p-10 text-center">
      <Inbox className="mx-auto h-9 w-9 text-slate-muted" aria-hidden />
      <p className="mt-3 font-display text-xl text-forest-dark">{title}</p>
      {description && <p className="mt-1 text-slate-soft">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Pagination({ meta, onPage }: { meta?: ApiMeta; onPage: (p: number) => void }) {
  if (!meta || meta.totalPages <= 1) return meta ? <p className="mt-4 text-sm text-slate-muted">{meta.total} result{meta.total === 1 ? "" : "s"}</p> : null;
  return (
    <nav className="mt-4 flex items-center justify-between gap-3 text-sm" aria-label="Pagination">
      <p className="text-slate-muted">{meta.total} results, page {meta.page} of {meta.totalPages}</p>
      <div className="flex gap-2">
        <Button variant="secondary" className="!px-3 !py-2" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Button>
        <Button variant="secondary" className="!px-3 !py-2" disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Button>
      </div>
    </nav>
  );
}

export function SearchBox({ value, onChange, placeholder, label = "Search" }: { value: string; onChange: (v: string) => void; placeholder?: string; label?: string }) {
  return (
    <div className="relative">
      <label htmlFor="admin-search" className="sr-only">{label}</label>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-muted" aria-hidden />
      <input id="admin-search" type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input-field !py-2.5 pl-10" />
    </div>
  );
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)}
      className={cn("relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50", checked ? "bg-forest" : "bg-stone-line")}>
      <span className={cn("inline-block h-5 w-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-5" : "translate-x-0.5")} />
    </button>
  );
}

/** Horizontally scrollable table wrapper so wide tables never break the mobile layout. */
export const TableWrap = ({ children }: { children: React.ReactNode }) => (
  <div className="overflow-x-auto rounded-xl2 border border-stone-line bg-white shadow-soft"><table className="w-full min-w-[640px] text-left text-[0.95rem]">{children}</table></div>
);
export const Th = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <th scope="col" className={cn("border-b border-stone-line bg-stone-deep/60 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-muted", className)}>{children}</th>
);
export const Td = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <td className={cn("border-b border-stone-line/70 px-4 py-3 align-middle", className)}>{children}</td>
);
