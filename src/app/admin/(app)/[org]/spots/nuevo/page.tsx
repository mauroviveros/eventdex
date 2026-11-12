import { redirect } from "next/navigation";

/** The old create page: the catalog's sheet replaced it, and ?nuevo opens it. */
export default async function NuevoSpotPage({
  params,
}: PageProps<"/admin/[org]/spots/nuevo">) {
  redirect(`/${(await params).org}/spots?nuevo`);
}
