import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SiteSettingsProvider } from "@/components/providers/SiteSettingsProvider";
import { getSiteSettings } from "@/services/dataService";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  return (
    <SiteSettingsProvider value={settings}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-sand focus:px-5 focus:py-2">
        Skip to content
      </a>
      <Header />
      <main id="main">{children}</main>
      <Footer settings={settings} />
    </SiteSettingsProvider>
  );
}
