"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { ImageManager } from "@/components/admin/ImageManager";
import { RequireAdmin } from "@/components/admin/RequireAdmin";
import { TagInput } from "@/components/admin/TagInput";
import { useToast } from "@/components/admin/ToastProvider";
import { Card, ErrorState, Loading, PageHeading } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { useFetch } from "@/hooks/useFetch";
import { api, errorMessage, toFormData } from "@/lib/adminApi";
import { applyFieldErrors } from "@/lib/formErrors";
import type { SettingsDoc } from "@/types/admin";

const url = z.string().trim().max(500).refine((v) => v === "" || /^https?:\/\//i.test(v), "Must start with http:// or https://");
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM, e.g. 14:00");
const schema = z.object({
  hotelName: z.string().trim().min(2, "Enter the hotel name").max(100),
  description: z.string().trim().max(2000),
  address: z.string().trim().max(300),
  contactNumbers: z.array(z.string().regex(/^[+()\d\s-]{7,20}$/, "Enter valid phone numbers")),
  email: z.string().trim().refine((v) => v === "" || /^\S+@\S+\.\S+$/.test(v), "Enter a valid email address"),
  whatsappNumber: z.string().trim().refine((v) => v === "" || /^\d{7,15}$/.test(v), "Digits only with country code, e.g. 923001234567"),
  facebook: url, instagram: url, x: url, youtube: url,
  checkInTime: time, checkOutTime: time,
  bookingPolicies: z.string().trim().max(5000),
  cancellationPolicies: z.string().trim().max(5000),
  seoTitle: z.string().trim().max(70, "Keep it under 70 characters"),
  seoDescription: z.string().trim().max(200, "Keep it under 200 characters"),
  googleMapsUrl: url, googleMapsEmbedUrl: url,
});
type Values = z.infer<typeof schema>;

function SettingsForm({ s, onSaved }: { s: SettingsDoc; onSaved: () => void }) {
  const toast = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const { register, control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      hotelName: s.hotelName, description: s.description, address: s.address, contactNumbers: s.contactNumbers, email: s.email, whatsappNumber: s.whatsappNumber,
      facebook: s.socialLinks.facebook, instagram: s.socialLinks.instagram, x: s.socialLinks.x, youtube: s.socialLinks.youtube,
      checkInTime: s.checkInTime, checkOutTime: s.checkOutTime, bookingPolicies: s.bookingPolicies, cancellationPolicies: s.cancellationPolicies,
      seoTitle: s.seo.title, seoDescription: s.seo.description, googleMapsUrl: s.googleMapsUrl, googleMapsEmbedUrl: s.googleMapsEmbedUrl,
    },
  });

  const onSubmit = async (v: Values) => {
    try {
      const { facebook, instagram, x, youtube, seoTitle, seoDescription, ...rest } = v;
      const form = toFormData({ ...rest, socialLinks: { facebook, instagram, x, youtube }, seo: { title: seoTitle, description: seoDescription }, ...(removed.length && files.length === 0 ? { removeLogo: true } : {}) }, files, "logo");
      await api("PUT", "/settings", { form });
      toast.success("Settings saved. The website will use them on its next refresh.");
      setFiles([]); setRemoved([]); onSaved();
    } catch (err) { if (!applyFieldErrors(err, setError)) toast.error(errorMessage(err)); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6" aria-label="Hotel settings">
      <Card className="grid gap-5 sm:grid-cols-2">
        <h2 className="text-xl sm:col-span-2">Hotel</h2>
        <Field id="s-name" label="Hotel name" error={errors.hotelName?.message}><input id="s-name" className="input-field" {...register("hotelName")} /></Field>
        <Field id="s-addr" label="Address" error={errors.address?.message}><input id="s-addr" className="input-field" {...register("address")} /></Field>
        <Field id="s-desc" label="Description" error={errors.description?.message} className="sm:col-span-2"><textarea id="s-desc" rows={4} className="input-field" {...register("description")} /></Field>
        <div className="sm:col-span-2"><ImageManager label="Logo" existing={s.logo ? [s.logo] : []} newFiles={files} onNewFiles={setFiles} removed={removed} onRemovedChange={setRemoved} multiple={false} /></div>
      </Card>

      <Card className="grid gap-5 sm:grid-cols-2">
        <h2 className="text-xl sm:col-span-2">Contact</h2>
        <Field id="s-email" label="Email" error={errors.email?.message}><input id="s-email" type="email" className="input-field" {...register("email")} /></Field>
        <Field id="s-wa" label="WhatsApp number" error={errors.whatsappNumber?.message} hint="Digits only, with country code."><input id="s-wa" inputMode="numeric" className="input-field" {...register("whatsappNumber")} /></Field>
        <Field id="s-phones" label="Phone numbers" error={errors.contactNumbers?.message ?? (errors.contactNumbers as { message?: string }[] | undefined)?.find?.((e) => e?.message)?.message} hint="Type a number and press Enter." className="sm:col-span-2">
          <Controller control={control} name="contactNumbers" render={({ field }) => <TagInput id="s-phones" value={field.value} onChange={field.onChange} placeholder="+92 300 1234567" />} />
        </Field>
      </Card>

      <Card className="grid gap-5 sm:grid-cols-2">
        <h2 className="text-xl sm:col-span-2">Social media</h2>
        {(["facebook", "instagram", "x", "youtube"] as const).map((k) => (
          <Field key={k} id={`s-${k}`} label={k === "x" ? "X (Twitter) URL" : `${k[0].toUpperCase()}${k.slice(1)} URL`} error={errors[k]?.message}><input id={`s-${k}`} type="url" placeholder="https://" className="input-field" {...register(k)} /></Field>
        ))}
      </Card>

      <Card className="grid gap-5 sm:grid-cols-2">
        <h2 className="text-xl sm:col-span-2">Stay policies</h2>
        <Field id="s-in" label="Check-in time" error={errors.checkInTime?.message}><input id="s-in" type="time" className="input-field" {...register("checkInTime")} /></Field>
        <Field id="s-out" label="Check-out time" error={errors.checkOutTime?.message}><input id="s-out" type="time" className="input-field" {...register("checkOutTime")} /></Field>
        <Field id="s-bp" label="Booking policies" error={errors.bookingPolicies?.message} className="sm:col-span-2"><textarea id="s-bp" rows={4} className="input-field" {...register("bookingPolicies")} /></Field>
        <Field id="s-cp" label="Cancellation policies" error={errors.cancellationPolicies?.message} className="sm:col-span-2"><textarea id="s-cp" rows={4} className="input-field" {...register("cancellationPolicies")} /></Field>
      </Card>

      <Card className="grid gap-5 sm:grid-cols-2">
        <h2 className="text-xl sm:col-span-2">SEO and map</h2>
        <Field id="s-st" label="SEO title" error={errors.seoTitle?.message} className="sm:col-span-2"><input id="s-st" className="input-field" {...register("seoTitle")} /></Field>
        <Field id="s-sd" label="SEO description" error={errors.seoDescription?.message} className="sm:col-span-2"><textarea id="s-sd" rows={2} className="input-field" {...register("seoDescription")} /></Field>
        <Field id="s-gm" label="Google Maps link (directions)" error={errors.googleMapsUrl?.message}><input id="s-gm" type="url" placeholder="https://maps.google.com/…" className="input-field" {...register("googleMapsUrl")} /></Field>
        <Field id="s-ge" label="Google Maps embed URL" error={errors.googleMapsEmbedUrl?.message} hint="From Google Maps: Share, Embed a map, copy the src."><input id="s-ge" type="url" placeholder="https://www.google.com/maps/embed?…" className="input-field" {...register("googleMapsEmbedUrl")} /></Field>
      </Card>

      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? (<><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Saving…</>) : "Save settings"}</Button>
    </form>
  );
}

export default function SettingsPage() {
  const { data, loading, error, reload } = useFetch<SettingsDoc>("/settings");
  return (
    <RequireAdmin>
      <PageHeading title="Settings" description="Hotel details used across the website." />
      {loading && !data && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && <SettingsForm key={JSON.stringify(data.logo?.publicId) + data.hotelName} s={data} onSaved={reload} />}
    </RequireAdmin>
  );
}
