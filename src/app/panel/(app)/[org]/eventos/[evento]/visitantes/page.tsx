import { redirect } from "next/navigation";

/** The visitantes moved to a tab of the event; old links and bookmarks land there. */
export default async function VisitantesRedirect({
  params,
}: PageProps<"/panel/[org]/eventos/[evento]/visitantes">) {
  const { org, evento } = await params;
  redirect(`/panel/${org}/eventos/${evento}?tab=visitantes`);
}
