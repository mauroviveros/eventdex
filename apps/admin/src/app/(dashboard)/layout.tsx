import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { requireMembership } from "@/server/guard";
import { AppSidebar } from "./_components/app-sidebar";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user, membership } = await requireMembership();

  const metadata = user.user_metadata as {
    full_name?: string;
    avatar_url?: string;
  };

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar
          organization={membership.organization}
          user={{
            name: metadata.full_name ?? user.email ?? "Organizador",
            email: user.email ?? "",
            avatar: metadata.avatar_url ?? null,
          }}
        />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
