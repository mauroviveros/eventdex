import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { PageBody, TopBar } from "@/components/panel/TopBar";
import { Button, buttonClass } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/Field";
import { listAllOrganizations } from "@/lib/data/organizations";
import { listAuditLogs } from "@/lib/data/platform";
import { platformMetadata, requireDeveloper } from "@/lib/data/viewer";
import { AUDIT_AREAS, AUDIT_LABELS, parseAuditFilter } from "@/lib/platform";
import { createClient } from "@/lib/supabase/server";
import { AuditTable } from "./AuditTable";

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
}: PageProps<"/panel/plataforma/auditoria">) {
  await requireDeveloper();
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
    return `/panel/plataforma/auditoria?${query}`;
  };

  return (
    <>
      <TopBar title="Auditoría" />
      <PageBody>
        <Form
          action="/panel/plataforma/auditoria"
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
              href="/panel/plataforma/auditoria"
              className={buttonClass("secondary", "no-underline")}
            >
              Limpiar
            </Link>
          )}
        </Form>

        {rows.length === 0 ? (
          <p className="text-muted-foreground">
            {filter.pagina > 1
              ? "No hay más registros."
              : filtered
                ? "No hay registros con este filtro."
                : "Todavía no hay registros."}
          </p>
        ) : (
          <AuditTable
            rows={rows.map((row) => ({
              id: String(row.id),
              action: AUDIT_LABELS[row.action] ?? row.action,
              when: WHEN.format(new Date(row.created_at)),
              organization: row.organization,
              actor: row.actor?.email ?? null,
              diff: row.diff ? JSON.stringify(row.diff, null, 2) : null,
            }))}
          />
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
