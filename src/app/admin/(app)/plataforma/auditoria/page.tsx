import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { PageBody, TopBar } from "@/components/admin/TopBar";
import { Button, buttonClass } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/Field";
import { listAllOrganizations } from "@/lib/data/organizations";
import { listAuditLogs } from "@/lib/data/platform";
import { platformMetadata } from "@/lib/data/viewer";
import { AUDIT_AREAS, AUDIT_LABELS, parseAuditFilter } from "@/lib/platform";
import { createClient } from "@/lib/supabase/server";

export function generateMetadata(): Promise<Metadata> {
  return platformMetadata("Auditoría · Plataforma");
}

const WHEN = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "medium",
  timeZone: "America/Argentina/Buenos_Aires",
});

export default async function AuditoriaPage({
  searchParams,
}: PageProps<"/admin/plataforma/auditoria">) {
  const filter = parseAuditFilter(await searchParams);
  const supabase = await createClient();
  const [{ rows, hasMore }, organizations] = await Promise.all([
    listAuditLogs(supabase, filter),
    listAllOrganizations(supabase),
  ]);
  const filtered = Boolean(filter.org || filter.area);

  const pageHref = (pagina: number) => {
    const query = new URLSearchParams({
      ...(filter.org && { org: filter.org }),
      ...(filter.area && { area: filter.area }),
      pagina: String(pagina),
    });
    return `/plataforma/auditoria?${query}`;
  };

  return (
    <>
      <TopBar title="Plataforma" />
      <PageBody>
        <h1 className="text-px-3 sm:text-px-4">Auditoría</h1>

        <Form
          action="/plataforma/auditoria"
          className="flex flex-wrap items-end gap-4"
        >
          <SelectField
            label="Organización"
            name="org"
            defaultValue={filter.org ?? ""}
            className="w-64"
          >
            <option value="">Todas</option>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Área"
            name="area"
            defaultValue={filter.area ?? ""}
            className="w-64"
          >
            <option value="">Todas</option>
            {Object.entries(AUDIT_AREAS).map(([area, label]) => (
              <option key={area} value={area}>
                {label}
              </option>
            ))}
          </SelectField>
          <Button type="submit">Filtrar</Button>
          {filtered && (
            <Link
              href="/plataforma/auditoria"
              className={buttonClass("secondary", "no-underline")}
            >
              Limpiar
            </Link>
          )}
        </Form>

        {rows.length === 0 ? (
          <p className="text-muted-foreground">
            {filtered
              ? "No hay registros con este filtro."
              : "Todavía no hay registros."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-3xl border-collapse text-left">
              <caption className="sr-only">Registro de auditoría</caption>
              <thead>
                <tr className="border-b-2 border-lcd-3 font-display text-px-1">
                  <th scope="col" className="py-2 pr-4 font-normal">
                    Cuándo
                  </th>
                  <th scope="col" className="py-2 pr-4 font-normal">
                    Acción
                  </th>
                  <th scope="col" className="py-2 pr-4 font-normal">
                    Organización
                  </th>
                  <th scope="col" className="py-2 pr-4 font-normal">
                    Quién
                  </th>
                  <th scope="col" className="py-2 font-normal">
                    Detalle
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b-2 border-dashed border-lcd-2 align-top"
                  >
                    <td className="py-3 pr-4 tabular-nums whitespace-nowrap">
                      {WHEN.format(new Date(row.created_at))}
                    </td>
                    <td className="py-3 pr-4">
                      {AUDIT_LABELS[row.action] ?? row.action}
                    </td>
                    <td className="py-3 pr-4">
                      {row.organization ? (
                        <Link
                          href={`/plataforma/organizaciones/${row.organization.slug}`}
                        >
                          {row.organization.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 pr-4">{row.actor?.email ?? "—"}</td>
                    <td className="py-3">
                      {row.diff ? (
                        <details>
                          <summary className="min-h-6 cursor-pointer">
                            Ver
                          </summary>
                          <pre className="mt-2 max-w-md text-sm break-all whitespace-pre-wrap">
                            {JSON.stringify(row.diff, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(filter.pagina > 1 || hasMore) && (
          <nav aria-label="Páginas" className="flex gap-2">
            {filter.pagina > 1 && (
              <Link
                href={pageHref(filter.pagina - 1)}
                className={buttonClass("secondary", "no-underline")}
              >
                Anterior
              </Link>
            )}
            {hasMore && (
              <Link
                href={pageHref(filter.pagina + 1)}
                className={buttonClass("secondary", "no-underline")}
              >
                Siguiente
              </Link>
            )}
          </nav>
        )}
      </PageBody>
    </>
  );
}
