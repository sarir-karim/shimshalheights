"use client";

import { useMemo, useState } from "react";
import { SmartImage } from "@/components/ui/SmartImage";
import { Lightbox } from "@/components/gallery/Lightbox";
import { cn } from "@/lib/utils";
import type { GalleryCategory, GalleryImage } from "@/types";

export const galleryCategories: GalleryCategory[] = ["Hotel Exterior", "Rooms", "Restaurant", "Food", "Mountains & Nature", "Shimshal Valley"];

export function GalleryGrid({ items }: { items: GalleryImage[] }) {
  const [category, setCategory] = useState<GalleryCategory | "All">("All");
  const [active, setActive] = useState<number | null>(null);
  const shown = useMemo(() => (category === "All" ? items : items.filter((i) => i.category === category)), [items, category]);
  const tabs: (GalleryCategory | "All")[] = ["All", ...galleryCategories];

  return (
    <div>
      <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button key={tab} type="button" aria-pressed={category === tab} onClick={() => { setCategory(tab); setActive(null); }}
            className={cn("rounded-full border px-4 py-2 text-sm font-semibold transition-colors", category === tab ? "border-forest bg-forest text-stone" : "border-stone-line bg-white text-slate-soft hover:border-forest")}>
            {tab}
          </button>
        ))}
      </div>
      <p className="mt-5 text-slate-muted" role="status" aria-live="polite">{shown.length} photo{shown.length === 1 ? "" : "s"}</p>

      {shown.length === 0 ? (
        <p className="mt-4 rounded-xl2 bg-white p-8 text-slate-soft shadow-soft">No photos in this category yet. Check back soon.</p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
          {shown.map((item, i) => (
            <li key={item.id}>
              <button type="button" onClick={() => setActive(i)} aria-label={`Open image: ${item.title}`} className="group relative block w-full overflow-hidden rounded-xl2">
                <SmartImage image={item.image} sizes="(min-width: 768px) 33vw, 50vw" wrapperClassName={cn(i % 5 === 0 ? "aspect-[4/5]" : "aspect-[4/3]")} className="transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-forest-dark/80 to-transparent p-3 text-left text-sm font-medium text-stone">{item.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <Lightbox items={shown} index={active} onClose={() => setActive(null)} onChange={setActive} />
    </div>
  );
}
