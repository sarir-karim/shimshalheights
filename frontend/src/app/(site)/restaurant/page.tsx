import type { Metadata } from "next";
import { Clock, Phone, UtensilsCrossed } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { SmartImage } from "@/components/ui/SmartImage";
import { ExternalButtonLink } from "@/components/ui/Button";
import { MenuBrowser } from "@/components/restaurant/MenuBrowser";
import { getSiteSettings } from "@/services/dataService";
import { telHref, whatsappHref } from "@/lib/links";
import { getMenuItems, getRestaurant } from "@/services/dataService";

export const metadata: Metadata = {
  title: "Restaurant",
  description: "Freshly prepared breakfast, lunch and dinner at the Shimshal Heights restaurant in Shimshal Valley, Upper Hunza, plus room service.",
  alternates: { canonical: "/restaurant" },
};

export default async function RestaurantPage() {
  const [restaurant, items, siteSettings] = await Promise.all([getRestaurant(), getMenuItems(), getSiteSettings()]);
  const wa = whatsappHref(siteSettings.whatsapp, "Hello, I have a question about the restaurant.");
  const [lead, ...gallery] = restaurant.images;
  return (
    <>
      <PageHeader title="Restaurant" description={restaurant.description} crumbs={[{ label: "Restaurant" }]} />

      {lead && <section className="section !pb-0 !pt-10" aria-label="Restaurant photos">
        <div className="container-page grid gap-4 md:grid-cols-[1.4fr_1fr]">
          {lead && <SmartImage image={lead} sizes="(min-width: 768px) 55vw, 100vw" priority wrapperClassName="aspect-[4/3] rounded-xl2 md:row-span-2 md:aspect-auto md:min-h-[24rem]" />}
          {gallery.slice(0, 2).map((img) => <SmartImage key={img.url} image={img} sizes="(min-width: 768px) 35vw, 100vw" wrapperClassName="aspect-[16/10] rounded-xl2" />)}
        </div>
      </section>}

      <section className="section" aria-labelledby="menu-title">
        <div className="container-page">
          <h2 id="menu-title" className="text-3xl sm:text-4xl">Menu</h2>
          <div className="mt-8"><MenuBrowser categories={restaurant.categories} items={items} /></div>
        </div>
      </section>

      <section className="section bg-stone-deep">
        <div className="container-page grid gap-10 md:grid-cols-3">
          <div>
            <h2 className="flex items-center gap-2 text-2xl"><Clock className="h-6 w-6 text-sand-dark" aria-hidden />Opening hours</h2>
            <dl className="mt-4 space-y-2">
              {restaurant.openingHours.map((h) => (
                <div key={h.label} className="flex justify-between gap-4 border-b border-stone-line pb-2"><dt className="font-semibold text-forest-dark">{h.label}</dt><dd className="text-slate-soft">{h.hours}</dd></div>
              ))}
            </dl>
          </div>
          <div>
            <h2 className="flex items-center gap-2 text-2xl"><UtensilsCrossed className="h-6 w-6 text-sand-dark" aria-hidden />Restaurant facilities</h2>
            <ul className="mt-4 space-y-2 text-slate-soft">{restaurant.facilities.map((f) => <li key={f}>{f}</li>)}</ul>
          </div>
          <div>
            <h2 className="flex items-center gap-2 text-2xl"><Phone className="h-6 w-6 text-sand-dark" aria-hidden />Contact</h2>
            <p className="mt-4 text-slate-soft">Ask about groups, dietary needs or room service.</p>
            {siteSettings.phone && <p className="mt-2"><a className="font-semibold text-forest hover:underline" href={telHref(siteSettings.phone)}>{siteSettings.phone}</a></p>}
            {wa && <ExternalButtonLink href={wa} variant="secondary" className="mt-5">Ask on WhatsApp</ExternalButtonLink>}
          </div>
        </div>
      </section>
    </>
  );
}
