"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { Modal } from "@/components/admin/Modal";
import { RequireAdmin } from "@/components/admin/RequireAdmin";
import { useConfirm } from "@/components/admin/ConfirmProvider";
import { useToast } from "@/components/admin/ToastProvider";
import { EmptyState, ErrorState, Loading, PageHeading, StatusBadge, TableWrap, Td, Th, Toggle } from "@/components/admin/ui";
import { Button, ButtonLink } from "@/components/ui/Button";
import { useFetch } from "@/hooks/useFetch";
import { api, errorMessage } from "@/lib/adminApi";
import { formatCurrency } from "@/lib/utils";
import type { AdminRoom } from "@/types/admin";

function RoomPreview({ room, onClose }: { room: AdminRoom | null; onClose: () => void }) {
  return (
    <Modal open={room !== null} title={room?.name ?? ""} onClose={onClose} wide>
      {room && (
        <div className="space-y-4">
          {room.images.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              
              {room.images.map((i) => <img key={i.publicId} src={i.url} alt={i.alt || room.name} className="aspect-[4/3] w-full rounded-xl object-cover" />)}
            </div>
          ) : <p className="rounded-xl bg-stone-deep p-6 text-center text-slate-muted">No photos uploaded yet.</p>}
          <p className="text-slate-soft">{room.shortDescription}</p>
          <p>{room.description}</p>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-slate-muted">Price per night</dt><dd className="font-semibold">{formatCurrency(room.pricePerNight)}</dd></div>
            <div><dt className="text-slate-muted">Guests</dt><dd className="font-semibold">{room.maxAdults} adults, {room.maxChildren} children</dd></div>
            <div><dt className="text-slate-muted">Beds</dt><dd className="font-semibold">{room.bedConfiguration}</dd></div>
            <div><dt className="text-slate-muted">Rooms of this type</dt><dd className="font-semibold">{room.totalRooms}</dd></div>
          </dl>
          <ul className="flex flex-wrap gap-2">{room.amenities.map((a) => <li key={a} className="rounded-full bg-forest-mist px-3 py-1 text-xs font-medium text-forest-dark">{a}</li>)}</ul>
        </div>
      )}
    </Modal>
  );
}

export default function RoomsAdminPage() {
  const { data, loading, error, reload } = useFetch<AdminRoom[]>("/rooms?all=true&limit=100&sort=newest");
  const toast = useToast();
  const confirm = useConfirm();
  const [preview, setPreview] = useState<AdminRoom | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const patch = async (room: AdminRoom, change: Partial<Pick<AdminRoom, "isActive" | "featured">>, ok: string) => {
    setBusy(room.id);
    try { await api("PUT", `/rooms/${room.id}`, { body: change }); toast.success(ok); await reload(); }
    catch (err) { toast.error(errorMessage(err)); }
    finally { setBusy(null); }
  };

  const remove = async (room: AdminRoom) => {
    if (!(await confirm({ title: `Delete ${room.name}?`, message: "This permanently deletes the room and its photos. Rooms with pending or confirmed bookings cannot be deleted; deactivate them instead.", confirmLabel: "Delete room", danger: true }))) return;
    try { await api("DELETE", `/rooms/${room.id}`); toast.success("Room deleted"); await reload(); }
    catch (err) { toast.error(errorMessage(err)); }
  };

  return (
    <RequireAdmin>
      <PageHeading title="Rooms" description="Prices, capacity, photos and visibility for each room type." actions={<ButtonLink href="/admin/rooms/new"><Plus className="h-4 w-4" aria-hidden />Add room</ButtonLink>} />
      {loading && !data && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.length === 0 && <EmptyState title="No rooms yet" description="Add your first room type to start taking bookings." action={<ButtonLink href="/admin/rooms/new">Add room</ButtonLink>} />}
      {data && data.length > 0 && (
        <>
        <ul className="space-y-3 md:hidden" aria-label="Rooms">
          {data.map((r) => (
            <li key={r.id} className={`overflow-hidden rounded-xl2 border border-stone-line shadow-soft ${r.isActive ? "bg-white" : "bg-stone-deep/60"}`}>
              <div className="flex gap-3 p-4">
                {r.images[0] ? <img src={r.images[0].url} alt="" className="h-20 w-24 shrink-0 rounded-lg object-cover" /> : <div className="h-20 w-24 shrink-0 rounded-lg bg-stone-deep" aria-hidden />}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-forest-dark">{r.name}</p>
                  <p className="text-sm capitalize text-slate-soft">{r.roomType} · {r.totalRooms} unit{r.totalRooms > 1 ? "s" : ""} · {r.maxAdults}+{r.maxChildren} guests</p>
                  <p className="font-display text-lg text-forest-dark">{formatCurrency(r.pricePerNight)}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-line px-4 py-3">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-soft"><Toggle checked={r.isActive} disabled={busy === r.id} label={`Active: ${r.name}`} onChange={(v) => patch(r, { isActive: v }, v ? "Room activated" : "Room deactivated")} />Active</label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-soft"><Toggle checked={r.featured} disabled={busy === r.id} label={`Featured: ${r.name}`} onChange={(v) => patch(r, { featured: v }, v ? "Marked as featured" : "Removed from featured")} />Featured</label>
                </div>
                <div className="flex gap-1">
                  <Button variant="secondary" className="!p-2" onClick={() => setPreview(r)} aria-label={`Preview ${r.name}`}><Eye className="h-4 w-4" /></Button>
                  <Link href={`/admin/rooms/edit/${r.slug}`} aria-label={`Edit ${r.name}`} className="inline-flex rounded-full border border-forest/30 p-2 text-forest hover:bg-forest-mist"><Pencil className="h-4 w-4" /></Link>
                  <Button variant="secondary" className="!p-2 !text-red-700" onClick={() => remove(r)} aria-label={`Delete ${r.name}`}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className="hidden md:block">
        <TableWrap>
          <thead><tr><Th>Room</Th><Th>Type</Th><Th>Price / night</Th><Th>Guests</Th><Th>Units</Th><Th>Featured</Th><Th>Active</Th><Th className="text-right">Actions</Th></tr></thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.id} className={r.isActive ? "" : "bg-stone-deep/40"}>
                <Td>
                  <div className="flex items-center gap-3">
                    {r.images[0]  ? <img src={r.images[0].url} alt="" className="h-12 w-16 rounded-lg object-cover" /> : <div className="h-12 w-16 rounded-lg bg-stone-deep" aria-hidden />}
                    <div><p className="font-semibold text-forest-dark">{r.name}</p><p className="text-xs text-slate-muted">{r.images.length} photo{r.images.length === 1 ? "" : "s"}</p></div>
                  </div>
                </Td>
                <Td className="capitalize">{r.roomType}</Td>
                <Td>{formatCurrency(r.pricePerNight)}</Td>
                <Td>{r.maxAdults} + {r.maxChildren}</Td>
                <Td>{r.totalRooms}</Td>
                <Td><div className="flex items-center gap-2"><Toggle checked={r.featured} disabled={busy === r.id} label={`Featured: ${r.name}`} onChange={(v) => patch(r, { featured: v }, v ? "Marked as featured" : "Removed from featured")} /><Star className={`h-4 w-4 ${r.featured ? "fill-sand text-sand" : "text-stone-line"}`} aria-hidden /></div></Td>
                <Td><div className="flex items-center gap-2"><Toggle checked={r.isActive} disabled={busy === r.id} label={`Active: ${r.name}`} onChange={(v) => patch(r, { isActive: v }, v ? "Room activated" : "Room deactivated")} /><StatusBadge status={r.isActive ? "active" : "inactive"} /></div></Td>
                <Td>
                  <div className="flex justify-end gap-1">
                    <Button variant="secondary" className="!p-2" onClick={() => setPreview(r)} aria-label={`Preview ${r.name}`}><Eye className="h-4 w-4" /></Button>
                    <Link href={`/admin/rooms/edit/${r.slug}`} aria-label={`Edit ${r.name}`} className="inline-flex rounded-full border border-forest/30 p-2 text-forest hover:bg-forest-mist"><Pencil className="h-4 w-4" /></Link>
                    <Button variant="secondary" className="!p-2 !text-red-700" onClick={() => remove(r)} aria-label={`Delete ${r.name}`}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
        </div>
        </>
      )}
      <RoomPreview room={preview} onClose={() => setPreview(null)} />
    </RequireAdmin>
  );
}
