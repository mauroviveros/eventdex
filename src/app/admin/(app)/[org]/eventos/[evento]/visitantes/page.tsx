import { redirect } from "next/navigation";

/** The visitantes moved to a tab of the event; old links and bookmarks land there. */
export default async function VisitantesRedirect({
  params,
}: PageProps<"/admin/[org]/eventos/[evento]/visitantes">) {
  const { org, evento } = await params;
  redirect(`/${org}/eventos/${evento}?tab=visitantes`);
}
