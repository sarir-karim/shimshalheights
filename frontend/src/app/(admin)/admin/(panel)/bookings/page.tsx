"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BookingActions } from "@/components/admin/BookingActions";
import { EmptyState, ErrorState, Loading, PageHeading, Pagination, SearchBox, StatusBadge, TableWrap, Td, Th } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { buildQuery } from "@/lib/adminApi";
import { useDebounced, useFetch } from "@/hooks/useFetch";
import { fmtDate, isoDay } from "@/lib/format";
import { formatCurrency } from "@/lib/utils";
import type { BookingRecord } from "@/types/admin";

const sel = "input-field !py-2.5";

function BookingsList() {
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [payment, setPayment] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const dq = useDebounced(q);

  const path = `/bookings${buildQuery({ q: dq, status, paymentStatus: payment, from, to, sort, page, limit: 15 })}`;
  const { data, meta, loading, error, reload } = useFetch<BookingRecord[]>(path);
  const reset = (fn: () => void) => { fn(); setPage(1); };
  const filtered = Boolean(q || status || payment || from || to);
  const clear = () => { setQ(""); setStatus(""); setPayment(""); setFrom(""); setTo(""); setSort("newest"); setPage(1); };

  return (
    <>
      <PageHeading title="Bookings" description="Review requests, confirm or reject them, and track payments." />
      <form onSubmit={(e) => e.preventDefault()} aria-label="Filter bookings" className="mb-5 grid gap-3 rounded-xl2 border border-stone-line bg-white p-4 shadow-soft sm:grid-cols-2 lg:grid-cols-6">
        <div className="sm:col-span-2"><SearchBox value={q} onChange={(v) => reset(() => setQ(v))} placeholder="Reference or guest name" label="Search by reference or guest name" /></div>
        <div><label htmlFor="f-status" className="sr-only">Status</label>
          <select id="f-status" className={sel} value={status} onChange={(e) => reset(() => setStatus(e.target.value))}><option value="">All statuses</option>{["pending", "confirmed", "completed", "rejected", "cancelled"].map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}</select></div>
        <div><label htmlFor="f-pay" className="sr-only">Payment</label>
          <select id="f-pay" className={sel} value={payment} onChange={(e) => reset(() => setPayment(e.target.value))}><option value="">Any payment</option>{["unpaid", "paid", "refunded"].map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
        <div><label htmlFor="f-from" className="text-xs font-semibold text-slate-muted">Check-in from</label><input id="f-from" type="date" className={sel} value={from} onChange={(e) => reset(() => setFrom(e.target.value))} /></div>
        <div><label htmlFor="f-to" className="text-xs font-semibold text-slate-muted">Check-in until</label><input id="f-to" type="date" className={sel} value={to} min={from || undefined} onChange={(e) => reset(() => setTo(e.target.value))} /></div>
        <div className="sm:col-span-2 lg:col-span-2"><label htmlFor="f-sort" className="sr-only">Sort</label>
          <select id="f-sort" className={sel} value={sort} onChange={(e) => reset(() => setSort(e.target.value))}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="checkin-asc">Check-in: soonest</option><option value="checkin-desc">Check-in: latest</option></select></div>
        {filtered && <div className="flex items-end"><Button variant="secondary" className="!py-2.5" onClick={clear}>Clear filters</Button></div>}
      </form>

      {loading && !data && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.length === 0 && <EmptyState title={filtered ? "No bookings match those filters" : "No bookings yet"} description={filtered ? "Try a different search or clear the filters." : "Requests from the website will show up here."} action={filtered ? <Button variant="secondary" onClick={clear}>Clear filters</Button> : undefined} />}
      {data && data.length > 0 && (
        <div aria-busy={loading}>
          <ul className="space-y-3 md:hidden" aria-label="Bookings">
            {data.map((b) => (
              <li key={b.id} className="rounded-xl2 border border-stone-line bg-white p-4 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/admin/bookings/${b.id}`} className="font-semibold text-forest hover:underline">{b.bookingReference}</Link>
                  <div className="flex flex-wrap justify-end gap-1.5"><StatusBadge status={b.status} /><StatusBadge status={b.paymentStatus} /></div>
                </div>
                <p className="mt-2 font-medium text-forest-dark">{b.guestName}</p>
                <p className="text-sm text-slate-soft">{b.roomName}{b.numberOfRooms > 1 ? ` × ${b.numberOfRooms}` : ""} · {b.numberOfNights} night{b.numberOfNights > 1 ? "s" : ""}</p>
                <p className="text-sm text-slate-soft">{fmtDate(isoDay(b.checkIn))} to {fmtDate(isoDay(b.checkOut))}</p>
                <p className="mt-1 font-display text-lg text-forest-dark">{formatCurrency(b.totalPrice)}</p>
                <div className="mt-3"><BookingActions booking={b} onChanged={reload} compact /></div>
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
          <TableWrap>
            <thead><tr><Th>Reference</Th><Th>Guest</Th><Th>Room</Th><Th>Check-in</Th><Th>Nights</Th><Th>Total</Th><Th>Status</Th><Th>Payment</Th><Th className="text-right">Actions</Th></tr></thead>
            <tbody>
              {data.map((b) => (
                <tr key={b.id}>
                  <Td><Link href={`/admin/bookings/${b.id}`} className="font-semibold text-forest hover:underline">{b.bookingReference}</Link></Td>
                  <Td><p>{b.guestName}</p><p className="text-xs text-slate-muted">{b.guestPhone}</p></Td>
                  <Td>{b.roomName}{b.numberOfRooms > 1 && <span className="text-slate-muted"> × {b.numberOfRooms}</span>}</Td>
                  <Td className="whitespace-nowrap">{fmtDate(isoDay(b.checkIn))}</Td>
                  <Td>{b.numberOfNights}</Td>
                  <Td>{formatCurrency(b.totalPrice)}</Td>
                  <Td><StatusBadge status={b.status} /></Td>
                  <Td><StatusBadge status={b.paymentStatus} /></Td>
                  <Td><div className="flex justify-end"><BookingActions booking={b} onChanged={reload} compact /></div></Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          </div>
          <Pagination meta={meta} onPage={setPage} />
        </div>
      )}
    </>
  );
}

export default function BookingsPage() {
  return <Suspense fallback={<Loading />}><BookingsList /></Suspense>;
}
