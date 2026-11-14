"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Pencil, Plus, Star, Trash2, Upload } from "lucide-react";
import { ImageManager } from "@/components/admin/ImageManager";
import { Modal } from "@/components/admin/Modal";
import { RequireAdmin } from "@/components/admin/RequireAdmin";
import { useConfirm } from "@/components/admin/ConfirmProvider";
import { useToast } from "@/components/admin/ToastProvider";
import { EmptyState, ErrorState, Loading, PageHeading, StatusBadge, Toggle } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { galleryCategories } from "@/components/gallery/GalleryGrid";
import { useFetch } from "@/hooks/useFetch";
import { api, errorMessage, toFormData } from "@/lib/adminApi";
import { applyFieldErrors } from "@/lib/formErrors";
import type { GalleryRecord } from "@/types/admin";

const cats = galleryCategories as [string, ...string[]];
const schema = z.object({
  title: z.string().trim().max(120),
  category: z.enum(cats),
  description: z.string().trim().max(500),
  isFeatured: z.boolean(),
  isActive: z.boolean(),
});
type Values = z.infer<typeof schema>;

function GalleryForm({ item, onClose, onSaved }: { item: GalleryRecord | "new"; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const editing = item !== "new" ? item : null;
  const [files, setFiles] = useState<File[]>([]);
  const [noFileError, setNoFileError] = useState(false);
  const { register, control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: editing ? { title: editing.title, category: editing.category, description: editing.description, isFeatured: editing.isFeatured, isActive: editing.isActive }
      : { title: "", category: "Mountains & Nature", description: "", isFeatured: false, isActive: true },
  });

  const onSubmit = async (v: Values) => {
    if (!editing && files.length === 0) { setNoFileError(true); return; }
    if (editing && !v.title.trim()) { setError("title", { message: "Enter a title" }); return; }
    try {
      if (editing) {
        await api("PUT", `/gallery/${editing.id}`, files.length ? { form: toFormData(v, files, "image") } : { body: v });
        toast.success("Image updated");
      } else {
        await api("POST", "/gallery", { form: toFormData({ ...v, title: v.title || undefined }, files, "images") });
        toast.success(`${files.length} image${files.length > 1 ? "s" : ""} uploaded`);
      }
      onClose(); onSaved();
    } catch (err) { if (!applyFieldErrors(err, setError)) toast.error(errorMessage(err)); }
  };

  return (
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2" aria-label="Gallery image">
        <div className="sm:col-span-2">
          <ImageManager label={editing ? "Picture" : "Images to upload"} existing={editing ? [{ url: editing.imageUrl, publicId: editing.cloudinaryPublicId, alt: editing.title }] : []}
            newFiles={files} onNewFiles={(f) => { setFiles(f); setNoFileError(false); }} removed={[]} onRemovedChange={() => undefined} multiple={!editing} />
          {noFileError && <p role="alert" className="mt-1 text-sm text-red-700">Choose at least one image.</p>}
        </div>
        <Field id="g-title" label={editing ? "Title" : "Title (optional)"} error={errors.title?.message} hint={editing ? undefined : "Several images get numbered titles; blank uses the file name."}><input id="g-title" className="input-field" {...register("title")} /></Field>
        <Field id="g-cat" label="Category" error={errors.category?.message}><select id="g-cat" className="input-field" {...register("category")}>{galleryCategories.map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field id="g-desc" label="Description (optional)" error={errors.description?.message} className="sm:col-span-2"><textarea id="g-desc" rows={2} className="input-field" {...register("description")} /></Field>
        <div className="flex flex-wrap gap-6 sm:col-span-2">
          <Controller control={control} name="isFeatured" render={({ field }) => <label className="flex items-center gap-3 text-sm font-semibold text-forest-dark"><Toggle checked={field.value} onChange={field.onChange} label="Featured" />Featured on homepage</label>} />
          <Controller control={control} name="isActive" render={({ field }) => <label className="flex items-center gap-3 text-sm font-semibold text-forest-dark"><Toggle checked={field.value} onChange={field.onChange} label="Visible" />Visible on website</label>} />
        </div>
        <div className="flex justify-end gap-3 sm:col-span-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Upload className="h-4 w-4" aria-hidden />}{editing ? "Save" : "Upload"}</Button></div>
      </form>
  );
}

/** The form mounts only while the dialog is open, so every opening starts from a clean state. */
function GalleryModal({ item, onClose, onSaved }: { item: GalleryRecord | "new" | null; onClose: () => void; onSaved: () => void }) {
  return (
    <Modal open={item !== null} title={item && item !== "new" ? "Edit image" : "Upload images"} onClose={onClose} wide>
      {item !== null && <GalleryForm item={item} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  );
}

export default function GalleryAdminPage() {
  const [cat, setCat] = useState("");
  const { data, loading, error, reload } = useFetch<GalleryRecord[]>(`/gallery?all=true&limit=100${cat ? `&category=${encodeURIComponent(cat)}` : ""}`);
  const [modal, setModal] = useState<GalleryRecord | "new" | null>(null);
  const toast = useToast();
  const confirm = useConfirm();

  const patch = async (g: GalleryRecord, body: Partial<GalleryRecord>, msg: string) => {
    try { await api("PUT", `/gallery/${g.id}`, { body }); toast.success(msg); await reload(); } catch (err) { toast.error(errorMessage(err)); }
  };
  const remove = async (g: GalleryRecord) => {
    if (!(await confirm({ title: `Delete "${g.title}"?`, message: "The picture is removed from the website and from Cloudinary.", confirmLabel: "Delete image", danger: true }))) return;
    try { await api("DELETE", `/gallery/${g.id}`); toast.success("Image deleted"); await reload(); } catch (err) { toast.error(errorMessage(err)); }
  };

  return (
    <RequireAdmin>
      <PageHeading title="Gallery" description="Photos shown on the website gallery and homepage." actions={<Button onClick={() => setModal("new")}><Plus className="h-4 w-4" aria-hidden />Upload images</Button>} />
      <div className="mb-5"><label htmlFor="gal-cat" className="sr-only">Category</label><select id="gal-cat" className="input-field max-w-xs !py-2.5" value={cat} onChange={(e) => setCat(e.target.value)}><option value="">All categories</option>{galleryCategories.map((c) => <option key={c}>{c}</option>)}</select></div>
      {loading && !data && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.length === 0 && <EmptyState title="No images here yet" description="Upload photos of the hotel, rooms, food and the valley." action={<Button onClick={() => setModal("new")}>Upload images</Button>} />}
      {data && data.length > 0 && (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.map((g) => (
            <li key={g.id} className="overflow-hidden rounded-xl2 border border-stone-line bg-white shadow-soft">
              <div className="relative">
                                <img src={g.imageUrl} alt={g.title} className={`aspect-[4/3] w-full object-cover ${g.isActive ? "" : "opacity-40"}`} />
                {g.isFeatured && <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1 text-xs font-semibold text-slate"><Star className="h-3 w-3 fill-current" aria-hidden />Featured</span>}
              </div>
              <div className="p-4">
                <p className="truncate font-semibold text-forest-dark">{g.title}</p>
                <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-muted">{g.category}<StatusBadge status={g.isActive ? "active" : "inactive"} /></p>
                <div className="mt-3 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-soft"><Toggle checked={g.isFeatured} label={`Featured: ${g.title}`} onChange={(v) => patch(g, { isFeatured: v }, v ? "Marked featured" : "Removed from featured")} />Featured</label>
                  <div className="flex gap-1"><Button variant="secondary" className="!p-2" onClick={() => setModal(g)} aria-label={`Edit ${g.title}`}><Pencil className="h-4 w-4" /></Button><Button variant="secondary" className="!p-2 !text-red-700" onClick={() => remove(g)} aria-label={`Delete ${g.title}`}><Trash2 className="h-4 w-4" /></Button></div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <GalleryModal item={modal} onClose={() => setModal(null)} onSaved={reload} />
    </RequireAdmin>
  );
}
