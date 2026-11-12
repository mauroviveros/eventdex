import { redirect } from "next/navigation";

/** The spots moved to a tab of the event; old links and bookmarks land there. */
export default async function EventSpotsRedirect({
  params,
}: PageProps<"/panel/[org]/eventos/[evento]/spots">) {
  const { org, evento } = await params;
  redirect(`/panel/${org}/eventos/${evento}?tab=spots`);
}
