import { SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem, Sidebar as SidebarUI } from "@/components/ui/sidebar";
import Account from "./sidebar/account";
import Brand from "./sidebar/brand";
import Menu from "./sidebar/menu";

export default function Sidebar() {
  return (
    <SidebarUI >
      <SidebarHeader className="h-16 border-b border-border">
        <Brand />
      </SidebarHeader>

      <SidebarContent>
        <Menu />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Account />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </SidebarUI>
  )
}
