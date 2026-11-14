import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "light" | "ghost";

const variants: Record<Variant, string> = {
  primary: "bg-forest text-stone hover:bg-forest-dark",
  secondary: "border border-forest/30 text-forest hover:border-forest hover:bg-forest-mist",
  light: "bg-stone text-forest-dark hover:bg-white",
  ghost: "border border-stone/50 text-stone hover:bg-stone/10",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[0.95rem] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: Variant;
}

export function ButtonLink({ variant = "primary", className, ...props }: ButtonLinkProps) {
  return <Link className={cn(base, variants[variant], className)} {...props} />;
}

interface ButtonProps extends ComponentProps<"button"> {
  variant?: Variant;
}

export function Button({ variant = "primary", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn(base, variants[variant], className)} {...props} />;
}

/** Plain <a> styled as a button, for external links (WhatsApp, Maps). */
export function ExternalButtonLink({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"a"> & { variant?: Variant }) {
  return <a className={cn(base, variants[variant], className)} target="_blank" rel="noopener noreferrer" {...props} />;
}
