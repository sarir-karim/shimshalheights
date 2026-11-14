import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { AboutPreview } from "@/components/home/AboutPreview";
import { FeaturedRooms } from "@/components/home/FeaturedRooms";
import { Facilities } from "@/components/home/Facilities";
import { RestaurantPreview } from "@/components/home/RestaurantPreview";
import { ShimshalExperience } from "@/components/home/ShimshalExperience";
import { GalleryPreview } from "@/components/home/GalleryPreview";
import { Testimonials } from "@/components/home/Testimonials";
import { LocationSection } from "@/components/home/LocationSection";
import { CallToAction } from "@/components/home/CallToAction";
import { JsonLd } from "@/components/layout/JsonLd";
import { placeholders } from "@/config/content";
import {
  getExperiences, getFacilities, getFeaturedGalleryImages, getFeaturedRooms, getMenuHighlights, getRestaurant, getSiteImages, getSiteSettings, getTestimonials,
} from "@/services/dataService";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return { title: { absolute: s.seoTitle || `${s.name} | Mountain Hotel in Shimshal Valley, Hunza` }, alternates: { canonical: "/" } };
}

export default async function HomePage() {
  const [settings, images, restaurant, rooms, facilities, menu, experiences, gallery, testimonials] = await Promise.all([
    getSiteSettings(), getSiteImages(), getRestaurant(), getFeaturedRooms(), getFacilities(), getMenuHighlights(), getExperiences(), getFeaturedGalleryImages(), getTestimonials(),
  ]);

  return (
    <>
      <JsonLd settings={settings} />
      <Hero name={settings.name} image={images.hero} />
      <AboutPreview image={images.about} secondary={images.aboutSecondary} />
      <FeaturedRooms rooms={rooms} />
      <Facilities facilities={facilities} />
      <RestaurantPreview highlights={menu} image={restaurant.images[0] ?? placeholders.generic} />
      <ShimshalExperience items={experiences} />
      <GalleryPreview items={gallery} />
      <Testimonials items={testimonials} />
      <LocationSection settings={settings} mapImage={images.map} />
      <CallToAction settings={settings} image={images.cta} />
    </>
  );
}
