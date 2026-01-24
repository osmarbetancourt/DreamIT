import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import DeviceDetector from "./components/DeviceDetector";

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
  description: "DreamIT, web development agency and software solutions",
  viewport: 'width=device-width,initial-scale=1,viewport-fit=cover',
  themeColor: '#000000',
  authors: [{ name: 'DreamIT' }],
  keywords: ['web development', 'agency', 'software', 'DreamIT'],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'DreamIT',
    description: 'DreamIT, web development agency and software solutions',
    url: 'https://dreamit.software/',
    siteName: 'DreamIT',
    locale: 'en_US',
    images: [
      {
        url: 'https://dreamit.software/og-es.png',
        width: 1200,
        height: 630,
        alt: 'DreamIT',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DreamIT',
    description: 'DreamIT, web development agency and software solutions',
    images: ['https://dreamit.software/og-es.png'],
  },
  alternates: {
    canonical: 'https://dreamit.software/',
    languages: {
      'en': '/en',
      'es': '/es',
    },
  },
  icons: {
    icon: '/dreamit_logo_wbg.svg',
    apple: '/dreamit_logo_wbg.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full w-full">
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="/" />
        <link rel="icon" href="/dreamit_logo_wbg.svg" />
        <link rel="icon" type="image/png" sizes="192x192" href="/dreamit_logo_wbg.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/dreamit_logo_wbg.png" />
        <link rel="apple-touch-icon" href="/dreamit_logo_wbg.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#000000" />
        <meta name="author" content="DreamIT" />
        <meta name="publisher" content="DreamIT" />
        <meta name="keywords" content="web development, agency, software, DreamIT" />
        <meta name="robots" content="index, follow" />
        <meta itemProp="image" content="https://dreamit.software/og-es.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-full w-full bg-black`}>
        <DeviceDetector />
        {children}
      </body>
    </html>
  );
}
