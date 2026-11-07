import { redirect } from "next/navigation";

/** The events list is the org's dashboard: same filters, one place. */
export default async function EventosPage({
  params,
  searchParams,
}: PageProps<"/admin/[org]/eventos">) {
  const { org } = await params;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") query.set(key, value);
  }
  const qs = query.toString();
  redirect(qs ? `/${org}?${qs}` : `/${org}`);
}
