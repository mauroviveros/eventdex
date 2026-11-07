import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { isDeveloper } from "@/lib/data/organizations";
import { getSessionUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

/** Signed-in area of the admin. Who sees what is RLS; this only sends strangers to /ingresar. */
export default async function AdminAppLayout({
  children,
}: LayoutProps<"/admin">) {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/ingresar");

  return (
    <div className="min-h-dvh">
      <AdminHeader
        email={user.email}
        isDeveloper={await isDeveloper(supabase, user.id)}
      />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
