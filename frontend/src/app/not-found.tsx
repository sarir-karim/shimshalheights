import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { NotFoundContent } from "@/components/layout/NotFoundContent";
import { SiteSettingsProvider } from "@/components/providers/SiteSettingsProvider";
import { getSiteSettings } from "@/services/dataService";

/** Global 404 for URLs that match no route at all. These render outside the (site) layout, so the chrome is added here. */
export default async function NotFound() {
  const settings = await getSiteSettings();
  return (
    <SiteSettingsProvider value={settings}>
      <Header />
      <NotFoundContent />
      <Footer settings={settings} />
    </SiteSettingsProvider>
  );
}
