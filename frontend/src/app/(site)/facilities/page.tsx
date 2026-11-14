import type { Metadata } from "next";
import { Check } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { SmartImage } from "@/components/ui/SmartImage";
import { FacilityIcon } from "@/components/ui/FacilityIcon";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { getFacilities } from "@/services/dataService";

export const metadata: Metadata = {
  title: "Facilities",
  description: "Room service, restaurant, parking, comfortable rooms, mountain views and guest support at Shimshal Heights, Shimshal Valley.",
  alternates: { canonical: "/facilities" },
};

export default async function FacilitiesPage() {
  const facilities = await getFacilities();
  return (
    <>
      <PageHeader title="Facilities" description="Simple comforts, done properly, for long days in the mountains." crumbs={[{ label: "Facilities" }]} />
      <section className="section !pt-12">
        <div className="container-page space-y-16 sm:space-y-24">
          {facilities.map((f, i) => (
            <article key={f.id} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
              {f.image && <SmartImage image={f.image} sizes="(min-width: 1024px) 50vw, 100vw" priority={i === 0} wrapperClassName={cn("aspect-[4/3] rounded-xl2 shadow-lift", i % 2 === 1 && "lg:order-2")} />}
              <div>
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-forest text-sand-light"><FacilityIcon name={f.icon} className="h-7 w-7" /></span>
                <h2 className="mt-5 text-3xl sm:text-4xl">{f.title}</h2>
                <p className="mt-3 text-slate-soft">{f.description}</p>
                {f.details && (
                  <ul className="mt-5 space-y-2">{f.details.map((d) => <li key={d} className="flex items-center gap-3"><Check className="h-5 w-5 text-forest" aria-hidden />{d}</li>)}</ul>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="bg-forest py-16 text-center text-stone">
        <div className="container-page">
          <h2 className="!text-stone text-3xl sm:text-4xl">See it for yourself</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/rooms" variant="light">Explore Rooms</ButtonLink>
            <ButtonLink href="/booking" variant="ghost">Book Your Stay</ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
