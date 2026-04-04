import Account from "@/components/account";
import "@/globals.css";
import { cn } from "@/utils";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Settings } from "luxon";
import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from 'next/font/google';
import { headers } from "next/headers";

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
          <div className="container mx-auto h-14 flex items-center justify-end gap-4">
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
