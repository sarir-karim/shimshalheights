import type { Metadata } from "next";
import { Facebook, Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ContactForm } from "@/components/contact/ContactForm";
import { MapEmbed } from "@/components/map/MapEmbed";
import { ExternalButtonLink } from "@/components/ui/Button";
import { mailHref, telHref, whatsappHref } from "@/lib/links";
import { getSiteImages, getSiteSettings } from "@/services/dataService";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Contact Shimshal Heights by phone, email, WhatsApp or the contact form. Find us in Shimshal Valley, Upper Hunza.",
  alternates: { canonical: "/contact" },
};

const real = (u: string) => u && u !== "#";

export default async function ContactPage() {
  const [s, images] = await Promise.all([getSiteSettings(), getSiteImages()]);
  const wa = whatsappHref(s.whatsapp, `Hello ${s.name}, I would like to ask about a stay.`);
  const row = "flex gap-4";
  const icon = "mt-1 h-5 w-5 shrink-0 text-sand-dark";
  return (
    <>
      <PageHeader title="Contact Us" description="Questions about a stay, the restaurant or the road to Shimshal? We are happy to help." crumbs={[{ label: "Contact" }]} />
      <section className="section !pt-12">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <div className="space-y-8">
            <ul className="space-y-5">
              {s.phone && <li className={row}><Phone className={icon} aria-hidden /><div><p className="font-semibold text-forest-dark">Phone</p><a href={telHref(s.phone)} className="text-slate-soft hover:text-forest">{s.phone}</a></div></li>}
              {s.email && <li className={row}><Mail className={icon} aria-hidden /><div><p className="font-semibold text-forest-dark">Email</p><a href={mailHref(s.email)} className="text-slate-soft hover:text-forest">{s.email}</a></div></li>}
              <li className={row}><MapPin className={icon} aria-hidden /><div><p className="font-semibold text-forest-dark">Address</p><p className="text-slate-soft">{s.address}</p></div></li>
            </ul>
            {s.demoMode && <p className="text-sm text-slate-muted">Placeholder phone, email and WhatsApp details are shown until the hotel enters real ones in the admin settings.</p>}
            <div className="flex flex-wrap gap-3">
              {wa && <ExternalButtonLink href={wa}><MessageCircle className="h-5 w-5" aria-hidden />Chat on WhatsApp</ExternalButtonLink>}
              <ExternalButtonLink href={s.mapsDirectionsUrl} variant="secondary">Get Directions</ExternalButtonLink>
            </div>
            {(real(s.social.facebook) || real(s.social.instagram)) && (
              <div className="flex gap-3">
                {real(s.social.facebook) && <a href={s.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="rounded-full border border-stone-line p-2.5 text-forest hover:bg-forest-mist"><Facebook className="h-5 w-5" /></a>}
                {real(s.social.instagram) && <a href={s.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="rounded-full border border-stone-line p-2.5 text-forest hover:bg-forest-mist"><Instagram className="h-5 w-5" /></a>}
              </div>
            )}
            <MapEmbed embedUrl={s.mapsEmbedUrl} fallback={images.map} />
          </div>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
