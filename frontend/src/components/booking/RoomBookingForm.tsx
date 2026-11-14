"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { GuestFields } from "@/components/booking/GuestFields";
import { PriceSummary } from "@/components/booking/PriceSummary";
import { BookingConfirmation } from "@/components/booking/BookingConfirmation";
import { bookingSchema, capacityIssue, type BookingValues } from "@/lib/booking";
import { nightsBetween, todayISO } from "@/lib/utils";
import { bookingErrorMessage, submitBookingRequest, type BookingRequestReceipt } from "@/services/bookingService";
import { applyFieldErrors } from "@/lib/formErrors";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import type { Room } from "@/types";

/** Booking form for a single, fixed room (used on /rooms/[slug]). */
export function RoomBookingForm({ room }: { room: Room }) {
  const settings = useSiteSettings();
  const [receipt, setReceipt] = useState<BookingRequestReceipt | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register, handleSubmit, control, getValues, setError,
    formState: { errors, isSubmitting },
  } = useForm<BookingValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { roomSlug: room.slug, adults: 2, children: 0, rooms: 1 },
  });

  const checkIn = useWatch({ control, name: "checkIn" });
  const checkOut = useWatch({ control, name: "checkOut" });
  const rooms = Number(useWatch({ control, name: "rooms" })) || 1;
  const nights = nightsBetween(checkIn ?? "", checkOut ?? "");

  const onSubmit = async (values: BookingValues) => {
    setFormError(null);
    const party = { adults: Number(values.adults), children: Number(values.children), rooms: Number(values.rooms) };
    const issue = capacityIssue(room, party);
    if (issue) return setFormError(issue);
    try {
      // The server checks availability atomically and answers 409 if the room just filled up.
      setReceipt(await submitBookingRequest({ ...values, ...party }));
    } catch (err) {
      if (!applyFieldErrors(err, setError)) setFormError(bookingErrorMessage(err));
    }
  };

  if (receipt) return <BookingConfirmation receipt={receipt} guestEmail={getValues("guestEmail")} />;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6 rounded-xl2 bg-white p-6 shadow-soft" aria-label={`Request ${room.name}`}>
      <h2 className="text-2xl">Request this room</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="rb-in" label="Check-in" error={errors.checkIn?.message}><input id="rb-in" type="date" min={todayISO()} className="input-field" {...register("checkIn")} /></Field>
        <Field id="rb-out" label="Check-out" error={errors.checkOut?.message}><input id="rb-out" type="date" min={checkIn || todayISO()} className="input-field" {...register("checkOut")} /></Field>
        <Field id="rb-adults" label="Adults" error={errors.adults?.message}><input id="rb-adults" type="number" min={1} className="input-field" {...register("adults")} /></Field>
        <Field id="rb-children" label="Children" error={errors.children?.message}><input id="rb-children" type="number" min={0} className="input-field" {...register("children")} /></Field>
        <Field id="rb-rooms" label="Rooms" error={errors.rooms?.message} className="sm:col-span-2"><input id="rb-rooms" type="number" min={1} className="input-field" {...register("rooms")} /></Field>
      </div>
      <GuestFields idPrefix="rb" register={register as never} errors={errors} />
      <PriceSummary room={room} checkIn={checkIn} checkOut={checkOut} nights={nights} rooms={rooms} />
      <p className="text-sm text-slate-muted">Check-in from {settings.checkInTime}, check-out by {settings.checkOutTime}. Sending a request does not confirm your booking.</p>
      {formError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{formError}</p>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (<><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Sending request…</>) : "Send booking request"}
      </Button>
    </form>
  );
}
