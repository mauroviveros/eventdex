import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardSidebar from "./_components/sidebar";
import "@/styles/eventdex.css";

type Props = Readonly<{ children: React.ReactNode }>;
export default function Layout({ children }: Props) {
  return (
    <SidebarProvider>
      <DashboardSidebar />

      <div className="flex-1 flex flex-col h-dvh">
        <header className="p-2 shrink-0 border-b bg-sidebar text-sidebar-foreground">
          <SidebarTrigger />
        </header>

        <main className="flex 1 p-6 overflow-auto">{children}</main>
      </div>
    </SidebarProvider>
  );
}
