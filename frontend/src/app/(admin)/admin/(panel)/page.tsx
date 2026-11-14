"use client";

import Link from "next/link";
import { BedDouble, CalendarCheck, Clock, DollarSign, XCircle, CheckCircle2, Mail } from "lucide-react";
import { BarChart, LineChart } from "@/components/admin/charts/charts";
import { Card, EmptyState, ErrorState, Loading, PageHeading, StatusBadge, TableWrap, Td, Th } from "@/components/admin/ui";
import { useAuth } from "@/components/admin/AuthProvider";
import { useFetch } from "@/hooks/useFetch";
import { fmtDate, fmtDateTime, isoDay } from "@/lib/format";
import { formatCurrency } from "@/lib/utils";
import type { DashboardStats } from "@/types/admin";

function StatCard({ label, value, icon: Icon, hint, href }: { label: string; value: string | number; icon: typeof BedDouble; hint?: string; href?: string }) {
  const body = (
    <Card className="h-full transition-shadow hover:shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-soft">{label}</p>
        <span className="rounded-full bg-forest-mist p-2 text-forest"><Icon className="h-4 w-4" aria-hidden /></span>
      </div>
      <p className="mt-3 font-display text-3xl text-forest-dark">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-muted">{hint}</p>}
    </Card>
  );
  return href ? <Link href={href} className="block h-full">{body}</Link> : body;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: s, loading, error, reload } = useFetch<DashboardStats>("/admin/stats");

  return (
    <>
      <PageHeading title="Dashboard" description={`Welcome back, ${user?.name?.split(" ")[0] ?? ""}. Here is how the hotel is doing.`} />
      {loading && !s && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {s && (
        <div className="space-y-8">
          <section aria-label="Summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total bookings" value={s.bookings.total} icon={CalendarCheck} href="/admin/bookings" />
            <StatCard label="Pending" value={s.bookings.pending} icon={Clock} hint="Waiting for you" href="/admin/bookings?status=pending" />
            <StatCard label="Confirmed" value={s.bookings.confirmed} icon={CheckCircle2} href="/admin/bookings?status=confirmed" />
            <StatCard label="Cancelled" value={s.bookings.cancelled} icon={XCircle} href="/admin/bookings?status=cancelled" />
            <StatCard label="Total rooms" value={s.rooms.total} icon={BedDouble} hint={`${s.rooms.roomTypes} room types`} />
            <StatCard label="Available tonight" value={s.rooms.availableTonight} icon={BedDouble} hint="Rooms not reserved" />
            <StatCard label="Reserved tonight" value={s.rooms.reservedTonight} icon={BedDouble} hint="Pending and confirmed" />
            <StatCard label="Revenue (paid)" value={formatCurrency(s.revenue.paid)} icon={DollarSign} hint="Bookings marked paid" />
          </section>

          <section aria-label="Trends" className="grid gap-6 lg:grid-cols-2">
            <Card><h2 className="mb-2 text-xl">Booking requests per month</h2><BarChart title="Booking requests per month" points={s.trends.bookingsByMonth} /></Card>
            <Card><h2 className="mb-2 text-xl">Paid revenue by stay month</h2><LineChart title="Paid revenue by stay month" points={s.trends.revenueByMonth} /></Card>
          </section>

          <section aria-labelledby="recent-b">
            <div className="mb-3 flex items-center justify-between"><h2 id="recent-b" className="text-2xl">Recent bookings</h2><Link href="/admin/bookings" className="text-sm font-semibold text-forest hover:underline">View all</Link></div>
            {s.recentBookings.length === 0 ? <EmptyState title="No bookings yet" description="New booking requests from the website will appear here." /> : (
              <TableWrap>
                <thead><tr><Th>Reference</Th><Th>Guest</Th><Th>Room</Th><Th>Stay</Th><Th>Total</Th><Th>Status</Th></tr></thead>
                <tbody>
                  {s.recentBookings.map((b) => (
                    <tr key={b.id}>
                      <Td><Link href={`/admin/bookings/${b.id}`} className="font-semibold text-forest hover:underline">{b.bookingReference}</Link></Td>
                      <Td>{b.guestName}</Td><Td>{b.roomName}</Td>
                      <Td className="whitespace-nowrap">{fmtDate(isoDay(b.checkIn))} to {fmtDate(isoDay(b.checkOut))}</Td>
                      <Td>{formatCurrency(b.totalPrice)}</Td><Td><StatusBadge status={b.status} /></Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            )}
          </section>

          <section aria-labelledby="recent-m">
            <div className="mb-3 flex items-center justify-between"><h2 id="recent-m" className="text-2xl">Recent messages {s.unreadMessages > 0 && <span className="ml-2 rounded-full bg-red-700 px-2.5 py-0.5 align-middle text-xs font-bold text-white">{s.unreadMessages} unread</span>}</h2><Link href="/admin/messages" className="text-sm font-semibold text-forest hover:underline">View all</Link></div>
            {s.recentMessages.length === 0 ? <EmptyState title="No messages yet" /> : (
              <ul className="divide-y divide-stone-line rounded-xl2 border border-stone-line bg-white shadow-soft">
                {s.recentMessages.map((m) => (
                  <li key={m.id}>
                    <Link href="/admin/messages" className="flex items-start gap-3 px-5 py-4 hover:bg-stone-deep/50">
                      <Mail className={`mt-1 h-5 w-5 shrink-0 ${m.isRead ? "text-slate-muted" : "text-forest"}`} aria-hidden />
                      <div className="min-w-0 flex-1"><p className={`truncate ${m.isRead ? "" : "font-semibold text-forest-dark"}`}>{m.subject}</p><p className="truncate text-sm text-slate-soft">{m.name}: {m.message}</p></div>
                      <p className="shrink-0 text-xs text-slate-muted">{fmtDateTime(m.createdAt)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </>
  );
}
