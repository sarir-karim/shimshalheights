"use client";

import { createContext, useContext } from "react";
import type { SiteSettings } from "@/types";

const Ctx = createContext<SiteSettings | null>(null);

/** Gives client components the hotel settings loaded on the server (name, contact, times). */
export function SiteSettingsProvider({ value, children }: { value: SiteSettings; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSiteSettings() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSiteSettings must be used inside SiteSettingsProvider");
  return v;
}
