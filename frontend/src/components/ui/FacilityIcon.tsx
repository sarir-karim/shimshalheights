import { BedDouble, BellRing, CarFront, HeartHandshake, Mountain, UtensilsCrossed, type LucideIcon } from "lucide-react";
import type { Facility } from "@/types";

const icons: Record<Facility["icon"], LucideIcon> = {
  "room-service": BellRing, restaurant: UtensilsCrossed, parking: CarFront, rooms: BedDouble, views: Mountain, support: HeartHandshake,
};

export function FacilityIcon({ name, className }: { name: Facility["icon"]; className?: string }) {
  const Icon = icons[name];
  return <Icon className={className} aria-hidden />;
}
