import type { SiteSettings } from "@/types";

/** Booking and cancellation policies, entered by the hotel in admin Settings. Renders nothing until they exist. */
export function Policies({ settings }: { settings: SiteSettings }) {
  if (!settings.bookingPolicies && !settings.cancellationPolicies) return null;
  return (
    <section aria-labelledby="policies-title" className="rounded-xl2 border border-stone-line bg-white p-6">
      <h2 id="policies-title" className="text-2xl">Booking policies</h2>
      {settings.bookingPolicies && <div className="mt-3"><h3 className="text-lg">Booking</h3><p className="mt-1 whitespace-pre-line text-slate-soft">{settings.bookingPolicies}</p></div>}
      {settings.cancellationPolicies && <div className="mt-4"><h3 className="text-lg">Cancellation</h3><p className="mt-1 whitespace-pre-line text-slate-soft">{settings.cancellationPolicies}</p></div>}
    </section>
  );
}
