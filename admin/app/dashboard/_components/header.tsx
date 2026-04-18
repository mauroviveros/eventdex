import { SidebarTrigger } from "@/components/ui/sidebar"

export default function Header({
  children,
}: Readonly<{
  children?: React.ReactNode
}>) {
  return (
    <header className="h-16 border-b border-border bg-card text-card-foreground flex items-center px-4 gap-2">
      <SidebarTrigger className="md:hidden" />
      {children}
    </header>
  )
}
