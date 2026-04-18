import { SidebarGroup, SidebarMenuButton } from "@/components/ui/sidebar";
import { Calendar, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default function Menu() {

  const LINKS = [
    {
      label: 'Overview',
      Icon: LayoutDashboard,
      href: '/dashboard'
    },
    {
      label: 'Events',
      Icon: Calendar,
      href: '/dashboard/events'
    }
  ]

  return (
    <SidebarGroup>
      {LINKS.map(({ label, Icon, href }) => (
        <Link href={href} key={href}>
          <SidebarMenuButton>
            <Icon />
            {label}
          </SidebarMenuButton>
        </Link>
      ))}
    </SidebarGroup>
  )
}
