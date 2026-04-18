import { SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export default function Header({
  children,
  className,
  ...props
}: React.ComponentProps<"header"> & Readonly<{
  children?: React.ReactNode
}>) {
  return (
    <header
      className={cn(
        "h-16 border-b border-border bg-card text-card-foreground flex items-center px-4 gap-2",
        className
      )}
      {...props}
    >
      <SidebarTrigger className="md:hidden" />
      {children}
    </header>
  )
}
