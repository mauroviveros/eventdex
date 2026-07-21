import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/utils";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Eventdex Admin",
    default: "Eventdex Admin",
  },
  description: "Dashboard de organizadores: administrá tus eventos y spots.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={cn("h-full antialiased", inter.variable)}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
