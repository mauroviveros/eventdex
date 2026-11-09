import { describe, expect, it } from "vitest";
import { listAuditLogs } from "./data/platform";
import { fakeClient, inserted } from "./fake-supabase";
import {
  createInvoice,
  parseAuditFilter,
  setInvoiceStatus,
  setOrganizationStatus,
} from "./platform";

const ORG = "0000000d-0000-4000-8000-000000000001";
const INVOICE = "0000000d-0000-4000-8000-000000000002";

describe("createInvoice", () => {
  const valid = {
    organizationId: ORG,
    concept: " Expo 2026 ",
    amount: "1.500,50",
    currency: "ARS",
    issuedOn: "2026-11-08",
  };

  it("normalizes the input", async () => {
    const { client, calls } = fakeClient({ data: null, error: null });
    expect(await createInvoice(client, valid)).toEqual({
      ok: true,
      data: null,
    });
    expect(inserted(calls)).toEqual({
      organization_id: ORG,
      concept: "Expo 2026",
      amount_cents: 150050,
      currency: "ARS",
      issued_on: "2026-11-08",
    });
  });

  it.each([
    ["1500", 150000],
    ["1500,5", 150050],
    ["1.000.000", 100000000],
    ["0,07", 7],
    ["19,99", 1999],
  ])("reads %s as %i cents", async (amount, cents) => {
    const { client, calls } = fakeClient({ data: null, error: null });
    await createInvoice(client, { ...valid, amount });
    expect(inserted(calls)).toMatchObject({ amount_cents: cents });
  });

  it.each([
    "1.50",
    "1500.50",
    "1,500.50",
    "1,555",
    "",
    "0",
    "0,00",
    "-5",
    "cien",
    "9999999999999",
  ])("rejects the amount %j before reaching the database", async (amount) => {
    const { client, calls } = fakeClient();
    const result = await createInvoice(client, { ...valid, amount });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors?.amount).toBeDefined();
    expect(calls).toEqual([]);
  });

  it("rejects a currency that does not exist", async () => {
    const { client } = fakeClient();
    const result = await createInvoice(client, { ...valid, currency: "EUR" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors?.currency).toBeDefined();
  });
});

describe("setInvoiceStatus", () => {
  it("updates only the status", async () => {
    const { client, calls } = fakeClient({
      data: { id: INVOICE },
      error: null,
    });
    const input = { invoiceId: INVOICE, status: "paid" };
    expect(await setInvoiceStatus(client, input)).toEqual({
      ok: true,
      data: null,
    });
    expect(calls.find((c) => c.method === "update")?.args[0]).toEqual({
      status: "paid",
    });
  });

  it("does not accept going back to pending", async () => {
    const { client, calls } = fakeClient();
    const input = { invoiceId: INVOICE, status: "pending" };
    expect((await setInvoiceStatus(client, input)).ok).toBe(false);
    expect(calls).toEqual([]);
  });

  it("fails when RLS hides the invoice", async () => {
    const { client } = fakeClient({ data: null, error: null });
    const input = { invoiceId: INVOICE, status: "void" };
    expect(await setInvoiceStatus(client, input)).toEqual({
      ok: false,
      error: "No tenés permiso para hacer esto.",
    });
  });
});

describe("setOrganizationStatus", () => {
  it("calls set_organization_status", async () => {
    const { client, rpc } = fakeClient({ data: null, error: null });
    const input = { organizationId: ORG, status: "suspended" };
    expect(await setOrganizationStatus(client, input)).toEqual({
      ok: true,
      data: null,
    });
    expect(rpc).toHaveBeenCalledWith("set_organization_status", {
      p_organization_id: ORG,
      p_status: "suspended",
    });
  });

  it("says so when the org is gone", async () => {
    const { client } = fakeClient({ data: null, error: { code: "P0002" } });
    const input = { organizationId: ORG, status: "active" };
    expect(await setOrganizationStatus(client, input)).toEqual({
      ok: false,
      error: "Esa organización ya no existe.",
    });
  });
});

describe("parseAuditFilter", () => {
  it("keeps a valid filter", () => {
    expect(
      parseAuditFilter({ org: ORG, area: "invoice", pagina: "3" }),
    ).toEqual({ org: ORG, area: "invoice", pagina: 3 });
  });

  it.each([
    { org: "x", area: "nada", pagina: "-1" },
    { org: [ORG, ORG], area: ["invoice"], pagina: "dos" },
    {},
  ])("falls back to no filter on %j", (params) => {
    expect(parseAuditFilter(params)).toEqual({
      org: undefined,
      area: undefined,
      pagina: 1,
    });
  });
});

describe("listAuditLogs", () => {
  const row = (id: number) => ({ id });

  it("filters by org and area, and pages", async () => {
    const { client, calls } = fakeClient({ data: [row(1)], error: null });
    const result = await listAuditLogs(client, {
      org: ORG,
      area: "invoice",
      pagina: 2,
    });
    expect(result).toEqual({ rows: [row(1)], hasMore: false });
    const args = (method: string) =>
      calls.find((c) => c.method === method)?.args;
    expect(args("eq")).toEqual(["organization_id", ORG]);
    expect(args("like")).toEqual(["action", "invoice.%"]);
    expect(args("range")).toEqual([50, 100]);
  });

  it("does not filter when there is no filter", async () => {
    const { client, calls } = fakeClient({ data: [], error: null });
    await listAuditLogs(client, { pagina: 1 } as never);
    expect(calls.some((c) => ["eq", "like"].includes(c.method))).toBe(false);
  });

  it("detects the next page from the extra row", async () => {
    const data = Array.from({ length: 51 }, (_, i) => row(i));
    const { client } = fakeClient({ data, error: null });
    const result = await listAuditLogs(client, { pagina: 1 } as never);
    expect(result.rows).toHaveLength(50);
    expect(result.hasMore).toBe(true);
  });
});
