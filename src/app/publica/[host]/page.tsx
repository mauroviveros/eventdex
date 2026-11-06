export default async function PublicaPage({
  params,
}: PageProps<"/publica/[host]">) {
  const { host } = await params;
  return (
    <main>
      <h1>App pública</h1>
      <p>Organización de {decodeURIComponent(host)} (R4).</p>
    </main>
  );
}
