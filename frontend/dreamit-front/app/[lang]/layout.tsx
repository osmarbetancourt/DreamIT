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

  // Use provided PNGs from /public for social previews
  const ogImage = isES ? "/dreamIT pfp-09.png" : "/dreamIT pfp-09.png";

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
    <html lang={lang} className="h-full w-full">
      <head>
        {/* Preconnect to performance-critical origins. Replace/add your asset hosts here. */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="/" />
        {/* Site icon: use public/dreamit_logo_wbg.svg as favicon */}
        <link rel="icon" href="/dreamit_logo_wbg.svg" />
        <link rel="apple-touch-icon" href="/dreamit_logo_wbg.svg" />
        {/* PWA manifest and theme color */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#000000" />
        {/* Example CDN host - replace with your real model/texture CDN if any */}
        <link rel="preconnect" href="https://cdn.example.com" />
        {/* Example preload: uncomment and set a real hero model path if you have a critical GLB */}
        {/* <link rel="preload" as="fetch" href="/assets/models/hero-draco.glb" type="model/gltf-binary" /> */}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-full w-full bg-black`}>
        {/* Top-level Contact CTA present for all pages */}
        <ContactCTA lang={lang} />
        {/* Persistent starfield mounted once at the layout level so it survives route changes */}
        <PersistentStarsClient />
        {children}
      </body>
    </html>
  );
}