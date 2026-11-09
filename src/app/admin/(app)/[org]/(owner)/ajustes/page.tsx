import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrandPreview } from "@/components/admin/BrandPreview";
import { PageBody, TopBar } from "@/components/admin/TopBar";
import { ActionButton } from "@/components/ui/ActionButton";
import { EVENTDEX_COLOR } from "@/domain/palette";
import {
  removeDomainAction,
  setPrimaryDomainAction,
} from "@/lib/actions/settings";
import { getOrganizationSettings, logoUrl } from "@/lib/data/organizations";
import { requireOrgOwner } from "@/lib/data/viewer";
import { createClient } from "@/lib/supabase/server";
import { AddDomainForm, BrandEditor, LogoForm } from "./SettingsForms";

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
              // The org's zone may be an alias Intl doesn't list.
              timezones={[
                ...new Set([
                  settings.default_timezone,
                  ...Intl.supportedValuesOf("timeZone"),
                ]),
              ].sort()}
              logoForm={<LogoForm ids={ids} hasLogo={logo !== null} />}
            />
          )}
        </section>

        <section aria-labelledby="dominios" className="grid gap-4">
          <h2 id="dominios" className="border-b-2 border-lcd-3 pb-2 text-px-2">
            Dominios
          </h2>
          <div className="grid gap-10 xl:grid-cols-[1fr_28rem] xl:items-start">
            <ul className="grid content-start gap-2">
              {settings.domains.map((domain) => (
                <li
                  key={domain.id}
                  className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-2 border-lcd-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="break-all">{domain.hostname}</p>
                    {domain.is_primary && (
                      <p className="text-sm text-muted-foreground">
                        Principal: acá apuntan los QR que imprimas
                      </p>
                    )}
                  </div>
                  {!support && !domain.is_primary && (
                    <div className="flex flex-wrap gap-2">
                      <ActionButton
                        action={setPrimaryDomainAction}
                        fields={{ org: org.slug, id: domain.id }}
                        label="Hacer principal"
                        ariaLabel={`Hacer principal ${domain.hostname}`}
                        pendingLabel="Cambiando…"
                        confirm={{
                          message: `Los QR que imprimas desde ahora van a apuntar a ${domain.hostname}. Los que ya imprimiste siguen andando mientras no quites el dominio anterior.`,
                          label: "Sí, hacer principal",
                        }}
                      />
                      <ActionButton
                        action={removeDomainAction}
                        fields={{ org: org.slug, id: domain.id }}
                        label="Quitar"
                        ariaLabel={`Quitar ${domain.hostname}`}
                        pendingLabel="Quitando…"
                        confirm={{
                          message: `${domain.hostname} deja de mostrar tu evento, y los QR impresos con ese dominio dejan de andar.`,
                          label: "Sí, quitar",
                        }}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {!support && (
              <section
                aria-labelledby="nuevo-dominio"
                className="panel grid gap-6 p-6"
              >
                <h3 id="nuevo-dominio" className="text-px-2">
                  Sumar un dominio
                </h3>
                <AddDomainForm ids={ids} />
              </section>
            )}
          </div>
        </section>
      </PageBody>
    </>
  );
}
