import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  crumbs?: { label: string; href?: string }[];
}

export function PageHeader({ title, description, crumbs = [] }: PageHeaderProps) {
  return (
    <div className="bg-stone-deep pb-12 pt-32 sm:pb-16 sm:pt-40">
      <div className="container-page">
        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-muted">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li><Link href="/" className="hover:text-forest">Home</Link></li>
              {crumbs.map((c) => (
                <li key={c.label} className="flex items-center gap-1.5">
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                  {c.href ? <Link href={c.href} className="hover:text-forest">{c.label}</Link> : <span aria-current="page">{c.label}</span>}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl">{title}</h1>
        {description && <p className="mt-4 max-w-2xl text-lg text-slate-soft">{description}</p>}
      </div>
    </div>
  );
}
