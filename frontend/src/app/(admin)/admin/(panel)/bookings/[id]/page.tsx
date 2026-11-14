"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Mail, MessageCircle, Phone } from "lucide-react";
import { BookingActions } from "@/components/admin/BookingActions";
import { useToast } from "@/components/admin/ToastProvider";
import { Card, ErrorState, Loading, PageHeading, StatusBadge } from "@/components/admin/ui";
import { useFetch } from "@/hooks/useFetch";
import { api, errorMessage } from "@/lib/adminApi";
import { fmtDate, fmtDateTime, isoDay } from "@/lib/format";
import { formatCurrency } from "@/lib/utils";
import type { BookingRecord, PaymentStatus } from "@/types/admin";

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex justify-between gap-4 border-b border-stone-line/70 py-2.5 last:border-0"><dt className="text-slate-muted">{label}</dt><dd className="text-right font-medium text-forest-dark">{children}</dd></div>
);

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: b, loading, error, reload } = useFetch<BookingRecord>(`/bookings/${id}`);
  const toast = useToast();
  const [paying, setPaying] = useState(false);

  const setPayment = async (paymentStatus: PaymentStatus) => {
    setPaying(true);
    try { await api("PATCH", `/bookings/${id}/payment`, { body: { paymentStatus } }); toast.success(`Payment marked ${paymentStatus}`); await reload(); }
    catch (err) { toast.error(errorMessage(err)); }
    finally { setPaying(false); }
  };

  const roomName = b ? (typeof b.room === "string" ? b.roomName : b.room.name) : "";
  const wa = b ? b.guestPhone.replace(/\D/g, "") : "";

  return (
    <>
      <Link href="/admin/bookings" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-forest hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden />All bookings</Link>
      {loading && !b && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {b && (
        <>
          <PageHeading title={b.bookingReference} description={`Requested ${fmtDateTime(b.createdAt)}`} actions={<div className="flex items-center gap-2"><StatusBadge status={b.status} /><StatusBadge status={b.paymentStatus} /></div>} />
          <Card className="mb-6"><h2 className="mb-3 text-xl">Actions</h2><BookingActions booking={b} onChanged={reload} /></Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="mb-2 text-xl">Guest</h2>
              <dl><Row label="Name">{b.guestName}</Row><Row label="Email"><a className="text-forest hover:underline" href={`mailto:${b.guestEmail}`}>{b.guestEmail}</a></Row><Row label="Phone"><a className="text-forest hover:underline" href={`tel:${b.guestPhone}`}>{b.guestPhone}</a></Row></dl>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={`mailto:${b.guestEmail}?subject=${encodeURIComponent(`Your booking ${b.bookingReference}`)}`} className="inline-flex items-center gap-2 rounded-full border border-forest/30 px-4 py-2 text-sm font-semibold text-forest hover:bg-forest-mist"><Mail className="h-4 w-4" aria-hidden />Email</a>
                <a href={`tel:${b.guestPhone}`} className="inline-flex items-center gap-2 rounded-full border border-forest/30 px-4 py-2 text-sm font-semibold text-forest hover:bg-forest-mist"><Phone className="h-4 w-4" aria-hidden />Call</a>
                <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-forest/30 px-4 py-2 text-sm font-semibold text-forest hover:bg-forest-mist"><MessageCircle className="h-4 w-4" aria-hidden />WhatsApp</a>
              </div>
              {b.specialRequests && <div className="mt-4 rounded-xl bg-sand-light/40 p-4"><p className="text-sm font-semibold text-forest-dark">Special requests</p><p className="mt-1 whitespace-pre-wrap text-slate-soft">{b.specialRequests}</p></div>}
            </Card>

            <Card>
              <h2 className="mb-2 text-xl">Stay</h2>
              <dl>
                <Row label="Room">{roomName}{b.numberOfRooms > 1 ? ` × ${b.numberOfRooms}` : ""}</Row>
                <Row label="Check-in">{fmtDate(isoDay(b.checkIn))}</Row><Row label="Check-out">{fmtDate(isoDay(b.checkOut))}</Row>
                <Row label="Nights">{b.numberOfNights}</Row>
                <Row label="Guests">{b.numberOfAdults} adult{b.numberOfAdults > 1 ? "s" : ""}{b.numberOfChildren > 0 ? `, ${b.numberOfChildren} child${b.numberOfChildren > 1 ? "ren" : ""}` : ""}</Row>
                <Row label="Price per night">{formatCurrency(b.pricePerNight)}</Row>
                <Row label="Total">{formatCurrency(b.totalPrice)}</Row>
              </dl>
              <div className="mt-4 border-t border-stone-line pt-4">
                <label htmlFor="pay" className="text-sm font-semibold text-forest-dark">Payment status</label>
                <select id="pay" className="input-field mt-1.5 max-w-xs capitalize" value={b.paymentStatus} disabled={paying} onChange={(e) => setPayment(e.target.value as PaymentStatus)}>
                  {(["unpaid", "paid", "refunded"] as const).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <p className="mt-1 text-xs text-slate-muted">Refunds are only possible for paid bookings. Online payment is not enabled yet, so update this by hand.</p>
              </div>
            </Card>
          </div>

          <Card className="mt-6">
            <h2 className="mb-4 text-xl">History</h2>
            <ol className="relative space-y-5 border-l-2 border-stone-line pl-6">
              {b.statusHistory.map((h, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[1.95rem] top-1.5 h-3 w-3 rounded-full bg-forest" aria-hidden />
                  <p className="flex flex-wrap items-center gap-2"><StatusBadge status={h.status} /><span className="text-sm text-slate-muted">{fmtDateTime(h.at)} by {h.by === "guest" ? "guest" : "staff"}</span></p>
                  {h.note && <p className="mt-1 text-slate-soft">{h.note}</p>}
                </li>
              ))}
            </ol>
          </Card>
        </>
      )}
    </>
  );
}
