import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrandPreview } from "@/components/admin/BrandPreview";
import { PageBody, TopBar } from "@/components/admin/TopBar";
import { timeZoneOptions } from "@/domain/events";
import { EVENTDEX_COLOR } from "@/domain/palette";
import { CONTACT_EMAIL } from "@/lib/contact";
import { getOrganizationSettings, logoUrl } from "@/lib/data/organizations";
import { requireOrgOwner } from "@/lib/data/viewer";
import { createClient } from "@/lib/supabase/server";
import { BrandEditor } from "./SettingsForms";

export async function generateMetadata({
  params,
}: PageProps<"/admin/[org]/ajustes">): Promise<Metadata> {
  const { org } = await requireOrgOwner((await params).org);
  return { title: `Ajustes · ${org.name}` };
}

/** The org's name, brand and domains. In support mode, only to read. */
export default async function AjustesPage({
  params,
}: PageProps<"/admin/[org]/ajustes">) {
  const { org, support } = await requireOrgOwner((await params).org);
  const settings = await getOrganizationSettings(await createClient(), org.id);
  if (!settings) notFound();
  const logo = settings.logo_path ? logoUrl(settings.logo_path) : null;
  const color = settings.brand_color ?? EVENTDEX_COLOR;
  const ids = { org: org.slug, organizationId: org.id };

  return (
    <>
      <TopBar title="Ajustes" />
      <PageBody>
        <h1 className="text-px-3 sm:text-px-4">Ajustes</h1>

        <section aria-labelledby="marca" className="grid gap-4">
          <h2 id="marca" className="border-b-2 border-lcd-3 pb-2 text-px-2">
            Marca
          </h2>
          {support ? (
            <BrandPreview color={color} name={settings.name} logo={logo} />
          ) : (
            <BrandEditor
              ids={ids}
              settings={{
                name: settings.name,
                color,
                timezone: settings.default_timezone,
              }}
              logo={logo}
              timezones={timeZoneOptions(settings.default_timezone)}
            />
          )}
        </section>

        <section aria-labelledby="dominios" className="grid gap-4">
          <h2 id="dominios" className="border-b-2 border-lcd-3 pb-2 text-px-2">
            Dominios
          </h2>
          <ul className="grid max-w-3xl gap-2">
            {settings.domains.map((domain) => (
              <li key={domain.id} className="border-2 border-lcd-3 px-4 py-3">
                <p className="break-all">{domain.hostname}</p>
                {domain.is_primary && (
                  <p className="text-sm text-muted-foreground">
                    Principal: acá apuntan los QR que imprimas
                  </p>
                )}
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground">
            Para sumar o cambiar un dominio, escribinos a{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        </section>
      </PageBody>
    </>
  );
}
