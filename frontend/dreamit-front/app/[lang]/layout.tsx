import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css"; // Ensure this path is correct based on your folder structure

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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-full w-full bg-zinc-950 overflow-hidden`}>
        {children}
      </body>
    </html>
  );
}