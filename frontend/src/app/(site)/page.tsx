import type { SiteImage } from "@/types";
import { getHomepage } from "@/services/dataService";
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

  const homepage = await getHomepage();
  const photo = (section: string, key: string, fallback: SiteImage): SiteImage => ({ url: homepage[section]?.[key] || fallback.url, alt: homepage[section]?.[key + 'Alt'] ?? fallback.alt });
  const homeFacilities = facilities.map(item => ({ ...item, title: homepage.Facilities?.[item.id + 'Title'] ?? item.title, description: homepage.Facilities?.[item.id + 'Description'] ?? item.description }));
  const homeExperiences = experiences.map(item => ({ ...item, title: homepage.ShimshalExperience?.[item.id + 'Title'] ?? item.title, description: homepage.ShimshalExperience?.[item.id + 'Description'] ?? item.description, image: photo('ShimshalExperience', item.id + 'Image', item.image) }));
  return (
    <>
      <JsonLd settings={settings} />
      <Hero content={homepage.Hero} name={settings.name} image={photo('Hero', 'backgroundImage', images.hero)} />
      <AboutPreview content={homepage.AboutPreview} image={photo('AboutPreview', 'mainImage', images.about)} secondary={photo('AboutPreview', 'secondaryImage', images.aboutSecondary)} />
      <FeaturedRooms content={homepage.FeaturedRooms} rooms={rooms} />
      <Facilities content={homepage.Facilities} facilities={homeFacilities} />
      <RestaurantPreview content={homepage.RestaurantPreview} highlights={menu} image={photo('RestaurantPreview', 'mainImage', restaurant.images[0] ?? placeholders.generic)} />
      <ShimshalExperience content={homepage.ShimshalExperience} items={homeExperiences} />
      <GalleryPreview content={homepage.GalleryPreview} items={gallery} />
      <Testimonials content={homepage.Testimonials} items={testimonials} />
      <LocationSection content={homepage.LocationSection} settings={settings} mapImage={photo('LocationSection', 'mapImage', images.map)} />
      <CallToAction content={homepage.CallToAction} settings={settings} image={photo('CallToAction', 'backgroundImage', images.cta)} />
    </>
  );
}
