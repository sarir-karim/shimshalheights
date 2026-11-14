"use client";

import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";

/** Honest preview banner. Shown only while demo mode is on (NEXT_PUBLIC_DEMO_MODE) so placeholders are never mistaken for real details. */
export function DemoNotice() {
  const { demoMode } = useSiteSettings();
  if (!demoMode) return null;
  return (
    <div className="bg-slate px-4 py-1.5 text-center text-xs text-stone/90">
      <span className="sm:hidden">Preview build: demo content</span>
      <span className="hidden sm:inline">Preview build: any placeholder details, prices or photos you see are demo content until the hotel supplies real information.</span>
    </div>
  );
}
