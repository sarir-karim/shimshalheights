import type { Metadata, Viewport } from "next";
import { Figtree, Young_Serif } from "next/font/google";
import "./globals.css";
import { siteUrl } from "@/config/site";
import { getSiteSettings } from "@/services/dataService";

const display = Young_Serif({ weight: "400", subsets: ["latin"], variable: "--font-display", display: "swap" });
const sans = Figtree({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  const title = s.seoTitle || `${s.name} | Mountain Hotel in Shimshal Valley, Hunza`;
  const description = s.seoDescription || s.description;
  return {
    metadataBase: new URL(siteUrl),
    title: { default: title, template: `%s | ${s.name}` },
    description,
    openGraph: { type: "website", siteName: s.name, title, description, locale: "en_PK", ...(s.logoUrl && !s.logoUrl.startsWith("data:") ? { images: [{ url: s.logoUrl }] } : {}) },
    twitter: { card: "summary_large_image" },
  };
}

export const viewport: Viewport = { themeColor: "#1F3B2D", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
