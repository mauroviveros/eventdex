import { notFound } from "next/navigation";
import { isDeveloper } from "@/lib/data/organizations";
import { getSessionUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

/** The platform does not exist for anyone but the developer: 404, not 403. */
export default async function PlataformaLayout({
  children,
}: LayoutProps<"/admin/plataforma">) {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user || !(await isDeveloper(supabase, user.id))) notFound();
  return children;
}
