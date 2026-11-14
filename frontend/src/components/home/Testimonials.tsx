import { Quote } from "lucide-react";
import { siteSettings } from "@/config/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StarRating } from "@/components/ui/StarRating";
import type { Testimonial } from "@/types";

export function Testimonials({ items }: { items: Testimonial[] }) {
  const [lead, ...rest] = items;
  if (!lead) return null;
  return (
    <section className="section" aria-labelledby="reviews-title">
      <div className="container-page">
        <div id="reviews-title"><SectionHeading title="What guests say" description={siteSettings.demoMode ? "Sample reviews shown for layout. Real guest feedback replaces these before launch." : "Kind words from guests who stayed with us."} /></div>
        <div className="mt-12 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <figure className="rounded-xl2 bg-forest p-8 text-stone shadow-soft sm:p-10">
            <Quote className="h-9 w-9 text-sand" aria-hidden />
            <blockquote className="mt-5 font-display text-2xl leading-snug sm:text-3xl">{lead.review}</blockquote>
            <figcaption className="mt-7 flex items-center justify-between gap-4">
              <span>
                <span className="block font-semibold">{lead.guestName}</span>
                <span className="text-sm text-stone/70">{lead.guestLocation}</span>
              </span>
              <StarRating rating={lead.rating} />
            </figcaption>
          </figure>
          <div className="grid gap-6">
            {rest.map((item) => (
              <figure key={item.id} className="rounded-xl2 border border-stone-line bg-white p-6">
                <StarRating rating={item.rating} />
                <blockquote className="mt-3 text-slate-soft">{item.review}</blockquote>
                <figcaption className="mt-4 text-sm"><span className="font-semibold text-forest-dark">{item.guestName}</span>, {item.guestLocation}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
