import { siteSettings } from "@/config/site";
import Link from "next/link";
import { BedDouble, Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SmartImage } from "@/components/ui/SmartImage";
import { formatCurrency } from "@/lib/utils";
import type { Room } from "@/types";

export function FeaturedRooms({ content = {}, rooms }: { content?: Record<string, string>; rooms: Room[] }) {
  return (
    <section className="section bg-stone-deep" aria-labelledby="rooms-title">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div id="rooms-title"><SectionHeading title={content.text7 ?? "Rooms for every kind of stay"} description={content.text8 ?? "From a quiet double to a family room, all with heating and mountain views."} /></div>
          <ButtonLink href="/rooms" variant="secondary">{content.text1 ?? "View all rooms"}</ButtonLink>
        </div>

        {rooms.length === 0 ? (
          <p className="mt-12 rounded-xl2 bg-white p-8 text-slate-soft">{content.text2 ?? "Rooms will appear here soon. Contact the hotel to ask about availability."}</p>
        ) : (
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <article key={room.id} className="flex flex-col overflow-hidden rounded-xl2 bg-white shadow-soft">
                <SmartImage image={room.images[0]} sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" wrapperClassName="aspect-[4/3]" />
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-2xl">{room.name}</h3>
                  <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-muted">
                    <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" aria-hidden />Up to {room.maxAdults + room.maxChildren} guests</span>
                    <span className="inline-flex items-center gap-1.5"><BedDouble className="h-4 w-4" aria-hidden />{room.bedConfiguration}</span>
                  </p>
                  <p className="mt-4 flex-1 text-slate-soft">{room.shortDescription}</p>
                  <p className="mt-5 text-slate-soft">
                    <span className="font-display text-2xl text-forest-dark">{formatCurrency(room.pricePerNight)}</span> / night
                    {siteSettings.demoMode && <span className="ml-2 text-xs text-slate-muted">{content.text3 ?? "(demo price)"}</span>}
                  </p>
                  <div className="mt-5 flex gap-3">
                    <ButtonLink href={`/rooms/${room.slug}`} variant="secondary" className="flex-1 px-4">{content.text4 ?? "View Details"}</ButtonLink>
                    <ButtonLink href={`/booking?room=${room.slug}`} className="flex-1 px-4">{content.text5 ?? "Book Now"}</ButtonLink>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        <p className="sr-only"><Link href="/rooms">{content.text6 ?? "All rooms"}</Link></p>
      </div>
    </section>
  );
}
