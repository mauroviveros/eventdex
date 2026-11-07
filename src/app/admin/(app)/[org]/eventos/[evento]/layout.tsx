import { load } from "./load";

/**
 * Looks the event up before anything streams, so a missing one answers with a
 * real 404 (a page's notFound() inside a loading boundary would answer 200).
 */
export default async function EventoLayout({
  children,
  params,
}: LayoutProps<"/admin/[org]/eventos/[evento]">) {
  const { org, evento } = await params;
  await load(org, evento);
  return children;
}
