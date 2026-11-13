import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { PageBody, TopBar } from "@/components/panel/TopBar";
import { Button, buttonClass } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/Field";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/shadcn/table";
import { listAllOrganizations } from "@/lib/data/organizations";
import { listAuditLogs } from "@/lib/data/platform";
import { platformMetadata, requireDeveloper } from "@/lib/data/viewer";
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
          <Table className="min-w-3xl">
            <TableCaption className="sr-only">
              Registro de auditoría
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Cuándo</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Organización</TableHead>
                <TableHead>Quién</TableHead>
                <TableHead>Detalle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="tabular-nums whitespace-nowrap">
                    {WHEN.format(new Date(row.created_at))}
                  </TableCell>
                  <TableCell>
                    {AUDIT_LABELS[row.action] ?? row.action}
                  </TableCell>
                  <TableCell>
                    {row.organization ? (
                      <Link
                        href={`/panel/plataforma/organizaciones/${row.organization.slug}`}
                      >
                        {row.organization.name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{row.actor?.email ?? "—"}</TableCell>
                  <TableCell>
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
