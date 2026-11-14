import { BedDouble, BellRing, CarFront, HeartHandshake, Mountain, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Facility } from "@/types";

const icons: Record<Facility["icon"], LucideIcon> = {
  "room-service": BellRing,
  restaurant: UtensilsCrossed,
  parking: CarFront,
  rooms: BedDouble,
  views: Mountain,
  support: HeartHandshake,
};

export function Facilities({ facilities }: { facilities: Facility[] }) {
  return (
    <section className="section" aria-labelledby="facilities-title">
      <div className="container-page grid gap-14 lg:grid-cols-[0.8fr_1.4fr] lg:gap-20">
        <div id="facilities-title">
          <SectionHeading title="Everything you need after a long day in the mountains" description="Simple comforts, done properly." />
        </div>
        <ul className="grid gap-x-12 gap-y-9 sm:grid-cols-2">
          {facilities.map((item) => {
            const Icon = icons[item.icon];
            return (
              <li key={item.id} className="flex gap-4 border-t border-stone-line pt-6">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-forest text-sand-light">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <div>
                  <h3 className="text-xl">{item.title}</h3>
                  <p className="mt-1.5 text-[0.98rem] text-slate-soft">{item.description}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
