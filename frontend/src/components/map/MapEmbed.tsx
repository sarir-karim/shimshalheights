import { SmartImage } from "@/components/ui/SmartImage";
import { isGoogleEmbed } from "@/lib/links";
import type { SiteImage } from "@/types";

/** Real Google Map when the admin has set an embed URL (only google.com/maps/embed is ever framed); otherwise a quiet placeholder. */
export function MapEmbed({ embedUrl, fallback, className = "aspect-[16/10]" }: { embedUrl: string; fallback: SiteImage; className?: string }) {
  if (isGoogleEmbed(embedUrl)) {
    return (
      <div className={`relative overflow-hidden rounded-xl2 shadow-lift ${className}`}>
        <iframe src={embedUrl} title="Map showing the hotel location" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen className="absolute inset-0 h-full w-full border-0" />
      </div>
    );
  }
  return (
    <div className="relative overflow-hidden rounded-xl2 shadow-lift">
      <SmartImage image={fallback} sizes="(min-width: 1024px) 55vw, 100vw" wrapperClassName={className} />
      <div className="absolute inset-0 flex items-center justify-center bg-forest-dark/30">
        <p className="rounded-full bg-stone px-5 py-2.5 text-sm font-semibold text-forest-dark shadow-soft">Open the map with Get Directions</p>
      </div>
    </div>
  );
}
