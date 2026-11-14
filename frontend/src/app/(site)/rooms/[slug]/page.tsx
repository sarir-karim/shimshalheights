import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, Clock } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { RoomGallery } from "@/components/rooms/RoomGallery";
import { RoomCard } from "@/components/rooms/RoomCard";
import { RoomBookingForm } from "@/components/booking/RoomBookingForm";
import { Policies } from "@/components/layout/Policies";
import { formatCurrency } from "@/lib/utils";
import { getRoomBySlug, getRooms, getSiteSettings } from "@/services/dataService";

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  try { return (await getRooms()).map((room) => ({ slug: room.slug })); }
  catch { return []; } // API not reachable at build time: pages are rendered on first visit instead
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [room, siteSettings] = await Promise.all([getRoomBySlug(slug), getSiteSettings()]);
  if (!room) return { title: "Room not found" };
  return {
    title: room.name,
    description: room.shortDescription,
    alternates: { canonical: `/rooms/${room.slug}` },
    openGraph: { title: `${room.name} | ${siteSettings.name}`, description: room.shortDescription, images: room.images[0] && !room.images[0].url.startsWith("/") && !room.images[0].url.startsWith("data:") ? [{ url: room.images[0].url }] : [] },
  };
}

export default async function RoomDetailPage({ params }: Props) {
  const { slug } = await params;
  const [room, siteSettings] = await Promise.all([getRoomBySlug(slug), getSiteSettings()]);
  if (!room) notFound();

  const all = await getRooms();
  const related = all
    .filter((r) => r.slug !== room.slug)
    .sort((a, b) => Number(b.roomType === room.roomType) - Number(a.roomType === room.roomType))
    .slice(0, 3);

  return (
    <>
      <PageHeader title={room.name} description={room.shortDescription} crumbs={[{ label: "Rooms & Suites", href: "/rooms" }, { label: room.name }]} />
      <section className="section !pt-10">
        <div className="container-page grid gap-12 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-10">
            <RoomGallery images={room.images} />
            <div>
              <h2 className="text-3xl">About this room</h2>
              <p className="mt-4 text-slate-soft">{room.description}</p>
              <p className="mt-6 text-slate-soft">
                <span className="font-display text-3xl text-forest-dark">{formatCurrency(room.pricePerNight)}</span> per night
                {siteSettings.demoMode && <span className="ml-2 text-xs text-slate-muted">(demo price)</span>}
              </p>
              <ButtonLink href="#book" className="mt-5 lg:hidden">Check dates and book</ButtonLink>
            </div>
            <dl className="grid gap-4 sm:grid-cols-3">
              {[
                ["Maximum guests", `${room.maxAdults} adults, ${room.maxChildren} child${room.maxChildren === 1 ? "" : "ren"}`],
                ["Beds", room.bedConfiguration],
                ["Rooms of this type", String(room.totalRooms)],
              ].map(([term, value]) => (
                <div key={term} className="rounded-xl bg-white p-4 shadow-soft"><dt className="text-sm text-slate-muted">{term}</dt><dd className="mt-1 font-semibold text-forest-dark">{value}</dd></div>
              ))}
            </dl>
            <div>
              <h2 className="text-2xl">Room facilities</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {room.amenities.map((a) => (
                  <li key={a} className="flex items-center gap-3"><Check className="h-5 w-5 text-forest" aria-hidden />{a}</li>
                ))}
              </ul>
            </div>
            <div className="flex items-start gap-3 rounded-xl2 bg-stone-deep p-5">
              <Clock className="mt-1 h-5 w-5 shrink-0 text-sand-dark" aria-hidden />
              <p className="text-slate-soft">Check-in from <strong>{siteSettings.checkInTime}</strong>. Check-out by <strong>{siteSettings.checkOutTime}</strong>. </p>
            </div>
            <Policies settings={siteSettings} />
          </div>
          <div id="book" className="scroll-mt-28 lg:sticky lg:top-28 lg:self-start"><RoomBookingForm room={room} /></div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section bg-stone-deep" aria-labelledby="related-title">
          <div className="container-page">
            <h2 id="related-title" className="text-3xl sm:text-4xl">Other rooms you may like</h2>
            <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">{related.map((r) => <RoomCard key={r.id} room={r} />)}</div>
          </div>
        </section>
      )}
    </>
  );
}
