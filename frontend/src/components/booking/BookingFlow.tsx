"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button, ExternalButtonLink } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { SmartImage } from "@/components/ui/SmartImage";
import { GuestFields } from "@/components/booking/GuestFields";
import { PriceSummary } from "@/components/booking/PriceSummary";
import { BookingConfirmation } from "@/components/booking/BookingConfirmation";
import { ApiError } from "@/lib/adminApi";
import { guestSchema, staySchema, type GuestValues, type StayValues } from "@/lib/booking";
import { cn, formatCurrency, nightsBetween, todayISO } from "@/lib/utils";
import {
  bookingErrorMessage, checkAvailability, submitBookingRequest,
  type AvailabilityResult, type BookingRequestReceipt,
} from "@/services/bookingService";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import { whatsappHref } from "@/lib/links";
import { applyFieldErrors } from "@/lib/formErrors";

export interface BookingInitial {
  room?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  rooms?: number;
}

type Step = "stay" | "rooms" | "details" | "done";
const stepLabels: { key: Step; label: string }[] = [
  { key: "stay", label: "Dates & guests" },
  { key: "rooms", label: "Choose a room" },
  { key: "details", label: "Your details" },
  { key: "done", label: "Request sent" },
];

export function BookingFlow({ initial }: { initial: BookingInitial }) {
  const settings = useSiteSettings();
  const [step, setStep] = useState<Step>("stay");
  const [results, setResults] = useState<AvailabilityResult[]>([]);
  const [stay, setStay] = useState<StayValues | null>(null);
  const [selected, setSelected] = useState<AvailabilityResult | null>(null);
  const [receipt, setReceipt] = useState<BookingRequestReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autoRan = useRef(false);

  const stayForm = useForm<StayValues>({
    resolver: zodResolver(staySchema),
    defaultValues: {
      checkIn: initial.checkIn ?? "", checkOut: initial.checkOut ?? "",
      adults: initial.adults ?? 2, children: initial.children ?? 0, rooms: initial.rooms ?? 1,
    },
  });
  const guestForm = useForm<GuestValues>({ resolver: zodResolver(guestSchema) });

  const runSearch = async (values: StayValues) => {
    setError(null);
    try {
      const found = await checkAvailability({
        checkIn: values.checkIn, checkOut: values.checkOut,
        adults: Number(values.adults), children: Number(values.children), rooms: Number(values.rooms),
      });
      const sorted = [...found].sort((a, b) => Number(b.room.slug === initial.room) - Number(a.room.slug === initial.room));
      setStay(values);
      setResults(sorted);
      setStep("rooms");
    } catch (err) {
      setError(bookingErrorMessage(err));
    }
  };

  // Arriving from the homepage widget or a "Book now" link with dates: run the search straight away.
  useEffect(() => {
    if (autoRan.current || !initial.checkIn || !initial.checkOut) return;
    autoRan.current = true;
    void stayForm.handleSubmit(runSearch)();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitRequest = async (guest: GuestValues) => {
    if (!stay || !selected) return;
    setError(null);
    try {
      const result = await submitBookingRequest({
        ...guest, roomSlug: selected.room.slug, checkIn: stay.checkIn, checkOut: stay.checkOut,
        adults: Number(stay.adults), children: Number(stay.children), rooms: Number(stay.rooms),
      });
      setReceipt(result);
      setStep("done");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setStep("rooms"); // someone took the room meanwhile: go back to a fresh choice
      if (!applyFieldErrors(err, guestForm.setError)) setError(bookingErrorMessage(err));
    }
  };

  const nights = stay ? nightsBetween(stay.checkIn, stay.checkOut) : 0;
  const stepIndex = stepLabels.findIndex((s) => s.key === step);
  const sErr = stayForm.formState.errors;

  return (
    <div>
      <ol className="mb-10 flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="Booking steps">
        {stepLabels.map((s, i) => (
          <li key={s.key} aria-current={i === stepIndex ? "step" : undefined} className={cn("font-medium", i === stepIndex ? "text-forest-dark underline decoration-sand decoration-2 underline-offset-8" : i < stepIndex ? "text-forest" : "text-slate-muted")}>
            {i + 1}. {s.label}
          </li>
        ))}
      </ol>

      {error && <p role="alert" className="mb-6 rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}

      {step === "stay" && (
        <form onSubmit={stayForm.handleSubmit(runSearch)} noValidate className="grid gap-4 rounded-xl2 bg-white p-6 shadow-soft sm:grid-cols-2 lg:grid-cols-5 lg:p-8" aria-label="Check availability">
          <Field id="bk-in" label="Check-in" error={sErr.checkIn?.message}><input id="bk-in" type="date" min={todayISO()} className="input-field" {...stayForm.register("checkIn")} /></Field>
          <Field id="bk-out" label="Check-out" error={sErr.checkOut?.message}><input id="bk-out" type="date" min={todayISO()} className="input-field" {...stayForm.register("checkOut")} /></Field>
          <Field id="bk-adults" label="Adults" error={sErr.adults?.message}><input id="bk-adults" type="number" min={1} className="input-field" {...stayForm.register("adults")} /></Field>
          <Field id="bk-children" label="Children" error={sErr.children?.message}><input id="bk-children" type="number" min={0} className="input-field" {...stayForm.register("children")} /></Field>
          <Field id="bk-rooms" label="Rooms" error={sErr.rooms?.message}><input id="bk-rooms" type="number" min={1} className="input-field" {...stayForm.register("rooms")} /></Field>
          <Button type="submit" className="sm:col-span-2 lg:col-span-5" disabled={stayForm.formState.isSubmitting}>
            {stayForm.formState.isSubmitting ? (<><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Checking availability…</>) : "Check availability"}
          </Button>
        </form>
      )}

      {step === "rooms" && stay && (
        <div>
          <button type="button" onClick={() => setStep("stay")} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-forest hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden />Change dates or guests</button>
          {results.length === 0 ? (
            <div className="rounded-xl2 bg-white p-8 shadow-soft">
              <h2 className="text-2xl">No rooms available for those dates</h2>
              <p className="mt-2 text-slate-soft">Try different dates, fewer guests, or more rooms. You can also ask us directly and we will look for options.</p>
              {whatsappHref(settings.whatsapp, "Hello, I could not find availability online for my dates. Can you help?") && <ExternalButtonLink href={whatsappHref(settings.whatsapp, "Hello, I could not find availability online for my dates. Can you help?")} variant="secondary" className="mt-6">Ask on WhatsApp</ExternalButtonLink>}
            </div>
          ) : (
            <>
              <h2 className="text-2xl">{results.length} room type{results.length > 1 ? "s" : ""} for {nights} night{nights > 1 ? "s" : ""}</h2>
              <ul className="mt-6 space-y-5">
                {results.map((item) => (
                  <li key={item.room.id} className="grid gap-5 overflow-hidden rounded-xl2 bg-white shadow-soft sm:grid-cols-[14rem_1fr]">
                    <SmartImage image={item.room.images[0]} sizes="(min-width: 640px) 224px, 100vw" wrapperClassName="aspect-[4/3] sm:aspect-auto sm:h-full" />
                    <div className="flex flex-col gap-3 p-5 sm:pl-0">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="text-2xl">{item.room.name}</h3>
                        <p className="text-slate-soft"><span className="font-display text-xl text-forest-dark">{formatCurrency(item.room.pricePerNight)}</span> / night</p>
                      </div>
                      <p className="text-slate-soft">{item.room.shortDescription}</p>
                      <p className="text-sm text-slate-muted">{item.room.bedConfiguration}. Estimated total {formatCurrency(item.estimatedTotal)}{settings.demoMode ? " (demo price)" : ""}.</p>
                      <Button className="mt-auto self-start" onClick={() => { setSelected(item); setStep("details"); }}>Select this room</Button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {step === "details" && stay && selected && (
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <form onSubmit={guestForm.handleSubmit(submitRequest)} noValidate className="space-y-6 rounded-xl2 bg-white p-6 shadow-soft lg:p-8" aria-label="Guest details">
            <button type="button" onClick={() => setStep("rooms")} className="inline-flex items-center gap-2 text-sm font-semibold text-forest hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden />Back to rooms</button>
            <h2 className="text-2xl">Your details</h2>
            <GuestFields idPrefix="bk" register={guestForm.register} errors={guestForm.formState.errors} />
            <p className="text-sm text-slate-muted">Check-in from {settings.checkInTime}, check-out by {settings.checkOutTime}. Sending a request does not confirm your booking.</p>
            <Button type="submit" className="w-full" disabled={guestForm.formState.isSubmitting}>
              {guestForm.formState.isSubmitting ? (<><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Sending request…</>) : "Send booking request"}
            </Button>
          </form>
          <aside aria-label="Booking review" className="space-y-4">
            <div className="rounded-xl2 bg-white p-5 shadow-soft">
              <p className="font-display text-xl text-forest-dark">{selected.room.name}</p>
              <p className="mt-1 text-sm text-slate-soft">{Number(stay.adults)} adult{Number(stay.adults) > 1 ? "s" : ""}{Number(stay.children) > 0 ? `, ${stay.children} child${Number(stay.children) > 1 ? "ren" : ""}` : ""}</p>
            </div>
            <PriceSummary room={selected.room} checkIn={stay.checkIn} checkOut={stay.checkOut} nights={nights} rooms={Number(stay.rooms)} />
          </aside>
        </div>
      )}

      {step === "done" && receipt && <BookingConfirmation receipt={receipt} guestEmail={guestForm.getValues("guestEmail")} />}
    </div>
  );
}
