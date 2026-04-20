import { Space_Grotesk } from 'next/font/google';
import "./globals.css";
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap"
});

type Props = Readonly<{ children: React.ReactNode }>;
export default function Layout({ children }: Props) {
  return (
    <html lang="es" className={spaceGrotesk.variable}>
      <body className="bg-background text-foreground font-space-grotesk">
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <Button variant="ghost" size="lg" asChild>
              <Link href="/">
                <span className="text-xl font-bold text-gradient">Eventdex</span>
              </Link>
            </Button>

            {/* <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
              {[
                { name: "Características", href: "#features" },
                { name: "Cómo funciona", href: "#how-it-works" },
                { name: "Precios", href: "#pricing" },
              ].map(({ name, href }) => (
                <Button
                  variant="link"
                  size="sm"
                  key={href}
                  className="text-muted-foreground hover:text-foreground no-underline!"
                  asChild
                >
                  <Link href={href}>
                    {name}
                  </Link>
                </Button>
              ))}
            </nav> */}

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">Ingresar</Link>
              </Button>
            </div>
          </div>
        </header>

        <main>
          {children}
        </main>
      </body>
    </html>
  )
}
