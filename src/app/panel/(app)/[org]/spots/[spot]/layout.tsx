import { load } from "./load";

/** Looks the spot up before anything streams, so a missing one answers a real 404. */
export default async function SpotLayout({
  children,
  params,
}: LayoutProps<"/panel/[org]/spots/[spot]">) {
  const { org, spot } = await params;
  await load(org, spot);
  return children;
}
