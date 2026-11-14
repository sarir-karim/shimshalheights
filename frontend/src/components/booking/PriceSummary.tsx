import { formatCurrency } from "@/lib/utils";
import { siteSettings } from "@/config/site";
import { formatDate } from "@/lib/booking";
import type { Room } from "@/types";

interface PriceSummaryProps {
  room?: Room;
  checkIn?: string;
  checkOut?: string;
  nights: number;
  rooms: number;
}

export function PriceSummary({ room, checkIn, checkOut, nights, rooms }: PriceSummaryProps) {
  const ready = room && nights > 0;
  return (
    <div className="rounded-xl bg-stone-deep p-5" aria-live="polite">
      <p className="font-display text-xl text-forest-dark">Estimated price</p>
      {ready ? (
        <>
          <dl className="mt-3 space-y-1.5 text-[0.95rem]">
            <div className="flex justify-between gap-4"><dt className="text-slate-soft">Stay</dt><dd className="text-right">{formatDate(checkIn ?? "")} to {formatDate(checkOut ?? "")}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-slate-soft">{formatCurrency(room.pricePerNight)} × {nights} night{nights > 1 ? "s" : ""} × {rooms} room{rooms > 1 ? "s" : ""}</dt><dd>{formatCurrency(room.pricePerNight * nights * rooms)}</dd></div>
          </dl>
          <p className="mt-3 flex justify-between border-t border-stone-line pt-3 font-display text-2xl text-forest-dark"><span>Total</span><span>{formatCurrency(room.pricePerNight * nights * rooms)}</span></p>
        </>
      ) : (
        <p className="mt-2 text-sm text-slate-soft">Choose your dates to see an estimate.</p>
      )}
      <p className="mt-3 text-xs text-slate-muted">{siteSettings.demoMode ? "Estimate only, based on demo pricing. " : "Estimate only. "}The hotel confirms the final price with your booking.</p>
    </div>
  );
}
