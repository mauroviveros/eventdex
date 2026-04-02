import { cn } from "@/utils";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from 'next/font/google';
import { Header } from "./_components/layout/header";
import "./globals.css";

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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="es" className={cn("h-full", "antialiased", vt323.variable, pressStart.variable)}>
      <body className="min-h-dvh flex flex-col">
        <Analytics />
        <SpeedInsights />
        <scanlines />

        <Header />

        <main className="container mx-auto mt-16 grow">
          {children}
        </main>
      </body>
    </html>
  );
}
