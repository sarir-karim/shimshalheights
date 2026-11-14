import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Policies } from "@/components/layout/Policies";
import { getSiteSettings } from "@/services/dataService";
import { BookingFlow, type BookingInitial } from "@/components/booking/BookingFlow";

export const metadata: Metadata = {
  title: "Book Your Stay",
  description: "Check availability and send a booking request for Shimshal Heights in Shimshal Valley, Upper Hunza.",
  alternates: { canonical: "/booking" },
};

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const num = (v: string | undefined) => (v && /^\d{1,2}$/.test(v) ? Number(v) : undefined);
const date = (v: string | undefined) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);

export default async function BookingPage({ searchParams: searchParamsPromise }: { searchParams: Promise<Params> }) {
  const searchParams = await searchParamsPromise;
  const initial: BookingInitial = {
    room: one(searchParams.room),
    checkIn: date(one(searchParams.checkIn)),
    checkOut: date(one(searchParams.checkOut)),
    adults: num(one(searchParams.adults)),
    children: num(one(searchParams.children)),
    rooms: num(one(searchParams.rooms)),
  };
  const settings = await getSiteSettings();
  return (
    <>
      <PageHeader title="Book Your Stay" description="Choose your dates, pick a room and send a request. The hotel confirms every booking." crumbs={[{ label: "Booking" }]} />
      <section className="section !pt-10">
        <div className="container-page max-w-5xl space-y-10"><BookingFlow initial={initial} /><Policies settings={settings} /></div>
      </section>
    </>
  );
}
