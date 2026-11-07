import { vi } from "vitest";

/**
 * Test helper. Stand-in for the Supabase client. Every query chain resolves to the next
 * queued result, and records the calls so the test can see what was written.
 */
export function fakeClient(...results: { data: unknown; error: unknown }[]) {
  const calls: { method: string; args: unknown[] }[] = [];
  const chain: Record<string, unknown> = {};
  for (const method of [
    "from",
    "insert",
    "delete",
    "update",
    "select",
    "eq",
    "single",
    "maybeSingle",
  ]) {
    chain[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return chain;
    };
  }
  // biome-ignore lint/suspicious/noThenProperty: the fake must be awaitable like the real query builder.
  chain.then = (resolve: (v: unknown) => void) => resolve(results.shift());
  const rpc = vi.fn(async () => results.shift());
  return { client: { ...chain, rpc } as never, calls, rpc };
}

export const inserted = (calls: { method: string; args: unknown[] }[]) =>
  calls.find((c) => c.method === "insert")?.args[0];
