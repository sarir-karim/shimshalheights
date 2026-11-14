import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { RoomsExplorer } from "@/components/rooms/RoomsExplorer";
import { getRooms } from "@/services/dataService";

export const metadata: Metadata = {
  title: "Rooms & Suites",
  description: "Comfortable mountain rooms and suites at Shimshal Heights in Shimshal Valley, Upper Hunza. Compare room types, prices and capacity.",
  alternates: { canonical: "/rooms" },
};

export default async function RoomsPage() {
  const rooms = await getRooms();
  return (
    <>
      <PageHeader title="Rooms & Suites" description="Warm rooms with mountain views, from a quiet double to a family room." crumbs={[{ label: "Rooms & Suites" }]} />
      <section className="section !pt-10">
        <div className="container-page"><RoomsExplorer rooms={rooms} /></div>
      </section>
    </>
  );
}
