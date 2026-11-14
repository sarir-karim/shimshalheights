import { siteSettings } from "@/config/site";
import { BedDouble, Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { SmartImage } from "@/components/ui/SmartImage";
import { formatCurrency } from "@/lib/utils";
import type { Room } from "@/types";

export function RoomCard({ room }: { room: Room }) {
  const available = room.isActive && room.totalRooms > 0;
  return (
    <article className="flex flex-col overflow-hidden rounded-xl2 bg-white shadow-soft">
      <div className="relative">
        <SmartImage image={room.images[0]} sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" wrapperClassName="aspect-[4/3]" />
        <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${available ? "bg-forest text-stone" : "bg-slate text-stone"}`}>
          {available ? "Available" : "Fully booked"}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h2 className="text-2xl">{room.name}</h2>
        <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-muted">
          <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" aria-hidden />Up to {room.maxAdults} adults, {room.maxChildren} child{room.maxChildren === 1 ? "" : "ren"}</span>
          <span className="inline-flex items-center gap-1.5"><BedDouble className="h-4 w-4" aria-hidden />{room.bedConfiguration}</span>
        </p>
        <p className="mt-4 text-slate-soft">{room.shortDescription}</p>
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Room facilities">
          {room.amenities.slice(0, 4).map((a) => (
            <li key={a} className="rounded-full bg-forest-mist px-3 py-1 text-xs font-medium text-forest-dark">{a}</li>
          ))}
        </ul>
        <p className="mt-5 flex-1 text-slate-soft">
          <span className="font-display text-2xl text-forest-dark">{formatCurrency(room.pricePerNight)}</span> / night
          {siteSettings.demoMode && <span className="ml-2 text-xs text-slate-muted">(demo price)</span>}
        </p>
        <div className="mt-4 flex gap-3">
          <ButtonLink href={`/rooms/${room.slug}`} variant="secondary" className="flex-1 px-4">View Details</ButtonLink>
          <ButtonLink href={`/booking?room=${room.slug}`} className="flex-1 px-4">Book Now</ButtonLink>
        </div>
      </div>
    </article>
  );
}
