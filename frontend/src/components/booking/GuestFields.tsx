import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Field } from "@/components/ui/Field";
import type { GuestValues } from "@/lib/booking";

interface GuestFieldsProps {
  idPrefix: string;
  register: UseFormRegister<GuestValues>;
  errors: FieldErrors<GuestValues>;
}

export function GuestFields({ idPrefix, register, errors }: GuestFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field id={`${idPrefix}-name`} label="Full name" error={errors.guestName?.message} className="sm:col-span-2">
        <input id={`${idPrefix}-name`} autoComplete="name" className="input-field" aria-describedby={errors.guestName ? `${idPrefix}-name-error` : undefined} {...register("guestName")} />
      </Field>
      <Field id={`${idPrefix}-email`} label="Email" error={errors.guestEmail?.message}>
        <input id={`${idPrefix}-email`} type="email" autoComplete="email" className="input-field" {...register("guestEmail")} />
      </Field>
      <Field id={`${idPrefix}-phone`} label="Phone number" error={errors.guestPhone?.message}>
        <input id={`${idPrefix}-phone`} type="tel" autoComplete="tel" className="input-field" {...register("guestPhone")} />
      </Field>
      <Field id={`${idPrefix}-notes`} label="Special requests (optional)" error={errors.specialRequests?.message} className="sm:col-span-2">
        <textarea id={`${idPrefix}-notes`} rows={3} className="input-field" placeholder="Arrival time, dietary needs, extra bedding…" {...register("specialRequests")} />
      </Field>
    </div>
  );
}
