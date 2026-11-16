import { MapPin } from "lucide-react";
import { ExternalButtonLink } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { MapEmbed } from "@/components/map/MapEmbed";
import type { SiteImage, SiteSettings } from "@/types";

export function LocationSection({ content = {}, settings, mapImage }: { content?: Record<string, string>; settings: SiteSettings; mapImage: SiteImage }) {
  return (
    <section className="section bg-stone-deep" aria-labelledby="location-title">
      <div className="container-page grid items-center gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
        <div>
          <div id="location-title"><SectionHeading title={content.text3 ?? "Find us in Shimshal Valley"} /></div>
          <p className="mt-5 flex gap-3 text-slate-soft"><MapPin className="mt-1 h-5 w-5 shrink-0 text-sand-dark" aria-hidden />{settings.address}</p>
          <p className="mt-4 text-slate-soft">{content.text1 ?? "The road to Shimshal is long and spectacular. Contact us before you travel and we will help with directions and arrival times."}</p>
          <ExternalButtonLink href={settings.mapsDirectionsUrl} className="mt-8">{content.text2 ?? "Get Directions"}</ExternalButtonLink>
        </div>
        <MapEmbed embedUrl={settings.mapsEmbedUrl} fallback={mapImage} />
      </div>
    </section>
  );
}
