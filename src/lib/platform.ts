import { z } from "zod";
import { type ActionResult, failed, invalid } from "@/lib/results";
import type { Supabase } from "@/lib/supabase/server";

/**
 * Developer actions without the framework around them. RLS and the SQL
 * functions check the role; the database writes every audit row.
 */

type Client = Pick<Supabase, "from" | "rpc">;

const NOT_ALLOWED = { code: "42501" };

// es-AR: the comma is the decimal mark and dots only group thousands, so
// "1.50" is rejected instead of being read as either 1,50 or 150.
const AMOUNT = /^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$/;
const MAX_CENTS = 99_999_999_999;

function toCents(amount: string) {
  const [whole = "", decimals = ""] = amount.replaceAll(".", "").split(",");
  return Number(whole) * 100 + Number(decimals.padEnd(2, "0"));
}

export const invoiceSchema = z.object({
  organizationId: z.uuid("Elegí la organización."),
  concept: z
    .string()
    .trim()
    .min(1, "Contá qué se factura.")
    .max(200, "El concepto puede tener hasta 200 caracteres."),
  amount: z
    .string()
    .trim()
    .regex(AMOUNT, "Escribí el monto así: 1.500,50.")
    .transform(toCents)
    .refine((c) => c > 0, "El monto tiene que ser mayor a cero.")
    .refine((c) => c <= MAX_CENTS, "El monto es demasiado grande."),
  currency: z.enum(["ARS", "USD"], "Elegí la moneda."),
  issuedOn: z.iso.date("Poné la fecha de la factura."),
});

export async function createInvoice(
  supabase: Client,
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = invoiceSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const v = parsed.data;
  const { error } = await supabase.from("invoices").insert({
    organization_id: v.organizationId,
    concept: v.concept,
    amount_cents: v.amount,
    currency: v.currency,
    issued_on: v.issuedOn,
  });
  if (error)
    return failed(error, { "23503": "Esa organización ya no existe." });
  return { ok: true, data: null };
}

const invoiceStatusSchema = z.object({
  invoiceId: z.uuid(),
  status: z.enum(["paid", "void"]),
});

export async function setInvoiceStatus(
  supabase: Client,
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = invoiceStatusSchema.safeParse(input);
  if (!parsed.success) return failed(NOT_ALLOWED);

  // Without the select, a row RLS hides would look like a success.
  const { data, error } = await supabase
    .from("invoices")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.invoiceId)
    .select("id")
    .maybeSingle();
  if (error)
    return failed(error, {
      "23514": "Esa factura ya no se puede cambiar: recargá la página.",
    });
  if (!data) return failed(NOT_ALLOWED);
  return { ok: true, data: null };
}

const organizationStatusSchema = z.object({
  organizationId: z.uuid(),
  status: z.enum(["active", "suspended"]),
});

export async function setOrganizationStatus(
  supabase: Client,
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = organizationStatusSchema.safeParse(input);
  if (!parsed.success) return failed(NOT_ALLOWED);

  const { error } = await supabase.rpc("set_organization_status", {
    p_organization_id: parsed.data.organizationId,
    p_status: parsed.data.status,
  });
  if (error) return failed(error, { P0002: "Esa organización ya no existe." });
  return { ok: true, data: null };
}

/** The filter's areas: the part of an audit action before the dot. */
export const AUDIT_AREAS = {
  organization: "Organizaciones",
  domain: "Dominios",
  member: "Miembros",
  invitation: "Invitaciones",
  invoice: "Facturas",
  support: "Soporte",
  event: "Eventos",
  raffle: "Sorteos",
  visitor: "Visitantes",
} as const;

const auditFilterSchema = z.object({
  org: z.uuid().optional().catch(undefined),
  area: z
    .enum(Object.keys(AUDIT_AREAS) as [keyof typeof AUDIT_AREAS])
    .optional()
    .catch(undefined),
  pagina: z.coerce.number().int().min(1).catch(1),
});

export type AuditFilter = z.infer<typeof auditFilterSchema>;

/** The audit filter from the URL. Anything hand-edited falls back to "no filter". */
export function parseAuditFilter(
  params: Record<string, string | string[] | undefined>,
): AuditFilter {
  return auditFilterSchema.parse(params);
}
