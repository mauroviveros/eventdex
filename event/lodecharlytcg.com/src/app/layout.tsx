import Account from "@/components/account";
import "@/globals.css";
import { cn } from "@/utils";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Settings } from "luxon";
import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from 'next/font/google';
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";

const vt323 = VT323({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-vt323',
});

const pressStart = Press_Start_2P({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-press-start',
});

export const metadata: Metadata = {
  title: "Lo de Charly TCG | Eventdex",
  description: "Evento de cartas coleccionables TCG",
  icons: {
    apple: '/apple-touch-icon.png',
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  const header = await headers()
  const timezone = header.get('x-vercel-ip-timezone');
  const locale = 'es-AR'; // header.get('accept-language')?.split(',')[0] ?? 'en'
  if (timezone) Settings.defaultZone = timezone;
  if (locale) Settings.defaultLocale = locale;

  return (
    <html lang="es" className={cn("h-full", "antialiased", vt323.variable, pressStart.variable)}>
      <body className="min-h-dvh flex flex-col">
        <Analytics />
        <SpeedInsights />
        <scanlines />

        <header className="border-b fixed top-0 left-0 right-0 z-50 bg-background/50 backdrop-blur-sm">
          <div className="container mx-auto h-14 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 px-2 hover:text-accent transition-colors">
              <Image
                src="/logo.png"
                alt="Logo"
                width={52}
                height={52}
              />
              <span className="font-bold text-2xl">Lo de Charly</span>
            </Link>

            <Account />
          </div>
        </header>

        <main className="container mx-auto mt-14 px-4 pt-2 grow">
          {children}
        </main>
      </body>
    </html>
  );
}
