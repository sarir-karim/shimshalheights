import { ButtonLink, ExternalButtonLink } from "@/components/ui/Button";
import { SmartImage } from "@/components/ui/SmartImage";
import { whatsappHref } from "@/lib/links";
import type { SiteImage, SiteSettings } from "@/types";

export function CallToAction({ settings, image }: { settings: SiteSettings; image: SiteImage }) {
  const wa = whatsappHref(settings.whatsapp, `Hello ${settings.name}, I would like to ask about a stay.`);
  return (
    <section className="relative overflow-hidden bg-forest-dark" aria-labelledby="cta-title">
      <SmartImage image={{ ...image, alt: "" }} sizes="100vw" wrapperClassName="absolute inset-0 h-full w-full opacity-25" />
      <div className="container-page relative py-24 text-center sm:py-32">
        <h2 id="cta-title" className="mx-auto max-w-2xl !text-stone text-4xl sm:text-5xl">Your room in the mountains is waiting.</h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-stone/80">Send a booking request online{wa ? ", or message us on WhatsApp" : ""} and we will help you plan your stay.</p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/booking" variant="light">Request a Booking</ButtonLink>
          {wa && <ExternalButtonLink href={wa} variant="ghost">Chat on WhatsApp</ExternalButtonLink>}
        </div>
      </div>
    </section>
  );
}
