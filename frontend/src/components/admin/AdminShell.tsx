"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, BedDouble, CalendarCheck, ExternalLink, Images, LayoutDashboard, LogOut, Mail, Menu, MessageSquareQuote, Settings, UtensilsCrossed, X, type LucideIcon } from "lucide-react";
import { useAuth } from "@/components/admin/AuthProvider";
import { api } from "@/lib/adminApi";
import { fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { NotificationRecord } from "@/types/admin";

interface NavItem { href: string; label: string; icon: LucideIcon; adminOnly?: boolean }
export const adminNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/admin/rooms", label: "Rooms", icon: BedDouble, adminOnly: true },
  { href: "/admin/restaurant", label: "Restaurant", icon: UtensilsCrossed, adminOnly: true },
  { href: "/admin/gallery", label: "Gallery", icon: Images, adminOnly: true },
  { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote, adminOnly: true },
  { href: "/admin/messages", label: "Messages", icon: Mail },
  { href: "/admin/homepage", label: "Homepage", icon: LayoutDashboard, adminOnly: true },
  { href: "/admin/settings", label: "Settings", icon: Settings, adminOnly: true },
];

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRecord[]>([]);
  const [unread, setUnread] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const r = await api<NotificationRecord[]>("GET", "/admin/notifications");
      setItems(r.data); setUnread(r.meta?.unread ?? 0);
    } catch { /* bell is non-critical */ }
  }, []);

  useEffect(() => {
    const first = setTimeout(load, 0); // initial load, scheduled rather than run inside the effect body
    const t = setInterval(load, 60_000); // light polling keeps the badge fresh
    return () => { clearTimeout(first); clearInterval(t); };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown); document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const markAll = async () => { await api("PATCH", "/admin/notifications/read-all").catch(() => undefined); void load(); };

  return (
    <div ref={box} className="relative">
      <button type="button" onClick={() => { setOpen((o) => !o); if (!open) void load(); }} aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} aria-expanded={open} className="relative rounded-full p-2.5 hover:bg-stone-deep">
        <Bell className="h-5 w-5" />
        {unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-700 px-1 text-[0.7rem] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl2 border border-stone-line bg-white shadow-lift">
          <div className="flex items-center justify-between border-b border-stone-line px-4 py-3">
            <p className="font-display text-lg text-forest-dark">Notifications</p>
            {unread > 0 && <button type="button" onClick={markAll} className="text-sm font-semibold text-forest hover:underline">Mark all read</button>}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {items.length === 0 && <li className="p-6 text-center text-sm text-slate-muted">Nothing yet.</li>}
            {items.map((n) => (
              <li key={n.id} className={cn("border-b border-stone-line/60 px-4 py-3 last:border-0", !n.isRead && "bg-sand-light/30")}>
                <Link href={n.type === "booking" ? "/admin/bookings" : "/admin/messages"} onClick={() => setOpen(false)} className="block">
                  <p className="text-sm font-semibold text-forest-dark">{n.title}</p>
                  <p className="text-sm text-slate-soft">{n.message}</p>
                  <p className="mt-0.5 text-xs text-slate-muted">{fmtDateTime(n.createdAt)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [openFor, setOpenFor] = useState<string | null>(null); // drawer is open only for the page it was opened on
  const open = openFor === pathname;
  const setOpen = (value: boolean) => setOpenFor(value ? pathname : null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenFor(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const items = adminNav.filter((i) => !i.adminOnly || user?.role === "admin");
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const nav = (
    <nav aria-label="Admin" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {items.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} aria-current={isActive(href) ? "page" : undefined}
          className={cn("flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[0.95rem] font-medium transition-colors", isActive(href) ? "bg-stone text-forest-dark" : "text-stone/80 hover:bg-forest-soft/60 hover:text-stone")}>
          <Icon className="h-5 w-5" aria-hidden />{label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-dvh bg-stone lg:grid lg:grid-cols-[16rem_1fr]">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-sand focus:px-5 focus:py-2">Skip to content</a>
      <aside className="sticky top-0 hidden h-dvh flex-col bg-forest-dark lg:flex">
        <div className="border-b border-stone/10 px-6 py-5"><p className="font-display text-2xl text-stone">Shimshal Heights</p><p className="text-xs uppercase tracking-widest text-sand">Admin</p></div>
        {nav}
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="absolute inset-0 bg-slate/60" aria-hidden />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-forest-dark">
            <div className="flex items-center justify-between border-b border-stone/10 px-5 py-4"><p className="font-display text-xl text-stone">Admin menu</p><button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-full p-2 text-stone hover:bg-stone/10"><X className="h-5 w-5" /></button></div>
            {nav}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-stone-line bg-stone/95 px-4 backdrop-blur sm:px-6">
          <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} className="rounded-full p-2.5 hover:bg-stone-deep lg:hidden"><Menu className="h-5 w-5" /></button>
          <Link href="/" target="_blank" className="hidden items-center gap-1.5 text-sm font-medium text-slate-soft hover:text-forest sm:flex">View website<ExternalLink className="h-4 w-4" aria-hidden /></Link>
          <div className="ml-auto flex items-center gap-1 sm:gap-3">
            <NotificationBell />
            <div className="hidden text-right leading-tight sm:block"><p className="text-sm font-semibold text-forest-dark">{user?.name}</p><p className="text-xs capitalize text-slate-muted">{user?.role}</p></div>
            <button type="button" onClick={logout} aria-label="Sign out" className="flex items-center gap-2 rounded-full border border-stone-line px-3.5 py-2 text-sm font-semibold hover:bg-stone-deep"><LogOut className="h-4 w-4" aria-hidden /><span className="hidden sm:inline">Sign out</span></button>
          </div>
        </header>
        <main id="admin-main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
