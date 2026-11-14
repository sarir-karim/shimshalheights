"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { RoomCard } from "@/components/rooms/RoomCard";
import { formatCurrency } from "@/lib/utils";
import type { Room } from "@/types";

type Sort = "price-asc" | "price-desc" | "capacity";

const select = "input-field !py-2.5";

export function RoomsExplorer({ rooms }: { rooms: Room[] }) {
  const [sort, setSort] = useState<Sort>("price-asc");
  const [type, setType] = useState("all");
  const [guests, setGuests] = useState(1);
  const [maxPrice, setMaxPrice] = useState(0); // 0 = any
  const [availableOnly, setAvailableOnly] = useState(false);

  const types = useMemo(() => Array.from(new Set(rooms.map((r) => r.roomType))), [rooms]);
  const priceSteps = useMemo(() => Array.from(new Set(rooms.map((r) => r.pricePerNight))).sort((a, b) => a - b), [rooms]);

  const visible = useMemo(() => {
    const list = rooms.filter(
      (r) =>
        (type === "all" || r.roomType === type) &&
        r.maxAdults + r.maxChildren >= guests &&
        (maxPrice === 0 || r.pricePerNight <= maxPrice) &&
        (!availableOnly || (r.isActive && r.totalRooms > 0)),
    );
    return list.sort((a, b) =>
      sort === "price-asc" ? a.pricePerNight - b.pricePerNight : sort === "price-desc" ? b.pricePerNight - a.pricePerNight : b.maxAdults + b.maxChildren - (a.maxAdults + a.maxChildren),
    );
  }, [rooms, type, guests, maxPrice, availableOnly, sort]);

  const reset = () => { setSort("price-asc"); setType("all"); setGuests(1); setMaxPrice(0); setAvailableOnly(false); };

  return (
    <div>
      <form className="grid gap-4 rounded-xl2 bg-white p-5 shadow-soft sm:grid-cols-2 lg:grid-cols-5" aria-label="Filter and sort rooms" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label htmlFor="f-sort" className="text-sm font-semibold text-forest-dark">Sort by</label>
          <select id="f-sort" className={select} value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="capacity">Guest capacity</option>
          </select>
        </div>
        <div>
          <label htmlFor="f-type" className="text-sm font-semibold text-forest-dark">Room type</label>
          <select id="f-type" className={`${select} capitalize`} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">All types</option>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="f-guests" className="text-sm font-semibold text-forest-dark">Guests</label>
          <select id="f-guests" className={select} value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}+ guest{n > 1 ? "s" : ""}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="f-price" className="text-sm font-semibold text-forest-dark">Max price per night</label>
          <select id="f-price" className={select} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))}>
            <option value={0}>Any price</option>
            {priceSteps.map((p) => <option key={p} value={p}>Up to {formatCurrency(p)}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2.5 self-end pb-2.5 text-[0.95rem]">
          <input type="checkbox" className="h-5 w-5 accent-forest" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} />
          Available rooms only
        </label>
      </form>

      <p className="mt-6 text-slate-muted" role="status" aria-live="polite">{visible.length} room{visible.length === 1 ? "" : "s"} shown</p>

      {visible.length === 0 ? (
        <div className="mt-4 rounded-xl2 bg-white p-8 shadow-soft">
          <h2 className="text-2xl">No rooms match those filters</h2>
          <p className="mt-2 text-slate-soft">Try a higher price, fewer guests or a different room type.</p>
          <Button variant="secondary" className="mt-5" onClick={reset}>Clear filters</Button>
        </div>
      ) : (
        <div className="mt-4 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((room) => <RoomCard key={room.id} room={room} />)}
        </div>
      )}
    </div>
  );
}
