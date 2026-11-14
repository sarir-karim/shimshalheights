import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  description?: string;
  align?: "left" | "center";
  tone?: "dark" | "light";
  className?: string;
}

export function SectionHeading({ title, description, align = "left", tone = "dark", className }: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      <h2 className={cn("text-3xl sm:text-4xl lg:text-[2.75rem]", tone === "light" && "!text-stone")}>{title}</h2>
      {description && (
        <p className={cn("mt-4 text-lg", tone === "light" ? "text-stone/80" : "text-slate-soft")}>{description}</p>
      )}
    </div>
  );
}
