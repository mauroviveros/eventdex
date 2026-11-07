import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next, Jersey_10 } from "next/font/google";
import "./globals.css";

// Pixel face for titles, counters and codes (its 8/B, 5/S and 2/Z stay apart);
// a hyper-legible face for everything read.
const pixel = Jersey_10({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pixel",
});
const read = Atkinson_Hyperlegible_Next({
  subsets: ["latin"],
  variable: "--font-read",
  // Next has no metrics for this face to tune a fallback; use the system sans as is.
  adjustFontFallback: false,
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Eventdex",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${pixel.variable} ${read.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
