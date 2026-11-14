import { siteUrl } from "@/config/site";
import type { SiteSettings } from "@/types";

/** Hotel structured data built from the live settings. Contact fields are included only when the hotel has entered real ones. */
export function JsonLd({ settings: s }: { settings: SiteSettings }) {
  const demo = s.demoMode;
  const data = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: s.name,
    description: s.description,
    url: siteUrl,
    ...(s.logoUrl ? { image: s.logoUrl } : {}),
    ...(!demo && s.phone ? { telephone: s.phone } : {}),
    ...(!demo && s.email ? { email: s.email } : {}),
    address: { "@type": "PostalAddress", addressLocality: "Shimshal Valley, Upper Hunza", addressRegion: "Gilgit-Baltistan", addressCountry: "PK" },
    checkinTime: s.checkInTime,
    checkoutTime: s.checkOutTime,
    sameAs: [s.social.facebook, s.social.instagram].filter((u) => u && u !== "#"),
    amenityFeature: ["Restaurant", "Room service", "Parking"].map((name) => ({ "@type": "LocationFeatureSpecification", name, value: true })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
