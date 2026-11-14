import { CheckCircle2 } from "lucide-react";
import { ButtonLink, ExternalButtonLink } from "@/components/ui/Button";
import { useMockData } from "@/config/site";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import { whatsappHref } from "@/lib/links";
import type { BookingRequestReceipt } from "@/services/bookingService";

export function BookingConfirmation({ receipt, guestEmail }: { receipt: BookingRequestReceipt; guestEmail: string }) {
  const s = useSiteSettings();
  const wa = whatsappHref(s.whatsapp, `Hello, I sent a booking request. Reference: ${receipt.reference}`);
  return (
    <div className="rounded-xl2 bg-white p-8 text-center shadow-soft sm:p-12" role="status">
      <CheckCircle2 className="mx-auto h-12 w-12 text-forest" aria-hidden />
      <h2 className="mt-4 text-3xl sm:text-4xl">Booking request received</h2>
      <p className="mx-auto mt-3 max-w-lg text-slate-soft">
        Your request is <strong>pending</strong>. It is not confirmed until {s.name} has checked availability and replied to {guestEmail}.
      </p>
      <p className="mt-6 text-sm text-slate-muted">Your reference number</p>
      <p className="font-display text-3xl tracking-wide text-forest-dark">{receipt.reference}</p>
      {useMockData && <p className="mx-auto mt-4 max-w-md rounded-xl bg-sand-light/60 p-3 text-sm text-slate">Demo mode: this request was not saved or sent.</p>}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {wa && <ExternalButtonLink href={wa} variant="secondary">Message us on WhatsApp</ExternalButtonLink>}
        <ButtonLink href="/">Back to home</ButtonLink>
      </div>
    </div>
  );
}
