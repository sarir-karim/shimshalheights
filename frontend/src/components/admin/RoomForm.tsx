"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { ImageManager } from "@/components/admin/ImageManager";
import { TagInput } from "@/components/admin/TagInput";
import { useToast } from "@/components/admin/ToastProvider";
import { Toggle } from "@/components/admin/ui";
import { api, errorMessage, toFormData } from "@/lib/adminApi";
import { applyFieldErrors } from "@/lib/formErrors";
import type { AdminRoom } from "@/types/admin";

const schema = z.object({
  name: z.string().trim().min(2, "Enter a room name").max(100),
  shortDescription: z.string().trim().min(5, "Enter a short description").max(240, "Keep it under 240 characters"),
  description: z.string().trim().min(10, "Enter a full description").max(4000),
  pricePerNight: z.coerce.number({ error: "Enter a price" }).min(0, "Price cannot be negative"),
  roomType: z.enum(["standard", "deluxe", "family", "suite"]),
  maxAdults: z.coerce.number({ error: "Enter a number" }).int().min(1, "At least 1").max(20),
  maxChildren: z.coerce.number({ error: "Enter a number" }).int().min(0).max(20),
  totalRooms: z.coerce.number({ error: "Enter a number" }).int().min(1, "At least 1").max(200),
  bedConfiguration: z.string().trim().min(2, "Describe the beds").max(100),
  amenities: z.array(z.string()),
  featured: z.boolean(),
  isActive: z.boolean(),
});
type Values = z.input<typeof schema>;

export function RoomForm({ room }: { room?: AdminRoom }) {
  const router = useRouter();
  const toast = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const { register, control, handleSubmit, setError, formState: { errors, isSubmitting, isDirty } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: room?.name ?? "", shortDescription: room?.shortDescription ?? "", description: room?.description ?? "",
      pricePerNight: room?.pricePerNight ?? 0, roomType: room?.roomType ?? "standard", maxAdults: room?.maxAdults ?? 2,
      maxChildren: room?.maxChildren ?? 0, totalRooms: room?.totalRooms ?? 1, bedConfiguration: room?.bedConfiguration ?? "",
      amenities: room?.amenities ?? [], featured: room?.featured ?? false, isActive: room?.isActive ?? true,
    },
  });

  const onSubmit = async (values: Values) => {
    try {
      const form = toFormData({ ...values, ...(removed.length ? { removeImages: removed } : {}) }, files, "images");
      const res = room ? await api<AdminRoom>("PUT", `/rooms/${room.id}`, { form }) : await api<AdminRoom>("POST", "/rooms", { form });
      toast.success(room ? "Room updated" : "Room created");
      router.push("/admin/rooms");
      void res;
    } catch (err) {
      if (!applyFieldErrors(err, setError)) toast.error(errorMessage(err));
      else toast.error("Please fix the highlighted fields");
    }
  };

  const unsaved = isDirty || files.length > 0 || removed.length > 0;
  const num = "input-field";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8" aria-label={room ? "Edit room" : "New room"}>
      <section className="grid gap-5 rounded-xl2 border border-stone-line bg-white p-6 shadow-soft sm:grid-cols-2">
        <Field id="r-name" label="Room name" error={errors.name?.message} className="sm:col-span-2"><input id="r-name" className="input-field" {...register("name")} /></Field>
        <Field id="r-short" label="Short description" error={errors.shortDescription?.message} hint="Shown on room cards." className="sm:col-span-2"><input id="r-short" className="input-field" {...register("shortDescription")} /></Field>
        <Field id="r-desc" label="Full description" error={errors.description?.message} className="sm:col-span-2"><textarea id="r-desc" rows={5} className="input-field" {...register("description")} /></Field>
        <Field id="r-type" label="Room type" error={errors.roomType?.message}>
          <select id="r-type" className="input-field capitalize" {...register("roomType")}>{["standard", "deluxe", "family", "suite"].map((t) => <option key={t} value={t}>{t}</option>)}</select>
        </Field>
        <Field id="r-price" label="Price per night (PKR)" error={errors.pricePerNight?.message}><input id="r-price" type="number" min={0} className={num} {...register("pricePerNight")} /></Field>
        <Field id="r-adults" label="Max adults per room" error={errors.maxAdults?.message}><input id="r-adults" type="number" min={1} className={num} {...register("maxAdults")} /></Field>
        <Field id="r-children" label="Max children per room" error={errors.maxChildren?.message}><input id="r-children" type="number" min={0} className={num} {...register("maxChildren")} /></Field>
        <Field id="r-total" label="Number of rooms of this type" error={errors.totalRooms?.message} hint="Inventory used for availability."><input id="r-total" type="number" min={1} className={num} {...register("totalRooms")} /></Field>
        <Field id="r-beds" label="Bed configuration" error={errors.bedConfiguration?.message}><input id="r-beds" placeholder="e.g. 1 king bed" className="input-field" {...register("bedConfiguration")} /></Field>
        <Field id="r-amen" label="Amenities" error={errors.amenities?.message} hint="Type an amenity and press Enter." className="sm:col-span-2">
          <Controller control={control} name="amenities" render={({ field }) => <TagInput id="r-amen" value={field.value} onChange={field.onChange} placeholder="Heating, Mountain view, Room service…" />} />
        </Field>
        <div className="flex flex-wrap gap-8 sm:col-span-2">
          <Controller control={control} name="isActive" render={({ field }) => (
            <label className="flex items-center gap-3 text-sm font-semibold text-forest-dark"><Toggle checked={field.value} onChange={field.onChange} label="Active" />Active (bookable and visible on the website)</label>)} />
          <Controller control={control} name="featured" render={({ field }) => (
            <label className="flex items-center gap-3 text-sm font-semibold text-forest-dark"><Toggle checked={field.value} onChange={field.onChange} label="Featured" />Featured on the homepage</label>)} />
        </div>
      </section>

      <section className="rounded-xl2 border border-stone-line bg-white p-6 shadow-soft">
        <ImageManager label="Room photos" existing={room?.images ?? []} newFiles={files} onNewFiles={setFiles} removed={removed} onRemovedChange={setRemoved} max={10} />
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? (<><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Saving…</>) : room ? "Save changes" : "Create room"}</Button>
        <ButtonLink href="/admin/rooms" variant="secondary">Cancel</ButtonLink>
        {unsaved && !isSubmitting && <p className="text-sm text-slate-muted">You have unsaved changes.</p>}
      </div>
    </form>
  );
}
