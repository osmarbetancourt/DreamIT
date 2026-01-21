import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css"; // Ensure this path is correct based on your folder structure
import ContactCTA from "../components/dom/ContactCTA";
import PersistentStarsClient from "../components/canvas/PersistentStarsClient";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

async function getMetaForLang(lang: string): Promise<Metadata> {
  const isES = lang === "es" || lang === "es-ES";
  const title = isES ? "DreamIT Desarrollo Web" : "DreamIT";
  const description = isES
    ? "DreamIT, agencia de desarrollo web y soluciones tecnológicas"
    : "DreamIT, web development agency and software solutions";

  // Use provided PNGs from /public for social previews — build absolute, encoded URLs
  // Use the Spanish OG image for both languages per request
  const ogFilename = "og-es.png";
  const ogImage = `https://dreamit.software/${ogFilename}`;

  return {
    title,
    description,
    viewport: 'width=device-width,initial-scale=1,viewport-fit=cover',
    themeColor: '#000000',
      openGraph: {
    title,
    description,
    url: 'https://dreamit.software/',
      siteName: 'DreamIT',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: 'DreamIT',
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    icons: {
      icon: '/dreamit_logo_wbg.svg',
      apple: '/dreamit_logo_wbg.svg',
    },
  } as Metadata;
}

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  const { lang } = params;
  return getMetaForLang(lang || 'en');
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;

  return (
    <>
      {/* Top-level Contact CTA present for all pages */}
      <ContactCTA lang={lang} />
      {/* Persistent starfield mounted once at the layout level so it survives route changes */}
      <PersistentStarsClient />
      {children}
    </>
  );
}