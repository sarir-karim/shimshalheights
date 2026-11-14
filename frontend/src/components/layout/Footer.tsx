import Link from "next/link";
import { Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { navLinks } from "@/config/site";
import { mailHref, telHref } from "@/lib/links";
import type { SiteSettings } from "@/types";

const real = (url: string) => url && url !== "#";

export function Footer({ settings: s }: { settings: SiteSettings }) {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-forest-dark text-stone/85">
      <div className="container-page grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1.2fr]">
        <div>
          <p className="font-display text-3xl text-stone">{s.name}</p>
          <p className="mt-4 max-w-sm text-[0.98rem] text-stone/75">{s.description}</p>
          <div className="mt-6 flex gap-3">
            {s.social.facebook && <a href={s.social.facebook} {...(real(s.social.facebook) ? { target: "_blank", rel: "noopener noreferrer" } : {})} aria-label="Facebook" className="rounded-full border border-stone/30 p-2.5 hover:bg-stone/10"><Facebook className="h-5 w-5" /></a>}
            {s.social.instagram && <a href={s.social.instagram} {...(real(s.social.instagram) ? { target: "_blank", rel: "noopener noreferrer" } : {})} aria-label="Instagram" className="rounded-full border border-stone/30 p-2.5 hover:bg-stone/10"><Instagram className="h-5 w-5" /></a>}
          </div>
        </div>

        <nav aria-label="Footer">
          <p className="font-display text-xl text-stone">Explore</p>
          <ul className="mt-4 space-y-2.5">
            {[...navLinks, { label: "Book a stay", href: "/booking" }].map((link) => (
              <li key={link.href}><Link href={link.href} className="hover:text-sand">{link.label}</Link></li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="font-display text-xl text-stone">Find us</p>
          <ul className="mt-4 space-y-3.5">
            {s.address && <li className="flex gap-3"><MapPin className="mt-1 h-5 w-5 shrink-0 text-sand" aria-hidden />{s.address}</li>}
            {s.phone && <li className="flex gap-3"><Phone className="mt-1 h-5 w-5 shrink-0 text-sand" aria-hidden /><a href={telHref(s.phone)} className="hover:text-sand">{s.phone}</a></li>}
            {s.email && <li className="flex gap-3"><Mail className="mt-1 h-5 w-5 shrink-0 text-sand" aria-hidden /><a href={mailHref(s.email)} className="hover:text-sand">{s.email}</a></li>}
          </ul>
          <p className="mt-5 text-sm text-stone/70">Check-in from {s.checkInTime}, check-out by {s.checkOutTime}.</p>
        </div>
      </div>
      <div className="border-t border-stone/15"><p className="container-page py-6 text-sm text-stone/60">© {year} {s.name}. All rights reserved.</p></div>
    </footer>
  );
}
