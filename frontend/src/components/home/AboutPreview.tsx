import { ButtonLink } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SmartImage } from "@/components/ui/SmartImage";
import type { SiteImage } from "@/types";

export function AboutPreview({ content = {}, image, secondary }: { content?: Record<string, string>; image: SiteImage; secondary: SiteImage }) {
  return (
    <section className="section" aria-labelledby="about-title">
      <div className="container-page grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
        <div>
          <div id="about-title"><SectionHeading title={content.text4 ?? "A place to rest at the edge of the Karakoram"} /></div>
          <p className="mt-6 text-slate-soft">{content.text1 ?? "Shimshal sits high in Upper Hunza, among some of the most dramatic mountains in Pakistan. Shimshal Heights gives trekkers, families and travellers a warm bed, a hot meal and a friendly welcome after the long road in."}</p>
          <p className="mt-4 text-slate-soft">{content.text2 ?? "We keep things simple: comfortable rooms, honest food and a team that knows the valley."}</p>
          <ButtonLink href="/about" variant="secondary" className="mt-8">{content.text3 ?? "Discover More"}</ButtonLink>
        </div>
        <div className="relative">
          <SmartImage
            image={image}
            sizes="(min-width: 1024px) 50vw, 100vw"
            wrapperClassName="aspect-[4/3] rounded-xl2 shadow-lift"
          />
          <SmartImage
            image={secondary}
            sizes="(min-width: 1024px) 22vw, 40vw"
            wrapperClassName="absolute -bottom-8 -left-4 hidden aspect-square w-40 rounded-xl2 border-4 border-stone shadow-soft sm:block lg:-left-10 lg:w-48"
          />
        </div>
      </div>
    </section>
  );
}
