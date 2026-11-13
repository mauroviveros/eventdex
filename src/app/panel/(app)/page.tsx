import { redirect } from "next/navigation";
import {
  acceptMyInvitations,
  listMyOrganizations,
} from "@/lib/data/organizations";
import { requireViewer } from "@/lib/data/viewer";
import { panelLanding } from "@/lib/panel-landing";
import { createClient } from "@/lib/supabase/server";

/** No screen of its own: accepts pending invitations and sends you to your panel. */
export default async function AdminHome() {
  const viewer = await requireViewer();
  const supabase = await createClient();
  await acceptMyInvitations(supabase);
  const organizations = await listMyOrganizations(supabase, viewer.id);
  redirect(panelLanding({ isDeveloper: viewer.isDeveloper, organizations }));
}
