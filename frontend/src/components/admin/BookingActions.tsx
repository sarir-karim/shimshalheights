"use client";

import { useState } from "react";
import { Check, CheckCheck, Loader2, X, Ban } from "lucide-react";
import { Modal } from "@/components/admin/Modal";
import { useToast } from "@/components/admin/ToastProvider";
import { Button } from "@/components/ui/Button";
import { api, errorMessage } from "@/lib/adminApi";
import type { BookingRecord, BookingStatus } from "@/types/admin";

/** Mirrors the API's transition rules; the server enforces them regardless. */
const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ["confirmed", "rejected", "cancelled"], confirmed: ["cancelled", "completed"], rejected: [], cancelled: [], completed: [],
};
const COPY: Record<string, { label: string; title: string; message: string; danger?: boolean; icon: typeof Check }> = {
  confirmed: { label: "Confirm", title: "Confirm this booking?", message: "The room stays reserved and the booking becomes confirmed.", icon: Check },
  rejected: { label: "Reject", title: "Reject this request?", message: "The dates are released so other guests can book them. This cannot be undone.", danger: true, icon: X },
  cancelled: { label: "Cancel booking", title: "Cancel this booking?", message: "The dates are released so other guests can book them. This cannot be undone.", danger: true, icon: Ban },
  completed: { label: "Mark completed", title: "Mark as completed?", message: "Use this once the guest has stayed and checked out.", icon: CheckCheck },
};

export function BookingActions({ booking, onChanged, compact }: { booking: BookingRecord; onChanged: () => void; compact?: boolean }) {
  const toast = useToast();
  const [target, setTarget] = useState<BookingStatus | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const options = TRANSITIONS[booking.status];
  if (options.length === 0) return compact ? null : <p className="text-sm text-slate-muted">This booking is {booking.status} and can no longer be changed.</p>;

  const close = () => { setTarget(null); setNote(""); };
  const run = async () => {
    if (!target) return;
    setBusy(true);
    try {
      await api("PATCH", `/bookings/${booking.id}/status`, { body: { status: target, ...(note.trim() ? { note: note.trim() } : {}) } });
      toast.success(`Booking ${booking.bookingReference} is now ${target}`);
      close();
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
      close();
      onChanged(); // someone else may have changed it: refresh
    } finally { setBusy(false); }
  };

  const copy = target ? COPY[target] : null;
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {options.map((s) => {
          const c = COPY[s]; const Icon = c.icon;
          return (
            <Button key={s} variant={s === "confirmed" || s === "completed" ? "primary" : "secondary"} className={`!py-2 ${compact ? "!px-3 text-sm" : ""} ${c.danger ? "!text-red-700" : ""}`} onClick={() => setTarget(s)} aria-label={`${c.label} ${booking.bookingReference}`}>
              <Icon className="h-4 w-4" aria-hidden />{c.label}
            </Button>
          );
        })}
      </div>
      <Modal open={target !== null} title={copy?.title ?? ""} onClose={close}>
        <p className="text-slate-soft">{copy?.message}</p>
        <p className="mt-2 text-sm text-slate-muted">{booking.bookingReference} · {booking.guestName}</p>
        <label htmlFor="status-note" className="mt-4 block text-sm font-semibold text-forest-dark">Note (optional, saved in the history)</label>
        <textarea id="status-note" rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} className="input-field mt-1.5" />
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={close}>Back</Button>
          <Button onClick={run} disabled={busy} className={copy?.danger ? "!bg-red-700 hover:!bg-red-800" : ""}>{busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}{copy?.label}</Button>
        </div>
      </Modal>
    </>
  );
}
