"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/admin/Modal";
import { RequireAdmin } from "@/components/admin/RequireAdmin";
import { useConfirm } from "@/components/admin/ConfirmProvider";
import { useToast } from "@/components/admin/ToastProvider";
import { EmptyState, ErrorState, Loading, PageHeading, TableWrap, Td, Th, Toggle } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { StarRating } from "@/components/ui/StarRating";
import { useFetch } from "@/hooks/useFetch";
import { api, errorMessage } from "@/lib/adminApi";
import { applyFieldErrors } from "@/lib/formErrors";
import type { TestimonialRecord } from "@/types/admin";

const schema = z.object({
  guestName: z.string().trim().min(1, "Enter the guest name").max(80),
  guestLocation: z.string().trim().max(80),
  rating: z.coerce.number().int().min(1).max(5),
  review: z.string().trim().min(5, "Write at least 5 characters").max(1500),
  isFeatured: z.boolean(),
  isPublished: z.boolean(),
});
type Values = z.input<typeof schema>;

function TestimonialModal({ item, onClose, onSaved }: { item: TestimonialRecord | "new" | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const editing = item && item !== "new" ? item : null;
  const { register, control, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema) });
  useEffect(() => {
    if (item === null) return;
    reset(editing ? { guestName: editing.guestName, guestLocation: editing.guestLocation, rating: editing.rating, review: editing.review, isFeatured: editing.isFeatured, isPublished: editing.isPublished }
      : { guestName: "", guestLocation: "", rating: 5, review: "", isFeatured: false, isPublished: false });
  }, [item, editing, reset]);

  const onSubmit = async (v: Values) => {
    try {
      if (editing) await api("PUT", `/testimonials/${editing.id}`, { body: v }); else await api("POST", "/testimonials", { body: v });
      toast.success(editing ? "Testimonial updated" : "Testimonial added");
      onClose(); onSaved();
    } catch (err) { if (!applyFieldErrors(err, setError)) toast.error(errorMessage(err)); }
  };

  return (
    <Modal open={item !== null} title={editing ? "Edit testimonial" : "Add testimonial"} onClose={onClose} wide>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2" aria-label="Testimonial">
        <Field id="t-name" label="Guest name" error={errors.guestName?.message}><input id="t-name" className="input-field" {...register("guestName")} /></Field>
        <Field id="t-loc" label="Guest location (optional)" error={errors.guestLocation?.message}><input id="t-loc" className="input-field" {...register("guestLocation")} /></Field>
        <Field id="t-rating" label="Rating" error={errors.rating?.message}><select id="t-rating" className="input-field" {...register("rating")}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>)}</select></Field>
        <div className="flex flex-col justify-end gap-3 pb-1">
          <Controller control={control} name="isPublished" render={({ field }) => <label className="flex items-center gap-3 text-sm font-semibold text-forest-dark"><Toggle checked={!!field.value} onChange={field.onChange} label="Published" />Published on website</label>} />
          <Controller control={control} name="isFeatured" render={({ field }) => <label className="flex items-center gap-3 text-sm font-semibold text-forest-dark"><Toggle checked={!!field.value} onChange={field.onChange} label="Featured" />Featured</label>} />
        </div>
        <Field id="t-review" label="Review" error={errors.review?.message} className="sm:col-span-2"><textarea id="t-review" rows={4} className="input-field" {...register("review")} /></Field>
        <div className="flex justify-end gap-3 sm:col-span-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}Save</Button></div>
      </form>
    </Modal>
  );
}

export default function TestimonialsAdminPage() {
  const { data, loading, error, reload } = useFetch<TestimonialRecord[]>("/testimonials?all=true&limit=100");
  const [modal, setModal] = useState<TestimonialRecord | "new" | null>(null);
  const toast = useToast();
  const confirm = useConfirm();

  const patch = async (t: TestimonialRecord, body: Partial<TestimonialRecord>, msg: string) => {
    try { await api("PUT", `/testimonials/${t.id}`, { body }); toast.success(msg); await reload(); } catch (err) { toast.error(errorMessage(err)); }
  };
  const remove = async (t: TestimonialRecord) => {
    if (!(await confirm({ title: "Delete this testimonial?", message: `The review from ${t.guestName} will be permanently removed.`, confirmLabel: "Delete", danger: true }))) return;
    try { await api("DELETE", `/testimonials/${t.id}`); toast.success("Testimonial deleted"); await reload(); } catch (err) { toast.error(errorMessage(err)); }
  };

  return (
    <RequireAdmin>
      <PageHeading title="Testimonials" description="Only published reviews appear on the website." actions={<Button onClick={() => setModal("new")}><Plus className="h-4 w-4" aria-hidden />Add testimonial</Button>} />
      {loading && !data && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.length === 0 && <EmptyState title="No testimonials yet" description="Add real guest reviews here, then publish them." action={<Button onClick={() => setModal("new")}>Add testimonial</Button>} />}
      {data && data.length > 0 && (
        <TableWrap>
          <thead><tr><Th>Guest</Th><Th>Rating</Th><Th>Review</Th><Th>Published</Th><Th>Featured</Th><Th className="text-right">Actions</Th></tr></thead>
          <tbody>
            {data.map((t) => (
              <tr key={t.id}>
                <Td><p className="font-semibold text-forest-dark">{t.guestName}</p><p className="text-xs text-slate-muted">{t.guestLocation}</p></Td>
                <Td><StarRating rating={t.rating} /></Td>
                <Td className="max-w-xs"><p className="line-clamp-2 text-slate-soft">{t.review}</p></Td>
                <Td><Toggle checked={t.isPublished} label={`Published: ${t.guestName}`} onChange={(v) => patch(t, { isPublished: v }, v ? "Published" : "Unpublished")} /></Td>
                <Td><Toggle checked={t.isFeatured} label={`Featured: ${t.guestName}`} onChange={(v) => patch(t, { isFeatured: v }, v ? "Marked featured" : "Removed from featured")} /></Td>
                <Td><div className="flex justify-end gap-1"><Button variant="secondary" className="!p-2" onClick={() => setModal(t)} aria-label={`Edit review by ${t.guestName}`}><Pencil className="h-4 w-4" /></Button><Button variant="secondary" className="!p-2 !text-red-700" onClick={() => remove(t)} aria-label={`Delete review by ${t.guestName}`}><Trash2 className="h-4 w-4" /></Button></div></Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
      <TestimonialModal item={modal} onClose={() => setModal(null)} onSaved={reload} />
    </RequireAdmin>
  );
}
