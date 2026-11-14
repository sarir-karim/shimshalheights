"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarDays, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { todayISO } from "@/lib/utils";

const schema = z
  .object({
    checkIn: z.string().min(1, "Choose a check-in date"),
    checkOut: z.string().min(1, "Choose a check-out date"),
    adults: z.coerce.number().int().min(1, "At least 1 adult").max(10),
    children: z.coerce.number().int().min(0).max(10),
  })
  .refine((v) => !v.checkIn || v.checkIn >= todayISO(), { path: ["checkIn"], message: "Check-in cannot be in the past" })
  .refine((v) => !v.checkIn || !v.checkOut || v.checkOut > v.checkIn, {
    path: ["checkOut"],
    message: "Check-out must be after check-in",
  });

type FormValues = z.input<typeof schema>;

/** Hands the chosen dates and guests to /booking, which runs the real availability check (Step 6). */
export function AvailabilityWidget() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { adults: 2, children: 0 } });

  const onSubmit = (values: FormValues) => {
    const params = new URLSearchParams({
      checkIn: values.checkIn,
      checkOut: values.checkOut,
      adults: String(values.adults),
      children: String(values.children),
    });
    router.push(`/booking?${params.toString()}`);
  };

  const field = "text-sm font-semibold text-forest-dark";
  const err = "mt-1 text-sm text-red-700";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Check availability"
      className="grid gap-4 rounded-xl2 bg-white p-5 shadow-lift sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.7fr_0.7fr_auto] lg:items-start lg:p-6"
    >
      <div>
        <label htmlFor="av-in" className={field}><CalendarDays className="mr-1.5 inline h-4 w-4 text-sand-dark" aria-hidden />Check-in</label>
        <input id="av-in" type="date" min={todayISO()} className="input-field mt-1.5" {...register("checkIn")} aria-invalid={!!errors.checkIn} />
        {errors.checkIn && <p className={err}>{errors.checkIn.message}</p>}
      </div>
      <div>
        <label htmlFor="av-out" className={field}><CalendarDays className="mr-1.5 inline h-4 w-4 text-sand-dark" aria-hidden />Check-out</label>
        <input id="av-out" type="date" min={todayISO()} className="input-field mt-1.5" {...register("checkOut")} aria-invalid={!!errors.checkOut} />
        {errors.checkOut && <p className={err}>{errors.checkOut.message}</p>}
      </div>
      <div>
        <label htmlFor="av-adults" className={field}><Users className="mr-1.5 inline h-4 w-4 text-sand-dark" aria-hidden />Adults</label>
        <input id="av-adults" type="number" min={1} max={10} className="input-field mt-1.5" {...register("adults")} aria-invalid={!!errors.adults} />
        {errors.adults && <p className={err}>{errors.adults.message}</p>}
      </div>
      <div>
        <label htmlFor="av-children" className={field}>Children</label>
        <input id="av-children" type="number" min={0} max={10} className="input-field mt-1.5" {...register("children")} />
      </div>
      <Button type="submit" className="w-full sm:col-span-2 lg:col-span-1 lg:mt-7">
        Check availability
      </Button>
    </form>
  );
}
