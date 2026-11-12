import { redirect } from "next/navigation";
import { adminLanding } from "@/lib/admin-landing";
import {
  acceptMyInvitations,
  listMyOrganizations,
} from "@/lib/data/organizations";
import { requireViewer } from "@/lib/data/viewer";
import { createClient } from "@/lib/supabase/server";

/** No screen of its own: accepts pending invitations and sends you to your panel. */
export default async function AdminHome() {
  const viewer = await requireViewer();
  const supabase = await createClient();
  await acceptMyInvitations(supabase);
  const organizations = await listMyOrganizations(supabase, viewer.id);
  redirect(adminLanding({ isDeveloper: viewer.isDeveloper, organizations }));
}
