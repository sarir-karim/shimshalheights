"use client";

import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { ImageManager } from "@/components/admin/ImageManager";
import { Modal } from "@/components/admin/Modal";
import { RequireAdmin } from "@/components/admin/RequireAdmin";
import { TagInput } from "@/components/admin/TagInput";
import { useConfirm } from "@/components/admin/ConfirmProvider";
import { useToast } from "@/components/admin/ToastProvider";
import { Card, EmptyState, ErrorState, Loading, PageHeading, StatusBadge, TableWrap, Td, Th, Toggle } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { useFetch } from "@/hooks/useFetch";
import { api, errorMessage, toFormData } from "@/lib/adminApi";
import { applyFieldErrors } from "@/lib/formErrors";
import { cn, formatCurrency } from "@/lib/utils";
import type { AdminMenuItem, RestaurantDoc } from "@/types/admin";

/* ---------------- Details tab ---------------- */
const detailsSchema = z.object({
  name: z.string().trim().min(2, "Enter the restaurant name").max(120),
  description: z.string().trim().max(4000),
  facilities: z.array(z.string()),
  openingHours: z.array(z.object({ label: z.string().trim().min(1, "Label required").max(60), hours: z.string().trim().min(1, "Hours required").max(80) })),
  categories: z.array(z.object({ id: z.string().optional(), name: z.string().trim().min(1, "Name required").max(60) })),
});
type DetailsValues = z.infer<typeof detailsSchema>;

function DetailsTab({ doc, onSaved }: { doc: RestaurantDoc; onSaved: () => void }) {
  const toast = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const { register, control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<DetailsValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      name: doc.name, description: doc.description, facilities: doc.facilities, openingHours: doc.openingHours,
      categories: [...doc.menuCategories].sort((a, b) => a.order - b.order).map((c) => ({ id: c.id, name: c.name })),
    },
  });
  const hours = useFieldArray({ control, name: "openingHours" });
  const cats = useFieldArray({ control, name: "categories" });

  const onSubmit = async (v: DetailsValues) => {
    try {
      const form = toFormData({
        name: v.name, description: v.description, facilities: v.facilities, openingHours: v.openingHours,
        menuCategories: v.categories.map((c, order) => ({ ...(c.id ? { id: c.id } : {}), name: c.name, order })),
        ...(removed.length ? { removeImages: removed } : {}),
      }, files, "images");
      await api("PUT", "/restaurant", { form });
      toast.success("Restaurant details saved");
      setFiles([]); setRemoved([]);
      onSaved();
    } catch (err) {
      if (!applyFieldErrors(err, setError)) toast.error(errorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6" aria-label="Restaurant details">
      <Card className="grid gap-5">
        <Field id="rs-name" label="Restaurant name" error={errors.name?.message}><input id="rs-name" className="input-field" {...register("name")} /></Field>
        <Field id="rs-desc" label="Introduction" error={errors.description?.message}><textarea id="rs-desc" rows={4} className="input-field" {...register("description")} /></Field>
        <Field id="rs-fac" label="Restaurant facilities" hint="Type a facility and press Enter.">
          <Controller control={control} name="facilities" render={({ field }) => <TagInput id="rs-fac" value={field.value} onChange={field.onChange} placeholder="Indoor dining, Room service…" />} />
        </Field>
      </Card>

      <Card>
        <h2 className="text-xl">Opening hours</h2>
        <ul className="mt-3 space-y-3">
          {hours.fields.map((f, i) => (
            <li key={f.id} className="grid gap-3 sm:grid-cols-[1fr_1.5fr_auto]">
              <Field id={`oh-l-${i}`} label="Label" error={errors.openingHours?.[i]?.label?.message}><input id={`oh-l-${i}`} placeholder="Breakfast" className="input-field" {...register(`openingHours.${i}.label`)} /></Field>
              <Field id={`oh-h-${i}`} label="Hours" error={errors.openingHours?.[i]?.hours?.message}><input id={`oh-h-${i}`} placeholder="07:00 to 10:00" className="input-field" {...register(`openingHours.${i}.hours`)} /></Field>
              <div className="flex items-end"><Button variant="secondary" className="!p-3 !text-red-700" onClick={() => hours.remove(i)} aria-label={`Remove opening hours row ${i + 1}`}><Trash2 className="h-4 w-4" /></Button></div>
            </li>
          ))}
        </ul>
        <Button variant="secondary" className="mt-4 !py-2" onClick={() => hours.append({ label: "", hours: "" })}><Plus className="h-4 w-4" aria-hidden />Add hours</Button>
      </Card>

      <Card>
        <h2 className="text-xl">Menu categories</h2>
        <p className="text-sm text-slate-muted">Order here is the order on the website. Categories that still contain dishes cannot be removed.</p>
        <ul className="mt-3 space-y-3">
          {cats.fields.map((f, i) => (
            <li key={f.id} className="flex items-start gap-2">
              <Field id={`cat-${i}`} label={`Category ${i + 1}`} error={errors.categories?.[i]?.name?.message} className="flex-1"><input id={`cat-${i}`} className="input-field" {...register(`categories.${i}.name`)} /></Field>
              <div className="mt-7 flex gap-1">
                <Button variant="secondary" className="!p-2.5" disabled={i === 0} onClick={() => cats.move(i, i - 1)} aria-label={`Move category ${i + 1} up`}><ArrowUp className="h-4 w-4" /></Button>
                <Button variant="secondary" className="!p-2.5" disabled={i === cats.fields.length - 1} onClick={() => cats.move(i, i + 1)} aria-label={`Move category ${i + 1} down`}><ArrowDown className="h-4 w-4" /></Button>
                <Button variant="secondary" className="!p-2.5 !text-red-700" onClick={() => cats.remove(i)} aria-label={`Remove category ${i + 1}`}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </li>
          ))}
        </ul>
        <Button variant="secondary" className="mt-4 !py-2" onClick={() => cats.append({ name: "" })}><Plus className="h-4 w-4" aria-hidden />Add category</Button>
      </Card>

      <Card><ImageManager label="Restaurant photos" existing={doc.images} newFiles={files} onNewFiles={setFiles} removed={removed} onRemovedChange={setRemoved} /></Card>

      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? (<><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Saving…</>) : "Save restaurant details"}</Button>
    </form>
  );
}

/* ---------------- Menu tab ---------------- */
const itemSchema = z.object({
  name: z.string().trim().min(2, "Enter a dish name").max(100),
  description: z.string().trim().max(500),
  category: z.string().min(1, "Choose a category"),
  price: z.coerce.number({ error: "Enter a price" }).min(0, "Price cannot be negative"),
  dietaryInformation: z.enum(["vegetarian", "non-vegetarian"]),
  isAvailable: z.boolean(),
});
type ItemValues = z.input<typeof itemSchema>;

function ItemForm({ item, doc, onClose, onSaved }: { item: AdminMenuItem | "new"; doc: RestaurantDoc; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const editing = item !== "new" ? item : null;
  const [files, setFiles] = useState<File[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const { register, control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<ItemValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: editing
      ? { name: editing.name, description: editing.description, category: editing.category, price: editing.price, dietaryInformation: editing.dietaryInformation, isAvailable: editing.isAvailable }
      : { name: "", description: "", category: doc.menuCategories[0]?.id ?? "", price: 0, dietaryInformation: "non-vegetarian", isAvailable: true },
  });

  const onSubmit = async (v: ItemValues) => {
    try {
      const replacingOrRemoving = files.length > 0 || removed.length > 0;
      const form = toFormData({ ...v, ...(removed.length && files.length === 0 ? { removeImage: true } : {}) }, files, "image");
      if (editing) await api("PUT", `/menu/${editing.id}`, replacingOrRemoving ? { form } : { body: v });
      else await api("POST", "/menu", { form });
      toast.success(editing ? "Dish updated" : "Dish added");
      onClose(); onSaved();
    } catch (err) {
      if (!applyFieldErrors(err, setError)) toast.error(errorMessage(err));
    }
  };

  return (
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2" aria-label="Menu item">
        <Field id="mi-name" label="Name" error={errors.name?.message} className="sm:col-span-2"><input id="mi-name" className="input-field" {...register("name")} /></Field>
        <Field id="mi-desc" label="Description" error={errors.description?.message} className="sm:col-span-2"><textarea id="mi-desc" rows={2} className="input-field" {...register("description")} /></Field>
        <Field id="mi-cat" label="Category" error={errors.category?.message}>
          <select id="mi-cat" className="input-field" {...register("category")}>{doc.menuCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </Field>
        <Field id="mi-price" label="Price (PKR)" error={errors.price?.message}><input id="mi-price" type="number" min={0} className="input-field" {...register("price")} /></Field>
        <Field id="mi-diet" label="Dietary label"><select id="mi-diet" className="input-field" {...register("dietaryInformation")}><option value="vegetarian">Vegetarian</option><option value="non-vegetarian">Non-vegetarian</option></select></Field>
        <div className="flex items-end pb-2"><Controller control={control} name="isAvailable" render={({ field }) => (<label className="flex items-center gap-3 text-sm font-semibold text-forest-dark"><Toggle checked={field.value} onChange={field.onChange} label="Available" />Available today</label>)} /></div>
        <div className="sm:col-span-2"><ImageManager label="Photo (optional)" existing={editing?.image ? [editing.image] : []} newFiles={files} onNewFiles={setFiles} removed={removed} onRemovedChange={setRemoved} multiple={false} /></div>
        <div className="flex justify-end gap-3 sm:col-span-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}Save dish</Button></div>
      </form>
  );
}

/** The form mounts only while the dialog is open, so every opening starts from a clean state. */
function ItemModal({ item, doc, onClose, onSaved }: { item: AdminMenuItem | "new" | null; doc: RestaurantDoc; onClose: () => void; onSaved: () => void }) {
  return (
    <Modal open={item !== null} title={item && item !== "new" ? `Edit ${item.name}` : "Add dish"} onClose={onClose} wide>
      {item !== null && <ItemForm item={item} doc={doc} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  );
}

function MenuTab({ doc }: { doc: RestaurantDoc }) {
  const [cat, setCat] = useState("");
  const { data, loading, error, reload } = useFetch<AdminMenuItem[]>(`/menu?limit=100${cat ? `&category=${cat}` : ""}`);
  const [modal, setModal] = useState<AdminMenuItem | "new" | null>(null);
  const toast = useToast();
  const confirm = useConfirm();
  const catName = (id: string) => doc.menuCategories.find((c) => c.id === id)?.name ?? "Unknown";

  const toggle = async (item: AdminMenuItem, isAvailable: boolean) => {
    try { await api("PUT", `/menu/${item.id}`, { body: { isAvailable } }); toast.success(`${item.name} ${isAvailable ? "is available" : "is unavailable"}`); await reload(); }
    catch (err) { toast.error(errorMessage(err)); }
  };
  const remove = async (item: AdminMenuItem) => {
    if (!(await confirm({ title: `Delete ${item.name}?`, message: "This removes the dish and its photo from the menu.", confirmLabel: "Delete dish", danger: true }))) return;
    try { await api("DELETE", `/menu/${item.id}`); toast.success("Dish deleted"); await reload(); } catch (err) { toast.error(errorMessage(err)); }
  };

  if (doc.menuCategories.length === 0) return <EmptyState title="Create a menu category first" description="Add categories (for example Breakfast, Mains) on the Details tab, then come back to add dishes." />;
  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div><label htmlFor="menu-cat" className="sr-only">Filter by category</label><select id="menu-cat" className="input-field !py-2.5" value={cat} onChange={(e) => setCat(e.target.value)}><option value="">All categories</option>{doc.menuCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <Button onClick={() => setModal("new")}><Plus className="h-4 w-4" aria-hidden />Add dish</Button>
      </div>
      {loading && !data && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.length === 0 && <EmptyState title="No dishes here yet" action={<Button onClick={() => setModal("new")}>Add dish</Button>} />}
      {data && data.length > 0 && (
        <TableWrap>
          <thead><tr><Th>Dish</Th><Th>Category</Th><Th>Price</Th><Th>Label</Th><Th>Available</Th><Th className="text-right">Actions</Th></tr></thead>
          <tbody>
            {data.map((m) => (
              <tr key={m.id} className={cn(!m.isAvailable && "bg-stone-deep/40")}>
                <Td><div className="flex items-center gap-3">{m.image  ? <img src={m.image.url} alt="" className="h-11 w-11 rounded-lg object-cover" /> : <div className="h-11 w-11 rounded-lg bg-stone-deep" aria-hidden />}<div><p className="font-semibold text-forest-dark">{m.name}</p><p className="line-clamp-1 text-xs text-slate-muted">{m.description}</p></div></div></Td>
                <Td>{catName(m.category)}</Td><Td>{formatCurrency(m.price)}</Td>
                <Td><StatusBadge status={m.dietaryInformation === "vegetarian" ? "published" : "draft"} /><span className="sr-only">{m.dietaryInformation}</span><span className="ml-2 text-xs text-slate-muted">{m.dietaryInformation === "vegetarian" ? "Veg" : "Non-veg"}</span></Td>
                <Td><Toggle checked={m.isAvailable} label={`Available: ${m.name}`} onChange={(v) => toggle(m, v)} /></Td>
                <Td><div className="flex justify-end gap-1"><Button variant="secondary" className="!p-2" onClick={() => setModal(m)} aria-label={`Edit ${m.name}`}><Pencil className="h-4 w-4" /></Button><Button variant="secondary" className="!p-2 !text-red-700" onClick={() => remove(m)} aria-label={`Delete ${m.name}`}><Trash2 className="h-4 w-4" /></Button></div></Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
      <ItemModal item={modal} doc={doc} onClose={() => setModal(null)} onSaved={reload} />
    </>
  );
}

export default function RestaurantAdminPage() {
  const { data, loading, error, reload } = useFetch<RestaurantDoc>("/restaurant");
  const [tab, setTab] = useState<"details" | "menu">("details");
  return (
    <RequireAdmin>
      <PageHeading title="Restaurant" description="Introduction, opening hours, photos and the menu." />
      <div role="tablist" aria-label="Restaurant sections" className="mb-6 flex gap-2">
        {(["details", "menu"] as const).map((t) => (
          <button key={t} role="tab" id={`tab-${t}`} aria-selected={tab === t} aria-controls={`panel-${t}`} type="button" onClick={() => setTab(t)}
            className={cn("rounded-full border px-5 py-2 text-sm font-semibold capitalize", tab === t ? "border-forest bg-forest text-stone" : "border-stone-line bg-white text-slate-soft hover:border-forest")}>{t === "details" ? "Details & categories" : "Menu items"}</button>
        ))}
      </div>
      {loading && !data && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === "details" ? <DetailsTab key={JSON.stringify(data.menuCategories.map((c) => c.id)) + data.images.length} doc={data} onSaved={reload} /> : <MenuTab doc={data} />}
        </div>
      )}
    </RequireAdmin>
  );
}
