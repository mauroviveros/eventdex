import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import { siteUrl } from "@/config/site";
import { cn } from "@/utils";
import Header from "./_components/header";
import "./globals.css";

const vt323 = VT323({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-vt323",
});

const pressStart = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-press-start",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Burning Tower Fest | Lo de Charly TCG | Eventdex",
  description:
    "El evento TCG más grande la la Argentina tiene fecha y nueva ubicación para que puedas disfrutar al máximo todo lo que estamos armando !",
  icons: {
    apple: "/apple-touch-icon.png",
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={cn(
        "h-full",
        "antialiased",
        vt323.variable,
        pressStart.variable,
      )}
    >
      <body className="min-h-dvh flex flex-col">
        <Analytics />
        <SpeedInsights />
        <div className="scanlines"></div>
        <Header />

        <main className="container mx-auto mt-14 px-4 pt-2 grow">
          {children}
        </main>
      </body>
    </html>
  );
}
