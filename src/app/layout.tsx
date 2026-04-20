import { TooltipProvider } from "@/components/ui/tooltip";
import { Space_Grotesk } from "next/font/google";

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
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  )
}
