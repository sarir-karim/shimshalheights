import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { getGalleryImages } from "@/services/dataService";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photos of Shimshal Heights: the hotel, rooms, restaurant, food, mountains and Shimshal Valley.",
  alternates: { canonical: "/gallery" },
};

export default async function GalleryPage() {
  const items = await getGalleryImages();
  return (
    <>
      <PageHeader title="Gallery" description="The hotel, the food and the mountains around us." crumbs={[{ label: "Gallery" }]} />
      <section className="section !pt-10"><div className="container-page"><GalleryGrid items={items} /></div></section>
    </>
  );
}
