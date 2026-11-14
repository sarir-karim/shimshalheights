import type { Metadata } from "next";
import { Check } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { SmartImage } from "@/components/ui/SmartImage";
import { ButtonLink } from "@/components/ui/Button";
import { aboutContent, aboutDraft } from "@/config/content";
import { getSiteImages, getSiteSettings } from "@/services/dataService";

export const metadata: Metadata = {
  title: "About Us",
  description: "About Shimshal Heights, a mountain hotel in Shimshal Valley, Upper Hunza, Gilgit-Baltistan.",
  alternates: { canonical: "/about" },
};

const reasons = [
  "Comfortable, heated rooms after long mountain days",
  "Freshly prepared meals in our own restaurant",
  "Room service and on-site parking",
  "Mountain views from the hotel",
  "A team that can help with local advice and planning",
];

export default async function AboutPage() {
  const [siteSettings, images] = await Promise.all([getSiteSettings(), getSiteImages()]);
  const story = aboutContent.story || (siteSettings.demoMode ? aboutDraft.story : "");
  const philosophy = aboutContent.philosophy || (siteSettings.demoMode ? aboutDraft.philosophy : "");
  return (
    <>
      <PageHeader title="About Us" description="Mountain hospitality in one of Hunza's most remote valleys." crumbs={[{ label: "About Us" }]} />

      <section className="section !pt-12">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-3xl sm:text-4xl">Welcome to {siteSettings.name}</h2>
            <p className="mt-5 text-slate-soft">{siteSettings.description}</p>
            <p className="mt-4 text-slate-soft">We built our hotel around what travellers in the mountains actually need: a warm room, a good meal and people who are glad to see you.</p>
          </div>
          <SmartImage image={images.aboutSecondary} sizes="(min-width: 1024px) 50vw, 100vw" priority wrapperClassName="aspect-[4/3] rounded-xl2 shadow-lift" />
        </div>
      </section>

      {(story || philosophy) && (
        <section className="section bg-stone-deep" aria-labelledby="story-title">
          <div className="container-page grid gap-12 lg:grid-cols-2 lg:gap-16">
            {story && <div><h2 id="story-title" className="text-3xl sm:text-4xl">Our story</h2><p className="mt-5 text-slate-soft">{story}</p></div>}
            {philosophy && <div><h2 className="text-3xl sm:text-4xl">Our hospitality philosophy</h2><p className="mt-5 text-slate-soft">{philosophy}</p></div>}
          </div>
        </section>
      )}

      <section className="section" aria-labelledby="location-title">
        <div className="container-page grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div className="grid grid-cols-2 gap-4">
            <SmartImage image={images.about} sizes="(min-width: 1024px) 28vw, 50vw" wrapperClassName="aspect-[3/4] rounded-xl2" />
            <SmartImage image={images.hero} sizes="(min-width: 1024px) 28vw, 50vw" wrapperClassName="mt-10 aspect-[3/4] rounded-xl2" />
          </div>
          <div>
            <h2 id="location-title" className="text-3xl sm:text-4xl">Our location in Shimshal</h2>
            <p className="mt-5 text-slate-soft">Shimshal Valley lies in Upper Hunza, Gilgit-Baltistan, surrounded by high peaks and glaciers. It is known as a starting point for trekking and mountaineering, and for its close mountain community.</p>
            <p className="mt-4 text-slate-soft">{siteSettings.address}</p>
          </div>
        </div>
      </section>

      <section className="section bg-forest text-stone" aria-labelledby="why-title">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <h2 id="why-title" className="!text-stone text-3xl sm:text-4xl">Why choose {siteSettings.name}?</h2>
          <ul className="space-y-4">
            {reasons.map((r) => <li key={r} className="flex items-start gap-3"><Check className="mt-1 h-5 w-5 shrink-0 text-sand" aria-hidden />{r}</li>)}
          </ul>
        </div>
        <div className="container-page mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/rooms" variant="light">Explore Rooms</ButtonLink>
          <ButtonLink href="/contact" variant="ghost">Contact Us</ButtonLink>
        </div>
      </section>
    </>
  );
}
