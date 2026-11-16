"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { navLinks } from "@/config/site";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/Button";

export function Header() {
  const settings = useSiteSettings();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  // The menu is open only for the page it was opened on, so navigating closes it without an effect.
  const [openFor, setOpenFor] = useState<string | null>(null);
  const open = openFor === pathname;
  const setOpen = (value: boolean) => setOpenFor(value ? pathname : null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenFor(null);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const transparent = isHome && !scrolled && !open;

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div
        className={cn(
          "transition-colors duration-300",
          transparent ? "bg-transparent text-stone" : "bg-stone/95 text-slate shadow-soft backdrop-blur",
        )}
      >
      <div className="container-page flex h-[4.5rem] items-center justify-between">
        <Link href="/" className="font-display text-2xl tracking-tight" aria-label={`${settings.name} home`}>
          {settings.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logoUrl} alt={settings.name} className="h-10 w-auto max-w-[11rem] object-contain" />
          ) : settings.name}
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          {navLinks.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "text-[0.95rem] font-medium transition-opacity hover:opacity-100",
                  active ? "opacity-100 underline decoration-sand decoration-2 underline-offset-8" : "opacity-85",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <ButtonLink href="/booking" variant={transparent ? "light" : "primary"} className="hidden px-5 py-2.5 sm:inline-flex">
            Book Now
          </ButtonLink>
          <button
            type="button"
            className="rounded-full p-2 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="h-[calc(100dvh-6.5rem)] overflow-y-auto bg-stone px-5 pb-10 pt-4 text-slate lg:hidden">
          <ul className="divide-y divide-stone-line">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="block py-4 font-display text-2xl text-forest-dark">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <ButtonLink href="/booking" className="mt-8 w-full">
            Book Now
          </ButtonLink>
        </nav>
      )}
      </div>
    </header>
  );
}
