import { SectionHeading } from "@/components/ui/SectionHeading";
import { SmartImage } from "@/components/ui/SmartImage";
import type { ExperienceItem } from "@/types";

export function ShimshalExperience({ content = {}, items }: { content?: Record<string, string>; items: ExperienceItem[] }) {
  const [lead, ...rest] = items;
  if (!lead) return null;
  return (
    <section className="section" aria-labelledby="experience-title">
      <div className="container-page">
        <div id="experience-title"><SectionHeading title={content.text1 ?? "The Shimshal experience"} description={content.text2 ?? "One of the most remote valleys in Hunza, and one of the most rewarding to reach."} /></div>
        <div className="mt-12 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <figure className="relative min-h-[26rem] overflow-hidden rounded-xl2 lg:row-span-3">
            <SmartImage image={lead.image} sizes="(min-width: 1024px) 55vw, 100vw" wrapperClassName="absolute inset-0 h-full w-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/85 to-transparent" aria-hidden />
            <figcaption className="absolute bottom-0 p-7 text-stone">
              <h3 className="!text-stone text-3xl">{lead.title}</h3>
              <p className="mt-2 max-w-md text-stone/85">{lead.description}</p>
            </figcaption>
          </figure>
          {rest.map((item) => (
            <article key={item.id} className="flex items-center gap-5 rounded-xl2 bg-white p-4 shadow-soft">
              <SmartImage image={item.image} sizes="160px" wrapperClassName="h-28 w-28 shrink-0 rounded-xl sm:h-32 sm:w-40" />
              <div>
                <h3 className="text-xl">{item.title}</h3>
                <p className="mt-1 text-[0.95rem] text-slate-soft">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
