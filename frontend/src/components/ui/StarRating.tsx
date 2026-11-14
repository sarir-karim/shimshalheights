import { Star } from "lucide-react";

export function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={i < rating ? "h-4 w-4 fill-sand text-sand" : "h-4 w-4 text-stone-line"} aria-hidden />
      ))}
    </div>
  );
}
