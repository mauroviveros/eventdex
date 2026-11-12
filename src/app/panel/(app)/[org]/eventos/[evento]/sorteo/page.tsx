import { redirect } from "next/navigation";

/** The raffle is a tab of the event now: keeps old links working. */
export default async function SorteoPage({
  params,
}: PageProps<"/panel/[org]/eventos/[evento]/sorteo">) {
  const { org, evento } = await params;
  redirect(`/panel/${org}/eventos/${evento}?tab=sorteo`);
}
