import { Leaf, Drumstick } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SmartImage } from "@/components/ui/SmartImage";
import type { MenuHighlight, SiteImage } from "@/types";

export function RestaurantPreview({ content = {}, highlights, image }: { content?: Record<string, string>; highlights: MenuHighlight[]; image: SiteImage }) {
  return (
    <section className="section bg-forest text-stone" aria-labelledby="restaurant-title">
      <div className="container-page grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <SmartImage
          image={image}
          sizes="(min-width: 1024px) 50vw, 100vw"
          wrapperClassName="aspect-[5/4] rounded-xl2 shadow-lift"
        />
        <div>
          <div id="restaurant-title"><SectionHeading tone="light" title={content.text4 ?? "Fresh meals, served warm"} description={content.text5 ?? "Our restaurant serves breakfast, lunch and dinner, with room service when you would rather stay in."} /></div>
          <ul className="mt-8 divide-y divide-stone/15 border-y border-stone/15">
            {highlights.map((item) => (
              <li key={item.id} className="flex items-start gap-4 py-4">
                <SmartImage image={item.image} sizes="80px" wrapperClassName="h-16 w-16 shrink-0 rounded-xl" />
                <div>
                  <p className="flex items-center gap-2 font-semibold text-stone">
                    {item.name}
                    {item.dietary === "vegetarian" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-forest-mist px-2 py-0.5 text-xs font-medium text-forest-dark"><Leaf className="h-3 w-3" aria-hidden />{content.text1 ?? "Vegetarian"}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sand-light px-2 py-0.5 text-xs font-medium text-slate"><Drumstick className="h-3 w-3" aria-hidden />{content.text2 ?? "Non-vegetarian"}</span>
                    )}
                  </p>
                  <p className="text-[0.95rem] text-stone/75">{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
          <ButtonLink href="/restaurant" variant="light" className="mt-8">{content.text3 ?? "View Restaurant"}</ButtonLink>
        </div>
      </div>
    </section>
  );
}
