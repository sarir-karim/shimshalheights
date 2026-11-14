"use client";

import { useState } from "react";
import { SmartImage } from "@/components/ui/SmartImage";
import { cn } from "@/lib/utils";
import type { SiteImage } from "@/types";

export function RoomGallery({ images }: { images: SiteImage[] }) {
  const [active, setActive] = useState(0);
  if (images.length === 0) return <div className="aspect-[16/10] rounded-xl2 bg-stone-deep" role="img" aria-label="No photos yet" />;
  return (
    <div>
      <SmartImage image={images[active]} sizes="(min-width: 1024px) 60vw, 100vw" priority wrapperClassName="aspect-[16/10] rounded-xl2 shadow-soft" />
      {images.length > 1 && (
        <ul className="mt-3 flex gap-3 overflow-x-auto" aria-label="Room photos">
          {images.map((img, i) => (
            <li key={img.url}>
              <button type="button" onClick={() => setActive(i)} aria-label={`Show photo ${i + 1}`} aria-pressed={i === active} className={cn("block overflow-hidden rounded-xl border-2", i === active ? "border-sand-dark" : "border-transparent")}>
                <SmartImage image={img} sizes="120px" wrapperClassName="h-20 w-28" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
