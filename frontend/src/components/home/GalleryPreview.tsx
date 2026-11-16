"use client";

import { useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SmartImage } from "@/components/ui/SmartImage";
import { Lightbox } from "@/components/gallery/Lightbox";
import { cn } from "@/lib/utils";
import type { GalleryImage } from "@/types";

const spans = ["col-span-2 row-span-2", "", "", "", ""];

export function GalleryPreview({ content = {}, items }: { content?: Record<string, string>; items: GalleryImage[] }) {
  const [active, setActive] = useState<number | null>(null);
  const shown = items.slice(0, 5);
  return (
    <section className="section bg-stone-deep" aria-labelledby="gallery-title">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div id="gallery-title"><SectionHeading title={content.text4 ?? "A look around"} /></div>
          <ButtonLink href="/gallery" variant="secondary">{content.text2 ?? "View Full Gallery"}</ButtonLink>
        </div>

        {shown.length === 0 ? (
          <p className="mt-10 text-slate-soft">{content.text3 ?? "Photographs are coming soon."}</p>
        ) : (
          <ul className="mt-10 grid auto-rows-[11rem] grid-cols-2 gap-3 sm:auto-rows-[13rem] sm:grid-cols-4 sm:gap-4">
            {shown.map((item, i) => (
              <li key={item.id} className={cn("overflow-hidden rounded-xl2", spans[i])}>
                <button type="button" onClick={() => setActive(i)} aria-label={`Open image: ${item.title}`} className="group relative block h-full w-full">
                  <SmartImage image={item.image} sizes="(min-width: 640px) 25vw, 50vw" wrapperClassName="h-full w-full" className="transition-transform duration-500 group-hover:scale-105" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Lightbox items={shown} index={active} onClose={() => setActive(null)} onChange={setActive} />
    </section>
  );
}
