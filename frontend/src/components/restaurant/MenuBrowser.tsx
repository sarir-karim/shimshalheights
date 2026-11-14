"use client";

import { useState } from "react";
import { Drumstick, Leaf } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { cn, formatCurrency } from "@/lib/utils";
import type { MenuCategory, MenuItem } from "@/types";

export function MenuBrowser({ categories, items }: { categories: MenuCategory[]; items: MenuItem[] }) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const shown = items.filter((i) => i.categoryId === categoryId);

  if (categories.length === 0) return <p className="rounded-xl2 bg-white p-8 text-slate-soft shadow-soft">The menu is being updated. Please contact the restaurant for today&apos;s dishes.</p>;

  return (
    <div>
      <div role="tablist" aria-label="Menu categories" className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button key={c.id} role="tab" id={`tab-${c.id}`} aria-selected={categoryId === c.id} aria-controls="menu-panel" type="button" onClick={() => setCategoryId(c.id)}
            className={cn("rounded-full border px-5 py-2 text-sm font-semibold transition-colors", categoryId === c.id ? "border-forest bg-forest text-stone" : "border-stone-line bg-white text-slate-soft hover:border-forest")}>
            {c.name}
          </button>
        ))}
      </div>
      <div id="menu-panel" role="tabpanel" aria-labelledby={`tab-${categoryId}`} className="mt-8">
        {shown.length === 0 ? (
          <p className="text-slate-soft">No dishes in this category right now.</p>
        ) : (
          <ul className="grid gap-x-12 gap-y-2 md:grid-cols-2">
            {shown.map((item) => (
              <li key={item.id} className={cn("flex gap-4 border-b border-stone-line py-5", !item.isAvailable && "opacity-55")}>
                {item.image && <SmartImage image={item.image} sizes="80px" wrapperClassName="h-20 w-20 shrink-0 rounded-xl" />}
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-xl">{item.name}</h3>
                    <p className="font-semibold text-forest-dark">{formatCurrency(item.price)}</p>
                  </div>
                  <p className="mt-1 text-[0.95rem] text-slate-soft">{item.description}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium">
                    {item.dietary === "vegetarian" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-forest-mist px-2 py-0.5 text-forest-dark"><Leaf className="h-3 w-3" aria-hidden />Vegetarian</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sand-light px-2 py-0.5 text-slate"><Drumstick className="h-3 w-3" aria-hidden />Non-vegetarian</span>
                    )}
                    {!item.isAvailable && <span className="rounded-full bg-slate px-2 py-0.5 text-stone">Unavailable today</span>}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-6 text-sm text-slate-muted">Dishes and prices are demo content until the restaurant supplies its menu.</p>
      </div>
    </div>
  );
}
