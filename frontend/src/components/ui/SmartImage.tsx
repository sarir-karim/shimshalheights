import Image from "next/image";
import { cn } from "@/lib/utils";
import type { SiteImage } from "@/types";

interface SmartImageProps {
  image: SiteImage;
  sizes: string;
  priority?: boolean;
  className?: string;
  /** Wrapper classes – must give the box a size (e.g. aspect ratio or height). */
  wrapperClassName?: string;
}

/**
 * Single image primitive for the whole site. Uses next/image (lazy loading, AVIF/WebP, responsive srcset).
 * Local SVG demo art bypasses the optimizer; Cloudinary URLs get full optimization.
 */
export function SmartImage({ image, sizes, priority, className, wrapperClassName }: SmartImageProps) {
  const isSvg = image.url.endsWith(".svg");
  return (
    <div className={cn("relative overflow-hidden bg-stone-deep", wrapperClassName)}>
      <Image
        src={image.url}
        alt={image.alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={isSvg}
        className={cn("object-cover", className)}
      />
    </div>
  );
}
