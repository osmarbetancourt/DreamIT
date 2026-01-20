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

export const metadata: Metadata = {
  title: "DreamIT",
  description: "DreamIT Agency",
  viewport: 'width=device-width,initial-scale=1,viewport-fit=cover',
};

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