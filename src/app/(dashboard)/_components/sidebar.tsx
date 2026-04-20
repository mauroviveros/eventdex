import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarSeparator } from "@/components/ui/sidebar";
import AccountMenu from "./accountMenu";
import BrandMenu from "./brandMenu";

export default function DashboardSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <BrandMenu />
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent></SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <AccountMenu />
      </SidebarFooter>
    </Sidebar>
  );
}
