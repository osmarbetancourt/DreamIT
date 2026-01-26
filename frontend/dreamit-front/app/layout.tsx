import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import DeviceDetector from "./components/DeviceDetector";
import ServiceWorkerRegistration from "./components/ServiceWorkerRegistration";

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
        <ServiceWorkerRegistration />
        {children}

        {/* DEBUG: Sweeping beam above the box */}
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            width: '100px',
            height: '100px',
            zIndex: 10000,
            pointerEvents: 'none',
          }}
        >
          {/* Main green beam - top to bottom */}
          <div
            id="beam1"
            style={{
              position: 'absolute',
              top: '0',
              left: '0',
              width: '100px',
              height: '4px',
              background: '#00ff00',
              boxShadow: '0 0 20px #00ff00, 0 0 40px #00ff00, 0 0 60px #00ff00',
              animation: 'beamSweep 0.9s infinite cubic-bezier(0.25, 0.46, 0.45, 0.94), beamFlicker 0.1s infinite alternate',
            }}
          />
          {/* Secondary green beam - bottom to top */}
          <div
            id="beam2"
            style={{
              position: 'absolute',
              bottom: '0',
              left: '0',
              width: '100px',
              height: '4px',
              background: '#00ff00',
              boxShadow: '0 0 20px #00ff00, 0 0 40px #00ff00, 0 0 60px #00ff00',
              animation: 'beamSweepReverse 0.9s infinite cubic-bezier(0.25, 0.46, 0.45, 0.94), beamFlicker 0.15s infinite alternate',
              opacity: 0.7,
            }}
          />

          {/* Data box */}
          <div
            id="dataBox"
            style={{
              position: 'absolute',
              top: '50px',
              left: '160px',
              width: '280px',
              height: '300px',
              background: 'rgba(0, 20, 0, 0.75)',
              border: '2px solid #00ff00',
              boxShadow: '0 0 25px #00ff00, inset 0 0 25px rgba(0, 255, 0, 0.2)',
              padding: '20px',
              borderRadius: '5px',
              color: '#ffffff',
              fontFamily: '"Courier New", monospace',
              fontSize: '14px',
              textAlign: 'center',
              overflow: 'hidden',
              position: 'relative',
              backdropFilter: 'blur(1px)',
              display: 'none',
            }}
          >
            <style dangerouslySetInnerHTML={{
              __html: `
                @keyframes scanLine {
                  0% { left: -100%; }
                  100% { left: 100%; }
                }
                @keyframes signalPulse {
                  0%, 100% { opacity: 0.7; transform: scaleY(1); }
                  50% { opacity: 1; transform: scaleY(1.2); }
                }
                @keyframes boxMaterialize {
                  0% { width: 0; height: 2px; opacity: 1; }
                  50% { width: 280px; height: 2px; opacity: 1; }
                  100% { width: 280px; height: 300px; opacity: 1; }
                }
                @keyframes textDecrypt {
                  0% {
                    opacity: 0;
                    text-shadow:
                      0 0 5px rgba(255,255,255,0.8),
                      0 0 10px rgba(255,255,255,0.6),
                      0 0 15px rgba(255,255,255,0.4);
                    filter: blur(2px) contrast(2);
                  }
                  50% {
                    opacity: 0.7;
                    text-shadow:
                      0 0 3px rgba(255,255,255,0.6),
                      0 0 6px rgba(255,255,255,0.4),
                      0 0 9px rgba(255,255,255,0.2);
                    filter: blur(1px) contrast(1.5);
                  }
                  100% {
                    opacity: 1;
                    text-shadow: none;
                    filter: none;
                  }
                }
              `
            }} />
            <div style={{
              position: 'absolute',
              top: '5px',
              left: '10px',
              right: '10px',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #00ff00, transparent)',
              animation: 'scanLine 2s infinite',
            }} />
            <h3 style={{
              margin: '0 0 10px 0',
              fontSize: '16px',
              color: '#00ff00',
              textShadow: '0 0 10px #00ff00',
              letterSpacing: '1px'
            }}>
              SCAN COMPLETE
            </h3>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#ffffff', animation: 'textDecrypt 1.2s ease-out 1.8s both' }}>DragonLog</h4>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#00ff00', animation: 'textDecrypt 1.2s ease-out 1.8s both' }}>
              🏢 Enterprise Platform
            </p>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#ffffff', animation: 'textDecrypt 1.2s ease-out 1.8s both' }}>TECH STACK:</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', animation: 'textDecrypt 1.2s ease-out 1.8s both' }}>
              <div style={{
                width: '28px',
                height: '28px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid #00ff00',
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img src="https://cdn.simpleicons.org/nextdotjs/000000" alt="Next.js" style={{
                  width: '20px',
                  height: '20px',
                  filter: 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.8))'
                }} />
              </div>
              <div style={{
                width: '28px',
                height: '28px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid #00ff00',
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img src="https://cdn.simpleicons.org/rust/000000" alt="Rust" style={{
                  width: '20px',
                  height: '20px',
                  filter: 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.8))'
                }} />
              </div>
              <div style={{
                width: '28px',
                height: '28px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid #00ff00',
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img src="https://cdn.simpleicons.org/postgresql/4169E1" alt="PostgreSQL" style={{
                  width: '20px',
                  height: '20px'
                }} />
              </div>
              <div style={{
                width: '28px',
                height: '28px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid #00ff00',
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img src="https://cdn.simpleicons.org/hetzner/D50C2D" alt="Hetzner" style={{
                  width: '20px',
                  height: '20px'
                }} />
              </div>
              <div style={{
                width: '28px',
                height: '28px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid #00ff00',
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img src="https://cdn.simpleicons.org/docker/2496ED" alt="Docker" style={{
                  width: '20px',
                  height: '20px'
                }} />
              </div>
            </div>
            <p style={{ margin: '8px 0 8px 0', fontSize: '14px', color: '#00ff00', animation: 'textDecrypt 1.2s ease-out 1.8s both' }}>
              ⚡ Active Development
            </p>
            <p style={{ margin: '0', fontSize: '14px', color: '#ffffff', animation: 'textDecrypt 1.2s ease-out 1.8s both' }}>
              👥 B2C Consumers
            </p>
            <div style={{ marginTop: '10px', textAlign: 'center', animation: 'textDecrypt 1.2s ease-out 1.8s both' }}>
              <div style={{ fontSize: '12px', color: '#00ff00', marginBottom: '5px' }}>
                SIGNAL STRENGTH
              </div>
              <div style={{
                width: '100%',
                height: '4px',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: '75%',
                  height: '100%',
                  background: 'linear-gradient(90deg, #00ff00, #00ffff)',
                  borderRadius: '2px',
                  animation: 'signalPulse 3s ease-in-out infinite'
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* DEBUG: Red box in top-left corner */}
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            width: '100px',
            height: '100px',
            background: 'red',
            border: '4px solid white',
            zIndex: 9999,
            color: 'white',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          DEBUG BOX
        </div>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              const speeds = [0.9, 0.7, 0.5, 0.5];
              let speedIndex = 0;
              function changeSpeed() {
                const speed = speeds[speedIndex];
                if (!speed) {
                  // Stop the sweep animation and hide beams
                  const beam1 = document.getElementById('beam1');
                  const beam2 = document.getElementById('beam2');
                  if (beam1) beam1.style.display = 'none';
                  if (beam2) {
                    beam2.style.display = 'none';
                    // Show data box
                    const dataBox = document.getElementById('dataBox');
                    if (dataBox) {
                      dataBox.style.display = 'block';
                      dataBox.style.animation = 'boxMaterialize 1.5s ease-out forwards';
                    }
                  }
                  return;
                }
                const beam1 = document.getElementById('beam1');
                const beam2 = document.getElementById('beam2');
                if (beam1) beam1.style.animationDuration = speed + 's, 0.1s';
                if (beam2) beam2.style.animationDuration = speed + 's, 0.15s';
                speedIndex++;
                setTimeout(changeSpeed, speed * 1000);
              }
              changeSpeed();
            `,
          }}
        />
      </body>
    </html>
  );
}
